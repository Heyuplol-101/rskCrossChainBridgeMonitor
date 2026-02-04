import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCryptoAmount, calculateDeltaPercentage, formatPercentage } from '@/lib/utils';
import type { BridgeAssetSnapshot } from '@/lib/types';
import BigNumber from 'bignumber.js';

interface BridgeStatusProps {
  snapshot: BridgeAssetSnapshot;
  sourceDecimals: number;
  destDecimals: number;
  sourceSymbol: string;
  destSymbol: string;
  isPowPeg?: boolean; // PowPeg (BTC ↔ RBTC) uses native RBTC with no totalSupply()
}

export function BridgeStatus({
  snapshot,
  sourceDecimals,
  destDecimals,
  sourceSymbol,
  destSymbol,
  isPowPeg = false,
}: BridgeStatusProps) {
  const mintedIsZero = new BigNumber(snapshot.mintedBalance).isZero();
  const isPowPegWithZeroMinted = isPowPeg && mintedIsZero;

  const deltaPct = isPowPegWithZeroMinted 
    ? null 
    : calculateDeltaPercentage(
        snapshot.lockedBalance,
        snapshot.mintedBalance,
        sourceDecimals,
        destDecimals
      );

  const lockedFormatted = formatCryptoAmount(
    snapshot.lockedBalance,
    sourceDecimals,
    sourceSymbol
  );
  
  const mintedFormatted = isPowPegWithZeroMinted
    ? 'N/A (native currency)'
    : formatCryptoAmount(
        snapshot.mintedBalance,
        destDecimals,
        destSymbol
      );

  // For PowPeg, show "unknown/unverified" status since we can only verify BTC locked side
  const displayStatus = isPowPegWithZeroMinted ? 'unknown' : snapshot.status;

  return (
    <div className="rounded-xl border border-purple-500/20 bg-linear-to-br from-purple-950/40 via-pink-950/30 to-purple-950/40 p-6 backdrop-blur-sm shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Current Status</h3>
        <StatusBadge status={displayStatus} size="lg" />
      </div>
      
      {isPowPegWithZeroMinted && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-950/20 p-3">
          <p className="text-sm text-amber-300/80">
            RBTC is the native currency on Rootstock. Total supply is not available on-chain.
            The locked BTC shown represents the federation custody balance.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 p-4 backdrop-blur-sm">
          <p className="mb-2 text-sm text-purple-300/70">Locked {sourceSymbol}</p>
          <p className="text-2xl font-bold text-white">{lockedFormatted}</p>
        </div>
        
        <div className="rounded-lg border border-pink-500/20 bg-pink-950/30 p-4 backdrop-blur-sm">
          <p className="mb-2 text-sm text-pink-300/70">
            {isPowPegWithZeroMinted ? `${destSymbol} Supply` : `Minted ${destSymbol}`}
          </p>
          <p className={`text-2xl font-bold ${isPowPegWithZeroMinted ? 'text-purple-300/60' : 'text-white'}`}>
            {mintedFormatted}
          </p>
        </div>
        
        <div className={`rounded-lg border p-4 backdrop-blur-sm ${
          deltaPct === null
            ? 'border-gray-500/20 bg-gray-950/30'
            : deltaPct >= 0 
              ? 'border-emerald-500/20 bg-emerald-950/30' 
              : 'border-rose-500/20 bg-rose-950/30'
        }`}>
          <p className="mb-2 text-sm text-purple-300/70">Delta</p>
          <p className={`text-2xl font-bold ${
            deltaPct === null
              ? 'text-gray-400'
              : deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {deltaPct === null ? 'N/A' : formatPercentage(deltaPct)}
          </p>
        </div>
      </div>
    </div>
  );
}
