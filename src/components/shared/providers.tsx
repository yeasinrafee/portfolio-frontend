'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store'; // ⬅ Auth Store ইমপোর্ট করুন (পাথ ঠিক করে নেবেন)

export default function Providers({ children }: { children: React.ReactNode }) {
  const setReady = useAuthStore((s) => s.setReady); // ⬅ Zustand থেকে setReady নিয়ে আসুন

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    const initializeAuth = async () => {
      try {
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setReady(true);
      }
    };

    initializeAuth();
  }, [setReady]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
