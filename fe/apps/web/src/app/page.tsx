'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import { SocialProofSection } from '@/components/landing/social-proof-section';
import { ChaptersVibeSection } from '@/components/landing/chapters-vibe-section';
import { OnThisDayPreview } from '@/components/landing/on-this-day-preview';
import { FinalCTA } from '@/components/landing/final-cta';

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
    <div className="min-h-screen bg-surface">
      <LandingHeader
        onLogin={() => setAuthModal('login')}
        onRegister={() => setAuthModal('register')}
      />

      <main>
        <HeroSection onStart={() => setAuthModal('register')} />
        <SocialProofSection />
        <ChaptersVibeSection />
        <OnThisDayPreview />
        <FinalCTA onStart={() => setAuthModal('register')} />
      </main>

      <footer className="border-t border-edge px-4 py-8 text-center text-xs text-content-tertiary">
        LifeSpan &copy; {new Date().getFullYear()}
      </footer>

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
