import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EventGroupResponseDto,
  EventPeriodResponseDto,
} from './event-group-response.dto.js';
import { MoodDistributionItemDto } from '../../analytics/dto/mood-overview.dto.js';

class MoodStatDto {
  @ApiProperty()
  dayStateName: string;

  @ApiProperty()
  dayStateColor: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;
}

class EventGroupDetailsMediaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  s3Key: string;

  @ApiProperty({ type: String, nullable: true })
  url: string | null;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  periodId: string | null;
}

class PeriodDensityDto {
  @ApiProperty({ example: '2024-01-01' })
  start: string;

  @ApiProperty({ example: '2024-01-31' })
  end: string;

  @ApiProperty()
  activeDays: number;
}

class ChapterAnalyticsDto {
  @ApiProperty()
  totalPeriods: number;

  @ApiProperty()
  totalDays: number;

  @ApiProperty()
  totalMedia: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  averageMoodScore: number | null;

  @ApiProperty({ type: [MoodDistributionItemDto] })
  moodDistribution: MoodDistributionItemDto[];

  @ApiProperty({ type: [PeriodDensityDto] })
  density: PeriodDensityDto[];
}

export class EventGroupDetailsResponseDto extends EventGroupResponseDto {
  @ApiProperty({ type: [MoodStatDto] })
  moodStats: MoodStatDto[];

  @ApiProperty({ type: [EventGroupDetailsMediaDto] })
  media: EventGroupDetailsMediaDto[];

  @ApiProperty()
  totalDays: number;

  @ApiProperty({ type: ChapterAnalyticsDto })
  analytics: ChapterAnalyticsDto;
}
