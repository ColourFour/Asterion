import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'tools/content_lab/scripts/build_p3_region_correction_queue.py');
const reportJsonPath = path.join(repoRoot, 'tools/content_lab/reports/p3_region_correction_queue.json');
const reportMarkdownPath = path.join(repoRoot, 'tools/content_lab/reports/p3_region_correction_queue.md');
const pythonTimeoutMs = 10_000;
const warmupGapSkillRefs = [
  'p3_alg_discriminant_root_conditions',
  'p3_alg_structure_rearrangement',
  'p3_log_calculus_contexts',
];
const supportQueueSkillRefs = [
  'p3_alg_discriminant_root_conditions',
  'p3_alg_partial_fraction_form',
  'p3_alg_structure_rearrangement',
  'p3_log_calculus_contexts',
];

interface QueueItem {
  queue_id: string;
  workstream: string;
  category: string;
  question_id?: string;
  skill_ref?: string;
  region_id?: string;
  primary_region_id?: string;
  fallback_region_id?: string;
  blocked_or_risky_reason: string;
  recommended_action: string;
  mastery_evidence_allowed?: boolean | null;
  practice_allowed?: boolean | null;
  export_allowed?: boolean | null;
  support_gaps?: string[];
  clean_mastery_evidence_count?: number;
  coverage_status?: string;
}

interface RegionCorrectionQueue {
  schema_name: string;
  schema_version: number;
  generated_label: string;
  source_route_summary: {
    counts: {
      safe_p3_route: number;
      review_needed_route: number;
      ambiguous_multi_topic_route: number;
      missing_p3_route: number;
      total_p3_route_records: number;
    };
  };
  queue_summary: {
    total_queue_item_count: number;
    unique_question_count: number;
    unique_skill_count: number;
    queue_counts: Record<string, Record<string, number>>;
  };
  route_decision_summary: {
    counts_by_status: Record<string, number>;
    total_recorded_decision_count: number;
    decided_question_count: number;
    still_needs_review_count: number;
    decisions: Array<{
      question_id: string;
      reviewed_status: string;
      reviewed_region_id: string;
      reviewed_source_skill_ids?: string[];
      reason: string;
      mastery_evidence_allowed: boolean;
      content_lab_generation_allowed: boolean;
    }>;
  };
  region_summary: Array<{
    region_id: string;
    region_title: string;
    issue_count: number;
    workstreams: Record<string, number>;
    categories: Record<string, number>;
  }>;
  skill_summary: Array<{
    skill_ref: string;
    region_id: string;
    issue_count: number;
    categories: Record<string, number>;
  }>;
  queue: {
    route_correction: {
      missing_p3_routes: QueueItem[];
      ambiguous_multi_topic_routes: QueueItem[];
      review_needed_routes: QueueItem[];
      fallback_display_only_region_placements: QueueItem[];
      audited_route_decisions: QueueItem[];
    };
    text_review: {
      routing_text_or_visual_blockers: QueueItem[];
    };
    mark_scheme_subpart_review: {
      deferred_evidence_cases: QueueItem[];
    };
    support_content_gaps: {
      weak_or_missing_skill_support: QueueItem[];
    };
  };
  next_step_policy: {
    content_mutation_allowed_in_this_pass: boolean;
  };
  inventory_bridge_summary: {
    deferred_case_count: number;
    support_gap_counts: Record<string, number>;
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

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function withTempDir<T>(callback: (dir: string) => T) {
  const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-region-queue-'));
  try {
    return callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function buildQueueToTemp(dir: string) {
  const jsonOutput = path.join(dir, 'p3_region_correction_queue.json');
  const markdownOutput = path.join(dir, 'p3_region_correction_queue.md');
  runPython([
    scriptPath,
    '--json-output',
    jsonOutput,
    '--markdown-output',
    markdownOutput,
  ]);
  return {
    jsonOutput,
    markdownOutput,
    queue: readJson<RegionCorrectionQueue>(jsonOutput),
    markdown: readFileSync(markdownOutput, 'utf8'),
  };
}

function flatItems(queue: RegionCorrectionQueue) {
  return Object.values(queue.queue).flatMap((workstream) => (
    Object.values(workstream).flat()
  ));
}

function countItemsByCategory(queue: RegionCorrectionQueue, workstream: keyof RegionCorrectionQueue['queue'], category: string) {
  const workstreamQueues = queue.queue[workstream] as unknown as Record<string, QueueItem[]>;
  return workstreamQueues[category].length;
}

function expectSummaryCountsMatchDetails(queue: RegionCorrectionQueue) {
  let total = 0;
  for (const [workstream, categoryCounts] of Object.entries(queue.queue_summary.queue_counts)) {
    const workstreamQueues = queue.queue[workstream as keyof RegionCorrectionQueue['queue']] as unknown as Record<string, QueueItem[]>;
    for (const [category, count] of Object.entries(categoryCounts)) {
      expect(workstreamQueues[category].length, `${workstream}.${category}`).toBe(count);
      total += count;
      const ids = workstreamQueues[category].map((item) => item.queue_id);
      expect(new Set(ids).size, `${workstream}.${category} duplicate queue_id`).toBe(ids.length);
      for (const item of workstreamQueues[category]) {
        expect(item.workstream).toBe(workstream);
        expect(item.category).toBe(category);
        expect(item.blocked_or_risky_reason.trim()).not.toBe('');
        expect(item.recommended_action.trim()).not.toBe('');
      }
    }
  }
  expect(queue.queue_summary.total_queue_item_count).toBe(total);
}

describe('P3 region-correction queue', () => {
  it('builds deterministic JSON and Markdown reports', () => {
    withTempDir((dir) => {
      const { jsonOutput, markdownOutput, queue, markdown } = buildQueueToTemp(dir);

      expect(existsSync(jsonOutput)).toBe(true);
      expect(existsSync(markdownOutput)).toBe(true);
      expect(queue.schema_name).toBe('asterion_p3_region_correction_queue');
      expect(queue.schema_version).toBe(1);
      expect(queue.generated_label).toBe('deterministic-p3-region-correction-queue-v1');
      expect(queue.next_step_policy.content_mutation_allowed_in_this_pass).toBe(false);
      expect(markdown).toContain('# P3 Region-Correction Queue');
      expect(markdown).toContain('## Route Correction');
      expect(markdown).toContain('## Text Review');
      expect(markdown).toContain('## Mark-Scheme And Subpart Review');
      expect(markdown).toContain('## Support-Content Gaps');
    });
  });

  it('matches the audit-aligned P3 route classification counts', () => {
    const queue = readJson<RegionCorrectionQueue>(reportJsonPath);

    expect(queue.source_route_summary.counts).toMatchObject({
      total_p3_route_records: 396,
      safe_p3_route: 356,
      missing_p3_route: 12,
      ambiguous_multi_topic_route: 15,
      review_needed_route: 13,
    });
    expect(countItemsByCategory(queue, 'route_correction', 'missing_p3_routes')).toBe(12);
    expect(countItemsByCategory(queue, 'route_correction', 'ambiguous_multi_topic_routes')).toBe(15);
    expect(countItemsByCategory(queue, 'route_correction', 'review_needed_routes')).toBe(13);
    expect(countItemsByCategory(queue, 'route_correction', 'fallback_display_only_region_placements')).toBe(12);
    expect(countItemsByCategory(queue, 'text_review', 'routing_text_or_visual_blockers')).toBeGreaterThan(12);
  });

  it('keeps missing routes and fallback display placements explicit', () => {
    const queue = readJson<RegionCorrectionQueue>(reportJsonPath);
    const missing = queue.queue.route_correction.missing_p3_routes;
    const fallback = queue.queue.route_correction.fallback_display_only_region_placements;
    const missingIds = new Set(missing.map((item) => item.question_id));

    expect(missing).toHaveLength(12);
    expect(fallback).toHaveLength(12);
    for (const item of missing) {
      expect(item.primary_region_id).toBe('');
      expect(item.blocked_or_risky_reason).toContain('No mapped P3 primary topic');
    }
    for (const item of fallback) {
      expect(missingIds.has(item.question_id)).toBe(true);
      expect(item.fallback_region_id).toBeTruthy();
      expect(item.category).toBe('fallback_display_only_region_placements');
    }
  });

  it('keeps reviewed route decisions traceable without hiding unresolved queue records', () => {
    const queue = readJson<RegionCorrectionQueue>(reportJsonPath);

    expect(queue.route_decision_summary.counts_by_status).toMatchObject({
      clean: 6,
      thin: 2,
      ambiguous: 2,
      blocked: 2,
      deferred: 1,
      review_needed: 1,
      fallback_only: 0,
    });
    expect(queue.route_decision_summary.total_recorded_decision_count).toBe(14);
    expect(queue.route_decision_summary.decided_question_count).toBe(14);
    expect(queue.route_decision_summary.still_needs_review_count).toBeGreaterThan(0);

    const q09 = queue.route_decision_summary.decisions.find((item) => item.question_id === '31autumn23_q09');
    expect(q09).toMatchObject({
      reviewed_status: 'ambiguous',
      mastery_evidence_allowed: false,
      content_lab_generation_allowed: false,
    });
    const q01 = queue.route_decision_summary.decisions.find((item) => item.question_id === '31autumn23_q01');
    expect(q01).toMatchObject({
      reviewed_status: 'clean',
      reviewed_region_id: 'calculus-cliffs',
      mastery_evidence_allowed: true,
    });

    const expandedCleanPool = new Map(
      ['31autumn21_q01', '31autumn21_q02', '31autumn21_q04', '31autumn21_q05'].map((questionId) => [
        questionId,
        queue.route_decision_summary.decisions.find((item) => item.question_id === questionId),
      ]),
    );
    expect(expandedCleanPool.get('31autumn21_q01')).toMatchObject({
      reviewed_status: 'clean',
      reviewed_region_id: 'logarithm-grove',
      mastery_evidence_allowed: true,
      content_lab_generation_allowed: true,
    });
    expect(expandedCleanPool.get('31autumn21_q01')?.reviewed_source_skill_ids).toEqual(['p3_log_exponential_equations']);
    expect(expandedCleanPool.get('31autumn21_q02')?.reviewed_source_skill_ids).toEqual(['p3_trig_r_form_compound_angles']);
    expect(expandedCleanPool.get('31autumn21_q04')?.reviewed_source_skill_ids).toEqual([
      'p3_int_parts_substitution',
      'p3_int_definite_improper_area',
    ]);
    expect(expandedCleanPool.get('31autumn21_q05')?.reviewed_source_skill_ids).toEqual([
      'p3_trig_equation_interval',
      'p3_trig_quadrant_solutions',
    ]);
  });

  it('reports no deferred mark-scheme evidence after audited cases are resolved', () => {
    const queue = readJson<RegionCorrectionQueue>(reportJsonPath);
    const deferred = queue.queue.mark_scheme_subpart_review.deferred_evidence_cases;

    expect(deferred).toEqual([]);
    expect(queue.inventory_bridge_summary.deferred_case_count).toBe(0);
  });

  it('keeps support-gap queue limited to current warm-up gaps after audited blockers are resolved', () => {
    const queue = readJson<RegionCorrectionQueue>(reportJsonPath);
    const support = queue.queue.support_content_gaps.weak_or_missing_skill_support;

    expect(queue.inventory_bridge_summary.support_gap_counts).toMatchObject({
      field_guide: 0,
      quick_check: 0,
      snippet: 0,
      warm_up: warmupGapSkillRefs.length,
      worked_example: 0,
    });
    expect(support.map((item) => item.skill_ref)).toEqual(supportQueueSkillRefs);
    expect(new Set(support.map((item) => item.region_id))).toEqual(new Set(['algebra-forge', 'logarithm-grove']));
    expect(support.filter((item) => item.support_gaps?.includes('warm_up')).map((item) => item.skill_ref))
      .toEqual(warmupGapSkillRefs);
    expect(support.find((item) => item.skill_ref === 'p3_alg_partial_fraction_form')).toMatchObject({
      support_gaps: [],
      blocked_or_risky_reason: expect.stringContaining('unreviewed_app_region_mismatch'),
    });
  });

  it('keeps summary totals aligned with detailed queue rows', () => {
    const queue = readJson<RegionCorrectionQueue>(reportJsonPath);
    const allItems = flatItems(queue);
    const questionIds = new Set(allItems.map((item) => item.question_id).filter(Boolean));
    const skillRefs = new Set(allItems.map((item) => item.skill_ref).filter(Boolean));

    expectSummaryCountsMatchDetails(queue);
    expect(queue.queue_summary.unique_question_count).toBe(questionIds.size);
    expect(queue.queue_summary.unique_skill_count).toBe(skillRefs.size);
    expect(queue.region_summary.length).toBeGreaterThan(0);
    expect(queue.skill_summary.length).toBeGreaterThan(0);
    expect(queue.region_summary.some((row) => row.region_id === 'calculus-cliffs' && row.issue_count > 0)).toBe(true);
    expect(queue.skill_summary.some((row) => row.skill_ref === 'p3_int_partial_fractions')).toBe(true);
  });

  it('writes Markdown with all required planning sections', () => {
    execFileSync('npm', ['run', 'queue:p3-region-correction'], {
      cwd: repoRoot,
      timeout: pythonTimeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      stdio: 'pipe',
    });

    const markdown = readFileSync(reportMarkdownPath, 'utf8');
    expect(markdown).toContain('### Missing P3 Routes');
    expect(markdown).toContain('### Ambiguous Multi-Topic Routes');
    expect(markdown).toContain('### Review-Needed Routes');
    expect(markdown).toContain('### Fallback Display-Only Region Placements');
    expect(markdown).toContain('## Reviewed Route Decision Summary');
    expect(markdown).toContain('p3_int_partial_fractions');
    expect(markdown).toContain('Fallback display routes are browsing hints only');
    expect(markdown).not.toMatch(/Content mutation allowed in this pass: `true`/);
  });
});
