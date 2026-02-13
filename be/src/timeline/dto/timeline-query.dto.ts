import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class TimelineQueryDto {
  @ApiProperty({ example: '2024-01-01', required: false, description: 'Start of timeline range (defaults to 1 year ago)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ example: '2024-12-31', required: false, description: 'End of timeline range (defaults to today)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class WeekQueryDto {
  @ApiProperty({ example: '2024-06-15', description: 'Any date within the target week (YYYY-MM-DD)' })
  @IsDateString()
  date: string;
}
