import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpsertDayDto {
  @ApiProperty({
    example: 'day-state-id',
    required: false,
    nullable: true,
    description: 'Day state ID. Pass null to clear the day state.',
  })
  @IsOptional()
  @IsUUID()
  dayStateId?: string | null;

  @ApiProperty({
    example: 'media-uuid',
    required: false,
    nullable: true,
    description:
      'ID of the media item to use as the day cover. Pass null to clear.',
  })
  @IsOptional()
  @IsUUID()
  mainMediaId?: string | null;

  @ApiProperty({
    example: 'Had a great day!',
    required: false,
    nullable: true,
    description: 'Day comment (max 500 chars). Pass null to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string | null;
}
