import { describe, it, expect } from 'vitest';
import { getMoodEmoji, getMoodLabelKey, getMoodLabel } from './mood-score';

describe('getMoodEmoji', () => {
  it.each([
    [0, '\u{1F621}'],
    [1, '\u{1F621}'],
    [2, '\u{1F621}'],
    [3, '\u{1F641}'],
    [4, '\u{1F641}'],
    [5, '\u{1F610}'],
    [6, '\u{1F610}'],
    [7, '\u{1F642}'],
    [8, '\u{1F642}'],
    [9, '\u{1F604}'],
    [10, '\u{1F604}'],
  ])('score %d returns correct emoji', (score, emoji) => {
    expect(getMoodEmoji(score)).toBe(emoji);
  });
});

describe('getMoodLabelKey', () => {
  it.each([
    [1, 'mood_score.very_negative'],
    [3, 'mood_score.negative'],
    [5, 'mood_score.neutral'],
    [7, 'mood_score.positive'],
    [9, 'mood_score.very_positive'],
  ])('score %d returns key %s', (score, key) => {
    expect(getMoodLabelKey(score)).toBe(key);
  });
});

describe('getMoodLabel', () => {
  it.each([
    [1, 'Very Negative'],
    [3, 'Negative'],
    [5, 'Neutral'],
    [7, 'Positive'],
    [9, 'Very Positive'],
  ])('score %d returns label %s', (score, label) => {
    expect(getMoodLabel(score)).toBe(label);
  });
});
