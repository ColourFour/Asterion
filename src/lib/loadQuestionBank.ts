import type { NormalizedQuestion, QuestionBankDiagnostics } from '../types';
import { getSidecarEnrichmentCount, normalizeQuestionBankWithDiagnostics } from './normalizeQuestionBank';
import { isP3Question, matchRegionForQuestion } from './worldMap';

interface LoadedJson {
  url: string;
  data: unknown;
}

async function fetchJson(path: string): Promise<LoadedJson> {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return { url: path, data: await response.json() };
}

export async function loadQuestionBank(): Promise<NormalizedQuestion[]> {
  return (await loadQuestionBankWithDiagnostics()).questions;
}

export async function loadQuestionBankWithDiagnostics(): Promise<{
  questions: NormalizedQuestion[];
  diagnostics: QuestionBankDiagnostics;
}> {
  const localResult = await Promise.resolve().then(() => fetchJson('./data/question_bank.json'));

  const sidecarResult = await loadSidecarWithFallback();
  const result = normalizeQuestionBankWithDiagnostics(localResult.data, sidecarResult.data);
  result.diagnostics = {
    ...result.diagnostics,
    ...jsonMetadata('main', localResult.url, localResult.data),
    ...jsonMetadata('sidecar', sidecarResult.url, sidecarResult.data),
    sidecarEnrichmentCount: getSidecarEnrichmentCount(sidecarResult.data),
  };
  logDevelopmentDiagnostics(result.questions, result.diagnostics);
  return result;
}

async function loadSidecarWithFallback(): Promise<LoadedJson> {
  const primary = await Promise.resolve()
    .then(() => fetchJson('./data/question_bank.deepseek.json'))
    .catch(() => undefined);
  if (primary && getSidecarEnrichmentCount(primary.data) > 0) return primary;

  const fallback = await Promise.resolve()
    .then(() => fetchJson('./data/question_bank.deepseek.full.json'))
    .catch(() => undefined);
  if (fallback && getSidecarEnrichmentCount(fallback.data) > 0) return fallback;
  return primary ?? fallback ?? { url: 'none', data: {} };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function jsonMetadata(kind: 'main' | 'sidecar', url: string, data: unknown): Partial<QuestionBankDiagnostics> {
  const record = asRecord(data);
  const questions = Array.isArray(record?.questions) ? record.questions.length : 0;
  const enrichments = asRecord(record?.enrichments);
  if (kind === 'main') {
    return {
      mainUrl: url,
      mainSchemaName: typeof record?.schema_name === 'string' ? record.schema_name : undefined,
      mainSchemaVersion: typeof record?.schema_version === 'string' || typeof record?.schema_version === 'number' ? record.schema_version : undefined,
      mainRecordCount: typeof record?.record_count === 'number' ? record.record_count : undefined,
      mainQuestionsLength: questions,
      mainAppearsPlaceholder: !Array.isArray(record?.questions) || questions === 0 || record?.record_count === 0,
    };
  }
  return {
    sidecarUrl: url,
    sidecarSchemaName: typeof record?.schema_name === 'string' ? record.schema_name : undefined,
    sidecarSchemaVersion: typeof record?.schema_version === 'string' || typeof record?.schema_version === 'number' ? record.schema_version : undefined,
    sidecarRecordCount: typeof record?.record_count === 'number' ? record.record_count : undefined,
    sidecarAppearsPlaceholder: !enrichments || Object.keys(enrichments).length === 0,
  };
}

function logDevelopmentDiagnostics(questions: NormalizedQuestion[], diagnostics: QuestionBankDiagnostics): void {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') return;
  const p3 = questions.filter(isP3Question);
  const regionCounts = p3.reduce<Record<string, number>>((counts, question) => {
    const region = matchRegionForQuestion(question)?.name ?? 'Unmatched';
    counts[region] = (counts[region] ?? 0) + 1;
    return counts;
  }, {});
  const imageExamples = p3.slice(0, 3).map((question) => ({
    id: question.id,
    question: question.questionImageUrls[0],
    markScheme: question.markSchemeImageUrls[0],
  }));
  console.info('[Asterion data]', {
    loadedQuestionCount: diagnostics.loadedQuestionCount,
    mainUrl: diagnostics.mainUrl,
    mainSchemaName: diagnostics.mainSchemaName,
    mainRecordCount: diagnostics.mainRecordCount,
    mainQuestionsLength: diagnostics.mainQuestionsLength,
    mainAppearsPlaceholder: diagnostics.mainAppearsPlaceholder,
    normalizedQuestionCount: diagnostics.normalizedQuestionCount,
    p3Count: p3.length,
    regionCounts,
    sidecarEnrichmentCount: diagnostics.sidecarEnrichmentCount,
    sidecarUrl: diagnostics.sidecarUrl,
    sidecarSchemaName: diagnostics.sidecarSchemaName,
    sidecarRecordCount: diagnostics.sidecarRecordCount,
    sidecarAppearsPlaceholder: diagnostics.sidecarAppearsPlaceholder,
    sidecarMergeCount: diagnostics.sidecarMergeCount,
    sidecarErrorCount: diagnostics.sidecarErrorCount,
    imageExamples,
  });
}
