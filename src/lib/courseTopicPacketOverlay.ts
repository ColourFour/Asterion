type UnknownRecord = Record<string, unknown>;

interface RuntimeQuestionBank extends UnknownRecord {
  questions?: UnknownRecord[];
  components?: UnknownRecord[];
  courses?: UnknownRecord[];
}

interface TopicRoutingSidecar extends UnknownRecord {
  records?: Record<string, UnknownRecord>;
}

export interface CourseTopicPacketOverlay extends UnknownRecord {
  schema_name?: string;
  schema_version?: number;
  course_id?: string;
  paper_family?: string;
  promoted_question_ids?: string[];
  questions?: UnknownRecord[];
  routing_records?: Record<string, UnknownRecord>;
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : undefined;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function applyCourseTopicPacketOverlay(
  questionBankInput: unknown,
  topicRoutingInput: unknown,
  overlayInput: unknown,
): { questionBank: RuntimeQuestionBank; topicRouting: TopicRoutingSidecar } {
  const overlay = asRecord(overlayInput) as CourseTopicPacketOverlay | undefined;
  if (!overlay || overlay.schema_name !== 'asterion.course_topic_packet_promotion_overlay') {
    throw new Error('Invalid course topic-packet promotion overlay.');
  }
  if (overlay.schema_version !== 1) throw new Error('Unsupported course topic-packet promotion overlay schema version.');
  const courseId = stringValue(overlay.course_id);
  const paperFamily = stringValue(overlay.paper_family);
  if (!courseId || !paperFamily) throw new Error('Course topic-packet overlay is missing course identity.');

  const questionBank = clone(asRecord(questionBankInput) ?? {}) as RuntimeQuestionBank;
  const topicRouting = clone(asRecord(topicRoutingInput) ?? {}) as TopicRoutingSidecar;
  questionBank.questions = Array.isArray(questionBank.questions) ? questionBank.questions : [];
  topicRouting.records = (asRecord(topicRouting.records) as Record<string, UnknownRecord> | undefined) ?? {};
  const existingIds = new Set<string>();
  for (const question of questionBank.questions) {
    const questionId = stringValue(question.question_id);
    if (!questionId) continue;
    if (existingIds.has(questionId)) throw new Error(`Question-bank ID collision: ${questionId}.`);
    existingIds.add(questionId);
  }

  const overlayQuestions = overlay.questions ?? [];
  const overlayQuestionIds = overlayQuestions.map((question) => stringValue(question.question_id));
  if (overlayQuestionIds.some((questionId) => !questionId)) {
    throw new Error('Course topic-packet overlay question is missing question_id.');
  }
  if (new Set(overlayQuestionIds).size !== overlayQuestionIds.length) {
    throw new Error('Course topic-packet overlay contains a question ID collision.');
  }
  const promotedQuestionIds = overlay.promoted_question_ids ?? [];
  if (new Set(promotedQuestionIds).size !== promotedQuestionIds.length) {
    throw new Error('Course topic-packet overlay promoted_question_ids contains a collision.');
  }
  const expectedPromotedIds = [...overlayQuestionIds].sort();
  if (JSON.stringify([...promotedQuestionIds].sort()) !== JSON.stringify(expectedPromotedIds)) {
    throw new Error('Course topic-packet overlay promoted_question_ids does not match its questions.');
  }
  const routingIds = Object.keys(overlay.routing_records ?? {}).sort();
  if (JSON.stringify(routingIds) !== JSON.stringify(expectedPromotedIds)) {
    throw new Error('Course topic-packet overlay routing must match every promoted question exactly.');
  }

  for (const question of overlayQuestions) {
    const questionId = stringValue(question.question_id);
    if (!questionId) throw new Error('Course topic-packet overlay question is missing question_id.');
    if (question.course_id !== courseId || question.paper_family !== paperFamily) {
      throw new Error(`${questionId} does not match overlay course identity.`);
    }
    if (question.review_status !== 'reviewed' || question.student_runtime_safe !== true) {
      throw new Error(`${questionId} is not explicitly reviewed and runtime-safe.`);
    }
    if (!stringValue(question.topic_id)) throw new Error(`${questionId} has no reviewed topic identity.`);
    const provenance = asRecord(question.asterion_import);
    if (!provenance || provenance.promotion_basis !== 'explicit-asterion-human-review') {
      throw new Error(`${questionId} has no explicit Asterion review provenance.`);
    }
    const index = questionBank.questions.findIndex((candidate) => candidate.question_id === questionId);
    if (index >= 0) questionBank.questions[index] = clone(question);
    else questionBank.questions.push(clone(question));
  }

  for (const [questionId, routingRecord] of Object.entries(overlay.routing_records ?? {})) {
    const route = asRecord(routingRecord);
    if (!route || route.route_approved !== true || route.review_required === true) {
      throw new Error(`${questionId} overlay routing is not approved.`);
    }
    if (!stringValue(route.primary_topic_id) || !stringValue(route.mapped_region_id)) {
      throw new Error(`${questionId} overlay routing lacks explicit topic and region evidence.`);
    }
    if (!Array.isArray(route.reviewed_skill_ids) || route.reviewed_skill_ids.length === 0) {
      throw new Error(`${questionId} overlay routing lacks reviewed atomic-skill evidence.`);
    }
    topicRouting.records[questionId] = clone(route);
  }

  questionBank.questions.sort((left, right) => String(left.question_id).localeCompare(String(right.question_id)));
  questionBank.record_count = questionBank.questions.length;
  const safeCount = questionBank.questions.filter((question) => (
    question.course_id === courseId
    && question.paper_family === paperFamily
    && question.review_status === 'reviewed'
    && question.student_runtime_safe === true
  )).length;
  for (const component of questionBank.components ?? []) {
    if (component.course_id === courseId) component.student_runtime_safe_record_count = safeCount;
  }
  for (const course of questionBank.courses ?? []) {
    if (course.course_id === courseId) course.student_runtime_safe_record_count = safeCount;
  }
  return { questionBank, topicRouting };
}
