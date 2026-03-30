import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { MIME_TO_EXTENSION } from './dto/presigned-url.dto.js';

const URL_CACHE_TTL_MS = 3_600_000; // 1 hour (URLs valid 24h)
const URL_CACHE_MAX_SIZE = 10_000;

interface UrlCacheEntry {
  readonly url: string;
  readonly expiresAt: number;
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly urlCache = new Map<string, UrlCacheEntry>();

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      region: this.configService.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>(
          'S3_SECRET_ACCESS_KEY',
          '',
        ),
      },
      forcePathStyle: true,
    });
    this.bucket = this.configService.get<string>('S3_BUCKET', 'lifespan');
  }

  async generatePresignedUploadUrl(
    userId: string,
    contentType: string,
    size: number,
  ): Promise<{ uploadUrl: string; key: string }> {
    // Derive extension from MIME type only — ignore user-supplied filename extension
    const ext = MIME_TO_EXTENSION[contentType] ?? '';
    const key = `uploads/${userId}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    return { uploadUrl, key };
  }

  async getPresignedReadUrl(key: string): Promise<string> {
    const cached = this.urlCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: 86400,
    });

    // LRU-style eviction: delete oldest 20% when cache is full
    if (this.urlCache.size >= URL_CACHE_MAX_SIZE) {
      const evictCount = Math.ceil(URL_CACHE_MAX_SIZE * 0.2);
      const iterator = this.urlCache.keys();
      for (let i = 0; i < evictCount; i++) {
        const oldest = iterator.next().value;
        if (oldest) this.urlCache.delete(oldest);
      }
    }

    this.urlCache.set(key, { url, expiresAt: Date.now() + URL_CACHE_TTL_MS });
    return url;
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3Client.send(command);
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    });
    await this.s3Client.send(command);
  }

  async checkConnection(): Promise<void> {
    const command = new HeadBucketCommand({ Bucket: this.bucket });
    await this.s3Client.send(command, {
      abortSignal: AbortSignal.timeout(5_000),
    });
  }
}
