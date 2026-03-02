/**
 * Frontend types — auto-generated from backend OpenAPI spec.
 *
 * These are stable aliases for the generated schema types.
 * Downstream consumers import from here (unchanged API surface).
 *
 * To regenerate: cd fe && npm run generate:api
 */
import type { components } from './generated/api-types';

type Schemas = components['schemas'];

// ─── Auth ────────────────────────────────────────────────────

export type AuthUser = Schemas['AuthUserDto'];
export type AuthResponse = Schemas['AuthResponseDto'];
export type LoginRequest = Schemas['LoginDto'];
export type RegisterRequest = Schemas['RegisterDto'];

// ─── Category ────────────────────────────────────────────────

export type Category = Schemas['CategoryResponseDto'];
export type CreateCategoryRequest = Schemas['CreateCategoryDto'];
export type UpdateCategoryRequest = Schemas['UpdateCategoryDto'];
export type CreateFromRecommendationRequest =
  Schemas['CreateCategoryFromRecommendationDto'];

// ─── Day State ───────────────────────────────────────────────

export type DayState = Schemas['DayStateResponseDto'];
export type CreateDayStateRequest = Schemas['CreateDayStateDto'];
export type UpdateDayStateRequest = Schemas['UpdateDayStateDto'];

// ─── Event Group (Chapter) ──────────────────────────────────

export type EventGroupCategory = Schemas['EventGroupCategoryDto'];
export type EventPeriod = Schemas['EventPeriodResponseDto'];
export type EventGroup = Schemas['EventGroupResponseDto'];
export type CreateEventGroupRequest = Schemas['CreateEventGroupDto'];
export type UpdateEventGroupRequest = Schemas['UpdateEventGroupDto'];
export type CreateEventPeriodRequest = Schemas['CreateEventPeriodDto'];
export type UpdateEventPeriodRequest = Schemas['UpdateEventPeriodDto'];
export type CloseEventPeriodRequest = Schemas['CloseEventPeriodDto'];

// ─── Event Group Details ────────────────────────────────────

export type MoodStat = Schemas['MoodStatDto'];
export type EventGroupDetailsMedia = Schemas['EventGroupDetailsMediaDto'];
export type PeriodDensity = Schemas['PeriodDensityDto'];
export type ChapterAnalytics = Schemas['ChapterAnalyticsDto'];
export type EventGroupDetails = Schemas['EventGroupDetailsResponseDto'];

// ─── Analytics ──────────────────────────────────────────────

export type MoodDistributionItem = Schemas['MoodDistributionItemDto'];
export type CategoryMoodSummary = Schemas['CategoryMoodSummaryDto'];
export type TrendPoint = Schemas['TrendPointDto'];
export type WeekdayInsight = Schemas['WeekdayInsightDto'];
export type ActivityInsight = Schemas['ActivityInsightDto'];
export type VolatilityInsight = Schemas['VolatilityInsightDto'];
export type RecoveryInsight = Schemas['RecoveryInsightDto'];
export type BurnoutInsight = Schemas['BurnoutInsightDto'];
export type WeekdayInsights = Schemas['WeekdayInsightsDto'];
export type MoodOverviewResponse = Schemas['MoodOverviewResponseDto'];

// ─── Day ─────────────────────────────────────────────────────

export type DayDayState = Schemas['DayStateSummaryDto'];
export type DayMedia = Schemas['DayMediaResponseDto'];
export type Day = Schemas['DayResponseDto'];
export type UpsertDayRequest = Schemas['UpsertDayDto'];
export type UpdateDayLocationRequest = Schemas['UpdateDayLocationDto'];
export type CreateDayMediaRequest = Schemas['CreateDayMediaDto'];

// ─── Timeline ────────────────────────────────────────────────

export type TimelineDay = Schemas['TimelineDayDto'];
export type TimelinePeriod = Schemas['TimelinePeriodDto'];
export type TimelineResponse = Schemas['TimelineResponseDto'];
export type WeekTimelineResponse = Schemas['WeekTimelineResponseDto'];

// ─── Uploads ─────────────────────────────────────────────────

export type PresignedUrlRequest = Schemas['PresignedUrlRequestDto'];
export type PresignedUrlResponse = Schemas['PresignedUrlResponseDto'];

// ─── Memories ───────────────────────────────────────────────

export type MemoryMood = Schemas['MoodDto'];
export type MemoryInterval = Schemas['IntervalDto'];
export type Memory = Schemas['DayMemoryDto'];
export type OnThisDayResponse = Schemas['OnThisDayResponseDto'];
export type DayContextMemory = Schemas['DayMemoryDto'];
export type DayContextResponse = Schemas['DayContextResponseDto'];
export type WeekContextMemory = Schemas['WeekMemoryDto'];
export type WeekContextResponse = Schemas['WeekContextResponseDto'];
export type MemoriesContextResponse = DayContextResponse | WeekContextResponse;

// ─── Recommendations ────────────────────────────────────────

export type Recommendation = Schemas['RecommendationDto'];
export type RecommendationsResponse = Schemas['RecommendationsResponseDto'];

// ─── Subscription ───────────────────────────────────────────

export type SubscriptionLimits = Schemas['SubscriptionLimitsDto'];
export type SubscriptionUsage = Schemas['SubscriptionUsageDto'];
export type SubscriptionResponse = Schemas['SubscriptionResponseDto'];
export type CancelSubscriptionResponse = Schemas['CancelResponseDto'];

// ─── API Error (not in OpenAPI — frontend-only) ─────────────
// See types-local.ts for ErrorCode and other frontend-only types

export type { ApiErrorResponse, ErrorCode } from './types-local';
