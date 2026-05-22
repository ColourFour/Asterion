import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const selectedAlgebraSkills = [
  'p3_alg_structure_rearrangement',
  'p3_alg_polynomial_remainder_factor',
  'p3_alg_modulus_cases',
  'p3_alg_discriminant_root_conditions',
] as const;

const selectedSnippetIds = [
  'p3-algebra-rearrangement-001',
  'p3-polynomial-theorem-001',
  'p3-modulus-cases-001',
  'p3-quadratics-discriminant-001',
] as const;

const expectedFamiliesBySkill: Record<string, string> = {
  p3_alg_structure_rearrangement: 'algebra.structure_rearrangement_basic',
  p3_alg_polynomial_remainder_factor: 'algebra.polynomial_remainder_factor_basic',
  p3_alg_modulus_cases: 'algebra.modulus_equation_basic',
  p3_alg_discriminant_root_conditions: 'quadratics.discriminant_root_condition_basic',
};

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function snippetExamples(snippet: { worked_example?: unknown; worked_examples?: unknown[] }) {
  return [
    ...(snippet.worked_example ? [snippet.worked_example] : []),
    ...(Array.isArray(snippet.worked_examples) ? snippet.worked_examples : []),
  ];
}

describe('Algebra Vault Phase 2B support-depth batch', () => {
  it('adds support notes and keeps P1 prerequisites support-only for selected skills', () => {
    const snippets = readJson('public/data/teaching_snippets.json').snippets;
    const skillRows = readJson('tools/content_lab/skill_maps/caie_9709_p3_skill_map.json').skills;

    for (const snippetId of selectedSnippetIds) {
      const snippet = snippets.find((item: { snippet_id?: string }) => item.snippet_id === snippetId);
      expect(snippet?.mark_scheme_move_note).toEqual(expect.any(String));
      expect(snippet?.misconception_repair_note).toMatchObject({
        wrong_move: expect.any(String),
        why_it_fails: expect.any(String),
        safer_move: expect.any(String),
        quick_check: expect.any(String),
      });
      expect(snippetExamples(snippet).length).toBeGreaterThanOrEqual(2);
    }

    for (const skillId of selectedAlgebraSkills) {
      const skill = skillRows.find((item: { skill_id?: string }) => item.skill_id === skillId);
      expect(skill?.prerequisite_notes).toEqual(expect.stringMatching(/support-only|support step only|support[s]? .* only/i));
      expect(skill?.prerequisite_skill_refs.every((ref: { syllabus_id?: string; relationship?: string }) => (
        ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports'
      ))).toBe(true);
      expect(skill?.prerequisite_notes).not.toContain('counts for mastery');
    }
  });

  it('publishes deterministic runtime warm-up role breadth without candidate content', () => {
    const runtimePractice = readJson('public/data/generated_practice_bank.json').items;

    expect(runtimePractice.every((item: { review_status?: string; verification?: { status?: string } }) => (
      (item.review_status === 'teacher_reviewed' || item.review_status === 'published')
        && item.verification?.status === 'pass'
    ))).toBe(true);

    for (const skillId of selectedAlgebraSkills) {
      const family = expectedFamiliesBySkill[skillId];
      const items = runtimePractice.filter((item: { generator_family?: string; skill_target_id?: string }) => (
        item.generator_family === family && item.skill_target_id === skillId
      ));
      expect(items.map((item: { sequence_role?: string }) => item.sequence_role).sort()).toEqual([
        'complete_step',
        'first_step',
        'guardian_prep',
      ]);
      expect(items.every((item: { source_snippet_id?: string; example_model_id?: string }) => (
        item.source_snippet_id && item.example_model_id
      ))).toBe(true);
    }
  });

  it('reports the intended warning reductions without treating support as mastery evidence', () => {
    const readiness = readJson('tools/content_lab/reports/p3_gold_skill_pack_readiness.json');
    const expectedWarnings: Record<string, string[]> = {
      p3_alg_structure_rearrangement: ['source_backed_worked_examples_sparse'],
      p3_alg_polynomial_remainder_factor: ['source_backed_worked_examples_sparse'],
      p3_alg_modulus_cases: ['source_backed_worked_examples_sparse'],
      p3_alg_discriminant_root_conditions: ['source_backed_worked_examples_sparse', 'thin_evidence_resilience'],
    };

    for (const skillId of selectedAlgebraSkills) {
      const row = readiness.skill_rows.find((item: { skill_id?: string }) => item.skill_id === skillId);
      expect(row).toMatchObject({
        blockers: [],
        support_content_status: 'separated',
        misconception_repair_status: 'available',
        prerequisite_repair_status: 'available',
        mark_scheme_move_note_status: 'available',
        source_backed_worked_example_count: 0,
        source_backed_worked_example_contract_errors: [],
        warnings: expectedWarnings[skillId],
      });
      expect(row.support_content_contaminating_ids).toEqual([]);
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);

      const supportIds = new Set([
        ...row.field_guide_ids,
        ...row.quick_check_ids,
        ...row.worked_example_ids,
        ...row.warmup_practice_ids,
      ]);
      expect(row.clean_evidence_question_ids.some((id: string) => supportIds.has(id))).toBe(false);
      expect(row.clean_evidence_question_ids.some((id: string) => id.startsWith('p3-'))).toBe(false);
    }
  });

  it('keeps selected worked examples original and unsourced unless clean route evidence is explicitly attached', () => {
    const snippets = readJson('public/data/teaching_snippets.json').snippets;

    for (const snippetId of selectedSnippetIds) {
      const snippet = snippets.find((item: { snippet_id?: string }) => item.snippet_id === snippetId);
      const examples = snippetExamples(snippet);
      expect(examples.length).toBeGreaterThanOrEqual(2);
      expect(examples.every((example: { source_question_ids?: string[] }) => (
        !example.source_question_ids || example.source_question_ids.length === 0
      ))).toBe(true);
    }
  });
});
