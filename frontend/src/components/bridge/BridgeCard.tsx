import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';
import type { Bridge } from '@/lib/types';

interface BridgeCardProps {
  bridge: Bridge;
}

export function BridgeCard({ bridge }: BridgeCardProps) {
  const assets = bridge.bridgeAssets || [];
  const hasAssets = assets.length > 0;
  const primaryAsset = assets[0];
  const extraAssetCount = Math.max(assets.length - 1, 0);

  return (
    <Link href={`/bridges/${bridge.id}`} aria-label={`View details for ${bridge.name} bridge`}>
      <div className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-linear-to-br from-purple-950/40 via-pink-950/30 to-purple-950/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-pink-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
        <div className="absolute inset-0 bg-linear-to-br from-purple-500/0 to-pink-500/0 transition-opacity group-hover:from-purple-500/10 group-hover:to-pink-500/10" />
        
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {bridge.official && (
                <Shield className="h-4 w-4 text-pink-400" />
              )}
              <h3 className="text-lg font-semibold text-white">{bridge.name}</h3>
            </div>
            
            <p className="mb-4 text-sm text-purple-200/70">
              {bridge.description || `${bridge.sourceChain.name} → ${bridge.destChain.name}`}
            </p>
            
            {hasAssets && primaryAsset && (
              <div className="space-y-1 text-xs">
                <div className="text-purple-300/70">
                  {primaryAsset.sourceAsset.symbol} → {primaryAsset.destAsset.symbol}
                </div>
                {extraAssetCount > 0 && (
                  <div className="text-purple-300/50">
                    +{extraAssetCount} more bridged asset{extraAssetCount > 1 ? 's' : ''}
                  </div>
                )}
                <div className="text-purple-200/50">
                  Click to view per‑asset status and history
                </div>
              </div>
            )}
          </div>
          
          <ArrowRight className="h-5 w-5 text-purple-400 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
