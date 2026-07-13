import { describe, expect, it } from 'vitest';
import { validateCourseStudyContract } from '../src/data/courseStudyContract';
import {
  getCourseSkillContract,
  getCourseStudyContract,
  getCourseStudyTopics,
  P1_COURSE_STUDY_CONTRACT,
  P1_CURRICULUM_CONSTRAINTS,
  P1_OFFICIAL_SYLLABUS_OUTCOMES,
  P1_SKILL_CONTRACT,
  P1_STUDY_TOPICS,
} from '../src/data/p1CourseContract';

const officialTopicOrder = [
  ['1.1', 'Quadratics'],
  ['1.2', 'Functions'],
  ['1.3', 'Coordinate geometry'],
  ['1.4', 'Circular measure'],
  ['1.5', 'Trigonometry'],
  ['1.6', 'Series'],
  ['1.7', 'Differentiation'],
  ['1.8', 'Integration'],
];

describe('P1 course study contract', () => {
  it('uses the eight official v4 P1 topics in syllabus order', () => {
    expect(P1_STUDY_TOPICS.map((topic) => [topic.syllabusRef, topic.title])).toEqual(officialTopicOrder);
    expect(P1_STUDY_TOPICS.map((topic) => topic.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(P1_COURSE_STUDY_CONTRACT.syllabus).toMatchObject({
      syllabusCode: '9709',
      examYears: '2026-2027',
      version: '4',
    });
  });

  it('records the Paper 1 assessment, notation, formula and exclusion boundaries', () => {
    expect(P1_CURRICULUM_CONSTRAINTS.assessmentContext).toMatchObject({
      durationMinutes: 110,
      marks: 75,
      structuredQuestionRange: [10, 12],
      allQuestionsCompulsory: true,
      scientificCalculatorExpected: true,
    });
    expect(P1_CURRICULUM_CONSTRAINTS.notationRules.length).toBeGreaterThan(4);
    expect(P1_CURRICULUM_CONSTRAINTS.formulaScope.length).toBeGreaterThan(5);
    expect(P1_CURRICULUM_CONSTRAINTS.explicitExclusions).toEqual(expect.arrayContaining([
      expect.stringContaining('Implicit differentiation'),
      expect.stringContaining('General forms of trigonometric solutions'),
      expect.stringContaining('points of inflexion'),
    ]));
    expect(P1_COURSE_STUDY_CONTRACT.syllabus.futureCompatibilityNote).toContain('2028–2030');
  });

  it('has unique topic, slug and atomic skill identifiers', () => {
    expect(new Set(P1_STUDY_TOPICS.map((topic) => topic.id)).size).toBe(P1_STUDY_TOPICS.length);
    expect(new Set(P1_STUDY_TOPICS.map((topic) => topic.slug)).size).toBe(P1_STUDY_TOPICS.length);
    expect(new Set(P1_SKILL_CONTRACT.map((skill) => skill.id)).size).toBe(P1_SKILL_CONTRACT.length);

    for (const skill of P1_SKILL_CONTRACT) {
      expect(skill.id).toMatch(/^p1_[a-z0-9]+(?:_[a-z0-9]+)*$/);
    }
  });

  it('has valid, acyclic prerequisite references', () => {
    const skillIds = new Set(P1_SKILL_CONTRACT.map((skill) => skill.id));
    const prerequisites = new Map(P1_SKILL_CONTRACT.map((skill) => [skill.id, skill.prerequisiteSkillIds]));

    for (const skill of P1_SKILL_CONTRACT) {
      for (const prerequisiteId of skill.prerequisiteSkillIds) {
        expect(skillIds.has(prerequisiteId)).toBe(true);
        expect(prerequisiteId).not.toBe(skill.id);
      }
    }

    const visit = (skillId: string, path: Set<string>) => {
      expect(path.has(skillId), `prerequisite cycle at ${skillId}`).toBe(false);
      const nextPath = new Set(path).add(skillId);
      for (const prerequisiteId of prerequisites.get(skillId) ?? []) visit(prerequisiteId, nextPath);
    };

    for (const skillId of skillIds) visit(skillId, new Set());
  });

  it('covers every official P1 outcome with at least one public skill', () => {
    const coveredOutcomeIds = new Set(P1_SKILL_CONTRACT.flatMap((skill) => (
      skill.syllabusOutcomes.map((outcome) => outcome.split(':', 1)[0])
    )));

    expect(coveredOutcomeIds).toEqual(new Set(Object.keys(P1_OFFICIAL_SYLLABUS_OUTCOMES)));
    for (const skill of P1_SKILL_CONTRACT) {
      expect(skill.syllabusOutcomes.length).toBeGreaterThan(0);
      expect(skill.needToKnow.length).toBeGreaterThan(0);
      expect(skill.examTriggers.length).toBeGreaterThan(0);
    }
  });

  it('publishes no needs-review skills and keeps exam evidence conservative', () => {
    for (const topic of P1_STUDY_TOPICS) {
      expect(topic.routeAvailability).toEqual({
        learn: true,
        checkedPractice: true,
        examTraining: true,
        worksheet: true,
      });
    }

    for (const skill of P1_SKILL_CONTRACT) {
      expect(skill.readiness).toBe('ready');
      expect(skill.reviewStatus).toBe('reviewed');
      expect(skill.routeAvailability).toEqual({
        learn: true,
        checkedPractice: true,
        examTraining: false,
        worksheet: true,
      });
    }

    const manualSkillIds = P1_SKILL_CONTRACT
      .filter((skill) => skill.evidenceEligibility === 'manual-practice-only')
      .map((skill) => skill.id);
    expect(manualSkillIds).toEqual([
      'p1_func_inverse_graph_sketch',
      'p1_trig_graph_sketch',
      'p1_trig_identity_proofs',
      'p1_diff_curve_sketch',
    ]);
    expect(P1_SKILL_CONTRACT.filter((skill) => skill.evidenceEligibility === 'strong-checked-practice').length).toBeGreaterThan(50);
  });

  it('splits broad syllabus capabilities into independently evidenced atomic skills', () => {
    expect(P1_SKILL_CONTRACT).toHaveLength(70);

    const titlesByTopic = new Map(P1_STUDY_TOPICS.map((topic) => [
      topic.id,
      P1_SKILL_CONTRACT.filter((skill) => skill.topicId === topic.id).map((skill) => skill.title),
    ]));
    expect(titlesByTopic.get('p1-quadratics')).toEqual(expect.arrayContaining([
      'Read a vertex from completed-square form',
      'Rewrite a quadratic by completing the square',
      'Solve quadratic equations',
      'Solve quadratic inequalities by sign intervals',
    ]));
    expect(titlesByTopic.get('p1-series')).toEqual(expect.arrayContaining([
      'Find arithmetic progression terms',
      'Find finite arithmetic progression sums',
      'Find geometric progression terms and finite sums',
    ]));
    expect(titlesByTopic.get('p1-differentiation')).toEqual(expect.arrayContaining([
      'Differentiate rational powers and linear combinations',
      'Differentiate simple composites with the chain rule',
      'Find a tangent equation',
      'Find a normal gradient and equation',
    ]));
  });

  it('passes the shared contract validator and exposes course-keyed getters', () => {
    expect(validateCourseStudyContract(P1_COURSE_STUDY_CONTRACT)).toEqual({ valid: true, errors: [] });
    expect(getCourseStudyContract('p1')).toBe(P1_COURSE_STUDY_CONTRACT);
    expect(getCourseStudyTopics('p1')).toBe(P1_STUDY_TOPICS);
    expect(getCourseSkillContract('p1')).toBe(P1_SKILL_CONTRACT);
    expect(getCourseStudyContract('m1')).toBeUndefined();
    expect(getCourseStudyTopics('unknown')).toEqual([]);
    expect(getCourseSkillContract(undefined)).toEqual([]);
  });
});
