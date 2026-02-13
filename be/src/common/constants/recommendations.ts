export const CATEGORY_RECOMMENDATIONS = [
  { key: 'work', color: '#3B82F6' },
  { key: 'education', color: '#6366F1' },
  { key: 'relationship', color: '#EC4899' },
  { key: 'health', color: '#10B981' },
  { key: 'hobby', color: '#F59E0B' },
  { key: 'travel', color: '#0EA5E9' },
  { key: 'living', color: '#8B5CF6' },
  { key: 'finance', color: '#14B8A6' },
] as const;

export const MOOD_RECOMMENDATIONS = [
  { key: 'great', color: '#22C55E', score: 9 },
  { key: 'good', color: '#84CC16', score: 7 },
  { key: 'okay', color: '#FACC15', score: 5 },
  { key: 'bad', color: '#F97316', score: 3 },
  { key: 'terrible', color: '#EF4444', score: 1 },
] as const;

export type CategoryRecommendationKey = (typeof CATEGORY_RECOMMENDATIONS)[number]['key'];
export type MoodRecommendationKey = (typeof MOOD_RECOMMENDATIONS)[number]['key'];
