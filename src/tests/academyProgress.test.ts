import { describe, expect, it } from 'vitest';
import type { RegionDefinition, RegionProgress } from '../types';
import { calculateAcademySummary, nextRegionGoal } from '../lib/academyProgress';

const region: RegionDefinition = {
  id: 'algebra-forge',
  name: 'Algebra Forge',
  description: '',
  subtopics: [],
  activeByDefault: true,
  matchTerms: [],
};

function progress(overrides: Partial<RegionProgress>): RegionProgress {
  return {
    region,
    availableQuestions: 10,
    attempts: 0,
    totalMarksEarned: 0,
    totalMarksAvailable: 0,
    subtopicsTouched: 0,
    rank: 'Discovered',
    isActive: true,
    ...overrides,
  };
}

describe('academyProgress', () => {
  it('summarizes academy evidence from region progress', () => {
    const summary = calculateAcademySummary([
      progress({ attempts: 3, totalMarksEarned: 18, totalMarksAvailable: 30, rank: 'Bronze' }),
      progress({ attempts: 1, totalMarksEarned: 4, totalMarksAvailable: 10, rank: 'Discovered', region: { ...region, name: 'Trig Observatory' } }),
    ]);

    expect(summary.totalXp).toBe(22);
    expect(summary.averageScoreRatio).toBeCloseTo(0.55);
    expect(summary.restoredRegions).toBe(1);
    expect(summary.recommendedRegionName).toBe('Trig Observatory');
  });

  it('describes the next bronze goal for a new active region', () => {
    expect(nextRegionGoal(progress({ attempts: 1, averageScoreRatio: 0.8 })).label).toBe('Next Bronze: 2 more attempts.');
  });

  it('does not overclaim mastery for gold regions', () => {
    expect(nextRegionGoal(progress({ rank: 'Gold', attempts: 14, averageScoreRatio: 0.9, recentScoreRatio: 0.9 })).label)
      .toContain('Mixed mastery trials are reserved for a later pass');
  });
});
