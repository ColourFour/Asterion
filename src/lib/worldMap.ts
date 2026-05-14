import type { NormalizedQuestion, PaperFamily, QuestionRouteEvidence, QuestionTopicRouting, RegionDefinition, WorldDefinition } from '../types';
import type { QuestionRouteEvidenceStatus } from './questionRouteEvidence';
import { canonicalPaperFamily } from './resolveAssetPath';
import { regionForTopicRouting } from './topicRouting';

export const P3_WORLD_NAME = 'P3 Astral Academy';

export const P3_ASTRAL_ACADEMY: WorldDefinition = {
  id: 'p3-astral-academy',
  name: P3_WORLD_NAME,
  paperFamily: 'p3',
  regions: [
    {
      id: 'algebra-forge',
      name: 'Algebra Vault',
      description: 'A brass archive where expressions, functions, and fractions unlock older rooms.',
      activeByDefault: true,
      subtopics: ['polynomial division / long division', 'partial fractions', 'polynomials', 'functions', 'binomial expansion', 'algebraic manipulation'],
      matchTerms: ['algebra', 'algebraic manipulation', 'polynomial', 'polynomials', 'polynomial division', 'long division', 'partial fractions', 'partial fraction', 'function', 'functions', 'modulus', 'binomial expansion'],
    },
    {
      id: 'logarithm-grove',
      name: 'Logarithm Observatory',
      description: 'Lantern domes where exponential growth and logarithmic structure become visible.',
      activeByDefault: true,
      subtopics: ['logarithms', 'exponentials', 'solving logarithmic equations', 'solving exponential equations'],
      matchTerms: ['logarithm', 'logarithms', 'logarithmic', 'logarithmic functions', 'exponential', 'exponentials', 'exponential functions'],
    },
    {
      id: 'trig-observatory',
      name: 'Trigonometry Spire',
      description: 'A starlit tower for identities, equations, and angle formulae.',
      activeByDefault: true,
      subtopics: ['trigonometric identities', 'trigonometric equations', 'compound angle formulae', 'sec/cosec/cot', 'transformations involving trig where relevant'],
      matchTerms: ['trigonometry', 'trig', 'trig identities', 'trigonometric identities', 'trigonometric equations', 'compound angle', 'sec', 'cosec', 'cot'],
    },
    {
      id: 'complex-harbor',
      name: 'Argand Atrium',
      description: 'A moonlit hall for complex routes, polar form, arguments, and roots.',
      activeByDefault: false,
      subtopics: ['complex numbers', 'modulus and argument', 'Argand diagrams', 'polar form', 'roots of complex numbers'],
      matchTerms: ['complex', 'complex numbers', 'modulus and argument', 'argument', 'argand', 'argand diagrams', 'polar form', 'roots of complex numbers'],
    },
    {
      id: 'calculus-cliffs',
      name: 'Calculus Cliffs',
      description: 'High paths for gradients, rates of change, and stationary points.',
      activeByDefault: false,
      subtopics: ['parametric equations', 'differentiation', 'product rule', 'quotient rule', 'chain rule', 'implicit differentiation', 'stationary points'],
      matchTerms: ['parametric', 'parametric equations', 'parametric equation', 'parametric differentiation', 'cartesian equation', 'differentiation', 'derivative', 'product rule', 'quotient rule', 'chain rule', 'implicit differentiation', 'stationary points'],
    },
    {
      id: 'integration-gardens',
      name: 'Integral Terraces',
      description: 'Layered gardens where areas, accumulation, and integration methods grow together.',
      activeByDefault: false,
      subtopics: ['integration', 'integration by substitution', 'integration by parts', 'partial fractions integration', 'definite integrals'],
      matchTerms: ['integration', 'integral', 'substitution', 'integration by substitution', 'integration by parts', 'partial fractions integration'],
    },
    {
      id: 'vector-workshop',
      name: 'Vectors Gate',
      description: 'A drafting gate for lines, scalar products, intersections, and angles.',
      activeByDefault: false,
      subtopics: ['vectors', 'scalar product', 'vector lines', 'intersections', 'angles'],
      matchTerms: ['vector', 'vectors', 'scalar product', 'dot product', 'vector lines', 'intersections', 'angles'],
    },
    {
      id: 'numerical-mines',
      name: 'Iteration Forge',
      description: 'Lantern-lit machinery for iteration, roots, and numerical accuracy.',
      activeByDefault: false,
      subtopics: ['numerical solution of equations', 'iteration', 'Newton-Raphson', 'sign-change methods'],
      matchTerms: ['numerical', 'numerical solution', 'iteration', 'newton raphson', 'newton-raphson', 'sign change', 'sign-change'],
    },
    {
      id: 'differential-shrine',
      name: 'Differential Shrine',
      description: 'A calm shrine for forming and solving first-order differential equations.',
      activeByDefault: false,
      subtopics: ['differential equations', 'forming differential equations', 'solving first-order differential equations', 'separation of variables'],
      matchTerms: ['differential equation', 'differential equations', 'first order differential', 'first-order differential', 'forming differential equations', 'separation of variables'],
    },
  ],
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
  ].filter((value): value is string => Boolean(value)));
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
