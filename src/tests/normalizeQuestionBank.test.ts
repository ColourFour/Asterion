import { describe, expect, it } from 'vitest';
import { normalizeQuestionBank } from '../lib/normalizeQuestionBank';

describe('normalizeQuestionBank', () => {
  it('prefers reviewed topic-routing labels while preserving local and DeepSeek labels', () => {
    const questions = normalizeQuestionBank(
      { questions: [{ id: 'q1', topic: 'Algebra', difficulty: 'core', image_path: 'p3/a/questions/q1.png', marks: 6 }] },
      { q1: { topic: 'Complex numbers', difficulty: 'stretch', confidence: 0.91 } },
      { records: { q1: { primary_topic_id: '9709_p3_topic_algebra', confidence: 'high' } } },
    );

    expect(questions[0].displayTopic).toBe('Algebra Vault');
    expect(questions[0].localTopic).toBe('Algebra');
    expect(questions[0].deepseek.topic).toBe('Complex numbers');
    expect(questions[0].localDifficulty).toBe('core');
    expect(questions[0].displayDifficulty).toBe('core');
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
    expect(questions[0].displayDifficulty).toBeUndefined();
    expect(questions[0].questionImageRawPaths).toEqual(['p3/15autumn25/questions/q01.png']);
    expect(questions[0].questionImageUrls).toEqual(['/assets/exam-bank-data/p3/15autumn25/questions/q01.png']);
    expect(questions[0].questionImageCandidates[0]).toEqual([
      '/assets/exam-bank-data/p3/15autumn25/questions/q01.png',
      '/assets/exam-bank%20data/p3/15autumn25/questions/q01.png',
      '/assets/15autumn25/questions/q01.png',
      '/assets/questions/p3/15autumn25/questions/q01.png',
      '/assets/questions/15autumn25/questions/q01.png',
    ]);
    expect(questions[0].markSchemeImageUrls).toEqual(['/assets/exam-bank-data/p3/15autumn25/mark_scheme/q01.png']);
  });

  it('preserves and resolves multi-image arrays in order', () => {
    const questions = normalizeQuestionBank(
      { questions: [{ question_id: 'q3', paper_family: 'p3', topic: 'trigonometry', question_image_paths: ['p3/a/questions/q03a.png', 'p3/a/questions/q03b.png'], mark_scheme_image_paths: ['/p3/a/mark_scheme/q03a.png', '/p3/a/mark_scheme/q03b.png'] }] },
      {},
    );

    expect(questions[0].questionImageUrls).toEqual(['/assets/exam-bank-data/p3/a/questions/q03a.png', '/assets/exam-bank-data/p3/a/questions/q03b.png']);
    expect(questions[0].markSchemeImageUrls).toEqual(['/assets/exam-bank-data/p3/a/mark_scheme/q03a.png', '/assets/exam-bank-data/p3/a/mark_scheme/q03b.png']);
    expect(questions[0].questionImageCandidates[1]).toEqual([
      '/assets/exam-bank-data/p3/a/questions/q03b.png',
      '/assets/exam-bank%20data/p3/a/questions/q03b.png',
      '/assets/a/questions/q03b.png',
      '/assets/questions/p3/a/questions/q03b.png',
      '/assets/questions/a/questions/q03b.png',
    ]);
    expect(questions[0].markSchemeImageCandidates[1]).toEqual([
      '/assets/exam-bank-data/p3/a/mark_scheme/q03b.png',
      '/assets/exam-bank%20data/p3/a/mark_scheme/q03b.png',
      '/assets/a/mark_scheme/q03b.png',
      '/assets/questions/p3/a/mark_scheme/q03b.png',
      '/assets/questions/a/mark_scheme/q03b.png',
    ]);
  });

  it('normalizes real part-mark metadata only when detected marks are complete', () => {
    const questions = normalizeQuestionBank(
      {
        questions: [
          {
            question_id: 'p3-parted',
            paper_family: 'p3',
            topic: 'differential equations',
            question_solution_marks: 7,
            subparts: ['a', 'b'],
            notes: {
              question_structure_detected: {
                subparts: ['a', 'b'],
                mark_values_detected: [6, 1],
                question_total_detected: 7,
              },
            },
          },
          {
            question_id: 'p3-labels-only',
            paper_family: 'p3',
            topic: 'vectors',
            question_solution_marks: 8,
            subparts: ['a', 'b'],
            subparts_solution_marks: { a: null, b: null },
          },
        ],
      },
      {},
    );

    expect(questions[0].parts).toEqual([
      { label: '(a)', marksAvailable: 6 },
      { label: '(b)', marksAvailable: 1 },
    ]);
    expect(questions[1].parts).toBeUndefined();
  });

  it('normalizes projected bank artifacts and keeps review-usable text separate from canonical images', () => {
    const questions = normalizeQuestionBank(
      {
        questions: [{
          question_id: '32spring21_q01',
          paper: '32spring21',
          paper_family: 'p3',
          question_number: '1',
          total_marks: 3,
          canonical_question_artifact: 'p3/32spring21/questions/q01.png',
          canonical_mark_scheme_artifact: 'p3/32spring21/mark_scheme/q01.png',
          quality_gate: {
            text_only_display_allowed: false,
            visual_required: true,
            reason_codes: ['text_only_blocked_status_review', 'text_only_blocked_trust_medium', 'text_only_blocked_visual_required'],
          },
          subparts: [{
            label: 'whole',
            marks: 3,
            question_text: {
              text: 'Solve the logarithmic equation.',
              trust_level: 'medium',
              role: 'search_hint',
              text_only_display_allowed: false,
            },
            mark_scheme_text: { text: 'Use laws of logarithms.', trust_level: 'high' },
          }],
        }],
      },
      {},
      { records: { '32spring21_q01': { primary_topic_id: '9709_p3_topic_logarithmic_and_exponential_functions', confidence: 'high' } } },
    );

    expect(questions[0].displayTopic).toBe('Logarithm Observatory');
    expect(questions[0].topicRouting?.mappedRegionId).toBe('logarithm-grove');
    expect(questions[0].questionImageUrls).toEqual(['/assets/exam-bank-data/p3/32spring21/questions/q01.png']);
    expect(questions[0].markSchemeImageUrls).toEqual(['/assets/exam-bank-data/p3/32spring21/mark_scheme/q01.png']);
    expect(questions[0].textQuality?.hardFailed).toBe(false);
    expect(questions[0].textQuality?.reviewUsable).toBe(true);
    expect(questions[0].textQuality?.textOnlyDisplayAllowed).toBe(false);
  });

  it('blocks hard-failed text from reliable text-only use without blocking image-first practice', () => {
    const questions = normalizeQuestionBank(
      {
        questions: [{
          question_id: '33autumn25_q01',
          paper_family: 'p3',
          canonical_question_artifact: 'p3/33autumn25/questions/q01.png',
          quality_gate: { reason_codes: ['text_only_blocked_status_fail', 'text_only_blocked_untrusted_math_text'] },
          subparts: [{ question_text: { text: 'Bad OCR', role: 'untrusted_math_text', trust_level: 'low' } }],
        }],
      },
      {},
    );

    expect(questions[0].textQuality?.hardFailed).toBe(true);
    expect(questions[0].textQuality?.reviewUsable).toBe(false);
    expect(questions[0].questionImageUrls).toEqual(['/assets/exam-bank-data/p3/33autumn25/questions/q01.png']);
  });
});
