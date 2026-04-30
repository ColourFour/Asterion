import type { Attempt, MasteryRank, TopicProfile } from '../types';

export function rankFromMastery(score: number, attempts: number): MasteryRank {
  if (attempts < 2 || score < 0.35) return 'none';
  if (score >= 0.9 && attempts >= 8) return 'mastery';
  if (score >= 0.78 && attempts >= 6) return 'gold';
  if (score >= 0.62 && attempts >= 4) return 'silver';
  if (score >= 0.45) return 'bronze';
  return 'none';
}

export function checkmarkForRank(rank: MasteryRank): string {
  return {
    none: '○',
    bronze: '✓ Bronze',
    silver: '✓ Silver',
    gold: '✓ Gold',
    mastery: '★ Mastery',
  }[rank];
}

export function updateTopicProfile(previous: TopicProfile | undefined, attempt: Attempt): TopicProfile {
  const ratio = typeof attempt.scoreRatio === 'number' ? attempt.scoreRatio : 0;
  const totalMarksAvailable = (previous?.totalMarksAvailable ?? 0) + (attempt.marksAvailable ?? 0);
  const totalMarksEarned = (previous?.totalMarksEarned ?? 0) + attempt.marksEarned;
  const recentRatios = [...(previous?.recentRatios ?? []), ratio].slice(-8);
  const lifetime = totalMarksAvailable > 0 ? totalMarksEarned / totalMarksAvailable : ratio;
  const recent = recentRatios.reduce((sum, value) => sum + value, 0) / Math.max(1, recentRatios.length);
  const masteryScore = Math.round((lifetime * 0.45 + recent * 0.55) * 100) / 100;
  const attempts = (previous?.attempts ?? 0) + 1;

  return {
    topic: attempt.topicDisplayName,
    attempts,
    totalMarksEarned,
    totalMarksAvailable,
    recentRatios,
    masteryScore,
    rank: rankFromMastery(masteryScore, attempts),
    updatedAt: attempt.attemptedAt,
  };
}
