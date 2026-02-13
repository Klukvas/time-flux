'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import type { AuthUser } from '@lifespan/api';
import { useAuthStore } from '@/stores/auth-store';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    const refreshTokenParam = searchParams.get('refresh_token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error || !token || !refreshTokenParam || !userParam) {
      toast.error('Google authentication failed. Please try again.');
      router.replace('/');
      return;
    }

    try {
      const user = JSON.parse(userParam) as AuthUser;
      setAuth(token, refreshTokenParam, user);
      router.replace('/timeline');
    } catch {
      toast.error('Google authentication failed. Please try again.');
      router.replace('/');
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
