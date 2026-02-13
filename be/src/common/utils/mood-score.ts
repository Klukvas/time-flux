/**
 * Mood scoring utilities.
 *
 * Uses the explicit `score` field (0-10) stored on each DayState.
 */

export function buildMoodScoreMap(
  dayStates: { id: string; score: number }[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const ds of dayStates) {
    map.set(ds.id, ds.score);
  }
  return map;
}

export function computeAverageMoodScore(
  days: { dayState?: { id: string } | null }[],
  scoreMap: Map<string, number>,
): number | null {
  const scores: number[] = [];

  for (const d of days) {
    if (d.dayState) {
      const s = scoreMap.get(d.dayState.id);
      if (s !== undefined && s >= 0) scores.push(s);
    }
  }

  if (scores.length === 0) return null;
  return (
    Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  );
}
