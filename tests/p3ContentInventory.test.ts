import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'tools/content_lab/scripts/build_p3_content_inventory.py');
const skillMapPath = path.join(repoRoot, 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json');
const questionBankPath = path.join(repoRoot, 'public/assets/exam-bank-data/question_bank.json');
const snippetsPath = path.join(repoRoot, 'public/data/teaching_snippets.json');
const generatedPracticePath = path.join(repoRoot, 'public/data/generated_practice_bank.json');
const worldMapPath = path.join(repoRoot, 'src/lib/worldMap.ts');
const fieldGuidesPath = path.join(repoRoot, 'src/data/regionFieldGuides.ts');
const routingAuditPath = path.join(repoRoot, 'tools/content_lab/reviews/p3_app_region_routing_audit.json');
const pythonTimeoutMs = 10_000;

const expectedTopics = [
  'Algebra',
  'Logarithmic and exponential functions',
  'Trigonometry',
  'Differentiation',
  'Integration',
  'Numerical solution of equations',
  'Vectors',
  'Differential equations',
  'Complex numbers',
];

const topicRegionFixtures = [
  ['Algebra', 'algebra-forge', 'algebra'],
  ['Logarithmic and exponential functions', 'logarithm-grove', 'log'],
  ['Trigonometry', 'trig-observatory', 'trig'],
  ['Differentiation', 'calculus-cliffs', 'diff'],
  ['Integration', 'integration-gardens', 'int'],
  ['Numerical solution of equations', 'numerical-mines', 'num'],
  ['Vectors', 'vector-workshop', 'vec'],
  ['Differential equations', 'differential-shrine', 'de'],
  ['Complex numbers', 'complex-harbor', 'complex'],
] as const;

const officialQualificationUrl = 'https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-mathematics-9709/';
const officialSyllabusUrl = 'https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf';
const quarantinedAlgebraWarmupSkillRefs = [
  'p3_alg_discriminant_root_conditions',
  'p3_alg_structure_rearrangement',
];

interface InventoryReport {
  schema_name: string;
  schema_version: number;
  generated_label: string;
  generated_at?: string;
  settings: { support_types: string[] };
  region_summary: {
    region_count: number;
    status_counts: Record<string, number>;
  };
  reviewed_skill_summary: {
    skill_count: number;
    ready_for_region_learning_loop: boolean;
    status_counts: Record<string, number>;
    available_support_type_counts: Record<string, number>;
  };
  per_region_inventory: Array<{
    region_id: string;
    skill_count: number;
    instructional_status: string;
  }>;
  per_skill_inventory: Array<{
    skill_ref: string;
    region_id: string;
    available_support_types: string[];
    missing_support_types: string[];
    p1_prerequisite_refs: Array<{ syllabus_id: string; skill_ref: string; relationship: string }>;
    canonical_question_ids_routed_to_skill: string[];
    teacher_review_app_region_mismatch_question_ids: string[];
    teacher_review_deferred_question_ids: string[];
    unreviewed_app_region_mismatch_question_ids: string[];
    mastery_evidence_blocked_question_ids: string[];
    mastery_evidence_question_ids: string[];
    practice_allowed_question_ids: string[];
    practice_allowed_deferred_question_ids: string[];
    export_blocked_deferred_question_ids: string[];
    risk_flags: string[];
    mastery_eligible: boolean;
    instructional_status: string;
  }>;
  missing_support_summary: Record<string, Array<{ skill_ref: string }> | number>;
  question_routing_summary: {
    p3_question_count: number;
    referenced_trainable_p3_question_count: number;
  };
  routing_audit_summary: {
    active_mismatch_count: number;
    active_skill_warning_count: number;
    original_reviewed_mismatch_count: number;
    resolved_mismatch_count: number;
    resolved_skill_warning_count: number;
    deferred_teacher_review_count: number;
    deferred_teacher_review_skill_warning_count: number;
    deferred_review_backlog: {
      case_count: number;
      affected_skill_refs: string[];
      affected_region_ids: string[];
      mastery_evidence_allowed: boolean | null;
      practice_allowed: boolean | null;
      export_allowed: boolean | null;
      mastery_evidence_blocked_case_count: number;
      practice_allowed_case_count: number;
      export_blocked_case_count: number;
      items: Array<{
        question_id: string;
        skill_ref: string;
        resolution_status: string;
        evidence_status: string;
        mastery_evidence_allowed: boolean;
        practice_allowed: boolean;
        export_allowed: boolean;
      }>;
    };
    teacher_review_mismatch_count: number;
    teacher_review_skill_warning_count: number;
    unreviewed_mismatch_count: number;
    unreviewed_skill_warning_count: number;
    teacher_review_mismatches: Array<{ skill_ref: string; question_id: string; resolution_status: string }>;
    unreviewed_mismatches: Array<{ skill_ref: string; question_id: string; resolution_status: string }>;
    resolved_mismatches: Array<{ skill_ref: string; question_id: string; resolution_status: string }>;
  };
  teacher_review_export_tag_summary: {
    p1_prerequisite_ref_count: number;
    skills_with_p1_prerequisite_refs: number;
  };
  risk_summary: Array<{ risk_id: string; count: number; status: string }>;
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

function curriculumTargetsFixture() {
  return {
    primary: {
      syllabus_id: 'caie_9709_p3_2026_2027',
      qualification: 'Cambridge International AS & A Level Mathematics',
      syllabus_code: '9709',
      component: 'Paper 3',
      component_title: 'Pure Mathematics 3',
      paper_family: 'p3',
      exam_years: ['2026', '2027'],
      syllabus_version: 'Version 4',
      published: 'December 2025',
      source_urls: [officialQualificationUrl, officialSyllabusUrl],
      scope_note: 'Fixture primary target.',
    },
    supporting_prerequisites: [
      {
        syllabus_id: 'caie_9709_p1_2026_2027',
        qualification: 'Cambridge International AS & A Level Mathematics',
        syllabus_code: '9709',
        component: 'Paper 1',
        component_title: 'Pure Mathematics 1',
        paper_family: 'p1',
        exam_years: ['2026', '2027'],
        role: 'prerequisite_support',
        source_urls: [officialQualificationUrl, officialSyllabusUrl],
        scope_note: 'Fixture P1 prerequisite support target.',
      },
    ],
    mastery_policy: {
      p3_mastery_evidence: 'P3 mastery requires P3-aligned canonical question evidence.',
      p1_prerequisite_use: 'P1 prerequisite content supports readiness but is not proof of P3 mastery.',
      reporting_boundary: 'P3 coverage and P1 prerequisite readiness are reported separately.',
    },
    reviewed_at: '2026-05-12',
    review_source_note: 'Fixture target lock.',
  };
}

function skillFixture(topic: string, region: string, suffix: string) {
  return {
    skill_id: `p3_test_${suffix}`,
    syllabus_topic: topic,
    region_id: region,
    micro_skill_name: `${topic} fixture skill`,
    curriculum_role: 'p3_core',
    mastery_eligible: true,
    prerequisite_skill_refs: [
      {
        syllabus_id: 'caie_9709_p1_2026_2027',
        skill_ref: 'algebraic_manipulation',
        relationship: 'supports',
      },
    ],
    prerequisite_notes: 'Fixture P1 support remains prerequisite-only.',
    needs_teacher_review: false,
    recognizer_signals: [`${suffix} signal`],
    common_errors: [`${suffix} error`],
    prerequisite_skills: [],
    canonical_source_question_ids: ['q1'],
    supported_by_snippet_ids: ['snippet-supported'],
    supported_by_quick_check_ids: ['qc-supported'],
    supported_by_generator_families: ['family.supported'],
    supported_by_guardian_candidates: ['q1'],
  };
}

function skillMapFixture() {
  return {
    schema_name: 'asterion_p3_skill_map',
    schema_version: 2,
    paper_family: 'p3',
    curriculum_targets: curriculumTargetsFixture(),
    review_status: 'reviewed',
    reviewed_at: '2026-05-12',
    source_note: 'Fixture skill map for content inventory tests.',
    skills: topicRegionFixtures.map(([topic, region, suffix]) => skillFixture(topic, region, suffix)),
  };
}

function trainableQuestion(overrides: Record<string, unknown> = {}) {
  return {
    question_id: 'q1',
    paper_family: 'p3',
    paper: 'fixture',
    topic: 'algebra',
    question_image_path: 'p3/fixture/questions/q01.png',
    mark_scheme_image_path: 'p3/fixture/mark_scheme/q01.png',
    ...overrides,
  };
}

function snippetsFixture() {
  return {
    snippets: [
      {
        snippet_id: 'snippet-supported',
        paper_family: 'p3',
        region_ids: ['algebra-forge'],
        topics: ['algebra'],
        review_status: 'published',
        worked_example: {
          id: 'snippet-supported-example-1',
          prompt: 'Simplify a fixture expression.',
          steps: ['Choose the method.'],
          answer: 'A simplified expression.',
        },
        quick_check: {
          id: 'qc-supported',
          region_id: 'algebra-forge',
          review_status: 'published',
          prompt: 'Name the method.',
          answer: 'Use the method.',
          explanation: 'The method is visible first.',
        },
      },
    ],
  };
}

function generatedPracticeFixture() {
  return {
    items: [
      {
        practice_id: 'practice-supported-1',
        paper_family: 'p3',
        region_ids: ['algebra-forge'],
        generator_family: 'family.supported',
        review_status: 'published',
        verification: { status: 'pass', method: 'deterministic', verifier: 'fixture' },
        prompt: 'Fixture prompt.',
        answer: 'Fixture answer.',
        worked_solution: ['Fixture step.'],
        difficulty_band: 'easy',
      },
    ],
  };
}

function routingAuditFixture(entries: unknown[] = []) {
  return {
    schema_name: 'asterion_p3_app_region_routing_audit',
    schema_version: 1,
    review_label: 'fixture-routing-audit',
    entries,
  };
}

function writeFixtureFiles(dir: string, mutateSkillMap?: (skillMap: ReturnType<typeof skillMapFixture>) => void, questionOverrides: Record<string, unknown> = {}) {
  const skillMap = skillMapFixture();
  mutateSkillMap?.(skillMap);

  const paths = {
    skillMap: path.join(dir, 'skill_map.json'),
    questionBank: path.join(dir, 'question_bank.json'),
    snippets: path.join(dir, 'snippets.json'),
    generatedPractice: path.join(dir, 'generated_practice.json'),
    routingAudit: path.join(dir, 'routing_audit.json'),
    output: path.join(dir, 'report.json'),
  };

  writeFileSync(paths.skillMap, JSON.stringify(skillMap, null, 2));
  writeFileSync(paths.questionBank, JSON.stringify({ questions: [trainableQuestion(questionOverrides)] }, null, 2));
  writeFileSync(paths.snippets, JSON.stringify(snippetsFixture(), null, 2));
  writeFileSync(paths.generatedPractice, JSON.stringify(generatedPracticeFixture(), null, 2));
  writeFileSync(paths.routingAudit, JSON.stringify(routingAuditFixture(), null, 2));
  return paths;
}

function runInventory(output: string, overrides: string[] = []) {
  runPython([
    scriptPath,
    '--skill-map',
    skillMapPath,
    '--question-bank',
    questionBankPath,
    '--snippets',
    snippetsPath,
    '--generated-practice',
    generatedPracticePath,
    '--world-map',
    worldMapPath,
    '--field-guides',
    fieldGuidesPath,
    '--routing-audit',
    routingAuditPath,
    '--output',
    output,
    ...overrides,
  ]);
}

function runFixtureInventory(paths: ReturnType<typeof writeFixtureFiles>) {
  runPython([
    scriptPath,
    '--skill-map',
    paths.skillMap,
    '--question-bank',
    paths.questionBank,
    '--snippets',
    paths.snippets,
    '--generated-practice',
    paths.generatedPractice,
    '--world-map',
    worldMapPath,
    '--field-guides',
    fieldGuidesPath,
    '--routing-audit',
    paths.routingAudit,
    '--output',
    paths.output,
  ]);
}

function expectStatusCountsMatchDetails(report: InventoryReport) {
  for (const [status, count] of Object.entries(report.reviewed_skill_summary.status_counts)) {
    expect(report.per_skill_inventory.filter((row) => row.instructional_status === status).length).toBe(count);
  }
  for (const [status, count] of Object.entries(report.region_summary.status_counts)) {
    expect(report.per_region_inventory.filter((row) => row.instructional_status === status).length).toBe(count);
  }
}

function expectSupportCountsMatchDetails(report: InventoryReport) {
  for (const supportType of report.settings.support_types) {
    expect(report.per_skill_inventory.filter((row) => row.available_support_types.includes(supportType)).length)
      .toBe(report.reviewed_skill_summary.available_support_type_counts[supportType]);
  }
  expect((report.missing_support_summary.skills_missing_snippet as Array<{ skill_ref: string }>).length)
    .toBe(report.per_skill_inventory.filter((row) => row.missing_support_types.includes('snippet')).length);
  expect((report.missing_support_summary.skills_missing_quick_check as Array<{ skill_ref: string }>).length)
    .toBe(report.per_skill_inventory.filter((row) => row.missing_support_types.includes('quick_check')).length);
  expect((report.missing_support_summary.skills_missing_warmup_support as Array<{ skill_ref: string }>).length)
    .toBe(report.per_skill_inventory.filter((row) => row.missing_support_types.includes('warm_up')).length);
}

describe('P3 content inventory report', () => {
  it('generates a deterministic inventory from real project data', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-inventory-'));
    try {
      const output = path.join(dir, 'report.json');
      runInventory(output);
      const report = readJson<InventoryReport>(output);
      const skillMap = readJson<{ skills: Array<{ skill_id: string }> }>(skillMapPath);
      const skillRefs = new Set(skillMap.skills.map((skill) => skill.skill_id));
      const reportSkillRefs = new Set(report.per_skill_inventory.map((row) => row.skill_ref));
      const knownRegionIds = new Set(report.per_region_inventory.map((row) => row.region_id));

      expect(report.schema_name).toBe('asterion_p3_content_inventory_report');
      expect(report.schema_version).toBe(1);
      expect(report.generated_label).toBe('deterministic-content-inventory-v1');
      expect(report.generated_at).toBeUndefined();
      expect(report.reviewed_skill_summary.skill_count).toBe(skillMap.skills.length);
      expect(report.per_skill_inventory).toHaveLength(skillMap.skills.length);
      expect(reportSkillRefs).toEqual(skillRefs);
      expect(report.region_summary.region_count).toBe(9);
      expect(report.question_routing_summary.p3_question_count).toBeGreaterThan(0);
      expect(report.question_routing_summary.referenced_trainable_p3_question_count).toBeGreaterThan(0);
      expect(report.routing_audit_summary.original_reviewed_mismatch_count).toBe(42);
      expect(report.routing_audit_summary.resolved_mismatch_count).toBe(35);
      expect(report.routing_audit_summary.resolved_skill_warning_count).toBe(14);
      expect(report.routing_audit_summary.teacher_review_mismatch_count).toBe(0);
      expect(report.routing_audit_summary.teacher_review_skill_warning_count).toBe(0);
      expect(report.routing_audit_summary.deferred_teacher_review_count).toBe(0);
      expect(report.routing_audit_summary.deferred_teacher_review_skill_warning_count).toBe(0);
      expect(report.routing_audit_summary.deferred_review_backlog).toMatchObject({
        case_count: 0,
        mastery_evidence_allowed: null,
        practice_allowed: null,
        export_allowed: null,
        mastery_evidence_blocked_case_count: 0,
        practice_allowed_case_count: 0,
        export_blocked_case_count: 0,
      });
      expect(report.routing_audit_summary.deferred_review_backlog.items).toEqual([]);
      expect(report.routing_audit_summary.deferred_review_backlog.items.every((item) => (
        item.resolution_status === 'teacher_review_deferred'
        && item.evidence_status === 'ambiguous_part_level_evidence'
        && item.mastery_evidence_allowed === false
        && item.practice_allowed === true
        && item.export_allowed === false
      ))).toBe(true);
      expect(report.routing_audit_summary.unreviewed_mismatch_count).toBe(0);
      expect(report.routing_audit_summary.unreviewed_skill_warning_count).toBe(0);
      expect(report.routing_audit_summary.teacher_review_mismatches.every((item) => item.resolution_status === 'teacher_review_deferred')).toBe(true);
      expect(report.routing_audit_summary.teacher_review_mismatches).toEqual([]);

      for (const row of report.per_skill_inventory) {
        expect(skillRefs.has(row.skill_ref), row.skill_ref).toBe(true);
        expect(knownRegionIds.has(row.region_id), row.region_id).toBe(true);
        expect(row.practice_allowed_question_ids.length, row.skill_ref).toBeGreaterThan(0);
        if (row.canonical_question_ids_routed_to_skill.length === 0) {
          expect(row.mastery_evidence_blocked_question_ids.length, row.skill_ref).toBeGreaterThan(0);
        }
        for (const prerequisite of row.p1_prerequisite_refs) {
          expect(prerequisite.syllabus_id).toBe('caie_9709_p1_2026_2027');
          expect(row.available_support_types).not.toContain('p1_prerequisite');
          expect(row.available_support_types).not.toContain(prerequisite.skill_ref);
        }
      }
      expect(report.per_skill_inventory.filter((row) => row.teacher_review_app_region_mismatch_question_ids.length > 0))
        .toHaveLength(0);
      expect(report.per_skill_inventory.filter((row) => row.teacher_review_deferred_question_ids.length > 0))
        .toHaveLength(0);
      for (const row of report.per_skill_inventory.filter((item) => item.teacher_review_deferred_question_ids.length > 0)) {
        expect(row.mastery_evidence_blocked_question_ids).toEqual(expect.arrayContaining(row.teacher_review_deferred_question_ids));
        expect(row.practice_allowed_deferred_question_ids).toEqual(row.teacher_review_deferred_question_ids);
        expect(row.export_blocked_deferred_question_ids).toEqual(row.teacher_review_deferred_question_ids);
        for (const questionId of row.teacher_review_deferred_question_ids) {
          expect(row.mastery_evidence_question_ids).not.toContain(questionId);
          expect(row.canonical_question_ids_routed_to_skill).not.toContain(questionId);
          expect(row.practice_allowed_question_ids).toContain(questionId);
        }
      }
      expect(report.per_skill_inventory.filter((row) => row.unreviewed_app_region_mismatch_question_ids.length > 0))
        .toHaveLength(0);
      expect(report.reviewed_skill_summary.status_counts).toMatchObject({
        blocked: 0,
        missing: 0,
        needs_review: 0,
        partial: quarantinedAlgebraWarmupSkillRefs.length,
        ready: 40 - quarantinedAlgebraWarmupSkillRefs.length,
      });
      expect(report.teacher_review_export_tag_summary.p1_prerequisite_ref_count).toBeGreaterThan(0);
      expect(report.teacher_review_export_tag_summary.skills_with_p1_prerequisite_refs).toBe(report.reviewed_skill_summary.skill_count);
      expectStatusCountsMatchDetails(report);
      expectSupportCountsMatchDetails(report);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('keeps support and mastery-source gaps closed with no deferred teacher-review backlog', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-gaps-'));
    try {
      const output = path.join(dir, 'report.json');
      runInventory(output);
      const report = readJson<InventoryReport>(output);
      const missingSnippets = (report.missing_support_summary.skills_missing_snippet as Array<{ skill_ref: string }>).map((row) => row.skill_ref);
      const missingQuickChecks = (report.missing_support_summary.skills_missing_quick_check as Array<{ skill_ref: string }>).map((row) => row.skill_ref);
      const missingWarmUps = (report.missing_support_summary.skills_missing_warmup_support as Array<{ skill_ref: string }>).map((row) => row.skill_ref);
      const missingCanonical = (report.missing_support_summary.skills_missing_canonical_question as Array<{ skill_ref: string }>).map((row) => row.skill_ref);
      const missingGuardian = (report.missing_support_summary.skills_missing_guardian_candidate as Array<{ skill_ref: string }>).map((row) => row.skill_ref);
      const warmUpRisk = report.risk_summary.find((risk) => risk.risk_id === 'missing_warm_up');
      const canonicalRisk = report.risk_summary.find((risk) => risk.risk_id === 'missing_trainable_canonical_question');
      const guardianRisk = report.risk_summary.find((risk) => risk.risk_id === 'missing_guardian_candidate');

      expect(report.reviewed_skill_summary.ready_for_region_learning_loop).toBe(false);
      expect(missingSnippets).toEqual([]);
      expect(missingQuickChecks).toEqual([]);
      expect(missingWarmUps).toEqual(quarantinedAlgebraWarmupSkillRefs);
      expect(missingCanonical).toEqual([]);
      expect(missingGuardian).toEqual([]);
      expect(warmUpRisk).toMatchObject({ count: quarantinedAlgebraWarmupSkillRefs.length, status: 'open' });
      expect(canonicalRisk).toMatchObject({ count: 0, status: 'clear' });
      expect(guardianRisk).toMatchObject({ count: 0, status: 'clear' });
      expectSupportCountsMatchDetails(report);
      expectStatusCountsMatchDetails(report);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports unaudited fixture app-region mismatches as structural warnings', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-unreviewed-routing-'));
    try {
      const paths = writeFixtureFiles(dir);
      runFixtureInventory(paths);
      const report = readJson<InventoryReport>(paths.output);
      const structuralRisk = report.risk_summary.find((risk) => risk.risk_id === 'structural_warnings');
      const unreviewedRisk = report.risk_summary.find((risk) => risk.risk_id === 'unreviewed_app_region_mismatches');

      expect(report.routing_audit_summary.unreviewed_mismatch_count).toBe(8);
      expect(report.routing_audit_summary.unreviewed_skill_warning_count).toBe(8);
      expect(report.routing_audit_summary.teacher_review_mismatch_count).toBe(0);
      expect(unreviewedRisk).toMatchObject({ count: 8, status: 'open' });
      expect(structuralRisk).toMatchObject({ count: 8, status: 'open' });
      expect(report.per_skill_inventory.filter((row) => row.unreviewed_app_region_mismatch_question_ids.length > 0))
        .toHaveLength(8);
      expectStatusCountsMatchDetails(report);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('classifies audited fixture app-region mismatches as teacher-review items', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-reviewed-routing-'));
    try {
      const paths = writeFixtureFiles(dir);
      const skillMap = readJson<{ skills: Array<{ skill_id: string; region_id: string }> }>(paths.skillMap);
      const entries = skillMap.skills
        .filter((skill) => skill.region_id !== 'algebra-forge')
        .map((skill) => ({
          skill_ref: skill.skill_id,
          question_id: 'q1',
          original_app_region_id: 'algebra-forge',
          reviewed_skill_map_region_id: skill.region_id,
          source_of_conflicting_label: 'Fixture q1 routes to algebra while this reviewed skill belongs to a different region.',
          resolution_status: 'teacher_review_deferred',
          evidence_status: 'ambiguous_part_level_evidence',
          mastery_evidence_allowed: false,
          practice_allowed: true,
          export_allowed: false,
          recommended_resolution: 'Keep visible for fixture review.',
          rationale: 'Fixture verifies audited mismatches are not treated as unreviewed structural warnings.',
        }));
      writeFileSync(paths.routingAudit, JSON.stringify(routingAuditFixture(entries), null, 2));

      runFixtureInventory(paths);
      const report = readJson<InventoryReport>(paths.output);
      const structuralRisk = report.risk_summary.find((risk) => risk.risk_id === 'structural_warnings');
      const teacherReviewRisk = report.risk_summary.find((risk) => risk.risk_id === 'teacher_review_app_region_mismatches');

      expect(report.routing_audit_summary.teacher_review_mismatch_count).toBe(8);
      expect(report.routing_audit_summary.teacher_review_skill_warning_count).toBe(8);
      expect(report.routing_audit_summary.deferred_teacher_review_count).toBe(8);
      expect(report.routing_audit_summary.deferred_review_backlog).toMatchObject({
        case_count: 8,
        mastery_evidence_allowed: false,
        practice_allowed: true,
        export_allowed: false,
        mastery_evidence_blocked_case_count: 8,
      });
      expect(report.routing_audit_summary.unreviewed_mismatch_count).toBe(0);
      expect(teacherReviewRisk).toMatchObject({ count: 8, status: 'open' });
      expect(structuralRisk).toMatchObject({ count: 0, status: 'clear' });
      expect(report.per_skill_inventory.filter((row) => row.teacher_review_app_region_mismatch_question_ids.length > 0))
        .toHaveLength(8);
      for (const row of report.per_skill_inventory.filter((item) => item.teacher_review_deferred_question_ids.length > 0)) {
        expect(row.teacher_review_deferred_question_ids).toEqual(['q1']);
        expect(row.mastery_evidence_blocked_question_ids).toEqual(['q1']);
        expect(row.mastery_evidence_question_ids).toEqual([]);
        expect(row.canonical_question_ids_routed_to_skill).toEqual([]);
        expect(row.practice_allowed_question_ids).toEqual(['q1']);
        expect(row.practice_allowed_deferred_question_ids).toEqual(['q1']);
        expect(row.export_blocked_deferred_question_ids).toEqual(['q1']);
      }
      expect(report.per_skill_inventory.filter((row) => row.instructional_status === 'needs_review'))
        .toHaveLength(8);
      expectStatusCountsMatchDetails(report);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('accepts validated fixture app-region mismatches as clean skill-map route evidence', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-validated-routing-'));
    try {
      const paths = writeFixtureFiles(dir);
      const skillMap = readJson<{ skills: Array<{ skill_id: string; region_id: string }> }>(paths.skillMap);
      const entries = skillMap.skills
        .filter((skill) => skill.region_id !== 'algebra-forge')
        .map((skill) => ({
          skill_ref: skill.skill_id,
          question_id: 'q1',
          original_app_region_id: 'algebra-forge',
          reviewed_skill_map_region_id: skill.region_id,
          source_of_conflicting_label: 'Fixture q1 routes to algebra while this reviewed skill belongs to a different region.',
          resolution_status: 'validated_skill_map_route',
          evidence_status: 'clean_mastery_evidence',
          mastery_evidence_allowed: true,
          practice_allowed: true,
          export_allowed: true,
          recommended_resolution: 'Accept the reviewed skill-map placement for this fixture route.',
          rationale: 'Fixture verifies image-backed reviewed route decisions can become clean mastery evidence.',
        }));
      writeFileSync(paths.routingAudit, JSON.stringify(routingAuditFixture(entries), null, 2));

      runFixtureInventory(paths);
      const report = readJson<InventoryReport>(paths.output);
      const structuralRisk = report.risk_summary.find((risk) => risk.risk_id === 'structural_warnings');
      const unreviewedRisk = report.risk_summary.find((risk) => risk.risk_id === 'unreviewed_app_region_mismatches');
      const resolvedRisk = report.risk_summary.find((risk) => risk.risk_id === 'resolved_app_region_mismatches');

      expect(report.routing_audit_summary.resolved_mismatch_count).toBe(8);
      expect(report.routing_audit_summary.resolved_skill_warning_count).toBe(8);
      expect(report.routing_audit_summary.teacher_review_mismatch_count).toBe(0);
      expect(report.routing_audit_summary.unreviewed_mismatch_count).toBe(0);
      expect(unreviewedRisk).toMatchObject({ count: 0, status: 'clear' });
      expect(structuralRisk).toMatchObject({ count: 0, status: 'clear' });
      expect(resolvedRisk).toMatchObject({ count: 8, status: 'resolved' });
      for (const row of report.per_skill_inventory) {
        expect(row.mastery_evidence_question_ids).toEqual(['q1']);
        expect(row.canonical_question_ids_routed_to_skill).toEqual(['q1']);
        expect(row.mastery_evidence_blocked_question_ids).toEqual([]);
        expect(row.teacher_review_deferred_question_ids).toEqual([]);
        expect(row.unreviewed_app_region_mismatch_question_ids).toEqual([]);
      }
      expect(report.per_skill_inventory.filter((row) => row.instructional_status === 'ready'))
        .toHaveLength(9);
      expectStatusCountsMatchDetails(report);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails for an unknown reviewed skill reference', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-bad-skill-'));
    try {
      const paths = writeFixtureFiles(dir, (skillMap) => {
        skillMap.skills[0].prerequisite_skills = ['p3_missing_fixture_skill'];
      });
      const failure = runPythonFailure([
        scriptPath,
        '--skill-map',
        paths.skillMap,
        '--question-bank',
        paths.questionBank,
        '--snippets',
        paths.snippets,
        '--generated-practice',
        paths.generatedPractice,
        '--world-map',
        worldMapPath,
        '--field-guides',
        fieldGuidesPath,
        '--routing-audit',
        paths.routingAudit,
        '--output',
        paths.output,
      ]);

      expect(failure).toContain('unknown prerequisite skill p3_missing_fixture_skill');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails when a deferred routing-audit item does not declare mastery/practice/export safety flags', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-bad-deferred-routing-'));
    try {
      const paths = writeFixtureFiles(dir);
      const skillMap = readJson<{ skills: Array<{ skill_id: string; region_id: string }> }>(paths.skillMap);
      const skill = skillMap.skills.find((item) => item.region_id !== 'algebra-forge');
      if (!skill) throw new Error('Fixture expected a non-algebra skill');
      writeFileSync(paths.routingAudit, JSON.stringify(routingAuditFixture([{
        skill_ref: skill.skill_id,
        question_id: 'q1',
        original_app_region_id: 'algebra-forge',
        reviewed_skill_map_region_id: skill.region_id,
        source_of_conflicting_label: 'Fixture q1 routes to algebra while this reviewed skill belongs to a different region.',
        resolution_status: 'teacher_review_deferred',
        recommended_resolution: 'Keep visible for fixture review.',
        rationale: 'Fixture verifies deferred routing entries must state mastery safety explicitly.',
      }]), null, 2));

      const failure = runPythonFailure([
        scriptPath,
        '--skill-map',
        paths.skillMap,
        '--question-bank',
        paths.questionBank,
        '--snippets',
        paths.snippets,
        '--generated-practice',
        paths.generatedPractice,
        '--world-map',
        worldMapPath,
        '--field-guides',
        fieldGuidesPath,
        '--routing-audit',
        paths.routingAudit,
        '--output',
        paths.output,
      ]);

      expect(failure).toContain('teacher_review_deferred entries must set mastery_evidence_allowed to false');
      expect(failure).toContain('teacher_review_deferred entries must set practice_allowed to true');
      expect(failure).toContain('teacher_review_deferred entries must set export_allowed to false');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails when a validated routing-audit item does not declare clean mastery safety flags', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-bad-validated-routing-'));
    try {
      const paths = writeFixtureFiles(dir);
      const skillMap = readJson<{ skills: Array<{ skill_id: string; region_id: string }> }>(paths.skillMap);
      const skill = skillMap.skills.find((item) => item.region_id !== 'algebra-forge');
      if (!skill) throw new Error('Fixture expected a non-algebra skill');
      writeFileSync(paths.routingAudit, JSON.stringify(routingAuditFixture([{
        skill_ref: skill.skill_id,
        question_id: 'q1',
        original_app_region_id: 'algebra-forge',
        reviewed_skill_map_region_id: skill.region_id,
        source_of_conflicting_label: 'Fixture q1 routes to algebra while this reviewed skill belongs to a different region.',
        resolution_status: 'validated_skill_map_route',
        recommended_resolution: 'Accept only with explicit clean mastery flags.',
        rationale: 'Fixture verifies validated routing entries must state mastery safety explicitly.',
      }]), null, 2));

      const failure = runPythonFailure([
        scriptPath,
        '--skill-map',
        paths.skillMap,
        '--question-bank',
        paths.questionBank,
        '--snippets',
        paths.snippets,
        '--generated-practice',
        paths.generatedPractice,
        '--world-map',
        worldMapPath,
        '--field-guides',
        fieldGuidesPath,
        '--routing-audit',
        paths.routingAudit,
        '--output',
        paths.output,
      ]);

      expect(failure).toContain('validated route entries must set evidence_status to clean_mastery_evidence');
      expect(failure).toContain('validated route entries must set mastery_evidence_allowed to true');
      expect(failure).toContain('validated route entries must set practice_allowed to true');
      expect(failure).toContain('validated route entries must set export_allowed to true');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails for an unknown P3 region id', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-bad-region-'));
    try {
      const paths = writeFixtureFiles(dir, (skillMap) => {
        skillMap.skills[0].region_id = 'unknown-region';
      });
      const failure = runPythonFailure([
        scriptPath,
        '--skill-map',
        paths.skillMap,
        '--question-bank',
        paths.questionBank,
        '--snippets',
        paths.snippets,
        '--generated-practice',
        paths.generatedPractice,
        '--world-map',
        worldMapPath,
        '--field-guides',
        fieldGuidesPath,
        '--routing-audit',
        paths.routingAudit,
        '--output',
        paths.output,
      ]);

      expect(failure).toContain('unknown P3 region_id unknown-region');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails when P1 prerequisite evidence is used as P3 mastery evidence', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-content-unsafe-mastery-'));
    try {
      const paths = writeFixtureFiles(dir, undefined, { paper_family: 'p1' });
      const failure = runPythonFailure([
        scriptPath,
        '--skill-map',
        paths.skillMap,
        '--question-bank',
        paths.questionBank,
        '--snippets',
        paths.snippets,
        '--generated-practice',
        paths.generatedPractice,
        '--world-map',
        worldMapPath,
        '--field-guides',
        fieldGuidesPath,
        '--routing-audit',
        paths.routingAudit,
        '--output',
        paths.output,
      ]);

      expect(failure).toContain('unsafe canonical mastery evidence q1: paper_family is p1, expected p3');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
