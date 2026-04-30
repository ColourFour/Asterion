import type { DeepSeekMetadata, NormalizedQuestion, PaperFamily } from '../types';
import { canonicalPaperFamily, resolveQuestionAssetPaths } from './resolveAssetPath';

type LooseRecord = Record<string, unknown>;

const ERROR_KEYS = ['error', 'parse_error', 'parseError', 'exception'];

function asRecord(value: unknown): LooseRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as LooseRecord) : undefined;
}

function pickString(record: LooseRecord | undefined, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function pickNumber(record: LooseRecord | undefined, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function pickImages(record: LooseRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || Array.isArray(value)) return value;
  }
  return undefined;
}

function hasError(record: LooseRecord | undefined): boolean {
  if (!record) return true;
  return ERROR_KEYS.some((key) => Boolean(record[key]));
}

function normalizeDeepSeek(value: unknown): DeepSeekMetadata {
  const record = asRecord(value);
  const errorMessage = ERROR_KEYS.map((key) => record?.[key]).find((item) => typeof item === 'string') as string | undefined;
  const reviewFlags = record?.review_flags ?? record?.reviewFlags;
  const validation = asRecord(record?.validation) ?? asRecord(record?.validation_fields) ?? undefined;

  return {
    topic: pickString(record, ['topic', 'deepseek_topic', 'predicted_topic']),
    subtopic: pickString(record, ['subtopic', 'deepseek_subtopic', 'predicted_subtopic']),
    difficulty: pickString(record, ['difficulty', 'deepseek_difficulty', 'predicted_difficulty']),
    confidence: pickNumber(record, ['confidence', 'deepseek_confidence']),
    reconciliationStatus: pickString(record, ['reconciliation_status', 'reconciliationStatus', 'status']),
    reviewFlags: Array.isArray(reviewFlags) ? reviewFlags.map(String) : undefined,
    validation,
    hasError: hasError(record),
    errorMessage,
  };
}

function getQuestionArray(bank: unknown): LooseRecord[] {
  if (Array.isArray(bank)) return bank.filter(Boolean).map((item) => asRecord(item)).filter(Boolean) as LooseRecord[];
  const record = asRecord(bank);
  const candidate = record?.questions ?? record?.items ?? record?.records;
  if (Array.isArray(candidate)) return candidate.map((item) => asRecord(item)).filter(Boolean) as LooseRecord[];
  return [];
}

function buildSidecarIndex(sidecar: unknown): Map<string, unknown> {
  const index = new Map<string, unknown>();
  const records = getQuestionArray(sidecar);
  for (const item of records) {
    const id = pickString(item, ['id', 'question_id', 'questionId', 'key']);
    if (id) index.set(id, item);
  }
  const root = asRecord(sidecar);
  if (root) {
    for (const [key, value] of Object.entries(root)) {
      if (!['questions', 'items', 'records'].includes(key)) index.set(key, value);
    }
  }
  return index;
}

function validDeepSeekLabel(value: string | undefined, deepseek: DeepSeekMetadata): value is string {
  if (!value || deepseek.hasError) return false;
  const lower = value.toLowerCase();
  return !['unknown', 'error', 'parse_error', 'malformed', 'n/a'].includes(lower);
}

export function normalizeQuestionBank(localBank: unknown, deepseekSidecar: unknown): NormalizedQuestion[] {
  const sidecarIndex = buildSidecarIndex(deepseekSidecar);

  return getQuestionArray(localBank).map((record, index) => {
    const id = pickString(record, ['id', 'question_id', 'questionId']) ?? `question_${index + 1}`;
    const paperFamily = canonicalPaperFamily(pickString(record, ['paper_family', 'paperFamily', 'family']) ?? pickString(record, ['paper']) ?? 'p3');
    const deepseekRaw = sidecarIndex.get(id) ?? record.deepseek ?? record.enrichment;
    const deepseek = normalizeDeepSeek(deepseekRaw);
    const localTopic = pickString(record, ['topic', 'local_topic', 'localTopic']);
    const localDifficulty = pickString(record, ['difficulty', 'local_difficulty', 'localDifficulty']);
    const questionImagePaths = resolveQuestionAssetPaths(pickImages(record, ['question_images', 'questionImagePaths', 'question_image', 'image_path', 'image']), paperFamily);
    const markSchemeImagePaths = resolveQuestionAssetPaths(pickImages(record, ['mark_scheme_images', 'markSchemeImagePaths', 'mark_scheme_image', 'mark_scheme_path', 'ms_image']), paperFamily);
    const marksAvailable = pickNumber(record, ['marks', 'marks_available', 'marksAvailable', 'total_marks']);

    return {
      id,
      paperFamily: paperFamily as PaperFamily,
      paper: pickString(record, ['paper', 'paper_code', 'session']),
      questionNumber: pickString(record, ['question_number', 'questionNumber', 'number', 'question_no']),
      localTopic,
      localSubtopic: pickString(record, ['subtopic', 'local_subtopic', 'localSubtopic']),
      localDifficulty,
      deepseek,
      displayTopic: validDeepSeekLabel(deepseek.topic, deepseek) ? deepseek.topic : localTopic ?? 'Unclassified',
      displaySubtopic: validDeepSeekLabel(deepseek.subtopic, deepseek) ? deepseek.subtopic : pickString(record, ['subtopic', 'local_subtopic', 'localSubtopic']),
      displayDifficulty: validDeepSeekLabel(deepseek.difficulty, deepseek) ? deepseek.difficulty : localDifficulty,
      marksAvailable,
      questionImagePaths,
      markSchemeImagePaths,
      questionImageUrls: questionImagePaths,
      markSchemeImageUrls: markSchemeImagePaths,
      raw: { local: record, deepseek: deepseekRaw },
    };
  });
}
