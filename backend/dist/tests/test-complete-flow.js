"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const dotenv = __importStar(require("dotenv"));
const powpeg_json_1 = __importDefault(require("../abis/powpeg.json"));
const undici_1 = require("undici");
dotenv.config();
const POWPEG_ADDRESS = "0x0000000000000000000000000000000001000006";
const ROOTSTOCK_RPC_URL = process.env.ROOTSTOCK_RPC_URL || "https://public-node.rsk.co";
const BITCOIN_API_URL = process.env.BITCOIN_API_URL || "https://mempool.space/api";
async function testCompleteFlow() {
    console.log("=".repeat(80));
    console.log("Testing Complete PowPeg Monitoring Flow");
    console.log("=".repeat(80));
    const provider = new ethers_1.ethers.JsonRpcProvider(ROOTSTOCK_RPC_URL);
    // In tests we can relax type safety and treat the contract as 'any'
    const powpegContract = new ethers_1.ethers.Contract(POWPEG_ADDRESS, powpeg_json_1.default, provider);
    try {
        // Step 1: Get Bitcoin federation address dynamically
        console.log("\n📍 Step 1: Get Bitcoin Federation Address");
        console.log("-".repeat(80));
        const bitcoinAddress = await powpegContract.getFederationAddress();
        console.log(`✅ Bitcoin Federation Address: ${bitcoinAddress}`);
        // Step 2: Get locked BTC balance on Bitcoin
        console.log("\n💰 Step 2: Get Locked BTC Balance");
        console.log("-".repeat(80));
        const btcApiUrl = `${BITCOIN_API_URL}/address/${bitcoinAddress}`;
        const btcResponse = await (0, undici_1.request)(btcApiUrl);
        const btcData = await btcResponse.body.json();
        const lockedSatoshis = btcData.chain_stats.funded_txo_sum - btcData.chain_stats.spent_txo_sum;
        const lockedBTC = lockedSatoshis / 1e8;
        console.log(`✅ Locked BTC: ${lockedBTC} BTC (${lockedSatoshis} satoshis)`);
        console.log(`   Funded: ${btcData.chain_stats.funded_txo_sum} satoshis`);
        console.log(`   Spent: ${btcData.chain_stats.spent_txo_sum} satoshis`);
        // Step 3: Get minted RBTC supply on Rootstock
        console.log("\n🪙  Step 3: Get Minted RBTC Supply");
        console.log("-".repeat(80));
        // RBTC is native, so we get the total supply from a known contract
        // or we approximate it from the federation address balance
        // For now, let's just show we can get balances
        const rbtcBalance = await provider.getBalance(POWPEG_ADDRESS);
        const mintedRBTC = Number(rbtcBalance) / 1e18;
        console.log(`ℹ️  PowPeg contract balance: ${mintedRBTC} RBTC`);
        console.log(`   (Note: This is just the contract balance, not total minted)`);
        // Step 4: Compute status
        console.log("\n📊 Step 4: Compute Bridge Status");
        console.log("-".repeat(80));
        const delta = lockedBTC - mintedRBTC;
        const deltaPct = lockedBTC > 0 ? (Math.abs(delta) / lockedBTC) * 100 : 0;
        let status = "green";
        if (Math.abs(deltaPct) > 10) {
            status = "red";
        }
        else if (Math.abs(deltaPct) > 5) {
            status = "yellow";
        }
        console.log(`Locked BTC:  ${lockedBTC} BTC`);
        console.log(`Minted RBTC: ${mintedRBTC} RBTC (approx)`);
        console.log(`Delta:       ${delta.toFixed(8)} (${deltaPct.toFixed(2)}%)`);
        console.log(`Status:      ${status.toUpperCase()}`);
        // Step 5: Additional PowPeg info
        console.log("\n🔍 Step 5: Additional PowPeg Info");
        console.log("-".repeat(80));
        const federationSize = await powpegContract.getFederationSize();
        const minLockValue = await powpegContract.getMinimumLockTxValue();
        const minLockBTC = Number(minLockValue) / 1e8;
        console.log(`Federation Size: ${federationSize.toString()} members`);
        console.log(`Minimum Lock:    ${minLockBTC} BTC`);
        console.log("\n" + "=".repeat(80));
        console.log("✅ Complete Flow Test Successful!");
        console.log("=".repeat(80));
    }
    catch (error) {
        console.error("\n❌ Error during test:");
        console.error(error.message);
        if (error.stack) {
            console.error(error.stack);
        }
    }
}
testCompleteFlow().catch(console.error);
//# sourceMappingURL=test-complete-flow.js.map