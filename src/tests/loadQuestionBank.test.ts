import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadQuestionBankWithDiagnostics, staticDataFetchCacheForMode } from '../lib/loadQuestionBank';

function response(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.resolve(data),
  } as Response;
}

describe('loadQuestionBankWithDiagnostics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the P3 bundle before the full bank for the default P3 flow', async () => {
    const p3Main = {
      schema_name: 'exam_bank.question_bank',
      schema_version: 2,
      record_count: 1,
      paper_family: 'p3',
      questions: [{ question_id: 'q1', paper_family: 'p3', topic: 'algebra' }],
    };
    const p3Sidecar = {
      schema_name: 'exam_bank.deepseek_sidecar',
      schema_version: 1,
      record_count: 1,
      paper_family: 'p3',
      enrichments: { q1: { deepseek_topic: 'binomial expansion' } },
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const value = String(url);
      if (value.includes('question_bank.deepseek.p3.json')) return Promise.resolve(response(p3Sidecar));
      if (value.includes('question_bank.p3.json')) return Promise.resolve(response(p3Main));
      return Promise.resolve(response({}, false));
    });

    const loaded = await loadQuestionBankWithDiagnostics();
    const fetchedUrls = fetchMock.mock.calls.map(([url]) => String(url));

    expect(loaded.diagnostics.mainUrl).toBe('./data/question_bank.p3.json');
    expect(loaded.diagnostics.sidecarUrl).toBe('./data/question_bank.deepseek.p3.json');
    expect(loaded.questions).toHaveLength(1);
    expect(loaded.questions[0].deepseek.topic).toBe('binomial expansion');
    expect(fetchedUrls).not.toContain('./data/question_bank.json');
  });

  it('falls back to question_bank.deepseek.full.json when P3 and primary sidecars are missing or empty', async () => {
    const main = {
      schema_name: 'exam_bank.question_bank',
      schema_version: 2,
      record_count: 1,
      questions: [{ question_id: 'q1', paper_family: 'p3', topic: 'algebra' }],
    };
    const full = {
      schema_name: 'exam_bank.deepseek_sidecar',
      schema_version: 1,
      record_count: 1,
      enrichments: { q1: { deepseek_topic: 'binomial expansion' } },
    };
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const value = String(url);
      if (value.includes('question_bank.deepseek.full.json')) return Promise.resolve(response(full));
      if (value.includes('question_bank.deepseek.p3.json')) return Promise.resolve(response({}, false));
      if (value.includes('question_bank.deepseek.json')) return Promise.resolve(response({}));
      return Promise.resolve(response(main));
    });

    const loaded = await loadQuestionBankWithDiagnostics();
    expect(loaded.diagnostics.sidecarUrl).toBe('./data/question_bank.deepseek.full.json');
    expect(loaded.diagnostics.sidecarEnrichmentCount).toBe(1);
    expect(loaded.questions[0].deepseek.topic).toBe('binomial expansion');
  });

  it('keeps full-bank compatibility available for debug and future paper families', async () => {
    const fullMain = {
      schema_name: 'exam_bank.question_bank',
      schema_version: 2,
      record_count: 2,
      questions: [
        { question_id: 'q1', paper_family: 'p3', topic: 'algebra' },
        { question_id: 'q2', paper_family: 'p1', topic: 'quadratics' },
      ],
    };
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const value = String(url);
      if (value.includes('question_bank.deepseek.full.json')) return Promise.resolve(response({}));
      if (value.includes('question_bank.deepseek.json')) return Promise.resolve(response({}));
      if (value.includes('question_bank.json')) return Promise.resolve(response(fullMain));
      return Promise.resolve(response({}, false));
    });

    const loaded = await loadQuestionBankWithDiagnostics({ scope: 'full' });

    expect(loaded.diagnostics.mainUrl).toBe('./data/question_bank.json');
    expect(loaded.questions.map((question) => question.paperFamily)).toEqual(['p3', 'p1']);
  });

  it('reports placeholder main bank diagnostics', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (String(url).includes('deepseek')) return Promise.resolve(response({}));
      return Promise.resolve(response({ questions: [] }));
    });

    const loaded = await loadQuestionBankWithDiagnostics();
    expect(loaded.diagnostics.mainAppearsPlaceholder).toBe(true);
    expect(loaded.diagnostics.mainQuestionsLength).toBe(0);
  });

  it('uses no-store for local/test data loads and default cache for production static JSON', () => {
    expect(staticDataFetchCacheForMode(false)).toBe('no-store');
    expect(staticDataFetchCacheForMode(true)).toBe('default');
  });
});
