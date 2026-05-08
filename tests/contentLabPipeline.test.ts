import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const buildScript = path.join(repoRoot, 'tools/content_lab/scripts/build_skill_targets.py');
const verifyScript = path.join(repoRoot, 'tools/content_lab/scripts/verify_content_lab_outputs.py');

function sourceRecord(overrides: Record<string, unknown> = {}) {
  return {
    question_id: 'auto_q',
    paper_family: 'p3',
    topic: 'logarithms_and_exponentials',
    question_text_trust: 'high',
    mark_scheme_text: 'M1 for method. A1 for answer.',
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
  execFileSync('python3', [buildScript, '--input', inputPath, '--output-dir', outputDir], { cwd: repoRoot });
  return {
    skillTargets: readFileSync(path.join(outputDir, 'skill_targets.json'), 'utf8'),
    reviewQueue: readFileSync(path.join(outputDir, 'review_queue.json'), 'utf8'),
    contentLabReport: readFileSync(path.join(outputDir, 'content_lab_report.json'), 'utf8'),
  };
}

function writeValidVerifierOutputs(dir: string, snippetsPath: string, snippetOverrides: Record<string, unknown> = {}) {
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
        micro_skills: ['Convert forms.'],
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
    snippets: [
      {
        snippet_id: 'p3-log-check',
        paper_family: 'p3',
        topics: ['logarithms_and_exponentials'],
        region_ids: ['logarithm-grove'],
        title: 'Check the log form',
        student_goal: 'Rewrite between forms before solving.',
        body: 'A logarithm tells you which exponent is needed.',
        steps: ['Identify the base.', 'Rewrite as an exponent statement.'],
        exam_move: 'Convert form when the unknown is inside the logarithm.',
        common_trap: 'Changing the base while converting.',
        review_status: 'published',
        source: 'teacher_authored',
        prerequisites: ['Know index notation.'],
        micro_steps: ['Circle the base.', 'Name the exponent.'],
        common_mistakes: ['Calling the argument the exponent.'],
        quick_check: {
          prompt: 'Rewrite $\\log_2 8=3$.',
          answer: '$2^3=8$',
          explanation: 'The log value is the exponent.',
        },
        guardian_readiness: {
          supports_topics: ['logarithms_and_exponentials'],
          recommended_before_question_ids: ['source_q'],
          readiness_note: 'Use before logarithm Guardian attempts.',
        },
        estimated_time_minutes: 3,
        snippet_type: 'concept',
        source_question_ids: ['source_q'],
        source_skill_target_ids: ['p3_logarithms_and_exponentials'],
        ...snippetOverrides,
      },
    ],
  }, null, 2));
}

function runVerifier(outputDir: string, snippetsPath: string): string {
  return execFileSync('python3', [verifyScript, '--outputs-dir', outputDir, '--snippets', snippetsPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

describe('Content Lab skill target pipeline', () => {
  it('classifies auto, review-only, and blocked records without auto-using blocked sources', () => {
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
      expect(skillTargets.skill_targets[0].source_question_ids).toEqual(['auto_log_q']);
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
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes deterministic output for the same input records', () => {
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

  it('reports source topics that do not create skill targets', () => {
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
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('accepts valid enriched reviewed teaching snippets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath);

      expect(runVerifier(dir, snippetsPath)).toContain('Content Lab outputs verified.');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects malformed quick-check objects in reviewed teaching snippets', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'asterion-content-lab-verify-bad-'));
    const snippetsPath = path.join(dir, 'snippets.json');
    try {
      writeValidVerifierOutputs(dir, snippetsPath, {
        quick_check: {
          prompt: 'Rewrite $\\log_2 8=3$.',
          answer: '',
          explanation: 'The log value is the exponent.',
        },
      });

      expect(() => runVerifier(dir, snippetsPath)).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
