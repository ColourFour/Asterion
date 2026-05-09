import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const buildScript = path.join(repoRoot, 'tools/content_lab/scripts/build_generated_practice.py');
const verifyScript = path.join(repoRoot, 'tools/content_lab/scripts/verify_content_lab_outputs.py');

interface GeneratedPracticeItem {
  practice_id: string;
  generator_family: string;
  prompt: string;
  answer: string;
  worked_solution: string[];
  parameters: Record<string, number | string>;
  verification: { status: string };
  review_status: string;
}

function writeInputs(dir: string) {
  const skillTargetsPath = path.join(dir, 'skill_targets.json');
  const snippetsPath = path.join(dir, 'teaching_snippets.json');

  writeFileSync(skillTargetsPath, JSON.stringify({
    schema_name: 'asterion_skill_targets',
    schema_version: 1,
    skill_targets: [
      {
        skill_target_id: 'p3_logarithms_and_exponentials',
        paper_family: 'p3',
        topic: 'logarithms_and_exponentials',
        title: 'Logarithms and exponentials',
        student_goal: 'Use log laws safely.',
        micro_skills: ['Check domains.'],
        source_question_ids: ['source_log'],
        confidence: 'low',
        review_status: 'needs_review',
      },
      {
        skill_target_id: 'p3_binomial_expansion',
        paper_family: 'p3',
        topic: 'binomial_expansion',
        title: 'Binomial expansion',
        student_goal: 'Track terms.',
        micro_skills: ['Find low-order terms.'],
        source_question_ids: ['source_binomial'],
        confidence: 'low',
        review_status: 'needs_review',
      },
    ],
  }, null, 2));

  writeFileSync(snippetsPath, JSON.stringify({
    schema_name: 'asterion_teaching_snippets',
    schema_version: 1,
    snippets: [
      {
        snippet_id: 'log-snippet',
        paper_family: 'p3',
        topics: ['logarithms_and_exponentials'],
        region_ids: ['logarithm-grove'],
        title: 'Log laws',
        student_goal: 'Combine logs.',
        body: 'Use log laws.',
        steps: ['Check the domain.'],
        exam_move: 'Combine logs before solving.',
        common_trap: 'Splitting sums.',
        review_status: 'published',
        source: 'teacher_authored',
      },
      {
        snippet_id: 'binomial-snippet',
        paper_family: 'p3',
        topics: ['binomial_expansion'],
        region_ids: ['algebra-forge'],
        title: 'Binomial terms',
        student_goal: 'Find coefficients.',
        body: 'Use low-order terms.',
        steps: ['Write the first terms.'],
        exam_move: 'Match powers of x.',
        common_trap: 'Losing signs.',
        review_status: 'teacher_reviewed',
        source: 'teacher_authored',
      },
    ],
  }, null, 2));

  return { skillTargetsPath, snippetsPath };
}

function runGeneratedBuild(dir: string) {
  const { skillTargetsPath, snippetsPath } = writeInputs(dir);
  const outputPath = path.join(dir, 'generated_practice_bank.json');
  const runtimeOutputPath = path.join(dir, 'runtime_generated_practice_bank.json');
  execFileSync('python3', [
    buildScript,
    '--skill-targets',
    skillTargetsPath,
    '--snippets',
    snippetsPath,
    '--output',
    outputPath,
    '--runtime-output',
    runtimeOutputPath,
  ], { cwd: repoRoot });
  return {
    output: readFileSync(outputPath, 'utf8'),
    runtime: readFileSync(runtimeOutputPath, 'utf8'),
    outputPath,
    runtimeOutputPath,
  };
}

function generatedItems(json: string): GeneratedPracticeItem[] {
  return JSON.parse(json).items;
}

function numeric(value: number | string | undefined): number {
  if (typeof value === 'number') return value;
  return Number(value);
}

function polynomialText(terms: Array<[number, number]>): string {
  const pieces: string[] = [];
  for (const [coefficient, power] of terms) {
    if (coefficient === 0) continue;
    const magnitude = Math.abs(coefficient);
    const variable = power === 0 ? '' : power === 1 ? 'x' : `x^${power}`;
    const body = power === 0 ? String(magnitude) : magnitude === 1 ? variable : `${magnitude}${variable}`;
    pieces.push(pieces.length === 0 ? (coefficient < 0 ? `-${body}` : body) : coefficient < 0 ? `- ${body}` : `+ ${body}`);
  }
  return pieces.join(' ');
}

function regionCoverageSnippets() {
  const rows = [
    ['p3-log-check', 'logarithms_and_exponentials', ['logarithm-grove']],
    ['p3-algebra-check', 'binomial_expansion', ['algebra-forge']],
    ['p3-trig-check', 'trigonometry', ['trig-observatory']],
    ['p3-complex-check', 'complex_numbers', ['complex-harbor']],
    ['p3-diff-check', 'differentiation', ['calculus-cliffs']],
    ['p3-integration-check', 'integration', ['integration-gardens']],
    ['p3-vector-check', 'vectors', ['vector-workshop']],
    ['p3-numerical-check', 'numerical_methods', ['numerical-mines']],
    ['p3-de-check', 'differential_equations', ['differential-shrine']],
  ] as const;

  return rows.map(([snippetId, topic, regionIds]) => ({
    snippet_id: snippetId,
    paper_family: 'p3',
    topics: [topic],
    region_ids: regionIds,
    title: 'Reviewed region snippet',
    student_goal: 'Use reviewed content before practice.',
    body: 'This reviewed snippet gives a short method reminder.',
    steps: ['Identify the topic signal.', 'Choose the method.'],
    exam_move: 'Name the method before calculating.',
    common_trap: 'Starting before choosing a method.',
    review_status: 'published',
    source: 'teacher_authored',
    prerequisites: ['Read the question prompt carefully.'],
    micro_steps: ['Circle the topic signal.', 'Write the first method line.'],
    common_mistakes: ['Skipping the setup line.'],
    quick_check: {
      prompt: 'What should you do before calculating?',
      answer: 'Choose the method.',
      explanation: 'A named method keeps the first line purposeful.',
    },
    source_skill_target_ids: [`p3_${topic}`],
  }));
}

function writeVerifierBase(dir: string, runtimePracticePath: string, practiceOverrides: Record<string, unknown>) {
  const snippetsPath = path.join(dir, 'snippets.json');
  writeFileSync(path.join(dir, 'skill_targets.json'), JSON.stringify({
    schema_name: 'asterion_skill_targets',
    schema_version: 1,
    skill_targets: [
      {
        skill_target_id: 'p3_logarithms_and_exponentials',
        paper_family: 'p3',
        topic: 'logarithms_and_exponentials',
        title: 'Logarithms and exponentials',
        student_goal: 'Use log laws safely.',
        micro_skills: ['Check domains.'],
        source_question_ids: ['source_q'],
        confidence: 'low',
        review_status: 'needs_review',
      },
    ],
  }, null, 2));
  writeFileSync(path.join(dir, 'review_queue.json'), JSON.stringify({
    schema_name: 'asterion_content_lab_review_queue',
    schema_version: 1,
    records: [
      {
        question_id: 'review_q',
        paper_family: 'p3',
        topic: 'logarithms_and_exponentials',
        eligibility: 'review_only',
        reasons: ['visual_required'],
      },
    ],
  }, null, 2));
  writeFileSync(snippetsPath, JSON.stringify({
    schema_name: 'asterion_teaching_snippets',
    schema_version: 1,
    snippets: regionCoverageSnippets(),
  }, null, 2));
  writeFileSync(runtimePracticePath, JSON.stringify({
    schema_name: 'asterion_generated_practice',
    schema_version: 1,
    generated_by: 'test',
    items: [
      {
        practice_id: 'bad_practice',
        generator_family: 'logarithms_and_exponentials.log_equation_basic',
        paper_family: 'p3',
        topic: 'logarithms_and_exponentials',
        prompt: 'Solve ln(x) = ln(2).',
        answer: 'x = 2',
        worked_solution: ['The domain requires x > 0.'],
        parameters: { solution: 2 },
        verification: { status: 'pass', method: 'deterministic', verifier: 'content_lab_v1' },
        difficulty_band: 'easy',
        review_status: 'teacher_reviewed',
        ...practiceOverrides,
      },
    ],
  }, null, 2));
  return snippetsPath;
}

describe('generated practice Content Lab pipeline', () => {
  it('generates valid positive-domain logarithm equations with deterministic answers', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-log-'));
    try {
      const items = generatedItems(runGeneratedBuild(dir).output)
        .filter((item) => item.generator_family === 'logarithms_and_exponentials.log_equation_basic');

      expect(items.length).toBeGreaterThanOrEqual(5);
      for (const item of items) {
        const parameters = item.parameters;
        const solution = numeric(parameters.solution);
        expect(solution).toBeGreaterThan(0);
        expect(item.verification.status).toBe('pass');
        expect(item.worked_solution.join(' ').toLowerCase()).toMatch(/domain|law|argument requires/);

        switch (parameters.form) {
          case 'product':
            expect(numeric(parameters.a) * solution).toBe(numeric(parameters.b));
            break;
          case 'quotient':
            expect((numeric(parameters.a) * solution) / numeric(parameters.c)).toBe(numeric(parameters.d));
            break;
          case 'power_law':
            expect(solution ** numeric(parameters.k)).toBe(numeric(parameters.b));
            break;
          case 'log_power':
            expect(solution ** numeric(parameters.n)).toBe(numeric(parameters.b));
            break;
          case 'shifted_argument':
            expect(solution + numeric(parameters.a)).toBe(numeric(parameters.b));
            expect(solution + numeric(parameters.a)).toBeGreaterThan(0);
            break;
          default:
            throw new Error(`Unexpected log form ${String(parameters.form)}`);
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('generates correct binomial first terms and product coefficients', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-binomial-'));
    try {
      const items = generatedItems(runGeneratedBuild(dir).output)
        .filter((item) => item.generator_family === 'binomial_expansion.first_terms_and_coefficient');

      expect(items.length).toBeGreaterThanOrEqual(4);
      for (const item of items) {
        const parameters = item.parameters;
        if (parameters.item_type === 'expand_first_terms') {
          const expected = polynomialText([
            [1, 0],
            [numeric(parameters.x_coefficient), 1],
            [numeric(parameters.x2_coefficient), 2],
          ]);
          expect(item.answer).toBe(expected);
          expect(Math.abs(numeric(parameters.x2_coefficient))).toBeLessThanOrEqual(120);
          continue;
        }

        const a = numeric(parameters.a);
        const b = numeric(parameters.b);
        const m = numeric(parameters.m);
        const n = numeric(parameters.n);
        const leftX = m * a;
        const rightX = n * b;
        const leftX2 = (m * (m - 1) / 2) * a * a;
        const rightX2 = (n * (n - 1) / 2) * b * b;
        const expectedCoefficient = leftX2 + leftX * rightX + rightX2;
        expect(numeric(parameters.coefficient_x2)).toBe(expectedCoefficient);
        expect(item.answer).toBe(`Coefficient of x^2 = ${expectedCoefficient}`);
        expect(Math.abs(expectedCoefficient)).toBeLessThanOrEqual(120);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes deterministic generated and runtime output for the same inputs', () => {
    const firstDir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-a-'));
    const secondDir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-b-'));
    try {
      const first = runGeneratedBuild(firstDir);
      const second = runGeneratedBuild(secondDir);

      expect(first.output).toBe(second.output);
      expect(first.runtime).toBe(second.runtime);
    } finally {
      rmSync(firstDir, { recursive: true, force: true });
      rmSync(secondDir, { recursive: true, force: true });
    }
  });

  it('rejects malformed generated practice in the runtime file', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-verify-'));
    const runtimePracticePath = path.join(dir, 'runtime_generated_practice_bank.json');
    try {
      const snippetsPath = writeVerifierBase(dir, runtimePracticePath, {
        review_status: 'candidate',
      });

      expect(() => execFileSync('python3', [
        verifyScript,
        '--outputs-dir',
        dir,
        '--snippets',
        snippetsPath,
        '--runtime-generated-practice',
        runtimePracticePath,
      ], { cwd: repoRoot })).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
