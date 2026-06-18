import { describe, expect, it } from 'vitest';
import {
  assessmentFromExamAttempt,
  assessmentFromSkillCheckAttempt,
  computeTopicBreakdown,
  generateErrorLogEntry,
  updateStudentPerformanceState,
} from '../src/lib/studentAnalytics';
import type { Attempt, SkillCheckAttemptRecord } from '../src/types';

function skillAttempt(overrides: Partial<SkillCheckAttemptRecord> = {}): SkillCheckAttemptRecord {
  return {
    attemptId: 'skill_attempt_1',
    course: 'p3',
    topic: 'Algebra',
    skillId: 'p3_alg_partial_fractions',
    checkId: 'check_partial_fractions',
    submittedAnswer: 'x + 1',
    isCorrect: false,
    usedHint: false,
    revealedAnswer: false,
    revealedRepairStep: false,
    mistakeTags: [],
    timestamp: '2026-06-18T02:15:00.000Z',
    regionId: 'algebra',
    ...overrides,
  };
}

function examAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'exam_attempt_1',
    questionId: '32spring24_q08',
    paperFamily: 'p3',
    paper: '32spring24',
    questionNumber: '8',
    topicDisplayName: 'Trigonometry',
    marksEarned: 5,
    marksAvailable: 7,
    scoreRatio: 5 / 7,
    partScores: [
      {
        partId: 'a',
        label: '(a)',
        attempted: true,
        marksEarned: 2,
        marksAvailable: 2,
        mappedRegionId: 'trigonometry',
      },
      {
        partId: 'b',
        label: '(b)',
        attempted: true,
        marksEarned: 3,
        marksAvailable: 5,
        mappedRegionId: 'trigonometry',
      },
    ],
    selfMarked: true,
    timeSpentSeconds: 600,
    markSchemeRevealed: true,
    attemptedAt: '2026-06-18T02:15:00.000Z',
    validatedRegionId: 'trigonometry',
    displayRegionId: 'trigonometry',
    ...overrides,
  };
}

describe('P3 student analytics', () => {
  it('generates mandatory classified error entries with a 48-hour redo window', () => {
    const timestamp = Date.parse('2026-06-18T02:15:00.000Z');
    const entry = generateErrorLogEntry({
      student_id: 'student-1',
      unit: 'trigonometry',
      topic: 'trigonometry',
      question_id: 'q1',
      timestamp,
      original_score_lost: 3,
    });

    expect(entry).toMatchObject({
      student_id: 'student-1',
      error_type: 'METHOD_ERROR',
      severity: 'MEDIUM',
      redo_completed: false,
      redo_success: false,
    });
    expect(entry.redo_available_at).toBe(timestamp + 48 * 60 * 60 * 1000);
  });

  it('computes the required topic breakdown from question metadata instead of total score only', () => {
    const breakdown = computeTopicBreakdown({
      assessment_id: 'strip_1',
      unit: 'mixed',
      questions: [
        {
          question_id: 'q1',
          regionId: 'logarithmic-and-exponential-functions',
          marksEarned: 2,
          marksAvailable: 5,
        },
        {
          question_id: 'q2',
          primaryTopicId: '9709_p3_topic_numerical_solution_of_equations',
          marksEarned: 4,
          marksAvailable: 4,
        },
      ],
    });

    expect(Object.keys(breakdown.topic_scores)).toEqual([
      'algebra',
      'logs_exp',
      'trigonometry',
      'differentiation',
      'integration',
      'vectors',
      'complex_numbers',
      'differential_equations',
      'numerical_methods',
    ]);
    expect(breakdown.topic_scores.logs_exp).toEqual({ score_lost: 3, questions: 1 });
    expect(breakdown.topic_scores.numerical_methods).toEqual({ score_lost: 0, questions: 1 });
    expect(breakdown.total_score).toBe(6);
    expect(breakdown.total_marks_lost).toBe(3);
  });

  it('updates state for an incorrect Checked Practice answer and creates a linked redo item', () => {
    const state = updateStudentPerformanceState({}, assessmentFromSkillCheckAttempt(skillAttempt({
      mistakeTags: ['algebra slip'],
    })));

    expect(state.error_log).toHaveLength(1);
    expect(state.error_log[0]).toMatchObject({
      question_id: 'check_partial_fractions',
      error_type: 'ALGEBRA_ERROR',
      original_score_lost: 1,
    });
    expect(state.redo_queue).toEqual([
      expect.objectContaining({
        error_log_id: state.error_log[0].id,
        question_id: 'check_partial_fractions',
        status: 'pending',
      }),
    ]);
    expect(state.knowledge_errors).toEqual([
      expect.objectContaining({
        questionId: 'check_partial_fractions',
        primarySkillNodeId: 'p3_alg_partial_fractions',
        errorType: 'algebraic_execution_error',
      }),
    ]);
    expect(state.knowledge_state_graph.skills.p3_alg_partial_fractions).toMatchObject({
      category: 'unknown',
      lastOutcome: 'failure',
    });
    expect(state.knowledge_interventions).toEqual([
      expect.objectContaining({
        action: 'micro_reteach',
        skillNodeId: 'p3_alg_partial_fractions',
      }),
    ]);
    expect(state.weak_topics).toEqual(['algebra']);
    expect(state.priority_repair_topics).toEqual(['algebra']);
  });

  it('updates state for partially correct Exam Training and tracks topic-level marks lost', () => {
    const state = updateStudentPerformanceState({}, assessmentFromExamAttempt(examAttempt()));

    expect(state.error_log).toHaveLength(1);
    expect(state.error_log[0]).toMatchObject({
      question_id: '32spring24_q08:b:(b)',
      topic: 'trigonometry',
      original_score_lost: 2,
    });
    expect(state.topic_performance.trigonometry).toMatchObject({
      score_lost: 2,
      questions: 2,
      marks_available: 7,
      marks_earned: 5,
    });
    expect(state.topic_assessments?.[0].topic_scores.trigonometry).toEqual({
      score_lost: 2,
      questions: 2,
    });
    expect(state.knowledge_state_updates.some((update) => update.skillNodeId === 'trigonometry')).toBe(true);
    expect(state.knowledge_errors.length).toBeGreaterThan(0);
  });

  it('marks redo completion on the error log and gives redo repair higher weight', () => {
    const initial = updateStudentPerformanceState({}, assessmentFromSkillCheckAttempt(skillAttempt()));
    const completed = updateStudentPerformanceState(initial, {
      kind: 'redo_completion',
      error_log_id: initial.error_log[0].id,
      completed_at: Date.parse('2026-06-20T02:15:00.000Z'),
      redo_success: true,
    });

    expect(completed.error_log[0]).toMatchObject({
      redo_completed: true,
      redo_success: true,
    });
    expect(completed.redo_queue[0]).toMatchObject({
      status: 'corrected_full_solution',
      redo_success: true,
    });
    expect(completed.topic_performance.algebra.redo_marks_repaired).toBe(1.5);
    expect(completed.topic_performance.algebra.history.at(-1)).toMatchObject({
      source: 'redo',
      score_lost: 0,
    });
  });

  it('returns the requested student analytics object shape', () => {
    const state = updateStudentPerformanceState({}, assessmentFromSkillCheckAttempt(skillAttempt()));

    expect(state).toEqual(expect.objectContaining({
      error_log: expect.any(Array),
      topic_performance: expect.any(Object),
      weak_topics: expect.any(Array),
      redo_queue: expect.any(Array),
      error_distribution: expect.any(Object),
      priority_repair_topics: expect.any(Array),
      knowledge_state_graph: expect.any(Object),
      knowledge_state_updates: expect.any(Array),
      knowledge_errors: expect.any(Array),
      knowledge_interventions: expect.any(Array),
      knowledge_schedules: expect.any(Array),
    }));
  });
});
