import { createHash } from 'node:crypto';
import { P1_COURSE_STUDY_CONTRACT } from '../data/p1CourseContract';
import { P1_EXAM_BANK_REVIEW_PROJECTION } from '../data/p1ExamBankReviewProjection';
import type { CourseStudyContract } from '../data/courseStudyContract';
import type { P1ExamBankReviewProjection } from '../data/p1ExamBankReviewProjection';

type UnknownRecord = Record<string, unknown>;

interface RuntimeQuestionBank extends UnknownRecord {
  questions?: UnknownRecord[];
  components?: UnknownRecord[];
  courses?: UnknownRecord[];
}

interface TopicRoutingSidecar extends UnknownRecord {
  records?: Record<string, UnknownRecord>;
}

export interface CourseTopicPacketOverlay extends UnknownRecord {
  schema_name?: string;
  schema_version?: number;
  course_id?: string;
  paper_family?: string;
  source_projection_version?: string;
  source_projection_schema_version?: number;
  source_repo_head?: string;
  course_contract?: UnknownRecord;
  promoted_question_ids?: string[];
  questions?: UnknownRecord[];
  routing_records?: Record<string, UnknownRecord>;
  runtime_assets?: UnknownRecord[];
  integrity_sha256?: string;
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : undefined;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as UnknownRecord;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256Value(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function exactMatch(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function expectedContractBinding(contract: CourseStudyContract): UnknownRecord {
  const topics = contract.topics.map((topic) => ({ id: topic.id, slug: topic.slug }));
  const skills = contract.skills.map((skill) => ({
    id: skill.id,
    topic_id: skill.topicId,
    readiness: skill.readiness,
    review_status: skill.reviewStatus,
  }));
  return {
    schema_name: contract.schemaName,
    schema_version: contract.schemaVersion,
    course_id: contract.courseId,
    syllabus_version: contract.syllabus.version,
    topic_skill_sha256: sha256Value({ topics, skills }),
  };
}

function assertOverlayIntegrity(overlay: CourseTopicPacketOverlay): void {
  const integrity = stringValue(overlay.integrity_sha256);
  if (!integrity || !/^[a-f0-9]{64}$/.test(integrity)) {
    throw new Error('Course topic-packet overlay is missing its integrity SHA-256.');
  }
  const content = clone(overlay);
  delete content.integrity_sha256;
  if (sha256Value(content) !== integrity) {
    throw new Error('Course topic-packet overlay integrity drift; regenerate it from the pinned review projection.');
  }
}

function contractPlacement(
  topicId: string,
  skillIds: unknown,
  projection: P1ExamBankReviewProjection,
  contract: CourseStudyContract,
  questionId: string,
): { regionId: string; topicContractId: string; skillIds: string[] } {
  const projectedTopic = projection.topics.find((topic) => topic.canonical_topic_id === topicId);
  if (!projectedTopic) throw new Error(`${questionId} has an unknown reviewed P1 topic ${topicId}.`);
  const regionId = projectedTopic.topic_id.replace(/_/g, '-');
  const contractTopic = contract.topics.find((topic) => topic.slug === regionId);
  if (!contractTopic) throw new Error(`${questionId} reviewed topic is absent from the P1 course contract.`);
  if (!Array.isArray(skillIds) || skillIds.length === 0 || skillIds.some((skillId) => !stringValue(skillId))) {
    throw new Error(`${questionId} lacks reviewed atomic-skill evidence.`);
  }
  const normalizedSkillIds = skillIds as string[];
  if (new Set(normalizedSkillIds).size !== normalizedSkillIds.length) {
    throw new Error(`${questionId} has duplicate reviewed atomic-skill evidence.`);
  }
  for (const skillId of normalizedSkillIds) {
    const skill = contract.skills.find((candidate) => candidate.id === skillId);
    if (!skill) throw new Error(`${questionId} has unknown P1 course-contract skill ${skillId}.`);
    if (skill.topicId !== contractTopic.id) {
      throw new Error(`${questionId} reviewed skill ${skillId} belongs to a different P1 topic.`);
    }
    if (skill.readiness !== 'ready' || skill.reviewStatus !== 'reviewed') {
      throw new Error(`${questionId} reviewed skill ${skillId} is not ready and reviewed.`);
    }
  }
  return { regionId, topicContractId: contractTopic.id, skillIds: normalizedSkillIds };
}

function assertVisualAudit(
  auditInput: unknown,
  sourceRecord: P1ExamBankReviewProjection['records'][number],
  projectionVersion: string,
): void {
  const audit = asRecord(auditInput);
  const id = sourceRecord.identity.question_id;
  if (!audit || audit.status !== 'passed') throw new Error(`${id} has no passed visual audit.`);
  if (!stringValue(audit.auditor) || !Number.isFinite(Date.parse(stringValue(audit.audited_at) ?? ''))) {
    throw new Error(`${id} has malformed visual-audit ownership or time.`);
  }
  if (audit.source_projection_version !== projectionVersion) throw new Error(`${id} has a stale visual audit projection version.`);
  if (audit.source_manifest_sha256 !== sourceRecord.source.manifest_sha256
      || audit.source_manifest_projection_fingerprint !== sourceRecord.source.manifest_projection_fingerprint
      || !exactMatch(audit.question_assets, sourceRecord.source.question_assets)
      || !exactMatch(audit.mark_scheme_assets, sourceRecord.source.mark_scheme_assets)) {
    throw new Error(`${id} visual audit does not match the pinned manifest and asset fingerprints.`);
  }
}

export function applyCourseTopicPacketOverlay(
  questionBankInput: unknown,
  topicRoutingInput: unknown,
  overlayInput: unknown,
  validationContext: {
    projection?: P1ExamBankReviewProjection;
    courseContract?: CourseStudyContract;
  } = {},
): { questionBank: RuntimeQuestionBank; topicRouting: TopicRoutingSidecar } {
  const overlay = asRecord(overlayInput) as CourseTopicPacketOverlay | undefined;
  if (!overlay || overlay.schema_name !== 'asterion.course_topic_packet_promotion_overlay') {
    throw new Error('Invalid course topic-packet promotion overlay.');
  }
  if (overlay.schema_version !== 1) throw new Error('Unsupported course topic-packet promotion overlay schema version.');
  assertOverlayIntegrity(overlay);
  const courseId = stringValue(overlay.course_id);
  const paperFamily = stringValue(overlay.paper_family);
  if (!courseId || !paperFamily) throw new Error('Course topic-packet overlay is missing course identity.');
  const projection = validationContext.projection ?? P1_EXAM_BANK_REVIEW_PROJECTION;
  const courseContract = validationContext.courseContract ?? P1_COURSE_STUDY_CONTRACT;
  if (courseId !== 'p1' || paperFamily !== 'p1' || projection.course_id !== courseId || courseContract.courseId !== courseId) {
    throw new Error('Course topic-packet overlay, projection, and course contract must share the P1 identity.');
  }
  if (overlay.source_projection_version !== projection.projection_version
      || overlay.source_projection_schema_version !== projection.schema_version
      || overlay.source_repo_head !== projection.source.repo_head) {
    throw new Error('Course topic-packet overlay source projection version or repository binding is stale.');
  }
  if (!exactMatch(overlay.course_contract, expectedContractBinding(courseContract))) {
    throw new Error('Course topic-packet overlay P1 course-contract binding is stale.');
  }

  const questionBank = clone(asRecord(questionBankInput) ?? {}) as RuntimeQuestionBank;
  const topicRouting = clone(asRecord(topicRoutingInput) ?? {}) as TopicRoutingSidecar;
  questionBank.questions = Array.isArray(questionBank.questions) ? questionBank.questions : [];
  topicRouting.records = (asRecord(topicRouting.records) as Record<string, UnknownRecord> | undefined) ?? {};
  const existingIds = new Set<string>();
  for (const question of questionBank.questions) {
    const questionId = stringValue(question.question_id);
    if (!questionId) continue;
    if (existingIds.has(questionId)) throw new Error(`Question-bank ID collision: ${questionId}.`);
    existingIds.add(questionId);
  }

  const overlayQuestions = overlay.questions ?? [];
  const overlayQuestionIds = overlayQuestions.map((question) => stringValue(question.question_id));
  if (overlayQuestionIds.some((questionId) => !questionId)) {
    throw new Error('Course topic-packet overlay question is missing question_id.');
  }
  if (new Set(overlayQuestionIds).size !== overlayQuestionIds.length) {
    throw new Error('Course topic-packet overlay contains a question ID collision.');
  }
  const promotedQuestionIds = overlay.promoted_question_ids ?? [];
  if (new Set(promotedQuestionIds).size !== promotedQuestionIds.length) {
    throw new Error('Course topic-packet overlay promoted_question_ids contains a collision.');
  }
  const expectedPromotedIds = [...overlayQuestionIds].sort();
  if (JSON.stringify([...promotedQuestionIds].sort()) !== JSON.stringify(expectedPromotedIds)) {
    throw new Error('Course topic-packet overlay promoted_question_ids does not match its questions.');
  }
  const routingIds = Object.keys(overlay.routing_records ?? {}).sort();
  if (JSON.stringify(routingIds) !== JSON.stringify(expectedPromotedIds)) {
    throw new Error('Course topic-packet overlay routing must match every promoted question exactly.');
  }
  const runtimeAssets = overlay.runtime_assets ?? [];
  const runtimeAssetIds = runtimeAssets.map((record) => stringValue(record.question_id));
  if (runtimeAssetIds.some((questionId) => !questionId)
      || new Set(runtimeAssetIds).size !== runtimeAssetIds.length
      || JSON.stringify([...runtimeAssetIds].sort()) !== JSON.stringify(expectedPromotedIds)) {
    throw new Error('Course topic-packet overlay runtime asset bindings must match every promoted question exactly.');
  }

  for (const question of overlayQuestions) {
    const questionId = stringValue(question.question_id);
    if (!questionId) throw new Error('Course topic-packet overlay question is missing question_id.');
    if (question.course_id !== courseId || question.paper_family !== paperFamily) {
      throw new Error(`${questionId} does not match overlay course identity.`);
    }
    if (question.review_status !== 'reviewed' || question.student_runtime_safe !== true) {
      throw new Error(`${questionId} is not explicitly reviewed and runtime-safe.`);
    }
    const reviewedTopicId = stringValue(question.topic_id);
    if (!reviewedTopicId) throw new Error(`${questionId} has no reviewed topic identity.`);
    const sourceRecord = projection.records.find((record) => record.identity.question_id === questionId);
    if (!sourceRecord) throw new Error(`${questionId} is not present in the pinned source projection.`);
    if (sourceRecord.review.disposition !== 'promote'
        || sourceRecord.review.review_status !== 'reviewed'
        || sourceRecord.review.student_runtime_safe !== true) {
      throw new Error(`${questionId} is not promotion-ready in the pinned source projection.`);
    }
    const provenance = asRecord(question.asterion_import);
    if (!provenance || provenance.promotion_basis !== 'explicit-asterion-human-review') {
      throw new Error(`${questionId} has no explicit Asterion review provenance.`);
    }
    if (provenance.source_projection_version !== projection.projection_version
        || provenance.source_repo_head !== sourceRecord.source.source_repo_head
        || provenance.source_manifest_sha256 !== sourceRecord.source.manifest_sha256
        || provenance.source_manifest_projection_fingerprint !== sourceRecord.source.manifest_projection_fingerprint
        || provenance.source_question_id !== sourceRecord.identity.question_id
        || provenance.source_packet_topic_id !== sourceRecord.source.topic_id
        || !exactMatch(provenance.source_question_assets, sourceRecord.source.question_assets)
        || !exactMatch(provenance.source_mark_scheme_assets, sourceRecord.source.mark_scheme_assets)
        || provenance.reviewed_topic_id !== sourceRecord.review.reviewed_topic_id
        || !exactMatch(provenance.reviewed_skill_ids, sourceRecord.review.reviewed_skill_ids)
        || provenance.reviewer !== sourceRecord.review.reviewer
        || provenance.reviewed_at !== sourceRecord.review.reviewed_at
        || !exactMatch(provenance.course_contract, expectedContractBinding(courseContract))) {
      throw new Error(`${questionId} promotion provenance does not match its pinned review projection.`);
    }
    assertVisualAudit(provenance.visual_audit, sourceRecord, projection.projection_version);
    if (!exactMatch(provenance.visual_audit, asRecord(sourceRecord.review)?.visual_audit)) {
      throw new Error(`${questionId} visual audit differs from its pinned review decision.`);
    }
    const placement = contractPlacement(reviewedTopicId, provenance.reviewed_skill_ids, projection, courseContract, questionId);
    const runtimeAsset = asRecord(runtimeAssets.find((record) => record.question_id === questionId));
    const questionAsset = asRecord(runtimeAsset?.question);
    const markSchemeAsset = asRecord(runtimeAsset?.mark_scheme);
    if (!questionAsset || !markSchemeAsset
        || questionAsset.target !== question.canonical_question_artifact
        || markSchemeAsset.target !== question.canonical_mark_scheme_artifact
        || questionAsset.sha256 !== sourceRecord.source.question_assets[0]?.sha256
        || markSchemeAsset.sha256 !== sourceRecord.source.mark_scheme_assets[0]?.sha256) {
      throw new Error(`${questionId} runtime assets do not match the reviewed source hashes and canonical paths.`);
    }
    const route = asRecord(overlay.routing_records?.[questionId]);
    if (!route
        || route.primary_topic_id !== reviewedTopicId
        || route.mapped_region_id !== placement.regionId
        || !exactMatch(route.reviewed_skill_ids, placement.skillIds)
        || !exactMatch(route.asterion_import, provenance)) {
      throw new Error(`${questionId} reviewed topic, skills, provenance, and runtime route do not agree exactly.`);
    }
    const index = questionBank.questions.findIndex((candidate) => candidate.question_id === questionId);
    if (index >= 0) questionBank.questions[index] = clone(question);
    else questionBank.questions.push(clone(question));
  }

  for (const [questionId, routingRecord] of Object.entries(overlay.routing_records ?? {})) {
    const route = asRecord(routingRecord);
    if (!route || route.route_approved !== true || route.review_required === true) {
      throw new Error(`${questionId} overlay routing is not approved.`);
    }
    if (!stringValue(route.primary_topic_id) || !stringValue(route.mapped_region_id)) {
      throw new Error(`${questionId} overlay routing lacks explicit topic and region evidence.`);
    }
    if (!Array.isArray(route.reviewed_skill_ids) || route.reviewed_skill_ids.length === 0) {
      throw new Error(`${questionId} overlay routing lacks reviewed atomic-skill evidence.`);
    }
    topicRouting.records[questionId] = clone(route);
  }

  questionBank.questions.sort((left, right) => String(left.question_id).localeCompare(String(right.question_id)));
  questionBank.record_count = questionBank.questions.length;
  const safeCount = questionBank.questions.filter((question) => (
    question.course_id === courseId
    && question.paper_family === paperFamily
    && question.review_status === 'reviewed'
    && question.student_runtime_safe === true
  )).length;
  for (const component of questionBank.components ?? []) {
    if (component.course_id === courseId) component.student_runtime_safe_record_count = safeCount;
  }
  for (const course of questionBank.courses ?? []) {
    if (course.course_id === courseId) course.student_runtime_safe_record_count = safeCount;
  }
  return { questionBank, topicRouting };
}
