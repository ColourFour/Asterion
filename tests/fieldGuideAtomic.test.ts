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
});
