import type { CourseId } from './courses';
import type {
  CourseSkillContractEntry,
  CourseStudyContract,
  CourseStudyRouteAvailability,
  CourseStudyTopicDefinition,
} from './courseStudyContract';

export const P1_COURSE_ID = 'p1' as const;

export const P1_SYLLABUS_AUTHORITY = {
  syllabusCode: '9709',
  examYears: '2026-2027',
  version: '4',
  title: 'Cambridge International AS & A Level Mathematics 9709 syllabus for 2026 and 2027',
  url: 'https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf',
  updateUrl: 'https://www.cambridgeinternational.org/Images/723728-2026-2027-syllabus-update.pdf',
  reviewedAt: '2026-07-13',
  futureCompatibilityNote: 'Follow-up: complete a dedicated 2028–2030 syllabus compatibility audit before using this contract for examinations after 2027.',
} as const;

export const P1_CURRICULUM_CONSTRAINTS = {
  assessmentContext: {
    paperLabel: 'Paper 1: Pure Mathematics 1',
    durationMinutes: 110,
    marks: 75,
    structuredQuestionRange: [10, 12] as [number, number],
    allQuestionsCompulsory: true,
    scientificCalculatorExpected: true,
    formulaBooklet: 'MF19 list of formulae and statistical tables is supplied.',
    workingRequirement: 'Show necessary working; unsupported calculator answers do not earn marks. Unless otherwise stated, give non-exact values to 3 significant figures and angles in degrees to 1 decimal place.',
  },
  notationRules: [
    'Use function, domain, range, one-one, inverse and composition notation consistently; gf is valid only when the range of f lies within the domain of g.',
    'Use sin^-1 x, cos^-1 x and tan^-1 x for principal inverse-trigonometric values, not reciprocals.',
    'State trigonometric solutions in the requested interval; general solution forms are outside P1.',
    'Use radians in s=rθ and A=1/2 r^2θ, converting degree measures before substitution.',
    'Distinguish d^2y/dx^2 from (dy/dx)^2 and include +C for indefinite integrals.',
    'Use exact values where requested and delay numerical rounding until the final answer.',
  ],
  formulaScope: [
    'Quadratic formula, discriminant and completed-square forms for equations, roots and vertices.',
    'Straight-line, distance, midpoint and circle centre-radius forms; elementary circle geometry only.',
    'Arc length s=rθ and sector area A=1/2 r^2θ with θ in radians.',
    'tan θ=sin θ/cos θ and sin^2 θ+cos^2 θ=1, plus exact values at 30°, 45° and 60° and related angles.',
    'Positive-integer binomial expansion and arithmetic/geometric nth-term, finite-sum and convergent sum-to-infinity formulae.',
    'Power/chain differentiation within P1 and reverse-power integration of (ax+b)^n for rational n except -1.',
    'Definite integration for areas and volumes about either coordinate axis, including only the simple improper cases specified by the syllabus.',
  ],
  explicitExclusions: [
    'Implicit differentiation in coordinate-geometry circle problems is not included.',
    'Specialised inverse-trigonometric theory beyond principal values and inverse-function meaning is not required.',
    'General forms of trigonometric solutions are not included.',
    'Greatest-term questions and properties of binomial coefficients are not required.',
    'Knowledge of points of inflexion is not included.',
    'Integration of the n=-1 power and broader P2/P3 integration methods are not part of P1.',
  ],
};

const TOPIC_ROUTES: CourseStudyRouteAvailability = {
  learn: true,
  checkedPractice: true,
  examTraining: true,
  worksheet: true,
};

const SKILL_ROUTES: CourseStudyRouteAvailability = {
  learn: true,
  checkedPractice: true,
  examTraining: false,
  worksheet: true,
};

export const P1_STUDY_TOPICS: CourseStudyTopicDefinition[] = [
  {
    id: 'p1-quadratics',
    courseId: P1_COURSE_ID,
    slug: 'quadratics',
    syllabusRef: '1.1',
    order: 1,
    title: 'Quadratics',
    shortTitle: 'Quadratics',
    description: 'Move between completed-square, factorised and equation forms, then use those forms to solve root, inequality and intersection problems.',
    headerFormula: 'ax^2+bx+c,\\quad b^2-4ac',
    routeAvailability: { ...TOPIC_ROUTES },
  },
  {
    id: 'p1-functions',
    courseId: P1_COURSE_ID,
    slug: 'functions',
    syllabusRef: '1.2',
    order: 2,
    title: 'Functions',
    shortTitle: 'Functions',
    description: 'Control domain and range before composing, inverting or transforming a function.',
    headerFormula: 'f(x),\\quad gf(x),\\quad f^{-1}(x)',
    routeAvailability: { ...TOPIC_ROUTES },
  },
  {
    id: 'p1-coordinate-geometry',
    courseId: P1_COURSE_ID,
    slug: 'coordinate-geometry',
    syllabusRef: '1.3',
    order: 3,
    title: 'Coordinate geometry',
    shortTitle: 'Coordinate geometry',
    description: 'Translate line and circle geometry into equations, then use algebra to find intersections, tangency and missing geometric information.',
    headerFormula: 'y=mx+c,\\quad (x-a)^2+(y-b)^2=r^2',
    routeAvailability: { ...TOPIC_ROUTES },
  },
  {
    id: 'p1-circular-measure',
    courseId: P1_COURSE_ID,
    slug: 'circular-measure',
    syllabusRef: '1.4',
    order: 4,
    title: 'Circular measure',
    shortTitle: 'Circular measure',
    description: 'Use radians as the natural angle measure for arc, sector and composite-geometry problems.',
    headerFormula: 's=r\\theta,\\quad A=\\frac12r^2\\theta',
    routeAvailability: { ...TOPIC_ROUTES },
  },
  {
    id: 'p1-trigonometry',
    courseId: P1_COURSE_ID,
    slug: 'trigonometry',
    syllabusRef: '1.5',
    order: 5,
    title: 'Trigonometry',
    shortTitle: 'Trigonometry',
    description: 'Connect graphs, exact values, identities and inverse-trigonometric principal values to complete interval solutions.',
    headerFormula: '\\sin x,\\quad \\cos x,\\quad \\tan x',
    routeAvailability: { ...TOPIC_ROUTES },
  },
  {
    id: 'p1-series',
    courseId: P1_COURSE_ID,
    slug: 'series',
    syllabusRef: '1.6',
    order: 6,
    title: 'Series',
    shortTitle: 'Series',
    description: 'Recognise binomial, arithmetic and geometric structures before choosing the correct term or sum formula.',
    headerFormula: '(a+b)^n,\\quad S_n,\\quad S_\\infty',
    routeAvailability: { ...TOPIC_ROUTES },
  },
  {
    id: 'p1-differentiation',
    courseId: P1_COURSE_ID,
    slug: 'differentiation',
    syllabusRef: '1.7',
    order: 7,
    title: 'Differentiation',
    shortTitle: 'Differentiation',
    description: 'Interpret derivatives as gradients, calculate them accurately, then apply them to geometry, rates and curve behaviour.',
    headerFormula: '\\frac{dy}{dx},\\quad f^{\\prime}(x),\\quad f^{\\prime\\prime}(x)',
    routeAvailability: { ...TOPIC_ROUTES },
  },
  {
    id: 'p1-integration',
    courseId: P1_COURSE_ID,
    slug: 'integration',
    syllabusRef: '1.8',
    order: 8,
    title: 'Integration',
    shortTitle: 'Integration',
    description: 'Reverse differentiation, apply conditions and limits, and use definite integrals for area and volume.',
    headerFormula: '\\int f(x)\\,dx,\\quad \\int_a^b f(x)\\,dx',
    routeAvailability: { ...TOPIC_ROUTES },
  },
];

export const P1_OFFICIAL_SYLLABUS_OUTCOMES = {
  '1.1.1': 'Complete the square and use the resulting form to locate or sketch a quadratic vertex.',
  '1.1.2': 'Calculate and interpret a quadratic discriminant, including repeated-root cases.',
  '1.1.3': 'Solve quadratic equations and inequalities in one variable.',
  '1.1.4': 'Solve a simultaneous pair containing one linear and one quadratic equation by substitution.',
  '1.1.5': 'Recognise and solve equations that are quadratic in a function of the variable.',
  '1.2.1': 'Use function, domain, range, one-one, inverse and composition terminology correctly.',
  '1.2.2': 'Find simple ranges and valid compositions, respecting domain and range constraints.',
  '1.2.3': 'Decide whether a function is one-one and find a simple inverse when it exists.',
  '1.2.4': 'Relate the graphs of a one-one function and its inverse by reflection in y=x.',
  '1.2.5': 'Apply and describe translations, reflections and stretches of y=f(x).',
  '1.3.1': 'Find a straight-line equation from sufficient coordinate or gradient information.',
  '1.3.2': 'Use standard line forms, distance, midpoint, intersection, parallel and perpendicular relationships.',
  '1.3.3': 'Use centre-radius and expanded equations of circles.',
  '1.3.4': 'Solve line-and-circle problems using algebra and elementary circle geometry.',
  '1.3.5': 'Connect graph intersections with equation solutions and classify intersection conditions.',
  '1.4.1': 'Convert between degrees and radians and use the definition of a radian.',
  '1.4.2': 'Use arc-length and sector-area formulae in circle and composite-geometry problems.',
  '1.5.1': 'Sketch and use sine, cosine and tangent graphs in degrees or radians.',
  '1.5.2': 'Use exact trigonometric values for 30, 45, 60 degrees and related angles.',
  '1.5.3': 'Interpret inverse-trigonometric notation as principal values.',
  '1.5.4': 'Use tan x=sin x/cos x and sin^2 x+cos^2 x=1 in proofs, simplification and equations.',
  '1.5.5': 'Find every solution of a simple trigonometric equation in a specified interval.',
  '1.6.1': 'Expand (a+b)^n for a positive integer n and use binomial coefficients.',
  '1.6.2': 'Recognise arithmetic and geometric progressions.',
  '1.6.3': 'Use nth-term and finite-sum formulae for arithmetic and geometric progressions.',
  '1.6.4': 'Apply the convergence condition and sum-to-infinity formula for a geometric progression.',
  '1.7.1': 'Interpret the derivative as a limiting gradient and use first- and second-derivative notation.',
  '1.7.2': 'Differentiate rational powers, linear combinations and simple composites using the chain rule.',
  '1.7.3': 'Apply derivatives to gradients, tangents, normals, monotonicity and connected rates of change.',
  '1.7.4': 'Locate and classify stationary points and use them when sketching curves.',
  '1.8.1': 'Integrate linear combinations of (ax+b)^n for rational n other than -1.',
  '1.8.2': 'Use a point or other condition to determine a constant of integration.',
  '1.8.3': 'Evaluate definite integrals, including simple improper cases allowed by the syllabus.',
  '1.8.4': 'Use definite integration to find bounded areas and volumes of revolution about either axis.',
} as const;

export type P1OfficialOutcomeId = keyof typeof P1_OFFICIAL_SYLLABUS_OUTCOMES;

function syllabusOutcomes(...ids: P1OfficialOutcomeId[]): string[] {
  return ids.map((id) => `${id}: ${P1_OFFICIAL_SYLLABUS_OUTCOMES[id]}`);
}

type P1SkillSeed = Pick<CourseSkillContractEntry,
  'id' | 'topicId' | 'syllabusRef' | 'title' | 'needToKnow' | 'examTriggers' | 'prerequisiteSkillIds'> & {
    outcomeIds: P1OfficialOutcomeId[];
    evidenceEligibility?: CourseSkillContractEntry['evidenceEligibility'];
  };

function reviewedSkill(seed: P1SkillSeed): CourseSkillContractEntry {
  return {
    id: seed.id,
    courseId: P1_COURSE_ID,
    topicId: seed.topicId,
    syllabusRef: seed.syllabusRef,
    title: seed.title,
    syllabusOutcomes: syllabusOutcomes(...seed.outcomeIds),
    needToKnow: seed.needToKnow,
    examTriggers: seed.examTriggers,
    prerequisiteSkillIds: seed.prerequisiteSkillIds,
    readiness: 'ready',
    reviewStatus: 'reviewed',
    evidenceEligibility: seed.evidenceEligibility ?? 'strong-checked-practice',
    routeAvailability: { ...SKILL_ROUTES },
  };
}

export const P1_SKILL_CONTRACT: CourseSkillContractEntry[] = [
  reviewedSkill({
    id: 'p1_quad_complete_square', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Read a vertex from completed-square form', outcomeIds: ['1.1.1'],
    needToKnow: ['Read the vertex directly from completed-square form.', 'Reverse the sign inside the squared bracket when locating the vertex.'],
    examTriggers: ['vertex', 'turning point', 'minimum', 'maximum'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_quad_complete_square_rewrite', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Rewrite a quadratic by completing the square', outcomeIds: ['1.1.1'],
    needToKnow: ['Factor out a non-unit leading coefficient before completing the square.', 'Balance the square term with the constant outside the bracket.'],
    examTriggers: ['complete the square', 'write in the form', 'quadratic form'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_quad_discriminant', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Use the discriminant to classify roots', outcomeIds: ['1.1.2'],
    needToKnow: ['Use b^2-4ac without solving the quadratic.', 'Match positive, zero and negative discriminants to root cases.'],
    examTriggers: ['discriminant', 'real roots', 'repeated root', 'tangent'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_quad_equations_inequalities', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Solve quadratic inequalities by sign intervals', outcomeIds: ['1.1.3'],
    needToKnow: ['Find the boundary roots first.', 'Use the roots and the direction of the quadratic to select complete intervals.'],
    examTriggers: ['inequality', 'set of values', 'greater than', 'less than'], prerequisiteSkillIds: ['p1_quad_solve_equations'],
  }),
  reviewedSkill({
    id: 'p1_quad_solve_equations', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Solve quadratic equations', outcomeIds: ['1.1.3'],
    needToKnow: ['Put all terms on one side.', 'Choose factorisation, completed square or the quadratic formula and keep every valid root.'],
    examTriggers: ['solve quadratic', 'roots', 'factorise', 'quadratic formula'], prerequisiteSkillIds: ['p1_quad_complete_square_rewrite'],
  }),
  reviewedSkill({
    id: 'p1_quad_simultaneous', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Solve linear-quadratic simultaneous equations', outcomeIds: ['1.1.4'],
    needToKnow: ['Substitute the linear relation into the quadratic equation.', 'Back-substitute every valid root.'],
    examTriggers: ['simultaneous', 'line and curve', 'intersection'], prerequisiteSkillIds: ['p1_quad_solve_equations'],
  }),
  reviewedSkill({
    id: 'p1_quad_substitution_forms', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Choose a substitution for a hidden quadratic', outcomeIds: ['1.1.5'],
    needToKnow: ['Identify the expression that appears as both a first and second power.', 'Use a temporary variable to expose an ordinary quadratic.'],
    examTriggers: ['quadratic in', 'choose substitution', 'repeated expression'], prerequisiteSkillIds: ['p1_quad_solve_equations'],
  }),
  reviewedSkill({
    id: 'p1_quad_hidden_substitution_solve', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Solve an equation that is quadratic in a repeated expression', outcomeIds: ['1.1.5'],
    needToKnow: ['Solve the temporary quadratic completely.', 'Restore the original expression and solve every resulting equation.'],
    examTriggers: ['quadratic in', 'x^4', 'tan^2 x', 'hence solve'], prerequisiteSkillIds: ['p1_quad_substitution_forms'],
  }),
  reviewedSkill({
    id: 'p1_func_language_domain_range', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Determine a function domain', outcomeIds: ['1.2.1'],
    needToKnow: ['The domain is the set of permitted inputs.', 'Exclude values that make an expression undefined.'],
    examTriggers: ['domain', 'function', 'defined', 'restriction'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_func_ranges', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Determine a function range', outcomeIds: ['1.2.1', '1.2.2'],
    needToKnow: ['The range is the set of outputs actually produced.', 'Use graph shape, completed-square form or a stated domain to find bounds.'],
    examTriggers: ['range', 'output', 'least value', 'greatest value'], prerequisiteSkillIds: ['p1_func_language_domain_range'],
  }),
  reviewedSkill({
    id: 'p1_func_composition', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Calculate a composite function', outcomeIds: ['1.2.2'],
    needToKnow: ['Read gf as g applied after f.', 'Substitute the complete inner expression into the outer function.'],
    examTriggers: ['gf', 'fg', 'composite', 'find formula'], prerequisiteSkillIds: ['p1_func_language_domain_range'],
  }),
  reviewedSkill({
    id: 'p1_func_composition_domain', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Check whether a composition is valid on a domain', outcomeIds: ['1.2.2'],
    needToKnow: ['The range of the inner function must lie within the domain of the outer function.', 'Restrict inputs when only part of the inner range is valid.'],
    examTriggers: ['composition defined', 'valid domain', 'range of inner function'], prerequisiteSkillIds: ['p1_func_composition', 'p1_func_ranges'],
  }),
  reviewedSkill({
    id: 'p1_func_one_one_inverse', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Test one-one behaviour and choose a valid restriction', outcomeIds: ['1.2.3'],
    needToKnow: ['A one-one function cannot give the same output for two permitted inputs.', 'Restrict a many-one graph to a single monotonic branch before inverting.'],
    examTriggers: ['one-one', 'many-one', 'restriction'], prerequisiteSkillIds: ['p1_func_language_domain_range'],
  }),
  reviewedSkill({
    id: 'p1_func_inverse_formula', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Find an inverse-function formula', outcomeIds: ['1.2.3'],
    needToKnow: ['Write y=f(x), make x the subject, then exchange the input-output labels.', 'State the inverse domain when a restriction matters.'],
    examTriggers: ['find inverse', 'f^-1', 'make x the subject'], prerequisiteSkillIds: ['p1_func_one_one_inverse'],
  }),
  reviewedSkill({
    id: 'p1_func_inverse_graphs', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Map points between a function and its inverse', outcomeIds: ['1.2.4'],
    needToKnow: ['Reflect coordinates across y=x.', 'Swap domain and range when moving to the inverse.'],
    examTriggers: ['sketch inverse', 'mirror line', 'y=x'], prerequisiteSkillIds: ['p1_func_one_one_inverse'],
  }),
  reviewedSkill({
    id: 'p1_func_inverse_graph_sketch', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Sketch an inverse graph by reflection', outcomeIds: ['1.2.4'],
    needToKnow: ['Reflect the complete permitted graph in y=x.', 'Transfer endpoints, intercepts and asymptotes by swapping coordinates.'],
    examTriggers: ['sketch inverse', 'reflect in y=x', 'inverse graph'], prerequisiteSkillIds: ['p1_func_inverse_graphs'],
    evidenceEligibility: 'manual-practice-only',
  }),
  reviewedSkill({
    id: 'p1_func_transformations', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Apply graph stretches', outcomeIds: ['1.2.5'],
    needToKnow: ['An outside multiplier scales y-values.', 'An inside multiplier applies the reciprocal horizontal scale.'],
    examTriggers: ['stretch', 'scale factor', 'f(ax)', 'af(x)'], prerequisiteSkillIds: ['p1_func_language_domain_range'],
  }),
  reviewedSkill({
    id: 'p1_func_transform_translate_reflect', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Apply graph translations and reflections', outcomeIds: ['1.2.5'],
    needToKnow: ['Changes outside f move or reflect output values directly.', 'Changes inside the argument act oppositely on horizontal position.'],
    examTriggers: ['translation', 'reflection', 'f(x-a)', '-f(x)', 'f(-x)'], prerequisiteSkillIds: ['p1_func_language_domain_range'],
  }),
  reviewedSkill({
    id: 'p1_coord_line_equations', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Form a straight-line equation', outcomeIds: ['1.3.1'],
    needToKnow: ['Find a gradient from two points when needed.', 'Use point-gradient form before rearranging.'],
    examTriggers: ['equation of line', 'through', 'gradient'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_coord_line_relationships', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Find a midpoint from two coordinates', outcomeIds: ['1.3.2'],
    needToKnow: ['Average the x-coordinates and y-coordinates separately.', 'Keep signs attached to negative coordinates.'],
    examTriggers: ['midpoint', 'bisects', 'centre of line segment'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_coord_distance', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Find the distance between two coordinates', outcomeIds: ['1.3.2'],
    needToKnow: ['Use horizontal and vertical coordinate differences as perpendicular sides.', 'Keep exact surd form unless a rounded answer is requested.'],
    examTriggers: ['distance', 'length', 'magnitude'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_coord_parallel_perpendicular', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Use parallel and perpendicular gradients', outcomeIds: ['1.3.2'],
    needToKnow: ['Parallel non-vertical lines have equal gradients.', 'Perpendicular non-vertical gradients have product -1.'],
    examTriggers: ['parallel', 'perpendicular', 'normal', 'gradient'], prerequisiteSkillIds: ['p1_coord_line_equations'],
  }),
  reviewedSkill({
    id: 'p1_coord_line_intersections', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Find the intersection of two straight lines', outcomeIds: ['1.3.2'],
    needToKnow: ['Solve the two line equations simultaneously.', 'Substitute back to produce a complete coordinate pair.'],
    examTriggers: ['intersection of lines', 'meet', 'simultaneous lines'], prerequisiteSkillIds: ['p1_coord_line_equations'],
  }),
  reviewedSkill({
    id: 'p1_coord_circle_equations', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Convert an expanded circle equation to centre-radius form', outcomeIds: ['1.3.3'],
    needToKnow: ['Read centre and radius from completed-square form.', 'Complete squares to convert an expanded circle equation.'],
    examTriggers: ['circle', 'centre', 'radius', 'expanded form'], prerequisiteSkillIds: ['p1_quad_complete_square_rewrite'],
  }),
  reviewedSkill({
    id: 'p1_coord_circle_standard_form', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Form a circle equation from its centre and radius', outcomeIds: ['1.3.3'],
    needToKnow: ['Use (x-a)^2+(y-b)^2=r^2 for centre (a,b).', 'Square the radius on the right-hand side.'],
    examTriggers: ['equation of circle', 'centre', 'radius', 'passes through'], prerequisiteSkillIds: ['p1_coord_distance'],
  }),
  reviewedSkill({
    id: 'p1_coord_line_circle_problems', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Recognise an algebraic tangency condition', outcomeIds: ['1.3.4'],
    needToKnow: ['A tangent gives one repeated line-circle intersection.', 'After substitution, tangency corresponds to a zero discriminant.'],
    examTriggers: ['tangent', 'touches', 'repeated intersection', 'discriminant zero'], prerequisiteSkillIds: ['p1_coord_circle_equations', 'p1_quad_discriminant'],
  }),
  reviewedSkill({
    id: 'p1_coord_tangent_gradient', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Use the perpendicular radius to find a tangent gradient', outcomeIds: ['1.3.4'],
    needToKnow: ['Find the radius gradient from the centre and contact point when needed.', 'Use the negative reciprocal for the tangent gradient.'],
    examTriggers: ['tangent gradient', 'radius', 'point of contact'], prerequisiteSkillIds: ['p1_coord_parallel_perpendicular', 'p1_coord_circle_equations'],
  }),
  reviewedSkill({
    id: 'p1_coord_line_circle_intersections', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Find line-and-circle intersection coordinates', outcomeIds: ['1.3.4'],
    needToKnow: ['Substitute the line equation into the circle.', 'Back-substitute every valid root to obtain complete coordinate pairs.'],
    examTriggers: ['line meets circle', 'intersection coordinates', 'chord endpoints'], prerequisiteSkillIds: ['p1_coord_circle_equations', 'p1_quad_solve_equations'],
  }),
  reviewedSkill({
    id: 'p1_coord_graph_intersections', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Connect graph intersections and equation roots', outcomeIds: ['1.3.5'],
    needToKnow: ['Equate graph equations to find common points.', 'Use the discriminant to classify crossing, touching or no intersection.'],
    examTriggers: ['intersects', 'touches', 'does not meet', 'values of k'], prerequisiteSkillIds: ['p1_quad_discriminant', 'p1_coord_line_equations'],
  }),
  reviewedSkill({
    id: 'p1_circ_radians_degrees', topicId: 'p1-circular-measure', syllabusRef: '1.4',
    title: 'Convert and interpret radian measure', outcomeIds: ['1.4.1'],
    needToKnow: ['Use pi radians = 180 degrees.', 'Treat theta as radians in arc and sector formulae.'],
    examTriggers: ['radian', 'convert', 'angle'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_circ_arc_sector', topicId: 'p1-circular-measure', syllabusRef: '1.4',
    title: 'Calculate sector areas', outcomeIds: ['1.4.2'],
    needToKnow: ['Use A=1/2 r^2 theta with theta in radians.', 'Square the radius and keep exact pi values until rounding is requested.'],
    examTriggers: ['sector area', 'radius', 'angle in radians'], prerequisiteSkillIds: ['p1_circ_radians_degrees'],
  }),
  reviewedSkill({
    id: 'p1_circ_arc_length', topicId: 'p1-circular-measure', syllabusRef: '1.4',
    title: 'Calculate arc lengths', outcomeIds: ['1.4.2'],
    needToKnow: ['Use s=r theta with theta in radians.', 'Rearrange the formula when the radius or angle is unknown.'],
    examTriggers: ['arc length', 'perimeter', 'radius', 'angle in radians'], prerequisiteSkillIds: ['p1_circ_radians_degrees'],
  }),
  reviewedSkill({
    id: 'p1_circ_composite_geometry', topicId: 'p1-circular-measure', syllabusRef: '1.4',
    title: 'Find perimeters containing arcs and straight sides', outcomeIds: ['1.4.2'],
    needToKnow: ['Trace the complete boundary before calculating.', 'Include straight radii or chords as well as every exposed arc.'],
    examTriggers: ['perimeter', 'arc', 'composite boundary'], prerequisiteSkillIds: ['p1_circ_arc_length'],
  }),
  reviewedSkill({
    id: 'p1_circ_segment_area', topicId: 'p1-circular-measure', syllabusRef: '1.4',
    title: 'Find circular segment and composite areas', outcomeIds: ['1.4.2'],
    needToKnow: ['A minor segment is its sector minus the central triangle.', 'Break a shaded region into non-overlapping sectors, triangles and segments.'],
    examTriggers: ['segment', 'shaded area', 'composite area'], prerequisiteSkillIds: ['p1_circ_arc_sector'],
  }),
  reviewedSkill({
    id: 'p1_trig_graphs', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Read amplitude, period and asymptotes from trigonometric formulae', outcomeIds: ['1.5.1'],
    needToKnow: ['Sine and cosine have base period 2 pi while tangent has base period pi.', 'Use outside and inside scale factors to identify amplitude and period.'],
    examTriggers: ['period', 'amplitude', 'asymptote'], prerequisiteSkillIds: ['p1_func_transformations'],
  }),
  reviewedSkill({
    id: 'p1_trig_graph_sketch', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Sketch sine, cosine and tangent graphs', outcomeIds: ['1.5.1'],
    needToKnow: ['Mark intercepts, maxima, minima and asymptotes over the requested interval.', 'Apply graph transformations before placing key features.'],
    examTriggers: ['sketch', 'draw graph', 'asymptotes', 'key points'], prerequisiteSkillIds: ['p1_trig_graphs', 'p1_func_transform_translate_reflect'],
    evidenceEligibility: 'manual-practice-only',
  }),
  reviewedSkill({
    id: 'p1_trig_exact_values', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Use exact values at related angles', outcomeIds: ['1.5.2'],
    needToKnow: ['Find the reference angle.', 'Apply the sign from the angle quadrant.'],
    examTriggers: ['exact value', 'related angle', 'without calculator'], prerequisiteSkillIds: ['p1_trig_exact_standard'],
  }),
  reviewedSkill({
    id: 'p1_trig_exact_standard', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Recall exact values at 30, 45 and 60 degrees', outcomeIds: ['1.5.2'],
    needToKnow: ['Know exact sine, cosine and tangent values at 30, 45 and 60 degrees.', 'Keep square-root values exact and rationalise only when useful.'],
    examTriggers: ['exact value', '30 degrees', '45 degrees', '60 degrees'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_trig_inverse_principal', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Interpret inverse-trigonometric principal values', outcomeIds: ['1.5.3'],
    needToKnow: ['Use inverse notation for a principal angle, not a reciprocal.', 'Generate other interval solutions from the principal value.'],
    examTriggers: ['sin^-1', 'cos^-1', 'tan^-1', 'principal value'], prerequisiteSkillIds: ['p1_func_one_one_inverse', 'p1_trig_exact_values'],
  }),
  reviewedSkill({
    id: 'p1_trig_identities', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Simplify using the basic P1 trigonometric identities', outcomeIds: ['1.5.4'],
    needToKnow: ['Convert tangent to sine over cosine when useful.', 'Replace sin^2 x or cos^2 x using their sum of 1.'],
    examTriggers: ['prove', 'identity', 'simplify'], prerequisiteSkillIds: ['p1_trig_exact_standard'],
  }),
  reviewedSkill({
    id: 'p1_trig_identity_proofs', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Construct a trigonometric identity proof', outcomeIds: ['1.5.4'],
    needToKnow: ['Start from one side and transform it into the other using valid identity steps.', 'Avoid assuming the statement being proved or cancelling across addition.'],
    examTriggers: ['prove', 'show that', 'identity'], prerequisiteSkillIds: ['p1_trig_identities'],
    evidenceEligibility: 'manual-practice-only',
  }),
  reviewedSkill({
    id: 'p1_trig_equations_intervals', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Solve trigonometric equations over an interval', outcomeIds: ['1.5.5'],
    needToKnow: ['Find every solution inside the stated interval.', 'Do not give general solution families in P1.'],
    examTriggers: ['solve', 'specified interval', 'degrees', 'radians'], prerequisiteSkillIds: ['p1_trig_inverse_principal', 'p1_trig_identities'],
  }),
  reviewedSkill({
    id: 'p1_series_binomial', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Find a specified binomial term or coefficient', outcomeIds: ['1.6.1'],
    needToKnow: ['Use the general term with binomial coefficients.', 'Match powers before expanding unnecessary terms.'],
    examTriggers: ['coefficient', 'term in x', 'specified power'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_series_binomial_expand', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Expand a positive-integer binomial', outcomeIds: ['1.6.1'],
    needToKnow: ['Use the correct row of positive-integer binomial coefficients.', 'Track the power and sign of every factor through the requested terms.'],
    examTriggers: ['expand', 'ascending powers', 'first terms'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_series_progression_recognition', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Recognise arithmetic and geometric progressions', outcomeIds: ['1.6.2'],
    needToKnow: ['Look for a constant difference or constant ratio.', 'Use 2b=a+c or b^2=ac for three linked terms.'],
    examTriggers: ['progression', 'arithmetic', 'geometric'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_series_finite_sums', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Find finite arithmetic progression sums', outcomeIds: ['1.6.3'],
    needToKnow: ['Identify a, d and n before substituting.', 'Use either n/2[2a+(n-1)d] or n/2(first+last).'],
    examTriggers: ['arithmetic sum', 'sum of first n', 'total'], prerequisiteSkillIds: ['p1_series_progression_recognition'],
  }),
  reviewedSkill({
    id: 'p1_series_arithmetic_terms', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Find arithmetic progression terms', outcomeIds: ['1.6.3'],
    needToKnow: ['Use u_n=a+(n-1)d.', 'Translate a requested term position into n-1 equal steps from the first term.'],
    examTriggers: ['nth term', 'arithmetic term', 'find n'], prerequisiteSkillIds: ['p1_series_progression_recognition'],
  }),
  reviewedSkill({
    id: 'p1_series_geometric_finite', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Find geometric progression terms and finite sums', outcomeIds: ['1.6.3'],
    needToKnow: ['Use u_n=ar^(n-1) for a term.', 'Use a(1-r^n)/(1-r) or its equivalent for a finite sum.'],
    examTriggers: ['geometric term', 'geometric sum', 'sum of first n'], prerequisiteSkillIds: ['p1_series_progression_recognition'],
  }),
  reviewedSkill({
    id: 'p1_series_geometric_infinity', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Test whether a geometric progression converges', outcomeIds: ['1.6.4'],
    needToKnow: ['A geometric progression converges only when |r|<1.', 'Find the common ratio before making any infinity claim.'],
    examTriggers: ['converges', 'condition', 'common ratio'], prerequisiteSkillIds: ['p1_series_geometric_finite'],
  }),
  reviewedSkill({
    id: 'p1_series_geometric_infinity_sum', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Find a convergent geometric sum to infinity', outcomeIds: ['1.6.4'],
    needToKnow: ['Check |r|<1 first.', 'Then use S_infinity=a/(1-r), keeping the sign of r.'],
    examTriggers: ['sum to infinity', 'S infinity', 'convergent geometric progression'], prerequisiteSkillIds: ['p1_series_geometric_infinity'],
  }),
  reviewedSkill({
    id: 'p1_diff_gradient_limit_notation', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Interpret first- and second-derivative notation', outcomeIds: ['1.7.1'],
    needToKnow: ['The first derivative is an instantaneous gradient.', 'Distinguish the second derivative from the square of the first derivative.'],
    examTriggers: ['f prime', 'second derivative', 'derivative notation'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_diff_limiting_gradient', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Interpret a derivative as a limiting gradient', outcomeIds: ['1.7.1'],
    needToKnow: ['A chord gradient approaches the tangent gradient as the second point approaches the first.', 'Use the difference quotient with a limiting increment.'],
    examTriggers: ['gradient from first principles', 'chord', 'limit', 'difference quotient'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_diff_power_chain', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Differentiate rational powers and linear combinations', outcomeIds: ['1.7.2'],
    needToKnow: ['Multiply by the power and reduce it by one.', 'Differentiate each term of a linear combination independently.'],
    examTriggers: ['differentiate', 'rational power', 'dy/dx'], prerequisiteSkillIds: ['p1_diff_gradient_limit_notation'],
  }),
  reviewedSkill({
    id: 'p1_diff_chain_rule', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Differentiate simple composites with the chain rule', outcomeIds: ['1.7.2'],
    needToKnow: ['Differentiate the outside power first.', 'Multiply by the derivative of the inner linear expression.'],
    examTriggers: ['differentiate', 'chain rule', '(ax+b)^n'], prerequisiteSkillIds: ['p1_diff_power_chain'],
  }),
  reviewedSkill({
    id: 'p1_diff_tangent_normal', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Find a normal gradient and equation', outcomeIds: ['1.7.3'],
    needToKnow: ['Evaluate the tangent gradient at the point.', 'Use the negative reciprocal for a non-zero, finite normal gradient.'],
    examTriggers: ['normal', 'normal gradient', 'equation of normal'], prerequisiteSkillIds: ['p1_diff_power_chain', 'p1_coord_line_equations'],
  }),
  reviewedSkill({
    id: 'p1_diff_tangent_equations', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Find a tangent equation', outcomeIds: ['1.7.3'],
    needToKnow: ['Evaluate the derivative at the stated point.', 'Use the point-gradient line form and finish the requested equation.'],
    examTriggers: ['tangent', 'gradient at point', 'equation of tangent'], prerequisiteSkillIds: ['p1_diff_power_chain', 'p1_coord_line_equations'],
  }),
  reviewedSkill({
    id: 'p1_diff_increasing_decreasing', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Use derivative signs for increasing and decreasing intervals', outcomeIds: ['1.7.3'],
    needToKnow: ['Solve f prime(x)>0 or <0 as a sign problem.', 'Use critical points to split the domain.'],
    examTriggers: ['increasing', 'decreasing', 'interval'], prerequisiteSkillIds: ['p1_diff_power_chain', 'p1_quad_equations_inequalities'],
  }),
  reviewedSkill({
    id: 'p1_diff_connected_rates', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Solve connected rates-of-change problems', outcomeIds: ['1.7.3'],
    needToKnow: ['Differentiate the relation with respect to time.', 'Substitute the requested instant only after forming the rate equation.'],
    examTriggers: ['rate of increase', 'rate of change', 'per second'], prerequisiteSkillIds: ['p1_diff_power_chain'],
  }),
  reviewedSkill({
    id: 'p1_diff_stationary_classification', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Classify a stationary point', outcomeIds: ['1.7.4'],
    needToKnow: ['Confirm that the first derivative is zero.', 'Use the second derivative or a derivative sign test to classify maxima and minima.'],
    examTriggers: ['classify', 'maximum', 'minimum', 'nature'], prerequisiteSkillIds: ['p1_diff_power_chain'],
  }),
  reviewedSkill({
    id: 'p1_diff_stationary_location', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Locate stationary points', outcomeIds: ['1.7.4'],
    needToKnow: ['Set the first derivative equal to zero.', 'Substitute each stationary x-value into the original function to obtain coordinates.'],
    examTriggers: ['stationary point', 'find coordinates', 'turning point'], prerequisiteSkillIds: ['p1_diff_power_chain', 'p1_quad_solve_equations'],
  }),
  reviewedSkill({
    id: 'p1_diff_curve_sketch', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Sketch a curve using derivative information', outcomeIds: ['1.7.4'],
    needToKnow: ['Plot intercepts and stationary points before joining with the correct monotonic behaviour.', 'Do not claim points of inflexion, which are outside the P1 requirement.'],
    examTriggers: ['sketch curve', 'stationary points', 'increasing', 'decreasing'], prerequisiteSkillIds: ['p1_diff_stationary_location', 'p1_diff_stationary_classification', 'p1_diff_increasing_decreasing'],
    evidenceEligibility: 'manual-practice-only',
  }),
  reviewedSkill({
    id: 'p1_int_reverse_power', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Integrate powers and linear combinations', outcomeIds: ['1.8.1'],
    needToKnow: ['Increase the power by one and divide by the new power.', 'Integrate each term independently and include one constant of integration.'],
    examTriggers: ['integrate', 'power', 'linear combination'], prerequisiteSkillIds: ['p1_diff_power_chain'],
  }),
  reviewedSkill({
    id: 'p1_int_linear_composites', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Integrate simple linear composites', outcomeIds: ['1.8.1'],
    needToKnow: ['Reverse the power rule for (ax+b)^n.', 'Divide by the inner coefficient a as well as the new power.'],
    examTriggers: ['integrate', '(ax+b)^n', 'reverse chain rule'], prerequisiteSkillIds: ['p1_int_reverse_power', 'p1_diff_chain_rule'],
  }),
  reviewedSkill({
    id: 'p1_int_constant', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Determine a constant of integration', outcomeIds: ['1.8.2'],
    needToKnow: ['Include +C for an indefinite integral.', 'Substitute the given point into the general curve equation.'],
    examTriggers: ['passes through', 'constant of integration', 'equation of curve'], prerequisiteSkillIds: ['p1_int_reverse_power'],
  }),
  reviewedSkill({
    id: 'p1_int_definite', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Evaluate a proper definite integral', outcomeIds: ['1.8.3'],
    needToKnow: ['Find an antiderivative first.', 'Use upper value minus lower value with brackets around each substitution.'],
    examTriggers: ['evaluate', 'definite integral', 'bounds'], prerequisiteSkillIds: ['p1_int_reverse_power'],
  }),
  reviewedSkill({
    id: 'p1_int_improper', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Evaluate a simple improper integral', outcomeIds: ['1.8.3'],
    needToKnow: ['Replace the improper endpoint with a limiting variable.', 'Evaluate the limit only after applying the antiderivative at both bounds.'],
    examTriggers: ['improper integral', 'limit', 'infinite bound'], prerequisiteSkillIds: ['p1_int_definite'],
  }),
  reviewedSkill({
    id: 'p1_int_areas', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Set up an area between two curves', outcomeIds: ['1.8.4'],
    needToKnow: ['Use top minus bottom for vertical strips or right minus left for horizontal strips.', 'Find intersection bounds before integrating.'],
    examTriggers: ['area between curves', 'bounded region', 'top minus bottom'], prerequisiteSkillIds: ['p1_int_definite', 'p1_coord_graph_intersections'],
  }),
  reviewedSkill({
    id: 'p1_int_area_split', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Split an area where graph order or sign changes', outcomeIds: ['1.8.4'],
    needToKnow: ['A geometric area must be non-negative.', 'Split at every crossing of the axis or change in which curve is above.'],
    examTriggers: ['total area', 'crosses axis', 'split integral'], prerequisiteSkillIds: ['p1_int_areas'],
  }),
  reviewedSkill({
    id: 'p1_int_volumes', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Set up a volume of revolution about the x-axis', outcomeIds: ['1.8.4'],
    needToKnow: ['Use pi times the integral of y squared with respect to x.', 'Subtract an inner radius squared when the rotated region has a hole.'],
    examTriggers: ['volume of revolution', 'rotate about x-axis'], prerequisiteSkillIds: ['p1_int_definite'],
  }),
  reviewedSkill({
    id: 'p1_int_volume_y_axis', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Set up a volume of revolution about the y-axis', outcomeIds: ['1.8.4'],
    needToKnow: ['Express x as a function of y when using disks about the y-axis.', 'Use pi times the integral of x squared with respect to y.'],
    examTriggers: ['volume of revolution', 'rotate about y-axis'], prerequisiteSkillIds: ['p1_int_definite'],
  }),
];

export const P1_COURSE_STUDY_CONTRACT: CourseStudyContract = {
  schemaName: 'asterion.course-study-contract',
  schemaVersion: 1,
  courseId: P1_COURSE_ID,
  displayName: 'Pure Mathematics 1',
  syllabus: P1_SYLLABUS_AUTHORITY,
  curriculumConstraints: P1_CURRICULUM_CONSTRAINTS,
  topics: P1_STUDY_TOPICS,
  skills: P1_SKILL_CONTRACT,
};

export const COURSE_STUDY_CONTRACTS: Partial<Record<CourseId, CourseStudyContract>> = {
  p1: P1_COURSE_STUDY_CONTRACT,
};

export function getCourseStudyContract(courseId: string | undefined): CourseStudyContract | undefined {
  return courseId ? COURSE_STUDY_CONTRACTS[courseId as CourseId] : undefined;
}

export function getCourseStudyTopics(courseId: string | undefined): CourseStudyTopicDefinition[] {
  return getCourseStudyContract(courseId)?.topics ?? [];
}

export function getCourseSkillContract(courseId: string | undefined): CourseSkillContractEntry[] {
  return getCourseStudyContract(courseId)?.skills ?? [];
}

export function getP1StudyTopicBySlug(slug: string | undefined): CourseStudyTopicDefinition | undefined {
  return slug ? P1_STUDY_TOPICS.find((topic) => topic.slug === slug) : undefined;
}

export function getP1SkillsForTopic(topicId: string | undefined): CourseSkillContractEntry[] {
  return topicId ? P1_SKILL_CONTRACT.filter((skill) => skill.topicId === topicId) : [];
}
