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
      dueCandidates: 0,
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

  it('does not surface a repair before the delayed retrieval window', () => {
    const session = buildSkillCheckReviewSession([
      attempt({ timestamp: '2026-06-15T09:00:00.000Z' }),
    ], { now: '2026-06-16T09:00:00.000Z' });

    expect(session.groups).toEqual([]);
    expect(session.dueCandidates).toBe(0);
  });

  it('surfaces the first related repair two days after a mistake', () => {
    const session = buildSkillCheckReviewSession([
      attempt({
        attemptId: 'monday-partial-fractions',
        checkId: 'sc-alg-partial-fractions-foundation-001',
        skillId: 'p3_alg_partial_fraction_form',
        timestamp: '2026-06-15T09:00:00.000Z',
      }),
    ], { now: '2026-06-17T09:00:00.000Z' });

    expect(session.groups).toEqual([
      expect.objectContaining({
        mistakeTag: 'algebra slip',
        candidates: [
          expect.objectContaining({
            attemptId: 'monday-partial-fractions',
            dueLabel: '2-day repair',
            repairAttemptNumber: 1,
            relatedSkillId: 'p3_alg_partial_fraction_form',
            dueAt: '2026-06-17T09:00:00.000Z',
          }),
        ],
      }),
    ]);
  });

  it('keeps next-week repair due after one clean correction', () => {
    const session = buildSkillCheckReviewSession([
      attempt({
        attemptId: 'monday-wrong',
        checkId: 'sc-alg-partial-fractions-foundation-001',
        skillId: 'p3_alg_partial_fraction_form',
        isCorrect: false,
        timestamp: '2026-06-15T09:00:00.000Z',
      }),
      attempt({
        attemptId: 'wednesday-clean',
        checkId: 'sc-alg-partial-fractions-core-001',
        skillId: 'p3_alg_partial_fraction_form',
        isCorrect: true,
        mistakeTags: [],
        timestamp: '2026-06-17T10:00:00.000Z',
      }),
    ], { now: '2026-06-22T09:00:00.000Z' });

    expect(session.groups[0].candidates).toEqual([
      expect.objectContaining({
        attemptId: 'monday-wrong',
        dueLabel: 'next-week repair',
        repairAttemptNumber: 2,
        dueAt: '2026-06-22T09:00:00.000Z',
      }),
    ]);
  });

  it('closes the spaced repair only after clean corrections in both due windows', () => {
    const session = buildSkillCheckReviewSession([
      attempt({
        attemptId: 'monday-wrong',
        checkId: 'sc-alg-partial-fractions-foundation-001',
        skillId: 'p3_alg_partial_fraction_form',
        isCorrect: false,
        timestamp: '2026-06-15T09:00:00.000Z',
      }),
      attempt({
        attemptId: 'wednesday-clean',
        checkId: 'sc-alg-partial-fractions-core-001',
        skillId: 'p3_alg_partial_fraction_form',
        isCorrect: true,
        mistakeTags: [],
        timestamp: '2026-06-17T10:00:00.000Z',
      }),
      attempt({
        attemptId: 'next-week-clean',
        checkId: 'sc-alg-partial-fractions-challenge-001',
        skillId: 'p3_alg_partial_fraction_form',
        isCorrect: true,
        mistakeTags: [],
        timestamp: '2026-06-22T10:00:00.000Z',
      }),
    ], { now: '2026-06-23T09:00:00.000Z' });

    expect(session.groups).toEqual([]);
    expect(session.dueCandidates).toBe(0);
  });
});
