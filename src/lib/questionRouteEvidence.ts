export const QUESTION_ROUTE_EVIDENCE_STATUSES = [
  'clean',
  'missing-route',
  'ambiguous-route',
  'review-only',
  'fallback-display-only',
  'prerequisite-only',
  'not-P3',
  'hard-failure',
] as const;

export type QuestionRouteEvidenceStatus = typeof QUESTION_ROUTE_EVIDENCE_STATUSES[number];

const STATUS_SET = new Set<string>(QUESTION_ROUTE_EVIDENCE_STATUSES);

const STATUS_ALIASES: Record<string, QuestionRouteEvidenceStatus> = {
  clean: 'clean',
  validated: 'clean',
  validated_curriculum_route: 'clean',
  validated_curriculum_routing: 'clean',
  missing_route: 'missing-route',
  missingroute: 'missing-route',
  no_route: 'missing-route',
  unmatched: 'missing-route',
  ambiguous_route: 'ambiguous-route',
  ambiguousroute: 'ambiguous-route',
  ambiguous: 'ambiguous-route',
  review_only: 'review-only',
  reviewonly: 'review-only',
  review: 'review-only',
  fallback_display_only: 'fallback-display-only',
  fallbackdisplayonly: 'fallback-display-only',
  fallback: 'fallback-display-only',
  display_only: 'fallback-display-only',
  displayonly: 'fallback-display-only',
  prerequisite_only: 'prerequisite-only',
  prerequisiteonly: 'prerequisite-only',
  prerequisite: 'prerequisite-only',
  not_p3: 'not-P3',
  notp3: 'not-P3',
  non_p3: 'not-P3',
  nonp3: 'not-P3',
  hard_failure: 'hard-failure',
  hardfailure: 'hard-failure',
  hard_fail: 'hard-failure',
  hardfail: 'hard-failure',
};

function normalizeStatusToken(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

export function normalizeQuestionRouteEvidenceStatus(value: unknown): QuestionRouteEvidenceStatus | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  if (STATUS_SET.has(value)) return value as QuestionRouteEvidenceStatus;
  return STATUS_ALIASES[normalizeStatusToken(value)];
}

export function isQuestionRouteEvidenceStatus(value: unknown): value is QuestionRouteEvidenceStatus {
  return Boolean(normalizeQuestionRouteEvidenceStatus(value));
}
