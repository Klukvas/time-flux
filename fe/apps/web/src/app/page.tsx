'use client';

import { useEffect, useState } from 'react';
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
  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const [ready, setReady] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const isAuthenticated = !!token;

  useEffect(() => {
    hydrate();
    setReady(true);
  }, [hydrate]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface">
      <LandingHeader
        isAuthenticated={isAuthenticated}
        onLogin={() => setAuthModal('login')}
        onRegister={() => setAuthModal('register')}
      />

      <main>
        <HeroSection
          isAuthenticated={isAuthenticated}
          onStart={() => setAuthModal('register')}
        />
        <SocialProofSection />
        <ChaptersVibeSection />
        <OnThisDayPreview />
        <FinalCTA
          isAuthenticated={isAuthenticated}
          onStart={() => setAuthModal('register')}
        />
      </main>

      <footer className="border-t border-edge px-4 py-8 text-center text-xs text-content-tertiary">
        TimeFlux &copy; {new Date().getFullYear()}
        {' · '}
        <a href="/blog" className="underline hover:text-content-secondary">
          Blog
        </a>
        {' · '}
        <a href="/terms" className="underline hover:text-content-secondary">
          Terms of Service
        </a>
        {' · '}
        <a href="/privacy" className="underline hover:text-content-secondary">
          Privacy Policy
        </a>
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
