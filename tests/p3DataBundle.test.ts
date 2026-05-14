import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeQuestionBank } from '../src/lib/normalizeQuestionBank';
import { isP3Question } from '../src/lib/worldMap';

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function dataPath(name: string): string {
  return join(process.cwd(), 'public/assets/exam-bank-data', name);
}

describe('P3 data bundle', () => {
  it('keeps the Asterion-safe projection aligned with the raw bank IDs', () => {
    const raw = readJson(dataPath('question_bank.json')) as { questions: Array<Record<string, unknown>> };
    const projected = readJson(dataPath('asterion_question_bank_v1.json')) as { record_count: number; questions: Array<Record<string, unknown>> };
    const rawIds = raw.questions
      .map((question) => question.question_id);
    const projectedIds = projected.questions.map((question) => question.question_id);
    const p3Ids = projected.questions
      .filter((question) => question.paper_family === 'p3')
      .map((question) => question.question_id);

    expect(projected.record_count).toBe(raw.questions.length);
    expect(projectedIds).toEqual(rawIds);
    expect(p3Ids).toHaveLength(396);
  });

  it('keeps the topic-routing records aligned with the projected bank', () => {
    const projected = readJson(dataPath('asterion_question_bank_v1.json')) as { questions: Array<Record<string, unknown>> };
    const routing = readJson(dataPath('question_bank.topic_routing.v1.json')) as { record_count: number; records: Record<string, unknown> };
    const projectedIds = new Set(projected.questions.map((question) => String(question.question_id)));
    const routingIds = Object.keys(routing.records);

    expect(routing.record_count).toBe(projected.questions.length);
    expect(routingIds.every((id) => projectedIds.has(id))).toBe(true);
  });

  it('normalizes projected records and routing to the component-facing P3 shape', () => {
    const projected = readJson(dataPath('asterion_question_bank_v1.json'));
    const routing = readJson(dataPath('question_bank.topic_routing.v1.json'));
    const questions = normalizeQuestionBank(projected, {}, routing).filter(isP3Question);
    const sample = questions[0];

    expect(questions).toHaveLength(396);
    expect(questions.every(isP3Question)).toBe(true);
    expect(sample).toMatchObject({
      id: expect.any(String),
      paperFamily: 'p3',
      displayTopic: expect.any(String),
      topicRouting: expect.any(Object),
      questionImageRawPaths: expect.any(Array),
      markSchemeImageRawPaths: expect.any(Array),
      questionImageCandidates: expect.any(Array),
      markSchemeImageCandidates: expect.any(Array),
      raw: {
        local: expect.any(Object),
      },
    });
  });

  it('keeps the raw bank available as a smaller audit fallback than the app projection', () => {
    const projectedBytes = statSync(dataPath('asterion_question_bank_v1.json')).size;
    const rawBytes = statSync(dataPath('question_bank.json')).size;

    expect(rawBytes).toBeLessThan(projectedBytes);
  });
});
