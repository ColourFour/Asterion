import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadQuestionBankWithDiagnostics } from '../lib/loadQuestionBank';

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

  it('falls back to question_bank.deepseek.full.json when primary sidecar is empty', async () => {
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
      if (value.includes('question_bank.deepseek.json')) return Promise.resolve(response({}));
      return Promise.resolve(response(main));
    });

    const loaded = await loadQuestionBankWithDiagnostics();
    expect(loaded.diagnostics.sidecarUrl).toBe('./data/question_bank.deepseek.full.json');
    expect(loaded.diagnostics.sidecarEnrichmentCount).toBe(1);
    expect(loaded.questions[0].deepseek.topic).toBe('binomial expansion');
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
});
