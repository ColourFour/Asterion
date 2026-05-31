import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDataHealthSummary } from '../src/lib/dataHealth';
import { normalizeQuestionBankWithDiagnostics } from '../src/lib/normalizeQuestionBank';

const dataDir = join(process.cwd(), 'public/assets/exam-bank-data');

const paths = {
  catalog: join(dataDir, 'asterion_exam_bank_catalog_v1.json'),
  projectedBank: join(dataDir, 'asterion_question_bank_v1.json'),
  contentLabCandidates: join(dataDir, 'asterion_content_lab_candidates_v1.json'),
  rawBank: join(dataDir, 'question_bank.json'),
  topicRouting: join(dataDir, 'question_bank.topic_routing.v1.json'),
};

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function recordsFromBank(value: unknown): Record<string, unknown>[] {
  const record = asRecord(value);
  const questions = record.questions;
  return Array.isArray(questions) ? questions.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item))) : [];
}

function topicRoutingRecords(value: unknown): Record<string, unknown> {
  const records = asRecord(value).records;
  return asRecord(records);
}

function candidatesFromContentLab(value: unknown): unknown[] {
  const candidates = asRecord(value).candidates;
  return Array.isArray(candidates) ? candidates : [];
}

const projectedBank = readJson(paths.projectedBank);
const contentLabCandidates = readJson(paths.contentLabCandidates);
const catalog = readJson(paths.catalog);
const rawBank = readJson(paths.rawBank);
const topicRouting = readJson(paths.topicRouting);

const catalogRecord = asRecord(catalog);
const projectedQuestions = recordsFromBank(projectedBank);
const catalogQuestions = recordsFromBank(catalog);
const rawQuestions = recordsFromBank(rawBank);
const routingRecords = topicRoutingRecords(topicRouting);
const candidates = candidatesFromContentLab(contentLabCandidates);
const p3Questions = projectedQuestions.filter((question) => question.paper_family === 'p3');
const runtimeSafeCatalogQuestions = catalogQuestions.filter((question) => (
  question.student_runtime_safe === true && question.review_status === 'reviewed'
));

if (projectedQuestions.length === 0) {
  throw new Error('asterion_question_bank_v1.json has no questions[] records.');
}

if (catalogQuestions.length === 0) {
  throw new Error('asterion_exam_bank_catalog_v1.json has no questions[] records.');
}

if (catalogQuestions.length !== rawQuestions.length) {
  throw new Error(`Catalog/raw bank count mismatch: ${catalogQuestions.length} catalog vs ${rawQuestions.length} raw.`);
}

if (typeof catalogRecord.record_count === 'number' && catalogRecord.record_count !== catalogQuestions.length) {
  throw new Error(`Catalog record_count mismatch: ${catalogRecord.record_count} declared vs ${catalogQuestions.length} questions.`);
}

if (runtimeSafeCatalogQuestions.length !== projectedQuestions.length) {
  throw new Error(`Runtime-safe catalog/projected count mismatch: ${runtimeSafeCatalogQuestions.length} catalog safe vs ${projectedQuestions.length} projected.`);
}

const projectedIds = projectedQuestions.map((question) => String(question.question_id ?? ''));
const runtimeSafeCatalogIds = runtimeSafeCatalogQuestions.map((question) => String(question.question_id ?? ''));
if (!projectedIds.every((id, index) => id === runtimeSafeCatalogIds[index])) {
  throw new Error('asterion_question_bank_v1.json is not aligned with the reviewed student-runtime subset from asterion_exam_bank_catalog_v1.json.');
}

if (Object.keys(routingRecords).length !== catalogQuestions.length) {
  throw new Error(`Topic-routing count mismatch: ${Object.keys(routingRecords).length} routing records vs ${catalogQuestions.length} catalog questions.`);
}

if (candidates.length === 0) {
  throw new Error('asterion_content_lab_candidates_v1.json has no candidates[] records.');
}

if (asRecord(asRecord(projectedBank).source_schema).schema_name !== 'asterion.exam_bank_catalog') {
  throw new Error('asterion_question_bank_v1.json must declare asterion.exam_bank_catalog as its source schema.');
}

if (asRecord(asRecord(contentLabCandidates).source_schema).schema_name !== 'asterion.exam_bank_catalog') {
  throw new Error('asterion_content_lab_candidates_v1.json must declare asterion.exam_bank_catalog as its source schema.');
}

const { questions, diagnostics } = normalizeQuestionBankWithDiagnostics(projectedBank, {}, topicRouting, {
  contentSourceKind: 'projected-bank',
});
const dataHealth = buildDataHealthSummary(questions, [], diagnostics);

console.info('[Asterion exam-bank-data]', {
  catalogQuestions: catalogQuestions.length,
  projectedQuestions: projectedQuestions.length,
  projectedRuntimeSafeQuestions: runtimeSafeCatalogQuestions.length,
  rawQuestions: rawQuestions.length,
  contentLabCandidates: candidates.length,
  topicRoutingRecords: Object.keys(routingRecords).length,
  p3Questions: p3Questions.length,
});

console.info('[Asterion P3 data-health diagnostics]', {
  routeEvidenceStatusCounts: dataHealth.routeEvidenceStatusCounts,
  eligibilityBucketCounts: dataHealth.eligibilityBucketCounts,
  blockerReasonCodeCounts: dataHealth.blockerReasonCodeCounts,
  contentSourceCounts: dataHealth.contentSourceCounts,
  fallbackDisplayOnlyCountsByRegion: dataHealth.fallbackDisplayOnlyCountsByRegion,
  rawBankFallbackCount: dataHealth.rawBankFallbackCount,
  rawBankDebugCount: dataHealth.rawBankDebugCount,
  generationEligibleCounts: dataHealth.generationEligibleCounts,
  generationBlockerReasonCounts: dataHealth.generationBlockerReasonCounts,
});
