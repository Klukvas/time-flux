export type TierLimitResource = 'media' | 'chapters' | 'categories' | 'dayStates';
export type TierFeature = 'analytics' | 'memories';

export interface TierLimits {
  media: number;
  chapters: number;
  categories: number;
  dayStates: number;
  analytics: boolean;
  memories: boolean;
}

/** Resource limits per subscription tier. -1 = unlimited. */
export const TIER_LIMITS: Record<string, TierLimits> = {
  FREE: { media: 50, chapters: 5, categories: 5, dayStates: 5, analytics: false, memories: false },
  PRO: { media: 500, chapters: 30, categories: 20, dayStates: 20, analytics: true, memories: false },
  PREMIUM: { media: -1, chapters: -1, categories: -1, dayStates: -1, analytics: true, memories: true },
} as const;
