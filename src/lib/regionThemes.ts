import type { PaperFamily, RegionDefinition } from '../types';
import { normalizeLabel, P3_COURSE_MAP } from './worldMap';

export interface RegionTheme {
  regionId: string;
  title: string;
  subtitle: string;
  paperFamily: PaperFamily;
  topic: string;
  topicAliases: string[];
  snippetTopics: string[];
  generatedPracticeTopics: string[];
  icon: string;
}

const regionThemes: Record<string, RegionTheme> = {
  'algebra': {
    regionId: 'algebra',
    title: 'Algebra',
    subtitle: 'Expressions, polynomials, partial fractions, modulus equations, and binomial expansion.',
    paperFamily: 'p3',
    topic: 'algebra',
    topicAliases: [
      'algebra',
      'algebraic_manipulation',
      'algebraic manipulation',
      'functions',
      'function',
      'polynomials',
      'polynomial',
      'partial_fractions',
      'partial fractions',
      'binomial',
      'binomial_expansion',
      'binomial expansion',
      'quadratics',
      'quadratic',
    ],
    snippetTopics: [
      'algebra',
      'algebraic_manipulation',
      'functions',
      'polynomials',
      'partial_fractions',
      'binomial_expansion',
      'quadratics',
    ],
    generatedPracticeTopics: ['binomial_expansion'],
    icon: 'A',
  },
  'logarithmic-and-exponential-functions': {
    regionId: 'logarithmic-and-exponential-functions',
    title: 'Logarithmic and Exponential Functions',
    subtitle: 'Logarithmic laws, exponential equations, domain checks, and linearisation.',
    paperFamily: 'p3',
    topic: 'logarithmic_and_exponential_functions',
    topicAliases: [
      'logs',
      'log',
      'logarithm',
      'logarithms',
      'logarithmic',
      'logarithmic functions',
      'exponential',
      'exponentials',
      'exponential functions',
      'logarithms and exponentials',
      'logarithmic and exponential functions',
    ],
    snippetTopics: ['logarithmic_and_exponential_functions', 'logarithms_and_exponentials', 'logarithms', 'exponentials'],
    generatedPracticeTopics: ['logarithms_and_exponentials'],
    icon: 'LE',
  },
  'trigonometry': {
    regionId: 'trigonometry',
    title: 'Trigonometry',
    subtitle: 'Identities, equations on intervals, reciprocal functions, and compound-angle formulae.',
    paperFamily: 'p3',
    topic: 'trigonometry',
    topicAliases: [
      'trig',
      'trigonometry',
      'trigonometric',
      'trigonometric identities',
      'trig identities',
      'trigonometric equations',
      'compound angle',
      'compound angle formulae',
      'sec cosec cot',
    ],
    snippetTopics: ['trigonometry', 'trigonometric_identities', 'trigonometric_equations'],
    generatedPracticeTopics: [],
    icon: 'T',
  },
  'differentiation': {
    regionId: 'differentiation',
    title: 'Differentiation',
    subtitle: 'Differentiation techniques, tangents, normals, stationary points, implicit and parametric forms.',
    paperFamily: 'p3',
    topic: 'differentiation',
    topicAliases: [
      'calculus',
      'derivative',
      'derivatives',
      'differentiation',
      'parametric',
      'parametric equations',
      'parametric_equations',
      'implicit differentiation',
      'stationary points',
      'chain rule',
      'product rule',
      'quotient rule',
    ],
    snippetTopics: ['differentiation', 'parametric_equations'],
    generatedPracticeTopics: [],
    icon: 'D',
  },
  'integration': {
    regionId: 'integration',
    title: 'Integration',
    subtitle: 'Method choice, substitution, parts, partial fractions, areas, and definite integrals.',
    paperFamily: 'p3',
    topic: 'integration',
    topicAliases: [
      'integral',
      'integrals',
      'integration',
      'integration by substitution',
      'substitution',
      'integration by parts',
      'parts',
      'partial fractions integration',
      'definite integrals',
      'area under curve',
    ],
    snippetTopics: ['integration', 'partial_fractions'],
    generatedPracticeTopics: [],
    icon: 'I',
  },
  'numerical-solution-of-equations': {
    regionId: 'numerical-solution-of-equations',
    title: 'Numerical Solution of Equations',
    subtitle: 'Sign-change arguments, fixed-point iteration, convergence checks, and numerical accuracy.',
    paperFamily: 'p3',
    topic: 'numerical_solution_of_equations',
    topicAliases: [
      'numerical',
      'numerical methods',
      'numerical solution',
      'numerical solution of equations',
      'iteration',
      'iterative methods',
      'newton raphson',
      'newton-raphson',
      'sign change',
      'sign-change methods',
    ],
    snippetTopics: ['numerical_methods', 'numerical_solution_of_equations', 'iteration'],
    generatedPracticeTopics: [],
    icon: 'N',
  },
  'vectors': {
    regionId: 'vectors',
    title: 'Vectors',
    subtitle: 'Vector notation, 3D lines, intersections, scalar products, angles, and geometry modelling.',
    paperFamily: 'p3',
    topic: 'vectors',
    topicAliases: [
      'vector',
      'vectors',
      'vector notation',
      'magnitude of vectors',
      'unit vectors',
      'position vectors',
      'displacement vectors',
      'vector lines',
      'vector equation',
      'scalar product',
      'dot product',
      'intersections',
      'skew lines',
      '3d vectors',
      'angles between lines',
      'distance from point to line',
    ],
    snippetTopics: ['vectors'],
    generatedPracticeTopics: [],
    icon: 'V',
  },
  'differential-equations': {
    regionId: 'differential-equations',
    title: 'Differential Equations',
    subtitle: 'Forming and solving first-order differential equations, including separation and initial conditions.',
    paperFamily: 'p3',
    topic: 'differential_equations',
    topicAliases: [
      'differential equation',
      'differential equations',
      'first order differential',
      'first-order differential',
      'separation of variables',
      'forming differential equations',
    ],
    snippetTopics: ['differential_equations', 'separation_of_variables'],
    generatedPracticeTopics: [],
    icon: 'DE',
  },
  'complex-numbers': {
    regionId: 'complex-numbers',
    title: 'Complex Numbers',
    subtitle: 'Cartesian form, modulus-argument form, loci, polar form, and roots of complex numbers.',
    paperFamily: 'p3',
    topic: 'complex_numbers',
    topicAliases: [
      'complex',
      'complex numbers',
      'argand',
      'argand diagrams',
      'argand diagram',
      'modulus and argument',
      'argument',
      'polar form',
      'roots of complex numbers',
    ],
    snippetTopics: ['complex_numbers', 'argand_diagrams', 'modulus_and_argument'],
    generatedPracticeTopics: [],
    icon: 'C',
  },
};

const themeAliases: Record<string, string> = {
  algebra: 'algebra',
  functions: 'algebra',
  function: 'algebra',
  'algebra functions': 'algebra',
  'algebra/functions': 'algebra',
  algebra_functions_and_binomial: 'algebra',
  binomial: 'algebra',
  binomial_expansion: 'algebra',
  'binomial expansion': 'algebra',
  'partial fractions': 'algebra',
  partial_fractions: 'algebra',
  quadratics: 'algebra',
  polynomial: 'algebra',
  polynomials: 'algebra',
  logs: 'logarithmic-and-exponential-functions',
  log: 'logarithmic-and-exponential-functions',
  logarithm: 'logarithmic-and-exponential-functions',
  logarithms: 'logarithmic-and-exponential-functions',
  logarithmic_and_exponential_functions: 'logarithmic-and-exponential-functions',
  logarithms_and_exponentials: 'logarithmic-and-exponential-functions',
  'logarithms and exponentials': 'logarithmic-and-exponential-functions',
  'logarithmic and exponential functions': 'logarithmic-and-exponential-functions',
  exponentials: 'logarithmic-and-exponential-functions',
  exponential: 'logarithmic-and-exponential-functions',
  trig: 'trigonometry',
  trigonometry: 'trigonometry',
  'trigonometric equations': 'trigonometry',
  'trigonometric identities': 'trigonometry',
  differentiation: 'differentiation',
  derivative: 'differentiation',
  calculus: 'differentiation',
  parametric_equations: 'differentiation',
  'parametric equations': 'differentiation',
  integration: 'integration',
  integral: 'integration',
  integrals: 'integration',
  numerical_methods: 'numerical-solution-of-equations',
  numerical_solution_of_equations: 'numerical-solution-of-equations',
  'numerical methods': 'numerical-solution-of-equations',
  'numerical solution of equations': 'numerical-solution-of-equations',
  iteration: 'numerical-solution-of-equations',
  vectors: 'vectors',
  vector: 'vectors',
  differential_equations: 'differential-equations',
  'differential equations': 'differential-equations',
  complex: 'complex-numbers',
  complex_numbers: 'complex-numbers',
  'complex numbers': 'complex-numbers',
  argand: 'complex-numbers',
};

function fallbackTheme(region: RegionDefinition): RegionTheme {
  const topic = normalizeLabel(region.subtopics[0] ?? region.name).replace(/\s+/g, '_');
  return {
    regionId: region.id,
    title: region.name,
    subtitle: region.description,
    paperFamily: P3_COURSE_MAP.paperFamily,
    topic,
    topicAliases: [...region.matchTerms, ...region.subtopics],
    snippetTopics: [topic, ...region.matchTerms, ...region.subtopics],
    generatedPracticeTopics: [],
    icon: region.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
  };
}

export function getRegionTheme(regionOrId: RegionDefinition | string): RegionTheme {
  const regionId = typeof regionOrId === 'string' ? regionOrId : regionOrId.id;
  const directTheme = regionThemes[regionId];
  if (directTheme) return directTheme;

  const normalized = normalizeLabel(regionId);
  const aliasRegionId = themeAliases[regionId] ?? themeAliases[normalized];
  if (aliasRegionId && regionThemes[aliasRegionId]) return regionThemes[aliasRegionId];

  if (typeof regionOrId !== 'string') return fallbackTheme(regionOrId);

  const region = P3_COURSE_MAP.regions.find((item) => item.id === regionId || normalizeLabel(item.name) === normalized);
  return region ? fallbackTheme(region) : {
    regionId,
    title: regionId,
    subtitle: 'Topic metadata has not been authored yet.',
    paperFamily: P3_COURSE_MAP.paperFamily,
    topic: normalized.replace(/\s+/g, '_'),
    topicAliases: [],
    snippetTopics: [normalized.replace(/\s+/g, '_')],
    generatedPracticeTopics: [],
    icon: 'P3',
  };
}

export function getRegionThemeClass(theme: RegionTheme): string {
  return `topic-theme-${theme.regionId.replace(/[^a-z0-9]+/gi, '-')}`;
}

export function listRegionThemes(): RegionTheme[] {
  return P3_COURSE_MAP.regions.map((region) => getRegionTheme(region));
}

export function topicKeysForTheme(theme: RegionTheme, purpose: 'snippets' | 'practice' | 'all' = 'all'): string[] {
  const purposeTopics = purpose === 'practice'
    ? theme.generatedPracticeTopics
    : purpose === 'snippets' ? theme.snippetTopics : [...theme.snippetTopics, ...theme.generatedPracticeTopics];
  return Array.from(new Set([
    theme.topic,
    ...theme.topicAliases,
    ...purposeTopics,
  ].map((topic) => topic.trim()).filter(Boolean)));
}

export function topicAliasesForRegion(regionOrId: RegionDefinition | string, purpose: 'snippets' | 'practice' | 'all' = 'all'): string[] {
  return topicKeysForTheme(getRegionTheme(regionOrId), purpose);
}

export function findThemeForTopic(topic: string): RegionTheme | undefined {
  const normalizedTopic = normalizeLabel(topic);
  const directRegionId = themeAliases[topic] ?? themeAliases[normalizedTopic];
  if (directRegionId) return regionThemes[directRegionId];

  return listRegionThemes().find((theme) => (
    topicKeysForTheme(theme).some((candidate) => {
      const normalizedCandidate = normalizeLabel(candidate);
      return normalizedCandidate === normalizedTopic
        || normalizedCandidate.includes(normalizedTopic)
        || normalizedTopic.includes(normalizedCandidate);
    })
  ));
}
