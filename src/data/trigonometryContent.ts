export const TRIGONOMETRY_TOPIC_ORDER = [
  'trig_reciprocal_functions',
  'trig_pythagorean_identities',
  'trig_addition_formulae',
  'trig_double_angle_formulae',
  'trig_r_form_transformations',
] as const;

export type TrigonometrySpireTopicId = typeof TRIGONOMETRY_TOPIC_ORDER[number];

export interface TrigonometrySpirePracticeAlignment {
  topicId: TrigonometrySpireTopicId;
  status: 'reviewed_runtime' | 'todo_teacher_review';
  reviewedPracticeIds: string[];
  candidatePrompt: string;
  expectedAnswer: string;
  authoringNote: string;
}

export const TRIGONOMETRY_SPIRE_SKILL_PRACTICE_ALIGNMENT: TrigonometrySpirePracticeAlignment[] = [
  {
    topicId: 'trig_reciprocal_functions',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_trig_identity_rewrite_basic_0001',
      'gen_trig_solve_equation_interval_basic_0001',
    ],
    candidatePrompt: 'Rewrite $\\sec x$, $\\operatorname{cosec}x$, and $\\cot x$, then solve a simple reciprocal equation on an interval.',
    expectedAnswer: 'Example: $\\sec x=2$ gives $\\cos x=\\frac12$, so $x=\\frac{\\pi}{3},\\frac{5\\pi}{3}$ for $0\\le x<2\\pi$.',
    authoringNote: 'Runtime uses original typed reciprocal definitions and interval-solving prompts. Add graph artwork later only as original Asterion assets.',
  },
  {
    topicId: 'trig_pythagorean_identities',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_trig_identity_rewrite_basic_0002',
    ],
    candidatePrompt: 'Use $1+\\tan^2\\theta=\\sec^2\\theta$ and $1+\\cot^2\\theta=\\operatorname{cosec}^2\\theta$ in an identity proof or equation.',
    expectedAnswer: 'Example: $\\sec^2\\theta-\\tan^2\\theta=1$ follows directly from $1+\\tan^2\\theta=\\sec^2\\theta$.',
    authoringNote: 'Runtime preserves the old identity-rewrite move as the expanded Pythagorean identity contract.',
  },
  {
    topicId: 'trig_addition_formulae',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_trig_addition_formulae_basic_0001',
      'gen_trig_addition_formulae_basic_0002',
      'gen_trig_addition_formulae_basic_0003',
    ],
    candidatePrompt: 'Use $\\sin(A\\pm B)$, $\\cos(A\\pm B)$, or $\\tan(A\\pm B)$ for exact values and shifted-angle equations.',
    expectedAnswer: 'Example: $\\sin75^\\circ=\\frac{\\sqrt6+\\sqrt2}{4}$ and shifted equations need the interval shifted back after solving.',
    authoringNote: 'Runtime now includes original typed addition-formula prompts without copying reference material.',
  },
  {
    topicId: 'trig_double_angle_formulae',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_trig_identity_rewrite_basic_0003',
      'gen_trig_double_angle_basic_0001',
      'gen_trig_double_angle_basic_0002',
      'gen_trig_double_angle_basic_0003',
      'gen_trig_solve_equation_interval_basic_0003',
    ],
    candidatePrompt: 'Choose a double-angle formula, simplify safely, and use interval checks when solving.',
    expectedAnswer: 'Example: $1-\\cos2x=2\\sin^2x$ and product-form equations should be solved without dividing away a factor.',
    authoringNote: 'Runtime keeps the useful old double-angle and lost-solution interval content under this contract.',
  },
  {
    topicId: 'trig_r_form_transformations',
    status: 'reviewed_runtime',
    reviewedPracticeIds: [
      'gen_trig_r_form_basic_0001',
      'gen_trig_r_form_basic_0002',
      'gen_trig_r_form_basic_0003',
    ],
    candidatePrompt: 'Rewrite $a\\sin x+b\\cos x$ as one shifted sine or cosine expression, then use the amplitude.',
    expectedAnswer: 'Example: $3\\sin x+4\\cos x=5\\sin(x+\\alpha)$ with $\\tan\\alpha=\\frac43$.',
    authoringNote: 'Runtime preserves old R-form items and keeps the wording separate from complex-number polar form.',
  },
];

export const TRIGONOMETRY_SPIRE_QUARANTINED_FIELD_GUIDE_TOPIC_IDS = [
  'identity-rewrite',
  'double-angle',
  'solve-interval',
  'r-form',
] as const;

export const TRIGONOMETRY_SPIRE_OUT_OF_SCOPE_TERMS = [
  'calculus',
  'differentiate',
  'differentiation',
  'derivative',
  'integral',
  'integration',
  'vector',
  'vectors',
  'complex number',
  'complex-number',
  'argand',
  'polar form',
] as const;
