import { buildMoodScoreMap, computeAverageMoodScore } from './mood-score.js';

describe('buildMoodScoreMap', () => {
  it('should map dayState IDs to their scores', () => {
    const dayStates = [
      { id: 'ds-1', score: 9 },
      { id: 'ds-2', score: 5 },
      { id: 'ds-3', score: 1 },
    ];

    const map = buildMoodScoreMap(dayStates);

    expect(map.get('ds-1')).toBe(9);
    expect(map.get('ds-2')).toBe(5);
    expect(map.get('ds-3')).toBe(1);
    expect(map.size).toBe(3);
  });

  it('should handle empty array', () => {
    const map = buildMoodScoreMap([]);
    expect(map.size).toBe(0);
  });

  it('should handle score of 0 (edge of valid range)', () => {
    const map = buildMoodScoreMap([{ id: 'ds-zero', score: 0 }]);
    expect(map.get('ds-zero')).toBe(0);
  });
});

describe('computeAverageMoodScore', () => {
  it('should compute correct average from scores', () => {
    const scoreMap = new Map([
      ['ds-great', 9],
      ['ds-good', 7],
      ['ds-okay', 5],
    ]);

    const days = [
      { dayState: { id: 'ds-great' } },
      { dayState: { id: 'ds-good' } },
      { dayState: { id: 'ds-okay' } },
    ];

    // (9 + 7 + 5) / 3 = 7.0
    expect(computeAverageMoodScore(days, scoreMap)).toBe(7);
  });

  it('should round to 1 decimal place', () => {
    const scoreMap = new Map([
      ['ds-great', 9],
      ['ds-bad', 3],
    ]);

    const days = [
      { dayState: { id: 'ds-great' } },
      { dayState: { id: 'ds-great' } },
      { dayState: { id: 'ds-bad' } },
    ];

    // (9 + 9 + 3) / 3 = 7.0
    expect(computeAverageMoodScore(days, scoreMap)).toBe(7);

    // More interesting rounding: (9 + 3) / 2 = 6.0
    expect(computeAverageMoodScore(days.slice(0, 2), scoreMap)).toBe(9);
  });

  it('should return null when no days have moods', () => {
    const scoreMap = new Map([['ds-1', 5]]);
    const days = [{ dayState: null }, { dayState: undefined }];

    expect(computeAverageMoodScore(days, scoreMap)).toBeNull();
  });

  it('should return null for empty array', () => {
    const scoreMap = new Map([['ds-1', 5]]);
    expect(computeAverageMoodScore([], scoreMap)).toBeNull();
  });

  it('should skip days with unknown dayState IDs', () => {
    const scoreMap = new Map([['ds-known', 8]]);

    const days = [
      { dayState: { id: 'ds-known' } },
      { dayState: { id: 'ds-unknown' } }, // not in scoreMap
    ];

    // Only ds-known contributes: 8 / 1 = 8.0
    expect(computeAverageMoodScore(days, scoreMap)).toBe(8);
  });

  it('should include score of 0 (valid minimum)', () => {
    const scoreMap = new Map([
      ['ds-zero', 0],
      ['ds-ten', 10],
    ]);

    const days = [
      { dayState: { id: 'ds-zero' } },
      { dayState: { id: 'ds-ten' } },
    ];

    // (0 + 10) / 2 = 5.0
    expect(computeAverageMoodScore(days, scoreMap)).toBe(5);
  });

  it('should exclude negative scores', () => {
    const scoreMap = new Map([
      ['ds-neg', -1],
      ['ds-good', 7],
    ]);

    const days = [
      { dayState: { id: 'ds-neg' } },
      { dayState: { id: 'ds-good' } },
    ];

    // -1 is excluded (< 0), only 7: avg = 7
    expect(computeAverageMoodScore(days, scoreMap)).toBe(7);
  });

  it('should handle all same scores correctly', () => {
    const scoreMap = new Map([['ds-1', 5]]);
    const days = Array.from({ length: 10 }, () => ({ dayState: { id: 'ds-1' } }));

    expect(computeAverageMoodScore(days, scoreMap)).toBe(5);
  });

  it('should produce correct result for realistic dataset', () => {
    // Great=9, Good=7, Okay=5, Bad=3, Terrible=1
    const scoreMap = new Map([
      ['ds-great', 9],
      ['ds-good', 7],
      ['ds-okay', 5],
      ['ds-bad', 3],
      ['ds-terrible', 1],
    ]);

    // 2 Great, 3 Good, 4 Okay, 1 Bad = 10 days
    // (2*9 + 3*7 + 4*5 + 1*3) / 10 = (18+21+20+3)/10 = 62/10 = 6.2
    const days = [
      ...Array(2).fill({ dayState: { id: 'ds-great' } }),
      ...Array(3).fill({ dayState: { id: 'ds-good' } }),
      ...Array(4).fill({ dayState: { id: 'ds-okay' } }),
      ...Array(1).fill({ dayState: { id: 'ds-bad' } }),
    ];

    expect(computeAverageMoodScore(days, scoreMap)).toBe(6.2);
  });
});
