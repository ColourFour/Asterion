export const NUMERICAL_SOLUTION_TOPIC_ORDER = [
  'iteration_change_of_sign',
  'iteration_graph_root_proof',
  'iteration_fixed_point_roots',
  'iteration_convergence',
] as const;

export type IterationForgeTopicId = typeof NUMERICAL_SOLUTION_TOPIC_ORDER[number];

export interface IterationForgePracticeAlignment {
  topicId: IterationForgeTopicId;
  status: 'reviewed_runtime' | 'todo_teacher_review';
  reviewedPracticeIds: string[];
  candidatePrompt: string;
  expectedAnswer: string;
  authoringNote: string;
}

export const ITERATION_FORGE_SKILL_PRACTICE_ALIGNMENT: IterationForgePracticeAlignment[] = [
  {
    topicId: 'iteration_change_of_sign',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_numerical_sign_change_basic_0001',
      'gen_numerical_sign_change_basic_0002',
      'gen_numerical_sign_change_basic_0003',
      'gen_iteration_change_of_sign_0004',
      'gen_iteration_change_of_sign_0005',
      'gen_iteration_change_of_sign_0006',
    ],
    candidatePrompt: 'Use f(a) and f(b), rewrite an equation into f(x) = 0, narrow an interval from a value table, and justify a rounded root.',
    expectedAnswer: 'Example: f(1) < 0 and f(2) > 0, so there is a root between 1 and 2.',
    authoringNote: 'Runtime items use original typed polynomial, square-root, and trigonometric-expression examples created for this app pass.',
  },
  {
    topicId: 'iteration_graph_root_proof',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_iteration_graph_root_proof_0001',
      'gen_iteration_graph_root_proof_0002',
      'gen_iteration_graph_root_proof_0003',
    ],
    candidatePrompt: 'Split an equation into two graphs, explain why an intersection is a solution, and justify one root from one intersection.',
    expectedAnswer: 'Example: x^3 + 2x - 1 = 0 is equivalent to x^2 + 2 = 1/x, so intersections of those two graphs give roots.',
    authoringNote: 'Runtime graph prompts ask for explanatory graph-intersection reasoning only, not full curve sketching or algebraic solution.',
  },
  {
    topicId: 'iteration_fixed_point_roots',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_numerical_iteration_formula_basic_0001',
      'gen_numerical_iteration_formula_basic_0002',
      'gen_iteration_fixed_point_roots_0003',
      'gen_iteration_fixed_point_roots_0004',
      'gen_iteration_fixed_point_roots_0005',
    ],
    candidatePrompt: 'Verify rearranged x = g(x) forms, iterate from x_0 or x_1, and state the approximate root to the requested accuracy.',
    expectedAnswer: 'Example: x = sqrt(3x + 5) rearranges to x^2 - 3x - 5 = 0, and repeated substitution gives a root approximation.',
    authoringNote: 'Runtime items keep fixed-point iteration separate from change-of-sign bracketing and from convergence comparison.',
  },
  {
    topicId: 'iteration_convergence',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_iteration_convergence_0001',
      'gen_iteration_convergence_0002',
      'gen_iteration_convergence_0003',
    ],
    candidatePrompt: 'Compare two iteration formulae for the same equation, recognize convergence from values, and identify domain failure such as log of a negative value.',
    expectedAnswer: 'Example: x_{n+1} = e^(-x_n) settles near a root, while x_{n+1} = -ln(x_n) can produce an invalid next step.',
    authoringNote: 'Runtime convergence prompts judge generated values and domain restrictions; formal derivative convergence tests are quarantined.',
  },
];

export const NUMERICAL_SOLUTION_QUARANTINED_RUNTIME_PRACTICE_IDS = [
  'gen_numerical_iteration_formula_basic_0003',
  'gen_numerical_accuracy_rounding_basic_0001',
  'gen_numerical_accuracy_rounding_basic_0002',
  'gen_numerical_accuracy_rounding_basic_0003',
] as const;

export const ITERATION_FORGE_OUT_OF_SCOPE_TERMS = [
  'newton',
  'newton-raphson',
  'differentiation',
  'derivative-only',
  'integration',
  'differential equation',
  'complex number',
  'argand',
  'vector',
] as const;
