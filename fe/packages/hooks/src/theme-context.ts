import { createContext, useContext } from 'react';
import type { ThemePreference, ResolvedTheme, ThemeTokens } from '@lifespan/theme';

export interface ThemeContextValue {
  /** User preference: 'light' | 'dark' | 'system' */
  theme: ThemePreference;
  /** Actual theme applied (never 'system') */
  resolvedTheme: ResolvedTheme;
  /** Current theme tokens */
  tokens: ThemeTokens;
  /** Update user preference */
  setTheme: (theme: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
