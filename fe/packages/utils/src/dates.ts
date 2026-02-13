import { DateTime } from 'luxon';

/** Format an ISO date string (YYYY-MM-DD) for display. */
export function formatDate(isoDate: string, format: string = 'MMM d, yyyy'): string {
  return DateTime.fromISO(isoDate).toFormat(format);
}

/** Format an ISO date string as a short day label (e.g., "Mon"). */
export function formatDayShort(isoDate: string): string {
  return DateTime.fromISO(isoDate).toFormat('ccc');
}

/** Format an ISO date string as day number (e.g., "15"). */
export function formatDayNumber(isoDate: string): string {
  return DateTime.fromISO(isoDate).toFormat('d');
}

/** Format an ISO date string as month year (e.g., "January 2024"). */
export function formatMonthYear(isoDate: string): string {
  return DateTime.fromISO(isoDate).toFormat('LLLL yyyy');
}

/** Get today's date as YYYY-MM-DD. */
export function todayISO(): string {
  return DateTime.now().toISODate()!;
}

/** Check if a date string is today. */
export function isToday(isoDate: string): boolean {
  return DateTime.fromISO(isoDate).hasSame(DateTime.now(), 'day');
}

/** Check if a date is more than 1 day in the future (beyond tomorrow). */
export function isBeyondTomorrow(isoDate: string): boolean {
  const target = DateTime.fromISO(isoDate).startOf('day');
  const tomorrow = DateTime.now().startOf('day').plus({ days: 1 });
  return target > tomorrow;
}

/** Get a human-friendly relative description (e.g., "2 days ago", "ongoing"). */
export function formatRelative(isoDate: string): string {
  const dt = DateTime.fromISO(isoDate);
  const diff = dt.diffNow('days').days;
  if (Math.abs(diff) < 1) return 'Today';
  return dt.toRelative() ?? isoDate;
}

/** Format a date range for display. */
export function formatDateRange(start: string, end: string | null): string {
  const startFormatted = formatDate(start);
  if (!end) return `${startFormatted} — Present`;
  return `${startFormatted} — ${formatDate(end)}`;
}

/** Calculate duration in days between two dates. Returns null if end is null (ongoing). */
export function durationInDays(start: string, end: string | null): number | null {
  if (!end) return null;
  const startDt = DateTime.fromISO(start);
  const endDt = DateTime.fromISO(end);
  return Math.ceil(endDt.diff(startDt, 'days').days);
}

/** Get the Monday of the week containing the given date. */
export function getWeekStart(isoDate: string): string {
  return DateTime.fromISO(isoDate).startOf('week').toISODate()!;
}

/** Get the first day of the month containing the given date. */
export function getMonthStart(isoDate: string): string {
  return DateTime.fromISO(isoDate).startOf('month').toISODate()!;
}

/** Get the last day of the month containing the given date. */
export function getMonthEnd(isoDate: string): string {
  return DateTime.fromISO(isoDate).endOf('month').toISODate()!;
}

/** Add days to an ISO date string. */
export function addDays(isoDate: string, days: number): string {
  return DateTime.fromISO(isoDate).plus({ days }).toISODate()!;
}

/** Add months to an ISO date string. */
export function addMonths(isoDate: string, months: number): string {
  return DateTime.fromISO(isoDate).plus({ months }).toISODate()!;
}

/** Get year and month (1-12) from an ISO date string. */
export function getYearMonth(isoDate: string): { year: number; month: number } {
  const dt = DateTime.fromISO(isoDate);
  return { year: dt.year, month: dt.month };
}

/** Format a month label like "January 2024" from an ISO date. */
export function formatMonthLabel(isoDate: string): string {
  return DateTime.fromISO(isoDate).toFormat('LLLL yyyy');
}
