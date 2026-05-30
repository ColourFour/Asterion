import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  TRIGONOMETRY_SPIRE_OUT_OF_SCOPE_TERMS,
  TRIGONOMETRY_SPIRE_QUARANTINED_FIELD_GUIDE_TOPIC_IDS,
  TRIGONOMETRY_SPIRE_SKILL_PRACTICE_ALIGNMENT,
  TRIGONOMETRY_SPIRE_TOPIC_ORDER,
} from '../data/trigonometrySpireContent';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import { getGeneratedPracticeForRegion, normalizeGeneratedPracticeData } from '../lib/generatedPractice';

const runtimePractice = normalizeGeneratedPracticeData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/generated_practice_bank.json`, 'utf8')),
);

function trigRuntimePracticeText(): string {
  return getGeneratedPracticeForRegion(runtimePractice, 'trig-observatory', 'p3')
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

function trigFieldGuideText(): string {
  return FIELD_GUIDE_TOPICS_BY_REGION['trig-observatory']
    .flatMap((topic) => [
      topic.id,
      topic.title,
      topic.purpose,
      topic.description,
      topic.preview,
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
}

describe('Trigonometry Spire content contract', () => {
  it('exposes exactly the five approved Field Guide topic IDs in order', () => {
    const trigTopics = FIELD_GUIDE_TOPICS_BY_REGION['trig-observatory'];

    expect(trigTopics.map((topic) => topic.id)).toEqual([...TRIGONOMETRY_SPIRE_TOPIC_ORDER]);
    expect(trigTopics[0]?.id).toBe('trig_reciprocal_functions');
    for (const topic of trigTopics) {
      expect(topic.skillIds).toEqual([topic.id]);
      expect(topic.examples.length, topic.id).toBeGreaterThanOrEqual(1);
      expect(topic.examples[0]?.workedLines.length, topic.id).toBeGreaterThanOrEqual(3);
      const takeaway = topic.examples[0]?.takeaway ?? [];
      expect(takeaway[takeaway.length - 1], topic.id).toContain('Skill Practice');
    }
  });

  it('keeps old standalone Trig topic IDs out of the runtime Field Guide contract', () => {
    expect(FIELD_GUIDE_TOPICS_BY_REGION['trig-observatory'].map((topic) => topic.id))
      .not.toEqual(expect.arrayContaining([...TRIGONOMETRY_SPIRE_QUARANTINED_FIELD_GUIDE_TOPIC_IDS]));
  });

  it('keeps Trig runtime practice on the five approved topic contracts', () => {
    const trigPractice = getGeneratedPracticeForRegion(runtimePractice, 'trig-observatory', 'p3');
    const approvedTopicIds = new Set<string>(TRIGONOMETRY_SPIRE_TOPIC_ORDER);

    expect(trigPractice.length).toBeGreaterThan(0);
    expect(new Set(trigPractice.map((item) => item.parameters.topic_contract_id))).toEqual(approvedTopicIds);
    expect(trigPractice.every((item) => approvedTopicIds.has(String(item.parameters.topic_contract_id)))).toBe(true);
  });

  it('makes reciprocal functions, expanded Pythagorean identities, and addition formulae explicit', () => {
    const fieldGuideText = trigFieldGuideText();

    for (const required of [
      'secant',
      'cosecant',
      'cotangent',
      'asymptotes',
      '1+\\tan^2\\theta=\\sec^2\\theta',
      '1+\\cot^2\\theta=\\operatorname{cosec}^2\\theta',
      '\\sin(a\\pm b)',
      '\\cos(a\\pm b)',
      '\\tan(a\\pm b)',
      'shifted equation',
    ]) {
      expect(fieldGuideText, required).toContain(required.toLowerCase());
    }
  });

  it('does not label R-form as complex or polar form in Trig runtime content', () => {
    const runtimeText = `${trigFieldGuideText()}\n${trigRuntimePracticeText()}`;

    expect(runtimeText).toContain('r-form');
    expect(runtimeText).not.toContain('polar form');
    expect(runtimeText).not.toContain('complex');
  });

  it('blocks calculus, vector, and complex-number leakage from Trig Field Guide and Skill Check', () => {
    const runtimeText = `${trigFieldGuideText()}\n${trigRuntimePracticeText()}`;

    for (const term of TRIGONOMETRY_SPIRE_OUT_OF_SCOPE_TERMS) {
      expect(runtimeText, term).not.toContain(term);
    }
  });

  it('documents reviewed Skill Check coverage for each approved topic', () => {
    const runtimeIds = new Set(runtimePractice.map((item) => item.practiceId));

    expect(TRIGONOMETRY_SPIRE_SKILL_PRACTICE_ALIGNMENT.map((item) => item.topicId))
      .toEqual([...TRIGONOMETRY_SPIRE_TOPIC_ORDER]);
    for (const alignment of TRIGONOMETRY_SPIRE_SKILL_PRACTICE_ALIGNMENT) {
      if (alignment.status === 'reviewed_runtime') {
        expect(alignment.reviewedPracticeIds.length, alignment.topicId).toBeGreaterThan(0);
        for (const practiceId of alignment.reviewedPracticeIds) {
          expect(runtimeIds.has(practiceId), `${alignment.topicId}/${practiceId}`).toBe(true);
        }
      } else {
        expect(alignment.authoringNote, alignment.topicId).toMatch(/review/i);
      }
    }
  });

  it('keeps multiple-solution angle feedback explicit', () => {
    const shiftedPractice = getGeneratedPracticeForRegion(runtimePractice, 'trig-observatory', 'p3')
      .find((item) => item.practiceId === 'gen_trig_addition_formulae_basic_0003');
    const reciprocalTopic = FIELD_GUIDE_TOPICS_BY_REGION['trig-observatory']
      .find((topic) => topic.id === 'trig_reciprocal_functions');

    expect(shiftedPractice?.workedSolution.join('\n')).toMatch(/shifted interval/i);
    expect(shiftedPractice?.workedSolution.join('\n')).toMatch(/not allowed/i);
    expect(reciprocalTopic?.examples[0]?.workedLines.join('\n')).toMatch(/quadrants I and IV/i);
  });
});
