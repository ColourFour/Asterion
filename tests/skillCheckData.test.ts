import { describe, expect, it } from 'vitest';
import {
  AUTHORED_SKILL_CHECK_ITEMS,
  skillCheckAnswerSpecForItem,
  skillCheckCheckabilityForItem,
  skillCheckCheckabilityReport,
  validateSkillCheckItemContract,
  type SkillCheckItem,
} from '../src/data/skillCheckItems';
import { checkSkillCheckAnswer } from '../src/skill-checks/answerChecker';

const itemById = new Map(AUTHORED_SKILL_CHECK_ITEMS.map((item) => [item.itemId, item]));

function requireItem(itemId: string): SkillCheckItem {
  const item = itemById.get(itemId);
  if (!item) throw new Error(`Missing test fixture Skill Check item ${itemId}`);
  return item;
}

function expectAccepted(itemId: string, submittedAnswer: string | string[]) {
  const item = requireItem(itemId);
  const spec = skillCheckAnswerSpecForItem(item);
  expect(spec, `${itemId} should expose a checker spec`).toBeDefined();
  const result = checkSkillCheckAnswer({ spec: spec!, submittedAnswer });
  expect(result).toMatchObject({
    isCorrect: true,
    unsupported: false,
  });
}

describe('P3 Skill Check machine-checkable data', () => {
  it('keeps all current authored Skill Check records contract-valid', () => {
    const failures = AUTHORED_SKILL_CHECK_ITEMS.flatMap((item) => (
      validateSkillCheckItemContract(item).map((error) => `${item.itemId}: ${error}`)
    ));

    expect(failures).toEqual([]);
  });

  it('requires machine-check fields on checkable items', () => {
    const broken: SkillCheckItem = {
      ...requireItem('sc-alg-binomial-foundation-001'),
      acceptedAnswers: undefined,
    };

    expect(validateSkillCheckItemContract(broken)).toContain('checkable item missing acceptedAnswers');
  });

  it('requires an explicit reason on items marked uncheckable', () => {
    const broken: SkillCheckItem = {
      ...requireItem('sc-alg-binomial-foundation-001'),
      checkable: false,
      answerType: undefined,
      acceptedAnswers: undefined,
      unsupportedAnswerReason: undefined,
    };

    expect(validateSkillCheckItemContract(broken)).toContain('uncheckable item missing unsupportedAnswerReason');
  });

  it('labels not-yet-migrated items instead of treating them as checkable', () => {
    const summary = skillCheckCheckabilityForItem(requireItem('sc-alg-modulus-foundation-001'));

    expect(summary).toEqual({
      itemId: 'sc-alg-modulus-foundation-001',
      regionId: 'algebra',
      skillId: 'p3_alg_modulus_cases',
      status: 'not-yet-checkable',
      reason: 'Not yet migrated to Phase 3 machine-checkable answer fields.',
    });
  });

  it('reports a partial migration rather than full coverage', () => {
    const report = skillCheckCheckabilityReport();
    const deterministic = report.filter((item) => item.status === 'deterministically-checkable');
    const notYet = report.filter((item) => item.status === 'not-yet-checkable');

    expect(deterministic.map((item) => item.itemId)).toEqual(expect.arrayContaining([
      'sc-alg-modulus-core-001',
      'sc-alg-binomial-foundation-001',
      'sc-alg-binomial-core-001',
      'sc-log-graph-foundation-001',
      'sc-log-graph-core-001',
      'sc-complex-cartesian-conjugate-foundation-001',
    ]));
    expect(notYet.length).toBeGreaterThan(0);
  });

  it('passes representative migrated checks through the deterministic answer checker', () => {
    expectAccepted('sc-alg-binomial-foundation-001', '4.0');
    expectAccepted('sc-log-graph-foundation-001', '2^5 = 32');
    expectAccepted('sc-alg-modulus-core-001', ['1', '-1/2']);
    expectAccepted('sc-log-graph-core-001', '(8, 3)');
    expectAccepted('sc-alg-binomial-core-001', '(-1/3, 1/3)');
    expectAccepted('sc-complex-cartesian-conjugate-foundation-001', '3 + 4i');
  });
});
