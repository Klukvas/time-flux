export type Language = 'en' | 'uk';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'uk'];

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  uk: 'Українська',
};

export const DEFAULT_LANGUAGE: Language = 'en';

/** Nested dictionary where leaves are strings. */
export type TranslationDictionary = {
  [key: string]: string | TranslationDictionary;
};

/** Flattened key → string map used at runtime. */
export type FlatTranslations = Record<string, string>;

export type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;
