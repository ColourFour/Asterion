import type { NormalizedQuestion, PaperFamily, QuestionRouteEvidence, QuestionTopicRouting, RegionDefinition, WorldDefinition } from '../types';
import { isValidP3RegionId, P3_REGION_DEFINITIONS } from './p3SkillContract';
import type { QuestionRouteEvidenceStatus } from './questionRouteEvidence';
import { canonicalPaperFamily } from './resolveAssetPath';
import { regionForTopicRouting } from './topicRouting';

export const P3_WORLD_NAME = 'P3 Astral Academy';

export const P3_ASTRAL_ACADEMY: WorldDefinition = {
  id: 'p3-astral-academy',
  name: P3_WORLD_NAME,
  paperFamily: 'p3',
  regions: P3_REGION_DEFINITIONS.map(({ syllabusTopics: _syllabusTopics, subtopics, matchTerms, ...region }) => ({
    ...region,
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

export function matchRegionForLabels(labels: Array<string | undefined>, world: WorldDefinition = P3_ASTRAL_ACADEMY): RegionDefinition | undefined {
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

function p3RegionIdsForRouting(routing: QuestionTopicRouting | undefined): string[] {
  if (!routing) return [];
  return unique([
    routing.mappedRegionId,
    ...(routing.topicDistribution ?? []).map((item) => item.mappedRegionId),
  ].filter((value): value is string => isValidP3RegionId(value)));
}

function reviewReasonLooksAmbiguous(reason: string): boolean {
  return /ambiguous|multiple|conflict|uncertain|mixed|split/i.test(reason);
}

function topicIdLooksP3(topicId: string | undefined): boolean {
  return Boolean(topicId && /^9709_p3_topic_/i.test(topicId));
}

function topicIdLooksPrerequisite(topicId: string | undefined): boolean {
  return Boolean(topicId && /^9709_p[12]_topic_/i.test(topicId) && !topicIdLooksP3(topicId));
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
    candidateRegionIds: p3RegionIdsForRouting(routing).filter((regionId) => world.regions.some((item) => item.id === regionId)),
  };
}

export function inferQuestionRouteEvidence(question: NormalizedQuestion, world: WorldDefinition = P3_ASTRAL_ACADEMY): QuestionRouteEvidence {
  if (!isPaperFamilyQuestion(question, world.paperFamily)) {
    return routeEvidence('not-P3', 'paper-family', question, world, ['non-p3-paper-family']);
  }

  const routedRegion = regionForTopicRouting(question.topicRouting, world.regions);
  const candidateRegionIds = p3RegionIdsForRouting(question.topicRouting)
    .filter((regionId) => world.regions.some((region) => region.id === regionId));
  const hasRoutingAuthority = hasTopicRoutingAuthority(question.topicRouting);
  const fallbackRegion = fallbackDisplayRegion(question, world);

  if (hasRoutingAuthority) {
    const explicitUnsafeStatus = nonCleanStatus(question.topicRouting?.evidenceStatus);
    if (explicitUnsafeStatus === 'hard-failure') {
      return routeEvidence('hard-failure', 'topic-routing', question, world, ['topic-routing-evidence-status'], routedRegion, routedRegion ?? fallbackRegion);
    }

    if (candidateRegionIds.length > 1) {
      return routeEvidence('ambiguous-route', 'topic-routing', question, world, ['multiple-p3-candidate-regions'], routedRegion, routedRegion ?? fallbackRegion);
    }

    if (question.topicRouting?.reviewRequired) {
      const status: QuestionRouteEvidenceStatus = question.topicRouting.reviewReasons?.some(reviewReasonLooksAmbiguous)
        ? 'ambiguous-route'
        : 'review-only';
      return routeEvidence(status, 'topic-routing', question, world, ['topic-routing-review-required'], routedRegion, routedRegion ?? fallbackRegion);
    }

    if (explicitUnsafeStatus) {
      return routeEvidence(explicitUnsafeStatus, 'topic-routing', question, world, ['topic-routing-evidence-status'], routedRegion, routedRegion ?? fallbackRegion);
    }

    if (routedRegion) {
      return routeEvidence('clean', 'topic-routing', question, world, ['validated-topic-routing'], routedRegion);
    }

    if (question.topicRouting?.primaryTopicId) {
      const status: QuestionRouteEvidenceStatus = topicIdLooksPrerequisite(question.topicRouting.primaryTopicId)
        ? 'prerequisite-only'
        : topicIdLooksP3(question.topicRouting.primaryTopicId)
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

export function matchRegionForQuestion(question: NormalizedQuestion, world: WorldDefinition = P3_ASTRAL_ACADEMY): RegionDefinition | undefined {
  if (!isPaperFamilyQuestion(question, world.paperFamily)) return undefined;
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

export function filterQuestionsForRegion(questions: NormalizedQuestion[], region: RegionDefinition, paperFamily: PaperFamily = 'p3'): NormalizedQuestion[] {
  return questions.filter((question) => (
    isPaperFamilyQuestion(question, paperFamily)
    && matchRegionForQuestion(question)?.id === region.id
  ));
}
