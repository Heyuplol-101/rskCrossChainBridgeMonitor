import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Upsert chains
  const bitcoin = await prisma.chain.upsert({
    where: { slug: "bitcoin" },
    update: {},
    create: {
      name: "Bitcoin",
      slug: "bitcoin",
      type: "BITCOIN",
    },
  });

  const rootstock = await prisma.chain.upsert({
    where: { slug: "rootstock" },
    update: {},
    create: {
      name: "Rootstock",
      slug: "rootstock",
      type: "EVM",
    },
  });

  const ethereum = await prisma.chain.upsert({
    where: { slug: "ethereum" },
    update: {},
    create: {
      name: "Ethereum",
      slug: "ethereum",
      type: "EVM",
    },
  });

  const btc = await prisma.asset.upsert({
    where: { symbol_chainId: { symbol: "BTC", chainId: bitcoin.id } },
    update: {},
    create: {
      symbol: "BTC",
      name: "Bitcoin",
      decimals: 8,
      isNative: true,
      chainId: bitcoin.id,
    },
  });

  const rbtc = await prisma.asset.upsert({
    where: { symbol_chainId: { symbol: "RBTC", chainId: rootstock.id } },
    update: {},
    create: {
      symbol: "RBTC",
      name: "Smart Bitcoin",
      decimals: 18,
      isNative: true,
      chainId: rootstock.id,
    },
  });

  const rif = await prisma.asset.upsert({
    where: { symbol_chainId: { symbol: "RIF", chainId: rootstock.id } },
    update: {},
    create: {
      symbol: "RIF",
      name: "RIF Token",
      decimals: 18,
      isNative: false,
      contractAddress: "0x2acc95758f8b5f583470ba265eb685a8f45fc9d5", // RIF token on Rootstock
      chainId: rootstock.id,
    },
  });

  const usdtEth = await prisma.asset.upsert({
    where: { symbol_chainId: { symbol: "USDT", chainId: ethereum.id } },
    update: {},
    create: {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      isNative: false,
      contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT on Ethereum
      chainId: ethereum.id,
    },
  });

  const usdcEth = await prisma.asset.upsert({
    where: { symbol_chainId: { symbol: "USDC", chainId: ethereum.id } },
    update: {
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    create: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      isNative: false,
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
      chainId: ethereum.id,
    },
  });

  const daiEth = await prisma.asset.upsert({
    where: { symbol_chainId: { symbol: "DAI", chainId: ethereum.id } },
    update: {},
    create: {
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      isNative: false,
      contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI on Ethereum
      chainId: ethereum.id,
    },
  });

  const rUSDT = await prisma.asset.upsert({
    where: { symbol_chainId: { symbol: "rUSDT", chainId: rootstock.id } },
    update: {
      decimals: 18, // DevRel confirmed: 18 decimals
      name: "Tether USD (Token Bridge)",
    },
    create: {
      symbol: "rUSDT",
      name: "Tether USD (Token Bridge)",
      decimals: 18, // DevRel confirmed: 18 decimals
      isNative: false,
      contractAddress: "0xEf213441a85DF4d7acBdAe0Cf78004E1e486BB96", // Confirmed by DevRel
      chainId: rootstock.id,
    },
  });

  // NOTE: Additional Token Bridge side tokens such as rUSDC and rDAI are intentionally
  // not seeded here to keep this file focused on assets that are confirmed working.
  // When those contracts are fully deployed and verified, they can be added following
  // the same pattern as rUSDT, or configured via a separate seed script.

  const doc = await prisma.asset.upsert({
    where: { symbol_chainId: { symbol: "DOC", chainId: rootstock.id } },
    update: {},
    create: {
      symbol: "DOC",
      name: "Dollar on Chain",
      decimals: 18,
      isNative: false,
      contractAddress: "0xAC3896da7940c8e4Fe9E7F8cd4475Cd2534F37d7", // DOC on Rootstock
      chainId: rootstock.id,
    },
  });

  // Upsert PowPeg BTC bridge (native BTC ↔ RBTC)
  const btcBridge = await prisma.bridge.upsert({
    where: { slug: "rootstock-btc-official" },
    update: {
      name: "Rootstock PowPeg (BTC ↔ RBTC)",
      description: "Official PowPeg bridge for BTC ↔ RBTC (native bridge)",
    },
    create: {
      name: "Rootstock PowPeg (BTC ↔ RBTC)",
      slug: "rootstock-btc-official",
      description: "Official PowPeg bridge for BTC ↔ RBTC (native bridge)",
      official: true,
      sourceChainId: bitcoin.id,
      destChainId: rootstock.id,
    },
  });

  // PowPeg bridge asset with precompiled contract address
  // PowPeg precompiled contract: 0x0000000000000000000000000000000001000006
  // This contract has getFederationAddress() which returns the Bitcoin federation address
  await prisma.bridgeAsset.upsert({
    where: {
      bridgeId_sourceAssetId_destAssetId: {
        bridgeId: btcBridge.id,
        sourceAssetId: btc.id,
        destAssetId: rbtc.id,
      },
    },
    update: {
      bridgeContractAddress: "0x0000000000000000000000000000000001000006", // PowPeg precompiled
      lockContractAddress: null, // Dynamic via getFederationAddress()
      mintContractAddress: null, // RBTC is native on Rootstock
    },
    create: {
      bridgeId: btcBridge.id,
      sourceAssetId: btc.id,
      destAssetId: rbtc.id,
      bridgeContractAddress: "0x0000000000000000000000000000000001000006", // PowPeg precompiled
      // lockAddress is dynamic via getFederationAddress() on PowPeg contract
      // mintContractAddress is not needed - RBTC is native on Rootstock
    },
  });

  // Upsert Ethereum ↔ Rootstock Token Bridge
  const tokenBridge = await prisma.bridge.upsert({
    where: { slug: "rootstock-token-bridge" },
    update: {},
    create: {
      name: "Rootstock Token Bridge",
      slug: "rootstock-token-bridge",
      description: "Official ERC-20 token bridge between Ethereum and Rootstock",
      official: true,
      sourceChainId: ethereum.id,
      destChainId: rootstock.id,
    },
  });

  // USDT bridge asset (Ethereum ↔ Rootstock)
  // Confirmed by DevRel: Lock on Ethereum, mint rUSDT on Rootstock
  await prisma.bridgeAsset.upsert({
    where: {
      bridgeId_sourceAssetId_destAssetId: {
        bridgeId: tokenBridge.id,
        sourceAssetId: usdtEth.id,
        destAssetId: rUSDT.id,
      },
    },
    update: {
      lockContractAddress: "0x12ed69359919fc775bc2674860e8fe2d2b6a7b5d", // Ethereum Bridge (confirmed by DevRel)
      mintContractAddress: "0xEf213441a85DF4d7acBdAe0Cf78004E1e486BB96", // rUSDT on Rootstock (confirmed by DevRel)
    },
    create: {
      bridgeId: tokenBridge.id,
      sourceAssetId: usdtEth.id,
      destAssetId: rUSDT.id,
      lockContractAddress: "0x12ed69359919fc775bc2674860e8fe2d2b6a7b5d", // Ethereum Bridge (confirmed by DevRel)
      mintContractAddress: "0xEf213441a85DF4d7acBdAe0Cf78004E1e486BB96", // rUSDT on Rootstock (confirmed by DevRel)
    },
  });

  // USDC and DAI bridge assets for the Token Bridge are intentionally not seeded yet.
  // Refer to Rootstock Token Bridge documentation for their latest contract addresses
  // and add them here only once the contracts are confirmed active and returning data.

  console.log("Database seeded with chains, assets, and bridge configuration.");
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
