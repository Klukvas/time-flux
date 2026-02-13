import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeekdayInsightsDto } from './weekday-insights.dto.js';

export class MoodDistributionItemDto {
  @ApiProperty() moodId: string;
  @ApiProperty() moodName: string;
  @ApiProperty() color: string;
  @ApiProperty() count: number;
  @ApiProperty() percentage: number;
}

export class CategoryMoodSummaryDto {
  @ApiProperty() categoryId: string;
  @ApiProperty() name: string;
  @ApiProperty() averageMoodScore: number;
}

export class TrendPointDto {
  @ApiProperty() date: string;
  @ApiProperty() score: number;
}

export class MoodOverviewResponseDto {
  @ApiProperty() totalDaysWithMood: number;
  @ApiProperty() averageMoodScore: number;
  @ApiProperty({ type: [MoodDistributionItemDto] }) moodDistribution: MoodDistributionItemDto[];
  @ApiPropertyOptional({ type: CategoryMoodSummaryDto, nullable: true }) bestCategory: CategoryMoodSummaryDto | null;
  @ApiPropertyOptional({ type: CategoryMoodSummaryDto, nullable: true }) worstCategory: CategoryMoodSummaryDto | null;
  @ApiProperty({ type: [TrendPointDto] }) trendLast30Days: TrendPointDto[];
  @ApiPropertyOptional({ type: WeekdayInsightsDto, nullable: true }) weekdayInsights: WeekdayInsightsDto | null;
}
