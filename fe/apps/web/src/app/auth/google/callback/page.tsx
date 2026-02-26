'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { AuthResponse } from '@lifespan/api';
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

    axios
      .post<AuthResponse>(`${API_BASE_URL}/api/v1/auth/google/exchange`, { code })
      .then((res) => {
        const { access_token, refresh_token, user } = res.data;
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
