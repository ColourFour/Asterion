import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const selectedArgandSkills = [
  'p3_complex_argand_loci_regions',
  'p3_complex_cartesian_conjugate',
  'p3_complex_modulus_argument_form',
  'p3_complex_roots_powers',
] as const;

const expectedFamiliesBySkill: Record<string, string> = {
  p3_complex_argand_loci_regions: 'complex_numbers.locus_basic',
  p3_complex_cartesian_conjugate: 'complex_numbers.cartesian_conjugate_basic',
  p3_complex_modulus_argument_form: 'complex_numbers.modulus_argument_basic',
  p3_complex_roots_powers: 'complex_numbers.roots_basic',
};

function readJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('Argand Atrium Phase 2B support-depth batch', () => {
  it('adds support notes and keeps P1 prerequisites support-only for selected skills', () => {
    const snippets = readJson('public/data/teaching_snippets.json').snippets;
    const skillRows = readJson('tools/content_lab/skill_maps/caie_9709_p3_skill_map.json').skills;

    for (const snippetId of ['p3-complex-form-001', 'p3-complex-locus-argument-001', 'p3-complex-roots-001']) {
      const snippet = snippets.find((item: { snippet_id?: string }) => item.snippet_id === snippetId);
      expect(snippet?.mark_scheme_move_note).toEqual(expect.any(String));
      expect(snippet?.misconception_repair_note).toMatchObject({
        wrong_move: expect.any(String),
        why_it_fails: expect.any(String),
        safer_move: expect.any(String),
        quick_check: expect.any(String),
      });
    }

    for (const skillId of selectedArgandSkills) {
      const skill = skillRows.find((item: { skill_id?: string }) => item.skill_id === skillId);
      expect(skill?.prerequisite_notes).toContain('support-only');
      expect(skill?.prerequisite_skill_refs.every((ref: { syllabus_id?: string; relationship?: string }) => (
        ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports'
      ))).toBe(true);
      expect(skill?.prerequisite_notes).not.toContain('counts for mastery');
    }
  });

  it('publishes deterministic runtime warm-up role breadth without candidate content', () => {
    const runtimePractice = readJson('public/data/generated_practice_bank.json').items;

    expect(runtimePractice.every((item: { review_status?: string }) => (
      item.review_status === 'teacher_reviewed' || item.review_status === 'published'
    ))).toBe(true);

    for (const skillId of selectedArgandSkills) {
      const family = expectedFamiliesBySkill[skillId];
      const items = runtimePractice.filter((item: { generator_family?: string; skill_target_id?: string }) => (
        item.generator_family === family && item.skill_target_id === skillId
      ));
      expect(items.map((item: { sequence_role?: string }) => item.sequence_role).sort()).toEqual([
        'complete_step',
        'first_step',
        'guardian_prep',
      ]);
      expect(items.every((item: { verification?: { status?: string }; source_snippet_id?: string; example_model_id?: string }) => (
        item.verification?.status === 'pass' && item.source_snippet_id && item.example_model_id
      ))).toBe(true);
    }
  });

  it('reports only honest source-backed example sparsity after the intended warning reductions', () => {
    const readiness = readJson('tools/content_lab/reports/p3_gold_skill_pack_readiness.json');

    for (const skillId of selectedArgandSkills) {
      const row = readiness.skill_rows.find((item: { skill_id?: string }) => item.skill_id === skillId);
      expect(row).toMatchObject({
        blockers: [],
        support_content_status: 'separated',
        misconception_repair_status: 'available',
        prerequisite_repair_status: 'available',
        mark_scheme_move_note_status: 'available',
        source_backed_worked_example_count: 0,
        source_backed_worked_example_contract_errors: [],
        warnings: ['source_backed_worked_examples_sparse'],
      });
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);

      const supportIds = new Set([
        ...row.field_guide_ids,
        ...row.quick_check_ids,
        ...row.worked_example_ids,
        ...row.warmup_practice_ids,
      ]);
      expect(row.clean_evidence_question_ids.some((id: string) => supportIds.has(id))).toBe(false);
      expect(row.clean_evidence_question_ids.some((id: string) => id.startsWith('p3-complex-'))).toBe(false);
    }
  });

  it('keeps selected worked examples original and unsourced unless clean route evidence is explicitly attached', () => {
    const snippets = readJson('public/data/teaching_snippets.json').snippets;
    const selectedSnippetIds = ['p3-complex-form-001', 'p3-complex-locus-argument-001', 'p3-complex-roots-001'];

    for (const snippetId of selectedSnippetIds) {
      const snippet = snippets.find((item: { snippet_id?: string }) => item.snippet_id === snippetId);
      const examples = [
        ...(snippet.worked_example ? [snippet.worked_example] : []),
        ...(Array.isArray(snippet.worked_examples) ? snippet.worked_examples : []),
      ];
      expect(examples.length).toBeGreaterThanOrEqual(2);
      expect(examples.every((example: { source_question_ids?: string[] }) => (
        !example.source_question_ids || example.source_question_ids.length === 0
      ))).toBe(true);
    }
  });
});
