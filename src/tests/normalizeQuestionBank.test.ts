import { describe, expect, it } from 'vitest';
import { normalizeQuestionBank } from '../lib/normalizeQuestionBank';

describe('normalizeQuestionBank', () => {
  it('prefers valid DeepSeek labels while preserving local labels', () => {
    const questions = normalizeQuestionBank(
      { questions: [{ id: 'q1', topic: 'Algebra', difficulty: 'core', image_path: 'p3/a/questions/q1.png', marks: 6 }] },
      { q1: { topic: 'Complex numbers', difficulty: 'stretch', confidence: 0.91 } },
    );

    expect(questions[0].displayTopic).toBe('Complex numbers');
    expect(questions[0].localTopic).toBe('Algebra');
    expect(questions[0].deepseek.topic).toBe('Complex numbers');
    expect(questions[0].displayDifficulty).toBe('stretch');
  });

  it('falls back to local labels when sidecar contains an error', () => {
    const questions = normalizeQuestionBank(
      [{ id: 'q2', local_topic: 'Trigonometry', difficulty: 'core' }],
      { q2: { error: 'parse failed', topic: 'error' } },
    );

    expect(questions[0].displayTopic).toBe('Trigonometry');
    expect(questions[0].deepseek.hasError).toBe(true);
  });
});
