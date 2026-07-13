import { describe, expect, it } from 'vitest';
import {
  ASTERION_PROGRESS_STORAGE_KEY,
  appendStudentAttemptHistoryRecord,
  isSkillCheckLocalAttemptRecord,
  loadSkillCheckAttempts,
  normalizeStudentAttemptHistory,
  normalizeSkillCheckLocalAttempts,
  saveSkillCheckAttempt,
  skillCheckPassState,
  updateLatestSkillCheckAttemptMistakeTags,
  type SkillCheckLocalAttempt,
} from '../src/skill-checks/localAttempts';
import { targetedPromptForMistakeTags } from '../src/skill-checks/mistakeRecovery';

function attempt(overrides: Partial<SkillCheckLocalAttempt>): SkillCheckLocalAttempt {
  return {
    attemptId: 'attempt_1',
    course: 'p3',
    topic: 'Algebra',
    skillId: 'p3_alg_binomial_terms_coefficients',
    checkId: 'sc-alg-binomial-foundation-001',
    submittedAnswer: '4',
    isCorrect: true,
    usedHint: false,
    revealedAnswer: false,
    revealedRepairStep: false,
    mistakeTags: [],
    timestamp: '2026-06-11T00:00:00.000Z',
    ...overrides,
  };
}

function memoryStorage(initial?: unknown) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(ASTERION_PROGRESS_STORAGE_KEY, JSON.stringify(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('local Skill Check attempts', () => {
  it('saves and reloads attempts from localStorage-shaped storage', () => {
    const storage = memoryStorage({ schemaVersion: 1, attempts: [] });
    const saved = saveSkillCheckAttempt(storage, attempt({ attemptId: 'attempt_saved', isCorrect: false, mistakeTags: ['notation'] }));
    const progress = JSON.parse(storage.getItem(ASTERION_PROGRESS_STORAGE_KEY) || '{}');

    expect(saved).toHaveLength(1);
    expect(loadSkillCheckAttempts(storage)).toEqual([
      expect.objectContaining({ attemptId: 'attempt_saved', submittedAnswer: '4' }),
    ]);
    expect(progress.attemptHistory).toMatchObject({
      schemaVersion: 1,
      records: [
        expect.objectContaining({
          source: 'checked_practice',
          questionId: 'sc-alg-binomial-foundation-001',
          response: '4',
          correct: false,
          attemptNumber: 1,
          relatedAttemptId: 'attempt_saved',
        }),
      ],
    });
    expect(progress.error_log).toEqual([
      expect.objectContaining({
        question_id: 'sc-alg-binomial-foundation-001',
        error_type: 'NOTATION_ERROR',
      }),
    ]);
    expect(progress.redo_queue).toEqual([
      expect.objectContaining({
        error_log_id: progress.error_log[0].id,
        status: 'pending',
      }),
    ]);
    expect(progress.knowledge_errors).toEqual([
      expect.objectContaining({
        questionId: 'sc-alg-binomial-foundation-001',
        primarySkillNodeId: 'p3_alg_binomial_terms_coefficients',
        errorType: 'representation_error',
      }),
    ]);
    expect(progress.knowledge_state_graph.skills.p3_alg_binomial_terms_coefficients).toMatchObject({
      category: 'unknown',
      lastOutcome: 'failure',
    });
  });

  it('does not mark wrong answers as passed', () => {
    const state = skillCheckPassState([
      attempt({ checkId: 'check-a', isCorrect: false, submittedAnswer: '5' }),
    ], ['check-a']);

    expect(state).toMatchObject({
      passed: false,
      passedCheckIds: [],
      attemptedCheckIds: ['check-a'],
    });
  });

  it('does not mark revealed answers as passed', () => {
    const state = skillCheckPassState([
      attempt({ checkId: 'check-a', isCorrect: true, revealedAnswer: true }),
      attempt({ checkId: 'check-b', isCorrect: true, revealedRepairStep: true }),
    ], ['check-a', 'check-b']);

    expect(state).toMatchObject({
      passed: false,
      passedCheckIds: [],
    });
  });

  it('records repair reveal state without granting pass', () => {
    const repairedAttempt = attempt({ checkId: 'check-a', isCorrect: false, revealedRepairStep: true });
    const storage = memoryStorage();
    saveSkillCheckAttempt(storage, repairedAttempt);

    expect(loadSkillCheckAttempts(storage)).toEqual([
      expect.objectContaining({ revealedRepairStep: true, revealedAnswer: false }),
    ]);
    expect(skillCheckPassState([repairedAttempt], ['check-a']).passed).toBe(false);
  });

  it('does not let a repaired correct answer automatically pass', () => {
    const state = skillCheckPassState([
      attempt({ checkId: 'check-a', isCorrect: true, revealedRepairStep: true }),
    ], ['check-a']);

    expect(state).toMatchObject({
      passed: false,
      passedCheckIds: [],
    });
  });

  it('keeps a later correction to the same item as practice-only evidence', () => {
    const state = skillCheckPassState([
      attempt({ checkId: 'check-a', attemptId: 'wrong', isCorrect: false, submittedAnswer: '5' }),
      attempt({ checkId: 'check-a', attemptId: 'retry', isCorrect: true, submittedAnswer: '4' }),
    ], ['check-a']);

    expect(state).toMatchObject({
      passed: false,
      passedCheckIds: [],
      attemptedCheckIds: ['check-a'],
    });
  });

  it('accepts the first clean submission to a distinct retry variant as strong evidence', () => {
    const state = skillCheckPassState([
      attempt({ checkId: 'check-a', attemptId: 'wrong', isCorrect: false, submittedAnswer: '5' }),
      attempt({
        checkId: 'check-a',
        attemptId: 'retry-variant',
        retryVariantId: 'variant-b',
        isCorrect: true,
        submittedAnswer: '7',
      }),
    ], ['check-a']);

    expect(state).toMatchObject({
      passed: true,
      passedCheckIds: ['check-a'],
    });
  });

  it('keeps response history append-only across retries', () => {
    const storage = memoryStorage();
    saveSkillCheckAttempt(storage, attempt({ attemptId: 'wrong', checkId: 'check-a', isCorrect: false, submittedAnswer: '5' }));
    saveSkillCheckAttempt(storage, attempt({ attemptId: 'retry', checkId: 'check-a', isCorrect: true, submittedAnswer: '4' }));
    const progress = JSON.parse(storage.getItem(ASTERION_PROGRESS_STORAGE_KEY) || '{}');

    expect(progress.attemptHistory.records).toEqual([
      expect.objectContaining({
        questionId: 'check-a',
        response: '5',
        correct: false,
        attemptNumber: 1,
        relatedAttemptId: 'wrong',
      }),
      expect.objectContaining({
        questionId: 'check-a',
        response: '4',
        correct: true,
        attemptNumber: 2,
        relatedAttemptId: 'retry',
      }),
    ]);
  });

  it('persists derived strong-evidence state for primary and distinct retry variants', () => {
    const storage = memoryStorage();
    saveSkillCheckAttempt(storage, attempt({ attemptId: 'wrong', checkId: 'check-a', isCorrect: false }));
    saveSkillCheckAttempt(storage, attempt({ attemptId: 'same-item-correction', checkId: 'check-a', isCorrect: true }));
    saveSkillCheckAttempt(storage, attempt({
      attemptId: 'clean-variant',
      checkId: 'check-a',
      retryVariantId: 'variant-b',
      isCorrect: true,
    }));

    expect(loadSkillCheckAttempts(storage).map((record) => record.strongEvidence)).toEqual([false, false, true]);
  });

  it('normalizes malformed response history without breaking old progress', () => {
    expect(normalizeStudentAttemptHistory(undefined)).toEqual({ schemaVersion: 1, records: [] });
    expect(normalizeStudentAttemptHistory({
      schemaVersion: 1,
      records: [
        { id: 'bad', source: 'checked_practice', course: 'p3', questionId: 'q1' },
        {
          id: 'valid',
          source: 'learn_mode',
          course: 'p3',
          questionId: 'q1',
          response: 'x=2',
          correct: true,
          timestamp: '2026-07-07T00:00:00.000Z',
          attemptNumber: 1,
        },
      ],
    })).toEqual({
      schemaVersion: 1,
      records: [
        expect.objectContaining({ id: 'valid', questionId: 'q1', correct: true }),
      ],
    });
  });

  it('can append a review record without editing previous attempts', () => {
    const first = appendStudentAttemptHistoryRecord(undefined, {
      id: 'h1',
      source: 'checked_practice',
      course: 'p3',
      questionId: 'q1',
      response: 'wrong',
      correct: false,
      timestamp: '2026-07-07T00:00:00.000Z',
    });
    const second = appendStudentAttemptHistoryRecord(first, {
      id: 'h2',
      source: 'checked_practice',
      course: 'p3',
      questionId: 'q1',
      response: 'right',
      correct: true,
      timestamp: '2026-07-07T00:01:00.000Z',
    });

    expect(second.records.map((record) => [record.id, record.response, record.attemptNumber])).toEqual([
      ['h1', 'wrong', 1],
      ['h2', 'right', 2],
    ]);
  });

  it('records hint use and keeps the attempt out of strong evidence', () => {
    const hintedAttempt = attempt({ checkId: 'check-a', usedHint: true });
    const state = skillCheckPassState([hintedAttempt], ['check-a']);

    expect(hintedAttempt.usedHint).toBe(true);
    expect(state).toMatchObject({
      passed: false,
      passedCheckIds: [],
    });
  });

  it('keeps P1 and P3 passes isolated even when check IDs match', () => {
    const attempts = [
      attempt({ attemptId: 'p3-pass', checkId: 'shared-check', course: 'p3' }),
      attempt({ attemptId: 'p1-wrong', checkId: 'shared-check', course: 'p1', isCorrect: false }),
    ];

    expect(skillCheckPassState(attempts, ['shared-check'], 'p3').passed).toBe(true);
    expect(skillCheckPassState(attempts, ['shared-check'], 'p1').passed).toBe(false);
  });

  it('defaults legacy records without a course to P3', () => {
    const legacy = { ...attempt({ attemptId: 'legacy' }) } as Record<string, unknown>;
    delete legacy.course;

    expect(normalizeSkillCheckLocalAttempts([legacy])).toEqual([
      expect.objectContaining({ attemptId: 'legacy', course: 'p3' }),
    ]);
    expect(normalizeStudentAttemptHistory({
      schemaVersion: 1,
      records: [{
        id: 'legacy-history',
        source: 'checked_practice',
        questionId: 'q1',
        response: '2',
        correct: true,
        timestamp: '2026-07-07T00:00:00.000Z',
        attemptNumber: 1,
      }],
    }).records[0]).toMatchObject({ course: 'p3' });
  });

  it('requires all configured checkable items to pass', () => {
    const state = skillCheckPassState([
      attempt({ checkId: 'check-a' }),
    ], ['check-a', 'check-b']);

    expect(state).toMatchObject({
      passed: false,
      passedCheckIds: ['check-a'],
      requiredCheckIds: ['check-a', 'check-b'],
    });
  });

  it('does not create fake pass state when there are no checkable items', () => {
    const state = skillCheckPassState([
      attempt({ checkId: 'uncheckable-card' }),
    ], []);

    expect(state).toMatchObject({
      passed: false,
      requiredCheckIds: [],
    });
  });

  it('ignores legacy self-reported learning activity records for Skill Check pass state', () => {
    const storage = memoryStorage({
      learningActivityAttempts: [
        {
          activityId: 'sc-alg-binomial-foundation-001',
          outcome: 'got_it',
          completedAt: '2026-06-11T00:00:00.000Z',
        },
      ],
      skillCheckAttempts: [],
    });

    expect(loadSkillCheckAttempts(storage)).toEqual([]);
    expect(skillCheckPassState(loadSkillCheckAttempts(storage), ['sc-alg-binomial-foundation-001'])).toMatchObject({
      passed: false,
      passedCheckIds: [],
      attemptedCheckIds: [],
    });
  });

  it('filters malformed old Skill Check records so they fail closed', () => {
    const malformedCorrect = {
      checkId: 'sc-alg-binomial-foundation-001',
      regionId: 'algebra',
      isCorrect: true,
      outcome: 'got_it',
    };
    const storage = memoryStorage({
      skillCheckAttempts: [
        malformedCorrect,
        attempt({ attemptId: 'valid-clean' }),
      ],
    });

    expect(isSkillCheckLocalAttemptRecord(malformedCorrect)).toBe(false);
    expect(loadSkillCheckAttempts(storage)).toEqual([
      expect.objectContaining({ attemptId: 'valid-clean' }),
    ]);
    expect(skillCheckPassState(normalizeSkillCheckLocalAttempts([malformedCorrect]), ['sc-alg-binomial-foundation-001'])).toMatchObject({
      passed: false,
      passedCheckIds: [],
      attemptedCheckIds: [],
    });
  });

  it('treats missing and malformed storage as a clean empty Skill Check state', () => {
    const missing = memoryStorage();
    const malformed = {
      getItem: () => '{not json',
      setItem: () => undefined,
    };

    expect(loadSkillCheckAttempts(missing)).toEqual([]);
    expect(loadSkillCheckAttempts(malformed)).toEqual([]);
    expect(skillCheckPassState(loadSkillCheckAttempts(missing), ['check-a'])).toMatchObject({
      passed: false,
      passedCheckIds: [],
    });
  });

  it('records selected mistake tags on the latest matching attempt', () => {
    const storage = memoryStorage();
    saveSkillCheckAttempt(storage, attempt({ attemptId: 'older', checkId: 'check-a', isCorrect: false, mistakeTags: [] }));
    saveSkillCheckAttempt(storage, attempt({ attemptId: 'latest', checkId: 'check-a', isCorrect: false, mistakeTags: [] }));

    const updated = updateLatestSkillCheckAttemptMistakeTags(storage, 'check-a', ['algebra slip', 'sign error']);
    const progress = JSON.parse(storage.getItem(ASTERION_PROGRESS_STORAGE_KEY) || '{}');

    expect(updated).toMatchObject({
      attemptId: 'latest',
      mistakeTags: ['algebra slip', 'sign error'],
    });
    expect(loadSkillCheckAttempts(storage).map((record) => record.mistakeTags)).toEqual([
      [],
      ['algebra slip', 'sign error'],
    ]);
    expect(progress.error_log.at(-1)).toMatchObject({
      question_id: 'check-a',
      error_type: 'ALGEBRA_ERROR',
    });
    expect(progress.knowledge_errors.at(-1)).toMatchObject({
      questionId: 'check-a',
      errorType: 'algebraic_execution_error',
    });
  });

  it('selects a targeted prompt from the chosen mistake tag', () => {
    expect(targetedPromptForMistakeTags(['calculator'])).toBe('My calculator setup was wrong because...');
    expect(targetedPromptForMistakeTags(['wrong identity', 'notation'])).toBe('I used the wrong identity because...');
  });
});
