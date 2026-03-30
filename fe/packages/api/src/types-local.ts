/**
 * Frontend-only types — NOT derived from the backend OpenAPI spec.
 *
 * These are query parameter shapes, error codes, and other types
 * used exclusively by the frontend.
 */

// ─── API Error ───────────────────────────────────────────────

export interface ApiErrorResponse {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ErrorCode =
  | 'USER_NOT_FOUND'
  | 'EVENT_GROUP_NOT_FOUND'
  | 'EVENT_GROUP_IN_USE'
  | 'EVENT_PERIOD_NOT_FOUND'
  | 'ACTIVE_PERIOD_EXISTS'
  | 'EVENT_NOT_FOUND'
  | 'EVENT_ALREADY_CLOSED'
  | 'INVALID_DATE_RANGE'
  | 'CATEGORY_NOT_FOUND'
  | 'DAY_STATE_NOT_FOUND'
  | 'DAY_NOT_FOUND'
  | 'MEDIA_NOT_FOUND'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'FUTURE_DATE'
  | 'PERIOD_OVERLAP'
  | 'CATEGORY_IN_USE'
  | 'DAY_STATE_IN_USE'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'GOOGLE_AUTH_FAILED'
  | 'USER_CREATION_FAILED'
  | 'INTERNAL_ERROR'
  | 'HTTP_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'FEATURE_LOCKED'
  | 'SUBSCRIPTION_NOT_FOUND'
  | 'PADDLE_NOT_CONFIGURED'
  | 'PADDLE_CANCEL_ERROR'
  | 'PADDLE_UPGRADE_ERROR'
  | 'INVALID_UPGRADE';

// ─── Query Params (frontend-only) ───────────────────────────

export interface EventGroupQueryParams {
  from?: string;
  to?: string;
}

export interface DayQueryParams {
  from: string;
  to: string;
}

export interface TimelineQueryParams {
  from?: string;
  to?: string;
}

export interface WeekQueryParams {
  date: string;
}

export type MemoriesContextMode = 'day' | 'week';

export interface MemoriesContextParams {
  mode: MemoriesContextMode;
  date: string;
}

// ─── Subscription Tier/Status (convenience re-exports) ──────

export interface ChangePlanRequest {
  tier: 'PRO' | 'PREMIUM';
}

export interface ChangePlanResponse {
  message: string;
  tier: 'PRO' | 'PREMIUM';
}

export interface PlanPrice {
  tier: string;
  amount: string;
  currency: string;
  interval: string;
}

export type SubscriptionTier = 'FREE' | 'PRO' | 'PREMIUM';
export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'PAUSED';
