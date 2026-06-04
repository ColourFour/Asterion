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
      'binomial-expansion',
      'series',
      'differentiation',
      'integration',
    ]);
    expect(getSeedTopicsForCourse('m1').map((topic) => topic.slug)).toEqual([
      'velocity-and-constant-acceleration',
      'force-and-motion',
      'friction',
      'connected-particles',
      'general-motion-in-a-straight-line',
      'momentum',
      'work-and-energy',
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

  it('fills M1 from the Blake source structure with visible draft and visual scaffolding', () => {
    const m1 = getSeedTopicsForCourse('m1');
    const expectedTemplateIds = [
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
    ];
    expect(m1.map((topic) => topic.title)).toEqual([
      'Velocity and Constant Acceleration',
      'Force and Motion',
      'Friction',
      'Connected Particles',
      'General Motion in a Straight Line',
      'Momentum',
      'Work and Energy',
    ]);
    expect(m1.flatMap((topic) => topic.fieldGuideSections.map((section) => section.title))).toEqual([
      'Displacement and velocity',
      'Acceleration',
      'Equations of constant acceleration',
      'Displacement-time graph',
      'Velocity-time graphs',
      'Graphs with discontinuities',
      'Newton\'s first law',
      'Combinations of forces',
      'Weight and motion due to gravity',
      'Normal contact force',
      'Resolving forces in horizontal and vertical directions',
      'Resolving forces at equilibrium',
      'Resolving forces not in equilibrium',
      'Friction as contact force',
      'Limit of friction',
      'Changes of direction with relation to friction',
      'Newton\'s third law',
      'Objects connected by rods',
      'Objects connected by strings',
      'Velocity as derivative of displacement',
      'Acceleration as derivative of velocity',
      'Displacement as integral of velocity',
      'Velocity as integral of acceleration',
      'Momentum definition',
      'Collisions and conservation of momentum',
      'Work done by force',
      'Kinetic energy',
      'Gravitational potential energy',
      'Work energy principle',
      'Conservation of energy',
      'Power',
    ]);
    for (const topic of m1) {
      expect(topic.reviewStatus).toContain('needs syllabus-contract review');
      expect(topic.visualRequirements?.length).toBeGreaterThan(0);
      expect(topic.genericPracticePrompts?.every((prompt) => prompt.includes('Draft/generated practice'))).toBe(true);
      for (const section of topic.fieldGuideSections) {
        expect(section.visualRequirements?.length).toBeGreaterThan(0);
        expect(section.practicePrompts?.every((prompt) => prompt.includes('Draft/generated practice'))).toBe(true);
      }
    }
    const visualTemplates = m1.flatMap((topic) => topic.fieldGuideSections.flatMap((section) => section.visualTemplates ?? []));
    expect(new Set(visualTemplates.map((template) => template.id))).toEqual(new Set(expectedTemplateIds));
    for (const template of visualTemplates) {
      expect(template.title.length).toBeGreaterThan(10);
      expect(template.explanation.length).toBeGreaterThan(30);
      expect(template.notice.length).toBeGreaterThan(30);
      expect(template.supports.length).toBeGreaterThan(0);
      expect(template.svg).toContain('<svg');
      expect(template.svg).toContain('</svg>');
    }
  });

  it('fills P1 from the uploaded content map with every requested unit and Field Guide subtopic', () => {
    const p1 = getSeedTopicsForCourse('p1');
    const expectedSubtopics = new Map([
      ['Quadratics', [
        'Solving by factoring',
        'Solving inequalities',
        'Solving by quadratic formula',
        'Discriminant',
        'Graphs of quadratic functions',
      ]],
      ['Functions and Transformations', [
        'Composite functions',
        'Inverse functions',
        'Translations',
        'Reflections',
        'Stretches',
      ]],
      ['Coordinate Geometry', [
        'Parallel and perpendicular lines',
        'Equation of a straight line',
        'Circles',
        'Points of intersection',
      ]],
      ['Circular Measure', [
        'Radians',
        'Arc length and sector area',
      ]],
      ['Trigonometry', [
        'Exact values',
        'Graphs of trigonometric functions',
        'Trigonometric equations',
        'Trigonometric identities',
      ]],
      ['Binomial Expansion', [
        'Binomial expansion',
        'More complex expansions',
      ]],
      ['Series', [
        'Arithmetic progressions',
        'Geometric progressions',
        'Infinite geometric progressions',
      ]],
      ['Differentiation', [
        'Gradient of tangent',
        'Differentiation of polynomials',
        'Chain rule',
        'Second derivative',
        'Equations of tangents and normals',
        'Stationary points',
        'Rates of change',
      ]],
      ['Integration', [
        'Basic integration',
        'Constant of integration',
        'Definite integrals',
        'Area bounded between curves',
        'Improper integrals (teacher-guided draft)',
        'Volumes of revolution (teacher-guided draft)',
      ]],
    ]);

    expect(p1.map((topic) => topic.title)).toEqual(Array.from(expectedSubtopics.keys()));

    for (const topic of p1) {
      expect(topic.reviewStatus).toContain('content-model/P1/p1-content map.pdf');
      expect(topic.reviewStatus).toContain('needs syllabus-contract review');
      expect(topic.genericPracticePrompts?.every((prompt) => prompt.includes('Draft/generated practice'))).toBe(true);
      expect(topic.fieldGuideSections.map((section) => section.title)).toEqual(expectedSubtopics.get(topic.title));
      if (topic.title === 'Integration') {
        expect(topic.practiceHook).toContain('teacher-guided draft support only');
        expect(topic.examTrainingHook).toContain('assessment-ready');
      }
      for (const section of topic.fieldGuideSections) {
        const copy = section.bullets.join(' ');
        expect(copy).toContain('Learning goal:');
        expect(copy).toContain('Key method:');
        expect(copy).toContain('Draft worked example:');
        expect(copy).toContain('Common mistake:');
        expect(copy).toContain('Quick takeaway:');
        expect(section.practicePrompts?.length).toBeGreaterThanOrEqual(1);
        expect(section.practicePrompts?.every((prompt) => prompt.includes('Draft/generated practice'))).toBe(true);
      }
    }
  });

  it('exposes a visible draft seed status string', () => {
    expect(DRAFT_SEED_CONTENT_LABEL).toBe('Draft seed content - needs syllabus-contract review.');
  });

  it('keeps draft seed copy free of retired game-language terms', () => {
    const copy = JSON.stringify(COURSE_SEED_TOPICS);
    const retiredTerms = [
      /\bgame\b/i,
      /\bGuardian\b/i,
      /\bXP\b/,
      /\bgold\b/i,
      /\bavatars?\b/i,
      /\branks?\b/i,
      /\blevels?\b/i,
      /\brewards?\b/i,
      /\bfantasy\b/i,
      /\bworld map\b/i,
      /\bacademy\b/i,
      /\bteacher dashboard\b/i,
      /\bclassroom\b/i,
    ];

    for (const term of retiredTerms) {
      expect(copy).not.toMatch(term);
    }
  });
});
