import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, Matches, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateDayStateDto {
  @ApiProperty({ example: 'Great' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '#4CAF50', description: 'Hex color code' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color (e.g. #4CAF50)' })
  color: string;

  @ApiProperty({ example: 0, required: false, description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ example: 7, description: 'Mood intensity score (0-10)' })
  @IsInt()
  @Min(0)
  @Max(10)
  score: number;
}
