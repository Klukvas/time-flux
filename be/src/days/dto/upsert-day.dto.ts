import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpsertDayDto {
  @ApiProperty({ example: 'day-state-id', required: false, nullable: true, description: 'Day state ID. Pass null to clear the day state.' })
  @IsOptional()
  @IsString()
  dayStateId?: string | null;

  @ApiProperty({ example: 'media-uuid', required: false, nullable: true, description: 'ID of the media item to use as the day cover. Pass null to clear.' })
  @IsOptional()
  @IsString()
  mainMediaId?: string | null;
}
