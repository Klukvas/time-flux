import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleExchangeDto {
  @ApiProperty({ description: 'One-time OAuth exchange code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
