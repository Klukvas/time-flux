import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AnalyticsRepository } from './analytics.repository.js';
import {
  buildMoodScoreMap,
  computeAverageMoodScore,
} from '../common/utils/mood-score.js';
import {
  computeWeekdayInsights,
  type DayWithScore,
  type DayWithActivity,
} from '../common/utils/weekday-insights.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  async getMoodOverview(
    userId: string,
    timezone: string,
    fullAccess: boolean = true,
  ) {
    const tz = timezone;

    // Basic queries needed for all tiers
    const basicQueries = [
      this.repo.findAllDayStates(userId),
      this.repo.findAllDaysWithMood(userId),
    ] as const;

    // Pro-only queries
    const proQueries = fullAccess
      ? ([
          this.repo.findAllCategoriesWithPeriods(userId),
          this.repo.findAllDaysWithMediaCount(userId),
          this.repo.findAllEventPeriods(userId),
        ] as const)
      : null;

    const [dayStates, allDaysWithMood] = await Promise.all(basicQueries);
    const [categoriesWithPeriods, allDaysWithMedia, allEventPeriods] =
      proQueries ? await Promise.all(proQueries) : [[], [], []];

    const scoreMap = buildMoodScoreMap(dayStates);

    // ── Total & average ────────────────────────────────────────
    const totalDaysWithMood = allDaysWithMood.length;
    const avgScore = computeAverageMoodScore(allDaysWithMood, scoreMap);

    // ── Distribution ───────────────────────────────────────────
    const counts = new Map<
      string,
      { name: string; color: string; count: number }
    >();
    for (const day of allDaysWithMood) {
      if (!day.dayState) continue;
      const key = day.dayState.id;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, {
          name: day.dayState.name,
          color: day.dayState.color,
          count: 1,
        });
      }
    }

    const moodDistribution = Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([moodId, m]) => ({
        moodId,
        moodName: m.name,
        color: m.color,
        count: m.count,
        percentage:
          totalDaysWithMood > 0
            ? Math.round((m.count / totalDaysWithMood) * 100)
            : 0,
      }));

    // ── PRO-only: Best / worst category, 30-day trend, weekday insights ──
    if (!fullAccess) {
      return {
        totalDaysWithMood,
        averageMoodScore: avgScore ?? 0,
        moodDistribution,
        bestCategory: null,
        worstCategory: null,
        trendLast30Days: [],
        weekdayInsights: null,
      };
    }

    let bestCategory: {
      categoryId: string;
      name: string;
      averageMoodScore: number;
    } | null = null;
    let worstCategory: {
      categoryId: string;
      name: string;
      averageMoodScore: number;
    } | null = null;

    if (categoriesWithPeriods.length > 0 && totalDaysWithMood > 0) {
      const categoryScores: {
        categoryId: string;
        name: string;
        averageMoodScore: number;
      }[] = [];

      // Pre-convert all day dates to ISO strings once (O(n))
      const dayIsoMap = new Map<(typeof allDaysWithMood)[number], string>();
      for (const day of allDaysWithMood) {
        dayIsoMap.set(
          day,
          DateTime.fromJSDate(day.date, { zone: 'utc' })
            .setZone(tz)
            .toISODate()!,
        );
      }

      for (const cat of categoriesWithPeriods) {
        // Pre-compute period boundaries as timestamps for fast range checks
        const periodBounds: { startMs: number; endMs: number }[] = [];
        for (const group of cat.eventGroups) {
          for (const p of group.periods) {
            const startMs = DateTime.fromJSDate(p.startDate, { zone: 'utc' })
              .setZone(tz)
              .startOf('day')
              .toMillis();
            const endMs = DateTime.fromJSDate(p.endDate ?? new Date(), {
              zone: 'utc',
            })
              .setZone(tz)
              .startOf('day')
              .toMillis();
            periodBounds.push({ startMs, endMs });
          }
        }
        if (periodBounds.length === 0) continue;

        // Point-in-interval check: day falls within any period's [start, end]
        const categoryDays = allDaysWithMood.filter((day) => {
          const dayMs = DateTime.fromJSDate(day.date, { zone: 'utc' })
            .setZone(tz)
            .startOf('day')
            .toMillis();
          return periodBounds.some(
            (b) => dayMs >= b.startMs && dayMs <= b.endMs,
          );
        });

        const avg = computeAverageMoodScore(categoryDays, scoreMap);
        if (avg !== null) {
          categoryScores.push({
            categoryId: cat.id,
            name: cat.name,
            averageMoodScore: avg,
          });
        }
      }

      if (categoryScores.length > 0) {
        categoryScores.sort((a, b) => b.averageMoodScore - a.averageMoodScore);
        bestCategory = categoryScores[0];
        worstCategory = categoryScores[categoryScores.length - 1];

        // If best and worst are the same category, set worst to null
        if (
          categoryScores.length === 1 ||
          bestCategory.categoryId === worstCategory.categoryId
        ) {
          worstCategory = null;
        }
      }
    }

    // ── 30-day trend ───────────────────────────────────────────
    const now = DateTime.now().setZone(tz);
    const thirtyDaysAgo = now.minus({ days: 30 }).startOf('day');
    const todayEnd = now.endOf('day');

    const fromDate = thirtyDaysAgo.toUTC().toJSDate();
    const toDate = todayEnd.toUTC().toJSDate();

    const recentDays = await this.repo.findDaysWithMoodInRange(
      userId,
      fromDate,
      toDate,
    );

    const trendLast30Days = recentDays
      .map((day) => {
        const dateStr = DateTime.fromJSDate(day.date, { zone: 'utc' })
          .setZone(tz)
          .toISODate()!;
        const score = day.dayState
          ? (scoreMap.get(day.dayState.id) ?? null)
          : null;
        return { date: dateStr, score };
      })
      .filter(
        (t): t is { date: string; score: number } =>
          t.score !== null && t.score > 0,
      );

    // ── Weekday Insights ─────────────────────────────────────
    const daysWithScore: DayWithScore[] = allDaysWithMood
      .map((day) => {
        const score = day.dayState
          ? (scoreMap.get(day.dayState.id) ?? null)
          : null;
        if (score === null || score < 0) return null;
        return { date: day.date, score };
      })
      .filter((d): d is DayWithScore => d !== null);

    // Build period start/end date sets for activity scoring
    const periodStartDates = new Map<string, number>();
    const periodEndDates = new Map<string, number>();
    for (const period of allEventPeriods) {
      const startKey = DateTime.fromJSDate(period.startDate, { zone: 'utc' })
        .setZone(tz)
        .toISODate()!;
      periodStartDates.set(startKey, (periodStartDates.get(startKey) ?? 0) + 1);

      if (period.endDate) {
        const endKey = DateTime.fromJSDate(period.endDate, { zone: 'utc' })
          .setZone(tz)
          .toISODate()!;
        periodEndDates.set(endKey, (periodEndDates.get(endKey) ?? 0) + 1);
      }
    }

    const todayIso = now.toISODate()!;
    const daysWithActivity: DayWithActivity[] = allDaysWithMedia.reduce<
      DayWithActivity[]
    >((acc, day) => {
      const dayIso = DateTime.fromJSDate(day.date, { zone: 'utc' })
        .setZone(tz)
        .toISODate()!;
      if (dayIso <= todayIso) {
        acc.push({
          date: day.date,
          activityScore:
            day._count.media +
            (periodStartDates.get(dayIso) ?? 0) +
            (periodEndDates.get(dayIso) ?? 0),
        });
      }
      return acc;
    }, []);

    const weekdayInsights = computeWeekdayInsights(
      daysWithScore,
      daysWithActivity,
      avgScore ?? 0,
      tz,
    );

    return {
      totalDaysWithMood,
      averageMoodScore: avgScore ?? 0,
      moodDistribution,
      bestCategory,
      worstCategory,
      trendLast30Days,
      weekdayInsights,
    };
  }
}
