import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsUUID, ValidateIf } from 'class-validator';

export class UpdateDayMediaDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Period UUID to tag this media to, or null to untag',
  })
  @IsDefined({ message: 'periodId must be provided (use null to untag)' })
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  periodId: string | null;
}
