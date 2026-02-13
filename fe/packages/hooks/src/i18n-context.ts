import { createContext, useContext } from 'react';
import type { Language, TranslateFunction } from '@lifespan/i18n';

export interface I18nContextValue {
  t: TranslateFunction;
  language: Language;
  setLanguage: (language: Language) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return ctx;
}
