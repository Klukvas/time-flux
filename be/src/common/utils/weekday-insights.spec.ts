import {
  computeBestWorstMoodDay,
  computeActivityDays,
  computeMostUnstableDay,
  computeRecoveryIndex,
  computeBurnoutPattern,
  computeWeekdayInsights,
  type DayWithScore,
  type DayWithActivity,
} from './weekday-insights.js';

// Helper: create a date for a specific weekday
// 2024-01-01 is a Monday
function dateForWeekday(weekday: number, weekIndex = 0): Date {
  // weekday: 0=Mon, 1=Tue, ..., 6=Sun
  const base = new Date('2024-01-01T00:00:00Z'); // Monday
  base.setUTCDate(base.getUTCDate() + weekday + weekIndex * 7);
  return base;
}

function makeDaysWithScore(
  weekday: number,
  scores: number[],
): DayWithScore[] {
  return scores.map((score, i) => ({
    date: dateForWeekday(weekday, i),
    score,
  }));
}

describe('computeBestWorstMoodDay', () => {
  it('returns null when not enough data', () => {
    const days: DayWithScore[] = [
      { date: dateForWeekday(0, 0), score: 8 },
      { date: dateForWeekday(0, 1), score: 7 },
    ];
    const result = computeBestWorstMoodDay(days, 'UTC');
    expect(result.best).toBeNull();
    expect(result.worst).toBeNull();
  });

  it('returns best and worst weekdays when enough data', () => {
    const days: DayWithScore[] = [
      // Mondays: avg 4
      ...makeDaysWithScore(0, [3, 4, 5]),
      // Saturdays: avg 8
      ...makeDaysWithScore(5, [7, 8, 9]),
    ];

    const result = computeBestWorstMoodDay(days, 'UTC');
    expect(result.best).not.toBeNull();
    expect(result.worst).not.toBeNull();
    expect(result.best!.weekday).toBe(5); // Saturday
    expect(result.best!.averageScore).toBe(8);
    expect(result.worst!.weekday).toBe(0); // Monday
    expect(result.worst!.averageScore).toBe(4);
  });

  it('requires minimum 3 entries per weekday', () => {
    const days: DayWithScore[] = [
      ...makeDaysWithScore(0, [3, 4, 5]), // 3 entries — valid
      ...makeDaysWithScore(1, [9, 10]), // 2 entries — not enough
    ];

    const result = computeBestWorstMoodDay(days, 'UTC');
    expect(result.best!.weekday).toBe(0);
    expect(result.worst!.weekday).toBe(0); // same day since only one valid
  });
});

describe('computeActivityDays', () => {
  it('returns null when not enough data', () => {
    const days: DayWithActivity[] = [
      { date: dateForWeekday(0, 0), activityScore: 3 },
    ];
    const result = computeActivityDays(days, 'UTC');
    expect(result.most).toBeNull();
    expect(result.least).toBeNull();
  });

  it('returns most and least active days', () => {
    const days: DayWithActivity[] = [
      // Mondays: avg activity 1
      ...[0, 1, 2].map((i) => ({
        date: dateForWeekday(0, i),
        activityScore: 1,
      })),
      // Fridays: avg activity 5
      ...[0, 1, 2].map((i) => ({
        date: dateForWeekday(4, i),
        activityScore: 5,
      })),
    ];

    const result = computeActivityDays(days, 'UTC');
    expect(result.most!.weekday).toBe(4); // Friday
    expect(result.most!.averageActivityScore).toBe(5);
    expect(result.least!.weekday).toBe(0); // Monday
    expect(result.least!.averageActivityScore).toBe(1);
  });
});

describe('computeMostUnstableDay', () => {
  it('returns null when not enough data (< 5 per weekday)', () => {
    const days: DayWithScore[] = makeDaysWithScore(0, [1, 10, 1, 10]);
    const result = computeMostUnstableDay(days, 'UTC');
    expect(result).toBeNull();
  });

  it('returns weekday with highest standard deviation', () => {
    const days: DayWithScore[] = [
      // Mondays: scores vary a lot
      ...makeDaysWithScore(0, [1, 10, 1, 10, 1]),
      // Tuesdays: scores are stable
      ...makeDaysWithScore(1, [5, 5, 5, 5, 5]),
    ];

    const result = computeMostUnstableDay(days, 'UTC');
    expect(result).not.toBeNull();
    expect(result!.weekday).toBe(0); // Monday — more volatile
    expect(result!.standardDeviation).toBeGreaterThan(0);
  });

  it('computes correct standard deviation', () => {
    // All same value → sd = 0
    const days: DayWithScore[] = makeDaysWithScore(0, [5, 5, 5, 5, 5]);
    const result = computeMostUnstableDay(days, 'UTC');
    expect(result!.standardDeviation).toBe(0);
  });
});

describe('computeRecoveryIndex', () => {
  it('returns null with fewer than 2 days', () => {
    const result = computeRecoveryIndex(
      [{ date: dateForWeekday(0, 0), score: 5 }],
      'UTC',
    );
    expect(result).toBeNull();
  });

  it('detects recovery events (score increase >= 2)', () => {
    // Create consecutive days: Mon low, Tue high (recovery)
    const days: DayWithScore[] = [];
    for (let week = 0; week < 4; week++) {
      days.push(
        { date: dateForWeekday(0, week), score: 3 }, // Monday low
        { date: dateForWeekday(1, week), score: 7 }, // Tuesday high (recovery!)
      );
    }

    const result = computeRecoveryIndex(days, 'UTC');
    expect(result).not.toBeNull();
    expect(result!.weekday).toBe(1); // Tuesday — recovery day
    expect(result!.recoveryRate).toBeGreaterThan(0);
    expect(result!.recoveryEvents).toBe(4);
  });

  it('does not count non-consecutive days', () => {
    const days: DayWithScore[] = [
      { date: dateForWeekday(0, 0), score: 2 },
      { date: dateForWeekday(0, 1), score: 10 }, // 7 days apart — not consecutive
    ];

    const result = computeRecoveryIndex(days, 'UTC');
    expect(result).toBeNull();
  });
});

describe('computeBurnoutPattern', () => {
  it('returns not detected when not enough data', () => {
    const result = computeBurnoutPattern([], 'UTC', 5);
    expect(result.detected).toBe(false);
  });

  it('detects work stress pattern', () => {
    const days: DayWithScore[] = [
      // Mondays: low (avg 2)
      ...makeDaysWithScore(0, [2, 2, 2]),
      // Fridays: high (avg 9)
      ...makeDaysWithScore(4, [9, 9, 9]),
    ];

    const globalAvg = 5;
    const result = computeBurnoutPattern(days, 'UTC', globalAvg);
    expect(result.detected).toBe(true);
    expect(result.type).toBe('work_stress_pattern');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('does not detect pattern when scores are similar', () => {
    const days: DayWithScore[] = [
      ...makeDaysWithScore(0, [5, 5, 5]),
      ...makeDaysWithScore(4, [5, 5, 5]),
    ];

    const result = computeBurnoutPattern(days, 'UTC', 5);
    expect(result.detected).toBe(false);
  });
});

describe('computeWeekdayInsights', () => {
  it('returns null when fewer than 14 days', () => {
    const days = makeDaysWithScore(0, [5, 5, 5, 5, 5]);
    const result = computeWeekdayInsights(days, [], 5, 'UTC');
    expect(result).toBeNull();
  });

  it('returns full insights object with enough data', () => {
    const daysWithScore: DayWithScore[] = [];
    const daysWithActivity: DayWithActivity[] = [];

    // Generate 3 weeks of data (21 days)
    for (let week = 0; week < 3; week++) {
      for (let wd = 0; wd < 7; wd++) {
        const d = dateForWeekday(wd, week);
        daysWithScore.push({ date: d, score: wd + 3 }); // 3-9 range
        daysWithActivity.push({ date: d, activityScore: wd });
      }
    }

    const result = computeWeekdayInsights(
      daysWithScore,
      daysWithActivity,
      6,
      'UTC',
    );

    expect(result).not.toBeNull();
    expect(result!.bestMoodDay).not.toBeNull();
    expect(result!.worstMoodDay).not.toBeNull();
    expect(result!.mostActiveDay).not.toBeNull();
    expect(result!.leastActiveDay).not.toBeNull();
    expect(result!.burnoutPattern).toBeDefined();
  });
});
