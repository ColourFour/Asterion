import { describe, expect, it } from 'vitest';
import { applyCourseTopicPacketOverlay } from '../src/lib/courseTopicPacketOverlay';

function overlay(overrides: Record<string, unknown> = {}) {
  return {
    schema_name: 'asterion.course_topic_packet_promotion_overlay',
    schema_version: 1,
    course_id: 'p1',
    paper_family: 'p1',
    promoted_question_ids: [],
    questions: [],
    routing_records: {},
    ...overrides,
  };
}

function reviewedQuestion() {
  return {
    question_id: '11summer25_q01',
    course_id: 'p1',
    paper_family: 'p1',
    topic_id: '9709_p1_topic_quadratics',
    review_status: 'reviewed',
    student_runtime_safe: true,
    asterion_import: { promotion_basis: 'explicit-asterion-human-review' },
  };
}

function reviewedRoute() {
  return {
    primary_topic_id: '9709_p1_topic_quadratics',
    mapped_region_id: 'quadratics',
    reviewed_skill_ids: ['p1_quad_complete_square'],
    route_approved: true,
    review_required: false,
  };
}

describe('course topic-packet promotion overlay', () => {
  it('accepts an empty launch-gated overlay without changing the bank', () => {
    const result = applyCourseTopicPacketOverlay({ questions: [] }, { records: {} }, overlay());
    expect(result.questionBank.questions).toEqual([]);
    expect(result.topicRouting.records).toEqual({});
  });

  it('promotes only questions with matching reviewed route evidence', () => {
    const question = reviewedQuestion();
    const result = applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      overlay({
        promoted_question_ids: [question.question_id],
        questions: [question],
        routing_records: { [question.question_id]: reviewedRoute() },
      }),
    );
    expect(result.questionBank.questions).toEqual([question]);
    expect(result.topicRouting.records?.[question.question_id]).toMatchObject({ route_approved: true });
  });

  it('fails closed on unsafe records, mismatched routes, and ID collisions', () => {
    const question = reviewedQuestion();
    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      overlay({ promoted_question_ids: [question.question_id], questions: [{ ...question, review_status: 'needs_review' }], routing_records: { [question.question_id]: reviewedRoute() } }),
    )).toThrow(/not explicitly reviewed/i);

    expect(() => applyCourseTopicPacketOverlay(
      { questions: [] },
      { records: {} },
      overlay({ promoted_question_ids: [question.question_id], questions: [question], routing_records: {} }),
    )).toThrow(/routing must match/i);

    expect(() => applyCourseTopicPacketOverlay(
      { questions: [{ question_id: 'duplicate' }, { question_id: 'duplicate' }] },
      { records: {} },
      overlay(),
    )).toThrow(/collision/i);
  });
});
