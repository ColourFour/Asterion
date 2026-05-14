import { describe, expect, it } from 'vitest';
import type { NormalizedQuestion } from '../types';
import { filterQuestionsForRegion, inferQuestionRouteEvidence, isP3Question, matchRegionForLabels, matchRegionForQuestion, P3_ASTRAL_ACADEMY } from '../lib/worldMap';

function question(id: string, topic: string, subtopic?: string): NormalizedQuestion {
  return {
    id,
    paperFamily: 'p3',
    displayTopic: topic,
    displaySubtopic: subtopic,
    displayDifficulty: 'foundation',
    localDifficulty: 'foundation',
    deepseek: { hasError: false, topic, subtopic, difficulty: 'foundation', normalizedDifficulty: 'foundation' },
    questionImageRawPaths: [],
    markSchemeImageRawPaths: [],
    questionImagePaths: [],
    markSchemeImagePaths: [],
    questionImageUrls: [],
    markSchemeImageUrls: [],
    questionImageCandidates: [],
    markSchemeImageCandidates: [],
    raw: { local: {} },
  };
}

describe('worldMap region matching', () => {
  it('matches forgiving topic and subtopic labels', () => {
    expect(matchRegionForLabels(['partial_fractions'])?.name).toBe('Algebra Vault');
    expect(matchRegionForLabels(['polynomials'])?.name).toBe('Algebra Vault');
    expect(matchRegionForLabels(['functions'])?.name).toBe('Algebra Vault');
    expect(matchRegionForLabels(['logarithmic functions'])?.name).toBe('Logarithm Observatory');
    expect(matchRegionForLabels(['trig identities'])?.name).toBe('Trigonometry Spire');
    expect(matchRegionForLabels(['parametric_equations'])?.name).toBe('Calculus Cliffs');
    expect(matchRegionForLabels(['differential_equations'])?.name).toBe('Differential Shrine');
  });

  it('prefers specific complex labels over generic modulus matching', () => {
    expect(matchRegionForLabels(['modulus and argument'])?.name).toBe('Argand Atrium');
  });

  it('filters selected-region practice questions without crashing on empty regions', () => {
    const algebra = P3_ASTRAL_ACADEMY.regions.find((region) => region.name === 'Algebra Vault')!;
    const vector = P3_ASTRAL_ACADEMY.regions.find((region) => region.name === 'Vectors Gate')!;
    const questions = [question('a', 'Algebra', 'binomial_expansion'), question('b', 'Trigonometry')];

    expect(filterQuestionsForRegion(questions, algebra).map((item) => item.id)).toEqual(['a']);
    expect(filterQuestionsForRegion(questions, vector)).toEqual([]);
  });

  it('matches from DeepSeek and local labels on normalized questions', () => {
    expect(matchRegionForQuestion(question('d', 'Unclassified', 'trigonometric identities'))?.name).toBe('Trigonometry Spire');
    expect(matchRegionForQuestion({ ...question('e', 'Unclassified'), localTopic: 'logarithmic_functions', deepseek: { hasError: true } })?.name).toBe('Logarithm Observatory');
  });

  it('filters P3 case-insensitively without including other paper families', () => {
    expect(isP3Question({ ...question('p3', 'Algebra'), paperFamily: 'P3' })).toBe(true);
    expect(isP3Question({ ...question('p1', 'Algebra'), paperFamily: 'p1' })).toBe(false);
  });

  it('keeps region routing stable when only difficulty metadata changes', () => {
    const base = question('d', 'Unclassified', 'trigonometric identities');
    const changedDifficulty = {
      ...base,
      displayDifficulty: 'challenge',
      localDifficulty: 'challenge',
      deepseek: { ...base.deepseek, difficulty: 'challenge', normalizedDifficulty: 'challenge' },
      raw: { ...base.raw, local: { difficulty: 'challenge' } },
    };
    const trig = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'trig-observatory')!;

    expect(matchRegionForQuestion(base)?.id).toBe('trig-observatory');
    expect(matchRegionForQuestion(changedDifficulty)?.id).toBe('trig-observatory');
    expect(filterQuestionsForRegion([base, changedDifficulty], trig).map((item) => item.id)).toEqual(['d', 'd']);
  });

  it('does not accept invalid routed region IDs as clean runtime routes', () => {
    const invalid = {
      ...question('invalid-route', 'Algebra'),
      topicRouting: {
        primaryTopicId: '9709_p3_topic_algebra',
        mappedRegionId: 'algebra-vault',
        recordSource: 'topic-routing-sidecar' as const,
      },
    };

    expect(inferQuestionRouteEvidence(invalid)).toMatchObject({
      status: 'missing-route',
      source: 'topic-routing',
      reasonCodes: ['unmapped-topic-routing-id'],
      displayRegionId: 'algebra-forge',
    });
    expect(matchRegionForQuestion(invalid)?.id).toBe('algebra-forge');
    expect(filterQuestionsForRegion([invalid], P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'algebra-forge')!)).toEqual([invalid]);
  });
});
