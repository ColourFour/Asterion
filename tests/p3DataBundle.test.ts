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
  it('keeps the all-course catalog aligned with the raw bank and runtime-safe projection', () => {
    const raw = readJson(dataPath('question_bank.json')) as { questions: Array<Record<string, unknown>> };
    const catalog = readJson(dataPath('asterion_exam_bank_catalog_v1.json')) as {
      record_count: number;
      courses: Array<{ course_id: string; record_count: number; student_runtime_safe_record_count: number }>;
      questions: Array<Record<string, unknown>>;
    };
    const projected = readJson(dataPath('asterion_question_bank_v1.json')) as {
      record_count: number;
      source_record_count: number;
      questions: Array<Record<string, unknown>>;
    };
    const rawIds = raw.questions
      .map((question) => question.question_id);
    const catalogIds = catalog.questions.map((question) => question.question_id);
    const projectedIds = projected.questions.map((question) => question.question_id);
    const runtimeSafeCatalogIds = catalog.questions
      .filter((question) => question.student_runtime_safe === true && question.review_status === 'reviewed')
      .map((question) => question.question_id);
    const p3Ids = projected.questions
      .filter((question) => question.paper_family === 'p3')
      .map((question) => question.question_id);

    expect(catalog.record_count).toBe(raw.questions.length);
    expect(catalogIds).toEqual(rawIds);
    expect(catalog.courses.map((course) => [course.course_id, course.record_count, course.student_runtime_safe_record_count])).toEqual([
      ['p1', 401, 0],
      ['p3', 396, 57],
      ['m1', 258, 0],
      ['s1', 246, 0],
    ]);
    expect(projected.source_record_count).toBe(catalog.record_count);
    expect(projected.record_count).toBe(projected.questions.length);
    expect(projectedIds).toEqual(runtimeSafeCatalogIds);
    expect(p3Ids).toHaveLength(57);
  });

  it('keeps the topic-routing records aligned with the full all-course catalog', () => {
    const catalog = readJson(dataPath('asterion_exam_bank_catalog_v1.json')) as { questions: Array<Record<string, unknown>> };
    const routing = readJson(dataPath('question_bank.topic_routing.v1.json')) as { record_count: number; records: Record<string, unknown> };
    const catalogIds = new Set(catalog.questions.map((question) => String(question.question_id)));
    const routingIds = Object.keys(routing.records);

    expect(routing.record_count).toBe(catalog.questions.length);
    expect(routingIds.every((id) => catalogIds.has(id))).toBe(true);
    expect(new Set(Object.values(routing.records).map((record) => String((record as { paper_family?: string }).paper_family)))).toEqual(new Set([
      'p1',
      'p3',
      'p4',
      'p5',
    ]));
  });

  it('normalizes reviewed runtime records and routing to the component-facing P3 shape', () => {
    const projected = readJson(dataPath('asterion_question_bank_v1.json'));
    const routing = readJson(dataPath('question_bank.topic_routing.v1.json'));
    const questions = normalizeQuestionBank(projected, {}, routing).filter(isP3Question);
    const sample = questions[0];

    expect(questions).toHaveLength(57);
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

  it('keeps the full catalog as the large audit source and the app projection as the reviewed runtime subset', () => {
    const catalogBytes = statSync(dataPath('asterion_exam_bank_catalog_v1.json')).size;
    const projectedBytes = statSync(dataPath('asterion_question_bank_v1.json')).size;
    const rawBytes = statSync(dataPath('question_bank.json')).size;

    expect(projectedBytes).toBeLessThan(rawBytes);
    expect(rawBytes).toBeLessThan(catalogBytes);
  });
});
