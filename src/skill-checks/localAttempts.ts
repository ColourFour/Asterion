import type {
  SkillCheckAttemptRecord,
  StudentAttemptHistory,
  StudentAttemptHistoryRecord,
  StudyCourseId,
} from '../types';
import {
  assessmentFromSkillCheckAttempt,
  updateErrorClassificationFromTags,
  updateStudentPerformanceState,
} from '../lib/studentAnalytics';

export type SkillCheckLocalAttempt = SkillCheckAttemptRecord;

export interface SkillCheckAttemptStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SkillCheckProgressShape {
  skillCheckAttempts?: SkillCheckLocalAttempt[];
  attemptHistory?: StudentAttemptHistory;
  [key: string]: unknown;
}

export interface SkillCheckPassState {
  passed: boolean;
  passedCheckIds: string[];
  attemptedCheckIds: string[];
  requiredCheckIds: string[];
}

export const ASTERION_PROGRESS_STORAGE_KEY = 'asterion.progress.v1';

function normalizedStudyCourse(value: unknown): StudyCourseId | undefined {
  if (value === undefined) return 'p3';
  return value === 'p1' || value === 'p3' ? value : undefined;
}

export function isSkillCheckLocalAttemptRecord(value: unknown): value is SkillCheckLocalAttempt {
  if (!value || typeof value !== 'object') return false;
  const attempt = value as Partial<SkillCheckLocalAttempt>;
  return normalizedStudyCourse(attempt.course) !== undefined
    && typeof attempt.attemptId === 'string'
    && typeof attempt.topic === 'string'
    && typeof attempt.skillId === 'string'
    && typeof attempt.checkId === 'string'
    && typeof attempt.submittedAnswer === 'string'
    && typeof attempt.isCorrect === 'boolean'
    && typeof attempt.usedHint === 'boolean'
    && typeof attempt.revealedAnswer === 'boolean'
    && typeof attempt.revealedRepairStep === 'boolean'
    && Array.isArray(attempt.mistakeTags)
    && attempt.mistakeTags.every((tag) => typeof tag === 'string')
    && typeof attempt.timestamp === 'string'
    && (attempt.retryVariantId === undefined || typeof attempt.retryVariantId === 'string')
    && (attempt.strongEvidence === undefined || typeof attempt.strongEvidence === 'boolean');
}

export function normalizeSkillCheckLocalAttempts(records: unknown): SkillCheckLocalAttempt[] {
  if (!Array.isArray(records)) return [];
  return records
    .filter(isSkillCheckLocalAttemptRecord)
    .map((attempt) => ({
      ...attempt,
      course: normalizedStudyCourse(attempt.course) ?? 'p3',
    }));
}

export function isStudentAttemptHistoryRecord(value: unknown): value is StudentAttemptHistoryRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<StudentAttemptHistoryRecord>;
  return typeof record.id === 'string'
    && (record.source === 'checked_practice' || record.source === 'learn_mode')
    && normalizedStudyCourse(record.course) !== undefined
    && typeof record.questionId === 'string'
    && typeof record.response === 'string'
    && typeof record.correct === 'boolean'
    && typeof record.timestamp === 'string'
    && typeof record.attemptNumber === 'number'
    && Number.isFinite(record.attemptNumber)
    && record.attemptNumber >= 1
    && (record.retryVariantId === undefined || typeof record.retryVariantId === 'string');
}

export function normalizeStudentAttemptHistory(value: unknown): StudentAttemptHistory {
  if (!value || typeof value !== 'object') return { schemaVersion: 1, records: [] };
  const history = value as Partial<StudentAttemptHistory>;
  return {
    schemaVersion: 1,
    records: Array.isArray(history.records)
      ? history.records
        .filter(isStudentAttemptHistoryRecord)
        .map((record) => ({
          ...record,
          course: normalizedStudyCourse(record.course) ?? 'p3',
        }))
      : [],
  };
}

export function nextStudentAttemptNumber(
  history: StudentAttemptHistory,
  questionId: string,
  course: StudyCourseId = 'p3',
): number {
  const matchingAttempts = normalizeStudentAttemptHistory(history).records
    .filter((record) => record.course === course && record.questionId === questionId)
    .map((record) => record.attemptNumber);
  return matchingAttempts.length ? Math.max(...matchingAttempts) + 1 : 1;
}

export function appendStudentAttemptHistoryRecord(
  history: unknown,
  record: Omit<StudentAttemptHistoryRecord, 'attemptNumber'> & { attemptNumber?: number },
): StudentAttemptHistory {
  const normalized = normalizeStudentAttemptHistory(history);
  const attemptNumber = typeof record.attemptNumber === 'number' && Number.isFinite(record.attemptNumber) && record.attemptNumber >= 1
    ? record.attemptNumber
    : nextStudentAttemptNumber(normalized, record.questionId, record.course);
  return {
    schemaVersion: 1,
    records: [...normalized.records, { ...record, attemptNumber }],
  };
}

function isIntrinsicallyStrongSkillCheckAttempt(attempt: SkillCheckLocalAttempt): boolean {
  return isSkillCheckLocalAttemptRecord(attempt)
    && attempt.isCorrect
    && !attempt.usedHint
    && !attempt.revealedAnswer
    && !attempt.revealedRepairStep;
}

function evidenceItemKey(attempt: SkillCheckLocalAttempt): string {
  const course = normalizedStudyCourse(attempt.course) ?? 'p3';
  const retryVariantId = attempt.retryVariantId?.trim() || 'primary';
  return `${course}\u0000${attempt.checkId}\u0000${retryVariantId}`;
}

export function isStrongSkillCheckEvidenceAttempt(
  attempt: SkillCheckLocalAttempt,
  attemptHistory: SkillCheckLocalAttempt[],
): boolean {
  if (!isIntrinsicallyStrongSkillCheckAttempt(attempt)) return false;
  const normalizedHistory = normalizeSkillCheckLocalAttempts(attemptHistory);
  const key = evidenceItemKey(attempt);
  const attemptIndex = normalizedHistory.findIndex((candidate) => (
    candidate.attemptId === attempt.attemptId && evidenceItemKey(candidate) === key
  ));
  if (attemptIndex < 0) return false;
  return normalizedHistory.findIndex((candidate) => evidenceItemKey(candidate) === key) === attemptIndex;
}

export function isPassingSkillCheckAttempt(
  attempt: SkillCheckLocalAttempt,
  attemptHistory: SkillCheckLocalAttempt[] = [attempt],
): boolean {
  return isStrongSkillCheckEvidenceAttempt(attempt, attemptHistory);
}

export function loadSkillCheckAttempts(
  storage: SkillCheckAttemptStorageLike,
  key = ASTERION_PROGRESS_STORAGE_KEY,
): SkillCheckLocalAttempt[] {
  try {
    const parsed = JSON.parse(storage.getItem(key) || 'null') as SkillCheckProgressShape | null;
    return normalizeSkillCheckLocalAttempts(parsed?.skillCheckAttempts);
  } catch (_error) {
    return [];
  }
}

export function saveSkillCheckAttempt(
  storage: SkillCheckAttemptStorageLike,
  attempt: SkillCheckLocalAttempt,
  key = ASTERION_PROGRESS_STORAGE_KEY,
): SkillCheckLocalAttempt[] {
  let progress: SkillCheckProgressShape = {};
  try {
    const parsed = JSON.parse(storage.getItem(key) || 'null') as SkillCheckProgressShape | null;
    progress = parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    progress = {};
  }

  const attempts = normalizeSkillCheckLocalAttempts(progress.skillCheckAttempts);
  const normalizedAttempt: SkillCheckLocalAttempt = {
    ...attempt,
    course: normalizedStudyCourse(attempt.course) ?? 'p3',
    strongEvidence: isIntrinsicallyStrongSkillCheckAttempt(attempt)
      && !attempts.some((candidate) => evidenceItemKey(candidate) === evidenceItemKey(attempt)),
  };
  const nextAttempts = [...attempts, normalizedAttempt];
  const nextHistory = appendStudentAttemptHistoryRecord(progress.attemptHistory, {
    id: `${normalizedAttempt.attemptId}:history`,
    source: 'checked_practice',
    course: normalizedAttempt.course,
    questionId: normalizedAttempt.checkId,
    questionTitle: normalizedAttempt.topic,
    topic: normalizedAttempt.topic,
    regionId: normalizedAttempt.regionId,
    skillId: normalizedAttempt.skillId,
    response: normalizedAttempt.submittedAnswer,
    responseDisplay: normalizedAttempt.submittedAnswer,
    correct: normalizedAttempt.isCorrect,
    timestamp: normalizedAttempt.timestamp,
    retryVariantId: normalizedAttempt.retryVariantId,
    relatedAttemptId: normalizedAttempt.attemptId,
  });
  const nextProgress = updateStudentPerformanceState({
    ...progress,
    skillCheckAttempts: nextAttempts,
    attemptHistory: nextHistory,
  }, assessmentFromSkillCheckAttempt(normalizedAttempt));
  storage.setItem(key, JSON.stringify(nextProgress));
  return nextAttempts;
}

export function updateLatestSkillCheckAttemptMistakeTags(
  storage: SkillCheckAttemptStorageLike,
  checkId: string,
  mistakeTags: string[],
  key = ASTERION_PROGRESS_STORAGE_KEY,
): SkillCheckLocalAttempt | undefined {
  let progress: SkillCheckProgressShape = {};
  try {
    const parsed = JSON.parse(storage.getItem(key) || 'null') as SkillCheckProgressShape | null;
    progress = parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return undefined;
  }

  const attempts = normalizeSkillCheckLocalAttempts(progress.skillCheckAttempts);
  const index = attempts.map((attempt) => attempt.checkId).lastIndexOf(checkId);
  if (index < 0) return undefined;

  const updatedAttempt = {
    ...attempts[index],
    mistakeTags,
  };
  const nextAttempts = attempts.slice();
  nextAttempts[index] = updatedAttempt;
  const nextProgress = updateErrorClassificationFromTags({
    ...progress,
    skillCheckAttempts: nextAttempts,
  }, checkId, mistakeTags);
  storage.setItem(key, JSON.stringify(nextProgress));
  return updatedAttempt;
}

export function skillCheckPassState(
  attempts: SkillCheckLocalAttempt[],
  requiredCheckIds: string[],
  course?: StudyCourseId,
): SkillCheckPassState {
  const normalizedAttempts = normalizeSkillCheckLocalAttempts(attempts);
  const validAttempts = course
    ? normalizedAttempts.filter((attempt) => attempt.course === course)
    : normalizedAttempts;
  const uniqueRequiredIds = Array.from(new Set(requiredCheckIds.filter(Boolean)));
  const attemptedCheckIds = Array.from(new Set(validAttempts.map((attempt) => attempt.checkId).filter(Boolean)));
  const passedCheckIds = uniqueRequiredIds.filter((checkId) => (
    validAttempts.some((attempt) => (
      attempt.checkId === checkId && isPassingSkillCheckAttempt(attempt, validAttempts)
    ))
  ));

  return {
    passed: uniqueRequiredIds.length > 0 && passedCheckIds.length === uniqueRequiredIds.length,
    passedCheckIds,
    attemptedCheckIds,
    requiredCheckIds: uniqueRequiredIds,
  };
}
