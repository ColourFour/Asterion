import { describe, expect, it } from 'vitest';
import type { GeneratedPracticeItem } from '../lib/generatedPractice';
import { getGeneratedPracticeByTopic, getGeneratedPracticeForRegion, orderGeneratedPracticeForFieldGuideTopic } from '../lib/generatedPractice';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import type { TeachingSnippet } from '../lib/teachingSnippets';
import { getTeachingSnippetsByTopic, getTeachingSnippetsForRegion } from '../lib/teachingSnippets';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove')!;
const regionFixtureTopics: Record<string, string> = {
  'algebra-forge': 'binomial_expansion',
  'logarithm-grove': 'logarithms_and_exponentials',
  'trig-observatory': 'trigonometry',
  'complex-harbor': 'complex_numbers',
  'calculus-cliffs': 'differentiation',
  'integration-gardens': 'integration',
  'vector-workshop': 'vectors',
  'numerical-mines': 'numerical_methods',
  'differential-shrine': 'differential_equations',
};

function practice(overrides: Partial<GeneratedPracticeItem> = {}): GeneratedPracticeItem {
  return {
    practiceId: 'gen_log_pass',
    generatorFamily: 'logarithms_and_exponentials.log_equation_basic',
    paperFamily: 'p3',
    topic: 'logarithms_and_exponentials',
    skillTargetId: 'p3_log_laws_equations',
    snippetIds: ['p3-log-laws-001'],
    regionIds: ['logarithm-grove'],
    prompt: 'Solve ln(x) + ln(2) = ln(10).',
    answer: 'x = 5',
    workedSolution: ['Use the product law.', 'ln(2x) = ln(10), so x = 5.'],
    parameters: {},
    sequenceRole: 'first_step',
    verification: { status: 'pass', method: 'deterministic', verifier: 'content_lab_schema_v2' },
    difficultyBand: 'easy',
    reviewStatus: 'teacher_reviewed',
    ...overrides,
  };
}

function snippet(overrides: Partial<TeachingSnippet> = {}): TeachingSnippet {
  return {
    snippetId: 'p3-log-laws-001',
    paperFamily: 'p3',
    topics: ['logarithms_and_exponentials'],
    regionIds: ['logarithm-grove'],
    title: 'Combine before solving',
    studentGoal: 'Use log laws safely.',
    body: 'Combine terms only when the base matches.',
    steps: ['Check the base.', 'Combine into one logarithm.'],
    examMove: 'Use one logarithm on each side before cancelling.',
    commonTrap: 'Splitting a sum inside a logarithm.',
    reviewStatus: 'teacher_reviewed',
    source: 'teacher_authored',
    prerequisites: [],
    microSteps: [],
    commonMistakes: [],
    workedExamples: [],
    sourceQuestionIds: [],
    sourceSkillTargetIds: [],
    relatedSkillTargetIds: [],
    ...overrides,
  };
}

describe('region content selection', () => {
  it('keeps failed, blocked, and unreviewed generated practice out of runtime region selection', () => {
    const selected = getGeneratedPracticeForRegion([
      practice(),
      practice({ practiceId: 'gen_log_failed', verification: { status: 'fail', method: 'deterministic', verifier: 'content_lab_schema_v2' } }),
      practice({ practiceId: 'gen_log_candidate', reviewStatus: 'candidate' }),
      practice({ practiceId: 'gen_log_blocked', reviewStatus: 'blocked' }),
    ], logRegion.id, 'p3');

    expect(selected.map((item) => item.practiceId)).toEqual(['gen_log_pass']);
  });

  it('does not use generated practice difficulty bands for runtime region grouping', () => {
    const selected = getGeneratedPracticeForRegion([
      practice({ practiceId: 'log-easy', difficultyBand: 'easy' }),
      practice({ practiceId: 'log-hard', difficultyBand: 'hard' }),
      practice({ practiceId: 'log-no-sequence', difficultyBand: 'easy', sequenceRole: undefined }),
    ], logRegion.id, 'p3');

    expect(selected.map((item) => item.practiceId)).toEqual(['log-easy', 'log-hard']);
  });

  it('selects only reviewed teaching snippets for the requested region', () => {
    const selected = getTeachingSnippetsForRegion([
      snippet(),
      snippet({ snippetId: 'p3-log-draft', reviewStatus: 'needs_review' }),
      snippet({ snippetId: 'p3-trig-reviewed', topics: ['trigonometry'], regionIds: ['trig-observatory'] }),
    ], 'p3', logRegion);

    expect(selected.map((item) => item.snippetId)).toEqual(['p3-log-laws-001']);
  });

  it('resolves reviewed snippets for every current P3 region', () => {
    const snippets = P3_ASTRAL_ACADEMY.regions.map((region) => snippet({
      snippetId: `${region.id}-snippet`,
      topics: [regionFixtureTopics[region.id]],
      regionIds: [region.id],
    }));

    for (const region of P3_ASTRAL_ACADEMY.regions) {
      expect(() => getTeachingSnippetsForRegion(snippets, 'p3', region)).not.toThrow();
      expect(getTeachingSnippetsForRegion(snippets, 'p3', region).length, region.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('matches teaching snippets through common topic aliases', () => {
    const snippets = [
      snippet({ snippetId: 'log-alias', topics: ['logarithms_and_exponentials'], regionIds: ['logarithm-grove'] }),
      snippet({ snippetId: 'trig-alias', topics: ['trigonometry'], regionIds: ['trig-observatory'] }),
      snippet({ snippetId: 'binomial-alias', topics: ['binomial_expansion'], regionIds: ['algebra-forge'] }),
      snippet({ snippetId: 'diff-alias', topics: ['differentiation'], regionIds: ['calculus-cliffs'] }),
      snippet({ snippetId: 'integration-alias', topics: ['integration'], regionIds: ['integration-gardens'] }),
      snippet({ snippetId: 'complex-alias', topics: ['complex_numbers'], regionIds: ['complex-harbor'] }),
      snippet({ snippetId: 'vector-alias', topics: ['vectors'], regionIds: ['vector-workshop'] }),
    ].sort((a, b) => a.snippetId.localeCompare(b.snippetId));

    expect(getTeachingSnippetsByTopic(snippets, 'p3', 'logs').map((item) => item.snippetId)).toContain('log-alias');
    expect(getTeachingSnippetsByTopic(snippets, 'p3', 'trig').map((item) => item.snippetId)).toContain('trig-alias');
    expect(getTeachingSnippetsByTopic(snippets, 'p3', 'binomial').map((item) => item.snippetId)).toContain('binomial-alias');
    expect(getTeachingSnippetsByTopic(snippets, 'p3', 'derivative').map((item) => item.snippetId)).toContain('diff-alias');
    expect(getTeachingSnippetsByTopic(snippets, 'p3', 'integrals').map((item) => item.snippetId)).toContain('integration-alias');
    expect(getTeachingSnippetsByTopic(snippets, 'p3', 'complex numbers').map((item) => item.snippetId)).toContain('complex-alias');
    expect(getTeachingSnippetsByTopic(snippets, 'p3', 'vector').map((item) => item.snippetId)).toContain('vector-alias');
  });

  it('returns reviewed generated warm-ups where available and empty selections elsewhere', () => {
    const practiceItems = [
      practice({ practiceId: 'log-practice', topic: 'logarithms_and_exponentials', regionIds: ['logarithm-grove'] }),
      practice({
        practiceId: 'binomial-practice',
        generatorFamily: 'binomial_expansion.first_terms_and_coefficient',
        topic: 'binomial_expansion',
        skillTargetId: 'p3_alg_binomial_terms_coefficients',
        regionIds: ['algebra-forge'],
      }),
      practice({ practiceId: 'trig-failed', topic: 'trigonometry', regionIds: ['trig-observatory'], verification: { status: 'fail', method: 'deterministic', verifier: 'content_lab_schema_v2' } }),
    ];

    expect(getGeneratedPracticeForRegion(practiceItems, 'logarithm-grove', 'p3').length).toBeGreaterThan(0);
    expect(getGeneratedPracticeForRegion(practiceItems, 'algebra-forge', 'p3').length).toBeGreaterThan(0);
    expect(getGeneratedPracticeForRegion(practiceItems, 'trig-observatory', 'p3')).toEqual([]);
    expect(getGeneratedPracticeForRegion(practiceItems, 'integration-gardens', 'p3')).toEqual([]);
    expect(getGeneratedPracticeForRegion(practiceItems, 'numerical-mines', 'p3')).toEqual([]);
  });

  it('matches generated warm-up practice through available aliases only', () => {
    const selected = [
      practice({ practiceId: 'log-practice', topic: 'logarithms_and_exponentials', regionIds: ['logarithm-grove'] }),
      practice({
        practiceId: 'binomial-practice',
        generatorFamily: 'binomial_expansion.first_terms_and_coefficient',
        topic: 'binomial_expansion',
        skillTargetId: 'p3_alg_binomial_terms_coefficients',
        regionIds: ['algebra-forge'],
        prompt: 'Expand (1 + x)^3 up to x^2.',
        answer: '1 + 3x + 3x^2',
      }),
      practice({ practiceId: 'candidate-log', reviewStatus: 'candidate' }),
    ];

    expect(getGeneratedPracticeByTopic(selected, 'logs', 'p3').map((item) => item.practiceId)).toEqual(['log-practice']);
    expect(getGeneratedPracticeByTopic(selected, 'binomial', 'p3').map((item) => item.practiceId)).toEqual(['binomial-practice']);
  });

  it('orders guided practice by the current Field Guide topic when reviewed content exists', () => {
    const topic = FIELD_GUIDE_TOPICS_BY_REGION['algebra-forge'].find((item) => item.id === 'binomial-expansions')!;
    const selected = orderGeneratedPracticeForFieldGuideTopic([
      practice({
        practiceId: 'algebra-structure',
        generatorFamily: 'algebra.structure_rearrangement_basic',
        topic: 'algebra',
        regionIds: ['algebra-forge'],
        skillTargetId: 'p3_alg_structure_rearrangement',
      }),
      practice({
        practiceId: 'binomial-first',
        generatorFamily: 'binomial_expansion.first_terms_and_coefficient',
        topic: 'binomial_expansion',
        regionIds: ['algebra-forge'],
        skillTargetId: 'p3_alg_binomial_terms_coefficients',
      }),
      practice({
        practiceId: 'binomial-validity',
        generatorFamily: 'algebra.binomial_validity_range',
        topic: 'binomial_expansion',
        regionIds: ['algebra-forge'],
        skillTargetId: 'p3_alg_binomial_validity',
        sequenceRole: 'complete_step',
      }),
    ], topic);

    expect(selected.fallbackReason).toBeUndefined();
    expect(selected.exactMatchCount).toBe(2);
    expect(selected.items.map((item) => item.practiceId)).toEqual([
      'binomial-first',
      'binomial-validity',
      'algebra-structure',
    ]);
  });

  it('keeps region fallback and explains when the Field Guide topic has no guided match', () => {
    const topic = FIELD_GUIDE_TOPICS_BY_REGION['algebra-forge'].find((item) => item.id === 'binomial-expansions')!;
    const selected = orderGeneratedPracticeForFieldGuideTopic([
      practice({
        practiceId: 'algebra-structure-complete',
        generatorFamily: 'algebra.structure_rearrangement_basic',
        topic: 'algebra',
        regionIds: ['algebra-forge'],
        sequenceRole: 'complete_step',
      }),
      practice({
        practiceId: 'algebra-structure-first',
        generatorFamily: 'algebra.structure_rearrangement_basic',
        topic: 'algebra',
        regionIds: ['algebra-forge'],
        sequenceRole: 'first_step',
      }),
    ], topic);

    expect(selected.exactMatchCount).toBe(0);
    expect(selected.fallbackReason).toContain('Binomial Expansions');
    expect(selected.items.map((item) => item.practiceId)).toEqual([
      'algebra-structure-first',
      'algebra-structure-complete',
    ]);
  });

  it('keeps topic ordering behind generated-practice runtime review gates', () => {
    const topic = FIELD_GUIDE_TOPICS_BY_REGION['algebra-forge'].find((item) => item.id === 'binomial-expansions')!;
    const selected = orderGeneratedPracticeForFieldGuideTopic([
      practice({
        practiceId: 'candidate-binomial',
        generatorFamily: 'binomial_expansion.first_terms_and_coefficient',
        topic: 'binomial_expansion',
        regionIds: ['algebra-forge'],
        reviewStatus: 'candidate',
      }),
      practice({
        practiceId: 'failed-binomial',
        generatorFamily: 'binomial_expansion.first_terms_and_coefficient',
        topic: 'binomial_expansion',
        regionIds: ['algebra-forge'],
        verification: { status: 'fail', method: 'deterministic', verifier: 'content_lab_schema_v2' },
      }),
      practice({
        practiceId: 'unsafe-binomial',
        generatorFamily: 'binomial_expansion.first_terms_and_coefficient',
        topic: 'binomial_expansion',
        regionIds: ['algebra-forge'],
        skillTargetId: 'unsafe_unmapped_skill',
      }),
      practice({
        practiceId: 'reviewed-binomial',
        generatorFamily: 'binomial_expansion.first_terms_and_coefficient',
        topic: 'binomial_expansion',
        regionIds: ['algebra-forge'],
      }),
    ], topic);

    expect(selected.items.map((item) => item.practiceId)).toEqual(['reviewed-binomial']);
    expect(selected.exactMatchCount).toBe(1);
  });

  it('accepts both teacher-reviewed and published guided practice while excluding drafts', () => {
    const topic = FIELD_GUIDE_TOPICS_BY_REGION['logarithm-grove'].find((item) => item.id === 'log-equations-domain')!;
    const selected = orderGeneratedPracticeForFieldGuideTopic([
      practice({
        practiceId: 'published-log',
        generatorFamily: 'logarithms_and_exponentials.log_equation_basic',
        reviewStatus: 'published',
      }),
      practice({
        practiceId: 'teacher-reviewed-log',
        generatorFamily: 'logarithms_and_exponentials.log_equation_basic',
        reviewStatus: 'teacher_reviewed',
      }),
      practice({
        practiceId: 'draft-log',
        generatorFamily: 'logarithms_and_exponentials.log_equation_basic',
        reviewStatus: 'needs_review',
      }),
    ], topic);

    expect(selected.items.map((item) => item.practiceId)).toEqual([
      'published-log',
      'teacher-reviewed-log',
    ]);
    expect(selected.exactMatchCount).toBe(2);
  });

  it('uses same-region fallback items after region filtering when no exact topic match exists', () => {
    const topic = FIELD_GUIDE_TOPICS_BY_REGION['integration-gardens'].find((item) => item.id === 'method-setup')!;
    const sameRegionItems = getGeneratedPracticeForRegion([
      practice({
        practiceId: 'integral-area-fallback',
        generatorFamily: 'integration.definite_area_basic',
        topic: 'integration',
        regionIds: ['integration-gardens'],
        skillTargetId: 'p3_int_definite_improper_area',
      }),
      practice({
        practiceId: 'other-region-exact-method',
        generatorFamily: 'integration.method_setup_basic',
        topic: 'algebra',
        regionIds: ['algebra-forge'],
        skillTargetId: 'p3_int_method_choice',
      }),
    ], 'integration-gardens', 'p3');
    const selected = orderGeneratedPracticeForFieldGuideTopic(sameRegionItems, topic);

    expect(selected.exactMatchCount).toBe(0);
    expect(selected.fallbackReason).toContain('Method Setup');
    expect(selected.items.map((item) => item.practiceId)).toEqual(['integral-area-fallback']);
  });

  it('keeps generated-practice ordering deterministic and ignores deprecated difficulty bands', () => {
    const topic = FIELD_GUIDE_TOPICS_BY_REGION['numerical-mines'].find((item) => item.id === 'iteration-formula')!;
    const selected = orderGeneratedPracticeForFieldGuideTopic([
      practice({
        practiceId: 'z-complete-hard',
        generatorFamily: 'numerical_methods.iteration_formula_basic',
        topic: 'numerical_methods',
        regionIds: ['numerical-mines'],
        skillTargetId: 'p3_num_iteration_formula',
        sequenceRole: 'complete_step',
        difficultyBand: 'easy',
      }),
      practice({
        practiceId: 'b-first-hard',
        generatorFamily: 'numerical_methods.iteration_formula_basic',
        topic: 'numerical_methods',
        regionIds: ['numerical-mines'],
        skillTargetId: 'p3_num_iteration_formula',
        sequenceRole: 'first_step',
        difficultyBand: 'hard',
      }),
      practice({
        practiceId: 'a-first-easy',
        generatorFamily: 'numerical_methods.iteration_formula_basic',
        topic: 'numerical_methods',
        regionIds: ['numerical-mines'],
        skillTargetId: 'p3_num_iteration_formula',
        sequenceRole: 'first_step',
        difficultyBand: 'easy',
      }),
    ], topic);

    expect(selected.items.map((item) => item.practiceId)).toEqual([
      'a-first-easy',
      'b-first-hard',
      'z-complete-hard',
    ]);
    expect(selected.exactMatchCount).toBe(3);
  });

  it('promotes exact topic matches across representative current regions', () => {
    const cases = [
      {
        regionId: 'algebra-forge',
        topicId: 'binomial-expansions',
        generatorFamily: 'binomial_expansion.first_terms_and_coefficient',
        topic: 'binomial_expansion',
        skillTargetId: 'p3_alg_binomial_terms_coefficients',
      },
      {
        regionId: 'logarithm-grove',
        topicId: 'log-equations-domain',
        generatorFamily: 'logarithms_and_exponentials.log_equation_basic',
        topic: 'logarithms_and_exponentials',
        skillTargetId: 'p3_log_laws_equations',
      },
      {
        regionId: 'complex-harbor',
        topicId: 'roots',
        generatorFamily: 'complex_numbers.roots_basic',
        topic: 'complex_numbers',
        skillTargetId: 'p3_complex_roots_powers',
      },
      {
        regionId: 'integration-gardens',
        topicId: 'method-setup',
        generatorFamily: 'integration.method_setup_basic',
        topic: 'integration',
        skillTargetId: 'p3_int_method_choice',
      },
      {
        regionId: 'numerical-mines',
        topicId: 'iteration-formula',
        generatorFamily: 'numerical_methods.iteration_formula_basic',
        topic: 'numerical_methods',
        skillTargetId: 'p3_num_iteration_formula',
      },
    ];

    for (const item of cases) {
      const topic = FIELD_GUIDE_TOPICS_BY_REGION[item.regionId].find((candidate) => candidate.id === item.topicId)!;
      const selected = orderGeneratedPracticeForFieldGuideTopic([
        practice({
          practiceId: `${item.regionId}-fallback`,
          generatorFamily: 'algebra.structure_rearrangement_basic',
          topic: 'algebra',
          regionIds: [item.regionId],
          skillTargetId: 'p3_alg_structure_rearrangement',
        }),
        practice({
          practiceId: `${item.regionId}-exact`,
          generatorFamily: item.generatorFamily,
          topic: item.topic,
          regionIds: [item.regionId],
          skillTargetId: item.skillTargetId,
        }),
      ], topic);

      expect(selected.items[0]?.practiceId, `${item.regionId}/${item.topicId}`).toBe(`${item.regionId}-exact`);
      expect(selected.exactMatchCount, `${item.regionId}/${item.topicId}`).toBe(1);
    }
  });
});
