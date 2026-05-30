import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ALGEBRA_VAULT_OUT_OF_SCOPE_TERMS,
  ALGEBRA_VAULT_QUARANTINED_RUNTIME_PRACTICE_IDS,
  ALGEBRA_VAULT_SKILL_PRACTICE_ALIGNMENT,
  ALGEBRA_VAULT_TOPIC_ORDER,
} from '../data/algebraVaultContent';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import { getGeneratedPracticeForRegion, normalizeGeneratedPracticeData } from '../lib/generatedPractice';

const runtimePractice = normalizeGeneratedPracticeData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/generated_practice_bank.json`, 'utf8')),
);

describe('Algebra Vault content contract', () => {
  it('exposes exactly the five approved Field Guide topic IDs in order', () => {
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

  it('keeps Algebra Vault runtime practice on the five approved topic contracts', () => {
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

    for (const alignment of ALGEBRA_VAULT_SKILL_PRACTICE_ALIGNMENT) {
      expect(ALGEBRA_VAULT_TOPIC_ORDER).toContain(alignment.topicId);
      if (alignment.status === 'reviewed_runtime') {
        expect(alignment.reviewedPracticeIds.length, alignment.topicId).toBeGreaterThan(0);
        for (const practiceId of alignment.reviewedPracticeIds) {
          expect(runtimeIds.has(practiceId), `${alignment.topicId}/${practiceId}`).toBe(true);
        }
      }
    }

    for (const practiceId of ALGEBRA_VAULT_QUARANTINED_RUNTIME_PRACTICE_IDS) {
      expect(runtimeIds.has(practiceId), practiceId).toBe(false);
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
