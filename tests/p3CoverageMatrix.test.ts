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
  skill_summary: {
    reviewed_skill_count: number;
    coverage_status_counts: Record<CoverageStatus, number>;
    correction_priority_counts: Record<CorrectionPriority, number>;
  };
  coverage_rows: Array<{
    skill_ref: string;
    region_id: string;
    coverage_status: CoverageStatus;
    correction_priority: CorrectionPriority;
    clean_mastery_evidence_count: number;
    clean_mastery_evidence_question_ids: string[];
    deferred_evidence_count: number;
    deferred_evidence_question_ids: string[];
    practice_allowed_deferred_count: number;
    export_allowed_evidence_count: number;
    support_gaps: string[];
    prerequisite_skill_refs: Array<{ syllabus_id: string; skill_ref: string; relationship: string }>;
    blocking_reasons: string[];
  }>;
  deferred_evidence_summary: {
    case_count: number;
    affected_skill_count: number;
    mastery_evidence_allowed: false;
    practice_allowed: true;
    export_allowed: false;
    items: Array<{
      skill_ref: string;
      question_id: string;
      mastery_evidence_allowed: false;
      practice_allowed: true;
      export_allowed: false;
    }>;
  };
  teaching_support_summary: {
    support_gap_counts: Record<string, number>;
    skills_with_any_support_gap: number;
  };
  risk_summary: {
    blocked_mastery_skill_refs: string[];
    p1_prerequisite_refs_are_mastery_evidence: boolean;
    app_and_deepseek_labels_override_reviewed_skill_map: boolean;
  };
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

function skillRefs(matrix: CoverageMatrix) {
  return matrix.coverage_rows.map((row) => row.skill_ref);
}

function countRows<T extends string>(rows: Array<Record<string, unknown>>, key: string, labels: T[]) {
  return Object.fromEntries(
    labels.map((label) => [label, rows.filter((row) => row[key] === label).length]),
  ) as Record<T, number>;
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
      expect(markdown).toContain('## Deferred Ambiguous Evidence');
    });
  });

  it('includes every reviewed P3 skill exactly once', () => {
    const skillMap = readJson<{ skills: Array<{ skill_id: string }> }>(skillMapPath);
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);
    const matrixSkillRefs = skillRefs(matrix);

    expect(matrix.skill_summary.reviewed_skill_count).toBe(40);
    expect(matrixSkillRefs).toHaveLength(40);
    expect(new Set(matrixSkillRefs).size).toBe(40);
    expect(new Set(matrixSkillRefs)).toEqual(new Set(skillMap.skills.map((skill) => skill.skill_id)));
  });

  it('surfaces p3_int_partial_fractions as blocked and high priority', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);
    const partialFractions = matrix.coverage_rows.find((row) => row.skill_ref === 'p3_int_partial_fractions');

    expect(partialFractions).toBeTruthy();
    expect(partialFractions?.coverage_status).toBe('blocked_for_mastery');
    expect(partialFractions?.correction_priority).toBe('P0_blocked_mastery');
    expect(partialFractions?.clean_mastery_evidence_count).toBe(0);
    expect(partialFractions?.deferred_evidence_count).toBeGreaterThan(0);
    expect(partialFractions?.blocking_reasons).toEqual(expect.arrayContaining([
      'no_clean_mastery_evidence',
      'all_available_evidence_deferred',
    ]));
    expect(matrix.risk_summary.blocked_mastery_skill_refs).toContain('p3_int_partial_fractions');
  });

  it('keeps deferred ambiguous evidence visible and mastery-ineligible', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);
    const deferredSummary = matrix.deferred_evidence_summary;

    expect(deferredSummary.case_count).toBe(20);
    expect(deferredSummary.affected_skill_count).toBe(8);
    expect(deferredSummary.mastery_evidence_allowed).toBe(false);
    expect(deferredSummary.practice_allowed).toBe(true);
    expect(deferredSummary.export_allowed).toBe(false);
    expect(deferredSummary.items).toHaveLength(20);
    for (const item of deferredSummary.items) {
      expect(item.mastery_evidence_allowed).toBe(false);
      expect(item.practice_allowed).toBe(true);
      expect(item.export_allowed).toBe(false);
    }

    for (const row of matrix.coverage_rows) {
      const cleanIds = new Set(row.clean_mastery_evidence_question_ids);
      for (const questionId of row.deferred_evidence_question_ids) {
        expect(cleanIds.has(questionId), `${row.skill_ref}/${questionId} should not count as clean mastery evidence`).toBe(false);
      }
    }
  });

  it('keeps P1 prerequisite refs separate from P3 mastery evidence', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);

    expect(matrix.risk_summary.p1_prerequisite_refs_are_mastery_evidence).toBe(false);
    for (const row of matrix.coverage_rows) {
      for (const prerequisiteRef of row.prerequisite_skill_refs) {
        expect(prerequisiteRef.syllabus_id).toBe('caie_9709_p1_2026_2027');
        expect(row.clean_mastery_evidence_question_ids).not.toContain(prerequisiteRef.skill_ref);
      }
    }
  });

  it('reports support gaps without hiding ordinary missing content', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);

    expect(matrix.teaching_support_summary.skills_with_any_support_gap).toBeGreaterThan(0);
    expect(matrix.teaching_support_summary.support_gap_counts.warm_up).toBe(27);
    expect(matrix.teaching_support_summary.support_gap_counts.quick_check).toBe(6);
    expect(matrix.teaching_support_summary.support_gap_counts.snippet).toBe(1);
    expect(matrix.teaching_support_summary.support_gap_counts.worked_example).toBe(1);
    expect(matrix.coverage_rows.find((row) => row.skill_ref === 'p3_log_calculus_contexts')?.support_gaps).toEqual(
      expect.arrayContaining(['snippet', 'worked_example', 'quick_check', 'warm_up']),
    );
  });

  it('keeps summary counts aligned with detailed rows and Markdown', () => {
    const matrix = readJson<CoverageMatrix>(matrixJsonPath);
    const markdown = readFileSync(matrixMarkdownPath, 'utf8');
    const statusLabels: CoverageStatus[] = [
      'blocked_for_mastery',
      'missing_support',
      'needs_teacher_review',
      'partial',
      'ready_for_review',
    ];
    const priorityLabels: CorrectionPriority[] = [
      'P0_blocked_mastery',
      'P1_missing_core_support',
      'P2_missing_practice_support',
      'P3_teacher_review_backlog',
      'P4_polish_or_complete',
    ];

    expect(matrix.skill_summary.coverage_status_counts).toEqual(countRows(matrix.coverage_rows, 'coverage_status', statusLabels));
    expect(matrix.skill_summary.correction_priority_counts).toEqual(countRows(matrix.coverage_rows, 'correction_priority', priorityLabels));

    for (const [status, count] of Object.entries(matrix.skill_summary.coverage_status_counts)) {
      expect(markdown).toContain(`- \`${status}\`: ${count}`);
    }
    for (const [priority, count] of Object.entries(matrix.skill_summary.correction_priority_counts)) {
      expect(markdown).toContain(`- \`${priority}\`: ${count}`);
    }
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

  it('fails validation if deferred evidence is counted as clean mastery evidence', () => {
    withTempDir((dir) => {
      const inventory = readJson<{
        per_skill_inventory: Array<{
          skill_ref: string;
          mastery_evidence_question_count: number;
          mastery_evidence_question_ids: string[];
          teacher_review_deferred_question_ids: string[];
        }>;
      }>(inventoryPath);
      const rowIndex = inventory.per_skill_inventory.findIndex((row) => row.skill_ref === 'p3_int_partial_fractions');
      const deferredQuestionId = inventory.per_skill_inventory[rowIndex].teacher_review_deferred_question_ids[0];
      inventory.per_skill_inventory[rowIndex] = {
        ...inventory.per_skill_inventory[rowIndex],
        mastery_evidence_question_count: 1,
        mastery_evidence_question_ids: [deferredQuestionId],
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
