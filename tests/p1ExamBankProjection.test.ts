import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { P1_COURSE_STUDY_CONTRACT } from '../src/data/p1CourseContract';
import {
  P1_EXAM_BANK_REVIEW_PROJECTION,
  isP1ExamBankPromotionReady,
  type P1ExamBankReviewRecord,
} from '../src/data/p1ExamBankReviewProjection';
// @ts-expect-error The CLI is intentionally plain ESM so Node can run it without a build step.
import {
  buildCourseTopicPacketSnapshot,
  buildPromotionOverlay,
  verifyProjectionSources,
} from '../scripts/course-topic-packet-review.mjs';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function temporaryDirectory(): string {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'asterion-p1-projection-'));
  temporaryDirectories.push(directory);
  return directory;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function reviewCandidate(overrides: Partial<P1ExamBankReviewRecord['review']> = {}): P1ExamBankReviewRecord {
  const record = clone(P1_EXAM_BANK_REVIEW_PROJECTION.records[0]);
  const skillId = P1_COURSE_STUDY_CONTRACT.skills.find((skill) => skill.topicId === 'p1-quadratics')?.id;
  if (!skillId) throw new Error('Missing fixture Quadratics skill.');
  record.review = {
    disposition: 'promote',
    review_status: 'reviewed',
    student_runtime_safe: true,
    reviewed_topic_id: '9709_p1_topic_quadratics',
    reviewed_skill_ids: [skillId],
    reviewer: 'fixture-reviewer',
    reviewed_at: '2026-07-13T00:00:00.000Z',
    notes: 'Fixture review.',
    visual_audit: {
      status: 'passed',
      auditor: 'fixture-auditor',
      audited_at: '2026-07-13T00:00:00.000Z',
      source_projection_version: P1_EXAM_BANK_REVIEW_PROJECTION.projection_version,
      source_manifest_sha256: record.source.manifest_sha256,
      source_manifest_projection_fingerprint: record.source.manifest_projection_fingerprint,
      question_assets: record.source.question_assets,
      mark_scheme_assets: record.source.mark_scheme_assets,
    },
    ...overrides,
  } as P1ExamBankReviewRecord['review'];
  return record;
}

function promotionFixture() {
  const assetRoot = temporaryDirectory();
  const record = reviewCandidate();
  const questionContent = 'question';
  const markSchemeContent = 'mark scheme';
  record.source.question_assets[0].sha256 = createHash('sha256').update(questionContent).digest('hex');
  record.source.mark_scheme_assets[0].sha256 = createHash('sha256').update(markSchemeContent).digest('hex');
  (record.review as unknown as Record<string, unknown>).visual_audit = {
    ...(record.review as unknown as Record<string, Record<string, unknown>>).visual_audit,
    question_assets: record.source.question_assets,
    mark_scheme_assets: record.source.mark_scheme_assets,
  };
  const questionArtifact = `p1/${record.identity.paper}/questions/q01.png`;
  const markSchemeArtifact = `p1/${record.identity.paper}/mark_scheme/q01.png`;
  mkdirSync(path.join(assetRoot, 'p1', record.identity.paper, 'questions'), { recursive: true });
  mkdirSync(path.join(assetRoot, 'p1', record.identity.paper, 'mark_scheme'), { recursive: true });
  writeFileSync(path.join(assetRoot, questionArtifact), questionContent);
  writeFileSync(path.join(assetRoot, markSchemeArtifact), markSchemeContent);
  const projection = {
    ...P1_EXAM_BANK_REVIEW_PROJECTION,
    records: [record],
  };
  const catalog = {
    questions: [{
      question_id: record.identity.question_id,
      course_id: 'p1',
      paper_family: 'p1',
      review_status: 'needs_review',
      student_runtime_safe: false,
      canonical_question_artifact: questionArtifact,
      canonical_mark_scheme_artifact: markSchemeArtifact,
    }],
  };
  return { assetRoot, catalog, projection, record };
}

function createSourceRepoFixture(): string {
  const sourceRepo = temporaryDirectory();
  const topicRoot = path.join(sourceRepo, 'output/topic_packets/p1/quadratics');
  const assetRoot = path.join(sourceRepo, 'output/pm1');
  const taxonomyRoot = path.join(sourceRepo, 'exam_bank_taxonomy');
  mkdirSync(topicRoot, { recursive: true });
  mkdirSync(assetRoot, { recursive: true });
  mkdirSync(taxonomyRoot, { recursive: true });
  writeFileSync(path.join(assetRoot, 'question.png'), 'question image fixture');
  writeFileSync(path.join(assetRoot, 'mark-scheme.png'), 'mark scheme fixture');
  writeFileSync(path.join(taxonomyRoot, 'caie_9709_syllabus_topics.v1.json'), JSON.stringify({
    components: [{
      paper_family: 'p1',
      topics: [{
        official_section_code: '1.1',
        topic_id: 'quadratics',
        topic_label: 'Quadratics',
        canonical_topic_id: '9709_p1_topic_quadratics',
      }],
    }],
  }));
  writeFileSync(path.join(topicRoot, 'manifest.json'), JSON.stringify({
    schema_name: 'exam_bank.topic_packets',
    schema_version: 1,
    generated_at: '2026-07-13T00:00:00.000Z',
    projection_fingerprint: 'fixture-fingerprint',
    paper_family: 'p1',
    topic_id: 'quadratics',
    topic_label: 'Quadratics',
    question_count: 1,
    approved_count: 1,
    review_required_count: 0,
    missing_answer_count: 0,
    included_records: [{
      question_id: '11summer25_q01',
      paper: '11summer25',
      question_number: '1',
      section: 'approved',
      source_label: 'Fixture question',
      source_paper_code: '11',
      answer_available: true,
      question_image_paths: ['pm1/question.png'],
      mark_scheme_image_paths: ['pm1/mark-scheme.png'],
      review_reasons: [],
      warnings: [],
    }],
  }));
  execFileSync('git', ['init', '-q'], { cwd: sourceRepo });
  execFileSync('git', ['add', '.'], { cwd: sourceRepo });
  execFileSync('git', ['-c', 'user.name=Asterion Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'], { cwd: sourceRepo });
  return sourceRepo;
}

describe('P1 exam-bank review projection', () => {
  it('pins the complete eight-topic source inventory without claiming Asterion review', () => {
    const projection = P1_EXAM_BANK_REVIEW_PROJECTION;
    expect(projection.schema_name).toBe('asterion.course_topic_packet_review_projection');
    expect(projection.projection_version).toBe('p1-topic-packets-2026-07-13-v1');
    expect(projection.source.repo_head).toBe('1feccb180fcbb9f16b3e705682e5cc3636e41506');
    expect(projection.topics.map((topic) => topic.topic_id)).toEqual([
      'quadratics',
      'functions',
      'coordinate_geometry',
      'circular_measure',
      'trigonometry',
      'series',
      'differentiation',
      'integration',
    ]);
    expect(projection.totals).toEqual({
      records: 1034,
      source_packet_approved: 410,
      source_packet_review_required: 624,
      asterion_reviewed: 0,
      student_runtime_safe: 0,
      promotion_ready: 0,
    });
    expect(projection.records).toHaveLength(1034);
    expect(projection.records.every((record) => (
      record.review.disposition === 'hold'
      && record.review.review_status === 'pending'
      && record.review.student_runtime_safe === false
    ))).toBe(true);
  });

  it('records immutable manifest and normalized identity provenance for every source record', () => {
    const projection = P1_EXAM_BANK_REVIEW_PROJECTION;
    const ids = projection.records.map((record) => record.identity.question_id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const topic of projection.topics) {
      expect(topic.manifest.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(topic.manifest.projection_fingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(topic.counts.total).toBe(topic.counts.source_packet_approved + topic.counts.source_packet_review_required);
    }
    for (const record of projection.records) {
      expect(record.identity).toMatchObject({ course_id: 'p1', paper_family: 'p1' });
      expect(record.source.source_repo_head).toBe(projection.source.repo_head);
      expect(record.source.manifest_sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(record.source.question_image_paths.length).toBeGreaterThan(0);
      expect(record.source.mark_scheme_image_paths.length).toBeGreaterThan(0);
      expect(record.source.question_assets.every((asset) => asset.sha256.match(/^[a-f0-9]{64}$/))).toBe(true);
      expect(record.source.mark_scheme_assets.every((asset) => asset.sha256.match(/^[a-f0-9]{64}$/))).toBe(true);
    }
  });

  it('requires all three explicit Asterion promotion decisions', () => {
    expect(isP1ExamBankPromotionReady(reviewCandidate())).toBe(true);
    expect(isP1ExamBankPromotionReady(reviewCandidate({ disposition: 'hold' }))).toBe(false);
    expect(isP1ExamBankPromotionReady(reviewCandidate({ review_status: 'pending' }))).toBe(false);
    expect(isP1ExamBankPromotionReady(reviewCandidate({ student_runtime_safe: false }))).toBe(false);
  });

  it('promotes only explicitly reviewed, runtime-safe records and preserves pinned provenance', () => {
    const { assetRoot, catalog, projection, record } = promotionFixture();
    const overlay = buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT });
    expect(overlay.promoted_question_ids).toEqual([record.identity.question_id]);
    expect(overlay.questions[0]).toMatchObject({
      question_id: record.identity.question_id,
      review_status: 'reviewed',
      student_runtime_safe: true,
      topic_id: record.review.reviewed_topic_id,
      asterion_import: {
        source: 'course-topic-packet-review',
        source_repo_head: record.source.source_repo_head,
        source_manifest_sha256: record.source.manifest_sha256,
        promotion_basis: 'explicit-asterion-human-review',
      },
    });
    expect(overlay.routing_records[record.identity.question_id]).toMatchObject({
      route_approved: true,
      review_required: false,
      reviewed_skill_ids: record.review.reviewed_skill_ids,
    });

    projection.records[0].review.disposition = 'hold';
    expect(buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT }).questions).toEqual([]);
  });

  it('rejects ID collisions and missing canonical assets before promotion', () => {
    const { assetRoot, catalog, projection } = promotionFixture();
    const duplicateProjection = { ...projection, records: [projection.records[0], clone(projection.records[0])] };
    expect(() => buildPromotionOverlay({ projection: duplicateProjection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT })).toThrow(/collision/i);

    projection.records[0].review.reviewer = null;
    expect(() => buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT })).toThrow(/reviewer/i);
    projection.records[0].review.reviewer = 'fixture-reviewer';
    catalog.questions[0].canonical_mark_scheme_artifact = 'p1/paper/mark_scheme/missing.png';
    expect(() => buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT })).toThrow(/canonical runtime asset paths/i);
  });

  it('fails promotion on unknown or cross-topic skills and missing or stale visual audits', () => {
    const { assetRoot, catalog, projection, record } = promotionFixture();
    record.review.reviewed_skill_ids = ['invented_skill'];
    expect(() => buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT })).toThrow(/unknown P1 course-contract skill/i);

    const functionsSkill = P1_COURSE_STUDY_CONTRACT.skills.find((skill) => skill.topicId === 'p1-functions');
    if (!functionsSkill) throw new Error('Missing fixture Functions skill.');
    record.review.reviewed_skill_ids = [functionsSkill.id];
    expect(() => buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT })).toThrow(/belongs to p1-functions/i);

    record.review.reviewed_skill_ids = [P1_COURSE_STUDY_CONTRACT.skills.find((skill) => skill.topicId === 'p1-quadratics')!.id];
    (record.review as unknown as Record<string, unknown>).visual_audit = null;
    expect(() => buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT })).toThrow(/visual audit/i);

    (record.review as unknown as Record<string, unknown>).visual_audit = {
      status: 'passed',
      auditor: 'fixture-auditor',
      audited_at: '2026-07-13T00:00:00.000Z',
      source_projection_version: 'stale-projection-v0',
      source_manifest_sha256: record.source.manifest_sha256,
      source_manifest_projection_fingerprint: record.source.manifest_projection_fingerprint,
      question_assets: record.source.question_assets,
      mark_scheme_assets: record.source.mark_scheme_assets,
    };
    expect(() => buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT })).toThrow(/visual audit is stale/i);
  });

  it('binds canonical runtime files to reviewed SHA-256 values, including pre-existing targets', () => {
    const { assetRoot, catalog, projection, record } = promotionFixture();
    const overlay = buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT });
    expect(overlay.runtime_assets[0]).toMatchObject({
      question_id: record.identity.question_id,
      question: { sha256: record.source.question_assets[0].sha256 },
      mark_scheme: { sha256: record.source.mark_scheme_assets[0].sha256 },
    });
    expect(overlay.integrity_sha256).toMatch(/^[a-f0-9]{64}$/);

    writeFileSync(path.join(assetRoot, catalog.questions[0].canonical_question_artifact), 'wrong-but-existing question crop');
    expect(() => buildPromotionOverlay({ projection, catalog, assetRoot, courseContract: P1_COURSE_STUDY_CONTRACT })).toThrow(/existing runtime question asset SHA-256/i);
  });

  it('rejects source HEAD and manifest drift against a versioned snapshot', async () => {
    const sourceRepo = createSourceRepoFixture();
    const projection = await buildCourseTopicPacketSnapshot({ courseId: 'p1', sourceRepo });
    await expect(verifyProjectionSources({ projection, sourceRepo })).resolves.toBe(true);

    const manifestPath = path.join(sourceRepo, 'output/topic_packets/p1/quadratics/manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.projection_fingerprint = 'drifted-fingerprint';
    writeFileSync(manifestPath, JSON.stringify(manifest));
    await expect(verifyProjectionSources({ projection, sourceRepo })).rejects.toThrow(/SHA-256 drift/i);

    const fingerprintDriftProjection = clone(projection);
    const driftedSha = createHash('sha256').update(readFileSync(manifestPath)).digest('hex');
    fingerprintDriftProjection.topics[0].manifest.sha256 = driftedSha;
    fingerprintDriftProjection.records[0].source.manifest_sha256 = driftedSha;
    await expect(verifyProjectionSources({ projection: fingerprintDriftProjection, sourceRepo })).rejects.toThrow(/fingerprint drift/i);

    execFileSync('git', ['add', '.'], { cwd: sourceRepo });
    execFileSync('git', ['-c', 'user.name=Asterion Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'drift'], { cwd: sourceRepo });
    await expect(verifyProjectionSources({ projection, sourceRepo })).rejects.toThrow(/HEAD drift/i);
  });
});
