import type { Attempt, NormalizedQuestion, RegionDefinition, RegionProgress, RegionRank, WorldDefinition } from '../types';
import { filterQuestionsForRegion, matchRegionForLabels, P3_ASTRAL_ACADEMY } from './worldMap';

export const REGION_RANK_THRESHOLDS = {
  bronze: { attempts: 3, ratio: 0.5 },
  silver: { attempts: 7, ratio: 0.65 },
  gold: { attempts: 12, ratio: 0.8 },
};

function ratio(earned: number, available: number): number | undefined {
  return available > 0 ? earned / available : undefined;
}

export function calculateRegionRank(input: {
  availableQuestions: number;
  activeByDefault: boolean;
  attempts: number;
  averageScoreRatio?: number;
  recentScoreRatio?: number;
  hasMixedReview?: boolean;
}): RegionRank {
  if (!input.activeByDefault && input.availableQuestions === 0) return 'Dormant';
  if (input.availableQuestions === 0) return 'Dormant';
  if (input.attempts === 0 || input.attempts === 1) return 'Discovered';

  const average = input.averageScoreRatio ?? 0;
  const recent = input.recentScoreRatio ?? average;
  if (input.hasMixedReview && input.attempts >= 14 && average >= 0.85 && recent >= 0.85) return 'Mastered';
  if (input.attempts >= REGION_RANK_THRESHOLDS.gold.attempts && average >= REGION_RANK_THRESHOLDS.gold.ratio && recent >= 0.75) return 'Gold';
  if (input.attempts >= REGION_RANK_THRESHOLDS.silver.attempts && average >= REGION_RANK_THRESHOLDS.silver.ratio && recent >= 0.6) return 'Silver';
  if (input.attempts >= REGION_RANK_THRESHOLDS.bronze.attempts && average >= REGION_RANK_THRESHOLDS.bronze.ratio) return 'Bronze';
  return 'Discovered';
}

export function calculateRegionProgress(
  region: RegionDefinition,
  questions: NormalizedQuestion[],
  attempts: Attempt[],
): RegionProgress {
  const regionQuestions = filterQuestionsForRegion(questions, region);
  const regionQuestionIds = new Set(regionQuestions.map((question) => question.id));
  const regionAttempts = attempts.filter((attempt) => {
    if (attempt.regionName === region.name) return true;
    if (regionQuestionIds.has(attempt.questionId)) return true;
    return matchRegionForLabels([attempt.topicDisplayName, attempt.subtopic, attempt.localTopic, attempt.deepseekTopic])?.id === region.id;
  });
  const totalMarksEarned = regionAttempts.reduce((sum, attempt) => sum + attempt.marksEarned, 0);
  const totalMarksAvailable = regionAttempts.reduce((sum, attempt) => sum + (attempt.marksAvailable ?? 0), 0);
  const ratios = regionAttempts
    .map((attempt) => attempt.scoreRatio ?? ratio(attempt.marksEarned, attempt.marksAvailable ?? 0))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const recentRatios = ratios.slice(-5);
  const averageScoreRatio = ratio(totalMarksEarned, totalMarksAvailable) ?? (ratios.length ? ratios.reduce((sum, value) => sum + value, 0) / ratios.length : undefined);
  const recentScoreRatio = recentRatios.length ? recentRatios.reduce((sum, value) => sum + value, 0) / recentRatios.length : undefined;
  const touched = new Set(regionAttempts.map((attempt) => attempt.subtopic).filter(Boolean));

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
      hasMixedReview: false,
    }),
  };
}

export function calculateWorldProgress(
  questions: NormalizedQuestion[],
  attempts: Attempt[],
  world: WorldDefinition = P3_ASTRAL_ACADEMY,
): RegionProgress[] {
  return world.regions.map((region) => calculateRegionProgress(region, questions, attempts));
}
