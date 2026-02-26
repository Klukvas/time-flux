import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB

export class PresignedUrlRequestDto {
  @ApiProperty({
    example: 'photo.jpg',
    description: 'File name for the upload',
  })
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._\- ]*$/, {
    message:
      'fileName must contain only alphanumeric characters, dots, hyphens, underscores, and spaces',
  })
  fileName: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME content type',
    enum: ALLOWED_UPLOAD_CONTENT_TYPES,
  })
  @IsIn(ALLOWED_UPLOAD_CONTENT_TYPES, {
    message: `Content type must be one of: ${ALLOWED_UPLOAD_CONTENT_TYPES.join(', ')}`,
  })
  contentType: string;

  @ApiProperty({
    example: 1024000,
    description: 'File size in bytes (required, max 50 MB)',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_SIZE)
  size: number;
}

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL for direct upload to S3' })
  uploadUrl: string;

  @ApiProperty({ description: 'The object key in S3' })
  key: string;
}
