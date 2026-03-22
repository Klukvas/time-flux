import { describe, it, expect, vi, afterEach } from 'vitest';
import { DateTime, Settings } from 'luxon';
import {
  formatDate,
  formatDayShort,
  formatDayNumber,
  formatMonthYear,
  todayISO,
  isToday,
  isBeyondTomorrow,
  formatRelative,
  formatDateRange,
  durationInDays,
  getWeekStart,
  getMonthStart,
  getMonthEnd,
  addDays,
  addMonths,
  getYearMonth,
  formatMonthLabel,
} from './dates';

/**
 * Pin "now" so time-dependent tests are deterministic.
 * We pick Wednesday 2025-06-18 to have room on both sides of the week.
 */
const FIXED_NOW = DateTime.fromISO('2025-06-18T12:00:00.000');

afterEach(() => {
  Settings.now = () => Date.now(); // restore real clock
});

function pinNow() {
  Settings.now = () => FIXED_NOW.toMillis();
}

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('formats with default format (MMM d, yyyy)', () => {
    expect(formatDate('2025-01-15')).toBe('Jan 15, 2025');
  });

  it('formats with a custom format', () => {
    expect(formatDate('2025-06-01', 'yyyy/MM/dd')).toBe('2025/06/01');
  });

  it('formats with a custom locale', () => {
    const result = formatDate('2025-01-15', 'LLLL d, yyyy', 'de');
    // German month name for January
    expect(result).toContain('Januar');
  });

  it('handles end-of-year date', () => {
    expect(formatDate('2025-12-31')).toBe('Dec 31, 2025');
  });

  it('handles leap-year date', () => {
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
  });
});

// ---------------------------------------------------------------------------
// formatDayShort
// ---------------------------------------------------------------------------
describe('formatDayShort', () => {
  it('returns short day name', () => {
    // 2025-06-18 is a Wednesday
    expect(formatDayShort('2025-06-18')).toBe('Wed');
  });

  it('returns localized short day name', () => {
    const result = formatDayShort('2025-06-18', 'de');
    // German short for Wednesday — may be "Mi" or "Mi." depending on locale data
    expect(result.startsWith('Mi')).toBe(true);
  });

  it('handles Monday', () => {
    expect(formatDayShort('2025-06-16')).toBe('Mon');
  });

  it('handles Sunday', () => {
    expect(formatDayShort('2025-06-22')).toBe('Sun');
  });
});

// ---------------------------------------------------------------------------
// formatDayNumber
// ---------------------------------------------------------------------------
describe('formatDayNumber', () => {
  it('returns day without leading zero', () => {
    expect(formatDayNumber('2025-06-05')).toBe('5');
  });

  it('returns double-digit day', () => {
    expect(formatDayNumber('2025-06-18')).toBe('18');
  });

  it('returns 1 for first of month', () => {
    expect(formatDayNumber('2025-01-01')).toBe('1');
  });
});

// ---------------------------------------------------------------------------
// formatMonthYear
// ---------------------------------------------------------------------------
describe('formatMonthYear', () => {
  it('returns full month and year', () => {
    expect(formatMonthYear('2025-06-18')).toBe('June 2025');
  });

  it('returns localized month and year', () => {
    const result = formatMonthYear('2025-06-18', 'de');
    expect(result).toBe('Juni 2025');
  });

  it('handles January', () => {
    expect(formatMonthYear('2025-01-01')).toBe('January 2025');
  });
});

// ---------------------------------------------------------------------------
// todayISO
// ---------------------------------------------------------------------------
describe('todayISO', () => {
  it('returns pinned date as ISO string', () => {
    pinNow();
    expect(todayISO()).toBe('2025-06-18');
  });

  it('returns YYYY-MM-DD format', () => {
    pinNow();
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// isToday
// ---------------------------------------------------------------------------
describe('isToday', () => {
  it('returns true for today', () => {
    pinNow();
    expect(isToday('2025-06-18')).toBe(true);
  });

  it('returns false for yesterday', () => {
    pinNow();
    expect(isToday('2025-06-17')).toBe(false);
  });

  it('returns false for tomorrow', () => {
    pinNow();
    expect(isToday('2025-06-19')).toBe(false);
  });

  it('returns false for a completely different date', () => {
    pinNow();
    expect(isToday('2020-01-01')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isBeyondTomorrow
// ---------------------------------------------------------------------------
describe('isBeyondTomorrow', () => {
  it('returns false for today', () => {
    pinNow();
    expect(isBeyondTomorrow('2025-06-18')).toBe(false);
  });

  it('returns false for tomorrow', () => {
    pinNow();
    expect(isBeyondTomorrow('2025-06-19')).toBe(false);
  });

  it('returns true for the day after tomorrow', () => {
    pinNow();
    expect(isBeyondTomorrow('2025-06-20')).toBe(true);
  });

  it('returns true for a date far in the future', () => {
    pinNow();
    expect(isBeyondTomorrow('2030-01-01')).toBe(true);
  });

  it('returns false for a date in the past', () => {
    pinNow();
    expect(isBeyondTomorrow('2020-01-01')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatRelative
// ---------------------------------------------------------------------------
describe('formatRelative', () => {
  it('returns "Today" for the current date', () => {
    pinNow();
    expect(formatRelative('2025-06-18')).toBe('Today');
  });

  it('uses custom todayLabel when provided', () => {
    pinNow();
    expect(formatRelative('2025-06-18', undefined, 'Сегодня')).toBe('Сегодня');
  });

  it('returns a relative string for a past date', () => {
    pinNow();
    const result = formatRelative('2025-06-10');
    // Should include something like "8 days ago"
    expect(result).toContain('ago');
  });

  it('returns a relative string for a future date', () => {
    pinNow();
    const result = formatRelative('2025-06-25');
    // Should include something like "in 7 days"
    expect(result).toContain('in');
  });
});

// ---------------------------------------------------------------------------
// formatDateRange
// ---------------------------------------------------------------------------
describe('formatDateRange', () => {
  it('formats range with both start and end', () => {
    const result = formatDateRange('2025-01-01', '2025-06-30');
    expect(result).toBe('Jan 1, 2025 — Jun 30, 2025');
  });

  it('shows "Present" when end is null', () => {
    const result = formatDateRange('2025-01-01', null);
    expect(result).toBe('Jan 1, 2025 — Present');
  });

  it('uses custom presentLabel when end is null', () => {
    const result = formatDateRange('2025-01-01', null, undefined, 'Ongoing');
    expect(result).toBe('Jan 1, 2025 — Ongoing');
  });

  it('respects locale parameter', () => {
    const result = formatDateRange('2025-01-01', '2025-06-30', 'de');
    // German month abbreviations
    expect(result).toContain('Jan.');
    expect(result).toContain('Juni');
  });

  it('handles same start and end date', () => {
    const result = formatDateRange('2025-03-15', '2025-03-15');
    expect(result).toBe('Mar 15, 2025 — Mar 15, 2025');
  });
});

// ---------------------------------------------------------------------------
// durationInDays
// ---------------------------------------------------------------------------
describe('durationInDays', () => {
  it('returns correct number of days', () => {
    expect(durationInDays('2025-01-01', '2025-01-10')).toBe(9);
  });

  it('returns null when end is null', () => {
    expect(durationInDays('2025-01-01', null)).toBeNull();
  });

  it('returns 0 for same start and end', () => {
    expect(durationInDays('2025-06-18', '2025-06-18')).toBe(0);
  });

  it('returns 1 for consecutive days', () => {
    expect(durationInDays('2025-06-18', '2025-06-19')).toBe(1);
  });

  it('handles month boundaries', () => {
    expect(durationInDays('2025-01-28', '2025-02-04')).toBe(7);
  });

  it('handles year boundaries', () => {
    expect(durationInDays('2024-12-31', '2025-01-01')).toBe(1);
  });

  it('handles leap year', () => {
    expect(durationInDays('2024-02-28', '2024-03-01')).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getWeekStart
// ---------------------------------------------------------------------------
describe('getWeekStart', () => {
  it('returns Monday for a Wednesday', () => {
    // 2025-06-18 is Wednesday → week starts 2025-06-16 (Monday)
    expect(getWeekStart('2025-06-18')).toBe('2025-06-16');
  });

  it('returns same day when input is Monday', () => {
    expect(getWeekStart('2025-06-16')).toBe('2025-06-16');
  });

  it('returns previous Monday for Sunday', () => {
    // 2025-06-22 is Sunday → week started 2025-06-16 (Monday)
    expect(getWeekStart('2025-06-22')).toBe('2025-06-16');
  });

  it('handles month boundary (Sunday March 2)', () => {
    // 2025-03-02 is Sunday → week started Monday 2025-02-24
    expect(getWeekStart('2025-03-02')).toBe('2025-02-24');
  });

  it('handles year boundary', () => {
    // 2025-01-01 is Wednesday → week started 2024-12-30 (Monday)
    expect(getWeekStart('2025-01-01')).toBe('2024-12-30');
  });
});

// ---------------------------------------------------------------------------
// getMonthStart
// ---------------------------------------------------------------------------
describe('getMonthStart', () => {
  it('returns first day of the month', () => {
    expect(getMonthStart('2025-06-18')).toBe('2025-06-01');
  });

  it('returns same day when already first', () => {
    expect(getMonthStart('2025-06-01')).toBe('2025-06-01');
  });

  it('handles last day of month', () => {
    expect(getMonthStart('2025-01-31')).toBe('2025-01-01');
  });
});

// ---------------------------------------------------------------------------
// getMonthEnd
// ---------------------------------------------------------------------------
describe('getMonthEnd', () => {
  it('returns last day of the month', () => {
    expect(getMonthEnd('2025-06-18')).toBe('2025-06-30');
  });

  it('returns 28 for non-leap February', () => {
    expect(getMonthEnd('2025-02-01')).toBe('2025-02-28');
  });

  it('returns 29 for leap February', () => {
    expect(getMonthEnd('2024-02-01')).toBe('2024-02-29');
  });

  it('returns 31 for January', () => {
    expect(getMonthEnd('2025-01-15')).toBe('2025-01-31');
  });
});

// ---------------------------------------------------------------------------
// addDays
// ---------------------------------------------------------------------------
describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2025-06-18', 5)).toBe('2025-06-23');
  });

  it('subtracts with negative days', () => {
    expect(addDays('2025-06-18', -3)).toBe('2025-06-15');
  });

  it('adds zero days', () => {
    expect(addDays('2025-06-18', 0)).toBe('2025-06-18');
  });

  it('crosses month boundary', () => {
    expect(addDays('2025-01-30', 3)).toBe('2025-02-02');
  });

  it('crosses year boundary', () => {
    expect(addDays('2025-12-30', 5)).toBe('2026-01-04');
  });

  it('handles leap year crossing', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-28', 2)).toBe('2024-03-01');
  });
});

// ---------------------------------------------------------------------------
// addMonths
// ---------------------------------------------------------------------------
describe('addMonths', () => {
  it('adds positive months', () => {
    expect(addMonths('2025-01-15', 3)).toBe('2025-04-15');
  });

  it('subtracts with negative months', () => {
    expect(addMonths('2025-06-18', -2)).toBe('2025-04-18');
  });

  it('adds zero months', () => {
    expect(addMonths('2025-06-18', 0)).toBe('2025-06-18');
  });

  it('clamps day when target month is shorter (Jan 31 + 1 month)', () => {
    // Luxon clamps 31 Jan + 1 month to Feb 28 (non-leap year)
    expect(addMonths('2025-01-31', 1)).toBe('2025-02-28');
  });

  it('preserves Feb 29 → Mar 29 in leap year', () => {
    expect(addMonths('2024-02-29', 1)).toBe('2024-03-29');
  });

  it('crosses year boundary', () => {
    expect(addMonths('2025-11-15', 3)).toBe('2026-02-15');
  });
});

// ---------------------------------------------------------------------------
// getYearMonth
// ---------------------------------------------------------------------------
describe('getYearMonth', () => {
  it('returns correct year and month', () => {
    expect(getYearMonth('2025-06-18')).toEqual({ year: 2025, month: 6 });
  });

  it('returns month as 1-indexed (January = 1)', () => {
    expect(getYearMonth('2025-01-01')).toEqual({ year: 2025, month: 1 });
  });

  it('returns month 12 for December', () => {
    expect(getYearMonth('2025-12-31')).toEqual({ year: 2025, month: 12 });
  });
});

// ---------------------------------------------------------------------------
// formatMonthLabel
// ---------------------------------------------------------------------------
describe('formatMonthLabel', () => {
  it('returns "Month Year" format', () => {
    expect(formatMonthLabel('2025-06-18')).toBe('June 2025');
  });

  it('returns localized month label', () => {
    const result = formatMonthLabel('2025-06-18', 'de');
    expect(result).toBe('Juni 2025');
  });

  it('handles January', () => {
    expect(formatMonthLabel('2025-01-01')).toBe('January 2025');
  });

  it('handles December', () => {
    expect(formatMonthLabel('2025-12-31')).toBe('December 2025');
  });
});
