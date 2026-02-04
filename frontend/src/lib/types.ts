// Chain types
export interface Chain {
  id: number;
  name: string;
  slug: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

// Asset types
export interface Asset {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
  contractAddress?: string | null;
  isNative: boolean;
  chainId: number;
  chain?: Chain;
  createdAt?: string;
  updatedAt?: string;
}

// Bridge Asset Snapshot types
export interface BridgeAssetSnapshot {
  id: number;
  bridgeAssetId: number;
  createdAt: string;
  lockedBalance: string;
  mintedBalance: string;
  delta: string;
  status: 'green' | 'yellow' | 'red' | 'unknown';
}

// Anomaly types (matching backend schema)
export interface Anomaly {
  id: number;
  bridgeAssetId: number;
  createdAt: string;
  resolvedAt?: string | null;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'info' | 'warning' | 'critical';
  details?: string | null;
  // Note: Backend may also include 'message' field in details JSON
}

// Bridge Asset types
export interface BridgeAsset {
  id: number;
  bridgeId: number;
  sourceAssetId: number;
  destAssetId: number;
  sourceAsset: Asset;
  destAsset: Asset;
  lockAddress?: string | null;
  lockContractAddress?: string | null;
  mintContractAddress?: string | null;
  bridgeContractAddress?: string | null;
  snapshots?: BridgeAssetSnapshot[];
  anomalies?: Anomaly[];
  createdAt?: string;
  updatedAt?: string;
}

// Bridge types
export interface Bridge {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  official: boolean;
  sourceChainId: number;
  destChainId: number;
  sourceChain: Chain;
  destChain: Chain;
  bridgeAssets: BridgeAsset[];
  createdAt?: string;
  updatedAt?: string;
}

// API Response types
export type BridgesResponse = Bridge[];

export type BridgeStatusResponse = Bridge;

export interface AnomaliesResponse {
  bridgeId: number;
  anomalies: Anomaly[];
}

export interface HealthResponse {
  status: string;
}
