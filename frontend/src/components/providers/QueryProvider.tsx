'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';

// Rootstock-inspired accent colors (approximate)
// Primary: purple/pink gradient, accents: green & orange
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'linear-gradient(135deg,#2b143f,#12071f)',
            color: '#f9fafb',
            border: '1px solid rgba(168,85,247,0.5)', // purple border
          },
        }}
      />
    </QueryClientProvider>
  );
}

