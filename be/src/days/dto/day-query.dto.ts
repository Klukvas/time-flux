import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class DayQueryDto {
  @ApiProperty({ example: '2024-01-01', description: 'Start of date range (YYYY-MM-DD)' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2024-01-31', description: 'End of date range (YYYY-MM-DD)' })
  @IsDateString()
  to: string;
}
