import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALGEBRA_VAULT_TOPIC_ORDER } from '../data/algebraVaultContent';
import {
  INTEGRAL_TERRACES_MOVED_TO_ALGEBRA_PRACTICE_IDS,
  INTEGRAL_TERRACES_OUT_OF_SCOPE_TERMS,
  INTEGRAL_TERRACES_QUARANTINED_RUNTIME_PRACTICE_IDS,
  INTEGRAL_TERRACES_SKILL_PRACTICE_ALIGNMENT,
  INTEGRAL_TERRACES_TOPIC_ORDER,
} from '../data/integralTerracesContent';
import { LOGARITHM_OBSERVATORY_TOPIC_ORDER } from '../data/logarithmObservatoryContent';
import { TRIGONOMETRY_SPIRE_TOPIC_ORDER } from '../data/trigonometrySpireContent';
import { CALCULUS_CLIFFS_TOPIC_ORDER } from '../data/calculusCliffsContent';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import {
  getGeneratedPracticeForRegion,
  normalizeGeneratedPracticeData,
  orderGeneratedPracticeForFieldGuideTopic,
} from '../lib/generatedPractice';

const runtimePractice = normalizeGeneratedPracticeData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/generated_practice_bank.json`, 'utf8')),
);

const expectedIntegralTitles = [
  'Integration of e^x and 1/x',
  'Integrals of sin, cos, and sec^2',
  'Trig Identity Integrals',
  'Integration With Partial Fractions',
  'Integration of 1/(1 + x^2) and arctan Forms',
  'Integration by Substitution',
  'Integration by Parts',
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
        ...(example.tryWorkedLines ?? []),
        example.tryResult ?? '',
        ...example.takeaway,
        example.result,
      ]),
  ]).join('\n').toLowerCase();
}

function contractedIntegralPractice() {
  const approved = new Set<string>(INTEGRAL_TERRACES_TOPIC_ORDER);
  return getGeneratedPracticeForRegion(runtimePractice, 'integration-gardens', 'p3')
    .filter((item) => approved.has(String(item.parameters.topic_contract_id)));
}

describe('Integral Terraces integration content contract', () => {
  it('exposes exactly the seven approved integration Field Guide topic IDs in order', () => {
    const integralTopics = FIELD_GUIDE_TOPICS_BY_REGION['integration-gardens'];

    expect(integralTopics.map((topic) => topic.id)).toEqual([...INTEGRAL_TERRACES_TOPIC_ORDER]);
    expect(integralTopics.map((topic) => topic.title)).toEqual(expectedIntegralTitles);
    for (const topic of integralTopics) {
      expect(topic.skillIds).toEqual([topic.id]);
      expect(topic.examples.length, topic.id).toBe(1);
      expect(topic.examples[0]?.workedLines.length, topic.id).toBeGreaterThanOrEqual(3);
      const takeaway = topic.examples[0]?.takeaway ?? [];
      expect(takeaway[takeaway.length - 1], topic.id).toContain('Skill Practice');
    }
  });

  it('documents by-parts as implemented from existing repo review despite the PDF source gap', () => {
    const byParts = INTEGRAL_TERRACES_SKILL_PRACTICE_ALIGNMENT.find((item) => item.topicId === 'integrals_by_parts');
    const byPartsTopic = FIELD_GUIDE_TOPICS_BY_REGION['integration-gardens'].find((topic) => topic.id === 'integrals_by_parts');

    expect(byParts?.status).toBe('reviewed_runtime');
    expect(byParts?.reviewedPracticeIds).toEqual([
      'gen_integrals_by_parts_0001',
      'gen_integrals_by_parts_0002',
      'gen_integrals_by_parts_0003',
    ]);
    expect(byParts?.authoringNote).toMatch(/uploaded PDF source ends after the by-parts heading/i);
    expect(byPartsTopic?.supportNote).toMatch(/reference PDF reaches only/i);
  });

  it('keeps out-of-region topics out of Integral Terraces topic metadata', () => {
    const metadata = FIELD_GUIDE_TOPICS_BY_REGION['integration-gardens']
      .flatMap((topic) => [topic.id, topic.title, topic.purpose, ...topic.skillIds])
      .join(' ')
      .toLowerCase();

    for (const term of INTEGRAL_TERRACES_OUT_OF_SCOPE_TERMS) {
      expect(metadata, term).not.toContain(term);
    }
  });

  it('documents reviewed Skill Check coverage for every approved integration topic', () => {
    const runtimeIds = new Set(runtimePractice.map((item) => item.practiceId));

    expect(INTEGRAL_TERRACES_SKILL_PRACTICE_ALIGNMENT.map((item) => item.topicId))
      .toEqual([...INTEGRAL_TERRACES_TOPIC_ORDER]);
    for (const alignment of INTEGRAL_TERRACES_SKILL_PRACTICE_ALIGNMENT) {
      expect(alignment.candidatePrompt.trim(), alignment.topicId).not.toBe('');
      expect(alignment.expectedAnswer.trim(), alignment.topicId).not.toBe('');
      expect(alignment.authoringNote.trim(), alignment.topicId).not.toBe('');
      if (alignment.status === 'reviewed_runtime') {
        expect(alignment.reviewedPracticeIds.length, alignment.topicId).toBeGreaterThan(0);
        for (const practiceId of alignment.reviewedPracticeIds) {
          expect(runtimeIds.has(practiceId), `${alignment.topicId}/${practiceId}`).toBe(true);
        }
      } else {
        expect(alignment.reviewedPracticeIds, alignment.topicId).toEqual([]);
      }
    }
  });

  it('uses reviewed topic-contract practice for every Integral Field Guide topic', () => {
    const integralPractice = getGeneratedPracticeForRegion(runtimePractice, 'integration-gardens', 'p3');

    for (const topic of FIELD_GUIDE_TOPICS_BY_REGION['integration-gardens']) {
      const selected = orderGeneratedPracticeForFieldGuideTopic(integralPractice, topic);

      expect(selected.fallbackReason, topic.id).toBeUndefined();
      expect(selected.exactMatchCount, topic.id).toBeGreaterThanOrEqual(3);
      expect(selected.items.slice(0, selected.exactMatchCount).every((item) => item.parameters.topic_contract_id === topic.id), topic.id).toBe(true);
    }
  });

  it('keeps Integral Skill Check on approved integration topics with no derivative-only or differential-equation runtime leak', () => {
    const contractedPractice = contractedIntegralPractice();
    const approvedTopicIds = new Set<string>(INTEGRAL_TERRACES_TOPIC_ORDER);
    const text = contractedPractice.flatMap((item) => [
      item.practiceId,
      item.generatorFamily,
      item.prompt,
      item.answer,
      item.keyMethod ?? '',
      item.examMove ?? '',
      ...item.workedSolution,
    ]).join('\n').toLowerCase();

    expect(contractedPractice).toHaveLength(28);
    expect(new Set(contractedPractice.map((item) => item.parameters.topic_contract_id))).toEqual(approvedTopicIds);
    expect(contractedPractice.every((item) => approvedTopicIds.has(String(item.parameters.topic_contract_id)))).toBe(true);
    expect(text).not.toMatch(/dy\/dx|differentiat|differential equation|growth model|newton|argand|complex number|vector line/);
  });

  it('keeps partial-fraction integration separate from Algebra Vault decomposition-only practice', () => {
    const integralPractice = getGeneratedPracticeForRegion(runtimePractice, 'integration-gardens', 'p3');
    const algebraPractice = getGeneratedPracticeForRegion(runtimePractice, 'algebra-forge', 'p3');

    expect(integralPractice.map((item) => item.practiceId))
      .not.toEqual(expect.arrayContaining([...INTEGRAL_TERRACES_MOVED_TO_ALGEBRA_PRACTICE_IDS]));
    expect(algebraPractice.map((item) => item.practiceId))
      .toEqual(expect.arrayContaining([...INTEGRAL_TERRACES_MOVED_TO_ALGEBRA_PRACTICE_IDS]));
    expect(new Set(
      integralPractice
        .filter((item) => item.parameters.topic_contract_id === 'integrals_partial_fractions')
        .map((item) => item.skillTargetId),
    )).toEqual(new Set(['p3_int_partial_fractions']));
  });

  it('prevents the incorrect partial-fractions identity from returning', () => {
    const fieldGuideText = topicText('integration-gardens');
    const partialFractionPractice = contractedIntegralPractice()
      .find((item) => item.practiceId === 'gen_integrals_partial_fractions_0001');
    const incorrectIdentity = '\\frac{3x+1}{(x-1)(x+2)}=\\frac1{x-1}+\\frac2{x+2}';

    expect(fieldGuideText).not.toContain(incorrectIdentity);
    expect(fieldGuideText).toContain('\\frac{3x}{(x-1)(x+2)}=\\frac1{x-1}+\\frac2{x+2}');
    expect(partialFractionPractice?.prompt).not.toContain('(3x + 1)/((x - 1)(x + 2)) = 1/(x - 1) + 2/(x + 2)');
    expect(partialFractionPractice?.prompt).toContain('Given 3x/((x - 1)(x + 2)) = 1/(x - 1) + 2/(x + 2)');
  });

  it('includes definite substitution with changed limits', () => {
    const substitutionPractice = contractedIntegralPractice()
      .filter((item) => item.parameters.topic_contract_id === 'integrals_substitution');
    const changedLimits = substitutionPractice.find((item) => item.practiceId === 'gen_integrals_substitution_0003');

    expect(changedLimits?.prompt).toContain('changing the limits');
    expect(changedLimits?.workedSolution.join('\n')).toContain('When x = 0, u = 1. When x = 1, u = 2.');
    expect(changedLimits?.answer).toBe('15/4');
  });

  it('removes old broad integration warm-ups from runtime and documents their quarantine IDs', () => {
    const runtimeIds = new Set(runtimePractice.map((item) => item.practiceId));
    const integralRuntimeIds = new Set(getGeneratedPracticeForRegion(runtimePractice, 'integration-gardens', 'p3').map((item) => item.practiceId));

    for (const practiceId of INTEGRAL_TERRACES_QUARANTINED_RUNTIME_PRACTICE_IDS) {
      expect(runtimeIds.has(practiceId), practiceId).toBe(false);
      expect(integralRuntimeIds.has(practiceId), practiceId).toBe(false);
    }
  });

  it('keeps cross-region calculus, logs, trig, and algebra boundaries intact', () => {
    const integralText = `${topicText('integration-gardens')}\n${contractedIntegralPractice().map((item) => item.prompt).join('\n')}`.toLowerCase();
    const calculusText = topicText('calculus-cliffs');
    const logText = topicText('logarithm-grove');
    const trigText = topicText('trig-observatory');

    expect(integralText).toContain('integrate e^(2x + 3)');
    expect(integralText).toContain('integrate sin(3x + pi/4)');
    expect(integralText).toContain('partial fractions');
    expect(integralText).toContain('tan^{-1}');
    expect(integralText).toContain('changing the limits');
    expect(integralText).toContain('integration by parts');
    expect(CALCULUS_CLIFFS_TOPIC_ORDER).not.toContain('integrals_exponential_logarithmic');
    expect(LOGARITHM_OBSERVATORY_TOPIC_ORDER).not.toContain('integrals_exponential_logarithmic');
    expect(TRIGONOMETRY_SPIRE_TOPIC_ORDER).not.toContain('integrals_trig_identities');
    expect(ALGEBRA_VAULT_TOPIC_ORDER).not.toContain('integrals_partial_fractions');
    expect(calculusText).toContain('differentiate');
    expect(logText).not.toContain('integral');
    expect(trigText).not.toContain('integral');
  });
});
