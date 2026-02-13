import { useEffect, useMemo } from 'react';
import { getThemeTokens } from '@lifespan/theme';
import { ThemeContext } from '@lifespan/hooks';
import { useThemeStore } from '@/stores/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const tokens = useMemo(() => getThemeTokens(resolvedTheme), [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
}
