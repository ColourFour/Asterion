import type { NormalizedQuestion, PaperFamily, QuestionRouteEvidence, QuestionTopicRouting, RegionDefinition, WorldDefinition } from '../types';
import { P3_REGION_DEFINITIONS, P3_TOPIC_ID_TO_REGION_ID } from './p3SkillContract';
import type { QuestionRouteEvidenceStatus } from './questionRouteEvidence';
import { canonicalPaperFamily } from './resolveAssetPath';
import { regionForTopicRouting } from './topicRouting';

export const P3_WORLD_NAME = 'Pure Mathematics 3';

export const P3_COURSE_MAP: WorldDefinition = {
  id: 'p3-course-map',
  name: P3_WORLD_NAME,
  paperFamily: 'p3',
  regions: P3_REGION_DEFINITIONS.map(({ syllabusTopics: _syllabusTopics, subtopics, matchTerms, ...region }) => ({
    ...region,
    topicIds: Object.entries(P3_TOPIC_ID_TO_REGION_ID)
      .filter(([, regionId]) => regionId === region.id)
      .map(([topicId]) => topicId),
    subtopics: [...subtopics],
    matchTerms: [...matchTerms],
  })),
};

export function normalizeLabel(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[_/-]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function rawString(record: unknown, path: string[]): string | undefined {
  let current: unknown = record;
  for (const key of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current === 'string' && current.trim()) return current;
  if (typeof current === 'number') return String(current);
  return undefined;
}

export function labelsForQuestion(question: NormalizedQuestion): string[] {
  return [
    question.topicRouting?.primaryTopicId,
    question.topicRouting?.mappedRegionId,
    question.displayTopic,
    question.displaySubtopic,
    question.localTopic,
    question.localSubtopic,
    question.deepseek.topic,
    question.deepseek.normalizedTopic,
    question.deepseek.subtopic,
    rawString(question.raw.local, ['topic']),
    rawString(question.raw.local, ['notes', 'subtopic']),
    rawString(question.raw.deepseek, ['deepseek_topic_normalized']),
    rawString(question.raw.deepseek, ['deepseek_subtopic']),
  ].filter((value): value is string => Boolean(value));
}

function fallbackLabelsForQuestion(question: NormalizedQuestion): string[] {
  return [
    question.displayTopic,
    question.displaySubtopic,
    question.localTopic,
    question.localSubtopic,
    question.deepseek.topic,
    question.deepseek.normalizedTopic,
    question.deepseek.subtopic,
    rawString(question.raw.local, ['topic']),
    rawString(question.raw.local, ['notes', 'subtopic']),
    rawString(question.raw.deepseek, ['deepseek_topic_normalized']),
    rawString(question.raw.deepseek, ['deepseek_subtopic']),
  ].filter((value): value is string => Boolean(value));
}

export function matchRegionForLabels(labels: Array<string | undefined>, world: WorldDefinition): RegionDefinition | undefined {
  const normalizedLabels = labels.map(normalizeLabel).filter(Boolean);
  const scored = world.regions.map((region) => {
    const terms = [...region.matchTerms, region.name, ...region.subtopics].map(normalizeLabel);
    const score = normalizedLabels.reduce((sum, label) => {
      const best = terms.reduce((termScore, term) => {
        if (!term || !label) return termScore;
        if (label === term) return Math.max(termScore, 12);
        if (label.includes(term)) return Math.max(termScore, Math.min(10, term.length / 2));
        if (term.includes(label)) return Math.max(termScore, Math.min(7, label.length / 2));
        return termScore;
      }, 0);
      return sum + best;
    }, 0);
    return { region, score };
  });
  return scored.sort((a, b) => b.score - a.score)[0]?.score ? scored[0].region : undefined;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function regionIdsForRouting(routing: QuestionTopicRouting | undefined, world: WorldDefinition): string[] {
  if (!routing) return [];
  return unique([
    routing.mappedRegionId,
    ...(routing.topicDistribution ?? []).map((item) => item.mappedRegionId),
  ].filter((value): value is string => Boolean(value && world.regions.some((region) => region.id === value))));
}

function reviewReasonLooksAmbiguous(reason: string): boolean {
  return /ambiguous|multiple|conflict|uncertain|mixed|split/i.test(reason);
}

function unresolvedReviewReasonCodes(routing: QuestionTopicRouting | undefined): string[] {
  if (!routing || routing.routeApproved) return [];
  return unique([
    ...(routing.reviewBlockerReasonCodes ?? []),
    ...(routing.reviewReasons?.length ? ['topic-routing-review-reasons-unresolved'] : []),
  ]);
}

function topicIdLooksForWorld(topicId: string | undefined, world: WorldDefinition): boolean {
  if (!topicId) return false;
  return new RegExp(`^9709_${world.paperFamily}_topic_`, 'i').test(topicId);
}

function topicIdLooksLikeAnotherPureComponent(topicId: string | undefined, world: WorldDefinition): boolean {
  return Boolean(topicId && /^9709_p[13]_topic_/i.test(topicId) && !topicIdLooksForWorld(topicId, world));
}

function hasTopicRoutingAuthority(routing: QuestionTopicRouting | undefined): boolean {
  return Boolean(
    routing
    && routing.recordSource !== 'source-record'
    && (
      routing.recordSource === 'topic-routing-sidecar'
      || routing.primaryTopicId
      || routing.mappedRegionId
      || routing.topicDistribution?.length
      || routing.routingSource
      || routing.paperFamily
      || routing.evidenceUsed?.length
      || routing.reviewRequired !== undefined
    ),
  );
}

function fallbackDisplayRegion(question: NormalizedQuestion, world: WorldDefinition): RegionDefinition | undefined {
  return matchRegionForLabels(fallbackLabelsForQuestion(question), world);
}

function regionById(regionId: string | undefined, world: WorldDefinition): RegionDefinition | undefined {
  if (!regionId) return undefined;
  return world.regions.find((region) => region.id === regionId);
}

function nonCleanStatus(status: QuestionRouteEvidenceStatus | undefined): QuestionRouteEvidenceStatus | undefined {
  return status && status !== 'clean' ? status : undefined;
}

function routeEvidence(
  status: QuestionRouteEvidenceStatus,
  source: QuestionRouteEvidence['source'],
  question: NormalizedQuestion,
  world: WorldDefinition,
  reasonCodes: string[],
  region?: RegionDefinition,
  displayRegion?: RegionDefinition,
): QuestionRouteEvidence {
  const routing = question.topicRouting;
  const validatedRegion = status === 'clean' && source === 'topic-routing' ? region : undefined;
  const visibleRegion = displayRegion ?? region;
  return {
    status,
    source,
    regionId: visibleRegion?.id,
    regionName: visibleRegion?.name,
    validatedRegionId: validatedRegion?.id,
    validatedRegionName: validatedRegion?.name,
    displayRegionId: visibleRegion?.id,
    displayRegionName: visibleRegion?.name,
    primaryTopicId: routing?.primaryTopicId,
    reasonCodes,
    evidenceUsed: routing?.evidenceUsed,
    reviewReasons: routing?.reviewReasons,
    matchedLabels: source === 'fallback-label' ? fallbackLabelsForQuestion(question) : undefined,
    candidateRegionIds: regionIdsForRouting(routing, world),
  };
}

export function inferQuestionRouteEvidence(question: NormalizedQuestion, world: WorldDefinition): QuestionRouteEvidence {
  if (!isPaperFamilyQuestion(question, world.paperFamily)) {
    return routeEvidence('not-P3', 'paper-family', question, world, ['non-p3-paper-family']);
  }

  const routedRegion = regionForTopicRouting(question.topicRouting, world.regions);
  const candidateRegionIds = regionIdsForRouting(question.topicRouting, world);
  const hasRoutingAuthority = hasTopicRoutingAuthority(question.topicRouting);
  const fallbackRegion = fallbackDisplayRegion(question, world);

  if (hasRoutingAuthority) {
    const explicitUnsafeStatus = nonCleanStatus(question.topicRouting?.evidenceStatus);
    if (explicitUnsafeStatus === 'hard-failure') {
      return routeEvidence('hard-failure', 'topic-routing', question, world, ['topic-routing-evidence-status'], routedRegion, routedRegion ?? fallbackRegion);
    }

    if (candidateRegionIds.length > 1) {
      return routeEvidence('ambiguous-route', 'topic-routing', question, world, ['multiple-course-candidate-regions'], routedRegion, routedRegion ?? fallbackRegion);
    }

    if (question.topicRouting?.reviewRequired) {
      const status: QuestionRouteEvidenceStatus = question.topicRouting.reviewReasons?.some(reviewReasonLooksAmbiguous)
        ? 'ambiguous-route'
        : 'review-only';
      return routeEvidence(status, 'topic-routing', question, world, ['topic-routing-review-required'], routedRegion, routedRegion ?? fallbackRegion);
    }

    const reviewBlockers = unresolvedReviewReasonCodes(question.topicRouting);
    if (reviewBlockers.length) {
      const status: QuestionRouteEvidenceStatus = question.topicRouting?.reviewReasons?.some(reviewReasonLooksAmbiguous)
        ? 'ambiguous-route'
        : 'review-only';
      return routeEvidence(status, 'topic-routing', question, world, reviewBlockers, routedRegion, routedRegion ?? fallbackRegion);
    }

    if (explicitUnsafeStatus) {
      return routeEvidence(explicitUnsafeStatus, 'topic-routing', question, world, ['topic-routing-evidence-status'], routedRegion, routedRegion ?? fallbackRegion);
    }

    if (routedRegion) {
      return routeEvidence('clean', 'topic-routing', question, world, ['validated-topic-routing'], routedRegion);
    }

    if (question.topicRouting?.primaryTopicId) {
      const status: QuestionRouteEvidenceStatus = topicIdLooksLikeAnotherPureComponent(question.topicRouting.primaryTopicId, world)
        ? 'prerequisite-only'
        : topicIdLooksForWorld(question.topicRouting.primaryTopicId, world)
          ? 'missing-route'
          : 'not-P3';
      return routeEvidence(status, 'topic-routing', question, world, ['unmapped-topic-routing-id'], undefined, fallbackRegion);
    }

    return routeEvidence('missing-route', 'topic-routing', question, world, ['topic-routing-missing-primary-topic'], undefined, fallbackRegion);
  }

  const preservedStatus = nonCleanStatus(question.topicRouting?.evidenceStatus);
  if (preservedStatus) {
    return routeEvidence(preservedStatus, 'preserved-status', question, world, ['preserved-route-evidence-status'], undefined, fallbackRegion);
  }

  if (fallbackRegion) {
    return routeEvidence('fallback-display-only', 'fallback-label', question, world, ['fallback-label-match'], undefined, fallbackRegion);
  }

  return routeEvidence('missing-route', 'none', question, world, ['no-topic-routing-record']);
}

export function matchRegionForQuestion(question: NormalizedQuestion, world: WorldDefinition): RegionDefinition | undefined {
  if (!isPaperFamilyQuestion(question, world.paperFamily)) return undefined;
  const routeEvidence = world === P3_COURSE_MAP
    ? question.routeEvidence ?? inferQuestionRouteEvidence(question, world)
    : inferQuestionRouteEvidence(question, world);
  if (routeEvidence.status !== 'clean') return undefined;
  return regionById(routeEvidence.validatedRegionId, world);
}

export function matchDisplayRegionForQuestion(question: NormalizedQuestion, world: WorldDefinition): RegionDefinition | undefined {
  if (!isPaperFamilyQuestion(question, world.paperFamily)) return undefined;
  const routeEvidence = world === P3_COURSE_MAP
    ? question.routeEvidence ?? inferQuestionRouteEvidence(question, world)
    : inferQuestionRouteEvidence(question, world);
  const displayRegion = regionById(routeEvidence.displayRegionId, world);
  if (displayRegion) return displayRegion;
  const routedRegion = regionForTopicRouting(question.topicRouting, world.regions);
  if (routedRegion) return routedRegion;
  return matchRegionForLabels(labelsForQuestion(question), world);
}

export function isPaperFamilyQuestion(question: NormalizedQuestion, paperFamily: PaperFamily): boolean {
  return canonicalPaperFamily(String(question.paperFamily)) === canonicalPaperFamily(String(paperFamily));
}

export function isP3Question(question: NormalizedQuestion): boolean {
  return isPaperFamilyQuestion(question, 'p3');
}

export function filterQuestionsForRegion(
  questions: NormalizedQuestion[],
  region: RegionDefinition,
  world: WorldDefinition,
): NormalizedQuestion[] {
  return questions.filter((question) => (
    isPaperFamilyQuestion(question, world.paperFamily)
    && matchRegionForQuestion(question, world)?.id === region.id
  ));
}
