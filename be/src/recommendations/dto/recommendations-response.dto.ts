import { ApiProperty } from '@nestjs/swagger';

class RecommendationDto {
  @ApiProperty({ example: 'work' })
  key: string;

  @ApiProperty({ example: '#3B82F6' })
  color: string;
}

export class RecommendationsResponseDto {
  @ApiProperty({ type: [RecommendationDto] })
  categories: RecommendationDto[];

  @ApiProperty({ type: [RecommendationDto] })
  moods: RecommendationDto[];
}
