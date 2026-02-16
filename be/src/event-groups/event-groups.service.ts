import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { EventGroupsRepository } from './event-groups.repository.js';
import { CategoriesRepository } from '../categories/categories.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { DaysRepository } from '../days/days.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEventGroupDto } from './dto/create-event-group.dto.js';
import { UpdateEventGroupDto } from './dto/update-event-group.dto.js';
import { CreateEventPeriodDto } from './dto/create-event-period.dto.js';
import { UpdateEventPeriodDto } from './dto/update-event-period.dto.js';
import { CloseEventPeriodDto } from './dto/close-event-period.dto.js';
import { EventGroupQueryDto } from './dto/event-group-query.dto.js';
import {
  EventGroupNotFoundError,
  EventGroupInUseError,
  EventPeriodNotFoundError,
  ActivePeriodExistsError,
  InvalidDateRangeError,
  CategoryNotFoundError,
  FutureDateError,
  EventAlreadyClosedError,
  PeriodOverlapError,
} from '../common/errors/app.error.js';
import {
  buildMoodScoreMap,
  computeAverageMoodScore,
} from '../common/utils/mood-score.js';

function parseDate(dateStr: string, timezone: string): Date {
  return DateTime.fromISO(dateStr, { zone: timezone }).startOf('day').toUTC().toJSDate();
}

function formatPeriod(period: any, timezone: string) {
  const startDate = DateTime.fromJSDate(period.startDate, { zone: 'utc' }).setZone(timezone).toISODate()!;
  const endDate = period.endDate
    ? DateTime.fromJSDate(period.endDate, { zone: 'utc' }).setZone(timezone).toISODate()!
    : null;
  return {
    id: period.id,
    startDate,
    endDate,
    comment: period.comment,
    createdAt: period.createdAt.toISOString(),
  };
}

function formatGroup(group: any, timezone: string) {
  return {
    id: group.id,
    title: group.title,
    description: group.description,
    category: group.category,
    periods: group.periods.map((p: any) => formatPeriod(p, timezone)),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

@Injectable()
export class EventGroupsService {
  private readonly logger = new Logger(EventGroupsService.name);

  constructor(
    private readonly repo: EventGroupsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly authRepository: AuthRepository,
    private readonly daysRepository: DaysRepository,
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
  ) {}

  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.authRepository.findUserById(userId);
    return user?.timezone ?? 'UTC';
  }

  private assertNotTooFarInFuture(dateStr: string, timezone: string) {
    const target = DateTime.fromISO(dateStr, { zone: timezone }).startOf('day');
    const tomorrow = DateTime.now().setZone(timezone).startOf('day').plus({ days: 1 });
    if (target > tomorrow) {
      throw new FutureDateError({ date: dateStr, maxDate: tomorrow.toISODate()! });
    }
  }

  /**
   * Check for overlapping closed periods in the same group.
   *
   * Two closed periods overlap when: newStart < existingEnd AND newEnd > existingStart
   * Boundary-sharing (e.g. existing 01–10 and new 10–20) is allowed because
   * strict inequality ensures touching edges do not count as overlap.
   */
  private async assertNoOverlap(
    groupId: string,
    startDate: Date,
    endDate: Date | null | undefined,
    excludePeriodId?: string,
    tx?: any,
  ) {
    if (!endDate) return; // Open-ended periods are handled by active-period check

    const closedPeriods = await this.repo.findClosedPeriodsForGroup(groupId, excludePeriodId, tx);
    for (const existing of closedPeriods) {
      const existingEnd = existing.endDate!;
      // Strict < / > ensures shared boundaries are allowed:
      // e.g. existing 01–10 + new 10–20 → 10 < 10 = false → no overlap
      if (startDate < existingEnd && endDate > existing.startDate) {
        throw new PeriodOverlapError({
          existingPeriodId: existing.id,
          existingStart: existing.startDate.toISOString(),
          existingEnd: existingEnd.toISOString(),
        });
      }
    }
  }

  // ─── EventGroup operations ────────────────────────────────

  async createGroup(userId: string, dto: CreateEventGroupDto) {
    const tz = await this.getUserTimezone(userId);

    const category = await this.categoriesRepository.findByIdAndUserId(dto.categoryId, userId);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    const group = await this.repo.createGroup({
      userId,
      categoryId: dto.categoryId,
      title: dto.title,
      description: dto.description,
    });

    return formatGroup(group, tz);
  }

  async updateGroup(userId: string, id: string, dto: UpdateEventGroupDto) {
    const tz = await this.getUserTimezone(userId);

    const group = await this.repo.findGroupByIdAndUserId(id, userId);
    if (!group) {
      throw new EventGroupNotFoundError();
    }

    if (dto.categoryId && dto.categoryId !== group.categoryId) {
      const category = await this.categoriesRepository.findByIdAndUserId(dto.categoryId, userId);
      if (!category) {
        throw new CategoryNotFoundError();
      }
    }

    const updated = await this.repo.updateGroup(id, {
      categoryId: dto.categoryId,
      title: dto.title,
      description: dto.description,
    });

    return formatGroup(updated, tz);
  }

  async deleteGroup(userId: string, id: string) {
    const group = await this.repo.findGroupByIdAndUserId(id, userId);
    if (!group) {
      throw new EventGroupNotFoundError();
    }

    const periodCount = await this.repo.countPeriodsForGroup(id);
    if (periodCount > 0) {
      throw new EventGroupInUseError({ groupId: id, periodCount });
    }

    await this.repo.deleteGroup(id);
  }

  async findAllGroups(userId: string, _query: EventGroupQueryDto) {
    const tz = await this.getUserTimezone(userId);
    const groups = await this.repo.findAllGroupsByUserId(userId);
    return groups.map((g) => formatGroup(g, tz));
  }

  async findGroupById(userId: string, id: string) {
    const tz = await this.getUserTimezone(userId);

    const group = await this.repo.findGroupByIdAndUserId(id, userId);
    if (!group) {
      throw new EventGroupNotFoundError();
    }

    return formatGroup(group, tz);
  }

  // ─── EventPeriod operations ───────────────────────────────

  async createPeriod(userId: string, groupId: string, dto: CreateEventPeriodDto) {
    const tz = await this.getUserTimezone(userId);

    const group = await this.repo.findGroupByIdAndUserId(groupId, userId);
    if (!group) {
      throw new EventGroupNotFoundError();
    }

    this.assertNotTooFarInFuture(dto.startDate, tz);
    const startDate = parseDate(dto.startDate, tz);
    const endDate = dto.endDate ? parseDate(dto.endDate, tz) : undefined;

    if (endDate && startDate > endDate) {
      throw new InvalidDateRangeError({ startDate: dto.startDate, endDate: dto.endDate });
    }

    const period = await this.prisma.$transaction(async (tx) => {
      if (!endDate) {
        const existingActive = await this.repo.findActivePeriodForGroup(groupId, undefined, tx);
        if (existingActive) {
          throw new ActivePeriodExistsError({ groupId });
        }
      }

      // Check for overlapping closed periods
      await this.assertNoOverlap(groupId, startDate, endDate, undefined, tx);

      return this.repo.createPeriod(
        { eventGroupId: groupId, startDate, endDate, comment: dto.comment },
        tx,
      );
    });

    // Re-fetch group to return updated data
    const updatedGroup = await this.repo.findGroupByIdAndUserId(groupId, userId);
    return formatGroup(updatedGroup!, tz);
  }

  async updatePeriod(userId: string, periodId: string, dto: UpdateEventPeriodDto) {
    const tz = await this.getUserTimezone(userId);

    const period = await this.repo.findPeriodByIdAndUserId(periodId, userId);
    if (!period) {
      throw new EventPeriodNotFoundError();
    }

    // Fix #16: validate future dates in update flow
    if (dto.startDate) {
      this.assertNotTooFarInFuture(dto.startDate, tz);
    }
    if (dto.endDate) {
      this.assertNotTooFarInFuture(dto.endDate, tz);
    }

    const newStartDate = dto.startDate ? parseDate(dto.startDate, tz) : period.startDate;
    const newEndDate = dto.endDate !== undefined
      ? (dto.endDate ? parseDate(dto.endDate, tz) : null)
      : period.endDate;

    if (newEndDate && newStartDate > newEndDate) {
      throw new InvalidDateRangeError({
        startDate: DateTime.fromJSDate(newStartDate, { zone: 'utc' }).setZone(tz).toISODate()!,
        endDate: DateTime.fromJSDate(newEndDate, { zone: 'utc' }).setZone(tz).toISODate()!,
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (!newEndDate) {
        const existingActive = await this.repo.findActivePeriodForGroup(
          period.eventGroupId,
          periodId,
          tx,
        );
        if (existingActive) {
          throw new ActivePeriodExistsError({ groupId: period.eventGroupId });
        }
      }

      // Check for overlapping closed periods
      await this.assertNoOverlap(period.eventGroupId, newStartDate, newEndDate, periodId, tx);

      return this.repo.updatePeriod(
        periodId,
        {
          startDate: dto.startDate ? newStartDate : undefined,
          endDate: dto.endDate !== undefined ? newEndDate : undefined,
          comment: dto.comment,
        },
        tx,
      );
    });

    // Re-fetch group to return updated data
    const group = await this.repo.findGroupByIdAndUserId(period.eventGroupId, userId);
    return formatGroup(group!, tz);
  }

  async closePeriod(userId: string, periodId: string, dto: CloseEventPeriodDto) {
    const tz = await this.getUserTimezone(userId);

    const period = await this.repo.findPeriodByIdAndUserId(periodId, userId);
    if (!period) {
      throw new EventPeriodNotFoundError();
    }

    if (period.endDate !== null) {
      throw new EventAlreadyClosedError();
    }

    const endDate = parseDate(dto.endDate, tz);
    if (period.startDate > endDate) {
      throw new InvalidDateRangeError({
        startDate: DateTime.fromJSDate(period.startDate, { zone: 'utc' }).setZone(tz).toISODate()!,
        endDate: dto.endDate,
      });
    }

    // Check for overlapping closed periods before closing
    await this.assertNoOverlap(period.eventGroupId, period.startDate, endDate, periodId);

    await this.repo.updatePeriod(periodId, { endDate });

    const group = await this.repo.findGroupByIdAndUserId(period.eventGroupId, userId);
    return formatGroup(group!, tz);
  }

  async deletePeriod(userId: string, periodId: string) {
    const period = await this.repo.findPeriodByIdAndUserId(periodId, userId);
    if (!period) {
      throw new EventPeriodNotFoundError();
    }

    await this.repo.deletePeriod(periodId);
  }

  // ─── Details endpoint ─────────────────────────────────────

  async getGroupDetails(userId: string, groupId: string) {
    const tz = await this.getUserTimezone(userId);

    const group = await this.repo.findGroupByIdAndUserId(groupId, userId);
    if (!group) {
      throw new EventGroupNotFoundError();
    }

    // Compute date ranges from all periods
    const dateRanges = group.periods.map((p: any) => ({
      start: p.startDate,
      end: p.endDate ?? new Date(),
    }));

    // Query days overlapping any period
    let allDays: any[] = [];
    if (dateRanges.length > 0) {
      const earliestStart = dateRanges.reduce(
        (min, r) => (r.start < min ? r.start : min),
        dateRanges[0].start,
      );
      const latestEnd = dateRanges.reduce(
        (max, r) => (r.end > max ? r.end : max),
        dateRanges[0].end,
      );

      // Convert to Date-only for days query
      const fromDate = new Date(
        DateTime.fromJSDate(earliestStart, { zone: 'utc' }).setZone(tz).toISODate()! + 'T00:00:00Z',
      );
      const toDate = new Date(
        DateTime.fromJSDate(latestEnd, { zone: 'utc' }).setZone(tz).toISODate()! + 'T00:00:00Z',
      );

      const days = await this.daysRepository.findByUserIdAndDateRange(userId, fromDate, toDate);

      // Filter to only days that overlap with at least one period
      allDays = days.filter((day: any) => {
        const dayTime = day.date.getTime();
        return dateRanges.some((r) => {
          const startTime = new Date(
            DateTime.fromJSDate(r.start, { zone: 'utc' }).setZone(tz).toISODate()! + 'T00:00:00Z',
          ).getTime();
          const endTime = new Date(
            DateTime.fromJSDate(r.end, { zone: 'utc' }).setZone(tz).toISODate()! + 'T00:00:00Z',
          ).getTime();
          return dayTime >= startTime && dayTime <= endTime;
        });
      });
    }

    // Aggregate mood stats
    const moodCounts = new Map<string, { name: string; color: string; count: number }>();
    let totalDays = 0;
    for (const day of allDays) {
      if (day.dayState) {
        const key = day.dayState.id;
        const existing = moodCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          moodCounts.set(key, { name: day.dayState.name, color: day.dayState.color, count: 1 });
        }
      }
      totalDays++;
    }

    const totalMoodDays = Array.from(moodCounts.values()).reduce((sum, m) => sum + m.count, 0);
    const moodStats = Array.from(moodCounts.values())
      .sort((a, b) => b.count - a.count)
      .map((m) => ({
        dayStateName: m.name,
        dayStateColor: m.color,
        count: m.count,
        percentage: totalMoodDays > 0 ? Math.round((m.count / totalMoodDays) * 100) : 0,
      }));

    // Collect media from overlapping days — try-catch to prevent S3 failures from crashing request
    const media: any[] = [];
    let totalMedia = 0;
    for (const day of allDays) {
      if (day.media) {
        for (const m of day.media) {
          totalMedia++;
          let url: string | null = null;
          try {
            url = await this.s3Service.getPresignedReadUrl(m.s3Key);
          } catch (err) {
            this.logger.warn(`Failed to generate presigned URL for s3Key=${m.s3Key}: ${err}`);
          }
          media.push({
            id: m.id,
            s3Key: m.s3Key,
            url,
            fileName: m.fileName,
            contentType: m.contentType,
            size: m.size,
            createdAt: m.createdAt.toISOString(),
          });
        }
      }
    }

    // ── Analytics ──────────────────────────────────────────────
    const dayStates = await this.prisma.dayState.findMany({
      where: { userId },
      select: { id: true, score: true },
      orderBy: { order: 'asc' },
    });
    const scoreMap = buildMoodScoreMap(dayStates);

    const analyticsMoodDistribution = Array.from(moodCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([moodId, m]) => ({
        moodId,
        moodName: m.name,
        color: m.color,
        count: m.count,
        percentage: totalMoodDays > 0 ? Math.round((m.count / totalMoodDays) * 100) : 0,
      }));

    // Density: for each period, count days that have mood or media
    const density = group.periods.map((p: any) => {
      const pStart = DateTime.fromJSDate(p.startDate, { zone: 'utc' }).setZone(tz).startOf('day');
      const pEnd = p.endDate
        ? DateTime.fromJSDate(p.endDate, { zone: 'utc' }).setZone(tz).startOf('day')
        : DateTime.now().setZone(tz).startOf('day');

      const activeDays = allDays.filter((day: any) => {
        const dayDt = DateTime.fromJSDate(day.date, { zone: 'utc' }).setZone(tz).startOf('day');
        if (dayDt < pStart || dayDt > pEnd) return false;
        return day.dayState || (day.media && day.media.length > 0);
      }).length;

      return {
        start: pStart.toISODate()!,
        end: pEnd.toISODate()!,
        activeDays,
      };
    });

    const analytics = {
      totalPeriods: group.periods.length,
      totalDays,
      totalMedia,
      averageMoodScore: computeAverageMoodScore(allDays, scoreMap),
      moodDistribution: analyticsMoodDistribution,
      density,
    };

    return {
      ...formatGroup(group, tz),
      moodStats,
      media,
      totalDays,
      analytics,
    };
  }
}
