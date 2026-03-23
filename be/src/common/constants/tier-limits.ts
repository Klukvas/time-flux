export type TierLimitResource =
  | 'media'
  | 'chapters'
  | 'categories'
  | 'dayStates';
export type TierFeature = 'analytics' | 'memories' | 'birthDate';
export type AnalyticsAccess = boolean | 'basic';

export interface TierLimits {
  media: number;
  chapters: number;
  categories: number;
  dayStates: number;
  analytics: AnalyticsAccess;
  memories: boolean;
  birthDate: boolean;
}

/** Resource limits per subscription tier. -1 = unlimited. */
export const TIER_LIMITS: Record<string, TierLimits> = {
  FREE: {
    media: 50,
    chapters: 5,
    categories: 5,
    dayStates: 5,
    analytics: 'basic',
    memories: false,
    birthDate: false,
  },
  PRO: {
    media: 500,
    chapters: 30,
    categories: 20,
    dayStates: 20,
    analytics: true,
    memories: false,
    birthDate: true,
  },
  PREMIUM: {
    media: -1,
    chapters: -1,
    categories: -1,
    dayStates: -1,
    analytics: true,
    memories: true,
    birthDate: true,
  },
} as const;
