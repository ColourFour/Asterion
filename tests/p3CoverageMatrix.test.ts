import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'tools/content_lab/scripts/build_p3_coverage_matrix.py');
const skillMapPath = path.join(repoRoot, 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json');
const inventoryPath = path.join(repoRoot, 'tools/content_lab/reports/p3_content_inventory_report.json');
const matrixJsonPath = path.join(repoRoot, 'tools/content_lab/reports/p3_coverage_matrix.json');
const matrixMarkdownPath = path.join(repoRoot, 'tools/content_lab/reports/p3_coverage_matrix.md');
const pythonTimeoutMs = 10_000;

type CoverageStatus =
  | 'ready_for_review'
  | 'partial'
  | 'missing_support'
  | 'needs_teacher_review'
  | 'blocked_for_mastery';

type CorrectionPriority =
  | 'P0_blocked_mastery'
  | 'P1_missing_core_support'
  | 'P2_missing_practice_support'
  | 'P3_teacher_review_backlog'
  | 'P4_polish_or_complete';

interface CoverageMatrix {
  schema_name: string;
  schema_version: number;
  generated_label: string;
  official_syllabus_section_summary: {
    section_count: number;
    skill_counts: Record<string, number>;
  };
  region_summary: {
    region_count: number;
    skill_counts: Record<string, number>;
    region_titles: Record<string, string>;
  };
  skill_summary: {
    reviewed_skill_count: number;
    coverage_status_counts: Record<CoverageStatus, number>;
    correction_priority_counts: Record<CorrectionPriority, number>;
  };
  coverage_rows: Array<{
    skill_ref: string;
    skill_id: string;
    skill_title: string;
    region_id: string;
    region_title: string;
    official_syllabus_section: string;
    curriculum_role: string;
    recommended_next_action: string;
    coverage_status: CoverageStatus;
    correction_priority: CorrectionPriority;
    canonical_question_count: number;
    clean_mastery_evidence_count: number;
    clean_mastery_evidence_question_ids: string[];
    evidence_resilience_status: string;
    deferred_evidence_count: number;
    deferred_evidence_question_ids: string[];
    practice_allowed_deferred_count: number;
    export_allowed_evidence_count: number;
    support_gaps: string[];
    field_guide_status: string;
    snippet_status: string;
    worked_example_status: string;
    quick_check_status: string;
    warmup_status: string;
    prerequisite_skill_refs: Array<{ syllabus_id: string; skill_ref: string; relationship: string }>;
    blocking_reasons: string[];
  }>;
  deferred_evidence_summary: {
    case_count: number;
    affected_skill_count: number;
    mastery_evidence_allowed: boolean | null;
    practice_allowed: boolean | null;
    export_allowed: boolean | null;
    items: Array<{
      skill_ref: string;
      question_id: string;
      mastery_evidence_allowed: boolean;
      practice_allowed: boolean;
      export_allowed: boolean;
    }>;
  };
  teaching_support_summary: {
    expected_support_types: string[];
    support_gap_counts: Record<string, number>;
    skills_with_any_support_gap: number;
  };
  evidence_resilience_summary: {
    low_clean_mastery_evidence_threshold: number;
    status_counts: Record<string, number>;
    blocked_no_clean_mastery_evidence_skill_refs: string[];
    thin_resilience_risk_skill_refs: string[];
    healthy_evidence_skill_count: number;
    risk_rows: Array<{
      skill_ref: string;
      clean_mastery_evidence_count: number;
      evidence_resilience_status: string;
    }>;
  };
  correction_priority_summary: {
    priority_counts: Record<CorrectionPriority, number>;
    suggested_region_correction_order: Array<{
      region_id: string;
      region_title: string;
      highest_priority: CorrectionPriority;
      skill_count: number;
      blocked_mastery_skill_count: number;
      support_gap_skill_count: number;
    }>;
  };
  risk_summary: {
    blocked_mastery_skill_refs: string[];
    p1_prerequisite_refs_are_mastery_evidence: boolean;
    app_and_deepseek_labels_override_reviewed_skill_map: boolean;
  };
}

interface SkillMap {
  skills: Array<{
    skill_id: string;
    syllabus_topic: string;
    region_id: string;
    curriculum_role: string;
    micro_skill_name: string;
  }>;
}

const coverageStatusLabels: CoverageStatus[] = [
  'blocked_for_mastery',
  'missing_support',
  'needs_teacher_review',
  'partial',
  'ready_for_review',
];

const correctionPriorityLabels: CorrectionPriority[] = [
  'P0_blocked_mastery',
  'P1_missing_core_support',
  'P2_missing_practice_support',
  'P3_teacher_review_backlog',
  'P4_polish_or_complete',
];

const validCurriculumRoles = ['p3_core', 'bridge', 'p1_prerequisite', 'ambiguous', 'out_of_scope'];
const supportTypes = ['field_guide', 'snippet', 'worked_example', 'quick_check', 'warm_up'];
const quarantinedAlgebraWarmupSkillRefs = [
  'p3_alg_discriminant_root_conditions',
  'p3_alg_structure_rearrangement',
];

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

function skillRefs(matrix: CoverageMatrix) {
  return matrix.coverage_rows.map((row) => row.skill_ref);
}

function countRows<T extends string>(rows: Array<Record<string, unknown>>, key: string, labels: T[]) {
  return Object.fromEntries(
    labels.map((label) => [label, rows.filter((row) => row[key] === label).length]),
  ) as Record<T, number>;
}

function countRowsDynamic(rows: Array<Record<string, unknown>>, key: string) {
  const labels = Array.from(new Set(rows.map((row) => String(row[key])).filter(Boolean))).sort();
  return Object.fromEntries(labels.map((label) => [label, rows.filter((row) => row[key] === label).length]));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function markdownSection(markdown: string, heading: string) {
  const start = markdown.indexOf(heading);
  if (start === -1) {
    return '';
  }
  const next = markdown.indexOf('\n## ', start + heading.length);
  return markdown.slice(start, next === -1 ? markdown.length : next);
}

function validateMatrixContract(matrix: CoverageMatrix, skillMap: SkillMap) {
  const errors: string[] = [];
  const skillRefs = matrix.coverage_rows.map((row) => row.skill_ref);
  const expectedSkillRefs = skillMap.skills.map((skill) => skill.skill_id);
  const skillByRef = new Map(skillMap.skills.map((skill) => [skill.skill_id, skill]));
  const validRegions = new Set(skillMap.skills.map((skill) => skill.region_id));
  const validSections = new Set(skillMap.skills.map((skill) => skill.syllabus_topic));

  if (matrix.skill_summary.reviewed_skill_count !== matrix.coverage_rows.length) {
    errors.push('summary skill count does not equal row count');
  }
  if (new Set(skillRefs).size !== skillRefs.length) {
    errors.push('duplicate skill row');
  }
  for (const ref of expectedSkillRefs) {
    if (!skillRefs.includes(ref)) {
      errors.push(`missing reviewed P3 skill ${ref}`);
    }
  }
  for (const ref of skillRefs) {
    if (!skillByRef.has(ref)) {
      errors.push(`unknown skill_ref ${ref}`);
    }
    if (!ref.startsWith('p3_')) {
      errors.push(`non-P3 skill_ref ${ref}`);
    }
  }

  for (const row of matrix.coverage_rows) {
    const skill = skillByRef.get(row.skill_ref);
    const requiredFields = [
      'skill_ref',
      'skill_title',
      'official_syllabus_section',
      'curriculum_role',
      'region_id',
      'region_title',
      'coverage_status',
      'correction_priority',
      'recommended_next_action',
      'clean_mastery_evidence_count',
      'clean_mastery_evidence_question_ids',
      'evidence_resilience_status',
      'deferred_evidence_count',
      'deferred_evidence_question_ids',
      'practice_allowed_deferred_count',
      'export_allowed_evidence_count',
      'support_gaps',
      'blocking_reasons',
      'prerequisite_skill_refs',
    ] as const;
    for (const field of requiredFields) {
      if (!(field in row)) {
        errors.push(`row ${row.skill_ref} missing required field ${field}`);
      }
    }
    if (skill) {
      if (row.region_id !== skill.region_id) {
        errors.push(`row ${row.skill_ref} region_id does not match skill map`);
      }
      if (row.official_syllabus_section !== skill.syllabus_topic) {
        errors.push(`row ${row.skill_ref} syllabus section does not match skill map`);
      }
      if (row.curriculum_role !== skill.curriculum_role) {
        errors.push(`row ${row.skill_ref} curriculum_role does not match skill map`);
      }
    }
    if (!validRegions.has(row.region_id)) {
      errors.push(`unknown region id ${row.region_id}`);
    }
    if (!validSections.has(row.official_syllabus_section)) {
      errors.push(`invalid syllabus section ${row.official_syllabus_section}`);
    }
    if (!validCurriculumRoles.includes(row.curriculum_role)) {
      errors.push(`invalid curriculum_role ${row.curriculum_role}`);
    }
    if (!coverageStatusLabels.includes(row.coverage_status)) {
      errors.push(`invalid coverage_status ${row.coverage_status}`);
    }
    if (!correctionPriorityLabels.includes(row.correction_priority)) {
      errors.push(`invalid correction_priority ${row.correction_priority}`);
    }
    if (typeof row.recommended_next_action !== 'string' || row.recommended_next_action.trim() === '') {
      errors.push(`row ${row.skill_ref} missing deterministic recommended_next_action`);
    }
    const countFields = [
      'canonical_question_count',
      'clean_mastery_evidence_count',
      'deferred_evidence_count',
      'practice_allowed_deferred_count',
      'export_allowed_evidence_count',
    ] as const;
    for (const field of countFields) {
      if (!Number.isInteger(row[field]) || row[field] < 0) {
        errors.push(`row ${row.skill_ref} has invalid count ${field}`);
      }
    }
    if (row.clean_mastery_evidence_count !== row.clean_mastery_evidence_question_ids.length) {
      errors.push(`row ${row.skill_ref} clean evidence count mismatch`);
    }
    if (!['blocked_no_clean_mastery_evidence', 'thin_resilience_risk', 'healthy_evidence_count'].includes(row.evidence_resilience_status)) {
      errors.push(`row ${row.skill_ref} invalid evidence resilience status`);
    }
    if (row.deferred_evidence_count !== row.deferred_evidence_question_ids.length) {
      errors.push(`row ${row.skill_ref} deferred evidence count mismatch`);
    }
    if (row.practice_allowed_deferred_count !== row.deferred_evidence_count) {
      errors.push(`row ${row.skill_ref} practice deferred count mismatch`);
    }
    if (row.export_allowed_evidence_count !== row.clean_mastery_evidence_count) {
      errors.push(`row ${row.skill_ref} export count is not clean mastery count`);
    }
    const clean = new Set(row.clean_mastery_evidence_question_ids);
    for (const questionId of row.deferred_evidence_question_ids) {
      if (clean.has(questionId)) {
        errors.push(`row ${row.skill_ref} counts deferred evidence as clean mastery`);
      }
    }
    for (const ref of row.prerequisite_skill_refs) {
      if (ref.syllabus_id !== 'caie_9709_p1_2026_2027') {
        errors.push(`row ${row.skill_ref} has non-P1 prerequisite ref`);
      }
      if (row.clean_mastery_evidence_question_ids.includes(ref.skill_ref)) {
        errors.push(`row ${row.skill_ref} counts P1 prerequisite support as mastery evidence`);
      }
    }
  }

  if (JSON.stringify(matrix.skill_summary.coverage_status_counts) !== JSON.stringify(countRows(matrix.coverage_rows, 'coverage_status', coverageStatusLabels))) {
    errors.push('coverage_status summary mismatch');
  }
  if (JSON.stringify(matrix.skill_summary.correction_priority_counts) !== JSON.stringify(countRows(matrix.coverage_rows, 'correction_priority', correctionPriorityLabels))) {
    errors.push('correction_priority summary mismatch');
  }
  const resilienceLabels = ['blocked_no_clean_mastery_evidence', 'healthy_evidence_count', 'thin_resilience_risk'];
  if (JSON.stringify(matrix.evidence_resilience_summary.status_counts) !== JSON.stringify(countRows(matrix.coverage_rows, 'evidence_resilience_status', resilienceLabels))) {
    errors.push('evidence resilience summary mismatch');
  }
  if (JSON.stringify(matrix.region_summary.skill_counts) !== JSON.stringify(countRowsDynamic(matrix.coverage_rows, 'region_id'))) {
    errors.push('region summary mismatch');
  }
  if (JSON.stringify(matrix.official_syllabus_section_summary.skill_counts) !== JSON.stringify(countRowsDynamic(matrix.coverage_rows, 'official_syllabus_section'))) {
    errors.push('syllabus section summary mismatch');
  }

  const deferredPairs = new Set(
    matrix.coverage_rows.flatMap((row) => row.deferred_evidence_question_ids.map((questionId) => `${row.skill_ref}/${questionId}`)),
  );
  const backlogPairs = new Set(matrix.deferred_evidence_summary.items.map((item) => `${item.skill_ref}/${item.question_id}`));
  if (matrix.deferred_evidence_summary.case_count !== matrix.deferred_evidence_summary.items.length) {
    errors.push('deferred case count mismatch');
  }
  if (matrix.deferred_evidence_summary.case_count !== deferredPairs.size) {
    errors.push('deferred row evidence is not fully represented in summary');
  }
  for (const pair of deferredPairs) {
    if (!backlogPairs.has(pair)) {
      errors.push(`deferred case missing from backlog ${pair}`);
    }
  }
  for (const item of matrix.deferred_evidence_summary.items) {
    if (item.mastery_evidence_allowed !== false || item.practice_allowed !== true || item.export_allowed !== false) {
      errors.push(`malformed deferred policy fields for ${item.skill_ref}/${item.question_id}`);
    }
  }
  if (matrix.deferred_evidence_summary.items.length > 0) {
    if (
      matrix.deferred_evidence_summary.mastery_evidence_allowed !== false
      || matrix.deferred_evidence_summary.practice_allowed !== true
      || matrix.deferred_evidence_summary.export_allowed !== false
    ) {
      errors.push('malformed deferred summary policy fields');
    }
  } else if (
    matrix.deferred_evidence_summary.mastery_evidence_allowed !== null
    || matrix.deferred_evidence_summary.practice_allowed !== null
    || matrix.deferred_evidence_summary.export_allowed !== null
  ) {
    errors.push('empty deferred summary policy fields must be null');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
}

function expectMatrixValidationFailure(matrix: CoverageMatrix, skillMap: SkillMap, expectedMessage: string) {
  expect(() => validateMatrixContract(matrix, skillMap)).toThrow(expectedMessage);
}

function withTempDir<T>(callback: (dir: string) => T) {
  const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-matrix-'));
  try {
    return callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function buildMatrixToTemp(dir: string) {
  const jsonOutput = path.join(dir, 'p3_coverage_matrix.json');
  const markdownOutput = path.join(dir, 'p3_coverage_matrix.md');
  runPython([
    scriptPath,
    '--skill-map',
    skillMapPath,
    '--inventory',
    inventoryPath,
    '--json-output',
    jsonOutput,
    '--markdown-output',
    markdownOutput,
  ]);
  return {
    jsonOutput,
    markdownOutput,
    matrix: readJson<CoverageMatrix>(jsonOutput),
    markdown: readFileSync(markdownOutput, 'utf8'),
  };
}

function addSyntheticMatrixDeferredCase(matrix: CoverageMatrix, skillRef = 'p3_int_partial_fractions', questionId = 'fixture_deferred_q') {
  const row = matrix.coverage_rows.find((item) => item.skill_ref === skillRef);
  if (!row) {
    throw new Error(`Expected matrix row ${skillRef}`);
  }
  row.deferred_evidence_question_ids = Array.from(new Set([...row.deferred_evidence_question_ids, questionId]));
  row.deferred_evidence_count = row.deferred_evidence_question_ids.length;
  row.practice_allowed_deferred_count = row.deferred_evidence_count;
  matrix.deferred_evidence_summary.items = [{
    skill_ref: skillRef,
    question_id: questionId,
    mastery_evidence_allowed: false,
    practice_allowed: true,
    export_allowed: false,
  }];
  matrix.deferred_evidence_summary.case_count = 1;
  matrix.deferred_evidence_summary.affected_skill_count = 1;
  matrix.deferred_evidence_summary.mastery_evidence_allowed = false;
  matrix.deferred_evidence_summary.practice_allowed = true;
  matrix.deferred_evidence_summary.export_allowed = false;
  return row;
}

function addSyntheticInventoryDeferredCase(inventory: {
  per_skill_inventory: Array<Record<string, unknown> & { skill_ref: string }>;
  routing_audit_summary: {
    deferred_review_backlog: Record<string, unknown> & { items: Array<Record<string, unknown>> };
  };
}, skillRef = 'p3_int_partial_fractions', questionId = 'fixture_deferred_q') {
  const row = inventory.per_skill_inventory.find((item) => item.skill_ref === skillRef);
  if (!row) {
    throw new Error(`Expected inventory row ${skillRef}`);
  }
  const addId = (field: string) => {
    const current = Array.isArray(row[field]) ? row[field] as string[] : [];
    row[field] = Array.from(new Set([...current, questionId]));
  };
  addId('canonical_question_ids');
  addId('practice_allowed_question_ids');
  addId('teacher_review_deferred_question_ids');
  addId('mastery_evidence_blocked_question_ids');
  addId('practice_allowed_deferred_question_ids');
  addId('export_blocked_deferred_question_ids');

  const backlog = inventory.routing_audit_summary.deferred_review_backlog;
  backlog.items = [{
    app_region_id: row.region_id,
    evidence_status: 'ambiguous_part_level_evidence',
    export_allowed: false,
    mastery_evidence_allowed: false,
    practice_allowed: true,
    question_id: questionId,
    resolution_status: 'teacher_review_deferred',
    reviewed_skill_map_region_id: row.region_id,
    skill_ref: skillRef,
  }];
  backlog.case_count = 1;
  backlog.mastery_evidence_allowed = false;
  backlog.practice_allowed = true;
  backlog.export_allowed = false;
  backlog.mastery_evidence_blocked_case_count = 1;
  backlog.practice_allowed_case_count = 1;
  backlog.export_blocked_case_count = 1;
  return row;
}

describe('P3 coverage matrix', () => {
  it('builds the real deterministic JSON and Markdown reports', () => {
    withTempDir((dir) => {
      const { jsonOutput, markdownOutput, matrix, markdown } = buildMatrixToTemp(dir);

      expect(existsSync(jsonOutput)).toBe(true);
      expect(existsSync(markdownOutput)).toBe(true);
      expect(matrix.schema_name).toBe('asterion_p3_coverage_matrix');
      expect(matrix.schema_version).toBe(1);
      expect(matrix.generated_label).toBe('deterministic-p3-coverage-matrix-v1');
      expect(markdown).toContain('# P3 Coverage Matrix');
      expect(markdown).toContain('## Compact Skill Matrix');
      expect(markdown).toContain('## Evidence Resilience Risks');
      expect(markdown).toContain('## Deferred Ambiguous Evidence');
    });
  });

  it('includes every reviewed P3 skill exactly once', () => {
    const skillMap = readJson<SkillMap>(skillMapPath);
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);
    const matrixSkillRefs = skillRefs(matrix);

    expect(matrix.skill_summary.reviewed_skill_count).toBe(40);
    expect(matrixSkillRefs).toHaveLength(40);
    expect(new Set(matrixSkillRefs).size).toBe(40);
    expect(new Set(matrixSkillRefs)).toEqual(new Set(skillMap.skills.map((skill) => skill.skill_id)));
  });

  it('validates the real matrix against the reviewed P3 skill-map contract', () => {
    const skillMap = readJson<SkillMap>(skillMapPath);
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);

    expect(() => validateMatrixContract(matrix, skillMap)).not.toThrow();
    for (const row of matrix.coverage_rows) {
      expect(row.skill_id).toBe(row.skill_ref);
      expect(row.skill_ref.startsWith('p3_')).toBe(true);
      expect(row.region_title.trim()).not.toBe('');
      expect(row.skill_title.trim()).not.toBe('');
      expect(row.recommended_next_action.trim()).not.toBe('');
      expect(validCurriculumRoles).toContain(row.curriculum_role);
      expect(coverageStatusLabels).toContain(row.coverage_status);
      expect(correctionPriorityLabels).toContain(row.correction_priority);
    }
  });

  it('keeps p3_log_calculus_contexts clean and ready after image-backed audit', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);
    const logCalculusRows = matrix.coverage_rows.filter((row) => row.skill_ref === 'p3_log_calculus_contexts');
    const logCalculus = logCalculusRows[0];

    expect(logCalculusRows).toHaveLength(1);
    expect(logCalculus.coverage_status).toBe('ready_for_review');
    expect(logCalculus.correction_priority).toBe('P4_polish_or_complete');
    expect(logCalculus.clean_mastery_evidence_count).toBe(5);
    expect(logCalculus.deferred_evidence_count).toBe(0);
    expect(logCalculus.blocking_reasons).toEqual([]);
    expect(logCalculus.recommended_next_action).toContain('Teacher review can confirm');
    expect(logCalculus.recommended_next_action).not.toContain('random content');
    expect(matrix.risk_summary.blocked_mastery_skill_refs).not.toContain('p3_log_calculus_contexts');
  });

  it('reports a closed deferred-evidence backlog without manufacturing mastery blockers', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);
    const deferredSummary = matrix.deferred_evidence_summary;

    expect(deferredSummary.case_count).toBe(0);
    expect(deferredSummary.affected_skill_count).toBe(0);
    expect(deferredSummary.mastery_evidence_allowed).toBe(null);
    expect(deferredSummary.practice_allowed).toBe(null);
    expect(deferredSummary.export_allowed).toBe(null);
    expect(deferredSummary.items).toEqual([]);
    const rowDeferredPairs = new Set(
      matrix.coverage_rows.flatMap((row) => row.deferred_evidence_question_ids.map((questionId) => `${row.skill_ref}/${questionId}`)),
    );
    expect(rowDeferredPairs.size).toBe(0);

    for (const row of matrix.coverage_rows) {
      const cleanIds = new Set(row.clean_mastery_evidence_question_ids);
      expect(row.practice_allowed_deferred_count).toBe(row.deferred_evidence_count);
      expect(row.export_allowed_evidence_count).toBe(row.clean_mastery_evidence_count);
      for (const questionId of row.deferred_evidence_question_ids) {
        expect(cleanIds.has(questionId), `${row.skill_ref}/${questionId} should not count as clean mastery evidence`).toBe(false);
      }
    }
  });

  it('keeps P1 prerequisite refs separate from P3 mastery evidence', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);

    expect(matrix.risk_summary.p1_prerequisite_refs_are_mastery_evidence).toBe(false);
    expect(skillRefs(matrix).every((ref) => ref.startsWith('p3_'))).toBe(true);
    for (const row of matrix.coverage_rows) {
      for (const prerequisiteRef of row.prerequisite_skill_refs) {
        expect(prerequisiteRef.syllabus_id).toBe('caie_9709_p1_2026_2027');
        expect(row.skill_ref).not.toBe(prerequisiteRef.skill_ref);
        expect(row.clean_mastery_evidence_question_ids).not.toContain(prerequisiteRef.skill_ref);
      }
    }
  });

  it('keeps teaching support gaps limited to quarantined Algebra warm-ups', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);
    const quarantinedAlgebraWarmupSkills = new Set(quarantinedAlgebraWarmupSkillRefs);

    expect(matrix.teaching_support_summary.skills_with_any_support_gap).toBe(quarantinedAlgebraWarmupSkillRefs.length);
    expect(matrix.teaching_support_summary.support_gap_counts).toMatchObject({
      field_guide: 0,
      quick_check: 0,
      snippet: 0,
      warm_up: quarantinedAlgebraWarmupSkillRefs.length,
      worked_example: 0,
    });
    expect(matrix.teaching_support_summary.expected_support_types).toEqual(supportTypes);
    expect(matrix.coverage_rows.find((row) => row.skill_ref === 'p3_log_calculus_contexts')?.support_gaps).toEqual([]);
    expect(matrix.risk_summary.blocked_mastery_skill_refs).toEqual([]);
    expect(matrix.evidence_resilience_summary.thin_resilience_risk_skill_refs).toContain('p3_alg_discriminant_root_conditions');
    expect(matrix.evidence_resilience_summary.blocked_no_clean_mastery_evidence_skill_refs).toEqual([]);

    for (const row of matrix.coverage_rows) {
      expect(row.support_gaps, row.skill_ref).toEqual(
        quarantinedAlgebraWarmupSkills.has(row.skill_ref) ? ['warm_up'] : [],
      );
      expect(row.blocking_reasons, row.skill_ref).toEqual([]);
    }
  });

  it('keeps summary counts aligned with detailed rows and Markdown', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);
    const markdown = readFileSync(matrixMarkdownPath, 'utf8');
    expect(matrix.skill_summary.reviewed_skill_count).toBe(matrix.coverage_rows.length);
    expect(matrix.skill_summary.coverage_status_counts).toEqual(countRows(matrix.coverage_rows, 'coverage_status', coverageStatusLabels));
    expect(matrix.skill_summary.correction_priority_counts).toEqual(countRows(matrix.coverage_rows, 'correction_priority', correctionPriorityLabels));
    expect(matrix.region_summary.skill_counts).toEqual(countRowsDynamic(matrix.coverage_rows, 'region_id'));
    expect(matrix.official_syllabus_section_summary.skill_counts).toEqual(countRowsDynamic(matrix.coverage_rows, 'official_syllabus_section'));
    expect(matrix.region_summary.region_count).toBe(Object.keys(matrix.region_summary.skill_counts).length);
    expect(matrix.official_syllabus_section_summary.section_count).toBe(Object.keys(matrix.official_syllabus_section_summary.skill_counts).length);

    for (const [status, count] of Object.entries(matrix.skill_summary.coverage_status_counts)) {
      expect(markdown).toContain(`- \`${status}\`: ${count}`);
    }
    for (const [priority, count] of Object.entries(matrix.skill_summary.correction_priority_counts)) {
      expect(markdown).toContain(`- \`${priority}\`: ${count}`);
    }
    for (const [section, count] of Object.entries(matrix.official_syllabus_section_summary.skill_counts)) {
      expect(markdown).toContain(`- \`${section}\`: ${count}`);
    }
    for (const [regionId, count] of Object.entries(matrix.region_summary.skill_counts)) {
      expect(markdown).toContain(`- \`${regionId}\` (${matrix.region_summary.region_titles[regionId]}): ${count}`);
    }
  });

  it('writes a Markdown report with the required teacher-facing sections', () => {
    execFileSync('npm', ['run', 'coverage:p3-matrix'], {
      cwd: repoRoot,
      timeout: pythonTimeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    });

    const markdown = readFileSync(matrixMarkdownPath, 'utf8');
    expect(markdown).toContain('## Executive Summary');
    expect(markdown).toContain('## Counts By Official Syllabus Section');
    expect(markdown).toContain('## Counts By Region');
    expect(markdown).toContain('## Priority Buckets');
    expect(markdown).toContain('## Compact Skill Matrix');
    expect(markdown).toContain('## Evidence Resilience Risks');
    expect(markdown).toContain('## Blocked Mastery Skills');
    expect(markdown).toContain('## Deferred Ambiguous Evidence');
    expect(markdown).toContain('## Support Gaps');
    expect(markdown).toContain('## Suggested Region-By-Region Correction Order');
    expect(markdownSection(markdown, '## Blocked Mastery Skills')).toContain('No skills are currently blocked for mastery.');
    expect(markdownSection(markdown, '## Evidence Resilience Risks')).toContain('p3_alg_discriminant_root_conditions');
    expect(markdownSection(markdown, '## Blocked Mastery Skills')).not.toContain('p3_log_calculus_contexts');
    expect(markdownSection(markdown, '## Deferred Ambiguous Evidence')).toContain('Deferred case count: 0');
    expect(markdownSection(markdown, '## Deferred Ambiguous Evidence')).not.toContain('p3_log_calculus_contexts');
    expect(markdown).toContain('mastery-ineligible');
    expect(markdown).not.toMatch(/deferred evidence is clean mastery evidence/i);

    const compactTable = markdownSection(markdown, '## Compact Skill Matrix');
    expect(compactTable.split('\n').filter((line) => line.startsWith('| p3_'))).toHaveLength(40);
  });

  it('fails validation for an unknown skill ref fixture', () => {
    withTempDir((dir) => {
      const inventory = readJson<{ per_skill_inventory: Array<{ skill_ref: string }> }>(inventoryPath);
      inventory.per_skill_inventory[0] = {
        ...inventory.per_skill_inventory[0],
        skill_ref: 'p3_unknown_fixture_skill',
      };
      const badInventoryPath = path.join(dir, 'inventory_unknown_skill.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('references unknown reviewed P3 skill');
    });
  });

  it('fails validation for duplicate and missing reviewed skill rows', () => {
    withTempDir((dir) => {
      const inventory = readJson<{ per_skill_inventory: Array<{ skill_ref: string }> }>(inventoryPath);
      inventory.per_skill_inventory[1] = {
        ...inventory.per_skill_inventory[1],
        skill_ref: inventory.per_skill_inventory[0].skill_ref,
      };
      const badInventoryPath = path.join(dir, 'inventory_duplicate_skill.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('duplicate row for reviewed skill');
      expect(output).toContain('inventory is missing reviewed skill rows');
    });
  });

  it('fails validation when a reviewed P3 skill row is missing', () => {
    withTempDir((dir) => {
      const inventory = readJson<{ per_skill_inventory: Array<{ skill_ref: string }> }>(inventoryPath);
      inventory.per_skill_inventory = inventory.per_skill_inventory.filter((row) => row.skill_ref !== 'p3_int_partial_fractions');
      const badInventoryPath = path.join(dir, 'inventory_missing_skill.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('inventory is missing reviewed skill rows: p3_int_partial_fractions');
    });
  });

  it('fails validation for an unknown region id fixture', () => {
    withTempDir((dir) => {
      const inventory = readJson<{ per_skill_inventory: Array<{ region_id: string }> }>(inventoryPath);
      inventory.per_skill_inventory[0] = {
        ...inventory.per_skill_inventory[0],
        region_id: 'unknown-region-fixture',
      };
      const badInventoryPath = path.join(dir, 'inventory_unknown_region.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('references unknown region_id unknown-region-fixture');
    });
  });

  it('fails validation for an invalid inventory status label fixture', () => {
    withTempDir((dir) => {
      const inventory = readJson<{ per_skill_inventory: Array<{ instructional_status: string }> }>(inventoryPath);
      inventory.per_skill_inventory[0] = {
        ...inventory.per_skill_inventory[0],
        instructional_status: 'fixture_invalid_status',
      };
      const badInventoryPath = path.join(dir, 'inventory_invalid_status.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('has invalid instructional_status fixture_invalid_status');
    });
  });

  it('fails validation for invalid curriculum role and official syllabus section fixtures', () => {
    withTempDir((dir) => {
      const skillMap = readJson<SkillMap>(skillMapPath);
      skillMap.skills[0] = {
        ...skillMap.skills[0],
        curriculum_role: 'fixture_invalid_role',
        syllabus_topic: 'Fixture invalid section',
      };
      const badSkillMapPath = path.join(dir, 'skill_map_invalid_contract.json');
      writeFileSync(badSkillMapPath, JSON.stringify(skillMap), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        badSkillMapPath,
        '--inventory',
        inventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('unknown curriculum_role fixture_invalid_role');
      expect(output).toContain('unexpected syllabus topic: Fixture invalid section');
    });
  });

  it('fails validation for negative evidence or support counts', () => {
    withTempDir((dir) => {
      const inventory = readJson<{ per_skill_inventory: Array<Record<string, unknown>> }>(inventoryPath);
      inventory.per_skill_inventory[0] = {
        ...inventory.per_skill_inventory[0],
        snippet_count: -1,
      };
      const badInventoryPath = path.join(dir, 'inventory_negative_count.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('invalid non-negative count snippet_count=-1');
    });
  });

  it('fails validation when required inventory row fields are missing', () => {
    withTempDir((dir) => {
      const inventory = readJson<{ per_skill_inventory: Array<Record<string, unknown>> }>(inventoryPath);
      delete inventory.per_skill_inventory[0].practice_allowed_deferred_question_ids;
      const badInventoryPath = path.join(dir, 'inventory_missing_required_field.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('missing required fields: practice_allowed_deferred_question_ids');
    });
  });

  it('fails validation if deferred evidence is counted as clean mastery evidence', () => {
    withTempDir((dir) => {
      const inventory = readJson<{
        per_skill_inventory: Array<Record<string, unknown> & { skill_ref: string }>;
        routing_audit_summary: {
          deferred_review_backlog: Record<string, unknown> & { items: Array<Record<string, unknown>> };
        };
      }>(inventoryPath);
      const row = addSyntheticInventoryDeferredCase(inventory);
      row.mastery_evidence_question_ids = ['fixture_deferred_q'];
      row.mastery_evidence_question_count = 1;
      const rowIndex = inventory.per_skill_inventory.findIndex((item) => item.skill_ref === row.skill_ref);
      inventory.per_skill_inventory[rowIndex] = {
        ...row,
        mastery_evidence_question_count: 1,
        mastery_evidence_question_ids: ['fixture_deferred_q'],
      };
      const badInventoryPath = path.join(dir, 'inventory_deferred_as_clean.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('counts deferred evidence as clean mastery evidence');
    });
  });

  it('fails validation if deferred evidence is not export-blocked', () => {
    withTempDir((dir) => {
      const inventory = readJson<{
        per_skill_inventory: Array<Record<string, unknown> & { skill_ref: string }>;
        routing_audit_summary: {
          deferred_review_backlog: Record<string, unknown> & { items: Array<Record<string, unknown>> };
        };
      }>(inventoryPath);
      addSyntheticInventoryDeferredCase(inventory);
      const rowIndex = inventory.per_skill_inventory.findIndex((row) => row.skill_ref === 'p3_int_partial_fractions');
      inventory.per_skill_inventory[rowIndex] = {
        ...inventory.per_skill_inventory[rowIndex],
        export_blocked_deferred_question_ids: [],
      };
      const badInventoryPath = path.join(dir, 'inventory_deferred_not_export_blocked.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('deferred evidence missing from export_blocked_deferred_question_ids');
    });
  });

  it('fails validation if a deferred case disappears from the deferred backlog', () => {
    withTempDir((dir) => {
      const inventory = readJson<{
        per_skill_inventory: Array<Record<string, unknown> & { skill_ref: string }>;
        routing_audit_summary: {
          deferred_review_backlog: Record<string, unknown> & { items: Array<Record<string, unknown>> };
        };
      }>(inventoryPath);
      addSyntheticInventoryDeferredCase(inventory);
      const backlog = inventory.routing_audit_summary.deferred_review_backlog;
      backlog.items = [];
      backlog.case_count = 0;
      backlog.mastery_evidence_allowed = null;
      backlog.practice_allowed = null;
      backlog.export_allowed = null;
      backlog.mastery_evidence_blocked_case_count = 0;
      backlog.practice_allowed_case_count = 0;
      backlog.export_blocked_case_count = 0;
      const badInventoryPath = path.join(dir, 'inventory_missing_deferred_backlog_case.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('deferred cases missing from deferred backlog');
    });
  });

  it('fails validation for malformed deferred policy fields', () => {
    withTempDir((dir) => {
      const inventory = readJson<{
        per_skill_inventory: Array<Record<string, unknown> & { skill_ref: string }>;
        routing_audit_summary: {
          deferred_review_backlog: Record<string, unknown> & { items: Array<Record<string, unknown>> };
        };
      }>(inventoryPath);
      addSyntheticInventoryDeferredCase(inventory);
      inventory.routing_audit_summary.deferred_review_backlog.mastery_evidence_allowed = true;
      inventory.routing_audit_summary.deferred_review_backlog.items[0].mastery_evidence_allowed = true;
      const badInventoryPath = path.join(dir, 'inventory_malformed_deferred_policy.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('deferred_review_backlog.mastery_evidence_allowed must be false');
      expect(output).toContain('mastery_evidence_allowed must be false');
    });
  });

  it('fails validation if P1 prerequisite support is counted as P3 mastery evidence', () => {
    withTempDir((dir) => {
      const inventory = readJson<{
        per_skill_inventory: Array<{
          skill_ref: string;
          mastery_evidence_question_count: number;
          mastery_evidence_question_ids: string[];
          prerequisite_skill_refs: Array<{ skill_ref: string }>;
        }>;
      }>(inventoryPath);
      const rowIndex = inventory.per_skill_inventory.findIndex((row) => row.prerequisite_skill_refs.length > 0);
      const p1Ref = inventory.per_skill_inventory[rowIndex].prerequisite_skill_refs[0].skill_ref;
      inventory.per_skill_inventory[rowIndex] = {
        ...inventory.per_skill_inventory[rowIndex],
        mastery_evidence_question_count: 1,
        mastery_evidence_question_ids: [p1Ref],
      };
      const badInventoryPath = path.join(dir, 'inventory_p1_as_p3_mastery.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('counts non-canonical evidence as clean mastery evidence');
    });
  });

  it('fails validation for unsafe mastery evidence from unresolved routing mismatches', () => {
    withTempDir((dir) => {
      const inventory = readJson<{
        per_skill_inventory: Array<{
          skill_ref: string;
          canonical_question_ids: string[];
          canonical_question_ids_routed_to_skill: string[];
          mastery_evidence_question_count: number;
          mastery_evidence_question_ids: string[];
          practice_allowed_question_ids: string[];
          unreviewed_app_region_mismatch_question_ids: string[];
        }>;
      }>(inventoryPath);
      const rowIndex = inventory.per_skill_inventory.findIndex((row) => row.mastery_evidence_question_ids.length > 0);
      const questionId = 'fixture_unsafe_q01';
      inventory.per_skill_inventory[rowIndex] = {
        ...inventory.per_skill_inventory[rowIndex],
        canonical_question_ids: [...inventory.per_skill_inventory[rowIndex].canonical_question_ids, questionId],
        canonical_question_ids_routed_to_skill: [...inventory.per_skill_inventory[rowIndex].canonical_question_ids_routed_to_skill, questionId],
        mastery_evidence_question_count: inventory.per_skill_inventory[rowIndex].mastery_evidence_question_count + 1,
        mastery_evidence_question_ids: [...inventory.per_skill_inventory[rowIndex].mastery_evidence_question_ids, questionId],
        practice_allowed_question_ids: [...inventory.per_skill_inventory[rowIndex].practice_allowed_question_ids, questionId],
        unreviewed_app_region_mismatch_question_ids: [questionId],
      };
      const badInventoryPath = path.join(dir, 'inventory_unsafe_mastery.json');
      writeFileSync(badInventoryPath, JSON.stringify(inventory), 'utf8');

      const output = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapPath,
        '--inventory',
        badInventoryPath,
        '--json-output',
        path.join(dir, 'out.json'),
        '--markdown-output',
        path.join(dir, 'out.md'),
      ]);
      expect(output).toContain('counts unreviewed mismatch evidence as clean mastery evidence');
    });
  });

  it('local matrix contract fixtures fail for invalid row labels and mismatched summaries', () => {
    const skillMap = readJson<SkillMap>(skillMapPath);
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);

    const invalidStatus = clone(matrix);
    invalidStatus.coverage_rows[0].coverage_status = 'fixture_invalid_status' as CoverageStatus;
    expectMatrixValidationFailure(invalidStatus, skillMap, 'invalid coverage_status fixture_invalid_status');

    const invalidPriority = clone(matrix);
    invalidPriority.coverage_rows[0].correction_priority = 'fixture_invalid_priority' as CorrectionPriority;
    expectMatrixValidationFailure(invalidPriority, skillMap, 'invalid correction_priority fixture_invalid_priority');

    const invalidRole = clone(matrix);
    invalidRole.coverage_rows[0].curriculum_role = 'fixture_invalid_role';
    expectMatrixValidationFailure(invalidRole, skillMap, 'invalid curriculum_role fixture_invalid_role');

    const invalidSection = clone(matrix);
    invalidSection.coverage_rows[0].official_syllabus_section = 'Fixture invalid section';
    expectMatrixValidationFailure(invalidSection, skillMap, 'invalid syllabus section Fixture invalid section');

    const mismatchedSummary = clone(matrix);
    mismatchedSummary.skill_summary.coverage_status_counts.ready_for_review += 1;
    expectMatrixValidationFailure(mismatchedSummary, skillMap, 'coverage_status summary mismatch');
  });

  it('local matrix contract fixtures fail for missing fields, bad counts, and unsafe deferred/export state', () => {
    const skillMap = readJson<SkillMap>(skillMapPath);
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);

    const missingField = clone(matrix);
    delete (missingField.coverage_rows[0] as unknown as Record<string, unknown>).recommended_next_action;
    expectMatrixValidationFailure(missingField, skillMap, 'missing required field recommended_next_action');

    const negativeCount = clone(matrix);
    negativeCount.coverage_rows[0].clean_mastery_evidence_count = -1;
    expectMatrixValidationFailure(negativeCount, skillMap, 'invalid count clean_mastery_evidence_count');

    const deferredAsClean = clone(matrix);
    const deferredRow = addSyntheticMatrixDeferredCase(deferredAsClean);
    deferredRow.clean_mastery_evidence_question_ids.push(deferredRow.deferred_evidence_question_ids[0]);
    deferredRow.clean_mastery_evidence_count = deferredRow.clean_mastery_evidence_question_ids.length;
    deferredRow.export_allowed_evidence_count = deferredRow.clean_mastery_evidence_count;
    expectMatrixValidationFailure(deferredAsClean, skillMap, 'counts deferred evidence as clean mastery');

    const deferredExportAllowed = clone(matrix);
    deferredExportAllowed.coverage_rows[0].export_allowed_evidence_count += 1;
    expectMatrixValidationFailure(deferredExportAllowed, skillMap, 'export count is not clean mastery count');

    const malformedDeferredPolicy = clone(matrix);
    addSyntheticMatrixDeferredCase(malformedDeferredPolicy);
    malformedDeferredPolicy.deferred_evidence_summary.items[0].export_allowed = true;
    expectMatrixValidationFailure(malformedDeferredPolicy, skillMap, 'malformed deferred policy fields');
  });

  it('runs through the npm matrix script', () => {
    execFileSync('npm', ['run', 'coverage:p3-matrix'], {
      cwd: repoRoot,
      timeout: pythonTimeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    });

    expect(existsSync(matrixJsonPath)).toBe(true);
    expect(existsSync(matrixMarkdownPath)).toBe(true);
  });

  it('records that app labels, DeepSeek labels, and question-bank labels do not override the reviewed skill map', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);

    expect(matrix.risk_summary.app_and_deepseek_labels_override_reviewed_skill_map).toBe(false);
  });
});
