import { describe, expect, it } from 'vitest';
import type { GeneratedPracticeItem } from '../lib/generatedPractice';
import { getGeneratedPracticeByTopic, getGeneratedPracticeForRegion } from '../lib/generatedPractice';
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
    skillTargetId: 'p3-log-equations',
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
        skillTargetId: 'p3_binomial_expansion',
        regionIds: ['algebra-forge'],
        prompt: 'Expand (1 + x)^3 up to x^2.',
        answer: '1 + 3x + 3x^2',
      }),
      practice({ practiceId: 'candidate-log', reviewStatus: 'candidate' }),
    ];

    expect(getGeneratedPracticeByTopic(selected, 'logs', 'p3').map((item) => item.practiceId)).toEqual(['log-practice']);
    expect(getGeneratedPracticeByTopic(selected, 'binomial', 'p3').map((item) => item.practiceId)).toEqual(['binomial-practice']);
  });
});
