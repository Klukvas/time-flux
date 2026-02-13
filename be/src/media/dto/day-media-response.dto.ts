import { ApiProperty } from '@nestjs/swagger';

export class DayMediaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  s3Key: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  createdAt: string;
}
