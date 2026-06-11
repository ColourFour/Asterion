import { describe, expect, it } from 'vitest';
import {
  AUTHORED_SKILL_CHECK_ITEMS,
  skillCheckAnswerSpecForItem,
  skillCheckCheckabilityForItem,
  skillCheckCheckabilityReport,
  skillCheckTopicMigrationSummary,
  validateSkillCheckItemContract,
  type SkillCheckItem,
} from '../src/data/skillCheckItems';
import { checkSkillCheckAnswer } from '../src/skill-checks/answerChecker';
import { SKILL_CHECK_MISTAKE_TAGS } from '../src/skill-checks/mistakeRecovery';

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

  it('requires controlled mistake tags on migrated items', () => {
    const broken: SkillCheckItem = {
      ...requireItem('sc-alg-binomial-foundation-001'),
      mistakeTags: ['coefficient error', 'made-up tag'],
    };

    expect(validateSkillCheckItemContract(broken)).toContain('unsupported mistake tag: made-up tag');
    expect(SKILL_CHECK_MISTAKE_TAGS).toEqual([
      'algebra slip',
      'wrong identity',
      'domain/range issue',
      'notation',
      'calculator',
      'method choice',
      'incomplete reasoning',
      'sign error',
      'coefficient error',
      'forgot constant',
    ]);
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
    const summary = skillCheckCheckabilityForItem(requireItem('sc-trig-reciprocal-functions-foundation-001'));

    expect(summary).toEqual({
      itemId: 'sc-trig-reciprocal-functions-foundation-001',
      regionId: 'trigonometry',
      skillId: 'p3_trig_reciprocal_double_angle',
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

  it('reports the current migrated-topic QA counts accurately', () => {
    const report = skillCheckCheckabilityReport();
    const deterministic = report.filter((item) => item.status === 'deterministically-checkable');
    const notYet = report.filter((item) => item.status === 'not-yet-checkable');
    const unsupported = report.filter((item) => item.status === 'unsupported-answer-form');

    expect(report).toHaveLength(159);
    expect(deterministic).toHaveLength(51);
    expect(notYet).toHaveLength(108);
    expect(unsupported).toHaveLength(0);
    expect(deterministic.map((item) => item.regionId)).toEqual(expect.arrayContaining([
      'algebra',
      'complex-numbers',
      'logarithmic-and-exponential-functions',
    ]));
  });

  it('keeps the three fully migrated topic QA summaries complete', () => {
    expect([
      skillCheckTopicMigrationSummary('complex-numbers'),
      skillCheckTopicMigrationSummary('logarithmic-and-exponential-functions'),
      skillCheckTopicMigrationSummary('algebra'),
    ]).toMatchObject([
      { totalChecks: 12, checkableChecks: 12, uncheckableChecks: 0, unsupportedAnswerReasons: [] },
      { totalChecks: 18, checkableChecks: 18, uncheckableChecks: 0, unsupportedAnswerReasons: [] },
      { totalChecks: 21, checkableChecks: 21, uncheckableChecks: 0, unsupportedAnswerReasons: [] },
    ]);
  });

  it('passes representative migrated checks through the deterministic answer checker', () => {
    expectAccepted('sc-alg-binomial-foundation-001', '4.0');
    expectAccepted('sc-log-graph-foundation-001', '2^5 = 32');
    expectAccepted('sc-alg-modulus-core-001', ['1', '-1/2']);
    expectAccepted('sc-log-graph-core-001', '(8, 3)');
    expectAccepted('sc-alg-binomial-core-001', '(-1/3, 1/3)');
    expectAccepted('sc-complex-cartesian-conjugate-foundation-001', '3 + 4i');
  });

  it('reports Complex Numbers as the first complete topic migration batch', () => {
    const summary = skillCheckTopicMigrationSummary('complex-numbers');

    expect(summary).toEqual({
      regionId: 'complex-numbers',
      totalChecks: 12,
      checkableChecks: 12,
      uncheckableChecks: 0,
      unsupportedAnswerReasons: [],
      answerTypes: ['complex-number', 'exact-text', 'expression-text', 'multi-value', 'numeric'],
    });
  });

  it('passes representative migrated Complex Numbers checks through the answer checker', () => {
    expectAccepted('sc-complex-cartesian-conjugate-core-001', '5');
    expectAccepted('sc-complex-cartesian-conjugate-challenge-001', '3.0');
    expectAccepted('sc-complex-modulus-argument-foundation-001', '5');
    expectAccepted('sc-complex-modulus-argument-core-001', '3pi/4');
    expectAccepted('sc-complex-modulus-argument-challenge-001', 'sqrt3+i');
    expectAccepted('sc-complex-locus-foundation-001', 'circle with centre 2+0i and radius 3');
    expectAccepted('sc-complex-locus-core-001', 'x=-1');
    expectAccepted('sc-complex-locus-challenge-001', 'half-line from 1+0i at angle pi/4 excluding 1+0i');
    expectAccepted('sc-complex-roots-foundation-001', '3');
    expectAccepted('sc-complex-roots-core-001', '2pi/3');
    expectAccepted('sc-complex-roots-challenge-001', '-2i, 2i');
  });

  it('reports Logarithmic and Exponential Functions as the second complete topic migration batch', () => {
    const summary = skillCheckTopicMigrationSummary('logarithmic-and-exponential-functions');

    expect(summary).toEqual({
      regionId: 'logarithmic-and-exponential-functions',
      totalChecks: 18,
      checkableChecks: 18,
      uncheckableChecks: 0,
      unsupportedAnswerReasons: [],
      answerTypes: ['coordinate', 'exact-text', 'expression-text', 'multi-value', 'numeric'],
    });
  });

  it('passes representative migrated Logarithmic and Exponential Functions checks through the answer checker', () => {
    expectAccepted('sc-log-graph-challenge-001', 'range all real y, domain x>0');
    expectAccepted('sc-log-laws-foundation-001', 'ln(x*5), ln(5x)');
    expectAccepted('sc-log-laws-core-001', 'ln(x^2)-ln(x+1)=ln(x^2/(x+1)), 2lnx=ln(x^2)');
    expectAccepted('sc-log-laws-challenge-001', 'log laws split products not sums');
    expectAccepted('sc-log-natural-core-001', 'ln4/3');
    expectAccepted('sc-log-natural-challenge-001', 'divide by 2, take natural logs, subtract 1');
    expectAccepted('sc-log-domain-foundation-001', 'x>2');
    expectAccepted('sc-log-domain-core-001', '6');
    expectAccepted('sc-log-domain-challenge-001', 'domain, combine, solve, reject');
    expectAccepted('sc-log-exponential-core-001', 'x>=3');
    expectAccepted('sc-log-exponential-challenge-001', 'x<ln4/2');
    expectAccepted('sc-log-linearisation-core-001', '(3, 2)');
  });

  it('reports Algebra as the third complete topic migration batch', () => {
    const summary = skillCheckTopicMigrationSummary('algebra');

    expect(summary).toEqual({
      regionId: 'algebra',
      totalChecks: 21,
      checkableChecks: 21,
      uncheckableChecks: 0,
      unsupportedAnswerReasons: [],
      answerTypes: ['coordinate', 'exact-text', 'expression-text', 'interval', 'multi-value', 'numeric'],
    });
  });

  it('passes representative migrated Algebra checks through the answer checker', () => {
    expectAccepted('sc-alg-modulus-foundation-001', ['2', '-8/3']);
    expectAccepted('sc-alg-modulus-challenge-001', 'x>1 or x<-1/2');
    expectAccepted('sc-alg-polynomial-division-foundation-001', 'divide-leading, multiply-back, subtract, continue');
    expectAccepted('sc-alg-polynomial-division-core-001', 'x^2+5x+9, 23');
    expectAccepted('sc-alg-polynomial-division-challenge-001', 'x^2-x+3, 4');
    expectAccepted('sc-alg-remainder-factor-foundation-001', '-2');
    expectAccepted('sc-alg-remainder-factor-core-001', '4.25');
    expectAccepted('sc-alg-remainder-factor-challenge-001', '(0, -7)');
    expectAccepted('sc-alg-partial-fractions-foundation-001', 'B/(x+1)+A/(x-2)');
    expectAccepted('sc-alg-partial-fractions-core-001', 'A/x+B/(x-1)+C/(x-1)^2');
    expectAccepted('sc-alg-partial-fractions-challenge-001', 'A/(x+1)+(Bx+C)/(x^2+2), A/(x-2)+B/(x+1), A/x+B/(x-1)+C/(x-1)^2');
    expectAccepted('sc-alg-binomial-challenge-001', '-72');
    expectAccepted('sc-alg-structure-first-bridge-foundation-001', 'u=x^2+2x');
    expectAccepted('sc-alg-structure-first-bridge-core-001', 'x+2, x!=3');
    expectAccepted('sc-alg-structure-first-bridge-challenge-001', '1, -4, -1');
    expectAccepted('sc-alg-discriminant-root-conditions-foundation-001', 'D=b^2-4ac');
    expectAccepted('sc-alg-discriminant-root-conditions-core-001', 'two equal real roots');
    expectAccepted('sc-alg-discriminant-root-conditions-challenge-001', '6, -6');
  });

  it('accepts audited brittleness variants for fully migrated topics', () => {
    expectAccepted('sc-complex-cartesian-conjugate-foundation-001', '4i + 3');
    expectAccepted('sc-complex-cartesian-conjugate-foundation-001', '3 + 4j');
    expectAccepted('sc-complex-modulus-argument-core-001', '0.75pi');
    expectAccepted('sc-complex-modulus-argument-challenge-001', 'sqrt(3)+i');
    expectAccepted('sc-complex-modulus-argument-challenge-001', 'sqrt3+j');
    expectAccepted('sc-complex-locus-foundation-001', 'circle centered at (2,0) with radius 3');
    expectAccepted('sc-complex-locus-core-001', 'vertical line x=-1');
    expectAccepted('sc-complex-locus-challenge-001', 'ray from 1+0i at angle pi/4 not including 1+0i');
    expectAccepted('sc-complex-roots-challenge-001', '2j, -2j');
    expectAccepted('sc-log-graph-foundation-001', '32 = 2^5');
    expectAccepted('sc-log-natural-foundation-001', 'ln(7)/2');
    expectAccepted('sc-log-natural-core-001', 'ln(4)/3');
    expectAccepted('sc-log-exponential-challenge-001', 'x<ln(4)/2');
    expectAccepted('sc-alg-polynomial-division-core-001', 'quotient x^2+5x+9, remainder 23');
    expectAccepted('sc-alg-polynomial-division-challenge-001', 'quotient x^2-x+3, remainder 4');
    expectAccepted('sc-alg-structure-first-bridge-core-001', 'x!=3, x+2');
    expectAccepted('sc-alg-remainder-factor-challenge-001', 'a=0, b=-7');
    expectAccepted('sc-alg-binomial-core-001', 'x > -1/3 and x < 1/3');
  });
});
