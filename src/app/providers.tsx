'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import { trpc, createTRPCClient } from '../lib/trpc-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const { queryClient, trpcClient } = useMemo(() => createTRPCClient(), []);

  return (
    <SessionProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}
