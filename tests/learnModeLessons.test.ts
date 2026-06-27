import { describe, expect, it } from 'vitest';
import {
  LEARN_VISUAL_TOPIC_IDS_BY_STEP_ID,
  getLearnStepsForRegion,
  validateLearnSteps,
} from '../src/data/learnModeLessons';
import { FIELD_GUIDE_VISUALS_BY_TOPIC_ID } from '../src/data/fieldGuideTopics';
import { STUDY_TOPICS } from '../src/lib/topicStudy';
import { skillCheckAnswerSpecForItem } from '../src/data/skillCheckItems';
import { checkSkillCheckAnswer } from '../src/skill-checks/answerChecker';

describe('P3 Learn Mode lessons', () => {
  it('builds deterministic attempt-first steps for every P3 topic', () => {
    const errors = validateLearnSteps(STUDY_TOPICS.map((topic) => topic.regionId));

    expect(errors).toEqual([]);

    for (const topic of STUDY_TOPICS) {
      const steps = getLearnStepsForRegion(topic.regionId);
      expect(steps.length, topic.regionId).toBeGreaterThan(0);
      expect(steps.every((step) => step.stem.trim().length > 0), topic.regionId).toBe(true);
      expect(steps.every((step) => step.prompt.trim().length > 0), topic.regionId).toBe(true);
      expect(steps.every((step) => step.explanation.trim().length > 0), topic.regionId).toBe(true);
      expect(steps.every((step) => step.examTransfer.trim().length > 0), topic.regionId).toBe(true);
      expect(steps.every((step) => step.primaryCheck?.checkable === true), topic.regionId).toBe(true);
    }
  });

  it('keeps every Learn-mapped visual titled, captioned, and instructionally labelled', () => {
    const mappedVisualIds = new Set(Object.values(LEARN_VISUAL_TOPIC_IDS_BY_STEP_ID).flat());

    for (const visualId of mappedVisualIds) {
      const visuals = FIELD_GUIDE_VISUALS_BY_TOPIC_ID[visualId];
      expect(visuals?.length, visualId).toBeGreaterThan(0);
      for (const visual of visuals) {
        expect(visual.title.trim(), visualId).not.toEqual('');
        expect(visual.caption.trim(), visualId).not.toEqual('');
        expect(visual.testedConcept.trim(), visualId).not.toEqual('');
        expect(visual.instructionalLabels?.filter((label) => label.trim()).length, visualId).toBeGreaterThan(0);
      }
    }
  });

  it('keeps required mathematical labels on key Learn-mapped visuals', () => {
    const expectedLabelsByVisualId = new Map<string, string[]>([
      ['modulus-argument', ['|z|', 'arg z']],
      ['vectors_point_to_line_distance', ['PQ · d = 0']],
      ['integrals_definite_area_bridge', ['F(b) - F(a)']],
      ['roots', ['2π/n']],
    ]);

    for (const [visualId, expectedLabels] of expectedLabelsByVisualId) {
      const visualText = (FIELD_GUIDE_VISUALS_BY_TOPIC_ID[visualId] ?? [])
        .flatMap((visual) => [visual.title, visual.caption, visual.testedConcept, ...(visual.instructionalLabels ?? [])])
        .join(' ');

      for (const expectedLabel of expectedLabels) {
        expect(visualText, visualId).toContain(expectedLabel);
      }
    }
  });

  it('uses an explicit authored seventeen-step Algebra sequence', () => {
    const algebraSteps = getLearnStepsForRegion('algebra');

    expect(algebraSteps).toHaveLength(17);
    expect(algebraSteps.map((step) => step.id)).toEqual([
      'learn-alg-remainder-theorem-need',
      'learn-alg-factor-theorem-need',
      'learn-alg-cubic-known-factor',
      'learn-alg-polynomial-division-first-term',
      'learn-alg-cubic-full-factorisation',
      'learn-alg-quartic-quadratic-division',
      'learn-alg-non-monic-and-unknown-coefficients',
      'learn-alg-absolute-value-graph',
      'learn-alg-absolute-value-equations',
      'learn-alg-absolute-value-inequalities',
      'learn-alg-absolute-value-graph-intervals',
      'learn-alg-partial-fractions-distinct',
      'learn-alg-partial-fractions-repeated',
      'learn-alg-partial-fractions-quadratic',
      'learn-alg-binomial-expansion-terms',
      'learn-alg-binomial-validity-condition',
      'learn-alg-mixed-transfer-cancellation-trap',
    ]);
    expect(new Set(algebraSteps.map((step) => step.fieldGuideTopic.id)).size).toBeLessThan(algebraSteps.length);
  });

  it('gives every Algebra Learn step the required authored learning move parts', () => {
    for (const step of getLearnStepsForRegion('algebra')) {
      expect(step.stem.trim(), step.id).not.toEqual('');
      expect(step.prompt.trim(), step.id).not.toEqual('');
      expect(step.expectedAnswer, step.id).toBeDefined();
      expect(step.hint?.trim(), step.id).not.toEqual('');
      expect(step.explanation.trim(), step.id).not.toEqual('');
      expect(step.principle?.trim(), step.id).not.toEqual('');
      expect(step.examTransfer.trim(), step.id).not.toEqual('');
      expect(step.primaryCheck?.checkable, step.id).toBe(true);
      expect(step.similarCheck?.checkable, step.id).toBe(true);
      expect(skillCheckAnswerSpecForItem(step.primaryCheck!), step.id).toBeDefined();
      expect(skillCheckAnswerSpecForItem(step.similarCheck!), step.id).toBeDefined();
      expect(step.primaryMirrorsSkillEvidence, step.id).toBe(false);
      expect(step.similarMirrorsSkillEvidence, step.id).toBe(true);
    }
  });

  it('keeps representative Algebra Learn answers machine-checkable', () => {
    const steps = getLearnStepsForRegion('algebra');
    const answerByStep = new Map<string, string>([
      ['learn-alg-remainder-theorem-need', '2'],
      ['learn-alg-cubic-known-factor', 'x^2-x-6'],
      ['learn-alg-cubic-full-factorisation', '3, -2, 2'],
      ['learn-alg-partial-fractions-quadratic', 'A/(x+1)+(Bx+C)/(x^2+2)'],
      ['learn-alg-binomial-validity-condition', '-1/3 < x < 1/3'],
      ['learn-alg-mixed-transfer-cancellation-trap', 'x=3'],
    ]);

    for (const [stepId, submittedAnswer] of answerByStep) {
      const step = steps.find((candidate) => candidate.id === stepId);
      expect(step, stepId).toBeDefined();
      const spec = skillCheckAnswerSpecForItem(step!.primaryCheck!);
      expect(spec, stepId).toBeDefined();
      expect(checkSkillCheckAnswer({ spec: spec!, submittedAnswer }).isCorrect, stepId).toBe(true);
    }
  });

  it('uses an explicit authored seventeen-step Logarithmic and Exponential Functions sequence', () => {
    const logExpSteps = getLearnStepsForRegion('logarithmic-and-exponential-functions');

    expect(logExpSteps).toHaveLength(17);
    expect(logExpSteps.map((step) => step.id)).toEqual([
      'learn-log-exp-form-conversion',
      'learn-log-product-law',
      'learn-log-quotient-law',
      'learn-log-power-law',
      'learn-log-condense-to-solve',
      'learn-log-full-equation-solve',
      'learn-log-domain-rejection',
      'learn-log-exponential-equation',
      'learn-log-natural-e-inverse',
      'learn-log-exponential-model-parameter',
      'learn-log-linearise-exponential',
      'learn-log-linearise-power-law',
      'learn-log-power-law-domain',
      'learn-log-exponential-inequality',
      'learn-log-logarithmic-inequality',
      'learn-log-graph-asymptote-domain',
      'learn-log-mixed-exam-transfer',
    ]);
    expect(new Set(logExpSteps.map((step) => step.fieldGuideTopic.id)).size).toBeLessThan(logExpSteps.length);
  });

  it('gives every Log/Exp Learn step the required authored learning move parts', () => {
    for (const step of getLearnStepsForRegion('logarithmic-and-exponential-functions')) {
      expect(step.stem.trim(), step.id).not.toEqual('');
      expect(step.prompt.trim(), step.id).not.toEqual('');
      expect(step.expectedAnswer, step.id).toBeDefined();
      expect(step.hint?.trim(), step.id).not.toEqual('');
      expect(step.explanation.trim(), step.id).not.toEqual('');
      expect(step.principle?.trim(), step.id).not.toEqual('');
      expect(step.examTransfer.trim(), step.id).not.toEqual('');
      expect(step.primaryCheck?.checkable, step.id).toBe(true);
      expect(step.similarCheck?.checkable, step.id).toBe(true);
      expect(skillCheckAnswerSpecForItem(step.primaryCheck!), step.id).toBeDefined();
      expect(skillCheckAnswerSpecForItem(step.similarCheck!), step.id).toBeDefined();
      expect(step.primaryMirrorsSkillEvidence, step.id).toBe(false);
      expect(step.similarMirrorsSkillEvidence, step.id).toBe(true);
    }
  });

  it('keeps representative Log/Exp Learn answers machine-checkable', () => {
    const steps = getLearnStepsForRegion('logarithmic-and-exponential-functions');
    const answerByStep = new Map<string, string>([
      ['learn-log-exp-form-conversion', 'log_3(81)=4'],
      ['learn-log-product-law', 'ln(5x)'],
      ['learn-log-full-equation-solve', '6'],
      ['learn-log-domain-rejection', '-3'],
      ['learn-log-exponential-equation', 'ln20/ln3'],
      ['learn-log-exponential-model-parameter', 'ln4/2'],
      ['learn-log-linearise-exponential', '3'],
      ['learn-log-mixed-exam-transfer', '4'],
    ]);

    for (const [stepId, submittedAnswer] of answerByStep) {
      const step = steps.find((candidate) => candidate.id === stepId);
      expect(step, stepId).toBeDefined();
      const spec = skillCheckAnswerSpecForItem(step!.primaryCheck!);
      expect(spec, stepId).toBeDefined();
      expect(checkSkillCheckAnswer({ spec: spec!, submittedAnswer }).isCorrect, stepId).toBe(true);
    }
  });

  it('uses an explicit authored fourteen-step Trigonometry sequence', () => {
    const trigSteps = getLearnStepsForRegion('trigonometry');

    expect(trigSteps).toHaveLength(14);
    expect(trigSteps.map((step) => step.id)).toEqual([
      'learn-trig-identity-form-choice',
      'learn-trig-pythagorean-rewrite',
      'learn-trig-reciprocal-graphs',
      'learn-trig-reciprocal-identities-equations',
      'learn-trig-double-angle-choice',
      'learn-trig-double-angle-simplify',
      'learn-trig-identity-full-solve',
      'learn-trig-basic-equation-interval',
      'learn-trig-transformed-equation',
      'learn-trig-division-trap',
      'learn-trig-quadratic-reject',
      'learn-trig-repeated-angle-pattern',
      'learn-trig-r-form-transform',
      'learn-trig-mixed-exam-transfer',
    ]);
    expect(new Set(trigSteps.map((step) => step.fieldGuideTopic.id)).size).toBeLessThan(trigSteps.length);
  });

  it('gives every Trigonometry Learn step the required authored learning move parts', () => {
    for (const step of getLearnStepsForRegion('trigonometry')) {
      expect(step.stem.trim(), step.id).not.toEqual('');
      expect(step.prompt.trim(), step.id).not.toEqual('');
      expect(step.expectedAnswer, step.id).toBeDefined();
      expect(step.hint?.trim(), step.id).not.toEqual('');
      expect(step.explanation.trim(), step.id).not.toEqual('');
      expect(step.principle?.trim(), step.id).not.toEqual('');
      expect(step.examTransfer.trim(), step.id).not.toEqual('');
      expect(step.primaryCheck?.checkable, step.id).toBe(true);
      expect(step.similarCheck?.checkable, step.id).toBe(true);
      expect(skillCheckAnswerSpecForItem(step.primaryCheck!), step.id).toBeDefined();
      expect(skillCheckAnswerSpecForItem(step.similarCheck!), step.id).toBeDefined();
      expect(step.primaryMirrorsSkillEvidence, step.id).toBe(false);
      expect(step.similarMirrorsSkillEvidence, step.id).toBe(true);
    }
  });

  it('keeps representative Trigonometry Learn answers machine-checkable', () => {
    const steps = getLearnStepsForRegion('trigonometry');
    const answerByStep = new Map<string, string>([
      ['learn-trig-pythagorean-rewrite', 'cos^2x'],
      ['learn-trig-identity-full-solve', '7pi/4, pi/4, 5pi/4, 3pi/4'],
      ['learn-trig-basic-equation-interval', '5pi/6, pi/6'],
      ['learn-trig-division-trap', 'sin x=0'],
      ['learn-trig-mixed-exam-transfer', 'pi, 0, 5pi/6, pi/6'],
    ]);

    for (const [stepId, submittedAnswer] of answerByStep) {
      const step = steps.find((candidate) => candidate.id === stepId);
      expect(step, stepId).toBeDefined();
      const spec = skillCheckAnswerSpecForItem(step!.primaryCheck!);
      expect(spec, stepId).toBeDefined();
      expect(checkSkillCheckAnswer({ spec: spec!, submittedAnswer }).isCorrect, stepId).toBe(true);
    }
  });

  it('uses an explicit authored fifteen-step Differentiation sequence', () => {
    const differentiationSteps = getLearnStepsForRegion('differentiation');

    expect(differentiationSteps).toHaveLength(15);
    expect(differentiationSteps.map((step) => step.id)).toEqual([
      'learn-diff-rule-choice',
      'learn-diff-power-negative-fractional',
      'learn-diff-chain-inside-function',
      'learn-diff-product-structure',
      'learn-diff-quotient-order',
      'learn-diff-trig-derivative',
      'learn-diff-arctan-derivative',
      'learn-diff-exp-log-derivative',
      'learn-diff-implicit-dydx',
      'learn-diff-tangent-gradient',
      'learn-diff-normal-gradient',
      'learn-diff-stationary-condition',
      'learn-diff-classify-stationary',
      'learn-diff-increasing-decreasing',
      'learn-diff-mixed-optimization-transfer',
    ]);
    expect(new Set(differentiationSteps.map((step) => step.fieldGuideTopic.id)).size).toBeLessThan(differentiationSteps.length);
  });

  it('gives every Differentiation Learn step the required authored learning move parts', () => {
    for (const step of getLearnStepsForRegion('differentiation')) {
      expect(step.stem.trim(), step.id).not.toEqual('');
      expect(step.prompt.trim(), step.id).not.toEqual('');
      expect(step.expectedAnswer, step.id).toBeDefined();
      expect(step.hint?.trim(), step.id).not.toEqual('');
      expect(step.explanation.trim(), step.id).not.toEqual('');
      expect(step.principle?.trim(), step.id).not.toEqual('');
      expect(step.examTransfer.trim(), step.id).not.toEqual('');
      expect(step.primaryCheck?.checkable, step.id).toBe(true);
      expect(step.similarCheck?.checkable, step.id).toBe(true);
      expect(skillCheckAnswerSpecForItem(step.primaryCheck!), step.id).toBeDefined();
      expect(skillCheckAnswerSpecForItem(step.similarCheck!), step.id).toBeDefined();
      expect(step.primaryMirrorsSkillEvidence, step.id).toBe(false);
      expect(step.similarMirrorsSkillEvidence, step.id).toBe(true);
    }
  });

  it('keeps representative Differentiation Learn answers machine-checkable', () => {
    const steps = getLearnStepsForRegion('differentiation');
    const answerByStep = new Map<string, string>([
      ['learn-diff-rule-choice', 'product rule'],
      ['learn-diff-power-negative-fractional', '-2/x^3'],
      ['learn-diff-chain-inside-function', '3x-2'],
      ['learn-diff-product-structure', 'x^2cosx+2xsinx'],
      ['learn-diff-quotient-order', '(x-1)2x-(x^2+1)'],
      ['learn-diff-trig-derivative', '3cos(3x)'],
      ['learn-diff-exp-log-derivative', '2e^(2x)+3/(3x-1)'],
      ['learn-diff-implicit-dydx', '3y^2dy/dx'],
      ['learn-diff-tangent-gradient', '10'],
      ['learn-diff-normal-gradient', '-0.25'],
      ['learn-diff-stationary-condition', '3x^2-3=0'],
      ['learn-diff-classify-stationary', 'max'],
      ['learn-diff-increasing-decreasing', 'increasing'],
      ['learn-diff-mixed-optimization-transfer', '12-2x=0'],
    ]);

    for (const [stepId, submittedAnswer] of answerByStep) {
      const step = steps.find((candidate) => candidate.id === stepId);
      expect(step, stepId).toBeDefined();
      const spec = skillCheckAnswerSpecForItem(step!.primaryCheck!);
      expect(spec, stepId).toBeDefined();
      expect(checkSkillCheckAnswer({ spec: spec!, submittedAnswer }).isCorrect, stepId).toBe(true);
    }
  });

  it('uses an explicit authored fourteen-step Integration sequence', () => {
    const integrationSteps = getLearnStepsForRegion('integration');

    expect(integrationSteps).toHaveLength(14);
    expect(integrationSteps.map((step) => step.id)).toEqual([
      'learn-int-method-choice',
      'learn-int-power-negative-fractional',
      'learn-int-reverse-chain-inside',
      'learn-int-substitution-setup',
      'learn-int-substitution-limits',
      'learn-int-arctangent-form',
      'learn-int-by-parts-structure',
      'learn-int-partial-fractions-log',
      'learn-int-trig-identity-rewrite',
      'learn-int-definite-upper-minus-lower',
      'learn-int-area-between-curves',
      'learn-int-improper-limit-setup',
      'learn-int-constant-from-point',
      'learn-int-mixed-exam-transfer',
    ]);
    expect(new Set(integrationSteps.map((step) => step.fieldGuideTopic.id)).size).toBeLessThan(integrationSteps.length);
  });

  it('gives every Integration Learn step the required authored learning move parts', () => {
    for (const step of getLearnStepsForRegion('integration')) {
      expect(step.stem.trim(), step.id).not.toEqual('');
      expect(step.prompt.trim(), step.id).not.toEqual('');
      expect(step.expectedAnswer, step.id).toBeDefined();
      expect(step.hint?.trim(), step.id).not.toEqual('');
      expect(step.explanation.trim(), step.id).not.toEqual('');
      expect(step.principle?.trim(), step.id).not.toEqual('');
      expect(step.examTransfer.trim(), step.id).not.toEqual('');
      expect(step.primaryCheck?.checkable, step.id).toBe(true);
      expect(step.similarCheck?.checkable, step.id).toBe(true);
      expect(skillCheckAnswerSpecForItem(step.primaryCheck!), step.id).toBeDefined();
      expect(skillCheckAnswerSpecForItem(step.similarCheck!), step.id).toBeDefined();
      expect(step.primaryMirrorsSkillEvidence, step.id).toBe(false);
      expect(step.similarMirrorsSkillEvidence, step.id).toBe(true);
    }
  });

  it('keeps representative Integration Learn answers machine-checkable', () => {
    const steps = getLearnStepsForRegion('integration');
    const answerByStep = new Map<string, string>([
      ['learn-int-method-choice', 'integration by parts'],
      ['learn-int-power-negative-fractional', '-1/x+C'],
      ['learn-int-reverse-chain-inside', 'x^2+3'],
      ['learn-int-substitution-setup', 'u=x^2+2'],
      ['learn-int-substitution-limits', '1,2'],
      ['learn-int-by-parts-structure', 'lnx'],
      ['learn-int-partial-fractions-log', 'partial fractions'],
      ['learn-int-trig-identity-rewrite', 'sin^2x=(1-cos2x)/2'],
      ['learn-int-definite-upper-minus-lower', '10'],
      ['learn-int-area-between-curves', 'int_0^2((x+2)-x^2)dx'],
      ['learn-int-improper-limit-setup', 'limit setup'],
      ['learn-int-constant-from-point', '2'],
      ['learn-int-mixed-exam-transfer', 'int_1^2u^3du'],
    ]);

    for (const [stepId, submittedAnswer] of answerByStep) {
      const step = steps.find((candidate) => candidate.id === stepId);
      expect(step, stepId).toBeDefined();
      const spec = skillCheckAnswerSpecForItem(step!.primaryCheck!);
      expect(spec, stepId).toBeDefined();
      expect(checkSkillCheckAnswer({ spec: spec!, submittedAnswer }).isCorrect, stepId).toBe(true);
    }
  });

  it('uses an explicit authored twelve-step Differential Equations sequence', () => {
    const deSteps = getLearnStepsForRegion('differential-equations');

    expect(deSteps).toHaveLength(12);
    expect(deSteps.map((step) => step.id)).toEqual([
      'learn-de-recognize-separable',
      'learn-de-separate-variables',
      'learn-de-integrate-both-sides',
      'learn-de-initial-condition-constant',
      'learn-de-solve-explicitly',
      'learn-de-exponential-growth-decay',
      'learn-de-direct-rate-statement',
      'learn-de-combined-rate-statement',
      'learn-de-boundary-condition-after-integration',
      'learn-de-verify-proposed-solution',
      'learn-de-interpret-behavior',
      'learn-de-mixed-exam-transfer',
    ]);
    expect(new Set(deSteps.map((step) => step.fieldGuideTopic.id)).size).toBeLessThan(deSteps.length);
  });

  it('gives every Differential Equations Learn step the required authored learning move parts', () => {
    for (const step of getLearnStepsForRegion('differential-equations')) {
      expect(step.stem.trim(), step.id).not.toEqual('');
      expect(step.prompt.trim(), step.id).not.toEqual('');
      expect(step.expectedAnswer, step.id).toBeDefined();
      expect(step.hint?.trim(), step.id).not.toEqual('');
      expect(step.explanation.trim(), step.id).not.toEqual('');
      expect(step.principle?.trim(), step.id).not.toEqual('');
      expect(step.examTransfer.trim(), step.id).not.toEqual('');
      expect(step.primaryCheck?.checkable, step.id).toBe(true);
      expect(step.similarCheck?.checkable, step.id).toBe(true);
      expect(skillCheckAnswerSpecForItem(step.primaryCheck!), step.id).toBeDefined();
      expect(skillCheckAnswerSpecForItem(step.similarCheck!), step.id).toBeDefined();
      expect(step.primaryMirrorsSkillEvidence, step.id).toBe(false);
      expect(step.similarMirrorsSkillEvidence, step.id).toBe(true);
    }
  });

  it('keeps representative Differential Equations Learn answers machine-checkable', () => {
    const steps = getLearnStepsForRegion('differential-equations');
    const answerByStep = new Map<string, string>([
      ['learn-de-recognize-separable', 'yes'],
      ['learn-de-separate-variables', '(1/y) dy = x dx'],
      ['learn-de-integrate-both-sides', 'ln|y|=x^2/2+C'],
      ['learn-de-initial-condition-constant', 'ln2'],
      ['learn-de-solve-explicitly', 'y=Ae^(x^2/2)'],
      ['learn-de-exponential-growth-decay', 'y=Ae^(kx)'],
      ['learn-de-direct-rate-statement', 'dP/dt=kP'],
      ['learn-de-combined-rate-statement', 'dh/dt=4-ksqrt(h)'],
      ['learn-de-boundary-condition-after-integration', '2/9'],
      ['learn-de-verify-proposed-solution', '6e^(2x)'],
      ['learn-de-interpret-behavior', '20'],
      ['learn-de-mixed-exam-transfer', 'y=e^(x^2)'],
    ]);

    for (const [stepId, submittedAnswer] of answerByStep) {
      const step = steps.find((candidate) => candidate.id === stepId);
      expect(step, stepId).toBeDefined();
      const spec = skillCheckAnswerSpecForItem(step!.primaryCheck!);
      expect(spec, stepId).toBeDefined();
      expect(checkSkillCheckAnswer({ spec: spec!, submittedAnswer }).isCorrect, stepId).toBe(true);
    }
  });

  it('uses an explicit authored seventeen-step Complex Numbers sequence', () => {
    const complexSteps = getLearnStepsForRegion('complex-numbers');

    expect(complexSteps).toHaveLength(17);
    expect(complexSteps.map((step) => step.id)).toEqual([
      'learn-complex-real-imag-add',
      'learn-complex-multiply-i-squared',
      'learn-complex-conjugate-division',
      'learn-complex-modulus',
      'learn-complex-argument-quadrant',
      'learn-complex-cartesian-to-modarg',
      'learn-complex-modarg-to-cartesian',
      'learn-complex-polar-multiply-divide',
      'learn-complex-de-moivre-power',
      'learn-complex-roots-arguments',
      'learn-complex-exact-square-roots-cartesian',
      'learn-complex-argand-transformations',
      'learn-complex-argand-multiply-divide-effects',
      'learn-complex-modulus-locus',
      'learn-complex-argument-locus',
      'learn-complex-polynomial-conjugate-root',
      'learn-complex-mixed-exam-transfer',
    ]);
    expect(new Set(complexSteps.map((step) => step.fieldGuideTopic.id)).size).toBeLessThan(complexSteps.length);
  });

  it('gives every Complex Numbers Learn step the required authored learning move parts', () => {
    for (const step of getLearnStepsForRegion('complex-numbers')) {
      expect(step.stem.trim(), step.id).not.toEqual('');
      expect(step.prompt.trim(), step.id).not.toEqual('');
      expect(step.expectedAnswer, step.id).toBeDefined();
      expect(step.hint?.trim(), step.id).not.toEqual('');
      expect(step.explanation.trim(), step.id).not.toEqual('');
      expect(step.principle?.trim(), step.id).not.toEqual('');
      expect(step.examTransfer.trim(), step.id).not.toEqual('');
      expect(step.primaryCheck?.checkable, step.id).toBe(true);
      expect(step.similarCheck?.checkable, step.id).toBe(true);
      expect(skillCheckAnswerSpecForItem(step.primaryCheck!), step.id).toBeDefined();
      expect(skillCheckAnswerSpecForItem(step.similarCheck!), step.id).toBeDefined();
      expect(step.primaryMirrorsSkillEvidence, step.id).toBe(false);
      expect(step.similarMirrorsSkillEvidence, step.id).toBe(true);
    }
  });

  it('keeps representative Complex Numbers Learn answers machine-checkable', () => {
    const steps = getLearnStepsForRegion('complex-numbers');
    const answerByStep = new Map<string, string>([
      ['learn-complex-real-imag-add', '4-3i'],
      ['learn-complex-multiply-i-squared', '10-5i'],
      ['learn-complex-conjugate-division', '3+2i'],
      ['learn-complex-modulus', '5'],
      ['learn-complex-argument-quadrant', 'quadrant ii'],
      ['learn-complex-cartesian-to-modarg', 'sqrt2(cos(pi/4)+isin(pi/4))'],
      ['learn-complex-modarg-to-cartesian', 'sqrt3+i'],
      ['learn-complex-polar-multiply-divide', 'pi/2'],
      ['learn-complex-de-moivre-power', 'pi/2'],
      ['learn-complex-roots-arguments', '2pi/3'],
      ['learn-complex-modulus-locus', 'circle centre (2,1) radius 3'],
      ['learn-complex-argument-locus', 'ray from 1+0i at angle pi/4 excluding endpoint'],
      ['learn-complex-polynomial-conjugate-root', '-1-sqrt7i'],
      ['learn-complex-mixed-exam-transfer', '1+i'],
    ]);

    for (const [stepId, submittedAnswer] of answerByStep) {
      const step = steps.find((candidate) => candidate.id === stepId);
      expect(step, stepId).toBeDefined();
      const spec = skillCheckAnswerSpecForItem(step!.primaryCheck!);
      expect(spec, stepId).toBeDefined();
      expect(checkSkillCheckAnswer({ spec: spec!, submittedAnswer }).isCorrect, stepId).toBe(true);
    }
  });

  it('uses the existing Numerical Solution of Equations slug for authored Iteration Learn Mode', () => {
    const iterationSteps = getLearnStepsForRegion('numerical-solution-of-equations');

    expect(iterationSteps).toHaveLength(12);
    expect(iterationSteps.every((step) => step.primaryCheck?.regionId === 'numerical-solution-of-equations')).toBe(true);
  });

  it('uses an explicit authored twelve-step Iteration sequence', () => {
    const iterationSteps = getLearnStepsForRegion('numerical-solution-of-equations');

    expect(iterationSteps.map((step) => step.id)).toEqual([
      'learn-iteration-need-numerical-solution',
      'learn-iteration-rearrange-fixed-point',
      'learn-iteration-starting-value-first-iterate',
      'learn-iteration-table-continuation',
      'learn-iteration-rounding-accuracy',
      'learn-iteration-sign-change-bracket',
      'learn-iteration-graph-link',
      'learn-iteration-convergence-check',
      'learn-iteration-bad-form-recognition',
      'learn-iteration-compare-formulas',
      'learn-iteration-final-root-estimate',
      'learn-iteration-mixed-exam-transfer',
    ]);
    expect(new Set(iterationSteps.map((step) => step.fieldGuideTopic.id)).size).toBeLessThan(iterationSteps.length);
  });

  it('gives every Iteration Learn step the required authored learning move parts', () => {
    for (const step of getLearnStepsForRegion('numerical-solution-of-equations')) {
      expect(step.stem.trim(), step.id).not.toEqual('');
      expect(step.prompt.trim(), step.id).not.toEqual('');
      expect(step.expectedAnswer, step.id).toBeDefined();
      expect(step.hint?.trim(), step.id).not.toEqual('');
      expect(step.explanation.trim(), step.id).not.toEqual('');
      expect(step.principle?.trim(), step.id).not.toEqual('');
      expect(step.examTransfer.trim(), step.id).not.toEqual('');
      expect(step.primaryCheck?.checkable, step.id).toBe(true);
      expect(step.similarCheck?.checkable, step.id).toBe(true);
      expect(skillCheckAnswerSpecForItem(step.primaryCheck!), step.id).toBeDefined();
      expect(skillCheckAnswerSpecForItem(step.similarCheck!), step.id).toBeDefined();
      expect(step.primaryMirrorsSkillEvidence, step.id).toBe(false);
      expect(step.similarMirrorsSkillEvidence, step.id).toBe(true);
    }
  });

  it('keeps representative Iteration Learn answers machine-checkable', () => {
    const steps = getLearnStepsForRegion('numerical-solution-of-equations');
    const answerByStep = new Map<string, string>([
      ['learn-iteration-need-numerical-solution', 'x-axis crossing'],
      ['learn-iteration-rearrange-fixed-point', 'x=cuberoot(x+1)'],
      ['learn-iteration-starting-value-first-iterate', '2.236'],
      ['learn-iteration-table-continuation', '2.5, 2.45, 2.449'],
      ['learn-iteration-rounding-accuracy', '1.732'],
      ['learn-iteration-sign-change-bracket', 'opposite signs'],
      ['learn-iteration-graph-link', 'y=x^3 and y=2x+1'],
      ['learn-iteration-convergence-check', 'converging'],
      ['learn-iteration-bad-form-recognition', 'diverging'],
      ['learn-iteration-compare-formulas', 'formula a'],
      ['learn-iteration-final-root-estimate', '1.521'],
      ['learn-iteration-mixed-exam-transfer', '(1,2)'],
    ]);

    for (const [stepId, submittedAnswer] of answerByStep) {
      const step = steps.find((candidate) => candidate.id === stepId);
      expect(step, stepId).toBeDefined();
      const spec = skillCheckAnswerSpecForItem(step!.primaryCheck!);
      expect(spec, stepId).toBeDefined();
      expect(checkSkillCheckAnswer({ spec: spec!, submittedAnswer }).isCorrect, stepId).toBe(true);
    }
  });

  it('uses an explicit authored twelve-step Vectors sequence', () => {
    const vectorSteps = getLearnStepsForRegion('vectors');

    expect(vectorSteps).toHaveLength(12);
    expect(vectorSteps.map((step) => step.id)).toEqual([
      'learn-vectors-2d-3d-notation',
      'learn-vectors-direction-from-points',
      'learn-vectors-magnitude-unit-direction-ratios',
      'learn-vectors-midpoint-and-proof',
      'learn-vectors-line-equation',
      'learn-vectors-point-on-line',
      'learn-vectors-line-intersection',
      'learn-vectors-skew-check',
      'learn-vectors-scalar-product-perpendicular',
      'learn-vectors-foot-of-perpendicular',
      'learn-vectors-reflection-in-line',
      'learn-vectors-angle-between-lines',
    ]);
  });

  it('maps Vectors visuals only to relevant line-geometry Learn steps', () => {
    const vectorSteps = getLearnStepsForRegion('vectors');
    const visualIdsByStep = new Map(vectorSteps.map((step) => [step.id, step.visualTopicIds ?? []]));

    expect(visualIdsByStep.get('learn-vectors-2d-3d-notation')).not.toContain('vectors_intersect_parallel_skew');
    expect(visualIdsByStep.get('learn-vectors-2d-3d-notation')).not.toContain('vectors_point_to_line_distance');
    expect(visualIdsByStep.get('learn-vectors-line-intersection')).toContain('vectors_intersect_parallel_skew');
    expect(visualIdsByStep.get('learn-vectors-skew-check')).toContain('vectors_intersect_parallel_skew');
    expect(visualIdsByStep.get('learn-vectors-foot-of-perpendicular')).toContain('vectors_point_to_line_distance');
    expect(visualIdsByStep.get('learn-vectors-reflection-in-line')).toContain('vectors_point_to_line_distance');
  });

  it('gives every Vectors Learn step the required authored learning move parts', () => {
    for (const step of getLearnStepsForRegion('vectors')) {
      expect(step.stem.trim(), step.id).not.toEqual('');
      expect(step.prompt.trim(), step.id).not.toEqual('');
      expect(step.expectedAnswer, step.id).toBeDefined();
      expect(step.hint?.trim(), step.id).not.toEqual('');
      expect(step.explanation.trim(), step.id).not.toEqual('');
      expect(step.principle?.trim(), step.id).not.toEqual('');
      expect(step.examTransfer.trim(), step.id).not.toEqual('');
      expect(step.primaryCheck?.checkable, step.id).toBe(true);
      expect(step.similarCheck?.checkable, step.id).toBe(true);
      expect(skillCheckAnswerSpecForItem(step.primaryCheck!), step.id).toBeDefined();
      expect(skillCheckAnswerSpecForItem(step.similarCheck!), step.id).toBeDefined();
      expect(step.primaryMirrorsSkillEvidence, step.id).toBe(false);
      expect(step.similarMirrorsSkillEvidence, step.id).toBe(true);
    }
  });

  it('keeps representative Vectors Learn answers machine-checkable', () => {
    const steps = getLearnStepsForRegion('vectors');
    const answerByStep = new Map<string, string>([
      ['learn-vectors-direction-from-points', '(3,-2,6)'],
      ['learn-vectors-point-on-line', 'yes'],
      ['learn-vectors-line-intersection', '3,4,0'],
      ['learn-vectors-scalar-product-perpendicular', '-1'],
      ['learn-vectors-foot-of-perpendicular', '(1,0,0)'],
    ]);

    for (const [stepId, submittedAnswer] of answerByStep) {
      const step = steps.find((candidate) => candidate.id === stepId);
      expect(step, stepId).toBeDefined();
      const spec = skillCheckAnswerSpecForItem(step!.primaryCheck!);
      expect(spec, stepId).toBeDefined();
      expect(checkSkillCheckAnswer({ spec: spec!, submittedAnswer }).isCorrect, stepId).toBe(true);
    }
  });
});
