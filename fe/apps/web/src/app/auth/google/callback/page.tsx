'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { createApiClient, createApi } from '@timeflux/api';
import { useAuthStore } from '@/stores/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      toast.error('Google authentication failed. Please try again.');
      router.replace('/');
      return;
    }

    const client = createApiClient({
      baseURL: API_BASE_URL,
      getToken: () => null,
      getRefreshToken: () => null,
      onTokenRefreshed: () => {},
      onUnauthorized: () => {},
    });
    const api = createApi(client);

    api.auth
      .exchangeGoogleCode(code)
      .then((data) => {
        const { access_token, refresh_token, user } = data;
        setAuth(access_token, refresh_token, user);
        router.replace('/timeline');
      })
      .catch(() => {
        toast.error('Google authentication failed. Please try again.');
        router.replace('/');
      });
  }, [searchParams, setAuth, router]);

  return (
    <div className="flex h-dvh items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
