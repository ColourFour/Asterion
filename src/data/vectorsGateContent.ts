export const VECTORS_GATE_TOPIC_ORDER = [
  'vectors_notation',
  'vectors_magnitude_unit_parallel',
  'vectors_geometric_add_subtract',
  'vectors_line_equation',
  'vectors_intersect_parallel_skew',
  'vectors_scalar_product',
  'vectors_angle_between_lines',
  'vectors_point_to_line_distance',
] as const;

export type VectorsGateTopicId = typeof VECTORS_GATE_TOPIC_ORDER[number];

export interface VectorsGatePracticeAlignment {
  topicId: VectorsGateTopicId;
  status: 'reviewed_runtime' | 'todo_teacher_review';
  reviewedPracticeIds: string[];
  candidatePrompt: string;
  expectedAnswer: string;
  authoringNote: string;
}

export const VECTORS_GATE_SKILL_PRACTICE_ALIGNMENT: VectorsGatePracticeAlignment[] = [
  {
    topicId: 'vectors_notation',
    status: 'reviewed_runtime',
    reviewedPracticeIds: ['gen_vectors_line_relationship_basic_0001'],
    candidatePrompt: 'Write the displacement from A(1, -2, 0) to B(4, 1, 2) as a column vector and in i, j, k form.',
    expectedAnswer: '$$ \\begin{pmatrix}3\\\\3\\\\2\\end{pmatrix}=3\\mathbf i+3\\mathbf j+2\\mathbf k $$',
    authoringNote: 'Runtime has a reviewed displacement-vector item; add a notation-only Quick Check when the authoring pipeline supports more vector micro-skills.',
  },
  {
    topicId: 'vectors_magnitude_unit_parallel',
    status: 'reviewed_runtime',
    reviewedPracticeIds: ['gen_vectors_line_relationship_basic_0003'],
    candidatePrompt: 'Find the magnitude of $\\begin{pmatrix}3\\\\4\\\\12\\end{pmatrix}$ and a unit vector in its direction.',
    expectedAnswer: '$$ 13,\\quad \\frac1{13}\\begin{pmatrix}3\\\\4\\\\12\\end{pmatrix} $$',
    authoringNote: 'Runtime covers scalar-multiple parallel directions; add a dedicated magnitude/unit-vector item before promoting broader coverage.',
  },
  {
    topicId: 'vectors_geometric_add_subtract',
    status: 'reviewed_runtime',
    reviewedPracticeIds: ['gen_vectors_line_relationship_basic_0004'],
    candidatePrompt: 'Points A(1, 2, -1), B(4, 0, 0), and C(6, 3, 3) have position vectors a, b, and c. Find AB, BC, and AB + BC. What single displacement does the sum equal?',
    expectedAnswer: '$$ \\overrightarrow{AB}=\\begin{pmatrix}3\\\\-2\\\\1\\end{pmatrix},\\quad \\overrightarrow{BC}=\\begin{pmatrix}2\\\\3\\\\3\\end{pmatrix},\\quad \\overrightarrow{AB}+\\overrightarrow{BC}=\\overrightarrow{AC}=\\begin{pmatrix}5\\\\1\\\\4\\end{pmatrix} $$',
    authoringNote: 'Runtime now has one reviewed geometric add/subtract item for head-to-tail position-vector reasoning. Midpoint, parallelogram, and collinearity variants remain future review work.',
  },
  {
    topicId: 'vectors_line_equation',
    status: 'reviewed_runtime',
    reviewedPracticeIds: ['gen_vectors_line_relationship_basic_0002', 'gen_vectors_line_intersection_basic_0003'],
    candidatePrompt: 'Write the vector equation of the line through A(1, 2, 0) and B(4, 1, 2).',
    expectedAnswer: '$$ \\mathbf r=\\begin{pmatrix}1\\\\2\\\\0\\end{pmatrix}+\\lambda\\begin{pmatrix}3\\\\-1\\\\2\\end{pmatrix} $$',
    authoringNote: 'Runtime has point-on-line and parameter-substitution items; a direct line-through-two-points item is prepared here for the next authoring pass.',
  },
  {
    topicId: 'vectors_intersect_parallel_skew',
    status: 'reviewed_runtime',
    reviewedPracticeIds: ['gen_vectors_line_intersection_basic_0001', 'gen_vectors_line_intersection_basic_0002'],
    candidatePrompt: 'Classify two vector lines after solving two component equations and finding that the third component fails.',
    expectedAnswer: 'The lines are skew because they are not parallel and the component check gives no common point.',
    authoringNote: 'Runtime has reviewed component-equation and intersection-point items; add an explicit false-intersection skew item before widening runtime coverage.',
  },
  {
    topicId: 'vectors_scalar_product',
    status: 'reviewed_runtime',
    reviewedPracticeIds: ['gen_vectors_line_scalar_product_basic_0001', 'gen_vectors_line_scalar_product_basic_0002'],
    candidatePrompt: 'Find $\\begin{pmatrix}1\\\\2\\\\-1\\end{pmatrix}\\cdot\\begin{pmatrix}3\\\\-1\\\\2\\end{pmatrix}$ and state whether the result is a scalar or vector.',
    expectedAnswer: '$$ -1 $$, a scalar.',
    authoringNote: 'Runtime has reviewed dot-product and perpendicularity items.',
  },
  {
    topicId: 'vectors_angle_between_lines',
    status: 'reviewed_runtime',
    reviewedPracticeIds: ['gen_vectors_line_scalar_product_basic_0003'],
    candidatePrompt: 'Find the angle between lines with direction vectors $\\begin{pmatrix}1\\\\2\\\\2\\end{pmatrix}$ and $\\begin{pmatrix}2\\\\1\\\\2\\end{pmatrix}$.',
    expectedAnswer: '$$ \\theta=\\cos^{-1}\\left(\\frac89\\right) $$',
    authoringNote: 'Runtime has a reviewed cosine-form angle item; keep direction-vector wording explicit in future variants.',
  },
  {
    topicId: 'vectors_point_to_line_distance',
    status: 'todo_teacher_review',
    reviewedPracticeIds: [],
    candidatePrompt: 'Point P is (3, 3, 1). Line l has $\\mathbf r=\\begin{pmatrix}1\\\\1\\\\0\\end{pmatrix}+\\lambda\\begin{pmatrix}2\\\\1\\\\2\\end{pmatrix}$. Let Q be a general point on l, use $\\overrightarrow{PQ}\\cdot\\begin{pmatrix}2\\\\1\\\\2\\end{pmatrix}=0$, then find PQ.',
    expectedAnswer: '$$ \\lambda=\\frac89,\\quad |\\overrightarrow{PQ}|=\\frac{\\sqrt{17}}3 $$',
    authoringNote: 'Left as stretch/TODO because the current reviewed runtime families do not cover multi-step point-to-line distance safely.',
  },
];

export const VECTORS_GATE_OUT_OF_SCOPE_TERMS = [
  'argand',
  'complex number',
  'trigonometric identity',
  'derivative',
  'differentiate',
  'integral',
  'integration',
  'differential equation',
  'iteration',
  'newton',
] as const;
