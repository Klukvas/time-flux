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

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'media-uuid',
    description: 'ID of the cover media',
  })
  mainMediaId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Kyiv, Ukraine',
    description: 'Location name',
  })
  locationName: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 50.4501,
    description: 'Latitude',
  })
  latitude: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 30.5234,
    description: 'Longitude',
  })
  longitude: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Had a great day!',
    description: 'Day comment',
  })
  comment: string | null;

  @ApiProperty({ type: () => [DayMediaResponseDto] })
  media: DayMediaResponseDto[];
}
