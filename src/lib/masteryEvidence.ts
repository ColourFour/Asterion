import type { Attempt, NormalizedQuestion, RegionDefinition } from '../types';
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
  | 'missing-mark-scheme-review';

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

function scoreRatio(attempt: Attempt): number | undefined {
  if (typeof attempt.scoreRatio === 'number' && Number.isFinite(attempt.scoreRatio)) return attempt.scoreRatio;
  if (typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0) return attempt.marksEarned / attempt.marksAvailable;
  return undefined;
}

function validatedRegionId(attempt: Attempt, question?: NormalizedQuestion): string | undefined {
  return question?.routeEvidence?.validatedRegionId ?? attempt.validatedRegionId;
}

function isP3Evidence(attempt: Attempt, question?: NormalizedQuestion): boolean {
  return normalizeLabel(String(question?.paperFamily ?? attempt.paperFamily)) === 'p3';
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
    if (!status) {
      reasons.add('missing-route');
    } else {
      const reason = routeStatusReason(status);
      if (reason) reasons.add(reason);
    }
    if (question.eligibility?.masteryEligible.eligible !== true) reasons.add('mastery-ineligible');
    if (question.contentSource?.unsafeForMastery) reasons.add('unsafe-content-source');
    if (question.textQuality?.hardFailed) reasons.add('hard-failure');
  } else if (attempt.masteryEligible !== true) {
    reasons.add(attempt.masteryEligible === false ? 'mastery-ineligible' : 'missing-route');
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
