import type { RegionDefinition } from '../types';
import type { P3SkillId } from '../data/p3SkillContract';
export {
  P3_OFFICIAL_TOPICS,
  P3_SKILL_CONTRACT,
  P3_SKILL_CONTRACT_COURSE,
  P3_SKILL_CONTRACT_SOURCE,
  P3_SKILL_IDS,
  P3_SKILL_READINESS_STATUSES,
  type P3OfficialTopic,
  type P3SkillId,
  type P3SkillReadiness,
} from '../data/p3SkillContract';
import { P3_SKILL_IDS } from '../data/p3SkillContract';

export const P3_SKILL_MAP_SOURCE = 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json';

export const P3_TOPIC_ID_TO_REGION_ID = {
  '9709_p3_topic_algebra': 'algebra',
  '9709_p3_topic_logarithmic_and_exponential_functions': 'logarithmic-and-exponential-functions',
  '9709_p3_topic_trigonometry': 'trigonometry',
  '9709_p3_topic_complex_numbers': 'complex-numbers',
  '9709_p3_topic_differentiation': 'differentiation',
  '9709_p3_topic_integration': 'integration',
  '9709_p3_topic_vectors': 'vectors',
  '9709_p3_topic_numerical_solution_of_equations': 'numerical-solution-of-equations',
  '9709_p3_topic_differential_equations': 'differential-equations',
} as const;

export const P3_TOPIC_ID_TO_REGION_NAME = {
  '9709_p3_topic_algebra': 'Algebra',
  '9709_p3_topic_logarithmic_and_exponential_functions': 'Logarithmic and Exponential Functions',
  '9709_p3_topic_trigonometry': 'Trigonometry',
  '9709_p3_topic_complex_numbers': 'Complex Numbers',
  '9709_p3_topic_differentiation': 'Differentiation',
  '9709_p3_topic_integration': 'Integration',
  '9709_p3_topic_vectors': 'Vectors',
  '9709_p3_topic_numerical_solution_of_equations': 'Numerical Solution of Equations',
  '9709_p3_topic_differential_equations': 'Differential Equations',
} as const;

export type P3TopicId = keyof typeof P3_TOPIC_ID_TO_REGION_ID;
export type P3RegionId = typeof P3_TOPIC_ID_TO_REGION_ID[P3TopicId];

export const P3_REGION_DEFINITIONS = [
  {
    id: 'algebra',
    name: 'Algebra',
    description: 'Expressions, polynomials, partial fractions, modulus equations, and binomial expansion.',
    activeByDefault: true,
    syllabusTopics: ['Algebra'],
    subtopics: ['polynomial division / long division', 'partial fractions', 'polynomials', 'functions', 'binomial expansion', 'algebraic manipulation'],
    matchTerms: ['algebra', 'algebraic manipulation', 'polynomial', 'polynomials', 'polynomial division', 'long division', 'partial fractions', 'partial fraction', 'function', 'functions', 'modulus', 'binomial expansion', 'quadratics'],
  },
  {
    id: 'logarithmic-and-exponential-functions',
    name: 'Logarithmic and Exponential Functions',
    description: 'Logarithmic laws, exponential equations, domain checks, and linearisation.',
    activeByDefault: true,
    syllabusTopics: ['Logarithmic and exponential functions'],
    subtopics: ['logarithms', 'exponentials', 'solving logarithmic equations', 'solving exponential equations'],
    matchTerms: ['logarithm', 'logarithms', 'logarithmic', 'logarithmic functions', 'exponential', 'exponentials', 'exponential functions', 'logarithms and exponentials'],
  },
  {
    id: 'trigonometry',
    name: 'Trigonometry',
    description: 'Identities, equations on intervals, reciprocal functions, and compound-angle formulae.',
    activeByDefault: true,
    syllabusTopics: ['Trigonometry'],
    subtopics: ['trigonometric identities', 'trigonometric equations', 'compound angle formulae', 'sec/cosec/cot', 'transformations involving trig where relevant'],
    matchTerms: ['trigonometry', 'trig', 'trig identities', 'trigonometric identities', 'trigonometric equations', 'compound angle', 'sec', 'cosec', 'cot'],
  },
  {
    id: 'differentiation',
    name: 'Differentiation',
    description: 'Differentiation techniques, tangents, normals, stationary points, implicit and parametric forms.',
    activeByDefault: false,
    syllabusTopics: ['Differentiation'],
    subtopics: ['parametric equations', 'differentiation', 'product rule', 'quotient rule', 'chain rule', 'implicit differentiation', 'stationary points'],
    matchTerms: ['parametric', 'parametric equations', 'parametric equation', 'parametric differentiation', 'cartesian equation', 'differentiation', 'derivative', 'product rule', 'quotient rule', 'chain rule', 'implicit differentiation', 'stationary points'],
  },
  {
    id: 'integration',
    name: 'Integration',
    description: 'Method choice, substitution, parts, partial fractions, areas, and definite integrals.',
    activeByDefault: false,
    syllabusTopics: ['Integration'],
    subtopics: ['integration', 'integration by substitution', 'integration by parts', 'partial fractions integration', 'definite integrals'],
    matchTerms: ['integration', 'integral', 'substitution', 'integration by substitution', 'integration by parts', 'partial fractions integration'],
  },
  {
    id: 'numerical-solution-of-equations',
    name: 'Numerical Solution of Equations',
    description: 'Sign-change arguments, fixed-point iteration, convergence checks, and numerical accuracy.',
    activeByDefault: false,
    syllabusTopics: ['Numerical solution of equations'],
    subtopics: ['numerical solution of equations', 'iteration', 'Newton-Raphson', 'sign-change methods'],
    matchTerms: ['numerical', 'numerical solution', 'iteration', 'newton raphson', 'newton-raphson', 'sign change', 'sign-change'],
  },
  {
    id: 'vectors',
    name: 'Vectors',
    description: 'Vector notation, 3D lines, intersections, scalar products, angles, and geometry modelling.',
    activeByDefault: false,
    syllabusTopics: ['Vectors'],
    subtopics: ['vectors', 'scalar product', 'vector lines', 'intersections', 'angles'],
    matchTerms: ['vector', 'vectors', 'scalar product', 'dot product', 'vector lines', 'intersections', 'angles'],
  },
  {
    id: 'differential-equations',
    name: 'Differential Equations',
    description: 'Forming and solving first-order differential equations, including separation and initial conditions.',
    activeByDefault: false,
    syllabusTopics: ['Differential equations'],
    subtopics: ['differential equations', 'forming differential equations', 'solving first-order differential equations', 'separation of variables'],
    matchTerms: ['differential equation', 'differential equations', 'first order differential', 'first-order differential', 'forming differential equations', 'separation of variables'],
  },
  {
    id: 'complex-numbers',
    name: 'Complex Numbers',
    description: 'Cartesian form, modulus-argument form, loci, polar form, and roots of complex numbers.',
    activeByDefault: false,
    syllabusTopics: ['Complex numbers'],
    subtopics: ['complex numbers', 'modulus and argument', 'Argand diagrams', 'polar form', 'roots of complex numbers'],
    matchTerms: ['complex', 'complex numbers', 'modulus and argument', 'argument', 'argand', 'argand diagrams', 'polar form', 'roots of complex numbers'],
  },
] as const;

export const P3_ALLOWED_REGION_IDS = P3_REGION_DEFINITIONS.map((region) => region.id);
export const P3_ALLOWED_TOPIC_IDS = Object.keys(P3_TOPIC_ID_TO_REGION_ID) as P3TopicId[];
export const P3_ALLOWED_SYLLABUS_TOPICS = Array.from(new Set(P3_REGION_DEFINITIONS.flatMap((region) => region.syllabusTopics)));

const regionIds = new Set<string>(P3_ALLOWED_REGION_IDS);
const topicIds = new Set<string>(P3_ALLOWED_TOPIC_IDS);
const skillIds = new Set<string>(P3_SKILL_IDS);

export function isValidP3RegionId(value: string | undefined): value is P3RegionId {
  return Boolean(value && regionIds.has(value));
}

export function isValidP3TopicId(value: string | undefined): value is P3TopicId {
  return Boolean(value && topicIds.has(value));
}

export function isValidP3SkillId(value: string | undefined): value is P3SkillId {
  return Boolean(value && skillIds.has(value));
}

export function p3RegionIdForTopicId(topicId: string | undefined): P3RegionId | undefined {
  return isValidP3TopicId(topicId) ? P3_TOPIC_ID_TO_REGION_ID[topicId] : undefined;
}

export function p3RegionNameForTopicId(topicId: string | undefined): string | undefined {
  return isValidP3TopicId(topicId) ? P3_TOPIC_ID_TO_REGION_NAME[topicId] : undefined;
}

export function p3RegionDefinitionForId(regionId: string | undefined): RegionDefinition | undefined {
  if (!isValidP3RegionId(regionId)) return undefined;
  const region = P3_REGION_DEFINITIONS.find((candidate) => candidate.id === regionId);
  if (!region) return undefined;
  return {
    id: region.id,
    name: region.name,
    description: region.description,
    activeByDefault: region.activeByDefault,
    subtopics: [...region.subtopics],
    matchTerms: [...region.matchTerms],
  };
}

export function isValidP3SyllabusTopic(value: string | undefined): boolean {
  return Boolean(value && (P3_ALLOWED_SYLLABUS_TOPICS as string[]).includes(value));
}
