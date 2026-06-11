import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  checkSkillCheckAnswer,
  type SkillCheckAnswerCheckResult,
  type SkillCheckAnswerSpec,
} from '../src/skill-checks/answerChecker';
import { ANSWER_CHECKER_PARITY_CASES } from './fixtures/answerCheckerParityFixtures';

interface StaticSkillCheckTestHooks {
  checkSubmittedSkillAnswer: (
    spec: SkillCheckAnswerSpec,
    submittedAnswer: string,
  ) => SkillCheckAnswerCheckResult;
}

function runtimeHooks(): StaticSkillCheckTestHooks {
  const hooks = (
    window as typeof window & {
      __ASTERION_SKILL_CHECK_TEST_HOOKS__?: StaticSkillCheckTestHooks;
    }
  ).__ASTERION_SKILL_CHECK_TEST_HOOKS__;
  if (!hooks) throw new Error('Static Skill Check test hooks were not exposed.');
  return hooks;
}

describe('Skill Check checker parity fixtures', () => {
  beforeAll(() => {
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');
    window.eval(staticClientSource);
  });

  it.each(ANSWER_CHECKER_PARITY_CASES)('matches the TypeScript checker fixture: $name', ({ spec, submittedAnswer, expected }) => {
    expect(checkSkillCheckAnswer({ spec, submittedAnswer })).toEqual(expected);
  });

  it.each(ANSWER_CHECKER_PARITY_CASES)('matches the static runtime checker fixture: $name', ({ spec, submittedAnswer, expected }) => {
    expect(runtimeHooks().checkSubmittedSkillAnswer(spec, submittedAnswer)).toEqual(expected);
  });
});
