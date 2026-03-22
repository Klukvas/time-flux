import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MediaRepository } from './media.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { CreateDayMediaDto } from './dto/create-day-media.dto.js';
import {
  EventPeriodNotFoundError,
  ForbiddenError,
  FutureDateError,
  MediaNotFoundError,
  ValidationError,
} from '../common/errors/app.error.js';
import { parseISODateToUTC } from '../common/utils/parse-date.js';
import { formatMedia } from '../common/utils/format-media.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly s3Service: S3Service,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  private formatMediaItem(media: any) {
    return formatMedia(media, this.s3Service, this.logger);
  }

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

  /**
   * Validate that a period exists, belongs to the user, and covers the given day date.
   * Accepts an optional transaction client for use inside $transaction blocks.
   */
  private async validatePeriodForDay(
    userId: string,
    periodId: string,
    dayDate: Date,
    client?: { eventPeriod: typeof this.prisma.eventPeriod },
  ): Promise<void> {
    const db = client ?? this.prisma;
    const period = await db.eventPeriod.findFirst({
      where: { id: periodId, eventGroup: { userId } },
    });
    if (!period) {
      throw new EventPeriodNotFoundError();
    }

    // Normalize to start-of-day UTC for comparison (period uses Timestamptz, day uses Date)
    const toMidnight = (d: Date) =>
      new Date(d.toISOString().split('T')[0] + 'T00:00:00Z').getTime();

    const dayTime = toMidnight(dayDate);
    const periodStart = toMidnight(period.startDate);
    const periodEnd = period.endDate ? toMidnight(period.endDate) : null;

    if (dayTime < periodStart || (periodEnd != null && dayTime > periodEnd)) {
      throw new ValidationError({
        periodId: 'The selected period does not cover this day',
      });
    }
  }

  async addMedia(
    userId: string,
    dateStr: string,
    dto: CreateDayMediaDto,
    timezone: string,
  ) {
    this.assertNotTooFarInFuture(dateStr, timezone);

    // Verify S3 key belongs to this user (prevent IDOR via s3Key spoofing)
    const expectedPrefix = `uploads/${userId}/`;
    if (!dto.s3Key.startsWith(expectedPrefix)) {
      throw new ForbiddenError('S3 key does not belong to this user');
    }

    const date = parseISODateToUTC(dateStr);

    // Wrap count + create in a serializable transaction to prevent TOCTOU
    const { media, day } = await this.prisma.$transaction(
      async (tx) => {
        // Validate period inside transaction to prevent race with period deletion
        if (dto.periodId) {
          await this.validatePeriodForDay(userId, dto.periodId, date, tx);
        }

        const mediaCount = await tx.dayMedia.count({ where: { userId } });
        await this.subscriptionsService.assertResourceLimit(
          userId,
          'media',
          mediaCount,
        );

        // Ensure the Day record exists (upsert)
        const txDay = await tx.day.upsert({
          where: { userId_date: { userId, date } },
          create: { userId, date },
          update: {},
        });

        const txMedia = await tx.dayMedia.create({
          data: {
            dayId: txDay.id,
            userId,
            s3Key: dto.s3Key,
            fileName: dto.fileName,
            contentType: dto.contentType,
            size: dto.size,
            ...(dto.periodId ? { periodId: dto.periodId } : {}),
          },
        });

        return { media: txMedia, day: txDay };
      },
      { isolationLevel: 'Serializable' },
    );

    // Auto-select as cover if it's the first image and no cover is set
    if (!day.mainMediaId && dto.contentType.startsWith('image/')) {
      await this.mediaRepository.setMainMedia(day.id, media.id);
      this.logger.log(`Auto-set cover for day ${dateStr} to media ${media.id}`);
    }

    return this.formatMediaItem(media);
  }

  async getMediaForDay(userId: string, dateStr: string) {
    const date = parseISODateToUTC(dateStr);
    const day = await this.mediaRepository.findDayByDateAndUser(date, userId);
    if (!day) return [];

    const items = await this.mediaRepository.findByDayAndUser(day.id, userId);
    return Promise.all(items.map((m) => this.formatMediaItem(m)));
  }

  async updateMediaPeriod(
    userId: string,
    mediaId: string,
    periodId: string | null,
  ) {
    const media = await this.mediaRepository.findByIdAndUser(mediaId, userId);
    if (!media) {
      throw new MediaNotFoundError();
    }

    // Wrap validate + update in a transaction to prevent TOCTOU race
    const updated = await this.prisma.$transaction(
      async (tx) => {
        if (periodId !== null) {
          const day = await tx.day.findUnique({
            where: { id: media.dayId },
            select: { date: true },
          });
          if (!day) {
            throw new MediaNotFoundError();
          }
          await this.validatePeriodForDay(userId, periodId, day.date, tx);
        }

        return tx.dayMedia.update({
          where: { id: mediaId },
          data: { periodId },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    return this.formatMediaItem(updated);
  }

  async deleteMedia(userId: string, mediaId: string) {
    const media = await this.mediaRepository.findByIdAndUser(mediaId, userId);
    if (!media) {
      throw new MediaNotFoundError();
    }

    // Clear cover photo reference if this media was the day's main media
    await this.mediaRepository.clearMainMediaIfMatch(media.dayId, mediaId);

    // Delete from DB first (authoritative), then S3 (best-effort)
    await this.mediaRepository.deleteById(mediaId);
    try {
      await this.s3Service.deleteObject(media.s3Key);
    } catch (err) {
      this.logger.warn(
        `Failed to delete S3 object s3Key=${media.s3Key} after DB deletion: ${err}`,
      );
    }
  }
}
