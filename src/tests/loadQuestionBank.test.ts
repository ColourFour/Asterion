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
    expect(loaded.diagnostics.mainContentSource).toBe('projected-bank');
    expect(loaded.diagnostics.routingUrl).toBe('./assets/exam-bank-data/question_bank.topic_routing.v1.json');
    expect(loaded.questions).toHaveLength(1);
    expect(loaded.questions[0].contentSource?.kind).toBe('projected-bank');
    expect(loaded.questions[0].topicRouting?.mappedRegionId).toBe('algebra-forge');
    expect(fetchedUrls).not.toContain('./assets/exam-bank-data/question_bank.json');
  });

  it('fails closed instead of falling back to raw records when the projected bank fails', async () => {
    const rawFallback = {
      schema_name: 'exam_bank.question_bank',
      schema_version: 2,
      record_count: 1,
      questions: [{
        question_id: 'raw_q1',
        paper_family: 'p3',
        topic: 'algebra',
        question_image_path: 'p3/a/questions/q01.png',
        mark_scheme_image_path: 'p3/a/mark_scheme/q01.png',
        question_text: 'Solve the equation.',
        mark_scheme_text: 'Correct algebraic solution.',
        text_only_status: 'ready',
        quality_gate: { text_only_display_allowed: true },
      }],
    };
    const routing = {
      schema_name: 'exam_bank.topic_routing',
      schema_version: 1,
      record_count: 1,
      records: { raw_q1: { primary_topic_id: '9709_p3_topic_algebra', confidence: 'high', paper_family: 'p3' } },
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const value = String(url);
      if (value.includes('question_bank.topic_routing.v1.json')) return Promise.resolve(response(routing));
      if (value.includes('asterion_question_bank_v1.json')) return Promise.resolve(response({}, false));
      if (value.includes('question_bank.json')) return Promise.resolve(response(rawFallback));
      return Promise.resolve(response({}, false));
    });

    await expect(loadQuestionBankWithDiagnostics()).rejects.toThrow('Student-safe question bank unavailable');
    expect(fetchMock.mock.calls.map(([url]) => String(url))).not.toContain('./assets/exam-bank-data/question_bank.json');
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
    expect(loaded.diagnostics.mainContentSource).toBe('raw-bank-debug');
    expect(loaded.questions.every((question) => question.contentSource?.kind === 'raw-bank-debug')).toBe(true);
    expect(loaded.questions.map((question) => question.paperFamily)).toEqual(['p3', 'p1']);
  });

  it('fails closed when the projected bank normalizes to no P3 records', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      if (String(url).includes('topic_routing')) return Promise.resolve(response({}));
      return Promise.resolve(response({ record_count: 1, questions: [{ question_id: 'p1_q1', paper_family: 'p1' }] }));
    });

    await expect(loadQuestionBankWithDiagnostics()).rejects.toThrow('projected bank produced no normalized P3 questions');
  });

  it('never fetches raw Content Lab candidates during the default student runtime load', async () => {
    const projectedMain = {
      schema_name: 'asterion_question_bank_projection',
      schema_version: 2,
      record_count: 1,
      questions: [{ question_id: 'q1', paper_family: 'p3', canonical_question_artifact: 'p3/a/questions/q1.png', canonical_mark_scheme_artifact: 'p3/a/mark_scheme/q1.png' }],
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      const value = String(url);
      if (value.includes('asterion_content_lab_candidates_v1.json')) {
        throw new Error('Content Lab candidates must not be fetched by student runtime.');
      }
      if (value.includes('question_bank.topic_routing.v1.json')) return Promise.resolve(response({}));
      if (value.includes('asterion_question_bank_v1.json')) return Promise.resolve(response(projectedMain));
      return Promise.resolve(response({}, false));
    });

    await loadQuestionBankWithDiagnostics();

    expect(fetchMock.mock.calls.map(([url]) => String(url)).join('\n')).not.toContain('asterion_content_lab_candidates_v1.json');
  });

  it('uses no-store for local/test data loads and default cache for production static JSON', () => {
    expect(staticDataFetchCacheForMode(false)).toBe('no-store');
    expect(staticDataFetchCacheForMode(true)).toBe('default');
  });
});
