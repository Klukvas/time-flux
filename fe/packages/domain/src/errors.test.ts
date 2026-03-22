import { describe, it, expect } from 'vitest';
import type { ApiErrorResponse, ErrorCode } from '@timeflux/api';
import {
  getUserMessage,
  getErrorTranslationKey,
  isErrorCode,
  isAuthError,
  isConflictError,
} from './errors';

// ─── Helpers ──────────────────────────────────────────────────

function makeApiError(
  overrides: Partial<ApiErrorResponse> = {},
): ApiErrorResponse {
  return {
    error_code: 'INTERNAL_ERROR',
    message: 'Something went wrong',
    ...overrides,
  };
}

// ─── getUserMessage ───────────────────────────────────────────

describe('getUserMessage', () => {
  it('returns the mapped message for a known error code', () => {
    const error = makeApiError({ error_code: 'USER_NOT_FOUND' });
    expect(getUserMessage(error)).toBe('User not found.');
  });

  it('returns correct message for UNAUTHORIZED', () => {
    const error = makeApiError({ error_code: 'UNAUTHORIZED' });
    expect(getUserMessage(error)).toBe('Invalid email or password.');
  });

  it('returns correct message for FORBIDDEN', () => {
    const error = makeApiError({ error_code: 'FORBIDDEN' });
    expect(getUserMessage(error)).toBe(
      'You do not have permission to perform this action.',
    );
  });

  it('returns correct message for VALIDATION_ERROR', () => {
    const error = makeApiError({ error_code: 'VALIDATION_ERROR' });
    expect(getUserMessage(error)).toBe(
      'Please check your input and try again.',
    );
  });

  it('returns correct message for CATEGORY_IN_USE', () => {
    const error = makeApiError({ error_code: 'CATEGORY_IN_USE' });
    expect(getUserMessage(error)).toBe(
      'This category cannot be deleted because it has chapters.',
    );
  });

  it('returns correct message for PERIOD_OVERLAP', () => {
    const error = makeApiError({ error_code: 'PERIOD_OVERLAP' });
    expect(getUserMessage(error)).toBe(
      'An active period already exists in this chapter.',
    );
  });

  it('returns correct message for FILE_TOO_LARGE', () => {
    const error = makeApiError({ error_code: 'FILE_TOO_LARGE' });
    expect(getUserMessage(error)).toBe(
      'File is too large. Maximum size is 50 MB.',
    );
  });

  it('returns correct message for QUOTA_EXCEEDED', () => {
    const error = makeApiError({ error_code: 'QUOTA_EXCEEDED' });
    expect(getUserMessage(error)).toBe(
      'You have reached the limit for your current plan.',
    );
  });

  it('returns correct message for FEATURE_LOCKED', () => {
    const error = makeApiError({ error_code: 'FEATURE_LOCKED' });
    expect(getUserMessage(error)).toBe(
      'This feature requires a higher subscription tier.',
    );
  });

  it('falls back to apiError.message for unknown error codes', () => {
    const error = makeApiError({
      error_code: 'UNKNOWN_CODE_XYZ',
      message: 'Custom backend message',
    });
    expect(getUserMessage(error)).toBe('Custom backend message');
  });

  it('returns the apiError.message for unknown code even when message is empty string', () => {
    // `??` only falls through for null/undefined, not empty string
    const error: ApiErrorResponse = {
      error_code: 'UNKNOWN_CODE_XYZ',
      message: '',
    };
    expect(getUserMessage(error)).toBe('');
  });

  it('falls back to INTERNAL_ERROR when unknown code and message is undefined-ish', () => {
    // When both ERROR_MESSAGES[code] and apiError.message are nullish,
    // the chain resolves to ERROR_MESSAGES.INTERNAL_ERROR
    const error = {
      error_code: 'TOTALLY_UNKNOWN',
      message: undefined,
    } as unknown as ApiErrorResponse;
    expect(getUserMessage(error)).toBe(
      'Something went wrong. Please try again later.',
    );
  });

  it('returns INTERNAL_ERROR message for INTERNAL_ERROR code', () => {
    const error = makeApiError({ error_code: 'INTERNAL_ERROR' });
    expect(getUserMessage(error)).toBe(
      'Something went wrong. Please try again later.',
    );
  });

  it('returns HTTP_ERROR message for network errors', () => {
    const error = makeApiError({ error_code: 'HTTP_ERROR' });
    expect(getUserMessage(error)).toBe(
      'A network error occurred. Please try again.',
    );
  });
});

// ─── getErrorTranslationKey ───────────────────────────────────

describe('getErrorTranslationKey', () => {
  it('returns correct key for USER_NOT_FOUND', () => {
    const error = makeApiError({ error_code: 'USER_NOT_FOUND' });
    expect(getErrorTranslationKey(error)).toBe('errors.user_not_found');
  });

  it('returns correct key for UNAUTHORIZED', () => {
    const error = makeApiError({ error_code: 'UNAUTHORIZED' });
    expect(getErrorTranslationKey(error)).toBe('errors.unauthorized');
  });

  it('returns correct key for FORBIDDEN', () => {
    const error = makeApiError({ error_code: 'FORBIDDEN' });
    expect(getErrorTranslationKey(error)).toBe('errors.forbidden');
  });

  it('returns correct key for VALIDATION_ERROR', () => {
    const error = makeApiError({ error_code: 'VALIDATION_ERROR' });
    expect(getErrorTranslationKey(error)).toBe('errors.validation_error');
  });

  it('returns correct key for PERIOD_OVERLAP', () => {
    const error = makeApiError({ error_code: 'PERIOD_OVERLAP' });
    expect(getErrorTranslationKey(error)).toBe('errors.period_overlap');
  });

  it('returns correct key for QUOTA_EXCEEDED', () => {
    const error = makeApiError({ error_code: 'QUOTA_EXCEEDED' });
    expect(getErrorTranslationKey(error)).toBe('errors.quota_exceeded');
  });

  it('returns correct key for FEATURE_LOCKED', () => {
    const error = makeApiError({ error_code: 'FEATURE_LOCKED' });
    expect(getErrorTranslationKey(error)).toBe('errors.feature_locked');
  });

  it('returns fallback key for unknown error codes', () => {
    const error = makeApiError({ error_code: 'SOME_UNKNOWN_ERROR' });
    expect(getErrorTranslationKey(error)).toBe('errors.internal_error');
  });

  it('returns correct key for GOOGLE_AUTH_FAILED', () => {
    const error = makeApiError({ error_code: 'GOOGLE_AUTH_FAILED' });
    expect(getErrorTranslationKey(error)).toBe('errors.google_auth_failed');
  });

  it('returns correct key for PADDLE_CANCEL_ERROR', () => {
    const error = makeApiError({ error_code: 'PADDLE_CANCEL_ERROR' });
    expect(getErrorTranslationKey(error)).toBe('errors.paddle_cancel_error');
  });
});

// ─── isErrorCode ──────────────────────────────────────────────

describe('isErrorCode', () => {
  it('returns true when error_code matches', () => {
    const error = makeApiError({ error_code: 'USER_NOT_FOUND' });
    expect(isErrorCode(error, 'USER_NOT_FOUND')).toBe(true);
  });

  it('returns false when error_code does not match', () => {
    const error = makeApiError({ error_code: 'USER_NOT_FOUND' });
    expect(isErrorCode(error, 'UNAUTHORIZED')).toBe(false);
  });

  it('returns false for unknown error_code vs known code', () => {
    const error = makeApiError({ error_code: 'SOME_UNKNOWN' });
    expect(isErrorCode(error, 'INTERNAL_ERROR')).toBe(false);
  });

  it('works for every standard error code', () => {
    const codes: ErrorCode[] = [
      'USER_NOT_FOUND',
      'CATEGORY_NOT_FOUND',
      'DAY_NOT_FOUND',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'INTERNAL_ERROR',
    ];
    for (const code of codes) {
      const error = makeApiError({ error_code: code });
      expect(isErrorCode(error, code)).toBe(true);
    }
  });
});

// ─── isAuthError ──────────────────────────────────────────────

describe('isAuthError', () => {
  it('returns true for UNAUTHORIZED', () => {
    const error = makeApiError({ error_code: 'UNAUTHORIZED' });
    expect(isAuthError(error)).toBe(true);
  });

  it('returns true for FORBIDDEN', () => {
    const error = makeApiError({ error_code: 'FORBIDDEN' });
    expect(isAuthError(error)).toBe(true);
  });

  it('returns false for non-auth error codes', () => {
    const nonAuthCodes: ErrorCode[] = [
      'USER_NOT_FOUND',
      'INTERNAL_ERROR',
      'VALIDATION_ERROR',
      'CATEGORY_IN_USE',
      'HTTP_ERROR',
    ];
    for (const code of nonAuthCodes) {
      expect(isAuthError(makeApiError({ error_code: code }))).toBe(false);
    }
  });

  it('returns false for unknown error code', () => {
    const error = makeApiError({ error_code: 'COMPLETELY_RANDOM' });
    expect(isAuthError(error)).toBe(false);
  });
});

// ─── isConflictError ──────────────────────────────────────────

describe('isConflictError', () => {
  const conflictCodes: ErrorCode[] = [
    'CATEGORY_IN_USE',
    'DAY_STATE_IN_USE',
    'PERIOD_OVERLAP',
    'EVENT_ALREADY_CLOSED',
    'EVENT_GROUP_IN_USE',
    'ACTIVE_PERIOD_EXISTS',
  ];

  it('returns true for all conflict error codes', () => {
    for (const code of conflictCodes) {
      expect(isConflictError(makeApiError({ error_code: code }))).toBe(true);
    }
  });

  it('returns false for non-conflict error codes', () => {
    const nonConflictCodes: ErrorCode[] = [
      'USER_NOT_FOUND',
      'UNAUTHORIZED',
      'INTERNAL_ERROR',
      'VALIDATION_ERROR',
      'HTTP_ERROR',
      'FEATURE_LOCKED',
    ];
    for (const code of nonConflictCodes) {
      expect(isConflictError(makeApiError({ error_code: code }))).toBe(false);
    }
  });

  it('returns false for unknown error code', () => {
    const error = makeApiError({ error_code: 'SOMETHING_ELSE' });
    expect(isConflictError(error)).toBe(false);
  });
});
