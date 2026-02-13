'use client';

import { useEffect, useMemo } from 'react';
import { createTranslate } from '@lifespan/i18n';
import { I18nContext } from '@lifespan/hooks';
import { useLanguageStore } from '@/stores/language-store';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const hydrate = useLanguageStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const t = useMemo(() => createTranslate(language), [language]);

  return (
    <I18nContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}
