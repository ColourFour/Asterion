import { describe, expect, it } from 'vitest';
import type { Attempt, LearningActivityAttempt, NormalizedQuestion, RegionLearningRecord, RegionProgress } from '../types';
import {
  buildRegionLearningSummary,
  computeGuardianEligibility,
  computeRegionLearningState,
  computeRegionVisualTreatment,
  recommendTrainingSession,
  selectGuardianQuestion,
} from '../lib/regionLearning';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

const logarithms = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove')!;

function question(overrides: Partial<NormalizedQuestion> = {}): NormalizedQuestion {
  return {
    id: 'q1',
    paperFamily: 'p3',
    paper: '31autumn21',
    questionNumber: '1',
    displayTopic: 'Logarithms',
    displaySubtopic: 'logarithmic equations',
    marksAvailable: 6,
    deepseek: { hasError: false, topic: 'Logarithms', subtopic: 'logarithmic equations' },
    routeEvidence: {
      status: 'clean',
      source: 'topic-routing',
      regionId: logarithms.id,
      regionName: logarithms.name,
      validatedRegionId: logarithms.id,
      validatedRegionName: logarithms.name,
      displayRegionId: logarithms.id,
      displayRegionName: logarithms.name,
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
    questionImageRawPaths: ['p3/31autumn21/questions/q01.png'],
    markSchemeImageRawPaths: ['p3/31autumn21/mark_scheme/q01.png'],
    questionImagePaths: ['p3/31autumn21/questions/q01.png'],
    markSchemeImagePaths: ['p3/31autumn21/mark_scheme/q01.png'],
    questionImageUrls: ['/assets/31autumn21/questions/q01.png'],
    markSchemeImageUrls: ['/assets/31autumn21/mark_scheme/q01.png'],
    questionImageCandidates: [['/assets/31autumn21/questions/q01.png']],
    markSchemeImageCandidates: [['/assets/31autumn21/mark_scheme/q01.png']],
    raw: { local: {} },
    ...overrides,
  };
}

function attempt(id: string, scoreRatio: number, subtopic = 'logarithmic equations'): Attempt {
  return {
    id,
    profileId: 'profile_1',
    questionId: `q${id}`,
    paperFamily: 'p3',
    topicDisplayName: 'Logarithms',
    subtopic,
    marksEarned: scoreRatio * 10,
    marksAvailable: 10,
    scoreRatio,
    mistakeType: 'no_issue',
    timeSpentSeconds: 120,
    markSchemeRevealed: true,
    attemptedAt: `2026-05-08T00:0${id}:00.000Z`,
    masteryEligible: true,
    validatedRegionId: logarithms.id,
    displayRegionId: logarithms.id,
    worldName: 'P3 Astral Academy',
    regionName: logarithms.name,
  };
}

function progress(overrides: Partial<RegionProgress> = {}): RegionProgress {
  return {
    region: logarithms,
    availableQuestions: 4,
    attempts: 0,
    totalMarksEarned: 0,
    totalMarksAvailable: 0,
    subtopicsTouched: 0,
    rank: 'Discovered',
    isActive: true,
    ...overrides,
  };
}

function learning(overrides: Partial<RegionLearningRecord> = {}): RegionLearningRecord {
  return {
    regionId: logarithms.id,
    updatedAt: '2026-05-08T00:00:00.000Z',
    ...overrides,
  };
}

function learningActivityAttempt(id: string, outcome: LearningActivityAttempt['outcome']): LearningActivityAttempt {
  return {
    id,
    profileId: 'profile_1',
    regionId: logarithms.id,
    regionName: logarithms.name,
    activityType: id.includes('warm') ? 'warm_up' : 'quick_check',
    activityId: id,
    prompt: 'Rewrite log base two of eight equals three.',
    learnerResponse: '2^3 = 8',
    revealedEarly: false,
    outcome,
    confidence: outcome === 'got_it' ? 4 : 2,
    createdAt: '2026-05-08T00:00:00.000Z',
    completedAt: id.includes('2') ? '2026-05-08T00:02:00.000Z' : '2026-05-08T00:01:00.000Z',
  };
}

describe('region learning loop logic', () => {
  it('starts an active region at Field Guide availability with an available visual treatment', () => {
    const regionProgress = progress();
    const eligibility = computeGuardianEligibility({
      region: logarithms,
      regionProgress,
      regionQuestions: [question()],
      regionAttempts: [],
    });
    const state = computeRegionLearningState({ regionProgress, guardianEligibility: eligibility });

    expect(state).toBe('available');
    expect(computeRegionVisualTreatment(state)).toBe('available');
  });

  it('keeps the guardian locked after Field Guide completion until practice evidence exists', () => {
    const regionProgress = progress();
    const summary = buildRegionLearningSummary({
      regionProgress,
      learningRecord: learning({ fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z' }),
      regionQuestions: [question()],
      regionAttempts: [],
    });

    expect(summary.state).toBe('field_guide_completed');
    expect(summary.guardianEligibility.eligible).toBe(false);
    expect(summary.guardianEligibility.missingRequirements).toContain('Save at least 3 attempts in this region (0/3).');
    expect(summary.guardianEligibility.requirements.find((requirement) => requirement.id === 'field_guide')?.completed).toBe(true);
    expect(summary.guardianEligibility.requirements.find((requirement) => requirement.id === 'attempt_count')?.completed).toBe(false);
    expect(summary.nextAction.kind).toBe('training');
    expect(summary.nextAction.explanation).toBe('Train in this region and save 3 more saved attempts to build guardian evidence.');
  });

  it('unlocks the guardian from local evidence and selects a trainable higher-mark question', () => {
    const attempts = [
      attempt('1', 0.62, 'logarithmic equations'),
      attempt('2', 0.72, 'exponential equations'),
      attempt('3', 0.81, 'logarithmic equations'),
    ];
    const questions = [
      question({ id: 'missing-ms', markSchemeImageCandidates: [], marksAvailable: 12 }),
      question({ id: 'core', displaySubtopic: 'exponential equations', marksAvailable: 6 }),
      question({ id: 'stretch', marksAvailable: 8 }),
    ];
    const regionProgress = progress({
      attempts: attempts.length,
      averageScoreRatio: 0.72,
      recentScoreRatio: 0.72,
      subtopicsTouched: 2,
      totalMarksEarned: 21.5,
      totalMarksAvailable: 30,
      rank: 'Bronze',
    });

    const summary = buildRegionLearningSummary({
      regionProgress,
      learningRecord: learning({ fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z' }),
      regionQuestions: questions,
      regionAttempts: attempts,
    });

    expect(summary.guardianEligibility.eligible).toBe(true);
    expect(summary.guardianEligibility.guardianQuestion?.id).toBe('stretch');
    expect(summary.state).toBe('guardian_unlocked');
    expect(summary.visualTreatment).toBe('guardian_unlocked');
    expect(summary.nextAction.explanation).toBe('The Guardian is ready. Challenge it to clear the region.');
  });

  it('keeps guardian eligibility and selection stable when only difficulty metadata changes', () => {
    const attempts = [
      attempt('1', 0.72, 'logarithmic equations'),
      attempt('2', 0.76, 'exponential equations'),
      attempt('3', 0.81, 'logarithmic equations'),
    ];
    const regionProgress = progress({
      attempts: attempts.length,
      averageScoreRatio: 0.76,
      recentScoreRatio: 0.76,
      subtopicsTouched: 2,
      totalMarksEarned: 22.9,
      totalMarksAvailable: 30,
      rank: 'Bronze',
    });
    const baseQuestions = [
      question({ id: 'q-easy', displaySubtopic: 'logarithmic equations', marksAvailable: 8, displayDifficulty: 'foundation', localDifficulty: 'foundation' }),
      question({ id: 'q-hard', displaySubtopic: 'exponential equations', marksAvailable: 6, displayDifficulty: 'challenge', localDifficulty: 'challenge' }),
    ];
    const changedDifficultyQuestions = baseQuestions.map((item) => ({
      ...item,
      displayDifficulty: item.displayDifficulty === 'foundation' ? 'challenge' : 'foundation',
      localDifficulty: item.localDifficulty === 'foundation' ? 'challenge' : 'foundation',
      deepseek: {
        ...item.deepseek,
        difficulty: item.displayDifficulty === 'foundation' ? 'challenge' : 'foundation',
        normalizedDifficulty: item.displayDifficulty === 'foundation' ? 'challenge' : 'foundation',
      },
    }));
    const base = computeGuardianEligibility({
      region: logarithms,
      regionProgress,
      learningRecord: learning({ fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z' }),
      regionQuestions: baseQuestions,
      regionAttempts: attempts,
    });
    const changedDifficulty = computeGuardianEligibility({
      region: logarithms,
      regionProgress,
      learningRecord: learning({ fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z' }),
      regionQuestions: changedDifficultyQuestions,
      regionAttempts: attempts,
    });

    expect(base.eligible).toBe(true);
    expect(changedDifficulty.eligible).toBe(true);
    expect(base.guardianQuestion?.id).toBe('q-easy');
    expect(changedDifficulty.guardianQuestion?.id).toBe('q-easy');
    expect(changedDifficulty.requirements.map((requirement) => requirement.completed)).toEqual(
      base.requirements.map((requirement) => requirement.completed),
    );
  });

  it('does not unlock or select a guardian from trainable records without guardian eligibility', () => {
    const attempts = [
      attempt('1', 0.72, 'logarithmic equations'),
      attempt('2', 0.76, 'exponential equations'),
      attempt('3', 0.81, 'logarithmic equations'),
    ];
    const unsafeQuestion = question({
      id: 'fallback-display-only',
      routeEvidence: {
        status: 'fallback-display-only',
        source: 'fallback-label',
        regionId: logarithms.id,
        regionName: logarithms.name,
        displayRegionId: logarithms.id,
        displayRegionName: logarithms.name,
        reasonCodes: ['fallback-label-match'],
      },
      eligibility: {
        regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
        practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
        masteryEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
        guardianEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
        generationEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
        textOnlyEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
      },
    });
    const regionProgress = progress({
      attempts: attempts.length,
      averageScoreRatio: 0.76,
      recentScoreRatio: 0.76,
      subtopicsTouched: 2,
      rank: 'Bronze',
    });

    const summary = buildRegionLearningSummary({
      regionProgress,
      learningRecord: learning({ fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z' }),
      regionQuestions: [unsafeQuestion],
      regionAttempts: attempts,
    });

    expect(selectGuardianQuestion([unsafeQuestion])).toBeUndefined();
    expect(summary.guardianEligibility.eligible).toBe(false);
    expect(summary.guardianEligibility.guardianQuestion).toBeUndefined();
    expect(summary.guardianEligibility.requirements.find((requirement) => requirement.id === 'guardian_asset')?.completed).toBe(false);
    expect(summary.state).toBe('training_in_progress');
  });

  it('rejects guardian candidates without a validated region even when guardianEligible is true', () => {
    const displayOnly = question({
      id: 'display-only',
      routeEvidence: {
        status: 'fallback-display-only',
        source: 'fallback-label',
        regionId: logarithms.id,
        regionName: logarithms.name,
        displayRegionId: logarithms.id,
        displayRegionName: logarithms.name,
        reasonCodes: ['fallback-label-match'],
      },
      eligibility: {
        regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
        practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
        masteryEligible: { eligible: true, reasonCodes: ['legacy-bad-fixture'] },
        guardianEligible: { eligible: true, reasonCodes: ['legacy-bad-fixture'] },
        generationEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
        textOnlyEligible: { eligible: false, reasonCodes: ['blocked-fallback-display-only'] },
      },
    });

    expect(selectGuardianQuestion([displayOnly])).toBeUndefined();
  });

  it('marks a failed saved guardian as attempted and a passed saved guardian as cleared', () => {
    const regionProgress = progress({ attempts: 4, recentScoreRatio: 0.76 });
    const eligibility = computeGuardianEligibility({
      region: logarithms,
      regionProgress,
      learningRecord: learning({ fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z' }),
      regionQuestions: [question()],
      regionAttempts: [attempt('1', 0.72), attempt('2', 0.76), attempt('3', 0.81)],
    });

    expect(computeRegionLearningState({
      regionProgress,
      guardianEligibility: eligibility,
      learningRecord: learning({ guardianAttemptedAt: '2026-05-08T00:04:00.000Z' }),
    })).toBe('guardian_attempted');

    expect(computeRegionLearningState({
      regionProgress,
      guardianEligibility: eligibility,
      learningRecord: learning({ guardianAttemptedAt: '2026-05-08T00:04:00.000Z', guardianClearedAt: '2026-05-08T00:04:00.000Z' }),
    })).toBe('guardian_cleared');
  });

  it('does not honor guardian attempted or cleared flags without current eligible evidence', () => {
    const regionProgress = progress({ attempts: 0, recentScoreRatio: 1 });
    const eligibility = computeGuardianEligibility({
      region: logarithms,
      regionProgress,
      learningRecord: learning({ fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z' }),
      regionQuestions: [question()],
      regionAttempts: [],
    });

    expect(eligibility.eligible).toBe(false);
    expect(computeRegionLearningState({
      regionProgress,
      guardianEligibility: eligibility,
      learningRecord: learning({
        fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
        guardianAttemptedAt: '2026-05-08T00:04:00.000Z',
        guardianClearedAt: '2026-05-08T00:04:00.000Z',
      }),
    })).toBe('field_guide_completed');
  });

  it('returns a restored-region next action after guardian clear', () => {
    const summary = buildRegionLearningSummary({
      regionProgress: progress({ attempts: 4, recentScoreRatio: 0.8 }),
      learningRecord: learning({
        fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
        guardianAttemptedAt: '2026-05-08T00:04:00.000Z',
        guardianClearedAt: '2026-05-08T00:04:00.000Z',
      }),
      regionQuestions: [question()],
      regionAttempts: [attempt('1', 0.72), attempt('2', 0.76), attempt('3', 0.81)],
    });

    expect(summary.state).toBe('guardian_cleared');
    expect(summary.nextAction.label).toBe('Region restored');
    expect(summary.nextAction.explanation).toBe('The Guardian is cleared. Maintain mastery here or choose another region.');
    expect(summary.visualTreatment).toBe('guardian_cleared');
  });

  it('keeps a cleared guardian in needs-review when recent evidence drops', () => {
    const summary = buildRegionLearningSummary({
      regionProgress: progress({ attempts: 5, recentScoreRatio: 0.4, rank: 'Gold' }),
      learningRecord: learning({
        fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
        guardianAttemptedAt: '2026-05-08T00:04:00.000Z',
        guardianClearedAt: '2026-05-08T00:04:00.000Z',
      }),
      regionQuestions: [question()],
      regionAttempts: [attempt('1', 0.72), attempt('2', 0.4), attempt('3', 0.4)],
    });

    expect(summary.state).toBe('needs_review');
    expect(summary.visualTreatment).toBe('needs_review');
    expect(summary.nextAction.kind).toBe('review');
  });

  it('reports completed and missing guardian requirements with exact next action', () => {
    const summary = buildRegionLearningSummary({
      regionProgress: progress({ attempts: 2, averageScoreRatio: 0.62, recentScoreRatio: 0.66, subtopicsTouched: 1 }),
      learningRecord: learning({ fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z' }),
      regionQuestions: [
        question({ id: 'q1', displaySubtopic: 'logarithmic equations' }),
        question({ id: 'q2', displaySubtopic: 'exponential equations' }),
      ],
      regionAttempts: [attempt('1', 0.62, 'logarithmic equations'), attempt('2', 0.66, 'logarithmic equations')],
    });

    expect(summary.guardianEligibility.requirements.filter((requirement) => requirement.completed).map((requirement) => requirement.id)).toContain('field_guide');
    expect(summary.guardianEligibility.requirements.filter((requirement) => !requirement.completed).map((requirement) => requirement.id)).toEqual(['attempt_count', 'recent_high_score', 'subtopic_spread']);
    expect(summary.nextAction.explanation).toBe('Train in this region and save 1 more saved attempt to build guardian evidence.');
  });

  it('recommends weak-area review after a low recent attempt and challenge after stable 70% evidence', () => {
    expect(recommendTrainingSession({
      regionProgress: progress({ attempts: 2, recentScoreRatio: 0.4 }),
      regionAttempts: [attempt('1', 0.4)],
    }).intent).toBe('weak_area_review');

    expect(recommendTrainingSession({
      regionProgress: progress({ attempts: 4, averageScoreRatio: 0.76, recentScoreRatio: 0.78 }),
      regionAttempts: [attempt('1', 0.72), attempt('2', 0.78), attempt('3', 0.82)],
    }).intent).toBe('challenge');
  });

  it('uses Quick Check and warm-up records for the next recommended action without changing rank', () => {
    const summary = buildRegionLearningSummary({
      regionProgress: progress({ attempts: 0, rank: 'Discovered' }),
      learningRecord: learning({ fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z' }),
      regionQuestions: [question()],
      regionAttempts: [],
      learningActivityAttempts: [
        learningActivityAttempt('quick-1', 'got_it'),
        learningActivityAttempt('warm-2', 'got_it'),
      ],
    });

    expect(summary.trainingSession.intent).toBe('core_practice');
    expect(summary.nextAction.label).toBe('Start Core practice');
    expect(summary.nextAction.explanation).toContain('Move into canonical Exam Training');
  });

  it('does not select guardian questions missing question or mark-scheme image candidates', () => {
    expect(selectGuardianQuestion([
      question({ id: 'no-question', questionImageCandidates: [] }),
      question({ id: 'no-ms', markSchemeImageCandidates: [] }),
    ])).toBeUndefined();
  });

  it('maps all major learning states to distinct visual treatments', () => {
    expect(computeRegionVisualTreatment('locked')).toBe('not_started');
    expect(computeRegionVisualTreatment('training_in_progress')).toBe('training');
    expect(computeRegionVisualTreatment('guardian_unlocked')).toBe('guardian_unlocked');
    expect(computeRegionVisualTreatment('guardian_cleared')).toBe('guardian_cleared');
    expect(computeRegionVisualTreatment('mastered')).toBe('mastered');
    expect(computeRegionVisualTreatment('needs_review')).toBe('needs_review');
  });
});
