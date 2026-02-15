// ─── Auth ────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  timezone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  avatarUrl?: string | null;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

// ─── Category ────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
  order: number;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  order?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  order?: number;
}

// ─── Day State ───────────────────────────────────────────────

export interface DayState {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
  order: number;
  score: number;
}

export interface CreateDayStateRequest {
  name: string;
  color: string;
  order?: number;
  score: number;
}

export interface UpdateDayStateRequest {
  name?: string;
  color?: string;
  order?: number;
  score?: number;
}

// ─── Event Group (Chapter) ──────────────────────────────────

export interface EventGroupCategory {
  id: string;
  name: string;
  color: string;
}

export interface EventPeriod {
  id: string;
  startDate: string;
  endDate: string | null;
  comment: string | null;
  createdAt: string;
}

export interface EventGroup {
  id: string;
  title: string;
  description: string | null;
  category: EventGroupCategory;
  periods: EventPeriod[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventGroupRequest {
  categoryId: string;
  title: string;
  description?: string;
}

export interface UpdateEventGroupRequest {
  categoryId?: string;
  title?: string;
  description?: string;
}

export interface CreateEventPeriodRequest {
  startDate: string;
  endDate?: string;
  comment?: string;
}

export interface UpdateEventPeriodRequest {
  startDate?: string;
  endDate?: string;
  comment?: string;
}

export interface CloseEventPeriodRequest {
  endDate: string;
}

export interface EventGroupQueryParams {
  from?: string;
  to?: string;
}

export interface MoodStat {
  dayStateName: string;
  dayStateColor: string;
  count: number;
  percentage: number;
}

export interface EventGroupDetailsMedia {
  id: string;
  s3Key: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
}

// ─── Analytics ──────────────────────────────────────────────

export interface MoodDistributionItem {
  moodId: string;
  moodName: string;
  color: string;
  count: number;
  percentage: number;
}

export interface CategoryMoodSummary {
  categoryId: string;
  name: string;
  averageMoodScore: number;
}

export interface TrendPoint {
  date: string;
  score: number;
}

export interface WeekdayInsight {
  weekday: number;
  averageScore: number;
  sampleSize: number;
}

export interface ActivityInsight {
  weekday: number;
  averageActivityScore: number;
  sampleSize: number;
}

export interface VolatilityInsight {
  weekday: number;
  standardDeviation: number;
  sampleSize: number;
}

export interface RecoveryInsight {
  weekday: number;
  recoveryRate: number;
  recoveryEvents: number;
  totalOccurrences: number;
}

export interface BurnoutInsight {
  detected: boolean;
  type?: string;
  confidence?: number;
}

export interface WeekdayInsights {
  bestMoodDay: WeekdayInsight | null;
  worstMoodDay: WeekdayInsight | null;
  mostActiveDay: ActivityInsight | null;
  leastActiveDay: ActivityInsight | null;
  mostUnstableDay: VolatilityInsight | null;
  recoveryIndex: RecoveryInsight | null;
  burnoutPattern: BurnoutInsight | null;
}

export interface MoodOverviewResponse {
  totalDaysWithMood: number;
  averageMoodScore: number;
  moodDistribution: MoodDistributionItem[];
  bestCategory: CategoryMoodSummary | null;
  worstCategory: CategoryMoodSummary | null;
  trendLast30Days: TrendPoint[];
  weekdayInsights: WeekdayInsights | null;
}

export interface PeriodDensity {
  start: string;
  end: string;
  activeDays: number;
}

export interface ChapterAnalytics {
  totalPeriods: number;
  totalDays: number;
  totalMedia: number;
  averageMoodScore: number | null;
  moodDistribution: MoodDistributionItem[];
  density: PeriodDensity[];
}

// ─── Event Group Details ────────────────────────────────────

export interface EventGroupDetails extends EventGroup {
  moodStats: MoodStat[];
  media: EventGroupDetailsMedia[];
  totalDays: number;
  analytics: ChapterAnalytics;
}

// ─── Timeline Period (used in timeline/memories responses) ───

export interface TimelinePeriod {
  id: string;
  startDate: string;
  endDate: string | null;
  comment: string | null;
  eventGroup: { id: string; title: string };
  category: { id: string; name: string; color: string };
}

// ─── Day ─────────────────────────────────────────────────────

export interface DayDayState {
  id: string;
  name: string;
  color: string;
}

export interface DayMedia {
  id: string;
  s3Key: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export interface Day {
  id: string;
  date: string;
  dayState: DayDayState | null;
  mainMediaId: string | null;
  media: DayMedia[];
}

export interface UpsertDayRequest {
  dayStateId?: string | null;
  mainMediaId?: string | null;
}

export interface CreateDayMediaRequest {
  s3Key: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface DayQueryParams {
  from: string;
  to: string;
}

// ─── Timeline ────────────────────────────────────────────────

export interface TimelineResponse {
  from: string;
  to: string;
  periods: TimelinePeriod[];
  days: Day[];
}

export interface TimelineQueryParams {
  from?: string;
  to?: string;
}

export interface WeekTimelineResponse {
  weekStart: string;
  weekEnd: string;
  periods: TimelinePeriod[];
  days: Day[];
}

export interface WeekQueryParams {
  date: string;
}

// ─── Uploads ─────────────────────────────────────────────────

export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  size: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
}

// ─── Memories ───────────────────────────────────────────────

export interface MemoryMood {
  id: string;
  name: string;
  color: string;
}

export interface MemoryInterval {
  type: 'months' | 'years';
  value: number;
}

export interface Memory {
  interval: MemoryInterval;
  date: string;
  mood: MemoryMood | null;
  mediaCount: number;
}

export interface OnThisDayResponse {
  baseDate: string;
  memories: Memory[];
}

export interface DayContextMemory {
  interval: MemoryInterval;
  date: string;
  mood: MemoryMood | null;
  mediaCount: number;
}

export interface DayContextResponse {
  type: 'day';
  baseDate: string;
  memories: DayContextMemory[];
}

export type MemoriesContextMode = 'day' | 'week';

export interface MemoriesContextParams {
  mode: MemoriesContextMode;
  date: string;
}

// ─── Recommendations ────────────────────────────────────────

export interface Recommendation {
  key: string;
  color: string;
}

export interface RecommendationsResponse {
  categories: Recommendation[];
  moods: Recommendation[];
}

export interface CreateFromRecommendationRequest {
  key: string;
  name: string;
}

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
  | 'HTTP_ERROR';
