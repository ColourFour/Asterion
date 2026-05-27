import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const buildScript = path.join(repoRoot, 'tools/content_lab/scripts/build_skill_targets.py');
const verifyScript = path.join(repoRoot, 'tools/content_lab/scripts/verify_content_lab_outputs.py');
const routeDecisionsPath = path.join(repoRoot, 'tools/content_lab/reviews/p3_route_evidence_decisions_v1.json');
const pythonTimeoutMs = 10_000;
const pipelineTestTimeoutMs = 15_000;

function runPython(args: string[]) {
  execFileSync('python3', args, {
    cwd: repoRoot,
    timeout: pythonTimeoutMs,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function readPython(args: string[]): string {
  return execFileSync('python3', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: pythonTimeoutMs,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function pipelineIt(name: string, fn: () => void) {
  return it(name, fn, pipelineTestTimeoutMs);
}

function sourceRecord(overrides: Record<string, unknown> = {}) {
  return {
    question_id: 'auto_q',
    paper_family: 'p3',
    topic: 'logarithms_and_exponentials',
    question_text_trust: 'high',
    mark_scheme_text: 'Use law of logarithm before solving. M1 for method. A1 for answer.',
    text_only_status: 'ready',
    visual_curation_status: 'ready',
    visual_required: false,
    notes: {
      validation_status: 'pass',
      mapping_status: 'pass',
      topic_confidence: 'high',
      text_fidelity_status: 'clean',
      review_flags: [],
    },
    ...overrides,
  };
}

function runBuild(inputRecords: unknown[], outputDir: string) {
  const inputPath = path.join(outputDir, 'question_bank.json');
  writeFileSync(inputPath, JSON.stringify({ questions: inputRecords }, null, 2));
  runPython([buildScript, '--input', inputPath, '--output-dir', outputDir]);
  return {
    skillTargets: readFileSync(path.join(outputDir, 'skill_targets.json'), 'utf8'),
    reviewQueue: readFileSync(path.join(outputDir, 'review_queue.json'), 'utf8'),
    contentLabReport: readFileSync(path.join(outputDir, 'content_lab_report.json'), 'utf8'),
  };
}

function skillTargetFixture(overrides: Record<string, unknown> = {}) {
  return {
    skill_target_id: 'p3_logarithms_and_exponentials',
    paper_family: 'p3',
    topic: 'logarithms_and_exponentials',
    title: 'Logarithms and exponentials',
    student_goal: 'Use log laws safely.',
    micro_skills: ['Convert forms.'],
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
    ...overrides,
  };
}

function regionCoverageSnippets(snippetOverrides: Record<string, unknown> = {}) {
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
    ['p3-log-check', 'logarithms_and_exponentials', ['logarithm-grove'], 'Check the log form'],
    ['p3-algebra-check', 'binomial_expansion', ['algebra-forge'], 'Check the algebra form'],
    ['p3-trig-check', 'trigonometry', ['trig-observatory'], 'Check the trig interval'],
    ['p3-complex-check', 'complex_numbers', ['complex-harbor'], 'Check the complex form'],
    ['p3-diff-check', 'differentiation', ['calculus-cliffs'], 'Check the derivative rule'],
    ['p3-integration-check', 'integration', ['integration-gardens'], 'Check the integral method'],
    ['p3-vector-check', 'vectors', ['vector-workshop'], 'Check the vector setup'],
    ['p3-numerical-check', 'numerical_methods', ['numerical-mines'], 'Check the numerical evidence'],
    ['p3-de-check', 'differential_equations', ['differential-shrine'], 'Check the separated equation'],
  ] as const;

  return rows.map(([snippetId, topic, regionIds, title], index) => {
    const firstBatchSource = firstBatchSources[topic];
    const workedExampleId = `${snippetId}-example-1`;
    const skillTargetId = reviewedSkillByTopic[topic];
    const snippet = {
      snippet_id: snippetId,
      paper_family: 'p3',
      topic,
      topics: [topic],
      region_ids: regionIds,
      title,
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
        title,
        prompt: 'What should you do before calculating?',
        answer: 'Choose the method.',
        explanation: 'A named method keeps the first line purposeful.',
        micro_skill: 'Choose a method before calculating.',
        difficulty_band: 'easy',
        estimated_time_minutes: 1,
        review_status: 'published',
        ...(firstBatchSource ? { example_model_id: workedExampleId } : {}),
      },
      guardian_readiness: {
        supports_topics: [topic],
        recommended_before_question_ids: ['source_q'],
        readiness_note: 'Use before Guardian attempts.',
      },
      estimated_time_minutes: 3,
      snippet_type: 'concept',
      source_question_ids: ['source_q'],
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
      ...(index === 0 ? snippetOverrides : {}),
    };
    return snippet;
  });
}

function writeValidVerifierOutputs(dir: string, snippetsPath: string, snippetOverrides: Record<string, unknown> = {}) {
  writeFileSync(path.join(dir, 'skill_targets.json'), JSON.stringify({
    schema_name: 'asterion_skill_targets',
    schema_version: 1,
    skill_targets: [
        skillTargetFixture(),
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
    snippets: regionCoverageSnippets(snippetOverrides),
  }, null, 2));
}

function runVerifier(outputDir: string, snippetsPath: string, extraArgs: string[] = []): string {
  const candidatesPath = path.join(outputDir, 'content_lab_candidates.json');
  writeFileSync(candidatesPath, JSON.stringify({
    schema_name: 'asterion.content_lab_candidates',
    schema_version: 1,
    candidates: [],
  }, null, 2));
  return readPython([
    verifyScript,
    '--outputs-dir',
    outputDir,
    '--snippets',
    snippetsPath,
    '--runtime-generated-practice',
    path.join(outputDir, 'runtime_generated_practice_bank.json'),
    '--content-lab-candidates',
    candidatesPath,
    '--skip-question-bank-git-check',
    ...extraArgs,
  ]);
}

function sourceBackedWorkedExample(source: {
  questionId: string;
  questionAsset: string;
  markSchemeAsset: string;
}, overrides: Record<string, unknown> = {}) {
  return {
    id: 'p3-log-check-example-1',
    prompt: 'State the method needed for this example.',
    steps: ['Identify the structure.', 'Choose the method.'],
    answer: 'Use the named method.',
    question_type: 'Reviewed source check',
    key_method: 'Choose the method before calculating.',
    exam_move: 'Name the method before calculating.',
    source_question_ids: [source.questionId],
    source_question_asset_ids: [source.questionAsset],
    source_mark_scheme_asset_ids: [source.markSchemeAsset],
    ...overrides,
  };
}

function routeDecisionsWithStatus(dir: string, sourceQuestionId: string, reviewedStatus: string): string {
  const payload = JSON.parse(readFileSync(routeDecisionsPath, 'utf8'));
  const decision = payload.decisions.find((item: { question_id?: string }) => item.question_id === sourceQuestionId);
  if (!decision) throw new Error(`Missing route decision fixture for ${sourceQuestionId}`);
  decision.reviewed_status = reviewedStatus;
  decision.use_case_permissions = {
    mastery_evidence_allowed: false,
    guardian_evidence_allowed: false,
    teacher_export_mastery_allowed: false,
    content_lab_generation_allowed: false,
    candidate_promotion_allowed: false,
  };
  const outputPath = path.join(dir, `route_decisions_${reviewedStatus}.json`);
  writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  return outputPath;
}

describe.sequential('Content Lab skill target pipeline', () => {
  pipelineIt('classifies auto, review-only, and blocked records without auto-using blocked sources', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-'));
    try {
      const output = runBuild([
        sourceRecord({ question_id: 'auto_log_q' }),
        sourceRecord({ question_id: 'visual_review_q', visual_required: true }),
        sourceRecord({
          question_id: 'blocked_q',
          mark_scheme_text: '',
          notes: {
            validation_status: 'fail',
            mapping_status: 'pass',
            topic_confidence: 'high',
            text_fidelity_status: 'clean',
            review_flags: [],
          },
        }),
      ], dir);

      const skillTargets = JSON.parse(output.skillTargets);
      const reviewQueue = JSON.parse(output.reviewQueue);
      const report = JSON.parse(output.contentLabReport);

      expect(skillTargets.skill_targets).toHaveLength(1);
      expect(skillTargets.skill_targets[0].source_question_ids).toEqual(['auto_log_q', 'visual_review_q']);
      expect(skillTargets.skill_targets[0].assessed_by_source_question_ids).toEqual(['auto_log_q', 'visual_review_q']);
      expect(skillTargets.skill_targets[0].likely_prerequisites).toContain('Index laws.');
      expect(skillTargets.skill_targets[0].common_misconceptions).toContain('Splitting a sum inside a logarithm.');
      expect(skillTargets.skill_targets[0].source_mark_scheme_patterns[0]).toMatchObject({
        pattern_id: 'log_laws_before_solving',
        source_count: 2,
      });
      expect(skillTargets.skill_targets[0].source_question_ids).not.toContain('blocked_q');
      expect(reviewQueue.records.find((record: { question_id: string }) => record.question_id === 'visual_review_q')?.eligibility).toBe('review_only');
      expect(reviewQueue.records.find((record: { question_id: string }) => record.question_id === 'blocked_q')?.eligibility).toBe('blocked');
      expect(report).toMatchObject({
        total_records_read: 3,
        auto_eligible: 1,
        review_only: 1,
        blocked: 1,
      });
      expect(report.skill_targets_created_by_paper_family_topic.p3.logarithms_and_exponentials).toBe(1);
      expect(report.review_queue_counts_by_reason.visual_required).toBe(1);
      expect(report.active_regions.find((region: { region_id: string }) => region.region_id === 'logarithm-grove')).toBeTruthy();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('writes deterministic output for the same input records', () => {
    const firstDir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-a-'));
    const secondDir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-b-'));
    const records = [
      sourceRecord({ question_id: 'q_b' }),
      sourceRecord({ question_id: 'q_a' }),
      sourceRecord({ question_id: 'q_blocked', question_text_trust: 'unusable' }),
    ];

    try {
      const first = runBuild(records, firstDir);
      const second = runBuild(records, secondDir);

      expect(first.skillTargets).toBe(second.skillTargets);
      expect(first.reviewQueue).toBe(second.reviewQueue);
      expect(first.contentLabReport).toBe(second.contentLabReport);
    } finally {
      rmSync(firstDir, { recursive: true, force: true });
      rmSync(secondDir, { recursive: true, force: true });
    }
  });

  pipelineIt('reports source topics that do not create skill targets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-report-'));
    try {
      const output = runBuild([
        sourceRecord({ question_id: 'auto_log_q' }),
        sourceRecord({ question_id: 'unsupported_q', topic: 'unsupported_topic' }),
      ], dir);

      const report = JSON.parse(output.contentLabReport);

      expect(report.topics_with_source_records_but_no_skill_targets).toContainEqual({
        paper_family: 'p3',
        topic: 'unsupported_topic',
        source_record_count: 1,
      });
      expect(report).toHaveProperty('snippets_per_region');
      expect(report).toHaveProperty('quick_checks_per_region');
      expect(report).toHaveProperty('generated_warmups_per_region');
      expect(report).toHaveProperty('snippets_with_examples_by_region');
      expect(report).toHaveProperty('method_snippets_missing_examples');
      expect(report).toHaveProperty('warmups_linked_to_examples');
      expect(report).toHaveProperty('warmups_without_example_model');
      expect(report).toHaveProperty('priority_region_example_coverage');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('accepts valid enriched reviewed teaching snippets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath);

      expect(runVerifier(dir, snippetsPath)).toContain('Content Lab outputs verified.');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('normalizes plural worked examples when verifying reviewed teaching snippets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-plural-examples-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        worked_example: undefined,
        worked_examples: [
          {
            id: 'p3-log-check-example-1',
            prompt: 'State the method needed for this example.',
            steps: ['Identify the structure.', 'Choose the method.'],
            answer: 'Use the named method.',
            question_type: 'Logarithm equation',
            key_method: 'Choose the method before calculating.',
            exam_move: 'Name the method before calculating.',
            source_question_ids: ['31autumn23_q01'],
            source_question_asset_ids: ['p3/31autumn23/questions/q01.png'],
            source_mark_scheme_asset_ids: ['p3/31autumn23/mark_scheme/q01.png'],
          },
        ],
      });

      expect(runVerifier(dir, snippetsPath)).toContain('Content Lab outputs verified.');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects malformed quick-check objects in reviewed teaching snippets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-bad-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        quick_check: {
          id: 'p3-log-check-qc',
          region_id: 'logarithm-grove',
          topic: 'logarithms_and_exponentials',
          skill_target_id: 'p3_log_laws_equations',
          title: 'Check the log form',
          prompt: 'Rewrite $\\log_2 8=3$.',
          answer: '',
          explanation: 'The log value is the exponent.',
          micro_skill: 'Convert log form.',
          difficulty_band: 'easy',
          estimated_time_minutes: 1,
          review_status: 'published',
        },
      });

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects published P3 worked examples outside the priority batch when source assets are missing', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-missing-example-assets-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath);
      const payload = JSON.parse(readFileSync(snippetsPath, 'utf8'));
      const complexSnippet = payload.snippets.find((snippet: { snippet_id: string }) => snippet.snippet_id === 'p3-complex-check');
      complexSnippet.worked_example = {
        id: 'p3-complex-check-example-1',
        prompt: 'State the complex-number form to use.',
        steps: ['Choose the form before calculating.'],
        answer: 'Use modulus-argument form.',
        source_question_ids: ['31autumn23_q01'],
      };
      writeFileSync(snippetsPath, JSON.stringify(payload, null, 2));

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects published P3 worked examples backed by non-clean route decisions', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-thin-example-source-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        worked_example: {
          id: 'p3-log-check-example-1',
          prompt: 'State the method needed for this example.',
          steps: ['Identify the structure.', 'Choose the method.'],
          answer: 'Use the named method.',
          question_type: 'Logarithm equation',
          key_method: 'Choose the method before calculating.',
          exam_move: 'Name the method before calculating.',
          source_question_ids: ['31summer23_q05'],
          source_question_asset_ids: ['p3/31summer23/questions/q05.png'],
          source_mark_scheme_asset_ids: ['p3/31summer23/mark_scheme/q05.png'],
        },
      });

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects published P3 worked examples backed by ambiguous, blocked, deferred, review-needed, or fallback-only route decisions', () => {
    const unsafeSources = [
      {
        questionId: '31autumn23_q09',
        questionAsset: 'p3/31autumn23/questions/q09.png',
        markSchemeAsset: 'p3/31autumn23/mark_scheme/q09.png',
      },
      {
        questionId: '31summer23_q02',
        questionAsset: 'p3/31summer23/questions/q02.png',
        markSchemeAsset: 'p3/31summer23/mark_scheme/q02.png',
      },
      {
        questionId: '33autumn24_q07',
        questionAsset: 'p3/33autumn24/questions/q07.png',
        markSchemeAsset: 'p3/33autumn24/mark_scheme/q07.png',
      },
      {
        questionId: '32autumn22_q03',
        questionAsset: 'p3/32autumn22/questions/q03.png',
        markSchemeAsset: 'p3/32autumn22/mark_scheme/q03.png',
      },
      {
        questionId: '31summer23_q05',
        questionAsset: 'p3/31summer23/questions/q05.png',
        markSchemeAsset: 'p3/31summer23/mark_scheme/q05.png',
        routeStatusOverride: 'fallback_only',
      },
    ];

    for (const source of unsafeSources) {
      const dir = mkdtempSync(path.join(tmpdir(), `asterion-content-lab-verify-${source.questionId}-`));
      const snippetsPath = path.join(dir, 'snippets.json');
      try {
        writeValidVerifierOutputs(dir, snippetsPath, {
          worked_example: sourceBackedWorkedExample(source),
        });
        const extraArgs = source.routeStatusOverride
          ? ['--route-decisions', routeDecisionsWithStatus(dir, source.questionId, source.routeStatusOverride)]
          : [];

        expect(() => runVerifier(dir, snippetsPath, extraArgs)).toThrow();
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  pipelineIt('rejects published P3 worked examples that omit canonical mark-scheme source assets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-missing-mark-scheme-source-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        worked_example: sourceBackedWorkedExample({
          questionId: '31autumn23_q01',
          questionAsset: 'p3/31autumn23/questions/q01.png',
          markSchemeAsset: 'p3/31autumn23/mark_scheme/q01.png',
        }, {
          source_mark_scheme_asset_ids: [],
        }),
      });

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects published P3 worked examples whose source is missing reviewed route evidence', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-missing-route-review-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        worked_example: sourceBackedWorkedExample({
          questionId: '32spring21_q01',
          questionAsset: 'p3/32spring21/questions/q01.png',
          markSchemeAsset: 'p3/32spring21/mark_scheme/q01.png',
        }),
      });

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('validates route-decision asset paths against the canonical question bank', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-route-decision-assets-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    const routeDecisionsPath = path.join(dir, 'route_decisions.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath);
      writeFileSync(routeDecisionsPath, JSON.stringify({
        schema_name: 'asterion_p3_route_evidence_decisions',
        schema_version: 1,
        decisions: [
          {
            question_id: '31autumn23_q01',
            reviewed_status: 'clean',
            evidence_basis: {
              question_asset_path: 'p3/31autumn23/questions/q99.png',
              mark_scheme_asset_path: 'p3/31autumn23/mark_scheme/q01.png',
            },
            use_case_permissions: {
              mastery_evidence_allowed: true,
              guardian_evidence_allowed: true,
              teacher_export_mastery_allowed: true,
              content_lab_generation_allowed: true,
              candidate_promotion_allowed: false,
            },
          },
        ],
      }, null, 2));

      expect(() => runVerifier(dir, snippetsPath, ['--route-decisions', routeDecisionsPath])).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects malformed worked examples in reviewed teaching snippets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-bad-example-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        worked_example: {
          id: 'p3-log-check-example-1',
          prompt: 'Simplify $\\ln x+\\ln2$.',
          steps: [],
          answer: '$\\ln(2x)$',
        },
      });

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects first-batch worked examples missing publishing metadata', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-missing-example-metadata-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        worked_example: {
          id: 'p3-log-check-example-1',
          prompt: 'Simplify $\\ln x+\\ln2$.',
          steps: ['Use the product law.'],
          answer: '$\\ln(2x)$',
          question_type: 'Logarithm laws',
          key_method: 'Use the product law.',
          source_question_ids: ['31autumn23_q01'],
          source_question_asset_ids: ['p3/31autumn23/questions/q01.png'],
          source_mark_scheme_asset_ids: ['p3/31autumn23/mark_scheme/q01.png'],
        },
      });

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects malformed MathText delimiters in reviewed teaching snippets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-bad-math-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        worked_example: {
          id: 'p3-log-check-example-1',
          prompt: 'Simplify $\\ln x+\\ln2.',
          steps: ['Use the product law.'],
          answer: '$\\ln(2x)$',
          question_type: 'Logarithm laws',
          key_method: 'Use the product law.',
          exam_move: 'Combine logs before solving.',
          source_question_ids: ['31autumn23_q01'],
          source_question_asset_ids: ['p3/31autumn23/questions/q01.png'],
          source_mark_scheme_asset_ids: ['p3/31autumn23/mark_scheme/q01.png'],
        },
      });

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects reviewed quick checks that are missing runtime metadata', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-bad-quick-check-metadata-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        quick_check: {
          id: 'p3-log-check-qc',
          region_id: 'logarithm-grove',
          topic: 'logarithms_and_exponentials',
          title: 'Check the log form',
          prompt: 'Rewrite $\\log_2 8=3$.',
          answer: '$2^3=8$',
          explanation: 'The log value is the exponent.',
          micro_skill: 'Convert log form.',
          difficulty_band: 'easy',
          estimated_time_minutes: 1,
          review_status: 'published',
        },
      });

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  pipelineIt('rejects reviewed snippet files that leave an active P3 region uncovered', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-missing-region-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath);
      const payload = JSON.parse(readFileSync(snippetsPath, 'utf8'));
      payload.snippets = payload.snippets.filter((snippet: { region_ids?: string[] }) => !snippet.region_ids?.includes('numerical-mines'));
      writeFileSync(snippetsPath, JSON.stringify(payload, null, 2));

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
