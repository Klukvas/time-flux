import type { Day, TimelinePeriod, TimelineResponse, WeekTimelineResponse } from '@lifespan/api';

/** A single month grouping for vertical timeline display. */
export interface TimelineMonth {
  key: string; // "2024-06"
  label: string; // "June 2024"
  periods: TimelinePeriod[];
  days: Day[];
}

/** A week row for the horizontal timeline. */
export interface HorizontalTimelineWeek {
  weekStart: string;
  weekEnd: string;
  days: HorizontalTimelineDay[];
  periods: HorizontalTimelinePeriod[];
}

export interface HorizontalTimelineDay {
  date: string;
  dayNumber: number;
  dayState: Day['dayState'];
  mainMediaId: Day['mainMediaId'];
  media: Day['media'];
  hasData: boolean;
}

export interface HorizontalTimelinePeriod {
  period: TimelinePeriod;
  startCol: number; // 0-6 column index within the week
  span: number; // number of days the bar spans in this week
}

/** Full detail for a single day (used in Day Form). */
export interface DayDetail {
  date: string;
  day: Day | null;
  periods: TimelinePeriod[];
}

/** Group timeline data by month for vertical timeline rendering. */
export function groupTimelineByMonth(data: TimelineResponse): TimelineMonth[] {
  const monthMap = new Map<string, TimelineMonth>();

  // Group days by month
  for (const day of data.days) {
    const key = day.date.slice(0, 7); // "YYYY-MM"
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        key,
        label: formatMonthLabel(key),
        periods: [],
        days: [],
      });
    }
    monthMap.get(key)!.days.push(day);
  }

  // Group periods by their start month
  for (const period of data.periods) {
    const key = period.startDate.slice(0, 7);
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        key,
        label: formatMonthLabel(key),
        periods: [],
        days: [],
      });
    }
    monthMap.get(key)!.periods.push(period);
  }

  // Sort by month key descending (newest first)
  return Array.from(monthMap.values()).sort((a, b) => b.key.localeCompare(a.key));
}

/** Build a day-state color map from days: { "2024-06-15": "#4CAF50" } */
export function buildDayColorMap(days: Day[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const day of days) {
    if (day.dayState) {
      map.set(day.date, day.dayState.color);
    }
  }
  return map;
}

/** Check if a period is active (ongoing, no end date). */
export function isActivePeriod(period: TimelinePeriod): boolean {
  return period.endDate === null;
}

/** Sort periods: active first, then by start date descending. */
export function sortPeriods(periods: TimelinePeriod[]): TimelinePeriod[] {
  return [...periods].sort((a, b) => {
    if (isActivePeriod(a) && !isActivePeriod(b)) return -1;
    if (!isActivePeriod(a) && isActivePeriod(b)) return 1;
    return b.startDate.localeCompare(a.startDate);
  });
}

/** Get periods that overlap with a specific date in the week view. */
export function getPeriodsForDate(periods: TimelinePeriod[], date: string): TimelinePeriod[] {
  return periods.filter((p) => {
    const starts = p.startDate <= date;
    const ends = p.endDate === null || p.endDate >= date;
    return starts && ends;
  });
}

/** Build the week grid with day data and overlapping periods. */
export interface WeekDay {
  date: string;
  dayState: Day['dayState'];
  mainMediaId: Day['mainMediaId'];
  media: Day['media'];
  periods: TimelinePeriod[];
}

export function buildWeekGrid(data: WeekTimelineResponse): WeekDay[] {
  return data.days.map((day) => ({
    date: day.date,
    dayState: day.dayState,
    mainMediaId: day.mainMediaId ?? null,
    media: day.media ?? [],
    periods: getPeriodsForDate(data.periods, day.date),
  }));
}

/** Map periods to days: returns a Map<date, TimelinePeriod[]> for quick lookup. */
export function mapPeriodsToDays(periods: TimelinePeriod[], dates: string[]): Map<string, TimelinePeriod[]> {
  const map = new Map<string, TimelinePeriod[]>();
  for (const date of dates) {
    map.set(date, getPeriodsForDate(periods, date));
  }
  return map;
}

/** Group timeline data into horizontal week rows. */
export function groupTimelineHorizontal(data: TimelineResponse): HorizontalTimelineWeek[] {
  const dayMap = new Map<string, Day>();
  for (const d of data.days) dayMap.set(d.date, d);

  // Collect all unique dates from days and periods
  const allDates = new Set<string>();
  for (const d of data.days) allDates.add(d.date);
  for (const p of data.periods) {
    allDates.add(p.startDate);
    if (p.endDate) allDates.add(p.endDate);
  }

  if (allDates.size === 0) return [];

  // Find date range
  const sorted = Array.from(allDates).sort();
  const rangeStart = sorted[0];
  const rangeEnd = sorted[sorted.length - 1];

  // Expand to full weeks (Mon-Sun)
  const start = new Date(rangeStart);
  const startMon = new Date(start);
  startMon.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const end = new Date(rangeEnd);
  const endSun = new Date(end);
  endSun.setDate(end.getDate() + (7 - ((end.getDay() || 7))));

  const weeks: HorizontalTimelineWeek[] = [];
  const cursor = new Date(startMon);

  while (cursor <= endSun) {
    const weekDays: HorizontalTimelineDay[] = [];
    const weekDates: string[] = [];

    for (let d = 0; d < 7; d++) {
      const dateStr = formatISODate(cursor);
      weekDates.push(dateStr);
      const dayData = dayMap.get(dateStr);
      weekDays.push({
        date: dateStr,
        dayNumber: cursor.getDate(),
        dayState: dayData?.dayState ?? null,
        mainMediaId: dayData?.mainMediaId ?? null,
        media: dayData?.media ?? [],
        hasData: !!dayData,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];

    // Find periods that overlap this week
    const weekPeriods: HorizontalTimelinePeriod[] = [];
    for (const period of data.periods) {
      const periodStart = period.startDate;
      const periodEnd = period.endDate ?? rangeEnd; // ongoing = extend to range end

      // Check overlap with this week
      if (periodStart <= weekEnd && periodEnd >= weekStart) {
        const clampedStart = periodStart < weekStart ? weekStart : periodStart;
        const clampedEnd = periodEnd > weekEnd ? weekEnd : periodEnd;

        const startCol = weekDates.indexOf(clampedStart);
        const endCol = weekDates.indexOf(clampedEnd);

        if (startCol >= 0 && endCol >= 0) {
          weekPeriods.push({
            period,
            startCol,
            span: endCol - startCol + 1,
          });
        }
      }
    }

    weeks.push({
      weekStart,
      weekEnd,
      days: weekDays,
      periods: weekPeriods,
    });
  }

  // Sort newest first
  return weeks.reverse();
}

/** Get full detail for a single day: combines day data with overlapping periods. */
export function getDayDetail(
  date: string,
  days: Day[],
  periods: TimelinePeriod[],
): DayDetail {
  const day = days.find((d) => d.date === date) ?? null;
  return {
    date,
    day,
    periods: getPeriodsForDate(periods, date),
  };
}

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
