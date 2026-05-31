import { describe, expect, it } from 'vitest';
import {
  COURSE_SEED_TOPICS,
  DRAFT_SEED_CONTENT_LABEL,
  getSeedTopicsForCourse,
} from '../data/courseSeedContent';

describe('draft course seed content', () => {
  it('seeds first-pass topic maps for P1, M1, and S1 only', () => {
    expect(getSeedTopicsForCourse('p1').map((topic) => topic.slug)).toEqual([
      'quadratics',
      'functions',
      'coordinate-geometry',
      'circular-measure',
      'trigonometry',
      'series',
      'differentiation',
      'integration',
    ]);
    expect(getSeedTopicsForCourse('m1').map((topic) => topic.slug)).toEqual([
      'forces-equilibrium',
      'kinematics',
      'momentum',
      'newtons-laws',
      'energy-work-power',
    ]);
    expect(getSeedTopicsForCourse('s1').map((topic) => topic.slug)).toEqual([
      'data-representation',
      'permutations-combinations',
      'probability',
      'discrete-random-variables',
      'normal-distribution',
    ]);
    expect(getSeedTopicsForCourse('p3')).toEqual([]);
  });

  it('keeps every seed topic usable as a static study page outline', () => {
    for (const topic of COURSE_SEED_TOPICS) {
      expect(topic.id).toMatch(new RegExp(`^${topic.courseId}-`));
      expect(topic.syllabusRef).toMatch(/^9709 (P1|M1|S1) \d+\.\d+$/);
      expect(topic.description.length).toBeGreaterThan(40);
      expect(topic.formulas.length).toBeGreaterThan(0);
      expect(topic.studentGoals.length).toBeGreaterThanOrEqual(3);
      expect(topic.keyIdeas.length).toBeGreaterThanOrEqual(3);
      expect(topic.workedMethod.length).toBeGreaterThanOrEqual(3);
      expect(topic.commonMistakes.length).toBeGreaterThanOrEqual(3);
      expect(topic.selfChecks.length).toBeGreaterThanOrEqual(3);
      expect(topic.examStyle.length).toBeGreaterThanOrEqual(2);
      expect(topic.fieldGuideSections.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('exposes a visible draft seed status string', () => {
    expect(DRAFT_SEED_CONTENT_LABEL).toBe('Draft seed content - needs syllabus-contract review.');
  });
});
