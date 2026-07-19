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
  'submission_id',
  'student_name',
  'class_group',
  'reporting_period',
  'submission_timestamp',
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
  'evidence_status_label',
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

export interface LocalProgressExportMetadata {
  submissionId?: string;
  studentName?: string;
  classGroup?: string;
  reportingPeriod?: string;
  submissionTimestamp?: string;
}

export interface LocalProgressSubmissionSummary {
  checkedPracticeAttempts: number;
  checkedPracticePasses: number;
  reviewCandidates: number;
  selfMarkedExamAttempts: number;
  learningActivityAttempts: number;
  knowledgeStateUpdates: number;
  knowledgeErrors: number;
  knowledgeInterventions: number;
}

function cleanCell(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.filter(Boolean).join('|');
  return String(value);
}

export function csvEscapeCell(value: unknown): string {
  let cell = cleanCell(value);
  if (/^[\t\r\n ]*[=+\-@]/.test(cell)) cell = `'${cell}`;
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

function normalizeExportMetadata(
  metadataOrTimestamp: LocalProgressExportMetadata | string | undefined,
  fallbackTimestamp: string,
): Required<LocalProgressExportMetadata> {
  const metadata = typeof metadataOrTimestamp === 'object' && metadataOrTimestamp !== null
    ? metadataOrTimestamp
    : {};
  return {
    submissionId: cleanCell(metadata.submissionId),
    studentName: cleanCell(metadata.studentName),
    classGroup: cleanCell(metadata.classGroup),
    reportingPeriod: cleanCell(metadata.reportingPeriod),
    submissionTimestamp: cleanCell(metadata.submissionTimestamp) || fallbackTimestamp,
  };
}

function rowWithExportMetadata(row: LocalProgressCsvRow, metadata: Required<LocalProgressExportMetadata>): LocalProgressCsvRow {
  return {
    ...row,
    submission_id: metadata.submissionId,
    student_name: metadata.studentName,
    class_group: metadata.classGroup,
    reporting_period: metadata.reportingPeriod,
    submission_timestamp: metadata.submissionTimestamp,
  };
}

function summaryText(summary: LocalProgressSubmissionSummary): string {
  return [
    `checked_practice_attempts=${summary.checkedPracticeAttempts}`,
    `checked_practice_passes=${summary.checkedPracticePasses}`,
    `review_candidates=${summary.reviewCandidates}`,
    `self_marked_exam_attempts=${summary.selfMarkedExamAttempts}`,
    `learning_activity_attempts=${summary.learningActivityAttempts}`,
    `knowledge_state_updates=${summary.knowledgeStateUpdates}`,
    `knowledge_errors=${summary.knowledgeErrors}`,
    `knowledge_interventions=${summary.knowledgeInterventions}`,
  ].join('; ');
}

function isCleanCheckedPracticeAttempt(attempt: SkillCheckAttemptRecord): boolean {
  return isPassingSkillCheckAttempt(attempt) && attempt.usedHint !== true;
}

export function localProgressSubmissionSummary(progress: Partial<StoredProgress>): LocalProgressSubmissionSummary {
  const skillAttempts = normalizeSkillCheckLocalAttempts(progress.skillCheckAttempts);
  const reviewCandidates = skillAttempts.filter((attempt) => rowForReviewCandidate(attempt, '')).length;
  const examAttempts = Array.isArray(progress.attempts) ? progress.attempts : [];
  return {
    checkedPracticeAttempts: skillAttempts.length,
    checkedPracticePasses: new Set(skillAttempts.filter(isCleanCheckedPracticeAttempt).map((attempt) => attempt.checkId)).size,
    reviewCandidates,
    selfMarkedExamAttempts: examAttempts.filter((attempt) => attempt.selfMarked === true).length,
    learningActivityAttempts: Array.isArray(progress.learningActivityAttempts) ? progress.learningActivityAttempts.length : 0,
    knowledgeStateUpdates: Array.isArray(progress.knowledge_state_updates) ? progress.knowledge_state_updates.length : 0,
    knowledgeErrors: Array.isArray(progress.knowledge_errors) ? progress.knowledge_errors.length : 0,
    knowledgeInterventions: Array.isArray(progress.knowledge_interventions) ? progress.knowledge_interventions.length : 0,
  };
}

function rowForSubmissionSummary(
  progress: Partial<StoredProgress>,
  exportTimestamp: string,
  metadata: Required<LocalProgressExportMetadata>,
): LocalProgressCsvRow {
  const summary = localProgressSubmissionSummary(progress);
  return rowWithExportMetadata({
    ...blankRow(exportTimestamp),
    topic: 'All P3 local progress',
    route_page_type: 'export',
    activity_type: 'Submission Summary',
    item_id: metadata.submissionId,
    attempt_timestamp: metadata.submissionTimestamp,
    answer_result_summary: summaryText(summary),
    deterministic_pass_fail: 'not_available',
    evidence_label: 'Student-submitted local progress export',
    evidence_status_label: 'export_metadata_only',
  }, metadata);
}

function scoreSummary(attempt: Attempt): string {
  if (typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0) {
    return `${attempt.marksEarned}/${attempt.marksAvailable}`;
  }
  return typeof attempt.marksEarned === 'number' ? String(attempt.marksEarned) : '';
}

function examEvidenceStatusLabel(attempt: Attempt): string {
  if (attempt.masteryEligible === true) return 'needs_checked_evidence_before_display';
  if (attempt.masteryGate === 'skill_check_passed') return 'checked_practice_passed_self_marked_exam_practice';
  return 'self_marked_exam_practice_only';
}

function rowForSkillCheckAttempt(attempt: SkillCheckAttemptRecord, exportTimestamp: string): LocalProgressCsvRow {
  const passed = isCleanCheckedPracticeAttempt(attempt);
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
    evidence_status_label: passed ? 'checked_practice_passed' : 'not_passed',
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
    evidence_status_label: 'needs_checked_evidence',
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
    evidence_status_label: examEvidenceStatusLabel(attempt),
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
    evidence_status_label: attempt.strongEvidence ? 'checked_learning_activity' : 'content_activity_only',
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
    evidence_status_label: 'state_update_metadata',
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
    evidence_status_label: 'missed_mark_evidence',
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
    evidence_status_label: 'intervention_metadata',
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
  exportMetadataOrTimestamp: LocalProgressExportMetadata | string = new Date().toISOString(),
): LocalProgressCsvRow[] {
  const exportTimestamp = typeof exportMetadataOrTimestamp === 'string'
    ? exportMetadataOrTimestamp
    : (exportMetadataOrTimestamp.submissionTimestamp ?? new Date().toISOString());
  const exportMetadata = normalizeExportMetadata(exportMetadataOrTimestamp, exportTimestamp);
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
    rowForSubmissionSummary(progress, exportTimestamp, exportMetadata),
    ...skillRows,
    ...examRows,
    ...learningRows,
    ...knowledgeStateRows,
    ...knowledgeErrorRows,
    ...knowledgeInterventionRows,
  ].map((row) => rowWithExportMetadata(row, exportMetadata));
}

export function buildLocalProgressCsv(
  progress: Partial<StoredProgress>,
  exportMetadataOrTimestamp: LocalProgressExportMetadata | string = new Date().toISOString(),
): string {
  return [
    LOCAL_PROGRESS_CSV_HEADERS.join(','),
    ...localProgressCsvRows(progress, exportMetadataOrTimestamp).map(csvLine),
  ].join('\n');
}
