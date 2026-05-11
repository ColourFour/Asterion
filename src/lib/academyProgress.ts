import type { RegionProgress, RegionRank } from '../types';
import { REGION_RANK_THRESHOLDS } from './regionProgress';

const rankValue: Record<RegionRank, number> = {
  Dormant: 0,
  Discovered: 1,
  Bronze: 2,
  Silver: 3,
  Gold: 4,
  Mastered: 5,
};

export interface AcademySummary {
  totalXp: number;
  attempts: number;
  totalMarksEarned: number;
  totalMarksAvailable: number;
  averageScoreRatio?: number;
  activeRegions: number;
  restoredRegions: number;
  masteredRegions: number;
  title: string;
  recommendedRegionName?: string;
}

export interface RegionGoal {
  label: string;
  nextRank?: RegionRank;
  attemptsRemaining: number;
  averageTarget?: number;
  recentTarget?: number;
  isComplete: boolean;
}

function atLeast(rank: RegionRank, target: RegionRank): boolean {
  return rankValue[rank] >= rankValue[target];
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function calculateAcademySummary(progress: RegionProgress[]): AcademySummary {
  const active = progress.filter((item) => item.isActive && item.availableQuestions > 0);
  const totalMarksEarned = progress.reduce((sum, item) => sum + item.totalMarksEarned, 0);
  const totalMarksAvailable = progress.reduce((sum, item) => sum + item.totalMarksAvailable, 0);
  const attempts = progress.reduce((sum, item) => sum + item.attempts, 0);
  const averageScoreRatio = totalMarksAvailable > 0 ? totalMarksEarned / totalMarksAvailable : undefined;
  const restoredRegions = progress.filter((item) => atLeast(item.rank, 'Bronze')).length;
  const masteredRegions = progress.filter((item) => item.rank === 'Mastered').length;
  const recommended = active
    .filter((item) => !atLeast(item.rank, 'Gold'))
    .sort((a, b) => rankValue[a.rank] - rankValue[b.rank] || a.attempts - b.attempts || a.region.name.localeCompare(b.region.name))[0];

  const title = masteredRegions > 0
    ? 'Mastery Archivist'
    : restoredRegions >= 5
      ? 'Astral Restorer'
      : restoredRegions >= 2
        ? 'Region Pathfinder'
        : attempts > 0
          ? 'Academy Apprentice'
          : 'New Arrival';

  return {
    totalXp: Math.round(totalMarksEarned),
    attempts,
    totalMarksEarned,
    totalMarksAvailable,
    averageScoreRatio,
    activeRegions: active.length,
    restoredRegions,
    masteredRegions,
    title,
    recommendedRegionName: recommended?.region.name,
  };
}

export function nextRegionGoal(progress: RegionProgress): RegionGoal {
  if (!progress.isActive || progress.availableQuestions === 0) {
    return {
      label: 'Load matching questions to open this wing.',
      attemptsRemaining: 0,
      isComplete: false,
    };
  }

  if (progress.rank === 'Mastered') {
    return {
      label: 'Mastered through Guardian clear or recent mixed review.',
      attemptsRemaining: 0,
      isComplete: true,
    };
  }

  if (progress.rank === 'Gold') {
    return {
      label: 'Gold restored. Mastered needs Guardian clear or recent successful mixed review.',
      attemptsRemaining: 0,
      isComplete: true,
    };
  }

  const target = progress.rank === 'Silver'
    ? { rank: 'Gold' as const, ...REGION_RANK_THRESHOLDS.gold, recent: 0.75 }
    : progress.rank === 'Bronze'
      ? { rank: 'Silver' as const, ...REGION_RANK_THRESHOLDS.silver, recent: 0.6 }
      : { rank: 'Bronze' as const, ...REGION_RANK_THRESHOLDS.bronze, recent: undefined };
  const attemptsRemaining = Math.max(0, target.attempts - progress.attempts);
  const needsAverage = (progress.averageScoreRatio ?? 0) < target.ratio;
  const needsRecent = typeof target.recent === 'number' && (progress.recentScoreRatio ?? 0) < target.recent;
  const parts = [
    attemptsRemaining > 0 ? `${attemptsRemaining} more attempt${attemptsRemaining === 1 ? '' : 's'}` : undefined,
    needsAverage ? `${percent(target.ratio)} average` : undefined,
    needsRecent && target.recent ? `${percent(target.recent)} recent` : undefined,
  ].filter(Boolean);

  return {
    label: parts.length ? `Next ${target.rank}: ${parts.join(' + ')}.` : `Next ${target.rank}: save another steady attempt.`,
    nextRank: target.rank,
    attemptsRemaining,
    averageTarget: target.ratio,
    recentTarget: target.recent,
    isComplete: false,
  };
}
