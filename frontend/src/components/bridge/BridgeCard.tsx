import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCryptoAmount } from '@/lib/utils';
import type { Bridge } from '@/lib/types';

interface BridgeCardProps {
  bridge: Bridge;
}

export function BridgeCard({ bridge }: BridgeCardProps) {
  // Get latest snapshot from first bridge asset (if available from status endpoint)
  // Note: /bridges endpoint doesn't include snapshots, so we'll show basic info
  const bridgeAsset = bridge.bridgeAssets[0];
  const hasData = bridgeAsset !== undefined;

  return (
    <Link href={`/bridges/${bridge.id}`}>
      <div className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-pink-950/30 to-purple-950/40 p-6 shadow-lg backdrop-blur-sm transition-all hover:border-pink-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 transition-opacity group-hover:from-purple-500/10 group-hover:to-pink-500/10" />
        
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
            
            {hasData && (
              <div className="space-y-2">
                <div className="text-xs text-purple-300/60">
                  {bridgeAsset.sourceAsset.symbol} → {bridgeAsset.destAsset.symbol}
                </div>
                <div className="text-xs text-purple-200/50">
                  Click to view details
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
