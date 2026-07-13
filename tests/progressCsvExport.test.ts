import { describe, expect, it } from 'vitest';
import {
  buildLocalProgressCsv,
  csvEscapeCell,
  LOCAL_PROGRESS_CSV_HEADERS,
  localProgressCsvRows,
  localProgressSubmissionSummary,
} from '../src/lib/progressCsvExport';
import type { Attempt, SkillCheckAttemptRecord, StoredProgress } from '../src/types';

function skillAttempt(overrides: Partial<SkillCheckAttemptRecord> = {}): SkillCheckAttemptRecord {
  return {
    attemptId: 'skill_1',
    course: 'p3',
    topic: 'Algebra',
    skillId: 'p3_alg_structure',
    checkId: 'sc-alg-001',
    submittedAnswer: 'x = 2',
    isCorrect: true,
    usedHint: false,
    revealedAnswer: false,
    revealedRepairStep: false,
    mistakeTags: [],
    timestamp: '2026-06-12T01:00:00.000Z',
    regionId: 'algebra',
    ...overrides,
  };
}

function examAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'exam_1',
    questionId: '33autumn23_q03',
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    marksEarned: 5,
    marksAvailable: 5,
    scoreRatio: 1,
    selfMarked: true,
    evidenceKind: 'weak_self_marked_exam',
    evidenceLabel: 'Self-marked attempt',
    masteryEligible: false,
    masteryGate: 'skill_check_required',
    trustLabel: 'Low-trust self-marked evidence',
    suspicionFlags: ['full_marks_without_mark_points', 'answer_revealed_before_marking'],
    timeSpentSeconds: 120,
    markSchemeRevealed: true,
    attemptedAt: '2026-06-12T02:00:00.000Z',
    ...overrides,
  };
}

describe('local progress CSV export', () => {
  it('escapes commas, quotes, and newlines in CSV cells', () => {
    expect(csvEscapeCell('plain')).toBe('plain');
    expect(csvEscapeCell('a,b')).toBe('"a,b"');
    expect(csvEscapeCell('said "yes"')).toBe('"said ""yes"""');
    expect(csvEscapeCell('line 1\nline 2')).toBe('"line 1\nline 2"');
  });

  it('exports available Checked Practice, Exam Training, and Review rows from browser storage shape', () => {
    const progress: Partial<StoredProgress> = {
      skillCheckAttempts: [
        skillAttempt({
          attemptId: 'wrong_revealed',
          submittedAnswer: 'bad, answer',
          isCorrect: false,
          revealedRepairStep: true,
          mistakeTags: ['algebra slip'],
        }),
      ],
      attempts: [
        examAttempt(),
      ],
      learningActivityAttempts: [],
      knowledge_state_updates: [{
        id: 'ksu_1',
        attemptId: 'skill_1',
        questionId: 'sc-alg-001',
        skillNodeId: 'p3_alg_structure',
        previousScore: 50,
        newScore: 36,
        previousCategory: 'developing',
        newCategory: 'fragile',
        confidence: 33,
        stabilityFlag: 'fragile',
        outcome: 'failure',
        evidenceStrength: 0.85,
        timestamp: '2026-06-12T01:00:00.000Z',
      }],
      knowledge_errors: [{
        id: 'kerr_1',
        attemptId: 'skill_1',
        questionId: 'sc-alg-001',
        markPointId: 'sc-alg-001',
        markPointLabel: 'Algebra structure',
        skillNodeIds: ['p3_alg_structure'],
        primarySkillNodeId: 'p3_alg_structure',
        errorType: 'algebraic_execution_error',
        severity: 'low',
        repeat: false,
        evidenceStrength: 0.85,
        evidenceSource: 'checked_practice',
        marksLost: 1,
        timestamp: '2026-06-12T01:00:00.000Z',
      }],
      knowledge_interventions: [{
        id: 'kint_1',
        attemptId: 'skill_1',
        skillNodeId: 'p3_alg_structure',
        action: 'micro_reteach',
        rationale: 'Skill state is fragile after algebraic execution error.',
        stateChange: {
          previousScore: 50,
          newScore: 36,
          category: 'fragile',
          stabilityFlag: 'fragile',
        },
        sourceErrorIds: ['kerr_1'],
        createdAt: '2026-06-12T01:00:00.000Z',
      }],
      knowledge_schedules: [{
        id: 'ksch_1',
        interventionId: 'kint_1',
        attemptId: 'skill_1',
        skillNodeId: 'p3_alg_structure',
        retestTiming: 'immediate',
        followUpItemType: 'micro_reteach',
        difficultyRelation: 'isomorphic',
        dueAt: '2026-06-12T01:00:00.000Z',
        reason: 'State moved toward fragile.',
        createdAt: '2026-06-12T01:00:00.000Z',
      }],
    };

    const metadata = {
      submissionId: 'progress_export_1',
      studentName: 'Ada Lovelace',
      classGroup: 'Summer P3',
      reportingPeriod: 'Week of 2026-06-08',
      submissionTimestamp: '2026-06-12T03:00:00.000Z',
    };
    const rows = localProgressCsvRows(progress, metadata);

    expect(rows).toEqual([
      expect.objectContaining({
        activity_type: 'Submission Summary',
        course: 'p3',
        route_page_type: 'export',
        submission_id: 'progress_export_1',
        student_name: 'Ada Lovelace',
        class_group: 'Summer P3',
        reporting_period: 'Week of 2026-06-08',
        answer_result_summary: 'checked_practice_attempts=1; checked_practice_passes=0; review_candidates=1; self_marked_exam_attempts=1; learning_activity_attempts=0; knowledge_state_updates=1; knowledge_errors=1; knowledge_interventions=1',
        evidence_status_label: 'export_metadata_only',
      }),
      expect.objectContaining({
        activity_type: 'Checked Practice',
        course: 'p3',
        route_page_type: 'skill-check',
        item_id: 'sc-alg-001',
        deterministic_pass_fail: 'fail',
        answer_result_summary: 'bad, answer',
        student_name: 'Ada Lovelace',
      }),
      expect.objectContaining({
        activity_type: 'Review',
        route_page_type: 'review',
        evidence_label: 'Review candidate from local checked practice attempt',
        suspicion_flags: 'algebra slip',
      }),
      expect.objectContaining({
        activity_type: 'Exam Training',
        course: 'p3',
        route_page_type: 'exam-training',
        item_id: '33autumn23_q03',
        self_marked_score: '5/5',
        evidence_label: 'Self-marked attempt',
        evidence_status_label: 'self_marked_exam_practice_only',
        suspicion_flags: 'full_marks_without_mark_points|answer_revealed_before_marking',
      }),
      expect.objectContaining({
        activity_type: 'Skill State Update',
        route_page_type: 'knowledge-state',
        knowledge_skill_id: 'p3_alg_structure',
        knowledge_state_category: 'fragile',
      }),
      expect.objectContaining({
        activity_type: 'Error Diagnostic',
        knowledge_error_type: 'algebraic_execution_error',
        knowledge_error_severity: 'low',
      }),
      expect.objectContaining({
        activity_type: 'Intervention Plan',
        intervention_action: 'micro_reteach',
        retest_timing: 'immediate',
        follow_up_relation: 'isomorphic',
      }),
    ]);

    const summary = localProgressSubmissionSummary(progress);
    expect(summary).toEqual({
      checkedPracticeAttempts: 1,
      checkedPracticePasses: 0,
      reviewCandidates: 1,
      selfMarkedExamAttempts: 1,
      learningActivityAttempts: 0,
      knowledgeStateUpdates: 1,
      knowledgeErrors: 1,
      knowledgeInterventions: 1,
    });

    const csv = buildLocalProgressCsv(progress, metadata);
    expect(csv.split('\n')[0]).toBe(LOCAL_PROGRESS_CSV_HEADERS.join(','));
    expect(LOCAL_PROGRESS_CSV_HEADERS.slice(0, 5)).toEqual([
      'submission_id',
      'student_name',
      'class_group',
      'reporting_period',
      'submission_timestamp',
    ]);
    expect(csv).toContain('progress_export_1,Ada Lovelace,Summer P3,Week of 2026-06-08,2026-06-12T03:00:00.000Z');
    expect(csv).toContain('"bad, answer"');
    expect(csv).toContain('micro_reteach');
  });

  it('does not count hinted Checked Practice as clean export evidence', () => {
    const progress: Partial<StoredProgress> = {
      skillCheckAttempts: [
        skillAttempt({ attemptId: 'hinted_correct', usedHint: true }),
      ],
      attempts: [],
      learningActivityAttempts: [],
    };
    const metadata = {
      submissionId: 'progress_export_hinted',
      studentName: 'Ada Lovelace',
      classGroup: 'Summer P3',
      reportingPeriod: 'Week of 2026-06-08',
      submissionTimestamp: '2026-06-12T03:00:00.000Z',
    };

    expect(localProgressSubmissionSummary(progress).checkedPracticePasses).toBe(0);

    const rows = localProgressCsvRows(progress, metadata);
    expect(rows).toEqual([
      expect.objectContaining({
        activity_type: 'Submission Summary',
        answer_result_summary: expect.stringContaining('checked_practice_passes=0'),
      }),
      expect.objectContaining({
        activity_type: 'Checked Practice',
        deterministic_pass_fail: 'fail',
        evidence_status_label: 'not_passed',
      }),
    ]);
  });

  it('exports same-item corrections as practice-only and distinct retry variants as strong evidence', () => {
    const progress: Partial<StoredProgress> = {
      skillCheckAttempts: [
        skillAttempt({ attemptId: 'wrong', course: 'p1', checkId: 'p1-quadratics-1', isCorrect: false }),
        skillAttempt({ attemptId: 'same-item-correction', course: 'p1', checkId: 'p1-quadratics-1' }),
        skillAttempt({
          attemptId: 'retry-variant',
          course: 'p1',
          checkId: 'p1-quadratics-1',
          retryVariantId: 'variant-b',
        }),
      ],
      attempts: [],
      learningActivityAttempts: [],
    };

    expect(localProgressSubmissionSummary(progress).checkedPracticePasses).toBe(1);
    const checkedRows = localProgressCsvRows(progress, '2026-07-13T00:00:00.000Z')
      .filter((row) => row.activity_type === 'Checked Practice');
    expect(checkedRows).toEqual([
      expect.objectContaining({ course: 'p1', deterministic_pass_fail: 'fail', evidence_status_label: 'not_passed' }),
      expect.objectContaining({
        course: 'p1',
        deterministic_pass_fail: 'fail',
        evidence_status_label: 'practice_only_after_prior_submission',
      }),
      expect.objectContaining({
        course: 'p1',
        deterministic_pass_fail: 'pass',
        evidence_status_label: 'checked_practice_passed',
      }),
    ]);
  });

  it('defaults missing course context to P3 in exported legacy rows', () => {
    const legacyExam = { ...examAttempt({ id: 'legacy-exam' }) };
    delete legacyExam.course;
    const rows = localProgressCsvRows({
      attempts: [legacyExam],
      skillCheckAttempts: [],
      learningActivityAttempts: [{
        id: 'legacy-learn',
        regionId: 'algebra',
      }],
    }, '2026-07-13T00:00:00.000Z');

    expect(rows.filter((row) => row.activity_type !== 'Submission Summary')).toEqual([
      expect.objectContaining({ activity_type: 'Exam Training', course: 'p3' }),
      expect.objectContaining({ activity_type: 'Learn', course: 'p3' }),
    ]);
  });
});
