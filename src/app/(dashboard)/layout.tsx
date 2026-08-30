/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/login');
      }
    }
  }, [user, router, isHydrated]);

  if (!isHydrated || !user || user.role !== 'ADMIN') {
    return (
      <div className='min-h-screen flex items-center justify-center text-muted-foreground'>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background flex'>
      <Sidebar />
      <div className='flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300'>
        <Topbar />
        <main className='flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden'>
          <div className='animate-in fade-in duration-500'>{children}</div>
        </main>
      </div>
    </div>
  );
}
