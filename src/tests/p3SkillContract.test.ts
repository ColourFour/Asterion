import { describe, expect, it } from 'vitest';
import {
  isValidP3RegionId,
  isValidP3SkillId,
  isValidP3TopicId,
  p3RegionDefinitionForId,
  p3RegionIdForTopicId,
  P3_ALLOWED_REGION_IDS,
  P3_SKILL_MAP_SOURCE,
} from '../lib/p3SkillContract';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

describe('P3 skill contract', () => {
  it('is the shared source for runtime P3 region IDs', () => {
    expect(P3_SKILL_MAP_SOURCE).toBe('tools/content_lab/skill_maps/caie_9709_p3_skill_map.json');
    expect(P3_ASTRAL_ACADEMY.regions.map((region) => region.id).sort()).toEqual([...P3_ALLOWED_REGION_IDS].sort());
  });

  it('validates reviewed P3 region, topic, and skill IDs', () => {
    expect(isValidP3RegionId('algebra-forge')).toBe(true);
    expect(isValidP3RegionId('algebra-vault')).toBe(false);
    expect(isValidP3TopicId('9709_p3_topic_algebra')).toBe(true);
    expect(isValidP3TopicId('9709_p3_topic_statistics')).toBe(false);
    expect(isValidP3SkillId('p3_alg_structure_rearrangement')).toBe(true);
    expect(isValidP3SkillId('p3_alg_unknown_skill')).toBe(false);
  });

  it('maps reviewed P3 topic IDs only through the contract', () => {
    expect(p3RegionIdForTopicId('9709_p3_topic_vectors')).toBe('vector-workshop');
    expect(p3RegionIdForTopicId('9709_p1_topic_quadratics')).toBeUndefined();
    expect(p3RegionDefinitionForId('differential-shrine')?.name).toBe('Differential Shrine');
    expect(p3RegionDefinitionForId('differential-equations')).toBeUndefined();
  });
});
