"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BitcoinClient = void 0;
const config_1 = require("../config");
const undici_1 = require("undici");
class BitcoinClient {
    constructor(baseUrl = config_1.config.BITCOIN_API_URL) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
    }
    async getNativeBalance(address) {
        const url = `${this.baseUrl}/address/${address}`;
        const { body, statusCode } = await (0, undici_1.request)(url);
        if (statusCode !== 200) {
            throw new Error(`Bitcoin API error: ${statusCode}`);
        }
        const json = (await body.json());
        const funded = BigInt(json.chain_stats.funded_txo_sum);
        const spent = BigInt(json.chain_stats.spent_txo_sum);
        const balance = funded - spent;
        return { balance: balance, raw: json };
    }
    // Bitcoin has no generic token standard; we only support native BTC here.
    async getTokenBalance(_holder, _tokenAddress) {
        throw new Error("Token balances are not supported on BitcoinClient");
    }
}
exports.BitcoinClient = BitcoinClient;
//# sourceMappingURL=bitcoinClient.js.map