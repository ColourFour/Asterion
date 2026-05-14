import type { NormalizedQuestion, QuestionBankDiagnostics, QuestionContentSourceKind } from '../types';
import {
  getQuestionRecordCount,
  getTopicRoutingMappedCount,
  getTopicRoutingRecordCount,
  normalizeQuestionBankWithDiagnostics,
} from './normalizeQuestionBank';
import { isP3Question, matchRegionForQuestion } from './worldMap';

interface LoadedJson {
  url: string;
  data: unknown;
  contentSourceKind: QuestionContentSourceKind;
}

export type QuestionBankLoadScope = 'p3' | 'full';

export interface LoadQuestionBankOptions {
  scope?: QuestionBankLoadScope;
}

const DATA_PATHS = {
  asterionQuestionBank: './assets/exam-bank-data/asterion_question_bank_v1.json',
  rawQuestionBank: './assets/exam-bank-data/question_bank.json',
  topicRouting: './assets/exam-bank-data/question_bank.topic_routing.v1.json',
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
  return { url: path, data: await response.json(), contentSourceKind: 'unknown' };
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
  const routingResult = await loadTopicRoutingWithFallback();
  const result = normalizeQuestionBankWithDiagnostics(localResult.data, {}, routingResult.data, {
    contentSourceKind: localResult.contentSourceKind,
  });
  result.diagnostics = {
    ...result.diagnostics,
    mainContentSource: localResult.contentSourceKind,
    ...jsonMetadata('main', localResult.url, localResult.data),
    ...jsonMetadata('routing', routingResult.url, routingResult.data),
    sidecarUrl: undefined,
    sidecarSchemaName: undefined,
    sidecarRecordCount: undefined,
    sidecarAppearsPlaceholder: true,
    sidecarEnrichmentCount: 0,
    sidecarMergeCount: 0,
    sidecarErrorCount: 0,
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
  if (scope === 'full') return { ...(await fetchJson(DATA_PATHS.rawQuestionBank)), contentSourceKind: 'raw-bank-debug' };

  const projected = await Promise.resolve()
    .then(() => fetchJson(DATA_PATHS.asterionQuestionBank))
    .catch(() => undefined);
  if (projected && getQuestionRecordCount(projected.data) > 0) {
    return { ...projected, contentSourceKind: 'projected-bank' };
  }

  return { ...(await fetchJson(DATA_PATHS.rawQuestionBank)), contentSourceKind: 'raw-bank-fallback' };
}

async function loadTopicRoutingWithFallback(): Promise<LoadedJson> {
  return Promise.resolve()
    .then(() => fetchJson(DATA_PATHS.topicRouting))
    .catch(() => ({ url: 'none', data: {}, contentSourceKind: 'unknown' }));
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function jsonMetadata(kind: 'main' | 'routing', url: string, data: unknown): Partial<QuestionBankDiagnostics> {
  const record = asRecord(data);
  const questions = Array.isArray(record?.questions) ? record.questions.length : 0;
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
    routingUrl: url,
    routingSchemaName: typeof record?.schema_name === 'string' ? record.schema_name : undefined,
    routingSchemaVersion: typeof record?.schema_version === 'string' || typeof record?.schema_version === 'number' ? record.schema_version : undefined,
    routingRecordCount: typeof record?.record_count === 'number' ? record.record_count : getTopicRoutingRecordCount(data),
    routingMappedCount: getTopicRoutingMappedCount(data),
    routingAppearsPlaceholder: getTopicRoutingRecordCount(data) === 0,
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
    mainContentSource: diagnostics.mainContentSource,
    mainSchemaName: diagnostics.mainSchemaName,
    mainRecordCount: diagnostics.mainRecordCount,
    mainQuestionsLength: diagnostics.mainQuestionsLength,
    mainAppearsPlaceholder: diagnostics.mainAppearsPlaceholder,
    normalizedQuestionCount: diagnostics.normalizedQuestionCount,
    p3Count: p3.length,
    regionCounts,
    routingUrl: diagnostics.routingUrl,
    routingSchemaName: diagnostics.routingSchemaName,
    routingRecordCount: diagnostics.routingRecordCount,
    routingMappedCount: diagnostics.routingMappedCount,
    routingAppearsPlaceholder: diagnostics.routingAppearsPlaceholder,
    imageExamples,
  });
}
