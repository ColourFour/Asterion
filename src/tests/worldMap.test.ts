import { describe, expect, it } from 'vitest';
import type { NormalizedQuestion } from '../types';
import { filterQuestionsForRegion, isP3Question, matchRegionForLabels, matchRegionForQuestion, P3_ASTRAL_ACADEMY } from '../lib/worldMap';

function question(id: string, topic: string, subtopic?: string): NormalizedQuestion {
  return {
    id,
    paperFamily: 'p3',
    displayTopic: topic,
    displaySubtopic: subtopic,
    deepseek: { hasError: false, topic, subtopic },
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
    expect(matchRegionForLabels(['partial_fractions'])?.name).toBe('Algebra Forge');
    expect(matchRegionForLabels(['logarithmic functions'])?.name).toBe('Logarithm Grove');
    expect(matchRegionForLabels(['trig identities'])?.name).toBe('Trig Observatory');
  });

  it('prefers specific complex labels over generic modulus matching', () => {
    expect(matchRegionForLabels(['modulus and argument'])?.name).toBe('Complex Harbor');
  });

  it('filters selected-region practice questions without crashing on empty regions', () => {
    const algebra = P3_ASTRAL_ACADEMY.regions.find((region) => region.name === 'Algebra Forge')!;
    const vector = P3_ASTRAL_ACADEMY.regions.find((region) => region.name === 'Vector Workshop')!;
    const questions = [question('a', 'Algebra', 'binomial_expansion'), question('b', 'Trigonometry')];

    expect(filterQuestionsForRegion(questions, algebra).map((item) => item.id)).toEqual(['a']);
    expect(filterQuestionsForRegion(questions, vector)).toEqual([]);
  });

  it('matches from DeepSeek and local labels on normalized questions', () => {
    expect(matchRegionForQuestion(question('d', 'Unclassified', 'trigonometric identities'))?.name).toBe('Trig Observatory');
    expect(matchRegionForQuestion({ ...question('e', 'Unclassified'), localTopic: 'logarithmic_functions', deepseek: { hasError: true } })?.name).toBe('Logarithm Grove');
  });

  it('filters P3 case-insensitively without including other paper families', () => {
    expect(isP3Question({ ...question('p3', 'Algebra'), paperFamily: 'P3' })).toBe(true);
    expect(isP3Question({ ...question('p1', 'Algebra'), paperFamily: 'p1' })).toBe(false);
  });
});
