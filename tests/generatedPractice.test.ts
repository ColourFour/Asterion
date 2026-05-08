import { describe, expect, it } from 'vitest';
import {
  getGeneratedPracticeByPaperFamily,
  getGeneratedPracticeBySkillTarget,
  getGeneratedPracticeByTopic,
  getGeneratedPracticeForRegion,
  loadGeneratedPractice,
  normalizeGeneratedPracticeData,
  reviewedGeneratedPractice,
} from '../src/lib/generatedPractice';

function item(overrides: Record<string, unknown> = {}) {
  return {
    practice_id: 'practice-pass',
    generator_family: 'logarithms_and_exponentials.log_equation_basic',
    paper_family: 'p3',
    topic: 'logarithms_and_exponentials',
    skill_target_id: 'p3_logarithms_and_exponentials',
    snippet_ids: ['log-snippet'],
    region_ids: ['logarithm-grove'],
    prompt: 'Solve ln(x) = ln(4).',
    answer: 'x = 4',
    worked_solution: ['The domain requires x > 0.', 'Equal logs have equal arguments.'],
    parameters: { solution: 4 },
    verification: { status: 'pass', method: 'deterministic', verifier: 'content_lab_v1' },
    difficulty_band: 'easy',
    review_status: 'published',
    ...overrides,
  };
}

describe('generated practice runtime loader', () => {
  it('filters candidate, blocked, and failed-verification practice', () => {
    const normalized = normalizeGeneratedPracticeData({
      items: [
        item(),
        item({ practice_id: 'practice-candidate', review_status: 'candidate' }),
        item({ practice_id: 'practice-blocked', review_status: 'blocked' }),
        item({ practice_id: 'practice-failed', verification: { status: 'fail', method: 'deterministic', verifier: 'content_lab_v1' } }),
      ],
    });

    expect(normalized.map((practice) => practice.practiceId)).toEqual([
      'practice-pass',
      'practice-candidate',
      'practice-blocked',
      'practice-failed',
    ]);
    expect(reviewedGeneratedPractice(normalized).map((practice) => practice.practiceId)).toEqual(['practice-pass']);
  });

  it('selects reviewed practice by topic, paper family, skill target, and region mapping', () => {
    const normalized = normalizeGeneratedPracticeData({
      items: [
        item({ practice_id: 'log-a' }),
        item({
          practice_id: 'binomial-a',
          generator_family: 'binomial_expansion.first_terms_and_coefficient',
          topic: 'binomial_expansion',
          skill_target_id: 'p3_binomial_expansion',
          region_ids: ['algebra-forge'],
          prompt: 'Expand (1 + 2x)^4 up to x^2.',
          answer: '1 + 8x + 24x^2',
        }),
        item({
          practice_id: 'log-p4',
          paper_family: 'p4',
          skill_target_id: 'p4_logarithms_and_exponentials',
        }),
        item({
          practice_id: 'unreviewed-log',
          review_status: 'needs_review',
        }),
      ],
    });

    expect(getGeneratedPracticeByTopic(normalized, 'logarithms_and_exponentials', 'p3').map((practice) => practice.practiceId)).toEqual(['log-a']);
    expect(getGeneratedPracticeByPaperFamily(normalized, 'p3').map((practice) => practice.practiceId)).toEqual(['binomial-a', 'log-a']);
    expect(getGeneratedPracticeBySkillTarget(normalized, 'p3_binomial_expansion').map((practice) => practice.practiceId)).toEqual(['binomial-a']);
    expect(getGeneratedPracticeForRegion(normalized, 'logarithm-grove').map((practice) => practice.practiceId)).toEqual(['log-a']);
    expect(getGeneratedPracticeForRegion(normalized, 'algebra-forge').map((practice) => practice.practiceId)).toEqual(['binomial-a']);
  });

  it('filters during async loading from the static runtime file', async () => {
    const loaded = await loadGeneratedPractice(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          item({ practice_id: 'reviewed-pass' }),
          item({ practice_id: 'reviewed-fail', verification: { status: 'fail', method: 'deterministic', verifier: 'content_lab_v1' } }),
          item({ practice_id: 'candidate-pass', review_status: 'candidate' }),
        ],
      }),
    } as Response));

    expect(loaded.map((practice) => practice.practiceId)).toEqual(['reviewed-pass']);
  });
});
