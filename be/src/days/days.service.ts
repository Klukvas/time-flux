import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { DaysRepository } from './days.repository.js';
import { DayStatesRepository } from '../day-states/day-states.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { UpsertDayDto } from './dto/upsert-day.dto.js';
import { UpdateDayLocationDto } from './dto/update-day-location.dto.js';
import { DayQueryDto } from './dto/day-query.dto.js';
import { DayStateNotFoundError, FutureDateError, InvalidDateRangeError } from '../common/errors/app.error.js';

@Injectable()
export class DaysService {
  private readonly logger = new Logger(DaysService.name);

  constructor(
    private readonly daysRepository: DaysRepository,
    private readonly dayStatesRepository: DayStatesRepository,
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
      id: day.id,
      date: day.date.toISOString().split('T')[0],
      dayState: day.dayState,
      mainMediaId: day.mainMediaId ?? null,
      locationName: day.locationName ?? null,
      latitude: day.latitude ?? null,
      longitude: day.longitude ?? null,
      media: await Promise.all((day.media ?? []).map((m: any) => this.formatMedia(m))),
    };
  }

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

  async upsert(userId: string, dateStr: string, dto: UpsertDayDto) {
    this.logger.log(`upsert date=${dateStr} dayStateId=${dto.dayStateId} mainMediaId=${dto.mainMediaId}`);

    const tz = await this.getUserTimezone(userId);
    this.assertNotTooFarInFuture(dateStr, tz);

    const date = new Date(dateStr + 'T00:00:00Z');

    if (dto.dayStateId) {
      const dayState = await this.dayStatesRepository.findByIdAndUserId(dto.dayStateId, userId);
      if (!dayState) {
        throw new DayStateNotFoundError();
      }
    }

    const day = await this.daysRepository.upsert(userId, date, {
      dayStateId: dto.dayStateId === undefined ? undefined : dto.dayStateId,
      mainMediaId: dto.mainMediaId === undefined ? undefined : dto.mainMediaId,
    });

    this.logger.log(`upsert success dayId=${day.id} mediaCount=${day.media?.length ?? 0}`);
    return this.formatDay(day);
  }

  async updateLocation(userId: string, dateStr: string, dto: UpdateDayLocationDto) {
    this.logger.log(`updateLocation date=${dateStr} locationName=${dto.locationName}`);

    const tz = await this.getUserTimezone(userId);
    this.assertNotTooFarInFuture(dateStr, tz);

    const date = new Date(dateStr + 'T00:00:00Z');

    const day = await this.daysRepository.upsertLocation(userId, date, {
      locationName: dto.locationName === undefined ? undefined : dto.locationName,
      latitude: dto.latitude === undefined ? undefined : dto.latitude,
      longitude: dto.longitude === undefined ? undefined : dto.longitude,
    });

    this.logger.log(`updateLocation success dayId=${day.id}`);
    return this.formatDay(day);
  }

  async findAll(userId: string, query: DayQueryDto) {
    const from = new Date(query.from + 'T00:00:00Z');
    const to = new Date(query.to + 'T00:00:00Z');

    if (from > to) {
      throw new InvalidDateRangeError({ from: query.from, to: query.to });
    }

    const days = await this.daysRepository.findByUserIdAndDateRange(userId, from, to);
    return Promise.all(days.map((d) => this.formatDay(d)));
  }
}
