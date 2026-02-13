import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, Matches } from 'class-validator';

export enum MemoryMode {
  DAY = 'day',
  WEEK = 'week',
}

export class ContextQueryDto {
  @ApiProperty({ enum: MemoryMode, description: 'Memory context mode' })
  @IsEnum(MemoryMode)
  @IsNotEmpty()
  mode: MemoryMode;

  @ApiProperty({
    example: '2026-02-12',
    description: 'Selected date in YYYY-MM-DD (ISO 8601)',
  })
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;
}
