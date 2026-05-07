import { ChainClient, BalanceResult, Bigish } from "./types";
import { config } from "../config";
import { request } from "undici";

interface MempoolAddressResponse {
  chain_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
}

export class BitcoinClient implements ChainClient {
  private baseUrl: string;

  constructor(baseUrl: string = config.BITCOIN_API_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async getNativeBalance(address: string): Promise<BalanceResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.RPC_TIMEOUT_MS);

    try {
      const url = `${this.baseUrl}/address/${address}`;
      const { body, statusCode } = await request(url, { signal: controller.signal });

      if (statusCode !== 200) {
        throw new Error(`Bitcoin API error: ${statusCode}`);
      }

      const json = (await body.json()) as MempoolAddressResponse;
      const funded = BigInt(json.chain_stats.funded_txo_sum);
      const spent = BigInt(json.chain_stats.spent_txo_sum);
      const balance = funded - spent;

      return { balance: balance as Bigish, raw: json };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Bitcoin has no generic token standard; we only support native BTC here.
  async getTokenBalance(_holder: string, _tokenAddress: string): Promise<BalanceResult> {
    throw new Error("Token balances are not supported on BitcoinClient");
  }
}


