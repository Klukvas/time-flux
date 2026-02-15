import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateDayLocationDto {
  @ApiProperty({ example: 'Kyiv, Ukraine', required: false, nullable: true, description: 'Location name (max 120 chars). Pass null to clear.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  locationName?: string | null;

  @ApiProperty({ example: 50.4501, required: false, nullable: true, description: 'Latitude (-90 to 90). Pass null to clear.' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @ApiProperty({ example: 30.5234, required: false, nullable: true, description: 'Longitude (-180 to 180). Pass null to clear.' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;
}
