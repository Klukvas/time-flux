'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useViewStore } from '@/stores/view-store';

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
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
