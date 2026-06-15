import { describe, expect, it } from 'vitest';
import { getLearnStepsForRegion, validateLearnSteps } from '../src/data/learnModeLessons';
import { STUDY_TOPICS } from '../src/lib/topicStudy';

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

  it('keeps similar checked questions attached where a second deterministic item exists', () => {
    const algebraSteps = getLearnStepsForRegion('algebra');
    const modulusStep = algebraSteps.find((step) => step.fieldGuideTopic.id === 'algebra_modulus_graph_equations');

    expect(modulusStep?.similarCheck?.itemId).toBe('sc-alg-modulus-core-001');
    expect(modulusStep?.nextStepLabel).toBe('Try a similar checked question');
  });
});
