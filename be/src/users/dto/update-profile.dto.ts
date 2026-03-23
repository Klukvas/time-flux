import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Birth date (YYYY-MM-DD) or null to clear',
  })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'birthDate must be in YYYY-MM-DD format',
  })
  birthDate?: string | null;
}
