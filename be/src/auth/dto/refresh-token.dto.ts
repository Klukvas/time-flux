import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token received during login/register' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
