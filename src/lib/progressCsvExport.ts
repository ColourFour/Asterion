import type { Attempt, LearningActivityAttempt, SkillCheckAttemptRecord, StoredProgress } from '../types';
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
    activity_type: 'Skill Check',
    item_id: attempt.checkId,
    attempt_timestamp: attempt.timestamp,
    answer_result_summary: attempt.submittedAnswer,
    deterministic_pass_fail: passed ? 'pass' : 'fail',
    evidence_label: passed ? 'Deterministic Skill Check evidence' : 'Skill Check attempt',
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
    evidence_label: 'Review candidate from local Skill Check attempt',
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
    activity_type: isLearnMode ? 'Learn Mode' : (attempt.activityType ?? 'Field Guide'),
    item_id: attempt.activityId ?? attempt.id,
    attempt_timestamp: attempt.completedAt ?? attempt.createdAt ?? '',
    answer_result_summary: attempt.submittedAnswer ?? attempt.prompt ?? '',
    deterministic_pass_fail: typeof attempt.isCorrect === 'boolean' ? (attempt.isCorrect ? 'pass' : 'fail') : 'not_available',
    evidence_label: 'Local learning activity',
    mastery_eligibility_label: attempt.strongEvidence ? 'clean_checked_learning_attempt' : 'not_mastery_evidence',
    suspicion_flags: (attempt.mistakeTags ?? []).join('|'),
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
  return [...skillRows, ...examRows, ...learningRows];
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
