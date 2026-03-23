import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { DaysRepository } from './days.repository.js';
import { DayStatesRepository } from '../day-states/day-states.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { UpsertDayDto } from './dto/upsert-day.dto.js';
import { UpdateDayLocationDto } from './dto/update-day-location.dto.js';
import { DayQueryDto } from './dto/day-query.dto.js';
import {
  DayStateNotFoundError,
  FutureDateError,
  InvalidDateRangeError,
  MediaNotFoundError,
  ValidationError,
  DateBeforeStartError,
} from '../common/errors/app.error.js';
import { parseISODateToUTC } from '../common/utils/parse-date.js';
import { formatDay } from '../common/utils/format-day.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DaysService {
  private readonly logger = new Logger(DaysService.name);

  constructor(
    private readonly daysRepository: DaysRepository,
    private readonly dayStatesRepository: DayStatesRepository,
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
  ) {}

  private assertNotTooFarInFuture(dateStr: string, timezone: string) {
    const target = DateTime.fromISO(dateStr, { zone: timezone }).startOf('day');
    const tomorrow = DateTime.now()
      .setZone(timezone)
      .startOf('day')
      .plus({ days: 1 });
    if (target > tomorrow) {
      throw new FutureDateError({
        date: dateStr,
        maxDate: tomorrow.toISODate()!,
      });
    }
  }

  private assertNotBeforeBirthDate(
    dateStr: string,
    birthDate: Date | null | undefined,
  ) {
    if (!birthDate) return;
    const birthDateDt = DateTime.fromJSDate(birthDate, { zone: 'utc' }).startOf(
      'day',
    );
    const target = DateTime.fromISO(dateStr, { zone: 'utc' }).startOf('day');
    if (target < birthDateDt) {
      throw new DateBeforeStartError({
        date: dateStr,
        birthDate: birthDateDt.toISODate()!,
      });
    }
  }

  private async getUserBirthDate(userId: string): Promise<Date | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true },
    });
    return user?.birthDate ?? null;
  }

  async upsert(
    userId: string,
    dateStr: string,
    dto: UpsertDayDto,
    timezone: string,
  ) {
    this.logger.log(
      `upsert date=${dateStr} dayStateId=${dto.dayStateId} mainMediaId=${dto.mainMediaId}`,
    );

    this.assertNotTooFarInFuture(dateStr, timezone);
    const birthDate = await this.getUserBirthDate(userId);
    this.assertNotBeforeBirthDate(dateStr, birthDate);

    const date = parseISODateToUTC(dateStr);

    if (dto.dayStateId) {
      const dayState = await this.dayStatesRepository.findByIdAndUserId(
        dto.dayStateId,
        userId,
      );
      if (!dayState) {
        throw new DayStateNotFoundError();
      }
    }

    // Verify mainMediaId belongs to this user (prevent IDOR)
    if (dto.mainMediaId) {
      const media = await this.prisma.dayMedia.findFirst({
        where: { id: dto.mainMediaId, userId },
      });
      if (!media) {
        throw new MediaNotFoundError();
      }
    }

    const day = await this.daysRepository.upsert(userId, date, {
      dayStateId: dto.dayStateId === undefined ? undefined : dto.dayStateId,
      mainMediaId: dto.mainMediaId === undefined ? undefined : dto.mainMediaId,
      comment: dto.comment === undefined ? undefined : dto.comment,
    });

    this.logger.log(
      `upsert success dayId=${day.id} mediaCount=${day.media?.length ?? 0}`,
    );
    return formatDay(day, this.s3Service, this.logger);
  }

  async updateLocation(
    userId: string,
    dateStr: string,
    dto: UpdateDayLocationDto,
    timezone: string,
  ) {
    this.logger.log(
      `updateLocation date=${dateStr} locationName=${dto.locationName}`,
    );

    this.assertNotTooFarInFuture(dateStr, timezone);
    const birthDate = await this.getUserBirthDate(userId);
    this.assertNotBeforeBirthDate(dateStr, birthDate);

    const date = parseISODateToUTC(dateStr);

    const day = await this.daysRepository.upsertLocation(userId, date, {
      locationName:
        dto.locationName === undefined ? undefined : dto.locationName,
      latitude: dto.latitude === undefined ? undefined : dto.latitude,
      longitude: dto.longitude === undefined ? undefined : dto.longitude,
    });

    this.logger.log(`updateLocation success dayId=${day.id}`);
    return formatDay(day, this.s3Service, this.logger);
  }

  async findAll(userId: string, query: DayQueryDto) {
    const from = parseISODateToUTC(query.from);
    const to = parseISODateToUTC(query.to);

    if (from > to) {
      throw new InvalidDateRangeError({ from: query.from, to: query.to });
    }

    const diffDays = Math.round(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > 366) {
      throw new ValidationError({
        range: 'Date range must not exceed 366 days',
      });
    }

    const days = await this.daysRepository.findByUserIdAndDateRange(
      userId,
      from,
      to,
    );
    return Promise.all(
      days.map((d) => formatDay(d, this.s3Service, this.logger)),
    );
  }
}
