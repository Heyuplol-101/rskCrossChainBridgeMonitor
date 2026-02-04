import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatRelativeTime, parseAnomalyDetails, getAnomalyMessage } from '@/lib/utils';
import type { Anomaly } from '@/lib/types';

interface AnomalyListProps {
  anomalies: Anomaly[];
}

export function AnomalyList({ anomalies }: AnomalyListProps) {
  if (anomalies.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-green-950/30 p-8 text-center backdrop-blur-sm">
        <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
        <p className="mt-2 text-emerald-300">No anomalies detected</p>
        <p className="mt-1 text-sm text-emerald-300/60">All systems operational</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {anomalies.map((anomaly) => {
        const severity = anomaly.severity;
        const isHigh = severity === 'high' || severity === 'critical';
        const isMedium = severity === 'medium' || severity === 'warning';
        const isLow = severity === 'low' || severity === 'info';

        const bgColor = isHigh
          ? 'border-rose-500/20 bg-gradient-to-br from-rose-950/40 to-red-950/30'
          : isMedium
          ? 'border-amber-500/20 bg-gradient-to-br from-amber-950/40 to-yellow-950/30'
          : 'border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-cyan-950/30';

        const iconColor = isHigh
          ? 'text-rose-400'
          : isMedium
          ? 'text-amber-400'
          : 'text-blue-400';

        const message = getAnomalyMessage(anomaly);
        const details = parseAnomalyDetails(anomaly.details);

        return (
          <div
            key={anomaly.id}
            className={`rounded-xl border p-4 backdrop-blur-sm ${bgColor}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium capitalize text-white text-sm">
                    {severity}
                  </span>
                  <span className="text-xs text-purple-300/60">
                    {formatRelativeTime(anomaly.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-purple-200">{message}</p>
                {details && Object.keys(details).length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-purple-300/70 hover:text-purple-300">
                      View details
                    </summary>
                    <pre className="mt-2 overflow-auto rounded-lg border border-purple-500/20 bg-purple-950/50 p-3 text-xs text-purple-200">
                      {JSON.stringify(details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
