import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getSidecarEnrichmentCount, normalizeQuestionBank } from '../src/lib/normalizeQuestionBank';
import { isP3Question } from '../src/lib/worldMap';

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function dataPath(name: string): string {
  return join(process.cwd(), 'public/data', name);
}

describe('P3 data bundle', () => {
  it('contains only P3 records derived from the full bank', () => {
    const full = readJson(dataPath('question_bank.json')) as { questions: Array<Record<string, unknown>> };
    const p3 = readJson(dataPath('question_bank.p3.json')) as { record_count: number; paper_family: string; questions: Array<Record<string, unknown>> };
    const fullP3Ids = full.questions
      .filter((question) => question.paper_family === 'p3')
      .map((question) => question.question_id);

    expect(p3.paper_family).toBe('p3');
    expect(p3.record_count).toBe(396);
    expect(p3.questions).toHaveLength(396);
    expect(p3.questions.map((question) => question.question_id)).toEqual(fullP3Ids);
    expect(new Set(p3.questions.map((question) => question.paper_family))).toEqual(new Set(['p3']));
  });

  it('keeps the P3 sidecar aligned with the P3 bundle', () => {
    const p3 = readJson(dataPath('question_bank.p3.json')) as { questions: Array<Record<string, unknown>> };
    const sidecar = readJson(dataPath('question_bank.deepseek.p3.json')) as { record_count: number; paper_family: string; enrichments: Record<string, unknown> };
    const p3Ids = new Set(p3.questions.map((question) => String(question.question_id)));
    const sidecarIds = Object.keys(sidecar.enrichments);

    expect(sidecar.paper_family).toBe('p3');
    expect(sidecar.record_count).toBe(396);
    expect(getSidecarEnrichmentCount(sidecar)).toBe(396);
    expect(sidecarIds.every((id) => p3Ids.has(id))).toBe(true);
  });

  it('normalizes to the same component-facing shape as the full bank path', () => {
    const p3 = readJson(dataPath('question_bank.p3.json'));
    const sidecar = readJson(dataPath('question_bank.deepseek.p3.json'));
    const questions = normalizeQuestionBank(p3, sidecar);
    const sample = questions[0];

    expect(questions).toHaveLength(396);
    expect(questions.every(isP3Question)).toBe(true);
    expect(sample).toMatchObject({
      id: expect.any(String),
      paperFamily: 'p3',
      displayTopic: expect.any(String),
      questionImageRawPaths: expect.any(Array),
      markSchemeImageRawPaths: expect.any(Array),
      questionImageCandidates: expect.any(Array),
      markSchemeImageCandidates: expect.any(Array),
      raw: {
        local: expect.any(Object),
        deepseek: expect.any(Object),
      },
    });
  });

  it('is meaningfully smaller than the previous full-bank startup payload', () => {
    const fullBytes = statSync(dataPath('question_bank.json')).size + statSync(dataPath('question_bank.deepseek.full.json')).size;
    const p3Bytes = statSync(dataPath('question_bank.p3.json')).size + statSync(dataPath('question_bank.deepseek.p3.json')).size;

    expect(p3Bytes).toBeLessThan(fullBytes * 0.35);
  });
});
