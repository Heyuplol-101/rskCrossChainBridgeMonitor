import BigNumber from 'bignumber.js';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format crypto amount with proper decimals
 */
export function formatCryptoAmount(
  amount: string | number,
  decimals: number,
  symbol: string
): string {
  const bn = new BigNumber(amount);
  const divisor = new BigNumber(10).pow(decimals);
  const formatted = bn.dividedBy(divisor);
  
  // Format based on decimals
  // BTC: 8 decimals, show 8 places
  // RBTC/ERC-20: 18 decimals, show 4 places for readability
  // Others: 2 places
  const decimalPlaces = decimals === 8 ? 8 : decimals === 18 ? 4 : 2;
  
  return `${formatted.toFixed(decimalPlaces)} ${symbol}`;
}

/**
 * Format BTC (8 decimals)
 */
export function formatBTC(satoshis: string | number): string {
  return formatCryptoAmount(satoshis, 8, 'BTC');
}

/**
 * Format RBTC (18 decimals)
 */
export function formatRBTC(wei: string | number): string {
  return formatCryptoAmount(wei, 18, 'RBTC');
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Unknown time';
  }
}

/**
 * Format full date
 */
export function formatFullDate(date: string | Date): string {
  try {
    return format(new Date(date), 'PPpp');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, length = 6): string {
  if (!address) return '';
  if (address.length <= length * 2 + 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

/**
 * Get status color (background)
 */
export function getStatusColor(status: 'green' | 'yellow' | 'red' | 'unknown'): string {
  const colors: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    unknown: 'bg-slate-400',
  };
  return colors[status] ?? 'bg-slate-400';
}

/**
 * Get status text color
 */
export function getStatusTextColor(status: 'green' | 'yellow' | 'red' | 'unknown'): string {
  const colors: Record<string, string> = {
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    unknown: 'text-slate-500 dark:text-slate-300',
  };
  return colors[status] ?? 'text-slate-500 dark:text-slate-300';
}

/**
 * Calculate delta percentage between locked and minted
 * Accounts for different decimal places by normalizing to the same base.
 *
 * Convention:
 *   - Positive percentage means "over-collateralized" (locked >= minted)
 *   - Negative percentage means "under-collateralized" (minted > locked)
 */
export function calculateDeltaPercentage(
  locked: string | number,
  minted: string | number,
  lockedDecimals: number,
  mintedDecimals: number
): number {
  const lockedBn = new BigNumber(locked);
  const mintedBn = new BigNumber(minted);
  
  // Normalize both to the same decimal base (use the maximum)
  const maxDecimals = Math.max(lockedDecimals, mintedDecimals);
  const lockedNormalized = lockedBn.multipliedBy(new BigNumber(10).pow(maxDecimals - lockedDecimals));
  const mintedNormalized = mintedBn.multipliedBy(new BigNumber(10).pow(maxDecimals - mintedDecimals));
  
  // If locked is zero, return 0 (can't calculate percentage)
  if (lockedNormalized.isZero()) {
    // If minted is also zero, they're equal
    if (mintedNormalized.isZero()) return 0;
    // If only locked is zero but minted isn't, we consider this fully under-collateralized
    return -100;
  }
  
  // Calculate: (locked - minted) / locked * 100
  const delta = lockedNormalized.minus(mintedNormalized);
  return delta.dividedBy(lockedNormalized).multipliedBy(100).toNumber();
}

/**
 * Parse anomaly details (stored as JSON string in backend)
 */
export function parseAnomalyDetails(details: string | null | undefined): Record<string, any> | null {
  if (!details) return null;
  
  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

/**
 * Get anomaly message from details or type
 */
export function getAnomalyMessage(anomaly: { type: string; details?: string | null }): string {
  const parsed = parseAnomalyDetails(anomaly.details);
  if (parsed?.message) {
    return parsed.message;
  }
  
  // Fallback to type-based message
  const typeMessages: Record<string, string> = {
    mismatch: 'Balance mismatch detected',
    delay: 'Transaction delay detected',
    sudden_change: 'Sudden balance change detected',
  };
  
  return typeMessages[anomaly.type] || `Anomaly: ${anomaly.type}`;
}
