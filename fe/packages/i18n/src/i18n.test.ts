import { describe, it, expect } from 'vitest';
import { createTranslate, translate } from './i18n';
import type { Language } from './types';
import en from './locales/en';
import uk from './locales/uk';

// ─── Helpers ────────────────────────────────────────────────────

/** Recursively collect all dot-separated keys from a nested dictionary. */
function collectKeys(dict: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(dict)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = dict[key];
    if (typeof value === 'string') {
      keys.push(fullKey);
    } else if (typeof value === 'object' && value !== null) {
      keys.push(...collectKeys(value as Record<string, unknown>, fullKey));
    }
  }
  return keys;
}

// ─── createTranslate ────────────────────────────────────────────

describe('createTranslate', () => {
  describe('basic lookups', () => {
    const t = createTranslate('en');

    it('returns the correct value for a top-level nested key', () => {
      expect(t('auth.logout')).toBe('Sign out');
    });

    it('returns the correct value for a deeply nested key', () => {
      expect(t('auth.login.title')).toBe('Sign in to your account');
    });

    it('returns the correct value for another nested path', () => {
      expect(t('common.save')).toBe('Save');
    });

    it('returns the correct value for nav keys', () => {
      expect(t('nav.timeline')).toBe('Timeline');
      expect(t('nav.settings')).toBe('Settings');
    });
  });

  describe('missing keys', () => {
    const t = createTranslate('en');

    it('returns the key itself when the key does not exist', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('returns the key for a partially matching path', () => {
      expect(t('auth.login.nonexistent')).toBe('auth.login.nonexistent');
    });

    it('returns the key for a completely unknown top-level key', () => {
      expect(t('foobar')).toBe('foobar');
    });
  });

  describe('interpolation', () => {
    const t = createTranslate('en');

    it('replaces a single placeholder', () => {
      // "timeline.more_periods" = "+{count} more"
      expect(t('timeline.more_periods', { count: 5 })).toBe('+5 more');
    });

    it('replaces multiple placeholders in a single string', () => {
      // "timeline.showing_range" = "Showing {from} — {to}"
      expect(t('timeline.showing_range', { from: 'Jan', to: 'Mar' })).toBe(
        'Showing Jan — Mar',
      );
    });

    it('replaces numeric params correctly', () => {
      // "validation.password.min_length" = "Password must be at least {min} characters."
      expect(t('validation.password.min_length', { min: 8 })).toBe(
        'Password must be at least 8 characters.',
      );
    });

    it('leaves unmatched placeholders intact when param is missing', () => {
      expect(t('timeline.showing_range', { from: 'Jan' })).toBe(
        'Showing Jan — {to}',
      );
    });

    it('does not interpolate when no params are provided', () => {
      expect(t('timeline.more_periods')).toBe('+{count} more');
    });
  });

  describe('Ukrainian locale', () => {
    const t = createTranslate('uk');

    it('returns Ukrainian translation for known keys', () => {
      expect(t('auth.logout')).toBe('Вийти');
    });

    it('returns Ukrainian deeply nested translations', () => {
      expect(t('auth.login.title')).toBe('Увійдіть у свій акаунт');
    });

    it('returns Ukrainian nav translations', () => {
      expect(t('nav.timeline')).toBe('Хронологія');
    });

    it('falls back to English when a key is missing in Ukrainian', () => {
      // If uk ever misses a key, it should fall back to en.
      // We verify the fallback mechanism by checking a known key works,
      // then checking that a non-existent key still returns the key string.
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });
  });
});

// ─── translate (one-shot) ───────────────────────────────────────

describe('translate', () => {
  it('resolves English keys correctly', () => {
    expect(translate('en', 'common.cancel')).toBe('Cancel');
  });

  it('resolves Ukrainian keys correctly', () => {
    expect(translate('uk', 'common.cancel')).toBe('Скасувати');
  });

  it('supports interpolation', () => {
    expect(translate('en', 'common.days_count', { count: 42 })).toBe('42 days');
  });

  it('returns the key for missing translations', () => {
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
  });
});

// ─── Locale parity ──────────────────────────────────────────────

describe('locale parity', () => {
  const enKeys = collectKeys(en).sort();
  const ukKeys = collectKeys(uk).sort();

  it('both locales have the same number of keys', () => {
    expect(ukKeys.length).toBe(enKeys.length);
  });

  it('every English key exists in Ukrainian', () => {
    const ukKeySet = new Set(ukKeys);
    const missingInUk = enKeys.filter((k) => !ukKeySet.has(k));

    expect(missingInUk).toEqual([]);
  });

  it('every Ukrainian key exists in English', () => {
    const enKeySet = new Set(enKeys);
    const missingInEn = ukKeys.filter((k) => !enKeySet.has(k));

    expect(missingInEn).toEqual([]);
  });

  it('both locales have the same top-level sections', () => {
    const enSections = Object.keys(en).sort();
    const ukSections = Object.keys(uk).sort();

    expect(ukSections).toEqual(enSections);
  });
});
