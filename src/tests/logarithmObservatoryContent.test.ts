import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  LOGARITHM_OBSERVATORY_OUT_OF_SCOPE_TERMS,
  LOGARITHM_OBSERVATORY_QUARANTINED_FIELD_GUIDE_TOPIC_IDS,
  LOGARITHM_OBSERVATORY_QUARANTINED_GENERATOR_FAMILIES,
  LOGARITHM_OBSERVATORY_QUARANTINED_RUNTIME_PRACTICE_IDS,
  LOGARITHM_OBSERVATORY_QUARANTINED_RUNTIME_SNIPPET_IDS,
  LOGARITHM_OBSERVATORY_QUARANTINED_SKILL_TARGET_IDS,
  LOGARITHM_OBSERVATORY_SKILL_PRACTICE_ALIGNMENT,
  LOGARITHM_OBSERVATORY_TOPIC_ORDER,
} from '../data/logarithmObservatoryContent';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import { getGeneratedPracticeForRegion, normalizeGeneratedPracticeData } from '../lib/generatedPractice';
import { getTeachingSnippetsForRegion, normalizeTeachingSnippetsData } from '../lib/teachingSnippets';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

const runtimePractice = normalizeGeneratedPracticeData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/generated_practice_bank.json`, 'utf8')),
);
const runtimeSnippets = normalizeTeachingSnippetsData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/teaching_snippets.json`, 'utf8')),
);
const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove')!;

function logRuntimePracticeText(): string {
  return getGeneratedPracticeForRegion(runtimePractice, 'logarithm-grove', 'p3')
    .flatMap((item) => [
      item.practiceId,
      item.generatorFamily,
      item.skillTargetId ?? '',
      item.questionType ?? '',
      item.prompt,
      item.answer,
      ...item.workedSolution,
      JSON.stringify(item.parameters),
    ])
    .join('\n')
    .toLowerCase();
}

describe('Logarithm Observatory content contract', () => {
  it('exposes exactly the six approved Field Guide topic IDs in order', () => {
    const logTopics = FIELD_GUIDE_TOPICS_BY_REGION['logarithm-grove'];

    expect(logTopics.map((topic) => topic.id)).toEqual([...LOGARITHM_OBSERVATORY_TOPIC_ORDER]);
    for (const topic of logTopics) {
      expect(topic.skillIds).toEqual([topic.id]);
      expect(topic.examples.length, topic.id).toBeGreaterThanOrEqual(1);
      expect(topic.examples[0]?.workedLines.length, topic.id).toBeGreaterThanOrEqual(3);
      const takeaway = topic.examples[0]?.takeaway ?? [];
      expect(takeaway[takeaway.length - 1], topic.id).toContain('Skill Practice');
    }
  });

  it('keeps Logarithm Observatory runtime practice on the six approved topic contracts', () => {
    const logPractice = getGeneratedPracticeForRegion(runtimePractice, 'logarithm-grove', 'p3');
    const approvedTopicIds = new Set<string>(LOGARITHM_OBSERVATORY_TOPIC_ORDER);

    expect(logPractice.length).toBeGreaterThan(0);
    expect(new Set(logPractice.map((item) => item.parameters.topic_contract_id))).toEqual(approvedTopicIds);
    expect(logPractice.every((item) => approvedTopicIds.has(String(item.parameters.topic_contract_id)))).toBe(true);
  });

  it('blocks quarantined calculus content from Log Field Guide, Quick Check, and Skill Check runtime selection', () => {
    const logTopics = FIELD_GUIDE_TOPICS_BY_REGION['logarithm-grove'];
    const logPractice = getGeneratedPracticeForRegion(runtimePractice, 'logarithm-grove', 'p3');
    const logSnippets = getTeachingSnippetsForRegion(runtimeSnippets, 'p3', logRegion);

    expect(logTopics.map((topic) => topic.id)).not.toEqual(expect.arrayContaining([...LOGARITHM_OBSERVATORY_QUARANTINED_FIELD_GUIDE_TOPIC_IDS]));
    expect(logPractice.map((item) => item.practiceId)).not.toEqual(expect.arrayContaining([...LOGARITHM_OBSERVATORY_QUARANTINED_RUNTIME_PRACTICE_IDS]));
    expect(logPractice.map((item) => item.generatorFamily)).not.toEqual(expect.arrayContaining([...LOGARITHM_OBSERVATORY_QUARANTINED_GENERATOR_FAMILIES]));
    expect(logPractice.map((item) => item.skillTargetId)).not.toEqual(expect.arrayContaining([...LOGARITHM_OBSERVATORY_QUARANTINED_SKILL_TARGET_IDS]));
    expect(logSnippets.map((snippet) => snippet.snippetId)).not.toEqual(expect.arrayContaining([...LOGARITHM_OBSERVATORY_QUARANTINED_RUNTIME_SNIPPET_IDS]));
    expect(logSnippets.flatMap((snippet) => [...snippet.sourceSkillTargetIds, ...snippet.relatedSkillTargetIds, snippet.quickCheck?.skillTargetId ?? '']))
      .not.toEqual(expect.arrayContaining([...LOGARITHM_OBSERVATORY_QUARANTINED_SKILL_TARGET_IDS]));
  });

  it('does not surface calculus wording in Log Field Guide or generated Skill Check', () => {
    const fieldGuideText = FIELD_GUIDE_TOPICS_BY_REGION['logarithm-grove']
      .flatMap((topic) => [
        topic.id,
        topic.title,
        topic.purpose,
        topic.description,
        ...topic.skillIds,
        ...topic.examples.flatMap((example) => [
          example.title,
          example.prompt,
          ...example.workedLines,
          ...example.tryScaffold,
          ...example.takeaway,
        ]),
      ])
      .join('\n')
      .toLowerCase();
    const practiceText = logRuntimePracticeText();

    for (const term of LOGARITHM_OBSERVATORY_OUT_OF_SCOPE_TERMS) {
      expect(fieldGuideText, term).not.toContain(term);
      expect(practiceText, term).not.toContain(term);
    }
  });

  it('documents reviewed practice coverage and quarantined old Log runtime items', () => {
    const runtimeIds = new Set(runtimePractice.map((item) => item.practiceId));

    for (const alignment of LOGARITHM_OBSERVATORY_SKILL_PRACTICE_ALIGNMENT) {
      expect(LOGARITHM_OBSERVATORY_TOPIC_ORDER).toContain(alignment.topicId);
      if (alignment.status === 'reviewed_runtime') {
        expect(alignment.reviewedPracticeIds.length, alignment.topicId).toBeGreaterThan(0);
        for (const practiceId of alignment.reviewedPracticeIds) {
          expect(runtimeIds.has(practiceId), `${alignment.topicId}/${practiceId}`).toBe(true);
        }
      }
    }

    for (const practiceId of LOGARITHM_OBSERVATORY_QUARANTINED_RUNTIME_PRACTICE_IDS) {
      expect(runtimeIds.has(practiceId), practiceId).toBe(false);
    }
  });

  it('keeps invalid log-domain root rejection explicit', () => {
    const logDomainTopic = FIELD_GUIDE_TOPICS_BY_REGION['logarithm-grove']
      .find((topic) => topic.id === 'log_equations_inequalities');
    const domainPractice = getGeneratedPracticeForRegion(runtimePractice, 'logarithm-grove', 'p3')
      .find((item) => item.practiceId === 'gen_log_domain_validation_basic_0003');

    expect(logDomainTopic?.examples[0]?.workedLines.join('\n')).toMatch(/Reject .* because/i);
    expect(domainPractice?.workedSolution.join('\n')).toMatch(/Reject x = -3 because/i);
  });
});
