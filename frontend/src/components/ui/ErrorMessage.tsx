import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-rose-500/20 bg-gradient-to-r from-rose-950/50 to-rose-900/30 p-4 text-rose-300 backdrop-blur-sm">
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
