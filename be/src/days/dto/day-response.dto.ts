import { ApiProperty } from '@nestjs/swagger';
import { DayMediaResponseDto } from '../../media/dto/day-media-response.dto.js';

class DayStateSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  color: string;
}

export class DayResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '2024-01-15' })
  date: string;

  @ApiProperty({ nullable: true, type: () => DayStateSummaryDto })
  dayState: DayStateSummaryDto | null;

  @ApiProperty({ nullable: true, example: 'media-uuid', description: 'ID of the cover media' })
  mainMediaId: string | null;

  @ApiProperty({ type: () => [DayMediaResponseDto] })
  media: DayMediaResponseDto[];
}
