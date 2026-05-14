import { describe, expect, it } from 'vitest';
import { normalizeQuestionBank } from '../lib/normalizeQuestionBank';
import { QUESTION_ROUTE_EVIDENCE_STATUSES } from '../lib/questionRouteEvidence';

describe('normalizeQuestionBank', () => {
  it('defines the shared route-evidence status vocabulary', () => {
    expect(QUESTION_ROUTE_EVIDENCE_STATUSES).toEqual([
      'clean',
      'missing-route',
      'ambiguous-route',
      'review-only',
      'fallback-display-only',
      'prerequisite-only',
      'not-P3',
      'hard-failure',
    ]);
  });

  it('prefers reviewed topic-routing labels while preserving local and DeepSeek labels', () => {
    const questions = normalizeQuestionBank(
      { questions: [{ id: 'q1', topic: 'Algebra', difficulty: 'core', image_path: 'p3/a/questions/q1.png', marks: 6 }] },
      { q1: { topic: 'Complex numbers', difficulty: 'stretch', confidence: 0.91 } },
      { records: { q1: { primary_topic_id: '9709_p3_topic_algebra', confidence: 'high' } } },
    );

    expect(questions[0].displayTopic).toBe('Algebra Vault');
    expect(questions[0].routeEvidence).toMatchObject({
      status: 'clean',
      source: 'topic-routing',
      regionId: 'algebra-forge',
      validatedRegionId: 'algebra-forge',
      displayRegionId: 'algebra-forge',
      reasonCodes: ['validated-topic-routing'],
    });
    expect(questions[0].localTopic).toBe('Algebra');
    expect(questions[0].deepseek.topic).toBe('Complex numbers');
    expect(questions[0].localDifficulty).toBe('core');
    expect(questions[0].displayDifficulty).toBe('core');
  });

  it('distinguishes missing, ambiguous, and fallback-only route evidence during normalization', () => {
    const questions = normalizeQuestionBank(
      {
        questions: [
          { id: 'missing', paper_family: 'p3' },
          { id: 'ambiguous', paper_family: 'p3', topic: 'Algebra' },
          { id: 'fallback', paper_family: 'p3', topic: 'Trigonometry' },
        ],
      },
      {},
      {
        records: {
          ambiguous: {
            primary_topic_id: '9709_p3_topic_algebra',
            confidence: 'medium',
            review_required: false,
            topic_distribution: [
              { topic_id: '9709_p3_topic_algebra', fit_percent: 50 },
              { topic_id: '9709_p3_topic_trigonometry', fit_percent: 50 },
            ],
          },
        },
      },
    );

    expect(questions.find((question) => question.id === 'missing')?.routeEvidence).toMatchObject({
      status: 'missing-route',
      source: 'none',
      reasonCodes: ['no-topic-routing-record'],
    });
    expect(questions.find((question) => question.id === 'ambiguous')?.routeEvidence).toMatchObject({
      status: 'ambiguous-route',
      source: 'topic-routing',
      reasonCodes: ['multiple-p3-candidate-regions'],
      candidateRegionIds: ['algebra-forge', 'trig-observatory'],
    });
    expect(questions.find((question) => question.id === 'fallback')?.routeEvidence).toMatchObject({
      status: 'fallback-display-only',
      source: 'fallback-label',
      regionId: 'trig-observatory',
      reasonCodes: ['fallback-label-match'],
    });
  });

  it('uses the topic-routing sidecar as the route authority over source or fallback hints', () => {
    const questions = normalizeQuestionBank(
      {
        questions: [
          {
            id: 'sidecar-review',
            paper_family: 'p3',
            topic: 'Algebra',
            route_evidence_status: 'clean',
          },
          {
            id: 'sidecar-ambiguous',
            paper_family: 'p3',
            topic: 'Algebra',
          },
          {
            id: 'source-clean-only',
            paper_family: 'p3',
            topic: 'Algebra',
            route_evidence_status: 'clean',
          },
        ],
      },
      {},
      {
        records: {
          'sidecar-review': {
            primary_topic_id: '9709_p3_topic_algebra',
            confidence: 'high',
            review_required: true,
            review_reasons: ['teacher review needed'],
          },
          'sidecar-ambiguous': {
            primary_topic_id: '9709_p3_topic_algebra',
            route_evidence_status: 'clean',
            confidence: 'high',
            review_required: false,
            topic_distribution: [
              { topic_id: '9709_p3_topic_algebra', fit_percent: 55 },
              { topic_id: '9709_p3_topic_trigonometry', fit_percent: 45 },
            ],
          },
        },
      },
    );

    expect(questions.find((question) => question.id === 'sidecar-review')?.routeEvidence).toMatchObject({
      status: 'review-only',
      source: 'topic-routing',
      reasonCodes: ['topic-routing-review-required'],
      displayRegionId: 'algebra-forge',
    });
    expect(questions.find((question) => question.id === 'sidecar-review')?.routeEvidence?.validatedRegionId).toBeUndefined();

    expect(questions.find((question) => question.id === 'sidecar-ambiguous')?.routeEvidence).toMatchObject({
      status: 'ambiguous-route',
      source: 'topic-routing',
      reasonCodes: ['multiple-p3-candidate-regions'],
      candidateRegionIds: ['algebra-forge', 'trig-observatory'],
      displayRegionId: 'algebra-forge',
    });
    expect(questions.find((question) => question.id === 'sidecar-ambiguous')?.routeEvidence?.validatedRegionId).toBeUndefined();

    expect(questions.find((question) => question.id === 'source-clean-only')?.routeEvidence).toMatchObject({
      status: 'fallback-display-only',
      source: 'fallback-label',
      reasonCodes: ['fallback-label-match'],
      displayRegionId: 'algebra-forge',
    });
    expect(questions.find((question) => question.id === 'source-clean-only')?.routeEvidence?.validatedRegionId).toBeUndefined();
  });

  it('keeps fallback display regions visible when sidecar routing is missing but does not validate them', () => {
    const questions = normalizeQuestionBank(
      {
        questions: [{
          id: 'missing-primary',
          paper_family: 'p3',
          topic: 'Trigonometry',
        }],
      },
      {},
      {
        records: {
          'missing-primary': {
            confidence: 'low',
            review_required: false,
            evidence_used: ['ocr_text'],
          },
        },
      },
    );

    expect(questions[0].routeEvidence).toMatchObject({
      status: 'missing-route',
      source: 'topic-routing',
      reasonCodes: ['topic-routing-missing-primary-topic'],
      displayRegionId: 'trig-observatory',
    });
    expect(questions[0].routeEvidence?.validatedRegionId).toBeUndefined();
  });

  it('preserves explicit route-evidence statuses from source records', () => {
    const questions = normalizeQuestionBank({
      questions: [{
        id: 'review-only-source',
        paper_family: 'p3',
        topic: 'Vectors',
        route_evidence_status: 'review-only',
      }],
    });

    expect(questions[0].routeEvidence).toMatchObject({
      status: 'review-only',
      source: 'preserved-status',
      reasonCodes: ['preserved-route-evidence-status'],
    });
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
