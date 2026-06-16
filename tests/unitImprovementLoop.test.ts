import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  UNIT_IMPROVEMENT_FIXES,
  UNIT_IMPROVEMENT_TOPIC_PRIORITY,
  normalizeUnitImprovementTopicToken,
} from '../src/data/unitImprovementAgents';
import {
  buildStudentFrustrationReport,
  renderStudentFrustrationMarkdown,
  type UnitImprovementTopicSnapshot,
} from '../src/data/unitImprovementReports';

describe('unit improvement loop metadata', () => {
  it('uses the requested P3 all-topic priority order', () => {
    expect(UNIT_IMPROVEMENT_TOPIC_PRIORITY).toEqual([
      'algebra',
      'logarithmic-and-exponential-functions',
      'complex-numbers',
      'trigonometry',
      'differentiation',
      'integration',
      'numerical-solution-of-equations',
      'vectors',
      'differential-equations',
    ]);
  });

  it('normalizes practical topic aliases to canonical region ids', () => {
    expect(normalizeUnitImprovementTopicToken('vectors')).toBe('vectors');
    expect(normalizeUnitImprovementTopicToken('P3 Complex Numbers')).toBe('complex-numbers');
    expect(normalizeUnitImprovementTopicToken('iteration')).toBe('numerical-solution-of-equations');
    expect(normalizeUnitImprovementTopicToken('differential equations')).toBe('differential-equations');
  });

  it('keeps declared fixer replacements small and inside data files', () => {
    expect(UNIT_IMPROVEMENT_FIXES.length).toBeGreaterThan(0);

    for (const fix of UNIT_IMPROVEMENT_FIXES) {
      expect(fix.filePath.startsWith('src/data/'), fix.id).toBe(true);
      expect(existsSync(fix.filePath), fix.id).toBe(true);
      expect(fix.before, fix.id).not.toEqual(fix.after);
      expect(fix.risk, fix.id).toMatch(/copy-only|source|unchanged/i);
    }
  });
});

describe('unit improvement report rendering', () => {
  it('renders the required student frustration sections from a real snapshot shape', () => {
    const snapshot: UnitImprovementTopicSnapshot = {
      topic: {
        regionId: 'vectors',
        slug: 'vectors',
        name: 'Vectors',
      },
      fieldGuideTopics: [
        {
          id: 'vectors_line_equation',
          title: 'Vector line equations',
          purpose: 'Build a line from a point and direction.',
          skillIds: ['vectors_line_equation'],
          exampleCount: 1,
          examplesWithProblemFirstLesson: 1,
          examplesWithTryWorkedRoute: 1,
          examplesWithCommonMistake: 0,
        },
      ],
      learnSteps: [
        {
          id: 'learn-vectors-direction-from-points',
          title: 'Direction vector from two points',
          stem: 'A line passes through two points.',
          prompt: 'Find the displacement vector.',
          explanation: 'Subtract final minus initial.',
          examTransfer: 'Exam transfer: line questions often start with a direction vector.',
          primarySkillId: 'vectors_notation',
          primaryInputType: 'numeric',
          primaryCheckable: true,
          hasHint: true,
          hasRepairStep: true,
        },
      ],
      skillChecks: [
        {
          itemId: 'sc-vectors-line',
          prompt: 'Find a direction vector.',
          skillId: 'vectors_notation',
          inputType: 'numeric',
          validationMode: 'deterministic',
          checkable: true,
          hasRepairStep: true,
          hasWorkedRoute: true,
        },
      ],
      contract: {
        officialTopic: 'Vectors',
        skillIds: ['p3_vec_line_equations_intersections'],
        readyCount: 1,
        draftCount: 0,
        reviewOnlyCount: 0,
        missingCount: 0,
      },
      examTraining: {
        trainableQuestionCount: 2,
        imagePairQuestionCount: 2,
        sampleQuestionIds: ['sample-1', 'sample-2'],
      },
      unsupportedLearnSkillIds: ['vectors_notation'],
      unsupportedSkillCheckSkillIds: ['vectors_notation'],
      visibleGameTerms: [],
    };

    const markdown = renderStudentFrustrationMarkdown(buildStudentFrustrationReport(snapshot, 1));

    expect(markdown).toContain('# Student Frustration Report — Vectors — Cycle 1');
    expect(markdown).toContain('## Frustrations');
    expect(markdown).toContain('## Confusion Points');
    expect(markdown).toContain('## Boring / Low-Motivation Sections');
    expect(markdown).toContain('## Missing Feedback');
    expect(markdown).toContain('## Places Where the Student Would Quit');
    expect(markdown).toContain('## Priority Fixes');
    expect(markdown).toContain('legacy skill IDs');
  });
});
