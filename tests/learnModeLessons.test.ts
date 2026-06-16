import { describe, expect, it } from 'vitest';
import { getLearnStepsForRegion, validateLearnSteps } from '../src/data/learnModeLessons';
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

  it('uses an explicit authored eleven-step Algebra sequence', () => {
    const algebraSteps = getLearnStepsForRegion('algebra');

    expect(algebraSteps).toHaveLength(11);
    expect(algebraSteps.map((step) => step.id)).toEqual([
      'learn-alg-remainder-theorem-need',
      'learn-alg-factor-theorem-need',
      'learn-alg-cubic-known-factor',
      'learn-alg-polynomial-division-first-term',
      'learn-alg-cubic-full-factorisation',
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

  it('uses an explicit authored thirteen-step Logarithmic and Exponential Functions sequence', () => {
    const logExpSteps = getLearnStepsForRegion('logarithmic-and-exponential-functions');

    expect(logExpSteps).toHaveLength(13);
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

  it('uses an explicit authored eleven-step Trigonometry sequence', () => {
    const trigSteps = getLearnStepsForRegion('trigonometry');

    expect(trigSteps).toHaveLength(11);
    expect(trigSteps.map((step) => step.id)).toEqual([
      'learn-trig-identity-form-choice',
      'learn-trig-pythagorean-rewrite',
      'learn-trig-double-angle-choice',
      'learn-trig-double-angle-simplify',
      'learn-trig-identity-full-solve',
      'learn-trig-basic-equation-interval',
      'learn-trig-transformed-equation',
      'learn-trig-division-trap',
      'learn-trig-quadratic-reject',
      'learn-trig-repeated-angle-pattern',
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

  it('uses an explicit authored nine-step Vectors sequence', () => {
    const vectorSteps = getLearnStepsForRegion('vectors');

    expect(vectorSteps).toHaveLength(9);
    expect(vectorSteps.map((step) => step.id)).toEqual([
      'learn-vectors-direction-from-points',
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
