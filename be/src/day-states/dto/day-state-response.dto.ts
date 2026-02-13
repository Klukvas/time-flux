import { ApiProperty } from '@nestjs/swagger';

export class DayStateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty()
  order: number;

  @ApiProperty({ description: 'Mood intensity score (0-10)' })
  score: number;
}
