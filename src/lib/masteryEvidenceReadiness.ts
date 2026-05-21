import type {
  MasteryEvidenceReadinessStatus,
  NormalizedQuestion,
  QuestionMasteryReadiness,
  QuestionPartMark,
} from '../types';
import { p3RegionIdForTopicId } from './p3SkillContract';
import type { QuestionRouteEvidenceStatus } from './questionRouteEvidence';

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function partLabel(part: Pick<QuestionPartMark, 'label'>): string {
  return part.label;
}

function normalizedStatusReason(status: MasteryEvidenceReadinessStatus): string {
  return status.replace(/_/g, '-');
}

function routeStatusReason(status: QuestionRouteEvidenceStatus | undefined): string {
  if (!status) return 'blocked-missing-route-evidence';
  if (status === 'clean') return 'validated-topic-routing';
  return `blocked-${status.toLowerCase()}`;
}

function routeIsUnsafe(status: QuestionRouteEvidenceStatus | undefined): boolean {
  return !status || status !== 'clean';
}

function topicDistributionIds(question: NormalizedQuestion): string[] {
  return unique((question.topicRouting?.topicDistribution ?? []).map((item) => item.topicId));
}

function isKnownMultiTopic(question: NormalizedQuestion): boolean {
  return topicDistributionIds(question).length > 1;
}

function mappedRegionForPart(part: QuestionPartMark): string | undefined {
  return part.mappedRegionId ?? p3RegionIdForTopicId(part.primaryTopicId);
}

function partTarget(part: QuestionPartMark): string | undefined {
  return part.skillRef;
}

function normalizedReviewStatus(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function partMappingReviewApproved(part: QuestionPartMark): boolean {
  return [
    'approved',
    'clean_approved',
    'published',
    'reviewed',
    'route_approved',
    'teacher_reviewed',
    'validated_route_approved',
  ].includes(normalizedReviewStatus(part.reviewStatus));
}

function partUsesCanonicalEvidence(part: QuestionPartMark): boolean {
  const evidence = new Set(part.evidenceUsed ?? []);
  return evidence.has('canonical_question_image') && evidence.has('canonical_mark_scheme_image');
}

function questionHasCanonicalImageEvidence(question: NormalizedQuestion): boolean {
  return question.questionImageCandidates.length > 0 && question.markSchemeImageCandidates.length > 0;
}

function normalizedDependencyMarker(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function partHasUnsafeDependency(part: QuestionPartMark): boolean {
  const unsafeMarkers = [
    normalizedDependencyMarker(part.reviewStatus),
    ...(part.reasonCodes ?? []).map(normalizedDependencyMarker),
  ];
  return unsafeMarkers.some((marker) => (
    marker.includes('fallback-only')
    || marker.includes('fallback-display-only')
    || marker.includes('blocked')
    || marker.includes('thin')
    || marker.includes('deferred')
    || marker.includes('review-needed')
    || marker.includes('review-only')
    || marker.includes('ambiguous-whole-question')
    || marker.includes('unsafe')
    || marker.includes('hard-failure')
  ));
}

function questionHasUnsafeQualityGateDependency(question: NormalizedQuestion): boolean {
  return question.textQuality?.contentLabGenerationAllowed === false
    || Boolean(question.textQuality?.generationBlockerReasonCodes?.length)
    || question.textQuality?.hardFailed === true;
}

function partRouteIsClean(part: QuestionPartMark): boolean {
  return part.routeEvidenceStatus === 'clean';
}

export function isReviewedPartSkillMapping(part: QuestionPartMark): boolean {
  return (
    part.mappingReviewed === true
    && partMappingReviewApproved(part)
    && partUsesCanonicalEvidence(part)
    && partRouteIsClean(part)
    && !partHasUnsafeDependency(part)
    && Boolean(mappedRegionForPart(part))
    && Boolean(partTarget(part))
  );
}

function reviewedPartMappings(question: NormalizedQuestion): QuestionPartMark[] {
  return (question.parts ?? []).filter(isReviewedPartSkillMapping);
}

function hasSufficientReviewedPartSkillMapping(question: NormalizedQuestion): boolean {
  const parts = question.parts ?? [];
  if (parts.length === 0) return false;
  if (!questionHasCanonicalImageEvidence(question)) return false;
  if (questionHasUnsafeQualityGateDependency(question)) return false;
  if (!parts.every(isReviewedPartSkillMapping)) return false;

  const targetCount = unique(parts.map(partTarget)).length;
  const regionCount = unique(parts.map(mappedRegionForPart)).length;
  return targetCount === 1 && regionCount === 1;
}

export function deriveQuestionMasteryReadiness(question: NormalizedQuestion): QuestionMasteryReadiness {
  const routeStatus = question.routeEvidence?.status;
  const routeReasons = question.routeEvidence?.reasonCodes ?? [];
  const parts = question.parts ?? [];
  const isMultiPart = parts.length > 1;
  const knownMultiTopic = isKnownMultiTopic(question);
  const requiresPartMapping = isMultiPart || knownMultiTopic || routeStatus === 'ambiguous-route';
  const reviewedParts = reviewedPartMappings(question);
  const acceptedPartLabels = reviewedParts.map(partLabel);
  const rejectedPartLabels = parts
    .filter((part) => !isReviewedPartSkillMapping(part))
    .map(partLabel);

  if (routeStatus === 'ambiguous-route' && hasSufficientReviewedPartSkillMapping(question)) {
    return {
      status: 'precise_skill_evidence',
      reasonCodes: unique([
        'validated-topic-routing',
        'reviewed-part-skill-mapping',
        'resolved-ambiguous-route-by-reviewed-part-mapping',
        ...routeReasons,
      ]),
      requiresPartMapping,
      acceptedPartLabels,
    };
  }

  if (routeStatus === 'ambiguous-route') {
    return {
      status: 'rejected_ambiguous_without_part_mapping',
      reasonCodes: unique([
        normalizedStatusReason('rejected_ambiguous_without_part_mapping'),
        routeStatusReason(routeStatus),
        'missing-reviewed-part-mapping',
        ...(questionHasCanonicalImageEvidence(question) ? [] : ['missing-canonical-image-evidence']),
        ...(questionHasUnsafeQualityGateDependency(question) ? ['unsafe-quality-gate-dependency'] : []),
        ...routeReasons,
      ]),
      requiresPartMapping,
      ...(acceptedPartLabels.length ? { acceptedPartLabels } : {}),
      ...(rejectedPartLabels.length ? { rejectedPartLabels } : {}),
    };
  }

  if (routeIsUnsafe(routeStatus)) {
    return {
      status: 'rejected_unsafe_route',
      reasonCodes: unique([
        normalizedStatusReason('rejected_unsafe_route'),
        routeStatusReason(routeStatus),
        ...routeReasons,
      ]),
      requiresPartMapping,
      ...(acceptedPartLabels.length ? { acceptedPartLabels } : {}),
      ...(rejectedPartLabels.length ? { rejectedPartLabels } : {}),
    };
  }

  if (requiresPartMapping) {
    if (hasSufficientReviewedPartSkillMapping(question)) {
      return {
        status: 'precise_skill_evidence',
        reasonCodes: unique([
          'validated-topic-routing',
          'reviewed-part-skill-mapping',
          ...routeReasons,
        ]),
        requiresPartMapping,
        acceptedPartLabels,
      };
    }

    const status: MasteryEvidenceReadinessStatus = isMultiPart
      ? 'practice_only_insufficient_part_mapping'
      : 'broad_region_evidence_only';
    return {
      status,
      reasonCodes: unique([
        normalizedStatusReason(status),
        'missing-reviewed-part-mapping',
        ...(questionHasCanonicalImageEvidence(question) ? [] : ['missing-canonical-image-evidence']),
        ...(questionHasUnsafeQualityGateDependency(question) ? ['unsafe-quality-gate-dependency'] : []),
        'validated-topic-routing',
        ...routeReasons,
      ]),
      requiresPartMapping,
      ...(acceptedPartLabels.length ? { acceptedPartLabels } : {}),
      ...(rejectedPartLabels.length ? { rejectedPartLabels } : {}),
    };
  }

  return {
    status: 'precise_skill_evidence',
    reasonCodes: unique(['validated-topic-routing', ...routeReasons]),
    requiresPartMapping,
  };
}

export function isPreciseSkillEvidenceReady(question: NormalizedQuestion): boolean {
  return (question.masteryReadiness ?? deriveQuestionMasteryReadiness(question)).status === 'precise_skill_evidence';
}
