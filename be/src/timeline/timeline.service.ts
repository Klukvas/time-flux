import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { EventGroupsRepository } from '../event-groups/event-groups.repository.js';
import { DaysRepository } from '../days/days.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { TimelineQueryDto, WeekQueryDto } from './dto/timeline-query.dto.js';
import { InvalidDateRangeError } from '../common/errors/app.error.js';

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
    eventGroup: {
      id: period.eventGroup.id,
      title: period.eventGroup.title,
    },
    category: period.eventGroup.category,
  };
}

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(
    private readonly eventGroupsRepository: EventGroupsRepository,
    private readonly daysRepository: DaysRepository,
    private readonly authRepository: AuthRepository,
    private readonly s3Service: S3Service,
  ) {}

  private async formatMedia(m: any) {
    return {
      id: m.id,
      s3Key: m.s3Key,
      url: await this.s3Service.getPresignedReadUrl(m.s3Key),
      fileName: m.fileName,
      contentType: m.contentType,
      size: m.size,
      createdAt: m.createdAt.toISOString(),
    };
  }

  private async formatDay(day: any) {
    return {
      date: day.date.toISOString().split('T')[0],
      dayState: day.dayState,
      mainMediaId: day.mainMediaId ?? null,
      media: await Promise.all((day.media ?? []).map((m: any) => this.formatMedia(m))),
    };
  }

  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.authRepository.findUserById(userId);
    return user?.timezone ?? 'UTC';
  }

  async getTimeline(userId: string, query: TimelineQueryDto) {
    const tz = await this.getUserTimezone(userId);
    const now = DateTime.now().setZone(tz);
    const today = now.startOf('day');
    const oneYearAgo = today.minus({ years: 1 });

    const from = query.from
      ? DateTime.fromISO(query.from, { zone: tz }).startOf('day')
      : oneYearAgo;
    const to = query.to
      ? DateTime.fromISO(query.to, { zone: tz }).startOf('day')
      : today;

    if (from > to) {
      throw new InvalidDateRangeError({ from: query.from, to: query.to });
    }

    const fromUTC = from.toUTC().toJSDate();
    const toUTC = to.toUTC().toJSDate();
    const fromDate = new Date(from.toISODate()! + 'T00:00:00Z');
    const toDate = new Date(to.toISODate()! + 'T00:00:00Z');

    const [periods, days] = await Promise.all([
      this.eventGroupsRepository.findPeriodsWithDateRange(userId, fromUTC, toUTC),
      this.daysRepository.findByUserIdAndDateRange(userId, fromDate, toDate),
    ]);

    return {
      from: from.toISODate()!,
      to: to.toISODate()!,
      periods: periods.map((p) => formatPeriod(p, tz)),
      days: await Promise.all(days.map((d) => this.formatDay(d))),
    };
  }

  async getWeekTimeline(userId: string, query: WeekQueryDto) {
    const tz = await this.getUserTimezone(userId);
    const targetDate = DateTime.fromISO(query.date, { zone: tz });
    const monday = targetDate.startOf('week');
    const sunday = monday.plus({ days: 6 });

    const mondayUTC = monday.toUTC().toJSDate();
    const sundayUTC = sunday.toUTC().toJSDate();
    const mondayDate = new Date(monday.toISODate()! + 'T00:00:00Z');
    const sundayDate = new Date(sunday.toISODate()! + 'T00:00:00Z');

    const [periods, existingDays] = await Promise.all([
      this.eventGroupsRepository.findPeriodsWithDateRange(userId, mondayUTC, sundayUTC),
      this.daysRepository.findByUserIdAndDateRange(userId, mondayDate, sundayDate),
    ]);

    const dayMap = new Map<string, any>();
    for (const day of existingDays) {
      dayMap.set(day.date.toISOString().split('T')[0], day);
    }

    const days: any[] = [];
    for (let i = 0; i < 7; i++) {
      const d = monday.plus({ days: i });
      const dateStr = d.toISODate()!;
      const existing = dayMap.get(dateStr);
      days.push({
        date: dateStr,
        dayState: existing?.dayState ?? null,
        mainMediaId: existing?.mainMediaId ?? null,
        media: await Promise.all((existing?.media ?? []).map((m: any) => this.formatMedia(m))),
      });
    }

    return {
      weekStart: monday.toISODate()!,
      weekEnd: sunday.toISODate()!,
      periods: periods.map((p) => formatPeriod(p, tz)),
      days,
    };
  }
}
