import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALGEBRA_VAULT_TOPIC_ORDER } from '../data/algebraVaultContent';
import { CALCULUS_CLIFFS_TOPIC_ORDER } from '../data/calculusCliffsContent';
import {
  DIFFERENTIAL_SHRINE_OUT_OF_SCOPE_TERMS,
  DIFFERENTIAL_SHRINE_QUARANTINED_RUNTIME_PRACTICE_IDS,
  DIFFERENTIAL_SHRINE_SKILL_PRACTICE_ALIGNMENT,
  DIFFERENTIAL_SHRINE_TOPIC_ORDER,
} from '../data/differentialShrineContent';
import { INTEGRAL_TERRACES_TOPIC_ORDER } from '../data/integralTerracesContent';
import { LOGARITHM_OBSERVATORY_TOPIC_ORDER } from '../data/logarithmObservatoryContent';
import { TRIGONOMETRY_SPIRE_TOPIC_ORDER } from '../data/trigonometrySpireContent';
import { VECTORS_GATE_TOPIC_ORDER } from '../data/vectorsGateContent';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import {
  getGeneratedPracticeForRegion,
  normalizeGeneratedPracticeData,
  orderGeneratedPracticeForFieldGuideTopic,
} from '../lib/generatedPractice';

const runtimePractice = normalizeGeneratedPracticeData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/generated_practice_bank.json`, 'utf8')),
);

const expectedDifferentialTitles = [
  'First-Order Differential Equation Idea',
  'Separable Variables Solutions',
  'Finding Particular Solutions',
  'Modeling With Differential Equations',
];

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

function contractedDifferentialPractice() {
  const approved = new Set<string>(DIFFERENTIAL_SHRINE_TOPIC_ORDER);
  return getGeneratedPracticeForRegion(runtimePractice, 'differential-shrine', 'p3')
    .filter((item) => approved.has(String(item.parameters.topic_contract_id)));
}

describe('Differential Shrine first-order DE content contract', () => {
  it('exposes exactly the four approved Differential Shrine Field Guide topic IDs in order', () => {
    const differentialTopics = FIELD_GUIDE_TOPICS_BY_REGION['differential-shrine'];

    expect(differentialTopics.map((topic) => topic.id)).toEqual([...DIFFERENTIAL_SHRINE_TOPIC_ORDER]);
    expect(differentialTopics.map((topic) => topic.title)).toEqual(expectedDifferentialTitles);
    for (const topic of differentialTopics) {
      expect(topic.skillIds).toEqual([topic.id]);
      expect(topic.examples.length, topic.id).toBe(1);
      expect(topic.examples[0]?.workedLines.length, topic.id).toBeGreaterThanOrEqual(3);
      const takeaway = topic.examples[0]?.takeaway ?? [];
      expect(takeaway[takeaway.length - 1], topic.id).toContain('Skill Practice');
    }
  });

  it('does not expose derivative-only, integration-only, unrelated-region, or second-order topics', () => {
    const metadata = FIELD_GUIDE_TOPICS_BY_REGION['differential-shrine']
      .flatMap((topic) => [topic.id, topic.title, topic.purpose, topic.description, ...topic.skillIds])
      .join(' ')
      .toLowerCase();

    for (const term of DIFFERENTIAL_SHRINE_OUT_OF_SCOPE_TERMS) {
      expect(metadata, term).not.toContain(term);
    }
    expect(DIFFERENTIAL_SHRINE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...CALCULUS_CLIFFS_TOPIC_ORDER]));
    expect(DIFFERENTIAL_SHRINE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...INTEGRAL_TERRACES_TOPIC_ORDER]));
    expect(DIFFERENTIAL_SHRINE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...LOGARITHM_OBSERVATORY_TOPIC_ORDER]));
    expect(DIFFERENTIAL_SHRINE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...TRIGONOMETRY_SPIRE_TOPIC_ORDER]));
    expect(DIFFERENTIAL_SHRINE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...VECTORS_GATE_TOPIC_ORDER]));
    expect(DIFFERENTIAL_SHRINE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...ALGEBRA_VAULT_TOPIC_ORDER]));
  });

  it('documents reviewed Skill Practice coverage for every approved Differential Shrine topic', () => {
    const runtimeIds = new Set(runtimePractice.map((item) => item.practiceId));

    expect(DIFFERENTIAL_SHRINE_SKILL_PRACTICE_ALIGNMENT.map((item) => item.topicId))
      .toEqual([...DIFFERENTIAL_SHRINE_TOPIC_ORDER]);
    for (const alignment of DIFFERENTIAL_SHRINE_SKILL_PRACTICE_ALIGNMENT) {
      expect(alignment.candidatePrompt.trim(), alignment.topicId).not.toBe('');
      expect(alignment.expectedAnswer.trim(), alignment.topicId).not.toBe('');
      expect(alignment.authoringNote, alignment.topicId).not.toMatch(/copied|screenshot/i);
      if (alignment.status === 'reviewed_runtime') {
        expect(alignment.reviewedPracticeIds.length, alignment.topicId).toBeGreaterThan(0);
        for (const practiceId of alignment.reviewedPracticeIds) {
          expect(runtimeIds.has(practiceId), `${alignment.topicId}/${practiceId}`).toBe(true);
        }
      }
    }
  });

  it('uses reviewed topic-contract practice for every Differential Field Guide topic', () => {
    const differentialPractice = getGeneratedPracticeForRegion(runtimePractice, 'differential-shrine', 'p3');

    for (const topic of FIELD_GUIDE_TOPICS_BY_REGION['differential-shrine']) {
      const selected = orderGeneratedPracticeForFieldGuideTopic(differentialPractice, topic);

      expect(selected.fallbackReason, topic.id).toBeUndefined();
      expect(selected.exactMatchCount, topic.id).toBeGreaterThanOrEqual(4);
      expect(selected.items.slice(0, selected.exactMatchCount).every((item) => item.parameters.topic_contract_id === topic.id), topic.id).toBe(true);
    }
  });

  it('keeps Differential Shrine Skill Practice on first-order DE topics only', () => {
    const contractedPractice = contractedDifferentialPractice();
    const approvedTopicIds = new Set<string>(DIFFERENTIAL_SHRINE_TOPIC_ORDER);
    const text = contractedPractice.flatMap((item) => [
      item.practiceId,
      item.generatorFamily,
      item.questionType ?? '',
      item.prompt,
      item.answer,
      item.keyMethod ?? '',
      item.examMove ?? '',
      ...item.workedSolution,
    ]).join('\n').toLowerCase();

    expect(contractedPractice).toHaveLength(22);
    expect(new Set(contractedPractice.map((item) => item.parameters.topic_contract_id))).toEqual(approvedTopicIds);
    expect(contractedPractice.every((item) => approvedTopicIds.has(String(item.parameters.topic_contract_id)))).toBe(true);
    expect(text).toContain('dy/dx = 2y');
    expect(text).toContain('dh/dt = 4 - k sqrt(h)');
    expect(text).toContain('dt/dt = -k(t - 20)');
    expect(text).not.toMatch(/second-order|second order|slope field|needle diagram|newton|argand|complex number|vector line/);
  });

  it('includes the required separable, particular-solution, and modeling practice signals', () => {
    const contractedPractice = contractedDifferentialPractice();
    const separable = contractedPractice.filter((item) => item.parameters.topic_contract_id === 'differential_separable_variables');
    const particular = contractedPractice.filter((item) => item.parameters.topic_contract_id === 'differential_particular_solutions');
    const modeling = contractedPractice.filter((item) => item.parameters.topic_contract_id === 'differential_modeling');

    expect(separable.some((item) => /general solution/i.test(`${item.prompt}\n${item.answer}`))).toBe(true);
    expect(separable.some((item) => /partial fractions|integration by parts/i.test(item.workedSolution.join('\n')))).toBe(true);
    expect(particular.some((item) => /y\\(0\\)|when x = 0|initial condition|passing through/i.test(`${item.prompt}\n${item.workedSolution.join('\n')}`))).toBe(true);
    expect(modeling.some((item) => /form the differential equation only/i.test(item.prompt))).toBe(true);
    expect(modeling.some((item) => /solve for/i.test(item.prompt))).toBe(true);
    expect(modeling.some((item) => /what does the differential equation say|per unit time/i.test(`${item.prompt}\n${item.answer}`))).toBe(true);
  });

  it('keeps cross-region calculus-family boundaries intact', () => {
    const differentialText = `${topicText('differential-shrine')}\n${contractedDifferentialPractice().map((item) => item.prompt).join('\n')}`.toLowerCase();
    const integralText = `${topicText('integration-gardens')}\n${getGeneratedPracticeForRegion(runtimePractice, 'integration-gardens', 'p3').map((item) => item.prompt).join('\n')}`.toLowerCase();
    const calculusText = `${topicText('calculus-cliffs')}\n${getGeneratedPracticeForRegion(runtimePractice, 'calculus-cliffs', 'p3').map((item) => item.prompt).join('\n')}`.toLowerCase();
    const logText = topicText('logarithm-grove');
    const trigText = topicText('trig-observatory');
    const vectorText = topicText('vector-workshop');
    const algebraText = topicText('algebra-forge');

    expect(differentialText).toContain('solve dy/dx = 2y');
    expect(integralText).not.toContain('solve dy/dx = 2y');
    expect(integralText).toContain('integrate e^(2x + 3)');
    expect(differentialText).not.toContain('integrate e^(2x + 3)');
    expect(calculusText).toContain('differentiate');
    expect(calculusText).not.toContain('cooling model');
    expect(logText).not.toContain('differential equation');
    expect(trigText).not.toContain('differential equation');
    expect(vectorText).not.toContain('differential equation');
    expect(algebraText).not.toContain('differential equation');
  });

  it('keeps any explicitly quarantined Differential Shrine runtime practice out of selection', () => {
    const differentialRuntimeIds = new Set(getGeneratedPracticeForRegion(runtimePractice, 'differential-shrine', 'p3').map((item) => item.practiceId));

    for (const practiceId of DIFFERENTIAL_SHRINE_QUARANTINED_RUNTIME_PRACTICE_IDS) {
      expect(differentialRuntimeIds.has(practiceId), practiceId).toBe(false);
    }
  });
});
