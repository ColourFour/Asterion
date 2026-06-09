export const LOG_E_TOPIC_ORDER = [
  'log_graph_inverse',
  'log_laws',
  'log_e_natural_logs',
  'log_equations_inequalities',
  'exponential_equations_inequalities',
  'log_linearisation',
] as const;

export type LogETopicId = typeof LOG_E_TOPIC_ORDER[number];

export interface LogEPracticeAlignment {
  topicId: LogETopicId;
  status: 'reviewed_runtime' | 'todo_teacher_review';
  reviewedPracticeIds: string[];
  candidatePrompt: string;
  expectedAnswer: string;
  authoringNote: string;
}

export const LOG_E_SKILL_PRACTICE_ALIGNMENT: LogEPracticeAlignment[] = [
  {
    topicId: 'log_graph_inverse',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_log_graph_inverse_basic_0001',
      'gen_log_graph_inverse_basic_0002',
      'gen_log_graph_inverse_basic_0003',
    ],
    candidatePrompt: 'Convert between $y=2^x$, $y=\\log_2x$, and reflected inverse-graph points.',
    expectedAnswer: 'Example: $(3,8)$ on $y=2^x$ becomes $(8,3)$ on $y=\\log_2x$.',
    authoringNote: 'Runtime uses original typed conversion and coordinate prompts. Add original graph artwork later if needed.',
  },
  {
    topicId: 'log_laws',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_log_laws_basic_0001',
      'gen_log_laws_basic_0002',
      'gen_log_laws_basic_0003',
    ],
    candidatePrompt: 'Combine, expand, and reject invalid log-law moves using same-base logarithms.',
    expectedAnswer: '$\\log a+\\log b=\\log(ab)$, $\\log(a/b)=\\log a-\\log b$, and $\\log(a^n)=n\\log a$.',
    authoringNote: 'Runtime includes product, quotient, power, and invalid-sum checks without calculus framing.',
  },
  {
    topicId: 'log_e_natural_logs',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_log_equation_basic_0001',
      'gen_log_equation_basic_0002',
      'gen_log_equation_basic_0003',
    ],
    candidatePrompt: 'Use $e^x$ and $\\ln x$ as inverse functions after isolating the exponential term.',
    expectedAnswer: 'Example: $e^{2x}=7$ gives $x=\\frac12\\ln7$.',
    authoringNote: 'Runtime keeps this as the natural-log inverse step before broader exponential inequalities.',
  },
  {
    topicId: 'log_equations_inequalities',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_log_domain_validation_basic_0001',
      'gen_log_domain_validation_basic_0002',
      'gen_log_domain_validation_basic_0003',
    ],
    candidatePrompt: 'Solve logarithmic equations and reject algebraic roots that fail an original log domain.',
    expectedAnswer: 'Example: a quadratic candidate can be rejected when it makes a log input non-positive.',
    authoringNote: 'Runtime preserves the existing domain-validation items and makes invalid-root rejection explicit.',
  },
  {
    topicId: 'exponential_equations_inequalities',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_log_exponential_inequality_basic_0001',
      'gen_log_exponential_inequality_basic_0002',
      'gen_log_exponential_inequality_basic_0003',
    ],
    candidatePrompt: 'Solve exponential equations or inequalities, including the reversal for $0<a<1$.',
    expectedAnswer: 'Example: $(\\frac12)^x\\le(\\frac12)^3$ gives $x\\ge3$ because the base is between 0 and 1.',
    authoringNote: 'Runtime includes the decreasing-base inequality reversal as a dedicated reviewed item.',
  },
  {
    topicId: 'log_linearisation',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_log_linearisation_basic_0001',
      'gen_log_linearisation_basic_0002',
      'gen_log_linearisation_basic_0003',
    ],
    candidatePrompt: 'Transform power or exponential relationships into straight-line form and interpret axes.',
    expectedAnswer: 'Example: $y=2x^3$ gives $\\ln y=\\ln2+3\\ln x$, so gradient $3$ and intercept $\\ln2$.',
    authoringNote: 'Runtime preserves existing linearisation items and matches them through the topic contract ID.',
  },
];

export const LOGARITHM_OBSERVATORY_QUARANTINED_FIELD_GUIDE_TOPIC_IDS = [
  'exponential-calculus-context',
] as const;

export const LOG_E_QUARANTINED_RUNTIME_PRACTICE_IDS = [
  'gen_log_calculus_context_basic_0001',
  'gen_log_calculus_context_basic_0002',
  'gen_log_calculus_context_basic_0003',
] as const;

export const LOGARITHM_OBSERVATORY_QUARANTINED_RUNTIME_SNIPPET_IDS = [
  'p3-log-calculus-context-001',
] as const;

export const LOGARITHM_OBSERVATORY_QUARANTINED_GENERATOR_FAMILIES = [
  'logarithms_and_exponentials.calculus_context_basic',
] as const;

export const LOGARITHM_OBSERVATORY_QUARANTINED_SKILL_TARGET_IDS = [
  'p3_log_calculus_contexts',
] as const;

export const LOGARITHM_OBSERVATORY_OUT_OF_SCOPE_TERMS = [
  'calculus',
  'differentiate',
  'differentiation',
  'derivative',
  'integrate',
  'integration',
  'stationary',
  'dy/dx',
] as const;

export const LOGARITHM_OBSERVATORY_QUARANTINE_RECOMMENDATION =
  'Keep the old log-calculus material as non-runtime future-review content until a Differentiation contract explicitly accepts mixed log/exponential calculus practice.';
