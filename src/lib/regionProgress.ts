import type { Attempt, NormalizedQuestion, RegionDefinition, RegionLearningRecord, RegionProgress, RegionRank, WorldDefinition } from '../types';
import { isQuestionTrainable } from './questionTraining';
import { filterMasteryEvidenceQuestionsForRegion, filterPracticeDisplayQuestionsForRegion } from './questionEligibility';
import { filterQuestionsForRegion, matchRegionForLabels, P3_ASTRAL_ACADEMY } from './worldMap';

export const REGION_RANK_THRESHOLDS = {
  bronze: { attempts: 3, ratio: 0.5 },
  silver: { attempts: 7, ratio: 0.65 },
  gold: { attempts: 12, ratio: 0.8 },
};

export const REGION_MASTERED_REQUIREMENTS = {
  attempts: 14,
  ratio: 0.85,
  recentWindow: 5,
};

export type RecentMixedReviewEvidenceReason =
  | 'mixed_subtopics'
  | 'mixed_method_families'
  | 'no_recent_successful_attempts'
  | 'insufficient_distinct_metadata'
  | 'repeated_same_subtopic_method_family';

export interface RecentMixedReviewEvidence {
  hasMixedReview: boolean;
  reason: RecentMixedReviewEvidenceReason;
  recentSuccessfulAttempts: number;
  metadataBearingAttempts: number;
  distinctSubtopics: number;
  distinctMethodFamilies: number;
}

const SUBTOPIC_METADATA_KEYS = ['subtopic', 'subtopicId', 'subtopic_id', 'concept', 'narrowSkill', 'narrow_skill', 'skill', 'skillId', 'skill_id'];
const METHOD_FAMILY_METADATA_KEYS = ['methodFamily', 'method_family', 'method family', 'strategy', 'problemType', 'problem_type', 'problem type'];

function ratio(earned: number, available: number): number | undefined {
  return available > 0 ? earned / available : undefined;
}

function attemptRatio(attempt: Attempt): number | undefined {
  return attempt.scoreRatio ?? ratio(attempt.marksEarned, attempt.marksAvailable ?? 0);
}

function normalizeEvidenceMetadata(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const normalized = String(value).trim().toLowerCase().replace(/[_/-]+/g, ' ').replace(/\s+/g, ' ');
  return normalized || undefined;
}

function metadataValue(attempt: Attempt, keys: string[]): string | undefined {
  const record = attempt as unknown as Record<string, unknown>;
  for (const key of keys) {
    const value = normalizeEvidenceMetadata(record[key]);
    if (value) return value;
  }
  return undefined;
}

function compareAttemptsByTimeAndId(a: Attempt, b: Attempt): number {
  const timeA = Date.parse(a.attemptedAt);
  const timeB = Date.parse(b.attemptedAt);
  const stableTimeA = Number.isFinite(timeA) ? timeA : 0;
  const stableTimeB = Number.isFinite(timeB) ? timeB : 0;
  return stableTimeA - stableTimeB || a.id.localeCompare(b.id) || a.questionId.localeCompare(b.questionId);
}

function isSuccessfulAttemptEvidence(attempt: Attempt): boolean {
  const score = attemptRatio(attempt);
  return Boolean(
    typeof score === 'number'
    && Number.isFinite(score)
    && score >= REGION_MASTERED_REQUIREMENTS.ratio
    && attempt.markSchemeRevealed
    && typeof attempt.timeSpentSeconds === 'number'
    && attempt.timeSpentSeconds > 0
    && typeof attempt.marksAvailable === 'number'
    && attempt.marksAvailable > 0,
  );
}

export function getRecentMixedReviewEvidence(attempts: Attempt[]): RecentMixedReviewEvidence {
  const recentSuccessfulAttempts = attempts
    .slice()
    .sort(compareAttemptsByTimeAndId)
    .slice(-REGION_MASTERED_REQUIREMENTS.recentWindow)
    .filter(isSuccessfulAttemptEvidence);

  const subtopics = new Set<string>();
  const methodFamilies = new Set<string>();
  let metadataBearingAttempts = 0;

  for (const attempt of recentSuccessfulAttempts) {
    const subtopic = metadataValue(attempt, SUBTOPIC_METADATA_KEYS);
    const methodFamily = metadataValue(attempt, METHOD_FAMILY_METADATA_KEYS);
    if (subtopic || methodFamily) metadataBearingAttempts += 1;
    if (subtopic) subtopics.add(subtopic);
    if (methodFamily) methodFamilies.add(methodFamily);
  }

  if (subtopics.size > 1) {
    return {
      hasMixedReview: true,
      reason: 'mixed_subtopics',
      recentSuccessfulAttempts: recentSuccessfulAttempts.length,
      metadataBearingAttempts,
      distinctSubtopics: subtopics.size,
      distinctMethodFamilies: methodFamilies.size,
    };
  }

  if (methodFamilies.size > 1) {
    return {
      hasMixedReview: true,
      reason: 'mixed_method_families',
      recentSuccessfulAttempts: recentSuccessfulAttempts.length,
      metadataBearingAttempts,
      distinctSubtopics: subtopics.size,
      distinctMethodFamilies: methodFamilies.size,
    };
  }

  const reason: RecentMixedReviewEvidenceReason = recentSuccessfulAttempts.length === 0
    ? 'no_recent_successful_attempts'
    : metadataBearingAttempts < 2 || (subtopics.size + methodFamilies.size) < 2
      ? 'insufficient_distinct_metadata'
      : 'repeated_same_subtopic_method_family';

  return {
    hasMixedReview: false,
    reason,
    recentSuccessfulAttempts: recentSuccessfulAttempts.length,
    metadataBearingAttempts,
    distinctSubtopics: subtopics.size,
    distinctMethodFamilies: methodFamilies.size,
  };
}

export function hasRecentMixedReviewEvidence(attempts: Attempt[]): boolean {
  return getRecentMixedReviewEvidence(attempts).hasMixedReview;
}

export function calculateRegionRank(input: {
  availableQuestions: number;
  activeByDefault: boolean;
  attempts: number;
  averageScoreRatio?: number;
  recentScoreRatio?: number;
  guardianCleared?: boolean;
  hasMixedReview?: boolean;
}): RegionRank {
  if (!input.activeByDefault && input.availableQuestions === 0) return 'Dormant';
  if (input.availableQuestions === 0) return 'Dormant';
  if (input.guardianCleared) return 'Mastered';
  if (input.attempts === 0 || input.attempts === 1) return 'Discovered';

  const average = input.averageScoreRatio ?? 0;
  const recent = input.recentScoreRatio ?? average;
  if (input.hasMixedReview && input.attempts >= REGION_MASTERED_REQUIREMENTS.attempts && average >= REGION_MASTERED_REQUIREMENTS.ratio && recent >= REGION_MASTERED_REQUIREMENTS.ratio) return 'Mastered';
  if (input.attempts >= REGION_RANK_THRESHOLDS.gold.attempts && average >= REGION_RANK_THRESHOLDS.gold.ratio && recent >= 0.75) return 'Gold';
  if (input.attempts >= REGION_RANK_THRESHOLDS.silver.attempts && average >= REGION_RANK_THRESHOLDS.silver.ratio && recent >= 0.6) return 'Silver';
  if (input.attempts >= REGION_RANK_THRESHOLDS.bronze.attempts && average >= REGION_RANK_THRESHOLDS.bronze.ratio) return 'Bronze';
  return 'Discovered';
}

export function filterAttemptsForRegion(
  region: RegionDefinition,
  attempts: Attempt[],
  questions: NormalizedQuestion[] = [],
): Attempt[] {
  const regionQuestions = filterQuestionsForRegion(questions.filter(isQuestionTrainable), region);
  const regionQuestionIds = new Set(regionQuestions.map((question) => question.id));
  return attempts.filter((attempt) => {
    if (attempt.regionName === region.name) return true;
    if (regionQuestionIds.has(attempt.questionId)) return true;
    return matchRegionForLabels([attempt.topicDisplayName, attempt.subtopic, attempt.localTopic, attempt.deepseekTopic])?.id === region.id;
  });
}

export function filterMasteryAttemptsForRegion(
  region: RegionDefinition,
  attempts: Attempt[],
  questions: NormalizedQuestion[] = [],
): Attempt[] {
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const masteryQuestionIds = new Set(filterMasteryEvidenceQuestionsForRegion(questions, region).map((question) => question.id));

  return attempts.filter((attempt) => {
    if (attempt.masteryEligible === false) return false;
    const question = questionsById.get(attempt.questionId);
    if (question) return masteryQuestionIds.has(question.id);

    if (attempt.regionName === region.name) return true;
    return matchRegionForLabels([attempt.topicDisplayName, attempt.subtopic, attempt.localTopic, attempt.deepseekTopic])?.id === region.id;
  });
}

export function calculateRegionProgress(
  region: RegionDefinition,
  questions: NormalizedQuestion[],
  attempts: Attempt[],
  learningRecord?: RegionLearningRecord,
): RegionProgress {
  const regionQuestions = filterPracticeDisplayQuestionsForRegion(questions.filter(isQuestionTrainable), region);
  const regionAttempts = filterMasteryAttemptsForRegion(region, attempts, questions);
  const totalMarksEarned = regionAttempts.reduce((sum, attempt) => sum + attempt.marksEarned, 0);
  const totalMarksAvailable = regionAttempts.reduce((sum, attempt) => sum + (attempt.marksAvailable ?? 0), 0);
  const ratios = regionAttempts
    .map(attemptRatio)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const recentRatios = ratios.slice(-5);
  const averageScoreRatio = ratio(totalMarksEarned, totalMarksAvailable) ?? (ratios.length ? ratios.reduce((sum, value) => sum + value, 0) / ratios.length : undefined);
  const recentScoreRatio = recentRatios.length ? recentRatios.reduce((sum, value) => sum + value, 0) / recentRatios.length : undefined;
  const touched = new Set(regionAttempts.map((attempt) => attempt.subtopic).filter(Boolean));
  const guardianCleared = Boolean(learningRecord?.guardianClearedAt && (recentScoreRatio ?? 1) >= 0.55);

  return {
    region,
    availableQuestions: regionQuestions.length,
    attempts: regionAttempts.length,
    totalMarksEarned,
    totalMarksAvailable,
    averageScoreRatio,
    recentScoreRatio,
    subtopicsTouched: touched.size,
    isActive: region.activeByDefault || regionQuestions.length > 0,
    rank: calculateRegionRank({
      activeByDefault: region.activeByDefault,
      availableQuestions: regionQuestions.length,
      attempts: regionAttempts.length,
      averageScoreRatio,
      recentScoreRatio,
      guardianCleared,
      hasMixedReview: hasRecentMixedReviewEvidence(regionAttempts),
    }),
  };
}

export function calculateWorldProgress(
  questions: NormalizedQuestion[],
  attempts: Attempt[],
  world: WorldDefinition = P3_ASTRAL_ACADEMY,
  regionLearning?: Record<string, RegionLearningRecord>,
): RegionProgress[] {
  return world.regions.map((region) => calculateRegionProgress(region, questions, attempts, regionLearning?.[region.id]));
}
