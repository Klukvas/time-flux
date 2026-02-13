import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MemoriesRepository } from './memories.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import type {
  ContextResponseDto,
  DayContextResponseDto,
  OnThisDayResponseDto,
  WeekContextResponseDto,
} from './dto/context-response.dto.js';
import { MemoryMode } from './dto/context-query.dto.js';

const INTERVALS: { type: 'months' | 'years'; value: number }[] = [
  { type: 'months', value: 1 },
  { type: 'months', value: 6 },
  { type: 'years', value: 1 },
];

function toUTCDate(isoDate: string): Date {
  return new Date(isoDate + 'T00:00:00Z');
}

function dayKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

@Injectable()
export class MemoriesService {
  constructor(
    private readonly memoriesRepository: MemoriesRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async getOnThisDay(
    userId: string,
    dateParam?: string,
  ): Promise<OnThisDayResponseDto> {
    const user = await this.authRepository.findUserById(userId);
    const tz = user?.timezone ?? 'UTC';

    const selectedDate = dateParam
      ? DateTime.fromISO(dateParam, { zone: tz })
      : DateTime.now().setZone(tz);

    if (!selectedDate.isValid) {
      throw new BadRequestException('Invalid date');
    }

    const { baseDate, memories } = await this.getDayContext(
      userId,
      selectedDate,
    );
    return { baseDate, memories };
  }

  async getContext(
    userId: string,
    mode: MemoryMode,
    dateParam: string,
  ): Promise<ContextResponseDto> {
    const user = await this.authRepository.findUserById(userId);
    const tz = user?.timezone ?? 'UTC';

    const selectedDate = DateTime.fromISO(dateParam, { zone: tz });
    if (!selectedDate.isValid) {
      throw new BadRequestException('Invalid date');
    }

    if (mode === MemoryMode.DAY) {
      return this.getDayContext(userId, selectedDate);
    }
    return this.getWeekContext(userId, selectedDate);
  }

  // ─── DAY MODE ──────────────────────────────────────────

  private async getDayContext(
    userId: string,
    selectedDate: DateTime,
  ): Promise<DayContextResponseDto> {
    const baseDateStr = selectedDate.toISODate()!;

    // Query 1: Check if selected day has content
    const hasContent = await this.memoriesRepository.findDayWithContent(
      userId,
      toUTCDate(baseDateStr),
    );

    if (!hasContent) {
      return { type: 'day', baseDate: baseDateStr, memories: [] };
    }

    // Compute 3 target dates
    const targets = INTERVALS.map((interval) => ({
      interval,
      dateStr: selectedDate.minus({ [interval.type]: interval.value }).toISODate()!,
    }));

    // Query 2: Fetch historical days
    const days = await this.memoriesRepository.findDaysByDates(
      userId,
      targets.map((t) => toUTCDate(t.dateStr)),
    );

    const dayMap = new Map<string, (typeof days)[number]>();
    for (const d of days) {
      dayMap.set(dayKey(d.date), d);
    }

    const memories = targets
      .map((target) => {
        const day = dayMap.get(target.dateStr);
        if (!day) return null;
        if (!day.dayStateId && day.media.length === 0) return null;
        return {
          interval: target.interval,
          date: target.dateStr,
          mood: day.dayState ?? null,
          mediaCount: day.media.length,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    return { type: 'day', baseDate: baseDateStr, memories };
  }

  // ─── WEEK MODE ─────────────────────────────────────────

  private async getWeekContext(
    userId: string,
    selectedDate: DateTime,
  ): Promise<WeekContextResponseDto> {
    // Compute current week boundaries (Monday–Sunday)
    const weekStart = selectedDate.startOf('week'); // Luxon: Monday
    const weekEnd = weekStart.plus({ days: 6 });

    const baseWeek = {
      start: weekStart.toISODate()!,
      end: weekEnd.toISODate()!,
    };

    // Query 1: Check if current week has content
    const hasContent = await this.memoriesRepository.hasContentInRange(
      userId,
      toUTCDate(baseWeek.start),
      toUTCDate(baseWeek.end),
    );

    if (!hasContent) {
      return { type: 'week', baseWeek, memories: [] };
    }

    // Compute historical week ranges
    const historicalWeeks = INTERVALS.map((interval) => {
      const histStart = weekStart.minus({ [interval.type]: interval.value });
      const histEnd = histStart.plus({ days: 6 });
      return {
        interval,
        start: histStart.toISODate()!,
        end: histEnd.toISODate()!,
      };
    });

    // Query 2: Single range query covering all historical weeks
    const allStarts = historicalWeeks.map((w) => w.start);
    const allEnds = historicalWeeks.map((w) => w.end);
    const minStart = allStarts.sort()[0];
    const maxEnd = allEnds.sort()[allEnds.length - 1];

    const days = await this.memoriesRepository.findDaysInRange(
      userId,
      toUTCDate(minStart),
      toUTCDate(maxEnd),
    );

    // Group results by interval week range
    const memories = historicalWeeks
      .map((hw) => {
        const daysInWeek = days.filter((d) => {
          const dk = dayKey(d.date);
          return dk >= hw.start && dk <= hw.end;
        });

        const activeDays = daysInWeek.filter(
          (d) => d.dayStateId || d.media.length > 0,
        );

        if (activeDays.length === 0) return null;

        const totalMedia = activeDays.reduce(
          (sum, d) => sum + d.media.length,
          0,
        );

        return {
          interval: hw.interval,
          weekStart: hw.start,
          weekEnd: hw.end,
          activeDays: activeDays.length,
          totalMedia,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    return { type: 'week', baseWeek, memories };
  }
}
