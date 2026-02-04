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
dotenv.config();
const POWPEG_PRECOMPILED_ADDRESS = "0x0000000000000000000000000000000001000006";
const ROOTSTOCK_RPC_URL = process.env.ROOTSTOCK_RPC_URL || "https://public-node.rsk.co";
async function testPowPeg() {
    console.log("=".repeat(80));
    console.log("Testing PowPeg Precompiled Contract");
    console.log("=".repeat(80));
    const provider = new ethers_1.ethers.JsonRpcProvider(ROOTSTOCK_RPC_URL);
    // In tests we can relax type safety and treat the contract as 'any'
    const powpegContract = new ethers_1.ethers.Contract(POWPEG_PRECOMPILED_ADDRESS, powpeg_json_1.default, provider);
    try {
        console.log("\n1. Testing getFederationAddress()...");
        console.log("-".repeat(80));
        const federationAddress = await powpegContract.getFederationAddress();
        console.log("✅ SUCCESS!");
        console.log(`Federation Bitcoin Address: ${federationAddress}`);
        console.log(`Type: ${typeof federationAddress}`);
        console.log(`Length: ${federationAddress.length} characters`);
        // Validate it looks like a Bitcoin address
        if (federationAddress.startsWith("1") ||
            federationAddress.startsWith("3") ||
            federationAddress.startsWith("bc1")) {
            console.log("✅ Looks like a valid Bitcoin address!");
        }
        else {
            console.log("⚠️  Warning: Doesn't look like a standard Bitcoin address");
        }
    }
    catch (error) {
        console.error("❌ getFederationAddress() failed:");
        console.error(error.message);
    }
    try {
        console.log("\n2. Testing getFederationSize()...");
        console.log("-".repeat(80));
        const federationSize = await powpegContract.getFederationSize();
        console.log("✅ SUCCESS!");
        console.log(`Federation Size: ${federationSize.toString()} members`);
    }
    catch (error) {
        console.error("❌ getFederationSize() failed:");
        console.error(error.message);
    }
    try {
        console.log("\n3. Testing getMinimumLockTxValue()...");
        console.log("-".repeat(80));
        const minLockValue = await powpegContract.getMinimumLockTxValue();
        const minLockBTC = Number(minLockValue) / 1e8; // Convert satoshis to BTC
        console.log("✅ SUCCESS!");
        console.log(`Minimum Lock Value: ${minLockValue.toString()} satoshis`);
        console.log(`Minimum Lock Value: ${minLockBTC} BTC`);
    }
    catch (error) {
        console.error("❌ getMinimumLockTxValue() failed:");
        console.error(error.message);
    }
    console.log("\n" + "=".repeat(80));
    console.log("PowPeg Test Complete!");
    console.log("=".repeat(80));
}
testPowPeg().catch(console.error);
//# sourceMappingURL=test-powpeg.js.map