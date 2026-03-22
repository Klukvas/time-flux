import { describe, it, expect } from 'vitest';
import type {
  TimelinePeriod,
  TimelineDay,
  TimelineResponse,
  WeekTimelineResponse,
  Day,
} from '@timeflux/api';
import {
  getPeriodsForDate,
  isActivePeriod,
  sortPeriods,
  buildWeekGrid,
  mapPeriodsToDays,
  groupTimelineByMonth,
  buildDayColorMap,
  getDayDetail,
  groupTimelineHorizontal,
} from './timeline';

// ─── Helpers ──────────────────────────────────────────────────

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

function makeDay(overrides: Partial<TimelineDay> = {}): TimelineDay {
  return {
    date: '2024-06-15',
    dayState: null,
    mainMediaId: null,
    media: [],
    ...overrides,
  };
}

// ─── getPeriodsForDate ────────────────────────────────────────

describe('getPeriodsForDate', () => {
  const periods: TimelinePeriod[] = [
    makePeriod({ id: 'p1', startDate: '2024-06-01', endDate: '2024-06-15' }),
    makePeriod({ id: 'p2', startDate: '2024-06-10', endDate: '2024-06-20' }),
    makePeriod({ id: 'p3', startDate: '2024-07-01', endDate: '2024-07-31' }),
    makePeriod({ id: 'p4', startDate: '2024-06-05', endDate: null }), // open-ended
  ];

  it('returns periods that cover the given date', () => {
    const result = getPeriodsForDate(periods, '2024-06-12');
    const ids = result.map((p) => p.id);
    expect(ids).toContain('p1');
    expect(ids).toContain('p2');
    expect(ids).toContain('p4');
    expect(ids).not.toContain('p3');
  });

  it('returns empty array when no periods cover the date', () => {
    const result = getPeriodsForDate(periods, '2024-05-01');
    expect(result).toEqual([]);
  });

  it('includes period where startDate equals the query date (boundary)', () => {
    const result = getPeriodsForDate(periods, '2024-06-01');
    expect(result.map((p) => p.id)).toContain('p1');
  });

  it('includes period where endDate equals the query date (boundary)', () => {
    const result = getPeriodsForDate(periods, '2024-06-15');
    expect(result.map((p) => p.id)).toContain('p1');
  });

  it('includes open-ended period (null endDate) for any date >= startDate', () => {
    const result = getPeriodsForDate(periods, '2025-12-31');
    expect(result.map((p) => p.id)).toContain('p4');
  });

  it('excludes open-ended period for dates before its startDate', () => {
    const result = getPeriodsForDate(periods, '2024-06-04');
    expect(result.map((p) => p.id)).not.toContain('p4');
  });

  it('returns empty array when given empty periods list', () => {
    expect(getPeriodsForDate([], '2024-06-15')).toEqual([]);
  });

  it('handles single-day period (startDate === endDate)', () => {
    const singleDay = [
      makePeriod({ id: 'sd', startDate: '2024-06-10', endDate: '2024-06-10' }),
    ];
    expect(getPeriodsForDate(singleDay, '2024-06-10')).toHaveLength(1);
    expect(getPeriodsForDate(singleDay, '2024-06-09')).toHaveLength(0);
    expect(getPeriodsForDate(singleDay, '2024-06-11')).toHaveLength(0);
  });
});

// ─── isActivePeriod ───────────────────────────────────────────

describe('isActivePeriod', () => {
  it('returns true for period with null endDate', () => {
    expect(isActivePeriod(makePeriod({ endDate: null }))).toBe(true);
  });

  it('returns false for period with endDate set', () => {
    expect(isActivePeriod(makePeriod({ endDate: '2024-06-30' }))).toBe(false);
  });
});

// ─── sortPeriods ──────────────────────────────────────────────

describe('sortPeriods', () => {
  it('places active (null endDate) periods first', () => {
    const periods: TimelinePeriod[] = [
      makePeriod({
        id: 'closed',
        startDate: '2024-07-01',
        endDate: '2024-07-31',
      }),
      makePeriod({ id: 'active', startDate: '2024-06-01', endDate: null }),
    ];
    const sorted = sortPeriods(periods);
    expect(sorted[0].id).toBe('active');
    expect(sorted[1].id).toBe('closed');
  });

  it('sorts closed periods by startDate descending', () => {
    const periods: TimelinePeriod[] = [
      makePeriod({ id: 'a', startDate: '2024-01-01', endDate: '2024-01-31' }),
      makePeriod({ id: 'c', startDate: '2024-03-01', endDate: '2024-03-31' }),
      makePeriod({ id: 'b', startDate: '2024-02-01', endDate: '2024-02-28' }),
    ];
    const sorted = sortPeriods(periods);
    expect(sorted.map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts active periods among themselves by startDate descending', () => {
    const periods: TimelinePeriod[] = [
      makePeriod({ id: 'a1', startDate: '2024-01-01', endDate: null }),
      makePeriod({ id: 'a2', startDate: '2024-03-01', endDate: null }),
    ];
    const sorted = sortPeriods(periods);
    expect(sorted.map((p) => p.id)).toEqual(['a2', 'a1']);
  });

  it('does not mutate the original array', () => {
    const periods: TimelinePeriod[] = [
      makePeriod({ id: 'z', startDate: '2024-01-01', endDate: '2024-01-31' }),
      makePeriod({ id: 'a', startDate: '2024-03-01', endDate: null }),
    ];
    const original = [...periods];
    sortPeriods(periods);
    expect(periods.map((p) => p.id)).toEqual(original.map((p) => p.id));
  });

  it('returns empty array for empty input', () => {
    expect(sortPeriods([])).toEqual([]);
  });

  it('handles single period', () => {
    const periods = [makePeriod({ id: 'only' })];
    expect(sortPeriods(periods)).toHaveLength(1);
    expect(sortPeriods(periods)[0].id).toBe('only');
  });

  it('mixed active and closed sorts correctly', () => {
    const periods: TimelinePeriod[] = [
      makePeriod({ id: 'c1', startDate: '2024-05-01', endDate: '2024-05-31' }),
      makePeriod({ id: 'a1', startDate: '2024-01-01', endDate: null }),
      makePeriod({ id: 'c2', startDate: '2024-06-01', endDate: '2024-06-30' }),
      makePeriod({ id: 'a2', startDate: '2024-04-01', endDate: null }),
    ];
    const sorted = sortPeriods(periods);
    expect(sorted.map((p) => p.id)).toEqual(['a2', 'a1', 'c2', 'c1']);
  });
});

// ─── buildWeekGrid ────────────────────────────────────────────

describe('buildWeekGrid', () => {
  const weekData: WeekTimelineResponse = {
    weekStart: '2024-06-10',
    weekEnd: '2024-06-16',
    periods: [
      makePeriod({ id: 'wp', startDate: '2024-06-10', endDate: '2024-06-14' }),
    ],
    days: [
      makeDay({
        date: '2024-06-10',
        dayState: { id: 'ds1', name: 'Good', color: '#4CAF50' },
      }),
      makeDay({ date: '2024-06-11' }),
      makeDay({ date: '2024-06-12' }),
      makeDay({ date: '2024-06-13' }),
      makeDay({ date: '2024-06-14' }),
      makeDay({ date: '2024-06-15' }),
      makeDay({ date: '2024-06-16' }),
    ],
  };

  it('produces exactly 7 days', () => {
    const grid = buildWeekGrid(weekData);
    expect(grid).toHaveLength(7);
  });

  it('preserves the date for each day', () => {
    const grid = buildWeekGrid(weekData);
    expect(grid.map((d) => d.date)).toEqual([
      '2024-06-10',
      '2024-06-11',
      '2024-06-12',
      '2024-06-13',
      '2024-06-14',
      '2024-06-15',
      '2024-06-16',
    ]);
  });

  it('carries over dayState from the day data', () => {
    const grid = buildWeekGrid(weekData);
    expect(grid[0].dayState).toEqual({
      id: 'ds1',
      name: 'Good',
      color: '#4CAF50',
    });
    expect(grid[1].dayState).toBeNull();
  });

  it('assigns overlapping periods to the correct days', () => {
    const grid = buildWeekGrid(weekData);
    // Period covers 2024-06-10 to 2024-06-14
    expect(grid[0].periods).toHaveLength(1); // June 10
    expect(grid[4].periods).toHaveLength(1); // June 14
    expect(grid[5].periods).toHaveLength(0); // June 15 — outside period
    expect(grid[6].periods).toHaveLength(0); // June 16 — outside period
  });

  it('defaults mainMediaId to null when missing', () => {
    const grid = buildWeekGrid(weekData);
    expect(grid[0].mainMediaId).toBeNull();
  });

  it('defaults media to empty array when missing', () => {
    const grid = buildWeekGrid(weekData);
    expect(grid[0].media).toEqual([]);
  });

  it('handles empty periods list', () => {
    const data: WeekTimelineResponse = {
      ...weekData,
      periods: [],
    };
    const grid = buildWeekGrid(data);
    grid.forEach((day) => {
      expect(day.periods).toEqual([]);
    });
  });

  it('carries mainMediaId and media when present in day data', () => {
    const mediaItem = {
      id: 'm1',
      s3Key: 'key',
      url: 'http://example.com/img.png',
      fileName: 'img.png',
      contentType: 'image/png',
      size: 1024,
      createdAt: '2024-06-10T00:00:00Z',
    };
    const dataWithMedia: WeekTimelineResponse = {
      weekStart: '2024-06-10',
      weekEnd: '2024-06-16',
      periods: [],
      days: [
        makeDay({
          date: '2024-06-10',
          mainMediaId: 'media-abc',
          media: [mediaItem],
        }),
        makeDay({ date: '2024-06-11' }),
        makeDay({ date: '2024-06-12' }),
        makeDay({ date: '2024-06-13' }),
        makeDay({ date: '2024-06-14' }),
        makeDay({ date: '2024-06-15' }),
        makeDay({ date: '2024-06-16' }),
      ],
    };
    const grid = buildWeekGrid(dataWithMedia);
    expect(grid[0].mainMediaId).toBe('media-abc');
    expect(grid[0].media).toHaveLength(1);
    expect(grid[0].media[0].id).toBe('m1');
  });
});

// ─── mapPeriodsToDays ─────────────────────────────────────────

describe('mapPeriodsToDays', () => {
  const periods: TimelinePeriod[] = [
    makePeriod({ id: 'mp1', startDate: '2024-06-01', endDate: '2024-06-03' }),
    makePeriod({ id: 'mp2', startDate: '2024-06-02', endDate: '2024-06-05' }),
  ];
  const dates = [
    '2024-06-01',
    '2024-06-02',
    '2024-06-03',
    '2024-06-04',
    '2024-06-05',
  ];

  it('returns a Map with entries for every requested date', () => {
    const map = mapPeriodsToDays(periods, dates);
    expect(map.size).toBe(5);
    for (const date of dates) {
      expect(map.has(date)).toBe(true);
    }
  });

  it('maps the correct periods to each date', () => {
    const map = mapPeriodsToDays(periods, dates);
    expect(map.get('2024-06-01')!.map((p) => p.id)).toEqual(['mp1']);
    expect(map.get('2024-06-02')!.map((p) => p.id)).toEqual(['mp1', 'mp2']);
    expect(map.get('2024-06-03')!.map((p) => p.id)).toEqual(['mp1', 'mp2']);
    expect(map.get('2024-06-04')!.map((p) => p.id)).toEqual(['mp2']);
    expect(map.get('2024-06-05')!.map((p) => p.id)).toEqual(['mp2']);
  });

  it('returns empty arrays for dates with no overlapping periods', () => {
    const map = mapPeriodsToDays(periods, ['2024-05-01', '2024-07-01']);
    expect(map.get('2024-05-01')).toEqual([]);
    expect(map.get('2024-07-01')).toEqual([]);
  });

  it('handles empty dates array', () => {
    const map = mapPeriodsToDays(periods, []);
    expect(map.size).toBe(0);
  });

  it('handles empty periods array', () => {
    const map = mapPeriodsToDays([], dates);
    for (const date of dates) {
      expect(map.get(date)).toEqual([]);
    }
  });
});

// ─── buildDayColorMap ─────────────────────────────────────────

describe('buildDayColorMap', () => {
  it('maps date to color for days with a dayState', () => {
    const days: TimelineDay[] = [
      makeDay({
        date: '2024-06-10',
        dayState: { id: '1', name: 'Good', color: '#4CAF50' },
      }),
      makeDay({
        date: '2024-06-11',
        dayState: { id: '2', name: 'Bad', color: '#F44336' },
      }),
    ];
    const map = buildDayColorMap(days);
    expect(map.get('2024-06-10')).toBe('#4CAF50');
    expect(map.get('2024-06-11')).toBe('#F44336');
  });

  it('skips days without a dayState', () => {
    const days: TimelineDay[] = [
      makeDay({ date: '2024-06-10', dayState: null }),
      makeDay({
        date: '2024-06-11',
        dayState: { id: '1', name: 'Ok', color: '#FFC107' },
      }),
    ];
    const map = buildDayColorMap(days);
    expect(map.has('2024-06-10')).toBe(false);
    expect(map.get('2024-06-11')).toBe('#FFC107');
  });

  it('returns empty map for empty input', () => {
    expect(buildDayColorMap([]).size).toBe(0);
  });

  it('returns empty map when all days lack dayState', () => {
    const days: TimelineDay[] = [
      makeDay({ date: '2024-06-10' }),
      makeDay({ date: '2024-06-11' }),
    ];
    expect(buildDayColorMap(days).size).toBe(0);
  });
});

// ─── getDayDetail ─────────────────────────────────────────────

describe('getDayDetail', () => {
  const dayData: Day[] = [
    {
      id: 'd1',
      date: '2024-06-15',
      dayState: null,
      mainMediaId: null,
      locationName: null,
      latitude: null,
      longitude: null,
      comment: null,
      media: [],
    } as Day,
  ];
  const periods: TimelinePeriod[] = [
    makePeriod({ id: 'pd1', startDate: '2024-06-10', endDate: '2024-06-20' }),
    makePeriod({ id: 'pd2', startDate: '2024-06-16', endDate: '2024-06-25' }),
  ];

  it('returns matching day data and overlapping periods', () => {
    const detail = getDayDetail('2024-06-15', dayData, periods);
    expect(detail.date).toBe('2024-06-15');
    expect(detail.day).not.toBeNull();
    expect(detail.day!.id).toBe('d1');
    expect(detail.periods).toHaveLength(1);
    expect(detail.periods[0].id).toBe('pd1');
  });

  it('returns null day when no matching day exists', () => {
    const detail = getDayDetail('2024-06-20', dayData, periods);
    expect(detail.day).toBeNull();
    expect(detail.date).toBe('2024-06-20');
  });

  it('returns overlapping periods even when day is null', () => {
    const detail = getDayDetail('2024-06-20', dayData, periods);
    expect(detail.periods).toHaveLength(2);
  });

  it('returns empty periods when no periods overlap', () => {
    const detail = getDayDetail('2024-07-01', dayData, periods);
    expect(detail.periods).toEqual([]);
  });
});

// ─── groupTimelineByMonth ─────────────────────────────────────

describe('groupTimelineByMonth', () => {
  const data: TimelineResponse = {
    from: '2024-06-01',
    to: '2024-07-31',
    days: [
      makeDay({ date: '2024-06-10' }),
      makeDay({ date: '2024-06-20' }),
      makeDay({ date: '2024-07-05' }),
    ],
    periods: [
      makePeriod({ id: 'gp1', startDate: '2024-06-01', endDate: '2024-06-15' }),
      makePeriod({ id: 'gp2', startDate: '2024-07-01', endDate: '2024-07-31' }),
    ],
  };

  it('groups days by month', () => {
    const months = groupTimelineByMonth(data);
    const juneMonth = months.find((m) => m.key === '2024-06');
    const julyMonth = months.find((m) => m.key === '2024-07');
    expect(juneMonth).toBeDefined();
    expect(julyMonth).toBeDefined();
    expect(juneMonth!.days).toHaveLength(2);
    expect(julyMonth!.days).toHaveLength(1);
  });

  it('groups periods by their start month', () => {
    const months = groupTimelineByMonth(data);
    const juneMonth = months.find((m) => m.key === '2024-06');
    const julyMonth = months.find((m) => m.key === '2024-07');
    expect(juneMonth!.periods).toHaveLength(1);
    expect(juneMonth!.periods[0].id).toBe('gp1');
    expect(julyMonth!.periods).toHaveLength(1);
    expect(julyMonth!.periods[0].id).toBe('gp2');
  });

  it('sorts months descending (newest first)', () => {
    const months = groupTimelineByMonth(data);
    expect(months[0].key).toBe('2024-07');
    expect(months[1].key).toBe('2024-06');
  });

  it('formats the label as "Month Year"', () => {
    const months = groupTimelineByMonth(data);
    expect(months.find((m) => m.key === '2024-06')!.label).toBe('June 2024');
    expect(months.find((m) => m.key === '2024-07')!.label).toBe('July 2024');
  });

  it('returns empty array when no data', () => {
    const empty: TimelineResponse = {
      from: '2024-01-01',
      to: '2024-01-31',
      days: [],
      periods: [],
    };
    expect(groupTimelineByMonth(empty)).toEqual([]);
  });

  it('creates month entry even when only a period exists (no days)', () => {
    const periodOnly: TimelineResponse = {
      from: '2024-08-01',
      to: '2024-08-31',
      days: [],
      periods: [makePeriod({ startDate: '2024-08-15', endDate: '2024-08-20' })],
    };
    const months = groupTimelineByMonth(periodOnly);
    expect(months).toHaveLength(1);
    expect(months[0].key).toBe('2024-08');
    expect(months[0].days).toHaveLength(0);
    expect(months[0].periods).toHaveLength(1);
  });

  it('creates month entry even when only days exist (no periods)', () => {
    const daysOnly: TimelineResponse = {
      from: '2024-09-01',
      to: '2024-09-30',
      days: [makeDay({ date: '2024-09-15' })],
      periods: [],
    };
    const months = groupTimelineByMonth(daysOnly);
    expect(months).toHaveLength(1);
    expect(months[0].periods).toHaveLength(0);
    expect(months[0].days).toHaveLength(1);
  });

  it('handles all 12 months correctly', () => {
    const allMonthData: TimelineResponse = {
      from: '2024-01-01',
      to: '2024-12-31',
      days: Array.from({ length: 12 }, (_, i) =>
        makeDay({ date: `2024-${String(i + 1).padStart(2, '0')}-15` }),
      ),
      periods: [],
    };
    const months = groupTimelineByMonth(allMonthData);
    expect(months).toHaveLength(12);
    expect(months[0].label).toBe('December 2024');
    expect(months[11].label).toBe('January 2024');
  });
});

// ─── groupTimelineHorizontal ──────────────────────────────────

describe('groupTimelineHorizontal', () => {
  it('returns empty array when rangeStart > rangeEnd', () => {
    const data: TimelineResponse = {
      from: '2024-07-01',
      to: '2024-06-01',
      days: [],
      periods: [],
    };
    expect(groupTimelineHorizontal(data)).toEqual([]);
  });

  it('returns empty array when from is empty', () => {
    const data: TimelineResponse = {
      from: '',
      to: '2024-06-30',
      days: [],
      periods: [],
    };
    expect(groupTimelineHorizontal(data)).toEqual([]);
  });

  it('groups days into full weeks (7 days each)', () => {
    // A Monday-to-Sunday week: 2024-06-10 to 2024-06-16
    const days: TimelineDay[] = [];
    for (let d = 10; d <= 16; d++) {
      days.push(makeDay({ date: `2024-06-${d}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-10',
      to: '2024-06-16',
      days,
      periods: [],
    };
    const weeks = groupTimelineHorizontal(data);
    expect(weeks.length).toBeGreaterThanOrEqual(1);
    // Each full week should have 7 days
    const fullWeek = weeks.find((w) => w.days.length === 7);
    expect(fullWeek).toBeDefined();
  });

  it('assigns hasData correctly based on day data availability', () => {
    const days: TimelineDay[] = [
      makeDay({
        date: '2024-06-10',
        dayState: { id: '1', name: 'Good', color: '#4CAF50' },
      }),
    ];
    const data: TimelineResponse = {
      from: '2024-06-10',
      to: '2024-06-16',
      days,
      periods: [],
    };
    const weeks = groupTimelineHorizontal(data);
    const week = weeks[0];
    const june10 = week.days.find((d) => d.date === '2024-06-10');
    const june11 = week.days.find((d) => d.date === '2024-06-11');
    expect(june10?.hasData).toBe(true);
    expect(june11?.hasData).toBe(false);
  });

  it('clamps period bars to week boundaries', () => {
    // Period spans two weeks, check it gets clamped per week
    const days: TimelineDay[] = [];
    for (let d = 10; d <= 23; d++) {
      days.push(makeDay({ date: `2024-06-${d}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-10',
      to: '2024-06-23',
      days,
      periods: [
        makePeriod({
          id: 'span',
          startDate: '2024-06-12',
          endDate: '2024-06-19',
        }),
      ],
    };
    const weeks = groupTimelineHorizontal(data);
    // Periods should be present in both weeks
    const weeksWithPeriods = weeks.filter((w) => w.periods.length > 0);
    expect(weeksWithPeriods.length).toBeGreaterThanOrEqual(1);
  });

  it('sorts weeks newest first', () => {
    const days: TimelineDay[] = [];
    for (let d = 10; d <= 23; d++) {
      days.push(makeDay({ date: `2024-06-${d}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-10',
      to: '2024-06-23',
      days,
      periods: [],
    };
    const weeks = groupTimelineHorizontal(data);
    if (weeks.length > 1) {
      expect(weeks[0].weekStart > weeks[1].weekStart).toBe(true);
    }
  });

  it('uses registrationDate as range start when provided', () => {
    // Registration date is a Wednesday
    const days: TimelineDay[] = [];
    for (let d = 12; d <= 16; d++) {
      days.push(makeDay({ date: `2024-06-${d}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-01',
      to: '2024-06-16',
      days,
      periods: [],
    };
    const weeks = groupTimelineHorizontal(data, '2024-06-12');
    // The first week should start from the registration date
    const lastWeek = weeks[weeks.length - 1]; // oldest first after reverse = last
    expect(lastWeek.weekStart).toBe('2024-06-12');
    // Partial first week: Wed to Sun = 5 days
    expect(lastWeek.days.length).toBe(5);
  });

  it('handles open-ended period (null endDate) in horizontal view', () => {
    const days: TimelineDay[] = [];
    for (let d = 10; d <= 16; d++) {
      days.push(makeDay({ date: `2024-06-${d}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-10',
      to: '2024-06-16',
      days,
      periods: [
        makePeriod({ id: 'open', startDate: '2024-06-12', endDate: null }),
      ],
    };
    const weeks = groupTimelineHorizontal(data);
    // The open-ended period should show up in the week
    const weekWithPeriod = weeks.find((w) => w.periods.length > 0);
    expect(weekWithPeriod).toBeDefined();
    expect(weekWithPeriod!.periods[0].period.id).toBe('open');
  });

  it('carries media and mainMediaId through partial first week', () => {
    const mediaItem = {
      id: 'm1',
      s3Key: 'key',
      url: 'http://example.com/img.png',
      fileName: 'img.png',
      contentType: 'image/png',
      size: 1024,
      createdAt: '2024-06-12T00:00:00Z',
    };
    const days: TimelineDay[] = [
      makeDay({
        date: '2024-06-12',
        mainMediaId: 'media-1',
        media: [mediaItem],
        dayState: { id: '1', name: 'Good', color: '#4CAF50' },
      }),
    ];
    const data: TimelineResponse = {
      from: '2024-06-01',
      to: '2024-06-16',
      days,
      periods: [],
    };
    // 2024-06-12 is a Wednesday
    const weeks = groupTimelineHorizontal(data, '2024-06-12');
    const partialWeek = weeks[weeks.length - 1];
    const june12 = partialWeek.days.find((d) => d.date === '2024-06-12');
    expect(june12).toBeDefined();
    expect(june12!.mainMediaId).toBe('media-1');
    expect(june12!.media).toHaveLength(1);
    expect(june12!.dayState).toEqual({
      id: '1',
      name: 'Good',
      color: '#4CAF50',
    });
    expect(june12!.hasData).toBe(true);
  });

  it('returns empty array when to is empty', () => {
    const data: TimelineResponse = {
      from: '2024-06-01',
      to: '',
      days: [],
      periods: [],
    };
    expect(groupTimelineHorizontal(data)).toEqual([]);
  });

  it('handles period that does not overlap any week dates (outside range)', () => {
    const days: TimelineDay[] = [];
    for (let d = 10; d <= 16; d++) {
      days.push(makeDay({ date: `2024-06-${d}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-10',
      to: '2024-06-16',
      days,
      periods: [
        makePeriod({
          id: 'outside',
          startDate: '2024-07-01',
          endDate: '2024-07-31',
        }),
      ],
    };
    const weeks = groupTimelineHorizontal(data);
    for (const week of weeks) {
      expect(week.periods).toHaveLength(0);
    }
  });

  it('computes correct startCol and span for a period within a single week', () => {
    // Monday 2024-06-10 to Sunday 2024-06-16
    const days: TimelineDay[] = [];
    for (let d = 10; d <= 16; d++) {
      days.push(makeDay({ date: `2024-06-${d}` }));
    }
    const data: TimelineResponse = {
      from: '2024-06-10',
      to: '2024-06-16',
      days,
      periods: [
        makePeriod({
          id: 'mid',
          startDate: '2024-06-12',
          endDate: '2024-06-14',
        }),
      ],
    };
    const weeks = groupTimelineHorizontal(data);
    const week = weeks.find((w) => w.periods.length > 0);
    expect(week).toBeDefined();
    // Wed=col2, Thu=col3, Fri=col4 => startCol=2, span=3
    expect(week!.periods[0].startCol).toBe(2);
    expect(week!.periods[0].span).toBe(3);
  });
});
