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

  it('normalizes the real-shaped bank record and sidecar enrichment keyed by question_id', () => {
    const questions = normalizeQuestionBank(
      {
        schema_name: 'exam_bank.question_bank',
        schema_version: 1,
        record_count: 1,
        questions: [{
          question_id: '15autumn25_q01',
          paper: '15autumn25',
          paper_family: 'p3',
          question_number: '1',
          topic: 'algebra',
          notes: { subtopic: 'partial_fractions' },
          question_solution_marks: 7,
          question_image_path: 'p3/15autumn25/questions/q01.png',
          mark_scheme_image_path: 'p3/15autumn25/mark_scheme/q01.png',
        }],
      },
      {
        schema_name: 'exam_bank.deepseek_sidecar',
        schema_version: 1,
        record_count: 1,
        enrichments: {
          '15autumn25_q01': {
            deepseek_topic: 'partial fractions',
            deepseek_topic_normalized: 'partial_fractions',
            deepseek_subtopic: 'algebraic manipulation',
            deepseek_difficulty: 'medium',
            deepseek_difficulty_normalized: 'core',
            deepseek_confidence: 'high',
            topic_reconciliation_status: 'match',
            final_review_required: false,
          },
        },
      },
    );

    expect(questions[0].id).toBe('15autumn25_q01');
    expect(questions[0].paperFamily).toBe('p3');
    expect(questions[0].localSubtopic).toBe('partial_fractions');
    expect(questions[0].marksAvailable).toBe(7);
    expect(questions[0].deepseek.normalizedTopic).toBe('partial_fractions');
    expect(questions[0].displayDifficulty).toBe('core');
    expect(questions[0].questionImageRawPaths).toEqual(['p3/15autumn25/questions/q01.png']);
    expect(questions[0].questionImageUrls).toEqual(['/assets/15autumn25/questions/q01.png']);
    expect(questions[0].questionImageCandidates[0]).toEqual(['/assets/15autumn25/questions/q01.png', '/assets/questions/p3/15autumn25/questions/q01.png', '/assets/questions/15autumn25/questions/q01.png']);
    expect(questions[0].markSchemeImageUrls).toEqual(['/assets/15autumn25/mark_scheme/q01.png']);
  });

  it('preserves and resolves multi-image arrays in order', () => {
    const questions = normalizeQuestionBank(
      { questions: [{ question_id: 'q3', paper_family: 'p3', topic: 'trigonometry', question_image_paths: ['p3/a/questions/q03a.png', 'p3/a/questions/q03b.png'], mark_scheme_image_paths: ['/p3/a/mark_scheme/q03a.png', '/p3/a/mark_scheme/q03b.png'] }] },
      {},
    );

    expect(questions[0].questionImageUrls).toEqual(['/assets/a/questions/q03a.png', '/assets/a/questions/q03b.png']);
    expect(questions[0].markSchemeImageUrls).toEqual(['/assets/a/mark_scheme/q03a.png', '/assets/a/mark_scheme/q03b.png']);
    expect(questions[0].questionImageCandidates[1]).toEqual(['/assets/a/questions/q03b.png', '/assets/questions/p3/a/questions/q03b.png', '/assets/questions/a/questions/q03b.png']);
    expect(questions[0].markSchemeImageCandidates[1]).toEqual(['/assets/a/mark_scheme/q03b.png', '/assets/questions/p3/a/mark_scheme/q03b.png', '/assets/questions/a/mark_scheme/q03b.png']);
  });
});
