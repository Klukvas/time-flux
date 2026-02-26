import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class ParseDatePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!ISO_DATE_REGEX.test(value)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }

    const dt = DateTime.fromISO(value, { zone: 'utc' });
    if (!dt.isValid) {
      throw new BadRequestException(`Invalid date value: ${dt.invalidReason}`);
    }

    return value;
  }
}
