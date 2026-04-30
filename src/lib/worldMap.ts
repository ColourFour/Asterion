import type { NormalizedQuestion, PaperFamily, RegionDefinition, WorldDefinition } from '../types';
import { canonicalPaperFamily } from './resolveAssetPath';

export const P3_WORLD_NAME = 'P3 Astral Academy';

export const P3_ASTRAL_ACADEMY: WorldDefinition = {
  id: 'p3-astral-academy',
  name: P3_WORLD_NAME,
  paperFamily: 'p3',
  regions: [
    {
      id: 'algebra-forge',
      name: 'Algebra Forge',
      description: 'A warm workshop where expressions are hammered into useful forms.',
      activeByDefault: true,
      subtopics: ['polynomial division / long division', 'partial fractions', 'modulus', 'binomial expansion', 'algebraic manipulation'],
      matchTerms: ['algebra', 'algebraic manipulation', 'polynomial division', 'long division', 'partial fractions', 'partial fraction', 'modulus', 'binomial expansion'],
    },
    {
      id: 'logarithm-grove',
      name: 'Logarithm Grove',
      description: 'Quiet paths where exponential growth and logarithmic structure become visible.',
      activeByDefault: true,
      subtopics: ['logarithms', 'exponentials', 'solving logarithmic equations', 'solving exponential equations'],
      matchTerms: ['logarithm', 'logarithms', 'logarithmic', 'logarithmic functions', 'exponential', 'exponentials', 'exponential functions'],
    },
    {
      id: 'trig-observatory',
      name: 'Trig Observatory',
      description: 'A starlit dome for identities, equations, and angle formulae.',
      activeByDefault: true,
      subtopics: ['trigonometric identities', 'trigonometric equations', 'compound angle formulae', 'sec/cosec/cot', 'transformations involving trig where relevant'],
      matchTerms: ['trigonometry', 'trig', 'trig identities', 'trigonometric identities', 'trigonometric equations', 'compound angle', 'sec', 'cosec', 'cot'],
    },
    {
      id: 'complex-harbor',
      name: 'Complex Harbor',
      description: 'A moonlit harbor for Argand maps, polar routes, and complex roots.',
      activeByDefault: false,
      subtopics: ['complex numbers', 'modulus and argument', 'Argand diagrams', 'polar form', 'roots of complex numbers'],
      matchTerms: ['complex', 'complex numbers', 'modulus and argument', 'argument', 'argand', 'argand diagrams', 'polar form', 'roots of complex numbers'],
    },
    {
      id: 'calculus-cliffs',
      name: 'Calculus Cliffs',
      description: 'High paths for gradients, rates of change, and stationary points.',
      activeByDefault: false,
      subtopics: ['differentiation', 'product rule', 'quotient rule', 'chain rule', 'implicit differentiation', 'stationary points'],
      matchTerms: ['differentiation', 'derivative', 'product rule', 'quotient rule', 'chain rule', 'implicit differentiation', 'stationary points'],
    },
    {
      id: 'integration-gardens',
      name: 'Integration Gardens',
      description: 'Terraced gardens where areas, accumulation, and methods grow together.',
      activeByDefault: false,
      subtopics: ['integration', 'integration by substitution', 'integration by parts', 'partial fractions integration', 'differential equations'],
      matchTerms: ['integration', 'integral', 'substitution', 'integration by substitution', 'integration by parts', 'partial fractions integration'],
    },
    {
      id: 'vector-workshop',
      name: 'Vector Workshop',
      description: 'A drafting hall for lines, scalar products, intersections, and angles.',
      activeByDefault: false,
      subtopics: ['vectors', 'scalar product', 'vector lines', 'intersections', 'angles'],
      matchTerms: ['vector', 'vectors', 'scalar product', 'dot product', 'vector lines', 'intersections', 'angles'],
    },
    {
      id: 'numerical-mines',
      name: 'Numerical Mines',
      description: 'Lantern-lit tunnels for iteration, roots, and numerical accuracy.',
      activeByDefault: false,
      subtopics: ['numerical solution of equations', 'iteration', 'Newton-Raphson', 'sign-change methods'],
      matchTerms: ['numerical', 'numerical solution', 'iteration', 'newton raphson', 'newton-raphson', 'sign change', 'sign-change'],
    },
    {
      id: 'differential-shrine',
      name: 'Differential Shrine',
      description: 'A calm shrine for forming and solving first-order differential equations.',
      activeByDefault: false,
      subtopics: ['differential equations', 'forming differential equations', 'solving first-order differential equations'],
      matchTerms: ['differential equation', 'differential equations', 'first order differential', 'forming differential equations'],
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

export function matchRegionForQuestion(question: NormalizedQuestion, world: WorldDefinition = P3_ASTRAL_ACADEMY): RegionDefinition | undefined {
  if (!isPaperFamilyQuestion(question, world.paperFamily)) return undefined;
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
