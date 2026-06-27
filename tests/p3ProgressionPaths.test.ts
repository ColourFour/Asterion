import { describe, expect, it } from 'vitest';
import { P3_PROGRESSION_REQUIRED_UNIT_IDS, assignPath, evaluateP3ControllerState, evaluatePathCompletion } from '../src/lib/p3ProgressionPaths';
import type { P3PathUnitCompletion, P3ProgressionStudentState } from '../src/types';

function unit(overrides: Partial<P3PathUnitCompletion> = {}): P3PathUnitCompletion {
  return {
    learn_complete: true,
    checked_practice_complete: true,
    checked_practice_required: 3,
    checked_practice_completed: 3,
    exam_questions_completed: 1,
    exam_strips_completed: 2,
    exam_strips_required: 2,
    ...overrides,
  };
}

function allUnits(overrides: Partial<P3PathUnitCompletion> = {}): Record<string, P3PathUnitCompletion> {
  return Object.fromEntries(P3_PROGRESSION_REQUIRED_UNIT_IDS.map((unitId) => [unitId, unit(overrides)]));
}

function minimumState(overrides: Partial<P3ProgressionStudentState> = {}): P3ProgressionStudentState {
  return {
    assigned_path: 'MINIMUM_SURVIVAL',
    unit_completion: allUnits(),
    weekly_submissions: 1,
    weekly_submission_records: [
      {
        id: 'week-1',
        kind: 'csv',
        submitted_at: '2026-06-18T01:00:00.000Z',
        covered_unit_ids: P3_PROGRESSION_REQUIRED_UNIT_IDS.slice(0, 2),
      },
    ],
    error_log_entries: 0,
    redo_queue: [],
    mock_count: 1,
    mock_records: [
      {
        id: 'mixed-1',
        kind: 'mixed_paper',
        duration_minutes: 60,
        timed: true,
        completed_at: '2026-06-18T01:00:00.000Z',
      },
    ],
    path_status: 'IN_PROGRESS',
    ...overrides,
  };
}

function aStarState(overrides: Partial<P3ProgressionStudentState> = {}): P3ProgressionStudentState {
  return {
    assigned_path: 'A_STAR',
    unit_completion: allUnits(),
    weekly_submissions: 0,
    error_log_entries: 2,
    missed_question_count: 2,
    redo_queue: [
      {
        question_id: 'q1',
        error_type: 'method',
        missed_at: '2026-06-18T01:00:00.000Z',
        redo_available_at: '2026-06-20T01:00:00.000Z',
        status: 'improved',
        redo_completed_at: '2026-06-20T01:00:00.000Z',
      },
      {
        question_id: 'q2',
        error_type: 'algebra',
        missed_at: '2026-06-18T01:00:00.000Z',
        redo_available_at: '2026-06-20T01:00:00.000Z',
        status: 'corrected_full_solution',
        redo_completed_at: '2026-06-20T01:00:00.000Z',
      },
    ],
    mock_count: 2,
    mock_records: [
      {
        id: 'mock-1',
        kind: 'full_paper_3',
        duration_minutes: 90,
        timed: true,
        completed_at: '2026-06-18T01:00:00.000Z',
      },
      {
        id: 'mock-2',
        kind: 'full_paper_3',
        duration_minutes: 90,
        timed: true,
        completed_at: '2026-06-19T01:00:00.000Z',
      },
    ],
    path_status: 'IN_PROGRESS',
    ...overrides,
  };
}

describe('P3 progression path assignment', () => {
  it('forces foundation-risk students onto Minimum Survival', () => {
    expect(assignPath('FOUNDATION_RISK')).toEqual({
      assigned_path: 'MINIMUM_SURVIVAL',
      mode: 'forced',
      allowed_paths: ['MINIMUM_SURVIVAL'],
      recommended_path: 'MINIMUM_SURVIVAL',
    });
  });

  it('lets standard-entry students choose without defaulting to A/A* completion equivalence', () => {
    expect(assignPath({ readiness_level: 'STANDARD_ENTRY', selected_path: 'A_STAR' })).toEqual({
      assigned_path: 'A_STAR',
      mode: 'choice',
      allowed_paths: ['MINIMUM_SURVIVAL', 'A_STAR'],
      recommended_path: 'MINIMUM_SURVIVAL',
    });
  });

  it('recommends but does not force A/A* for high-fluency students', () => {
    expect(assignPath('HIGH_FLUENCY')).toEqual({
      assigned_path: 'A_STAR',
      mode: 'recommended',
      allowed_paths: ['MINIMUM_SURVIVAL', 'A_STAR'],
      recommended_path: 'A_STAR',
    });
    expect(assignPath({ readiness_level: 'HIGH_FLUENCY', selected_path: 'MINIMUM_SURVIVAL' }).assigned_path).toBe('MINIMUM_SURVIVAL');
  });

  it('does not allow a teacher override to bypass foundation-risk locking', () => {
    expect(assignPath({ readiness_level: 'FOUNDATION_RISK', teacher_override_path: 'A_STAR' })).toEqual({
      assigned_path: 'MINIMUM_SURVIVAL',
      mode: 'forced',
      allowed_paths: ['MINIMUM_SURVIVAL'],
      recommended_path: 'MINIMUM_SURVIVAL',
    });
  });
});

describe('P3 progression completion evaluation', () => {
  it('completes the Minimum Survival path only when every baseline requirement is present', () => {
    const evaluation = evaluatePathCompletion(minimumState());

    expect(evaluation.complete).toBe(true);
    expect(evaluation.path_status).toBe('COMPLETE');
    expect(evaluation.ui_descriptor).toBe('Checked path evidence recorded');
    expect(evaluation.unmet).toEqual([]);
  });

  it('blocks Minimum Survival completion without weekly submission and timed mixed-paper evidence', () => {
    const evaluation = evaluatePathCompletion(minimumState({
      weekly_submissions: 0,
      weekly_submission_records: [],
      mock_count: 1,
      mock_records: [
        {
          id: 'small-test',
          kind: 'mixed_paper',
          duration_minutes: 30,
          timed: true,
          completed_at: '2026-06-18T01:00:00.000Z',
        },
      ],
    }));

    expect(evaluation.complete).toBe(false);
    expect(evaluation.ui_descriptor).toBe('Minimum Survival Path In Progress');
    expect(evaluation.unmet).toEqual(expect.arrayContaining([
      'weekly_submission_missing',
      'final_mixed_paper_missing',
    ]));
  });

  it('does not treat a Minimum Survival record as A/A* completion', () => {
    const evaluation = evaluatePathCompletion(aStarState({
      unit_completion: allUnits({ exam_strips_completed: 0, exam_strips_required: 2 }),
      error_log_entries: 0,
      missed_question_count: 0,
      redo_queue: [],
      mock_count: 1,
      mock_records: [
        {
          id: 'mixed-1',
          kind: 'mixed_paper',
          duration_minutes: 60,
          timed: true,
          completed_at: '2026-06-18T01:00:00.000Z',
        },
      ],
    }));

    expect(evaluation.complete).toBe(false);
    expect(evaluation.ui_descriptor).toBe('A/A* Path In Progress');
    expect(evaluation.unmet).toEqual(expect.arrayContaining([
      'topic_exam_training_incomplete',
      'full_mocks_incomplete',
    ]));
  });

  it('blocks A/A* completion until missed questions have error logs and completed redo cycles', () => {
    const evaluation = evaluatePathCompletion(aStarState({
      error_log_entries: 1,
      missed_question_count: 2,
      redo_queue: [
        {
          question_id: 'q1',
          error_type: 'concept',
          status: 'pending',
        },
      ],
    }));

    expect(evaluation.complete).toBe(false);
    expect(evaluation.unmet).toEqual(expect.arrayContaining([
      'error_log_incomplete',
      'redo_cycles_incomplete',
    ]));
  });

  it('blocks A/A* redo credit before the 48-hour spaced retry window', () => {
    const evaluation = evaluatePathCompletion(aStarState({
      redo_queue: [
        {
          question_id: 'q1',
          error_type: 'method',
          missed_at: '2026-06-18T01:00:00.000Z',
          redo_available_at: '2026-06-20T01:00:00.000Z',
          redo_completed_at: '2026-06-19T01:00:00.000Z',
          status: 'improved',
        },
        {
          question_id: 'q2',
          error_type: 'algebra',
          missed_at: '2026-06-18T01:00:00.000Z',
          redo_available_at: '2026-06-20T01:00:00.000Z',
          redo_completed_at: '2026-06-20T01:00:00.000Z',
          status: 'corrected_full_solution',
        },
      ],
    }));

    expect(evaluation.complete).toBe(false);
    expect(evaluation.unmet).toContain('redo_cycles_incomplete');
  });

  it('completes A/A* only with all strips, redo cycles, and two full timed mocks', () => {
    const evaluation = evaluatePathCompletion(aStarState());

    expect(evaluation.complete).toBe(true);
    expect(evaluation.satisfied).toEqual(expect.arrayContaining([
      'topic_exam_training_incomplete',
      'error_log_incomplete',
      'redo_cycles_incomplete',
      'full_mocks_incomplete',
    ]));
    expect(evaluation.unmet).toEqual([]);
  });

  it('blocks Minimum Survival when weekly evidence is only a soft count', () => {
    const evaluation = evaluatePathCompletion(minimumState({
      weekly_submissions: 1,
      weekly_submission_records: [],
    }));

    expect(evaluation.complete).toBe(false);
    expect(evaluation.unmet).toEqual(expect.arrayContaining([
      'weekly_submission_missing',
      'weekly_submission_multi_unit_evidence_missing',
    ]));
  });

  it('blocks A/A* when full mocks are timed flags without completion timestamps', () => {
    const evaluation = evaluatePathCompletion(aStarState({
      mock_records: [
        {
          id: 'mock-1',
          kind: 'full_paper_3',
          duration_minutes: 90,
          timed: true,
        },
        {
          id: 'mock-2',
          kind: 'full_paper_3',
          duration_minutes: 90,
          timed: true,
        },
      ],
    }));

    expect(evaluation.complete).toBe(false);
    expect(evaluation.unmet).toContain('full_mocks_incomplete');
  });

  it('blocks A/A* when the error log has not generated one active redo queue entry per miss', () => {
    const evaluation = evaluatePathCompletion(aStarState({
      error_log_entries: 2,
      missed_question_count: 2,
      redo_queue: [
        {
          question_id: 'q1',
          error_type: 'method',
          missed_at: '2026-06-18T01:00:00.000Z',
          redo_available_at: '2026-06-20T01:00:00.000Z',
          redo_completed_at: '2026-06-20T01:00:00.000Z',
          status: 'improved',
        },
      ],
    }));

    expect(evaluation.complete).toBe(false);
    expect(evaluation.unmet).toContain('redo_cycles_incomplete');
  });

  it('allows one redo item per error log entry even when the same question is missed twice', () => {
    const evaluation = evaluatePathCompletion(aStarState({
      error_log_entries: 2,
      missed_question_count: 2,
      redo_queue: [
        {
          id: 'redo-1',
          error_log_id: 'err-1',
          question_id: 'check-a',
          error_type: 'method',
          missed_at: '2026-06-18T01:00:00.000Z',
          redo_available_at: '2026-06-20T01:00:00.000Z',
          redo_completed_at: '2026-06-20T01:00:00.000Z',
          status: 'corrected_full_solution',
        },
        {
          id: 'redo-2',
          error_log_id: 'err-2',
          question_id: 'check-a',
          error_type: 'algebra',
          missed_at: '2026-06-18T02:00:00.000Z',
          redo_available_at: '2026-06-20T02:00:00.000Z',
          redo_completed_at: '2026-06-20T02:00:00.000Z',
          status: 'improved',
        },
      ],
    }));

    expect(evaluation.unmet).not.toContain('redo_cycles_incomplete');
  });
});

describe('P3 controller stress cases', () => {
  it('keeps a high-ability weak-algebra student locked to Minimum Survival only', () => {
    const controller = evaluateP3ControllerState('FOUNDATION_RISK', aStarState());

    expect(controller.readiness_level).toBe('FOUNDATION_RISK');
    expect(controller.assigned_path).toBe('MINIMUM_SURVIVAL');
    expect(controller.path_assignment.allowed_paths).toEqual(['MINIMUM_SURVIVAL']);
    expect(controller.unlock_permissions.topic_exam_strips).toBe(false);
    expect(controller.unlock_permissions.mocks).toBe(false);
  });

  it('allows a weak but diligent student to complete Minimum Survival and unlock P3 mocks', () => {
    const controller = evaluateP3ControllerState('STANDARD_ENTRY', minimumState());

    expect(controller.assigned_path).toBe('MINIMUM_SURVIVAL');
    expect(controller.completion_state.complete).toBe(true);
    expect(controller.unlock_permissions).toEqual({
      field_guide: true,
      skill_checks: true,
      exam_training: true,
      topic_exam_strips: false,
      mocks: true,
    });
  });

  it('blocks a high-score A/A* student without redo compliance', () => {
    const controller = evaluateP3ControllerState('HIGH_FLUENCY', aStarState({
      redo_queue: [],
    }));

    expect(controller.assigned_path).toBe('A_STAR');
    expect(controller.completion_state.complete).toBe(false);
    expect(controller.completion_state.unmet).toContain('redo_cycles_incomplete');
    expect(controller.unlock_permissions.mocks).toBe(false);
  });

  it('marks a fully compliant student as A/A* complete with full mock access', () => {
    const controller = evaluateP3ControllerState('HIGH_FLUENCY', aStarState());

    expect(controller.assigned_path).toBe('A_STAR');
    expect(controller.completion_state.complete).toBe(true);
    expect(controller.unlock_permissions.topic_exam_strips).toBe(true);
    expect(controller.unlock_permissions.mocks).toBe(true);
  });
});
