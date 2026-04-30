import { describe, expect, it } from 'vitest';
import { rankFromMastery, updateTopicProfile } from '../lib/mastery';
import type { Attempt } from '../types';

function attempt(scoreRatio: number): Attempt {
  return {
    id: crypto.randomUUID(),
    profileId: 'p1',
    questionId: 'q1',
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    marksEarned: scoreRatio * 10,
    marksAvailable: 10,
    scoreRatio,
    mistakeType: 'no_issue',
    timeSpentSeconds: 120,
    markSchemeRevealed: true,
    attemptedAt: new Date().toISOString(),
  };
}

describe('mastery', () => {
  it('updates topic profile from attempts', () => {
    const profile = updateTopicProfile(undefined, attempt(0.8));
    expect(profile.attempts).toBe(1);
    expect(profile.masteryScore).toBeGreaterThan(0.7);
  });

  it('requires enough attempts for higher ranks', () => {
    expect(rankFromMastery(0.95, 1)).toBe('none');
    expect(rankFromMastery(0.8, 6)).toBe('gold');
  });
});
