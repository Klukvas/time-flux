import { ApiProperty } from '@nestjs/swagger';

class TimelineDayStateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  color: string;
}

class TimelineMediaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  s3Key: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  createdAt: string;
}

class TimelineDayDto {
  @ApiProperty({ example: '2024-01-15' })
  date: string;

  @ApiProperty({ nullable: true, type: () => TimelineDayStateDto })
  dayState: TimelineDayStateDto | null;

  @ApiProperty({ nullable: true, example: 'media-uuid', description: 'Cover media ID' })
  mainMediaId: string | null;

  @ApiProperty({ type: [TimelineMediaDto] })
  media: TimelineMediaDto[];
}

class TimelineCategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  color: string;
}

class TimelineEventGroupDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

class TimelinePeriodDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty({ nullable: true })
  endDate: string | null;

  @ApiProperty({ nullable: true })
  comment: string | null;

  @ApiProperty()
  eventGroup: TimelineEventGroupDto;

  @ApiProperty()
  category: TimelineCategoryDto;
}

export class TimelineResponseDto {
  @ApiProperty({ example: '2024-01-01' })
  from: string;

  @ApiProperty({ example: '2024-12-31' })
  to: string;

  @ApiProperty({ type: [TimelinePeriodDto] })
  periods: TimelinePeriodDto[];

  @ApiProperty({ type: [TimelineDayDto] })
  days: TimelineDayDto[];
}

export class WeekTimelineResponseDto {
  @ApiProperty({ example: '2024-06-10', description: 'Monday of the week' })
  weekStart: string;

  @ApiProperty({ example: '2024-06-16', description: 'Sunday of the week' })
  weekEnd: string;

  @ApiProperty({ type: [TimelinePeriodDto] })
  periods: TimelinePeriodDto[];

  @ApiProperty({ type: [TimelineDayDto], description: 'Exactly 7 days (Mon-Sun), with or without state' })
  days: TimelineDayDto[];
}
