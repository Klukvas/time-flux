import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';
import type { NativeEventSubscription } from 'react-native';
import type { ThemePreference, ResolvedTheme } from '@timeflux/theme';

interface ThemeState {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  ready: boolean;
  setTheme: (theme: ThemePreference) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'timeflux_theme';

let appearanceSubscription: NativeEventSubscription | null = null;

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

      // Remove previous listener before adding a new one
      if (appearanceSubscription) {
        appearanceSubscription.remove();
      }

      // Listen for system theme changes
      appearanceSubscription = Appearance.addChangeListener(
        ({ colorScheme }) => {
          const current = useThemeStore.getState();
          if (current.theme === 'system') {
            set({ resolvedTheme: colorScheme === 'dark' ? 'dark' : 'light' });
          }
        },
      );
    } catch {
      set({ ready: true });
    }
  },
}));
