import { PrismaClient } from "@prisma/client";
import { chainRegistry } from "../chains";
import { computeStatus, StatusContext } from "./status";
import { EvmChainClient } from "../chains/evmClient";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export class MonitoringService {
  private prisma: PrismaClient;
  private statusContext: StatusContext;

  constructor(prisma: PrismaClient, statusContext: StatusContext) {
    this.prisma = prisma;
    this.statusContext = statusContext;
  }

  private pow10(exp: number): bigint {
    // exp is guaranteed to be >= 0 because we always use (maxDecimals - currentDecimals)
    return 10n ** BigInt(exp);
  }

  /**
   * Lightweight retry helper for external RPC / HTTP calls.
   * Prevents transient failures (e.g. provider hiccups) from causing data loss for a cycle.
   */
  private async withRetries<T>(
    fn: () => Promise<T>,
    label: string,
    maxAttempts = 3,
    delayMs = 500
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        logger.warn(
          { attempt, maxAttempts, label },
          `${label} failed: ${message}`
        );
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error(`[MonitoringService] ${label} failed after ${maxAttempts} attempts`);
  }

  async runOnce(): Promise<void> {
    logger.info("Starting monitoring cycle");
    
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

    logger.info({ count: bridgeAssets.length }, "Found bridge assets to monitor");

    for (const ba of bridgeAssets) {
      try {
        logger.info({ bridgeAssetId: ba.id, source: ba.sourceAsset.symbol, dest: ba.destAsset.symbol }, "Processing bridge asset");
        
        const sourceClient = chainRegistry.getClient(ba.bridge.sourceChain.slug);
        const destClient = chainRegistry.getClient(ba.bridge.destChain.slug);

        let lockAddress = ba.lockAddress;
        let lockedBalance: bigint;
        let mintedBalance: bigint;

        const isPowPeg = 
          ba.bridgeContractAddress?.toLowerCase() === "0x0000000000000000000000000000000001000006" &&
          ba.bridge.sourceChain.type === "BITCOIN";

        if (isPowPeg) {
          logger.info("Detected PowPeg bridge");

          if (destClient instanceof EvmChainClient) {
            try {
              lockAddress = await this.withRetries(
                () => destClient.getFederationAddress(ba.bridgeContractAddress!),
                "PowPeg getFederationAddress"
              );
              logger.info({ address: lockAddress }, "PowPeg Bitcoin address");
              
              // Update lockAddress in DB for caching
              if (lockAddress && lockAddress !== ba.lockAddress) {
                await this.prisma.bridgeAsset.update({
                  where: { id: ba.id },
                  data: { lockAddress },
                });
                logger.info("Updated cached lock address");
              }
            } catch (err: any) {
              logger.warn({ error: err.message }, "Failed to get PowPeg address");
              if (!ba.lockAddress) {
                logger.warn("No cached address, skipping");
                continue;
              }
              lockAddress = ba.lockAddress;
            }
          }

          if (!lockAddress) {
            logger.warn("No lock address available, skipping");
            continue;
          }
          
          lockedBalance = (
            await this.withRetries(
              () => sourceClient.getNativeBalance(lockAddress!),
              "PowPeg BTC getNativeBalance"
            )
          ).balance;
          logger.info({ btc: Number(lockedBalance) / 1e8 }, "Locked BTC");

          mintedBalance = 0n;
          logger.warn("RBTC is native - circulating supply not available on-chain");
          logger.warn("Use external API (CoinGecko/DefiLlama) for accurate comparison");
        }
        else if (ba.bridgeContractAddress && ba.bridge.sourceChain.type === "BITCOIN") {
          logger.info("Non-PowPeg Bitcoin bridge detected");
          
          if (destClient instanceof EvmChainClient) {
            try {
              lockAddress = await this.withRetries(
                () => destClient.getFederationAddress(ba.bridgeContractAddress!),
                "Bitcoin bridge getFederationAddress"
              );
              if (lockAddress && lockAddress !== ba.lockAddress) {
                await this.prisma.bridgeAsset.update({
                  where: { id: ba.id },
                  data: { lockAddress },
                });
              }
            } catch (err: any) {
              logger.warn({ error: err.message }, "Dynamic lookup failed");
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
            lockedBalance = (
              await this.withRetries(
                () => sourceClient.getNativeBalance(lockAddress!),
                "Bitcoin bridge getNativeBalance"
              )
            ).balance;
          } else {
            continue;
          }

          if (ba.mintContractAddress && destClient instanceof EvmChainClient) {
            mintedBalance = (
              await this.withRetries(
                () => destClient.getTokenTotalSupply(ba.mintContractAddress!),
                "Bitcoin bridge getTokenTotalSupply"
              )
            ).balance;
          } else {
            mintedBalance = 0n;
          }
        }
        else if (ba.lockContractAddress && ba.sourceAsset.contractAddress) {
          logger.info("Token bridge (ERC-20)");
          
          lockedBalance = (
            await this.withRetries(
              () =>
                sourceClient.getTokenBalance(
                  ba.lockContractAddress!,
                  ba.sourceAsset.contractAddress!
                ),
              "Token bridge getTokenBalance (locked)"
            )
          ).balance;
          logger.info({ tokens: Number(lockedBalance) / 10**ba.sourceAsset.decimals }, "Locked tokens");

          // Minted balance on destination chain
          if (ba.mintContractAddress && destClient instanceof EvmChainClient) {
            const result = await this.withRetries(
              () => destClient.getTokenTotalSupply(ba.mintContractAddress!),
              "Token bridge getTokenTotalSupply (minted)"
            );
            mintedBalance = result.balance;
            
            if (mintedBalance === 0n) {
              const tokenInfo = await destClient.verifyTokenContract(ba.mintContractAddress);
              if (tokenInfo) {
                mintedBalance = tokenInfo.totalSupply;
              }
            }
            
            logger.info({ tokens: Number(mintedBalance) / 10**ba.destAsset.decimals }, "Minted tokens");
          } else {
            mintedBalance = 0n;
            logger.info("No mint contract address, using 0");
          }
        } else {
          logger.warn("No valid configuration for this bridge asset, skipping");
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
              status: "unknown" as const,
              deltaAbs: 0n,
              deltaRatio: 0,
              deltaPercent: 0,
            }
          : computeStatus(lockedNormalized, mintedNormalized, this.statusContext);

        const { status, deltaPercent } = statusResult;

        logger.info({ status: status.toUpperCase(), discrepancy: deltaPercent.toFixed(2) }, "Status");

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
        const statusWorsened = 
          (previousStatus === "green" && (status === "yellow" || status === "red")) ||
          (previousStatus === "yellow" && status === "red");
        
        const shouldCreateAnomaly =
          !isPowPegWithZeroMinted && // Skip PowPeg with 0 minted
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
            logger.info({ count }, "Resolved open anomalies for bridge asset");
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
          logger.warn({ message }, "Anomaly created");
        } else if (isPowPegWithZeroMinted) {
          logger.info("Skipping anomaly for PowPeg (RBTC native currency - minted balance unavailable)");
        } else if (status !== "green") {
          logger.info({ status }, "Status unchanged, no new anomaly created");
        }
      } catch (error: any) {
        const name = error instanceof Error ? error.name : "UnknownError";
        logger.error({ bridgeAssetId: ba.id, source: ba.sourceAsset.symbol, dest: ba.destAsset.symbol, error: name }, "Error processing bridge asset");
      }
    }

    logger.info("Monitoring cycle complete");
  }
}
