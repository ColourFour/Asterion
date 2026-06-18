import type {
  Attempt,
  KnowledgeErrorObject,
  KnowledgeInterventionPlan,
  KnowledgeSchedulingInstruction,
  KnowledgeSkillStateUpdate,
  LearningActivityAttempt,
  SkillCheckAttemptRecord,
  StoredProgress,
} from '../types';
import { isPassingSkillCheckAttempt, normalizeSkillCheckLocalAttempts } from '../skill-checks/localAttempts';

export const LOCAL_PROGRESS_CSV_HEADERS = [
  'export_timestamp',
  'topic',
  'route_page_type',
  'activity_type',
  'item_id',
  'attempt_timestamp',
  'answer_result_summary',
  'deterministic_pass_fail',
  'self_marked_score',
  'evidence_label',
  'mastery_eligibility_label',
  'suspicion_flags',
  'knowledge_skill_id',
  'knowledge_state_score',
  'knowledge_state_category',
  'knowledge_stability_flag',
  'knowledge_confidence',
  'knowledge_error_type',
  'knowledge_error_severity',
  'knowledge_repeat_flag',
  'knowledge_misconception_tag',
  'knowledge_evidence_strength',
  'intervention_action',
  'retest_timing',
  'follow_up_item_type',
  'follow_up_relation',
] as const;

export type LocalProgressCsvHeader = typeof LOCAL_PROGRESS_CSV_HEADERS[number];
export type LocalProgressCsvRow = Record<LocalProgressCsvHeader, string>;

function cleanCell(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.filter(Boolean).join('|');
  return String(value);
}

export function csvEscapeCell(value: unknown): string {
  const cell = cleanCell(value);
  return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function csvLine(row: LocalProgressCsvRow): string {
  return LOCAL_PROGRESS_CSV_HEADERS.map((header) => csvEscapeCell(row[header])).join(',');
}

function blankRow(exportTimestamp: string): LocalProgressCsvRow {
  return Object.fromEntries(LOCAL_PROGRESS_CSV_HEADERS.map((header) => [
    header,
    header === 'export_timestamp' ? exportTimestamp : '',
  ])) as LocalProgressCsvRow;
}

function scoreSummary(attempt: Attempt): string {
  if (typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0) {
    return `${attempt.marksEarned}/${attempt.marksAvailable}`;
  }
  return typeof attempt.marksEarned === 'number' ? String(attempt.marksEarned) : '';
}

function examMasteryLabel(attempt: Attempt): string {
  if (attempt.masteryEligible === true) return 'skill_check_gate_required_before_mastery_display';
  if (attempt.masteryGate === 'skill_check_passed') return 'skill_check_passed_exam_supports_confidence';
  return 'not_mastery_evidence_by_itself';
}

function rowForSkillCheckAttempt(attempt: SkillCheckAttemptRecord, exportTimestamp: string): LocalProgressCsvRow {
  const passed = isPassingSkillCheckAttempt(attempt);
  return {
    ...blankRow(exportTimestamp),
    topic: attempt.topic,
    route_page_type: 'skill-check',
    activity_type: 'Checked Practice',
    item_id: attempt.checkId,
    attempt_timestamp: attempt.timestamp,
    answer_result_summary: attempt.submittedAnswer,
    deterministic_pass_fail: passed ? 'pass' : 'fail',
    evidence_label: passed ? 'Deterministic checked practice evidence' : 'Checked Practice attempt',
    mastery_eligibility_label: passed ? 'mastery_gate_passed_for_this_check' : 'not_passed',
    suspicion_flags: '',
  };
}

function rowForReviewCandidate(attempt: SkillCheckAttemptRecord, exportTimestamp: string): LocalProgressCsvRow | undefined {
  const tags = attempt.mistakeTags.filter(Boolean);
  const isCandidate = tags.length > 0 || !attempt.isCorrect || attempt.revealedAnswer || attempt.revealedRepairStep;
  if (!isCandidate) return undefined;
  const state = attempt.revealedAnswer
    ? 'answer_revealed'
    : attempt.revealedRepairStep
      ? 'repair_revealed'
      : attempt.isCorrect
        ? 'tagged_review'
        : 'incorrect';
  return {
    ...blankRow(exportTimestamp),
    topic: attempt.topic,
    route_page_type: 'review',
    activity_type: 'Review',
    item_id: attempt.checkId,
    attempt_timestamp: attempt.timestamp,
    answer_result_summary: state,
    deterministic_pass_fail: 'not_available',
    evidence_label: 'Review candidate from local checked practice attempt',
    mastery_eligibility_label: 'not_mastery_evidence',
    suspicion_flags: tags.join('|'),
  };
}

function rowForExamAttempt(attempt: Attempt, exportTimestamp: string): LocalProgressCsvRow {
  return {
    ...blankRow(exportTimestamp),
    topic: attempt.topicDisplayName,
    route_page_type: 'exam-training',
    activity_type: 'Exam Training',
    item_id: attempt.questionId,
    attempt_timestamp: attempt.attemptedAt,
    answer_result_summary: attempt.mistakeType ?? '',
    deterministic_pass_fail: 'not_available',
    self_marked_score: scoreSummary(attempt),
    evidence_label: attempt.evidenceLabel ?? (attempt.selfMarked ? 'Self-marked attempt' : 'Exam practice evidence'),
    mastery_eligibility_label: examMasteryLabel(attempt),
    suspicion_flags: (attempt.suspicionFlags ?? []).join('|'),
  };
}

function rowForLearningActivity(attempt: LearningActivityAttempt, exportTimestamp: string): LocalProgressCsvRow {
  const isLearnMode = attempt.activityType === 'learn_mode';
  return {
    ...blankRow(exportTimestamp),
    topic: attempt.topic ?? attempt.regionId,
    route_page_type: isLearnMode ? 'learn' : 'field-guide',
    activity_type: isLearnMode ? 'Learn' : (attempt.activityType ?? 'Learn'),
    item_id: attempt.activityId ?? attempt.id,
    attempt_timestamp: attempt.completedAt ?? attempt.createdAt ?? '',
    answer_result_summary: attempt.submittedAnswer ?? attempt.prompt ?? '',
    deterministic_pass_fail: typeof attempt.isCorrect === 'boolean' ? (attempt.isCorrect ? 'pass' : 'fail') : 'not_available',
    evidence_label: 'Local learning activity',
    mastery_eligibility_label: attempt.strongEvidence ? 'clean_checked_learning_attempt' : 'not_mastery_evidence',
    suspicion_flags: (attempt.mistakeTags ?? []).join('|'),
  };
}

function rowForKnowledgeStateUpdate(update: KnowledgeSkillStateUpdate, exportTimestamp: string): LocalProgressCsvRow {
  return {
    ...blankRow(exportTimestamp),
    topic: update.skillNodeId,
    route_page_type: 'knowledge-state',
    activity_type: 'Skill State Update',
    item_id: update.id,
    attempt_timestamp: update.timestamp,
    answer_result_summary: `${update.previousScore}->${update.newScore}`,
    deterministic_pass_fail: update.outcome,
    evidence_label: 'Error-to-knowledge-state transformer',
    mastery_eligibility_label: 'not_mastery_evidence',
    knowledge_skill_id: update.skillNodeId,
    knowledge_state_score: String(update.newScore),
    knowledge_state_category: update.newCategory,
    knowledge_stability_flag: update.stabilityFlag,
    knowledge_confidence: String(update.confidence),
    knowledge_evidence_strength: String(update.evidenceStrength),
  };
}

function rowForKnowledgeError(error: KnowledgeErrorObject, exportTimestamp: string): LocalProgressCsvRow {
  return {
    ...blankRow(exportTimestamp),
    topic: error.primarySkillNodeId,
    route_page_type: 'knowledge-state',
    activity_type: 'Error Diagnostic',
    item_id: error.id,
    attempt_timestamp: error.timestamp,
    answer_result_summary: error.markPointLabel ?? error.markPointId ?? error.errorType,
    evidence_label: 'Skill-linked missed mark evidence',
    mastery_eligibility_label: 'not_mastery_evidence',
    knowledge_skill_id: error.primarySkillNodeId,
    knowledge_error_type: error.errorType,
    knowledge_error_severity: error.severity,
    knowledge_repeat_flag: String(error.repeat),
    knowledge_misconception_tag: error.misconceptionTag ?? '',
    knowledge_evidence_strength: String(error.evidenceStrength),
  };
}

function rowForKnowledgeIntervention(
  intervention: KnowledgeInterventionPlan,
  schedules: KnowledgeSchedulingInstruction[],
  exportTimestamp: string,
): LocalProgressCsvRow {
  const schedule = schedules.find((candidate) => candidate.interventionId === intervention.id);
  return {
    ...blankRow(exportTimestamp),
    topic: intervention.skillNodeId,
    route_page_type: 'knowledge-state',
    activity_type: 'Intervention Plan',
    item_id: intervention.id,
    attempt_timestamp: intervention.createdAt,
    answer_result_summary: intervention.rationale,
    evidence_label: 'State-change-driven intervention',
    mastery_eligibility_label: 'not_mastery_evidence',
    knowledge_skill_id: intervention.skillNodeId,
    knowledge_state_score: String(intervention.stateChange.newScore),
    knowledge_state_category: intervention.stateChange.category,
    knowledge_stability_flag: intervention.stateChange.stabilityFlag,
    intervention_action: intervention.action,
    retest_timing: schedule?.retestTiming ?? '',
    follow_up_item_type: schedule?.followUpItemType ?? '',
    follow_up_relation: schedule?.difficultyRelation ?? '',
  };
}

export function localProgressCsvRows(
  progress: Partial<StoredProgress>,
  exportTimestamp = new Date().toISOString(),
): LocalProgressCsvRow[] {
  const skillRows = normalizeSkillCheckLocalAttempts(progress.skillCheckAttempts)
    .flatMap((attempt) => [
      rowForSkillCheckAttempt(attempt, exportTimestamp),
      rowForReviewCandidate(attempt, exportTimestamp),
    ].filter((row): row is LocalProgressCsvRow => Boolean(row)));
  const examRows = Array.isArray(progress.attempts)
    ? progress.attempts.map((attempt) => rowForExamAttempt(attempt, exportTimestamp))
    : [];
  const learningRows = Array.isArray(progress.learningActivityAttempts)
    ? progress.learningActivityAttempts.map((attempt) => rowForLearningActivity(attempt, exportTimestamp))
    : [];
  const knowledgeStateRows = Array.isArray(progress.knowledge_state_updates)
    ? progress.knowledge_state_updates.map((update) => rowForKnowledgeStateUpdate(update, exportTimestamp))
    : [];
  const knowledgeErrorRows = Array.isArray(progress.knowledge_errors)
    ? progress.knowledge_errors.map((error) => rowForKnowledgeError(error, exportTimestamp))
    : [];
  const knowledgeInterventionRows = Array.isArray(progress.knowledge_interventions)
    ? progress.knowledge_interventions.map((intervention) => rowForKnowledgeIntervention(
      intervention,
      Array.isArray(progress.knowledge_schedules) ? progress.knowledge_schedules : [],
      exportTimestamp,
    ))
    : [];
  return [
    ...skillRows,
    ...examRows,
    ...learningRows,
    ...knowledgeStateRows,
    ...knowledgeErrorRows,
    ...knowledgeInterventionRows,
  ];
}

export function buildLocalProgressCsv(
  progress: Partial<StoredProgress>,
  exportTimestamp = new Date().toISOString(),
): string {
  return [
    LOCAL_PROGRESS_CSV_HEADERS.join(','),
    ...localProgressCsvRows(progress, exportTimestamp).map(csvLine),
  ].join('\n');
}
