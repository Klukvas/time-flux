import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class ChangePlanDto {
  @ApiProperty({ enum: ['PRO', 'PREMIUM'], example: 'PREMIUM' })
  @IsString()
  @IsIn(['PRO', 'PREMIUM'])
  tier!: 'PRO' | 'PREMIUM';
}

export class ChangePlanResponseDto {
  @ApiProperty({ example: 'Subscription upgraded to PREMIUM' })
  message!: string;

  @ApiProperty({ enum: ['PRO', 'PREMIUM'], example: 'PREMIUM' })
  tier!: 'PRO' | 'PREMIUM';
}
