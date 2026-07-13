import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { P1_COURSE_STUDY_CONTRACT } from '../src/data/p1CourseContract';
import p1PromotionOverlay from '../src/data/p1ExamTrainingPromotionOverlay.json';
import {
  P1_EXAM_BANK_REVIEW_PROJECTION,
  type P1ExamBankReviewProjection,
} from '../src/data/p1ExamBankReviewProjection';
import { applyCourseTopicPacketOverlay } from '../src/lib/courseTopicPacketOverlay';

type UnknownRecord = Record<string, unknown>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as UnknownRecord;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function contractBinding() {
  const topics = P1_COURSE_STUDY_CONTRACT.topics.map((topic) => ({ id: topic.id, slug: topic.slug }));
  const skills = P1_COURSE_STUDY_CONTRACT.skills.map((skill) => ({
    id: skill.id,
    topic_id: skill.topicId,
    readiness: skill.readiness,
    review_status: skill.reviewStatus,
  }));
  return {
    schema_name: P1_COURSE_STUDY_CONTRACT.schemaName,
    schema_version: P1_COURSE_STUDY_CONTRACT.schemaVersion,
    course_id: 'p1',
    syllabus_version: P1_COURSE_STUDY_CONTRACT.syllabus.version,
    topic_skill_sha256: sha256({ topics, skills }),
  };
}

function promotedProjection(): P1ExamBankReviewProjection {
  const projection = clone(P1_EXAM_BANK_REVIEW_PROJECTION);
  const sourceRecord = projection.records[0];
  sourceRecord.review = {
    disposition: 'promote',
    review_status: 'reviewed',
    student_runtime_safe: true,
    reviewed_topic_id: '9709_p1_topic_quadratics',
    reviewed_skill_ids: ['p1_quad_complete_square'],
    reviewer: 'fixture-reviewer',
    reviewed_at: '2026-07-13T01:00:00.000Z',
    notes: 'Fixture review.',
    visual_audit: {
      status: 'passed',
      auditor: 'fixture-auditor',
      audited_at: '2026-07-13T00:00:00.000Z',
      source_projection_version: projection.projection_version,
      source_manifest_sha256: sourceRecord.source.manifest_sha256,
      source_manifest_projection_fingerprint: sourceRecord.source.manifest_projection_fingerprint,
      question_assets: sourceRecord.source.question_assets,
      mark_scheme_assets: sourceRecord.source.mark_scheme_assets,
    },
  } as typeof sourceRecord.review;
  projection.records = [sourceRecord];
  return projection;
}

function reviewedQuestion(projection: P1ExamBankReviewProjection) {
  const sourceRecord = projection.records[0];
  const provenance = {
    source: 'course-topic-packet-review',
    source_projection_version: projection.projection_version,
    source_repo_head: sourceRecord.source.source_repo_head,
    source_manifest_sha256: sourceRecord.source.manifest_sha256,
    source_manifest_projection_fingerprint: sourceRecord.source.manifest_projection_fingerprint,
    source_question_id: sourceRecord.identity.question_id,
    source_packet_topic_id: sourceRecord.source.topic_id,
    source_question_assets: sourceRecord.source.question_assets,
    source_mark_scheme_assets: sourceRecord.source.mark_scheme_assets,
    reviewed_topic_id: sourceRecord.review.reviewed_topic_id,
    reviewed_skill_ids: sourceRecord.review.reviewed_skill_ids,
    reviewer: sourceRecord.review.reviewer,
    reviewed_at: sourceRecord.review.reviewed_at,
    visual_audit: (sourceRecord.review as UnknownRecord).visual_audit,
    course_contract: contractBinding(),
    promotion_basis: 'explicit-asterion-human-review',
  };
  return {
    question_id: sourceRecord.identity.question_id,
    course_id: 'p1',
    paper_family: 'p1',
    topic_id: '9709_p1_topic_quadratics',
    review_status: 'reviewed',
    student_runtime_safe: true,
    canonical_question_artifact: 'p1/13winter13/questions/q01.png',
    canonical_mark_scheme_artifact: 'p1/13winter13/mark_scheme/q01.png',
    asterion_import: provenance,
  };
}

function reviewedRoute(question: ReturnType<typeof reviewedQuestion>) {
  return {
    primary_topic_id: '9709_p1_topic_quadratics',
    mapped_region_id: 'quadratics',
    reviewed_skill_ids: ['p1_quad_complete_square'],
    route_approved: true,
    review_required: false,
    asterion_import: question.asterion_import,
  };
}

function overlay(projection: P1ExamBankReviewProjection, overrides: UnknownRecord = {}) {
  const content = {
    schema_name: 'asterion.course_topic_packet_promotion_overlay',
    schema_version: 1,
    course_id: 'p1',
    paper_family: 'p1',
    source_projection_version: projection.projection_version,
    source_projection_schema_version: projection.schema_version,
    source_repo_head: projection.source.repo_head,
    course_contract: contractBinding(),
    promoted_question_ids: [],
    questions: [],
    routing_records: {},
    asset_imports: [],
    runtime_assets: [],
    ...overrides,
  };
  return { ...content, integrity_sha256: sha256(content) };
}

function promotedOverlay(projection: P1ExamBankReviewProjection, overrides: UnknownRecord = {}) {
  const question = reviewedQuestion(projection);
  const sourceRecord = projection.records[0];
  return overlay(projection, {
    promoted_question_ids: [question.question_id],
    questions: [question],
    routing_records: { [question.question_id]: reviewedRoute(question) },
    runtime_assets: [{
      question_id: question.question_id,
      question: { target: question.canonical_question_artifact, sha256: sourceRecord.source.question_assets[0].sha256 },
      mark_scheme: { target: question.canonical_mark_scheme_artifact, sha256: sourceRecord.source.mark_scheme_assets[0].sha256 },
    }],
    ...overrides,
  });
}

describe('course topic-packet promotion overlay', () => {
  it('keeps the checked-in empty overlay sealed to the current projection and course contract', () => {
    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      p1PromotionOverlay,
    )).not.toThrow();
  });

  it('accepts a correctly bound empty launch-gated overlay without changing the bank', () => {
    const projection = clone(P1_EXAM_BANK_REVIEW_PROJECTION);
    const result = applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      overlay(projection),
      { projection },
    );
    expect(result.questionBank.questions).toEqual([]);
    expect(result.topicRouting.records).toEqual({});
  });

  it('promotes only questions with exact reviewed route, contract, audit, and asset evidence', () => {
    const projection = promotedProjection();
    const question = reviewedQuestion(projection);
    const result = applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      promotedOverlay(projection),
      { projection },
    );
    expect(result.questionBank.questions).toEqual([question]);
    expect(result.topicRouting.records?.[question.question_id]).toMatchObject({ route_approved: true });
  });

  it('fails closed on stale projection, unknown or cross-topic skills, and wrong asset hashes', () => {
    const projection = promotedProjection();
    const question = reviewedQuestion(projection);

    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      overlay(projection, { source_projection_version: 'stale-v0' }),
      { projection },
    )).toThrow(/projection version|stale/i);

    const unknownSkillProjection = clone(projection);
    unknownSkillProjection.records[0].review.reviewed_skill_ids = ['invented_skill'];
    const unknownQuestion = reviewedQuestion(unknownSkillProjection);
    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      promotedOverlay(unknownSkillProjection, {
        questions: [unknownQuestion],
        routing_records: { [unknownQuestion.question_id]: reviewedRoute(unknownQuestion) },
      }),
      { projection: unknownSkillProjection },
    )).toThrow(/unknown P1 course-contract skill/i);

    const wrongAssets = promotedOverlay(projection);
    const assetRecord = (wrongAssets.runtime_assets as UnknownRecord[])[0];
    assetRecord.question = { ...(assetRecord.question as UnknownRecord), sha256: '0'.repeat(64) };
    delete wrongAssets.integrity_sha256;
    wrongAssets.integrity_sha256 = sha256(wrongAssets);
    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      wrongAssets,
      { projection },
    )).toThrow(/runtime assets/i);

    const crossTopicProjection = clone(projection);
    crossTopicProjection.records[0].review.reviewed_skill_ids = ['p1_func_composition'];
    const crossTopicQuestion = reviewedQuestion(crossTopicProjection);
    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      promotedOverlay(crossTopicProjection, {
        questions: [crossTopicQuestion],
        routing_records: { [crossTopicQuestion.question_id]: reviewedRoute(crossTopicQuestion) },
      }),
      { projection: crossTopicProjection },
    )).toThrow(/different P1 topic/i);
  });

  it('rejects missing or stale visual audits and hand-edited overlays', () => {
    const projection = promotedProjection();
    const missingAuditProjection = clone(projection);
    (missingAuditProjection.records[0].review as UnknownRecord).visual_audit = null;
    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      promotedOverlay(missingAuditProjection),
      { projection: missingAuditProjection },
    )).toThrow(/visual audit/i);

    const staleAuditProjection = clone(projection);
    const audit = (staleAuditProjection.records[0].review as UnknownRecord).visual_audit as UnknownRecord;
    audit.source_manifest_sha256 = '0'.repeat(64);
    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      promotedOverlay(staleAuditProjection),
      { projection: staleAuditProjection },
    )).toThrow(/visual audit/i);

    const handEdited = promotedOverlay(projection);
    const questionId = projection.records[0].identity.question_id;
    (handEdited.routing_records as Record<string, UnknownRecord>)[questionId].mapped_region_id = 'functions';
    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      handEdited,
      { projection },
    )).toThrow(/integrity drift/i);
  });

  it('fails closed on unsafe records, mismatched routes, and ID collisions', () => {
    const projection = promotedProjection();
    const question = reviewedQuestion(projection);
    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      promotedOverlay(projection, { questions: [{ ...question, review_status: 'needs_review' }] }),
      { projection },
    )).toThrow(/not explicitly reviewed/i);

    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      promotedOverlay(projection, { routing_records: {} }),
      { projection },
    )).toThrow(/routing must match/i);

    expect(() => applyCourseTopicPacketOverlay(
      { questions: [{ question_id: 'duplicate' }, { question_id: 'duplicate' }] },
      { records: {} },
      overlay(projection),
      { projection },
    )).toThrow(/collision/i);
  });
});
