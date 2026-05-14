import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDataHealthSummary } from '../src/lib/dataHealth';
import { normalizeQuestionBankWithDiagnostics } from '../src/lib/normalizeQuestionBank';

const dataDir = join(process.cwd(), 'public/assets/exam-bank-data');

const paths = {
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
const rawBank = readJson(paths.rawBank);
const topicRouting = readJson(paths.topicRouting);

const projectedQuestions = recordsFromBank(projectedBank);
const rawQuestions = recordsFromBank(rawBank);
const routingRecords = topicRoutingRecords(topicRouting);
const candidates = candidatesFromContentLab(contentLabCandidates);
const p3Questions = projectedQuestions.filter((question) => question.paper_family === 'p3');

if (projectedQuestions.length === 0) {
  throw new Error('asterion_question_bank_v1.json has no questions[] records.');
}

if (projectedQuestions.length !== rawQuestions.length) {
  throw new Error(`Projected/raw bank count mismatch: ${projectedQuestions.length} projected vs ${rawQuestions.length} raw.`);
}

if (Object.keys(routingRecords).length !== projectedQuestions.length) {
  throw new Error(`Topic-routing count mismatch: ${Object.keys(routingRecords).length} routing records vs ${projectedQuestions.length} projected questions.`);
}

if (candidates.length === 0) {
  throw new Error('asterion_content_lab_candidates_v1.json has no candidates[] records.');
}

const { questions, diagnostics } = normalizeQuestionBankWithDiagnostics(projectedBank, {}, topicRouting, {
  contentSourceKind: 'projected-bank',
});
const dataHealth = buildDataHealthSummary(questions, [], diagnostics);

console.info('[Asterion exam-bank-data]', {
  projectedQuestions: projectedQuestions.length,
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
