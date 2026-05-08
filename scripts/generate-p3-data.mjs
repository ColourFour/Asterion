import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public', 'data');
const bankPath = join(dataDir, 'question_bank.json');
const sidecarPath = join(dataDir, 'question_bank.deepseek.full.json');
const p3BankPath = join(dataDir, 'question_bank.p3.json');
const p3SidecarPath = join(dataDir, 'question_bank.deepseek.p3.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function canonicalPaperFamily(value) {
  const normalized = String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized === 'pure3' || normalized === 'p3') return 'p3';
  if (normalized === 'pure1' || normalized === 'p1') return 'p1';
  if (normalized === 'mechanics' || normalized === 'm1' || normalized === 'p4') return 'p4';
  if (normalized === 'statistics' || normalized === 's1' || normalized === 'p5') return 'p5';
  return normalized || 'unknown';
}

function questionId(record, index) {
  return String(record.question_id ?? record.questionId ?? record.id ?? `question_${index + 1}`);
}

const fullBank = readJson(bankPath);
const fullQuestions = Array.isArray(fullBank.questions) ? fullBank.questions : [];
const p3Questions = fullQuestions.filter((record) => canonicalPaperFamily(record.paper_family ?? record.paperFamily ?? record.family) === 'p3');
const p3QuestionIds = new Set(p3Questions.map(questionId));

writeJson(p3BankPath, {
  schema_name: fullBank.schema_name,
  schema_version: fullBank.schema_version,
  record_count: p3Questions.length,
  paper_family: 'p3',
  source_file: 'question_bank.json',
  source_record_count: fullBank.record_count ?? fullQuestions.length,
  questions: p3Questions,
});

const fullSidecar = readJson(sidecarPath);
const fullEnrichments = fullSidecar.enrichments && typeof fullSidecar.enrichments === 'object' && !Array.isArray(fullSidecar.enrichments)
  ? fullSidecar.enrichments
  : {};
const p3Enrichments = Object.fromEntries(
  Object.entries(fullEnrichments).filter(([id]) => p3QuestionIds.has(id)),
);

writeJson(p3SidecarPath, {
  schema_name: fullSidecar.schema_name,
  schema_version: fullSidecar.schema_version,
  record_count: Object.keys(p3Enrichments).length,
  paper_family: 'p3',
  source_file: 'question_bank.deepseek.full.json',
  source_record_count: fullSidecar.record_count ?? Object.keys(fullEnrichments).length,
  enrichments: p3Enrichments,
});

console.log(`Wrote ${p3Questions.length} P3 questions to ${p3BankPath}`);
console.log(`Wrote ${Object.keys(p3Enrichments).length} P3 enrichments to ${p3SidecarPath}`);
