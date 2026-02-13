export const QUERY_KEYS = {
  categories: ['categories'] as const,
  dayStates: ['day-states'] as const,
  eventGroups: (params?: { from?: string; to?: string }) =>
    params ? (['event-groups', params] as const) : (['event-groups'] as const),
  eventGroup: (id: string) => ['event-groups', id] as const,
  eventGroupDetails: (id: string) => ['event-groups', id, 'details'] as const,
  days: (params: { from: string; to: string }) => ['days', params] as const,
  dayMedia: (date: string) => ['day-media', date] as const,
  timeline: (params?: { from?: string; to?: string }) =>
    params ? (['timeline', params] as const) : (['timeline'] as const),
  week: (date: string) => ['timeline', 'week', date] as const,
  onThisDay: ['memories', 'on-this-day'] as const,
  memoriesContext: (mode: string, date: string) => ['memories', mode, date] as const,
  recommendations: ['recommendations'] as const,
  moodOverview: ['analytics', 'mood-overview'] as const,
};

export const STALE_TIMES = {
  categories: 5 * 60 * 1000,
  dayStates: 5 * 60 * 1000,
  eventGroups: 60 * 1000,
  timeline: 60 * 1000,
  days: 60 * 1000,
  memories: 5 * 60 * 1000,
  recommendations: 10 * 60 * 1000,
  analytics: 5 * 60 * 1000,
};

export const DATE_FORMAT = 'yyyy-MM-dd';

export const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const MAX_COMMENT_LENGTH = 300;
export const MAX_NAME_LENGTH = 100;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
