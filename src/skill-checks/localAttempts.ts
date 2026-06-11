import type { SkillCheckAttemptRecord } from '../types';

export type SkillCheckLocalAttempt = SkillCheckAttemptRecord;

export interface SkillCheckAttemptStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SkillCheckProgressShape {
  skillCheckAttempts?: SkillCheckLocalAttempt[];
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

export function isPassingSkillCheckAttempt(attempt: SkillCheckLocalAttempt): boolean {
  // Phase 3 pass rule: a check passes only on a correct answer before answer/repair reveal.
  return isSkillCheckLocalAttemptRecord(attempt)
    && attempt.isCorrect
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
  storage.setItem(key, JSON.stringify({
    ...progress,
    skillCheckAttempts: nextAttempts,
  }));
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
  storage.setItem(key, JSON.stringify({
    ...progress,
    skillCheckAttempts: nextAttempts,
  }));
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
