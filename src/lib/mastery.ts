import type { MasteryRank, TopicProfile } from '../types';
import type { MasteryEvidence } from './masteryEvidence';
import { evaluateMasteryCoverageSnapshot, type MasteryCoverageResult } from './masteryAntiFarming';

export function rankFromMastery(score: number, attempts: number, coverage?: Pick<MasteryCoverageResult, 'meetsCoverage'>): MasteryRank {
  if (attempts < 2 || score < 0.35) return 'none';
  if (score >= 0.9 && attempts >= 8 && coverage?.meetsCoverage) return 'mastery';
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
  const distinctQuestionIds = new Set(previous?.distinctQuestionIds ?? []);
  const distinctEvidenceTargets = new Set(previous?.distinctEvidenceTargets ?? []);
  if (evidence.question?.id) distinctQuestionIds.add(evidence.question.id);
  if (evidence.question?.routeEvidence?.primaryTopicId) {
    distinctEvidenceTargets.add(evidence.question.routeEvidence.primaryTopicId);
  } else if (evidence.subtopic) {
    distinctEvidenceTargets.add(evidence.subtopic);
  }
  const cleanCurrentEvidenceItems = distinctQuestionIds.size;
  const profileCoverage = evaluateMasteryCoverageSnapshot({
    currentEvidenceItems: cleanCurrentEvidenceItems,
    distinctQuestions: distinctQuestionIds.size,
    distinctEvidenceTargets: distinctEvidenceTargets.size,
    hasEvidenceTargetMetadata: distinctEvidenceTargets.size > 0,
    hasRepeatedQuestionAttempts: Boolean(evidence.question?.id && previous?.distinctQuestionIds?.includes(evidence.question.id)),
  });

  return {
    topic: evidence.topic,
    attempts,
    totalMarksEarned,
    totalMarksAvailable,
    recentRatios,
    masteryScore,
    rank: rankFromMastery(masteryScore, attempts, profileCoverage),
    updatedAt: evidence.attemptedAt,
    cleanCurrentEvidenceItems,
    distinctQuestionIds: Array.from(distinctQuestionIds),
    distinctEvidenceTargets: Array.from(distinctEvidenceTargets),
    masteryReasonCodes: profileCoverage.reasonCodes,
  };
}
