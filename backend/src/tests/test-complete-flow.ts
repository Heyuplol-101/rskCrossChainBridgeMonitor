import { ethers } from "ethers";
import * as dotenv from "dotenv";
import powpegAbi from "../abis/powpeg.json";
import { request } from "undici";

dotenv.config();

const POWPEG_ADDRESS = "0x0000000000000000000000000000000001000006";
const ROOTSTOCK_RPC_URL = process.env.ROOTSTOCK_RPC_URL || "https://public-node.rsk.co";
const BITCOIN_API_URL = process.env.BITCOIN_API_URL || "https://mempool.space/api";

async function testCompleteFlow() {
  console.log("=".repeat(80));
  console.log("Testing Complete PowPeg Monitoring Flow");
  console.log("=".repeat(80));

  const provider = new ethers.JsonRpcProvider(ROOTSTOCK_RPC_URL);
  // In tests we can relax type safety and treat the contract as 'any'
  const powpegContract = new ethers.Contract(POWPEG_ADDRESS, powpegAbi, provider) as any;

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
    const btcResponse = await request(btcApiUrl);
    const btcData: any = await btcResponse.body.json();
    
    const lockedSatoshis = 
      btcData.chain_stats.funded_txo_sum - btcData.chain_stats.spent_txo_sum;
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

    // Step 4: Illustrative delta only (NOT a solvency check)
    console.log("\n📊 Step 4: Illustrative Delta (NOT a solvency check)");
    console.log("-".repeat(80));
    
    console.log(`Locked BTC:  ${lockedBTC} BTC`);
    console.log(`Minted RBTC: ${mintedRBTC} RBTC (approx)`);
    console.log(
      "⚠️  Note: PowPeg uses native RBTC, so this comparison is illustrative only and is NOT a true solvency metric.",
    );

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

  } catch (error: any) {
    console.error("\n❌ Error during test:");
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testCompleteFlow().catch(console.error);
