import { ChainClient, BalanceResult } from "./types";
export declare class BitcoinClient implements ChainClient {
    private baseUrl;
    constructor(baseUrl?: string);
    getNativeBalance(address: string): Promise<BalanceResult>;
    getTokenBalance(_holder: string, _tokenAddress: string, _decimals: number): Promise<BalanceResult>;
}
//# sourceMappingURL=bitcoinClient.d.ts.map