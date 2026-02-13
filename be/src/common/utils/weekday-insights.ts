import { DateTime } from 'luxon';

/**
 * Weekday: 0=Monday … 6=Sunday (ISO weekday - 1)
 */

export interface DayWithScore {
  date: Date;
  score: number;
}

export interface DayWithActivity {
  date: Date;
  activityScore: number;
}

export interface WeekdayInsight {
  weekday: number;
  averageScore: number;
  sampleSize: number;
}

export interface ActivityInsight {
  weekday: number;
  averageActivityScore: number;
  sampleSize: number;
}

export interface VolatilityInsight {
  weekday: number;
  standardDeviation: number;
  sampleSize: number;
}

export interface RecoveryInsight {
  weekday: number;
  recoveryRate: number;
  recoveryEvents: number;
  totalOccurrences: number;
}

export interface BurnoutInsight {
  detected: boolean;
  type?: string;
  confidence?: number;
}

export interface WeekdayInsights {
  bestMoodDay: WeekdayInsight | null;
  worstMoodDay: WeekdayInsight | null;
  mostActiveDay: ActivityInsight | null;
  leastActiveDay: ActivityInsight | null;
  mostUnstableDay: VolatilityInsight | null;
  recoveryIndex: RecoveryInsight | null;
  burnoutPattern: BurnoutInsight | null;
}

const MIN_TOTAL_DAYS = 14;
const MIN_WEEKDAY_ENTRIES = 3;
const MIN_VOLATILITY_ENTRIES = 5;

function isoWeekday(date: Date, tz: string): number {
  // Returns 0=Monday … 6=Sunday
  return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(tz).weekday - 1;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function groupByWeekday<T extends { date: Date }>(
  items: T[],
  tz: string,
): Map<number, T[]> {
  const groups = new Map<number, T[]>();
  for (const item of items) {
    const wd = isoWeekday(item.date, tz);
    const arr = groups.get(wd);
    if (arr) arr.push(item);
    else groups.set(wd, [item]);
  }
  return groups;
}

export function computeBestWorstMoodDay(
  days: DayWithScore[],
  tz: string,
): { best: WeekdayInsight | null; worst: WeekdayInsight | null } {
  const groups = groupByWeekday(days, tz);
  const weekdayStats: WeekdayInsight[] = [];

  for (const [weekday, entries] of groups) {
    if (entries.length < MIN_WEEKDAY_ENTRIES) continue;
    const avg = entries.reduce((s, d) => s + d.score, 0) / entries.length;
    weekdayStats.push({
      weekday,
      averageScore: round1(avg),
      sampleSize: entries.length,
    });
  }

  if (weekdayStats.length === 0) return { best: null, worst: null };

  weekdayStats.sort((a, b) => b.averageScore - a.averageScore);
  return {
    best: weekdayStats[0],
    worst: weekdayStats[weekdayStats.length - 1],
  };
}

export function computeActivityDays(
  days: DayWithActivity[],
  tz: string,
): { most: ActivityInsight | null; least: ActivityInsight | null } {
  const groups = groupByWeekday(days, tz);
  const weekdayStats: ActivityInsight[] = [];

  for (const [weekday, entries] of groups) {
    if (entries.length < MIN_WEEKDAY_ENTRIES) continue;
    const avg =
      entries.reduce((s, d) => s + d.activityScore, 0) / entries.length;
    weekdayStats.push({
      weekday,
      averageActivityScore: round1(avg),
      sampleSize: entries.length,
    });
  }

  if (weekdayStats.length === 0) return { most: null, least: null };

  weekdayStats.sort(
    (a, b) => b.averageActivityScore - a.averageActivityScore,
  );
  return {
    most: weekdayStats[0],
    least: weekdayStats[weekdayStats.length - 1],
  };
}

export function computeMostUnstableDay(
  days: DayWithScore[],
  tz: string,
): VolatilityInsight | null {
  const groups = groupByWeekday(days, tz);
  let maxDev: VolatilityInsight | null = null;

  for (const [weekday, entries] of groups) {
    if (entries.length < MIN_VOLATILITY_ENTRIES) continue;

    const scores = entries.map((d) => d.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length;
    const sd = Math.sqrt(variance);

    const insight: VolatilityInsight = {
      weekday,
      standardDeviation: round2(sd),
      sampleSize: entries.length,
    };

    if (!maxDev || sd > maxDev.standardDeviation) {
      maxDev = insight;
    }
  }

  return maxDev;
}

export function computeRecoveryIndex(
  days: DayWithScore[],
  tz: string,
): RecoveryInsight | null {
  if (days.length < 2) return null;

  // Sort by date ascending
  const sorted = [...days].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Build recovery events per weekday
  const recoveryByWeekday = new Map<
    number,
    { events: number; total: number }
  >();

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Check consecutive days (difference should be ~1 day)
    const diffMs = curr.date.getTime() - prev.date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 0.5 || diffDays > 1.5) continue;

    const wd = isoWeekday(curr.date, tz);
    const entry = recoveryByWeekday.get(wd) ?? { events: 0, total: 0 };
    entry.total++;

    if (curr.score > prev.score && curr.score - prev.score >= 2) {
      entry.events++;
    }

    recoveryByWeekday.set(wd, entry);
  }

  let best: RecoveryInsight | null = null;

  for (const [weekday, data] of recoveryByWeekday) {
    if (data.total < MIN_WEEKDAY_ENTRIES) continue;
    const rate = data.events / data.total;
    const insight: RecoveryInsight = {
      weekday,
      recoveryRate: round2(rate),
      recoveryEvents: data.events,
      totalOccurrences: data.total,
    };

    if (!best || rate > best.recoveryRate) {
      best = insight;
    }
  }

  return best;
}

export function computeBurnoutPattern(
  days: DayWithScore[],
  tz: string,
  globalAverage: number,
): BurnoutInsight {
  const groups = groupByWeekday(days, tz);
  const mondayEntries = groups.get(0) ?? []; // 0 = Monday
  const fridayEntries = groups.get(4) ?? []; // 4 = Friday

  if (
    mondayEntries.length < MIN_WEEKDAY_ENTRIES ||
    fridayEntries.length < MIN_WEEKDAY_ENTRIES
  ) {
    return { detected: false };
  }

  const mondayAvg =
    mondayEntries.reduce((s, d) => s + d.score, 0) / mondayEntries.length;
  const fridayAvg =
    fridayEntries.reduce((s, d) => s + d.score, 0) / fridayEntries.length;

  const detected =
    mondayAvg < globalAverage - 1 && fridayAvg > globalAverage + 1;

  if (!detected) return { detected: false };

  // Confidence based on sample size and gap magnitude
  const sampleFactor = Math.min(
    1,
    (mondayEntries.length + fridayEntries.length) / 20,
  );
  const gapMagnitude = Math.min(
    1,
    ((globalAverage - mondayAvg - 1 + (fridayAvg - globalAverage - 1)) / 4),
  );
  const confidence = round2(sampleFactor * 0.6 + gapMagnitude * 0.4);

  return {
    detected: true,
    type: 'work_stress_pattern',
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

export function computeWeekdayInsights(
  daysWithScore: DayWithScore[],
  daysWithActivity: DayWithActivity[],
  globalAverage: number,
  tz: string,
): WeekdayInsights | null {
  if (daysWithScore.length < MIN_TOTAL_DAYS) return null;

  const { best: bestMoodDay, worst: worstMoodDay } = computeBestWorstMoodDay(
    daysWithScore,
    tz,
  );
  const { most: mostActiveDay, least: leastActiveDay } = computeActivityDays(
    daysWithActivity,
    tz,
  );
  const mostUnstableDay = computeMostUnstableDay(daysWithScore, tz);
  const recoveryIndex = computeRecoveryIndex(daysWithScore, tz);
  const burnoutPattern = computeBurnoutPattern(
    daysWithScore,
    tz,
    globalAverage,
  );

  return {
    bestMoodDay,
    worstMoodDay,
    mostActiveDay,
    leastActiveDay,
    mostUnstableDay,
    recoveryIndex,
    burnoutPattern,
  };
}
