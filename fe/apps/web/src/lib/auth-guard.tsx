'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useViewStore } from '@/stores/view-store';
import { Skeleton } from '@/components/ui/skeleton';

/** Lightweight shell skeleton that mirrors the DashboardShell layout without needing providers. */
function AuthSkeleton() {
  return (
    <div className="flex min-h-dvh">
      {/* Static sidebar skeleton — desktop only */}
      <div className="hidden md:block">
        <aside className="sticky top-0 flex h-dvh w-64 flex-col border-r border-edge bg-surface-card">
          <div className="flex h-16 items-center border-b border-edge px-6">
            <Skeleton className="h-6 w-24" />
          </div>
          <nav className="flex-1 space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </nav>
          <div className="border-t border-edge px-4 py-3">
            <Skeleton className="h-4 w-32" />
          </div>
        </aside>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header skeleton */}
        <header className="sticky top-0 z-30 flex md:hidden h-14 shrink-0 items-center justify-between border-b border-edge bg-surface-card px-4">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-24" />
          <div className="w-10" />
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-5xl p-4 md:p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateView = useViewStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateAuth();
    hydrateView();
    setReady(true);
  }, [hydrateAuth, hydrateView]);

  useEffect(() => {
    if (ready && !token) {
      router.replace('/');
    }
  }, [ready, token, router]);

  if (!ready || !token) {
    return <AuthSkeleton />;
  }

  return <>{children}</>;
}
