export const ALGEBRA_VAULT_TOPIC_ORDER = [
  'algebra_structure_first_bridge',
  'algebra_modulus_graph_equations',
  'algebra_polynomial_division',
  'algebra_remainder_factor_theorem',
  'algebra_discriminant_root_conditions',
  'algebra_partial_fractions',
  'algebra_binomial_expansion',
] as const;

export type AlgebraVaultTopicId = typeof ALGEBRA_VAULT_TOPIC_ORDER[number];

export interface AlgebraVaultPracticeAlignment {
  topicId: AlgebraVaultTopicId;
  status: 'reviewed_runtime' | 'reviewed_static_skill_check' | 'todo_teacher_review';
  reviewedPracticeIds: string[];
  candidatePrompt: string;
  expectedAnswer: string;
  authoringNote: string;
}

export const ALGEBRA_VAULT_SKILL_PRACTICE_ALIGNMENT: AlgebraVaultPracticeAlignment[] = [
  {
    topicId: 'algebra_structure_first_bridge',
    status: 'reviewed_static_skill_check',
    reviewedPracticeIds: [
      'sc-alg-structure-first-bridge-foundation-001',
      'sc-alg-structure-first-bridge-core-001',
      'sc-alg-structure-first-bridge-challenge-001',
      'gen_algebra_structure_first_bridge_0001',
      'gen_algebra_structure_first_bridge_0002',
      'gen_algebra_structure_first_bridge_0003',
    ],
    candidatePrompt: 'Choose the structure-preserving first move for a repeated block or cancellable factor.',
    expectedAnswer: 'Use substitution, factorisation, cancellation with restrictions, or the zero-product rule before expanding.',
    authoringNote: 'Static Skill Check and guided practice are original deterministic support items for the reviewed P3 structure-rearrangement skill. Legacy generated structure-rearrangement candidates remain quarantined.',
  },
  {
    topicId: 'algebra_modulus_graph_equations',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_modulus_equation_basic_0001',
      'gen_modulus_equation_basic_0002',
      'gen_modulus_equation_basic_0003',
      'gen_modulus_equation_basic_0004',
    ],
    candidatePrompt: 'Solve $|x+2|=|3x|$, then interpret where $y=|x+2|$ is below $y=|3x|$.',
    expectedAnswer: '$$ x=-\\frac12,1,\\quad x<-\\frac12\\text{ or }x>1 $$',
    authoringNote: 'Runtime uses original typed algebra and graph-description prompts. Add custom graph artwork later only through licensed/original assets.',
  },
  {
    topicId: 'algebra_polynomial_division',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_polynomial_remainder_factor_basic_0001',
      'gen_polynomial_remainder_factor_basic_0002',
      'gen_polynomial_remainder_factor_basic_0003',
      'gen_polynomial_remainder_factor_basic_0004',
    ],
    candidatePrompt: 'Divide $2x^3-x^2+5x+7$ by $2x+1$, giving the quotient and remainder.',
    expectedAnswer: '$$ x^2-x+3\\text{ remainder }4 $$',
    authoringNote: 'Runtime covers no-remainder, remainder, missing-zero-term, and non-monic linear divisor cases.',
  },
  {
    topicId: 'algebra_remainder_factor_theorem',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_polynomial_remainder_factor_basic_0005',
      'gen_polynomial_remainder_factor_basic_0006',
      'gen_polynomial_remainder_factor_basic_0007',
      'gen_polynomial_remainder_factor_basic_0008',
      'gen_polynomial_remainder_factor_basic_0009',
      'gen_polynomial_remainder_factor_basic_0010',
    ],
    candidatePrompt: 'For $f(x)=x^3+ax^2+bx+6$, use one factor condition and one remainder condition to find $a$ and $b$.',
    expectedAnswer: '$$ a=0,\\quad b=-7 $$',
    authoringNote: 'Runtime keeps theorem work separate from long division by matching on this topic contract ID.',
  },
  {
    topicId: 'algebra_discriminant_root_conditions',
    status: 'reviewed_static_skill_check',
    reviewedPracticeIds: [
      'sc-alg-discriminant-root-conditions-foundation-001',
      'sc-alg-discriminant-root-conditions-core-001',
      'sc-alg-discriminant-root-conditions-challenge-001',
      'gen_algebra_discriminant_root_condition_bridge_0001',
      'gen_algebra_discriminant_root_condition_bridge_0002',
      'gen_algebra_discriminant_root_condition_bridge_0003',
    ],
    candidatePrompt: 'Use the discriminant to decide a root condition before solving the quadratic.',
    expectedAnswer: '$$D=b^2-4ac;\\quad D>0\\text{ distinct real roots},\\ D=0\\text{ repeated root},\\ D<0\\text{ no real roots}.$$',
    authoringNote: 'Static Skill Check and guided practice cover the official P3 root-condition use case without promoting old quadratics discriminator candidates.',
  },
  {
    topicId: 'algebra_partial_fractions',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_partial_fractions_distinct_linear_0001',
      'gen_partial_fractions_distinct_linear_0002',
      'gen_partial_fractions_distinct_linear_0003',
      'gen_partial_fractions_distinct_linear_0004',
      'gen_partial_fractions_repeated_linear_0001',
      'gen_partial_fractions_repeated_linear_0002',
      'gen_partial_fractions_repeated_linear_0003',
    ],
    candidatePrompt: 'Choose the correct decomposition form for distinct linear, repeated linear, and irreducible quadratic factors.',
    expectedAnswer: '$$ \\frac{A}{x-a}+\\frac{B}{x-b},\\quad \\frac{A}{x-a}+\\frac{B}{(x-a)^2},\\quad \\frac{A}{x-a}+\\frac{Bx+C}{x^2+q} $$',
    authoringNote: 'Runtime includes the three P3 partial-fraction denominator cases without calculus or integration framing.',
  },
  {
    topicId: 'algebra_binomial_expansion',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_binomial_first_terms_and_coefficient_0001',
      'gen_binomial_first_terms_and_coefficient_0002',
      'gen_binomial_first_terms_and_coefficient_0003',
      'gen_binomial_validity_range_0001',
      'gen_binomial_validity_range_0002',
      'gen_binomial_validity_range_0003',
    ],
    candidatePrompt: 'Use partial fractions and then binomial expansion in a single "hence expand" question.',
    expectedAnswer: 'Teacher review needed before runtime promotion because this is a multi-step bridge.',
    authoringNote: 'Runtime covers expansion, validity, rewrite-then-expand, coefficient extraction, and estimation. The partial-fractions bridge remains a prepared review need.',
  },
];

export const ALGEBRA_VAULT_QUARANTINED_RUNTIME_PRACTICE_IDS = [
  'gen_algebra_structure_rearrangement_basic_0001',
  'gen_algebra_structure_rearrangement_basic_0002',
  'gen_algebra_structure_rearrangement_basic_0003',
  'gen_quadratics_discriminant_root_condition_basic_0001',
  'gen_quadratics_discriminant_root_condition_basic_0002',
  'gen_quadratics_discriminant_root_condition_basic_0003',
] as const;

export const ALGEBRA_VAULT_OUT_OF_SCOPE_TERMS = [
  'argand',
  'complex',
  'vector',
  'integral',
  'integration',
  'differentiate',
  'derivative',
  'logarithm',
  'exponential',
  'trigonometric',
  'iteration',
  'newton',
] as const;
