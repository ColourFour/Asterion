import type {
  KnowledgeDifficultyRelation,
  KnowledgeErrorObject,
  KnowledgeErrorType,
  KnowledgeEvidenceOutcome,
  KnowledgeEvidenceSeverity,
  KnowledgeEvidenceSource,
  KnowledgeFollowUpItemType,
  KnowledgeInterventionAction,
  KnowledgeInterventionPlan,
  KnowledgeMisconceptionSignature,
  KnowledgeRetestTiming,
  KnowledgeSchedulingInstruction,
  KnowledgeSkillCategory,
  KnowledgeSkillNode,
  KnowledgeSkillState,
  KnowledgeSkillStateGraph,
  KnowledgeSkillStateUpdate,
  KnowledgeStabilityFlag,
  MistakeType,
  P3ErrorLogErrorType,
} from '../types';

export interface KnowledgeResponseEvidence {
  finalAnswer?: string;
  workingSteps?: string[];
  timeTakenSeconds?: number;
  editCount?: number;
  attemptNumber?: number;
  usedHint?: boolean;
  revealedAnswer?: boolean;
}

export interface KnowledgeSolutionStep {
  id: string;
  skillNodeIds?: string[];
  expectedAction?: string;
  representation?: string;
}

export interface KnowledgeExpectedSolution {
  canonicalPathId?: string;
  decomposition?: KnowledgeSolutionStep[];
}

export interface KnowledgeMarkPointEvidence {
  id: string;
  label?: string;
  markCode?: string;
  gained: boolean;
  marks?: number;
  skillNodeIds?: string[];
  errorType?: KnowledgeErrorType | P3ErrorLogErrorType | MistakeType | string;
  representation?: string;
  deviationFromCanonical?: string;
  solutionStepId?: string;
  evidenceStrength?: number;
}

export interface KnowledgeQuestionEvidence {
  questionId: string;
  course?: string;
  topic?: string;
  regionId?: string;
  primaryTopicId?: string;
  skillNodes?: KnowledgeSkillNode[];
  skillNodeIds?: string[];
  markPoints?: KnowledgeMarkPointEvidence[];
  expectedSolution?: KnowledgeExpectedSolution;
  representation?: string;
  canonicalPathId?: string;
}

export interface KnowledgeEvaluationEvidence {
  marksEarned: number;
  marksAvailable: number;
  markPointsGained?: string[];
  markPointsLost?: string[];
  canonicalDeviation?: string;
  timePressure?: boolean;
}

export interface KnowledgeAttemptEvidence {
  attemptId: string;
  source: KnowledgeEvidenceSource;
  timestamp?: number | string;
  question: KnowledgeQuestionEvidence;
  response?: KnowledgeResponseEvidence;
  evaluation: KnowledgeEvaluationEvidence;
}

export interface ErrorKnowledgeTransformInput {
  previousGraph?: KnowledgeSkillStateGraph;
  priorErrors?: KnowledgeErrorObject[];
  attempt: KnowledgeAttemptEvidence;
}

export interface ErrorKnowledgeTransformResult {
  skillStateGraph: KnowledgeSkillStateGraph;
  stateUpdates: KnowledgeSkillStateUpdate[];
  errors: KnowledgeErrorObject[];
  interventionPlan: KnowledgeInterventionPlan;
  schedulingInstruction: KnowledgeSchedulingInstruction;
}

interface SkillEvidenceAccumulator {
  skillNode: KnowledgeSkillNode;
  outcome: KnowledgeEvidenceOutcome;
  errors: KnowledgeErrorObject[];
  successWeight: number;
  evidenceStrength: number;
}

const STARTING_SCORE = 50;
const STARTING_CONFIDENCE = 25;
const DELAYED_RETEST_MS = 48 * 60 * 60 * 1000;
const TRANSFER_DELAY_MS = 72 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function emptyKnowledgeSkillStateGraph(timestamp: number | string = Date.now()): KnowledgeSkillStateGraph {
  return {
    schemaVersion: 1,
    updatedAt: isoTimestamp(timestamp),
    skills: {},
    misconceptions: {},
  };
}

export function transformErrorToKnowledgeState(input: ErrorKnowledgeTransformInput): ErrorKnowledgeTransformResult {
  const timestamp = parseTimestamp(input.attempt.timestamp);
  const previousGraph = normalizeKnowledgeSkillStateGraph(input.previousGraph);
  const graph: KnowledgeSkillStateGraph = {
    schemaVersion: 1,
    updatedAt: new Date(timestamp).toISOString(),
    skills: { ...previousGraph.skills },
    misconceptions: { ...previousGraph.misconceptions },
  };
  const priorErrors = normalizeKnowledgeErrors(input.priorErrors);
  const errors = decomposeFailures(input.attempt, graph, priorErrors, timestamp);
  applyMisconceptionSignatures(errors, priorErrors, graph, timestamp);

  const accumulators = buildSkillEvidence(input.attempt, errors);
  const stateUpdates = Array.from(accumulators.values()).map((evidence) => {
    const previous = graph.skills[evidence.skillNode.id] ?? initialSkillState(evidence.skillNode, timestamp);
    const next = updateSkillState(previous, evidence, input.attempt, timestamp);
    graph.skills[evidence.skillNode.id] = next;
    return skillStateUpdate(input.attempt, previous, next, evidence, timestamp);
  });

  const interventionPlan = chooseIntervention(input.attempt, graph, stateUpdates, errors, timestamp);
  const schedulingInstruction = scheduleForIntervention(interventionPlan, timestamp);

  return {
    skillStateGraph: graph,
    stateUpdates,
    errors,
    interventionPlan,
    schedulingInstruction,
  };
}

export function knowledgeErrorTypeFromTags(tags: string[] = [], fallback?: P3ErrorLogErrorType | MistakeType | string): KnowledgeErrorType {
  const normalized = tags.map((tag) => tag.toLowerCase());
  if (normalized.some((tag) => tag.includes('time') || tag.includes('slow'))) return 'time_pressure_degradation';
  if (normalized.some((tag) => tag.includes('careless') || tag.includes('misread'))) return 'careless_slip';
  if (normalized.some((tag) => tag.includes('notation') || tag.includes('diagram') || tag.includes('graph'))) return 'representation_error';
  if (normalized.some((tag) => tag.includes('algebra') || tag.includes('sign error') || tag.includes('coefficient') || tag.includes('forgot constant'))) {
    return 'algebraic_execution_error';
  }
  if (normalized.some((tag) => tag.includes('concept') || tag.includes('wrong identity') || tag.includes('domain') || tag.includes('formula'))) {
    return 'conceptual_gap';
  }
  if (normalized.some((tag) => tag.includes('method') || tag.includes('could not start') || tag.includes('did not know'))) return 'mis_selection_of_method';
  return knowledgeErrorTypeFromValue(fallback) ?? 'procedural_gap';
}

export function knowledgeErrorTypeFromValue(value: P3ErrorLogErrorType | MistakeType | KnowledgeErrorType | string | undefined): KnowledgeErrorType | undefined {
  if (!value) return undefined;
  if (isKnowledgeErrorType(value)) return value;
  if (value === 'CONCEPT_ERROR' || value === 'formula_issue') return 'conceptual_gap';
  if (value === 'ALGEBRA_ERROR' || value === 'algebra_error' || value === 'rounding_accuracy') return 'algebraic_execution_error';
  if (value === 'NOTATION_ERROR' || value === 'diagram_or_modeling_issue') return 'representation_error';
  if (value === 'METHOD_ERROR' || value === 'did_not_know_method' || value === 'could_not_start' || value === 'slow_method') return 'mis_selection_of_method';
  if (value === 'TIME_ERROR' || value === 'ran_out_of_time') return 'time_pressure_degradation';
  if (value === 'CARELESS_ERROR' || value === 'misread_question') return 'careless_slip';
  if (value === 'CALCULATOR_ERROR') return 'procedural_gap';
  return undefined;
}

export function normalizeKnowledgeSkillStateGraph(value: unknown): KnowledgeSkillStateGraph {
  if (!isRecord(value)) return emptyKnowledgeSkillStateGraph(0);
  const skills = isRecord(value.skills)
    ? Object.fromEntries(Object.entries(value.skills).filter((entry): entry is [string, KnowledgeSkillState] => isKnowledgeSkillState(entry[1])))
    : {};
  const misconceptions = isRecord(value.misconceptions)
    ? Object.fromEntries(Object.entries(value.misconceptions).filter((entry): entry is [string, KnowledgeMisconceptionSignature] => isKnowledgeMisconception(entry[1])))
    : {};
  return {
    schemaVersion: 1,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date(0).toISOString(),
    skills,
    misconceptions,
  };
}

export function normalizeKnowledgeErrors(value: unknown): KnowledgeErrorObject[] {
  return Array.isArray(value) ? value.filter(isKnowledgeErrorObject) : [];
}

export function normalizeKnowledgeStateUpdates(value: unknown): KnowledgeSkillStateUpdate[] {
  return Array.isArray(value) ? value.filter(isKnowledgeStateUpdate) : [];
}

export function normalizeKnowledgeInterventions(value: unknown): KnowledgeInterventionPlan[] {
  return Array.isArray(value) ? value.filter(isKnowledgeInterventionPlan) : [];
}

export function normalizeKnowledgeSchedules(value: unknown): KnowledgeSchedulingInstruction[] {
  return Array.isArray(value) ? value.filter(isKnowledgeSchedule) : [];
}

export function updateLatestKnowledgeErrorTypeFromTags(
  errors: KnowledgeErrorObject[],
  graph: KnowledgeSkillStateGraph,
  questionId: string,
  tags: string[],
): { errors: KnowledgeErrorObject[]; graph: KnowledgeSkillStateGraph } {
  const index = errors.map((error) => error.questionId).lastIndexOf(questionId);
  if (index < 0) return { errors, graph };
  const nextErrors = errors.slice();
  const previous = nextErrors[index];
  const errorType = knowledgeErrorTypeFromTags(tags, previous.errorType);
  if (errorType === previous.errorType) return { errors, graph };

  nextErrors[index] = {
    ...previous,
    errorType,
    misconceptionTag: undefined,
  };

  const nextGraph = {
    ...graph,
    skills: { ...graph.skills },
  };
  for (const skillNodeId of previous.skillNodeIds) {
    const state = nextGraph.skills[skillNodeId];
    if (!state) continue;
    const errorTypeCounts = { ...state.errorTypeCounts };
    errorTypeCounts[previous.errorType] = Math.max(0, (errorTypeCounts[previous.errorType] ?? 0) - 1);
    errorTypeCounts[errorType] = (errorTypeCounts[errorType] ?? 0) + 1;
    nextGraph.skills[skillNodeId] = { ...state, errorTypeCounts };
  }
  return { errors: nextErrors, graph: nextGraph };
}

function decomposeFailures(
  attempt: KnowledgeAttemptEvidence,
  graph: KnowledgeSkillStateGraph,
  priorErrors: KnowledgeErrorObject[],
  timestamp: number,
): KnowledgeErrorObject[] {
  const scoreLost = Math.max(0, finiteNonNegative(attempt.evaluation.marksAvailable) - finiteNonNegative(attempt.evaluation.marksEarned));
  if (scoreLost <= 0) return [];

  const questionSkillNodes = skillNodesForQuestion(attempt.question);
  const markPoints = (attempt.question.markPoints ?? []).filter((markPoint) => !markPoint.gained);
  const missedEvidence = markPoints.length
    ? markPoints
    : syntheticMissedMarkPoints(attempt, scoreLost, questionSkillNodes);

  return missedEvidence.map((markPoint, index) => {
    const skillNodes = skillNodesForMarkPoint(markPoint, questionSkillNodes);
    const skillNodeIds = skillNodes.map((node) => node.id);
    const primarySkillNodeId = skillNodeIds[0];
    const errorType = classifyFailure(attempt, markPoint);
    const marksLost = Math.max(1, finiteNonNegative(markPoint.marks ?? 1));
    const severity = severityForEvidence(marksLost, scoreLost, attempt.evaluation.marksAvailable);
    const repeat = priorErrors.some((error) => error.primarySkillNodeId === primarySkillNodeId && error.errorType === errorType);
    const evidenceStrength = evidenceStrengthFor(markPoint, severity, repeat);
    for (const node of skillNodes) {
      if (!graph.skills[node.id]) graph.skills[node.id] = initialSkillState(node, timestamp);
    }
    return {
      id: stableId('kerr', attempt.attemptId, attempt.question.questionId, markPoint.id, index, timestamp),
      attemptId: attempt.attemptId,
      questionId: attempt.question.questionId,
      markPointId: markPoint.id,
      markPointLabel: markPoint.label,
      skillNodeIds,
      primarySkillNodeId,
      errorType,
      severity,
      repeat,
      evidenceStrength,
      evidenceSource: attempt.source,
      marksLost,
      timestamp: new Date(timestamp).toISOString(),
      representation: markPoint.representation ?? attempt.question.representation,
      deviationFromCanonical: markPoint.deviationFromCanonical ?? attempt.evaluation.canonicalDeviation,
    };
  });
}

function syntheticMissedMarkPoints(
  attempt: KnowledgeAttemptEvidence,
  scoreLost: number,
  skillNodes: KnowledgeSkillNode[],
): KnowledgeMarkPointEvidence[] {
  const count = Math.max(1, Math.round(scoreLost));
  return Array.from({ length: count }, (_, index) => ({
    id: `${attempt.question.questionId}:missed:${index + 1}`,
    label: `Missed self-marked evidence ${index + 1}`,
    gained: false,
    marks: 1,
    skillNodeIds: skillNodes.map((node) => node.id),
    errorType: attempt.evaluation.timePressure ? 'time_pressure_degradation' : undefined,
    representation: attempt.question.representation,
    deviationFromCanonical: attempt.evaluation.canonicalDeviation,
    evidenceStrength: 0.45,
  }));
}

function applyMisconceptionSignatures(
  currentErrors: KnowledgeErrorObject[],
  priorErrors: KnowledgeErrorObject[],
  graph: KnowledgeSkillStateGraph,
  timestamp: number,
): void {
  for (const error of currentErrors) {
    const related = [...priorErrors, ...currentErrors].filter((candidate) => (
      candidate.primarySkillNodeId === error.primarySkillNodeId && candidate.errorType === error.errorType
    ));
    const questionIds = Array.from(new Set(related.map((candidate) => candidate.questionId).filter(Boolean)));
    const representationIds = Array.from(new Set(related.map((candidate) => candidate.representation).filter((value): value is string => Boolean(value))));
    const nearMissCount = related.filter((candidate) => candidate.severity === 'low' && candidate.marksLost <= 1).length;
    const persistent = questionIds.length >= 2 || representationIds.length >= 2 || nearMissCount >= 3;
    if (!persistent) continue;

    const state = graph.skills[error.primarySkillNodeId];
    const skillLabel = state?.skillNode.label ?? error.primarySkillNodeId;
    const pattern = representationIds.length >= 2
      ? 'across-representations'
      : nearMissCount >= 3
        ? 'near-miss'
        : 'repeated';
    const tag = stableTag(error.primarySkillNodeId, error.errorType, pattern);
    graph.misconceptions[tag] = {
      tag,
      skillNodeId: error.primarySkillNodeId,
      description: `${skillLabel}: ${humanErrorType(error.errorType)} (${humanPattern(pattern)})`,
      errorType: error.errorType,
      evidenceCount: related.length,
      questionIds,
      representationIds,
      lastSeenAt: new Date(timestamp).toISOString(),
      stable: related.length >= 3 || questionIds.length >= 3,
    };
    error.misconceptionTag = tag;
    error.repeat = true;
  }
}

function buildSkillEvidence(attempt: KnowledgeAttemptEvidence, errors: KnowledgeErrorObject[]): Map<string, SkillEvidenceAccumulator> {
  const accumulators = new Map<string, SkillEvidenceAccumulator>();
  const questionSkillNodes = skillNodesForQuestion(attempt.question);

  for (const node of questionSkillNodes) {
    ensureAccumulator(accumulators, node);
  }

  for (const markPoint of attempt.question.markPoints ?? []) {
    if (!markPoint.gained) continue;
    const skillNodes = skillNodesForMarkPoint(markPoint, questionSkillNodes);
    for (const node of skillNodes) {
      const accumulator = ensureAccumulator(accumulators, node);
      accumulator.successWeight += Math.max(1, finiteNonNegative(markPoint.marks ?? 1));
      accumulator.evidenceStrength = Math.max(accumulator.evidenceStrength, clamp01(markPoint.evidenceStrength ?? 0.7));
    }
  }

  if (!(attempt.question.markPoints ?? []).length && errors.length === 0 && attempt.evaluation.marksAvailable > 0) {
    for (const node of questionSkillNodes) {
      const accumulator = ensureAccumulator(accumulators, node);
      accumulator.successWeight += Math.max(1, finiteNonNegative(attempt.evaluation.marksAvailable));
      accumulator.evidenceStrength = Math.max(accumulator.evidenceStrength, 0.6);
    }
  }

  for (const error of errors) {
    for (const skillNodeId of error.skillNodeIds) {
      const node = questionSkillNodes.find((candidate) => candidate.id === skillNodeId) ?? {
        id: skillNodeId,
        source: 'fallback_region' as const,
      };
      const accumulator = ensureAccumulator(accumulators, node);
      accumulator.outcome = 'failure';
      accumulator.errors.push(error);
      accumulator.evidenceStrength = Math.max(accumulator.evidenceStrength, error.evidenceStrength);
    }
  }

  return new Map(Array.from(accumulators.entries()).filter(([, evidence]) => (
    evidence.errors.length > 0 || evidence.successWeight > 0
  )));
}

function ensureAccumulator(accumulators: Map<string, SkillEvidenceAccumulator>, skillNode: KnowledgeSkillNode): SkillEvidenceAccumulator {
  const existing = accumulators.get(skillNode.id);
  if (existing) return existing;
  const created: SkillEvidenceAccumulator = {
    skillNode,
    outcome: 'success',
    errors: [],
    successWeight: 0,
    evidenceStrength: 0.5,
  };
  accumulators.set(skillNode.id, created);
  return created;
}

function updateSkillState(
  previous: KnowledgeSkillState,
  evidence: SkillEvidenceAccumulator,
  attempt: KnowledgeAttemptEvidence,
  timestamp: number,
): KnowledgeSkillState {
  const outcome = evidence.errors.length > 0 ? 'failure' : 'success';
  const previousScore = finiteScore(previous.score);
  const delta = outcome === 'failure'
    ? failureDelta(previous, evidence)
    : successDelta(previous, timestamp);
  const newScore = clampScore(previousScore + delta);
  const confidence = clampScore(previous.confidence + confidenceDelta(evidence));
  const stabilityFlag = stabilityFlagFor(previous, outcome, newScore, timestamp);
  const errorTypeCounts = { ...previous.errorTypeCounts };
  for (const error of evidence.errors) {
    errorTypeCounts[error.errorType] = (errorTypeCounts[error.errorType] ?? 0) + 1;
  }

  return {
    skillNode: { ...previous.skillNode, ...evidence.skillNode },
    score: newScore,
    category: categoryForScore(newScore),
    confidence,
    stabilityFlag,
    evidenceCount: previous.evidenceCount + 1,
    successStreak: outcome === 'success' ? previous.successStreak + 1 : 0,
    failureStreak: outcome === 'failure' ? previous.failureStreak + 1 : 0,
    lastOutcome: outcome,
    lastUpdated: new Date(timestamp).toISOString(),
    lastAttemptId: attempt.attemptId,
    lastQuestionId: attempt.question.questionId,
    errorTypeCounts,
  };
}

function skillStateUpdate(
  attempt: KnowledgeAttemptEvidence,
  previous: KnowledgeSkillState,
  next: KnowledgeSkillState,
  evidence: SkillEvidenceAccumulator,
  timestamp: number,
): KnowledgeSkillStateUpdate {
  const outcome: KnowledgeEvidenceOutcome = evidence.errors.length > 0 ? 'failure' : 'success';
  return {
    id: stableId('ksu', attempt.attemptId, next.skillNode.id, timestamp),
    attemptId: attempt.attemptId,
    questionId: attempt.question.questionId,
    skillNodeId: next.skillNode.id,
    previousScore: previous.score,
    newScore: next.score,
    previousCategory: previous.category,
    newCategory: next.category,
    confidence: next.confidence,
    stabilityFlag: next.stabilityFlag,
    outcome,
    evidenceStrength: roundMetric(evidence.evidenceStrength),
    timestamp: new Date(timestamp).toISOString(),
  };
}

function chooseIntervention(
  attempt: KnowledgeAttemptEvidence,
  graph: KnowledgeSkillStateGraph,
  stateUpdates: KnowledgeSkillStateUpdate[],
  errors: KnowledgeErrorObject[],
  timestamp: number,
): KnowledgeInterventionPlan {
  const selectedError = highestPriorityError(errors, stateUpdates);
  const selectedUpdate = selectedError
    ? stateUpdates.find((update) => update.skillNodeId === selectedError.primarySkillNodeId) ?? stateUpdates[0]
    : highestPositiveUpdate(stateUpdates);
  const skillNodeId = selectedError?.primarySkillNodeId ?? selectedUpdate?.skillNodeId ?? skillNodesForQuestion(attempt.question)[0].id;
  const state = graph.skills[skillNodeId] ?? initialSkillState(skillNodesForQuestion(attempt.question)[0], timestamp);
  const previousScore = selectedUpdate?.previousScore ?? state.score;
  const newScore = selectedUpdate?.newScore ?? state.score;
  const action = interventionActionFor(state, selectedUpdate, selectedError);

  return {
    id: stableId('kint', attempt.attemptId, skillNodeId, action, timestamp),
    attemptId: attempt.attemptId,
    skillNodeId,
    action,
    rationale: interventionRationale(action, state, selectedError),
    stateChange: {
      previousScore,
      newScore,
      category: state.category,
      stabilityFlag: state.stabilityFlag,
    },
    sourceErrorIds: selectedError ? [selectedError.id] : [],
    createdAt: new Date(timestamp).toISOString(),
  };
}

function scheduleForIntervention(intervention: KnowledgeInterventionPlan, timestamp: number): KnowledgeSchedulingInstruction {
  const timing = retestTimingFor(intervention.action);
  const delay = intervention.action === 'transfer_challenge'
    ? TRANSFER_DELAY_MS
    : timing === 'delayed'
      ? DELAYED_RETEST_MS
      : 0;
  return {
    id: stableId('ksch', intervention.id, intervention.action, timestamp),
    interventionId: intervention.id,
    attemptId: intervention.attemptId,
    skillNodeId: intervention.skillNodeId,
    retestTiming: timing,
    followUpItemType: followUpFor(intervention.action),
    difficultyRelation: relationFor(intervention.action),
    dueAt: new Date(timestamp + delay).toISOString(),
    reason: scheduleReason(intervention.action),
    createdAt: new Date(timestamp).toISOString(),
  };
}

function skillNodesForQuestion(question: KnowledgeQuestionEvidence): KnowledgeSkillNode[] {
  const explicitNodes = (question.skillNodes ?? []).filter(isKnowledgeSkillNode);
  const nodeIds = Array.from(new Set([
    ...(question.skillNodeIds ?? []),
    question.primaryTopicId,
    question.regionId,
  ].filter((value): value is string => Boolean(value))));
  const nodesFromIds = nodeIds.map((id) => ({
    id,
    label: question.topic,
    course: question.course,
    topicId: question.primaryTopicId,
    regionId: question.regionId,
    source: question.primaryTopicId === id ? 'topic_route' as const : 'fallback_region' as const,
  }));
  const byId = new Map<string, KnowledgeSkillNode>();
  for (const node of [...explicitNodes, ...nodesFromIds]) {
    byId.set(node.id, { ...byId.get(node.id), ...node });
  }
  if (byId.size) return Array.from(byId.values());
  return [{
    id: fallbackSkillNodeId(question),
    label: question.topic,
    course: question.course,
    topicId: question.primaryTopicId,
    regionId: question.regionId,
    source: 'fallback_region',
  }];
}

function skillNodesForMarkPoint(markPoint: KnowledgeMarkPointEvidence, questionSkillNodes: KnowledgeSkillNode[]): KnowledgeSkillNode[] {
  const explicitIds = markPoint.skillNodeIds?.filter(Boolean) ?? [];
  if (!explicitIds.length) return questionSkillNodes;
  return explicitIds.map((id) => (
    questionSkillNodes.find((node) => node.id === id) ?? {
      id,
      source: 'exam_part' as const,
    }
  ));
}

function classifyFailure(attempt: KnowledgeAttemptEvidence, markPoint: KnowledgeMarkPointEvidence): KnowledgeErrorType {
  const explicit = knowledgeErrorTypeFromValue(markPoint.errorType);
  if (explicit) return explicit;
  if (attempt.evaluation.timePressure || timePressureLikely(attempt)) return 'time_pressure_degradation';
  if (markPoint.deviationFromCanonical || attempt.evaluation.canonicalDeviation) {
    const deviation = `${markPoint.deviationFromCanonical ?? attempt.evaluation.canonicalDeviation}`.toLowerCase();
    if (deviation.includes('notation') || deviation.includes('graph') || deviation.includes('diagram')) return 'representation_error';
    if (deviation.includes('method') || deviation.includes('path')) return 'mis_selection_of_method';
    if (deviation.includes('algebra') || deviation.includes('sign') || deviation.includes('coefficient')) return 'algebraic_execution_error';
    if (deviation.includes('concept') || deviation.includes('identity') || deviation.includes('domain')) return 'conceptual_gap';
  }
  if (markPoint.markCode?.startsWith('M')) return 'mis_selection_of_method';
  if (markPoint.markCode?.startsWith('A')) return 'algebraic_execution_error';
  if (markPoint.markCode?.startsWith('B')) return 'procedural_gap';
  return 'procedural_gap';
}

function severityForEvidence(marksLost: number, totalLost: number, marksAvailable: number): KnowledgeEvidenceSeverity {
  const lossRatio = marksAvailable > 0 ? totalLost / marksAvailable : 0;
  if (marksLost >= 3 || lossRatio >= 0.6) return 'high';
  if (marksLost >= 2 || lossRatio >= 0.3) return 'medium';
  return 'low';
}

function evidenceStrengthFor(markPoint: KnowledgeMarkPointEvidence, severity: KnowledgeEvidenceSeverity, repeat: boolean): number {
  const base = clamp01(markPoint.evidenceStrength ?? (markPoint.id.includes(':missed:') ? 0.45 : 0.75));
  const severityBoost = severity === 'high' ? 0.15 : severity === 'medium' ? 0.08 : 0;
  const repeatBoost = repeat ? 0.08 : 0;
  return roundMetric(Math.min(1, base + severityBoost + repeatBoost));
}

function failureDelta(previous: KnowledgeSkillState, evidence: SkillEvidenceAccumulator): number {
  const worstSeverity = evidence.errors.reduce<KnowledgeEvidenceSeverity>((worst, error) => (
    severityRank(error.severity) > severityRank(worst) ? error.severity : worst
  ), 'low');
  const hasRepeat = evidence.errors.some((error) => error.repeat);
  const hasVolatility = previous.lastOutcome === 'success' && previous.successStreak > 0;
  const typePenalty = evidence.errors.some((error) => error.errorType === 'careless_slip' || error.errorType === 'time_pressure_degradation') ? 0.75 : 1;
  const base = worstSeverity === 'high' ? -20 : worstSeverity === 'medium' ? -14 : -8;
  const firstFailurePenalty = previous.evidenceCount === 0 ? -6 : 0;
  const repeatPenalty = hasRepeat ? -4 : 0;
  const volatilityPenalty = hasVolatility ? -6 : 0;
  return Math.round((base + firstFailurePenalty + repeatPenalty + volatilityPenalty) * typePenalty);
}

function successDelta(previous: KnowledgeSkillState, timestamp: number): number {
  const elapsed = timestamp - parseTimestamp(previous.lastUpdated);
  if (previous.successStreak >= 2 && elapsed >= ONE_DAY_MS) return 12;
  if (previous.lastOutcome === 'success' && elapsed >= ONE_DAY_MS) return 9;
  if (previous.lastOutcome === 'failure') return 6;
  return 4;
}

function confidenceDelta(evidence: SkillEvidenceAccumulator): number {
  const base = evidence.outcome === 'failure' ? 9 : 6;
  return roundMetric(Math.max(3, base * evidence.evidenceStrength));
}

function stabilityFlagFor(
  previous: KnowledgeSkillState,
  outcome: KnowledgeEvidenceOutcome,
  score: number,
  timestamp: number,
): KnowledgeStabilityFlag {
  if (outcome === 'failure' && previous.lastOutcome === 'success' && previous.successStreak > 0) return 'volatile';
  if (outcome === 'failure') return previous.evidenceCount === 0 || score < 50 ? 'fragile' : 'volatile';
  if (previous.lastOutcome === 'failure') return 'recovering';
  if (previous.evidenceCount === 0) return 'new_evidence';
  const elapsed = timestamp - parseTimestamp(previous.lastUpdated);
  if (previous.successStreak >= 1 && score >= 70 && elapsed >= ONE_DAY_MS) return 'stable_understanding';
  return 'new_evidence';
}

function highestPriorityError(errors: KnowledgeErrorObject[], updates: KnowledgeSkillStateUpdate[]): KnowledgeErrorObject | undefined {
  return errors.slice().sort((a, b) => {
    const updateA = updates.find((update) => update.skillNodeId === a.primarySkillNodeId);
    const updateB = updates.find((update) => update.skillNodeId === b.primarySkillNodeId);
    const scoreDropA = updateA ? updateA.previousScore - updateA.newScore : 0;
    const scoreDropB = updateB ? updateB.previousScore - updateB.newScore : 0;
    return severityRank(b.severity) - severityRank(a.severity)
      || Number(b.repeat) - Number(a.repeat)
      || scoreDropB - scoreDropA
      || b.evidenceStrength - a.evidenceStrength;
  })[0];
}

function highestPositiveUpdate(updates: KnowledgeSkillStateUpdate[]): KnowledgeSkillStateUpdate | undefined {
  return updates.slice().sort((a, b) => (
    (b.newScore - b.previousScore) - (a.newScore - a.previousScore)
    || b.newScore - a.newScore
  ))[0];
}

function interventionActionFor(
  state: KnowledgeSkillState,
  update: KnowledgeSkillStateUpdate | undefined,
  error: KnowledgeErrorObject | undefined,
): KnowledgeInterventionAction {
  if (!error) return state.score >= 70 && state.stabilityFlag === 'stable_understanding' ? 'transfer_challenge' : 'delayed_retest';
  if (update?.stabilityFlag === 'volatile') return 'delayed_retest';
  if (error.misconceptionTag || error.repeat) return 'drill_set';
  if (state.category === 'unknown' || state.category === 'fragile') return 'micro_reteach';
  if (error.errorType === 'conceptual_gap' || error.errorType === 'mis_selection_of_method') return 'micro_reteach';
  if (error.errorType === 'careless_slip' || error.errorType === 'time_pressure_degradation') return 'delayed_retest';
  return 'similar_question';
}

function interventionRationale(
  action: KnowledgeInterventionAction,
  state: KnowledgeSkillState,
  error: KnowledgeErrorObject | undefined,
): string {
  if (!error) return `State moved to ${state.category}; schedule retrieval before increasing challenge.`;
  if (action === 'drill_set') return 'Repeated skill-linked error pattern detected across local evidence.';
  if (action === 'micro_reteach') return `Skill state is ${state.category} after ${humanErrorType(error.errorType)}.`;
  if (action === 'delayed_retest') return state.stabilityFlag === 'volatile'
    ? 'Failure after prior success suggests unstable retrieval.'
    : 'The evidence points to timing or consistency rather than a new concept gap.';
  if (action === 'transfer_challenge') return 'Stable understanding needs cross-skill confirmation.';
  return 'A near miss should be checked with an isomorphic follow-up question.';
}

function retestTimingFor(action: KnowledgeInterventionAction): KnowledgeRetestTiming {
  return action === 'delayed_retest' || action === 'transfer_challenge' ? 'delayed' : 'immediate';
}

function followUpFor(action: KnowledgeInterventionAction): KnowledgeFollowUpItemType {
  return action;
}

function relationFor(action: KnowledgeInterventionAction): KnowledgeDifficultyRelation {
  if (action === 'transfer_challenge') return 'cross_skill';
  if (action === 'delayed_retest') return 'isomorphic';
  if (action === 'similar_question' || action === 'drill_set' || action === 'micro_reteach') return 'isomorphic';
  return 'harder';
}

function scheduleReason(action: KnowledgeInterventionAction): string {
  if (action === 'transfer_challenge') return 'Confirm stable understanding under transfer after spacing.';
  if (action === 'delayed_retest') return 'Re-test after spacing to check stability rather than immediate recall.';
  if (action === 'drill_set') return 'Repeat pattern needs immediate concentrated practice.';
  if (action === 'micro_reteach') return 'State moved toward unknown or fragile; repair the prerequisite idea first.';
  return 'Check whether the same method works on an isomorphic item.';
}

function initialSkillState(skillNode: KnowledgeSkillNode, timestamp: number): KnowledgeSkillState {
  return {
    skillNode,
    score: STARTING_SCORE,
    category: categoryForScore(STARTING_SCORE),
    confidence: STARTING_CONFIDENCE,
    stabilityFlag: 'new_evidence',
    evidenceCount: 0,
    successStreak: 0,
    failureStreak: 0,
    lastUpdated: new Date(timestamp).toISOString(),
    errorTypeCounts: {},
  };
}

function categoryForScore(score: number): KnowledgeSkillCategory {
  if (score < 30) return 'unknown';
  if (score < 50) return 'fragile';
  if (score < 70) return 'developing';
  if (score < 85) return 'stable';
  return 'secure';
}

function severityRank(severity: KnowledgeEvidenceSeverity): number {
  if (severity === 'high') return 3;
  if (severity === 'medium') return 2;
  return 1;
}

function humanErrorType(errorType: KnowledgeErrorType): string {
  return errorType.replace(/_/g, ' ');
}

function humanPattern(pattern: string): string {
  if (pattern === 'across-representations') return 'under different representations';
  if (pattern === 'near-miss') return 'repeated near-miss mark losses';
  return 'repeated across questions';
}

function fallbackSkillNodeId(question: KnowledgeQuestionEvidence): string {
  return [
    question.course ?? 'course',
    question.primaryTopicId ?? question.regionId ?? question.topic ?? 'unknown_skill',
  ].join(':').replace(/[^a-zA-Z0-9:_-]+/g, '_');
}

function stableTag(skillNodeId: string, errorType: KnowledgeErrorType, pattern: string): string {
  return [skillNodeId, errorType, pattern]
    .join(':')
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '_');
}

function stableId(prefix: string, ...parts: Array<string | number | undefined>): string {
  const seed = parts.filter((part) => part !== undefined).join(':');
  return `${prefix}_${seed.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'item'}`;
}

function isKnowledgeErrorType(value: string): value is KnowledgeErrorType {
  return [
    'conceptual_gap',
    'procedural_gap',
    'algebraic_execution_error',
    'representation_error',
    'mis_selection_of_method',
    'careless_slip',
    'time_pressure_degradation',
  ].includes(value);
}

function isKnowledgeSkillNode(value: unknown): value is KnowledgeSkillNode {
  return isRecord(value) && typeof value.id === 'string' && typeof value.source === 'string';
}

function isKnowledgeSkillState(value: unknown): value is KnowledgeSkillState {
  return isRecord(value)
    && isKnowledgeSkillNode(value.skillNode)
    && typeof value.score === 'number'
    && typeof value.category === 'string'
    && typeof value.confidence === 'number'
    && typeof value.stabilityFlag === 'string'
    && typeof value.evidenceCount === 'number'
    && typeof value.successStreak === 'number'
    && typeof value.failureStreak === 'number'
    && typeof value.lastUpdated === 'string'
    && isRecord(value.errorTypeCounts);
}

function isKnowledgeErrorObject(value: unknown): value is KnowledgeErrorObject {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.attemptId === 'string'
    && typeof value.questionId === 'string'
    && Array.isArray(value.skillNodeIds)
    && typeof value.primarySkillNodeId === 'string'
    && typeof value.errorType === 'string'
    && isKnowledgeErrorType(value.errorType)
    && typeof value.severity === 'string'
    && typeof value.repeat === 'boolean'
    && typeof value.evidenceStrength === 'number'
    && typeof value.evidenceSource === 'string'
    && typeof value.marksLost === 'number'
    && typeof value.timestamp === 'string';
}

function isKnowledgeStateUpdate(value: unknown): value is KnowledgeSkillStateUpdate {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.attemptId === 'string'
    && typeof value.questionId === 'string'
    && typeof value.skillNodeId === 'string'
    && typeof value.previousScore === 'number'
    && typeof value.newScore === 'number'
    && typeof value.newCategory === 'string'
    && typeof value.confidence === 'number'
    && typeof value.timestamp === 'string';
}

function isKnowledgeInterventionPlan(value: unknown): value is KnowledgeInterventionPlan {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.attemptId === 'string'
    && typeof value.skillNodeId === 'string'
    && typeof value.action === 'string'
    && isRecord(value.stateChange)
    && Array.isArray(value.sourceErrorIds)
    && typeof value.createdAt === 'string';
}

function isKnowledgeSchedule(value: unknown): value is KnowledgeSchedulingInstruction {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.interventionId === 'string'
    && typeof value.attemptId === 'string'
    && typeof value.skillNodeId === 'string'
    && typeof value.retestTiming === 'string'
    && typeof value.followUpItemType === 'string'
    && typeof value.difficultyRelation === 'string'
    && typeof value.dueAt === 'string'
    && typeof value.createdAt === 'string';
}

function isKnowledgeMisconception(value: unknown): value is KnowledgeMisconceptionSignature {
  return isRecord(value)
    && typeof value.tag === 'string'
    && typeof value.skillNodeId === 'string'
    && typeof value.description === 'string'
    && typeof value.errorType === 'string'
    && isKnowledgeErrorType(value.errorType)
    && typeof value.evidenceCount === 'number'
    && Array.isArray(value.questionIds)
    && Array.isArray(value.representationIds)
    && typeof value.lastSeenAt === 'string'
    && typeof value.stable === 'boolean';
}

function finiteScore(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? clampScore(value) : STARTING_SCORE;
}

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clampScore(value: number): number {
  return roundMetric(Math.min(100, Math.max(0, value)));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function parseTimestamp(value: number | string | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}

function isoTimestamp(value: number | string): string {
  return new Date(parseTimestamp(value)).toISOString();
}

function timePressureLikely(attempt: KnowledgeAttemptEvidence): boolean {
  return Boolean(
    attempt.response?.timeTakenSeconds
    && attempt.response.timeTakenSeconds > 0
    && attempt.evaluation.marksAvailable > 0
    && attempt.evaluation.marksEarned / attempt.evaluation.marksAvailable < 0.5
    && attempt.response.timeTakenSeconds < 60,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
