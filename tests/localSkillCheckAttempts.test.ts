import { describe, expect, it } from 'vitest';
import {
  ASTERION_PROGRESS_STORAGE_KEY,
  isSkillCheckLocalAttemptRecord,
  loadSkillCheckAttempts,
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

  it('allows retry after a wrong answer without counting the wrong answer as passed', () => {
    const state = skillCheckPassState([
      attempt({ checkId: 'check-a', attemptId: 'wrong', isCorrect: false, submittedAnswer: '5' }),
      attempt({ checkId: 'check-a', attemptId: 'retry', isCorrect: true, submittedAnswer: '4' }),
    ], ['check-a']);

    expect(state).toMatchObject({
      passed: true,
      passedCheckIds: ['check-a'],
      attemptedCheckIds: ['check-a'],
    });
  });

  it('records hint use without blocking a correct unrevealed pass', () => {
    const hintedAttempt = attempt({ checkId: 'check-a', usedHint: true });
    const state = skillCheckPassState([hintedAttempt], ['check-a']);

    expect(hintedAttempt.usedHint).toBe(true);
    expect(state).toMatchObject({
      passed: true,
      passedCheckIds: ['check-a'],
    });
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
