import { describe, expect, it } from 'vitest';
import { normalizeQuestionBank } from '../src/lib/normalizeQuestionBank';
import {
  ASTERION_PROGRESS_STORAGE_KEY,
} from '../src/skill-checks/localAttempts';
import {
  examAttemptSuspicionFlags,
  loadExamAttempts,
  saveExamAttempt,
  summarizeExamEvidence,
} from '../src/lib/localExamAttempts';
import type { Attempt } from '../src/types';

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'exam_attempt_1',
    questionId: '32spring21_q04',
    paperFamily: 'p3',
    paper: '32spring21',
    questionNumber: '4',
    topicDisplayName: 'Differential Equations',
    marksEarned: 6,
    marksAvailable: 7,
    scoreRatio: 6 / 7,
    partScores: [
      {
        label: '(a)',
        attempted: true,
        marksEarned: 6,
        marksAvailable: 6,
        markPointIds: ['32spring21_q04_a_mp01', '32spring21_q04_a_mp02'],
        markPointsAvailable: 6,
      },
      {
        label: '(b)',
        attempted: false,
        marksEarned: 0,
        marksAvailable: 1,
        markPointIds: [],
        markPointsAvailable: 0,
      },
    ],
    selfMarked: true,
    evidenceKind: 'weak_self_marked_exam',
    evidenceLabel: 'Self-marked attempt',
    masteryEligible: false,
    masteryGate: 'skill_check_required',
    trustLabel: 'Exam practice evidence',
    suspicionFlags: [],
    confidentMode: false,
    confidenceRating: 'medium',
    answerRevealedBeforeMarking: false,
    markPointsTicked: 2,
    markPointsAvailable: 6,
    coarseSelfMarking: false,
    timingReliable: true,
    timeSpentSeconds: 420,
    markSchemeRevealed: true,
    attemptedAt: '2026-06-12T00:00:00.000Z',
    validatedRegionId: 'differential-equations',
    displayRegionId: 'differential-equations',
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

describe('local exam self-marked attempts', () => {
  it('saves and reloads part-by-part self-marking state', () => {
    const storage = memoryStorage({ schemaVersion: 1, attempts: [] });
    saveExamAttempt(storage, attempt({ id: 'part_attempt' }));
    const progress = JSON.parse(storage.getItem(ASTERION_PROGRESS_STORAGE_KEY) || '{}');

    expect(loadExamAttempts(storage)).toEqual([
      expect.objectContaining({
        id: 'part_attempt',
        selfMarked: true,
        evidenceKind: 'weak_self_marked_exam',
        partScores: [
          expect.objectContaining({
            label: '(a)',
            attempted: true,
            marksEarned: 6,
            markPointIds: ['32spring21_q04_a_mp01', '32spring21_q04_a_mp02'],
          }),
          expect.objectContaining({
            label: '(b)',
            attempted: false,
            marksEarned: 0,
          }),
        ],
      }),
    ]);
    expect(progress.error_log).toEqual([
      expect.objectContaining({
        question_id: '32spring21_q04:(b)',
        error_type: 'METHOD_ERROR',
        original_score_lost: 1,
      }),
    ]);
    expect(progress.redo_queue).toEqual([
      expect.objectContaining({
        error_log_id: progress.error_log[0].id,
        status: 'pending',
      }),
    ]);
    expect(progress.topic_performance.differential_equations.score_lost).toBe(1);
  });

  it('creates tickable mark points only when mark-scheme text matches official part marks', () => {
    const questions = normalizeQuestionBank({
      questions: [
        {
          question_id: 'fixture_q01',
          paper_family: 'p3',
          total_marks: 3,
          question_image_path: 'assets/exam-bank-data/p3/test/questions/q01.png',
          mark_scheme_image_path: 'assets/exam-bank-data/p3/test/mark_scheme/q01.png',
          subparts: [
            {
              subpart_id: 'fixture_q01_a',
              label: 'a',
              marks: 2,
              mark_scheme_text: {
                text: '(a) Use the correct method M1 Obtain the stated value A1',
              },
            },
            {
              subpart_id: 'fixture_q01_b',
              label: 'b',
              marks: 1,
              mark_scheme_text: {
                text: '(b) State the final interval B1',
              },
            },
          ],
        },
        {
          question_id: 'fixture_q02',
          paper_family: 'p3',
          total_marks: 2,
          question_image_path: 'assets/exam-bank-data/p3/test/questions/q02.png',
          mark_scheme_image_path: 'assets/exam-bank-data/p3/test/mark_scheme/q02.png',
          subparts: [
            {
              subpart_id: 'fixture_q02_a',
              label: 'a',
              marks: 1,
              mark_scheme_text: {
                text: '(a) This guidance mentions M1 and A1, so it is not a clean one-mark split.',
              },
            },
            {
              subpart_id: 'fixture_q02_b',
              label: 'b',
              marks: 1,
              mark_scheme_text: {
                text: '(b) Complete the final step B1',
              },
            },
          ],
        },
        {
          question_id: 'fixture_q03',
          paper_family: 'p3',
          total_marks: 3,
          question_image_path: 'assets/exam-bank-data/p3/test/questions/q03.png',
          mark_scheme_image_path: 'assets/exam-bank-data/p3/test/mark_scheme/q03.png',
          subparts: [
            {
              subpart_id: 'fixture_q03_whole',
              label: 'whole',
              marks: 3,
              mark_scheme_text: {
                text: 'Use the log law M1 Remove logarithms A1 Obtain the final expression A1',
              },
            },
          ],
        },
      ],
    });

    expect(questions[0].parts?.[0].markPoints).toEqual([
      expect.objectContaining({ markCode: 'M1', label: 'Use the correct method' }),
      expect.objectContaining({ markCode: 'A1', label: 'Obtain the stated value' }),
    ]);
    expect(questions[0].parts?.[1].markPoints).toEqual([
      expect.objectContaining({ markCode: 'B1', label: 'State the final interval' }),
    ]);
    expect(questions[1].parts?.[0].markPoints).toBeUndefined();
    expect(questions[1].parts?.[0].markSchemeText).toContain('not a clean one-mark split');
    expect(questions[2].parts).toEqual([
      expect.objectContaining({
        label: '(whole)',
        marksAvailable: 3,
        markPoints: [
          expect.objectContaining({ markCode: 'M1', label: 'Use the log law' }),
          expect.objectContaining({ markCode: 'A1', label: 'Remove logarithms' }),
          expect.objectContaining({ markCode: 'A1', label: 'Obtain the final expression' }),
        ],
      }),
    ]);
  });

  it('does not award mastery for a high self-marked exam score without Checked Practice pass', () => {
    const summary = summarizeExamEvidence({
      attempt: attempt({
        marksEarned: 7,
        marksAvailable: 7,
        scoreRatio: 1,
      }),
      skillCheckPassed: false,
    });

    expect(summary).toMatchObject({
      evidenceLabel: 'Self-marked attempt',
      masteryGate: 'skill_check_required',
      mastered: false,
      masteryLabel: 'Checked Practice required for mastery',
    });
  });

  it('keeps Checked Practice pass as the mastery gate while exam work only supports confidence', () => {
    const summary = summarizeExamEvidence({
      attempt: attempt(),
      skillCheckPassed: true,
    });

    expect(summary).toMatchObject({
      masteryGate: 'skill_check_passed',
      mastered: true,
      masteryLabel: 'Checked Practice passed; exam practice supports confidence',
    });
  });

  it('generates suspicion flags without deleting the self-marked evidence', () => {
    const flaggedAttempt = attempt({
      marksEarned: 7,
      marksAvailable: 7,
      scoreRatio: 1,
      markPointsTicked: 0,
      markPointsAvailable: 7,
      timeSpentSeconds: 30,
      confidenceRating: 'low',
    });

    const flags = examAttemptSuspicionFlags(flaggedAttempt);
    const summary = summarizeExamEvidence({
      attempt: flaggedAttempt,
      skillCheckPassed: false,
    });

    expect(flags).toEqual([
      'full_marks_without_mark_points',
      'very_high_score_low_time',
      'confidence_score_mismatch',
    ]);
    expect(summary.trustLabel).toBe('Low-trust self-marked evidence');
    expect(summary.evidenceKind).toBe('weak_self_marked_exam');
  });

  it('does not let confident mode bypass suspicion flags or mastery rules', () => {
    const confidentAttempt = attempt({
      confidentMode: true,
      marksEarned: 7,
      marksAvailable: 7,
      scoreRatio: 1,
      markPointsTicked: 0,
      markPointsAvailable: 7,
      answerRevealedBeforeMarking: true,
    });

    const summary = summarizeExamEvidence({
      attempt: confidentAttempt,
      skillCheckPassed: false,
    });

    expect(summary.suspicionFlags).toContain('answer_revealed_before_marking');
    expect(summary.trustLabel).toBe('Low-trust self-marked evidence');
    expect(summary.mastered).toBe(false);
  });
});
