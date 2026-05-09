import type { PaperFamily, RegionDefinition } from '../types';
import { normalizeLabel, P3_ASTRAL_ACADEMY } from './worldMap';

export type RegionThemeAccent =
  | 'vault'
  | 'observatory'
  | 'spire'
  | 'atrium'
  | 'cliffs'
  | 'terraces'
  | 'gate'
  | 'forge'
  | 'shrine';

export interface RegionThemeColors {
  background: string;
  panel: string;
  panelStrong: string;
  panelBorder: string;
  headingText: string;
  bodyText: string;
  mutedText: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  buttonBackground: string;
  buttonText: string;
  buttonBorder: string;
  badgeBackground: string;
  badgeText: string;
  focusRing: string;
}

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
  accent: RegionThemeAccent;
  colors: RegionThemeColors;
  atmosphere: string;
  guideMessage: string;
  masteryQuote: string;
}

const readableTextColors = {
  background: '#fff8ec',
  panel: '#fffdf8',
  panelStrong: '#fff7eb',
  headingText: '#172033',
  bodyText: '#263244',
  mutedText: '#38455a',
  focusRing: '#1d4ed8',
};

function colorsForRegion(accent: string, accentText: string, accentSoft: string): RegionThemeColors {
  return {
    ...readableTextColors,
    panelBorder: accentText,
    accent,
    accentText,
    accentSoft,
    buttonBackground: accentText,
    buttonText: '#ffffff',
    buttonBorder: accentText,
    badgeBackground: accentSoft,
    badgeText: accentText,
  };
}

const regionThemes: Record<string, RegionTheme> = {
  'algebra-forge': {
    regionId: 'algebra-forge',
    title: 'Algebra Vault',
    subtitle: 'A guarded vault for expansions, factors, remainders, and locked algebraic forms.',
    paperFamily: 'p3',
    topic: 'algebra_functions_and_binomial',
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
    icon: 'AV',
    accent: 'vault',
    colors: colorsForRegion('#b8872d', '#283718', '#fff1d6'),
    atmosphere: 'Brass locks, black marble counters, archive drawers, and valuable structure under guard.',
    guideMessage: 'Pause here to identify structure: factor, divide, decompose, or compose before calculating.',
    masteryQuote: 'Structure first. Expansion only when it earns a mark.',
  },
  'logarithm-grove': {
    regionId: 'logarithm-grove',
    title: 'Logarithm Observatory',
    subtitle: 'A storybook observatory where exponential growth and logarithmic structure become visible.',
    paperFamily: 'p3',
    topic: 'logarithms_and_exponentials',
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
    ],
    snippetTopics: ['logarithms_and_exponentials', 'logarithms', 'exponentials'],
    generatedPracticeTopics: ['logarithms_and_exponentials'],
    icon: 'LO',
    accent: 'observatory',
    colors: colorsForRegion('#2b6f9f', '#173653', '#e7f2ff'),
    atmosphere: 'Lantern domes, brass telescopes, star charts, moonlit shelves, and curves hidden in constellations.',
    guideMessage: 'Use this stop to slow down: convert forms, combine logs safely, and check every domain restriction.',
    masteryQuote: 'Every log solution must survive the original equation.',
  },
  'trig-observatory': {
    regionId: 'trig-observatory',
    title: 'Trigonometry Spire',
    subtitle: 'An impossible spire of arcs, angled supports, intervals, and exact angle choices.',
    paperFamily: 'p3',
    topic: 'trigonometry',
    topicAliases: [
      'trig',
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
    icon: 'TS',
    accent: 'spire',
    colors: colorsForRegion('#5d6fa8', '#243656', '#eef2ff'),
    atmosphere: 'Tension cables, circular platforms, and high-angle paths returning from every quadrant.',
    guideMessage: 'Keep identities visible, preserve every root, and sweep the requested interval deliberately.',
    masteryQuote: 'Do not divide away a solution you have not accounted for.',
  },
  'complex-harbor': {
    regionId: 'complex-harbor',
    title: 'Argand Atrium',
    subtitle: 'A mirrored glass atrium for modulus, argument, loci, and roots.',
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
    icon: 'AA',
    accent: 'atrium',
    colors: colorsForRegion('#7561d8', '#30286c', '#ece9ff'),
    atmosphere: 'Mirrored floors, floating axes, polar light, and compass geometry on the complex plane.',
    guideMessage: 'Sketch before manipulating: the picture often tells you which form to use.',
    masteryQuote: 'The quadrant is part of the answer, not a detail after it.',
  },
  'calculus-cliffs': {
    regionId: 'calculus-cliffs',
    title: 'Calculus Cliffs',
    subtitle: 'White cliff paths for gradients, rates of change, and stationary points.',
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
    icon: 'CC',
    accent: 'cliffs',
    colors: colorsForRegion('#7d735f', '#3f3b33', '#f4efe6'),
    atmosphere: 'White chalk cliffs, ocean wind, tangent paths, and turning points marked at the edge.',
    guideMessage: 'Choose the derivative rule before simplifying, then interpret the result in context.',
    masteryQuote: 'A derivative is evidence only after you say what it means.',
  },
  'integration-gardens': {
    regionId: 'integration-gardens',
    title: 'Integral Terraces',
    subtitle: 'Coastal academic terraces where areas, limits, and methods accumulate.',
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
    icon: 'IT',
    accent: 'terraces',
    colors: colorsForRegion('#4f7c5c', '#2f593b', '#edf6e8'),
    atmosphere: 'Warm stone, vines, sea air, careful limits, and accumulation built one strip at a time.',
    guideMessage: 'Choose the method from the shape of the integrand, then keep limits and constants honest.',
    masteryQuote: 'Changing variables means changing the whole setup.',
  },
  'vector-workshop': {
    regionId: 'vector-workshop',
    title: 'Vectors Gate',
    subtitle: 'A navigation gate for lines, scalar products, intersections, and angles.',
    paperFamily: 'p3',
    topic: 'vectors',
    topicAliases: [
      'vector',
      'vectors',
      'vector lines',
      'scalar product',
      'dot product',
      'intersections',
      '3d vectors',
      'angles between lines',
    ],
    snippetTopics: ['vectors'],
    generatedPracticeTopics: [],
    icon: 'VG',
    accent: 'gate',
    colors: colorsForRegion('#386a83', '#213b52', '#e5eef5'),
    atmosphere: 'Portal arches, compass bearings, wind lines, launch paths, and component checks at every gate.',
    guideMessage: 'Separate position from direction, then let components verify the geometry.',
    masteryQuote: 'One matching component is not an intersection.',
  },
  'numerical-mines': {
    regionId: 'numerical-mines',
    title: 'Iteration Forge',
    subtitle: 'A molten smithing hall for roots, iteration, and numerical accuracy.',
    paperFamily: 'p3',
    topic: 'numerical_methods',
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
    icon: 'IF',
    accent: 'forge',
    colors: colorsForRegion('#b55320', '#5d321b', '#ffe3d1'),
    atmosphere: 'Iron plates, ember heat, rivets, anvils, iteration wheels, and rounding checked at the final gate.',
    guideMessage: 'Carry enough accuracy through the process and justify the final rounding step.',
    masteryQuote: 'Approximation earns marks when the method is visible.',
  },
  'differential-shrine': {
    regionId: 'differential-shrine',
    title: 'Differential Shrine',
    subtitle: 'A mountain shrine for forming and solving first-order differential equations.',
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
    icon: 'DS',
    accent: 'shrine',
    colors: colorsForRegion('#64705a', '#33402d', '#ecf4e6'),
    atmosphere: 'Stone steps, prayer flags, lanterns, pale mist, separated variables, and constants placed with care.',
    guideMessage: 'Translate the rate, separate cleanly, and use conditions only after integrating.',
    masteryQuote: 'The constant belongs to the solution, not the differential equation.',
  },
};

const themeAliases: Record<string, string> = {
  algebra: 'algebra-forge',
  functions: 'algebra-forge',
  function: 'algebra-forge',
  'algebra functions': 'algebra-forge',
  'algebra/functions': 'algebra-forge',
  algebra_functions_and_binomial: 'algebra-forge',
  binomial: 'algebra-forge',
  binomial_expansion: 'algebra-forge',
  'binomial expansion': 'algebra-forge',
  'partial fractions': 'algebra-forge',
  partial_fractions: 'algebra-forge',
  quadratics: 'algebra-forge',
  polynomial: 'algebra-forge',
  polynomials: 'algebra-forge',
  logs: 'logarithm-grove',
  log: 'logarithm-grove',
  logarithm: 'logarithm-grove',
  logarithms: 'logarithm-grove',
  logarithms_and_exponentials: 'logarithm-grove',
  'logarithms and exponentials': 'logarithm-grove',
  exponentials: 'logarithm-grove',
  exponential: 'logarithm-grove',
  trig: 'trig-observatory',
  trigonometry: 'trig-observatory',
  'trigonometric equations': 'trig-observatory',
  'trigonometric identities': 'trig-observatory',
  differentiation: 'calculus-cliffs',
  derivative: 'calculus-cliffs',
  parametric_equations: 'calculus-cliffs',
  'parametric equations': 'calculus-cliffs',
  integration: 'integration-gardens',
  integral: 'integration-gardens',
  integrals: 'integration-gardens',
  complex: 'complex-harbor',
  complex_numbers: 'complex-harbor',
  'complex numbers': 'complex-harbor',
  argand: 'complex-harbor',
  vectors: 'vector-workshop',
  vector: 'vector-workshop',
  numerical_methods: 'numerical-mines',
  'numerical methods': 'numerical-mines',
  iteration: 'numerical-mines',
  differential_equations: 'differential-shrine',
  'differential equations': 'differential-shrine',
  calculus: 'calculus-cliffs',
};

function fallbackTheme(region: RegionDefinition): RegionTheme {
  const topic = normalizeLabel(region.subtopics[0] ?? region.name).replace(/\s+/g, '_');
  return {
    regionId: region.id,
    title: region.name,
    subtitle: region.description,
    paperFamily: P3_ASTRAL_ACADEMY.paperFamily,
    topic,
    topicAliases: [...region.matchTerms, ...region.subtopics],
    snippetTopics: [topic, ...region.matchTerms, ...region.subtopics],
    generatedPracticeTopics: [],
    icon: region.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
    accent: 'observatory',
    colors: colorsForRegion('#0f6f68', '#0b4f4b', '#dff4ef'),
    atmosphere: region.description,
    guideMessage: 'Start by identifying the topic signal, then choose the method before calculating.',
    masteryQuote: 'Progress here comes from saved attempts and checked mark schemes.',
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

  const region = P3_ASTRAL_ACADEMY.regions.find((item) => item.id === regionId || normalizeLabel(item.name) === normalized);
  return region ? fallbackTheme(region) : {
    regionId,
    title: regionId,
    subtitle: 'A region theme has not been authored yet.',
    paperFamily: P3_ASTRAL_ACADEMY.paperFamily,
    topic: normalized.replace(/\s+/g, '_'),
    topicAliases: [],
    snippetTopics: [normalized.replace(/\s+/g, '_')],
    generatedPracticeTopics: [],
    icon: 'RG',
    accent: 'observatory',
    colors: colorsForRegion('#0f6f68', '#0b4f4b', '#dff4ef'),
    atmosphere: 'A quiet academy station awaiting art direction.',
    guideMessage: 'Use the Field Guide first, then move into checked practice.',
    masteryQuote: 'Only saved academic evidence should move mastery.',
  };
}

export function getRegionThemeClass(theme: RegionTheme): string {
  return `region-theme-${theme.accent}`;
}

export function listRegionThemes(): RegionTheme[] {
  return P3_ASTRAL_ACADEMY.regions.map((region) => getRegionTheme(region));
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
