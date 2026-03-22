import { Logger } from '@nestjs/common';
import type { S3Service } from '../../s3/s3.service.js';

interface MediaRecord {
  id: string;
  s3Key: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: Date;
  periodId?: string | null;
}

export async function formatMedia(
  media: MediaRecord,
  s3Service: S3Service,
  logger: Logger,
) {
  let url: string | null = null;
  try {
    url = await s3Service.getPresignedReadUrl(media.s3Key);
  } catch (err) {
    logger.warn(
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
    periodId: media.periodId ?? null,
  };
}
