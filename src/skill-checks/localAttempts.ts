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

export function isPassingSkillCheckAttempt(attempt: SkillCheckLocalAttempt): boolean {
  // Phase 3 pass rule: a check passes only on a correct answer before answer/repair reveal.
  return attempt.isCorrect && !attempt.revealedAnswer && !attempt.revealedRepairStep;
}

export function loadSkillCheckAttempts(
  storage: SkillCheckAttemptStorageLike,
  key = ASTERION_PROGRESS_STORAGE_KEY,
): SkillCheckLocalAttempt[] {
  try {
    const parsed = JSON.parse(storage.getItem(key) || 'null') as SkillCheckProgressShape | null;
    return Array.isArray(parsed?.skillCheckAttempts) ? parsed.skillCheckAttempts : [];
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

  const attempts = Array.isArray(progress.skillCheckAttempts) ? progress.skillCheckAttempts : [];
  const nextAttempts = [...attempts, attempt];
  storage.setItem(key, JSON.stringify({
    ...progress,
    skillCheckAttempts: nextAttempts,
  }));
  return nextAttempts;
}

export function skillCheckPassState(
  attempts: SkillCheckLocalAttempt[],
  requiredCheckIds: string[],
): SkillCheckPassState {
  const uniqueRequiredIds = Array.from(new Set(requiredCheckIds.filter(Boolean)));
  const attemptedCheckIds = Array.from(new Set(attempts.map((attempt) => attempt.checkId).filter(Boolean)));
  const passedCheckIds = uniqueRequiredIds.filter((checkId) => (
    attempts.some((attempt) => attempt.checkId === checkId && isPassingSkillCheckAttempt(attempt))
  ));

  return {
    passed: uniqueRequiredIds.length > 0 && passedCheckIds.length === uniqueRequiredIds.length,
    passedCheckIds,
    attemptedCheckIds,
    requiredCheckIds: uniqueRequiredIds,
  };
}
