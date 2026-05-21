import type { Attempt, MasteryEvidenceReadinessStatus, NormalizedQuestion, QuestionPartMark, RegionDefinition } from '../types';
import { deriveQuestionMasteryReadiness, isReviewedPartSkillMapping } from './masteryEvidenceReadiness';
import type { QuestionRouteEvidenceStatus } from './questionRouteEvidence';
import { normalizeLabel } from './worldMap';

export type MasteryEvidenceRejectionReason =
  | 'not-p3'
  | 'missing-route'
  | 'ambiguous-route'
  | 'review-only'
  | 'fallback-display-only'
  | 'prerequisite-only'
  | 'hard-failure'
  | 'mastery-ineligible'
  | 'region-mismatch'
  | 'unsafe-content-source'
  | 'invalid-score-evidence'
  | 'missing-mark-scheme-review'
  | 'broad-region-evidence-only'
  | 'insufficient-part-mapping'
  | 'ambiguous-without-part-mapping'
  | 'rejected-unsafe-route';

export interface MasteryPartEvidence {
  partId?: string;
  subpartId?: string;
  label: string;
  marksEarned: number;
  marksAvailable: number;
  scoreRatio?: number;
  primaryTopicId?: string;
  skillRef?: string;
  mappedRegionId?: string;
  routeEvidenceStatus?: QuestionRouteEvidenceStatus;
  mappingReviewed?: boolean;
  reviewStatus?: string;
}

export interface MasteryEvidence {
  attempt: Attempt;
  question?: NormalizedQuestion;
  topic: string;
  validatedRegionId: string;
  scoreRatio: number;
  marksEarned: number;
  marksAvailable: number;
  attemptedAt: string;
  subtopic?: string;
  partEvidence?: MasteryPartEvidence[];
}

export interface NonMasteryEvidenceReport {
  attempt: Attempt;
  question?: NormalizedQuestion;
  reasons: MasteryEvidenceRejectionReason[];
}

const UNSAFE_ROUTE_STATUSES = new Set<QuestionRouteEvidenceStatus>([
  'missing-route',
  'ambiguous-route',
  'review-only',
  'fallback-display-only',
  'prerequisite-only',
  'not-P3',
  'hard-failure',
]);

function routeStatusReason(status: QuestionRouteEvidenceStatus): MasteryEvidenceRejectionReason | undefined {
  if (status === 'clean') return undefined;
  if (status === 'not-P3') return 'not-p3';
  return UNSAFE_ROUTE_STATUSES.has(status) ? status : undefined;
}

function readinessStatusReason(status: MasteryEvidenceReadinessStatus | undefined): MasteryEvidenceRejectionReason | undefined {
  switch (status) {
    case undefined:
    case 'precise_skill_evidence':
      return undefined;
    case 'broad_region_evidence_only':
      return 'broad-region-evidence-only';
    case 'practice_only_insufficient_part_mapping':
      return 'insufficient-part-mapping';
    case 'rejected_ambiguous_without_part_mapping':
      return 'ambiguous-without-part-mapping';
    case 'rejected_unsafe_route':
      return 'rejected-unsafe-route';
  }
}

function scoreRatio(attempt: Attempt): number | undefined {
  if (typeof attempt.scoreRatio === 'number' && Number.isFinite(attempt.scoreRatio)) return attempt.scoreRatio;
  if (typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0) return attempt.marksEarned / attempt.marksAvailable;
  return undefined;
}

function reviewedPartRegionId(question?: NormalizedQuestion): string | undefined {
  const partRegions = new Set(
    (question?.parts ?? [])
      .filter(isReviewedPartSkillMapping)
      .map((part) => part.mappedRegionId)
      .filter((regionId): regionId is string => Boolean(regionId)),
  );
  return partRegions.size === 1 ? Array.from(partRegions)[0] : undefined;
}

function validatedRegionId(attempt: Attempt, question?: NormalizedQuestion): string | undefined {
  const readiness = question ? question.masteryReadiness ?? deriveQuestionMasteryReadiness(question) : undefined;
  return question?.routeEvidence?.validatedRegionId
    ?? (readiness?.status === 'precise_skill_evidence' ? reviewedPartRegionId(question) : undefined)
    ?? attempt.validatedRegionId;
}

function isP3Evidence(attempt: Attempt, question?: NormalizedQuestion): boolean {
  return normalizeLabel(String(question?.paperFamily ?? attempt.paperFamily)) === 'p3';
}

function normalizedPartLabel(value: string): string {
  return value.trim().replace(/^\((.*)\)$/, '$1').toLowerCase();
}

function partForScore(scoreLabel: string, parts: QuestionPartMark[]): QuestionPartMark | undefined {
  const normalized = normalizedPartLabel(scoreLabel);
  return parts.find((part) => normalizedPartLabel(part.label) === normalized);
}

function buildPartEvidence(attempt: Attempt, question?: NormalizedQuestion): MasteryPartEvidence[] | undefined {
  if (!attempt.partScores?.length || !question?.parts?.length) return undefined;
  const evidence = attempt.partScores.map((score) => {
    const part = partForScore(score.label, question.parts ?? []);
    const partId = score.partId ?? part?.partId;
    const subpartId = score.subpartId ?? part?.subpartId;
    const scoreRatio = score.marksAvailable > 0 ? score.marksEarned / score.marksAvailable : undefined;
    return {
      ...(partId ? { partId } : {}),
      ...(subpartId ? { subpartId } : {}),
      label: score.label,
      marksEarned: score.marksEarned,
      marksAvailable: score.marksAvailable,
      ...(typeof scoreRatio === 'number' && Number.isFinite(scoreRatio) ? { scoreRatio } : {}),
      ...(part?.primaryTopicId ? { primaryTopicId: part.primaryTopicId } : {}),
      ...(part?.skillRef ? { skillRef: part.skillRef } : {}),
      ...(part?.mappedRegionId ? { mappedRegionId: part.mappedRegionId } : {}),
      ...(part?.routeEvidenceStatus ? { routeEvidenceStatus: part.routeEvidenceStatus } : {}),
      ...(part?.mappingReviewed !== undefined ? { mappingReviewed: part.mappingReviewed } : {}),
      ...(part?.reviewStatus ? { reviewStatus: part.reviewStatus } : {}),
    };
  });
  return evidence.length ? evidence : undefined;
}

export function explainNonMasteryEvidence(input: {
  attempt: Attempt;
  question?: NormalizedQuestion;
  region?: RegionDefinition;
}): MasteryEvidenceRejectionReason[] {
  const { attempt, question, region } = input;
  const reasons = new Set<MasteryEvidenceRejectionReason>();
  const routeRegionId = validatedRegionId(attempt, question);
  const ratio = scoreRatio(attempt);

  if (!isP3Evidence(attempt, question)) reasons.add('not-p3');

  if (question) {
    const status = question.routeEvidence?.status;
    const readiness = question.masteryReadiness ?? deriveQuestionMasteryReadiness(question);
    const ambiguousResolvedByParts = status === 'ambiguous-route' && readiness.status === 'precise_skill_evidence';
    if (!status) {
      reasons.add('missing-route');
    } else {
      const reason = routeStatusReason(status);
      if (reason && !ambiguousResolvedByParts) reasons.add(reason);
    }
    const readinessReason = readinessStatusReason(readiness.status);
    if (readinessReason) reasons.add(readinessReason);
    if (question.eligibility?.masteryEligible.eligible !== true) reasons.add('mastery-ineligible');
    if (question.contentSource?.unsafeForMastery) reasons.add('unsafe-content-source');
    if (question.textQuality?.hardFailed) reasons.add('hard-failure');
  } else if (attempt.masteryEligible !== true) {
    reasons.add(attempt.masteryEligible === false ? 'mastery-ineligible' : 'missing-route');
  }

  if (!question) {
    const readinessReason = readinessStatusReason(attempt.masteryEvidenceReadiness);
    if (readinessReason) reasons.add(readinessReason);
  }

  if (!routeRegionId) reasons.add('missing-route');
  if (region && routeRegionId && routeRegionId !== region.id) reasons.add('region-mismatch');

  if (
    typeof ratio !== 'number'
    || !Number.isFinite(ratio)
    || typeof attempt.marksAvailable !== 'number'
    || attempt.marksAvailable <= 0
    || typeof attempt.marksEarned !== 'number'
    || !Number.isFinite(attempt.marksEarned)
  ) {
    reasons.add('invalid-score-evidence');
  }

  if (!attempt.markSchemeRevealed || typeof attempt.timeSpentSeconds !== 'number' || attempt.timeSpentSeconds <= 0) {
    reasons.add('missing-mark-scheme-review');
  }

  return Array.from(reasons);
}

export function toMasteryEvidence(input: {
  attempt: Attempt;
  question?: NormalizedQuestion;
  region?: RegionDefinition;
}): MasteryEvidence | undefined {
  const reasons = explainNonMasteryEvidence(input);
  if (reasons.length > 0) return undefined;

  const { attempt, question } = input;
  return {
    attempt,
    question,
    topic: attempt.topicDisplayName,
    validatedRegionId: validatedRegionId(attempt, question)!,
    scoreRatio: scoreRatio(attempt)!,
    marksEarned: attempt.marksEarned,
    marksAvailable: attempt.marksAvailable!,
    attemptedAt: attempt.attemptedAt,
    subtopic: attempt.subtopic ?? question?.displaySubtopic ?? question?.localSubtopic ?? question?.deepseek.subtopic,
    partEvidence: buildPartEvidence(attempt, question),
  };
}

export function filterMasteryEvidence(input: {
  attempts: Attempt[];
  questions?: NormalizedQuestion[];
  region?: RegionDefinition;
}): MasteryEvidence[] {
  const questionsById = new Map((input.questions ?? []).map((question) => [question.id, question]));
  return input.attempts
    .map((attempt) => toMasteryEvidence({ attempt, question: questionsById.get(attempt.questionId), region: input.region }))
    .filter((evidence): evidence is MasteryEvidence => Boolean(evidence));
}

export function getNonMasteryEvidenceReports(input: {
  attempts: Attempt[];
  questions?: NormalizedQuestion[];
  region?: RegionDefinition;
}): NonMasteryEvidenceReport[] {
  const questionsById = new Map((input.questions ?? []).map((question) => [question.id, question]));
  return input.attempts.flatMap((attempt) => {
    const question = questionsById.get(attempt.questionId);
    const reasons = explainNonMasteryEvidence({ attempt, question, region: input.region });
    return reasons.length > 0 ? [{ attempt, question, reasons }] : [];
  });
}
