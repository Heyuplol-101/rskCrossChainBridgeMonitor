import { EvmChainClient } from "./evmClient";
import { BitcoinClient } from "./bitcoinClient";
import { ChainClient } from "./types";
import { config } from "../config";

type ChainSlug = "bitcoin" | "rootstock" | "ethereum";

class ChainRegistry {
  private clients: Map<ChainSlug, ChainClient>;

  constructor() {
    this.clients = new Map();

    this.clients.set("bitcoin", new BitcoinClient(config.BITCOIN_API_URL));
    this.clients.set("rootstock", new EvmChainClient(config.ROOTSTOCK_RPC_URL));
    this.clients.set("ethereum", new EvmChainClient(config.ETHEREUM_RPC_URL));
  }

  getClient(slug: string): ChainClient {
    const client = this.clients.get(slug as ChainSlug);
    if (!client) {
      throw new Error(`No chain client registered for slug: ${slug}`);
    }
    return client;
  }
}

export const chainRegistry = new ChainRegistry();


