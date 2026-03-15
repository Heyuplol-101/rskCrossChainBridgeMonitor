import type { BridgeAssetSnapshot } from '@/lib/types';

interface StatusBadgeProps {
  status: BridgeAssetSnapshot['status'];
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusConfig = {
    green: {
      dot: 'bg-emerald-500',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    },
    yellow: {
      dot: 'bg-amber-500',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    },
    red: {
      dot: 'bg-rose-500',
      text: 'text-rose-400',
      glow: 'shadow-[0_0_8px_rgba(244,63,94,0.4)]',
    },
    unknown: {
      dot: 'bg-slate-400',
      text: 'text-slate-300',
      glow: 'shadow-[0_0_8px_rgba(148,163,184,0.4)]',
    },
  } as const;

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${config.dot} ${sizeClasses[size]} rounded-full ${config.glow}`}
      />
      <span className={`${config.text} font-medium capitalize text-sm`}>
        {status === 'unknown' ? 'unverified' : status}
      </span>
    </div>
  );
}
