export type Bigish = bigint;

export interface BalanceResult {
  balance: Bigish;
  raw: unknown;
}

export interface ChainClient {
  getNativeBalance(address: string): Promise<BalanceResult>;
  getTokenBalance(holder: string, tokenAddress: string): Promise<BalanceResult>;
}

// Optional method for EVM chains to get token total supply
export interface EvmChainClientExtended extends ChainClient {
  getTokenTotalSupply?(tokenAddress: string): Promise<BalanceResult>;
}


