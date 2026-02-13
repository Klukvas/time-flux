import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class ParseDatePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!ISO_DATE_REGEX.test(value)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }

    const parsed = new Date(value + 'T00:00:00Z');
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date value');
    }

    return value;
  }
}
