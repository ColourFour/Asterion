import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const buildScript = path.join(repoRoot, 'tools/content_lab/scripts/build_generated_practice.py');
const verifyScript = path.join(repoRoot, 'tools/content_lab/scripts/verify_content_lab_outputs.py');
const pythonTimeoutMs = 10_000;
const pipelineTestTimeoutMs = 15_000;

function runPython(args: string[]) {
  execFileSync('python3', args, {
    cwd: repoRoot,
    timeout: pythonTimeoutMs,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function expectPythonFailure(args: string[]) {
  expect(() => runPython(args)).toThrow();
}

function pipelineIt(name: string, fn: () => void) {
  return it(name, fn, pipelineTestTimeoutMs);
}

interface GeneratedPracticeItem {
  practice_id: string;
  generator_family: string;
  skill_target_id?: string;
  source_snippet_id?: string;
  example_model_id?: string;
  question_type?: string;
  key_method?: string;
  exam_move?: string;
  prompt: string;
  answer: string;
  worked_solution: string[];
  parameters: Record<string, number | string>;
  sequence_role: string;
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
        likely_prerequisites: ['Index laws.'],
        common_misconceptions: ['Splitting a sum inside a logarithm.'],
        source_question_ids: ['source_log'],
        assessed_by_source_question_ids: ['source_log'],
        source_mark_scheme_patterns: [
          {
            pattern_id: 'log_laws_before_solving',
            summary: 'Use log laws before solving.',
            source_question_ids: ['source_log'],
            source_count: 1,
          },
        ],
        source_eligibility_counts: { auto_eligible: 1, review_only: 0 },
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
        likely_prerequisites: ['Index laws.'],
        common_misconceptions: ['Dropping a negative sign.'],
        source_question_ids: ['source_binomial'],
        assessed_by_source_question_ids: ['source_binomial'],
        source_mark_scheme_patterns: [
          {
            pattern_id: 'binomial_terms_and_coefficients',
            summary: 'Use low-order terms.',
            source_question_ids: ['source_binomial'],
            source_count: 1,
          },
        ],
        source_eligibility_counts: { auto_eligible: 1, review_only: 0 },
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
        worked_example: {
          id: 'log-snippet-example-1',
          prompt: 'Solve 3e^(2x) = 12.',
          steps: ['Divide by 3.', 'Take ln of both sides.'],
          answer: 'x = ln 2',
        },
        quick_check: {
          id: 'log-snippet-qc',
          region_id: 'logarithm-grove',
          topic: 'logarithms_and_exponentials',
          skill_target_id: 'p3_logarithms_and_exponentials',
          title: 'Log laws',
          prompt: 'Simplify ln x + ln 2.',
          answer: 'ln(2x)',
          explanation: 'Use the product law.',
          micro_skill: 'Combine logarithms.',
          difficulty_band: 'easy',
          estimated_time_minutes: 1,
          review_status: 'published',
        },
        guardian_readiness: {
          supports_topics: ['logarithms_and_exponentials'],
          recommended_before_question_ids: [],
          readiness_note: 'Use before logarithm Guardian attempts.',
        },
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
        worked_example: {
          id: 'binomial-snippet-example-1',
          prompt: 'Write the first three terms of (1+2x)^5.',
          steps: ['Use the binomial formula.', 'Substitute u = 2x.'],
          answer: '1 + 10x + 40x^2',
        },
        quick_check: {
          id: 'binomial-snippet-qc',
          region_id: 'algebra-forge',
          topic: 'binomial_expansion',
          skill_target_id: 'p3_binomial_expansion',
          title: 'Binomial terms',
          prompt: 'Find the coefficient of x in (1+x)^3.',
          answer: '3',
          explanation: 'The linear term is 3x.',
          micro_skill: 'Find a binomial coefficient.',
          difficulty_band: 'easy',
          estimated_time_minutes: 1,
          review_status: 'teacher_reviewed',
        },
        guardian_readiness: {
          supports_topics: ['binomial_expansion'],
          recommended_before_question_ids: [],
          readiness_note: 'Use before binomial Guardian attempts.',
        },
      },
      {
        snippet_id: 'algebra-snippet',
        paper_family: 'p3',
        topics: ['algebra'],
        region_ids: ['algebra-forge'],
        title: 'Modulus cases',
        student_goal: 'Split modulus equations.',
        body: 'Use distance cases.',
        steps: ['Split into positive and negative cases.'],
        exam_move: 'Preserve both cases.',
        common_trap: 'Dropping the negative case.',
        review_status: 'teacher_reviewed',
        source: 'teacher_authored',
        worked_example: {
          id: 'algebra-snippet-example-1',
          prompt: 'Solve |x-2| = 5.',
          steps: ['Split into x - 2 = 5 or x - 2 = -5.'],
          answer: 'x = 7 or x = -3',
        },
      },
      {
        snippet_id: 'partial-fractions-snippet',
        paper_family: 'p3',
        topics: ['partial_fractions'],
        region_ids: ['algebra-forge', 'integration-gardens'],
        title: 'Partial fractions',
        student_goal: 'Choose the decomposition form.',
        body: 'Let denominator factors choose the form.',
        steps: ['Write one term for each factor.'],
        exam_move: 'Set up before solving constants.',
        common_trap: 'Missing a repeated factor term.',
        review_status: 'teacher_reviewed',
        source: 'teacher_authored',
        worked_example: {
          id: 'partial-fractions-snippet-example-1',
          prompt: 'Decompose (5x+1)/((x-1)(x+2)).',
          steps: ['Use A/(x-1) + B/(x+2).', 'Clear denominators.'],
          answer: '2/(x-1) + 3/(x+2)',
        },
      },
      {
        snippet_id: 'trig-snippet',
        paper_family: 'p3',
        topics: ['trigonometry'],
        region_ids: ['trig-observatory'],
        title: 'Trig examples',
        student_goal: 'Choose an identity or interval route.',
        body: 'Use the structure of the expression.',
        steps: ['Choose the matching identity.'],
        exam_move: 'Use the interval to list answers.',
        common_trap: 'Losing interval solutions.',
        review_status: 'teacher_reviewed',
        source: 'teacher_authored',
        worked_example: {
          id: 'trig-snippet-example-1',
          prompt: 'Write 3 sin x + 4 cos x in R-form.',
          steps: ['Find R = 5.', 'Match coefficients.'],
          answer: '5 sin(x + arctan(4/3))',
        },
      },
    ],
  }, null, 2));

  return { skillTargetsPath, snippetsPath };
}

function runGeneratedBuild(dir: string) {
  const { skillTargetsPath, snippetsPath } = writeInputs(dir);
  const outputPath = path.join(dir, 'generated_practice_bank.json');
  const runtimeOutputPath = path.join(dir, 'runtime_generated_practice_bank.json');
  const reportOutputPath = path.join(dir, 'content_lab_report.json');
  runPython([
    buildScript,
    '--skill-targets',
    skillTargetsPath,
    '--snippets',
    snippetsPath,
    '--output',
    outputPath,
    '--runtime-output',
    runtimeOutputPath,
    '--report-output',
    reportOutputPath,
  ]);
  return {
    output: readFileSync(outputPath, 'utf8'),
    runtime: readFileSync(runtimeOutputPath, 'utf8'),
    report: readFileSync(reportOutputPath, 'utf8'),
    outputPath,
    runtimeOutputPath,
    reportOutputPath,
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
  const firstBatchSources: Record<string, { questionId: string; questionAsset: string; markSchemeAsset: string; questionType: string }> = {
    logarithms_and_exponentials: {
      questionId: '32spring21_q01',
      questionAsset: 'p3/32spring21/questions/q01.png',
      markSchemeAsset: 'p3/32spring21/mark_scheme/q01.png',
      questionType: 'Logarithm equation',
    },
    binomial_expansion: {
      questionId: '33summer21_q01',
      questionAsset: 'p3/33summer21/questions/q01.png',
      markSchemeAsset: 'p3/33summer21/mark_scheme/q01.png',
      questionType: 'Binomial term or coefficient',
    },
    trigonometry: {
      questionId: '32spring21_q03',
      questionAsset: 'p3/32spring21/questions/q03.png',
      markSchemeAsset: 'p3/32spring21/mark_scheme/q03.png',
      questionType: 'Trigonometric equation',
    },
  };
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

  return rows.map(([snippetId, topic, regionIds]) => {
    const firstBatchSource = firstBatchSources[topic];
    const workedExampleId = `${snippetId}-example-1`;
    return {
      snippet_id: snippetId,
      paper_family: 'p3',
      topic,
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
        id: `${snippetId}-qc`,
        region_id: regionIds[0],
        topic,
        skill_target_id: `p3_${topic}`,
        title: 'Reviewed region snippet',
        prompt: 'What should you do before calculating?',
        answer: 'Choose the method.',
        explanation: 'A named method keeps the first line purposeful.',
        micro_skill: 'Choose a method before calculating.',
        difficulty_band: 'easy',
        estimated_time_minutes: 1,
        review_status: 'published',
        ...(firstBatchSource ? { example_model_id: workedExampleId } : {}),
      },
      source_skill_target_ids: [`p3_${topic}`],
      related_skill_targets: [`p3_${topic}`],
      ...(firstBatchSource ? {
        worked_example: {
          id: workedExampleId,
          prompt: 'State the method needed for this example.',
          steps: ['Identify the structure.', 'Choose the method.'],
          answer: 'Use the named method.',
          question_type: firstBatchSource.questionType,
          key_method: 'Choose the method before calculating.',
          exam_move: 'Name the method before calculating.',
          source_question_ids: [firstBatchSource.questionId],
          source_question_asset_ids: [firstBatchSource.questionAsset],
          source_mark_scheme_asset_ids: [firstBatchSource.markSchemeAsset],
        },
      } : {}),
    };
  });
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
        likely_prerequisites: ['Index laws.'],
        common_misconceptions: ['Splitting a sum inside a logarithm.'],
        source_question_ids: ['source_q'],
        assessed_by_source_question_ids: ['source_q'],
        source_mark_scheme_patterns: [
          {
            pattern_id: 'log_laws_before_solving',
            summary: 'Use log laws before solving.',
            source_question_ids: ['source_q'],
            source_count: 1,
          },
        ],
        source_eligibility_counts: { auto_eligible: 1, review_only: 0 },
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
        skill_target_id: 'p3_logarithms_and_exponentials',
        snippet_ids: ['p3-log-check'],
        region_ids: ['logarithm-grove'],
        prompt: 'Solve ln(x) = ln(2).',
        answer: 'x = 2',
        worked_solution: ['The domain requires x > 0.', 'Equal logs have equal positive arguments.'],
        parameters: { solution: 2 },
        sequence_role: 'first_step',
        verification: { status: 'pass', method: 'deterministic', verifier: 'content_lab_schema_v2' },
        difficulty_band: 'easy',
        review_status: 'teacher_reviewed',
        source_snippet_id: 'p3-log-check',
        example_model_id: 'p3-log-check-example-1',
        question_type: 'Logarithm equation',
        key_method: 'Choose the method before calculating.',
        exam_move: 'Name the method before calculating.',
        ...practiceOverrides,
      },
    ],
  }, null, 2));
  return snippetsPath;
}

describe.sequential('generated practice Content Lab pipeline', () => {
  pipelineIt('generates sequenced exponential warm-ups linked to the Field Guide example', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-log-'));
    try {
      const items = generatedItems(runGeneratedBuild(dir).output)
        .filter((item) => item.generator_family === 'logarithms_and_exponentials.log_equation_basic');

      expect(items).toHaveLength(3);
      for (const item of items) {
        const parameters = item.parameters;
        expect(item.verification.status).toBe('pass');
        expect(item.skill_target_id).toBe('p3_logarithms_and_exponentials');
        expect(['first_step', 'complete_step', 'guardian_prep']).toContain(item.sequence_role);
        expect(parameters.sequence_stage).toBeTruthy();
        expect(item.source_snippet_id).toBe('log-snippet');
        expect(item.example_model_id).toBe('log-snippet-example-1');
        expect(item.question_type).toBeTruthy();
        expect(item.key_method).toBeTruthy();
        expect(item.exam_move).toBeTruthy();
        expect(item.worked_solution.join(' ').toLowerCase()).toMatch(/divide|ln|exponent/);

        switch (parameters.form) {
          case 'isolated_exp':
            expect(item.prompt).toContain('e^(2x)');
            expect(item.answer).toContain('ln 7');
            break;
          case 'scaled_exp':
            expect(numeric(parameters.rhs) / numeric(parameters.scale)).toBe(numeric(parameters.isolated_rhs));
            expect(item.answer).toContain(`ln ${numeric(parameters.isolated_rhs)}`);
            break;
          case 'shifted_exp':
            expect(item.answer).toContain(`ln(${numeric(parameters.rhs)}/${numeric(parameters.scale)})`);
            break;
          default:
            throw new Error(`Unexpected log form ${String(parameters.form)}`);
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('generates correct binomial first terms and product coefficients', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-binomial-'));
    try {
      const items = generatedItems(runGeneratedBuild(dir).output)
        .filter((item) => item.generator_family === 'binomial_expansion.first_terms_and_coefficient');

      expect(items).toHaveLength(3);
      for (const item of items) {
        const parameters = item.parameters;
        expect(item.skill_target_id).toBe('p3_binomial_expansion');
        expect(['first_step', 'complete_step', 'guardian_prep']).toContain(item.sequence_role);
        expect(parameters.sequence_stage).toBeTruthy();
        if (parameters.item_type === 'expand_first_terms') {
          const expectedTerms: Array<[number, number]> = [
            [1, 0],
            [numeric(parameters.x_coefficient), 1],
          ];
          if (numeric(parameters.max_power) >= 2) {
            expectedTerms.push([numeric(parameters.x2_coefficient), 2]);
          }
          const expected = polynomialText(expectedTerms);
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

  pipelineIt('generates sequenced algebra depth families for partial fractions, modulus, and validity ranges', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-algebra-depth-'));
    try {
      const items = generatedItems(runGeneratedBuild(dir).output);
      const families = [
        'algebra.partial_fractions_distinct_linear',
        'algebra.partial_fractions_repeated_linear',
        'algebra.modulus_equation_basic',
        'algebra.binomial_validity_range',
      ];

      for (const family of families) {
        const familyItems = items.filter((item) => item.generator_family === family);
        expect(familyItems.map((item) => item.sequence_role).sort()).toEqual(['complete_step', 'first_step', 'guardian_prep']);
        expect(familyItems.every((item) => item.verification.status === 'pass')).toBe(true);
        expect(familyItems.every((item) => item.worked_solution.length >= 2)).toBe(true);
        expect(familyItems.every((item) => item.source_snippet_id && item.example_model_id)).toBe(true);
        expect(familyItems.every((item) => item.question_type && item.key_method && item.exam_move)).toBe(true);
      }

      expect(items.find((item) => item.generator_family === 'algebra.partial_fractions_repeated_linear' && item.sequence_role === 'first_step')?.answer).toContain('(x - 2)^2');
      expect(items.find((item) => item.generator_family === 'algebra.modulus_equation_basic' && item.sequence_role === 'complete_step')?.answer).toBe('x = -2 or x = 8');
      expect(items.find((item) => item.generator_family === 'algebra.binomial_validity_range' && item.sequence_role === 'guardian_prep')?.answer).toContain('valid for -2 < x < 2');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('generates sequenced trigonometry identity, interval, and R-form warm-ups', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-trig-depth-'));
    try {
      const items = generatedItems(runGeneratedBuild(dir).output);
      const families = [
        'trigonometry.identity_rewrite_basic',
        'trigonometry.double_angle_basic',
        'trigonometry.solve_equation_interval_basic',
        'trigonometry.r_form_basic',
      ];

      for (const family of families) {
        const familyItems = items.filter((item) => item.generator_family === family);
        expect(familyItems.map((item) => item.sequence_role).sort()).toEqual(['complete_step', 'first_step', 'guardian_prep']);
        expect(familyItems.every((item) => item.verification.status === 'pass')).toBe(true);
        expect(familyItems.every((item) => item.source_snippet_id && item.example_model_id)).toBe(true);
        expect(familyItems.every((item) => item.question_type && item.key_method && item.exam_move)).toBe(true);
      }

      expect(items.find((item) => item.generator_family === 'trigonometry.r_form_basic' && item.sequence_role === 'first_step')?.answer).toBe('R = 5');
      expect(items.find((item) => item.generator_family === 'trigonometry.solve_equation_interval_basic' && item.sequence_role === 'guardian_prep')?.worked_solution.join(' ')).toContain('instead of dividing by sin x');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('writes deterministic generated and runtime output for the same inputs', () => {
    const firstDir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-a-'));
    const secondDir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-b-'));
    try {
      const first = runGeneratedBuild(firstDir);
      const second = runGeneratedBuild(secondDir);

      expect(first.output).toBe(second.output);
      expect(first.runtime).toBe(second.runtime);
      expect(first.report).toBe(second.report);
    } finally {
      rmSync(firstDir, { recursive: true, force: true });
      rmSync(secondDir, { recursive: true, force: true });
    }
  });

  pipelineIt('writes generator and region coverage into the Content Lab report', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-report-'));
    try {
      const report = JSON.parse(runGeneratedBuild(dir).report);

      expect(report.generator_family_counts).toMatchObject({
        'logarithms_and_exponentials.log_equation_basic': 3,
        'binomial_expansion.first_terms_and_coefficient': 3,
        'algebra.binomial_validity_range': 3,
        'algebra.modulus_equation_basic': 3,
        'algebra.partial_fractions_distinct_linear': 3,
        'algebra.partial_fractions_repeated_linear': 3,
        'trigonometry.identity_rewrite_basic': 3,
        'trigonometry.double_angle_basic': 3,
        'trigonometry.solve_equation_interval_basic': 3,
        'trigonometry.r_form_basic': 3,
      });
      expect(report.generated_warmups_per_region).toMatchObject({
        'logarithm-grove': 3,
        'algebra-forge': 15,
        'trig-observatory': 12,
      });
      expect(report.generated_families_by_topic).toHaveProperty('trigonometry');
      expect(report.batch_7_depth_summary.priority_region_depth).toEqual(expect.any(Array));
      expect(report.snippets_with_examples_by_region).toMatchObject({
        'logarithm-grove': 1,
        'algebra-forge': 3,
        'trig-observatory': 1,
      });
      expect(report.method_snippets_missing_examples).toEqual([]);
      expect(report.warmups_without_example_model).toEqual([]);
      expect(report.warmups_linked_to_examples).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            practice_id: 'gen_log_equation_basic_0001',
            source_snippet_id: 'log-snippet',
            example_model_id: 'log-snippet-example-1',
            sequence_role: 'first_step',
          }),
        ]),
      );
      expect(report.priority_region_example_coverage).toEqual(expect.any(Array));
      expect(report.active_regions.find((region: { region_id: string }) => region.region_id === 'logarithm-grove')).toMatchObject({
        quick_checks: 1,
        snippets_with_examples: 1,
        generated_warmups: 3,
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects malformed generated practice in the runtime file', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-verify-'));
    const runtimePracticePath = path.join(dir, 'runtime_generated_practice_bank.json');
    try {
      const snippetsPath = writeVerifierBase(dir, runtimePracticePath, {
        review_status: 'candidate',
      });

      expectPythonFailure([
        verifyScript,
        '--outputs-dir',
        dir,
        '--snippets',
        snippetsPath,
        '--runtime-generated-practice',
        runtimePracticePath,
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects runtime generated practice with an empty worked solution', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-empty-solution-'));
    const runtimePracticePath = path.join(dir, 'runtime_generated_practice_bank.json');
    try {
      const snippetsPath = writeVerifierBase(dir, runtimePracticePath, {
        worked_solution: [],
      });

      expectPythonFailure([
        verifyScript,
        '--outputs-dir',
        dir,
        '--snippets',
        snippetsPath,
        '--runtime-generated-practice',
        runtimePracticePath,
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects runtime generated practice without a sequence role', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-missing-sequence-role-'));
    const runtimePracticePath = path.join(dir, 'runtime_generated_practice_bank.json');
    try {
      const snippetsPath = writeVerifierBase(dir, runtimePracticePath, {
        sequence_role: '',
      });

      expectPythonFailure([
        verifyScript,
        '--outputs-dir',
        dir,
        '--snippets',
        snippetsPath,
        '--runtime-generated-practice',
        runtimePracticePath,
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects first-batch runtime generated practice without an example link', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-missing-example-link-'));
    const runtimePracticePath = path.join(dir, 'runtime_generated_practice_bank.json');
    try {
      const snippetsPath = writeVerifierBase(dir, runtimePracticePath, {
        example_model_id: '',
      });

      expectPythonFailure([
        verifyScript,
        '--outputs-dir',
        dir,
        '--snippets',
        snippetsPath,
        '--runtime-generated-practice',
        runtimePracticePath,
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
