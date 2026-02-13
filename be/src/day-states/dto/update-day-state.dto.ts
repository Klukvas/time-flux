import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, Matches, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateDayStateDto {
  @ApiProperty({ example: 'Great', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: '#4CAF50', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color (e.g. #4CAF50)' })
  color?: string;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ example: 7, required: false, description: 'Mood intensity score (0-10)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  score?: number;
}
