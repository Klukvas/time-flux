export function getMoodEmoji(score: number): string {
  if (score <= 2) return '\u{1F621}';
  if (score <= 4) return '\u{1F641}';
  if (score <= 6) return '\u{1F610}';
  if (score <= 8) return '\u{1F642}';
  return '\u{1F604}';
}

/** Returns an i18n key for the mood label. Use with t() to get the translated string. */
export function getMoodLabelKey(score: number): string {
  if (score <= 2) return 'mood_score.very_negative';
  if (score <= 4) return 'mood_score.negative';
  if (score <= 6) return 'mood_score.neutral';
  if (score <= 8) return 'mood_score.positive';
  return 'mood_score.very_positive';
}

/** @deprecated Use getMoodLabelKey() with t() for localized labels. */
export function getMoodLabel(score: number): string {
  if (score <= 2) return 'Very Negative';
  if (score <= 4) return 'Negative';
  if (score <= 6) return 'Neutral';
  if (score <= 8) return 'Positive';
  return 'Very Positive';
}
