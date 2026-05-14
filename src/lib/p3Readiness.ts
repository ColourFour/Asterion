import type { Attempt, NormalizedQuestion, RegionLearningRecord } from '../types';
import { filterMasteryEvidence } from './masteryEvidence';
import { matchRegionForLabels, matchRegionForQuestion, normalizeLabel, P3_ASTRAL_ACADEMY } from './worldMap';

export type P3ReadinessLabel =
  | 'Strong evidence'
  | 'Promising but narrow'
  | 'Needs timed practice'
  | 'Needs topic coverage'
  | 'Self-marking uncertain';

export interface P3ReadinessMetric {
  label: string;
  value: string;
  target?: string;
  met: boolean;
}

export interface P3ReadinessIndex {
  score: number;
  label: P3ReadinessLabel;
  explanation: string;
  strengths: string[];
  concerns: string[];
  metrics: P3ReadinessMetric[];
  evidence: {
    canonicalAttempts: number;
    recentAttemptCount: number;
    recentAverageScore?: number;
    unseenTimedAttemptCount: number;
    unseenTimedAverageScore?: number;
    marksPerMinute?: number;
    distinctRegions: number;
    distinctSubtopics: number;
    largestRegionAttemptShare?: number;
    selfMarkingCalibrationRatio?: number;
    weakTopicsIdentified: number;
    weakTopicsRecovered: number;
    delayedReviewCount: number;
    delayedReviewAverageScore?: number;
    guardianAttempts: number;
    guardianClears: number;
  };
}

export const P3_READINESS_THRESHOLDS = {
  delayedReviewDays: 7,
  guardianClears: 2,
  marksPerMinute: 75 / 110,
  recentAttempts: 12,
  recentScoreRatio: 0.75,
  selfMarkingCalibrationRatio: 0.85,
  strongCanonicalAttempts: 24,
  strongDistinctRegions: 7,
  strongDistinctSubtopics: 9,
  strongScore: 85,
  timedUnseenAttempts: 10,
  timedUnseenScoreRatio: 0.7,
  weakRecoveryScoreRatio: 0.7,
  weakTopicScoreRatio: 0.6,
};

const FULL_SCORE_NOTE_MIN_LENGTH = 8;
const MAX_SINGLE_REGION_SHARE = 0.4;

function ratio(attempt: Attempt): number | undefined {
  if (typeof attempt.scoreRatio === 'number' && Number.isFinite(attempt.scoreRatio)) return attempt.scoreRatio;
  if (typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0) return attempt.marksEarned / attempt.marksAvailable;
  return undefined;
}

function average(values: number[]): number | undefined {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function compareAttempts(a: Attempt, b: Attempt): number {
  const timeA = Date.parse(a.attemptedAt);
  const timeB = Date.parse(b.attemptedAt);
  const stableTimeA = Number.isFinite(timeA) ? timeA : 0;
  const stableTimeB = Number.isFinite(timeB) ? timeB : 0;
  return stableTimeA - stableTimeB || a.id.localeCompare(b.id) || a.questionId.localeCompare(b.questionId);
}

function daysBetween(a: Attempt, b: Attempt): number {
  const timeA = Date.parse(a.attemptedAt);
  const timeB = Date.parse(b.attemptedAt);
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB)) return 0;
  return Math.abs(timeB - timeA) / 86_400_000;
}

function isP3CanonicalAttempt(attempt: Attempt): boolean {
  const scoreRatio = ratio(attempt);
  return Boolean(
    normalizeLabel(String(attempt.paperFamily)) === 'p3'
    && typeof scoreRatio === 'number'
    && Number.isFinite(scoreRatio)
    && typeof attempt.marksAvailable === 'number'
    && attempt.marksAvailable > 0
    && typeof attempt.marksEarned === 'number'
    && Number.isFinite(attempt.marksEarned)
    && attempt.markSchemeRevealed
    && typeof attempt.timeSpentSeconds === 'number'
    && attempt.timeSpentSeconds > 0,
  );
}

function isSelfMarkingCalibrated(attempt: Attempt): boolean {
  const scoreRatio = ratio(attempt);
  if (typeof scoreRatio !== 'number') return false;
  const breakdown = attempt.markBreakdown;
  const hasConsistentBreakdown = Boolean(
    breakdown
    && breakdown.m + breakdown.b + breakdown.a === attempt.marksEarned,
  );
  if (!hasConsistentBreakdown) return false;

  if (scoreRatio >= 1) {
    return Boolean(attempt.fullScoreConfirmed && (attempt.note?.trim().length ?? 0) >= FULL_SCORE_NOTE_MIN_LENGTH);
  }

  return Boolean(
    attempt.mistakeTypes?.length
    && !attempt.mistakeTypes.includes('lucky_or_unsure')
    && !attempt.mistakeTypes.includes('other'),
  );
}

function percent(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value * 100)}%` : 'n/a';
}

function fixed(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : 'n/a';
}

function questionIndex(questions: NormalizedQuestion[]): Map<string, NormalizedQuestion> {
  return new Map(questions.map((question) => [question.id, question]));
}

function regionIdForAttempt(attempt: Attempt, questionsById: Map<string, NormalizedQuestion>): string | undefined {
  const question = questionsById.get(attempt.questionId);
  if (question) return matchRegionForQuestion(question)?.id;
  const regionByName = P3_ASTRAL_ACADEMY.regions.find((region) => normalizeLabel(region.name) === normalizeLabel(attempt.regionName));
  if (regionByName) return regionByName.id;
  return matchRegionForLabels([attempt.topicDisplayName, attempt.localTopic, attempt.deepseekTopic, attempt.subtopic])?.id;
}

function subtopicForAttempt(attempt: Attempt, questionsById: Map<string, NormalizedQuestion>): string | undefined {
  const question = questionsById.get(attempt.questionId);
  return normalizeLabel(
    attempt.subtopic
    ?? question?.displaySubtopic
    ?? question?.localSubtopic
    ?? question?.deepseek.subtopic
    ?? attempt.topicDisplayName,
  ) || undefined;
}

function groupKeyForAttempt(attempt: Attempt, questionsById: Map<string, NormalizedQuestion>): string {
  const regionId = regionIdForAttempt(attempt, questionsById);
  const subtopic = subtopicForAttempt(attempt, questionsById);
  return [regionId, subtopic, normalizeLabel(attempt.topicDisplayName)].filter(Boolean).join(':') || attempt.questionId;
}

function firstAttemptsByQuestion(attempts: Attempt[]): Attempt[] {
  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    if (seen.has(attempt.questionId)) return false;
    seen.add(attempt.questionId);
    return true;
  });
}

function weakRecoveryCounts(attempts: Attempt[], questionsById: Map<string, NormalizedQuestion>) {
  const groups = new Map<string, Attempt[]>();
  for (const attempt of attempts) {
    const key = groupKeyForAttempt(attempt, questionsById);
    groups.set(key, [...(groups.get(key) ?? []), attempt]);
  }

  let weakTopicsIdentified = 0;
  let weakTopicsRecovered = 0;
  for (const groupAttempts of groups.values()) {
    const sorted = groupAttempts.slice().sort(compareAttempts);
    const firstWeakIndex = sorted.findIndex((attempt) => (ratio(attempt) ?? 0) < P3_READINESS_THRESHOLDS.weakTopicScoreRatio);
    if (firstWeakIndex === -1) continue;
    weakTopicsIdentified += 1;
    if (sorted.slice(firstWeakIndex + 1).some((attempt) => (ratio(attempt) ?? 0) >= P3_READINESS_THRESHOLDS.weakRecoveryScoreRatio)) {
      weakTopicsRecovered += 1;
    }
  }

  return { weakTopicsIdentified, weakTopicsRecovered };
}

function delayedReviewPerformance(attempts: Attempt[], questionsById: Map<string, NormalizedQuestion>) {
  const groups = new Map<string, Attempt[]>();
  for (const attempt of attempts) {
    const key = groupKeyForAttempt(attempt, questionsById);
    groups.set(key, [...(groups.get(key) ?? []), attempt]);
  }

  const delayedScores: number[] = [];
  for (const groupAttempts of groups.values()) {
    const sorted = groupAttempts.slice().sort(compareAttempts);
    let groupCounted = false;
    for (let index = 1; index < sorted.length && !groupCounted; index += 1) {
      const current = sorted[index];
      const earlier = sorted.slice(0, index).find((attempt) => daysBetween(attempt, current) >= P3_READINESS_THRESHOLDS.delayedReviewDays);
      const currentRatio = ratio(current);
      if (earlier && typeof currentRatio === 'number' && currentRatio >= P3_READINESS_THRESHOLDS.weakRecoveryScoreRatio) {
        delayedScores.push(currentRatio);
        groupCounted = true;
      }
    }
  }

  return {
    delayedReviewCount: delayedScores.length,
    delayedReviewAverageScore: average(delayedScores),
  };
}

function guardianEvidence(regionLearning?: Record<string, RegionLearningRecord>) {
  const records = Object.values(regionLearning ?? {});
  return {
    guardianAttempts: records.filter((record) => record.guardianAttemptedAt).length,
    guardianClears: records.filter((record) => record.guardianClearedAt).length,
  };
}

function readinessScore(input: {
  canonicalAttempts: number;
  recentAverage?: number;
  recentCount: number;
  unseenTimedAverage?: number;
  unseenTimedCount: number;
  marksPerMinute?: number;
  distinctRegions: number;
  distinctSubtopics: number;
  largestRegionShare?: number;
  calibrationRatio?: number;
  weakTopicsIdentified: number;
  weakTopicsRecovered: number;
  delayedReviewCount: number;
  delayedReviewAverage?: number;
  guardianClears: number;
}): number {
  const recent = (
    clamp(input.recentCount / P3_READINESS_THRESHOLDS.recentAttempts) * 0.35
    + clamp((input.recentAverage ?? 0) / P3_READINESS_THRESHOLDS.recentScoreRatio) * 0.65
  ) * 22;
  const unseenTimed = (
    clamp(input.unseenTimedCount / P3_READINESS_THRESHOLDS.timedUnseenAttempts) * 0.4
    + clamp((input.unseenTimedAverage ?? 0) / P3_READINESS_THRESHOLDS.timedUnseenScoreRatio) * 0.6
  ) * 18;
  const concentration = typeof input.largestRegionShare === 'number'
    ? clamp((1 - input.largestRegionShare) / (1 - MAX_SINGLE_REGION_SHARE))
    : 0;
  const coverage = (
    clamp(input.distinctRegions / P3_READINESS_THRESHOLDS.strongDistinctRegions) * 0.45
    + clamp(input.distinctSubtopics / P3_READINESS_THRESHOLDS.strongDistinctSubtopics) * 0.35
    + concentration * 0.2
  ) * 18;
  const speed = clamp((input.marksPerMinute ?? 0) / P3_READINESS_THRESHOLDS.marksPerMinute)
    * clamp(input.unseenTimedCount / P3_READINESS_THRESHOLDS.timedUnseenAttempts)
    * 12;
  const calibration = clamp((input.calibrationRatio ?? 0) / P3_READINESS_THRESHOLDS.selfMarkingCalibrationRatio) * 10;
  const weakRecovery = input.weakTopicsIdentified === 0
    ? clamp(input.canonicalAttempts / P3_READINESS_THRESHOLDS.strongCanonicalAttempts) * 8
    : clamp(input.weakTopicsRecovered / input.weakTopicsIdentified) * 8;
  const delayed = (
    clamp(input.delayedReviewCount / 4) * 0.4
    + clamp((input.delayedReviewAverage ?? 0) / P3_READINESS_THRESHOLDS.weakRecoveryScoreRatio) * 0.6
  ) * 7;
  const guardian = clamp(input.guardianClears / P3_READINESS_THRESHOLDS.guardianClears) * 5;
  return Math.round(recent + unseenTimed + coverage + speed + calibration + weakRecovery + delayed + guardian);
}

export function calculateP3ReadinessIndex(input: {
  attempts: Attempt[];
  questions?: NormalizedQuestion[];
  regionLearning?: Record<string, RegionLearningRecord>;
}): P3ReadinessIndex {
  const questionsById = questionIndex(input.questions ?? []);
  const canonicalAttempts = filterMasteryEvidence({ attempts: input.attempts, questions: input.questions })
    .map((evidence) => evidence.attempt)
    .filter(isP3CanonicalAttempt)
    .slice()
    .sort(compareAttempts);
  const recentAttempts = canonicalAttempts.slice(-P3_READINESS_THRESHOLDS.recentAttempts);
  const recentRatios = recentAttempts.map(ratio).filter((value): value is number => typeof value === 'number');
  const firstAttempts = firstAttemptsByQuestion(canonicalAttempts);
  const unseenTimedRatios = firstAttempts.map(ratio).filter((value): value is number => typeof value === 'number');
  const minutes = canonicalAttempts.reduce((sum, attempt) => sum + attempt.timeSpentSeconds / 60, 0);
  const marksPerMinute = minutes > 0 ? canonicalAttempts.reduce((sum, attempt) => sum + attempt.marksEarned, 0) / minutes : undefined;
  const regionIds = canonicalAttempts.map((attempt) => regionIdForAttempt(attempt, questionsById)).filter((value): value is string => Boolean(value));
  const distinctRegions = new Set(regionIds);
  const subtopics = canonicalAttempts.map((attempt) => subtopicForAttempt(attempt, questionsById)).filter((value): value is string => Boolean(value));
  const regionCounts = regionIds.reduce<Record<string, number>>((counts, regionId) => {
    counts[regionId] = (counts[regionId] ?? 0) + 1;
    return counts;
  }, {});
  const largestRegionAttemptShare = canonicalAttempts.length
    ? Math.max(0, ...Object.values(regionCounts)) / canonicalAttempts.length
    : undefined;
  const calibratedAttempts = canonicalAttempts.filter(isSelfMarkingCalibrated).length;
  const selfMarkingCalibrationRatio = canonicalAttempts.length ? calibratedAttempts / canonicalAttempts.length : undefined;
  const { weakTopicsIdentified, weakTopicsRecovered } = weakRecoveryCounts(canonicalAttempts, questionsById);
  const { delayedReviewCount, delayedReviewAverageScore } = delayedReviewPerformance(canonicalAttempts, questionsById);
  const { guardianAttempts, guardianClears } = guardianEvidence(input.regionLearning);
  const recentAverageScore = average(recentRatios);
  const unseenTimedAverageScore = average(unseenTimedRatios);
  const score = readinessScore({
    calibrationRatio: selfMarkingCalibrationRatio,
    canonicalAttempts: canonicalAttempts.length,
    delayedReviewAverage: delayedReviewAverageScore,
    delayedReviewCount,
    distinctRegions: distinctRegions.size,
    distinctSubtopics: new Set(subtopics).size,
    guardianClears,
    largestRegionShare: largestRegionAttemptShare,
    marksPerMinute,
    recentAverage: recentAverageScore,
    recentCount: recentAttempts.length,
    unseenTimedAverage: unseenTimedAverageScore,
    unseenTimedCount: firstAttempts.length,
    weakTopicsIdentified,
    weakTopicsRecovered,
  });

  const hasEnoughAttempts = canonicalAttempts.length >= P3_READINESS_THRESHOLDS.strongCanonicalAttempts;
  const hasStrongRecent = recentAttempts.length >= P3_READINESS_THRESHOLDS.recentAttempts && (recentAverageScore ?? 0) >= P3_READINESS_THRESHOLDS.recentScoreRatio;
  const hasTimedEvidence = firstAttempts.length >= P3_READINESS_THRESHOLDS.timedUnseenAttempts && (unseenTimedAverageScore ?? 0) >= P3_READINESS_THRESHOLDS.timedUnseenScoreRatio;
  const hasPace = (marksPerMinute ?? 0) >= P3_READINESS_THRESHOLDS.marksPerMinute;
  const hasCoverage = distinctRegions.size >= P3_READINESS_THRESHOLDS.strongDistinctRegions
    && new Set(subtopics).size >= P3_READINESS_THRESHOLDS.strongDistinctSubtopics
    && (largestRegionAttemptShare ?? 1) <= MAX_SINGLE_REGION_SHARE;
  const hasCalibration = (selfMarkingCalibrationRatio ?? 0) >= P3_READINESS_THRESHOLDS.selfMarkingCalibrationRatio;
  const hasWeakRecovery = weakTopicsIdentified === 0 || weakTopicsRecovered >= Math.min(weakTopicsIdentified, 3);
  const hasDelayedReview = delayedReviewCount >= 4 && (delayedReviewAverageScore ?? 0) >= P3_READINESS_THRESHOLDS.weakRecoveryScoreRatio;
  const hasGuardianEvidence = guardianClears >= P3_READINESS_THRESHOLDS.guardianClears;
  const strong = score >= P3_READINESS_THRESHOLDS.strongScore
    && hasEnoughAttempts
    && hasStrongRecent
    && hasTimedEvidence
    && hasPace
    && hasCoverage
    && hasCalibration
    && hasWeakRecovery
    && hasDelayedReview
    && hasGuardianEvidence;
  const promisingButNarrow = hasStrongRecent && hasTimedEvidence && hasPace && !hasCoverage;

  const label: P3ReadinessLabel = strong
    ? 'Strong evidence'
    : canonicalAttempts.length >= 4 && !hasCalibration
      ? 'Self-marking uncertain'
      : promisingButNarrow
        ? 'Promising but narrow'
        : !hasTimedEvidence || !hasPace
          ? 'Needs timed practice'
          : 'Needs topic coverage';

  const concerns = [
    !hasEnoughAttempts ? `Needs at least ${P3_READINESS_THRESHOLDS.strongCanonicalAttempts} saved canonical P3 attempts.` : undefined,
    !hasStrongRecent ? `Recent canonical marks are below ${percent(P3_READINESS_THRESHOLDS.recentScoreRatio)} or too sparse.` : undefined,
    !hasTimedEvidence ? `Needs ${P3_READINESS_THRESHOLDS.timedUnseenAttempts} first-saved timed question attempts at ${percent(P3_READINESS_THRESHOLDS.timedUnseenScoreRatio)} or better.` : undefined,
    !hasPace ? `Marks per minute is below the P3 paper pace target of ${fixed(P3_READINESS_THRESHOLDS.marksPerMinute)}.` : undefined,
    !hasCoverage ? 'Needs broader topic and subtopic coverage before this can represent full P3 readiness.' : undefined,
    !hasCalibration ? 'Self-marking evidence is uncertain; perfect scores need confirmation notes and non-perfect scores need clear mistake tags.' : undefined,
    !hasWeakRecovery ? 'Weak-topic recovery is not yet shown across enough earlier weak areas.' : undefined,
    !hasDelayedReview ? 'Delayed review evidence is still thin or below target.' : undefined,
    !hasGuardianEvidence ? `Needs ${P3_READINESS_THRESHOLDS.guardianClears} cleared Guardian outcomes.` : undefined,
  ].filter((item): item is string => Boolean(item));

  const strengths = [
    hasStrongRecent ? 'Recent canonical question marks are strong.' : undefined,
    hasTimedEvidence && hasPace ? 'Unseen timed attempts are on pace.' : undefined,
    hasCoverage ? 'Topic and subtopic spread is broad enough for P3.' : undefined,
    hasCalibration ? 'Self-marking records look calibrated.' : undefined,
    hasWeakRecovery ? 'Weak-topic recovery is visible.' : undefined,
    hasDelayedReview ? 'Delayed review performance is holding.' : undefined,
    hasGuardianEvidence ? 'Guardian outcomes support readiness.' : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    score,
    label,
    explanation: strong
      ? 'Recent marks, timed unseen attempts, coverage, pace, calibration, delayed review, recovery, and Guardian outcomes all support full P3 readiness.'
      : concerns[0] ?? 'More assessment evidence is needed before this can represent full P3 readiness.',
    strengths,
    concerns,
    metrics: [
      { label: 'Recent canonical marks', value: percent(recentAverageScore), target: `${percent(P3_READINESS_THRESHOLDS.recentScoreRatio)} over ${P3_READINESS_THRESHOLDS.recentAttempts}`, met: hasStrongRecent },
      { label: 'Unseen timed attempts', value: `${firstAttempts.length} at ${percent(unseenTimedAverageScore)}`, target: `${P3_READINESS_THRESHOLDS.timedUnseenAttempts} at ${percent(P3_READINESS_THRESHOLDS.timedUnseenScoreRatio)}`, met: hasTimedEvidence },
      { label: 'Marks per minute', value: fixed(marksPerMinute), target: fixed(P3_READINESS_THRESHOLDS.marksPerMinute), met: hasPace },
      { label: 'Topic coverage', value: `${distinctRegions.size} regions, ${new Set(subtopics).size} subtopics`, target: `${P3_READINESS_THRESHOLDS.strongDistinctRegions} regions, ${P3_READINESS_THRESHOLDS.strongDistinctSubtopics} subtopics`, met: hasCoverage },
      { label: 'Self-marking calibration', value: percent(selfMarkingCalibrationRatio), target: percent(P3_READINESS_THRESHOLDS.selfMarkingCalibrationRatio), met: hasCalibration },
      { label: 'Weak-topic recovery', value: `${weakTopicsRecovered}/${weakTopicsIdentified || 0}`, target: weakTopicsIdentified ? `recover ${Math.min(weakTopicsIdentified, 3)} weak areas` : 'no weak topics found', met: hasWeakRecovery },
      { label: 'Delayed review', value: `${delayedReviewCount} at ${percent(delayedReviewAverageScore)}`, target: `4 at ${percent(P3_READINESS_THRESHOLDS.weakRecoveryScoreRatio)}`, met: hasDelayedReview },
      { label: 'Guardian outcomes', value: `${guardianClears}/${guardianAttempts}`, target: `${P3_READINESS_THRESHOLDS.guardianClears} cleared`, met: hasGuardianEvidence },
    ],
    evidence: {
      canonicalAttempts: canonicalAttempts.length,
      delayedReviewAverageScore,
      delayedReviewCount,
      distinctRegions: distinctRegions.size,
      distinctSubtopics: new Set(subtopics).size,
      guardianAttempts,
      guardianClears,
      largestRegionAttemptShare,
      marksPerMinute,
      recentAttemptCount: recentAttempts.length,
      recentAverageScore,
      selfMarkingCalibrationRatio,
      unseenTimedAttemptCount: firstAttempts.length,
      unseenTimedAverageScore,
      weakTopicsIdentified,
      weakTopicsRecovered,
    },
  };
}
