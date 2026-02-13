import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class IntervalDto {
  @ApiProperty({ enum: ['months', 'years'] })
  type: 'months' | 'years';

  @ApiProperty({ example: 1 })
  value: number;
}

class MoodDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Happy' })
  name: string;

  @ApiProperty({ example: '#4CAF50' })
  color: string;
}

// --- Day mode ---

class DayMemoryDto {
  @ApiProperty({ type: IntervalDto })
  interval: IntervalDto;

  @ApiProperty({ example: '2025-02-12' })
  date: string;

  @ApiPropertyOptional({ type: MoodDto, nullable: true })
  mood: MoodDto | null;

  @ApiProperty({ example: 3 })
  mediaCount: number;
}

export class DayContextResponseDto {
  @ApiProperty({ example: 'day' })
  type: 'day';

  @ApiProperty({ example: '2026-02-12' })
  baseDate: string;

  @ApiProperty({ type: [DayMemoryDto] })
  memories: DayMemoryDto[];
}

// --- Week mode ---

class BaseWeekDto {
  @ApiProperty({ example: '2026-02-09' })
  start: string;

  @ApiProperty({ example: '2026-02-15' })
  end: string;
}

class WeekMemoryDto {
  @ApiProperty({ type: IntervalDto })
  interval: IntervalDto;

  @ApiProperty({ example: '2025-02-10' })
  weekStart: string;

  @ApiProperty({ example: '2025-02-16' })
  weekEnd: string;

  @ApiProperty({ example: 4 })
  activeDays: number;

  @ApiProperty({ example: 7 })
  totalMedia: number;
}

export class WeekContextResponseDto {
  @ApiProperty({ example: 'week' })
  type: 'week';

  @ApiProperty({ type: BaseWeekDto })
  baseWeek: BaseWeekDto;

  @ApiProperty({ type: [WeekMemoryDto] })
  memories: WeekMemoryDto[];
}

export type ContextResponseDto = DayContextResponseDto | WeekContextResponseDto;

// --- On This Day ---

export class OnThisDayResponseDto {
  @ApiProperty({ example: '2026-02-12' })
  baseDate: string;

  @ApiProperty({ type: [DayMemoryDto] })
  memories: DayMemoryDto[];
}
