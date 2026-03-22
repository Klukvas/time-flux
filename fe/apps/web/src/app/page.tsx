'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { LandingHeader } from '@/components/landing/landing-header';
import { HeroSection } from '@/components/landing/hero-section';
import {
  StatsSection,
  FeaturesSection,
  ChaptersSection,
  MemoriesSection,
  InsightsSection,
  PricingSection,
  FinalCTA,
  LandingFooter,
} from '@/components/landing/landing-sections';

function SectionDivider() {
  return (
    <div
      className="h-px w-full"
      style={{
        background:
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
      }}
    />
  );
}

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
      <div
        className="flex h-dvh items-center justify-center"
        style={{ background: '#080C14' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: '#38BDF8', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const onStart = () => setAuthModal('register');

  return (
    <div
      style={{
        background: '#080C14',
        color: '#EFF2F7',
        fontFamily: "'DM Sans', sans-serif",
        minHeight: '100dvh',
      }}
    >
      <LandingHeader
        isAuthenticated={isAuthenticated}
        onLogin={() => setAuthModal('login')}
        onRegister={onStart}
      />

      <main>
        <HeroSection isAuthenticated={isAuthenticated} onStart={onStart} />
        <StatsSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <ChaptersSection />
        <SectionDivider />
        <MemoriesSection onStart={onStart} />
        <InsightsSection />
        <SectionDivider />
        <PricingSection onStart={onStart} />
        <FinalCTA isAuthenticated={isAuthenticated} onStart={onStart} />
      </main>

      <LandingFooter />

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
