import { describe, expect, it } from 'vitest';
import { P1_REPAIR_LOCK_MESSAGE, P1_REPAIR_MODULES, P1_REPAIR_SKILL_TAGS } from '../src/data/p1RepairLane';
import {
  initialP1RepairLaneState,
  isP1RepairModuleComplete,
  p1RepairUnlockStatus,
  P1_REPAIR_EXAMPLE_COMPLETION_STATE,
  type P1RepairModuleState,
} from '../src/lib/p1RepairLane';

function completeState(module_id: string, firstAttemptMiniCheckCorrect: boolean): P1RepairModuleState {
  return {
    module_id,
    status: 'COMPLETE',
    fast_question_accuracy: 70,
    mini_check_passed: true,
    attempt_history: firstAttemptMiniCheckCorrect
      ? [
        {
          question_id: `${module_id}-mini`,
          phase: 'MINI_CHECK',
          is_correct: true,
          attempted_at: '2026-06-18T09:20:00.000Z',
          attempt_number: 1,
        },
      ]
      : [
        {
          question_id: `${module_id}-mini`,
          phase: 'MINI_CHECK',
          is_correct: false,
          attempted_at: '2026-06-18T09:20:00.000Z',
          attempt_number: 1,
        },
        {
          question_id: `${module_id}-mini`,
          phase: 'MINI_CHECK',
          is_correct: true,
          attempted_at: '2026-06-18T09:21:00.000Z',
          attempt_number: 2,
        },
      ],
    weak_skill_tags: [],
  };
}

describe('P1 Repair Lane contract', () => {
  it('defines five isolated repair modules with required tags and question structure', () => {
    expect(P1_REPAIR_MODULES.map((module) => module.title)).toEqual([
      'Algebra Manipulation',
      'Equation Solving',
      'Trigonometry Basics',
      'Differentiation Basics',
      'Integration Basics',
    ]);
    expect(P1_REPAIR_MODULES.map((module) => module.skill_tag)).toEqual([...P1_REPAIR_SKILL_TAGS]);
    expect(P1_REPAIR_MODULES.every((module) => module.learn_refresh_minutes === '10-20')).toBe(true);
    expect(P1_REPAIR_MODULES.every((module) => module.learn_refresh.length >= 3)).toBe(true);
    expect(P1_REPAIR_MODULES.every((module) => module.fast_questions.length >= 5 && module.fast_questions.length <= 10)).toBe(true);
    expect(P1_REPAIR_MODULES.every((module) => module.fast_questions.every((question) => question.correction.length > 0))).toBe(true);
    expect(P1_REPAIR_MODULES.every((module) => module.mini_check.correction.length > 0)).toBe(true);
  });

  it('creates a triggered repair lane with every module in progress', () => {
    expect(initialP1RepairLaneState().map((state) => state.status)).toEqual([
      'IN_PROGRESS',
      'IN_PROGRESS',
      'IN_PROGRESS',
      'IN_PROGRESS',
      'IN_PROGRESS',
    ]);
  });

  it('requires 70 percent fast-question accuracy and a mini-check pass within one retry', () => {
    const moduleId = P1_REPAIR_MODULES[0].module_id;
    const tooLow = completeState(moduleId, true);
    tooLow.fast_question_accuracy = 69;
    expect(isP1RepairModuleComplete(tooLow)).toBe(false);

    const thirdAttemptPass = completeState(moduleId, false);
    thirdAttemptPass.attempt_history = [
      ...thirdAttemptPass.attempt_history.filter((attempt) => attempt.attempt_number === 1),
      {
        question_id: `${moduleId}-mini`,
        phase: 'MINI_CHECK',
        is_correct: true,
        attempted_at: '2026-06-18T09:22:00.000Z',
        attempt_number: 3,
      },
    ];
    expect(isP1RepairModuleComplete(thirdAttemptPass)).toBe(false);
    expect(isP1RepairModuleComplete(completeState(moduleId, false))).toBe(true);
  });

  it('keeps P3 locked until all modules are complete and 3 mini-checks were first-attempt correct', () => {
    const twoFirstAttempt = P1_REPAIR_MODULES.map((module, index) => completeState(module.module_id, index < 2));
    expect(p1RepairUnlockStatus(twoFirstAttempt)).toEqual({
      p3_access_unlocked: false,
      completed_module_count: 5,
      required_module_count: 5,
      first_attempt_mini_check_correct_count: 2,
      required_first_attempt_mini_check_correct_count: 3,
      locked_message: P1_REPAIR_LOCK_MESSAGE,
    });

    expect(p1RepairUnlockStatus(P1_REPAIR_EXAMPLE_COMPLETION_STATE)).toEqual({
      p3_access_unlocked: true,
      completed_module_count: 5,
      required_module_count: 5,
      first_attempt_mini_check_correct_count: 3,
      required_first_attempt_mini_check_correct_count: 3,
    });
  });
});
