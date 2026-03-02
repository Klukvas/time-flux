import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'latLngPaired', async: false })
class LatLngPairedConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as UpdateDayLocationDto;
    const hasLat = obj.latitude !== undefined && obj.latitude !== null;
    const hasLng = obj.longitude !== undefined && obj.longitude !== null;
    // Both present or both absent
    return hasLat === hasLng;
  }

  defaultMessage() {
    return 'latitude and longitude must both be present or both be null';
  }
}

export class UpdateDayLocationDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Kyiv, Ukraine',
    nullable: true,
    description: 'Location name (max 120 chars). Pass null to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  locationName?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 50.4501,
    nullable: true,
    description: 'Latitude (-90 to 90). Pass null to clear.',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Validate(LatLngPairedConstraint)
  latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: 30.5234,
    nullable: true,
    description: 'Longitude (-180 to 180). Pass null to clear.',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;
}
