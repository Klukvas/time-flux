import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSupportRequestDto {
  @ApiProperty({ example: 'Bug report', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: 'I found an issue with...', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;

  @ApiProperty({ example: '/timeline', description: 'Page URL where user was' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  page: string;

  @ApiProperty({
    example: 'web',
    enum: ['web', 'ios', 'android'],
    description: 'Client platform',
  })
  @IsIn(['web', 'ios', 'android'])
  platform: string;
}
