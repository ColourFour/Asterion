import { readFileSync } from 'node:fs';
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
import { P3_ASTRAL_ACADEMY } from '../src/lib/worldMap';

const publicGeneratedPracticeData = JSON.parse(readFileSync('public/data/generated_practice_bank.json', 'utf8'));

function item(overrides: Record<string, unknown> = {}) {
  return {
    practice_id: 'practice-pass',
    generator_family: 'logarithms_and_exponentials.log_equation_basic',
    paper_family: 'p3',
    topic: 'logarithms_and_exponentials',
    skill_target_id: 'p3_log_exponential_equations',
    snippet_ids: ['log-snippet'],
    source_snippet_id: 'log-snippet',
    example_model_id: 'log-snippet-example-1',
    question_type: 'Logarithm equation',
    key_method: 'Use inverse operations.',
    exam_move: 'Take natural logs after isolating the exponential.',
    region_ids: ['logarithm-grove'],
    prompt: 'Solve ln(x) = ln(4).',
    answer: 'x = 4',
    worked_solution: ['The domain requires x > 0.', 'Equal logs have equal arguments.'],
    parameters: { solution: 4 },
    sequence_role: 'first_step',
    verification: { status: 'pass', method: 'deterministic', verifier: 'content_lab_schema_v2' },
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
        item({ practice_id: 'practice-failed', verification: { status: 'fail', method: 'deterministic', verifier: 'content_lab_schema_v2' } }),
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

  it('uses review status, verification, and sequence role for readiness instead of difficulty band', () => {
    const normalized = normalizeGeneratedPracticeData({
      items: [
        item({ practice_id: 'practice-easy', difficulty_band: 'easy', sequence_role: 'first_step' }),
        item({ practice_id: 'practice-hard', difficulty_band: 'hard', sequence_role: 'first_step' }),
        item({ practice_id: 'practice-no-sequence', difficulty_band: 'easy', sequence_role: '' }),
        item({ practice_id: 'practice-candidate-hard', difficulty_band: 'hard', sequence_role: 'guardian_prep', review_status: 'candidate' }),
      ],
    });

    expect(reviewedGeneratedPractice(normalized).map((practice) => practice.practiceId)).toEqual([
      'practice-easy',
      'practice-hard',
    ]);
  });

  it('blocks P3 generated practice with unresolved legacy skill targets from runtime readiness', () => {
    const normalized = normalizeGeneratedPracticeData({
      items: [
        item({ practice_id: 'reviewed-p3-skill', skill_target_id: 'p3_log_exponential_equations' }),
        item({ practice_id: 'legacy-p3-skill', skill_target_id: 'p3_logarithms_and_exponentials' }),
        item({ practice_id: 'non-p3-skill', paper_family: 'p4', skill_target_id: 'p4_momentum_impulse' }),
      ],
    });

    expect(reviewedGeneratedPractice(normalized).map((practice) => practice.practiceId)).toEqual([
      'reviewed-p3-skill',
      'non-p3-skill',
    ]);
  });

  it('rejects generated practice records with invalid P3 region IDs', () => {
    const normalized = normalizeGeneratedPracticeData({
      items: [
        item({ practice_id: 'valid-region', region_ids: ['logarithm-grove'] }),
        item({ practice_id: 'invalid-region', region_ids: ['log-observatory'] }),
      ],
    });

    expect(normalized.map((practice) => practice.practiceId)).toEqual(['valid-region']);
  });

  it('selects reviewed practice by topic, paper family, skill target, and region mapping', () => {
    const normalized = normalizeGeneratedPracticeData({
      items: [
        item({ practice_id: 'log-a' }),
        item({
          practice_id: 'binomial-a',
          generator_family: 'binomial_expansion.first_terms_and_coefficient',
          topic: 'binomial_expansion',
          skill_target_id: 'p3_alg_binomial_terms_coefficients',
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
    expect(getGeneratedPracticeBySkillTarget(normalized, 'p3_alg_binomial_terms_coefficients').map((practice) => practice.practiceId)).toEqual(['binomial-a']);
    expect(getGeneratedPracticeForRegion(normalized, 'logarithm-grove').map((practice) => practice.practiceId)).toEqual(['log-a']);
    expect(getGeneratedPracticeForRegion(normalized, 'algebra-forge').map((practice) => practice.practiceId)).toEqual(['binomial-a']);
    expect(normalized.find((practice) => practice.practiceId === 'log-a')?.sequenceRole).toBe('first_step');
    expect(normalized.find((practice) => practice.practiceId === 'log-a')).toMatchObject({
      sourceSnippetId: 'log-snippet',
      exampleModelId: 'log-snippet-example-1',
      questionType: 'Logarithm equation',
      keyMethod: 'Use inverse operations.',
      examMove: 'Take natural logs after isolating the exponential.',
    });
  });

  it('filters during async loading from the static runtime file', async () => {
    const loaded = await loadGeneratedPractice(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          item({ practice_id: 'reviewed-pass' }),
          item({ practice_id: 'reviewed-fail', verification: { status: 'fail', method: 'deterministic', verifier: 'content_lab_schema_v2' } }),
          item({ practice_id: 'candidate-pass', review_status: 'candidate' }),
        ],
      }),
    } as Response));

    expect(loaded.map((practice) => practice.practiceId)).toEqual(['reviewed-pass']);
  });

  it('covers every current P3 region with reviewed warm-up practice', () => {
    const normalized = normalizeGeneratedPracticeData(publicGeneratedPracticeData);

    expect(normalized.length).toBeGreaterThan(0);
    expect(reviewedGeneratedPractice(normalized)).toHaveLength(normalized.length);
    expect(normalized.every((practice) => (
      practice.prompt.trim()
      && practice.answer.trim()
      && practice.workedSolution.length >= 2
      && practice.workedSolution.every((step) => step.trim())
    ))).toBe(true);

    for (const region of P3_ASTRAL_ACADEMY.regions) {
      expect(getGeneratedPracticeForRegion(normalized, region.id, 'p3').length, region.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps reviewed runtime warm-ups inside P3 scope and method-steering content', () => {
    const normalized = normalizeGeneratedPracticeData(publicGeneratedPracticeData);
    const serialized = JSON.stringify(publicGeneratedPracticeData).toLowerCase();
    const byId = new Map(normalized.map((practice) => [practice.practiceId, practice]));

    expect(normalized.every((practice) => practice.paperFamily === 'p3')).toBe(true);
    expect(normalized.every((practice) => practice.regionIds.length > 0)).toBe(true);
    expect(normalized.every((practice) => practice.skillTargetId?.startsWith('p3_'))).toBe(true);
    expect(serialized).not.toContain('momentum');
    expect(serialized).not.toContain('impulse');
    expect(serialized).not.toContain('p4_');
    expect(serialized).not.toContain('suitable substitution');
    expect(serialized).not.toContain('(1 + 3x)^4');
    expect(serialized).not.toContain('(1 - 2x)^5');

    expect(byId.get('gen_binomial_first_terms_and_coefficient_0001')?.prompt).toContain('validity condition');
    expect(byId.get('gen_binomial_first_terms_and_coefficient_0002')?.answer).toContain('valid for');
    expect(byId.get('gen_integration_method_setup_basic_0001')?.prompt).toContain('Using u = x^2 + 5');
    expect(byId.get('gen_integration_parts_substitution_basic_0001')?.prompt).toContain('Using u = x^2 + 1');
    expect(byId.get('gen_complex_roots_basic_0001')?.keyMethod).toBe('Find the pair of square roots in modulus-argument form.');
  });
});
