import { describe, expect, it } from 'vitest';
import type { Attempt, NormalizedQuestion, RegionLearningRecord, RegionProgress } from '../types';
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
    displayDifficulty: 'core',
    marksAvailable: 6,
    deepseek: { hasError: false, topic: 'Logarithms', subtopic: 'logarithmic equations' },
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
    expect(summary.nextAction.kind).toBe('training');
  });

  it('unlocks the guardian from local evidence and selects a trainable higher-difficulty question', () => {
    const attempts = [
      attempt('1', 0.62, 'logarithmic equations'),
      attempt('2', 0.72, 'exponential equations'),
      attempt('3', 0.81, 'logarithmic equations'),
    ];
    const questions = [
      question({ id: 'missing-ms', displayDifficulty: 'challenge', markSchemeImageCandidates: [] }),
      question({ id: 'core', displayDifficulty: 'core', displaySubtopic: 'exponential equations', marksAvailable: 6 }),
      question({ id: 'stretch', displayDifficulty: 'stretch', marksAvailable: 8 }),
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
  });

  it('marks a failed saved guardian as attempted and a passed saved guardian as cleared', () => {
    const eligibility = {
      eligible: true,
      missingRequirements: [],
      guardianQuestion: question(),
    };
    const regionProgress = progress({ attempts: 4, recentScoreRatio: 0.76 });

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

  it('does not select guardian questions missing question or mark-scheme image candidates', () => {
    expect(selectGuardianQuestion([
      question({ id: 'no-question', questionImageCandidates: [] }),
      question({ id: 'no-ms', markSchemeImageCandidates: [] }),
    ])).toBeUndefined();
  });
});
