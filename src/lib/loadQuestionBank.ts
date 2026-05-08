import type { NormalizedQuestion, QuestionBankDiagnostics } from '../types';
import { getQuestionRecordCount, getSidecarEnrichmentCount, normalizeQuestionBankWithDiagnostics } from './normalizeQuestionBank';
import { isP3Question, matchRegionForQuestion } from './worldMap';

interface LoadedJson {
  url: string;
  data: unknown;
}

export type QuestionBankLoadScope = 'p3' | 'full';

export interface LoadQuestionBankOptions {
  scope?: QuestionBankLoadScope;
}

const DATA_PATHS = {
  p3Main: './data/question_bank.p3.json',
  fullMain: './data/question_bank.json',
  p3Sidecar: './data/question_bank.deepseek.p3.json',
  primarySidecar: './data/question_bank.deepseek.json',
  fullSidecar: './data/question_bank.deepseek.full.json',
} as const;

export function staticDataFetchCacheForMode(isProduction: boolean): RequestCache {
  return isProduction ? 'default' : 'no-store';
}

export function staticDataFetchCache(): RequestCache {
  return staticDataFetchCacheForMode(import.meta.env.PROD);
}

async function fetchJson(path: string): Promise<LoadedJson> {
  const response = await fetch(path, { cache: staticDataFetchCache() });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return { url: path, data: await response.json() };
}

export async function loadQuestionBank(options: LoadQuestionBankOptions = {}): Promise<NormalizedQuestion[]> {
  return (await loadQuestionBankWithDiagnostics(options)).questions;
}

export async function loadQuestionBankWithDiagnostics(options: LoadQuestionBankOptions = {}): Promise<{
  questions: NormalizedQuestion[];
  diagnostics: QuestionBankDiagnostics;
}> {
  const scope = options.scope ?? 'p3';
  const localResult = await loadMainBankWithFallback(scope);

  const sidecarResult = await loadSidecarWithFallback(scope);
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

export async function loadFullQuestionBankWithDiagnostics(): Promise<{
  questions: NormalizedQuestion[];
  diagnostics: QuestionBankDiagnostics;
}> {
  return loadQuestionBankWithDiagnostics({ scope: 'full' });
}

async function loadMainBankWithFallback(scope: QuestionBankLoadScope): Promise<LoadedJson> {
  if (scope === 'full') return fetchJson(DATA_PATHS.fullMain);

  const p3 = await Promise.resolve()
    .then(() => fetchJson(DATA_PATHS.p3Main))
    .catch(() => undefined);
  if (p3 && getQuestionRecordCount(p3.data) > 0) return p3;

  return fetchJson(DATA_PATHS.fullMain);
}

async function loadSidecarWithFallback(scope: QuestionBankLoadScope): Promise<LoadedJson> {
  const candidates = scope === 'p3'
    ? [DATA_PATHS.p3Sidecar, DATA_PATHS.primarySidecar, DATA_PATHS.fullSidecar]
    : [DATA_PATHS.primarySidecar, DATA_PATHS.fullSidecar];
  let firstLoaded: LoadedJson | undefined;

  for (const path of candidates) {
    const loaded = await Promise.resolve()
      .then(() => fetchJson(path))
      .catch(() => undefined);
    if (!loaded) continue;
    firstLoaded ??= loaded;
    if (getSidecarEnrichmentCount(loaded.data) > 0) return loaded;
  }

  return firstLoaded ?? { url: 'none', data: {} };
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
