import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import {
  FIELD_GUIDE_VISUALS_BY_TOPIC_ID,
  getFieldGuideTopicsForRegion,
  validateFieldGuideVisuals,
} from '../src/data/fieldGuideTopics';
import { P3_SKILL_IDS } from '../src/data/p3SkillContract';

const refactoredSections = [
  { regionId: 'differentiation', id: 'derivatives_trig_functions' },
  { regionId: 'differentiation', id: 'derivatives_inverse_tangent_support' },
  { regionId: 'integration', id: 'integrals_definite_area_bridge' },
  { regionId: 'integration', id: 'integrals_area_between_curves' },
  { regionId: 'integration', id: 'integrals_improper_limit_check' },
] as const;

const commonTrapSections = [
  {
    regionId: 'algebra',
    id: 'algebra_polynomial_division',
    expectedTrapIncludes: 'subtracting the wrong signed row',
  },
  {
    regionId: 'algebra',
    id: 'algebra_remainder_factor_theorem',
    expectedTrapIncludes: 'wrong sign for the divisor root',
  },
  {
    regionId: 'logarithmic-and-exponential-functions',
    id: 'log_laws',
    expectedTrapIncludes: 'do not combine sums inside a logarithm',
  },
  {
    regionId: 'logarithmic-and-exponential-functions',
    id: 'log_equations_inequalities',
    expectedTrapIncludes: 'check the original log inputs',
  },
  {
    regionId: 'trigonometry',
    id: 'trig_pythagorean_identities',
    expectedTrapIncludes: 'match the visible squared terms',
  },
  {
    regionId: 'trigonometry',
    id: 'trig_r_form_transformations',
    expectedTrapIncludes: 'match coefficients before solving for the angle',
  },
  {
    regionId: 'complex-numbers',
    id: 'modulus-argument',
    expectedTrapIncludes: 'choose the quadrant before trusting a reference angle',
  },
  {
    regionId: 'complex-numbers',
    id: 'locus',
    expectedTrapIncludes: 'read $z-a$ as distance from $a$',
  },
  {
    regionId: 'vectors',
    id: 'vectors_notation',
    expectedTrapIncludes: 'reversing final and initial gives the opposite vector',
  },
  {
    regionId: 'vectors',
    id: 'vectors_line_equation',
    expectedTrapIncludes: 'use a direction vector, not a second position vector',
  },
] as const;

describe('atomic P3 Field Guide sections', () => {
  it('keeps refactored sections to one worked example and one try-one check', () => {
    for (const sectionRef of refactoredSections) {
      const section = getFieldGuideTopicsForRegion(sectionRef.regionId).find((topic) => topic.id === sectionRef.id);

      expect(section, sectionRef.id).toBeDefined();
      expect(section?.examples).toHaveLength(1);
      expect(section?.examples[0]?.workedLines.length).toBeGreaterThan(0);
      expect(section?.examples[0]?.tryPrompt.trim().length).toBeGreaterThan(0);
      expect(section?.examples[0]?.tryWorkedLines?.length).toBeGreaterThan(0);
      expect(section?.examples[0]?.tryResult?.trim().length).toBeGreaterThan(0);
    }
  });

  it('links refactored sections to P3 skill contract ids where practical', () => {
    const contractIds = new Set<string>(P3_SKILL_IDS);

    for (const sectionRef of refactoredSections) {
      const section = getFieldGuideTopicsForRegion(sectionRef.regionId).find((topic) => topic.id === sectionRef.id);
      expect(section?.skillIds.some((skillId) => contractIds.has(skillId)), sectionRef.id).toBe(true);
    }
  });

  it('keeps declared Field Guide visual metadata backed by public assets', () => {
    const errors = validateFieldGuideVisuals(FIELD_GUIDE_VISUALS_BY_TOPIC_ID, {
      assetExists: (assetPath) => existsSync(`public/${assetPath}`),
    });

    expect(errors).toEqual([]);
  });

  it('flags missing Field Guide visual assets', () => {
    const errors = validateFieldGuideVisuals({
      missing_visual_topic: [
        {
          assetPath: 'assets/p3/visuals/missing/not-there.png',
          alt: 'Missing visual test.',
          caption: 'Missing visual test caption.',
          testedConcept: 'Missing visual test concept.',
        },
      ],
    }, {
      assetExists: () => false,
    });

    expect(errors).toContain('missing_visual_topic visual 1 missing asset: assets/p3/visuals/missing/not-there.png');
  });

  it('keeps selected Field Guide examples explicit about common traps', () => {
    for (const sectionRef of commonTrapSections) {
      const section = getFieldGuideTopicsForRegion(sectionRef.regionId).find((topic) => topic.id === sectionRef.id);
      const commonTrapTakeaways = section?.examples.flatMap((example) => (
        example.takeaway.filter((line) => /^Common (?:mistake|trap):/i.test(line.trim()))
      ));

      expect(section, sectionRef.id).toBeDefined();
      expect(commonTrapTakeaways, sectionRef.id).toContainEqual(expect.stringContaining(sectionRef.expectedTrapIncludes));
    }
  });
});
