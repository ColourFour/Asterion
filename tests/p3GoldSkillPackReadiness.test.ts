import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'tools/content_lab/scripts/build_p3_gold_skill_pack_readiness.py');
const skillMapPath = path.join(repoRoot, 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json');
const inventoryPath = path.join(repoRoot, 'tools/content_lab/reports/p3_content_inventory_report.json');
const matrixPath = path.join(repoRoot, 'tools/content_lab/reports/p3_coverage_matrix.json');
const snippetsPath = path.join(repoRoot, 'public/data/teaching_snippets.json');
const generatedPracticePath = path.join(repoRoot, 'public/data/generated_practice_bank.json');
const internalGeneratedPracticePath = path.join(repoRoot, 'tools/content_lab/outputs/generated_practice_bank.json');
const questionBankPath = path.join(repoRoot, 'public/assets/exam-bank-data/question_bank.json');
const routeDecisionsPath = path.join(repoRoot, 'tools/content_lab/reviews/p3_route_evidence_decisions_v1.json');
const reportJsonPath = path.join(repoRoot, 'tools/content_lab/reports/p3_gold_skill_pack_readiness.json');
const reportMarkdownPath = path.join(repoRoot, 'tools/content_lab/reports/p3_gold_skill_pack_readiness.md');
const pythonTimeoutMs = 10_000;

interface ReadinessReport {
  schema_name: string;
  schema_version: number;
  generated_at: string;
  artifact_scope: string;
  skill_summary: {
    total_reviewed_p3_skills: number;
    mvp_gold_ready_count: number;
    blocked_skill_count: number;
    warning_only_skill_count: number;
    thin_resilience_risk_skill_count: number;
    blocker_counts: Record<string, number>;
    warning_counts: Record<string, number>;
    evidence_status_counts: Record<string, number>;
  };
  per_region_summary: Array<{
    region_id: string;
    region: string;
    skill_count: number;
    mvp_gold_ready_count: number;
    blocked_skill_count: number;
    warning_only_skill_count: number;
  }>;
  thin_region_priority_summary: Array<{
    priority_rank: number;
    region_id: string;
    region: string;
    reasons: string[];
    warmup_role_gap_skill_count: number;
    worked_example_gap_skill_count: number;
    source_backed_worked_example_gap_skill_count: number;
    missing_repair_note_skill_count: number;
  }>;
  skill_rows: Array<{
    skill_id: string;
    skill_name: string;
    region: string;
    region_id: string;
    syllabus_section: string;
    evidence_status: string;
    clean_evidence_count: number;
    support_content_status: string;
    field_guide_status: string;
    worked_example_count: number;
    source_backed_worked_example_count: number;
    quick_check_status: string;
    warmup_roles_present: string[];
    warmup_roles_missing: string[];
    misconception_repair_status: string;
    prerequisite_repair_status: string;
    mark_scheme_move_note_status: string;
    blockers: string[];
    warnings: string[];
    source_backed_worked_example_contract_errors: string[];
    mvp_gold_ready: boolean;
    next_action: string;
  }>;
  contract_violation_summary: {
    violation_count: number;
    items: Array<{ skill_id: string; violation_type: string; message: string }>;
  };
}

interface SkillMap {
  skills: Array<{ skill_id: string }>;
}

function runPython(args: string[]) {
  execFileSync('python3', args, {
    cwd: repoRoot,
    timeout: pythonTimeoutMs,
    maxBuffer: 10 * 1024 * 1024,
    stdio: 'pipe',
  });
}

function runPythonFailure(args: string[]) {
  try {
    runPython(args);
  } catch (error) {
    const failure = error as { stderr?: Buffer; stdout?: Buffer; message?: string };
    return [
      failure.stderr?.toString('utf8') ?? '',
      failure.stdout?.toString('utf8') ?? '',
      failure.message ?? '',
    ].join('\n');
  }
  throw new Error('Expected python command to fail');
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function withTempDir<T>(callback: (dir: string) => T) {
  const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-gold-'));
  try {
    return callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function buildReadinessToTemp(dir: string, overrides: Partial<{
  inventory: string;
  matrix: string;
  snippets: string;
  generatedPractice: string;
}> = {}) {
  const jsonOutput = path.join(dir, 'p3_gold_skill_pack_readiness.json');
  const markdownOutput = path.join(dir, 'p3_gold_skill_pack_readiness.md');
  runPython([
    scriptPath,
    '--skill-map',
    skillMapPath,
    '--inventory',
    overrides.inventory ?? inventoryPath,
    '--matrix',
    overrides.matrix ?? matrixPath,
    '--snippets',
    overrides.snippets ?? snippetsPath,
    '--generated-practice',
    overrides.generatedPractice ?? generatedPracticePath,
    '--question-bank',
    questionBankPath,
    '--route-decisions',
    routeDecisionsPath,
    '--json-output',
    jsonOutput,
    '--markdown-output',
    markdownOutput,
  ]);
  return {
    jsonOutput,
    markdownOutput,
    report: readJson<ReadinessReport>(jsonOutput),
    markdown: readFileSync(markdownOutput, 'utf8'),
  };
}

function reportRow(report: ReadinessReport, skillId: string) {
  const row = report.skill_rows.find((item) => item.skill_id === skillId);
  if (!row) {
    throw new Error(`Missing readiness row ${skillId}`);
  }
  return row;
}

describe('P3 Gold Skill Pack readiness report', () => {
  it('builds the real deterministic JSON and Markdown reports', () => {
    withTempDir((dir) => {
      const { jsonOutput, markdownOutput, report, markdown } = buildReadinessToTemp(dir);

      expect(existsSync(jsonOutput)).toBe(true);
      expect(existsSync(markdownOutput)).toBe(true);
      expect(report.schema_name).toBe('asterion_p3_gold_skill_pack_readiness');
      expect(report.schema_version).toBe(1);
      expect(report.artifact_scope).toBe('p3_gold_skill_pack_readiness');
      expect(report.generated_at).toMatch(/T/);
      expect(markdown).toContain('# P3 Gold Skill Pack Readiness');
      expect(markdown).toContain('## Thin Region Priority');
      expect(markdown).toContain('## Skill Rows');
    });
  });

  it('includes every reviewed P3 skill exactly once', () => {
    const skillMap = readJson<SkillMap>(skillMapPath);
    const report = readJson<ReadinessReport>(reportJsonPath);
    const expectedSkillIds = new Set(skillMap.skills.map((skill) => skill.skill_id));
    const reportSkillIds = report.skill_rows.map((row) => row.skill_id);

    expect(report.skill_summary.total_reviewed_p3_skills).toBe(40);
    expect(reportSkillIds).toHaveLength(40);
    expect(new Set(reportSkillIds)).toEqual(expectedSkillIds);
    expect(new Set(reportSkillIds).size).toBe(reportSkillIds.length);
  });

  it('keeps a skill with no clean evidence out of MVP gold as a blocker, not a warning', () => {
    withTempDir((dir) => {
      const matrix = readJson<{ coverage_rows: Array<Record<string, unknown> & { skill_ref: string }> }>(matrixPath);
      const target = matrix.coverage_rows.find((row) => row.skill_ref === 'p3_alg_discriminant_root_conditions');
      if (!target) throw new Error('Missing discriminant fixture row');
      target.clean_mastery_evidence_count = 0;
      target.clean_mastery_evidence_question_ids = [];
      target.export_allowed_evidence_count = 0;
      const matrixFixture = path.join(dir, 'matrix-no-clean.json');
      writeJson(matrixFixture, matrix);

      const { report } = buildReadinessToTemp(dir, { matrix: matrixFixture });
      const row = reportRow(report, 'p3_alg_discriminant_root_conditions');

      expect(row.mvp_gold_ready).toBe(false);
      expect(row.blockers).toContain('no_clean_canonical_question_mark_scheme_pair');
      expect(row.warnings).not.toContain('no_clean_canonical_question_mark_scheme_pair');
      expect(row.evidence_status).toBe('blocked');
    });
  });

  it('flags a single clean evidence link as a resilience warning', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const row = reportRow(report, 'p3_alg_discriminant_root_conditions');

    expect(row.clean_evidence_count).toBe(1);
    expect(row.evidence_status).toBe('thin');
    expect(row.blockers).not.toContain('no_clean_canonical_question_mark_scheme_pair');
    expect(row.warnings).toContain('thin_evidence_resilience');
    expect(report.skill_summary.thin_resilience_risk_skill_count).toBeGreaterThanOrEqual(1);
  });

  it('treats a missing Field Guide as an MVP-gold blocker', () => {
    withTempDir((dir) => {
      const snippets = readJson<{ snippets: Array<{ snippet_id?: string }> }>(snippetsPath);
      snippets.snippets = snippets.snippets.filter((snippet) => snippet.snippet_id !== 'p3-quadratics-discriminant-001');
      const snippetsFixture = path.join(dir, 'snippets-missing-field-guide.json');
      writeJson(snippetsFixture, snippets);

      const { report } = buildReadinessToTemp(dir, { snippets: snippetsFixture });
      const row = reportRow(report, 'p3_alg_discriminant_root_conditions');

      expect(row.field_guide_status).toBe('missing');
      expect(row.blockers).toContain('missing_field_guide');
    });
  });

  it('treats a missing Quick Check as an MVP-gold blocker', () => {
    withTempDir((dir) => {
      const snippets = readJson<{ snippets: Array<Record<string, unknown> & { snippet_id?: string }> }>(snippetsPath);
      const snippet = snippets.snippets.find((item) => item.snippet_id === 'p3-quadratics-discriminant-001');
      if (!snippet) throw new Error('Missing discriminant snippet fixture');
      delete snippet.quick_check;
      const snippetsFixture = path.join(dir, 'snippets-missing-quick-check.json');
      writeJson(snippetsFixture, snippets);

      const { report } = buildReadinessToTemp(dir, { snippets: snippetsFixture });
      const row = reportRow(report, 'p3_alg_discriminant_root_conditions');

      expect(row.field_guide_status).toBe('available');
      expect(row.quick_check_status).toBe('missing');
      expect(row.blockers).toContain('missing_quick_check');
    });
  });

  it('reports missing warm-up sequence roles without treating partial support as all missing', () => {
    withTempDir((dir) => {
      const generatedPractice = readJson<{ items: Array<Record<string, unknown> & { skill_target_id?: string; sequence_role?: string }> }>(generatedPracticePath);
      generatedPractice.items = generatedPractice.items.filter((item) => (
        item.skill_target_id !== 'p3_de_separation_setup' || item.sequence_role === 'first_step'
      ));
      const generatedPracticeFixture = path.join(dir, 'generated-practice-partial-warmup.json');
      writeJson(generatedPracticeFixture, generatedPractice);

      const { report } = buildReadinessToTemp(dir, { generatedPractice: generatedPracticeFixture });
      const row = reportRow(report, 'p3_de_separation_setup');

      expect(row.warmup_roles_present).toEqual(['first_step']);
      expect(row.warmup_roles_missing).toEqual(['complete_step', 'guardian_prep']);
      expect(row.blockers).not.toContain('missing_all_warmup_support');
      expect(row.warnings).toContain('missing_some_warmup_sequence_roles');
    });
  });

  it('reports Phase 2B Differential Shrine repairs and full warm-up role breadth without promoting support to mastery', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const differentialSkills = [
      'p3_de_separation_setup',
      'p3_de_initial_condition',
      'p3_de_forming_context_model',
    ];

    for (const skillId of differentialSkills) {
      const row = reportRow(report, skillId);

      expect(row.misconception_repair_status).toBe('available');
      expect(row.prerequisite_repair_status).toBe('available');
      expect(row.mark_scheme_move_note_status).toBe('available');
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);
      expect(row.support_content_status).toBe('separated');
      expect(row.source_backed_worked_example_count).toBe(0);
      expect(row.warnings).not.toContain('missing_misconception_repair_note');
      expect(row.warnings).not.toContain('missing_prerequisite_repair_note');
      expect(row.warnings).not.toContain('missing_mark_scheme_move_note');
      expect(row.warnings).not.toContain('missing_some_warmup_sequence_roles');
    }
  });

  it('reports Phase 2B Iteration Forge repairs, warm-up role breadth, and support-only prerequisite handling', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const snippets = readJson<{ snippets: Array<Record<string, unknown> & {
      snippet_id?: string;
      misconception_repair_note?: unknown;
      mark_scheme_move_note?: unknown;
      worked_examples?: Array<Record<string, unknown>>;
    }> }>(snippetsPath);
    const generatedPractice = readJson<{ items: Array<Record<string, unknown> & {
      skill_target_id?: string;
      sequence_role?: string;
      review_status?: string;
    }> }>(generatedPracticePath);
    const skillMap = readJson<{ skills: Array<Record<string, unknown> & {
      skill_id?: string;
      prerequisite_notes?: string;
      prerequisite_skill_refs?: Array<Record<string, unknown>>;
    }> }>(skillMapPath);
    const iterationSkills = [
      'p3_num_accuracy_rounding',
      'p3_num_iteration_formula',
      'p3_num_sign_change_graph_evidence',
    ];

    for (const skillId of iterationSkills) {
      const row = reportRow(report, skillId);
      const skill = skillMap.skills.find((item) => item.skill_id === skillId);
      const warmupItems = generatedPractice.items.filter((item) => item.skill_target_id === skillId);

      expect(row.misconception_repair_status).toBe('available');
      expect(row.prerequisite_repair_status).toBe('available');
      expect(row.mark_scheme_move_note_status).toBe('available');
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);
      expect(row.support_content_status).toBe('separated');
      expect(row.source_backed_worked_example_count).toBe(0);
      expect(row.source_backed_worked_example_contract_errors).toEqual([]);
      expect(row.warnings).not.toContain('fewer_than_two_worked_examples');
      expect(row.warnings).not.toContain('missing_misconception_repair_note');
      expect(row.warnings).not.toContain('missing_prerequisite_repair_note');
      expect(row.warnings).not.toContain('missing_mark_scheme_move_note');
      expect(row.warnings).not.toContain('missing_some_warmup_sequence_roles');
      expect(row.warnings).toContain('source_backed_worked_examples_sparse');
      expect(warmupItems).toHaveLength(3);
      expect(warmupItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
      expect(new Set(warmupItems.map((item) => item.sequence_role))).toEqual(new Set(['first_step', 'complete_step', 'guardian_prep']));
      expect(skill?.prerequisite_notes).toContain('support');
      expect(skill?.prerequisite_skill_refs?.every((ref) => ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports')).toBe(true);
    }

    for (const snippetId of ['p3-iteration-formula-discipline-001', 'p3-numerical-method-evidence-001']) {
      const snippet = snippets.snippets.find((item) => item.snippet_id === snippetId);
      expect(snippet?.misconception_repair_note).toBeDefined();
      expect(snippet?.mark_scheme_move_note).toBeDefined();
      expect(snippet?.worked_examples).toHaveLength(2);
      expect(snippet?.worked_examples?.every((example) => !Array.isArray(example.source_question_ids))).toBe(true);
    }

    expect(generatedPractice.items.some((item) => (
      iterationSkills.includes(String(item.skill_target_id)) && ['candidate', 'needs_review', 'blocked'].includes(String(item.review_status))
    ))).toBe(false);
  });

  it('reports Phase 2B Vectors Gate repairs and deterministic warm-up role breadth without source-backed inflation', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const snippets = readJson<{ snippets: Array<Record<string, unknown> & {
      snippet_id?: string;
      misconception_repair_note?: unknown;
      mark_scheme_move_note?: unknown;
      worked_example?: Record<string, unknown>;
      worked_examples?: Array<Record<string, unknown>>;
    }> }>(snippetsPath);
    const generatedPractice = readJson<{ items: Array<Record<string, unknown> & {
      skill_target_id?: string;
      sequence_role?: string;
      review_status?: string;
    }> }>(generatedPracticePath);
    const skillMap = readJson<{ skills: Array<Record<string, unknown> & {
      skill_id?: string;
      prerequisite_notes?: string;
      prerequisite_skill_refs?: Array<Record<string, unknown>>;
    }> }>(skillMapPath);
    const vectorSkills = [
      'p3_vec_line_equations_intersections',
      'p3_vec_scalar_product_angles',
      'p3_vec_3d_geometry_modelling',
    ];

    for (const skillId of vectorSkills) {
      const row = reportRow(report, skillId);
      const skill = skillMap.skills.find((item) => item.skill_id === skillId);
      const warmupItems = generatedPractice.items.filter((item) => item.skill_target_id === skillId);

      expect(row.misconception_repair_status).toBe('available');
      expect(row.prerequisite_repair_status).toBe('available');
      expect(row.mark_scheme_move_note_status).toBe('available');
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);
      expect(row.support_content_status).toBe('separated');
      expect(row.source_backed_worked_example_count).toBe(0);
      expect(row.source_backed_worked_example_contract_errors).toEqual([]);
      expect(row.warnings).not.toContain('fewer_than_two_worked_examples');
      expect(row.warnings).not.toContain('missing_misconception_repair_note');
      expect(row.warnings).not.toContain('missing_prerequisite_repair_note');
      expect(row.warnings).not.toContain('missing_mark_scheme_move_note');
      expect(row.warnings).not.toContain('missing_some_warmup_sequence_roles');
      expect(row.warnings).toEqual(['source_backed_worked_examples_sparse']);
      expect(warmupItems).toHaveLength(3);
      expect(warmupItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
      expect(new Set(warmupItems.map((item) => item.sequence_role))).toEqual(new Set(['first_step', 'complete_step', 'guardian_prep']));
      expect(skill?.prerequisite_notes).toContain('support');
      expect(skill?.prerequisite_skill_refs?.every((ref) => ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports')).toBe(true);
    }

    for (const snippetId of ['p3-vectors-lines-001', 'p3-vectors-scalar-product-001', 'p3-vectors-3d-geometry-001']) {
      const snippet = snippets.snippets.find((item) => item.snippet_id === snippetId);
      const examples = [
        ...(snippet?.worked_example ? [snippet.worked_example] : []),
        ...(snippet?.worked_examples ?? []),
      ];

      expect(snippet?.misconception_repair_note).toBeDefined();
      expect(snippet?.mark_scheme_move_note).toBeDefined();
      expect(examples.length).toBeGreaterThanOrEqual(1);
      expect(examples.every((example) => !Array.isArray(example.source_question_ids))).toBe(true);
    }

    expect(generatedPractice.items.some((item) => (
      vectorSkills.includes(String(item.skill_target_id)) && ['candidate', 'needs_review', 'blocked'].includes(String(item.review_status))
    ))).toBe(false);
  });

  it('reports Phase 2B Logarithm Observatory support-depth repairs without source-backed or mastery inflation', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const snippets = readJson<{ snippets: Array<Record<string, unknown> & {
      snippet_id?: string;
      misconception_repair_note?: unknown;
      mark_scheme_move_note?: unknown;
      worked_example?: Record<string, unknown>;
      worked_examples?: Array<Record<string, unknown>>;
    }> }>(snippetsPath);
    const generatedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      review_status?: string;
    }> }>(generatedPracticePath);
    const skillMap = readJson<{ skills: Array<Record<string, unknown> & {
      skill_id?: string;
      prerequisite_notes?: string;
      prerequisite_skill_refs?: Array<Record<string, unknown>>;
    }> }>(skillMapPath);
    const selectedSkills = [
      'p3_log_convert_forms',
      'p3_log_domain_validation',
      'p3_log_linearisation',
      'p3_log_calculus_contexts',
    ];
    const selectedSnippetIds = [
      'p3-log-exp-convert-001',
      'p3-log-domain-001',
      'p3-log-linearisation-001',
      'p3-log-calculus-context-001',
    ];
    const selectedGeneratorFamilies = [
      'logarithms_and_exponentials.log_equation_basic',
      'logarithms_and_exponentials.domain_validation_basic',
      'logarithms_and_exponentials.linearisation_basic',
      'logarithms_and_exponentials.calculus_context_basic',
    ];

    for (const skillId of selectedSkills) {
      const row = reportRow(report, skillId);
      const skill = skillMap.skills.find((item) => item.skill_id === skillId);

      expect(row.evidence_status).toBe('clean');
      expect(row.clean_evidence_count).toBeGreaterThan(1);
      expect(row.misconception_repair_status).toBe('available');
      expect(row.prerequisite_repair_status).toBe('available');
      expect(row.mark_scheme_move_note_status).toBe('available');
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);
      expect(row.support_content_status).toBe('separated');
      expect(row.source_backed_worked_example_count).toBe(0);
      expect(row.source_backed_worked_example_contract_errors).toEqual([]);
      expect(row.warnings).not.toContain('fewer_than_two_worked_examples');
      expect(row.warnings).not.toContain('missing_misconception_repair_note');
      expect(row.warnings).not.toContain('missing_prerequisite_repair_note');
      expect(row.warnings).not.toContain('missing_mark_scheme_move_note');
      expect(row.warnings).not.toContain('missing_some_warmup_sequence_roles');
      expect(row.warnings).toEqual(['source_backed_worked_examples_sparse']);
      expect(skill?.prerequisite_notes).toContain('do not count as P3 mastery evidence');
      expect(skill?.prerequisite_skill_refs?.every((ref) => ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports')).toBe(true);
    }

    for (const snippetId of selectedSnippetIds) {
      const snippet = snippets.snippets.find((item) => item.snippet_id === snippetId);
      const examples = [
        ...(snippet?.worked_example ? [snippet.worked_example] : []),
        ...(snippet?.worked_examples ?? []),
      ];

      expect(snippet?.misconception_repair_note).toBeDefined();
      expect(snippet?.mark_scheme_move_note).toBeDefined();
      expect(examples.length).toBeGreaterThanOrEqual(2);
      expect(examples.every((example) => !Array.isArray(example.source_question_ids))).toBe(true);
    }

    expect(generatedPractice.items.some((item) => (
      selectedGeneratorFamilies.includes(String(item.generator_family)) && ['candidate', 'needs_review', 'blocked'].includes(String(item.review_status))
    ))).toBe(false);
  });

  it('reports remaining Logarithm Observatory repair-gap skills as support-depth repaired without generated-practice changes', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const snippets = readJson<{ snippets: Array<Record<string, unknown> & {
      snippet_id?: string;
      misconception_repair_note?: {
        wrong_move?: string;
        why_it_fails?: string;
        safer_move?: string;
        short_check?: string;
      };
      mark_scheme_move_note?: string;
      worked_example?: Record<string, unknown>;
      worked_examples?: Array<Record<string, unknown>>;
    }> }>(snippetsPath);
    const generatedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      practice_id?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(generatedPracticePath);
    const internalGeneratedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      practice_id?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(internalGeneratedPracticePath);
    const skillMap = readJson<{ skills: Array<Record<string, unknown> & {
      skill_id?: string;
      prerequisite_notes?: string;
      prerequisite_skill_refs?: Array<Record<string, unknown>>;
    }> }>(skillMapPath);
    const selectedSkills = [
      'p3_log_exponential_equations',
      'p3_log_laws_equations',
    ];
    const selectedSnippetIds = [
      'p3-exp-equations-001',
      'p3-log-invalid-operations-001',
    ];

    for (const skillId of selectedSkills) {
      const row = reportRow(report, skillId);
      const skill = skillMap.skills.find((item) => item.skill_id === skillId);

      expect(row.evidence_status).toBe('clean');
      expect(row.clean_evidence_count).toBeGreaterThan(1);
      expect(row.misconception_repair_status).toBe('available');
      expect(row.prerequisite_repair_status).toBe('available');
      expect(row.mark_scheme_move_note_status).toBe('available');
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);
      expect(row.support_content_status).toBe('separated');
      expect(row.source_backed_worked_example_count).toBe(0);
      expect(row.source_backed_worked_example_contract_errors).toEqual([]);
      expect(row.warnings).not.toContain('fewer_than_two_worked_examples');
      expect(row.warnings).not.toContain('missing_misconception_repair_note');
      expect(row.warnings).not.toContain('missing_prerequisite_repair_note');
      expect(row.warnings).not.toContain('missing_mark_scheme_move_note');
      expect(row.warnings).not.toContain('missing_some_warmup_sequence_roles');
      expect(row.warnings).toEqual(['source_backed_worked_examples_sparse']);
      expect(skill?.prerequisite_notes).toContain('do not count as P3 mastery evidence');
      expect(skill?.prerequisite_skill_refs?.every((ref) => ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports')).toBe(true);
    }

    for (const snippetId of selectedSnippetIds) {
      const snippet = snippets.snippets.find((item) => item.snippet_id === snippetId);
      const examples = [
        ...(snippet?.worked_example ? [snippet.worked_example] : []),
        ...(snippet?.worked_examples ?? []),
      ];

      expect(snippet?.misconception_repair_note?.wrong_move).toBeTruthy();
      expect(snippet?.misconception_repair_note?.why_it_fails).toBeTruthy();
      expect(snippet?.misconception_repair_note?.safer_move).toBeTruthy();
      expect(snippet?.misconception_repair_note?.short_check).toBeTruthy();
      expect(snippet?.mark_scheme_move_note).toBeTruthy();
      expect(examples.length).toBeGreaterThanOrEqual(1);
      expect(examples.every((example) => !Array.isArray(example.source_question_ids))).toBe(true);
    }

    const logFamily = 'logarithms_and_exponentials.log_equation_basic';
    const runtimeLogItems = generatedPractice.items.filter((item) => item.generator_family === logFamily);
    const internalLogItems = internalGeneratedPractice.items.filter((item) => item.generator_family === logFamily);
    const runtimePracticeIds = new Set(runtimeLogItems.map((item) => item.practice_id));
    const internalPracticeIds = new Set(internalLogItems.map((item) => item.practice_id));

    expect(runtimeLogItems).toHaveLength(3);
    expect(internalLogItems).toHaveLength(3);
    expect(runtimeLogItems.every((item) => item.skill_target_id === 'p3_log_exponential_equations')).toBe(true);
    expect(internalLogItems.every((item) => item.skill_target_id === 'p3_log_exponential_equations')).toBe(true);
    expect(runtimeLogItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
    expect(internalLogItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
    expect(new Set(runtimeLogItems.map((item) => item.sequence_role))).toEqual(new Set(['first_step', 'complete_step', 'guardian_prep']));
    expect(runtimePracticeIds).toEqual(internalPracticeIds);
  });

  it('reports the focused Calculus Cliffs support-depth batch without generated-practice promotion or mismatched source inflation', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const snippets = readJson<{ snippets: Array<Record<string, unknown> & {
      snippet_id?: string;
      misconception_repair_note?: {
        wrong_move?: string;
        why_it_fails?: string;
        safer_move?: string;
        short_check?: string;
      };
      mark_scheme_move_note?: string;
      worked_example?: Record<string, unknown>;
      worked_examples?: Array<Record<string, unknown>>;
    }> }>(snippetsPath);
    const generatedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(generatedPracticePath);
    const internalGeneratedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(internalGeneratedPracticePath);
    const routeDecisions = readJson<{ decisions: Array<Record<string, unknown> & {
      question_id?: string;
      reviewed_status?: string;
      reviewed_source_skill_ids?: string[];
      evidence_basis?: {
        question_asset_path?: string;
        mark_scheme_asset_path?: string;
      };
    }> }>(routeDecisionsPath);
    const skillMap = readJson<{ skills: Array<Record<string, unknown> & {
      skill_id?: string;
      prerequisite_notes?: string;
      prerequisite_skill_refs?: Array<Record<string, unknown>>;
      supported_by_generator_families?: string[];
    }> }>(skillMapPath);
    const selectedSkills = [
      'p3_diff_method_selection',
      'p3_diff_chain_product_quotient',
      'p3_diff_implicit_log_exp',
      'p3_diff_stationary_tangent_normal',
    ];
    const sourceBackedSkillIds = new Set([
      'p3_diff_chain_product_quotient',
      'p3_diff_stationary_tangent_normal',
    ]);

    expect(report.skill_summary.mvp_gold_ready_count).toBe(3);
    expect(report.skill_rows.filter((row) => row.mvp_gold_ready).map((row) => row.skill_id).sort()).toEqual([
      'p3_diff_chain_product_quotient',
      'p3_diff_stationary_tangent_normal',
      'p3_trig_r_form_compound_angles',
    ]);

    for (const skillId of selectedSkills) {
      const row = reportRow(report, skillId);
      const skill = skillMap.skills.find((item) => item.skill_id === skillId);
      const isSourceBackedDepthSkill = sourceBackedSkillIds.has(skillId);

      expect(row.evidence_status).toBe('clean');
      expect(row.clean_evidence_count).toBeGreaterThan(1);
      expect(row.misconception_repair_status).toBe('available');
      expect(row.prerequisite_repair_status).toBe('available');
      expect(row.mark_scheme_move_note_status).toBe('available');
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);
      expect(row.support_content_status).toBe('separated');
      expect(row.source_backed_worked_example_contract_errors).toEqual([]);
      expect(row.warnings).not.toContain('fewer_than_two_worked_examples');
      expect(row.warnings).not.toContain('missing_misconception_repair_note');
      expect(row.warnings).not.toContain('missing_prerequisite_repair_note');
      expect(row.warnings).not.toContain('missing_mark_scheme_move_note');
      expect(row.warnings).not.toContain('missing_some_warmup_sequence_roles');
      expect(row.source_backed_worked_example_count).toBe(isSourceBackedDepthSkill ? 2 : 0);
      expect(row.warnings).toEqual(isSourceBackedDepthSkill ? [] : ['source_backed_worked_examples_sparse']);
      expect(row.mvp_gold_ready).toBe(isSourceBackedDepthSkill);
      expect(skill?.prerequisite_notes).toContain('do not count as P3 mastery evidence');
      expect(skill?.prerequisite_skill_refs?.every((ref) => ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports')).toBe(true);
    }

    expect(skillMap.skills.find((item) => item.skill_id === 'p3_diff_method_selection')?.supported_by_generator_families).toEqual([
      'differentiation.chain_product_basic',
    ]);

    for (const snippetId of [
      'p3-differentiation-method-001',
      'p3-differentiation-chain-product-quotient-source-001',
      'p3-differentiation-implicit-log-exp-001',
      'p3-differentiation-follow-through-001',
    ]) {
      const snippet = snippets.snippets.find((item) => item.snippet_id === snippetId);
      const examples = [
        ...(snippet?.worked_example ? [snippet.worked_example] : []),
        ...(snippet?.worked_examples ?? []),
      ];

      if (snippetId !== 'p3-differentiation-chain-product-quotient-source-001') {
        expect(snippet?.misconception_repair_note?.wrong_move).toBeTruthy();
        expect(snippet?.misconception_repair_note?.why_it_fails).toBeTruthy();
        expect(snippet?.misconception_repair_note?.safer_move).toBeTruthy();
        expect(snippet?.misconception_repair_note?.short_check).toBeTruthy();
      } else {
        expect(snippet?.source_skill_target_ids).toEqual(['p3_diff_chain_product_quotient']);
      }
      expect(snippet?.mark_scheme_move_note).toBeTruthy();
      expect(examples.length).toBeGreaterThanOrEqual(2);
      if (
        snippetId === 'p3-differentiation-follow-through-001'
        || snippetId === 'p3-differentiation-chain-product-quotient-source-001'
      ) {
        const sourceBackedExamples = examples.filter((example) => Array.isArray(example.source_question_ids));

        expect(sourceBackedExamples).toHaveLength(2);
        expect(sourceBackedExamples.every((example) => (
          Array.isArray(example.source_question_ids)
          && example.source_question_ids.length === 1
          && example.source_question_ids[0] === '31autumn23_q01'
          && Array.isArray(example.source_question_asset_ids)
          && example.source_question_asset_ids[0] === 'p3/31autumn23/questions/q01.png'
          && Array.isArray(example.source_mark_scheme_asset_ids)
          && example.source_mark_scheme_asset_ids[0] === 'p3/31autumn23/mark_scheme/q01.png'
        ))).toBe(true);
      } else {
        expect(examples.every((example) => !Array.isArray(example.source_question_ids))).toBe(true);
      }
    }

    const sourceDecision = routeDecisions.decisions.find((decision) => decision.question_id === '31autumn23_q01');
    expect(sourceDecision?.reviewed_status).toBe('clean');
    for (const skillId of sourceBackedSkillIds) {
      expect(sourceDecision?.reviewed_source_skill_ids).toContain(skillId);
    }
    expect(sourceDecision?.evidence_basis?.question_asset_path).toBe('p3/31autumn23/questions/q01.png');
    expect(sourceDecision?.evidence_basis?.mark_scheme_asset_path).toBe('p3/31autumn23/mark_scheme/q01.png');

    const runtimeStatuses = new Set(generatedPractice.items.map((item) => item.review_status));
    expect(runtimeStatuses).toEqual(new Set(['teacher_reviewed']));
    for (const family of [
      'differentiation.chain_product_basic',
      'differentiation.implicit_log_exp_basic',
      'differentiation.stationary_tangent_normal_basic',
    ]) {
      const runtimeFamilyItems = generatedPractice.items.filter((item) => item.generator_family === family);
      const internalFamilyItems = internalGeneratedPractice.items.filter((item) => item.generator_family === family);

      expect(runtimeFamilyItems).toHaveLength(3);
      expect(internalFamilyItems).toHaveLength(3);
      expect(runtimeFamilyItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
      expect(internalFamilyItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
      expect(new Set(runtimeFamilyItems.map((item) => item.sequence_role))).toEqual(new Set(['first_step', 'complete_step', 'guardian_prep']));
    }

    expect(generatedPractice.items.filter((item) => item.generator_family === 'parametric_equations.derivative_ratio_basic')).toHaveLength(1);
    expect(internalGeneratedPractice.items.filter((item) => (
      item.generator_family === 'parametric_equations.derivative_ratio_basic' && item.review_status === 'needs_review'
    ))).toHaveLength(3);
  });

  it('keeps the clean route source-pool expansion exact-skill and moves only the selected sourced skill', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const routeDecisions = readJson<{ decisions: Array<{
      question_id?: string;
      reviewed_status?: string;
      reviewed_region_id?: string;
      reviewed_source_skill_ids?: string[];
      evidence_basis?: {
        question_asset_path?: string;
        mark_scheme_asset_path?: string;
      };
      use_case_permissions?: {
        mastery_evidence_allowed?: boolean;
        content_lab_generation_allowed?: boolean;
        candidate_promotion_allowed?: boolean;
      };
    }> }>(routeDecisionsPath);
    const expandedSources = [
      {
        questionId: '31autumn21_q01',
        skills: ['p3_log_exponential_equations'],
        regionId: 'logarithm-grove',
        questionAsset: 'p3/31autumn21/questions/q01.png',
        markSchemeAsset: 'p3/31autumn21/mark_scheme/q01.png',
      },
      {
        questionId: '31autumn21_q02',
        skills: ['p3_trig_r_form_compound_angles'],
        regionId: 'trig-observatory',
        questionAsset: 'p3/31autumn21/questions/q02.png',
        markSchemeAsset: 'p3/31autumn21/mark_scheme/q02.png',
      },
      {
        questionId: '31autumn21_q04',
        skills: ['p3_int_parts_substitution', 'p3_int_definite_improper_area'],
        regionId: 'integration-gardens',
        questionAsset: 'p3/31autumn21/questions/q04.png',
        markSchemeAsset: 'p3/31autumn21/mark_scheme/q04.png',
      },
      {
        questionId: '31autumn21_q05',
        skills: ['p3_trig_equation_interval', 'p3_trig_quadrant_solutions'],
        regionId: 'trig-observatory',
        questionAsset: 'p3/31autumn21/questions/q05.png',
        markSchemeAsset: 'p3/31autumn21/mark_scheme/q05.png',
      },
    ];

    expect(report.skill_summary.mvp_gold_ready_count).toBe(3);
    expect(report.skill_rows.filter((row) => row.mvp_gold_ready).map((row) => row.skill_id).sort()).toEqual([
      'p3_diff_chain_product_quotient',
      'p3_diff_stationary_tangent_normal',
      'p3_trig_r_form_compound_angles',
    ]);

    for (const source of expandedSources) {
      const decision = routeDecisions.decisions.find((item) => item.question_id === source.questionId);

      expect(decision?.reviewed_status).toBe('clean');
      expect(decision?.reviewed_region_id).toBe(source.regionId);
      expect(decision?.reviewed_source_skill_ids).toEqual(source.skills);
      expect(decision?.evidence_basis?.question_asset_path).toBe(source.questionAsset);
      expect(decision?.evidence_basis?.mark_scheme_asset_path).toBe(source.markSchemeAsset);
      expect(decision?.use_case_permissions).toMatchObject({
        mastery_evidence_allowed: true,
        content_lab_generation_allowed: true,
        candidate_promotion_allowed: false,
      });
      expect(existsSync(path.join(repoRoot, 'public/assets/exam-bank-data', source.questionAsset))).toBe(true);
      expect(existsSync(path.join(repoRoot, 'public/assets/exam-bank-data', source.markSchemeAsset))).toBe(true);

      for (const skillId of source.skills) {
        const row = reportRow(report, skillId);

        if (skillId === 'p3_trig_r_form_compound_angles') {
          expect(row.warnings).toEqual([]);
          expect(row.source_backed_worked_example_count).toBe(2);
          expect(row.mvp_gold_ready).toBe(true);
        } else {
          expect(row.warnings).toContain('source_backed_worked_examples_sparse');
          expect(row.source_backed_worked_example_count).toBe(0);
          expect(row.mvp_gold_ready).toBe(false);
        }
      }
    }
  });

  it('reports the focused Trigonometry Spire support-depth batch without generated-practice changes', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const snippets = readJson<{ snippets: Array<Record<string, unknown> & {
      snippet_id?: string;
      misconception_repair_note?: {
        wrong_move?: string;
        why_it_fails?: string;
        safer_move?: string;
        short_check?: string;
      };
      mark_scheme_move_note?: string;
      worked_example?: Record<string, unknown>;
      worked_examples?: Array<Record<string, unknown>>;
    }> }>(snippetsPath);
    const generatedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(generatedPracticePath);
    const internalGeneratedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(internalGeneratedPracticePath);
    const skillMap = readJson<{ skills: Array<Record<string, unknown> & {
      skill_id?: string;
      prerequisite_notes?: string;
      prerequisite_skill_refs?: Array<Record<string, unknown>>;
    }> }>(skillMapPath);
    const trigRegionSummary = report.per_region_summary.find((item) => item.region === 'Trigonometry Spire') as Record<string, unknown> | undefined;
    const selectedSkillIds = [
      'p3_trig_equation_interval',
      'p3_trig_identity_selection',
      'p3_trig_quadrant_solutions',
      'p3_trig_r_form_compound_angles',
      'p3_trig_reciprocal_double_angle',
    ];

    for (const skillId of selectedSkillIds) {
      const row = reportRow(report, skillId);
      const skill = skillMap.skills.find((item) => item.skill_id === skillId);
      const isRFormSourceBacked = skillId === 'p3_trig_r_form_compound_angles';

      expect(row.evidence_status).toBe('clean');
      expect(row.clean_evidence_count).toBeGreaterThan(1);
      expect(row.misconception_repair_status).toBe('available');
      expect(row.prerequisite_repair_status).toBe('available');
      expect(row.mark_scheme_move_note_status).toBe('available');
      expect(row.worked_example_count).toBeGreaterThanOrEqual(2);
      expect(row.source_backed_worked_example_count).toBe(isRFormSourceBacked ? 2 : 0);
      expect(row.source_backed_worked_example_contract_errors).toEqual([]);
      expect(row.support_content_status).toBe('separated');
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);
      expect(row.warnings).toEqual(isRFormSourceBacked ? [] : ['source_backed_worked_examples_sparse']);
      expect(row.mvp_gold_ready).toBe(isRFormSourceBacked);
      expect(skill?.prerequisite_notes).toContain('support-only');
      expect(skill?.prerequisite_notes).toContain('mastery');
      expect(skill?.prerequisite_skill_refs?.every((ref) => ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports')).toBe(true);
    }

    const rFormSourceSnippet = snippets.snippets.find((item) => item.snippet_id === 'p3-trig-r-form-source-001');
    const rFormExamples = rFormSourceSnippet?.worked_examples ?? [];
    expect(rFormSourceSnippet?.source_skill_target_ids).toEqual(['p3_trig_r_form_compound_angles']);
    expect(rFormSourceSnippet?.related_skill_targets).toEqual(['p3_trig_r_form_compound_angles']);
    expect(rFormExamples).toHaveLength(2);
    expect(rFormExamples.every((example) => (
      Array.isArray(example.source_question_ids)
      && example.source_question_ids.length === 1
      && example.source_question_ids[0] === '31autumn21_q02'
      && Array.isArray(example.source_question_asset_ids)
      && example.source_question_asset_ids[0] === 'p3/31autumn21/questions/q02.png'
      && Array.isArray(example.source_mark_scheme_asset_ids)
      && example.source_mark_scheme_asset_ids[0] === 'p3/31autumn21/mark_scheme/q02.png'
    ))).toBe(true);
    expect(skillMap.skills.find((item) => item.skill_id === 'p3_trig_r_form_compound_angles')?.supported_by_snippet_ids).toContain('p3-trig-r-form-source-001');
    expect(skillMap.skills.find((item) => item.skill_id === 'p3_trig_reciprocal_double_angle')?.supported_by_snippet_ids).not.toContain('p3-trig-r-form-source-001');

    expect(trigRegionSummary?.missing_repair_note_skill_count).toBe(0);
    expect(trigRegionSummary?.worked_example_gap_skill_count).toBe(0);
    expect(trigRegionSummary?.warmup_role_gap_skill_count).toBe(0);

    for (const snippetId of [
      'p3-trig-interval-001',
      'p3-trig-lost-solutions-001',
      'p3-trig-identity-selection-001',
      'p3-trig-quadrant-discipline-001',
      'p3-trig-reciprocal-rform-001',
    ]) {
      const snippet = snippets.snippets.find((item) => item.snippet_id === snippetId);
      const examples = [
        ...(snippet?.worked_example ? [snippet.worked_example] : []),
        ...(snippet?.worked_examples ?? []),
      ];

      expect(snippet?.misconception_repair_note?.wrong_move).toBeTruthy();
      expect(snippet?.misconception_repair_note?.why_it_fails).toBeTruthy();
      expect(snippet?.misconception_repair_note?.safer_move).toBeTruthy();
      expect(snippet?.misconception_repair_note?.short_check).toBeTruthy();
      expect(snippet?.mark_scheme_move_note).toBeTruthy();
      expect(examples.length).toBeGreaterThanOrEqual(1);
      expect(examples.every((example) => !Array.isArray(example.source_question_ids))).toBe(true);
    }

    const runtimeStatuses = new Set(generatedPractice.items.map((item) => item.review_status));
    const internalNeedsReview = internalGeneratedPractice.items.filter((item) => item.review_status === 'needs_review');

    expect(generatedPractice.items).toHaveLength(120);
    expect(internalGeneratedPractice.items).toHaveLength(126);
    expect(internalNeedsReview).toHaveLength(9);
    expect(runtimeStatuses).toEqual(new Set(['teacher_reviewed']));
    for (const family of [
      'trigonometry.identity_rewrite_basic',
      'trigonometry.addition_formulae_basic',
      'trigonometry.double_angle_basic',
      'trigonometry.solve_equation_interval_basic',
      'trigonometry.r_form_basic',
    ]) {
      const runtimeFamilyItems = generatedPractice.items.filter((item) => item.generator_family === family);
      const internalFamilyItems = internalGeneratedPractice.items.filter((item) => item.generator_family === family);

      expect(runtimeFamilyItems).toHaveLength(3);
      expect(internalFamilyItems).toHaveLength(3);
      expect(runtimeFamilyItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
      expect(internalFamilyItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
      expect(new Set(runtimeFamilyItems.map((item) => item.sequence_role))).toEqual(new Set(['first_step', 'complete_step', 'guardian_prep']));
    }
  });

  it('reports the focused Integral Terraces support-depth batch without generated-practice changes', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const snippets = readJson<{ snippets: Array<Record<string, unknown> & {
      snippet_id?: string;
      misconception_repair_note?: {
        wrong_move?: string;
        why_it_fails?: string;
        safer_move?: string;
        short_check?: string;
      };
      mark_scheme_move_note?: string;
      worked_example?: Record<string, unknown>;
      worked_examples?: Array<Record<string, unknown>>;
    }> }>(snippetsPath);
    const generatedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(generatedPracticePath);
    const internalGeneratedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(internalGeneratedPracticePath);
    const skillMap = readJson<{ skills: Array<Record<string, unknown> & {
      skill_id?: string;
      prerequisite_notes?: string;
      prerequisite_skill_refs?: Array<Record<string, unknown>>;
    }> }>(skillMapPath);
    const integralRegionSummary = report.per_region_summary.find((item) => item.region === 'Integral Terraces') as Record<string, unknown> | undefined;
    const selectedSkillIds = [
      'p3_int_method_choice',
      'p3_int_parts_substitution',
      'p3_int_definite_improper_area',
      'p3_int_partial_fractions',
    ];

    for (const skillId of selectedSkillIds) {
      const row = reportRow(report, skillId);
      const skill = skillMap.skills.find((item) => item.skill_id === skillId);

      expect(row.evidence_status).toBe('clean');
      expect(row.clean_evidence_count).toBeGreaterThan(1);
      expect(row.misconception_repair_status).toBe('available');
      expect(row.prerequisite_repair_status).toBe('available');
      expect(row.mark_scheme_move_note_status).toBe('available');
      expect(row.worked_example_count).toBeGreaterThanOrEqual(2);
      expect(row.source_backed_worked_example_count).toBe(0);
      expect(row.source_backed_worked_example_contract_errors).toEqual([]);
      expect(row.support_content_status).toBe('separated');
      expect(row.warmup_roles_present).toEqual(['first_step', 'complete_step', 'guardian_prep']);
      expect(row.warmup_roles_missing).toEqual([]);
      expect(row.warnings).toEqual(['source_backed_worked_examples_sparse']);
      expect(skill?.prerequisite_notes).toContain('support-only');
      expect(skill?.prerequisite_notes).toContain('mastery');
      expect(skill?.prerequisite_skill_refs?.every((ref) => ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports')).toBe(true);
    }

    expect(integralRegionSummary?.worked_example_gap_skill_count).toBe(0);
    expect(integralRegionSummary?.warmup_role_gap_skill_count).toBe(0);
    expect(integralRegionSummary?.missing_repair_note_skill_count).toBe(0);

    for (const snippetId of [
      'p3-integration-method-choice-001',
      'p3-integration-parts-substitution-001',
      'p3-integration-definite-area-001',
    ]) {
      const snippet = snippets.snippets.find((item) => item.snippet_id === snippetId);
      const examples = [
        ...(snippet?.worked_example ? [snippet.worked_example] : []),
        ...(snippet?.worked_examples ?? []),
      ];

      expect(snippet?.misconception_repair_note?.wrong_move).toBeTruthy();
      expect(snippet?.misconception_repair_note?.why_it_fails).toBeTruthy();
      expect(snippet?.misconception_repair_note?.safer_move).toBeTruthy();
      expect(snippet?.misconception_repair_note?.short_check).toBeTruthy();
      expect(snippet?.mark_scheme_move_note).toBeTruthy();
      expect(examples.length).toBeGreaterThanOrEqual(2);
      expect(examples.every((example) => !Array.isArray(example.source_question_ids))).toBe(true);
    }

    const runtimeStatuses = new Set(generatedPractice.items.map((item) => item.review_status));
    const internalNeedsReview = internalGeneratedPractice.items.filter((item) => item.review_status === 'needs_review');

    expect(generatedPractice.items).toHaveLength(120);
    expect(internalGeneratedPractice.items).toHaveLength(126);
    expect(internalNeedsReview).toHaveLength(9);
    expect(runtimeStatuses).toEqual(new Set(['teacher_reviewed']));
    const expectedFamilyCounts = new Map([
      ['integration.method_setup_basic', 3],
      ['integration.parts_substitution_basic', 3],
      ['integration.definite_area_basic', 3],
      ['algebra.partial_fractions_distinct_linear', 4],
      ['algebra.partial_fractions_repeated_linear', 3],
    ]);

    for (const [family, expectedCount] of expectedFamilyCounts) {
      const runtimeFamilyItems = generatedPractice.items.filter((item) => item.generator_family === family);
      const internalFamilyItems = internalGeneratedPractice.items.filter((item) => item.generator_family === family);

      expect(runtimeFamilyItems).toHaveLength(expectedCount);
      expect(internalFamilyItems).toHaveLength(expectedCount);
      expect(runtimeFamilyItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
      expect(internalFamilyItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
      expect(new Set(runtimeFamilyItems.map((item) => item.sequence_role))).toEqual(new Set(['first_step', 'complete_step', 'guardian_prep']));
    }
  });

  it('reports the p3_diff_parametric_gradients mini-batch without promoting internal warm-ups', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);
    const snippets = readJson<{ snippets: Array<Record<string, unknown> & {
      snippet_id?: string;
      misconception_repair_note?: {
        wrong_move?: string;
        why_it_fails?: string;
        safer_move?: string;
        short_check?: string;
      };
      mark_scheme_move_note?: string;
      worked_example?: Record<string, unknown>;
      worked_examples?: Array<Record<string, unknown>>;
    }> }>(snippetsPath);
    const generatedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(generatedPracticePath);
    const internalGeneratedPractice = readJson<{ items: Array<Record<string, unknown> & {
      generator_family?: string;
      review_status?: string;
      sequence_role?: string;
      skill_target_id?: string;
    }> }>(internalGeneratedPracticePath);
    const skillMap = readJson<{ skills: Array<Record<string, unknown> & {
      skill_id?: string;
      prerequisite_notes?: string;
      prerequisite_skill_refs?: Array<Record<string, unknown>>;
    }> }>(skillMapPath);
    const row = reportRow(report, 'p3_diff_parametric_gradients');
    const skill = skillMap.skills.find((item) => item.skill_id === 'p3_diff_parametric_gradients');
    const snippet = snippets.snippets.find((item) => item.snippet_id === 'p3-parametric-derivative-001');
    const examples = [
      ...(snippet?.worked_example ? [snippet.worked_example] : []),
      ...(snippet?.worked_examples ?? []),
    ];
    const runtimeParametric = generatedPractice.items.filter((item) => item.generator_family === 'parametric_equations.derivative_ratio_basic');
    const internalParametric = internalGeneratedPractice.items.filter((item) => item.generator_family === 'parametric_equations.derivative_ratio_basic');

    expect(row.evidence_status).toBe('clean');
    expect(row.clean_evidence_count).toBeGreaterThan(1);
    expect(row.misconception_repair_status).toBe('available');
    expect(row.prerequisite_repair_status).toBe('available');
    expect(row.mark_scheme_move_note_status).toBe('available');
    expect(row.worked_example_count).toBeGreaterThanOrEqual(2);
    expect(row.source_backed_worked_example_count).toBe(0);
    expect(row.source_backed_worked_example_contract_errors).toEqual([]);
    expect(row.support_content_status).toBe('separated');
    expect(row.warmup_roles_present).toEqual(['guardian_prep']);
    expect(row.warmup_roles_missing).toEqual(['first_step', 'complete_step']);
    expect(row.warnings).toEqual(['missing_some_warmup_sequence_roles', 'source_backed_worked_examples_sparse']);
    expect(row.warnings).not.toContain('fewer_than_two_worked_examples');
    expect(row.warnings).not.toContain('missing_misconception_repair_note');
    expect(row.warnings).not.toContain('missing_prerequisite_repair_note');
    expect(row.warnings).not.toContain('missing_mark_scheme_move_note');
    expect(skill?.prerequisite_notes).toContain('do not count as P3 mastery evidence');
    expect(skill?.prerequisite_skill_refs?.every((ref) => ref.syllabus_id === 'caie_9709_p1_2026_2027' && ref.relationship === 'supports')).toBe(true);

    expect(snippet?.misconception_repair_note?.wrong_move).toBeTruthy();
    expect(snippet?.misconception_repair_note?.why_it_fails).toBeTruthy();
    expect(snippet?.misconception_repair_note?.safer_move).toBeTruthy();
    expect(snippet?.misconception_repair_note?.short_check).toBeTruthy();
    expect(snippet?.mark_scheme_move_note).toBeTruthy();
    expect(examples.length).toBeGreaterThanOrEqual(2);
    expect(examples.every((example) => !Array.isArray(example.source_question_ids))).toBe(true);

    expect(new Set(generatedPractice.items.map((item) => item.review_status))).toEqual(new Set(['teacher_reviewed']));
    expect(runtimeParametric).toHaveLength(1);
    expect(runtimeParametric[0].sequence_role).toBe('guardian_prep');
    expect(runtimeParametric[0].review_status).toBe('teacher_reviewed');
    expect(internalParametric).toHaveLength(3);
    expect(internalParametric.every((item) => item.review_status === 'needs_review')).toBe(true);
    expect(new Set(internalParametric.map((item) => item.sequence_role))).toEqual(new Set(['first_step', 'complete_step', 'guardian_prep']));
  });

  it('fails hard for a published source-backed worked example using non-clean evidence', () => {
    withTempDir((dir) => {
      const snippets = readJson<{ snippets: Array<Record<string, unknown> & { snippet_id?: string; worked_examples?: Array<Record<string, unknown>> }> }>(snippetsPath);
      const snippet = snippets.snippets.find((item) => item.snippet_id === 'p3-differentiation-method-001');
      if (!snippet || !Array.isArray(snippet.worked_examples)) {
        throw new Error('Missing source-backed differentiation examples fixture');
      }
      for (const example of snippet.worked_examples) {
        example.source_question_ids = ['31autumn23_q09'];
        example.source_question_asset_ids = ['p3/31autumn23/questions/q09.png'];
        example.source_mark_scheme_asset_ids = ['p3/31autumn23/mark_scheme/q09.png'];
      }
      const snippetsFixture = path.join(dir, 'snippets-non-clean-source.json');
      writeJson(snippetsFixture, snippets);

      const jsonOutput = path.join(dir, 'out.json');
      const markdownOutput = path.join(dir, 'out.md');
      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        inventoryPath,
        '--matrix',
        matrixPath,
        '--snippets',
        snippetsFixture,
        '--generated-practice',
        generatedPracticePath,
        '--question-bank',
        questionBankPath,
        '--route-decisions',
        routeDecisionsPath,
        '--json-output',
        jsonOutput,
        '--markdown-output',
        markdownOutput,
      ]);

      expect(output).toContain('invalid_source_backed_worked_example');
      expect(output).toContain('non-clean reviewed route evidence');
    });
  });

  it('fails hard for a clean source-backed worked example not reviewed for the target skill', () => {
    withTempDir((dir) => {
      const snippets = readJson<{ snippets: Array<Record<string, unknown> & { snippet_id?: string; worked_examples?: Array<Record<string, unknown>> }> }>(snippetsPath);
      const snippet = snippets.snippets.find((item) => item.snippet_id === 'p3-differentiation-method-001');
      if (!snippet || !Array.isArray(snippet.worked_examples)) {
        throw new Error('Missing source-backed differentiation examples fixture');
      }
      for (const example of snippet.worked_examples) {
        example.source_question_ids = ['31autumn23_q01'];
        example.source_question_asset_ids = ['p3/31autumn23/questions/q01.png'];
        example.source_mark_scheme_asset_ids = ['p3/31autumn23/mark_scheme/q01.png'];
      }
      const snippetsFixture = path.join(dir, 'snippets-clean-wrong-skill-source.json');
      writeJson(snippetsFixture, snippets);

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        inventoryPath,
        '--matrix',
        matrixPath,
        '--snippets',
        snippetsFixture,
        '--generated-practice',
        generatedPracticePath,
        '--question-bank',
        questionBankPath,
        '--route-decisions',
        routeDecisionsPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);

      expect(output).toContain('invalid_source_backed_worked_example');
      expect(output).toContain('source_question_id 31autumn23_q01 is not reviewed for target skill p3_diff_method_selection');
    });
  });

  it('fails hard when support content is counted as mastery evidence', () => {
    withTempDir((dir) => {
      const inventory = readJson<{ per_skill_inventory: Array<Record<string, unknown> & { skill_ref: string; mastery_evidence_question_ids?: string[] }> }>(inventoryPath);
      const row = inventory.per_skill_inventory.find((item) => item.skill_ref === 'p3_alg_binomial_terms_coefficients');
      if (!row) throw new Error('Missing inventory fixture row');
      row.mastery_evidence_question_ids = [...(row.mastery_evidence_question_ids ?? []), 'p3-binomial-term-001'];
      const inventoryFixture = path.join(dir, 'inventory-polluted-support.json');
      writeJson(inventoryFixture, inventory);

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        inventoryFixture,
        '--matrix',
        matrixPath,
        '--snippets',
        snippetsPath,
        '--generated-practice',
        generatedPracticePath,
        '--question-bank',
        questionBankPath,
        '--route-decisions',
        routeDecisionsPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);

      expect(output).toContain('support_content_contaminates_mastery_evidence');
    });
  });

  it('generates the requested thin-region priority order from current artifact data', () => {
    const report = readJson<ReadinessReport>(reportJsonPath);

    expect(report.thin_region_priority_summary.map((item) => item.region)).toEqual([
      'Differential Shrine',
      'Iteration Forge',
      'Vectors Gate',
      'Argand Atrium',
    ]);
    for (const item of report.thin_region_priority_summary) {
      expect(item.skill_count).toBeGreaterThan(0);
      expect(item.reasons.length).toBeGreaterThan(0);
      expect(item.reasons).not.toEqual(['reason unavailable from current artifacts']);
      expect(
        item.warmup_role_gap_skill_count
          + item.worked_example_gap_skill_count
          + item.source_backed_worked_example_gap_skill_count
          + item.missing_repair_note_skill_count,
      ).toBeGreaterThan(0);
    }
  });

  it('distinguishes blocker rows from warning-only rows', () => {
    withTempDir((dir) => {
      const matrix = readJson<{ coverage_rows: Array<Record<string, unknown> & { skill_ref: string }> }>(matrixPath);
      const target = matrix.coverage_rows.find((row) => row.skill_ref === 'p3_alg_discriminant_root_conditions');
      if (!target) throw new Error('Missing discriminant fixture row');
      target.clean_mastery_evidence_count = 0;
      target.clean_mastery_evidence_question_ids = [];
      target.export_allowed_evidence_count = 0;
      const matrixFixture = path.join(dir, 'matrix-blocker-warning.json');
      writeJson(matrixFixture, matrix);

      const { report } = buildReadinessToTemp(dir, { matrix: matrixFixture });
      const blocked = reportRow(report, 'p3_alg_discriminant_root_conditions');
      const warningOnly = report.skill_rows.find((row) => row.skill_id !== blocked.skill_id && row.blockers.length === 0 && row.warnings.length > 0);

      expect(blocked.blockers.length).toBeGreaterThan(0);
      expect(blocked.mvp_gold_ready).toBe(false);
      expect(warningOnly).toBeDefined();
      expect(warningOnly?.blockers).toEqual([]);
      expect(warningOnly?.warnings.length).toBeGreaterThan(0);
    });
  });

  it('keeps Phase 2 documented as the P3 Gold Skill Pack roadmap, not Paper 2 expansion', () => {
    const contentRoadmap = readFileSync(path.join(repoRoot, 'docs/content-lab-roadmap.md'), 'utf8');
    const phase2Roadmap = readFileSync(path.join(repoRoot, 'docs/phase-2-content-lab-gold-skill-packs.md'), 'utf8');
    const readme = readFileSync(path.join(repoRoot, 'README.md'), 'utf8');

    expect(existsSync(path.join(repoRoot, 'docs/p2-content-lab-roadmap.md'))).toBe(false);
    expect(contentRoadmap).toContain('Phase 2 in this roadmap means the P3 Gold Skill Pack Depth Pass');
    expect(phase2Roadmap).toContain('It does not mean CAIE Paper 2');
    expect(readme).toContain('docs/phase-2-content-lab-gold-skill-packs.md');
    expect(readme).not.toContain('p2-content-lab-roadmap');
  });
});
