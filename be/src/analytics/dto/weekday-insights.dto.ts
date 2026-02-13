import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WeekdayInsightDto {
  @ApiProperty({ description: 'Day of week (0=Monday, 6=Sunday)' })
  weekday: number;

  @ApiProperty({ description: 'Average mood score for this weekday (0-10)' })
  averageScore: number;

  @ApiProperty({ description: 'Number of data points for this weekday' })
  sampleSize: number;
}

export class ActivityInsightDto {
  @ApiProperty({ description: 'Day of week (0=Monday, 6=Sunday)' })
  weekday: number;

  @ApiProperty({ description: 'Average activity score for this weekday' })
  averageActivityScore: number;

  @ApiProperty({ description: 'Number of data points for this weekday' })
  sampleSize: number;
}

export class VolatilityInsightDto {
  @ApiProperty({ description: 'Day of week (0=Monday, 6=Sunday)' })
  weekday: number;

  @ApiProperty({ description: 'Standard deviation of mood scores' })
  standardDeviation: number;

  @ApiProperty({ description: 'Number of data points for this weekday' })
  sampleSize: number;
}

export class RecoveryInsightDto {
  @ApiProperty({ description: 'Day of week (0=Monday, 6=Sunday)' })
  weekday: number;

  @ApiProperty({
    description: 'Rate of recovery events (0-1)',
  })
  recoveryRate: number;

  @ApiProperty({ description: 'Number of recovery events' })
  recoveryEvents: number;

  @ApiProperty({ description: 'Total occurrences of this weekday' })
  totalOccurrences: number;
}

export class BurnoutInsightDto {
  @ApiProperty({ description: 'Whether a burnout pattern was detected' })
  detected: boolean;

  @ApiPropertyOptional({
    description: 'Type of pattern detected',
    example: 'work_stress_pattern',
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Confidence level (0-1)',
  })
  confidence?: number;
}

export class WeekdayInsightsDto {
  @ApiPropertyOptional({ type: WeekdayInsightDto, nullable: true })
  bestMoodDay: WeekdayInsightDto | null;

  @ApiPropertyOptional({ type: WeekdayInsightDto, nullable: true })
  worstMoodDay: WeekdayInsightDto | null;

  @ApiPropertyOptional({ type: ActivityInsightDto, nullable: true })
  mostActiveDay: ActivityInsightDto | null;

  @ApiPropertyOptional({ type: ActivityInsightDto, nullable: true })
  leastActiveDay: ActivityInsightDto | null;

  @ApiPropertyOptional({ type: VolatilityInsightDto, nullable: true })
  mostUnstableDay: VolatilityInsightDto | null;

  @ApiPropertyOptional({ type: RecoveryInsightDto, nullable: true })
  recoveryIndex: RecoveryInsightDto | null;

  @ApiPropertyOptional({ type: BurnoutInsightDto, nullable: true })
  burnoutPattern: BurnoutInsightDto | null;
}
