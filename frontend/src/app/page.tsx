'use client';

import { BridgeCard } from '@/components/bridge/BridgeCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useBridges } from '@/hooks/useBridgeData';
import { Activity } from 'lucide-react';

export default function HomePage() {
  const { data: bridges, isLoading, error } = useBridges();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message="Failed to load bridges. Please check if the backend is running and try again." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-lg bg-linear-to-br from-purple-500 to-pink-500 p-2">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Rootstock Bridge Monitor
          </h1>
        </div>
        <p className="text-purple-200/70">
          Real-time monitoring of Rootstock cross-chain bridges for transparency and security
        </p>
      </div>

      {bridges && bridges.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bridges.map((bridge) => (
            <BridgeCard key={bridge.id} bridge={bridge} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-purple-500/20 bg-linear-to-br from-purple-950/40 to-pink-950/30 p-8 text-center backdrop-blur-sm">
          <p className="text-purple-300/60">No bridges found</p>
          <p className="mt-2 text-sm text-purple-300/40">
            Make sure the backend is running and has seeded data
          </p>
        </div>
      )}
    </div>
  );
}
