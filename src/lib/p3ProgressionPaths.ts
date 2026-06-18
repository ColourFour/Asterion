import type { P3DiagnosticReadinessLevel, P3DiagnosticReport, P3DiagnosticUnlockPermissions } from '../data/p3DiagnosticGate';
import { P3_ALLOWED_REGION_IDS, type P3RegionId } from './p3SkillContract';
import type { P3ProgressionPathId, P3ProgressionStudentState, P3PathStatus, P3PathUnitCompletion } from '../types';

export type P3PathAssignmentMode = 'forced' | 'choice' | 'recommended';

export type P3PathUiDescriptor =
  | 'Minimum Survival Path In Progress'
  | 'A/A* Path In Progress'
  | 'Path Complete - Ready for Final Mock Certification';

export type P3PathRequirementCode =
  | 'learn_path_incomplete'
  | 'checked_practice_incomplete'
  | 'unit_exam_exposure_missing'
  | 'weekly_submission_missing'
  | 'weekly_submission_multi_unit_evidence_missing'
  | 'final_mixed_paper_missing'
  | 'topic_exam_training_incomplete'
  | 'error_log_incomplete'
  | 'redo_cycles_incomplete'
  | 'full_mocks_incomplete';

export interface P3ProgressionPathDefinition {
  id: P3ProgressionPathId;
  label: 'Minimum Survival Path' | 'A/A* Path';
  purpose: string;
  requiredActions: string[];
  completionRequirementCodes: P3PathRequirementCode[];
  completionLabel: P3PathUiDescriptor;
  rules: {
    requiresAllUnitsLearnComplete: boolean;
    requiresAllUnitsCheckedPracticeComplete: boolean;
    minWrittenExamQuestionsPerUnit: number;
    weeklySubmissionsRequired: number;
    requiresMultiUnitWeeklySubmissionEvidence: boolean;
    minFinalMixedPaperDurationMinutes?: number;
    requiresAllExamStrips?: boolean;
    requiresErrorLogForEveryMiss?: boolean;
    requiresCompletedRedoCycles?: boolean;
    minRedoDelayHours?: number;
    minFullMocks?: number;
    minFullMockDurationMinutes?: number;
  };
}

export interface P3PathAssignment {
  assigned_path: P3ProgressionPathId;
  mode: P3PathAssignmentMode;
  allowed_paths: P3ProgressionPathId[];
  recommended_path: P3ProgressionPathId;
}

export interface P3PathCompletionEvaluation {
  assigned_path: P3ProgressionPathId;
  path_status: P3PathStatus;
  complete: boolean;
  ui_descriptor: P3PathUiDescriptor;
  satisfied: P3PathRequirementCode[];
  unmet: P3PathRequirementCode[];
  certification_blocked: boolean;
}

export interface P3ControllerState {
  readiness_level: P3DiagnosticReadinessLevel;
  assigned_path: P3ProgressionPathId;
  unlock_permissions: P3DiagnosticUnlockPermissions;
  completion_state: P3PathCompletionEvaluation;
  path_assignment: P3PathAssignment;
}

export interface P3PathAssignmentInput {
  readiness_level: P3DiagnosticReadinessLevel;
  selected_path?: P3ProgressionPathId;
  teacher_override_path?: P3ProgressionPathId;
}

export const P3_PROGRESSION_REQUIRED_UNIT_IDS: P3RegionId[] = [...P3_ALLOWED_REGION_IDS];

export const P3_PROGRESS_UI_DESCRIPTORS = {
  minimumInProgress: 'Minimum Survival Path In Progress',
  aStarInProgress: 'A/A* Path In Progress',
  complete: 'Path Complete - Ready for Final Mock Certification',
} as const;

export const P3_PROGRESSION_PATHS: Record<P3ProgressionPathId, P3ProgressionPathDefinition> = {
  MINIMUM_SURVIVAL: {
    id: 'MINIMUM_SURVIVAL',
    label: 'Minimum Survival Path',
    purpose: 'Compliance and baseline functional exam readiness with minimal but sufficient exposure.',
    requiredActions: [
      'Complete Learn steps for every P3 unit.',
      'Complete all checked practice questions per unit.',
      'Complete at least one written or structured-input exam question per unit.',
      'Submit one weekly progress export, screenshot, or summary showing activity across multiple units.',
      'Complete one timed mixed paper or teacher-selected mock lasting at least 45 minutes.',
    ],
    completionRequirementCodes: [
      'learn_path_incomplete',
      'checked_practice_incomplete',
      'unit_exam_exposure_missing',
      'weekly_submission_missing',
      'weekly_submission_multi_unit_evidence_missing',
      'final_mixed_paper_missing',
    ],
    completionLabel: P3_PROGRESS_UI_DESCRIPTORS.complete,
    rules: {
      requiresAllUnitsLearnComplete: true,
      requiresAllUnitsCheckedPracticeComplete: true,
      minWrittenExamQuestionsPerUnit: 1,
      weeklySubmissionsRequired: 1,
      requiresMultiUnitWeeklySubmissionEvidence: true,
      minFinalMixedPaperDurationMinutes: 45,
    },
  },
  A_STAR: {
    id: 'A_STAR',
    label: 'A/A* Path',
    purpose: 'Performance maximisation through full coverage, correction, spaced redo, and timed pressure.',
    requiredActions: [
      'Complete Learn and checked practice for every P3 unit with no skipping.',
      'Complete all topic Exam Training strips for all units.',
      'Log every incorrect or partially correct question with concept, algebra, method, misread, time, or careless classification.',
      'Redo every missed question after the spaced 48-hour window and show improvement or a corrected full solution.',
      'Complete at least two full timed Paper 3 mocks.',
    ],
    completionRequirementCodes: [
      'learn_path_incomplete',
      'checked_practice_incomplete',
      'topic_exam_training_incomplete',
      'error_log_incomplete',
      'redo_cycles_incomplete',
      'full_mocks_incomplete',
    ],
    completionLabel: P3_PROGRESS_UI_DESCRIPTORS.complete,
    rules: {
      requiresAllUnitsLearnComplete: true,
      requiresAllUnitsCheckedPracticeComplete: true,
      minWrittenExamQuestionsPerUnit: 0,
      weeklySubmissionsRequired: 0,
      requiresMultiUnitWeeklySubmissionEvidence: false,
      requiresAllExamStrips: true,
      requiresErrorLogForEveryMiss: true,
      requiresCompletedRedoCycles: true,
      minRedoDelayHours: 48,
      minFullMocks: 2,
      minFullMockDurationMinutes: 90,
    },
  },
};

function normalizeAssignmentInput(input: P3DiagnosticReadinessLevel | P3DiagnosticReport | P3PathAssignmentInput): P3PathAssignmentInput {
  if (typeof input === 'string') return { readiness_level: input };
  if ('readiness_level' in input && input.readiness_level) {
    return {
      readiness_level: input.readiness_level,
      selected_path: 'selected_path' in input ? input.selected_path : undefined,
      teacher_override_path: 'teacher_override_path' in input ? input.teacher_override_path : undefined,
    };
  }
  return { readiness_level: input.readiness_level };
}

export function assignPath(input: P3DiagnosticReadinessLevel | P3DiagnosticReport | P3PathAssignmentInput): P3PathAssignment {
  const normalized = normalizeAssignmentInput(input);
  if (normalized.readiness_level === 'FOUNDATION_RISK') {
    return {
      assigned_path: 'MINIMUM_SURVIVAL',
      mode: 'forced',
      allowed_paths: ['MINIMUM_SURVIVAL'],
      recommended_path: 'MINIMUM_SURVIVAL',
    };
  }

  if (normalized.teacher_override_path) {
    return {
      assigned_path: normalized.teacher_override_path,
      mode: 'forced',
      allowed_paths: ['MINIMUM_SURVIVAL', 'A_STAR'],
      recommended_path: normalized.teacher_override_path,
    };
  }

  if (normalized.readiness_level === 'STANDARD_ENTRY') {
    const selected = normalized.selected_path ?? 'MINIMUM_SURVIVAL';
    return {
      assigned_path: selected,
      mode: 'choice',
      allowed_paths: ['MINIMUM_SURVIVAL', 'A_STAR'],
      recommended_path: 'MINIMUM_SURVIVAL',
    };
  }

  return {
    assigned_path: normalized.selected_path ?? 'A_STAR',
    mode: 'recommended',
    allowed_paths: ['MINIMUM_SURVIVAL', 'A_STAR'],
    recommended_path: 'A_STAR',
  };
}

function units(state: P3ProgressionStudentState): P3PathUnitCompletion[] {
  return P3_PROGRESSION_REQUIRED_UNIT_IDS.map((unitId) => state.unit_completion[unitId]);
}

function allUnitsPass(state: P3ProgressionStudentState, predicate: (unit: P3PathUnitCompletion) => boolean): boolean {
  const unitRecords = units(state);
  return unitRecords.length > 0 && unitRecords.every((unit) => Boolean(unit && predicate(unit)));
}

function checkedPracticeComplete(unit: P3PathUnitCompletion): boolean {
  if (unit.checked_practice_complete) return true;
  if (typeof unit.checked_practice_required === 'number' && unit.checked_practice_required > 0) {
    return (unit.checked_practice_completed ?? 0) >= unit.checked_practice_required;
  }
  return false;
}

function examStripsComplete(unit: P3PathUnitCompletion): boolean {
  if (typeof unit.exam_strips_required === 'number' && unit.exam_strips_required > 0) {
    return unit.exam_strips_completed >= unit.exam_strips_required;
  }
  return false;
}

function isValidIsoTimestamp(value: string | undefined): boolean {
  if (!value) return false;
  return Number.isFinite(Date.parse(value));
}

function weeklySubmissionRecords(state: P3ProgressionStudentState) {
  return state.weekly_submission_records ?? [];
}

function hasWeeklySubmissionEvidence(state: P3ProgressionStudentState, requiredCount: number): boolean {
  if (requiredCount <= 0) return true;
  const validRecords = weeklySubmissionRecords(state).filter((record) => (
    (record.kind === 'csv' || record.kind === 'screenshot' || record.kind === 'form')
    && isValidIsoTimestamp(record.submitted_at)
  ));
  return validRecords.length >= requiredCount && state.weekly_submissions >= requiredCount;
}

function hasMultiUnitWeeklySubmissionEvidence(state: P3ProgressionStudentState): boolean {
  return weeklySubmissionRecords(state).some((record) => (
    isValidIsoTimestamp(record.submitted_at)
    && new Set(record.covered_unit_ids.filter((unitId) => P3_PROGRESSION_REQUIRED_UNIT_IDS.includes(unitId as P3RegionId))).size >= 2
  ));
}

function hasFinalMixedPaper(state: P3ProgressionStudentState, minDuration: number): boolean {
  return (state.mock_records ?? []).some((record) => (
    record.timed
    && (record.kind === 'mixed_paper' || record.kind === 'teacher_selected_mock')
    && record.duration_minutes >= minDuration
    && isValidIsoTimestamp(record.completed_at)
  ));
}

function hasFullMocks(state: P3ProgressionStudentState, requiredCount: number, minDuration: number): boolean {
  const fullMocks = (state.mock_records ?? []).filter((record) => (
    record.timed
    && record.kind === 'full_paper_3'
    && record.duration_minutes >= minDuration
    && isValidIsoTimestamp(record.completed_at)
  ));
  return fullMocks.length >= requiredCount && state.mock_count >= requiredCount;
}

function errorLogComplete(state: P3ProgressionStudentState): boolean {
  return state.error_log_entries >= (state.missed_question_count ?? state.error_log_entries);
}

function redoWaitHoursMet(item: P3ProgressionStudentState['redo_queue'][number], minHours: number): boolean {
  if (!item.missed_at || !item.redo_available_at || !item.redo_completed_at) return false;
  const missedAt = Date.parse(item.missed_at);
  const availableAt = Date.parse(item.redo_available_at);
  const completedAt = Date.parse(item.redo_completed_at);
  if (!Number.isFinite(missedAt) || !Number.isFinite(availableAt) || !Number.isFinite(completedAt)) return false;
  const minDelayMs = minHours * 60 * 60 * 1000;
  return availableAt - missedAt >= minDelayMs && completedAt >= availableAt;
}

function redoCyclesComplete(state: P3ProgressionStudentState, minDelayHours: number): boolean {
  if (state.error_log_entries === 0) return true;
  if (state.redo_queue.length < state.error_log_entries) return false;
  if (typeof state.missed_question_count === 'number' && state.redo_queue.length < state.missed_question_count) return false;
  const linkedRedoItems = state.redo_queue.filter((item) => item.error_log_id || item.id || item.question_id);
  if (linkedRedoItems.length < state.error_log_entries) return false;
  const completed = state.redo_queue.filter((item) => (
    (item.status === 'improved' || item.status === 'corrected_full_solution')
    && redoWaitHoursMet(item, minDelayHours)
  ));
  return completed.length >= state.error_log_entries && state.redo_queue.every((item) => item.status !== 'pending');
}

function uiDescriptor(path: P3ProgressionPathId, complete: boolean): P3PathUiDescriptor {
  if (complete) return P3_PROGRESS_UI_DESCRIPTORS.complete;
  return path === 'A_STAR' ? P3_PROGRESS_UI_DESCRIPTORS.aStarInProgress : P3_PROGRESS_UI_DESCRIPTORS.minimumInProgress;
}

export function evaluatePathCompletion(state: P3ProgressionStudentState): P3PathCompletionEvaluation {
  const definition = P3_PROGRESSION_PATHS[state.assigned_path];
  const checks: Record<P3PathRequirementCode, boolean> = {
    learn_path_incomplete: allUnitsPass(state, (unit) => unit.learn_complete),
    checked_practice_incomplete: allUnitsPass(state, checkedPracticeComplete),
    unit_exam_exposure_missing: allUnitsPass(state, (unit) => unit.exam_questions_completed >= definition.rules.minWrittenExamQuestionsPerUnit),
    weekly_submission_missing: hasWeeklySubmissionEvidence(state, definition.rules.weeklySubmissionsRequired),
    weekly_submission_multi_unit_evidence_missing: !definition.rules.requiresMultiUnitWeeklySubmissionEvidence || hasMultiUnitWeeklySubmissionEvidence(state),
    final_mixed_paper_missing: definition.rules.minFinalMixedPaperDurationMinutes === undefined
      || hasFinalMixedPaper(state, definition.rules.minFinalMixedPaperDurationMinutes),
    topic_exam_training_incomplete: !definition.rules.requiresAllExamStrips || allUnitsPass(state, examStripsComplete),
    error_log_incomplete: !definition.rules.requiresErrorLogForEveryMiss || errorLogComplete(state),
    redo_cycles_incomplete: !definition.rules.requiresCompletedRedoCycles
      || redoCyclesComplete(state, definition.rules.minRedoDelayHours ?? 0),
    full_mocks_incomplete: definition.rules.minFullMocks === undefined
      || hasFullMocks(state, definition.rules.minFullMocks, definition.rules.minFullMockDurationMinutes ?? 0),
  };
  const satisfied = definition.completionRequirementCodes.filter((code) => checks[code]);
  const unmet = definition.completionRequirementCodes.filter((code) => !checks[code]);
  const complete = unmet.length === 0;

  return {
    assigned_path: state.assigned_path,
    path_status: complete ? 'COMPLETE' : 'IN_PROGRESS',
    complete,
    ui_descriptor: uiDescriptor(state.assigned_path, complete),
    satisfied,
    unmet,
    certification_blocked: !complete,
  };
}

function controllerUnlockPermissions(
  readinessLevel: P3DiagnosticReadinessLevel,
  assignedPath: P3ProgressionPathId,
  completion: P3PathCompletionEvaluation,
): P3DiagnosticUnlockPermissions {
  if (readinessLevel === 'FOUNDATION_RISK') {
    return {
      field_guide: false,
      skill_checks: false,
      exam_training: false,
      topic_exam_strips: false,
      mocks: false,
    };
  }

  return {
    field_guide: true,
    skill_checks: true,
    exam_training: true,
    topic_exam_strips: assignedPath === 'A_STAR',
    mocks: completion.complete,
  };
}

export function evaluateP3ControllerState(
  diagnostic: P3DiagnosticReadinessLevel | P3DiagnosticReport | P3PathAssignmentInput,
  state: P3ProgressionStudentState,
): P3ControllerState {
  const readiness_level = typeof diagnostic === 'string' ? diagnostic : diagnostic.readiness_level;
  const path_assignment = assignPath(diagnostic);
  const completionState = evaluatePathCompletion({
    ...state,
    assigned_path: path_assignment.assigned_path,
  });

  return {
    readiness_level,
    assigned_path: path_assignment.assigned_path,
    unlock_permissions: controllerUnlockPermissions(readiness_level, path_assignment.assigned_path, completionState),
    completion_state: completionState,
    path_assignment,
  };
}
