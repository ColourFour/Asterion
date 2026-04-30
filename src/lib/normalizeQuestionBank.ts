import type { DeepSeekMetadata, NormalizedQuestion, PaperFamily, QuestionBankDiagnostics } from '../types';
import { canonicalPaperFamily, resolveQuestionAssetPathCandidateGroups, resolveQuestionAssetPaths } from './resolveAssetPath';

type LooseRecord = Record<string, unknown>;

const ERROR_KEYS = ['error', 'parse_error', 'parseError', 'exception', 'error_message', 'errorMessage'];

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

function pickBoolean(record: LooseRecord | undefined, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string' && ['true', 'false'].includes(value.toLowerCase())) return value.toLowerCase() === 'true';
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

function nestedRecord(record: LooseRecord | undefined, key: string): LooseRecord | undefined {
  return asRecord(record?.[key]);
}

function pickImages(record: LooseRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || Array.isArray(value)) return value;
  }
  return undefined;
}

function combineImages(...values: unknown[]): string[] {
  return values.flatMap((value) => {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
  });
}

function hasError(record: LooseRecord | undefined): boolean {
  if (!record) return true;
  return ERROR_KEYS.some((key) => Boolean(record[key]));
}

function normalizeDeepSeek(value: unknown): DeepSeekMetadata {
  const record = asRecord(value);
  const errorMessage = ERROR_KEYS.map((key) => record?.[key]).find((item) => typeof item === 'string') as string | undefined;
  const reviewFlags = record?.review_flags ?? record?.reviewFlags ?? record?.final_review_reasons;
  const validation = asRecord(record?.validation) ?? asRecord(record?.validation_fields) ?? undefined;
  const confidenceNumber = pickNumber(record, ['confidence', 'deepseek_confidence']);
  const confidenceLabel = pickString(record, ['confidence', 'deepseek_confidence', 'deepseek_confidence_normalized']);

  return {
    topic: pickString(record, ['topic', 'deepseek_topic', 'predicted_topic']),
    normalizedTopic: pickString(record, ['deepseek_topic_normalized', 'topic_normalized', 'normalized_topic']),
    subtopic: pickString(record, ['subtopic', 'deepseek_subtopic', 'predicted_subtopic']),
    difficulty: pickString(record, ['difficulty', 'deepseek_difficulty', 'predicted_difficulty']),
    normalizedDifficulty: pickString(record, ['deepseek_difficulty_normalized', 'difficulty_normalized', 'normalized_difficulty']),
    confidence: confidenceNumber,
    confidenceLabel,
    reconciliationStatus: pickString(record, ['topic_reconciliation_status', 'reconciliation_status', 'reconciliationStatus', 'status']),
    finalReviewRequired: pickBoolean(record, ['final_review_required', 'deepseek_review_required', 'review_required']),
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
  const enrichments = asRecord(root?.enrichments);
  if (enrichments) {
    for (const [key, value] of Object.entries(enrichments)) index.set(key, value);
  }
  if (root) {
    for (const [key, value] of Object.entries(root)) {
      if (!['schema_name', 'schema_version', 'record_count', 'questions', 'items', 'records', 'enrichments'].includes(key)) index.set(key, value);
    }
  }
  return index;
}

export function getSidecarEnrichmentCount(sidecar: unknown): number {
  const root = asRecord(sidecar);
  const enrichments = asRecord(root?.enrichments);
  if (enrichments) return Object.keys(enrichments).length;
  const arrayCount = getQuestionArray(sidecar).length;
  if (arrayCount) return arrayCount;
  return buildSidecarIndex(sidecar).size;
}

export function getSidecarErrorCount(sidecar: unknown): number {
  return Array.from(buildSidecarIndex(sidecar).values()).filter((entry) => normalizeDeepSeek(entry).hasError).length;
}

export function getQuestionRecordCount(bank: unknown): number {
  return getQuestionArray(bank).length;
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
    const questionImageRaw = combineImages(
      pickImages(record, ['question_image_paths', 'question_images', 'questionImagePaths', 'question_image_path', 'question_image', 'image_path', 'image']),
      pickImages(nestedRecord(record, 'canonical_question_artifact') ?? {}, ['path', 'image_path', 'question_image_path']),
    );
    const markSchemeImageRaw = combineImages(
      pickImages(record, ['mark_scheme_image_paths', 'mark_scheme_images', 'markSchemeImagePaths', 'mark_scheme_image_path', 'mark_scheme_image', 'mark_scheme_path', 'ms_image']),
    );
    const paperFamily = inferPaperFamily(record, questionImageRaw);
    const deepseekRaw = sidecarIndex.get(id) ?? record.deepseek ?? record.enrichment;
    const deepseek = normalizeDeepSeek(deepseekRaw);
    const localTopic = pickString(record, ['topic', 'local_topic', 'localTopic']);
    const notes = nestedRecord(record, 'notes');
    const localSubtopic = pickString(record, ['subtopic', 'local_subtopic', 'localSubtopic']) ?? pickString(notes, ['subtopic']);
    const localDifficulty = pickString(record, ['difficulty', 'local_difficulty', 'localDifficulty']);
    const questionImageCandidates = resolveQuestionAssetPathCandidateGroups(questionImageRaw, paperFamily);
    const markSchemeImageCandidates = resolveQuestionAssetPathCandidateGroups(markSchemeImageRaw, paperFamily);
    const questionImageUrls = resolveQuestionAssetPaths(questionImageRaw, paperFamily);
    const markSchemeImageUrls = resolveQuestionAssetPaths(markSchemeImageRaw, paperFamily);
    const marksAvailable = pickNumber(record, ['question_solution_marks', 'marks', 'marks_available', 'marksAvailable', 'total_marks']);

    return {
      id,
      paperFamily: paperFamily as PaperFamily,
      paper: pickString(record, ['paper', 'paper_code', 'session']),
      questionNumber: pickString(record, ['question_number', 'questionNumber', 'number', 'question_no']),
      localTopic,
      localSubtopic,
      localDifficulty,
      deepseek,
      displayTopic: validDeepSeekLabel(deepseek.topic, deepseek) ? deepseek.topic : localTopic ?? 'Unclassified',
      displaySubtopic: validDeepSeekLabel(deepseek.subtopic, deepseek) ? deepseek.subtopic : localSubtopic,
      displayDifficulty: validDeepSeekLabel(deepseek.normalizedDifficulty ?? deepseek.difficulty, deepseek) ? deepseek.normalizedDifficulty ?? deepseek.difficulty : localDifficulty,
      marksAvailable,
      questionImageRawPaths: questionImageRaw,
      markSchemeImageRawPaths: markSchemeImageRaw,
      questionImagePaths: questionImageRaw,
      markSchemeImagePaths: markSchemeImageRaw,
      questionImageUrls,
      markSchemeImageUrls,
      questionImageCandidates,
      markSchemeImageCandidates,
      raw: { local: record, deepseek: deepseekRaw },
    };
  });
}

function inferPaperFamily(record: LooseRecord, imagePaths: string[]): PaperFamily {
  const explicit = pickString(record, ['paper_family', 'paperFamily', 'family']);
  if (explicit) return canonicalPaperFamily(explicit);
  const paper = pickString(record, ['paper', 'paper_code', 'session']);
  const hints = [paper, ...imagePaths].filter(Boolean).map((value) => String(value).toLowerCase());
  if (hints.some((hint) => /(^|[/_\-\s])p3([/_\-\s]|$)/.test(hint) || /paper\s*3/.test(hint))) return 'p3';
  if (hints.some((hint) => /(^|[/_\-\s])p1([/_\-\s]|$)/.test(hint) || /paper\s*1/.test(hint))) return 'p1';
  if (hints.some((hint) => /(^|[/_\-\s])p4([/_\-\s]|$)|mechanics|m1/.test(hint))) return 'p4';
  if (hints.some((hint) => /(^|[/_\-\s])p5([/_\-\s]|$)|statistics|s1/.test(hint))) return 'p5';
  return 'unknown';
}

export function normalizeQuestionBankWithDiagnostics(localBank: unknown, deepseekSidecar: unknown): {
  questions: NormalizedQuestion[];
  diagnostics: QuestionBankDiagnostics;
} {
  const questions = normalizeQuestionBank(localBank, deepseekSidecar);
  const sidecarEnrichmentCount = getSidecarEnrichmentCount(deepseekSidecar);
  const sidecarMergeCount = questions.filter((question) => Boolean(question.raw.deepseek)).length;
  const sidecarErrorCount = getSidecarErrorCount(deepseekSidecar);
  return {
    questions,
    diagnostics: {
      mainQuestionsLength: getQuestionRecordCount(localBank),
      mainAppearsPlaceholder: getQuestionRecordCount(localBank) === 0,
      sidecarAppearsPlaceholder: sidecarEnrichmentCount === 0,
      loadedQuestionCount: getQuestionRecordCount(localBank),
      normalizedQuestionCount: questions.length,
      sidecarEnrichmentCount,
      sidecarMergeCount,
      sidecarErrorCount,
    },
  };
}
