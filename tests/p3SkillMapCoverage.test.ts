import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'tools/content_lab/scripts/build_p3_skill_coverage.py');
const skillMapPath = path.join(repoRoot, 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json');
const questionBankPath = path.join(repoRoot, 'public/assets/exam-bank-data/question_bank.json');
const snippetsPath = path.join(repoRoot, 'public/data/teaching_snippets.json');
const generatedPracticePath = path.join(repoRoot, 'public/data/generated_practice_bank.json');
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
const validCurriculumRoles = ['p3_core', 'bridge', 'p1_prerequisite', 'ambiguous', 'out_of_scope'];
const nonMasteryRoles = ['p1_prerequisite', 'out_of_scope'];
const validPrerequisiteSkillRefs = [
  'algebraic_manipulation',
  'coordinate_geometry',
  'differentiation_basics',
  'functions_and_graphs',
  'integration_basics',
  'radians_and_trigonometry',
  'sequences_and_series',
  'trigonometric_identities',
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

function ids(items: Array<{ skill_id: string }>) {
  return items.map((item) => item.skill_id);
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
      p1_prerequisite_use: 'P1 prerequisite content supports readiness but is not P3 mastery evidence.',
      reporting_boundary: 'P3 coverage and P1 prerequisite readiness are reported separately.',
    },
    reviewed_at: '2026-05-12',
    review_source_note: 'Fixture target lock.',
  };
}

type SkillFixtureOptions = {
  topic: string;
  region: string;
  suffix: string;
  canonical?: string[];
  snippets?: string[];
  checks?: string[];
  families?: string[];
  curriculumRole?: string;
  masteryEligible?: boolean;
  prerequisiteSkillRefs?: Array<{
    syllabus_id: string;
    skill_ref: string;
    relationship: string;
  }>;
  prerequisiteNotes?: string;
  needsTeacherReview?: boolean;
};

function skillFixture(options: SkillFixtureOptions) {
  return {
    skill_id: `p3_test_${options.suffix}`,
    syllabus_topic: options.topic,
    region_id: options.region,
    micro_skill_name: `${options.topic} fixture skill`,
    curriculum_role: options.curriculumRole ?? 'p3_core',
    mastery_eligible: options.masteryEligible ?? true,
    prerequisite_skill_refs: options.prerequisiteSkillRefs ?? [],
    prerequisite_notes: options.prerequisiteNotes ?? '',
    needs_teacher_review: options.needsTeacherReview ?? false,
    recognizer_signals: [`${options.suffix} signal`],
    common_errors: [`${options.suffix} error`],
    prerequisite_skills: [],
    canonical_source_question_ids: options.canonical ?? ['q1'],
    supported_by_snippet_ids: options.snippets ?? ['snippet-supported'],
    supported_by_quick_check_ids: options.checks ?? ['qc-supported'],
    supported_by_generator_families: options.families ?? ['family.supported'],
    supported_by_guardian_candidates: options.canonical?.slice(0, 1) ?? ['q1'],
  };
}

function skillMapFixture() {
  return {
    schema_name: 'asterion_p3_skill_map',
    schema_version: 2,
    paper_family: 'p3',
    curriculum_targets: curriculumTargetsFixture(),
    review_status: 'reviewed',
    reviewed_at: '2026-05-11',
    source_note: 'Fixture skill map for contract validation tests.',
    skills: topicRegionFixtures.map(([topic, region, suffix]) => skillFixture({ topic, region, suffix })),
  };
}

function trainableQuestion(questionId: string) {
  return {
    question_id: questionId,
    paper_family: 'p3',
    topic: 'algebra',
    question_image_path: `p3/test/questions/${questionId}.png`,
    mark_scheme_image_path: `p3/test/mark_scheme/${questionId}.png`,
  };
}

describe('P3 skill map coverage report', () => {
  it('keeps the reviewed skill map complete for the P3 syllabus topics', () => {
    const skillMap = readJson<{
      schema_name: string;
      schema_version: number;
      paper_family: string;
      curriculum_targets: ReturnType<typeof curriculumTargetsFixture>;
      review_status: string;
      skills: Array<{
        skill_id: string;
        syllabus_topic: string;
        region_id: string;
        micro_skill_name: string;
        curriculum_role: string;
        mastery_eligible: boolean;
        prerequisite_skill_refs: Array<{
          syllabus_id: string;
          skill_ref: string;
          relationship: string;
        }>;
        prerequisite_notes: string;
        needs_teacher_review: boolean;
        recognizer_signals: string[];
        common_errors: string[];
        prerequisite_skills: string[];
        canonical_source_question_ids: string[];
        supported_by_snippet_ids: string[];
        supported_by_quick_check_ids: string[];
        supported_by_generator_families: string[];
        supported_by_guardian_candidates: string[];
      }>;
    }>(skillMapPath);

    expect(skillMap.schema_name).toBe('asterion_p3_skill_map');
    expect(skillMap.schema_version).toBeGreaterThanOrEqual(2);
    expect(skillMap.paper_family).toBe('p3');
    expect(skillMap.review_status).toBe('reviewed');
    expect(skillMap.curriculum_targets.primary.syllabus_id).toBe('caie_9709_p3_2026_2027');
    expect(skillMap.curriculum_targets.primary.component_title).toBe('Pure Mathematics 3');
    expect(skillMap.curriculum_targets.primary.exam_years).toEqual(['2026', '2027']);
    expect(skillMap.curriculum_targets.primary.syllabus_version).toBe('Version 4');
    expect(skillMap.curriculum_targets.primary.source_urls).toEqual(expect.arrayContaining([officialQualificationUrl, officialSyllabusUrl]));
    expect(skillMap.curriculum_targets.supporting_prerequisites).toContainEqual(expect.objectContaining({
      syllabus_id: 'caie_9709_p1_2026_2027',
      component_title: 'Pure Mathematics 1',
      role: 'prerequisite_support',
    }));
    expect(skillMap.curriculum_targets.mastery_policy.p1_prerequisite_use).toContain('not proof of P3 mastery');
    expect(skillMap.skills.length).toBeGreaterThanOrEqual(35);
    expect(new Set(skillMap.skills.map((skill) => skill.syllabus_topic))).toEqual(new Set(expectedTopics));
    expect(new Set(skillMap.skills.map((skill) => skill.skill_id)).size).toBe(skillMap.skills.length);

    const skillIds = new Set(skillMap.skills.map((skill) => skill.skill_id));
    const roleIds = new Set(validCurriculumRoles);
    const p1PrerequisiteRefs = new Set(validPrerequisiteSkillRefs);
    for (const skill of skillMap.skills) {
      expect(skill.skill_id).toMatch(/^p3_[a-z0-9_]+$/);
      expect(skill.micro_skill_name).toBeTruthy();
      expect(roleIds.has(skill.curriculum_role), `${skill.skill_id} curriculum_role`).toBe(true);
      expect(typeof skill.mastery_eligible, `${skill.skill_id} mastery_eligible`).toBe('boolean');
      expect(Array.isArray(skill.prerequisite_skill_refs), `${skill.skill_id} prerequisite_skill_refs`).toBe(true);
      expect(typeof skill.prerequisite_notes, `${skill.skill_id} prerequisite_notes`).toBe('string');
      expect(typeof skill.needs_teacher_review, `${skill.skill_id} needs_teacher_review`).toBe('boolean');
      if (nonMasteryRoles.includes(skill.curriculum_role)) {
        expect(skill.mastery_eligible, `${skill.skill_id} non-P3 role mastery`).toBe(false);
      }
      if (skill.curriculum_role === 'ambiguous' && skill.mastery_eligible) {
        expect(skill.needs_teacher_review, `${skill.skill_id} ambiguous mastery review`).toBe(true);
      }
      for (const prerequisiteRef of skill.prerequisite_skill_refs) {
        expect(prerequisiteRef.syllabus_id, `${skill.skill_id} prerequisite syllabus`).toBe('caie_9709_p1_2026_2027');
        expect(p1PrerequisiteRefs.has(prerequisiteRef.skill_ref), `${skill.skill_id} prerequisite skill ref`).toBe(true);
        expect(prerequisiteRef.relationship, `${skill.skill_id} prerequisite relationship`).toBe('supports');
      }
      expect(skill.recognizer_signals.length).toBeGreaterThan(0);
      expect(skill.common_errors.length).toBeGreaterThan(0);
      for (const prerequisite of skill.prerequisite_skills) {
        expect(skillIds.has(prerequisite), `${skill.skill_id} prerequisite ${prerequisite}`).toBe(true);
      }
    }
  });

  it('builds the real Content Lab readiness dashboard from reviewed artifacts', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-skill-report-'));
    try {
      const output = path.join(dir, 'report.json');
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
        '--output',
        output,
      ]);
      const report = readJson<{
        schema_name: string;
        curriculum_targets: ReturnType<typeof curriculumTargetsFixture>;
        summary: {
          total_skills: number;
          ready_for_full_p3_learning: boolean;
          skills_with_generated_warm_up: number;
          skills_with_trainable_canonical_question: number;
          skills_by_curriculum_role: Record<string, number>;
          mastery_eligible_skills: number;
          skills_with_prerequisite_refs: number;
          skills_needing_teacher_review: number;
        };
        dashboard: {
          coverage_by_curriculum_role: Array<{ curriculum_role: string; total_skills: number }>;
          coverage_by_syllabus_topic: Array<{ syllabus_topic: string }>;
        };
        gaps: Record<string, Array<{ skill_id: string }>>;
        unresolved_reference_warnings: Array<{ skill_id: string }>;
      }>(output);

      expect(report.schema_name).toBe('asterion_p3_skill_coverage_report');
      expect(report.curriculum_targets.primary.syllabus_id).toBe('caie_9709_p3_2026_2027');
      expect(report.curriculum_targets.supporting_prerequisites[0].syllabus_id).toBe('caie_9709_p1_2026_2027');
      expect(report.summary.total_skills).toBeGreaterThanOrEqual(35);
      expect(report.summary.ready_for_full_p3_learning).toBe(false);
      expect(report.summary.skills_with_generated_warm_up).toBe(
        report.summary.total_skills - quarantinedAlgebraWarmupSkillRefs.length,
      );
      expect(report.summary.skills_with_trainable_canonical_question).toBe(report.summary.total_skills);
      expect(report.summary.skills_by_curriculum_role.p3_core).toBe(report.summary.total_skills);
      expect(report.summary.mastery_eligible_skills).toBe(report.summary.total_skills);
      expect(report.summary.skills_with_prerequisite_refs).toBe(report.summary.total_skills);
      expect(report.summary.skills_needing_teacher_review).toBe(0);
      expect(report.unresolved_reference_warnings.map((warning) => warning.skill_id)).toEqual(quarantinedAlgebraWarmupSkillRefs);
      expect(report.dashboard.coverage_by_curriculum_role).toContainEqual(expect.objectContaining({
        curriculum_role: 'p3_core',
        total_skills: report.summary.total_skills,
      }));
      expect(new Set(report.dashboard.coverage_by_syllabus_topic.map((row) => row.syllabus_topic))).toEqual(new Set(expectedTopics));
      expect(report.gaps.skills_with_no_trainable_canonical_question).toEqual([]);
      expect(report.gaps.skills_with_no_snippet).toEqual([]);
      expect(report.gaps.skills_with_no_quick_check).toEqual([]);
      expect(report.gaps.skills_with_no_generated_warm_up.map((gap) => gap.skill_id)).toEqual(quarantinedAlgebraWarmupSkillRefs);
      expect(report.gaps.high_evidence_skills_with_weak_teaching_support).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports all required gap categories from an explicit fixture', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-skill-report-fixture-'));
    try {
      const skillMap = {
        schema_name: 'asterion_p3_skill_map',
        schema_version: 2,
        paper_family: 'p3',
        curriculum_targets: curriculumTargetsFixture(),
        review_status: 'reviewed',
        reviewed_at: '2026-05-11',
        source_note: 'Fixture skill map for report tests.',
        skills: [
          skillFixture({
            topic: 'Algebra',
            region: 'algebra-forge',
            suffix: 'high_weak',
            canonical: ['q1', 'q2', 'q3', 'q4', 'q5'],
            snippets: [],
            checks: [],
            families: [],
          }),
          skillFixture({ topic: 'Logarithmic and exponential functions', region: 'logarithm-grove', suffix: 'supported_log' }),
          skillFixture({ topic: 'Trigonometry', region: 'trig-observatory', suffix: 'supported_trig' }),
          skillFixture({ topic: 'Differentiation', region: 'calculus-cliffs', suffix: 'supported_diff' }),
          skillFixture({ topic: 'Integration', region: 'integration-gardens', suffix: 'supported_int' }),
          skillFixture({ topic: 'Numerical solution of equations', region: 'numerical-mines', suffix: 'supported_num' }),
          skillFixture({ topic: 'Vectors', region: 'vector-workshop', suffix: 'supported_vec' }),
          skillFixture({ topic: 'Differential equations', region: 'differential-shrine', suffix: 'supported_de' }),
          skillFixture({
            topic: 'Complex numbers',
            region: 'complex-harbor',
            suffix: 'no_trainable',
            canonical: ['q_blocked'],
          }),
        ],
      };
      const questionBank = {
        questions: [
          trainableQuestion('q1'),
          trainableQuestion('q2'),
          trainableQuestion('q3'),
          trainableQuestion('q4'),
          trainableQuestion('q5'),
          {
            ...trainableQuestion('q_blocked'),
            training_status: 'quarantined_missing_canonical_mark_scheme',
          },
        ],
      };
      const snippets = {
        snippets: [
          {
            snippet_id: 'snippet-supported',
            review_status: 'published',
            quick_check: {
              id: 'qc-supported',
              review_status: 'published',
            },
          },
        ],
      };
      const generatedPractice = {
        items: [
          {
            generator_family: 'family.supported',
            review_status: 'published',
            verification: { status: 'pass' },
          },
        ],
      };

      const skillMapFixturePath = path.join(dir, 'skill_map.json');
      const questionBankFixturePath = path.join(dir, 'question_bank.json');
      const snippetsFixturePath = path.join(dir, 'snippets.json');
      const generatedFixturePath = path.join(dir, 'generated.json');
      const output = path.join(dir, 'report.json');
      writeFileSync(skillMapFixturePath, JSON.stringify(skillMap, null, 2));
      writeFileSync(questionBankFixturePath, JSON.stringify(questionBank, null, 2));
      writeFileSync(snippetsFixturePath, JSON.stringify(snippets, null, 2));
      writeFileSync(generatedFixturePath, JSON.stringify(generatedPractice, null, 2));

      runPython([
        scriptPath,
        '--skill-map',
        skillMapFixturePath,
        '--question-bank',
        questionBankFixturePath,
        '--snippets',
        snippetsFixturePath,
        '--generated-practice',
        generatedFixturePath,
        '--output',
        output,
      ]);

      const report = readJson<{
        gaps: Record<string, Array<{ skill_id: string; reasons?: string[] }>>;
        summary: { ready_for_full_p3_learning: boolean };
      }>(output);

      expect(report.summary.ready_for_full_p3_learning).toBe(false);
      expect(ids(report.gaps.skills_with_no_snippet)).toContain('p3_test_high_weak');
      expect(ids(report.gaps.skills_with_no_quick_check)).toContain('p3_test_high_weak');
      expect(ids(report.gaps.skills_with_no_generated_warm_up)).toContain('p3_test_high_weak');
      expect(ids(report.gaps.skills_with_no_trainable_canonical_question)).toContain('p3_test_no_trainable');
      expect(report.gaps.high_evidence_skills_with_weak_teaching_support).toContainEqual({
        skill_id: 'p3_test_high_weak',
        syllabus_topic: 'Algebra',
        region_id: 'algebra-forge',
        micro_skill_name: 'Algebra fixture skill',
        reasons: ['no_reviewed_snippet', 'no_reviewed_quick_check', 'no_reviewed_generated_warm_up'],
      });
      expect(ids(report.gaps.skills_with_no_snippet)).not.toContain('p3_test_supported_log');
      expect(ids(report.gaps.skills_with_no_quick_check)).not.toContain('p3_test_supported_log');
      expect(ids(report.gaps.skills_with_no_generated_warm_up)).not.toContain('p3_test_supported_log');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it.each([
    {
      name: 'missing curriculum_role',
      mutate: (skill: Record<string, unknown>) => {
        delete skill.curriculum_role;
      },
      expected: 'missing curriculum_role',
    },
    {
      name: 'unknown curriculum_role',
      mutate: (skill: Record<string, unknown>) => {
        skill.curriculum_role = 'p2_core';
      },
      expected: 'unknown curriculum_role p2_core',
    },
    {
      name: 'missing mastery_eligible',
      mutate: (skill: Record<string, unknown>) => {
        delete skill.mastery_eligible;
      },
      expected: 'missing mastery_eligible',
    },
    {
      name: 'missing prerequisite_skill_refs',
      mutate: (skill: Record<string, unknown>) => {
        delete skill.prerequisite_skill_refs;
      },
      expected: 'missing prerequisite_skill_refs',
    },
    {
      name: 'missing needs_teacher_review',
      mutate: (skill: Record<string, unknown>) => {
        delete skill.needs_teacher_review;
      },
      expected: 'missing needs_teacher_review',
    },
    {
      name: 'p1 prerequisite marked mastery eligible',
      mutate: (skill: Record<string, unknown>) => {
        skill.curriculum_role = 'p1_prerequisite';
        skill.mastery_eligible = true;
      },
      expected: 'cannot be mastery_eligible when curriculum_role is p1_prerequisite',
    },
    {
      name: 'out of scope marked mastery eligible',
      mutate: (skill: Record<string, unknown>) => {
        skill.curriculum_role = 'out_of_scope';
        skill.mastery_eligible = true;
      },
      expected: 'cannot be mastery_eligible when curriculum_role is out_of_scope',
    },
    {
      name: 'ambiguous mastery without teacher review',
      mutate: (skill: Record<string, unknown>) => {
        skill.curriculum_role = 'ambiguous';
        skill.mastery_eligible = true;
        skill.needs_teacher_review = false;
      },
      expected: 'ambiguous mastery_eligible skills must need teacher review',
    },
    {
      name: 'malformed prerequisite reference',
      mutate: (skill: Record<string, unknown>) => {
        skill.prerequisite_skill_refs = [{
          syllabus_id: 'caie_9709_p1_2026_2027',
          relationship: 'supports',
        }];
      },
      expected: 'skill_ref must not be empty',
    },
    {
      name: 'unknown prerequisite curriculum target',
      mutate: (skill: Record<string, unknown>) => {
        skill.prerequisite_skill_refs = [{
          syllabus_id: 'caie_9709_p2_2026_2027',
          skill_ref: 'algebraic_manipulation',
          relationship: 'supports',
        }];
      },
      expected: 'references unknown curriculum target caie_9709_p2_2026_2027',
    },
    {
      name: 'unknown prerequisite skill reference',
      mutate: (skill: Record<string, unknown>) => {
        skill.prerequisite_skill_refs = [{
          syllabus_id: 'caie_9709_p1_2026_2027',
          skill_ref: 'invented_prerequisite',
          relationship: 'supports',
        }];
      },
      expected: 'skill_ref must be a known P1 prerequisite skill reference',
    },
  ])('fails deterministically for invalid skill-map metadata: $name', ({ mutate, expected }) => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-invalid-contract-'));
    try {
      const skillMap = skillMapFixture();
      mutate(skillMap.skills[0] as Record<string, unknown>);

      const skillMapFixturePath = path.join(dir, 'skill_map.json');
      const output = path.join(dir, 'report.json');
      writeFileSync(skillMapFixturePath, JSON.stringify(skillMap, null, 2));

      const failure = runPythonFailure([
        scriptPath,
        '--skill-map',
        skillMapFixturePath,
        '--question-bank',
        questionBankPath,
        '--snippets',
        snippetsPath,
        '--generated-practice',
        generatedPracticePath,
        '--output',
        output,
      ]);

      expect(failure).toContain(expected);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
