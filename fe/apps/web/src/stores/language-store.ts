import { create } from 'zustand';
import type { Language } from '@lifespan/i18n';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@lifespan/i18n';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'lifespan_language';

function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  const browserLang = navigator.language.split('-')[0];
  return SUPPORTED_LANGUAGES.includes(browserLang as Language)
    ? (browserLang as Language)
    : DEFAULT_LANGUAGE;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: DEFAULT_LANGUAGE,

  setLanguage: (language) => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    set({ language });
  },

  hydrate: () => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    const language = stored && SUPPORTED_LANGUAGES.includes(stored) ? stored : detectLanguage();
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    set({ language });
  },
}));
