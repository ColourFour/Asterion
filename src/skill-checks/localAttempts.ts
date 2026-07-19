import type { SkillCheckAttemptRecord, StudentAttemptHistory, StudentAttemptHistoryRecord } from '../types';
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

export function isSkillCheckLocalAttemptRecord(value: unknown): value is SkillCheckLocalAttempt {
  if (!value || typeof value !== 'object') return false;
  const attempt = value as Partial<SkillCheckLocalAttempt>;
  return attempt.course === 'p3'
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
    && typeof attempt.timestamp === 'string';
}

export function normalizeSkillCheckLocalAttempts(records: unknown): SkillCheckLocalAttempt[] {
  return Array.isArray(records) ? records.filter(isSkillCheckLocalAttemptRecord) : [];
}

export function isStudentAttemptHistoryRecord(value: unknown): value is StudentAttemptHistoryRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<StudentAttemptHistoryRecord>;
  return typeof record.id === 'string'
    && (record.source === 'checked_practice' || record.source === 'learn_mode')
    && record.course === 'p3'
    && typeof record.questionId === 'string'
    && typeof record.response === 'string'
    && typeof record.correct === 'boolean'
    && typeof record.timestamp === 'string'
    && typeof record.attemptNumber === 'number'
    && Number.isFinite(record.attemptNumber)
    && record.attemptNumber >= 1;
}

export function normalizeStudentAttemptHistory(value: unknown): StudentAttemptHistory {
  if (!value || typeof value !== 'object') return { schemaVersion: 1, records: [] };
  const history = value as Partial<StudentAttemptHistory>;
  return {
    schemaVersion: 1,
    records: Array.isArray(history.records) ? history.records.filter(isStudentAttemptHistoryRecord) : [],
  };
}

export function nextStudentAttemptNumber(history: StudentAttemptHistory, questionId: string): number {
  const matchingAttempts = normalizeStudentAttemptHistory(history).records
    .filter((record) => record.questionId === questionId)
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
    : nextStudentAttemptNumber(normalized, record.questionId);
  return {
    schemaVersion: 1,
    records: [...normalized.records, { ...record, attemptNumber }],
  };
}

export function isPassingSkillCheckAttempt(attempt: SkillCheckLocalAttempt): boolean {
  // Phase 3 pass rule: a check passes only on a correct answer without assistance.
  return isSkillCheckLocalAttemptRecord(attempt)
    && attempt.isCorrect
    && !attempt.usedHint
    && !attempt.revealedAnswer
    && !attempt.revealedRepairStep;
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
  const nextAttempts = [...attempts, attempt];
  const nextHistory = appendStudentAttemptHistoryRecord(progress.attemptHistory, {
    id: `${attempt.attemptId}:history`,
    source: 'checked_practice',
    course: attempt.course,
    questionId: attempt.checkId,
    questionTitle: attempt.topic,
    topic: attempt.topic,
    regionId: attempt.regionId,
    skillId: attempt.skillId,
    response: attempt.submittedAnswer,
    responseDisplay: attempt.submittedAnswer,
    correct: attempt.isCorrect,
    timestamp: attempt.timestamp,
    relatedAttemptId: attempt.attemptId,
  });
  const progressWithAttempt = {
    ...progress,
    skillCheckAttempts: nextAttempts,
    attemptHistory: nextHistory,
  };
  const nextProgress = !attempt.isCorrect || isPassingSkillCheckAttempt(attempt)
    ? updateStudentPerformanceState(progressWithAttempt, assessmentFromSkillCheckAttempt(attempt))
    : progressWithAttempt;
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
): SkillCheckPassState {
  const validAttempts = normalizeSkillCheckLocalAttempts(attempts);
  const uniqueRequiredIds = Array.from(new Set(requiredCheckIds.filter(Boolean)));
  const attemptedCheckIds = Array.from(new Set(validAttempts.map((attempt) => attempt.checkId).filter(Boolean)));
  const passedCheckIds = uniqueRequiredIds.filter((checkId) => (
    validAttempts.some((attempt) => attempt.checkId === checkId && isPassingSkillCheckAttempt(attempt))
  ));

  return {
    passed: uniqueRequiredIds.length > 0 && passedCheckIds.length === uniqueRequiredIds.length,
    passedCheckIds,
    attemptedCheckIds,
    requiredCheckIds: uniqueRequiredIds,
  };
}
