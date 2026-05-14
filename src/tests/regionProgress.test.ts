import { describe, expect, it } from 'vitest';
import type { Attempt, LearningActivityAttempt, NormalizedQuestion, RegionLearningRecord } from '../types';
import { deriveAvatarGear } from '../lib/avatarGear';
import {
  calculateRegionProgress,
  calculateRegionRank,
  getRecentMixedReviewEvidence,
  hasRecentMixedReviewEvidence,
} from '../lib/regionProgress';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

const algebra = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'algebra-forge')!;
const trig = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'trig-observatory')!;
const complex = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'complex-harbor')!;

type AttemptMetadata = {
  subtopicId?: string;
  concept?: string;
  methodFamily?: string;
  strategy?: string;
  problemType?: string;
};

function question(id: string, topic = 'Algebra', subtopic = 'polynomials'): NormalizedQuestion {
  return {
    id,
    paperFamily: 'p3',
    displayTopic: topic,
    displaySubtopic: subtopic,
    localSubtopic: subtopic,
    deepseek: { hasError: false, topic, subtopic },
    routeEvidence: {
      status: 'clean',
      source: 'topic-routing',
      regionId: algebra.id,
      regionName: algebra.name,
      validatedRegionId: algebra.id,
      validatedRegionName: algebra.name,
      displayRegionId: algebra.id,
      displayRegionName: algebra.name,
      reasonCodes: ['validated-topic-routing'],
    },
    eligibility: {
      regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
      practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
      masteryEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      guardianEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      generationEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      textOnlyEligible: { eligible: false, reasonCodes: ['missing-question-or-mark-scheme-text'] },
    },
    questionImageRawPaths: [`p3/test/questions/${id}.png`],
    markSchemeImageRawPaths: [`p3/test/mark_scheme/${id}.png`],
    questionImagePaths: [`p3/test/questions/${id}.png`],
    markSchemeImagePaths: [`p3/test/mark_scheme/${id}.png`],
    questionImageUrls: [`/assets/test/questions/${id}.png`],
    markSchemeImageUrls: [`/assets/test/mark_scheme/${id}.png`],
    questionImageCandidates: [[`/assets/test/questions/${id}.png`]],
    markSchemeImageCandidates: [[`/assets/test/mark_scheme/${id}.png`]],
    raw: { local: {} },
  };
}

function timestamp(index: number): string {
  return new Date(Date.UTC(2026, 4, 8, 0, index, 0)).toISOString();
}

function attempt(index: number, overrides: Partial<Attempt> & AttemptMetadata = {}): Attempt & AttemptMetadata {
  const scoreRatio = overrides.scoreRatio ?? 0.9;
  const marksAvailable = overrides.marksAvailable ?? 10;
  return {
    id: overrides.id ?? `a${String(index).padStart(2, '0')}`,
    profileId: overrides.profileId ?? 'p1',
    questionId: overrides.questionId ?? `q${index}`,
    paperFamily: overrides.paperFamily ?? 'p3',
    topicDisplayName: overrides.topicDisplayName ?? 'Algebra',
    localTopic: overrides.localTopic,
    deepseekTopic: overrides.deepseekTopic,
    subtopic: overrides.subtopic,
    subtopicId: overrides.subtopicId,
    concept: overrides.concept,
    methodFamily: overrides.methodFamily,
    strategy: overrides.strategy,
    problemType: overrides.problemType,
    marksEarned: overrides.marksEarned ?? scoreRatio * marksAvailable,
    marksAvailable,
    scoreRatio,
    mistakeType: overrides.mistakeType ?? 'algebra_error',
    mistakeTypes: overrides.mistakeTypes ?? ['algebra_error'],
    timeSpentSeconds: overrides.timeSpentSeconds ?? 90,
    markSchemeRevealed: overrides.markSchemeRevealed ?? true,
    attemptedAt: overrides.attemptedAt ?? timestamp(index),
    masteryEligible: overrides.masteryEligible ?? true,
    validatedRegionId: overrides.validatedRegionId ?? algebra.id,
    displayRegionId: overrides.displayRegionId ?? algebra.id,
    worldName: overrides.worldName ?? 'P3 Astral Academy',
    regionName: overrides.regionName ?? algebra.name,
  };
}

function attempts(count: number, overrides: Partial<Attempt> & AttemptMetadata = {}): Attempt[] {
  return Array.from({ length: count }, (_, index) => attempt(index + 1, overrides));
}

function guardianCleared(): RegionLearningRecord {
  return {
    regionId: algebra.id,
    guardianQuestionId: 'guardian-q',
    guardianAttemptId: 'guardian-attempt',
    guardianAttemptedAt: '2026-05-08T00:20:00.000Z',
    guardianClearedAt: '2026-05-08T00:20:00.000Z',
    updatedAt: '2026-05-08T00:20:00.000Z',
  };
}

describe('region progress and gear', () => {
  it('keeps discovery-style progress at Discovered and never treats it as Mastered', () => {
    const progress = calculateRegionProgress(algebra, [question('q1')], []);

    expect(progress.rank).toBe('Discovered');
    expect(calculateRegionRank({
      activeByDefault: true,
      availableQuestions: 1,
      attempts: 1,
      averageScoreRatio: 1,
      recentScoreRatio: 1,
      hasMixedReview: true,
    })).toBe('Discovered');
  });

  it('keeps Bronze independent of mixed-review evidence', () => {
    const progress = calculateRegionProgress(algebra, [question('q1')], attempts(3, { scoreRatio: 0.6, subtopic: 'polynomials', methodFamily: 'factor theorem' }));

    expect(progress.attempts).toBe(3);
    expect(progress.rank).toBe('Bronze');
    expect(progress.averageScoreRatio).toBeCloseTo(0.6);
    expect(hasRecentMixedReviewEvidence(attempts(3, { scoreRatio: 0.9, subtopic: 'polynomials', methodFamily: 'factor theorem' }))).toBe(false);
  });

  it('does not advance progress from trainable records that are not mastery eligible', () => {
    const unsafeQuestion = question('q1');
    unsafeQuestion.routeEvidence = {
      status: 'fallback-display-only',
      source: 'fallback-label',
      regionId: algebra.id,
      regionName: algebra.name,
      displayRegionId: algebra.id,
      displayRegionName: algebra.name,
      reasonCodes: ['fallback-label-match'],
    };
    unsafeQuestion.eligibility = {
      regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
      practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
      masteryEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
      guardianEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
      generationEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
      textOnlyEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
    };
    const progress = calculateRegionProgress(algebra, [unsafeQuestion], [
      attempt(1, { questionId: 'q1', scoreRatio: 1, subtopic: 'polynomials', methodFamily: 'factor theorem' }),
    ]);

    expect(progress.availableQuestions).toBe(1);
    expect(progress.attempts).toBe(0);
    expect(progress.totalMarksEarned).toBe(0);
    expect(progress.averageScoreRatio).toBeUndefined();
    expect(progress.rank).toBe('Discovered');
  });

  it('blocks known unsafe attempts and missing-route historical attempts', () => {
    const unsafeQuestion = question('q1');
    unsafeQuestion.eligibility = {
      ...unsafeQuestion.eligibility!,
      masteryEligible: { eligible: false, reasonCodes: ['blocked-review-only'] },
      guardianEligible: { eligible: false, reasonCodes: ['blocked-review-only'] },
    };
    const progress = calculateRegionProgress(algebra, [unsafeQuestion], [
      attempt(1, { questionId: 'q1', scoreRatio: 1, subtopic: 'polynomials' }),
      attempt(2, { questionId: 'legacy-missing-from-bank', scoreRatio: 0.8, subtopic: 'partial fractions', validatedRegionId: '' }),
    ]);

    expect(progress.attempts).toBe(0);
    expect(progress.totalMarksEarned).toBe(0);
    expect(progress.averageScoreRatio).toBeUndefined();
  });

  it('keeps Silver independent of mixed-review evidence', () => {
    const progress = calculateRegionProgress(algebra, [question('q1')], attempts(7, { scoreRatio: 0.7, subtopic: 'polynomials', methodFamily: 'factor theorem' }));

    expect(progress.rank).toBe('Silver');
    expect(progress.recentScoreRatio).toBeCloseTo(0.7);
  });

  it('allows narrow repeated evidence to reach Gold but not Mastered', () => {
    const progress = calculateRegionProgress(algebra, [question('q1')], attempts(14, { scoreRatio: 0.9, subtopic: 'polynomials', methodFamily: 'factor theorem' }));
    const evidence = getRecentMixedReviewEvidence(attempts(14, { scoreRatio: 0.9, subtopic: 'polynomials', methodFamily: 'factor theorem' }));

    expect(progress.rank).toBe('Gold');
    expect(evidence.hasMixedReview).toBe(false);
    expect(evidence.reason).toBe('repeated_same_subtopic_method_family');
  });

  it('preserves Guardian-cleared mastery without requiring mixed-review evidence', () => {
    const progress = calculateRegionProgress(algebra, [question('q1')], attempts(3, { scoreRatio: 0.72, subtopic: 'polynomials' }), guardianCleared());

    expect(progress.rank).toBe('Mastered');
    expect(calculateRegionRank({
      activeByDefault: true,
      availableQuestions: 1,
      attempts: 0,
      guardianCleared: true,
      hasMixedReview: false,
    })).toBe('Mastered');
  });

  it('preserves the existing Needs-review drop-off and does not use stale mixed evidence for Mastered', () => {
    const staleMixedThenNarrow = [
      ...attempts(9, { scoreRatio: 0.95, subtopic: 'partial fractions', methodFamily: 'decomposition' }),
      ...attempts(5, { scoreRatio: 0.95, subtopic: 'polynomials', methodFamily: 'factor theorem' }).map((item, index) => ({
        ...item,
        id: `recent-${index}`,
        attemptedAt: timestamp(20 + index),
      })),
    ];
    const staleMixedProgress = calculateRegionProgress(algebra, [question('q1')], staleMixedThenNarrow);
    const needsReviewProgress = calculateRegionProgress(algebra, [question('q1')], attempts(5, { scoreRatio: 0.4, subtopic: 'polynomials' }), guardianCleared());

    expect(staleMixedProgress.rank).toBe('Gold');
    expect(getRecentMixedReviewEvidence(staleMixedThenNarrow).reason).toBe('repeated_same_subtopic_method_family');
    expect(needsReviewProgress.rank).not.toBe('Mastered');
    expect(needsReviewProgress.recentScoreRatio).toBeLessThan(0.55);
  });

  it('awards Mastered from recent successful attempts across distinct subtopics', () => {
    const mixed = attempts(14, { scoreRatio: 0.92, subtopic: 'polynomials', methodFamily: 'algebraic manipulation' }).map((item, index) => ({
      ...item,
      subtopic: index >= 12 ? 'partial fractions' : item.subtopic,
    }));
    const progress = calculateRegionProgress(algebra, [question('q1')], mixed);

    expect(progress.rank).toBe('Mastered');
    expect(getRecentMixedReviewEvidence(mixed).reason).toBe('mixed_subtopics');
  });

  it('awards Mastered from recent successful attempts across distinct method families', () => {
    const mixed = attempts(14, { scoreRatio: 0.92, subtopic: 'polynomials', methodFamily: 'factor theorem' }).map((item, index) => ({
      ...item,
      methodFamily: index >= 12 ? 'long division' : 'factor theorem',
    }));
    const progress = calculateRegionProgress(algebra, [question('q1')], mixed);

    expect(progress.rank).toBe('Mastered');
    expect(getRecentMixedReviewEvidence(mixed).reason).toBe('mixed_method_families');
  });

  it('does not infer mixed review from attempt count when metadata is missing', () => {
    const noMetadata = attempts(14, { scoreRatio: 0.95, subtopic: undefined, methodFamily: undefined });
    const progress = calculateRegionProgress(algebra, [question('q1')], noMetadata);
    const evidence = getRecentMixedReviewEvidence(noMetadata);

    expect(progress.rank).toBe('Gold');
    expect(evidence.hasMixedReview).toBe(false);
    expect(evidence.reason).toBe('insufficient_distinct_metadata');
  });

  it('does not count Field Guide, Quick Check reveal, avatar progress, or generated warm-up reveal as Mastered evidence', () => {
    const fieldGuideOnly = calculateRegionProgress(algebra, [question('q1')], [], {
      regionId: algebra.id,
      fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    });
    const passiveRevealSignals = attempts(14, {
      scoreRatio: 1,
      marksAvailable: 0,
      marksEarned: 0,
      timeSpentSeconds: 0,
      subtopic: undefined,
      methodFamily: undefined,
    }).map((item, index) => ({
      ...item,
      subtopic: index % 2 === 0 ? 'quick check reveal' : 'generated warm-up reveal',
      problemType: index % 2 === 0 ? 'quick check reveal' : 'generated warm-up reveal',
    }));
    const passiveProgress = calculateRegionProgress(algebra, [question('q1')], passiveRevealSignals);

    expect(fieldGuideOnly.rank).toBe('Discovered');
    expect(passiveProgress.rank).toBe('Discovered');
    expect(getRecentMixedReviewEvidence(passiveRevealSignals).hasMixedReview).toBe(false);
  });

  it('does not inflate region rank from Quick Check or warm-up support records', () => {
    const supportRecords: LearningActivityAttempt[] = [
      {
        id: 'support-quick',
        profileId: 'p1',
        regionId: algebra.id,
        activityType: 'quick_check',
        activityId: 'qc-1',
        prompt: 'Quick check prompt',
        learnerResponse: 'method note',
        revealedEarly: false,
        outcome: 'got_it',
        confidence: 5,
        createdAt: timestamp(1),
        completedAt: timestamp(2),
      },
      {
        id: 'support-warm',
        profileId: 'p1',
        regionId: algebra.id,
        activityType: 'warm_up',
        activityId: 'warm-1',
        prompt: 'Warm-up prompt',
        learnerResponse: 'method note',
        revealedEarly: false,
        outcome: 'got_it',
        confidence: 5,
        createdAt: timestamp(3),
        completedAt: timestamp(4),
      },
    ];
    const progress = calculateRegionProgress(algebra, [question('q1')], []);

    expect(supportRecords).toHaveLength(2);
    expect(progress.attempts).toBe(0);
    expect(progress.rank).toBe('Discovered');
  });

  it('keeps region mastery rank unchanged when only attempt and question difficulty metadata changes', () => {
    const baseQuestions = [question('q1', 'Algebra', 'polynomials')];
    const changedDifficultyQuestions = baseQuestions.map((item) => ({
      ...item,
      displayDifficulty: 'challenge',
      localDifficulty: 'challenge',
      deepseek: { ...item.deepseek, difficulty: 'challenge', normalizedDifficulty: 'challenge' },
    }));
    const baseAttempts = attempts(14, { scoreRatio: 0.92, subtopic: 'polynomials', methodFamily: 'factor theorem', difficulty: 'foundation' })
      .map((item, index) => ({
        ...item,
        methodFamily: index >= 12 ? 'long division' : 'factor theorem',
      }));
    const changedDifficultyAttempts = baseAttempts.map((item) => ({
      ...item,
      difficulty: item.difficulty === 'foundation' ? 'challenge' : 'foundation',
    }));

    const base = calculateRegionProgress(algebra, baseQuestions, baseAttempts);
    const changedDifficulty = calculateRegionProgress(algebra, changedDifficultyQuestions, changedDifficultyAttempts);

    expect(base.rank).toBe('Mastered');
    expect(changedDifficulty.rank).toBe(base.rank);
    expect(changedDifficulty.averageScoreRatio).toBe(base.averageScoreRatio);
    expect(changedDifficulty.recentScoreRatio).toBe(base.recentScoreRatio);
    expect(getRecentMixedReviewEvidence(changedDifficultyAttempts)).toMatchObject(getRecentMixedReviewEvidence(baseAttempts));
  });

  it('derives avatar gear from region progress', () => {
    const base = { availableQuestions: 1, attempts: 7, totalMarksEarned: 49, totalMarksAvailable: 70, recentScoreRatio: 0.7, averageScoreRatio: 0.7, subtopicsTouched: 2, isActive: true } as const;
    const gear = deriveAvatarGear([
      { ...base, region: algebra, rank: 'Silver' },
      { ...base, region: trig, rank: 'Silver' },
      { ...base, region: complex, rank: 'Discovered' },
    ]);

    expect(gear.gear).toContain('Algebra Pin');
    expect(gear.gear).toContain('Bronze Academy Frame');
    expect(gear.title).toBe('Region Specialist');
  });
});
