'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation, useTheme } from '@lifespan/hooks';
import type { Language } from '@lifespan/i18n';
import { SUPPORTED_LANGUAGES } from '@lifespan/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { useSidebarStore } from '@/stores/sidebar-store';
import { NAV_ITEMS, THEME_OPTIONS } from './sidebar';
import type { NavItemKey } from './sidebar';

interface MobileDrawerProps {
  highlightedItem?: NavItemKey | null;
}

export function MobileDrawer({ highlightedItem }: MobileDrawerProps) {
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    if (mobileOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [mobileOpen, setMobileOpen]);

  return (
    <div className="md:hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-surface-card border-r border-edge transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-edge px-4">
          <h1 className="text-xl font-bold text-accent">TimeFlux</h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary hover:text-content-secondary transition-colors"
            aria-label="Close navigation"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const highlighted = highlightedItem === item.itemKey;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'text-content-secondary hover:bg-surface-secondary hover:text-content'
                } ${highlighted ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-card' : ''}`}
              >
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-edge px-4 py-3">
          {/* Theme switcher */}
          <div className="flex items-center gap-1">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                title={t(opt.titleKey)}
                className={`rounded-lg p-1.5 transition-colors ${
                  theme === opt.value
                    ? 'bg-accent/10 text-accent'
                    : 'text-content-tertiary hover:bg-surface-secondary hover:text-content-secondary'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={opt.icon} />
                </svg>
              </button>
            ))}
          </div>

          {/* Language switcher */}
          <div className="mt-2 flex items-center gap-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang as Language)}
                title={lang === 'en' ? 'English' : 'Українська'}
                className={`rounded-lg px-2 py-1 text-xs font-semibold uppercase transition-colors ${
                  language === lang
                    ? 'bg-accent/10 text-accent'
                    : 'text-content-tertiary hover:bg-surface-secondary hover:text-content-secondary'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* User + logout */}
          <div className="mt-3 border-t border-edge pt-3">
            <div className="mb-2 truncate text-sm text-content-secondary">{user?.email}</div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-content-secondary hover:bg-surface-secondary hover:text-content"
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
