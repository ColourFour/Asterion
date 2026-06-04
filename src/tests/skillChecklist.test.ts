import { describe, expect, it } from 'vitest';
import type { FieldGuideTopic } from '../data/fieldGuideTopics';
import { getFieldGuideTopicsForRegion } from '../data/fieldGuideTopics';
import {
  AUTHORED_SKILL_CHECK_ITEMS,
  getSkillCheckItemsForCourseTopic,
  skillCheckContractForItem,
  validateSkillCheckItemContract,
} from '../data/skillCheckItems';
import { getSeedTopicsForCourse } from '../data/courseSeedContent';
import type { GeneratedPracticeItem } from '../lib/generatedPractice';
import {
  buildSkillChecklistTopicGroups,
  totalSkillChecklistItems,
} from '../lib/skillChecklist';
import { isValidP3RegionId, isValidP3SkillId, P3_ALLOWED_REGION_IDS } from '../lib/p3SkillContract';
import { checkQuickCheckAnswer } from '../lib/quickCheckAnswer';
import type { LearningActivityAttempt, QuickCheckResponse } from '../types';
import type { TeachingSnippet } from '../lib/teachingSnippets';
import { computeSkillChecklistCompletion, isSkillChecklistGuardianRegion } from '../lib/skillChecklistProgress';

const logLawsTopic: FieldGuideTopic = {
  id: 'log_laws',
  marker: 'law',
  title: 'Laws of Logarithms',
  purpose: 'Use product, quotient, and power laws without inventing false laws.',
  skillIds: ['log_laws'],
  preview: '$$ \\log(ab)=\\log a+\\log b $$',
  description: 'Log laws work because logarithms record exponents.',
  examples: [],
};

const logEquationsTopic: FieldGuideTopic = {
  id: 'log_equations_inequalities',
  marker: 'log',
  title: 'Log Equations and Inequalities',
  purpose: 'Solve with log laws, then reject values outside the original domain.',
  skillIds: ['log_equations_inequalities'],
  preview: '$$ \\ln(x-2)+\\ln(x+1)=\\ln10 $$',
  description: 'Every logarithm input must be positive.',
  examples: [],
};

function snippet(overrides: Partial<TeachingSnippet> = {}): TeachingSnippet {
  return {
    snippetId: 'snippet-log-laws',
    paperFamily: 'p3',
    topics: ['log_laws'],
    regionIds: ['logarithm-grove'],
    title: 'Log laws',
    studentGoal: 'Combine logs safely.',
    body: 'Use only valid laws.',
    steps: [],
    examMove: 'Combine logs.',
    commonTrap: 'Splitting sums.',
    reviewStatus: 'teacher_reviewed',
    source: 'teacher_authored',
    prerequisites: [],
    microSteps: [],
    commonMistakes: [],
    workedExamples: [],
    quickCheck: {
      prompt: 'Choose the valid log law.',
      answer: 'product',
      explanation: 'Products become sums.',
      topic: 'log_laws',
      skillTargetId: 'log_laws',
      answerType: 'choice',
    },
    sourceQuestionIds: [],
    sourceSkillTargetIds: [],
    relatedSkillTargetIds: ['log_laws'],
    ...overrides,
  };
}

function practice(practiceId: string, sequenceRole: GeneratedPracticeItem['sequenceRole'], topicContractId: string): GeneratedPracticeItem {
  return {
    practiceId,
    generatorFamily: `logarithms_and_exponentials.${practiceId}`,
    paperFamily: 'p3',
    topic: 'logarithms_and_exponentials',
    skillTargetId: 'p3_log_laws_equations',
    sourceSnippetId: 'snippet-log-laws',
    exampleModelId: 'snippet-log-laws-example',
    questionType: 'Logarithm equation',
    keyMethod: 'Use a valid law first.',
    examMove: 'Combine before solving.',
    snippetIds: ['snippet-log-laws'],
    regionIds: ['logarithm-grove'],
    prompt: 'Combine the logarithms.',
    answer: 'x = 4',
    workedSolution: ['Use the product law.'],
    parameters: { topic_contract_id: topicContractId },
    sequenceRole,
    verification: { status: 'pass', method: 'deterministic', verifier: 'test' },
    reviewStatus: 'teacher_reviewed',
  };
}

function learningAttempt(overrides: Partial<LearningActivityAttempt>): LearningActivityAttempt {
  return {
    id: 'learning-test',
    regionId: 'complex-harbor',
    regionName: 'Argand Atrium',
    activityType: 'quick_check',
    activityId: 'activity-test',
    topic: 'topic-test',
    prompt: 'Prompt',
    learnerResponse: 'Response',
    revealedEarly: false,
    outcome: 'got_it',
    confidence: 5,
    createdAt: '2026-05-28T00:00:00.000Z',
    completedAt: '2026-05-28T00:00:00.000Z',
    ...overrides,
  };
}

describe('Skill Checklist grouping', () => {
  it('organizes support items by Field Guide topic before solving complexity', () => {
    const groups = buildSkillChecklistTopicGroups({
      fieldGuideTopics: [logLawsTopic, logEquationsTopic],
      teachingSnippets: [
        snippet(),
        snippet({
          snippetId: 'snippet-log-equations',
          topics: ['log_equations_inequalities'],
          quickCheck: {
            prompt: 'Order the solving moves.',
            answer: 'domain, combine, solve, reject',
            explanation: 'Domain comes first.',
            topic: 'log_equations_inequalities',
            skillTargetId: 'log_equations_inequalities',
            answerType: 'ordered_cards',
          },
          relatedSkillTargetIds: ['log_equations_inequalities'],
        }),
      ],
      practiceItems: [
        practice('foundation-item', 'first_step', 'log_laws'),
        practice('core-item', 'complete_step', 'log_laws'),
        practice('challenge-item', 'guardian_prep', 'log_equations_inequalities'),
      ],
      skillCheckItems: [],
    });

    const logLaws = groups.find((group) => group.topic.id === 'log_laws')!;
    const logEquations = groups.find((group) => group.topic.id === 'log_equations_inequalities')!;

    expect(logLaws.quickCheckSnippets.map((item) => item.snippetId)).toEqual(['snippet-log-laws']);
    expect(logLaws.guidedPracticeItems.map((item) => item.practiceId)).toEqual(['foundation-item', 'core-item']);
    expect(logLaws.complexityCounts).toEqual({ foundation: 2, core: 1, challenge: 0 });
    expect(totalSkillChecklistItems(logLaws)).toBe(3);

    expect(logEquations.quickCheckSnippets.map((item) => item.snippetId)).toEqual(['snippet-log-equations']);
    expect(logEquations.guidedPracticeItems.map((item) => item.practiceId)).toEqual(['challenge-item']);
    expect(logEquations.complexityCounts).toEqual({ foundation: 0, core: 1, challenge: 1 });
    expect(totalSkillChecklistItems(logEquations)).toBe(2);
  });

  it('documents weak mappings without duplicating fallback practice across Field Guide topics', () => {
    const groups = buildSkillChecklistTopicGroups({
      fieldGuideTopics: [logLawsTopic],
      teachingSnippets: [],
      practiceItems: [practice('unmapped-item', 'first_step', 'different_topic')],
      skillCheckItems: [],
    });

    expect(groups[0].guidedPracticeItems).toEqual([]);
    expect(groups[0].fallbackReason).toContain('We do not have a reviewed guided item for Laws of Logarithms yet');
    expect(groups[0].complexityCounts).toEqual({ foundation: 0, core: 0, challenge: 0 });
  });

  it('covers every P3 Field Guide subtopic with exactly 3 authored items', () => {
    for (const regionId of P3_ALLOWED_REGION_IDS) {
      const groups = buildSkillChecklistTopicGroups({
        fieldGuideTopics: getFieldGuideTopicsForRegion(regionId),
        teachingSnippets: [],
        practiceItems: [],
      });

      expect(groups.length, regionId).toBeGreaterThan(0);
      for (const group of groups) {
        expect(group.authoredItems.length, `${regionId}:${group.topic.id}`).toBe(3);
        expect(group.authoredItems.map((item) => item.complexity).sort()).toEqual(['challenge', 'core', 'foundation']);
      }
    }
  });

  it('keeps authored item mappings on the Field Guide topic taxonomy', () => {
    const allowedTopics = new Set(P3_ALLOWED_REGION_IDS.flatMap((regionId) => (
      getFieldGuideTopicsForRegion(regionId).map((topic) => topic.id)
    )));

    for (const item of AUTHORED_SKILL_CHECK_ITEMS.filter((candidate) => candidate.paperFamily === 'p3')) {
      expect(item.fieldGuideSubtopicId).toBe(item.fieldGuideTopicId);
      expect(allowedTopics.has(item.fieldGuideTopicId), item.itemId).toBe(true);
      expect(isValidP3RegionId(item.regionId), item.itemId).toBe(true);
      expect(isValidP3SkillId(item.skillId), item.itemId).toBe(true);
      expect(item.validationMode, item.itemId).toBe('deterministic');
      expect(item.review.affectsMastery, item.itemId).toBe(false);
    }
  });

  it('keeps full M1 draft Skill Check coverage support-only and bounded', () => {
    const m1Items = AUTHORED_SKILL_CHECK_ITEMS.filter((item) => item.courseId === 'm1');
    const coveredSubtopics = new Set(m1Items.map((item) => item.fieldGuideSubtopicId));
    const visualTemplateIds = new Set(m1Items.flatMap((item) => item.sourceRefs.visualTemplateIds ?? []));
    const supportedTypes = new Set(['numeric', 'multiple_choice', 'checkbox', 'ordered_cards', 'two_value']);
    const m1Topics = getSeedTopicsForCourse('m1');
    const expectedSubtopics = new Set(m1Topics.flatMap((topic) => topic.fieldGuideSections.map((section) => section.id)));
    const expectedTopicCounts = new Map([
      ['m1-velocity-constant-acceleration', 7],
      ['m1-force-and-motion', 8],
      ['m1-friction', 6],
      ['m1-connected-particles', 6],
      ['m1-general-motion-straight-line', 6],
      ['m1-momentum', 6],
      ['m1-work-and-energy', 7],
    ]);

    expect(m1Items).toHaveLength(46);
    expect(m1Items.length).toBeGreaterThanOrEqual(45);
    expect(m1Items.length).toBeLessThanOrEqual(60);

    for (const topic of m1Topics) {
      const topicItems = getSkillCheckItemsForCourseTopic('m1', topic.id);
      expect(topicItems.length, topic.id).toBe(expectedTopicCounts.get(topic.id));
      expect(topicItems.length, topic.id).toBeGreaterThanOrEqual(5);
      expect(topicItems.length, topic.id).toBeLessThanOrEqual(12);
    }

    expect(coveredSubtopics).toEqual(expectedSubtopics);
    expect(visualTemplateIds).toEqual(new Set([
      'm1-template-displacement-time-crossing',
      'm1-template-velocity-time-area-gradient',
      'm1-template-piecewise-discontinuity',
      'm1-template-free-body-diagrams',
      'm1-template-resolving-triangle',
      'm1-template-normal-reaction-cases',
      'm1-template-friction-direction',
      'm1-template-connected-particles',
      'm1-template-calculus-motion-flow',
      'm1-template-momentum-before-after-table',
      'm1-template-work-energy-setup',
      'm1-template-energy-table',
      'm1-template-power-setup',
    ]));

    for (const item of m1Items) {
      expect(item.paperFamily, item.itemId).toBe('m1');
      expect(item.review, item.itemId).toMatchObject({
        status: 'draft_review_needed',
        sourceSkillReviewed: false,
        markEventReviewed: false,
        affectsMastery: false,
        supportOnly: true,
        evidenceEnabled: false,
      });
      expect(item.sourceRefs.courseContentSource, item.itemId).toBe('content-model/M1/m1-total.pdf');
      expect(item.sourceRefs.visualFoundationSource, item.itemId).toBe('M1_VISUAL_TEMPLATE_FOUNDATION_2026_06_03.md');
      expect(item.commonMistake?.length ?? 0, item.itemId).toBeGreaterThan(20);
      expect(supportedTypes.has(item.inputType), item.itemId).toBe(true);
    }
  });

  it('keeps P1 draft Skill Check coverage support-only for every uploaded-map subtopic', () => {
    const p1Items = AUTHORED_SKILL_CHECK_ITEMS.filter((item) => item.courseId === 'p1');
    const coveredSubtopics = new Set(p1Items.map((item) => item.fieldGuideSubtopicId));
    const p1Topics = getSeedTopicsForCourse('p1');
    const expectedSubtopics = new Set(p1Topics.flatMap((topic) => topic.fieldGuideSections.map((section) => section.id)));
    const expectedTopicCounts = new Map([
      ['p1-quadratics', 15],
      ['p1-functions-transformations', 15],
      ['p1-coordinate-geometry', 18],
      ['p1-circular-measure', 6],
      ['p1-trigonometry', 13],
      ['p1-binomial-expansion', 6],
      ['p1-series', 9],
      ['p1-differentiation', 21],
      ['p1-integration', 18],
    ]);
    const subtopicCounts = new Map<string, number>();
    for (const item of p1Items) {
      subtopicCounts.set(item.fieldGuideSubtopicId, (subtopicCounts.get(item.fieldGuideSubtopicId) ?? 0) + 1);
    }

    expect(p1Items).toHaveLength(121);
    expect(p1Items.length).toBeGreaterThanOrEqual(110);
    expect(p1Items.length).toBeLessThanOrEqual(130);
    expect(coveredSubtopics).toEqual(expectedSubtopics);

    for (const topic of p1Topics) {
      const topicItems = getSkillCheckItemsForCourseTopic('p1', topic.id);
      expect(topicItems.length, topic.id).toBe(expectedTopicCounts.get(topic.id));
      expect(topicItems.length, topic.id).toBeGreaterThanOrEqual(topic.fieldGuideSections.length * 2);
      for (const section of topic.fieldGuideSections) {
        expect(subtopicCounts.get(section.id) ?? 0, section.id).toBeGreaterThanOrEqual(2);
      }
    }

    for (const item of p1Items) {
      expect(item.paperFamily, item.itemId).toBe('p1');
      expect(item.regionId, item.itemId).toBe('p1-draft-skill-check');
      expect(item.review, item.itemId).toMatchObject({
        status: 'draft_review_needed',
        sourceSkillReviewed: false,
        markEventReviewed: false,
        affectsMastery: false,
        supportOnly: true,
        evidenceEnabled: false,
      });
      expect(item.sourceRefs.courseContentSource, item.itemId).toBe('content-model/P1/p1-content map.pdf');
      expect(item.sourceRefs.contentLabCandidateIds ?? [], item.itemId).toEqual([]);
      expect(item.commonMistake?.length ?? 0, item.itemId).toBeGreaterThan(20);
    }
  });

  it('keeps P1 Quadratics quality-pass items student-facing and fully covered', () => {
    const quadraticsItems = AUTHORED_SKILL_CHECK_ITEMS.filter((item) => (
      item.courseId === 'p1' && item.fieldGuideTopicId === 'p1-quadratics'
    ));
    const itemById = new Map(quadraticsItems.map((item) => [item.itemId, item]));
    const subtopicCounts = new Map<string, number>();
    for (const item of quadraticsItems) {
      subtopicCounts.set(item.fieldGuideSubtopicId, (subtopicCounts.get(item.fieldGuideSubtopicId) ?? 0) + 1);
    }

    expect(quadraticsItems).toHaveLength(15);
    expect(subtopicCounts).toEqual(new Map([
      ['p1-quadratics-factoring', 3],
      ['p1-quadratics-inequalities', 3],
      ['p1-quadratics-formula', 3],
      ['p1-quadratics-discriminant', 3],
      ['p1-quadratics-graphs', 3],
    ]));

    for (const item of quadraticsItems) {
      expect(item.review, item.itemId).toMatchObject({
        status: 'draft_review_needed',
        sourceSkillReviewed: false,
        markEventReviewed: false,
        affectsMastery: false,
        supportOnly: true,
        evidenceEnabled: false,
      });
      expect(['numeric', 'multiple_choice'].includes(item.inputType), item.itemId).toBe(true);
      expect(item.prompt, item.itemId).not.toMatch(/smaller root|larger root|upper endpoint|x-coordinate of the vertex|hidden code/i);
    }

    for (const itemId of [
      'p1-sc-quadratics-factoring-001',
      'p1-sc-quadratics-inequalities-001',
      'p1-sc-quadratics-formula-001',
      'p1-sc-quadratics-formula-003',
      'p1-sc-quadratics-graphs-001',
      'p1-sc-quadratics-graphs-003',
    ]) {
      expect(itemById.get(itemId), itemId).toMatchObject({
        inputType: 'multiple_choice',
        expectedOptionIds: expect.any(Array),
        options: expect.any(Array),
      });
      expect(itemById.get(itemId)?.expectedOptionIds?.length, itemId).toBe(1);
      expect(itemById.get(itemId)?.options?.length, itemId).toBeGreaterThanOrEqual(4);
    }

    expect(itemById.get('p1-sc-quadratics-factoring-002')?.prompt).toContain('efficient');
    expect(itemById.get('p1-sc-quadratics-factoring-003')?.prompt).toContain('rectangle');
    expect(itemById.get('p1-sc-quadratics-graphs-001')?.prompt).toContain('line of symmetry');
    expect(itemById.get('p1-sc-quadratics-graphs-003')?.prompt).toContain('x-intercepts');
  });

  it('keeps P1 Functions quality-pass items student-facing and fully covered', () => {
    const functionItems = AUTHORED_SKILL_CHECK_ITEMS.filter((item) => (
      item.courseId === 'p1' && item.fieldGuideTopicId === 'p1-functions-transformations'
    ));
    const itemById = new Map(functionItems.map((item) => [item.itemId, item]));
    const subtopicCounts = new Map<string, number>();
    for (const item of functionItems) {
      subtopicCounts.set(item.fieldGuideSubtopicId, (subtopicCounts.get(item.fieldGuideSubtopicId) ?? 0) + 1);
    }

    expect(functionItems).toHaveLength(15);
    expect(subtopicCounts).toEqual(new Map([
      ['p1-functions-transformations-composite-functions', 3],
      ['p1-functions-transformations-inverse-functions', 3],
      ['p1-functions-transformations-translations', 3],
      ['p1-functions-transformations-reflections', 3],
      ['p1-functions-transformations-stretches', 3],
    ]));

    for (const item of functionItems) {
      expect(item.review, item.itemId).toMatchObject({
        status: 'draft_review_needed',
        sourceSkillReviewed: false,
        markEventReviewed: false,
        affectsMastery: false,
        supportOnly: true,
        evidenceEnabled: false,
      });
      expect(['numeric', 'multiple_choice'].includes(item.inputType), item.itemId).toBe(true);
      expect(item.prompt, item.itemId).not.toMatch(/enter \$?1|enter 1|enter the vertical shift|enter the horizontal scale factor|hidden code|axis code/i);
    }

    for (const itemId of [
      'p1-sc-functions-translations-001',
      'p1-sc-functions-translations-002',
      'p1-sc-functions-translations-003',
      'p1-sc-functions-reflections-001',
      'p1-sc-functions-reflections-002',
      'p1-sc-functions-reflections-003',
      'p1-sc-functions-stretches-001',
      'p1-sc-functions-stretches-002',
      'p1-sc-functions-stretches-003',
    ]) {
      expect(itemById.get(itemId), itemId).toMatchObject({
        inputType: 'multiple_choice',
        expectedOptionIds: expect.any(Array),
        options: expect.any(Array),
      });
      expect(itemById.get(itemId)?.expectedOptionIds?.length, itemId).toBe(1);
      expect(itemById.get(itemId)?.options?.length, itemId).toBeGreaterThanOrEqual(4);
    }

    expect(itemById.get('p1-sc-functions-composite-001')?.prompt).toContain('fg(4)');
    expect(itemById.get('p1-sc-functions-composite-002')?.prompt).toContain('gf(3)');
    expect(itemById.get('p1-sc-functions-inverse-001')?.prompt).toContain('f^{-1}(8)');
    expect(itemById.get('p1-sc-functions-reflections-003')?.prompt).toContain('new point');
    expect(itemById.get('p1-sc-functions-stretches-003')?.prompt).toContain('new point');
  });

  it('keeps P1 Coordinate Geometry viability-pass items student-facing and fully covered', () => {
    const coordinateItems = AUTHORED_SKILL_CHECK_ITEMS.filter((item) => (
      item.courseId === 'p1' && item.fieldGuideTopicId === 'p1-coordinate-geometry'
    ));
    const itemById = new Map(coordinateItems.map((item) => [item.itemId, item]));
    const subtopicCounts = new Map<string, number>();
    for (const item of coordinateItems) {
      subtopicCounts.set(item.fieldGuideSubtopicId, (subtopicCounts.get(item.fieldGuideSubtopicId) ?? 0) + 1);
    }

    expect(coordinateItems).toHaveLength(18);
    expect(subtopicCounts).toEqual(new Map([
      ['p1-coordinate-geometry-parallel-perpendicular', 4],
      ['p1-coordinate-geometry-straight-line', 4],
      ['p1-coordinate-geometry-circles', 5],
      ['p1-coordinate-geometry-intersections', 5],
    ]));

    for (const item of coordinateItems) {
      expect(item.review, item.itemId).toMatchObject({
        status: 'draft_review_needed',
        sourceSkillReviewed: false,
        markEventReviewed: false,
        affectsMastery: false,
        supportOnly: true,
        evidenceEnabled: false,
      });
      expect(['numeric', 'multiple_choice'].includes(item.inputType), item.itemId).toBe(true);
      expect(item.prompt, item.itemId).not.toMatch(/in \$y=.*find \$?c|enter the radius|x-coordinate where|hidden code|axis code/i);
    }

    for (const itemId of [
      'p1-sc-coordinate-parallel-perpendicular-003',
      'p1-sc-coordinate-parallel-perpendicular-004',
      'p1-sc-coordinate-straight-line-001',
      'p1-sc-coordinate-straight-line-002',
      'p1-sc-coordinate-straight-line-004',
      'p1-sc-coordinate-circles-001',
      'p1-sc-coordinate-circles-002',
      'p1-sc-coordinate-circles-003',
      'p1-sc-coordinate-circles-004',
      'p1-sc-coordinate-circles-005',
      'p1-sc-coordinate-intersections-001',
      'p1-sc-coordinate-intersections-002',
      'p1-sc-coordinate-intersections-003',
      'p1-sc-coordinate-intersections-004',
      'p1-sc-coordinate-intersections-005',
    ]) {
      expect(itemById.get(itemId), itemId).toMatchObject({
        inputType: 'multiple_choice',
        expectedOptionIds: expect.any(Array),
        options: expect.any(Array),
      });
      expect(itemById.get(itemId)?.expectedOptionIds?.length, itemId).toBe(1);
      expect(itemById.get(itemId)?.options?.length, itemId).toBeGreaterThanOrEqual(4);
    }

    expect(itemById.get('p1-sc-coordinate-parallel-perpendicular-003')?.prompt).toContain('compares');
    expect(itemById.get('p1-sc-coordinate-parallel-perpendicular-004')?.prompt).toContain('perpendicular bisector');
    expect(itemById.get('p1-sc-coordinate-straight-line-001')?.prompt).toContain('equation of the line');
    expect(itemById.get('p1-sc-coordinate-straight-line-004')?.prompt).toContain('both requested forms');
    expect(itemById.get('p1-sc-coordinate-circles-001')?.prompt).toContain('centre and radius');
    expect(itemById.get('p1-sc-coordinate-circles-003')?.prompt).toContain('diameter');
    expect(itemById.get('p1-sc-coordinate-circles-004')?.prompt).toContain('Complete the square');
    expect(itemById.get('p1-sc-coordinate-circles-005')?.prompt).toContain('tangent');
    expect(itemById.get('p1-sc-coordinate-intersections-002')?.prompt).toContain('point where');
    expect(itemById.get('p1-sc-coordinate-intersections-003')?.prompt).toContain('circle');
    expect(itemById.get('p1-sc-coordinate-intersections-004')?.prompt).toContain('$y=3x-5$');
    expect(itemById.get('p1-sc-coordinate-intersections-005')?.prompt).toContain('intersects, touches, or misses');

    const coordinateSkillIds = new Set(coordinateItems.map((item) => item.skillId));
    expect(coordinateSkillIds.has('p1_coordinate_perpendicular_gradient')).toBe(true);
    expect(coordinateItems.some((item) => item.skillId.includes('perpendicular_bisector'))).toBe(true);
    expect(coordinateItems.some((item) => item.skillId.includes('line_equation_two_points'))).toBe(true);
    expect(coordinateItems.some((item) => item.skillId.includes('circle_from_diameter'))).toBe(true);
    expect(coordinateItems.some((item) => item.skillId.includes('expanded_circle_completing_square'))).toBe(true);
    expect(coordinateItems.some((item) => item.skillId.includes('tangent_radius_gradient'))).toBe(true);
    expect(coordinateItems.some((item) => item.skillId.includes('line_circle_intersection'))).toBe(true);
    expect(coordinateItems.some((item) => item.skillId.includes('discriminant_tangency_condition'))).toBe(true);
  });

  it('keeps the remaining P1 quality-sweep units student-facing and bounded', () => {
    const expectedSubtopicCounts = new Map([
      ['p1-circular-measure-radians', 3],
      ['p1-circular-measure-arc-sector', 3],
      ['p1-trigonometry-exact-values', 3],
      ['p1-trigonometry-graphs', 3],
      ['p1-trigonometry-equations', 4],
      ['p1-trigonometry-identities', 3],
      ['p1-binomial-expansion-basic-expansion', 3],
      ['p1-binomial-expansion-complex-expansions', 3],
      ['p1-series-arithmetic-progressions', 3],
      ['p1-series-geometric-progressions', 3],
      ['p1-series-infinite-geometric-progressions', 3],
      ['p1-differentiation-gradient-tangent', 3],
      ['p1-differentiation-polynomials', 3],
      ['p1-differentiation-chain-rule', 3],
      ['p1-differentiation-second-derivative', 3],
      ['p1-differentiation-tangents-normals', 3],
      ['p1-differentiation-stationary-points', 3],
      ['p1-differentiation-rates-change', 3],
      ['p1-integration-basic-integration', 3],
      ['p1-integration-constant-integration', 3],
      ['p1-integration-definite-integrals', 3],
      ['p1-integration-area-between-curves', 3],
      ['p1-integration-improper-integrals', 3],
      ['p1-integration-volumes-revolution', 3],
    ]);
    const sweptTopicIds = new Set([
      'p1-circular-measure',
      'p1-trigonometry',
      'p1-binomial-expansion',
      'p1-series',
      'p1-differentiation',
      'p1-integration',
    ]);
    const sweptItems = AUTHORED_SKILL_CHECK_ITEMS.filter((item) => (
      item.courseId === 'p1' && sweptTopicIds.has(item.fieldGuideTopicId)
    ));
    const subtopicCounts = new Map<string, number>();
    for (const item of sweptItems) {
      subtopicCounts.set(item.fieldGuideSubtopicId, (subtopicCounts.get(item.fieldGuideSubtopicId) ?? 0) + 1);
    }

    for (const [subtopicId, count] of expectedSubtopicCounts) {
      expect(subtopicCounts.get(subtopicId), subtopicId).toBe(count);
    }

    for (const item of sweptItems) {
      expect(item.review, item.itemId).toMatchObject({
        status: 'draft_review_needed',
        sourceSkillReviewed: false,
        markEventReviewed: false,
        affectsMastery: false,
        supportOnly: true,
        evidenceEnabled: false,
      });
      expect(['numeric', 'multiple_choice'].includes(item.inputType), item.itemId).toBe(true);
      expect(item.prompt, item.itemId).not.toMatch(/hidden code|enter exponent|larger solution|x-coordinate of the stationary point|coefficient of the first term|V=k\\pi|enter k|coefficient before|find C in|enter the radius|Enter the coefficient of \\$x\\^4/i);
    }

    for (const itemId of [
      'p1-sc-circular-radians-001',
      'p1-sc-circular-arc-sector-001',
      'p1-sc-circular-arc-sector-002',
      'p1-sc-circular-arc-sector-003',
      'p1-sc-trig-exact-values-003',
      'p1-sc-trig-equations-004',
      'p1-sc-binomial-basic-001',
      'p1-sc-binomial-basic-003',
      'p1-sc-binomial-complex-003',
      'p1-sc-series-gp-003',
      'p1-sc-diff-polynomials-001',
      'p1-sc-diff-chain-rule-001',
      'p1-sc-diff-chain-rule-002',
      'p1-sc-diff-rates-002',
      'p1-sc-integration-basic-001',
      'p1-sc-integration-basic-002',
      'p1-sc-integration-constant-001',
      'p1-sc-integration-constant-002',
      'p1-sc-integration-area-between-003',
      'p1-sc-integration-improper-003',
      'p1-sc-integration-volumes-001',
      'p1-sc-integration-volumes-002',
      'p1-sc-integration-volumes-003',
    ]) {
      const item = AUTHORED_SKILL_CHECK_ITEMS.find((candidate) => candidate.itemId === itemId);
      expect(item, itemId).toMatchObject({
        inputType: 'multiple_choice',
        expectedOptionIds: expect.any(Array),
        options: expect.any(Array),
      });
      expect(item?.expectedOptionIds?.length, itemId).toBe(1);
      expect(item?.options?.length, itemId).toBeGreaterThanOrEqual(4);
    }

    const itemById = new Map(AUTHORED_SKILL_CHECK_ITEMS.map((item) => [item.itemId, item]));
    expect(itemById.get('p1-sc-circular-arc-sector-003')?.prompt).toContain('perimeter');
    expect(itemById.get('p1-sc-trig-equations-004')?.prompt).toContain('complete reasoning');
    expect(itemById.get('p1-sc-binomial-complex-003')?.prompt).toContain('value of $r$');
    expect(itemById.get('p1-sc-series-gp-003')?.prompt).toContain('third term');
    expect(itemById.get('p1-sc-diff-rates-002')?.prompt).toContain('interpretation');
    expect(itemById.get('p1-sc-integration-area-between-003')?.prompt).toContain('$y=x^2$');
    expect(itemById.get('p1-sc-integration-improper-003')?.prompt).toContain('Teacher-guided draft only');
    expect(itemById.get('p1-sc-integration-volumes-001')?.prompt).toContain('Teacher-guided draft only');
  });

  it('keeps the first P1 temporary cleanup items on student-facing answer shapes', () => {
    const itemById = new Map(AUTHORED_SKILL_CHECK_ITEMS.map((item) => [item.itemId, item]));

    for (const itemId of [
      'p1-sc-functions-reflections-001',
      'p1-sc-trig-identities-001',
      'p1-sc-quadratics-inequalities-001',
      'p1-sc-coordinate-intersections-001',
      'p1-sc-trig-equations-001',
      'p1-sc-diff-stationary-001',
    ]) {
      expect(itemById.get(itemId), itemId).toMatchObject({
        inputType: 'multiple_choice',
        review: expect.objectContaining({
          status: 'draft_review_needed',
          supportOnly: true,
          evidenceEnabled: false,
        }),
      });
      expect(itemById.get(itemId)?.options?.length, itemId).toBeGreaterThanOrEqual(4);
      expect(itemById.get(itemId)?.expectedOptionIds?.length, itemId).toBe(1);
    }

    expect(itemById.get('p1-sc-integration-area-between-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['1/6', '\\frac{1}{6}', '$\\frac16$', '$\\frac{1}{6}$'],
      review: expect.objectContaining({
        status: 'draft_review_needed',
        supportOnly: true,
        evidenceEnabled: false,
      }),
    });

    for (const itemId of [
      'p1-sc-functions-reflections-001',
      'p1-sc-trig-identities-001',
      'p1-sc-integration-area-between-001',
      'p1-sc-quadratics-inequalities-001',
      'p1-sc-coordinate-intersections-001',
      'p1-sc-trig-equations-001',
      'p1-sc-diff-stationary-001',
    ]) {
      expect(itemById.get(itemId)?.prompt, itemId).not.toMatch(/enter \$1\$|exponent on|coefficient of the first term|x-coordinate of the stationary point|larger solution/);
    }
  });

  it('passes the authored Skill Check item contract validator with unique stable IDs', () => {
    const ids = new Set<string>();

    for (const item of AUTHORED_SKILL_CHECK_ITEMS) {
      expect(ids.has(item.itemId), item.itemId).toBe(false);
      ids.add(item.itemId);
      expect(validateSkillCheckItemContract(item), item.itemId).toEqual([]);
    }
  });

  it('validates deterministic authored input types with explicit answers', () => {
    const rendererTypes = new Set(['single_value', 'choice', 'multi_choice', 'ordered_cards', 'two_value']);

    for (const item of AUTHORED_SKILL_CHECK_ITEMS) {
      const contract = skillCheckContractForItem(item);
      let response: QuickCheckResponse;

      if (contract.answerType === 'single_value') {
        response = { value: Array.isArray(contract.expectedAnswer) ? contract.expectedAnswer[0] : contract.expectedAnswer };
      } else if (contract.answerType === 'two_value') {
        response = {
          values: Object.fromEntries((contract.fields ?? []).map((field) => [
            field.id,
            Array.isArray(field.expectedAnswer) ? field.expectedAnswer[0] : field.expectedAnswer,
          ])),
        };
      } else if (contract.answerType === 'ordered_cards') {
        response = { orderedIds: contract.expectedOrder };
      } else if (contract.answerType === 'multi_choice') {
        response = { selectedChoiceIds: contract.expectedChoices };
      } else {
        response = { selectedChoiceId: contract.expectedChoices?.[0] };
      }

      expect(rendererTypes.has(contract.answerType), item.itemId).toBe(true);
      expect(checkQuickCheckAnswer(contract, response).status, item.itemId).toBe('correct');
    }
  });

  it('pins the first content-quality pass fixes to existing Skill Check renderers', () => {
    const itemById = new Map(AUTHORED_SKILL_CHECK_ITEMS.map((item) => [item.itemId, item]));

    expect(itemById.get('sc-diff-product-rule-challenge-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: '$-1',
      review: expect.objectContaining({ affectsMastery: false }),
    });
    expect(itemById.get('sc-diff-product-rule-challenge-001')?.prompt).toContain('stationary $x$ value');

    expect(itemById.get('sc-iteration-convergence-core-001')).toMatchObject({
      inputType: 'multiple_choice',
      prompt: 'The iterates are $1.4, 1.41, 1.414, 1.4142$. Which description is safest?',
      review: expect.objectContaining({ affectsMastery: false }),
    });

    expect(itemById.get('sc-log-laws-core-001')).toMatchObject({
      inputType: 'checkbox',
      expectedOptionIds: ['power-law', 'quotient-law'],
    });
    expect(itemById.get('sc-iteration-change-sign-core-001')).toMatchObject({
      inputType: 'checkbox',
      expectedOptionIds: ['negative-positive', 'positive-negative'],
    });

    for (const itemId of [
      'sc-trig-r-form-transformations-foundation-001',
      'sc-trig-r-form-transformations-challenge-001',
      'sc-complex-modulus-argument-foundation-001',
      'sc-vectors-scalar-product-foundation-001',
      'sc-de-particular-solutions-core-001',
    ]) {
      expect(itemById.get(itemId), itemId).toMatchObject({ inputType: 'numeric' });
    }

    expect(itemById.get('sc-trig-r-form-transformations-core-001')).toMatchObject({
      inputType: 'two_value',
      fields: [
        expect.objectContaining({ id: 'cos-alpha', expectedAnswer: ['3/5', '\\frac{3}{5}'] }),
        expect.objectContaining({ id: 'sin-alpha', expectedAnswer: ['4/5', '\\frac{4}{5}'] }),
      ],
    });

    expect(itemById.get('sc-log-linearisation-foundation-001')).toMatchObject({
      inputType: 'ordered_cards',
      expectedOrder: ['take-logs', 'split-product', 'simplify-exponential', 'read-line'],
    });

    expect(itemById.get('sc-alg-binomial-foundation-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['4', '$4'],
      sourceTypes: expect.arrayContaining(['exam-bank reference']),
    });
    expect(itemById.get('sc-alg-binomial-foundation-001')?.prompt).toContain('(1-2x)^{-2}');

    expect(itemById.get('sc-alg-polynomial-division-foundation-001')).toMatchObject({
      inputType: 'ordered_cards',
      expectedOrder: ['divide-leading', 'multiply-back', 'subtract', 'continue'],
    });

    expect(itemById.get('sc-log-linearisation-challenge-001')).toMatchObject({
      inputType: 'ordered_cards',
      expectedOrder: ['take-logs', 'split-product', 'simplify-exponential', 'read-line'],
    });

    expect(itemById.get('sc-trig-reciprocal-functions-core-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['5', '$5'],
    });

    expect(itemById.get('sc-complex-roots-foundation-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['3', '$3'],
    });

    expect(itemById.get('sc-vectors-angle-between-lines-core-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['90', '$90^\\circ$', '90^\\circ'],
    });

    expect(itemById.get('sc-iteration-fixed-point-roots-foundation-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['3', '$3'],
    });

    expect(itemById.get('sc-trig-addition-formulae-challenge-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['7', '$7'],
    });

    expect(itemById.get('sc-complex-cartesian-conjugate-core-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['5', '$5'],
    });

    expect(itemById.get('sc-vectors-angle-between-lines-challenge-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['60', '$60^\\circ$', '60^\\circ'],
    });

    expect(itemById.get('sc-iteration-fixed-point-roots-challenge-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['1.732', '$1.732'],
      tolerance: 0.0005,
    });

    expect(itemById.get('sc-trig-pythagorean-identities-core-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['4/5', '\\frac{4}{5}', '$\\frac45$', '$\\frac{4}{5}$'],
    });

    expect(itemById.get('sc-complex-cartesian-conjugate-challenge-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['3', '$3'],
    });

    expect(itemById.get('sc-vectors-scalar-product-challenge-001')).toMatchObject({
      inputType: 'numeric',
      expectedAnswer: ['0', '$0^\\circ$', '0^\\circ'],
    });
  });

  it('uses authored Skill Check coverage as the Guardian Skill Check denominator in every P3 region', () => {
    for (const regionId of P3_ALLOWED_REGION_IDS) {
      const fieldGuideTopicCount = getFieldGuideTopicsForRegion(regionId).length;
      const authoredTopicCount = new Set(
        AUTHORED_SKILL_CHECK_ITEMS
          .filter((item) => item.regionId === regionId)
          .map((item) => item.fieldGuideTopicId),
      ).size;
      const completion = computeSkillChecklistCompletion({ regionId, learningActivityAttempts: [] });

      expect(isSkillChecklistGuardianRegion(regionId), regionId).toBe(true);
      expect(completion.applies, regionId).toBe(true);
      expect(completion.requiredCount, regionId).toBe(authoredTopicCount);
      expect(completion.requiredCount, regionId).toBe(fieldGuideTopicCount);
      expect(completion.requiredCount, regionId).toBeGreaterThan(1);
      expect(completion.authoredItemCount, regionId).toBe(fieldGuideTopicCount * 3);
      expect(completion.completedCount, regionId).toBe(0);
    }
  });

  it('counts only authored Skill Check quick-check evidence toward Guardian Skill Check completion', () => {
    const regionId = 'complex-harbor';
    const [firstTopic] = getFieldGuideTopicsForRegion(regionId);
    const authoredItem = AUTHORED_SKILL_CHECK_ITEMS.find((item) => item.regionId === regionId && item.fieldGuideTopicId === firstTopic.id)!;

    const supportOnly = computeSkillChecklistCompletion({
      regionId,
      learningActivityAttempts: [
        learningAttempt({
          activityType: 'warm_up',
          activityId: `warm-up-${firstTopic.id}`,
          topic: firstTopic.id,
        }),
        learningAttempt({
          activityId: 'p3-complex-locus-argument-001-qc',
          topic: 'complex_numbers',
          skillTargetId: 'p3_complex_argand_loci_regions',
        }),
      ],
    });
    const authored = computeSkillChecklistCompletion({
      regionId,
      learningActivityAttempts: [
        learningAttempt({
          activityId: authoredItem.itemId,
          topic: firstTopic.id,
          skillTargetId: authoredItem.skillId,
        }),
      ],
    });

    expect(supportOnly.topicProgress.find((topic) => topic.topicId === firstTopic.id)?.completed).toBe(false);
    expect(supportOnly.completedCount).toBe(0);
    expect(authored.topicProgress.find((topic) => topic.topicId === firstTopic.id)?.completed).toBe(true);
    expect(authored.completedCount).toBe(1);
  });

  it('does not leak raw Content Lab candidates into authored student-runtime Skill Check items', () => {
    for (const item of AUTHORED_SKILL_CHECK_ITEMS) {
      expect(item.sourceTypes, item.itemId).not.toContain('runtime-safe candidate');
      expect(item.sourceRefs.contentLabCandidateIds ?? [], item.itemId).toEqual([]);
    }
  });
});
