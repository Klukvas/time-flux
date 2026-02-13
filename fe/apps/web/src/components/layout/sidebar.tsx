'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation, useTheme } from '@lifespan/hooks';
import type { ThemePreference } from '@lifespan/theme';
import type { Language } from '@lifespan/i18n';
import { SUPPORTED_LANGUAGES } from '@lifespan/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { useSidebarStore } from '@/stores/sidebar-store';

/** Nav item key used for onboarding highlights. */
export type NavItemKey = 'insights' | 'timeline' | 'chapters' | 'categories' | 'day-states';

export const NAV_ITEMS: { href: string; labelKey: string; icon: string; itemKey: NavItemKey }[] = [
  { href: '/dashboard', labelKey: 'nav.insights', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', itemKey: 'insights' },
  { href: '/timeline', labelKey: 'nav.timeline', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', itemKey: 'timeline' },
  { href: '/chapters', labelKey: 'nav.chapters', icon: 'M13 10V3L4 14h7v7l9-11h-7z', itemKey: 'chapters' },
  { href: '/categories', labelKey: 'nav.categories', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z', itemKey: 'categories' },
  { href: '/day-states', labelKey: 'nav.day_states', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', itemKey: 'day-states' },
];

export const THEME_OPTIONS: { value: ThemePreference; icon: string; titleKey: string }[] = [
  { value: 'light', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', titleKey: 'settings.theme_light' },
  { value: 'dark', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', titleKey: 'settings.theme_dark' },
  { value: 'system', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', titleKey: 'settings.theme_system' },
];

interface SidebarProps {
  highlightedItem?: NavItemKey | null;
}

export function Sidebar({ highlightedItem }: SidebarProps) {
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const hydrate = useSidebarStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const renderNavItem = (item: typeof NAV_ITEMS[0]) => {
    const active = pathname.startsWith(item.href);
    const highlighted = highlightedItem === item.itemKey;

    return (
      <div key={item.href} className="relative">
        <Link
          href={item.href}
          title={collapsed ? t(item.labelKey) : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            collapsed ? 'justify-center' : ''
          } ${
            active
              ? 'bg-accent/10 text-accent'
              : 'text-content-secondary hover:bg-surface-secondary hover:text-content'
          } ${highlighted ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-card z-10 relative' : ''}`}
        >
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
          </svg>
          {!collapsed && <span>{t(item.labelKey)}</span>}
        </Link>
        {highlighted && !collapsed && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-20 whitespace-nowrap">
            <div className="rounded-lg bg-surface-card border border-accent/30 px-3 py-1.5 text-xs text-accent shadow-lg">
              {t(`onboarding.highlight_${item.itemKey === 'day-states' ? 'moods' : item.itemKey}`)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r border-edge bg-surface-card transition-[width] duration-200 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className={`flex h-16 items-center border-b border-edge ${collapsed ? 'justify-center px-2' : 'justify-between px-6'}`}>
        {!collapsed && <h1 className="text-xl font-bold text-accent">TimeFlux</h1>}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? t('nav.expand') : t('nav.collapse')}
          className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-secondary hover:text-content-secondary transition-colors"
        >
          <svg className={`h-5 w-5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 ${collapsed ? 'p-2' : 'p-4'}`}>
        {NAV_ITEMS.map(renderNavItem)}
      </nav>

      {/* Footer: theme, language, user, logout */}
      <div className={`border-t border-edge ${collapsed ? 'p-2' : 'px-4 py-3'}`}>
        {/* Theme switcher */}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'gap-1'}`}>
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
        <div className={`mt-2 flex items-center ${collapsed ? 'flex-col gap-1' : 'gap-1'}`}>
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

        {/* Divider + user + logout */}
        <div className="mt-3 border-t border-edge pt-3">
          {!collapsed && (
            <div className="mb-2 truncate text-sm text-content-secondary">{user?.email}</div>
          )}
          <button
            onClick={logout}
            title={collapsed ? t('auth.logout') : undefined}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-content-secondary hover:bg-surface-secondary hover:text-content ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && t('auth.logout')}
          </button>
        </div>
      </div>
    </aside>
  );
}
