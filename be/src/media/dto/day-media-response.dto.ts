import { ApiProperty } from '@nestjs/swagger';

export class DayMediaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  s3Key: string;

  @ApiProperty({
    description:
      'Presigned URL for reading the media file (null if generation failed)',
    nullable: true,
  })
  url: string | null;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  createdAt: string;
}
