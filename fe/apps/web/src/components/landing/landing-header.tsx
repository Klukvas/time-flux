'use client';

import { useTranslation } from '@timeflux/hooks';
import { useThemeStore } from '@/stores/theme-store';
import { useLanguageStore } from '@/stores/language-store';
import type { ThemePreference } from '@timeflux/theme';

const THEME_OPTIONS: { value: ThemePreference; icon: string }[] = [
  { value: 'light', icon: '☀️' },
  { value: 'dark', icon: '🌙' },
  { value: 'system', icon: '💻' },
];

interface LandingHeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingHeader({
  isAuthenticated,
  onLogin,
  onRegister,
}: LandingHeaderProps) {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <header className="sticky top-0 z-50 border-b border-edge/50 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo + nav */}
        <div className="flex items-center gap-4">
          <a href="/" className="text-xl font-bold text-accent">
            TimeFlux
          </a>
          <a
            href="/blog"
            className="text-sm font-medium text-content-secondary hover:text-content transition-colors"
          >
            Blog
          </a>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language switcher */}
          <div className="flex rounded-lg border border-edge bg-surface-secondary p-0.5">
            {(['en', 'uk'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  language === lang
                    ? 'bg-accent text-accent-text'
                    : 'text-content-secondary hover:text-content'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme switcher */}
          <div className="hidden rounded-lg border border-edge bg-surface-secondary p-0.5 sm:flex">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`rounded-md px-2 py-1 text-xs transition-colors ${
                  theme === opt.value
                    ? 'bg-accent text-accent-text'
                    : 'text-content-secondary hover:text-content'
                }`}
                title={opt.value}
              >
                {opt.icon}
              </button>
            ))}
          </div>

          {/* Auth buttons */}
          {isAuthenticated ? (
            <a
              href="/timeline"
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent-hover"
            >
              {t('landing.header.go_to_platform')}
            </a>
          ) : (
            <>
              <button
                onClick={onLogin}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-content-secondary transition-colors hover:text-content"
              >
                {t('landing.header.login')}
              </button>
              <button
                onClick={onRegister}
                className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-text transition-colors hover:bg-accent-hover"
              >
                {t('landing.header.register')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
