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
    headerFormula: '\\frac{dy}{dx},\\quad f\\prime(x),\\quad f\\doubleprime(x)',
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
    evidenceEligibility: 'strong-checked-practice',
    routeAvailability: { ...SKILL_ROUTES },
  };
}

export const P1_SKILL_CONTRACT: CourseSkillContractEntry[] = [
  reviewedSkill({
    id: 'p1_quad_complete_square', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Complete the square and read quadratic form', outcomeIds: ['1.1.1'],
    needToKnow: ['Factor out a non-unit leading coefficient before completing the square.', 'Read the vertex directly from completed-square form.'],
    examTriggers: ['complete the square', 'vertex', 'turning point', 'sketch'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_quad_discriminant', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Use the discriminant to classify roots', outcomeIds: ['1.1.2'],
    needToKnow: ['Use b^2-4ac without solving the quadratic.', 'Match positive, zero and negative discriminants to root cases.'],
    examTriggers: ['discriminant', 'real roots', 'repeated root', 'tangent'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_quad_equations_inequalities', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Solve quadratic equations and inequalities', outcomeIds: ['1.1.3'],
    needToKnow: ['Choose factorisation, completed square or formula for equations.', 'Use roots and sign intervals for inequalities.'],
    examTriggers: ['solve', 'inequality', 'set of values'], prerequisiteSkillIds: ['p1_quad_complete_square'],
  }),
  reviewedSkill({
    id: 'p1_quad_simultaneous', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Solve linear-quadratic simultaneous equations', outcomeIds: ['1.1.4'],
    needToKnow: ['Substitute the linear relation into the quadratic equation.', 'Back-substitute every valid root.'],
    examTriggers: ['simultaneous', 'line and curve', 'intersection'], prerequisiteSkillIds: ['p1_quad_equations_inequalities'],
  }),
  reviewedSkill({
    id: 'p1_quad_substitution_forms', topicId: 'p1-quadratics', syllabusRef: '1.1',
    title: 'Recognise a quadratic in a repeated expression', outcomeIds: ['1.1.5'],
    needToKnow: ['Name the repeated expression with a temporary variable.', 'Restore the original expression and solve all resulting equations.'],
    examTriggers: ['quadratic in', 'substitution', 'x^4', 'tan^2 x'], prerequisiteSkillIds: ['p1_quad_equations_inequalities'],
  }),
  reviewedSkill({
    id: 'p1_func_language_domain_range', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Use function language, domains and ranges', outcomeIds: ['1.2.1'],
    needToKnow: ['Distinguish an input domain from an output range.', 'State restrictions using correct interval or set notation.'],
    examTriggers: ['domain', 'range', 'function', 'one-one'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_func_composition', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Compose functions within valid domains', outcomeIds: ['1.2.2'],
    needToKnow: ['Read gf as g applied after f.', 'Check that outputs of the inner function lie in the outer domain.'],
    examTriggers: ['gf', 'fg', 'composite', 'range'], prerequisiteSkillIds: ['p1_func_language_domain_range'],
  }),
  reviewedSkill({
    id: 'p1_func_one_one_inverse', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Test one-one behaviour and find inverses', outcomeIds: ['1.2.3'],
    needToKnow: ['Restrict a function when necessary before inverting.', 'Swap input and output, then rearrange.'],
    examTriggers: ['one-one', 'inverse', 'restriction'], prerequisiteSkillIds: ['p1_func_language_domain_range'],
  }),
  reviewedSkill({
    id: 'p1_func_inverse_graphs', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Relate a function graph to its inverse', outcomeIds: ['1.2.4'],
    needToKnow: ['Reflect coordinates across y=x.', 'Swap domain and range when moving to the inverse.'],
    examTriggers: ['sketch inverse', 'mirror line', 'y=x'], prerequisiteSkillIds: ['p1_func_one_one_inverse'],
  }),
  reviewedSkill({
    id: 'p1_func_transformations', topicId: 'p1-functions', syllabusRef: '1.2',
    title: 'Apply graph translations, reflections and stretches', outcomeIds: ['1.2.5'],
    needToKnow: ['Separate changes outside f from changes inside its argument.', 'Describe direction and scale precisely.'],
    examTriggers: ['transformation', 'translation', 'stretch', 'reflection'], prerequisiteSkillIds: ['p1_func_language_domain_range'],
  }),
  reviewedSkill({
    id: 'p1_coord_line_equations', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Form a straight-line equation', outcomeIds: ['1.3.1'],
    needToKnow: ['Find a gradient from two points when needed.', 'Use point-gradient form before rearranging.'],
    examTriggers: ['equation of line', 'through', 'gradient'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_coord_line_relationships', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Use line forms and coordinate relationships', outcomeIds: ['1.3.2'],
    needToKnow: ['Use distance, midpoint and intersection formulae accurately.', 'Use equal gradients for parallel lines and product -1 for perpendicular non-vertical lines.'],
    examTriggers: ['midpoint', 'distance', 'parallel', 'perpendicular', 'intersection'], prerequisiteSkillIds: ['p1_coord_line_equations'],
  }),
  reviewedSkill({
    id: 'p1_coord_circle_equations', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Read and form circle equations', outcomeIds: ['1.3.3'],
    needToKnow: ['Read centre and radius from completed-square form.', 'Complete squares to convert an expanded circle equation.'],
    examTriggers: ['circle', 'centre', 'radius', 'expanded form'], prerequisiteSkillIds: ['p1_quad_complete_square'],
  }),
  reviewedSkill({
    id: 'p1_coord_line_circle_problems', topicId: 'p1-coordinate-geometry', syllabusRef: '1.3',
    title: 'Solve line-and-circle geometry problems', outcomeIds: ['1.3.4'],
    needToKnow: ['Substitute a line equation into a circle when finding intersections.', 'Use a tangent perpendicular to the radius.'],
    examTriggers: ['tangent', 'chord', 'line meets circle'], prerequisiteSkillIds: ['p1_coord_line_relationships', 'p1_coord_circle_equations'],
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
    title: 'Calculate arc lengths and sector areas', outcomeIds: ['1.4.2'],
    needToKnow: ['Use s=r theta and A=1/2 r^2 theta with theta in radians.', 'Keep exact pi values until rounding is requested.'],
    examTriggers: ['arc length', 'sector area', 'radius'], prerequisiteSkillIds: ['p1_circ_radians_degrees'],
  }),
  reviewedSkill({
    id: 'p1_circ_composite_geometry', topicId: 'p1-circular-measure', syllabusRef: '1.4',
    title: 'Combine sectors, triangles and segments', outcomeIds: ['1.4.2'],
    needToKnow: ['Break a composite region into named pieces.', 'Include straight sides as well as arcs in perimeter calculations.'],
    examTriggers: ['segment', 'shaded area', 'perimeter', 'composite'], prerequisiteSkillIds: ['p1_circ_arc_sector'],
  }),
  reviewedSkill({
    id: 'p1_trig_graphs', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Sketch and use sine, cosine and tangent graphs', outcomeIds: ['1.5.1'],
    needToKnow: ['Mark period, amplitude and asymptotes where relevant.', 'Apply horizontal and vertical transformations before sketching.'],
    examTriggers: ['sketch', 'period', 'amplitude', 'asymptote'], prerequisiteSkillIds: ['p1_func_transformations'],
  }),
  reviewedSkill({
    id: 'p1_trig_exact_values', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Use exact trigonometric values and quadrant signs', outcomeIds: ['1.5.2'],
    needToKnow: ['Recall exact values at 30, 45 and 60 degrees.', 'Use a reference angle and quadrant sign for related angles.'],
    examTriggers: ['exact value', 'related angle', 'without calculator'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_trig_inverse_principal', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Interpret inverse-trigonometric principal values', outcomeIds: ['1.5.3'],
    needToKnow: ['Use inverse notation for a principal angle, not a reciprocal.', 'Generate other interval solutions from the principal value.'],
    examTriggers: ['sin^-1', 'cos^-1', 'tan^-1', 'principal value'], prerequisiteSkillIds: ['p1_func_one_one_inverse', 'p1_trig_exact_values'],
  }),
  reviewedSkill({
    id: 'p1_trig_identities', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Use the basic P1 trigonometric identities', outcomeIds: ['1.5.4'],
    needToKnow: ['Convert tangent to sine over cosine when useful.', 'Replace sin^2 x or cos^2 x using their sum of 1.'],
    examTriggers: ['prove', 'identity', 'simplify'], prerequisiteSkillIds: ['p1_trig_exact_values'],
  }),
  reviewedSkill({
    id: 'p1_trig_equations_intervals', topicId: 'p1-trigonometry', syllabusRef: '1.5',
    title: 'Solve trigonometric equations over an interval', outcomeIds: ['1.5.5'],
    needToKnow: ['Find every solution inside the stated interval.', 'Do not give general solution families in P1.'],
    examTriggers: ['solve', 'specified interval', 'degrees', 'radians'], prerequisiteSkillIds: ['p1_trig_inverse_principal', 'p1_trig_identities'],
  }),
  reviewedSkill({
    id: 'p1_series_binomial', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Expand positive-integer binomials', outcomeIds: ['1.6.1'],
    needToKnow: ['Use the general term with binomial coefficients.', 'Track powers and signs without expanding unnecessary terms.'],
    examTriggers: ['expand', 'coefficient', 'term in x'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_series_progression_recognition', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Recognise arithmetic and geometric progressions', outcomeIds: ['1.6.2'],
    needToKnow: ['Look for a constant difference or constant ratio.', 'Use 2b=a+c or b^2=ac for three linked terms.'],
    examTriggers: ['progression', 'arithmetic', 'geometric'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_series_finite_sums', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Use nth terms and finite sums', outcomeIds: ['1.6.3'],
    needToKnow: ['Identify a, d or r before substituting.', 'Distinguish a term question from a sum question.'],
    examTriggers: ['nth term', 'sum of first n', 'find n'], prerequisiteSkillIds: ['p1_series_progression_recognition'],
  }),
  reviewedSkill({
    id: 'p1_series_geometric_infinity', topicId: 'p1-series', syllabusRef: '1.6',
    title: 'Test convergence and sum a geometric progression to infinity', outcomeIds: ['1.6.4'],
    needToKnow: ['Require |r|<1 before using the infinity formula.', 'Use S_infinity=a/(1-r).'],
    examTriggers: ['converges', 'sum to infinity', 'condition'], prerequisiteSkillIds: ['p1_series_finite_sums'],
  }),
  reviewedSkill({
    id: 'p1_diff_gradient_limit_notation', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Interpret derivative notation and limiting gradients', outcomeIds: ['1.7.1'],
    needToKnow: ['View the tangent gradient as the limit of chord gradients.', 'Distinguish first- and second-derivative notation.'],
    examTriggers: ['gradient of curve', 'chord', 'f prime', 'second derivative'], prerequisiteSkillIds: [],
  }),
  reviewedSkill({
    id: 'p1_diff_power_chain', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Differentiate rational powers and simple composites', outcomeIds: ['1.7.2'],
    needToKnow: ['Multiply by the power and reduce it by one.', 'For (ax+b)^n, multiply by the inner derivative.'],
    examTriggers: ['differentiate', 'chain rule', 'dy/dx'], prerequisiteSkillIds: ['p1_diff_gradient_limit_notation'],
  }),
  reviewedSkill({
    id: 'p1_diff_tangent_normal', topicId: 'p1-differentiation', syllabusRef: '1.7',
    title: 'Find tangent and normal equations', outcomeIds: ['1.7.3'],
    needToKnow: ['Substitute the point after differentiating.', 'Use the negative reciprocal for a non-zero, finite normal gradient.'],
    examTriggers: ['tangent', 'normal', 'equation of line'], prerequisiteSkillIds: ['p1_diff_power_chain', 'p1_coord_line_equations'],
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
    title: 'Locate and classify stationary points', outcomeIds: ['1.7.4'],
    needToKnow: ['Set the first derivative to zero to locate candidates.', 'Use the second derivative or a sign test to classify maxima and minima.'],
    examTriggers: ['stationary point', 'maximum', 'minimum', 'sketch'], prerequisiteSkillIds: ['p1_diff_power_chain'],
  }),
  reviewedSkill({
    id: 'p1_int_reverse_power', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Integrate powers and simple linear composites', outcomeIds: ['1.8.1'],
    needToKnow: ['Increase the power by one and divide by the new power.', 'Account for the coefficient of x inside (ax+b)^n.'],
    examTriggers: ['integrate', 'find integral', 'reverse differentiation'], prerequisiteSkillIds: ['p1_diff_power_chain'],
  }),
  reviewedSkill({
    id: 'p1_int_constant', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Determine a constant of integration', outcomeIds: ['1.8.2'],
    needToKnow: ['Include +C for an indefinite integral.', 'Substitute the given point into the general curve equation.'],
    examTriggers: ['passes through', 'constant of integration', 'equation of curve'], prerequisiteSkillIds: ['p1_int_reverse_power'],
  }),
  reviewedSkill({
    id: 'p1_int_definite', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Evaluate definite and simple improper integrals', outcomeIds: ['1.8.3'],
    needToKnow: ['Use upper value minus lower value.', 'Interpret an improper endpoint through the allowed limiting value.'],
    examTriggers: ['evaluate', 'definite integral', 'limit'], prerequisiteSkillIds: ['p1_int_reverse_power'],
  }),
  reviewedSkill({
    id: 'p1_int_areas', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Find bounded areas with definite integration', outcomeIds: ['1.8.4'],
    needToKnow: ['Use top minus bottom or right minus left as appropriate.', 'Split the integral where curves cross or the sign changes.'],
    examTriggers: ['area', 'bounded region', 'between curves'], prerequisiteSkillIds: ['p1_int_definite', 'p1_coord_graph_intersections'],
  }),
  reviewedSkill({
    id: 'p1_int_volumes', topicId: 'p1-integration', syllabusRef: '1.8',
    title: 'Find volumes of revolution about either axis', outcomeIds: ['1.8.4'],
    needToKnow: ['Square the radius measured from the axis of rotation.', 'Subtract an inner radius squared when the rotated region has a hole.'],
    examTriggers: ['volume of revolution', 'rotate', 'x-axis', 'y-axis'], prerequisiteSkillIds: ['p1_int_definite'],
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
