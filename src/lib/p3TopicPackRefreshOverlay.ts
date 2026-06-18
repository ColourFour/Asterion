import topicPackRefreshOverlay from '../data/p3_exam_training_topic_pack_refresh_2026_06_16.json';

type UnknownRecord = Record<string, unknown>;

interface RuntimeQuestionBank extends UnknownRecord {
  questions?: UnknownRecord[];
  components?: UnknownRecord[];
  courses?: UnknownRecord[];
}

interface TopicRoutingSidecar extends UnknownRecord {
  records?: Record<string, UnknownRecord>;
}

interface TopicPackRefreshOverlay {
  schema_name?: string;
  schema_version?: number;
  promoted_question_ids?: string[];
  questions?: UnknownRecord[];
  routing_records?: Record<string, UnknownRecord>;
}

export interface AppliedTopicPackRefresh {
  questionBank: RuntimeQuestionBank;
  topicRouting: TopicRoutingSidecar;
  overlay: TopicPackRefreshOverlay;
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : undefined;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function loadP3TopicPackRefreshOverlay(): TopicPackRefreshOverlay {
  const overlay = asRecord(topicPackRefreshOverlay);
  if (!overlay) throw new Error('Invalid P3 topic-pack refresh overlay.');
  return overlay as TopicPackRefreshOverlay;
}

function updateRuntimeMetadata(questionBank: RuntimeQuestionBank): void {
  const questions = Array.isArray(questionBank.questions) ? questionBank.questions : [];
  questionBank.record_count = questions.length;

  const p3SafeCount = questions.filter((question) => (
    question.course_id === 'p3'
    && question.paper_family === 'p3'
    && question.student_runtime_safe === true
    && question.review_status === 'reviewed'
  )).length;

  for (const component of questionBank.components ?? []) {
    if (component.course_id === 'p3') component.student_runtime_safe_record_count = p3SafeCount;
  }
  for (const course of questionBank.courses ?? []) {
    if (course.course_id === 'p3') course.student_runtime_safe_record_count = p3SafeCount;
  }
}

export function applyP3TopicPackRefreshOverlay(
  questionBankInput: unknown,
  topicRoutingInput: unknown,
): AppliedTopicPackRefresh {
  const overlay = loadP3TopicPackRefreshOverlay();
  const questionBank = deepClone(asRecord(questionBankInput) ?? {}) as RuntimeQuestionBank;
  const topicRouting = deepClone(asRecord(topicRoutingInput) ?? {}) as TopicRoutingSidecar;
  const overlayQuestions = Array.isArray(overlay.questions) ? overlay.questions : [];
  const overlayRoutingRecords = asRecord(overlay.routing_records) ?? {};

  questionBank.questions = Array.isArray(questionBank.questions) ? questionBank.questions : [];
  topicRouting.records = (asRecord(topicRouting.records) as Record<string, UnknownRecord> | undefined) ?? {};

  for (const promotedQuestion of overlayQuestions) {
    const questionId = stringValue(promotedQuestion.question_id);
    if (!questionId) throw new Error('P3 topic-pack refresh overlay contains a question without question_id.');

    const nextQuestion = deepClone(promotedQuestion);
    const existingIndex = questionBank.questions.findIndex((question) => question.question_id === questionId);
    if (existingIndex >= 0) questionBank.questions[existingIndex] = nextQuestion;
    else questionBank.questions.push(nextQuestion);
  }

  for (const [questionId, routingRecord] of Object.entries(overlayRoutingRecords)) {
    const route = asRecord(routingRecord);
    if (!route) throw new Error(`P3 topic-pack refresh overlay contains invalid routing for ${questionId}.`);
    topicRouting.records[questionId] = deepClone(route);
  }

  questionBank.questions.sort((left, right) => String(left.question_id).localeCompare(String(right.question_id)));
  updateRuntimeMetadata(questionBank);

  return { questionBank, topicRouting, overlay };
}
