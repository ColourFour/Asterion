import type { Attempt, ExamAttemptSuspicionFlag } from '../types';
import { ASTERION_PROGRESS_STORAGE_KEY } from '../skill-checks/localAttempts';

export interface ExamAttemptStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ExamAttemptProgressShape {
  attempts?: Attempt[];
  [key: string]: unknown;
}

export interface ExamEvidenceSummary {
  evidenceKind: 'weak_self_marked_exam';
  evidenceLabel: 'Self-marked attempt' | 'Exam practice evidence';
  trustLabel: 'Exam practice evidence' | 'Low-trust self-marked evidence' | 'Needs teacher check';
  masteryGate: 'skill_check_required' | 'skill_check_passed';
  mastered: boolean;
  masteryLabel: 'Skill Check required for mastery' | 'Skill Check passed; exam practice supports confidence';
  suspicionFlags: ExamAttemptSuspicionFlag[];
}

function scoreRatio(attempt: Attempt): number | undefined {
  if (typeof attempt.scoreRatio === 'number' && Number.isFinite(attempt.scoreRatio)) return attempt.scoreRatio;
  if (typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0) {
    return attempt.marksEarned / attempt.marksAvailable;
  }
  return undefined;
}

function markPointCounts(attempt: Attempt): { ticked: number; available: number } {
  const fromParts = (attempt.partScores ?? []).reduce((counts, part) => ({
    ticked: counts.ticked + (part.markPointIds?.length ?? 0),
    available: counts.available + (part.markPointsAvailable ?? 0),
  }), { ticked: 0, available: 0 });

  return {
    ticked: attempt.markPointsTicked ?? fromParts.ticked,
    available: attempt.markPointsAvailable ?? fromParts.available,
  };
}

function isPerfectSelfMarkedAttempt(attempt: Attempt): boolean {
  return Boolean(
    attempt.selfMarked !== false
    && typeof attempt.marksAvailable === 'number'
    && attempt.marksAvailable > 0
    && attempt.marksEarned === attempt.marksAvailable,
  );
}

export function examAttemptSuspicionFlags(
  attempt: Attempt,
  previousAttempts: Attempt[] = [],
): ExamAttemptSuspicionFlag[] {
  const flags = new Set<ExamAttemptSuspicionFlag>();
  const ratio = scoreRatio(attempt);
  const markPoints = markPointCounts(attempt);

  if (isPerfectSelfMarkedAttempt(attempt) && markPoints.available > 0 && markPoints.ticked === 0) {
    flags.add('full_marks_without_mark_points');
  }

  if (attempt.timingReliable === true && typeof ratio === 'number' && ratio >= 0.9 && attempt.timeSpentSeconds > 0 && attempt.timeSpentSeconds < 90) {
    flags.add('very_high_score_low_time');
  }

  const previousPerfectCount = previousAttempts.filter(isPerfectSelfMarkedAttempt).length;
  if (isPerfectSelfMarkedAttempt(attempt) && previousPerfectCount >= 2) {
    flags.add('repeated_perfect_self_marking');
  }

  if (attempt.answerRevealedBeforeMarking) {
    flags.add('answer_revealed_before_marking');
  }

  if (
    (attempt.confidenceRating === 'low' && typeof ratio === 'number' && ratio >= 0.85)
    || (attempt.confidenceRating === 'high' && typeof ratio === 'number' && ratio <= 0.4)
  ) {
    flags.add('confidence_score_mismatch');
  }

  return Array.from(flags);
}

export function examTrustLabel(flags: ExamAttemptSuspicionFlag[]): ExamEvidenceSummary['trustLabel'] {
  if (flags.includes('answer_revealed_before_marking') || flags.includes('repeated_perfect_self_marking')) {
    return 'Needs teacher check';
  }
  if (flags.length > 0) return 'Low-trust self-marked evidence';
  return 'Exam practice evidence';
}

export function summarizeExamEvidence(input: {
  attempt: Attempt;
  previousAttempts?: Attempt[];
  skillCheckPassed: boolean;
}): ExamEvidenceSummary {
  const suspicionFlags = examAttemptSuspicionFlags(input.attempt, input.previousAttempts ?? []);
  const mastered = input.skillCheckPassed;
  return {
    evidenceKind: 'weak_self_marked_exam',
    evidenceLabel: input.attempt.selfMarked === false ? 'Exam practice evidence' : 'Self-marked attempt',
    trustLabel: examTrustLabel(suspicionFlags),
    masteryGate: mastered ? 'skill_check_passed' : 'skill_check_required',
    mastered,
    masteryLabel: mastered
      ? 'Skill Check passed; exam practice supports confidence'
      : 'Skill Check required for mastery',
    suspicionFlags,
  };
}

export function isExamAttemptRecord(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object') return false;
  const attempt = value as Partial<Attempt>;
  return typeof attempt.id === 'string'
    && typeof attempt.questionId === 'string'
    && typeof attempt.paperFamily === 'string'
    && typeof attempt.topicDisplayName === 'string'
    && typeof attempt.marksEarned === 'number'
    && typeof attempt.timeSpentSeconds === 'number'
    && typeof attempt.markSchemeRevealed === 'boolean'
    && typeof attempt.attemptedAt === 'string';
}

export function normalizeExamAttempts(records: unknown): Attempt[] {
  return Array.isArray(records) ? records.filter(isExamAttemptRecord) : [];
}

export function loadExamAttempts(
  storage: ExamAttemptStorageLike,
  key = ASTERION_PROGRESS_STORAGE_KEY,
): Attempt[] {
  try {
    const parsed = JSON.parse(storage.getItem(key) || 'null') as ExamAttemptProgressShape | null;
    return normalizeExamAttempts(parsed?.attempts);
  } catch (_error) {
    return [];
  }
}

export function saveExamAttempt(
  storage: ExamAttemptStorageLike,
  attempt: Attempt,
  key = ASTERION_PROGRESS_STORAGE_KEY,
): Attempt[] {
  let progress: ExamAttemptProgressShape = {};
  try {
    const parsed = JSON.parse(storage.getItem(key) || 'null') as ExamAttemptProgressShape | null;
    progress = parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    progress = {};
  }

  const attempts = normalizeExamAttempts(progress.attempts);
  const nextAttempts = [...attempts, attempt];
  storage.setItem(key, JSON.stringify({
    ...progress,
    attempts: nextAttempts,
  }));
  return nextAttempts;
}
