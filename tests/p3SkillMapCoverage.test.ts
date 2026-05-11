import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, 'tools/content_lab/scripts/build_p3_skill_coverage.py');
const skillMapPath = path.join(repoRoot, 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json');
const questionBankPath = path.join(repoRoot, 'public/data/question_bank.json');
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

function runPython(args: string[]) {
  execFileSync('python3', args, {
    cwd: repoRoot,
    timeout: pythonTimeoutMs,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function ids(items: Array<{ skill_id: string }>) {
  return items.map((item) => item.skill_id);
}

type SkillFixtureOptions = {
  topic: string;
  region: string;
  suffix: string;
  canonical?: string[];
  snippets?: string[];
  checks?: string[];
  families?: string[];
};

function skillFixture(options: SkillFixtureOptions) {
  return {
    skill_id: `p3_test_${options.suffix}`,
    syllabus_topic: options.topic,
    region_id: options.region,
    micro_skill_name: `${options.topic} fixture skill`,
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
      paper_family: string;
      review_status: string;
      skills: Array<{
        skill_id: string;
        syllabus_topic: string;
        region_id: string;
        micro_skill_name: string;
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
    expect(skillMap.paper_family).toBe('p3');
    expect(skillMap.review_status).toBe('reviewed');
    expect(skillMap.skills.length).toBeGreaterThanOrEqual(35);
    expect(new Set(skillMap.skills.map((skill) => skill.syllabus_topic))).toEqual(new Set(expectedTopics));
    expect(new Set(skillMap.skills.map((skill) => skill.skill_id)).size).toBe(skillMap.skills.length);

    const skillIds = new Set(skillMap.skills.map((skill) => skill.skill_id));
    for (const skill of skillMap.skills) {
      expect(skill.skill_id).toMatch(/^p3_[a-z0-9_]+$/);
      expect(skill.micro_skill_name).toBeTruthy();
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
        summary: {
          total_skills: number;
          ready_for_full_p3_learning: boolean;
          skills_with_trainable_canonical_question: number;
        };
        dashboard: { coverage_by_syllabus_topic: Array<{ syllabus_topic: string }> };
        gaps: Record<string, Array<{ skill_id: string }>>;
        unresolved_reference_warnings: unknown[];
      }>(output);

      expect(report.schema_name).toBe('asterion_p3_skill_coverage_report');
      expect(report.summary.total_skills).toBeGreaterThanOrEqual(35);
      expect(report.summary.ready_for_full_p3_learning).toBe(false);
      expect(report.summary.skills_with_trainable_canonical_question).toBe(report.summary.total_skills);
      expect(report.unresolved_reference_warnings).toEqual([]);
      expect(new Set(report.dashboard.coverage_by_syllabus_topic.map((row) => row.syllabus_topic))).toEqual(new Set(expectedTopics));
      expect(report.gaps.skills_with_no_trainable_canonical_question).toEqual([]);
      expect(ids(report.gaps.skills_with_no_snippet)).toContain('p3_log_calculus_contexts');
      expect(ids(report.gaps.skills_with_no_quick_check)).toContain('p3_complex_roots_powers');
      expect(ids(report.gaps.skills_with_no_generated_warm_up)).toContain('p3_diff_method_selection');
      expect(ids(report.gaps.high_evidence_skills_with_weak_teaching_support)).toContain('p3_vec_line_equations_intersections');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports all required gap categories from an explicit fixture', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-p3-skill-report-fixture-'));
    try {
      const skillMap = {
        schema_name: 'asterion_p3_skill_map',
        schema_version: 1,
        paper_family: 'p3',
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
});
