import { Logger } from '@nestjs/common';
import type { S3Service } from '../../s3/s3.service.js';
import { formatMedia } from './format-media.js';

interface DayMediaRecord {
  id: string;
  s3Key: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: Date;
  periodId?: string | null;
}

interface DayRecord {
  id: string;
  date: Date;
  dayState: { id: string; name: string; color: string; score: number } | null;
  mainMediaId: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  comment: string | null;
  media: DayMediaRecord[];
}

export async function formatDay(
  day: DayRecord,
  s3Service: S3Service,
  logger: Logger,
) {
  return {
    id: day.id,
    date: day.date.toISOString().split('T')[0],
    dayState: day.dayState,
    mainMediaId: day.mainMediaId ?? null,
    locationName: day.locationName ?? null,
    latitude: day.latitude ?? null,
    longitude: day.longitude ?? null,
    comment: day.comment ?? null,
    media: await Promise.all(
      (day.media ?? []).map((m) => formatMedia(m, s3Service, logger)),
    ),
  };
}
