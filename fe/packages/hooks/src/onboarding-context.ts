import { createContext, useContext } from 'react';

export interface OnboardingStorage {
  isCompleted: boolean;
  markCompleted: () => void;
}

export const OnboardingContext = createContext<OnboardingStorage | null>(null);

export function useOnboardingStorage(): OnboardingStorage {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboardingStorage must be used within an OnboardingProvider');
  }
  return ctx;
}
