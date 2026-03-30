import type { TimelineResponse } from '@timeflux/api';
import { groupTimelineHorizontal } from './timeline';
import type { HorizontalTimelineWeek } from './timeline';

/** Year card for the top-level zoom view. */
export interface YearCard {
  year: number;
  isCurrent: boolean;
}

/** Month card for the year drill-down view. */
export interface MonthCard {
  year: number;
  month: number; // 1-12
  key: string; // "2024-06"
  totalDays: number; // calendar days in the month
  isFuture: boolean; // entire month is in the future
  isBeforeStart: boolean; // entire month is before startDate
  isCurrent: boolean; // contains today
}

/** Build year cards from startDate to current year. */
export function buildYearCards(startDate: string, today: string): YearCard[] {
  const startYear = parseInt(startDate.slice(0, 4), 10);
  const currentYear = parseInt(today.slice(0, 4), 10);

  if (startYear > currentYear) return [];

  const cards: YearCard[] = [];
  for (let y = currentYear; y >= startYear; y--) {
    cards.push({
      year: y,
      isCurrent: y === currentYear,
    });
  }
  return cards;
}

/** Build month cards for a given year. */
export function buildMonthCards(
  year: number,
  startDate: string,
  today: string,
): MonthCard[] {
  const todayYear = parseInt(today.slice(0, 4), 10);
  const todayMonth = parseInt(today.slice(5, 7), 10);
  const startYear = parseInt(startDate.slice(0, 4), 10);
  const startMonth = parseInt(startDate.slice(5, 7), 10);

  const cards: MonthCard[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const daysInMonth = new Date(year, m, 0).getDate();
    const isFuture = year > todayYear || (year === todayYear && m > todayMonth);
    const isBeforeStart =
      year < startYear || (year === startYear && m < startMonth);
    const isCurrent = year === todayYear && m === todayMonth;

    cards.push({
      year,
      month: m,
      key,
      totalDays: daysInMonth,
      isFuture,
      isBeforeStart,
      isCurrent,
    });
  }
  return cards;
}

/** Group timeline data into week rows for a specific month.
 *  Delegates to groupTimelineHorizontal with month-scoped boundaries. */
export function groupTimelineByWeeksForMonth(
  data: TimelineResponse,
  year: number,
  month: number,
  startDate?: string,
): HorizontalTimelineWeek[] {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Clamp the response data to the month boundaries
  const scopedData: TimelineResponse = {
    from: monthStart,
    to: monthEnd,
    days: data.days.filter((d) => d.date >= monthStart && d.date <= monthEnd),
    periods: data.periods,
  };

  // Use startDate only if it falls within this month
  const effectiveStart =
    startDate && startDate >= monthStart && startDate <= monthEnd
      ? startDate
      : undefined;

  return groupTimelineHorizontal(scopedData, effectiveStart);
}
