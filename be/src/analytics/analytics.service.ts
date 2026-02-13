import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AnalyticsRepository } from './analytics.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
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
  constructor(
    private readonly repo: AnalyticsRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.authRepository.findUserById(userId);
    return user?.timezone ?? 'UTC';
  }

  async getMoodOverview(userId: string) {
    const tz = await this.getUserTimezone(userId);

    const [
      dayStates,
      allDaysWithMood,
      categoriesWithPeriods,
      allDaysWithMedia,
      allEventPeriods,
    ] = await Promise.all([
      this.repo.findAllDayStates(userId),
      this.repo.findAllDaysWithMood(userId),
      this.repo.findAllCategoriesWithPeriods(userId),
      this.repo.findAllDaysWithMediaCount(userId),
      this.repo.findAllEventPeriods(userId),
    ]);

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

    // ── Best / worst category ──────────────────────────────────
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

      for (const cat of categoriesWithPeriods) {
        const dateRanges: { start: Date; end: Date }[] = [];
        for (const group of cat.eventGroups) {
          for (const p of group.periods) {
            dateRanges.push({ start: p.startDate, end: p.endDate ?? new Date() });
          }
        }
        if (dateRanges.length === 0) continue;

        // Filter days that fall within any of this category's period ranges
        const categoryDays = allDaysWithMood.filter((day) => {
          const dayDate = DateTime.fromJSDate(day.date, { zone: 'utc' })
            .setZone(tz)
            .startOf('day');

          return dateRanges.some((r) => {
            const start = DateTime.fromJSDate(r.start, { zone: 'utc' })
              .setZone(tz)
              .startOf('day');
            const end = DateTime.fromJSDate(r.end, { zone: 'utc' })
              .setZone(tz)
              .startOf('day');
            return dayDate >= start && dayDate <= end;
          });
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
        const score = day.dayState ? (scoreMap.get(day.dayState.id) ?? 0) : 0;
        return { date: dateStr, score };
      })
      .filter((t) => t.score > 0);

    // ── Weekday Insights ─────────────────────────────────────
    const daysWithScore: DayWithScore[] = allDaysWithMood
      .map((day) => {
        const score = day.dayState ? (scoreMap.get(day.dayState.id) ?? null) : null;
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
    const daysWithActivity: DayWithActivity[] = allDaysWithMedia
      .filter((day) => {
        const dayIso = DateTime.fromJSDate(day.date, { zone: 'utc' })
          .setZone(tz)
          .toISODate()!;
        return dayIso <= todayIso;
      })
      .map((day) => {
        const dayIso = DateTime.fromJSDate(day.date, { zone: 'utc' })
          .setZone(tz)
          .toISODate()!;

        const mediaCount = day._count.media;
        const periodsStarted = periodStartDates.get(dayIso) ?? 0;
        const periodsClosed = periodEndDates.get(dayIso) ?? 0;

        return {
          date: day.date,
          activityScore: mediaCount + periodsStarted + periodsClosed,
        };
      });

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
