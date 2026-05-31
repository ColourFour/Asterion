import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ALGEBRA_VAULT_OUT_OF_SCOPE_TERMS,
  ALGEBRA_VAULT_QUARANTINED_RUNTIME_PRACTICE_IDS,
  ALGEBRA_VAULT_SKILL_PRACTICE_ALIGNMENT,
  ALGEBRA_VAULT_TOPIC_ORDER,
} from '../data/algebraVaultContent';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import { AUTHORED_SKILL_CHECK_ITEMS } from '../data/skillCheckItems';
import { getGeneratedPracticeForRegion, normalizeGeneratedPracticeData } from '../lib/generatedPractice';

const runtimePractice = normalizeGeneratedPracticeData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/generated_practice_bank.json`, 'utf8')),
);

describe('Algebra Vault content contract', () => {
  it('exposes exactly the seven approved Field Guide topic IDs in order', () => {
    const algebraTopics = FIELD_GUIDE_TOPICS_BY_REGION['algebra-forge'];

    expect(algebraTopics.map((topic) => topic.id)).toEqual([...ALGEBRA_VAULT_TOPIC_ORDER]);
    for (const topic of algebraTopics) {
      expect(topic.skillIds).toEqual([topic.id]);
      expect(topic.examples.length, topic.id).toBeGreaterThanOrEqual(1);
      expect(topic.examples[0]?.workedLines.length, topic.id).toBeGreaterThanOrEqual(3);
      const takeaway = topic.examples[0]?.takeaway ?? [];
      expect(takeaway[takeaway.length - 1], topic.id).toContain('Skill Practice');
    }
  });

  it('keeps Algebra Vault runtime practice on the approved topic contracts', () => {
    const algebraPractice = getGeneratedPracticeForRegion(runtimePractice, 'algebra-forge', 'p3');
    const approvedTopicIds = new Set<string>(ALGEBRA_VAULT_TOPIC_ORDER);

    expect(algebraPractice.length).toBeGreaterThan(0);
    expect(new Set(algebraPractice.map((item) => item.parameters.topic_contract_id))).toEqual(approvedTopicIds);
    expect(algebraPractice.every((item) => approvedTopicIds.has(String(item.parameters.topic_contract_id)))).toBe(true);
    expect(algebraPractice.some((item) => item.generatorFamily === 'algebra.structure_rearrangement_basic')).toBe(false);
    expect(algebraPractice.some((item) => item.generatorFamily === 'quadratics.discriminant_root_condition_basic')).toBe(false);
  });

  it('documents reviewed practice coverage and quarantined old Algebra runtime items', () => {
    const runtimeIds = new Set(runtimePractice.map((item) => item.practiceId));
    const staticSkillCheckIds = new Set(AUTHORED_SKILL_CHECK_ITEMS.map((item) => item.itemId));

    for (const alignment of ALGEBRA_VAULT_SKILL_PRACTICE_ALIGNMENT) {
      expect(ALGEBRA_VAULT_TOPIC_ORDER).toContain(alignment.topicId);
      if (alignment.status === 'reviewed_runtime' || alignment.status === 'reviewed_static_skill_check') {
        expect(alignment.reviewedPracticeIds.length, alignment.topicId).toBeGreaterThan(0);
        for (const practiceId of alignment.reviewedPracticeIds) {
          expect(runtimeIds.has(practiceId) || staticSkillCheckIds.has(practiceId), `${alignment.topicId}/${practiceId}`).toBe(true);
        }
      }
    }

    for (const practiceId of ALGEBRA_VAULT_QUARANTINED_RUNTIME_PRACTICE_IDS) {
      expect(runtimeIds.has(practiceId), practiceId).toBe(false);
    }
  });

  it('adds the Algebra structure and discriminant bridges with connected practice IDs', () => {
    const algebraTopics = FIELD_GUIDE_TOPICS_BY_REGION['algebra-forge'];
    const bridgeText = algebraTopics
      .filter((topic) => (
        topic.id === 'algebra_structure_first_bridge'
        || topic.id === 'algebra_discriminant_root_conditions'
      ))
      .flatMap((topic) => [
        topic.title,
        topic.purpose,
        topic.description,
        ...topic.examples.flatMap((example) => [
          example.prompt,
          ...example.workedLines,
          ...example.takeaway,
          example.tryPrompt,
        ]),
      ])
      .join(' ');
    const algebraRuntimeIds = new Set(getGeneratedPracticeForRegion(runtimePractice, 'algebra-forge', 'p3').map((item) => item.practiceId));
    const skillCheckIds = new Set(AUTHORED_SKILL_CHECK_ITEMS
      .filter((item) => item.regionId === 'algebra-forge')
      .map((item) => item.itemId));

    expect(bridgeText).toContain('repeated block');
    expect(bridgeText).toContain('Avoid unnecessary expansion');
    expect(bridgeText).toContain('D=b^2-4ac');
    expect(bridgeText).toContain('D=0');
    for (const practiceId of [
      'gen_algebra_structure_first_bridge_0001',
      'gen_algebra_structure_first_bridge_0002',
      'gen_algebra_structure_first_bridge_0003',
      'gen_algebra_discriminant_root_condition_bridge_0001',
      'gen_algebra_discriminant_root_condition_bridge_0002',
      'gen_algebra_discriminant_root_condition_bridge_0003',
    ]) {
      expect(algebraRuntimeIds.has(practiceId), practiceId).toBe(true);
    }
    for (const itemId of [
      'sc-alg-structure-first-bridge-foundation-001',
      'sc-alg-structure-first-bridge-core-001',
      'sc-alg-structure-first-bridge-challenge-001',
      'sc-alg-discriminant-root-conditions-foundation-001',
      'sc-alg-discriminant-root-conditions-core-001',
      'sc-alg-discriminant-root-conditions-challenge-001',
    ]) {
      expect(skillCheckIds.has(itemId), itemId).toBe(true);
    }
  });

  it('does not advertise obvious out-of-region topic IDs in Algebra Field Guide metadata', () => {
    const metadata = FIELD_GUIDE_TOPICS_BY_REGION['algebra-forge']
      .flatMap((topic) => [topic.id, topic.title, topic.purpose, topic.description, ...topic.skillIds])
      .join(' ')
      .toLowerCase();

    for (const term of ALGEBRA_VAULT_OUT_OF_SCOPE_TERMS) {
      expect(metadata, term).not.toContain(term);
    }
  });
});
