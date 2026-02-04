'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCryptoAmount, formatFullDate } from '@/lib/utils';
import type { BridgeAssetSnapshot } from '@/lib/types';

interface BalanceChartProps {
  snapshots: BridgeAssetSnapshot[];
  sourceDecimals: number;
  destDecimals: number;
  sourceSymbol: string;
  destSymbol: string;
  isPowPeg?: boolean; // PowPeg: only locked BTC is charted
}

export function BalanceChart({
  snapshots,
  sourceDecimals,
  destDecimals,
  sourceSymbol,
  destSymbol,
  isPowPeg = false,
}: BalanceChartProps) {
  if (snapshots.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-purple-500/20 bg-purple-950/30 backdrop-blur-sm">
        <p className="text-purple-300/60">No historical data available</p>
      </div>
    );
  }

  const data = snapshots.map((snapshot) => ({
    timestamp: new Date(snapshot.createdAt).getTime(),
    date: formatFullDate(snapshot.createdAt),
    locked: Number(snapshot.lockedBalance) / Math.pow(10, sourceDecimals),
    minted: Number(snapshot.mintedBalance) / Math.pow(10, destDecimals),
    status: snapshot.status,
  }));

  return (
    <div className="rounded-xl border border-purple-500/20 bg-linear-to-br from-purple-950/40 to-pink-950/30 p-4 backdrop-blur-sm">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#a855f7" opacity={0.2} />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
            stroke="#c084fc"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#c084fc"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30, 0, 60, 0.95)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '8px',
              color: '#e9d5ff',
            }}
            labelFormatter={(value) => new Date(value).toLocaleString()}
            formatter={(value: number, name: string) => {
              if (name === 'locked') {
                return formatCryptoAmount(value * Math.pow(10, sourceDecimals), sourceDecimals, sourceSymbol);
              }
              if (name === 'minted') {
                return formatCryptoAmount(value * Math.pow(10, destDecimals), destDecimals, destSymbol);
              }
              return value;
            }}
          />
          <Legend
            wrapperStyle={{ color: '#e9d5ff' }}
          />
          <Line
            type="monotone"
            dataKey="locked"
            stroke="#10b981"
            strokeWidth={2}
            name={`Locked ${sourceSymbol}`}
            dot={false}
            activeDot={{ r: 6, fill: '#10b981' }}
          />
          {!isPowPeg && (
            <Line
              type="monotone"
              dataKey="minted"
              stroke="#ec4899"
              strokeWidth={2}
              name={`Minted ${destSymbol}`}
              dot={false}
              activeDot={{ r: 6, fill: '#ec4899' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
