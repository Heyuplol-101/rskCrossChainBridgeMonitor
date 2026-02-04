import { ChainClient, BalanceResult } from "./types";
export declare class EvmChainClient implements ChainClient {
    private provider;
    constructor(rpcUrl: string);
    private normalizeAddress;
    getNativeBalance(address: string): Promise<BalanceResult>;
    getTokenBalance(holder: string, tokenAddress: string, _decimals: number): Promise<BalanceResult>;
    getTokenTotalSupply(tokenAddress: string): Promise<BalanceResult>;
    getTokenDecimals(tokenAddress: string): Promise<number>;
    getTokenSymbol(tokenAddress: string): Promise<string | null>;
    verifyTokenContract(tokenAddress: string): Promise<{
        decimals: number;
        symbol: string;
        totalSupply: bigint;
    } | null>;
    /**
     * Call a contract method and return the result.
     * Useful for calling getFederationAddress() on bridge contracts.
     */
    callContractMethod<T = string>(contractAddress: string, abi: string[], methodName: string, params?: unknown[]): Promise<T>;
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
    getFederationAddress(bridgeContractAddress: string): Promise<string>;
}
//# sourceMappingURL=evmClient.d.ts.map