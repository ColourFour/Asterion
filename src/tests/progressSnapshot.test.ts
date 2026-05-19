import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../lib/progressStore';
import {
  buildProgressSnapshotPayload,
  validateProgressSnapshotPayload,
  type ProgressSnapshotPayload,
} from '../lib/progressSnapshot';
import type { Attempt, LearningActivityAttempt, NormalizedQuestion, StoredProgress } from '../types';

function question(id = 'q1', subtopic = 'polynomials'): NormalizedQuestion {
  return {
    id,
    paperFamily: 'p3',
    displayTopic: 'Algebra',
    displaySubtopic: subtopic,
    localSubtopic: subtopic,
    deepseek: { hasError: false, topic: 'Algebra', subtopic },
    routeEvidence: {
      status: 'clean',
      source: 'topic-routing',
      regionId: 'algebra-forge',
      regionName: 'Algebra Vault',
      validatedRegionId: 'algebra-forge',
      validatedRegionName: 'Algebra Vault',
      displayRegionId: 'algebra-forge',
      displayRegionName: 'Algebra Vault',
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

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'attempt-1',
    profileId: 'profile-1',
    questionId: 'q1',
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    subtopic: 'polynomials',
    marksEarned: 8,
    marksAvailable: 10,
    scoreRatio: 0.8,
    mistakeType: 'algebra_error',
    mistakeTypes: ['algebra_error'],
    note: 'This local reflection must not sync.',
    timeSpentSeconds: 120,
    markSchemeRevealed: true,
    attemptedAt: '2026-05-08T00:01:00.000Z',
    masteryEligible: true,
    guardianEligible: true,
    validatedRegionId: 'algebra-forge',
    displayRegionId: 'algebra-forge',
    worldName: 'P3 Astral Academy',
    regionName: 'Algebra Vault',
    ...overrides,
  };
}

function learningActivityAttempt(): LearningActivityAttempt {
  return {
    id: 'learning-1',
    profileId: 'profile-1',
    regionId: 'algebra-forge',
    regionName: 'Algebra Vault',
    activityType: 'quick_check',
    activityId: 'qc-1',
    prompt: 'Rewrite log base two of eight equals three.',
    learnerResponse: '2^3 = 8',
    revealedEarly: false,
    outcome: 'got_it',
    confidence: 4,
    createdAt: '2026-05-08T00:02:00.000Z',
    completedAt: '2026-05-08T00:03:00.000Z',
  };
}

function progress(): StoredProgress {
  return {
    ...emptyProgress(),
    attempts: [attempt()],
    learningActivityAttempts: [learningActivityAttempt()],
    issueReports: [{
      id: 'issue-1',
      profileId: 'profile-1',
      questionId: 'q1',
      issueType: 'other',
      note: 'This issue report note must not sync.',
      createdAt: '2026-05-08T00:04:00.000Z',
    }],
    regionLearning: {
      'algebra-forge': {
        regionId: 'algebra-forge',
        fieldGuideStartedAt: '2026-05-08T00:00:00.000Z',
        fieldGuideCompletedAt: '2026-05-08T00:00:30.000Z',
        updatedAt: '2026-05-08T00:00:30.000Z',
      },
    },
  };
}

function validPayload(): ProgressSnapshotPayload {
  return buildProgressSnapshotPayload({
    progress: progress(),
    questions: [question()],
    regionAccess: { 'complex-harbor': 'field_guide_only' },
    now: '2026-05-19T00:00:00.000Z',
  });
}

describe('progress snapshot contract', () => {
  it('accepts valid bounded progress snapshots', () => {
    const payload = validPayload();

    expect(validateProgressSnapshotPayload(payload)).toEqual({ valid: true, errors: [] });
    expect(payload.summaryJson).toMatchObject({
      schemaVersion: 1,
      paperFamily: 'p3',
      attemptCount: 1,
      learningActivityAttemptCount: 1,
      issueReportCount: 1,
    });
    expect(payload.regionSummaryJson['algebra-forge']).toMatchObject({
      regionId: 'algebra-forge',
      rank: 'Discovered',
      accessStatus: 'open',
    });
  });

  it('rejects raw learner responses', () => {
    const payload = {
      ...validPayload(),
      learnerResponse: 'my working and final answer',
    };

    const result = validateProgressSnapshotPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('learnerResponse is forbidden');
  });

  it('rejects issue report notes', () => {
    const payload = {
      ...validPayload(),
      regionSummaryJson: {
        ...validPayload().regionSummaryJson,
        'algebra-forge': {
          ...validPayload().regionSummaryJson['algebra-forge'],
          note: 'The mark scheme crop is wrong.',
        },
      },
    };

    const result = validateProgressSnapshotPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('note is forbidden');
  });

  it('rejects unknown keys', () => {
    const payload = {
      ...validPayload(),
      summaryJson: {
        ...validPayload().summaryJson,
        extra: true,
      },
    };

    const result = validateProgressSnapshotPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('summaryJson.extra is not allowed');
  });

  it('rejects oversized JSON/text', () => {
    const payload = {
      ...validPayload(),
      summaryJson: {
        ...validPayload().summaryJson,
        lastActivityAt: '2026-05-08T00:04:00.000Z'.repeat(100),
      },
    };

    const result = validateProgressSnapshotPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('summaryJson.lastActivityAt must be an ISO timestamp');
  });

  it('rejects invalid region IDs', () => {
    const payload = {
      ...validPayload(),
      regionSummaryJson: {
        ...validPayload().regionSummaryJson,
        'not-a-region': {
          ...validPayload().regionSummaryJson['algebra-forge'],
          regionId: 'not-a-region',
        },
      },
    };

    const result = validateProgressSnapshotPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('not-a-region is not an allowed P3 region ID');
  });

  it('summarizes local progress without leaking raw attempt, learning, issue, or image content', () => {
    const payload = validPayload();
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain('This local reflection must not sync');
    expect(serialized).not.toContain('2^3 = 8');
    expect(serialized).not.toContain('Rewrite log base two');
    expect(serialized).not.toContain('mark scheme crop');
    expect(serialized).not.toContain('/assets/test/questions/q1.png');
    expect(serialized).not.toContain('/assets/test/mark_scheme/q1.png');
  });

  it('does not mutate normal local progress while building a snapshot', () => {
    const before = progress();
    const beforeJson = JSON.stringify(before);

    buildProgressSnapshotPayload({
      progress: before,
      questions: [question()],
      now: '2026-05-19T00:00:00.000Z',
    });

    expect(JSON.stringify(before)).toBe(beforeJson);
    expect(before.attempts[0].note).toBe('This local reflection must not sync.');
    expect(before.learningActivityAttempts[0].learnerResponse).toBe('2^3 = 8');
    expect(before.issueReports[0].note).toBe('This issue report note must not sync.');
  });
});
