-- CreateTable
CREATE TABLE "BridgeAssetSnapshot" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bridgeAssetId" INTEGER NOT NULL,
    "lockedBalance" TEXT NOT NULL,
    "mintedBalance" TEXT NOT NULL,
    "delta" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "BridgeAssetSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "bridgeAssetId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "details" TEXT,

    CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BridgeAssetSnapshot" ADD CONSTRAINT "BridgeAssetSnapshot_bridgeAssetId_fkey" FOREIGN KEY ("bridgeAssetId") REFERENCES "BridgeAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anomaly" ADD CONSTRAINT "Anomaly_bridgeAssetId_fkey" FOREIGN KEY ("bridgeAssetId") REFERENCES "BridgeAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
