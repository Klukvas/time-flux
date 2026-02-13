'use client';

import { useTranslation, useTheme } from '@lifespan/hooks';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@lifespan/i18n';
import type { Language } from '@lifespan/i18n';
import type { ThemePreference } from '@lifespan/theme';
import { useAuthStore } from '@/stores/auth-store';
import { SegmentedControl } from '@/components/ui/segmented-control';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t('settings.theme_light') },
    { value: 'dark', label: t('settings.theme_dark') },
    { value: 'system', label: t('settings.theme_system') },
  ];

  const languageOptions: { value: Language; label: string }[] = SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang,
    label: LANGUAGE_NAMES[lang],
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-content">{t('settings.title')}</h1>

      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="rounded-xl border border-edge bg-surface-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-content">{t('settings.appearance')}</h2>
          <div className="space-y-5">
            {/* Theme */}
            <div>
              <p className="mb-1 text-sm font-medium text-content-secondary">{t('settings.theme')}</p>
              <p className="mb-3 text-xs text-content-tertiary">{t('settings.theme_description')}</p>
              <SegmentedControl value={theme} onChange={setTheme} options={themeOptions} />
            </div>

            {/* Language */}
            <div>
              <p className="mb-1 text-sm font-medium text-content-secondary">{t('settings.language')}</p>
              <p className="mb-3 text-xs text-content-tertiary">{t('settings.language_description')}</p>
              <SegmentedControl value={language} onChange={setLanguage} options={languageOptions} />
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="rounded-xl border border-edge bg-surface-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-content">{t('settings.account')}</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-content-secondary">{t('auth.email.label')}</p>
              <p className="text-content">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
