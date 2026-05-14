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

  it('loads the Asterion-safe projected bank and topic-routing file for the default P3 flow', async () => {
    const projectedMain = {
      schema_name: 'asterion_question_bank_projection',
      schema_version: 2,
      record_count: 1,
      questions: [{ question_id: 'q1', paper_family: 'p3', canonical_question_artifact: 'p3/a/questions/q1.png', canonical_mark_scheme_artifact: 'p3/a/mark_scheme/q1.png' }],
    };
    const routing = {
      schema_name: 'exam_bank.topic_routing',
      schema_version: 1,
      record_count: 1,
      records: { q1: { primary_topic_id: '9709_p3_topic_algebra', confidence: 'high', paper_family: 'p3' } },
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const value = String(url);
      if (value.includes('question_bank.topic_routing.v1.json')) return Promise.resolve(response(routing));
      if (value.includes('asterion_question_bank_v1.json')) return Promise.resolve(response(projectedMain));
      return Promise.resolve(response({}, false));
    });

    const loaded = await loadQuestionBankWithDiagnostics();
    const fetchedUrls = fetchMock.mock.calls.map(([url]) => String(url));

    expect(loaded.diagnostics.mainUrl).toBe('./assets/exam-bank-data/asterion_question_bank_v1.json');
    expect(loaded.diagnostics.routingUrl).toBe('./assets/exam-bank-data/question_bank.topic_routing.v1.json');
    expect(loaded.questions).toHaveLength(1);
    expect(loaded.questions[0].topicRouting?.mappedRegionId).toBe('algebra-forge');
    expect(fetchedUrls).not.toContain('./assets/exam-bank-data/question_bank.json');
  });

  it('continues without routing metadata when the topic-routing file is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const value = String(url);
      if (value.includes('question_bank.topic_routing.v1.json')) return Promise.resolve(response({}, false));
      return Promise.resolve(response({
        schema_name: 'asterion_question_bank_projection',
        record_count: 1,
        questions: [{ question_id: 'q1', paper_family: 'p3', topic: 'algebra' }],
      }));
    });

    const loaded = await loadQuestionBankWithDiagnostics();
    expect(loaded.diagnostics.routingUrl).toBe('none');
    expect(loaded.diagnostics.routingAppearsPlaceholder).toBe(true);
    expect(loaded.questions[0].displayTopic).toBe('algebra');
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
      if (value.includes('question_bank.topic_routing.v1.json')) return Promise.resolve(response({}));
      if (value.includes('question_bank.json')) return Promise.resolve(response(fullMain));
      return Promise.resolve(response({}, false));
    });

    const loaded = await loadQuestionBankWithDiagnostics({ scope: 'full' });

    expect(loaded.diagnostics.mainUrl).toBe('./assets/exam-bank-data/question_bank.json');
    expect(loaded.questions.map((question) => question.paperFamily)).toEqual(['p3', 'p1']);
  });

  it('reports placeholder main bank diagnostics', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (String(url).includes('topic_routing')) return Promise.resolve(response({}));
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
