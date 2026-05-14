import { describe, expect, it } from 'vitest';
import { rankFromMastery, updateTopicProfile } from '../lib/mastery';
import { toMasteryEvidence } from '../lib/masteryEvidence';
import type { Attempt } from '../types';

function attempt(scoreRatio: number, difficulty = 'foundation'): Attempt {
  return {
    id: crypto.randomUUID(),
    profileId: 'p1',
    questionId: 'q1',
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    difficulty,
    marksEarned: scoreRatio * 10,
    marksAvailable: 10,
    scoreRatio,
    mistakeType: 'no_issue',
    timeSpentSeconds: 120,
    markSchemeRevealed: true,
    attemptedAt: new Date().toISOString(),
    masteryEligible: true,
    validatedRegionId: 'algebra-forge',
  };
}

function evidence(scoreRatio: number, difficulty = 'foundation') {
  return toMasteryEvidence({ attempt: attempt(scoreRatio, difficulty) })!;
}

describe('mastery', () => {
  it('updates topic profile from attempts', () => {
    const profile = updateTopicProfile(undefined, evidence(0.8));
    expect(profile.attempts).toBe(1);
    expect(profile.masteryScore).toBeGreaterThan(0.7);
  });

  it('requires enough attempts for higher ranks', () => {
    expect(rankFromMastery(0.95, 1)).toBe('none');
    expect(rankFromMastery(0.8, 6)).toBe('gold');
  });

  it('keeps topic mastery unchanged when only difficulty metadata changes', () => {
    const base = updateTopicProfile(undefined, evidence(0.8, 'foundation'));
    const changedDifficulty = updateTopicProfile(undefined, evidence(0.8, 'challenge'));

    expect(changedDifficulty).toMatchObject({
      attempts: base.attempts,
      totalMarksEarned: base.totalMarksEarned,
      totalMarksAvailable: base.totalMarksAvailable,
      recentRatios: base.recentRatios,
      masteryScore: base.masteryScore,
      rank: base.rank,
    });
  });
});
