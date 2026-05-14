import type { MasteryEvidence } from './masteryEvidence';

export type MasteryAntiFarmingReasonCode =
  | 'insufficient_distinct_questions'
  | 'insufficient_skill_spread'
  | 'repeated_question_capped'
  | 'mixed_review_required'
  | 'unsafe_evidence_rejected'
  | 'mastery_evidence_missing';

export interface MasteryCoveragePolicy {
  minimumDistinctCurrentEvidenceItems: number;
  minimumDistinctQuestions: number;
  requireMixedReview?: boolean;
  hasMixedReview?: boolean;
}

export interface MasteryCoverageResult {
  currentEvidenceItems: number;
  distinctQuestions: number;
  distinctEvidenceTargets: number;
  hasRepeatedQuestionAttempts: boolean;
  hasEvidenceTargetMetadata: boolean;
  meetsCoverage: boolean;
  reasonCodes: MasteryAntiFarmingReasonCode[];
}

export interface MasteryCoverageSnapshotInput {
  currentEvidenceItems: number;
  distinctQuestions: number;
  distinctEvidenceTargets: number;
  hasRepeatedQuestionAttempts?: boolean;
  hasEvidenceTargetMetadata?: boolean;
}

export const DEFAULT_MASTERY_COVERAGE_POLICY: MasteryCoveragePolicy = {
  minimumDistinctCurrentEvidenceItems: 2,
  minimumDistinctQuestions: 2,
};

function normalizedMetadata(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const normalized = String(value).trim().toLowerCase().replace(/[_/-]+/g, ' ').replace(/\s+/g, ' ');
  return normalized || undefined;
}

function evidenceQuestionId(evidence: MasteryEvidence): string | undefined {
  return normalizedMetadata(evidence.question?.id);
}

function evidenceTarget(evidence: MasteryEvidence): string | undefined {
  return (
    normalizedMetadata(evidence.question?.routeEvidence?.primaryTopicId)
    ?? normalizedMetadata(evidence.subtopic)
    ?? normalizedMetadata(evidence.question?.displaySubtopic)
    ?? normalizedMetadata(evidence.question?.localSubtopic)
    ?? normalizedMetadata(evidence.question?.deepseek.subtopic)
  );
}

export function evaluateMasteryCoverage(
  evidenceItems: MasteryEvidence[],
  policy: Partial<MasteryCoveragePolicy> = {},
): MasteryCoverageResult {
  const currentEvidence = evidenceItems.filter((evidence) => evidence.question);
  const distinctQuestions = new Set<string>();
  const questionAttemptCounts = new Map<string, number>();
  const distinctEvidenceTargets = new Set<string>();

  for (const evidence of currentEvidence) {
    const questionId = evidenceQuestionId(evidence);
    if (questionId) {
      distinctQuestions.add(questionId);
      questionAttemptCounts.set(questionId, (questionAttemptCounts.get(questionId) ?? 0) + 1);
    }

    const target = evidenceTarget(evidence);
    if (target) distinctEvidenceTargets.add(target);
  }

  const hasRepeatedQuestionAttempts = Array.from(questionAttemptCounts.values()).some((count) => count > 1);
  const hasEvidenceTargetMetadata = currentEvidence.some((evidence) => Boolean(evidenceTarget(evidence)));
  const result = evaluateMasteryCoverageSnapshot({
    currentEvidenceItems: currentEvidence.length,
    distinctQuestions: distinctQuestions.size,
    distinctEvidenceTargets: distinctEvidenceTargets.size,
    hasRepeatedQuestionAttempts,
    hasEvidenceTargetMetadata,
  }, policy);

  return {
    ...result,
    reasonCodes: [
      ...(currentEvidence.length < evidenceItems.length ? ['mastery_evidence_missing' as const] : []),
      ...result.reasonCodes,
    ].filter((reason, index, reasons) => reasons.indexOf(reason) === index),
  };
}

export function evaluateMasteryCoverageSnapshot(
  snapshot: MasteryCoverageSnapshotInput,
  policy: Partial<MasteryCoveragePolicy> = {},
): MasteryCoverageResult {
  const resolvedPolicy = { ...DEFAULT_MASTERY_COVERAGE_POLICY, ...policy };
  const reasonCodes = new Set<MasteryAntiFarmingReasonCode>();

  if (snapshot.currentEvidenceItems < resolvedPolicy.minimumDistinctCurrentEvidenceItems) {
    reasonCodes.add('mastery_evidence_missing');
  }
  if (snapshot.distinctQuestions < resolvedPolicy.minimumDistinctQuestions) {
    reasonCodes.add('insufficient_distinct_questions');
  }
  if (snapshot.hasRepeatedQuestionAttempts) reasonCodes.add('repeated_question_capped');
  if (snapshot.hasEvidenceTargetMetadata && snapshot.distinctEvidenceTargets < 2 && !resolvedPolicy.hasMixedReview) {
    reasonCodes.add('insufficient_skill_spread');
  }
  if (resolvedPolicy.requireMixedReview && !resolvedPolicy.hasMixedReview) {
    reasonCodes.add('mixed_review_required');
  }
  const reasons = Array.from(reasonCodes);

  return {
    currentEvidenceItems: snapshot.currentEvidenceItems,
    distinctQuestions: snapshot.distinctQuestions,
    distinctEvidenceTargets: snapshot.distinctEvidenceTargets,
    hasRepeatedQuestionAttempts: Boolean(snapshot.hasRepeatedQuestionAttempts),
    hasEvidenceTargetMetadata: Boolean(snapshot.hasEvidenceTargetMetadata),
    meetsCoverage: reasons.every((reason) => reason === 'repeated_question_capped'),
    reasonCodes: reasons,
  };
}
