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
    questionImageRawPaths: [`p3/test/questions/${id}.png`],
    markSchemeImageRawPaths: [`p3/test/mark_scheme/${id}.png`],
    questionImagePaths: [`p3/test/questions/${id}.png`],
    markSchemeImagePaths: [`p3/test/mark_scheme/${id}.png`],
    questionImageUrls: [`/assets/test/questions/${id}.png`],
    markSchemeImageUrls: [`/assets/test/mark_scheme/${id}.png`],
    questionImageCandidates: [[`/assets/test/questions/${id}.png`]],
    markSchemeImageCandidates: [[`/assets/test/mark_scheme/${id}.png`]],
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

  it('does not select questions blocked from practice', () => {
    const selected = selectNextQuestion([
      { ...question('a', 'Algebra'), trainingBlockers: ['Missing canonical mark scheme.'] },
      question('b', 'Algebra'),
    ], {
      mode: 'start',
      attempts: [],
      topicProfiles: {},
    });

    expect(selected?.id).toBe('b');
  });
});
