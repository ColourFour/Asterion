import {
  P1_REPAIR_LOCK_MESSAGE,
  P1_REPAIR_MODULES,
  type P1RepairModuleDefinition,
  type P1RepairModuleStatus,
  type P1RepairSkillTag,
} from '../data/p1RepairLane';

export type P1RepairAttemptPhase = 'FAST_QUESTION' | 'MINI_CHECK';

export interface P1RepairAttemptRecord {
  question_id: string;
  phase: P1RepairAttemptPhase;
  is_correct: boolean;
  attempted_at: string;
  attempt_number: number;
}

export interface P1RepairModuleState {
  module_id: string;
  status: P1RepairModuleStatus;
  fast_question_accuracy: number;
  mini_check_passed: boolean;
  attempt_history: P1RepairAttemptRecord[];
  weak_skill_tags: P1RepairSkillTag[];
}

export interface P1RepairUnlockStatus {
  p3_access_unlocked: boolean;
  completed_module_count: number;
  required_module_count: number;
  first_attempt_mini_check_correct_count: number;
  required_first_attempt_mini_check_correct_count: number;
  locked_message?: typeof P1_REPAIR_LOCK_MESSAGE;
}

export function initialP1RepairModuleState(module: P1RepairModuleDefinition): P1RepairModuleState {
  return {
    module_id: module.module_id,
    status: 'LOCKED',
    fast_question_accuracy: 0,
    mini_check_passed: false,
    attempt_history: [],
    weak_skill_tags: module.weak_skill_tags,
  };
}

export function initialP1RepairLaneState(
  modules: P1RepairModuleDefinition[] = P1_REPAIR_MODULES,
): P1RepairModuleState[] {
  return modules.map((module) => ({
    ...initialP1RepairModuleState(module),
    status: 'IN_PROGRESS',
  }));
}

export function hasMiniCheckPassWithinRetry(state: Pick<P1RepairModuleState, 'attempt_history'>): boolean {
  return state.attempt_history.some((attempt) => (
    attempt.phase === 'MINI_CHECK'
    && attempt.is_correct
    && attempt.attempt_number <= 2
  ));
}

export function isP1RepairModuleComplete(
  state: Pick<P1RepairModuleState, 'fast_question_accuracy' | 'mini_check_passed' | 'attempt_history'>,
): boolean {
  return state.fast_question_accuracy >= 70
    && state.mini_check_passed
    && hasMiniCheckPassWithinRetry(state);
}

export function normalizeP1RepairModuleState(
  state: P1RepairModuleState,
): P1RepairModuleState {
  return {
    ...state,
    status: isP1RepairModuleComplete(state) ? 'COMPLETE' : state.status === 'COMPLETE' ? 'IN_PROGRESS' : state.status,
  };
}

export function wasMiniCheckFirstAttemptCorrect(state: Pick<P1RepairModuleState, 'attempt_history'>): boolean {
  return state.attempt_history.some((attempt) => (
    attempt.phase === 'MINI_CHECK'
    && attempt.attempt_number === 1
    && attempt.is_correct
  ));
}

export function p1RepairUnlockStatus(
  states: P1RepairModuleState[],
  modules: P1RepairModuleDefinition[] = P1_REPAIR_MODULES,
): P1RepairUnlockStatus {
  const moduleIds = new Set(modules.map((module) => module.module_id));
  const normalizedStates = states
    .filter((state) => moduleIds.has(state.module_id))
    .map(normalizeP1RepairModuleState);
  const completed_module_count = normalizedStates.filter(isP1RepairModuleComplete).length;
  const first_attempt_mini_check_correct_count = normalizedStates.filter(wasMiniCheckFirstAttemptCorrect).length;
  const required_module_count = modules.length;
  const required_first_attempt_mini_check_correct_count = 3;
  const p3_access_unlocked = completed_module_count === required_module_count
    && first_attempt_mini_check_correct_count >= required_first_attempt_mini_check_correct_count;

  return {
    p3_access_unlocked,
    completed_module_count,
    required_module_count,
    first_attempt_mini_check_correct_count,
    required_first_attempt_mini_check_correct_count,
    ...(p3_access_unlocked ? {} : { locked_message: P1_REPAIR_LOCK_MESSAGE }),
  };
}

export const P1_REPAIR_EXAMPLE_COMPLETION_STATE: P1RepairModuleState[] = [
  {
    module_id: 'p1-repair-algebra-manipulation',
    status: 'COMPLETE',
    fast_question_accuracy: 88,
    mini_check_passed: true,
    attempt_history: [
      {
        question_id: 'p1-alg-mini-01',
        phase: 'MINI_CHECK',
        is_correct: true,
        attempted_at: '2026-06-18T09:20:00.000Z',
        attempt_number: 1,
      },
    ],
    weak_skill_tags: ['ALGEBRA_MANIPULATION'],
  },
  {
    module_id: 'p1-repair-equation-solving',
    status: 'COMPLETE',
    fast_question_accuracy: 71,
    mini_check_passed: true,
    attempt_history: [
      {
        question_id: 'p1-eq-mini-01',
        phase: 'MINI_CHECK',
        is_correct: false,
        attempted_at: '2026-06-18T09:30:00.000Z',
        attempt_number: 1,
      },
      {
        question_id: 'p1-eq-mini-01',
        phase: 'MINI_CHECK',
        is_correct: true,
        attempted_at: '2026-06-18T09:32:00.000Z',
        attempt_number: 2,
      },
    ],
    weak_skill_tags: ['EQUATION_SOLVING'],
  },
  {
    module_id: 'p1-repair-trig-basics',
    status: 'COMPLETE',
    fast_question_accuracy: 86,
    mini_check_passed: true,
    attempt_history: [
      {
        question_id: 'p1-trig-mini-01',
        phase: 'MINI_CHECK',
        is_correct: true,
        attempted_at: '2026-06-18T09:41:00.000Z',
        attempt_number: 1,
      },
    ],
    weak_skill_tags: ['TRIG_BASIC'],
  },
  {
    module_id: 'p1-repair-differentiation-basics',
    status: 'COMPLETE',
    fast_question_accuracy: 100,
    mini_check_passed: true,
    attempt_history: [
      {
        question_id: 'p1-diff-mini-01',
        phase: 'MINI_CHECK',
        is_correct: true,
        attempted_at: '2026-06-18T09:52:00.000Z',
        attempt_number: 1,
      },
    ],
    weak_skill_tags: ['DIFFERENTIATION_BASIC'],
  },
  {
    module_id: 'p1-repair-integration-basics',
    status: 'COMPLETE',
    fast_question_accuracy: 86,
    mini_check_passed: true,
    attempt_history: [
      {
        question_id: 'p1-int-mini-01',
        phase: 'MINI_CHECK',
        is_correct: false,
        attempted_at: '2026-06-18T10:04:00.000Z',
        attempt_number: 1,
      },
      {
        question_id: 'p1-int-mini-01',
        phase: 'MINI_CHECK',
        is_correct: true,
        attempted_at: '2026-06-18T10:06:00.000Z',
        attempt_number: 2,
      },
    ],
    weak_skill_tags: ['INTEGRATION_BASIC'],
  },
];
