'use client';

import Link from 'next/link';
import { useTranslation } from '@timeflux/hooks';
import { Logo } from '@/components/ui/logo';
import { useLanguageStore } from '@/stores/language-store';
import { useThemeStore } from '@/stores/theme-store';
import type { ThemePreference } from '@timeflux/theme';

const THEME_OPTIONS: { value: ThemePreference; icon: string }[] = [
  { value: 'light', icon: '\u2600\uFE0F' },
  { value: 'dark', icon: '\uD83C\uDF19' },
  { value: 'system', icon: '\uD83D\uDCBB' },
];

interface LegalPageLayoutProps {
  children: React.ReactNode;
}

export function LegalPageLayout({ children }: LegalPageLayoutProps) {
  const { t } = useTranslation();
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-edge/50 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/">
            <Logo variant="horizontal" />
          </Link>

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
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-edge px-4 py-8 text-center text-xs text-content-tertiary">
        TimeFlux &copy; {new Date().getFullYear()}
        {' \u00B7 '}
        <Link href="/blog" className="underline hover:text-content-secondary">
          Blog
        </Link>
        {' \u00B7 '}
        <Link href="/terms" className="underline hover:text-content-secondary">
          {t('legal.terms_title')}
        </Link>
        {' \u00B7 '}
        <Link
          href="/privacy"
          className="underline hover:text-content-secondary"
        >
          {t('legal.privacy_title')}
        </Link>
        {' \u00B7 '}
        <Link href="/refund" className="underline hover:text-content-secondary">
          {t('legal.refund_title')}
        </Link>
      </footer>
    </div>
  );
}
