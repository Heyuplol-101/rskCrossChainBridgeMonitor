"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const chains_1 = require("../chains");
const status_1 = require("./status");
const evmClient_1 = require("../chains/evmClient");
class MonitoringService {
    constructor(prisma, statusContext) {
        this.prisma = prisma;
        this.statusContext = statusContext;
    }
    pow10(exp) {
        // exp is guaranteed to be >= 0 because we always use (maxDecimals - currentDecimals)
        return 10n ** BigInt(exp);
    }
    /**
     * Lightweight retry helper for external RPC / HTTP calls.
     * Prevents transient failures (e.g. provider hiccups) from causing data loss for a cycle.
     */
    async withRetries(fn, label, maxAttempts = 3, delayMs = 500) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                return await fn();
            }
            catch (err) {
                lastError = err;
                const message = err instanceof Error ? err.message : String(err);
                console.warn(`[MonitoringService] ${label} failed (attempt ${attempt}/${maxAttempts}): ${message}`);
                if (attempt < maxAttempts) {
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                }
            }
        }
        throw lastError instanceof Error
            ? lastError
            : new Error(`[MonitoringService] ${label} failed after ${maxAttempts} attempts`);
    }
    async runOnce() {
        console.log("\n[MonitoringService] Starting monitoring cycle...");
        const bridgeAssets = await this.prisma.bridgeAsset.findMany({
            include: {
                bridge: {
                    include: {
                        sourceChain: true,
                        destChain: true,
                    },
                },
                sourceAsset: true,
                destAsset: true,
            },
        });
        console.log(`[MonitoringService] Found ${bridgeAssets.length} bridge assets to monitor`);
        for (const ba of bridgeAssets) {
            try {
                console.log(`\n[MonitoringService] Processing bridge asset #${ba.id}: ${ba.sourceAsset.symbol} → ${ba.destAsset.symbol}`);
                const sourceClient = chains_1.chainRegistry.getClient(ba.bridge.sourceChain.slug);
                const destClient = chains_1.chainRegistry.getClient(ba.bridge.destChain.slug);
                let lockAddress = ba.lockAddress;
                let lockedBalance;
                let mintedBalance;
                const isPowPeg = ba.bridgeContractAddress?.toLowerCase() === "0x0000000000000000000000000000000001000006" &&
                    ba.bridge.sourceChain.type === "BITCOIN";
                if (isPowPeg) {
                    console.log("[MonitoringService] Detected PowPeg bridge");
                    if (destClient instanceof evmClient_1.EvmChainClient) {
                        try {
                            lockAddress = await this.withRetries(() => destClient.getFederationAddress(ba.bridgeContractAddress), "PowPeg getFederationAddress");
                            console.log(`[MonitoringService] PowPeg Bitcoin address: ${lockAddress}`);
                            // Update lockAddress in DB for caching
                            if (lockAddress && lockAddress !== ba.lockAddress) {
                                await this.prisma.bridgeAsset.update({
                                    where: { id: ba.id },
                                    data: { lockAddress },
                                });
                                console.log(`[MonitoringService] Updated cached lock address`);
                            }
                        }
                        catch (err) {
                            console.warn(`[MonitoringService] Failed to get PowPeg address: ${err.message}`);
                            if (!ba.lockAddress) {
                                console.warn(`[MonitoringService] No cached address, skipping`);
                                continue;
                            }
                            lockAddress = ba.lockAddress;
                        }
                    }
                    if (!lockAddress) {
                        console.warn(`[MonitoringService] No lock address available, skipping`);
                        continue;
                    }
                    lockedBalance = (await this.withRetries(() => sourceClient.getNativeBalance(lockAddress), "PowPeg BTC getNativeBalance")).balance;
                    console.log(`[MonitoringService] Locked BTC: ${Number(lockedBalance) / 1e8} BTC`);
                    mintedBalance = 0n;
                    console.warn(`[MonitoringService] RBTC is native - circulating supply not available on-chain`);
                    console.warn(`[MonitoringService] Use external API (CoinGecko/DefiLlama) for accurate comparison`);
                }
                else if (ba.bridgeContractAddress && ba.bridge.sourceChain.type === "BITCOIN") {
                    console.log("[MonitoringService] Non-PowPeg Bitcoin bridge detected");
                    if (destClient instanceof evmClient_1.EvmChainClient) {
                        try {
                            lockAddress = await this.withRetries(() => destClient.getFederationAddress(ba.bridgeContractAddress), "Bitcoin bridge getFederationAddress");
                            if (lockAddress && lockAddress !== ba.lockAddress) {
                                await this.prisma.bridgeAsset.update({
                                    where: { id: ba.id },
                                    data: { lockAddress },
                                });
                            }
                        }
                        catch (err) {
                            console.warn(`[MonitoringService] Dynamic lookup failed: ${err.message}`);
                            if (!ba.lockAddress) {
                                continue;
                            }
                            lockAddress = ba.lockAddress;
                        }
                    }
                    if (!lockAddress && !ba.lockContractAddress) {
                        continue;
                    }
                    if (lockAddress) {
                        lockedBalance = (await this.withRetries(() => sourceClient.getNativeBalance(lockAddress), "Bitcoin bridge getNativeBalance")).balance;
                    }
                    else {
                        continue;
                    }
                    if (ba.mintContractAddress && destClient instanceof evmClient_1.EvmChainClient) {
                        mintedBalance = (await this.withRetries(() => destClient.getTokenTotalSupply(ba.mintContractAddress), "Bitcoin bridge getTokenTotalSupply")).balance;
                    }
                    else {
                        mintedBalance = 0n;
                    }
                }
                else if (ba.lockContractAddress && ba.sourceAsset.contractAddress) {
                    console.log("[MonitoringService] Token bridge (ERC-20)");
                    lockedBalance = (await this.withRetries(() => sourceClient.getTokenBalance(ba.lockContractAddress, ba.sourceAsset.contractAddress, ba.sourceAsset.decimals), "Token bridge getTokenBalance (locked)")).balance;
                    console.log(`[MonitoringService] Locked tokens: ${Number(lockedBalance) / 10 ** ba.sourceAsset.decimals}`);
                    // Minted balance on destination chain
                    if (ba.mintContractAddress && destClient instanceof evmClient_1.EvmChainClient) {
                        const result = await this.withRetries(() => destClient.getTokenTotalSupply(ba.mintContractAddress), "Token bridge getTokenTotalSupply (minted)");
                        mintedBalance = result.balance;
                        if (mintedBalance === 0n && result.raw === null) {
                            // totalSupply() failed - try to verify the token contract
                            console.warn(`[MonitoringService] totalSupply() returned 0 or failed for ${ba.mintContractAddress}`);
                            const tokenInfo = await destClient.verifyTokenContract(ba.mintContractAddress);
                            if (tokenInfo) {
                                console.log(`[MonitoringService] Token verified: ${tokenInfo.symbol} with ${tokenInfo.decimals} decimals`);
                                mintedBalance = tokenInfo.totalSupply;
                            }
                            else {
                                console.warn(`[MonitoringService] Token contract verification failed - may not be deployed or non-standard ERC-20`);
                            }
                        }
                        console.log(`[MonitoringService] Minted tokens: ${Number(mintedBalance) / 10 ** ba.destAsset.decimals}`);
                    }
                    else {
                        mintedBalance = 0n;
                        console.warn(`[MonitoringService] No mint contract address, using 0`);
                    }
                }
                else {
                    console.warn(`[MonitoringService] No valid configuration for this bridge asset, skipping`);
                    continue;
                }
                const sourceDecimals = ba.sourceAsset.decimals;
                const destDecimals = ba.destAsset.decimals;
                const targetDecimals = Math.max(sourceDecimals, destDecimals);
                const lockedNormalized = lockedBalance * this.pow10(targetDecimals - sourceDecimals);
                const mintedNormalized = mintedBalance * this.pow10(targetDecimals - destDecimals);
                // Compute delta
                const delta = lockedNormalized - mintedNormalized;
                // Compute status
                const previousSnapshot = await this.prisma.bridgeAssetSnapshot.findFirst({
                    where: { bridgeAssetId: ba.id },
                    orderBy: { createdAt: "desc" },
                });
                const isPowPegWithZeroMinted = isPowPeg && mintedBalance === 0n;
                // For PowPeg we cannot derive a true solvency status because RBTC supply is not on-chain.
                // Mark status as "unknown" instead of misleading "green".
                const statusResult = isPowPegWithZeroMinted
                    ? {
                        status: "unknown",
                        deltaAbs: 0n,
                        deltaRatio: 0,
                        deltaPercent: 0,
                    }
                    : (0, status_1.computeStatus)(lockedNormalized, mintedNormalized, this.statusContext);
                const { status, deltaPercent } = statusResult;
                console.log(`[MonitoringService] Status: ${status.toUpperCase()} (${deltaPercent.toFixed(2)}% discrepancy)`);
                // Create snapshot
                await this.prisma.bridgeAssetSnapshot.create({
                    data: {
                        bridgeAssetId: ba.id,
                        lockedBalance: lockedBalance.toString(),
                        mintedBalance: mintedBalance.toString(),
                        delta: delta.toString(),
                        status,
                    },
                });
                // Production-grade anomaly detection:
                // - Skip for PowPeg with 0 minted (expected - RBTC is native)
                // - Only create anomaly on STATUS CHANGE (not every cycle)
                // - Prevents flooding the anomaly table with duplicate alerts
                const previousStatus = previousSnapshot?.status ?? "green";
                const statusChanged = previousStatus !== status;
                const statusWorsened = (previousStatus === "green" && (status === "yellow" || status === "red")) ||
                    (previousStatus === "yellow" && status === "red");
                const shouldCreateAnomaly = !isPowPegWithZeroMinted && // Skip PowPeg with 0 minted
                    statusChanged && // Only on status change
                    statusWorsened; // Only when status gets worse
                if (status === "green") {
                    // Automatically resolve any open anomalies when the bridge returns to healthy status
                    const { count } = await this.prisma.anomaly.updateMany({
                        where: {
                            bridgeAssetId: ba.id,
                            resolvedAt: null,
                        },
                        data: {
                            resolvedAt: new Date(),
                        },
                    });
                    if (count > 0) {
                        console.log(`[MonitoringService] ✅ Resolved ${count} open anomalies for bridge asset #${ba.id} (status back to GREEN)`);
                    }
                }
                if (shouldCreateAnomaly) {
                    const severity = status === "red" ? "critical" : "warning";
                    const message = status === "red"
                        ? `Bridge health degraded to CRITICAL: ${deltaPercent.toFixed(2)}% discrepancy detected`
                        : `Bridge health degraded to WARNING: ${deltaPercent.toFixed(2)}% discrepancy detected`;
                    await this.prisma.anomaly.create({
                        data: {
                            bridgeAssetId: ba.id,
                            type: "mismatch",
                            severity,
                            details: JSON.stringify({
                                message,
                                locked: lockedBalance.toString(),
                                minted: mintedBalance.toString(),
                                delta: delta.toString(),
                                deltaPercent: deltaPercent.toFixed(2),
                                previousStatus,
                                newStatus: status,
                            }),
                        },
                    });
                    console.log(`[MonitoringService] 🚨 Anomaly created: ${message}`);
                }
                else if (isPowPegWithZeroMinted) {
                    console.log(`[MonitoringService] Skipping anomaly for PowPeg (RBTC native currency - minted balance unavailable)`);
                }
                else if (status !== "green") {
                    console.log(`[MonitoringService] Status unchanged (${status}), no new anomaly created`);
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                console.error(`[MonitoringService] Error processing bridge asset #${ba.id} (${ba.sourceAsset.symbol} → ${ba.destAsset.symbol})`);
                console.error("[MonitoringService] Error details:", message);
                // Continue with next bridge asset instead of crashing
            }
        }
        console.log("[MonitoringService] Monitoring cycle complete\n");
    }
}
exports.MonitoringService = MonitoringService;
//# sourceMappingURL=monitoringService.js.map