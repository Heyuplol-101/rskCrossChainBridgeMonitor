import { ethers } from "ethers";
import * as dotenv from "dotenv";
import powpegAbi from "../abis/powpeg.json";

dotenv.config();

const POWPEG_PRECOMPILED_ADDRESS = "0x0000000000000000000000000000000001000006";
const ROOTSTOCK_RPC_URL = process.env.ROOTSTOCK_RPC_URL || "https://public-node.rsk.co";

async function testPowPeg() {
  console.log("=".repeat(80));
  console.log("Testing PowPeg Precompiled Contract");
  console.log("=".repeat(80));

  const provider = new ethers.JsonRpcProvider(ROOTSTOCK_RPC_URL);
  // In tests we can relax type safety and treat the contract as 'any'
  const powpegContract = new ethers.Contract(
    POWPEG_PRECOMPILED_ADDRESS,
    powpegAbi,
    provider
  ) as any;

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
    } else {
      console.log("⚠️  Warning: Doesn't look like a standard Bitcoin address");
    }

  } catch (error: any) {
    console.error("❌ getFederationAddress() failed:");
    console.error(error.message);
  }

  try {
    console.log("\n2. Testing getFederationSize()...");
    console.log("-".repeat(80));
    
    const federationSize = await powpegContract.getFederationSize();
    console.log("✅ SUCCESS!");
    console.log(`Federation Size: ${federationSize.toString()} members`);

  } catch (error: any) {
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

  } catch (error: any) {
    console.error("❌ getMinimumLockTxValue() failed:");
    console.error(error.message);
  }

  console.log("\n" + "=".repeat(80));
  console.log("PowPeg Test Complete!");
  console.log("=".repeat(80));
}

testPowPeg().catch(console.error);
