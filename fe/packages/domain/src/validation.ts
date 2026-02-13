import {
  COLOR_REGEX,
  MAX_COMMENT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '@lifespan/constants';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: false, error: 'Email is required.' };
  if (!emailRegex.test(email)) return { valid: false, error: 'Enter a valid email address.' };
  return { valid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: 'Password is required.' };
  if (password.length < MIN_PASSWORD_LENGTH)
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  if (password.length > MAX_PASSWORD_LENGTH)
    return { valid: false, error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.` };
  return { valid: true };
}

export function validateName(name: string): ValidationResult {
  if (!name.trim()) return { valid: false, error: 'Name is required.' };
  if (name.length > MAX_NAME_LENGTH)
    return { valid: false, error: `Name must be at most ${MAX_NAME_LENGTH} characters.` };
  return { valid: true };
}

export function validateColor(color: string): ValidationResult {
  if (!color) return { valid: false, error: 'Color is required.' };
  if (!COLOR_REGEX.test(color)) return { valid: false, error: 'Enter a valid hex color (e.g., #FF5733).' };
  return { valid: true };
}

export function validateComment(comment: string): ValidationResult {
  if (comment.length > MAX_COMMENT_LENGTH)
    return { valid: false, error: `Comment must be at most ${MAX_COMMENT_LENGTH} characters.` };
  return { valid: true };
}

export function validateTitle(title: string): ValidationResult {
  if (!title.trim()) return { valid: false, error: 'Title is required.' };
  if (title.length > MAX_TITLE_LENGTH)
    return { valid: false, error: `Title must be at most ${MAX_TITLE_LENGTH} characters.` };
  return { valid: true };
}

export function validateDescription(description: string): ValidationResult {
  if (description.length > MAX_DESCRIPTION_LENGTH)
    return { valid: false, error: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.` };
  return { valid: true };
}

export function validateDateRange(start: string, end?: string): ValidationResult {
  if (!start) return { valid: false, error: 'Start date is required.' };
  if (end && end < start) return { valid: false, error: 'End date must be after start date.' };
  return { valid: true };
}
