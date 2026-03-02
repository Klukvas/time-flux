import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpsertDayDto {
  @ApiPropertyOptional({
    type: String,
    example: 'day-state-id',
    nullable: true,
    description: 'Day state ID. Pass null to clear the day state.',
  })
  @IsOptional()
  @IsUUID()
  dayStateId?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'media-uuid',
    nullable: true,
    description:
      'ID of the media item to use as the day cover. Pass null to clear.',
  })
  @IsOptional()
  @IsUUID()
  mainMediaId?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Had a great day!',
    nullable: true,
    description: 'Day comment (max 500 chars). Pass null to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string | null;
}
