'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, [hydrate]);

  useEffect(() => {
    if (ready && token) {
      router.replace('/timeline');
    }
  }, [ready, token, router]);

  if (!ready || token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-5xl font-bold text-accent">LifeSpan</h1>
        <p className="mt-4 text-xl text-content-secondary">
          Your visual life timeline
        </p>
        <p className="mt-2 text-content-tertiary">
          Track events, moods, and milestones. See your life story unfold on a beautiful timeline.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button size="lg" onClick={() => setAuthModal('register')}>
            Get Started
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setAuthModal('login')}>
            Sign In
          </Button>
        </div>
      </div>

      <LoginForm
        open={authModal === 'login'}
        onClose={() => setAuthModal(null)}
        onSwitchToRegister={() => setAuthModal('register')}
      />

      <RegisterForm
        open={authModal === 'register'}
        onClose={() => setAuthModal(null)}
        onSwitchToLogin={() => setAuthModal('login')}
      />
    </div>
  );
}
