import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getLocales } from 'expo-localization';
import type { Language } from '@lifespan/i18n';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@lifespan/i18n';

interface LanguageState {
  language: Language;
  ready: boolean;
  setLanguage: (language: Language) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'lifespan_language';

function detectLanguage(): Language {
  try {
    const locales = getLocales();
    const deviceLang = locales[0]?.languageCode;
    if (deviceLang && SUPPORTED_LANGUAGES.includes(deviceLang as Language)) {
      return deviceLang as Language;
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_LANGUAGE;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: DEFAULT_LANGUAGE,
  ready: false,

  setLanguage: (language) => {
    SecureStore.setItemAsync(STORAGE_KEY, language);
    set({ language });
  },

  hydrate: async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      const language =
        stored && SUPPORTED_LANGUAGES.includes(stored as Language)
          ? (stored as Language)
          : detectLanguage();
      await SecureStore.setItemAsync(STORAGE_KEY, language);
      set({ language, ready: true });
    } catch {
      set({ ready: true });
    }
  },
}));
