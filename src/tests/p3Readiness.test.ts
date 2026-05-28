import { describe, expect, it } from 'vitest';
import { calculateP3ReadinessIndex, P3_READINESS_THRESHOLDS } from '../lib/p3Readiness';
import type { Attempt, RegionLearningRecord } from '../types';

const regions = [
  ['algebra-forge', 'Algebra Vault', 'Algebra', 'polynomial structure'],
  ['logarithm-grove', 'Logarithm Observatory', 'Logarithms', 'log equations'],
  ['trig-observatory', 'Trigonometry Spire', 'Trigonometry', 'trig equations'],
  ['complex-harbor', 'Argand Atrium', 'Complex numbers', 'argand loci'],
  ['calculus-cliffs', 'Calculus Cliffs', 'Differentiation', 'stationary points'],
  ['integration-gardens', 'Integral Terraces', 'Integration', 'integration by parts'],
  ['vector-workshop', 'Vectors Gate', 'Vectors', 'vector lines'],
  ['numerical-mines', 'Iteration Forge', 'Numerical methods', 'iteration'],
  ['differential-shrine', 'Differential Shrine', 'Differential equations', 'separation'],
] as const;

function isoDay(day: number): string {
  return new Date(Date.UTC(2026, 0, day, 12, 0, 0)).toISOString();
}

function attempt(overrides: Partial<Attempt> & { id: string; questionId: string; attemptedAt: string }): Attempt {
  const marksEarned = overrides.marksEarned ?? 8;
  const marksAvailable = overrides.marksAvailable ?? 10;
  return {
    profileId: 'profile-1',
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    subtopic: 'polynomial structure',
    marksEarned,
    markBreakdown: { m: Math.min(4, marksEarned), b: Math.min(2, Math.max(0, marksEarned - 4)), a: Math.max(0, marksEarned - 6) },
    marksAvailable,
    scoreRatio: marksEarned / marksAvailable,
    mistakeType: 'algebra_error',
    mistakeTypes: ['algebra_error'],
    timeSpentSeconds: 600,
    markSchemeRevealed: true,
    masteryEligible: true,
    validatedRegionId: 'algebra-forge',
    displayRegionId: 'algebra-forge',
    ...overrides,
  };
}

function broadAssessmentAttempts(): Attempt[] {
  return Array.from({ length: 36 }, (_, index) => {
    const [regionId, regionName, topic, subtopic] = regions[index % regions.length];
    return attempt({
      id: `broad-${index}`,
      questionId: `q-${index}`,
      regionName,
      topicDisplayName: topic,
      subtopic,
      attemptedAt: isoDay(index + 1),
      worldName: 'P3 Astral Academy',
      validatedRegionId: regionId,
      displayRegionId: regionId,
      marksEarned: 8,
      marksAvailable: 10,
      scoreRatio: 0.8,
      note: regionId,
    });
  });
}

function guardianCleared(regionId: string, index: number): RegionLearningRecord {
  return {
    regionId,
    guardianQuestionId: `guardian-${regionId}`,
    guardianAttemptId: `guardian-attempt-${regionId}`,
    guardianAttemptedAt: isoDay(50 + index),
    guardianClearedAt: isoDay(50 + index),
    updatedAt: isoDay(50 + index),
  };
}

describe('P3 readiness index', () => {
  it('recognizes strong readiness only from broad assessment evidence', () => {
    const readiness = calculateP3ReadinessIndex({
      attempts: broadAssessmentAttempts(),
      regionLearning: {
        'algebra-forge': guardianCleared('algebra-forge', 1),
        'trig-observatory': guardianCleared('trig-observatory', 2),
      },
    });

    expect(readiness.label).toBe('Strong evidence');
    expect(readiness.score).toBeGreaterThanOrEqual(P3_READINESS_THRESHOLDS.strongScore);
    expect(readiness.evidence.distinctRegions).toBe(9);
    expect(readiness.evidence.distinctSubtopics).toBe(9);
    expect(readiness.evidence.unseenTimedAttemptCount).toBe(36);
    expect(readiness.evidence.delayedReviewCount).toBeGreaterThanOrEqual(4);
    expect(readiness.evidence.guardianClears).toBe(2);
  });

  it('does not allow high scores on one repeated topic to produce full P3 readiness', () => {
    const narrowAttempts = Array.from({ length: 24 }, (_, index) => attempt({
      id: `narrow-${index}`,
      questionId: `algebra-q-${index}`,
      regionName: 'Algebra Vault',
      topicDisplayName: 'Algebra',
      subtopic: 'polynomial structure',
      attemptedAt: isoDay(index + 1),
      marksEarned: 9,
      marksAvailable: 10,
      scoreRatio: 0.9,
      timeSpentSeconds: 600,
    }));

    const readiness = calculateP3ReadinessIndex({ attempts: narrowAttempts });

    expect(readiness.label).toBe('Promising but narrow');
    expect(readiness.score).toBeLessThan(P3_READINESS_THRESHOLDS.strongScore);
    expect(readiness.evidence.recentAverageScore).toBeCloseTo(0.9);
    expect(readiness.evidence.distinctRegions).toBe(1);
    expect(readiness.evidence.distinctSubtopics).toBe(1);
    expect(readiness.concerns.join(' ')).toContain('broader topic and subtopic coverage');
  });

  it('flags uncertain self-marking instead of treating marks as reliable readiness', () => {
    const uncertainAttempts = Array.from({ length: 8 }, (_, index) => attempt({
      id: `uncertain-${index}`,
      questionId: `uncertain-q-${index}`,
      attemptedAt: isoDay(index + 1),
      marksEarned: 7,
      marksAvailable: 10,
      scoreRatio: 0.7,
      mistakeType: undefined,
      mistakeTypes: [],
    }));

    const readiness = calculateP3ReadinessIndex({ attempts: uncertainAttempts });

    expect(readiness.label).toBe('Self-marking uncertain');
    expect(readiness.evidence.selfMarkingCalibrationRatio).toBe(0);
    expect(readiness.concerns.join(' ')).toContain('Self-marking evidence is uncertain');
  });

  it('ignores reveal-only, non-P3, and explicitly mastery-ineligible records when calculating readiness', () => {
    const readiness = calculateP3ReadinessIndex({
      attempts: [
        attempt({
          id: 'reveal-only',
          questionId: 'q-reveal',
          attemptedAt: isoDay(1),
          marksEarned: 10,
          marksAvailable: 10,
          scoreRatio: 1,
          markSchemeRevealed: false,
        }),
        attempt({
          id: 'p1-attempt',
          questionId: 'q-p1',
          attemptedAt: isoDay(2),
          paperFamily: 'p1',
          marksEarned: 10,
          marksAvailable: 10,
          scoreRatio: 1,
        }),
        attempt({
          id: 'unsafe-p3-attempt',
          questionId: 'q-unsafe',
          attemptedAt: isoDay(3),
          marksEarned: 10,
          marksAvailable: 10,
          scoreRatio: 1,
          masteryEligible: false,
          displayRegionId: 'algebra-forge',
        }),
      ],
    });

    expect(readiness.evidence.canonicalAttempts).toBe(0);
    expect(readiness.label).toBe('Needs timed practice');
  });

  it('does not use advisory attempt labels as region or subtopic readiness coverage', () => {
    const readiness = calculateP3ReadinessIndex({
      attempts: [
        attempt({
          id: 'legacy-label-only',
          questionId: 'legacy-q1',
          attemptedAt: isoDay(1),
          regionName: 'Algebra Vault',
          topicDisplayName: 'Algebra',
          localTopic: 'partial_fractions',
          deepseekTopic: 'Algebra',
          subtopic: 'partial fractions',
          validatedRegionId: undefined,
          displayRegionId: 'algebra-forge',
        }),
      ],
    });

    expect(readiness.evidence.canonicalAttempts).toBe(0);
    expect(readiness.evidence.distinctRegions).toBe(0);
    expect(readiness.evidence.distinctSubtopics).toBe(0);
  });
});
