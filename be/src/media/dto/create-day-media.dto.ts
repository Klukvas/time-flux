import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ALLOWED_UPLOAD_CONTENT_TYPES } from '../../s3/dto/presigned-url.dto.js';

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export class CreateDayMediaDto {
  @ApiProperty({
    example: 'uploads/user-id/uuid.jpg',
    description: 'S3 object key',
  })
  @IsString()
  @MaxLength(500)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._/\-]*$/, {
    message:
      's3Key must contain only alphanumeric characters, dots, hyphens, underscores, and forward slashes',
  })
  s3Key: string;

  @ApiProperty({ example: 'photo.jpg', description: 'Original file name' })
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._\- ]*$/, {
    message:
      'fileName must contain only alphanumeric characters, dots, hyphens, underscores, and spaces',
  })
  fileName: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type',
    enum: ALLOWED_UPLOAD_CONTENT_TYPES,
  })
  @IsIn([...ALLOWED_UPLOAD_CONTENT_TYPES], {
    message: `Content type must be one of: ${ALLOWED_UPLOAD_CONTENT_TYPES.join(', ')}`,
  })
  contentType: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE)
  size: number;

  @ApiPropertyOptional({ description: 'Period UUID to tag this media to' })
  @IsOptional()
  @IsUUID()
  periodId?: string;
}
