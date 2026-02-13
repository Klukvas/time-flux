import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ApiProvider } from '@/lib/api-provider';
import { I18nProvider } from '@/lib/i18n-provider';
import { OnboardingProvider } from '@/lib/onboarding-provider';
import { ThemeProvider } from '@/lib/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  return (
    <ThemeProvider>
      <I18nProvider>
        <ApiProvider>
          <OnboardingProvider>
            <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false }} />
          </OnboardingProvider>
        </ApiProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
