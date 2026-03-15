"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmChainClient = void 0;
const ethers_1 = require("ethers");
const powpeg_json_1 = __importDefault(require("../abis/powpeg.json"));
const erc20Abi = [
    "function balanceOf(address account) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
];
class EvmChainClient {
    constructor(rpcUrl) {
        this.provider = new ethers_1.JsonRpcProvider(rpcUrl);
    }
    normalizeAddress(address) {
        return (0, ethers_1.getAddress)(address.toLowerCase());
    }
    async getNativeBalance(address) {
        const balance = await this.provider.getBalance(address);
        return { balance: BigInt(balance.toString()), raw: balance };
    }
    async getTokenBalance(holder, tokenAddress) {
        // Normalize addresses to checksummed format
        const normalizedToken = this.normalizeAddress(tokenAddress);
        const normalizedHolder = this.normalizeAddress(holder);
        const contract = new ethers_1.Contract(normalizedToken, erc20Abi, this.provider);
        const balance = await contract.balanceOf(normalizedHolder);
        return { balance: BigInt(balance.toString()), raw: balance };
    }
    async getTokenTotalSupply(tokenAddress) {
        const normalizedToken = this.normalizeAddress(tokenAddress);
        const contract = new ethers_1.Contract(normalizedToken, erc20Abi, this.provider);
        const supply = await contract.totalSupply();
        return { balance: BigInt(supply.toString()), raw: supply };
    }
    async getTokenDecimals(tokenAddress) {
        const normalizedToken = this.normalizeAddress(tokenAddress);
        const contract = new ethers_1.Contract(normalizedToken, erc20Abi, this.provider);
        const decimals = await contract.decimals();
        return Number(decimals);
    }
    async getTokenSymbol(tokenAddress) {
        const normalizedToken = this.normalizeAddress(tokenAddress);
        const contract = new ethers_1.Contract(normalizedToken, erc20Abi, this.provider);
        const symbol = await contract.symbol();
        return symbol;
    }
    async verifyTokenContract(tokenAddress) {
        const normalizedToken = this.normalizeAddress(tokenAddress);
        const contract = new ethers_1.Contract(normalizedToken, erc20Abi, this.provider);
        const [decimals, symbol, totalSupply] = await Promise.all([
            contract.decimals(),
            contract.symbol(),
            contract.totalSupply(),
        ]);
        return {
            decimals: Number(decimals),
            symbol: symbol,
            totalSupply: BigInt(totalSupply.toString()),
        };
    }
    /**
     * Call a contract method and return the result.
     * Useful for calling getFederationAddress() on bridge contracts.
     */
    async callContractMethod(contractAddress, abi, methodName, params = []) {
        const normalizedAddress = this.normalizeAddress(contractAddress);
        const contract = new ethers_1.Contract(normalizedAddress, abi, this.provider);
        const fn = contract[methodName];
        if (typeof fn !== "function") {
            throw new Error(`Method ${methodName} not found on contract ${normalizedAddress}`);
        }
        const result = await fn(...params);
        return result;
    }
    /**
     * Get the federation Bitcoin address from PowPeg precompiled contract.
     * This address is dynamic and changes on federation updates.
     *
     * Two different bridges on Rootstock:
     * 1. PowPeg (BTC ↔ RBTC) - Precompiled at 0x0000000000000000000000000000000001000006
     *    - Has getFederationAddress() -> returns Bitcoin address (string)
     * 2. Token Bridge (ERC20) - At 0x9D11937e2179dC5270Aa86A3f8143232d6Da0E69
     *    - Has getFederation() -> returns Federation contract address (address)
     */
    async getFederationAddress(bridgeContractAddress) {
        try {
            const normalizedBridge = this.normalizeAddress(bridgeContractAddress);
            const POWPEG_ADDRESS = "0x0000000000000000000000000000000001000006";
            // Check if this is PowPeg precompiled contract
            if (normalizedBridge.toLowerCase() === POWPEG_ADDRESS.toLowerCase()) {
                // PowPeg: Call getFederationAddress() directly - returns Bitcoin address
                const powpegContract = new ethers_1.Contract(POWPEG_ADDRESS, powpeg_json_1.default, this.provider);
                const bitcoinAddress = await powpegContract.getFederationAddress();
                console.log(`[EvmChainClient] PowPeg Bitcoin address: ${bitcoinAddress}`);
                return bitcoinAddress;
            }
            else {
                // Token Bridge: Get Federation contract address first
                const federationAbi = ["function getFederation() view returns (address)"];
                const bridgeContract = new ethers_1.Contract(normalizedBridge, federationAbi, this.provider);
                const federationContractAddress = await bridgeContract.getFederation();
                console.log(`[EvmChainClient] Token Bridge Federation address: ${federationContractAddress}`);
                return federationContractAddress;
            }
        }
        catch (err) {
            throw new Error(`getFederationAddress() failed: ${err.message}`);
        }
    }
}
exports.EvmChainClient = EvmChainClient;
//# sourceMappingURL=evmClient.js.map