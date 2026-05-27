export const DIFFERENTIAL_SHRINE_TOPIC_ORDER = [
  'differential_first_order_model',
  'differential_separable_variables',
  'differential_particular_solutions',
  'differential_modeling',
] as const;

export type DifferentialShrineTopicId = typeof DIFFERENTIAL_SHRINE_TOPIC_ORDER[number];

export interface DifferentialShrinePracticeAlignment {
  topicId: DifferentialShrineTopicId;
  status: 'reviewed_runtime' | 'todo_teacher_review';
  reviewedPracticeIds: string[];
  candidatePrompt: string;
  expectedAnswer: string;
  authoringNote: string;
}

export const DIFFERENTIAL_SHRINE_SKILL_PRACTICE_ALIGNMENT: DifferentialShrinePracticeAlignment[] = [
  {
    topicId: 'differential_first_order_model',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_differential_equations_context_model_basic_0001',
      'gen_differential_equations_context_model_basic_0002',
      'gen_differential_equations_context_model_basic_0003',
      'gen_differential_equations_context_model_basic_0004',
      'gen_differential_equations_context_model_basic_0005',
    ],
    candidatePrompt: 'Translate proportional-rate, inflow/outflow, cooling, and formation statements into first-order differential equations without solving them.',
    expectedAnswer: 'Examples include dP/dt = kP, dh/dt = 4 - k sqrt(h), dT/dt = -k(T - 18), and dx/dt = k(40 - x).',
    authoringNote: 'Runtime items are original typed setup prompts. They distinguish forming the differential equation from solving it.',
  },
  {
    topicId: 'differential_separable_variables',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_differential_equations_separation_basic_0001',
      'gen_differential_equations_separation_basic_0004',
      'gen_differential_equations_separation_basic_0005',
      'gen_differential_equations_separation_basic_0006',
      'gen_differential_equations_separation_basic_0007',
      'gen_differential_equations_separation_basic_0008',
    ],
    candidatePrompt: 'Separate variables, integrate both sides, and give a general solution for exponential, trig, log/partial-fraction, and by-parts-after-separation forms.',
    expectedAnswer: 'Example: dy/dx = 2xy gives ln|y| = x^2 + c, so y = Ae^(x^2).',
    authoringNote: 'Runtime keeps the assessed skill as separation; integration methods appear only after variables have been separated.',
  },
  {
    topicId: 'differential_particular_solutions',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_differential_equations_initial_condition_basic_0001',
      'gen_differential_equations_initial_condition_basic_0002',
      'gen_differential_equations_initial_condition_basic_0003',
      'gen_differential_equations_initial_condition_basic_0004',
      'gen_differential_equations_initial_condition_basic_0005',
      'gen_differential_equations_separation_basic_0002',
      'gen_differential_equations_separation_basic_0003',
    ],
    candidatePrompt: 'Find the constant from an initial condition or point after first solving the separable differential equation generally.',
    expectedAnswer: 'Example: dy/dx = 2y through (0, 3) gives y = 3e^(2x).',
    authoringNote: 'Runtime includes particular solutions from exponential, implicit, and partial-fraction/log-style separable forms.',
  },
  {
    topicId: 'differential_modeling',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_differential_equations_context_model_basic_0006',
      'gen_differential_equations_context_model_basic_0007',
      'gen_differential_equations_context_model_basic_0008',
      'gen_differential_equations_context_model_basic_0009',
    ],
    candidatePrompt: 'Form and solve a first-order model from a context, use initial data, then interpret a value or constant in context.',
    expectedAnswer: 'Example: dT/dt = -k(T - 20), T(0) = 80 gives T = 20 + 60e^(-kt).',
    authoringNote: 'Runtime uses original context prompts for tank, temperature, reaction/population, and interpretation. No logistic, numerical, or second-order models are promoted.',
  },
];

export const DIFFERENTIAL_SHRINE_QUARANTINED_RUNTIME_PRACTICE_IDS = [] as const;

export const DIFFERENTIAL_SHRINE_OUT_OF_SCOPE_TERMS = [
  'second-order',
  'second order',
  'slope field',
  'needle diagram',
  'newton',
  'iteration',
  'argand',
  'complex number',
  'vector line',
  'standalone differentiation',
  'standalone integration',
] as const;
