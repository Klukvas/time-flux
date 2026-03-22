import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateColor,
  validateComment,
  validateTitle,
  validateDescription,
  validateDateRange,
} from './validation';

// ─── validateEmail ────────────────────────────────────────────

describe('validateEmail', () => {
  it('returns valid for a standard email', () => {
    expect(validateEmail('user@example.com')).toEqual({ valid: true });
  });

  it('returns valid for email with subdomain', () => {
    expect(validateEmail('user@mail.example.com')).toEqual({ valid: true });
  });

  it('returns valid for email with plus addressing', () => {
    expect(validateEmail('user+tag@example.com')).toEqual({ valid: true });
  });

  it('returns valid for email with dots in local part', () => {
    expect(validateEmail('first.last@example.com')).toEqual({ valid: true });
  });

  it('returns error for empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('required');
    expect(result.error).toBe('Email is required.');
  });

  it('returns error for missing @ symbol', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('invalid');
  });

  it('returns error for missing domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('invalid');
  });

  it('returns error for missing local part', () => {
    const result = validateEmail('@example.com');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('invalid');
  });

  it('returns error for email with spaces', () => {
    const result = validateEmail('user @example.com');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('invalid');
  });

  it('returns error for missing TLD', () => {
    const result = validateEmail('user@example');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('invalid');
  });

  it('returns error for double @ symbol', () => {
    const result = validateEmail('user@@example.com');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('invalid');
  });
});

// ─── validatePassword ─────────────────────────────────────────

describe('validatePassword', () => {
  it('returns valid for a strong password', () => {
    expect(validatePassword('MyStr0ngPass')).toEqual({ valid: true });
  });

  it('returns valid for minimum length password with all requirements', () => {
    // 8 chars: uppercase, lowercase, digit
    expect(validatePassword('Abcdefg1')).toEqual({ valid: true });
  });

  it('returns error for empty string', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('required');
    expect(result.error).toBe('Password is required.');
  });

  it('returns error for password shorter than minimum length', () => {
    const result = validatePassword('Ab1');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('min_length');
    expect(result.error).toContain('at least');
  });

  it('returns error for password exactly 7 characters (below minimum of 8)', () => {
    const result = validatePassword('Abcdef1');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('min_length');
  });

  it('returns valid for password exactly at minimum length boundary', () => {
    expect(validatePassword('Abcdef12').valid).toBe(true);
  });

  it('returns error for password exceeding max length', () => {
    const longPass = 'Ab1' + 'a'.repeat(126); // 129 chars
    const result = validatePassword(longPass);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('max_length');
    expect(result.error).toContain('at most');
  });

  it('returns valid for password at exactly max length (128)', () => {
    const maxPass = 'Ab1' + 'a'.repeat(125); // 128 chars
    expect(validatePassword(maxPass).valid).toBe(true);
  });

  it('returns error for password missing uppercase letter', () => {
    const result = validatePassword('lowercas3');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('complexity');
    expect(result.error).toContain('uppercase');
  });

  it('returns error for password missing lowercase letter', () => {
    const result = validatePassword('UPPERCASE3');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('complexity');
    expect(result.error).toContain('lowercase');
  });

  it('returns error for password missing digit', () => {
    const result = validatePassword('NoDigitsHere');
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('complexity');
    expect(result.error).toContain('number');
  });

  it('returns valid for password with special characters', () => {
    expect(validatePassword('P@ss!w0rd#')).toEqual({ valid: true });
  });
});

// ─── validateName ─────────────────────────────────────────────

describe('validateName', () => {
  it('returns valid for a normal name', () => {
    expect(validateName('John Doe')).toEqual({ valid: true });
  });

  it('returns error for empty string', () => {
    const result = validateName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name is required.');
  });

  it('returns error for whitespace-only string', () => {
    const result = validateName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name is required.');
  });

  it('returns error for name exceeding max length (100)', () => {
    const result = validateName('a'.repeat(101));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most');
    expect(result.error).toContain('100');
  });

  it('returns valid for name at exactly max length', () => {
    expect(validateName('a'.repeat(100)).valid).toBe(true);
  });

  it('returns valid for single character name', () => {
    expect(validateName('A').valid).toBe(true);
  });
});

// ─── validateColor ────────────────────────────────────────────

describe('validateColor', () => {
  it('returns valid for a proper hex color', () => {
    expect(validateColor('#FF5733')).toEqual({ valid: true });
  });

  it('returns valid for lowercase hex', () => {
    expect(validateColor('#ff5733')).toEqual({ valid: true });
  });

  it('returns valid for mixed case hex', () => {
    expect(validateColor('#aAbBcC')).toEqual({ valid: true });
  });

  it('returns valid for #000000', () => {
    expect(validateColor('#000000')).toEqual({ valid: true });
  });

  it('returns valid for #FFFFFF', () => {
    expect(validateColor('#FFFFFF')).toEqual({ valid: true });
  });

  it('returns error for empty string', () => {
    const result = validateColor('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Color is required.');
  });

  it('returns error for hex without hash', () => {
    const result = validateColor('FF5733');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('valid hex color');
  });

  it('returns error for shorthand hex (#FFF)', () => {
    const result = validateColor('#FFF');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('valid hex color');
  });

  it('returns error for 8-digit hex (with alpha)', () => {
    const result = validateColor('#FF5733AA');
    expect(result.valid).toBe(false);
  });

  it('returns error for invalid hex characters', () => {
    const result = validateColor('#GGHHII');
    expect(result.valid).toBe(false);
  });

  it('returns error for rgb format', () => {
    const result = validateColor('rgb(255,0,0)');
    expect(result.valid).toBe(false);
  });

  it('returns error for named color', () => {
    const result = validateColor('red');
    expect(result.valid).toBe(false);
  });
});

// ─── validateComment ──────────────────────────────────────────

describe('validateComment', () => {
  it('returns valid for a normal comment', () => {
    expect(validateComment('This is a comment')).toEqual({ valid: true });
  });

  it('returns valid for empty string (comment is optional)', () => {
    expect(validateComment('')).toEqual({ valid: true });
  });

  it('returns valid for comment at exactly max length (300)', () => {
    expect(validateComment('a'.repeat(300)).valid).toBe(true);
  });

  it('returns error for comment exceeding max length', () => {
    const result = validateComment('a'.repeat(301));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most');
    expect(result.error).toContain('300');
  });

  it('returns valid for multiline comment within limits', () => {
    const multiline = 'Line 1\nLine 2\nLine 3';
    expect(validateComment(multiline).valid).toBe(true);
  });
});

// ─── validateTitle ────────────────────────────────────────────

describe('validateTitle', () => {
  it('returns valid for a normal title', () => {
    expect(validateTitle('My Chapter')).toEqual({ valid: true });
  });

  it('returns error for empty string', () => {
    const result = validateTitle('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Title is required.');
  });

  it('returns error for whitespace-only string', () => {
    const result = validateTitle('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Title is required.');
  });

  it('returns valid for title at exactly max length (200)', () => {
    expect(validateTitle('a'.repeat(200)).valid).toBe(true);
  });

  it('returns error for title exceeding max length', () => {
    const result = validateTitle('a'.repeat(201));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most');
    expect(result.error).toContain('200');
  });

  it('returns valid for single character title', () => {
    expect(validateTitle('X').valid).toBe(true);
  });
});

// ─── validateDescription ──────────────────────────────────────

describe('validateDescription', () => {
  it('returns valid for a normal description', () => {
    expect(validateDescription('Some details')).toEqual({ valid: true });
  });

  it('returns valid for empty string (description is optional)', () => {
    expect(validateDescription('')).toEqual({ valid: true });
  });

  it('returns valid for description at exactly max length (500)', () => {
    expect(validateDescription('a'.repeat(500)).valid).toBe(true);
  });

  it('returns error for description exceeding max length', () => {
    const result = validateDescription('a'.repeat(501));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most');
    expect(result.error).toContain('500');
  });
});

// ─── validateDateRange ────────────────────────────────────────

describe('validateDateRange', () => {
  it('returns valid for a proper date range', () => {
    expect(validateDateRange('2024-06-01', '2024-06-30')).toEqual({
      valid: true,
    });
  });

  it('returns valid when start equals end (single-day range)', () => {
    expect(validateDateRange('2024-06-15', '2024-06-15')).toEqual({
      valid: true,
    });
  });

  it('returns valid when end is omitted (open-ended)', () => {
    expect(validateDateRange('2024-06-01')).toEqual({ valid: true });
  });

  it('returns valid when end is undefined', () => {
    expect(validateDateRange('2024-06-01', undefined)).toEqual({
      valid: true,
    });
  });

  it('returns error when start is empty', () => {
    const result = validateDateRange('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Start date is required.');
  });

  it('returns error when end is before start', () => {
    const result = validateDateRange('2024-06-30', '2024-06-01');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('End date must be after start date.');
  });

  it('returns error when start is empty and end is provided', () => {
    const result = validateDateRange('', '2024-06-30');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Start date is required.');
  });
});
