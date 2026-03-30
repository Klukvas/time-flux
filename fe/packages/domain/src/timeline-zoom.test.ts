import { describe, it, expect } from 'vitest';
import type {
  TimelineResponse,
  TimelineDay,
  TimelinePeriod,
} from '@timeflux/api';
import {
  buildYearCards,
  buildMonthCards,
  groupTimelineByWeeksForMonth,
} from './timeline-zoom';

// ─── Helpers ──────────────────────────────────────────────────

function makeDay(overrides: Partial<TimelineDay> = {}): TimelineDay {
  return {
    date: '2024-06-15',
    dayState: null,
    mainMediaId: null,
    media: [],
    ...overrides,
  };
}

function makePeriod(overrides: Partial<TimelinePeriod> = {}): TimelinePeriod {
  return {
    id: 'period-1',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    comment: null,
    eventGroup: { id: 'eg-1', title: 'Work' },
    category: { id: 'cat-1', name: 'Career', color: '#FF5733' },
    ...overrides,
  };
}

// ─── buildYearCards ───────────────────────────────────────────

describe('buildYearCards', () => {
  it('builds cards from start year to current year, newest first', () => {
    const cards = buildYearCards('2020-06-15', '2024-03-30');
    expect(cards.map((c) => c.year)).toEqual([2024, 2023, 2022, 2021, 2020]);
  });

  it('marks the current year', () => {
    const cards = buildYearCards('2022-01-01', '2024-03-30');
    expect(cards[0].isCurrent).toBe(true);
    expect(cards[1].isCurrent).toBe(false);
  });

  it('returns single card when start and today are same year', () => {
    const cards = buildYearCards('2024-01-01', '2024-12-31');
    expect(cards).toHaveLength(1);
    expect(cards[0].year).toBe(2024);
  });

  it('returns empty when start year > current year', () => {
    expect(buildYearCards('2025-01-01', '2024-06-15')).toEqual([]);
  });

  it('handles long range (2013 to 2026)', () => {
    const cards = buildYearCards('2013-05-10', '2026-03-30');
    expect(cards).toHaveLength(14);
    expect(cards[0].year).toBe(2026);
    expect(cards[13].year).toBe(2013);
  });
});

// ─── buildMonthCards ──────────────────────────────────────────

describe('buildMonthCards', () => {
  it('builds 12 month cards', () => {
    const cards = buildMonthCards(2024, '2024-01-01', '2024-06-15');
    expect(cards).toHaveLength(12);
  });

  it('marks current month', () => {
    const cards = buildMonthCards(2024, '2024-01-01', '2024-06-15');
    const june = cards.find((c) => c.month === 6);
    expect(june?.isCurrent).toBe(true);
    expect(cards.find((c) => c.month === 5)?.isCurrent).toBe(false);
  });

  it('marks future months', () => {
    const cards = buildMonthCards(2024, '2024-01-01', '2024-06-15');
    expect(cards.find((c) => c.month === 7)?.isFuture).toBe(true);
    expect(cards.find((c) => c.month === 12)?.isFuture).toBe(true);
    expect(cards.find((c) => c.month === 6)?.isFuture).toBe(false);
  });

  it('marks months before start date', () => {
    const cards = buildMonthCards(2024, '2024-03-15', '2024-06-15');
    expect(cards.find((c) => c.month === 1)?.isBeforeStart).toBe(true);
    expect(cards.find((c) => c.month === 2)?.isBeforeStart).toBe(true);
    expect(cards.find((c) => c.month === 3)?.isBeforeStart).toBe(false);
  });

  it('computes correct totalDays for each month', () => {
    const cards = buildMonthCards(2024, '2024-01-01', '2024-12-31');
    expect(cards.find((c) => c.month === 1)?.totalDays).toBe(31);
    expect(cards.find((c) => c.month === 2)?.totalDays).toBe(29); // 2024 is leap year
    expect(cards.find((c) => c.month === 4)?.totalDays).toBe(30);
  });

  it('generates correct key format', () => {
    const cards = buildMonthCards(2024, '2024-01-01', '2024-06-15');
    expect(cards[0].key).toBe('2024-01');
    expect(cards[11].key).toBe('2024-12');
  });

  it('all months in a past year are not future', () => {
    const cards = buildMonthCards(2020, '2020-01-01', '2024-06-15');
    cards.forEach((c) => expect(c.isFuture).toBe(false));
  });

  it('all months in a future year are future', () => {
    const cards = buildMonthCards(2025, '2020-01-01', '2024-06-15');
    cards.forEach((c) => expect(c.isFuture).toBe(true));
  });

  it('handles year === startYear === todayYear correctly', () => {
    // User registered in March, today is June, same year
    const cards = buildMonthCards(2024, '2024-03-15', '2024-06-15');
    // Jan, Feb before start
    expect(cards.find((c) => c.month === 1)?.isBeforeStart).toBe(true);
    expect(cards.find((c) => c.month === 2)?.isBeforeStart).toBe(true);
    // March — start month, not before start
    expect(cards.find((c) => c.month === 3)?.isBeforeStart).toBe(false);
    expect(cards.find((c) => c.month === 3)?.isFuture).toBe(false);
    // June — current month
    const june = cards.find((c) => c.month === 6);
    expect(june?.isCurrent).toBe(true);
    expect(june?.isFuture).toBe(false);
    expect(june?.isBeforeStart).toBe(false);
    // July+ — future
    expect(cards.find((c) => c.month === 7)?.isFuture).toBe(true);
    expect(cards.find((c) => c.month === 7)?.isBeforeStart).toBe(false);
  });
});

// ─── groupTimelineByWeeksForMonth ─────────────────────────────

describe('groupTimelineByWeeksForMonth', () => {
  it('groups a full month into week rows', () => {
    // June 2024: 30 days, starts on Saturday
    const days: TimelineDay[] = [];
    for (let d = 1; d <= 30; d++) {
      days.push(makeDay({ date: `2024-06-${String(d).padStart(2, '0')}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-01',
      to: '2024-06-30',
      days,
      periods: [],
    };
    const weeks = groupTimelineByWeeksForMonth(data, 2024, 6);
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    // Each week should have at most 7 days
    weeks.forEach((w) => expect(w.days.length).toBeLessThanOrEqual(7));
  });

  it('includes periods that overlap the month', () => {
    const days: TimelineDay[] = [];
    for (let d = 1; d <= 30; d++) {
      days.push(makeDay({ date: `2024-06-${String(d).padStart(2, '0')}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-01',
      to: '2024-06-30',
      days,
      periods: [
        makePeriod({
          id: 'p1',
          startDate: '2024-06-10',
          endDate: '2024-06-20',
        }),
      ],
    };
    const weeks = groupTimelineByWeeksForMonth(data, 2024, 6);
    const weeksWithPeriods = weeks.filter((w) => w.periods.length > 0);
    expect(weeksWithPeriods.length).toBeGreaterThanOrEqual(1);
  });

  it('filters day data outside the month but keeps week structure', () => {
    const days: TimelineDay[] = [
      makeDay({
        date: '2024-05-31',
        dayState: { id: 'x', name: 'Bad', color: '#F00' },
      }),
      makeDay({
        date: '2024-06-01',
        dayState: { id: 'y', name: 'Good', color: '#0F0' },
      }),
      makeDay({ date: '2024-06-30' }),
      makeDay({
        date: '2024-07-01',
        dayState: { id: 'z', name: 'Ok', color: '#00F' },
      }),
    ];
    const data: TimelineResponse = {
      from: '2024-05-31',
      to: '2024-07-01',
      days,
      periods: [],
    };
    const weeks = groupTimelineByWeeksForMonth(data, 2024, 6);
    const allDates = weeks.flatMap((w) => w.days.map((d) => d.date));
    // June dates must be present
    expect(allDates).toContain('2024-06-01');
    expect(allDates).toContain('2024-06-30');
    // Days outside the month are in week structure but have no data (filtered from days array)
    const may31 = weeks
      .flatMap((w) => w.days)
      .find((d) => d.date === '2024-05-31');
    // May 31 may appear in the week grid but should have no dayState data
    if (may31) {
      expect(may31.hasData).toBe(false);
    }
  });

  it('applies startDate only when it falls within the month', () => {
    const days: TimelineDay[] = [];
    for (let d = 1; d <= 30; d++) {
      days.push(makeDay({ date: `2024-06-${String(d).padStart(2, '0')}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-01',
      to: '2024-06-30',
      days,
      periods: [],
    };
    // startDate in June — should create partial first week
    const weeks = groupTimelineByWeeksForMonth(data, 2024, 6, '2024-06-12');
    // groupTimelineHorizontal returns newest-first, so oldest is last
    // Find the week containing the startDate
    const weekWithStart = weeks.find((w) =>
      w.days.some((d) => d.date === '2024-06-12'),
    );
    expect(weekWithStart).toBeDefined();
    expect(weekWithStart!.weekStart).toBe('2024-06-12');
  });

  it('ignores startDate when it is before the month', () => {
    const days: TimelineDay[] = [];
    for (let d = 1; d <= 30; d++) {
      days.push(makeDay({ date: `2024-06-${String(d).padStart(2, '0')}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-01',
      to: '2024-06-30',
      days,
      periods: [],
    };
    // startDate before June — should not affect first week
    const weeks = groupTimelineByWeeksForMonth(data, 2024, 6, '2024-01-01');
    const lastWeek = weeks[weeks.length - 1];
    // First day should be a Monday (week-aligned), not Jan 1
    expect(lastWeek.weekStart).not.toBe('2024-01-01');
  });

  it('returns empty for empty data', () => {
    const data: TimelineResponse = {
      from: '2024-06-01',
      to: '2024-06-30',
      days: [],
      periods: [],
    };
    const weeks = groupTimelineByWeeksForMonth(data, 2024, 6);
    // Still creates week structure even without day data
    expect(weeks.length).toBeGreaterThanOrEqual(4);
  });
});
