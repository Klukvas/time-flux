import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';
import type { ThemePreference, ResolvedTheme } from '@lifespan/theme';

interface ThemeState {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  ready: boolean;
  setTheme: (theme: ThemePreference) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'lifespan_theme';

function getSystemTheme(): ResolvedTheme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  resolvedTheme: 'light',
  ready: false,

  setTheme: (theme) => {
    SecureStore.setItemAsync(STORAGE_KEY, theme);
    set({ theme, resolvedTheme: resolveTheme(theme) });
  },

  hydrate: async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      const theme: ThemePreference = (stored as ThemePreference) ?? 'system';
      set({ theme, resolvedTheme: resolveTheme(theme), ready: true });

      // Listen for system theme changes
      Appearance.addChangeListener(({ colorScheme }) => {
        const current = useThemeStore.getState();
        if (current.theme === 'system') {
          set({ resolvedTheme: colorScheme === 'dark' ? 'dark' : 'light' });
        }
      });
    } catch {
      set({ ready: true });
    }
  },
}));
