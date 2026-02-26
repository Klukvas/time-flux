import { BadRequestException } from '@nestjs/common';
import { ParseDatePipe } from './parse-date.pipe.js';

describe('ParseDatePipe', () => {
  let pipe: ParseDatePipe;

  beforeEach(() => {
    pipe = new ParseDatePipe();
  });

  it('should pass through a valid YYYY-MM-DD date', () => {
    expect(pipe.transform('2024-06-15')).toBe('2024-06-15');
  });

  it('should pass through edge date values', () => {
    expect(pipe.transform('2000-01-01')).toBe('2000-01-01');
    expect(pipe.transform('2099-12-31')).toBe('2099-12-31');
  });

  it('should reject invalid format MM-DD-YYYY', () => {
    expect(() => pipe.transform('01-15-2024')).toThrow(BadRequestException);
  });

  it('should reject invalid format DD/MM/YYYY', () => {
    expect(() => pipe.transform('15/06/2024')).toThrow(BadRequestException);
  });

  it('should reject non-date string', () => {
    expect(() => pipe.transform('not-a-date')).toThrow(BadRequestException);
  });

  it('should reject empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('should reject date with time', () => {
    expect(() => pipe.transform('2024-06-15T12:00:00Z')).toThrow(
      BadRequestException,
    );
  });

  it('should reject invalid date values like Feb 30', () => {
    // 2024-02-30 matches regex but is not a valid calendar date
    // Luxon correctly rejects this unlike JavaScript Date which silently rolls over
    expect(() => pipe.transform('2024-02-30')).toThrow(BadRequestException);
  });

  it('should reject completely invalid date with valid format', () => {
    expect(() => pipe.transform('2024-13-45')).toThrow(BadRequestException);
  });
});
