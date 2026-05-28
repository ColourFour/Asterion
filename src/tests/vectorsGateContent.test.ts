import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FIELD_GUIDE_TOPICS_BY_REGION } from '../data/fieldGuideTopics';
import {
  VECTORS_GATE_OUT_OF_SCOPE_TERMS,
  VECTORS_GATE_SKILL_PRACTICE_ALIGNMENT,
  VECTORS_GATE_TOPIC_ORDER,
} from '../data/vectorsGateContent';
import { getGeneratedPracticeForRegion, normalizeGeneratedPracticeData } from '../lib/generatedPractice';

const runtimePractice = normalizeGeneratedPracticeData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/generated_practice_bank.json`, 'utf8')),
);

const expectedVectorTitles = [
  'Vector Notation',
  'Magnitude, Unit, Parallel, Equal Vectors',
  'Geometric Addition/Subtraction',
  'Vector Equation of a Straight Line',
  'Intersecting, Parallel, and Skew Lines',
  'Scalar Product',
  'Angle Between Two Lines',
  'Distance From Point to Line',
];

function vectorTopicText(): string {
  return FIELD_GUIDE_TOPICS_BY_REGION['vector-workshop'].flatMap((topic) => [
    topic.id,
    topic.title,
    topic.purpose,
    topic.preview,
    topic.description,
    ...topic.skillIds,
    ...topic.examples.flatMap((example) => [
      example.title,
      example.prompt,
      ...example.workedLines,
      example.patternTitle,
      ...example.patternRows.flatMap((row) => [row.from, row.move, row.to]),
      example.tryPrompt,
      ...example.tryScaffold,
      ...example.takeaway,
      example.result,
    ]),
  ]).join('\n').toLowerCase();
}

describe('Vectors Gate content contract', () => {
  it('exposes the approved Vectors Gate topic IDs in the approved order', () => {
    const topics = FIELD_GUIDE_TOPICS_BY_REGION['vector-workshop'];

    expect(topics.map((topic) => topic.id)).toEqual([...VECTORS_GATE_TOPIC_ORDER]);
    expect(topics.map((topic) => topic.title)).toEqual(expectedVectorTitles);
    expect(topics.every((topic) => topic.examples.length >= 1)).toBe(true);
    expect(topics.flatMap((topic) => topic.skillIds)).toEqual([...VECTORS_GATE_TOPIC_ORDER]);
  });

  it('keeps obvious out-of-region content out of Vectors Gate topic flow', () => {
    const text = vectorTopicText();

    for (const term of VECTORS_GATE_OUT_OF_SCOPE_TERMS) {
      expect(text, term).not.toContain(term);
    }
  });

  it('documents Skill Check coverage or TODOs for every approved Vectors Gate topic', () => {
    const runtimeIds = new Set(runtimePractice.map((item) => item.practiceId));

    expect(VECTORS_GATE_SKILL_PRACTICE_ALIGNMENT.map((item) => item.topicId)).toEqual([...VECTORS_GATE_TOPIC_ORDER]);

    for (const item of VECTORS_GATE_SKILL_PRACTICE_ALIGNMENT) {
      expect(item.candidatePrompt.trim(), item.topicId).not.toBe('');
      expect(item.expectedAnswer.trim(), item.topicId).not.toBe('');
      expect(item.authoringNote.trim(), item.topicId).not.toBe('');
      if (item.status === 'reviewed_runtime') {
        expect(item.reviewedPracticeIds.length, item.topicId).toBeGreaterThan(0);
        for (const practiceId of item.reviewedPracticeIds) {
          expect(runtimeIds.has(practiceId), `${item.topicId}/${practiceId}`).toBe(true);
        }
      }
      if (item.status === 'todo_teacher_review') {
        expect(item.reviewedPracticeIds, item.topicId).toEqual([]);
      }
    }

    expect(VECTORS_GATE_SKILL_PRACTICE_ALIGNMENT.find((item) => item.topicId === 'vectors_point_to_line_distance')?.status)
      .toBe('reviewed_runtime');
  });

  it('has a reviewed runtime Skill Check item for geometric addition/subtraction', () => {
    const vectorPractice = getGeneratedPracticeForRegion(runtimePractice, 'vector-workshop', 'p3');
    const geometricPractice = vectorPractice.find((item) => item.practiceId === 'gen_vectors_line_relationship_basic_0004');

    expect(geometricPractice?.parameters.topic_contract_id).toBe('vectors_geometric_add_subtract');
    expect(geometricPractice?.reviewStatus).toBe('teacher_reviewed');
    expect(geometricPractice?.prompt.toLowerCase()).toContain('ab + bc');
    expect(geometricPractice?.workedSolution.join('\n')).toContain('AC');
  });

  it('has a reviewed runtime Skill Check item for point-to-line distance', () => {
    const vectorPractice = getGeneratedPracticeForRegion(runtimePractice, 'vector-workshop', 'p3');
    const pointLinePractice = vectorPractice.find((item) => item.practiceId === 'gen_vectors_point_to_line_distance_0001');

    expect(pointLinePractice?.parameters.topic_contract_id).toBe('vectors_point_to_line_distance');
    expect(pointLinePractice?.reviewStatus).toBe('teacher_reviewed');
    expect(pointLinePractice?.prompt).toContain('Let Q be a general point');
    expect(pointLinePractice?.workedSolution.join('\n')).toContain('lambda = 8/9');
    expect(pointLinePractice?.workedSolution.join('\n')).toContain('sqrt(17)/3');
  });
});
