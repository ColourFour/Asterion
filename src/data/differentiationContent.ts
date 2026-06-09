export const DIFFERENTIATION_TOPIC_ORDER = [
  'derivatives_exponential_logarithmic',
  'derivatives_product_rule',
  'derivatives_quotient_rule',
  'p3_diff_stationary_tangent_normal',
  'derivatives_trig_functions',
  'derivatives_implicit',
  'derivatives_parametric',
] as const;

export type CalculusCliffsTopicId = typeof DIFFERENTIATION_TOPIC_ORDER[number];

export interface CalculusCliffsPracticeAlignment {
  topicId: CalculusCliffsTopicId;
  status: 'reviewed_runtime' | 'todo_teacher_review';
  reviewedPracticeIds: string[];
  candidatePrompt: string;
  expectedAnswer: string;
  authoringNote: string;
}

export const CALCULUS_CLIFFS_SKILL_PRACTICE_ALIGNMENT: CalculusCliffsPracticeAlignment[] = [
  {
    topicId: 'derivatives_exponential_logarithmic',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_calculus_exp_log_derivative_0001',
      'gen_calculus_exp_log_derivative_0002',
      'gen_calculus_exp_log_derivative_0003',
    ],
    candidatePrompt: 'Differentiate exponentials and logarithms such as e^(3x), ln(2x + 1), and a tangent from e^(2x) + ln x.',
    expectedAnswer: 'Example: d/dx ln(2x + 1) = 2/(2x + 1).',
    authoringNote: 'Runtime practice is typed and teacher-reviewed. Log graphs and log-law-only prompts remain in Logarithmic and Exponential Functions.',
  },
  {
    topicId: 'derivatives_product_rule',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_calculus_product_rule_0001',
      'gen_calculus_product_rule_0002',
      'gen_calculus_product_rule_0003',
    ],
    candidatePrompt: 'Use the product rule for polynomial, exponential, logarithmic, and composite factors.',
    expectedAnswer: 'Example: d/dx[x^2 e^x] = e^x(x^2 + 2x).',
    authoringNote: 'Runtime prompts emphasize setting u and v first, then factorising instead of expanding unnecessarily.',
  },
  {
    topicId: 'derivatives_quotient_rule',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_calculus_quotient_rule_0001',
      'gen_calculus_quotient_rule_0002',
      'gen_calculus_quotient_rule_0003',
    ],
    candidatePrompt: 'Use the quotient rule for rational, exponential, root-denominator, and stationary-point prompts.',
    expectedAnswer: 'Example: d/dx[(x^2 + 1)/(x - 1)] = ((x - 1)2x - (x^2 + 1))/(x - 1)^2.',
    authoringNote: 'Runtime prompts keep the v u\' minus u v\' order explicit.',
  },
  {
    topicId: 'p3_diff_stationary_tangent_normal',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_differentiation_stationary_tangent_normal_basic_0001',
      'gen_differentiation_stationary_tangent_normal_basic_0002',
      'gen_differentiation_stationary_tangent_normal_basic_0003',
    ],
    candidatePrompt: 'Use dy/dx to find stationary values, tangent lines, and normal lines from a point or condition.',
    expectedAnswer: 'Example: for y = x^2 + 1 at x = 3, the tangent is y - 10 = 6(x - 3).',
    authoringNote: 'Reviewed follow-through practice is surfaced only after the dedicated Field Guide bridge explains the derivative-to-line sequence.',
  },
  {
    topicId: 'derivatives_trig_functions',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_calculus_trig_derivative_0001',
      'gen_calculus_trig_derivative_0002',
      'gen_calculus_trig_derivative_0003',
    ],
    candidatePrompt: 'Differentiate sin, cos, tan, and simple composite or power trig expressions.',
    expectedAnswer: 'Example: d/dx[5sin(3x^2)] = 30x cos(3x^2).',
    authoringNote: 'Runtime keeps identity manipulation out of this topic; trig identities remain in Trigonometry.',
  },
  {
    topicId: 'derivatives_implicit',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_calculus_implicit_derivative_0001',
      'gen_calculus_implicit_derivative_0002',
      'gen_calculus_implicit_derivative_0003',
    ],
    candidatePrompt: 'Differentiate equations involving x and y, including xy terms and tangent or normal gradients.',
    expectedAnswer: 'Example: x^2 + y^2 = 25 gives dy/dx = -x/y.',
    authoringNote: 'Runtime prompts keep differential-equation solving out of the implicit-differentiation topic.',
  },
  {
    topicId: 'derivatives_parametric',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_calculus_parametric_derivative_0001',
      'gen_calculus_parametric_derivative_0002',
      'gen_calculus_parametric_derivative_0003',
    ],
    candidatePrompt: 'Find dy/dx from x(t), y(t), substitute a parameter, and handle tangent-parallel conditions.',
    expectedAnswer: 'Example: x = t^2 + 1, y = t^3 gives dy/dx = 3t/2.',
    authoringNote: 'Runtime wording keeps parametric differentiation separate from vector line equations.',
  },
];

export const CALCULUS_CLIFFS_QUARANTINED_FIELD_GUIDE_TOPIC_IDS = [
  'chain-rule',
  'product-chain',
  'implicit-log-exp',
  'stationary-tangent-normal',
  'parametric-derivative',
] as const;

export const CALCULUS_CLIFFS_QUARANTINED_RUNTIME_PRACTICE_IDS = [
  'gen_differentiation_chain_product_basic_0001',
  'gen_differentiation_chain_product_basic_0002',
  'gen_differentiation_chain_product_basic_0003',
  'gen_differentiation_implicit_log_exp_basic_0001',
  'gen_differentiation_implicit_log_exp_basic_0002',
  'gen_differentiation_implicit_log_exp_basic_0003',
  'gen_differentiation_chain_rule_basic_0001',
  'gen_differentiation_product_rule_basic_0001',
  'gen_parametric_derivative_ratio_basic_0001',
] as const;

export const CALCULUS_CLIFFS_QUARANTINE_RECOMMENDATION =
  'Keep old standalone chain-rule and broad implicit/parametric follow-through topics out of the Differentiation runtime topic flow until a later calculus audit assigns them to reviewed derivative applications.';

export const CALCULUS_CLIFFS_OUT_OF_SCOPE_TERMS = [
  'integration by parts',
  'substitution integral',
  'differential equation',
  'growth model',
  'trig identity',
  'addition formula',
  'double-angle',
  'vector parametric line',
  'argand',
  'complex number',
  'iteration',
  'newton',
] as const;
