import { describe, expect, it } from 'vitest';
import { buildSkillCheckReviewSession, parseSkillCheckAttemptRecords } from '../src/skill-checks/reviewSessions';
import type { SkillCheckAttemptRecord } from '../src/types';

function attempt(overrides: Partial<SkillCheckAttemptRecord>): SkillCheckAttemptRecord {
  return {
    attemptId: 'attempt-1',
    course: 'p3',
    topic: 'Algebra',
    skillId: 'p3_alg_partial_fraction_form',
    checkId: 'check-1',
    submittedAnswer: 'A=2',
    isCorrect: false,
    usedHint: false,
    revealedAnswer: false,
    revealedRepairStep: false,
    mistakeTags: ['algebra slip'],
    timestamp: '2026-06-11T00:00:00.000Z',
    ...overrides,
  };
}

describe('P3 mistake-driven review sessions', () => {
  it('groups attempts by mistake tag', () => {
    const session = buildSkillCheckReviewSession([
      attempt({ attemptId: 'a', mistakeTags: ['algebra slip'] }),
      attempt({ attemptId: 'b', topic: 'Trigonometry', mistakeTags: ['algebra slip', 'wrong identity'] }),
      attempt({ attemptId: 'c', mistakeTags: ['wrong identity'] }),
    ]);

    expect(session.groups.map((group) => [group.mistakeTag, group.count])).toEqual([
      ['algebra slip', 2],
      ['wrong identity', 2],
    ]);
  });

  it('returns a useful empty session when there are no tagged mistakes', () => {
    const session = buildSkillCheckReviewSession([]);

    expect(session).toEqual({
      groups: [],
      totalCandidates: 0,
    });
  });

  it('includes revealed and repaired attempts as review candidates', () => {
    const session = buildSkillCheckReviewSession([
      attempt({ attemptId: 'repair', revealedRepairStep: true, mistakeTags: ['method choice'] }),
      attempt({ attemptId: 'reveal', revealedAnswer: true, isCorrect: true, mistakeTags: ['notation'] }),
    ]);

    expect(session.groups).toEqual(expect.arrayContaining([
      expect.objectContaining({
        mistakeTag: 'method choice',
        candidates: [expect.objectContaining({ attemptId: 'repair', state: 'repaired' })],
      }),
      expect.objectContaining({
        mistakeTag: 'notation',
        candidates: [expect.objectContaining({ attemptId: 'reveal', state: 'revealed' })],
      }),
    ]));
  });

  it('does not include clean correct attempts as mistakes', () => {
    const session = buildSkillCheckReviewSession([
      attempt({ isCorrect: true, mistakeTags: ['algebra slip'] }),
    ]);

    expect(session.groups).toEqual([]);
  });

  it('tolerates missing and old records when parsing local attempts', () => {
    const parsed = parseSkillCheckAttemptRecords([
      null,
      { activityId: 'legacy-quick-check', outcome: 'got_it' },
      { course: 'p3', checkId: 'valid', timestamp: '2026-06-11T00:00:00.000Z', mistakeTags: ['algebra slip', 'made-up'] },
    ]);

    expect(parsed).toEqual([
      expect.objectContaining({
        checkId: 'valid',
        mistakeTags: ['algebra slip'],
      }),
    ]);
  });
});
