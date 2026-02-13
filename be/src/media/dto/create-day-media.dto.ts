import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

const ALLOWED_CONTENT_TYPES = [
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

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export class CreateDayMediaDto {
  @ApiProperty({ example: 'uploads/user-id/uuid.jpg', description: 'S3 object key' })
  @IsString()
  @MaxLength(500)
  s3Key: string;

  @ApiProperty({ example: 'photo.jpg', description: 'Original file name' })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type',
    enum: ALLOWED_CONTENT_TYPES,
  })
  @IsIn(ALLOWED_CONTENT_TYPES, {
    message: `Content type must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
  })
  contentType: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE)
  size: number;
}
