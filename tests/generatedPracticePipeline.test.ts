import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const buildScript = path.join(repoRoot, 'tools/content_lab/scripts/build_generated_practice.py');
const auditLegacySkillTargetsScript = path.join(repoRoot, 'tools/content_lab/scripts/audit_legacy_skill_targets.py');
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
  paper_family?: string;
  topic?: string;
  skill_target_id?: string;
  skill_target_resolution_status?: string;
  source_snippet_id?: string;
  example_model_id?: string;
  question_type?: string;
  key_method?: string;
  exam_move?: string;
  region_ids?: string[];
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
        skill_target_id: 'p3_log_exponential_equations',
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
        skill_target_id: 'p3_alg_binomial_terms_coefficients',
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
      ...[
        'algebra',
        'quadratics',
        'differentiation',
        'parametric_equations',
        'integration',
        'complex_numbers',
        'vectors',
        'numerical_methods',
        'differential_equations',
      ].map((topic) => ({
        skill_target_id: `p3_${topic}`,
        paper_family: 'p3',
        topic,
      })),
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
        snippet_id: 'p3-quadratics-discriminant-001',
        paper_family: 'p3',
        topics: ['quadratics'],
        region_ids: ['algebra-forge'],
        title: 'Discriminant checks',
        student_goal: 'Use the discriminant before solving.',
        body: 'Use root conditions directly.',
        steps: ['Compute the discriminant.', 'Interpret its sign.'],
        exam_move: 'Use discriminant evidence before solving roots.',
        common_trap: 'Solving when only root type is needed.',
        review_status: 'teacher_reviewed',
        source: 'teacher_authored',
        source_skill_target_ids: ['p3_quadratics'],
        related_skill_targets: ['p3_quadratics'],
        worked_example: {
          id: 'p3-quadratics-discriminant-001-example-1',
          prompt: 'Find the discriminant of x^2 + 2x + 5.',
          steps: ['Use b^2 - 4ac.'],
          answer: '-16',
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
      ...([
        ['p3-differentiation-method-001', 'differentiation', ['calculus-cliffs'], 'Differentiate with a named rule'],
        ['p3-parametric-derivative-001', 'parametric_equations', ['calculus-cliffs'], 'Use parametric derivative ratios'],
        ['p3-integration-method-choice-001', 'integration', ['integration-gardens'], 'Choose the integration setup'],
        ['p3-complex-form-001', 'complex_numbers', ['complex-harbor'], 'Move between complex forms'],
        ['p3-vectors-lines-001', 'vectors', ['vector-workshop'], 'Use vector lines and products'],
        ['p3-numerical-method-evidence-001', 'numerical_methods', ['numerical-mines'], 'Show numerical evidence'],
        ['p3-differential-separation-001', 'differential_equations', ['differential-shrine'], 'Separate variables first'],
      ] as const).map(([snippetId, topic, regionIds, title]) => ({
        snippet_id: snippetId,
        paper_family: 'p3',
        topic,
        topics: [topic],
        region_ids: regionIds,
        title,
        student_goal: 'Prepare for an underserved P3 method safely.',
        body: 'Use the method signal before calculating.',
        steps: ['Name the method.', 'Carry out the first algebraic line.'],
        exam_move: 'Write the setup line before calculating.',
        common_trap: 'Starting calculation before choosing the method.',
        review_status: 'teacher_reviewed',
        source: 'teacher_authored',
        source_skill_target_ids: [`p3_${topic}`],
        related_skill_targets: [`p3_${topic}`],
        worked_example: {
          id: `${snippetId}-example-1`,
          prompt: 'State the first method line for a short warm-up.',
          steps: ['Identify the method signal.', 'Write the setup before simplifying.'],
          answer: 'Use the named method setup.',
        },
      })),
    ],
  }, null, 2));

  return { skillTargetsPath, snippetsPath };
}

function runGeneratedBuild(dir: string, runtimeSeed?: Record<string, unknown>) {
  const { skillTargetsPath, snippetsPath } = writeInputs(dir);
  const outputPath = path.join(dir, 'generated_practice_bank.json');
  const runtimeOutputPath = path.join(dir, 'runtime_generated_practice_bank.json');
  const reportOutputPath = path.join(dir, 'content_lab_report.json');
  if (runtimeSeed) {
    writeFileSync(runtimeOutputPath, JSON.stringify(runtimeSeed, null, 2));
  }
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

function existingRuntimeItem(overrides: Partial<GeneratedPracticeItem> = {}): GeneratedPracticeItem {
  return {
    practice_id: 'existing-reviewed-complex-locus',
    generator_family: 'complex_numbers.legacy_locus_reviewed',
    paper_family: 'p3',
    topic: 'complex_numbers',
    skill_target_id: 'p3_complex_argand_loci_regions',
    skill_target_resolution_status: 'reviewed_p3_skill_map_id',
    source_snippet_id: 'p3-complex-locus-001',
    example_model_id: 'p3-complex-locus-001-example-1',
    question_type: 'Complex locus',
    key_method: 'Translate the modulus equation into a distance statement.',
    exam_move: 'Name the centre and radius from the Argand equation.',
    region_ids: ['complex-harbor'],
    prompt: 'Describe the locus |z - (1 + 2i)| = 4.',
    answer: 'A circle with centre (1, 2) and radius 4',
    worked_solution: [
      'The fixed complex number is 1 + 2i.',
      'The modulus equation says every point is distance 4 from that fixed point.',
      'So the locus is a circle with centre (1, 2) and radius 4.',
    ],
    parameters: { centre_real: 1, centre_imaginary: 2, radius: 4 },
    sequence_role: 'first_step',
    verification: { status: 'pass' },
    review_status: 'teacher_reviewed',
    ...overrides,
  };
}

function numeric(value: number | string | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.includes('/')) {
    const [numerator, denominator] = value.split('/').map(Number);
    return numerator / denominator;
  }
  return Number(value);
}

function expectGeneratorCaseRejected(builderName: string, invalidCase: Record<string, unknown>) {
  const code = `
import importlib.util
import pathlib

script_path = pathlib.Path(${JSON.stringify(buildScript)})
spec = importlib.util.spec_from_file_location("build_generated_practice", script_path)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)
context = {
    "skill_ids_by_key": {},
    "snippet_ids_by_key": {},
    "snippet_ids_by_id": {},
    "example_ids_by_snippet_id": {},
    "example_metadata_by_id": {},
    "snippet_metadata_by_id": {},
    "region_ids_by_key": {},
}
try:
    getattr(module, ${JSON.stringify(builderName)})(context, 1, ${JSON.stringify(invalidCase)})
except ValueError as error:
    print(str(error))
else:
    raise SystemExit("expected invalid parameters to be rejected")
`;
  const output = execFileSync('python3', ['-c', code], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: pythonTimeoutMs,
    maxBuffer: 1024 * 1024,
  });
  expect(output).toContain('refused invalid parameters');
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
  const reviewedSkillByTopic: Record<string, string> = {
    logarithms_and_exponentials: 'p3_log_laws_equations',
    binomial_expansion: 'p3_alg_binomial_terms_coefficients',
    trigonometry: 'p3_trig_equation_interval',
    complex_numbers: 'p3_complex_modulus_argument_form',
    differentiation: 'p3_diff_method_selection',
    integration: 'p3_int_method_choice',
    vectors: 'p3_vec_line_equations_intersections',
    numerical_methods: 'p3_num_sign_change_graph_evidence',
    differential_equations: 'p3_de_separation_setup',
  };
  const firstBatchSources: Record<string, { questionId: string; questionAsset: string; markSchemeAsset: string; questionType: string }> = {
    logarithms_and_exponentials: {
      questionId: '31autumn23_q01',
      questionAsset: 'p3/31autumn23/questions/q01.png',
      markSchemeAsset: 'p3/31autumn23/mark_scheme/q01.png',
      questionType: 'Logarithm equation',
    },
    binomial_expansion: {
      questionId: '31autumn23_q01',
      questionAsset: 'p3/31autumn23/questions/q01.png',
      markSchemeAsset: 'p3/31autumn23/mark_scheme/q01.png',
      questionType: 'Binomial term or coefficient',
    },
    trigonometry: {
      questionId: '31autumn23_q01',
      questionAsset: 'p3/31autumn23/questions/q01.png',
      markSchemeAsset: 'p3/31autumn23/mark_scheme/q01.png',
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
    const skillTargetId = reviewedSkillByTopic[topic];
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
        skill_target_id: skillTargetId,
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
      source_skill_target_ids: [skillTargetId],
      related_skill_targets: [skillTargetId],
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
        skill_target_id: 'p3_log_laws_equations',
        skill_target_resolution_status: 'reviewed_p3_skill_map_id',
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
  pipelineIt('audits and contains legacy skill target IDs without promoting unresolved IDs', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-legacy-skill-targets-'));
    try {
      const generatedPath = path.join(dir, 'generated_practice_bank.json');
      const snippetsPath = path.join(dir, 'teaching_snippets.json');
      const reportPath = path.join(dir, 'legacy_skill_target_audit.json');
      const markdownPath = path.join(dir, 'legacy_skill_target_audit.md');
      writeFileSync(generatedPath, JSON.stringify({
        items: [
          {
            practice_id: 'gen_log_equation_basic_0001',
            skill_target_id: 'p3_logarithms_and_exponentials',
            region_ids: ['logarithm-grove'],
          },
        ],
      }, null, 2));
      writeFileSync(snippetsPath, JSON.stringify({
        snippets: [
          {
            snippet_id: 'p3-log-laws-001',
            region_ids: ['logarithm-grove'],
            source_skill_target_ids: ['p3_logarithms_and_exponentials'],
            related_skill_targets: ['p3_logarithms_and_exponentials'],
            quick_check: {
              id: 'p3-log-laws-001-qc',
              skill_target_id: 'p3_logarithms_and_exponentials',
            },
          },
          {
            snippet_id: 'p4-momentum-direction-001',
            source_skill_target_ids: ['p4_momentum_impulse'],
            related_skill_targets: ['p4_momentum_impulse'],
            quick_check: {
              id: 'p4-momentum-direction-001-qc',
              skill_target_id: 'p4_momentum_impulse',
            },
          },
        ],
      }, null, 2));

      runPython([
        auditLegacySkillTargetsScript,
        '--generated-practice',
        generatedPath,
        '--snippets',
        snippetsPath,
        '--json-output',
        reportPath,
        '--markdown-output',
        markdownPath,
        '--apply',
      ]);

      const generated = JSON.parse(readFileSync(generatedPath, 'utf8'));
      const snippets = JSON.parse(readFileSync(snippetsPath, 'utf8'));
      const report = JSON.parse(readFileSync(reportPath, 'utf8'));

      expect(generated.items[0]).toMatchObject({
        skill_target_id: 'p3_log_exponential_equations',
        legacy_skill_target_id: 'p3_logarithms_and_exponentials',
        skill_target_resolution_status: 'reviewed_p3_skill_map_id',
      });
      expect(snippets.snippets[0]).toMatchObject({
        source_skill_target_ids: ['p3_log_laws_equations'],
        related_skill_targets: ['p3_log_laws_equations'],
        legacy_skill_target_ids: ['p3_logarithms_and_exponentials'],
        skill_target_resolution_status: 'reviewed_p3_skill_map_id',
      });
      expect(snippets.snippets[0].quick_check).toMatchObject({
        skill_target_id: 'p3_log_laws_equations',
        legacy_skill_target_id: 'p3_logarithms_and_exponentials',
        skill_target_resolution_status: 'reviewed_p3_skill_map_id',
      });
      expect(snippets.snippets[1]).toMatchObject({
        source_skill_target_ids: ['p4_momentum_impulse'],
        related_skill_targets: ['p4_momentum_impulse'],
        legacy_skill_target_ids: ['p4_momentum_impulse'],
        skill_target_resolution_status: 'legacy_unresolved',
      });
      expect(snippets.snippets[1].quick_check).toMatchObject({
        skill_target_id: 'p4_momentum_impulse',
        legacy_skill_target_id: 'p4_momentum_impulse',
        skill_target_resolution_status: 'legacy_unresolved',
      });
      expect(report.summary).toMatchObject({
        legacy_reference_count: 7,
        resolved_reference_count: 4,
        unresolved_reference_count: 3,
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('preserves existing reviewed runtime warm-ups that the generator does not rebuild yet', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-preserve-runtime-'));
    try {
      const runtimeSeed = {
        schema_name: 'asterion_generated_practice',
        schema_version: 2,
        items: [
          existingRuntimeItem(),
          existingRuntimeItem({
            practice_id: 'existing-failed-runtime-item',
            verification: { status: 'fail' },
          }),
          existingRuntimeItem({
            practice_id: 'existing-fallback-runtime-item',
            route_evidence_status: 'fallback-display-only',
          }),
        ],
      };
      const built = runGeneratedBuild(dir, runtimeSeed);
      const runtimeItems = generatedItems(built.runtime);

      expect(runtimeItems.some((item) => item.practice_id === 'existing-reviewed-complex-locus')).toBe(true);
      expect(runtimeItems.some((item) => item.practice_id === 'existing-failed-runtime-item')).toBe(false);
      expect(runtimeItems.some((item) => item.practice_id === 'existing-fallback-runtime-item')).toBe(false);
      expect(runtimeItems.filter((item) => item.practice_id === 'existing-reviewed-complex-locus')).toHaveLength(1);
      expect(runtimeItems.find((item) => item.practice_id === 'existing-reviewed-complex-locus')).toMatchObject({
        generator_family: 'complex_numbers.legacy_locus_reviewed',
        skill_target_id: 'p3_complex_argand_loci_regions',
        skill_target_resolution_status: 'reviewed_p3_skill_map_id',
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('generates sequenced exponential warm-ups linked to the Field Guide example', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-log-'));
    try {
      const items = generatedItems(runGeneratedBuild(dir).output)
        .filter((item) => item.generator_family === 'logarithms_and_exponentials.log_equation_basic');

      expect(items).toHaveLength(3);
      for (const item of items) {
        const parameters = item.parameters;
        expect(item.verification.status).toBe('pass');
        expect(item.skill_target_id).toBe('p3_log_exponential_equations');
        expect(['first_step', 'complete_step', 'guardian_prep']).toContain(item.sequence_role);
        expect(parameters.sequence_stage).toBeTruthy();
        expect(item.source_snippet_id).toBe('log-snippet');
        expect(item.example_model_id).toBe('log-snippet-example-1');
        expect(item.question_type).toBeTruthy();
        expect(item.key_method).toBeTruthy();
        expect(item.exam_move).toBeTruthy();
        expect(parameters.topic_contract_id).toBe('log_e_natural_logs');
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
        expect(item.skill_target_id).toBe('p3_alg_binomial_terms_coefficients');
        expect(['first_step', 'complete_step', 'guardian_prep']).toContain(item.sequence_role);
        expect(parameters.sequence_stage).toBeTruthy();
        expect(parameters.topic_contract_id).toBe('algebra_binomial_expansion');
      }
      expect(items.find((item) => item.parameters.item_type === 'expand_to_cubic')?.answer)
        .toBe('1 + 4x + 12x^2 + 32x^3, valid for |x| < 1/2');
      expect(items.find((item) => item.parameters.item_type === 'rewrite_then_expand')?.answer)
        .toContain('sqrt(2)');
      expect(items.find((item) => item.parameters.item_type === 'coefficient_extraction')?.answer)
        .toBe('coefficient of x^3 = -72');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('generates sequenced algebra depth families for partial fractions, modulus, and validity ranges', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-algebra-depth-'));
    try {
      const items = generatedItems(runGeneratedBuild(dir).output);
      const families = [
        'algebra.polynomial_remainder_factor_basic',
        'algebra.partial_fractions_distinct_linear',
        'algebra.partial_fractions_repeated_linear',
        'algebra.modulus_equation_basic',
        'algebra.binomial_validity_range',
      ];

      for (const family of families) {
        const familyItems = items.filter((item) => item.generator_family === family);
        expect(familyItems.length, family).toBeGreaterThanOrEqual(3);
        expect(new Set(familyItems.map((item) => item.sequence_role)), family).toEqual(new Set(['complete_step', 'first_step', 'guardian_prep']));
        expect(familyItems.every((item) => item.verification.status === 'pass')).toBe(true);
        expect(familyItems.every((item) => item.worked_solution.length >= 2)).toBe(true);
        expect(familyItems.every((item) => item.source_snippet_id && item.example_model_id)).toBe(true);
        expect(familyItems.every((item) => item.question_type && item.key_method && item.exam_move)).toBe(true);
        expect(familyItems.every((item) => item.parameters.topic_contract_id)).toBe(true);
      }

      expect(items.find((item) => item.parameters.topic_contract_id === 'algebra_polynomial_division' && item.sequence_role === 'guardian_prep')?.answer).toBe('quotient = x^2 - x + 3, remainder = 4');
      expect(items.find((item) => item.parameters.topic_contract_id === 'algebra_remainder_factor_theorem' && item.parameters.item_type === 'two_condition_parameters')?.answer).toBe('a = 0, b = -7');
      expect(items.find((item) => item.generator_family === 'algebra.partial_fractions_repeated_linear' && item.sequence_role === 'first_step')?.answer).toContain('(x - 1)^2');
      expect(items.find((item) => item.generator_family === 'algebra.modulus_equation_basic' && item.parameters.item_type === 'graph_interval')?.answer).toBe('x < -1/2 or x > 1');
      expect(items.find((item) => item.generator_family === 'algebra.binomial_validity_range' && item.sequence_role === 'guardian_prep')?.answer).toBe('1.0198');
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
        'trigonometry.addition_formulae_basic',
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
        expect(familyItems.every((item) => item.parameters.topic_contract_id)).toBe(true);
      }

      expect(items.find((item) => item.generator_family === 'trigonometry.r_form_basic' && item.sequence_role === 'first_step')?.answer).toBe('R = 5');
      expect(items.find((item) => item.generator_family === 'trigonometry.solve_equation_interval_basic' && item.sequence_role === 'guardian_prep')?.worked_solution.join(' ')).toContain('instead of dividing by sin x');
      expect(items.find((item) => item.generator_family === 'trigonometry.addition_formulae_basic' && item.sequence_role === 'guardian_prep')?.worked_solution.join(' ')).toContain('shifted interval');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('keeps remaining review-queue families out of runtime while publishing promoted gap-fill families', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-underserved-'));
    try {
      const built = runGeneratedBuild(dir);
      const items = generatedItems(built.output);
      const runtimeItems = generatedItems(built.runtime);
      const families = [
        'parametric_equations.derivative_ratio_basic',
        'complex_numbers.cartesian_locus_roots_basic',
        'logarithms_and_exponentials.calculus_context_basic',
      ];

      for (const family of families) {
        const familyItems = items.filter((item) => item.generator_family === family);
        expect(familyItems.map((item) => item.sequence_role).sort()).toEqual(['complete_step', 'first_step', 'guardian_prep']);
        expect(familyItems.every((item) => item.review_status === 'needs_review')).toBe(true);
        expect(familyItems.every((item) => item.verification.status === 'pass')).toBe(true);
        expect(familyItems.every((item) => item.worked_solution.length >= 2)).toBe(true);
        expect(familyItems.every((item) => item.source_snippet_id && item.example_model_id)).toBe(true);
        expect(familyItems.every((item) => typeof item.parameters.safe_bounds === 'string')).toBe(true);
      }

      expect(runtimeItems.some((item) => families.includes(item.generator_family))).toBe(false);
      const promotedFamilies = [
        ['algebra.polynomial_remainder_factor_basic', 'p3_alg_polynomial_remainder_factor', 10],
        ['logarithms_and_exponentials.graph_inverse_basic', 'p3_log_convert_forms', 3],
        ['logarithms_and_exponentials.laws_basic', 'p3_log_laws_equations', 3],
        ['logarithms_and_exponentials.exponential_inequality_basic', 'p3_log_exponential_equations', 3],
        ['logarithms_and_exponentials.domain_validation_basic', 'p3_log_domain_validation', 3],
        ['logarithms_and_exponentials.linearisation_basic', 'p3_log_linearisation', 3],
        ['differentiation.chain_product_basic', 'p3_diff_chain_product_quotient', 3],
        ['differentiation.implicit_log_exp_basic', 'p3_diff_implicit_log_exp', 3],
        ['differentiation.stationary_tangent_normal_basic', 'p3_diff_stationary_tangent_normal', 3],
        ['integration.method_setup_basic', 'p3_int_method_choice', 3],
        ['integration.definite_area_basic', 'p3_int_definite_improper_area', 3],
        ['integration.parts_substitution_basic', 'p3_int_parts_substitution', 3],
        ['complex_numbers.modulus_argument_basic', 'p3_complex_modulus_argument_form', 3],
        ['complex_numbers.locus_basic', 'p3_complex_argand_loci_regions', 3],
        ['complex_numbers.roots_basic', 'p3_complex_roots_powers', 3],
        ['complex_numbers.cartesian_conjugate_basic', 'p3_complex_cartesian_conjugate', 3],
        ['numerical_methods.sign_change_iteration_basic', 'p3_num_sign_change_graph_evidence', 3],
        ['numerical_methods.iteration_formula_basic', 'p3_num_iteration_formula', 3],
        ['numerical_methods.accuracy_rounding_basic', 'p3_num_accuracy_rounding', 3],
        ['differential_equations.separation_basic', 'p3_de_separation_setup', 3],
        ['differential_equations.initial_condition_basic', 'p3_de_initial_condition', 3],
        ['differential_equations.context_model_basic', 'p3_de_forming_context_model', 3],
        ['vectors.line_scalar_product_basic', 'p3_vec_scalar_product_angles', 3],
        ['vectors.line_intersection_basic', 'p3_vec_line_equations_intersections', 3],
        ['vectors.line_relationship_basic', 'p3_vec_3d_geometry_modelling', 3],
      ] as const;
      for (const [family, skillTargetId, expectedCount] of promotedFamilies) {
        const familyItems = items.filter((item) => item.generator_family === family);
        const runtimeFamilyItems = runtimeItems.filter((item) => item.generator_family === family);
        expect(new Set(familyItems.map((item) => item.sequence_role)), family).toEqual(new Set(['complete_step', 'first_step', 'guardian_prep']));
        expect(familyItems.every((item) => item.review_status === 'teacher_reviewed')).toBe(true);
        expect(familyItems.every((item) => item.skill_target_id === skillTargetId)).toBe(true);
        expect(familyItems.every((item) => item.skill_target_resolution_status === 'reviewed_p3_skill_map_id')).toBe(true);
        expect(familyItems.every((item) => item.verification.status === 'pass')).toBe(true);
        expect(runtimeFamilyItems).toHaveLength(expectedCount);
      }
      expect(runtimeItems.some((item) => item.generator_family === 'algebra.structure_rearrangement_basic')).toBe(false);
      expect(runtimeItems.some((item) => item.generator_family === 'quadratics.discriminant_root_condition_basic')).toBe(false);
      expect(runtimeItems.some((item) => item.generator_family === 'logarithms_and_exponentials.calculus_context_basic')).toBe(false);
      expect(runtimeItems.some((item) => item.skill_target_id === 'p3_log_calculus_contexts')).toBe(false);
      expect(items.find((item) => item.generator_family === 'algebra.polynomial_remainder_factor_basic' && item.parameters.item_type === 'solve_by_factors')?.answer).toBe('x = -1, 1, or 4');
      expect(items.find((item) => item.generator_family === 'logarithms_and_exponentials.domain_validation_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('x = 4');
      expect(items.find((item) => item.generator_family === 'logarithms_and_exponentials.exponential_inequality_basic' && item.parameters.item_type === 'decreasing_base')?.answer).toBe('x >= 3');
      expect(items.find((item) => item.generator_family === 'differentiation.stationary_tangent_normal_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('y - 4 = -1/4(x - 2)');
      expect(items.find((item) => item.generator_family === 'integration.parts_substitution_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('x e^x - e^x + C');
      expect(items.find((item) => item.generator_family === 'complex_numbers.modulus_argument_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('modulus = 8, argument = pi/2');
      expect(items.find((item) => item.generator_family === 'complex_numbers.locus_basic' && item.sequence_role === 'guardian_prep')?.answer).toContain('ray from');
      expect(items.find((item) => item.generator_family === 'complex_numbers.roots_basic' && item.sequence_role === 'guardian_prep')?.answer).toContain('sqrt(3)i');
      expect(items.find((item) => item.generator_family === 'complex_numbers.cartesian_conjugate_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('z = 3 + 2i');
      expect(items.find((item) => item.generator_family === 'numerical_methods.sign_change_iteration_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('A root is justified in (1, 2)');
      expect(items.find((item) => item.generator_family === 'numerical_methods.iteration_formula_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe("Yes, it is locally suitable because |g'(x)| < 1");
      expect(items.find((item) => item.generator_family === 'numerical_methods.accuracy_rounding_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('x = 0.15 to 2 d.p.');
      expect(items.find((item) => item.generator_family === 'parametric_equations.derivative_ratio_basic' && item.sequence_role === 'complete_step')?.answer).toBe('dy/dx = 1/2');
      expect(items.find((item) => item.generator_family === 'complex_numbers.cartesian_locus_roots_basic' && item.sequence_role === 'guardian_prep')?.answer).toContain('sqrt(3)i');
      expect(items.find((item) => item.generator_family === 'vectors.line_scalar_product_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('cos theta = 8/9');
      expect(items.find((item) => item.generator_family === 'vectors.line_relationship_basic' && item.sequence_role === 'first_step')?.answer).toBe('<3, 3, 2>');
      expect(items.find((item) => item.generator_family === 'differential_equations.separation_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('y = 5');
      expect(items.find((item) => item.generator_family === 'differential_equations.initial_condition_basic' && item.sequence_role === 'guardian_prep')?.answer).toBe('y = 5');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('refuses unsafe parameters in underserved P3 generators', () => {
    const invalidCases: Array<[string, Record<string, unknown>]> = [
      ['build_algebra_structure_item', { item_type: 'zero_product', left_root: 2, right_root: 2, sequence_role: 'guardian_prep' }],
      ['build_polynomial_remainder_item', { item_type: 'factor_parameter', root: 0, constant: 2, sequence_role: 'guardian_prep' }],
      ['build_quadratics_discriminant_item', { item_type: 'repeated_root_parameter', a: 1, b: 0, c: 8, sequence_role: 'guardian_prep' }],
      ['build_log_domain_item', { item_type: 'combined_log_equation', left_shift: 2, right_shift: -1, rhs: 10, valid_root: 4, invalid_root: 1, sequence_role: 'guardian_prep' }],
      ['build_log_linearisation_item', { item_type: 'specific_model', coefficient: 0, gradient: 2, sequence_role: 'guardian_prep' }],
      ['build_log_calculus_context_item', { item_type: 'differentiate_log_chain', a: 0, b: 1, sequence_role: 'complete_step' }],
      ['build_differentiation_item', { item_type: 'tangent_chain', c: 5, n: 4, x0: 3, sequence_role: 'guardian_prep' }],
      ['build_differentiation_implicit_log_exp_item', { item_type: 'implicit_setup', radius_squared: 0, sequence_role: 'first_step' }],
      ['build_differentiation_stationary_tangent_item', { item_type: 'unsupported_stationary_case', sequence_role: 'guardian_prep' }],
      ['build_parametric_derivative_item', { item_type: 'tangent_line', a: 0, b: 1, c: 1, d: -4, t0: 3, sequence_role: 'guardian_prep' }],
      ['build_integration_item', { item_type: 'substitution_integrate', c: 3, n: 9, sequence_role: 'complete_step' }],
      ['build_integration_definite_area_item', { item_type: 'definite_integral', upper: 9, sequence_role: 'complete_step' }],
      ['build_integration_parts_substitution_item', { item_type: 'unsupported_parts_case', sequence_role: 'guardian_prep' }],
      ['build_complex_modulus_argument_item', { item_type: 'modulus', real: 2, imaginary: 3, sequence_role: 'first_step' }],
      ['build_complex_locus_item', { item_type: 'equal_distance_bisector', left_real: 2, right_real: 2, imaginary: 0, sequence_role: 'complete_step' }],
      ['build_complex_roots_item', { item_type: 'square_roots', modulus: 9, sequence_role: 'complete_step' }],
      ['build_complex_cartesian_locus_roots_item', { item_type: 'cube_roots_real', root_modulus: 3, sequence_role: 'guardian_prep' }],
      ['build_complex_cartesian_conjugate_item', { item_type: 'unsupported_conjugate_case', sequence_role: 'guardian_prep' }],
      ['build_vectors_line_scalar_item', { item_type: 'angle_cosine', left_x: 1, left_y: 1, left_z: 0, right_x: 2, right_y: 1, right_z: 0, sequence_role: 'guardian_prep' }],
      ['build_vectors_line_intersection_item', { item_type: 'point_on_line_parameter', lambda_value: 3, sequence_role: 'guardian_prep' }],
      ['build_vectors_line_relationship_item', { item_type: 'direction_from_points', ax: 1, ay: 2, az: 3, bx: 1, by: 2, bz: 3, sequence_role: 'first_step' }],
      ['build_numerical_sign_change_iteration_item', { item_type: 'endpoint_check', constant: 5, left: 3, right: 4, sequence_role: 'first_step' }],
      ['build_numerical_iteration_formula_item', { item_type: 'perform_iterations', constant: 5, x0: 0, iterations: 2, sequence_role: 'complete_step' }],
      ['build_numerical_accuracy_rounding_item', { item_type: 'successive_bounds', lower_numerator: 1549, upper_numerator: 1551, sequence_role: 'guardian_prep' }],
      ['build_differential_equations_item', { item_type: 'initial_condition_value', y0: 2, x_value: 4, sequence_role: 'guardian_prep' }],
      ['build_differential_initial_condition_item', { item_type: 'value_from_relation', y0: 2, x0: 0, x_value: 4, sequence_role: 'guardian_prep' }],
      ['build_differential_equations_context_model_item', { item_type: 'find_rate_constant', value: 0, rate: 5, sequence_role: 'complete_step' }],
    ];

    for (const [builderName, invalidCase] of invalidCases) {
      expectGeneratorCaseRejected(builderName, invalidCase);
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
        'logarithms_and_exponentials.graph_inverse_basic': 3,
        'logarithms_and_exponentials.laws_basic': 3,
        'logarithms_and_exponentials.exponential_inequality_basic': 3,
        'binomial_expansion.first_terms_and_coefficient': 3,
        'algebra.binomial_validity_range': 3,
        'algebra.modulus_equation_basic': 4,
        'algebra.polynomial_remainder_factor_basic': 10,
        'algebra.partial_fractions_distinct_linear': 4,
        'algebra.partial_fractions_repeated_linear': 3,
        'logarithms_and_exponentials.domain_validation_basic': 3,
        'logarithms_and_exponentials.linearisation_basic': 3,
        'logarithms_and_exponentials.calculus_context_basic': 3,
        'trigonometry.identity_rewrite_basic': 3,
        'trigonometry.addition_formulae_basic': 3,
        'trigonometry.double_angle_basic': 3,
        'trigonometry.solve_equation_interval_basic': 3,
        'trigonometry.r_form_basic': 3,
        'complex_numbers.modulus_argument_basic': 3,
        'complex_numbers.locus_basic': 3,
        'complex_numbers.roots_basic': 3,
        'complex_numbers.cartesian_locus_roots_basic': 3,
        'complex_numbers.cartesian_conjugate_basic': 3,
        'differential_equations.context_model_basic': 3,
        'differential_equations.initial_condition_basic': 3,
        'differential_equations.separation_basic': 3,
        'differentiation.chain_product_basic': 3,
        'differentiation.implicit_log_exp_basic': 3,
        'differentiation.stationary_tangent_normal_basic': 3,
        'integration.definite_area_basic': 3,
        'integration.method_setup_basic': 3,
        'integration.parts_substitution_basic': 3,
        'numerical_methods.accuracy_rounding_basic': 3,
        'numerical_methods.iteration_formula_basic': 3,
        'numerical_methods.sign_change_iteration_basic': 3,
        'parametric_equations.derivative_ratio_basic': 3,
        'vectors.line_intersection_basic': 3,
        'vectors.line_relationship_basic': 3,
        'vectors.line_scalar_product_basic': 3,
      });
      expect(report.generated_warmups_per_region).toMatchObject({
        'logarithm-grove': 18,
        'algebra-forge': 27,
        'calculus-cliffs': 9,
        'complex-harbor': 12,
        'differential-shrine': 9,
        'integration-gardens': 16,
        'numerical-mines': 9,
        'trig-observatory': 15,
        'vector-workshop': 9,
      });
      expect(report.generated_families_by_topic).toHaveProperty('trigonometry');
      expect(report.generated_families_by_topic).toHaveProperty('parametric_equations');
      expect(report.generated_families_by_topic).toHaveProperty('complex_numbers');
      expect(report.batch_7_depth_summary.priority_region_depth).toEqual(expect.any(Array));
      expect(report.snippets_with_examples_by_region).toMatchObject({
        'logarithm-grove': 1,
        'algebra-forge': 4,
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
        generated_warmups: 18,
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

  pipelineIt('rejects runtime generated practice with unmarked legacy P3 skill targets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-legacy-skill-'));
    const runtimePracticePath = path.join(dir, 'runtime_generated_practice_bank.json');
    try {
      const snippetsPath = writeVerifierBase(dir, runtimePracticePath, {
        skill_target_id: 'p3_logarithms_and_exponentials',
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

  pipelineIt('rejects runtime generated practice with unresolved route evidence blockers', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-generated-practice-route-blocker-'));
    const runtimePracticePath = path.join(dir, 'runtime_generated_practice_bank.json');
    try {
      const snippetsPath = writeVerifierBase(dir, runtimePracticePath, {
        route_evidence_status: 'fallback-display-only',
        generation_gate: {
          blocked: true,
          block_reasons: ['fallback_only_route'],
        },
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

  pipelineIt('rejects promoted Content Lab candidates without reviewed source evidence and image pairs', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-candidate-contract-'));
    const runtimePracticePath = path.join(dir, 'runtime_generated_practice_bank.json');
    const candidatesPath = path.join(dir, 'candidates.json');
    try {
      const snippetsPath = writeVerifierBase(dir, runtimePracticePath, {});
      writeFileSync(candidatesPath, JSON.stringify({
        schema_name: 'asterion.content_lab_candidates',
        schema_version: 1,
        candidates: [
          {
            candidate_id: 'promoted_without_evidence',
            question_id: '32spring21_q01',
            paper_family: 'p3',
            candidate_selection: { reviewed_or_approved_subpart: false },
            source_artifacts: {
              question_crop_path: 'p3/32spring21/questions/q01.png',
              mark_scheme_crop_path: '',
            },
            source_skill_ids: [],
            source_mark_event_count: 0,
            role_statuses: { generated_warmup_pattern_source: 'approved' },
            generation_gate: { status: 'approved', blocked: false, block_reasons: [] },
            review_status: 'published',
          },
        ],
      }, null, 2));

      expectPythonFailure([
        verifyScript,
        '--outputs-dir',
        dir,
        '--snippets',
        snippetsPath,
        '--runtime-generated-practice',
        runtimePracticePath,
        '--content-lab-candidates',
        candidatesPath,
        '--skip-question-bank-git-check',
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('allows blocked Content Lab candidates to remain visible as backlog', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-candidate-backlog-'));
    const runtimePracticePath = path.join(dir, 'runtime_generated_practice_bank.json');
    const candidatesPath = path.join(dir, 'candidates.json');
    try {
      const snippetsPath = writeVerifierBase(dir, runtimePracticePath, {});
      writeFileSync(candidatesPath, JSON.stringify({
        schema_name: 'asterion.content_lab_candidates',
        schema_version: 1,
        candidates: [
          {
            candidate_id: 'blocked_backlog_candidate',
            question_id: '32spring21_q01',
            paper_family: 'p3',
            candidate_selection: { reviewed_or_approved_subpart: false },
            source_artifacts: {
              question_crop_path: 'p3/32spring21/questions/q01.png',
              mark_scheme_crop_path: 'p3/32spring21/mark_scheme/q01.png',
            },
            source_skill_ids: [],
            source_mark_event_count: 0,
            role_statuses: { generated_warmup_pattern_source: 'blocked_until_reviewed' },
            generation_gate: {
              status: 'blocked_until_reviewed',
              blocked: true,
              block_reasons: ['missing_source_skill_ids'],
            },
            review_status: 'blocked_until_reviewed',
          },
        ],
      }, null, 2));

      runPython([
        verifyScript,
        '--outputs-dir',
        dir,
        '--snippets',
        snippetsPath,
        '--runtime-generated-practice',
        runtimePracticePath,
        '--content-lab-candidates',
        candidatesPath,
        '--skip-question-bank-git-check',
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
