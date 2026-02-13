import type { ApiErrorResponse, ErrorCode } from '@lifespan/api';
import { ERROR_MESSAGES, ERROR_TRANSLATION_KEYS } from '@lifespan/constants';

/** Get a user-friendly error message from an API error response (English fallback). */
export function getUserMessage(apiError: ApiErrorResponse): string {
  const code = apiError.error_code as ErrorCode;
  return ERROR_MESSAGES[code] ?? apiError.message ?? ERROR_MESSAGES.INTERNAL_ERROR;
}

/** Get the i18n translation key for an API error. Use with `t(key)` from @lifespan/i18n. */
export function getErrorTranslationKey(apiError: ApiErrorResponse): string {
  const code = apiError.error_code as ErrorCode;
  return ERROR_TRANSLATION_KEYS[code] ?? 'errors.internal_error';
}

/** Check if an API error matches a specific error code. */
export function isErrorCode(apiError: ApiErrorResponse, code: ErrorCode): boolean {
  return apiError.error_code === code;
}

/** Check if an error is an authentication error. */
export function isAuthError(apiError: ApiErrorResponse): boolean {
  return apiError.error_code === 'UNAUTHORIZED' || apiError.error_code === 'FORBIDDEN';
}

/** Check if an error is a conflict (in-use) error. */
export function isConflictError(apiError: ApiErrorResponse): boolean {
  return (
    apiError.error_code === 'CATEGORY_IN_USE' ||
    apiError.error_code === 'DAY_STATE_IN_USE' ||
    apiError.error_code === 'PERIOD_OVERLAP' ||
    apiError.error_code === 'EVENT_ALREADY_CLOSED' ||
    apiError.error_code === 'EVENT_GROUP_IN_USE' ||
    apiError.error_code === 'ACTIVE_PERIOD_EXISTS'
  );
}
