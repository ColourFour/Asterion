import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(process.cwd(), 'public/assets/exam-bank-data');

const paths = {
  projectedBank: join(dataDir, 'asterion_question_bank_v1.json'),
  contentLabCandidates: join(dataDir, 'asterion_content_lab_candidates_v1.json'),
  rawBank: join(dataDir, 'question_bank.json'),
  topicRouting: join(dataDir, 'question_bank.topic_routing.v1.json'),
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const projectedBank = readJson(paths.projectedBank);
const contentLabCandidates = readJson(paths.contentLabCandidates);
const rawBank = readJson(paths.rawBank);
const topicRouting = readJson(paths.topicRouting);

const projectedQuestions = Array.isArray(projectedBank.questions) ? projectedBank.questions : [];
const rawQuestions = Array.isArray(rawBank.questions) ? rawBank.questions : [];
const routingRecords = topicRouting.records && typeof topicRouting.records === 'object' ? topicRouting.records : {};
const candidates = Array.isArray(contentLabCandidates.candidates) ? contentLabCandidates.candidates : [];
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

console.info('[Asterion exam-bank-data]', {
  projectedQuestions: projectedQuestions.length,
  rawQuestions: rawQuestions.length,
  contentLabCandidates: candidates.length,
  topicRoutingRecords: Object.keys(routingRecords).length,
  p3Questions: p3Questions.length,
});
