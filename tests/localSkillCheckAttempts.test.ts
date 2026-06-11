import { describe, expect, it } from 'vitest';
import {
  ASTERION_PROGRESS_STORAGE_KEY,
  loadSkillCheckAttempts,
  saveSkillCheckAttempt,
  skillCheckPassState,
  type SkillCheckLocalAttempt,
} from '../src/skill-checks/localAttempts';

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
    const saved = saveSkillCheckAttempt(storage, attempt({ attemptId: 'attempt_saved' }));

    expect(saved).toHaveLength(1);
    expect(loadSkillCheckAttempts(storage)).toEqual([
      expect.objectContaining({ attemptId: 'attempt_saved', submittedAnswer: '4' }),
    ]);
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
});
