export function getMoodEmoji(score: number): string {
  if (score <= 2) return '\u{1F621}';
  if (score <= 4) return '\u{1F641}';
  if (score <= 6) return '\u{1F610}';
  if (score <= 8) return '\u{1F642}';
  return '\u{1F604}';
}

export function getMoodLabel(score: number): string {
  if (score <= 2) return 'Very Negative';
  if (score <= 4) return 'Negative';
  if (score <= 6) return 'Neutral';
  if (score <= 8) return 'Positive';
  return 'Very Positive';
}
