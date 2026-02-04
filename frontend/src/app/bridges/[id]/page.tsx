'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { BridgeStatus } from '@/components/bridge/BridgeStatus';
import { BalanceChart } from '@/components/charts/BalanceChart';
import { AnomalyList } from '@/components/bridge/AnomalyList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useBridgeStatus, useBridgeAnomalies } from '@/hooks/useBridgeData';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BridgeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BridgeDetailPage({ params }: BridgeDetailPageProps) {
  const { id } = use(params);
  const bridgeId = parseInt(id);
  
  if (isNaN(bridgeId)) {
    notFound();
  }

  const { data: bridge, isLoading: statusLoading, error: statusError } = useBridgeStatus(bridgeId);
  const { data: anomaliesData, isLoading: anomaliesLoading } = useBridgeAnomalies(bridgeId, {
    limit: 20,
    resolved: false,
  });

  if (statusLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (statusError || !bridge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message="Failed to load bridge status. Please check if the backend is running and try again." />
      </div>
    );
  }

  const hasAssets = bridge.bridgeAssets && bridge.bridgeAssets.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-purple-300/70 transition-colors hover:text-purple-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          {bridge.name}
        </h1>
        <p className="text-purple-200/70">
          {bridge.description || `${bridge.sourceChain.name} → ${bridge.destChain.name}`}
        </p>
        {bridge.official && (
          <span className="mt-2 inline-block rounded-full border border-pink-500/30 bg-pink-950/30 px-3 py-1 text-xs text-pink-300">
            Official Bridge
          </span>
        )}
      </div>

      {hasAssets ? (
        <div className="space-y-10">
          {bridge.bridgeAssets.map((asset) => {
            const latestSnapshot = asset.snapshots?.[0];
            const allSnapshots = asset.snapshots || [];

            // PowPeg: Bitcoin source chain and native RBTC destination asset
            const isPowPeg =
              bridge.sourceChain.type === 'BITCOIN' && asset.destAsset?.isNative;

            return (
              <section
                key={asset.id}
                className="rounded-2xl border border-purple-500/20 bg-linear-to-br from-purple-950/40 via-slate-950/30 to-pink-950/40 p-6 backdrop-blur-sm shadow-lg"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      {asset.sourceAsset.symbol} → {asset.destAsset.symbol}
                    </h2>
                    <p className="text-sm text-purple-300/70">
                      {asset.sourceAsset.name} on {bridge.sourceChain.name} →{' '}
                      {asset.destAsset.name} on {bridge.destChain.name}
                    </p>
                  </div>
                  {isPowPeg && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-3 py-1 text-xs text-amber-300">
                      PowPeg (BTC ↔ RBTC)
                    </span>
                  )}
                </div>

                {latestSnapshot ? (
                  <>
                    <div className="mb-6">
                      <BridgeStatus
                        snapshot={latestSnapshot}
                        sourceDecimals={asset.sourceAsset.decimals}
                        destDecimals={asset.destAsset.decimals}
                        sourceSymbol={asset.sourceAsset.symbol}
                        destSymbol={asset.destAsset.symbol}
                        isPowPeg={isPowPeg}
                      />
                    </div>

                    {allSnapshots.length > 0 && (
                      <div className="mb-4">
                        <h3 className="mb-3 text-lg font-semibold text-white">
                          Historical Trends
                        </h3>
                        <BalanceChart
                          snapshots={allSnapshots}
                          sourceDecimals={asset.sourceAsset.decimals}
                          destDecimals={asset.destAsset.decimals}
                          sourceSymbol={asset.sourceAsset.symbol}
                          destSymbol={asset.destAsset.symbol}
                          isPowPeg={isPowPeg}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-purple-500/20 bg-linear-to-br from-purple-950/40 to-pink-950/30 p-6 text-center backdrop-blur-sm">
                    <p className="text-purple-300/60">
                      No snapshot data available yet for this asset.
                    </p>
                    <p className="mt-2 text-sm text-purple-300/40">
                      The monitoring service may not have run for this asset. Check the
                      backend logs.
                    </p>
                  </div>
                )}
              </section>
            );
          })}

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">Recent Anomalies</h2>
            {anomaliesLoading ? (
              <LoadingSpinner />
            ) : (
              <AnomalyList anomalies={anomaliesData?.anomalies || []} />
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-purple-500/20 bg-linear-to-br from-purple-950/40 to-pink-950/30 p-8 text-center backdrop-blur-sm">
          <p className="text-purple-300/60">No bridge assets configured for this bridge.</p>
          <p className="mt-2 text-sm text-purple-300/40">
            Ensure the database seed has created bridge assets and that the monitoring
            service is running.
          </p>
        </div>
      )}
    </div>
  );
}
