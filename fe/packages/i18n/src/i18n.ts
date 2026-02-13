import type { TranslationDictionary, FlatTranslations, Language, TranslateFunction } from './types';
import { DEFAULT_LANGUAGE } from './types';
import en from './locales/en';
import uk from './locales/uk';

const dictionaries: Record<Language, TranslationDictionary> = { en, uk };

/** Flatten a nested dictionary into dot-separated keys. */
function flatten(dict: TranslationDictionary, prefix = ''): FlatTranslations {
  const result: FlatTranslations = {};
  for (const key of Object.keys(dict)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = dict[key];
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else {
      Object.assign(result, flatten(value, fullKey));
    }
  }
  return result;
}

/** Pre-computed flat translations per language for O(1) lookups. */
const flatCache = new Map<Language, FlatTranslations>();

function getFlat(language: Language): FlatTranslations {
  let flat = flatCache.get(language);
  if (!flat) {
    flat = flatten(dictionaries[language]);
    flatCache.set(language, flat);
  }
  return flat;
}

/** Fallback flat translations (English). */
function getFallback(): FlatTranslations {
  return getFlat(DEFAULT_LANGUAGE);
}

/**
 * Interpolate `{param}` placeholders in a string.
 *
 * @example
 * interpolate("Password must be at least {min} characters.", { min: 8 })
 * // → "Password must be at least 8 characters."
 */
function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    return key in params ? String(params[key]) : match;
  });
}

/**
 * Create a translate function for a given language.
 * Framework-agnostic — no React dependency.
 */
export function createTranslate(language: Language): TranslateFunction {
  const flat = getFlat(language);
  const fallback = language !== DEFAULT_LANGUAGE ? getFallback() : flat;

  return (key: string, params?: Record<string, string | number>): string => {
    const template = flat[key] ?? fallback[key] ?? key;
    return params ? interpolate(template, params) : template;
  };
}

/**
 * One-shot translate: resolve a key for a given language.
 * Use `createTranslate` for repeated lookups in the same language.
 */
export function translate(language: Language, key: string, params?: Record<string, string | number>): string {
  return createTranslate(language)(key, params);
}
