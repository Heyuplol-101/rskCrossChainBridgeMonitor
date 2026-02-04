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
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const ROOTSTOCK_RPC_URL = process.env.ROOTSTOCK_RPC_URL || "https://public-node.rsk.co";
// Known addresses to check
const addresses = [
    {
        name: "PowPeg Precompiled",
        address: "0x0000000000000000000000000000000001000006",
    },
    {
        name: "Bridge Contract",
        address: "0x9D11937e2179dC5270Aa86A3f8143232d6Da0E69",
    },
    {
        name: "Federation Contract",
        address: "0x7eCFDA6072942577D36F939Ad528B366B020004b",
    },
];
async function checkRBTCSupply() {
    console.log("=".repeat(80));
    console.log("Checking RBTC Balances");
    console.log("=".repeat(80));
    const provider = new ethers_1.ethers.JsonRpcProvider(ROOTSTOCK_RPC_URL);
    for (const addr of addresses) {
        console.log(`\n${addr.name} (${addr.address})`);
        console.log("-".repeat(80));
        try {
            const balance = await provider.getBalance(addr.address);
            const rbtc = Number(balance) / 1e18;
            console.log(`Balance: ${rbtc} RBTC`);
            console.log(`Raw: ${balance.toString()} wei`);
        }
        catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }
    // Get total RBTC supply (if possible)
    console.log("\n" + "=".repeat(80));
    console.log("Note: RBTC is a native asset, so there's no totalSupply() method");
    console.log("For monitoring, we compare:");
    console.log("  - Locked BTC on Bitcoin (federation address)");
    console.log("  - Circulating RBTC on Rootstock");
    console.log("\nCirculating RBTC = Total BTC that has been peg-in minus total BTC peg-out");
    console.log("This is tracked by the PowPeg system internally.");
    console.log("=".repeat(80));
}
checkRBTCSupply().catch(console.error);
//# sourceMappingURL=test-rbtc-supply.js.map