import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class OnThisDayQueryDto {
  @ApiPropertyOptional({
    example: '2026-02-12',
    description:
      'Date in YYYY-MM-DD format. Defaults to today if not provided.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;
}
