import { describe, expect, it } from 'vitest';
import { selectNextQuestion } from '../lib/adaptiveEngine';
import type { NormalizedQuestion } from '../types';

function question(id: string, topic: string, difficulty = 'core', marks = 6): NormalizedQuestion {
  return {
    id,
    paperFamily: 'p3',
    displayTopic: topic,
    displayDifficulty: difficulty,
    marksAvailable: marks,
    deepseek: { hasError: true },
    questionImagePaths: [],
    markSchemeImagePaths: [],
    questionImageUrls: [],
    markSchemeImageUrls: [],
    raw: { local: {} },
  };
}

describe('selectNextQuestion', () => {
  it('prefers the target topic', () => {
    const selected = selectNextQuestion([question('a', 'Algebra'), question('b', 'Complex numbers')], {
      mode: 'target_topic',
      targetTopic: 'Complex numbers',
      attempts: [],
      topicProfiles: {},
    });

    expect(selected?.id).toBe('b');
  });

  it('avoids the current question', () => {
    const selected = selectNextQuestion([question('a', 'Algebra'), question('b', 'Algebra')], {
      mode: 'start',
      attempts: [],
      topicProfiles: {},
      currentQuestionId: 'a',
    });

    expect(selected?.id).toBe('b');
  });
});
