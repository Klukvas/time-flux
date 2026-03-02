import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class EventGroupCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  color: string;
}

export class EventPeriodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '2024-01-01' })
  startDate: string;

  @ApiPropertyOptional({ type: String, example: '2024-01-31', nullable: true })
  endDate: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  comment: string | null;

  @ApiProperty()
  createdAt: string;
}

export class EventGroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: EventGroupCategoryDto })
  category: EventGroupCategoryDto;

  @ApiProperty({ type: [EventPeriodResponseDto] })
  periods: EventPeriodResponseDto[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
