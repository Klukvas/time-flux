import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { MediaRepository } from './media.repository.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { S3Service } from '../s3/s3.service.js';
import { CreateDayMediaDto } from './dto/create-day-media.dto.js';
import { FutureDateError, MediaNotFoundError } from '../common/errors/app.error.js';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly authRepository: AuthRepository,
    private readonly s3Service: S3Service,
  ) {}

  private async formatMedia(media: any) {
    return {
      id: media.id,
      s3Key: media.s3Key,
      url: await this.s3Service.getPresignedReadUrl(media.s3Key),
      fileName: media.fileName,
      contentType: media.contentType,
      size: media.size,
      createdAt: media.createdAt.toISOString(),
    };
  }

  private async assertNotTooFarInFuture(dateStr: string, userId: string) {
    const user = await this.authRepository.findUserById(userId);
    const tz = user?.timezone ?? 'UTC';
    const target = DateTime.fromISO(dateStr, { zone: tz }).startOf('day');
    const tomorrow = DateTime.now().setZone(tz).startOf('day').plus({ days: 1 });
    if (target > tomorrow) {
      throw new FutureDateError({ date: dateStr, maxDate: tomorrow.toISODate()! });
    }
  }

  async addMedia(userId: string, dateStr: string, dto: CreateDayMediaDto) {
    await this.assertNotTooFarInFuture(dateStr, userId);
    const date = new Date(dateStr + 'T00:00:00Z');

    // Ensure the Day record exists (upsert)
    const day = await this.mediaRepository.upsertDay(userId, date);

    const media = await this.mediaRepository.create({
      dayId: day.id,
      userId,
      s3Key: dto.s3Key,
      fileName: dto.fileName,
      contentType: dto.contentType,
      size: dto.size,
    });

    // Auto-select as cover if it's the first image and no cover is set
    if (!day.mainMediaId && dto.contentType.startsWith('image/')) {
      await this.mediaRepository.setMainMedia(day.id, media.id);
      this.logger.log(`Auto-set cover for day ${dateStr} to media ${media.id}`);
    }

    return this.formatMedia(media);
  }

  async getMediaForDay(userId: string, dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00Z');
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

    // Delete from S3 first, then from DB
    await this.s3Service.deleteObject(media.s3Key);
    await this.mediaRepository.deleteById(mediaId);
  }
}
