import type { MasteryRank, TopicProfile } from '../types';
import type { MasteryEvidence } from './masteryEvidence';

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

export function updateTopicProfile(previous: TopicProfile | undefined, evidence: MasteryEvidence): TopicProfile {
  const totalMarksAvailable = (previous?.totalMarksAvailable ?? 0) + evidence.marksAvailable;
  const totalMarksEarned = (previous?.totalMarksEarned ?? 0) + evidence.marksEarned;
  const recentRatios = [...(previous?.recentRatios ?? []), evidence.scoreRatio].slice(-8);
  const lifetime = totalMarksAvailable > 0 ? totalMarksEarned / totalMarksAvailable : evidence.scoreRatio;
  const recent = recentRatios.reduce((sum, value) => sum + value, 0) / Math.max(1, recentRatios.length);
  const masteryScore = Math.round((lifetime * 0.45 + recent * 0.55) * 100) / 100;
  const attempts = (previous?.attempts ?? 0) + 1;

  return {
    topic: evidence.topic,
    attempts,
    totalMarksEarned,
    totalMarksAvailable,
    recentRatios,
    masteryScore,
    rank: rankFromMastery(masteryScore, attempts),
    updatedAt: evidence.attemptedAt,
  };
}
