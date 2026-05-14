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
  return part.skillRef ?? part.primaryTopicId;
}

function partRouteIsClean(part: QuestionPartMark): boolean {
  return !part.routeEvidenceStatus || part.routeEvidenceStatus === 'clean';
}

export function isReviewedPartSkillMapping(part: QuestionPartMark): boolean {
  return (
    part.mappingReviewed === true
    && partRouteIsClean(part)
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

  if (routeStatus === 'ambiguous-route') {
    return {
      status: 'rejected_ambiguous_without_part_mapping',
      reasonCodes: unique([
        normalizedStatusReason('rejected_ambiguous_without_part_mapping'),
        routeStatusReason(routeStatus),
        'missing-reviewed-part-mapping',
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
