import type { RegionDefinition } from '../types';

export const P3_SKILL_MAP_SOURCE = 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json';

export const P3_TOPIC_ID_TO_REGION_ID = {
  '9709_p3_topic_algebra': 'algebra-forge',
  '9709_p3_topic_logarithmic_and_exponential_functions': 'logarithm-grove',
  '9709_p3_topic_trigonometry': 'trig-observatory',
  '9709_p3_topic_complex_numbers': 'complex-harbor',
  '9709_p3_topic_differentiation': 'calculus-cliffs',
  '9709_p3_topic_integration': 'integration-gardens',
  '9709_p3_topic_vectors': 'vector-workshop',
  '9709_p3_topic_numerical_solution_of_equations': 'numerical-mines',
  '9709_p3_topic_differential_equations': 'differential-shrine',
} as const;

export const P3_TOPIC_ID_TO_REGION_NAME = {
  '9709_p3_topic_algebra': 'Algebra Vault',
  '9709_p3_topic_logarithmic_and_exponential_functions': 'Logarithm Observatory',
  '9709_p3_topic_trigonometry': 'Trigonometry Spire',
  '9709_p3_topic_complex_numbers': 'Argand Atrium',
  '9709_p3_topic_differentiation': 'Calculus Cliffs',
  '9709_p3_topic_integration': 'Integral Terraces',
  '9709_p3_topic_vectors': 'Vectors Gate',
  '9709_p3_topic_numerical_solution_of_equations': 'Iteration Forge',
  '9709_p3_topic_differential_equations': 'Differential Shrine',
} as const;

export type P3TopicId = keyof typeof P3_TOPIC_ID_TO_REGION_ID;
export type P3RegionId = typeof P3_TOPIC_ID_TO_REGION_ID[P3TopicId];

export const P3_SKILL_IDS = [
  'p3_alg_structure_rearrangement',
  'p3_alg_polynomial_remainder_factor',
  'p3_alg_binomial_terms_coefficients',
  'p3_alg_binomial_validity',
  'p3_alg_partial_fraction_form',
  'p3_alg_modulus_cases',
  'p3_alg_discriminant_root_conditions',
  'p3_log_convert_forms',
  'p3_log_laws_equations',
  'p3_log_exponential_equations',
  'p3_log_domain_validation',
  'p3_log_linearisation',
  'p3_log_calculus_contexts',
  'p3_trig_identity_selection',
  'p3_trig_equation_interval',
  'p3_trig_quadrant_solutions',
  'p3_trig_r_form_compound_angles',
  'p3_trig_reciprocal_double_angle',
  'p3_diff_method_selection',
  'p3_diff_chain_product_quotient',
  'p3_diff_stationary_tangent_normal',
  'p3_diff_parametric_gradients',
  'p3_diff_implicit_log_exp',
  'p3_int_method_choice',
  'p3_int_parts_substitution',
  'p3_int_partial_fractions',
  'p3_int_definite_improper_area',
  'p3_num_sign_change_graph_evidence',
  'p3_num_iteration_formula',
  'p3_num_accuracy_rounding',
  'p3_vec_line_equations_intersections',
  'p3_vec_scalar_product_angles',
  'p3_vec_3d_geometry_modelling',
  'p3_de_separation_setup',
  'p3_de_initial_condition',
  'p3_de_forming_context_model',
  'p3_complex_cartesian_conjugate',
  'p3_complex_modulus_argument_form',
  'p3_complex_argand_loci_regions',
  'p3_complex_roots_powers',
] as const;

export type P3SkillId = typeof P3_SKILL_IDS[number];

export const P3_REGION_DEFINITIONS = [
  {
    id: 'algebra-forge',
    name: 'Algebra Vault',
    description: 'A brass archive where expressions, functions, and fractions unlock older rooms.',
    activeByDefault: true,
    syllabusTopics: ['Algebra'],
    subtopics: ['polynomial division / long division', 'partial fractions', 'polynomials', 'functions', 'binomial expansion', 'algebraic manipulation'],
    matchTerms: ['algebra', 'algebraic manipulation', 'polynomial', 'polynomials', 'polynomial division', 'long division', 'partial fractions', 'partial fraction', 'function', 'functions', 'modulus', 'binomial expansion', 'quadratics'],
  },
  {
    id: 'logarithm-grove',
    name: 'Logarithm Observatory',
    description: 'Lantern domes where exponential growth and logarithmic structure become visible.',
    activeByDefault: true,
    syllabusTopics: ['Logarithmic and exponential functions'],
    subtopics: ['logarithms', 'exponentials', 'solving logarithmic equations', 'solving exponential equations'],
    matchTerms: ['logarithm', 'logarithms', 'logarithmic', 'logarithmic functions', 'exponential', 'exponentials', 'exponential functions', 'logarithms and exponentials'],
  },
  {
    id: 'trig-observatory',
    name: 'Trigonometry Spire',
    description: 'A starlit tower for identities, equations, and angle formulae.',
    activeByDefault: true,
    syllabusTopics: ['Trigonometry'],
    subtopics: ['trigonometric identities', 'trigonometric equations', 'compound angle formulae', 'sec/cosec/cot', 'transformations involving trig where relevant'],
    matchTerms: ['trigonometry', 'trig', 'trig identities', 'trigonometric identities', 'trigonometric equations', 'compound angle', 'sec', 'cosec', 'cot'],
  },
  {
    id: 'complex-harbor',
    name: 'Argand Atrium',
    description: 'A moonlit hall for complex routes, polar form, arguments, and roots.',
    activeByDefault: false,
    syllabusTopics: ['Complex numbers'],
    subtopics: ['complex numbers', 'modulus and argument', 'Argand diagrams', 'polar form', 'roots of complex numbers'],
    matchTerms: ['complex', 'complex numbers', 'modulus and argument', 'argument', 'argand', 'argand diagrams', 'polar form', 'roots of complex numbers'],
  },
  {
    id: 'calculus-cliffs',
    name: 'Calculus Cliffs',
    description: 'High paths for gradients, rates of change, and stationary points.',
    activeByDefault: false,
    syllabusTopics: ['Differentiation'],
    subtopics: ['parametric equations', 'differentiation', 'product rule', 'quotient rule', 'chain rule', 'implicit differentiation', 'stationary points'],
    matchTerms: ['parametric', 'parametric equations', 'parametric equation', 'parametric differentiation', 'cartesian equation', 'differentiation', 'derivative', 'product rule', 'quotient rule', 'chain rule', 'implicit differentiation', 'stationary points'],
  },
  {
    id: 'integration-gardens',
    name: 'Integral Terraces',
    description: 'Layered gardens where areas, accumulation, and integration methods grow together.',
    activeByDefault: false,
    syllabusTopics: ['Integration'],
    subtopics: ['integration', 'integration by substitution', 'integration by parts', 'partial fractions integration', 'definite integrals'],
    matchTerms: ['integration', 'integral', 'substitution', 'integration by substitution', 'integration by parts', 'partial fractions integration'],
  },
  {
    id: 'vector-workshop',
    name: 'Vectors Gate',
    description: 'A drafting gate for lines, scalar products, intersections, and angles.',
    activeByDefault: false,
    syllabusTopics: ['Vectors'],
    subtopics: ['vectors', 'scalar product', 'vector lines', 'intersections', 'angles'],
    matchTerms: ['vector', 'vectors', 'scalar product', 'dot product', 'vector lines', 'intersections', 'angles'],
  },
  {
    id: 'numerical-mines',
    name: 'Iteration Forge',
    description: 'Lantern-lit machinery for iteration, roots, and numerical accuracy.',
    activeByDefault: false,
    syllabusTopics: ['Numerical solution of equations'],
    subtopics: ['numerical solution of equations', 'iteration', 'Newton-Raphson', 'sign-change methods'],
    matchTerms: ['numerical', 'numerical solution', 'iteration', 'newton raphson', 'newton-raphson', 'sign change', 'sign-change'],
  },
  {
    id: 'differential-shrine',
    name: 'Differential Shrine',
    description: 'A calm shrine for forming and solving first-order differential equations.',
    activeByDefault: false,
    syllabusTopics: ['Differential equations'],
    subtopics: ['differential equations', 'forming differential equations', 'solving first-order differential equations', 'separation of variables'],
    matchTerms: ['differential equation', 'differential equations', 'first order differential', 'first-order differential', 'forming differential equations', 'separation of variables'],
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
