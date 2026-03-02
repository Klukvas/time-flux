import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCategoryFromRecommendationDto {
  @ApiProperty({ example: 'work', description: 'Recommendation key' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Work', description: 'Translated display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
