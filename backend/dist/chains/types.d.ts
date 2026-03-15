export type Bigish = bigint;
export interface BalanceResult {
    balance: Bigish;
    raw: unknown;
}
export interface ChainClient {
    getNativeBalance(address: string): Promise<BalanceResult>;
    getTokenBalance(holder: string, tokenAddress: string): Promise<BalanceResult>;
}
export interface EvmChainClientExtended extends ChainClient {
    getTokenTotalSupply?(tokenAddress: string): Promise<BalanceResult>;
}
//# sourceMappingURL=types.d.ts.map