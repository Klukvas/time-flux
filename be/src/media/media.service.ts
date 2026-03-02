import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MediaRepository } from './media.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { CreateDayMediaDto } from './dto/create-day-media.dto.js';
import {
  ForbiddenError,
  FutureDateError,
  MediaNotFoundError,
} from '../common/errors/app.error.js';
import { parseISODateToUTC } from '../common/utils/parse-date.js';
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

  private async formatMedia(media: any) {
    let url: string | null = null;
    try {
      url = await this.s3Service.getPresignedReadUrl(media.s3Key);
    } catch (err) {
      this.logger.warn(
        `Failed to generate presigned URL for s3Key=${media.s3Key}: ${err}`,
      );
    }
    return {
      id: media.id,
      s3Key: media.s3Key,
      url,
      fileName: media.fileName,
      contentType: media.contentType,
      size: media.size,
      createdAt: media.createdAt.toISOString(),
    };
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

    return this.formatMedia(media);
  }

  async getMediaForDay(userId: string, dateStr: string) {
    const date = parseISODateToUTC(dateStr);
    const day = await this.mediaRepository.findDayByDateAndUser(date, userId);
    if (!day) return [];

    const items = await this.mediaRepository.findByDayAndUser(day.id, userId);
    return Promise.all(items.map((m) => this.formatMedia(m)));
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
