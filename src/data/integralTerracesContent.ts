export const INTEGRAL_TERRACES_TOPIC_ORDER = [
  'integrals_exponential_logarithmic',
  'integrals_basic_trig',
  'integrals_trig_identities',
  'integrals_partial_fractions',
  'integrals_arctan_forms',
  'integrals_substitution',
  'integrals_by_parts',
] as const;

export type IntegralTerracesTopicId = typeof INTEGRAL_TERRACES_TOPIC_ORDER[number];

export interface IntegralTerracesPracticeAlignment {
  topicId: IntegralTerracesTopicId;
  status: 'reviewed_runtime' | 'todo_teacher_review';
  reviewedPracticeIds: string[];
  candidatePrompt: string;
  expectedAnswer: string;
  authoringNote: string;
}

export const INTEGRAL_TERRACES_SKILL_PRACTICE_ALIGNMENT: IntegralTerracesPracticeAlignment[] = [
  {
    topicId: 'integrals_exponential_logarithmic',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_integrals_exponential_logarithmic_0001',
      'gen_integrals_exponential_logarithmic_0002',
      'gen_integrals_exponential_logarithmic_0003',
      'gen_integrals_exponential_logarithmic_0004',
    ],
    candidatePrompt: 'Integrate e^(2x + 3), evaluate a definite exponential integral, and integrate f\'(x)/f(x) into a logarithm.',
    expectedAnswer: 'Example: integral of e^(2x + 3) dx is (1/2)e^(2x + 3) + c.',
    authoringNote: 'Runtime uses original typed examples for exponential, improper, area, and logarithmic integral forms; no reference screenshots are used.',
  },
  {
    topicId: 'integrals_basic_trig',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_integrals_basic_trig_0001',
      'gen_integrals_basic_trig_0002',
      'gen_integrals_basic_trig_0003',
      'gen_integrals_basic_trig_0004',
    ],
    candidatePrompt: 'Integrate sin(3x + pi/4), cos(2x), sec^2(4x), and one clean definite trig integral.',
    expectedAnswer: 'Example: integral of sin(3x + pi/4) dx is -(1/3)cos(3x + pi/4) + c.',
    authoringNote: 'Runtime keeps these as integration prompts. Trig differentiation remains in Calculus Cliffs and trig equation solving remains in Trigonometry Spire.',
  },
  {
    topicId: 'integrals_trig_identities',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_integrals_trig_identities_0001',
      'gen_integrals_trig_identities_0002',
      'gen_integrals_trig_identities_0003',
      'gen_integrals_trig_identities_0004',
    ],
    candidatePrompt: 'Use double-angle and tan^2 = sec^2 - 1 rewrites before integrating, including a hence-style item.',
    expectedAnswer: 'Example: integral of cos^2 x dx is x/2 + sin(2x)/4 + c.',
    authoringNote: 'Identity manipulation is present only as support for integration; pure identity work remains in Trigonometry Spire.',
  },
  {
    topicId: 'integrals_partial_fractions',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_integrals_partial_fractions_0001',
      'gen_integrals_partial_fractions_0002',
      'gen_integrals_partial_fractions_0003',
      'gen_integrals_partial_fractions_0004',
    ],
    candidatePrompt: 'Integrate after decomposition for distinct linear, repeated linear, improper, and definite partial-fraction cases.',
    expectedAnswer: 'Example: integral of 3x/((x - 1)(x + 2)) dx becomes ln|x - 1| + 2ln|x + 2| + c after decomposition.',
    authoringNote: 'Runtime integration items now live in Integral Terraces. Algebra Vault keeps decomposition-only prompts as algebra.',
  },
  {
    topicId: 'integrals_arctan_forms',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_integrals_arctan_forms_0001',
      'gen_integrals_arctan_forms_0002',
      'gen_integrals_arctan_forms_0003',
      'gen_integrals_arctan_forms_0004',
    ],
    candidatePrompt: 'Recognize 1/(1 + x^2), scaled a^2 + x^2 denominators, completing the square, and a definite tan^{-1} integral.',
    expectedAnswer: 'Example: integral of 1/(x^2 + 25) dx is (1/5)tan^{-1}(x/5) + c.',
    authoringNote: 'Runtime uses arctan-form integration only; inverse-trig derivative derivations remain supporting context in Calculus Cliffs.',
  },
  {
    topicId: 'integrals_substitution',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_integrals_substitution_0001',
      'gen_integrals_substitution_0002',
      'gen_integrals_substitution_0003',
      'gen_integrals_substitution_0004',
      'gen_integrals_substitution_0005',
    ],
    candidatePrompt: 'Use reverse chain rule, formal u-substitution, changed limits, and exponential/log/trig substitutions.',
    expectedAnswer: 'Example: integral of 2x/(x^2 + 2) dx is ln(x^2 + 2) + c.',
    authoringNote: 'Runtime includes one definite changed-limits item. Integration by parts remains a separate Integral Terraces topic.',
  },
  {
    topicId: 'integrals_by_parts',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_integrals_by_parts_0001',
      'gen_integrals_by_parts_0002',
      'gen_integrals_by_parts_0003',
    ],
    candidatePrompt: 'Use integration by parts for x e^x, x sin x, and x ln x.',
    expectedAnswer: 'Example: integral of x e^x dx is x e^x - e^x + c.',
    authoringNote: 'Implemented from existing reviewed repo by-parts content plus original typed seed items. The uploaded PDF source ends after the by-parts heading, so this remains marked in the report as source-gap-backed-by-repo-review.',
  },
];

export const INTEGRAL_TERRACES_QUARANTINED_RUNTIME_PRACTICE_IDS = [
  'gen_integration_method_setup_basic_0001',
  'gen_integration_method_setup_basic_0002',
  'gen_integration_method_setup_basic_0003',
  'gen_integration_parts_substitution_basic_0001',
  'gen_integration_parts_substitution_basic_0002',
  'gen_integration_parts_substitution_basic_0003',
  'gen_integration_definite_area_basic_0001',
  'gen_integration_definite_area_basic_0002',
  'gen_integration_definite_area_basic_0003',
] as const;

export const INTEGRAL_TERRACES_MOVED_TO_ALGEBRA_PRACTICE_IDS = [
  'gen_partial_fractions_distinct_linear_0001',
  'gen_partial_fractions_distinct_linear_0002',
  'gen_partial_fractions_distinct_linear_0003',
  'gen_partial_fractions_distinct_linear_0004',
  'gen_partial_fractions_repeated_linear_0001',
  'gen_partial_fractions_repeated_linear_0002',
  'gen_partial_fractions_repeated_linear_0003',
] as const;

export const INTEGRAL_TERRACES_OUT_OF_SCOPE_TERMS = [
  'differentiate',
  'differentiation',
  'derivative-only',
  'differential equation',
  'growth model',
  'log law',
  'log laws',
  'trig equation',
  'de moivre',
  'vector',
  'argand',
  'complex number',
  'iteration',
  'newton',
] as const;
