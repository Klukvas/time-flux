import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatarUrl?: string | null;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  onboardingCompleted: boolean;

  @ApiProperty({ enum: ['FREE', 'PRO', 'PREMIUM'], example: 'FREE' })
  tier: string;

  @ApiProperty()
  createdAt: string;
}

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
