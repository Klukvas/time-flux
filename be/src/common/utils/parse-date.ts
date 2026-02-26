import { DateTime } from 'luxon';
import { ValidationError } from '../errors/app.error.js';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse an ISO date string (YYYY-MM-DD) into a UTC Date at midnight.
 * Throws ValidationError if the string is not a valid calendar date.
 */
export function parseISODateToUTC(dateStr: string): Date {
  if (!ISO_DATE_REGEX.test(dateStr)) {
    throw new ValidationError({ date: `Invalid date format: ${dateStr}` });
  }

  const dt = DateTime.fromISO(dateStr, { zone: 'utc' });
  if (!dt.isValid) {
    throw new ValidationError({
      date: `Invalid date: ${dateStr} (${dt.invalidReason})`,
    });
  }

  return dt.startOf('day').toJSDate();
}
