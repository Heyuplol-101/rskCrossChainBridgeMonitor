import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("🧹 Starting cleanup...");

  const deletedAnomalies = await prisma.anomaly.deleteMany({});
  console.log(`  Deleted ${deletedAnomalies.count} anomalies`);

  const deletedSnapshots = await prisma.bridgeAssetSnapshot.deleteMany({});
  console.log(`  Deleted ${deletedSnapshots.count} snapshots`);

  const deletedBridgeAssets = await prisma.bridgeAsset.deleteMany({});
  console.log(`  Deleted ${deletedBridgeAssets.count} bridge assets`);

  const oldSymbols = ["USDT0", "USDC", "DAI", "rUSDC", "rDAI"];
  for (const symbol of oldSymbols) {
    const deleted = await prisma.asset.deleteMany({
      where: {
        symbol,
        chain: {
          slug: "rootstock",
        },
      },
    });
    if (deleted.count > 0) {
      console.log(`  Deleted ${deleted.count} assets with symbol "${symbol}" on Rootstock`);
    }
  }

  console.log("✅ Cleanup complete!\n");
}

async function main() {
  try {
    await cleanup();
    console.log("🌱 Now run: npx prisma db seed");
    console.log("   Or: npm run seed (if configured)");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
