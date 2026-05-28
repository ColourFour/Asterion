import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALGEBRA_VAULT_TOPIC_ORDER } from '../data/algebraVaultContent';
import { CALCULUS_CLIFFS_TOPIC_ORDER } from '../data/calculusCliffsContent';
import { DIFFERENTIAL_SHRINE_TOPIC_ORDER } from '../data/differentialShrineContent';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import { INTEGRAL_TERRACES_TOPIC_ORDER } from '../data/integralTerracesContent';
import {
  ITERATION_FORGE_OUT_OF_SCOPE_TERMS,
  ITERATION_FORGE_QUARANTINED_RUNTIME_PRACTICE_IDS,
  ITERATION_FORGE_SKILL_PRACTICE_ALIGNMENT,
  ITERATION_FORGE_TOPIC_ORDER,
} from '../data/iterationForgeContent';
import { LOGARITHM_OBSERVATORY_TOPIC_ORDER } from '../data/logarithmObservatoryContent';
import { TRIGONOMETRY_SPIRE_TOPIC_ORDER } from '../data/trigonometrySpireContent';
import { VECTORS_GATE_TOPIC_ORDER } from '../data/vectorsGateContent';
import {
  getGeneratedPracticeForRegion,
  normalizeGeneratedPracticeData,
  orderGeneratedPracticeForFieldGuideTopic,
} from '../lib/generatedPractice';

const runtimePractice = normalizeGeneratedPracticeData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/generated_practice_bank.json`, 'utf8')),
);

const expectedIterationTitles = [
  'Approximation by Change of Sign',
  'Graph Proof of Root',
  'Finding Roots Using Iteration',
  'Convergence of Iteration',
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

function contractedIterationPractice() {
  const approved = new Set<string>(ITERATION_FORGE_TOPIC_ORDER);
  return getGeneratedPracticeForRegion(runtimePractice, 'numerical-mines', 'p3')
    .filter((item) => approved.has(String(item.parameters.topic_contract_id)));
}

describe('Iteration Forge root approximation and iteration content contract', () => {
  it('exposes exactly the four approved Iteration Forge Field Guide topic IDs in order', () => {
    const iterationTopics = FIELD_GUIDE_TOPICS_BY_REGION['numerical-mines'];

    expect(iterationTopics.map((topic) => topic.id)).toEqual([...ITERATION_FORGE_TOPIC_ORDER]);
    expect(iterationTopics.map((topic) => topic.title)).toEqual(expectedIterationTitles);
    for (const topic of iterationTopics) {
      expect(topic.skillIds).toEqual([topic.id]);
      expect(topic.examples.length, topic.id).toBe(1);
      expect(topic.examples[0]?.workedLines.length, topic.id).toBeGreaterThanOrEqual(3);
      const takeaway = topic.examples[0]?.takeaway ?? [];
      expect(takeaway[takeaway.length - 1], topic.id).toContain('Skill Check');
    }
  });

  it('does not expose non-approved numerical-method or unrelated-region topics', () => {
    const iterationTopics = FIELD_GUIDE_TOPICS_BY_REGION['numerical-mines'];
    const metadata = iterationTopics
      .flatMap((topic) => [topic.id, topic.title, topic.purpose, topic.description, ...topic.skillIds])
      .join(' ')
      .toLowerCase();

    expect(iterationTopics.map((topic) => topic.id)).not.toEqual(expect.arrayContaining([
      'accuracy-rounding',
      'iteration-formula',
      'sign-change',
      'newton_raphson',
    ]));
    for (const term of ITERATION_FORGE_OUT_OF_SCOPE_TERMS) {
      expect(metadata, term).not.toContain(term);
    }
    expect(ITERATION_FORGE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...CALCULUS_CLIFFS_TOPIC_ORDER]));
    expect(ITERATION_FORGE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...INTEGRAL_TERRACES_TOPIC_ORDER]));
    expect(ITERATION_FORGE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...DIFFERENTIAL_SHRINE_TOPIC_ORDER]));
    expect(ITERATION_FORGE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...LOGARITHM_OBSERVATORY_TOPIC_ORDER]));
    expect(ITERATION_FORGE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...TRIGONOMETRY_SPIRE_TOPIC_ORDER]));
    expect(ITERATION_FORGE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...VECTORS_GATE_TOPIC_ORDER]));
    expect(ITERATION_FORGE_TOPIC_ORDER).not.toEqual(expect.arrayContaining([...ALGEBRA_VAULT_TOPIC_ORDER]));
  });

  it('documents reviewed Skill Check coverage for every approved Iteration Forge topic', () => {
    const runtimeIds = new Set(runtimePractice.map((item) => item.practiceId));

    expect(ITERATION_FORGE_SKILL_PRACTICE_ALIGNMENT.map((item) => item.topicId))
      .toEqual([...ITERATION_FORGE_TOPIC_ORDER]);
    for (const alignment of ITERATION_FORGE_SKILL_PRACTICE_ALIGNMENT) {
      expect(alignment.status, alignment.topicId).toBe('reviewed_runtime');
      expect(alignment.reviewedPracticeIds.length, alignment.topicId).toBeGreaterThanOrEqual(3);
      expect(alignment.candidatePrompt.trim(), alignment.topicId).not.toBe('');
      expect(alignment.expectedAnswer.trim(), alignment.topicId).not.toBe('');
      expect(alignment.authoringNote, alignment.topicId).not.toMatch(/copied|screenshot/i);
      for (const practiceId of alignment.reviewedPracticeIds) {
        expect(runtimeIds.has(practiceId), `${alignment.topicId}/${practiceId}`).toBe(true);
      }
    }
  });

  it('uses reviewed topic-contract practice for every Iteration Field Guide topic', () => {
    const iterationPractice = getGeneratedPracticeForRegion(runtimePractice, 'numerical-mines', 'p3');

    for (const topic of FIELD_GUIDE_TOPICS_BY_REGION['numerical-mines']) {
      const selected = orderGeneratedPracticeForFieldGuideTopic(iterationPractice, topic);

      expect(selected.fallbackReason, topic.id).toBeUndefined();
      expect(selected.exactMatchCount, topic.id).toBeGreaterThanOrEqual(3);
      expect(selected.items.every((item) => item.parameters.topic_contract_id === topic.id), topic.id).toBe(true);
      expect(selected.items.map((item) => item.practiceId), topic.id)
        .not.toEqual(expect.arrayContaining([...ITERATION_FORGE_QUARANTINED_RUNTIME_PRACTICE_IDS]));
    }
  });

  it('keeps Iteration Skill Check on the four approved root and iteration topics', () => {
    const contractedPractice = contractedIterationPractice();
    const approvedTopicIds = new Set<string>(ITERATION_FORGE_TOPIC_ORDER);
    const text = contractedPractice.flatMap((item) => [
      item.practiceId,
      item.generatorFamily,
      item.prompt,
      item.answer,
      item.keyMethod ?? '',
      item.examMove ?? '',
      ...item.workedSolution,
    ]).join('\n').toLowerCase();

    expect(contractedPractice).toHaveLength(17);
    expect(new Set(contractedPractice.map((item) => item.parameters.topic_contract_id))).toEqual(approvedTopicIds);
    expect(contractedPractice.every((item) => approvedTopicIds.has(String(item.parameters.topic_contract_id)))).toBe(true);
    expect(text).toContain('sign change');
    expect(text).toContain('x_(n+1)');
    expect(text).toContain('converge');
    expect(text).toContain('ln(negative)');
    expect(text).not.toMatch(/newton|newton-raphson|integrate|differential equation|complex number|argand|vector line/);
  });

  it('includes required change-of-sign, fixed-point, and convergence practice signals', () => {
    const contractedPractice = contractedIterationPractice();
    const changeOfSign = contractedPractice.filter((item) => item.parameters.topic_contract_id === 'iteration_change_of_sign');
    const fixedPoint = contractedPractice.filter((item) => item.parameters.topic_contract_id === 'iteration_fixed_point_roots');
    const convergence = contractedPractice.filter((item) => item.parameters.topic_contract_id === 'iteration_convergence');

    expect(changeOfSign.some((item) => /f\(0\)|f\(1\)|f\(2\)|f\(3\)/.test(`${item.prompt}\n${item.workedSolution.join('\n')}`))).toBe(true);
    expect(changeOfSign.some((item) => /f\(x\) = 0|table|1 d\.p\./i.test(`${item.prompt}\n${item.workedSolution.join('\n')}`))).toBe(true);
    expect(fixedPoint.some((item) => /x_\(n\+1\)|x_\{n\+1\}/.test(`${item.prompt}\n${item.workedSolution.join('\n')}`))).toBe(true);
    expect(fixedPoint.some((item) => /x_1|x_2|x_3/.test(`${item.answer}\n${item.workedSolution.join('\n')}`))).toBe(true);
    expect(convergence.some((item) => /does not settle|converge|settle/i.test(`${item.answer}\n${item.workedSolution.join('\n')}`))).toBe(true);
    expect(convergence.some((item) => /ln\(negative\)|logarithm invalid|undefined/i.test(`${item.answer}\n${item.workedSolution.join('\n')}`))).toBe(true);
  });

  it('keeps cross-region numerical root approximation boundaries intact', () => {
    const iterationText = `${topicText('numerical-mines')}\n${contractedIterationPractice().map((item) => item.prompt).join('\n')}`.toLowerCase();
    const algebraText = topicText('algebra-forge');
    const logText = topicText('logarithm-grove');
    const trigText = topicText('trig-observatory');
    const calculusText = topicText('calculus-cliffs');
    const integralText = topicText('integration-gardens');
    const differentialText = topicText('differential-shrine');

    expect(iterationText).toContain('sign change');
    expect(iterationText).toContain('graph');
    expect(iterationText).toContain('x_{n+1}');
    expect(iterationText).toContain('convergence');
    expect(algebraText).toContain('solve cubics by factors');
    expect(algebraText).not.toContain('change of sign');
    expect(logText).not.toContain('fixed-point iteration');
    expect(trigText).not.toContain('fixed-point iteration');
    expect(calculusText).not.toContain('change of sign');
    expect(integralText).not.toContain('fixed-point iteration');
    expect(differentialText).not.toContain('fixed-point iteration');
  });

  it('keeps explicitly quarantined Iteration runtime practice out of selection', () => {
    const iterationRuntimeIds = new Set(getGeneratedPracticeForRegion(runtimePractice, 'numerical-mines', 'p3').map((item) => item.practiceId));

    for (const practiceId of ITERATION_FORGE_QUARANTINED_RUNTIME_PRACTICE_IDS) {
      expect(iterationRuntimeIds.has(practiceId), practiceId).toBe(false);
    }
  });
});
