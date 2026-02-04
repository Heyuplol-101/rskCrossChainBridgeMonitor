'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Bridge, BridgeStatusResponse, AnomaliesResponse } from '@/lib/types';

/**
 * Fetch all bridges
 */
export function useBridges() {
  return useQuery<Bridge[]>({
    queryKey: ['bridges'],
    queryFn: () => api.getBridges(),
    refetchInterval: 60000, // Poll every 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

/**
 * Fetch bridge status with latest snapshots
 */
export function useBridgeStatus(bridgeId: number) {
  return useQuery<BridgeStatusResponse>({
    queryKey: ['bridge', bridgeId, 'status'],
    queryFn: () => api.getBridgeStatus(bridgeId),
    enabled: !!bridgeId && !isNaN(bridgeId),
    refetchInterval: 60000, // Poll every 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

/**
 * Fetch bridge anomalies
 */
export function useBridgeAnomalies(
  bridgeId: number,
  options?: { limit?: number; resolved?: boolean }
) {
  return useQuery<AnomaliesResponse>({
    queryKey: ['bridge', bridgeId, 'anomalies', options],
    queryFn: () => api.getBridgeAnomalies(bridgeId, options),
    enabled: !!bridgeId && !isNaN(bridgeId),
    refetchInterval: 60000, // Poll every 60 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}
