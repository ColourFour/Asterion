import type {
  Attempt,
  AttemptPartScore,
  KnowledgeEvidenceSource,
  KnowledgeSkillNode,
  P3ErrorLogEntry,
  P3ErrorLogErrorType,
  P3ErrorSeverity,
  P3PathErrorType,
  P3PathRedoQueueItem,
  P3StudentAnalyticsState,
  P3TopicAssessmentBreakdown,
  P3TopicMarkKey,
  P3TopicPerformanceStats,
  SkillCheckAttemptRecord,
  StudyCourseId,
} from '../types';
import {
  knowledgeErrorTypeFromTags,
  normalizeKnowledgeErrors,
  normalizeKnowledgeInterventions,
  normalizeKnowledgeSchedules,
  normalizeKnowledgeSkillStateGraph,
  normalizeKnowledgeStateUpdates,
  transformErrorToKnowledgeState,
  updateLatestKnowledgeErrorTypeFromTags,
  type KnowledgeAttemptEvidence,
  type KnowledgeMarkPointEvidence,
} from './errorKnowledgeState';

export const P3_TOPIC_MARK_KEYS: P3TopicMarkKey[] = [
  'algebra',
  'logs_exp',
  'trigonometry',
  'differentiation',
  'integration',
  'vectors',
  'complex_numbers',
  'differential_equations',
  'numerical_methods',
];

const REDO_DELAY_MS = 48 * 60 * 60 * 1000;
const REDO_COMPLETION_WEIGHT = 1.5;

export interface StudentAnalyticsProgressShape extends Partial<P3StudentAnalyticsState> {
  [key: string]: unknown;
}

export interface TopicBreakdownQuestionInput {
  question_id: string;
  unit?: string;
  topic?: string;
  regionId?: string;
  mappedRegionId?: string;
  primaryTopicId?: string;
  skillRef?: string;
  skillNodeIds?: string[];
  skillNodes?: KnowledgeSkillNode[];
  markPoints?: KnowledgeMarkPointEvidence[];
  representation?: string;
  canonicalDeviation?: string;
  marksEarned?: number;
  marksAvailable?: number;
  scoreLost?: number;
}

export interface ComputeTopicBreakdownInput {
  assessment_id: string;
  unit?: string;
  questions: TopicBreakdownQuestionInput[];
}

export interface GenerateErrorLogEntryInput {
  id?: string;
  student_id?: string;
  unit?: string;
  topic?: string;
  question_id: string;
  error_type?: P3ErrorLogErrorType | string;
  timestamp?: number;
  severity?: P3ErrorSeverity;
  original_score_lost?: number;
}

export type StudentPerformanceAssessmentSource =
  | 'checked_practice'
  | 'exam_training'
  | 'mini_check'
  | 'exam_strip'
  | 'mock';

export interface StudentPerformanceAssessmentInput {
  kind: 'assessment';
  course?: StudyCourseId;
  assessment_id: string;
  student_id?: string;
  source: StudentPerformanceAssessmentSource;
  unit?: string;
  timestamp?: number;
  finalAnswer?: string;
  workingSteps?: string[];
  timeTakenSeconds?: number;
  editCount?: number;
  attemptNumber?: number;
  usedHint?: boolean;
  revealedAnswer?: boolean;
  questions: Array<TopicBreakdownQuestionInput & {
    error_type?: P3ErrorLogErrorType | string;
    mistakeTags?: string[];
  }>;
}

export interface StudentPerformanceRedoInput {
  kind: 'redo_completion';
  error_log_id: string;
  completed_at?: number;
  redo_success: boolean;
  marks_repaired?: number;
}

export type UpdateStudentPerformanceInput = StudentPerformanceAssessmentInput | StudentPerformanceRedoInput;

export function errorTypeFromTags(tags: string[] = []): P3ErrorLogErrorType {
  const normalized = tags.map((tag) => tag.toLowerCase());
  if (normalized.some((tag) => tag.includes('algebra') || tag.includes('sign error') || tag.includes('coefficient') || tag.includes('forgot constant'))) {
    return 'ALGEBRA_ERROR';
  }
  if (normalized.some((tag) => tag.includes('notation'))) return 'NOTATION_ERROR';
  if (normalized.some((tag) => tag.includes('calculator'))) return 'CALCULATOR_ERROR';
  if (normalized.some((tag) => tag.includes('time') || tag.includes('slow'))) return 'TIME_ERROR';
  if (normalized.some((tag) => tag.includes('careless') || tag.includes('misread'))) return 'CARELESS_ERROR';
  if (normalized.some((tag) => tag.includes('concept') || tag.includes('wrong identity') || tag.includes('domain'))) return 'CONCEPT_ERROR';
  return 'METHOD_ERROR';
}

export function normalizeErrorType(value: P3ErrorLogErrorType | string | undefined, tags: string[] = []): P3ErrorLogErrorType {
  if (value && isP3ErrorType(value)) return value;
  return errorTypeFromTags(tags);
}

export function topicKeyFromMetadata(input: {
  topic?: string;
  unit?: string;
  regionId?: string;
  mappedRegionId?: string;
  primaryTopicId?: string;
}): P3TopicMarkKey {
  const candidates = [
    input.regionId,
    input.mappedRegionId,
    input.primaryTopicId,
    input.unit,
    input.topic,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  for (const candidate of candidates) {
    const normalized = normalizeTopicCandidate(candidate);
    if (normalized.includes('logarith') || normalized.includes('exponential') || normalized === 'logs_exp') return 'logs_exp';
    if (normalized.includes('trig')) return 'trigonometry';
    if (normalized.includes('differential_equation')) return 'differential_equations';
    if (normalized.includes('differentiat')) return 'differentiation';
    if (normalized.includes('integrat')) return 'integration';
    if (normalized.includes('vector')) return 'vectors';
    if (normalized.includes('complex')) return 'complex_numbers';
    if (normalized.includes('numerical') || normalized.includes('iteration')) return 'numerical_methods';
    if (normalized.includes('algebra') || normalized.includes('polynomial') || normalized.includes('binomial') || normalized.includes('partial_fraction')) return 'algebra';
  }

  return 'algebra';
}

export function computeTopicBreakdown(input: ComputeTopicBreakdownInput): P3TopicAssessmentBreakdown {
  const topic_scores = emptyTopicScores();
  let totalScore = 0;
  let totalLost = 0;

  for (const question of input.questions) {
    const topicKey = topicKeyFromMetadata(question);
    const marksAvailable = finiteNonNegative(question.marksAvailable);
    const marksEarned = finiteNonNegative(question.marksEarned);
    const scoreLost = typeof question.scoreLost === 'number' && Number.isFinite(question.scoreLost)
      ? Math.max(0, question.scoreLost)
      : Math.max(0, marksAvailable - marksEarned);
    topic_scores[topicKey].score_lost += scoreLost;
    topic_scores[topicKey].questions += 1;
    totalScore += marksEarned;
    totalLost += scoreLost;
  }

  return {
    assessment_id: input.assessment_id,
    unit: input.unit ?? input.questions[0]?.unit ?? '',
    topic_scores,
    total_score: roundMetric(totalScore),
    total_marks_lost: roundMetric(totalLost),
  };
}

export function generateErrorLogEntry(input: GenerateErrorLogEntryInput): P3ErrorLogEntry {
  const timestamp = Number.isFinite(input.timestamp) ? Number(input.timestamp) : Date.now();
  const scoreLost = Math.max(0, finiteNonNegative(input.original_score_lost));
  const errorType = normalizeErrorType(input.error_type);
  return {
    id: input.id ?? createStableId('err', input.question_id, timestamp),
    student_id: input.student_id ?? 'local-static-student',
    unit: input.unit ?? input.topic ?? '',
    topic: input.topic ?? input.unit ?? '',
    question_id: input.question_id,
    error_type: errorType,
    timestamp,
    severity: input.severity ?? severityForScoreLost(scoreLost),
    original_score_lost: roundMetric(scoreLost),
    redo_available_at: timestamp + REDO_DELAY_MS,
    redo_completed: false,
    redo_success: false,
  };
}

export function updateStudentPerformanceState<T extends StudentAnalyticsProgressShape>(
  progress: T,
  input: UpdateStudentPerformanceInput,
): T & P3StudentAnalyticsState {
  const next = normalizeStudentAnalyticsState(progress) as T & P3StudentAnalyticsState;

  if (input.kind === 'redo_completion') {
    return applyRedoCompletion(next, input);
  }

  // This reducer is the legacy P3 analytics model. P1 attempt records are kept
  // in their course-scoped stores, but must not be folded into P3 topic/error state.
  if (input.course === 'p1') return refreshDerivedAnalytics(next);

  const timestamp = Number.isFinite(input.timestamp) ? Number(input.timestamp) : Date.now();
  const breakdown = computeTopicBreakdown({
    assessment_id: input.assessment_id,
    unit: input.unit,
    questions: input.questions,
  });
  next.topic_assessments = [...(next.topic_assessments ?? []), breakdown];

  for (const question of input.questions) {
    const marksAvailable = finiteNonNegative(question.marksAvailable);
    const marksEarned = finiteNonNegative(question.marksEarned);
    const scoreLost = typeof question.scoreLost === 'number' && Number.isFinite(question.scoreLost)
      ? Math.max(0, question.scoreLost)
      : Math.max(0, marksAvailable - marksEarned);
    const topic = topicKeyFromMetadata(question);
    recordTopicPerformance(next, topic, {
      assessmentId: input.assessment_id,
      timestamp,
      source: input.source,
      scoreLost,
      questions: 1,
      marksAvailable,
      marksEarned,
      redoMarksRepaired: 0,
    });

    if (scoreLost <= 0) continue;

    const error = generateErrorLogEntry({
      student_id: input.student_id,
      unit: question.unit ?? input.unit ?? topic,
      topic,
      question_id: question.question_id,
      error_type: normalizeErrorType(question.error_type, question.mistakeTags),
      timestamp,
      original_score_lost: scoreLost,
    });
    next.error_log.push(error);
    next.redo_queue.push(redoItemForError(error));
  }

  applyKnowledgeAssessment(next, input, timestamp);
  return refreshDerivedAnalytics(next);
}

export function assessmentFromExamAttempt(attempt: Attempt, studentId = 'local-static-student'): StudentPerformanceAssessmentInput {
  const timestamp = Date.parse(attempt.attemptedAt);
  const questions = attempt.partScores?.length
    ? attempt.partScores.map((part) => questionInputFromAttemptPart(attempt, part))
    : [{
      question_id: attempt.questionId,
      unit: attempt.validatedRegionId ?? attempt.displayRegionId ?? attempt.topicDisplayName,
      topic: attempt.topicDisplayName,
      regionId: attempt.validatedRegionId ?? attempt.displayRegionId,
      skillNodeIds: [
        attempt.validatedRegionId,
        attempt.displayRegionId,
        attempt.topicDisplayName,
      ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
      skillNodes: [{
        id: attempt.validatedRegionId ?? attempt.displayRegionId ?? attempt.topicDisplayName,
        label: attempt.topicDisplayName,
        course: 'p3',
        regionId: attempt.validatedRegionId ?? attempt.displayRegionId,
        source: attempt.validatedRegionId || attempt.displayRegionId ? 'topic_route' as const : 'fallback_region' as const,
      }],
      marksEarned: attempt.marksEarned,
      marksAvailable: attempt.marksAvailable ?? attempt.marksEarned,
      scoreLost: Math.max(0, finiteNonNegative(attempt.marksAvailable) - finiteNonNegative(attempt.marksEarned)),
      error_type: normalizeErrorType(attempt.mistakeType),
      mistakeTags: attempt.mistakeTypes,
    }];

  return {
    kind: 'assessment',
    course: attempt.course === 'p1' ? 'p1' : 'p3',
    assessment_id: attempt.id,
    student_id: studentId,
    source: 'exam_training',
    unit: attempt.validatedRegionId ?? attempt.displayRegionId ?? attempt.topicDisplayName,
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    timeTakenSeconds: attempt.timeSpentSeconds,
    revealedAnswer: attempt.answerRevealedBeforeMarking,
    questions,
  };
}

export function assessmentFromSkillCheckAttempt(attempt: SkillCheckAttemptRecord, studentId = 'local-static-student'): StudentPerformanceAssessmentInput {
  const timestamp = Date.parse(attempt.timestamp);
  return {
    kind: 'assessment',
    course: attempt.course,
    assessment_id: attempt.attemptId,
    student_id: studentId,
    source: 'checked_practice',
    unit: attempt.regionId ?? attempt.topic,
    timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
    finalAnswer: attempt.submittedAnswer,
    usedHint: attempt.usedHint,
    revealedAnswer: attempt.revealedAnswer || attempt.revealedRepairStep,
    questions: [{
      question_id: attempt.checkId,
      unit: attempt.regionId ?? attempt.topic,
      topic: attempt.topic,
      regionId: attempt.regionId,
      skillRef: attempt.skillId,
      skillNodeIds: [attempt.skillId],
      skillNodes: [{
        id: attempt.skillId,
        label: attempt.topic,
        course: attempt.course,
        regionId: attempt.regionId,
        source: 'skill_check',
      }],
      markPoints: [{
        id: attempt.checkId,
        label: attempt.topic,
        gained: attempt.isCorrect,
        marks: 1,
        skillNodeIds: [attempt.skillId],
        errorType: knowledgeErrorTypeFromTags(attempt.mistakeTags),
        evidenceStrength: 0.85,
      }],
      marksEarned: attempt.isCorrect ? 1 : 0,
      marksAvailable: 1,
      scoreLost: attempt.isCorrect ? 0 : 1,
      error_type: normalizeErrorType(undefined, attempt.mistakeTags),
      mistakeTags: attempt.mistakeTags,
    }],
  };
}

export function refreshDerivedAnalytics<T extends StudentAnalyticsProgressShape>(progress: T): T & P3StudentAnalyticsState {
  const next = normalizeStudentAnalyticsState(progress) as T & P3StudentAnalyticsState;
  const topicEntries = Object.entries(next.topic_performance);

  next.weak_topics = topicEntries
    .filter(([, stats]) => stats.score_lost > 0)
    .sort((a, b) => b[1].score_lost - a[1].score_lost || a[0].localeCompare(b[0]))
    .map(([topic]) => topic);

  const errorCounts = next.error_log.reduce<Partial<Record<P3ErrorLogErrorType, number>>>((counts, entry) => {
    counts[entry.error_type] = (counts[entry.error_type] ?? 0) + 1;
    return counts;
  }, {});
  const errorTotal = next.error_log.length || 1;
  next.error_distribution = Object.fromEntries(
    Object.entries(errorCounts).map(([type, count]) => [type, roundMetric((count / errorTotal) * 100)]),
  ) as Partial<Record<P3ErrorLogErrorType, number>>;

  next.priority_repair_topics = topicEntries
    .filter(([, stats]) => stats.score_lost > 0)
    .sort((a, b) => priorityScore(b[1]) - priorityScore(a[1]) || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([topic]) => topic);

  return next;
}

export function normalizeStudentAnalyticsState<T extends StudentAnalyticsProgressShape>(progress: T): T & P3StudentAnalyticsState {
  const next = {
    ...progress,
    error_log: normalizeErrorLog(progress.error_log),
    topic_performance: normalizeTopicPerformance(progress.topic_performance),
    weak_topics: Array.isArray(progress.weak_topics) ? progress.weak_topics.filter(isString) : [],
    redo_queue: normalizeRedoQueue(progress.redo_queue),
    error_distribution: isRecord(progress.error_distribution) ? progress.error_distribution : {},
    priority_repair_topics: Array.isArray(progress.priority_repair_topics) ? progress.priority_repair_topics.filter(isString) : [],
    topic_assessments: Array.isArray(progress.topic_assessments)
      ? progress.topic_assessments.filter(isTopicAssessmentBreakdown)
      : [],
    knowledge_state_graph: normalizeKnowledgeSkillStateGraph(progress.knowledge_state_graph),
    knowledge_state_updates: normalizeKnowledgeStateUpdates(progress.knowledge_state_updates),
    knowledge_errors: normalizeKnowledgeErrors(progress.knowledge_errors),
    knowledge_interventions: normalizeKnowledgeInterventions(progress.knowledge_interventions),
    knowledge_schedules: normalizeKnowledgeSchedules(progress.knowledge_schedules),
  } as T & P3StudentAnalyticsState;
  return next;
}

export function updateErrorClassificationFromTags<T extends StudentAnalyticsProgressShape>(
  progress: T,
  questionId: string,
  tags: string[],
): T & P3StudentAnalyticsState {
  const next = normalizeStudentAnalyticsState(progress) as T & P3StudentAnalyticsState;
  const index = next.error_log.map((entry) => entry.question_id).lastIndexOf(questionId);
  if (index < 0) return refreshDerivedAnalytics(next);
  const errorType = errorTypeFromTags(tags);
  next.error_log[index] = {
    ...next.error_log[index],
    error_type: errorType,
  };
  next.redo_queue = next.redo_queue.map((item) => (
    item.error_log_id === next.error_log[index].id || item.question_id === questionId
      ? { ...item, error_type: pathErrorType(errorType), error_type_detail: errorType }
      : item
  ));
  const knowledgeUpdate = updateLatestKnowledgeErrorTypeFromTags(
    next.knowledge_errors,
    next.knowledge_state_graph,
    questionId,
    tags,
  );
  next.knowledge_errors = knowledgeUpdate.errors;
  next.knowledge_state_graph = knowledgeUpdate.graph;
  return refreshDerivedAnalytics(next);
}

function questionInputFromAttemptPart(attempt: Attempt, part: AttemptPartScore): TopicBreakdownQuestionInput & { error_type?: P3ErrorLogErrorType | string; mistakeTags?: string[] } {
  const partQuestionId = [attempt.questionId, part.partId, part.subpartId, part.label]
    .filter(Boolean)
    .join(':');
  return {
    question_id: partQuestionId || attempt.questionId,
    unit: part.mappedRegionId ?? attempt.validatedRegionId ?? attempt.displayRegionId ?? attempt.topicDisplayName,
    topic: attempt.topicDisplayName,
    regionId: part.mappedRegionId ?? attempt.validatedRegionId ?? attempt.displayRegionId,
    mappedRegionId: part.mappedRegionId,
    primaryTopicId: part.primaryTopicId,
    skillRef: part.skillRef,
    skillNodeIds: skillNodeIdsForAttemptPart(attempt, part),
    skillNodes: skillNodesForAttemptPart(attempt, part),
    markPoints: markPointEvidenceForAttemptPart(attempt, part),
    marksEarned: part.marksEarned,
    marksAvailable: part.marksAvailable,
    scoreLost: Math.max(0, finiteNonNegative(part.marksAvailable) - finiteNonNegative(part.marksEarned)),
    error_type: normalizeErrorType(attempt.mistakeType, attempt.mistakeTypes),
    mistakeTags: attempt.mistakeTypes,
  };
}

function skillNodeIdsForAttemptPart(attempt: Attempt, part: AttemptPartScore): string[] {
  return Array.from(new Set([
    part.skillRef,
    part.primaryTopicId,
    part.mappedRegionId,
    attempt.validatedRegionId,
    attempt.displayRegionId,
    attempt.topicDisplayName,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));
}

function skillNodesForAttemptPart(attempt: Attempt, part: AttemptPartScore): KnowledgeSkillNode[] {
  return skillNodeIdsForAttemptPart(attempt, part).map((id) => ({
    id,
    label: attempt.topicDisplayName,
    course: 'p3',
    topicId: part.primaryTopicId,
    regionId: part.mappedRegionId ?? attempt.validatedRegionId ?? attempt.displayRegionId,
    source: part.skillRef === id
      ? 'reviewed_skill_map'
      : part.primaryTopicId === id
        ? 'topic_route'
        : part.mappedRegionId === id || attempt.validatedRegionId === id || attempt.displayRegionId === id
          ? 'exam_part'
          : 'fallback_region',
  }));
}

function markPointEvidenceForAttemptPart(attempt: Attempt, part: AttemptPartScore): KnowledgeMarkPointEvidence[] {
  const availableIds = part.markPointIdsAvailable ?? [];
  if (!availableIds.length) return [];
  const gainedIds = new Set(part.markPointIds ?? []);
  const skillNodeIds = skillNodeIdsForAttemptPart(attempt, part);
  return availableIds.map((id) => ({
    id,
    label: part.markPointLabels?.[id] ?? part.label,
    gained: gainedIds.has(id),
    marks: 1,
    skillNodeIds,
    errorType: knowledgeErrorTypeFromTags(attempt.mistakeTypes, attempt.mistakeType),
    evidenceStrength: 0.8,
  }));
}

function applyKnowledgeAssessment<T extends StudentAnalyticsProgressShape>(
  state: T & P3StudentAnalyticsState,
  input: StudentPerformanceAssessmentInput,
  timestamp: number,
): void {
  const attempt = knowledgeAttemptFromAssessment(input, timestamp);
  const result = transformErrorToKnowledgeState({
    previousGraph: state.knowledge_state_graph,
    priorErrors: state.knowledge_errors,
    attempt,
  });
  state.knowledge_state_graph = result.skillStateGraph;
  state.knowledge_state_updates = [...state.knowledge_state_updates, ...result.stateUpdates];
  state.knowledge_errors = [...state.knowledge_errors, ...result.errors];
  state.knowledge_interventions = [...state.knowledge_interventions, result.interventionPlan];
  state.knowledge_schedules = [...state.knowledge_schedules, result.schedulingInstruction];
}

function knowledgeAttemptFromAssessment(
  input: StudentPerformanceAssessmentInput,
  timestamp: number,
): KnowledgeAttemptEvidence {
  const questions = input.questions.length ? input.questions : [];
  const skillNodes = mergeSkillNodes(questions.flatMap(skillNodesForAssessmentQuestion));
  const markPoints = questions.flatMap((question) => markPointEvidenceForAssessmentQuestion(question));
  const marksEarned = questions.reduce((sum, question) => sum + finiteNonNegative(question.marksEarned), 0);
  const marksAvailable = questions.reduce((sum, question) => sum + finiteNonNegative(question.marksAvailable), 0);
  const scoreLost = questions.reduce((sum, question) => {
    const marks = finiteNonNegative(question.marksAvailable);
    const earned = finiteNonNegative(question.marksEarned);
    return sum + (typeof question.scoreLost === 'number' && Number.isFinite(question.scoreLost)
      ? Math.max(0, question.scoreLost)
      : Math.max(0, marks - earned));
  }, 0);
  const firstQuestion = questions[0];
  const singleQuestionId = questions.length === 1 ? firstQuestion?.question_id : undefined;

  return {
    attemptId: input.assessment_id,
    source: input.source as KnowledgeEvidenceSource,
    timestamp,
    question: {
      questionId: singleQuestionId ?? input.assessment_id,
      course: 'p3',
      topic: input.unit ?? firstQuestion?.topic,
      regionId: firstQuestion?.regionId,
      primaryTopicId: firstQuestion?.primaryTopicId,
      skillNodes,
      markPoints,
      representation: firstQuestion?.representation,
      canonicalPathId: questions.map((question) => question.primaryTopicId ?? question.regionId).filter(Boolean).join('|') || undefined,
    },
    response: {
      finalAnswer: input.finalAnswer,
      workingSteps: input.workingSteps,
      timeTakenSeconds: input.timeTakenSeconds,
      editCount: input.editCount,
      attemptNumber: input.attemptNumber,
      usedHint: input.usedHint,
      revealedAnswer: input.revealedAnswer,
    },
    evaluation: {
      marksEarned,
      marksAvailable,
      canonicalDeviation: questions.map((question) => question.canonicalDeviation).filter(Boolean).join('|') || undefined,
      timePressure: Boolean(input.timeTakenSeconds && input.timeTakenSeconds > 0 && scoreLost > 0 && input.timeTakenSeconds < 90),
    },
  };
}

function markPointEvidenceForAssessmentQuestion(
  question: TopicBreakdownQuestionInput & { error_type?: P3ErrorLogErrorType | string; mistakeTags?: string[] },
): KnowledgeMarkPointEvidence[] {
  if (question.markPoints?.length) return question.markPoints;
  const marksAvailable = finiteNonNegative(question.marksAvailable);
  const marksEarned = finiteNonNegative(question.marksEarned);
  const scoreLost = typeof question.scoreLost === 'number' && Number.isFinite(question.scoreLost)
    ? Math.max(0, question.scoreLost)
    : Math.max(0, marksAvailable - marksEarned);
  const skillNodeIds = skillNodeIdsForAssessmentQuestion(question);
  const points: KnowledgeMarkPointEvidence[] = [];
  if (marksEarned > 0) {
    points.push({
      id: `${question.question_id}:earned`,
      label: 'Self-marked gained evidence',
      gained: true,
      marks: marksEarned,
      skillNodeIds,
      representation: question.representation,
      evidenceStrength: 0.55,
    });
  }
  for (let index = 0; index < Math.max(0, Math.round(scoreLost)); index += 1) {
    points.push({
      id: `${question.question_id}:missed:${index + 1}`,
      label: 'Self-marked missed evidence',
      gained: false,
      marks: 1,
      skillNodeIds,
      errorType: knowledgeErrorTypeFromTags(question.mistakeTags, question.error_type),
      representation: question.representation,
      deviationFromCanonical: question.canonicalDeviation,
      evidenceStrength: 0.45,
    });
  }
  return points;
}

function skillNodesForAssessmentQuestion(question: TopicBreakdownQuestionInput): KnowledgeSkillNode[] {
  if (question.skillNodes?.length) return question.skillNodes;
  const skillNodeIds = skillNodeIdsForAssessmentQuestion(question);
  return skillNodeIds.map((id) => ({
    id,
    label: question.topic ?? question.unit,
    course: 'p3',
    topicId: question.primaryTopicId,
    regionId: question.mappedRegionId ?? question.regionId,
    source: question.skillRef === id
      ? 'reviewed_skill_map'
      : question.primaryTopicId === id
        ? 'topic_route'
        : 'exam_part',
  }));
}

function skillNodeIdsForAssessmentQuestion(question: TopicBreakdownQuestionInput): string[] {
  const ids = [
    ...(question.skillNodeIds ?? []),
    question.skillRef,
    question.primaryTopicId,
    question.mappedRegionId,
    question.regionId,
    question.unit,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return Array.from(new Set(ids));
}

function mergeSkillNodes(nodes: KnowledgeSkillNode[]): KnowledgeSkillNode[] {
  const byId = new Map<string, KnowledgeSkillNode>();
  for (const node of nodes) {
    byId.set(node.id, { ...byId.get(node.id), ...node });
  }
  return Array.from(byId.values());
}

function applyRedoCompletion<T extends StudentAnalyticsProgressShape>(
  progress: T & P3StudentAnalyticsState,
  input: StudentPerformanceRedoInput,
): T & P3StudentAnalyticsState {
  const completedAt = Number.isFinite(input.completed_at) ? Number(input.completed_at) : Date.now();
  const error = progress.error_log.find((entry) => entry.id === input.error_log_id);
  if (!error) return refreshDerivedAnalytics(progress);

  progress.error_log = progress.error_log.map((entry) => (
    entry.id === input.error_log_id
      ? { ...entry, redo_completed: true, redo_success: input.redo_success }
      : entry
  ));
  progress.redo_queue = progress.redo_queue.map((item) => (
    item.error_log_id === input.error_log_id
      ? {
        ...item,
        redo_completed_at: new Date(completedAt).toISOString(),
        redo_success: input.redo_success,
        status: input.redo_success ? 'corrected_full_solution' : 'completed',
      }
      : item
  ));

  const marksRepaired = Math.max(0, finiteNonNegative(input.marks_repaired ?? error.original_score_lost)) * REDO_COMPLETION_WEIGHT;
  recordTopicPerformance(progress, topicKeyFromMetadata(error), {
    assessmentId: `redo:${error.id}`,
    timestamp: completedAt,
    source: 'redo',
    scoreLost: input.redo_success ? 0 : error.original_score_lost,
    questions: 1,
    marksAvailable: error.original_score_lost,
    marksEarned: input.redo_success ? error.original_score_lost : 0,
    redoMarksRepaired: input.redo_success ? marksRepaired : 0,
  });

  return refreshDerivedAnalytics(progress);
}

function recordTopicPerformance(
  state: P3StudentAnalyticsState,
  topic: P3TopicMarkKey,
  record: {
    assessmentId: string;
    timestamp: number;
    source: P3TopicPerformanceStats['history'][number]['source'];
    scoreLost: number;
    questions: number;
    marksAvailable: number;
    marksEarned: number;
    redoMarksRepaired: number;
  },
): void {
  const current = state.topic_performance[topic] ?? emptyTopicPerformance();
  const history = [...current.history, {
    assessment_id: record.assessmentId,
    timestamp: record.timestamp,
    score_lost: roundMetric(record.scoreLost),
    questions: record.questions,
    source: record.source,
  }];
  state.topic_performance[topic] = {
    score_lost: roundMetric(current.score_lost + record.scoreLost),
    questions: current.questions + record.questions,
    attempts: current.attempts + 1,
    marks_available: roundMetric(current.marks_available + record.marksAvailable),
    marks_earned: roundMetric(current.marks_earned + record.marksEarned),
    redo_marks_repaired: roundMetric(current.redo_marks_repaired + record.redoMarksRepaired),
    stability_score: stabilityScore(history),
    history,
  };
}

function redoItemForError(error: P3ErrorLogEntry): P3PathRedoQueueItem {
  return {
    id: createStableId('redo', error.id, error.timestamp),
    error_log_id: error.id,
    question_id: error.question_id,
    error_type: pathErrorType(error.error_type),
    error_type_detail: error.error_type,
    unit: error.unit,
    topic: error.topic,
    original_score_lost: error.original_score_lost,
    missed_at: new Date(error.timestamp).toISOString(),
    redo_available_at: new Date(error.redo_available_at).toISOString(),
    redo_success: false,
    status: 'pending',
  };
}

function pathErrorType(errorType: P3ErrorLogErrorType): P3PathErrorType {
  if (errorType === 'CONCEPT_ERROR') return 'concept';
  if (errorType === 'ALGEBRA_ERROR' || errorType === 'NOTATION_ERROR' || errorType === 'CALCULATOR_ERROR') return 'algebra';
  if (errorType === 'TIME_ERROR') return 'time';
  if (errorType === 'CARELESS_ERROR') return 'careless';
  return 'method';
}

function normalizeTopicCandidate(value: string): string {
  return value
    .replace(/^9709_[a-z0-9]+_topic_/i, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function emptyTopicScores(): Record<P3TopicMarkKey, { score_lost: number; questions: number }> {
  return Object.fromEntries(P3_TOPIC_MARK_KEYS.map((key) => [key, { score_lost: 0, questions: 0 }])) as Record<P3TopicMarkKey, { score_lost: number; questions: number }>;
}

function emptyTopicPerformance(): P3TopicPerformanceStats {
  return {
    score_lost: 0,
    questions: 0,
    attempts: 0,
    marks_available: 0,
    marks_earned: 0,
    redo_marks_repaired: 0,
    stability_score: 100,
    history: [],
  };
}

function severityForScoreLost(scoreLost: number): P3ErrorSeverity {
  if (scoreLost >= 4) return 'HIGH';
  if (scoreLost >= 2) return 'MEDIUM';
  return 'LOW';
}

function stabilityScore(history: P3TopicPerformanceStats['history']): number {
  const rates = history
    .filter((entry) => entry.questions > 0)
    .map((entry) => entry.score_lost / entry.questions);
  if (rates.length < 2) return 100;
  const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  const variance = rates.reduce((sum, rate) => sum + ((rate - mean) ** 2), 0) / rates.length;
  return roundMetric(Math.max(0, 100 - Math.sqrt(variance) * 25));
}

function priorityScore(stats: P3TopicPerformanceStats): number {
  return stats.score_lost + (100 - stats.stability_score) / 10 - stats.redo_marks_repaired / 10;
}

function isP3ErrorType(value: string): value is P3ErrorLogErrorType {
  return [
    'CONCEPT_ERROR',
    'ALGEBRA_ERROR',
    'NOTATION_ERROR',
    'METHOD_ERROR',
    'CALCULATOR_ERROR',
    'TIME_ERROR',
    'CARELESS_ERROR',
  ].includes(value);
}

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function createStableId(prefix: string, seed: string, timestamp: number): string {
  const normalizedSeed = seed.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'item';
  return `${prefix}_${normalizedSeed}_${Math.round(timestamp).toString(36)}`;
}

function normalizeErrorLog(value: unknown): P3ErrorLogEntry[] {
  return Array.isArray(value) ? value.filter(isErrorLogEntry) : [];
}

function normalizeRedoQueue(value: unknown): P3PathRedoQueueItem[] {
  return Array.isArray(value)
    ? value.filter((item): item is P3PathRedoQueueItem => Boolean(item && typeof item === 'object' && typeof (item as P3PathRedoQueueItem).question_id === 'string'))
    : [];
}

function normalizeTopicPerformance(value: unknown): Record<string, P3TopicPerformanceStats> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, P3TopicPerformanceStats] => isTopicPerformanceStats(entry[1])),
  );
}

function isErrorLogEntry(value: unknown): value is P3ErrorLogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<P3ErrorLogEntry>;
  return typeof entry.id === 'string'
    && typeof entry.student_id === 'string'
    && typeof entry.unit === 'string'
    && typeof entry.topic === 'string'
    && typeof entry.question_id === 'string'
    && typeof entry.error_type === 'string'
    && isP3ErrorType(entry.error_type)
    && typeof entry.timestamp === 'number'
    && typeof entry.original_score_lost === 'number'
    && typeof entry.redo_available_at === 'number'
    && typeof entry.redo_completed === 'boolean'
    && typeof entry.redo_success === 'boolean';
}

function isTopicAssessmentBreakdown(value: unknown): value is P3TopicAssessmentBreakdown {
  if (!value || typeof value !== 'object') return false;
  const breakdown = value as Partial<P3TopicAssessmentBreakdown>;
  return typeof breakdown.assessment_id === 'string'
    && typeof breakdown.unit === 'string'
    && isRecord(breakdown.topic_scores)
    && typeof breakdown.total_score === 'number'
    && typeof breakdown.total_marks_lost === 'number';
}

function isTopicPerformanceStats(value: unknown): value is P3TopicPerformanceStats {
  if (!value || typeof value !== 'object') return false;
  const stats = value as Partial<P3TopicPerformanceStats>;
  return typeof stats.score_lost === 'number'
    && typeof stats.questions === 'number'
    && typeof stats.attempts === 'number'
    && typeof stats.marks_available === 'number'
    && typeof stats.marks_earned === 'number'
    && typeof stats.redo_marks_repaired === 'number'
    && typeof stats.stability_score === 'number'
    && Array.isArray(stats.history);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
