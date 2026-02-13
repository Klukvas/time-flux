'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { OnboardingContext, useApi } from '@lifespan/hooks';
import type { OnboardingStorage } from '@lifespan/hooks';
import { useAuthStore } from '@/stores/auth-store';

const LEGACY_KEY = 'lifespan_onboarding_completed';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setAuth = useAuthStore((s) => s.setAuth);

  const isCompleted = user?.onboardingCompleted ?? true;

  const markCompleted = useCallback(() => {
    if (!user || !token || !refreshToken) return;
    setAuth(token, refreshToken, { ...user, onboardingCompleted: true });
    api.auth.completeOnboarding().catch(() => {
      setAuth(token, refreshToken, { ...user, onboardingCompleted: false });
    });
  }, [api, user, token, refreshToken, setAuth]);

  // Migrate legacy localStorage flag to backend
  useEffect(() => {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === 'true' && user && !user.onboardingCompleted && token && refreshToken) {
      setAuth(token, refreshToken, { ...user, onboardingCompleted: true });
      api.auth.completeOnboarding().catch(() => {});
      localStorage.removeItem(LEGACY_KEY);
    } else if (legacy) {
      localStorage.removeItem(LEGACY_KEY);
    }
  }, [user, token, refreshToken, api, setAuth]);

  const value = useMemo<OnboardingStorage>(
    () => ({ isCompleted, markCompleted }),
    [isCompleted, markCompleted],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}
