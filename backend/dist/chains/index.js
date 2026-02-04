"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainRegistry = void 0;
const evmClient_1 = require("./evmClient");
const bitcoinClient_1 = require("./bitcoinClient");
const config_1 = require("../config");
class ChainRegistry {
    constructor() {
        this.clients = new Map();
        this.clients.set("bitcoin", new bitcoinClient_1.BitcoinClient(config_1.config.BITCOIN_API_URL));
        this.clients.set("rootstock", new evmClient_1.EvmChainClient(config_1.config.ROOTSTOCK_RPC_URL));
        this.clients.set("ethereum", new evmClient_1.EvmChainClient(config_1.config.ETHEREUM_RPC_URL));
    }
    getClient(slug) {
        const client = this.clients.get(slug);
        if (!client) {
            throw new Error(`No chain client registered for slug: ${slug}`);
        }
        return client;
    }
}
exports.chainRegistry = new ChainRegistry();
//# sourceMappingURL=index.js.map