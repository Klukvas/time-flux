import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloseEventPeriodDto {
  @ApiProperty()
  @IsDateString()
  endDate: string;
}
