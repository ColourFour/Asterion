import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CALCULUS_CLIFFS_OUT_OF_SCOPE_TERMS,
  CALCULUS_CLIFFS_QUARANTINED_FIELD_GUIDE_TOPIC_IDS,
  CALCULUS_CLIFFS_QUARANTINED_RUNTIME_PRACTICE_IDS,
  CALCULUS_CLIFFS_SKILL_PRACTICE_ALIGNMENT,
  CALCULUS_CLIFFS_TOPIC_ORDER,
} from '../data/calculusCliffsContent';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import {
  getGeneratedPracticeForRegion,
  normalizeGeneratedPracticeData,
  orderGeneratedPracticeForFieldGuideTopic,
} from '../lib/generatedPractice';
import { LOGARITHM_OBSERVATORY_TOPIC_ORDER } from '../data/logarithmObservatoryContent';
import { TRIGONOMETRY_SPIRE_TOPIC_ORDER } from '../data/trigonometrySpireContent';

const runtimePractice = normalizeGeneratedPracticeData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/generated_practice_bank.json`, 'utf8')),
);

function topicText(regionId: string): string {
  return FIELD_GUIDE_TOPICS_BY_REGION[regionId].flatMap((topic) => [
    topic.id,
    topic.title,
    topic.purpose,
    topic.preview,
    topic.description,
    topic.supportNote ?? '',
    ...topic.skillIds,
    ...topic.examples.flatMap((example) => [
      example.title,
      example.prompt,
      ...example.workedLines,
      example.patternTitle,
      ...example.patternRows.flatMap((row) => [row.from, row.move, row.to]),
      example.tryPrompt,
      ...example.tryScaffold,
      ...example.takeaway,
      example.result,
    ]),
  ]).join('\n').toLowerCase();
}

function contractedCalculusPractice() {
  const approved = new Set<string>(CALCULUS_CLIFFS_TOPIC_ORDER);
  return getGeneratedPracticeForRegion(runtimePractice, 'calculus-cliffs', 'p3')
    .filter((item) => approved.has(String(item.parameters.topic_contract_id)));
}

describe('Calculus Cliffs differentiation content contract', () => {
  it('exposes exactly the six approved differentiation Field Guide topic IDs in order', () => {
    const calculusTopics = FIELD_GUIDE_TOPICS_BY_REGION['calculus-cliffs'];

    expect(calculusTopics.map((topic) => topic.id)).toEqual([...CALCULUS_CLIFFS_TOPIC_ORDER]);
    expect(calculusTopics.map((topic) => topic.id)).not.toEqual(expect.arrayContaining([...CALCULUS_CLIFFS_QUARANTINED_FIELD_GUIDE_TOPIC_IDS]));
    expect(calculusTopics.map((topic) => topic.title)).toEqual([
      'Exponential and Logarithmic Derivatives',
      'Product Rule',
      'Quotient Rule',
      'sin/cos/tan Derivatives',
      'Implicit Differentiation',
      'Parametric Differentiation',
    ]);
    for (const topic of calculusTopics) {
      expect(topic.skillIds).toEqual([topic.id]);
      expect(topic.examples.length, topic.id).toBe(1);
      expect(topic.examples[0]?.workedLines.length, topic.id).toBeGreaterThanOrEqual(3);
      const takeaway = topic.examples[0]?.takeaway ?? [];
      expect(takeaway[takeaway.length - 1], topic.id).toContain('Skill Check');
    }
  });

  it('keeps chain rule as a supporting method, not a standalone Field Guide topic', () => {
    const calculusTopics = FIELD_GUIDE_TOPICS_BY_REGION['calculus-cliffs'];
    const fieldGuideText = topicText('calculus-cliffs');

    expect(calculusTopics.map((topic) => topic.id)).not.toContain('chain-rule');
    expect(calculusTopics.map((topic) => topic.title)).not.toContain('Chain Rule');
    expect(fieldGuideText).toContain('chain rule appears here only as a supporting method');
  });

  it('blocks out-of-scope calculus leakage from the differentiation topic flow', () => {
    const fieldGuideText = topicText('calculus-cliffs');

    for (const term of CALCULUS_CLIFFS_OUT_OF_SCOPE_TERMS) {
      expect(fieldGuideText, term).not.toContain(term);
    }
  });

  it('documents reviewed Skill Check coverage for each approved differentiation topic', () => {
    const runtimeIds = new Set(runtimePractice.map((item) => item.practiceId));

    expect(CALCULUS_CLIFFS_SKILL_PRACTICE_ALIGNMENT.map((item) => item.topicId))
      .toEqual([...CALCULUS_CLIFFS_TOPIC_ORDER]);
    for (const alignment of CALCULUS_CLIFFS_SKILL_PRACTICE_ALIGNMENT) {
      expect(alignment.status, alignment.topicId).toBe('reviewed_runtime');
      expect(alignment.reviewedPracticeIds.length, alignment.topicId).toBe(3);
      expect(alignment.authoringNote, alignment.topicId).not.toMatch(/copied|screenshot/i);
      for (const practiceId of alignment.reviewedPracticeIds) {
        expect(runtimeIds.has(practiceId), `${alignment.topicId}/${practiceId}`).toBe(true);
      }
    }
  });

  it('uses reviewed topic-contract practice for every Calculus Field Guide topic and holds old broad items back', () => {
    const calculusPractice = getGeneratedPracticeForRegion(runtimePractice, 'calculus-cliffs', 'p3');

    for (const topic of FIELD_GUIDE_TOPICS_BY_REGION['calculus-cliffs']) {
      const selected = orderGeneratedPracticeForFieldGuideTopic(calculusPractice, topic);

      expect(selected.fallbackReason, topic.id).toBeUndefined();
      expect(selected.exactMatchCount, topic.id).toBe(3);
      expect(selected.items.slice(0, 3).every((item) => item.parameters.topic_contract_id === topic.id), topic.id).toBe(true);
      expect(selected.items.map((item) => item.practiceId), topic.id)
        .not.toEqual(expect.arrayContaining([...CALCULUS_CLIFFS_QUARANTINED_RUNTIME_PRACTICE_IDS]));
    }
  });

  it('keeps contracted Calculus Skill Check on the six approved differentiation topics', () => {
    const contractedPractice = contractedCalculusPractice();
    const approvedTopicIds = new Set<string>(CALCULUS_CLIFFS_TOPIC_ORDER);

    expect(contractedPractice).toHaveLength(18);
    expect(new Set(contractedPractice.map((item) => item.parameters.topic_contract_id))).toEqual(approvedTopicIds);
    expect(contractedPractice.every((item) => approvedTopicIds.has(String(item.parameters.topic_contract_id)))).toBe(true);
    expect(contractedPractice.map((item) => item.prompt).join('\n').toLowerCase()).not.toMatch(/integrat|differential equation|vector line equation/);
  });

  it('keeps parametric differentiation separate from vector line equations', () => {
    const parametricPractice = contractedCalculusPractice()
      .filter((item) => item.parameters.topic_contract_id === 'derivatives_parametric');
    const parametricText = parametricPractice.flatMap((item) => [
      item.prompt,
      item.answer,
      ...item.workedSolution,
    ]).join('\n').toLowerCase();

    expect(parametricPractice).toHaveLength(3);
    expect(parametricText).toContain('dy/dx');
    expect(parametricText).not.toContain('lambda');
    expect(parametricText).not.toContain('r = <');
  });

  it('routes differentiation of exponentials, logs, and trig composites to Calculus rather than Logs or Trig', () => {
    const calculusText = `${topicText('calculus-cliffs')}\n${contractedCalculusPractice().map((item) => item.prompt).join('\n')}`.toLowerCase();
    const logText = topicText('logarithm-grove');
    const trigText = topicText('trig-observatory');

    expect(calculusText).toContain('e^(3x)');
    expect(calculusText).toContain('ln(2x + 1)');
    expect(calculusText).toContain('cos(x^2 + 2x)');
    expect(LOGARITHM_OBSERVATORY_TOPIC_ORDER).not.toContain('derivatives_exponential_logarithmic');
    expect(TRIGONOMETRY_SPIRE_TOPIC_ORDER).not.toContain('derivatives_trig_functions');
    expect(logText).not.toContain('dy/dx');
    expect(trigText).not.toContain('differentiate');
  });
});
