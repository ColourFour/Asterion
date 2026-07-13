import { P1_COURSE_ID, P1_SKILL_CONTRACT, P1_STUDY_TOPICS } from './p1CourseContract';

export interface P1LearnExample {
  prompt: string;
  steps: string[];
  answer: string;
}

export interface P1LearnContent {
  title: string;
  learningGoal: string;
  teachingPoints: string[];
  commonError: string;
  workedExample: P1LearnExample;
}

export interface P1CheckedPracticeOption {
  id: 'option-a' | 'option-b' | 'option-c';
  label: string;
}

export interface P1CheckedPracticeContent {
  itemId: string;
  prompt: string;
  answerType: 'single-choice' | 'manual-self-marked';
  options: P1CheckedPracticeOption[];
  expectedOptionId: P1CheckedPracticeOption['id'] | null;
  hint: string;
  workedSolution: string[];
  progressionEligible: boolean;
  reviewStatus: 'reviewed';
  retryVariantId?: string;
}

export interface P1SkillStudyContent {
  skillId: string;
  learn: P1LearnContent;
  checkedPractice: P1CheckedPracticeContent;
  checkedPracticeRetry?: P1CheckedPracticeContent & { retryVariantId: string };
}

export interface P1TopicStudyContent {
  courseId: typeof P1_COURSE_ID;
  topicId: string;
  topicSlug: string;
  learn: P1LearnContent[];
  checkedPractice: P1CheckedPracticeContent[];
  checkedPracticeRetries: Array<(P1CheckedPracticeContent & { retryVariantId: string }) | undefined>;
  skillIds: string[];
}

type P1PrimarySkillStudyContent = Omit<P1SkillStudyContent, 'checkedPracticeRetry'>;

interface AuthoredContentSeed {
  skillId: string;
  goal: string;
  teachingPoints: string[];
  commonError: string;
  workedPrompt: string;
  workedSteps: string[];
  workedAnswer: string;
  practicePrompt: string;
  correct: string;
  distractorA: string;
  distractorB: string;
  hint: string;
  solution: string[];
}

interface ManualContentSeed {
  skillId: string;
  goal: string;
  teachingPoints: string[];
  commonError: string;
  workedPrompt: string;
  workedSteps: string[];
  workedAnswer: string;
  practicePrompt: string;
  hint: string;
  solution: string[];
}

const skillTitleById = new Map(P1_SKILL_CONTRACT.map((skill) => [skill.id, skill.title]));

const OPTION_IDS = ['option-a', 'option-b', 'option-c'] as const;

function deterministicOptions(
  stableId: string,
  correct: string,
  distractorA: string,
  distractorB: string,
): { options: P1CheckedPracticeOption[]; expectedOptionId: P1CheckedPracticeOption['id'] } {
  const correctIndex = Array.from(stableId).reduce((total, character) => total + character.charCodeAt(0), 0) % OPTION_IDS.length;
  const labels = [distractorA, distractorB];
  labels.splice(correctIndex, 0, correct);
  return {
    options: labels.map((label, index) => ({ id: OPTION_IDS[index], label })),
    expectedOptionId: OPTION_IDS[correctIndex],
  };
}

function authored(seed: AuthoredContentSeed): P1PrimarySkillStudyContent {
  const choice = deterministicOptions(seed.skillId, seed.correct, seed.distractorA, seed.distractorB);
  return {
    skillId: seed.skillId,
    learn: {
      title: skillTitleById.get(seed.skillId) ?? seed.skillId,
      learningGoal: seed.goal,
      teachingPoints: seed.teachingPoints,
      commonError: seed.commonError,
      workedExample: {
        prompt: seed.workedPrompt,
        steps: seed.workedSteps,
        answer: seed.workedAnswer,
      },
    },
    checkedPractice: {
      itemId: `p1-cp-${seed.skillId.slice(3)}`,
      prompt: seed.practicePrompt,
      answerType: 'single-choice',
      options: choice.options,
      expectedOptionId: choice.expectedOptionId,
      hint: seed.hint,
      workedSolution: seed.solution,
      progressionEligible: true,
      reviewStatus: 'reviewed',
    },
  };
}

function manualAuthored(seed: ManualContentSeed): P1PrimarySkillStudyContent {
  return {
    skillId: seed.skillId,
    learn: {
      title: skillTitleById.get(seed.skillId) ?? seed.skillId,
      learningGoal: seed.goal,
      teachingPoints: seed.teachingPoints,
      commonError: seed.commonError,
      workedExample: {
        prompt: seed.workedPrompt,
        steps: seed.workedSteps,
        answer: seed.workedAnswer,
      },
    },
    checkedPractice: {
      itemId: `p1-cp-${seed.skillId.slice(3)}`,
      prompt: seed.practicePrompt,
      answerType: 'manual-self-marked',
      options: [],
      expectedOptionId: null,
      hint: seed.hint,
      workedSolution: seed.solution,
      progressionEligible: false,
      reviewStatus: 'reviewed',
    },
  };
}

const P1_PRIMARY_SKILL_STUDY_CONTENT: P1PrimarySkillStudyContent[] = [
  authored({
    skillId: 'p1_quad_complete_square', goal: 'Read the vertex directly from completed-square form.',
    teachingPoints: ['Set the squared bracket to zero to locate the turning-point x-coordinate.', 'Read the remaining constant as the turning-point y-coordinate.'],
    commonError: 'Changing the sign of the bracket shift when reading the vertex.',
    workedPrompt: 'Find the vertex of $y=(x-3)^2+2$.',
    workedSteps: ['$x-3=0$ at the turning point, so $x=3$.', 'The least y-value is 2.'], workedAnswer: '$(3,2)$',
    practicePrompt: 'What is the vertex of $y=(x+2)^2-5$?', correct: '$(-2,-5)$', distractorA: '$(2,-5)$', distractorB: '$(-2,5)$',
    hint: 'Set the squared bracket to zero.', solution: ['$x+2=0$ gives $x=-2$.', 'The minimum y-value is $-5$.'],
  }),
  authored({
    skillId: 'p1_quad_discriminant', goal: 'Classify roots without solving the quadratic.',
    teachingPoints: ['Calculate $D=b^2-4ac$.', 'Use $D>0$, $D=0$ and $D<0$ for two, one repeated, or no real roots.'],
    commonError: 'Using the sign of c instead of the sign of the discriminant.',
    workedPrompt: 'Classify the roots of $2x^2+4x+2=0$.', workedSteps: ['$D=4^2-4(2)(2)=0$.', 'A zero discriminant means one repeated real root.'], workedAnswer: 'One repeated real root',
    practicePrompt: 'How many real roots does $x^2+2x+5=0$ have?', correct: 'No real roots', distractorA: 'One repeated real root', distractorB: 'Two distinct real roots',
    hint: 'Find $2^2-4(1)(5)$.', solution: ['$D=4-20=-16<0$.', 'Therefore there are no real roots.'],
  }),
  authored({
    skillId: 'p1_quad_equations_inequalities', goal: 'Solve quadratic equations and use their roots in sign intervals.',
    teachingPoints: ['Put all terms on one side before solving.', 'For an inequality, test the intervals separated by the roots.'],
    commonError: 'Treating a quadratic inequality as if only the boundary roots were required.',
    workedPrompt: 'Solve $x^2-x-6<0$.', workedSteps: ['Factor: $(x-3)(x+2)<0$.', 'The upward-opening quadratic is negative between its roots.'], workedAnswer: '$-2<x<3$',
    practicePrompt: 'Solve $x^2-5x+6\\ge0$.', correct: '$x\\le2$ or $x\\ge3$', distractorA: '$2\\le x\\le3$', distractorB: '$x<2$ or $x>3$',
    hint: 'Factor and inspect the outside intervals.', solution: ['$(x-2)(x-3)\\ge0$.', 'The expression is non-negative outside the roots, including the roots.'],
  }),
  authored({
    skillId: 'p1_quad_simultaneous', goal: 'Reduce a linear-quadratic pair to one quadratic equation.',
    teachingPoints: ['Rearrange the linear equation for one variable.', 'Back-substitute every resulting root.'],
    commonError: 'Finding x-values but omitting their paired y-values.',
    workedPrompt: 'Solve $y=x+1$ and $x^2+y=7$.', workedSteps: ['Substitute to get $x^2+x-6=0$.', 'So $x=2$ or $x=-3$, giving $y=3$ or $y=-2$.'], workedAnswer: '$(2,3)$ and $(-3,-2)$',
    practicePrompt: 'If $y=2x$ and $x^2+y=3$, which pair is a solution?', correct: '$(1,2)$', distractorA: '$(1,1)$', distractorB: '$(2,4)$',
    hint: 'Substitute $y=2x$.', solution: ['$x^2+2x-3=0=(x-1)(x+3)$.', '$x=1$ gives $y=2$.'],
  }),
  authored({
    skillId: 'p1_quad_substitution_forms', goal: 'Expose a hidden quadratic by naming its repeated expression.',
    teachingPoints: ['Find an expression that appears as both a first and second power.', 'Choose a substitution that turns the equation into $au^2+bu+c=0$.'],
    commonError: 'Choosing only part of the repeated expression.',
    workedPrompt: 'Choose a substitution for $(2x-1)^2-5(2x-1)+4=0$.', workedSteps: ['The complete expression $2x-1$ repeats.', 'Let $u=2x-1$ to obtain $u^2-5u+4=0$.'], workedAnswer: '$u=2x-1$',
    practicePrompt: 'Which substitution simplifies $(x+1)^2-5(x+1)+6=0$?', correct: '$u=x+1$', distractorA: '$u=x^2$', distractorB: '$u=5x$',
    hint: 'Name the repeated bracket.', solution: ['Both terms use $x+1$.', 'Set $u=x+1$ to obtain $u^2-5u+6=0$.'],
  }),
  authored({
    skillId: 'p1_func_language_domain_range', goal: 'Distinguish permitted inputs from produced outputs.',
    teachingPoints: ['The domain is the set of allowed inputs.', 'The range is the set of values the function actually outputs.'],
    commonError: 'Giving the domain when the question asks for the range.',
    workedPrompt: 'Find the domain of $f(x)=1/(x+2)$.', workedSteps: ['The denominator must be non-zero.', '$x+2\\ne0$, so $x\\ne-2$.'], workedAnswer: '$\\mathbb{R}\\setminus\\{-2\\}$',
    practicePrompt: 'What is the domain of $f(x)=1/(x-3)$?', correct: '$x\\ne3$', distractorA: '$x>3$', distractorB: '$x\\ne0$',
    hint: 'A denominator cannot be zero.', solution: ['$x-3\\ne0$.', 'Hence $x\\ne3$.'],
  }),
  authored({
    skillId: 'p1_func_composition', goal: 'Apply the inner function first and preserve validity.',
    teachingPoints: ['$gf(x)$ means $g(f(x))$.', 'The range of f must lie inside the domain of g.'],
    commonError: 'Reversing the order of a composite function.',
    workedPrompt: 'For $f(x)=x+2$ and $g(x)=x^2$, find $gf(x)$.', workedSteps: ['Apply f first: $f(x)=x+2$.', 'Then square: $g(f(x))=(x+2)^2$.'], workedAnswer: '$(x+2)^2$',
    practicePrompt: 'For the same f and g, what is $fg(x)$?', correct: '$x^2+2$', distractorA: '$(x+2)^2$', distractorB: '$2x^2$',
    hint: 'Apply g before f.', solution: ['$g(x)=x^2$.', '$f(g(x))=x^2+2$.'],
  }),
  authored({
    skillId: 'p1_func_one_one_inverse', goal: 'Confirm one-one behaviour before reversing a function.',
    teachingPoints: ['A one-one function gives no output from two different permitted inputs.', 'Write y=f(x), swap x and y, then rearrange.'],
    commonError: 'Writing an inverse for a many-to-one function without restricting its domain.',
    workedPrompt: 'Explain why $f(x)=x^2$ is not one-one for all real x.', workedSteps: ['$f(2)=4$ and $f(-2)=4$.', 'Two permitted inputs produce the same output.'], workedAnswer: 'It is many-one on the real numbers',
    practicePrompt: 'Which restriction makes $f(x)=x^2$ one-one?', correct: '$x\\ge0$', distractorA: 'All real x', distractorB: '$x\\ne0$',
    hint: 'Choose one side of the parabola.', solution: ['On $x\\ge0$, the function is increasing.', 'Each range value then has only one input.'],
  }),
  authored({
    skillId: 'p1_func_inverse_graphs', goal: 'Reflect a one-one function graph across y=x.',
    teachingPoints: ['Every point $(a,b)$ becomes $(b,a)$.', 'The domain and range exchange roles.'],
    commonError: 'Reflecting in an axis instead of in the line y=x.',
    workedPrompt: 'A graph of f contains $(2,5)$. Give the corresponding point on $f^{-1}$.', workedSteps: ['Inverse functions swap inputs and outputs.', 'Swap the coordinates.'], workedAnswer: '$(5,2)$',
    practicePrompt: 'Which line is the mirror line between f and $f^{-1}$?', correct: '$y=x$', distractorA: '$y=-x$', distractorB: '$x=0$',
    hint: 'The reflection swaps coordinates.', solution: ['Points on $y=x$ are unchanged when coordinates swap.', 'So $y=x$ is the mirror line.'],
  }),
  authored({
    skillId: 'p1_func_transformations', goal: 'Predict a graph transformation from its algebraic form.',
    teachingPoints: ['Changes outside f act directly on y-values.', 'Changes inside f act oppositely on x-location and may rescale horizontally.'],
    commonError: 'Moving $f(x+a)$ right instead of left.',
    workedPrompt: 'Describe the change from $y=f(x)$ to $y=3f(x)$.', workedSteps: ['Every output value is multiplied by 3.', 'Horizontal positions are unchanged.'], workedAnswer: 'Vertical stretch factor 3',
    practicePrompt: 'What does $y=f(2x)$ do horizontally?', correct: 'Stretch factor $1/2$', distractorA: 'Stretch factor 2', distractorB: 'Translate right 2',
    hint: 'A point formerly at x appears when $2x$ equals that old input.', solution: ['New x is old x divided by 2.', 'The graph is compressed horizontally by factor 2, i.e. stretch factor $1/2$.'],
  }),
  authored({
    skillId: 'p1_coord_line_equations', goal: 'Build a line equation from a point and gradient.',
    teachingPoints: ['Use $y-y_1=m(x-x_1)$.', 'Rearrange only after substituting the known point and gradient.'],
    commonError: 'Substituting the point with reversed signs.',
    workedPrompt: 'Find the line through $(2,3)$ with gradient 4.', workedSteps: ['$y-3=4(x-2)$.', 'Expand to get $y=4x-5$.'], workedAnswer: '$y=4x-5$',
    practicePrompt: 'Which line passes through $(1,-2)$ with gradient 3?', correct: '$y=3x-5$', distractorA: '$y=3x+1$', distractorB: '$y=-3x+1$',
    hint: 'Use $y+2=3(x-1)$.', solution: ['$y+2=3x-3$.', 'Therefore $y=3x-5$.'],
  }),
  authored({
    skillId: 'p1_coord_line_relationships', goal: 'Use coordinate formulae and gradient relationships.',
    teachingPoints: ['Average the x-coordinates.', 'Average the y-coordinates separately.'],
    commonError: 'Adding coordinates but forgetting to divide each total by 2.',
    workedPrompt: 'Find the midpoint of $(-2,5)$ and $(4,1)$.', workedSteps: ['The x-coordinate is $(-2+4)/2=1$.', 'The y-coordinate is $(5+1)/2=3$.'], workedAnswer: '$(1,3)$',
    practicePrompt: 'What is the midpoint of $(2,5)$ and $(8,-1)$?', correct: '$(5,2)$', distractorA: '$(10,4)$', distractorB: '$(3,-3)$',
    hint: 'Average the x-coordinates and y-coordinates separately.', solution: ['$(2+8)/2=5$.', '$(5-1)/2=2$.'],
  }),
  authored({
    skillId: 'p1_coord_circle_equations', goal: 'Read a circle centre and radius from its equation.',
    teachingPoints: ['In $(x-a)^2+(y-b)^2=r^2$, the centre is $(a,b)$.', 'Complete both squares when converting an expanded equation.'],
    commonError: 'Reading the signs inside the brackets without reversing them.',
    workedPrompt: 'Find the centre and radius of $(x-2)^2+(y+1)^2=16$.', workedSteps: ['The bracket shifts give centre $(2,-1)$.', '$r^2=16$, so $r=4$.'], workedAnswer: 'Centre $(2,-1)$, radius 4',
    practicePrompt: 'What is the centre of $x^2+y^2+6x-4y=0$?', correct: '$(-3,2)$', distractorA: '$(3,-2)$', distractorB: '$(-6,4)$',
    hint: 'Complete the squares.', solution: ['$x^2+6x=(x+3)^2-9$.', '$y^2-4y=(y-2)^2-4$, so the centre is $(-3,2)$.'],
  }),
  authored({
    skillId: 'p1_coord_line_circle_problems', goal: 'Recognise tangency through a repeated algebraic intersection.',
    teachingPoints: ['Substitute the line into the circle.', 'A tangent produces one repeated root, so the resulting discriminant is zero.'],
    commonError: 'Treating a tangent as two distinct intersections.',
    workedPrompt: 'What discriminant condition shows that a line is tangent to a circle?', workedSteps: ['A tangent meets the circle at one repeated point.', 'A repeated quadratic root has discriminant zero.'], workedAnswer: '$D=0$',
    practicePrompt: 'How many intersections does a tangent line have with a circle?', correct: 'One repeated intersection', distractorA: 'No intersections', distractorB: 'Two distinct intersections',
    hint: 'A tangent touches at exactly one point.', solution: ['Substitution produces a quadratic.', 'Tangency gives discriminant zero and one repeated intersection.'],
  }),
  authored({
    skillId: 'p1_coord_graph_intersections', goal: 'Translate graph contact into a root condition.',
    teachingPoints: ['Equate graph equations to form one equation.', 'Use the discriminant to distinguish crossing, touching and missing.'],
    commonError: 'Applying the discriminant before reducing to one quadratic variable.',
    workedPrompt: 'What discriminant condition means a line touches a quadratic curve?', workedSteps: ['Touching produces one shared point.', 'The resulting quadratic has one repeated root.'], workedAnswer: '$D=0$',
    practicePrompt: 'What condition means two graphs do not meet in real coordinates?', correct: '$D<0$', distractorA: '$D=0$', distractorB: '$D>0$',
    hint: 'No intersection means no real roots.', solution: ['Equating the graphs produces a quadratic.', 'No real roots corresponds to $D<0$.'],
  }),
  authored({
    skillId: 'p1_circ_radians_degrees', goal: 'Convert angles and recognise radian measure.',
    teachingPoints: ['$\\pi$ radians equals 180 degrees.', 'Multiply degrees by $\\pi/180$ to convert to radians.'],
    commonError: 'Using degree values directly in radian-only formulae.',
    workedPrompt: 'Convert $150^\\circ$ to radians.', workedSteps: ['$150\\times\\pi/180$.', 'Simplify by dividing by 30.'], workedAnswer: '$5\\pi/6$',
    practicePrompt: 'Convert $2\\pi/3$ radians to degrees.', correct: '$120^\\circ$', distractorA: '$60^\\circ$', distractorB: '$240^\\circ$',
    hint: 'Multiply by $180/\\pi$.', solution: ['$2\\pi/3\\times180/\\pi$.', 'This equals $120^\\circ$.'],
  }),
  authored({
    skillId: 'p1_circ_arc_sector', goal: 'Use radian formulae for arcs and sectors.',
    teachingPoints: ['Use $s=r\\theta$.', 'Use $A=\\frac12r^2\\theta$.'],
    commonError: 'Forgetting to square the radius in sector area.',
    workedPrompt: 'Find the sector area for $r=6$ and $\\theta=\\pi/3$.', workedSteps: ['$A=\\frac12r^2\\theta$.', '$A=\\frac12(36)(\\pi/3)=6\\pi$.'], workedAnswer: '$6\\pi$',
    practicePrompt: 'Find the sector area for $r=4$ and $\\theta=\\pi/2$.', correct: '$4\\pi$', distractorA: '$2\\pi$', distractorB: '$8\\pi$',
    hint: 'Use one half times radius squared times angle.', solution: ['$A=\\frac12(4^2)(\\pi/2)$.', 'So $A=4\\pi$.'],
  }),
  authored({
    skillId: 'p1_circ_composite_geometry', goal: 'Assemble a complete perimeter from curved and straight pieces.',
    teachingPoints: ['Trace the exposed boundary once.', 'Include every arc, radius or chord on that boundary.'],
    commonError: 'Counting only the curved edge in a perimeter.',
    workedPrompt: 'What pieces form the perimeter of a simple sector?', workedSteps: ['Trace its curved arc.', 'Then include both straight radii.'], workedAnswer: 'Arc length plus two radii',
    practicePrompt: 'A sector perimeter contains which lengths?', correct: 'Arc plus two radii', distractorA: 'Arc only', distractorB: 'Two radii only',
    hint: 'Trace the full boundary.', solution: ['The curved boundary is the arc.', 'The two straight boundaries are radii.'],
  }),
  authored({
    skillId: 'p1_trig_graphs', goal: 'Read amplitude, period and asymptote information from a trigonometric formula.',
    teachingPoints: ['Amplitude applies to sine and cosine.', 'Tangent has asymptotes and period $\\pi$.'],
    commonError: 'Giving tangent a maximum and minimum like sine.',
    workedPrompt: 'State the amplitude and period of $y=3\\sin 2x$.', workedSteps: ['The outside factor gives amplitude 3.', 'The factor 2 inside gives period $2\\pi/2=\\pi$.'], workedAnswer: 'Amplitude 3, period $\\pi$',
    practicePrompt: 'What is the period of $y=\\cos 3x$?', correct: '$2\\pi/3$', distractorA: '$3\\pi$', distractorB: '$\\pi/3$',
    hint: 'Divide the ordinary period by the coefficient of x.', solution: ['Cosine has ordinary period $2\\pi$.', 'Therefore the new period is $2\\pi/3$.'],
  }),
  authored({
    skillId: 'p1_trig_exact_values', goal: 'Use reference angles and quadrant signs for exact values.',
    teachingPoints: ['Recall exact values at 30, 45 and 60 degrees.', 'Apply the sign from the angle quadrant.'],
    commonError: 'Using the right reference angle with the wrong sign.',
    workedPrompt: 'Find the exact value of $\\cos150^\\circ$.', workedSteps: ['The reference angle is $30^\\circ$.', 'Cosine is negative in quadrant II.'], workedAnswer: '$-\\sqrt3/2$',
    practicePrompt: 'What is $\\sin225^\\circ$?', correct: '$-\\sqrt2/2$', distractorA: '$\\sqrt2/2$', distractorB: '$-\\sqrt3/2$',
    hint: 'Use a 45-degree reference angle in quadrant III.', solution: ['Sine is negative in quadrant III.', '$\\sin45^\\circ=\\sqrt2/2$.'],
  }),
  authored({
    skillId: 'p1_trig_inverse_principal', goal: 'Use an inverse-trigonometric result as the first angle, not the complete solution.',
    teachingPoints: ['$\\sin^{-1}$ means the principal inverse relation, not $1/\\sin$.', 'Use graph or quadrant symmetry for other interval solutions.'],
    commonError: 'Reporting only the calculator principal value.',
    workedPrompt: 'Find the principal value of $\\sin^{-1}(1/2)$ in degrees.', workedSteps: ['$\\sin30^\\circ=1/2$.', 'The principal sine value is $30^\\circ$.'], workedAnswer: '$30^\\circ$',
    practicePrompt: 'What is the principal value of $\\cos^{-1}(-1)$?', correct: '$180^\\circ$', distractorA: '$0^\\circ$', distractorB: '$360^\\circ$',
    hint: 'Use the standard principal range for inverse cosine.', solution: ['$\\cos180^\\circ=-1$.', 'The principal value is $180^\\circ$.'],
  }),
  authored({
    skillId: 'p1_trig_identities', goal: 'Select a basic identity that moves an expression toward the target form.',
    teachingPoints: ['Use $\\tan x=\\sin x/\\cos x$.', 'Use $\\sin^2x+\\cos^2x=1$.'],
    commonError: 'Cancelling terms across an addition sign.',
    workedPrompt: 'Simplify $(1-\\sin^2x)/\\cos x$.', workedSteps: ['$1-\\sin^2x=\\cos^2x$.', '$\\cos^2x/\\cos x=\\cos x$ where defined.'], workedAnswer: '$\\cos x$',
    practicePrompt: 'Which expression equals $\\tan x\\cos x$?', correct: '$\\sin x$', distractorA: '$\\cos x$', distractorB: '$1$',
    hint: 'Replace tangent with sine over cosine.', solution: ['$\\tan x\\cos x=(\\sin x/\\cos x)\\cos x$.', 'This simplifies to $\\sin x$.'],
  }),
  authored({
    skillId: 'p1_trig_equations_intervals', goal: 'Generate every trigonometric solution inside the stated interval.',
    teachingPoints: ['Find a principal/reference angle.', 'Use signs and periodicity, then filter by the endpoints.'],
    commonError: 'Giving only one angle when two lie in the interval.',
    workedPrompt: 'Solve $\\sin x=1/2$ for $0^\\circ\\le x\\le360^\\circ$.', workedSteps: ['The reference angle is $30^\\circ$.', 'Sine is positive in quadrants I and II.'], workedAnswer: '$x=30^\\circ,150^\\circ$',
    practicePrompt: 'Solve $\\cos x=-1$ for $0^\\circ\\le x\\le360^\\circ$.', correct: '$x=180^\\circ$', distractorA: '$x=0^\\circ,360^\\circ$', distractorB: '$x=90^\\circ,270^\\circ$',
    hint: 'Look at the cosine graph or unit circle.', solution: ['Cosine is -1 on the negative x-axis.', 'The only solution in the interval is $180^\\circ$.'],
  }),
  authored({
    skillId: 'p1_series_binomial', goal: 'Select the required term from a positive-integer binomial expansion.',
    teachingPoints: ['Use $\\binom nr a^{n-r}b^r$.', 'Match the resulting power before doing unnecessary expansion.'],
    commonError: 'Confusing term number with the power of x.',
    workedPrompt: 'Find the coefficient of x in $(1+2x)^4$.', workedSteps: ['The x-term uses $r=1$.', '$\\binom41(2x)=8x$.'], workedAnswer: '8',
    practicePrompt: 'What is the coefficient of $x^2$ in $(1+x)^5$?', correct: '10', distractorA: '5', distractorB: '20',
    hint: 'Use the binomial coefficient with r=2.', solution: ['$\\binom52=10$.', 'The coefficient of $x^2$ is 10.'],
  }),
  authored({
    skillId: 'p1_series_progression_recognition', goal: 'Identify a progression by its invariant difference or ratio.',
    teachingPoints: ['Arithmetic progressions have constant difference.', 'Geometric progressions have constant non-zero ratio.'],
    commonError: 'Calling a sequence geometric because its differences change regularly.',
    workedPrompt: 'Classify $3,6,12,24,\\ldots$.', workedSteps: ['Each term is multiplied by 2.', 'The common ratio is 2.'], workedAnswer: 'Geometric progression',
    practicePrompt: 'Classify $7,11,15,19,\\ldots$.', correct: 'Arithmetic, difference 4', distractorA: 'Geometric, ratio 4', distractorB: 'Neither',
    hint: 'Subtract consecutive terms.', solution: ['$11-7=4$ and $15-11=4$.', 'The difference is constant.'],
  }),
  authored({
    skillId: 'p1_series_finite_sums', goal: 'Choose between a term formula and a finite-sum formula.',
    teachingPoints: ['Identify a, d and n before choosing an arithmetic sum formula.', 'Use the first and last term form when the last term is already known.'],
    commonError: 'Calculating the nth term but not the requested total.',
    workedPrompt: 'Find the sum of the first 10 terms of $4,7,10,\\ldots$.', workedSteps: ['$a=4$, $d=3$ and $u_{10}=31$.', '$S_{10}=10(4+31)/2=175$.'], workedAnswer: '175',
    practicePrompt: 'Find the sum of the first 5 terms of $2,5,8,\\ldots$.', correct: '40', distractorA: '14', distractorB: '35',
    hint: 'List five terms or use the arithmetic sum formula.', solution: ['The terms are $2,5,8,11,14$.', 'Their sum is 40.'],
  }),
  authored({
    skillId: 'p1_series_geometric_infinity', goal: 'Check whether an infinite geometric progression converges.',
    teachingPoints: ['Find the signed common ratio.', 'Convergence requires $|r|<1$.'],
    commonError: 'Assuming every geometric progression has a sum to infinity.',
    workedPrompt: 'Does $6+3+1.5+\\cdots$ converge?', workedSteps: ['The common ratio is $1/2$.', 'Its magnitude is less than 1.'], workedAnswer: 'Yes',
    practicePrompt: 'Does $2-3+4.5-\\cdots$ have a sum to infinity?', correct: 'No, because $|r|=1.5$', distractorA: 'Yes, equal to $4/5$', distractorB: 'Yes, equal to $-1$',
    hint: 'Find the common ratio and test its magnitude.', solution: ['$r=-3/2$.', 'Since $|r|>1$, the progression does not converge.'],
  }),
  authored({
    skillId: 'p1_diff_gradient_limit_notation', goal: 'Interpret first and second derivatives as information about a curve.',
    teachingPoints: ['The first derivative gives instantaneous gradient.', 'The second derivative describes how the gradient changes.'],
    commonError: 'Treating the second derivative as the square of the first derivative.',
    workedPrompt: 'What does $f^{\\prime}(2)=5$ say geometrically?', workedSteps: ['The derivative is the tangent gradient.', 'At x=2, that gradient is 5.'], workedAnswer: 'The tangent at x=2 has gradient 5',
    practicePrompt: 'Which notation is a second derivative?', correct: '$d^2y/dx^2$', distractorA: '$(dy/dx)^2$', distractorB: '$dy/dx$',
    hint: 'Look for the derivative being taken twice.', solution: ['$d^2y/dx^2$ is standard second-derivative notation.', 'It is not the square of $dy/dx$.'],
  }),
  authored({
    skillId: 'p1_diff_power_chain', goal: 'Differentiate powers and simple composites accurately.',
    teachingPoints: ['For $x^n$, multiply by n and reduce the power by one.', 'For a composite, multiply by the inner derivative.'],
    commonError: 'Applying the outer derivative but omitting the inner derivative.',
    workedPrompt: 'Differentiate $5x^{3/2}-2x^{-1}$.', workedSteps: ['The first term gives $\\frac{15}{2}x^{1/2}$.', 'The second term gives $+2x^{-2}$.'], workedAnswer: '$\\frac{15}{2}x^{1/2}+2x^{-2}$',
    practicePrompt: 'Differentiate $3x^{1/2}$.', correct: '$\\frac32x^{-1/2}$', distractorA: '$3x^{-1/2}$', distractorB: '$\\frac12x^{-1/2}$',
    hint: 'Multiply by the power one half.', solution: ['$3\\times\\frac12=\\frac32$.', 'Reduce the power to $-1/2$.'],
  }),
  authored({
    skillId: 'p1_diff_tangent_normal', goal: 'Turn a derivative value into a line equation.',
    teachingPoints: ['Evaluate the derivative at the stated point.', 'For the normal, use the negative reciprocal gradient.'],
    commonError: 'Finding the gradient but not writing the requested equation.',
    workedPrompt: 'Find the normal gradient to $y=x^2$ at x=2.', workedSteps: ['$dy/dx=2x$, so the tangent gradient is 4.', 'The normal gradient is the negative reciprocal.'], workedAnswer: '$-1/4$',
    practicePrompt: 'What is the normal gradient to $y=x^2$ at x=1?', correct: '$-1/2$', distractorA: '2', distractorB: '$1/2$',
    hint: 'First find the tangent gradient.', solution: ['At x=1, the tangent gradient is 2.', 'The normal gradient is the negative reciprocal, $-1/2$.'],
  }),
  authored({
    skillId: 'p1_diff_increasing_decreasing', goal: 'Use derivative signs to describe curve direction.',
    teachingPoints: ['$f^{\\prime}(x)>0$ means increasing.', '$f^{\\prime}(x)<0$ means decreasing.'],
    commonError: 'Using the sign of f(x) instead of the sign of its derivative.',
    workedPrompt: 'For $f^{\\prime}(x)=2x-4$, where is f increasing?', workedSteps: ['Solve $2x-4>0$.', 'This gives $x>2$.'], workedAnswer: '$x>2$',
    practicePrompt: 'For $f^{\\prime}(x)=6-3x$, where is f decreasing?', correct: '$x>2$', distractorA: '$x<2$', distractorB: '$x>6$',
    hint: 'Solve $6-3x<0$.', solution: ['$-3x<-6$.', 'Dividing by -3 reverses the inequality, so $x>2$.'],
  }),
  authored({
    skillId: 'p1_diff_connected_rates', goal: 'Link two changing quantities through one differentiated relation.',
    teachingPoints: ['Differentiate the geometric or algebraic relation with respect to time.', 'Keep units attached to the final rate.'],
    commonError: 'Substituting values before differentiating and turning a variable into a constant.',
    workedPrompt: 'A circle radius grows at 2 cm/s. Find $dA/dt$ when r=3 cm.', workedSteps: ['$A=\\pi r^2$ gives $dA/dt=2\\pi r\\,dr/dt$.', 'Substitute r=3 and $dr/dt=2$.'], workedAnswer: '$12\\pi\\text{ cm}^2/\\text{s}$',
    practicePrompt: 'If $V=x^3$ and $dx/dt=4$, what is $dV/dt$ when x=2?', correct: '48', distractorA: '12', distractorB: '32',
    hint: 'Differentiate V with respect to x, then multiply by $dx/dt$.', solution: ['$dV/dt=3x^2\\,dx/dt$.', 'At x=2 this is $3(4)(4)=48$.'],
  }),
  authored({
    skillId: 'p1_diff_stationary_classification', goal: 'Locate zero-gradient points and classify their nature.',
    teachingPoints: ['Solve $f^{\\prime}(x)=0$.', 'A positive second derivative gives a local minimum; negative gives a local maximum.'],
    commonError: 'Setting the second derivative to zero to locate every stationary point.',
    workedPrompt: 'Classify a stationary point where $f^{\\prime}(a)=0$ and $f^{\\prime\\prime}(a)=2$.', workedSteps: ['The zero first derivative confirms a stationary point.', 'The positive second derivative gives a local minimum.'], workedAnswer: 'Local minimum',
    practicePrompt: 'If $f^{\\prime}(a)=0$ and $f^{\\prime\\prime}(a)=-3$, what is the stationary point?', correct: 'A local maximum', distractorA: 'A local minimum', distractorB: 'Not stationary',
    hint: 'Use the sign of the second derivative.', solution: ['The first derivative confirms stationarity.', 'The negative second derivative confirms a local maximum.'],
  }),
  authored({
    skillId: 'p1_int_reverse_power', goal: 'Reverse the power and chain rules for simple integrands.',
    teachingPoints: ['Increase a power by one and divide by the new power.', 'For $(ax+b)^n$, also divide by a.'],
    commonError: 'Forgetting the coefficient from the inner linear expression.',
    workedPrompt: 'Integrate $6x^2-4x$.', workedSteps: ['$\\int6x^2\\,dx=2x^3$.', '$\\int-4x\\,dx=-2x^2$ and include one constant.'], workedAnswer: '$2x^3-2x^2+C$',
    practicePrompt: 'Integrate $4x^3$.', correct: '$x^4+C$', distractorA: '$12x^2+C$', distractorB: '$4x^4+C$',
    hint: 'Increase the power from 3 to 4.', solution: ['$\\int4x^3dx=4x^4/4$.', 'Therefore the result is $x^4+C$.'],
  }),
  authored({
    skillId: 'p1_int_constant', goal: 'Use a known point to finish an indefinite integration problem.',
    teachingPoints: ['Write +C before applying the condition.', 'Substitute both coordinates into the general equation.'],
    commonError: 'Dropping the integration constant before using the given point.',
    workedPrompt: 'Given $dy/dx=2x$ and y=5 when x=2, find y.', workedSteps: ['$y=x^2+C$.', '$5=4+C$, so $C=1$.'], workedAnswer: '$y=x^2+1$',
    practicePrompt: 'If $dy/dx=3x^2$ and the curve passes through $(1,4)$, find C in $y=x^3+C$.', correct: '3', distractorA: '4', distractorB: '1',
    hint: 'Substitute x=1 and y=4.', solution: ['$4=1^3+C$.', 'Hence $C=3$.'],
  }),
  authored({
    skillId: 'p1_int_definite', goal: 'Evaluate an antiderivative at two bounds in the correct order.',
    teachingPoints: ['Use $F(b)-F(a)$.', 'Keep substitution values inside brackets, especially when they are negative.'],
    commonError: 'Subtracting upper from lower or omitting brackets around a negative value.',
    workedPrompt: 'Evaluate $\\int_1^3 2x\\,dx$.', workedSteps: ['An antiderivative is $x^2$.', '$3^2-1^2=8$.'], workedAnswer: '8',
    practicePrompt: 'Evaluate $\\int_0^2 3x^2\\,dx$.', correct: '8', distractorA: '12', distractorB: '4',
    hint: 'An antiderivative is $x^3$.', solution: ['Use $[x^3]_0^2$.', '$2^3-0^3=8$.'],
  }),
  authored({
    skillId: 'p1_int_areas', goal: 'Build a non-negative geometric area from definite integrals.',
    teachingPoints: ['Use upper curve minus lower curve.', 'Split where the order changes or a graph crosses the axis.'],
    commonError: 'Accepting a negative definite integral as a negative area.',
    workedPrompt: 'Find the area under $y=x$ from x=0 to x=2.', workedSteps: ['$\\int_0^2x\\,dx=[x^2/2]_0^2$.', 'The result is 2.'], workedAnswer: '2 square units',
    practicePrompt: 'Which integrand gives the area between $y=5$ and $y=x^2$ where $5\\ge x^2$?', correct: '$5-x^2$', distractorA: '$x^2-5$', distractorB: '$5+x^2$',
    hint: 'Use top curve minus bottom curve.', solution: ['The line y=5 is above the parabola in the stated region.', 'So the vertical height is $5-x^2$.'],
  }),
  authored({
    skillId: 'p1_int_volumes', goal: 'Choose the radius from the axis of rotation and integrate its square.',
    teachingPoints: ['A disk volume uses $\\pi\\int r^2$.', 'A washer uses outer radius squared minus inner radius squared.'],
    commonError: 'Using y rather than $y^2$ for rotation about the x-axis.',
    workedPrompt: 'Rotate the region under $y=x$ from x=0 to x=1 about the x-axis.', workedSteps: ['$V=\\pi\\int_0^1x^2dx$.', '$V=\\pi[x^3/3]_0^1$.'], workedAnswer: '$\\pi/3$',
    practicePrompt: 'For rotation about the x-axis, which integrand uses curve $y=f(x)$?', correct: '$\\pi[f(x)]^2$', distractorA: '$2\\pi f(x)$', distractorB: '$\\pi f(x)$',
    hint: 'Each slice is a circular disk.', solution: ['A disk of radius f(x) has area $\\pi[f(x)]^2$.', 'Integrating those areas gives the volume.'],
  }),
  authored({
    skillId: 'p1_quad_complete_square_rewrite', goal: 'Rewrite a quadratic in completed-square form.',
    teachingPoints: ['Factor out a non-unit leading coefficient first.', 'Balance the square created inside the bracket with the outside constant.'],
    commonError: 'Forgetting that a correction inside a factored bracket is multiplied by the leading coefficient.',
    workedPrompt: 'Write $x^2+8x+3$ in completed-square form.', workedSteps: ['$x^2+8x=(x+4)^2-16$.', 'Add 3 to obtain $(x+4)^2-13$.'], workedAnswer: '$(x+4)^2-13$',
    practicePrompt: 'Write $x^2-10x+7$ in completed-square form.', correct: '$(x-5)^2-18$', distractorA: '$(x-5)^2+18$', distractorB: '$(x-10)^2-93$',
    hint: 'Half the coefficient of x before squaring.', solution: ['$x^2-10x=(x-5)^2-25$.', 'Adding 7 gives $(x-5)^2-18$.'],
  }),
  authored({
    skillId: 'p1_quad_solve_equations', goal: 'Solve a quadratic equation and retain every valid root.',
    teachingPoints: ['Put the equation equal to zero.', 'Factorise when possible; otherwise use completed square or the quadratic formula.'],
    commonError: 'Stopping after finding only one factor root.',
    workedPrompt: 'Solve $x^2+x-12=0$.', workedSteps: ['Factor to $(x+4)(x-3)=0$.', 'Set each factor to zero.'], workedAnswer: '$x=-4$ or $x=3$',
    practicePrompt: 'Solve $2x^2-5x-3=0$.', correct: '$x=3$ or $x=-1/2$', distractorA: '$x=-3$ or $x=1/2$', distractorB: '$x=3$ only',
    hint: 'Factor using numbers with product -6 and sum -5.', solution: ['$(2x+1)(x-3)=0$.', 'Hence $x=-1/2$ or $x=3$.'],
  }),
  authored({
    skillId: 'p1_func_ranges', goal: 'Determine the complete set of possible outputs.',
    teachingPoints: ['Use the graph shape or an algebraic bound.', 'Apply any stated input-domain restriction before giving the range.'],
    commonError: 'Repeating the domain instead of finding output values.',
    workedPrompt: 'Find the range of $f(x)=(x-2)^2+3$ for real x.', workedSteps: ['A square is non-negative.', 'The least output is therefore 3.'], workedAnswer: '$[3,\\infty)$',
    practicePrompt: 'Find the range of $f(x)=5-x^2$ for real x.', correct: '$(-\\infty,5]$', distractorA: '$[5,\\infty)$', distractorB: '$(-\\infty,0]$',
    hint: 'The term $-x^2$ is never positive.', solution: ['$-x^2\\le0$.', 'So the greatest output is 5 and all smaller outputs occur.'],
  }),
  authored({
    skillId: 'p1_func_inverse_formula', goal: 'Reverse a one-one function algebraically.',
    teachingPoints: ['Write y=f(x) and make x the subject.', 'Swap the input-output labels only after rearranging.'],
    commonError: 'Taking a reciprocal instead of finding an inverse function.',
    workedPrompt: 'Find the inverse of $f(x)=4x-7$.', workedSteps: ['$y=4x-7$ gives $x=(y+7)/4$.', 'Exchange labels.'], workedAnswer: '$f^{-1}(x)=(x+7)/4$',
    practicePrompt: 'Find the inverse of $f(x)=(x-1)/3$.', correct: '$f^{-1}(x)=3x+1$', distractorA: '$f^{-1}(x)=1/(3x-1)$', distractorB: '$f^{-1}(x)=(x+1)/3$',
    hint: 'Solve $y=(x-1)/3$ for x.', solution: ['$3y=x-1$, so $x=3y+1$.', 'Therefore $f^{-1}(x)=3x+1$.'],
  }),
  manualAuthored({
    skillId: 'p1_func_inverse_graph_sketch', goal: 'Produce a complete inverse graph by reflection in y=x.',
    teachingPoints: ['Swap the coordinates of every key point.', 'Reflect endpoints, intercepts and asymptotes, not just the curve shape.'],
    commonError: 'Reflecting in an axis or sketching an unrestricted many-one inverse.',
    workedPrompt: 'Describe how to sketch the inverse of a one-one graph through $(0,2)$ and $(3,5)$.', workedSteps: ['Draw the mirror line $y=x$.', 'Transfer the key points to $(2,0)$ and $(5,3)$ and reflect the connecting shape.'], workedAnswer: 'A reflection of the permitted graph in $y=x$',
    practicePrompt: 'On paper, sketch the inverse of $y=(x-1)^2$ for $x\\ge1$, marking its endpoint and mirror line.',
    hint: 'First reflect the endpoint $(1,0)$ and one further point such as $(2,1)$.', solution: ['The reflected endpoint is $(0,1)$ and the graph lies on $y\\ge1$.', 'It has equation $y=1+\\sqrt{x}$ for $x\\ge0$; compare your complete sketch manually.'],
  }),
  authored({
    skillId: 'p1_func_transform_translate_reflect', goal: 'Identify translations and reflections from function notation.',
    teachingPoints: ['$f(x)+a$ moves vertically by a.', '$f(x-a)$ moves right by a, while minus signs create reflections.'],
    commonError: 'Moving $f(x+a)$ right instead of left.',
    workedPrompt: 'Describe $y=-f(x-2)$.', workedSteps: ['$x-2$ moves the graph 2 units right.', 'The outside minus reflects it in the x-axis.'], workedAnswer: 'Right 2, then reflect in the x-axis',
    practicePrompt: 'What transforms $y=f(x)$ into $y=f(-x)+3$?', correct: 'Reflect in the y-axis, then translate up 3', distractorA: 'Reflect in the x-axis, then translate right 3', distractorB: 'Translate left 3 only',
    hint: 'The sign change is inside f; the addition is outside.', solution: ['$f(-x)$ reflects in the y-axis.', 'Adding 3 moves every output upward by 3.'],
  }),
  authored({
    skillId: 'p1_coord_distance', goal: 'Calculate a coordinate distance exactly.',
    teachingPoints: ['Find the horizontal and vertical differences.', 'Apply Pythagoras and simplify the resulting square root.'],
    commonError: 'Adding coordinate differences without squaring them.',
    workedPrompt: 'Find the distance between $(1,2)$ and $(4,6)$.', workedSteps: ['The differences are 3 and 4.', 'The distance is $\\sqrt{3^2+4^2}=5$.'], workedAnswer: '5',
    practicePrompt: 'Find the distance between $(-1,3)$ and $(5,11)$.', correct: '10', distractorA: '14', distractorB: '$\\sqrt{10}$',
    hint: 'The coordinate differences are 6 and 8.', solution: ['$d=\\sqrt{6^2+8^2}$.', '$d=\\sqrt{100}=10$.'],
  }),
  authored({
    skillId: 'p1_coord_parallel_perpendicular', goal: 'Choose a gradient from a parallel or perpendicular condition.',
    teachingPoints: ['Parallel lines share a gradient.', 'Perpendicular non-vertical gradients are negative reciprocals.'],
    commonError: 'Negating a gradient without taking its reciprocal.',
    workedPrompt: 'Find the gradient perpendicular to a line of gradient 3.', workedSteps: ['Let the new gradient be m.', '$3m=-1$.'], workedAnswer: '$m=-1/3$',
    practicePrompt: 'What gradient is perpendicular to $m=-2/5$?', correct: '$5/2$', distractorA: '$-5/2$', distractorB: '$2/5$',
    hint: 'The product of the two gradients is -1.', solution: ['$(-2/5)m=-1$.', 'Therefore $m=5/2$.'],
  }),
  authored({
    skillId: 'p1_coord_line_intersections', goal: 'Solve two line equations for their shared point.',
    teachingPoints: ['Equate expressions for the same coordinate.', 'Substitute the result back to obtain the other coordinate.'],
    commonError: 'Reporting only the x-coordinate.',
    workedPrompt: 'Find where $y=2x+1$ meets $y=7-x$.', workedSteps: ['$2x+1=7-x$ gives $x=2$.', 'Then $y=5$.'], workedAnswer: '$(2,5)$',
    practicePrompt: 'Find where $y=3x-2$ meets $y=x+4$.', correct: '$(3,7)$', distractorA: '$(2,4)$', distractorB: '$(3,5)$',
    hint: 'Set $3x-2=x+4$.', solution: ['$2x=6$, so $x=3$.', 'Substitution gives $y=7$.'],
  }),
  authored({
    skillId: 'p1_coord_circle_standard_form', goal: 'Write a circle equation from centre and radius data.',
    teachingPoints: ['Use $(x-a)^2+(y-b)^2=r^2$.', 'Reverse neither centre coordinate when substituting into a and b.'],
    commonError: 'Writing r rather than $r^2$ on the right.',
    workedPrompt: 'Form the circle with centre $(2,-3)$ and radius 4.', workedSteps: ['The brackets are $(x-2)$ and $(y+3)$.', '$r^2=16$.'], workedAnswer: '$(x-2)^2+(y+3)^2=16$',
    practicePrompt: 'Which equation has centre $(-1,5)$ and radius 3?', correct: '$(x+1)^2+(y-5)^2=9$', distractorA: '$(x-1)^2+(y+5)^2=9$', distractorB: '$(x+1)^2+(y-5)^2=3$',
    hint: 'Reverse the centre-coordinate signs inside the brackets.', solution: ['Centre $(-1,5)$ gives $(x+1)$ and $(y-5)$.', 'Radius 3 gives right side 9.'],
  }),
  authored({
    skillId: 'p1_coord_line_circle_intersections', goal: 'Find every coordinate where a line meets a circle.',
    teachingPoints: ['Substitute the line into the circle to get one quadratic.', 'Back-substitute each root into the line.'],
    commonError: 'Giving x-roots without their paired y-coordinates.',
    workedPrompt: 'Find where $y=0$ meets $x^2+y^2=4$.', workedSteps: ['$x^2=4$, so $x=\\pm2$.', 'In both cases y=0.'], workedAnswer: '$(-2,0)$ and $(2,0)$',
    practicePrompt: 'Where does $y=x$ meet $x^2+y^2=8$?', correct: '$(-2,-2)$ and $(2,2)$', distractorA: '$(-4,-4)$ and $(4,4)$', distractorB: '$(2,-2)$ and $(-2,2)$',
    hint: 'Replace y by x in the circle equation.', solution: ['$2x^2=8$, so $x=\\pm2$.', 'Since y=x, the two points are $(-2,-2)$ and $(2,2)$.'],
  }),
  authored({
    skillId: 'p1_circ_arc_length', goal: 'Use radian measure to find an arc length.',
    teachingPoints: ['Use $s=r\\theta$ only when theta is in radians.', 'Rearrange before substituting when an unknown is requested.'],
    commonError: 'Using the sector-area formula or leaving an angle in degrees.',
    workedPrompt: 'Find the arc length for $r=5$ and $\\theta=1.2$.', workedSteps: ['$s=r\\theta$.', '$s=5(1.2)=6$.'], workedAnswer: '6',
    practicePrompt: 'Find the arc length for $r=9$ and $\\theta=2\\pi/3$.', correct: '$6\\pi$', distractorA: '$3\\pi$', distractorB: '$18\\pi$',
    hint: 'Multiply radius by the radian angle.', solution: ['$s=9(2\\pi/3)$.', 'This simplifies to $6\\pi$.'],
  }),
  manualAuthored({
    skillId: 'p1_trig_graph_sketch', goal: 'Sketch a complete trigonometric graph over a stated interval.',
    teachingPoints: ['Place key intercepts, extrema and asymptotes at correct coordinates.', 'Show the requested interval and scale clearly.'],
    commonError: 'Drawing a generic wave without correct period, amplitude or asymptotes.',
    workedPrompt: 'Describe a sketch of $y=2\\sin x$ for $0\\le x\\le2\\pi$.', workedSteps: ['Mark zeros at $0,\\pi,2\\pi$.', 'Mark maximum $(\\pi/2,2)$ and minimum $(3\\pi/2,-2)$, then join smoothly.'], workedAnswer: 'One sine cycle with amplitude 2 and period $2\\pi$',
    practicePrompt: 'On paper, sketch $y=\\tan 2x$ for $-\\pi/2<x<\\pi/2$, marking every intercept and vertical asymptote.',
    hint: 'The period is $\\pi/2$ and asymptotes occur halfway between zeros.', solution: ['Zeros occur at $x=-\\pi/2,0,\\pi/2$ where included; only 0 is inside the open interval endpoints.', 'Asymptotes occur at $x=-\\pi/4$ and $x=\\pi/4$; compare your branches manually.'],
  }),
  authored({
    skillId: 'p1_trig_exact_standard', goal: 'Recall standard exact trigonometric values.',
    teachingPoints: ['Use the 30-60-90 and 45-45-90 triangles.', 'Keep exact fractions and square roots rather than decimals.'],
    commonError: 'Swapping the sine and cosine values at 30 degrees.',
    workedPrompt: 'State the exact value of $\\cos30^\\circ$.', workedSteps: ['Use the 30-60-90 triangle.', 'Adjacent over hypotenuse is $\\sqrt3/2$.'], workedAnswer: '$\\sqrt3/2$',
    practicePrompt: 'What is the exact value of $\\tan45^\\circ$?', correct: '1', distractorA: '$\\sqrt2/2$', distractorB: '$\\sqrt3$',
    hint: 'At 45 degrees the opposite and adjacent sides are equal.', solution: ['$\\tan45^\\circ=\\sin45^\\circ/\\cos45^\\circ$.', 'The equal numerator and denominator give 1.'],
  }),
  manualAuthored({
    skillId: 'p1_trig_identity_proofs', goal: 'Write a valid chain of identity transformations.',
    teachingPoints: ['Work from one side only until it matches the other.', 'Name or visibly apply each basic identity without assuming the conclusion.'],
    commonError: 'Changing both sides at once or cancelling terms across addition.',
    workedPrompt: 'Prove $(1-\\cos^2x)/\\sin x=\\sin x$ where defined.', workedSteps: ['Use $1-\\cos^2x=\\sin^2x$.', 'Then $\\sin^2x/\\sin x=\\sin x$ where $\\sin x\\ne0$.'], workedAnswer: 'The left side simplifies to the right side',
    practicePrompt: 'On paper, prove that $\\tan x+\\cot x=1/(\\sin x\\cos x)$ where both sides are defined.',
    hint: 'Write tangent and cotangent using sine and cosine.', solution: ['The left side becomes $\\sin x/\\cos x+\\cos x/\\sin x=(\\sin^2x+\\cos^2x)/(\\sin x\\cos x)$.', 'Use $\\sin^2x+\\cos^2x=1$; check your written proof manually.'],
  }),
  authored({
    skillId: 'p1_series_binomial_expand', goal: 'Build the requested terms of a binomial expansion.',
    teachingPoints: ['Use the correct positive-integer coefficient row.', 'Combine coefficients, signs and powers term by term.'],
    commonError: 'Dropping the power on the second binomial term.',
    workedPrompt: 'Expand $(1+2x)^3$.', workedSteps: ['Use coefficients 1,3,3,1.', 'Combine with powers of $2x$.'], workedAnswer: '$1+6x+12x^2+8x^3$',
    practicePrompt: 'Expand $(2-x)^3$.', correct: '$8-12x+6x^2-x^3$', distractorA: '$8-6x+3x^2-x^3$', distractorB: '$8+12x+6x^2+x^3$',
    hint: 'Use coefficients 1,3,3,1 and keep the sign of $-x$.', solution: ['$2^3+3(2^2)(-x)+3(2)(-x)^2+(-x)^3$.', 'This is $8-12x+6x^2-x^3$.'],
  }),
  authored({
    skillId: 'p1_series_arithmetic_terms', goal: 'Use the arithmetic nth-term formula.',
    teachingPoints: ['Identify the first term a and common difference d.', 'Use n-1 differences to reach the nth term.'],
    commonError: 'Using nd instead of $(n-1)d$.',
    workedPrompt: 'Find the 12th term of $5,8,11,\\ldots$.', workedSteps: ['$a=5$, $d=3$.', '$u_{12}=5+11(3)=38$.'], workedAnswer: '38',
    practicePrompt: 'Find the 20th term of $7,11,15,\\ldots$.', correct: '83', distractorA: '87', distractorB: '80',
    hint: 'There are 19 differences after the first term.', solution: ['$u_{20}=7+19(4)$.', 'Therefore $u_{20}=83$.'],
  }),
  authored({
    skillId: 'p1_series_geometric_finite', goal: 'Find a geometric term or finite sum.',
    teachingPoints: ['Use $u_n=ar^{n-1}$ for one term.', 'Use a finite-sum formula only when a total is requested.'],
    commonError: 'Using n rather than n-1 in a geometric term.',
    workedPrompt: 'Find the fifth term of $3,6,12,\\ldots$.', workedSteps: ['$a=3$, $r=2$.', '$u_5=3(2^4)=48$.'], workedAnswer: '48',
    practicePrompt: 'Find the sum of the first 4 terms of $2,6,18,\\ldots$.', correct: '80', distractorA: '54', distractorB: '242',
    hint: 'List four terms or use the finite geometric sum.', solution: ['The first four terms are $2,6,18,54$.', 'Their sum is 80.'],
  }),
  authored({
    skillId: 'p1_diff_limiting_gradient', goal: 'Recognise a derivative as a limit of chord gradients.',
    teachingPoints: ['Use a second point separated by a small increment h.', 'Let h approach zero only after simplifying the difference quotient.'],
    commonError: 'Substituting h=0 before simplifying.',
    workedPrompt: 'Form the difference quotient for $f(x)=x^2$.', workedSteps: ['Use $[(x+h)^2-x^2]/h$.', 'Simplify to $2x+h$, then let $h\\to0$.'], workedAnswer: '$f^{\\prime}(x)=2x$',
    practicePrompt: 'What does $[f(a+h)-f(a)]/h$ approach as $h\\to0$?', correct: '$f^{\\prime}(a)$', distractorA: '$f(a)$', distractorB: '$f^{\\prime\\prime}(a)$',
    hint: 'It is the chord gradient as the second point approaches the first.', solution: ['The quotient is the gradient between inputs a and a+h.', 'Its limit is the tangent gradient $f^{\\prime}(a)$.'],
  }),
  authored({
    skillId: 'p1_diff_chain_rule', goal: 'Differentiate a power of a linear expression.',
    teachingPoints: ['Differentiate the outer power.', 'Multiply by the derivative of the inner expression.'],
    commonError: 'Omitting the constant inner derivative.',
    workedPrompt: 'Differentiate $(3x+1)^4$.', workedSteps: ['The outer derivative is $4(3x+1)^3$.', 'Multiply by 3.'], workedAnswer: '$12(3x+1)^3$',
    practicePrompt: 'Differentiate $(5-2x)^3$.', correct: '$-6(5-2x)^2$', distractorA: '$3(5-2x)^2$', distractorB: '$-2(5-2x)^3$',
    hint: 'The inner derivative is -2.', solution: ['The outer derivative is $3(5-2x)^2$.', 'Multiplication by -2 gives $-6(5-2x)^2$.'],
  }),
  authored({
    skillId: 'p1_diff_tangent_equations', goal: 'Turn a derivative value into a tangent equation.',
    teachingPoints: ['Evaluate the derivative at the point.', 'Use point-gradient form and complete the requested rearrangement.'],
    commonError: 'Stopping after finding the gradient.',
    workedPrompt: 'Find the tangent to $y=x^2$ at $(2,4)$.', workedSteps: ['$dy/dx=2x$, so the gradient is 4.', '$y-4=4(x-2)$.'], workedAnswer: '$y=4x-4$',
    practicePrompt: 'Find the tangent to $y=x^3$ at $(1,1)$.', correct: '$y=3x-2$', distractorA: '$y=x$', distractorB: '$y=3x+2$',
    hint: 'At x=1, the gradient is $3x^2=3$.', solution: ['$y-1=3(x-1)$.', 'So $y=3x-2$.'],
  }),
  authored({
    skillId: 'p1_diff_stationary_location', goal: 'Find complete stationary-point coordinates.',
    teachingPoints: ['Solve $f^{\\prime}(x)=0$.', 'Substitute every solution into the original function.'],
    commonError: 'Reporting stationary x-values without y-coordinates.',
    workedPrompt: 'Locate the stationary point of $f(x)=x^2-6x+4$.', workedSteps: ['$f^{\\prime}(x)=2x-6=0$, so $x=3$.', '$f(3)=9-18+4=-5$.'], workedAnswer: '$(3,-5)$',
    practicePrompt: 'Locate the stationary point of $f(x)=x^2+4x+1$.', correct: '$(-2,-3)$', distractorA: '$(2,13)$', distractorB: '$(-2,3)$',
    hint: 'Set $2x+4=0$, then evaluate f.', solution: ['$x=-2$.', '$f(-2)=4-8+1=-3$.'],
  }),
  manualAuthored({
    skillId: 'p1_diff_curve_sketch', goal: 'Combine intercept and derivative information into a curve sketch.',
    teachingPoints: ['Plot known coordinates and stationary points first.', 'Join them using the correct increasing/decreasing behaviour and end shape.'],
    commonError: 'Labelling an unsupported point of inflexion or omitting coordinate scale.',
    workedPrompt: 'Describe a sketch plan for $y=x^2-4x+3$.', workedSteps: ['Mark roots 1 and 3 and stationary minimum $(2,-1)$.', 'Draw an upward-opening curve decreasing before x=2 and increasing after it.'], workedAnswer: 'A labelled upward parabola through the three key coordinates',
    practicePrompt: 'On paper, sketch $y=x^3-3x$ using its intercepts and stationary points, clearly labelling all coordinates.',
    hint: 'Solve $x(x^2-3)=0$ for intercepts and $3x^2-3=0$ for stationary x-values.', solution: ['The stationary points are $(-1,2)$ and $(1,-2)$; the intercepts are $x=-\\sqrt3,0,\\sqrt3$.', 'Join them with the correct cubic end behaviour; compare the labelled shape manually.'],
  }),
  authored({
    skillId: 'p1_int_linear_composites', goal: 'Reverse the chain rule for a power of a linear expression.',
    teachingPoints: ['Increase the outer power and divide by the new power.', 'Also divide by the inner x-coefficient.'],
    commonError: 'Multiplying by the inner coefficient as in differentiation.',
    workedPrompt: 'Integrate $(2x+3)^4$.', workedSteps: ['Increase the power to 5.', 'Divide by $5\\times2$.'], workedAnswer: '$(2x+3)^5/10+C$',
    practicePrompt: 'Integrate $6(3x-1)^2$.', correct: '$\\frac23(3x-1)^3+C$', distractorA: '$2(3x-1)^3+C$', distractorB: '$18(3x-1)+C$',
    hint: 'Divide by the new power 3 and the inner coefficient 3.', solution: ['$\\int(3x-1)^2dx=(3x-1)^3/9$.', 'Multiplying by 6 gives $\\frac23(3x-1)^3+C$.'],
  }),
  authored({
    skillId: 'p1_int_improper', goal: 'Use a limit at an improper endpoint.',
    teachingPoints: ['Replace the infinite endpoint with a variable bound.', 'Evaluate the resulting expression before taking its limit.'],
    commonError: 'Substituting infinity as if it were a number.',
    workedPrompt: 'Evaluate $\\int_1^\\infty x^{-2}\\,dx$.', workedSteps: ['Use $\\lim_{b\\to\\infty}[-x^{-1}]_1^b$.', 'This is $\\lim_{b\\to\\infty}(1-1/b)=1$.'], workedAnswer: '1',
    practicePrompt: 'Evaluate $\\int_2^\\infty 4x^{-3}\\,dx$.', correct: '$1/2$', distractorA: '2', distractorB: 'Diverges',
    hint: 'An antiderivative is $-2x^{-2}$.', solution: ['$\\lim_{b\\to\\infty}[-2x^{-2}]_2^b$.', 'The upper term tends to 0 and the lower subtraction gives $1/2$.'],
  }),
  authored({
    skillId: 'p1_int_area_split', goal: 'Split a total area where a graph crosses an axis or another graph.',
    teachingPoints: ['Find every sign-change or crossing point first.', 'Reverse a negative signed integral when interpreting geometric area.'],
    commonError: 'Using one signed integral and allowing areas to cancel.',
    workedPrompt: 'How should the area between $y=x$ and the x-axis from x=-1 to x=2 be set up?', workedSteps: ['The graph changes sign at x=0.', 'Use $-\\int_{-1}^0x\\,dx+\\int_0^2x\\,dx$.'], workedAnswer: 'Two non-negative area pieces',
    practicePrompt: 'Which setup gives total area under $y=x^2-1$ from x=0 to x=2?', correct: '$-\\int_0^1(x^2-1)dx+\\int_1^2(x^2-1)dx$', distractorA: '$\\int_0^2(x^2-1)dx$', distractorB: '$\\int_0^1(x^2-1)dx-\\int_1^2(x^2-1)dx$',
    hint: 'The graph crosses the axis at x=1 in this interval.', solution: ['The function is negative from 0 to 1 and positive from 1 to 2.', 'Negate the first signed integral and add the second.'],
  }),
  authored({
    skillId: 'p1_int_volume_y_axis', goal: 'Set up a disk volume about the y-axis.',
    teachingPoints: ['Write x as a function of y.', 'Use $\\pi\\int x^2\\,dy$ with the correct y-bounds.'],
    commonError: 'Integrating in x while using horizontal disk radii.',
    workedPrompt: 'Rotate the region $0\\le x\\le\\sqrt y$, $0\\le y\\le4$ about the y-axis.', workedSteps: ['The disk radius is $x=\\sqrt y$.', '$V=\\pi\\int_0^4(\\sqrt y)^2dy$.'], workedAnswer: '$8\\pi$',
    practicePrompt: 'For rotation about the y-axis with $x=g(y)$, which disk integrand is required?', correct: '$\\pi[g(y)]^2$', distractorA: '$2\\pi g(y)$', distractorB: '$\\pi g(y)$',
    hint: 'The horizontal distance x is the disk radius.', solution: ['A disk of radius g(y) has area $\\pi[g(y)]^2$.', 'Integrate that area with respect to y.'],
  }),
  authored({
    skillId: 'p1_quad_hidden_substitution_solve', goal: 'Finish a hidden quadratic after choosing its repeated expression.',
    teachingPoints: ['Solve the temporary quadratic first.', 'Restore the original expression and keep every resulting root.'],
    commonError: 'Stopping after finding values of the temporary variable.',
    workedPrompt: 'Solve $x^4-5x^2+4=0$.', workedSteps: ['Let $u=x^2$ and solve $(u-1)(u-4)=0$.', '$x^2=1$ or 4, so restore both positive and negative square roots.'], workedAnswer: '$x=-2,-1,1,2$',
    practicePrompt: 'Solve $x^4-13x^2+36=0$.', correct: '$x=-3,-2,2,3$', distractorA: '$x=4,9$', distractorB: '$x=-6,6$',
    hint: 'Let $u=x^2$ and factor $u^2-13u+36$.', solution: ['$(u-4)(u-9)=0$, so $x^2=4$ or 9.', 'Therefore $x=\\pm2$ or $x=\\pm3$.'],
  }),
  authored({
    skillId: 'p1_func_composition_domain', goal: 'Decide where one function can validly follow another.',
    teachingPoints: ['Find the range produced by the inner function.', 'Require those outputs to lie in the outer function domain.'],
    commonError: 'Checking only the original input domain.',
    workedPrompt: 'For $f(x)=x^2$ and $g(x)=\\sqrt{x-1}$, where is $gf(x)$ defined?', workedSteps: ['$g(f(x))=\\sqrt{x^2-1}$.', 'Require $x^2-1\\ge0$.'], workedAnswer: '$x\\le-1$ or $x\\ge1$',
    practicePrompt: 'For $f(x)=x-2$ and $g(x)=1/x$, where is $gf(x)$ defined?', correct: '$x\\ne2$', distractorA: '$x\\ne0$', distractorB: '$x>2$',
    hint: 'The output of f becomes the denominator in g.', solution: ['$gf(x)=1/(x-2)$.', 'The denominator is non-zero when $x\\ne2$.'],
  }),
  authored({
    skillId: 'p1_coord_tangent_gradient', goal: 'Use radius geometry to find a tangent gradient.',
    teachingPoints: ['Find the radius gradient from the centre to the contact point.', 'Take its negative reciprocal for the tangent.'],
    commonError: 'Using the radius gradient unchanged.',
    workedPrompt: 'A radius to a contact point has gradient 2. Find the tangent gradient.', workedSteps: ['Radius and tangent are perpendicular.', '$2m=-1$.'], workedAnswer: '$m=-1/2$',
    practicePrompt: 'A radius at contact has gradient $-3/4$. What is the tangent gradient?', correct: '$4/3$', distractorA: '$-4/3$', distractorB: '$3/4$',
    hint: 'Perpendicular gradients multiply to -1.', solution: ['$(-3/4)m=-1$.', 'Therefore $m=4/3$.'],
  }),
  authored({
    skillId: 'p1_circ_segment_area', goal: 'Build a circular segment or shaded area from simple pieces.',
    teachingPoints: ['Find the sector area first.', 'Subtract the triangle between the two radii and chord for a minor segment.'],
    commonError: 'Adding the central triangle to the sector.',
    workedPrompt: 'How is the area of a minor segment related to its sector and central triangle?', workedSteps: ['The sector contains both pieces.', 'Remove the triangle to leave the segment.'], workedAnswer: 'Sector area minus triangle area',
    practicePrompt: 'Which expression gives a minor segment area with radius r and angle $\\theta$?', correct: '$\\frac12r^2(\\theta-\\sin\\theta)$', distractorA: '$\\frac12r^2(\\theta+\\sin\\theta)$', distractorB: '$r\\theta-\\frac12r^2\\sin\\theta$',
    hint: 'Subtract $\\frac12r^2\\sin\\theta$ from the sector area.', solution: ['$A_{sector}=\\frac12r^2\\theta$ and $A_{triangle}=\\frac12r^2\\sin\\theta$.', 'Their difference is $\\frac12r^2(\\theta-\\sin\\theta)$.'],
  }),
  authored({
    skillId: 'p1_series_geometric_infinity_sum', goal: 'Calculate a geometric sum to infinity after checking convergence.',
    teachingPoints: ['Confirm $|r|<1$.', 'Use $S_\\infty=a/(1-r)$ with the signed ratio.'],
    commonError: 'Replacing a negative ratio by its magnitude in the sum formula.',
    workedPrompt: 'Find the sum to infinity of $6-3+1.5-\\cdots$.', workedSteps: ['$a=6$, $r=-1/2$, so the series converges.', '$S_\\infty=6/(1+1/2)$.'], workedAnswer: '4',
    practicePrompt: 'Find the sum to infinity of $12+4+4/3+\\cdots$.', correct: '18', distractorA: '16', distractorB: '8',
    hint: 'The common ratio is $1/3$.', solution: ['$|r|<1$, so use the infinity formula.', '$S_\\infty=12/(1-1/3)=18$.'],
  }),
];

type RetrySeed = [
  skillId: string,
  prompt: string,
  correct: string,
  distractorA: string,
  distractorB: string,
  hint: string,
  solutionStep1: string,
  solutionStep2: string,
];

function reviewedRetry(seed: RetrySeed): P1CheckedPracticeContent & { retryVariantId: string } {
  const [skillId, prompt, correct, distractorA, distractorB, hint, solutionStep1, solutionStep2] = seed;
  const choice = deterministicOptions(`${skillId}:retry-1`, correct, distractorA, distractorB);
  return {
    itemId: 'p1-cp-' + skillId.slice(3) + '-retry-1',
    retryVariantId: skillId + ':retry-1',
    prompt,
    answerType: 'single-choice',
    options: choice.options,
    expectedOptionId: choice.expectedOptionId,
    hint,
    workedSolution: [solutionStep1, solutionStep2],
    progressionEligible: true,
    reviewStatus: 'reviewed',
  };
}

const P1_RETRY_CHECKED_PRACTICE = ([
  ['p1_quad_complete_square', 'Write $2x^2+8x+3$ in completed-square form.', '$2(x+2)^2-5$', '$2(x+4)^2-29$', '$2(x+2)^2+5$', 'Factor 2 from the x-terms first.', '$2x^2+8x+3=2(x^2+4x)+3$.', '$x^2+4x=(x+2)^2-4$, so the form is $2(x+2)^2-5$.'],
  ['p1_quad_discriminant', 'Classify the roots of $x^2-6x+9=0$.', 'One repeated real root', 'Two distinct real roots', 'No real roots', 'Calculate $(-6)^2-4(1)(9)$.', '$D=36-36=0$.', 'A zero discriminant gives one repeated real root.'],
  ['p1_quad_equations_inequalities', 'Solve $x^2+x-2<0$.', '$-2<x<1$', '$x<-2$ or $x>1$', '$-1<x<2$', 'Factor and inspect the interval between the roots.', '$(x+2)(x-1)<0$.', 'The expression is negative between the roots, so $-2<x<1$.'],
  ['p1_quad_simultaneous', 'Which ordered pair solves both $y=x$ and $x^2+y=2$?', '$(-2,-2)$', '$(2,2)$', '$(-1,-1)$', 'Substitute y=x.', '$x^2+x-2=(x+2)(x-1)=0$.', '$x=-2$ gives the listed pair $(-2,-2)$.'],
  ['p1_quad_substitution_forms', 'Which substitution exposes a quadratic in $(x-2)^4-7(x-2)^2+10=0$?', '$u=(x-2)^2$', '$u=x-2$', '$u=x^2$', 'Name the expression that is squared and also appears to the first power.', 'The repeated expression is $(x-2)^2$.', 'Then the equation becomes $u^2-7u+10=0$.'],
  ['p1_func_language_domain_range', 'What is the domain of $f(x)=1/(2x-6)$?', '$x\\ne3$', '$x>3$', '$x\\ne6$', 'Exclude the value that makes the denominator zero.', '$2x-6\\ne0$.', 'Therefore $x\\ne3$.'],
  ['p1_func_composition', 'For $f(x)=2x+1$ and $g(x)=x-3$, find $gf(x)$.', '$2x-2$', '$2x-5$', '$2x+4$', 'Apply f first, then g.', '$gf(x)=g(2x+1)$.', '$g(2x+1)=2x+1-3=2x-2$.'],
  ['p1_func_one_one_inverse', 'Which domain restriction makes $f(x)=x^2$ one-one on its left branch?', '$x\\le0$', '$x\\ge0$', 'All real x', 'Keep only the decreasing half of the parabola.', 'The left branch has $x\\le0$.', 'Each output then has one permitted input.'],
  ['p1_func_inverse_graphs', 'The graph of f contains $(-1,4)$. Which point lies on $f^{-1}$?', '$(4,-1)$', '$(1,-4)$', '$(-4,1)$', 'Swap input and output coordinates.', '$f(-1)=4$.', 'Therefore $f^{-1}(4)=-1$, giving $(4,-1)$.'],
  ['p1_func_transformations', 'Describe the transformation from $y=f(x)$ to $y=\\frac12f(x)$.', 'Vertical stretch factor $1/2$', 'Horizontal stretch factor $1/2$', 'Translation down $1/2$', 'The multiplier is outside f.', 'Every output is multiplied by $1/2$.', 'This is a vertical stretch with scale factor $1/2$.'],
  ['p1_coord_line_equations', 'Find the line through $(-1,2)$ with gradient $-2$.', '$y=-2x$', '$y=-2x+4$', '$y=2x+4$', 'Use $y-2=-2(x+1)$.', '$y-2=-2(x+1)$.', 'Expanding gives $y=-2x$.'],
  ['p1_coord_line_relationships', 'Find the midpoint of $(-3,7)$ and $(5,-1)$.', '$(1,3)$', '$(2,6)$', '$(-4,8)$', 'Average corresponding coordinates.', '$x=(-3+5)/2=1$.', '$y=(7-1)/2=3$.'],
  ['p1_coord_circle_equations', 'State the centre and radius of $(x+4)^2+(y-3)^2=25$.', 'Centre $(-4,3)$, radius 5', 'Centre $(4,-3)$, radius 5', 'Centre $(-4,3)$, radius 25', 'Reverse the bracket signs and square-root 25.', 'The centre is $(-4,3)$.', '$r^2=25$, so the radius is 5.'],
  ['p1_coord_line_circle_problems', 'Which condition shows that a substituted line is tangent to a circle?', 'The resulting quadratic has $D=0$', 'The resulting quadratic has $D>0$', 'The resulting quadratic has $D<0$', 'Tangency gives one repeated intersection.', 'One repeated root corresponds to a zero discriminant.', 'Therefore the tangency condition is $D=0$.'],
  ['p1_coord_graph_intersections', 'Which discriminant condition means a line crosses a quadratic curve at two points?', '$D>0$', '$D=0$', '$D<0$', 'Two crossing points give two distinct roots.', 'Equating the graphs produces a quadratic.', 'Two distinct real roots require $D>0$.'],
  ['p1_circ_radians_degrees', 'Convert $225^\\circ$ to radians.', '$5\\pi/4$', '$4\\pi/5$', '$3\\pi/4$', 'Multiply by $\\pi/180$.', '$225\\times\\pi/180$.', 'Simplifying gives $5\\pi/4$.'],
  ['p1_circ_arc_sector', 'Find the sector area when $r=3$ and $\\theta=2$ radians.', '9', '6', '18', 'Use $A=\\frac12r^2\\theta$.', '$A=\\frac12(3^2)(2)$.', 'Therefore $A=9$.'],
  ['p1_circ_composite_geometry', 'A semicircle of radius r has its diameter exposed. Which expression gives its perimeter?', '$\\pi r+2r$', '$\\pi r$', '$2\\pi r$', 'Include the curved half-circumference and the straight diameter.', 'The arc length is $\\pi r$.', 'Adding the diameter gives $\\pi r+2r$.'],
  ['p1_trig_graphs', 'What is the period of $y=\\sin(x/2)$?', '$4\\pi$', '$\\pi$', '$2\\pi$', 'Divide $2\\pi$ by the coefficient $1/2$.', 'The x coefficient is $1/2$.', '$2\\pi/(1/2)=4\\pi$.'],
  ['p1_trig_exact_values', 'Find the exact value of $\\cos240^\\circ$.', '$-1/2$', '$1/2$', '$-\\sqrt3/2$', 'Use a 60-degree reference angle in quadrant III.', 'Cosine is negative in quadrant III.', '$\\cos60^\\circ=1/2$, so $\\cos240^\\circ=-1/2$.'],
  ['p1_trig_inverse_principal', 'Find the principal value of $\\tan^{-1}(1)$ in degrees.', '$45^\\circ$', '$135^\\circ$', '$225^\\circ$', 'Use the principal inverse-tangent range.', '$\\tan45^\\circ=1$.', 'The principal value is $45^\\circ$.'],
  ['p1_trig_identities', 'Simplify $\\sin^2x/(1-\\cos^2x)$ where defined.', '1', '$\\sin x$', '$\\tan^2x$', 'Use $1-\\cos^2x=\\sin^2x$.', 'Replace the denominator by $\\sin^2x$.', 'The quotient is 1 where defined.'],
  ['p1_trig_equations_intervals', 'Solve $\\tan x=0$ for $0^\\circ\\le x\\le360^\\circ$.', '$x=0^\\circ,180^\\circ,360^\\circ$', '$x=90^\\circ,270^\\circ$', '$x=0^\\circ,360^\\circ$', 'Tangent is zero every 180 degrees.', 'The reference solution is $0^\\circ$.', 'Including endpoints gives 0, 180 and 360 degrees.'],
  ['p1_series_binomial', 'Find the coefficient of $x^3$ in $(2+x)^4$.', '8', '4', '16', 'Use three x factors and one factor of 2.', 'The term is $\\binom43 2x^3$.', 'Its coefficient is $4\\times2=8$.'],
  ['p1_series_progression_recognition', 'Classify $81,27,9,3,\\ldots$.', 'Geometric, ratio $1/3$', 'Arithmetic, difference -54', 'Geometric, ratio 3', 'Divide consecutive terms.', '$27/81=1/3$ and $9/27=1/3$.', 'The constant ratio makes it geometric.'],
  ['p1_series_finite_sums', 'Find the sum of the first 6 terms of $4,7,10,\\ldots$.', '69', '19', '57', 'This is arithmetic with first term 4 and difference 3.', 'The sixth term is 19.', '$S_6=6(4+19)/2=69$.'],
  ['p1_series_geometric_infinity', 'Does $8-12+18-\\cdots$ converge?', 'No, because $|r|=3/2$', 'Yes, because r is negative', 'Yes, because $|r|<2$', 'Find the magnitude of the common ratio.', '$r=-12/8=-3/2$.', 'Since $|r|>1$, the progression does not converge.'],
  ['p1_diff_gradient_limit_notation', 'What does $f^{\\prime\\prime}(x)<0$ say about the gradient of f?', 'The gradient is decreasing', 'The function value is negative', 'The gradient is zero', 'The second derivative tracks change in the first.', '$f^{\\prime\\prime}$ describes how $f^{\\prime}$ changes.', 'A negative value means the gradient is decreasing.'],
  ['p1_diff_power_chain', 'Differentiate $4x^{3/2}-x^{-2}$.', '$6x^{1/2}+2x^{-3}$', '$6x^{1/2}-2x^{-3}$', '$4x^{1/2}+x^{-3}$', 'Apply the power rule to each term.', '$4(3/2)x^{1/2}=6x^{1/2}$.', '$-x^{-2}$ differentiates to $+2x^{-3}$.'],
  ['p1_diff_tangent_normal', 'What is the normal gradient to $y=x^3$ at x=1?', '$-1/3$', '3', '$1/3$', 'Find the tangent gradient, then its negative reciprocal.', '$dy/dx=3x^2$, so the tangent gradient is 3.', 'The normal gradient is $-1/3$.'],
  ['p1_diff_increasing_decreasing', 'If $f^{\\prime}(x)=x+2$, where is f increasing?', '$x>-2$', '$x<-2$', '$x>2$', 'Solve $f^{\\prime}(x)>0$.', '$x+2>0$.', 'Therefore f increases for $x>-2$.'],
  ['p1_diff_connected_rates', 'A square side grows at 3 cm/s. Find $dA/dt$ when the side is 4 cm.', '24 cm$^2$/s', '12 cm$^2$/s', '48 cm$^2$/s', 'Differentiate $A=s^2$ with respect to time.', '$dA/dt=2s\\,ds/dt$.', 'At s=4 and $ds/dt=3$, the rate is 24 cm$^2$/s.'],
  ['p1_diff_stationary_classification', 'If $f^{\\prime}(a)=0$ and $f^{\\prime\\prime}(a)=5$, classify the stationary point.', 'A local minimum', 'A local maximum', 'A point of inflexion', 'Use the positive second-derivative test.', '$f^{\\prime}(a)=0$ confirms stationarity.', '$f^{\\prime\\prime}(a)>0$ gives a local minimum.'],
  ['p1_int_reverse_power', 'Integrate $3x^2-4x+2$.', '$x^3-2x^2+2x+C$', '$6x-4+C$', '$x^3-4x^2+2x+C$', 'Integrate each term separately.', '$\\int3x^2dx=x^3$ and $\\int-4x\\,dx=-2x^2$.', 'The complete result is $x^3-2x^2+2x+C$.'],
  ['p1_int_constant', 'A curve has $dy/dx=2x+1$ and passes through $(0,4)$. Find C in $y=x^2+x+C$.', '4', '0', '1', 'Substitute the given point.', '$4=0^2+0+C$.', 'Therefore $C=4$.'],
  ['p1_int_definite', 'Evaluate $\\int_1^2 3x^2\\,dx$.', '7', '8', '9', 'Use the antiderivative $x^3$.', 'Evaluate $[x^3]_1^2$.', '$2^3-1^3=7$.'],
  ['p1_int_areas', 'On $0\\le x\\le1$, which integrand gives the area between $y=x$ and $y=x^2$?', '$x-x^2$', '$x^2-x$', '$x+x^2$', 'Identify the upper curve on this interval.', '$x\\ge x^2$ on $0\\le x\\le1$.', 'Top minus bottom is $x-x^2$.'],
  ['p1_int_volumes', 'For rotation about the x-axis using $y=f(x)$, which disk integrand is required?', '$\\pi[f(x)]^2$', '$2\\pi f(x)$', '$\\pi f(x)$', 'The vertical distance y is the disk radius.', 'A disk of radius $f(x)$ has area $\\pi[f(x)]^2$.', 'Integrate this expression with respect to x.'],
  ['p1_quad_complete_square_rewrite', 'Write $2x^2+12x+5$ in completed-square form.', '$2(x+3)^2-13$', '$2(x+6)^2-67$', '$2(x+3)^2+13$', 'Factor 2 from the x-terms first.', '$2(x^2+6x)+5=2[(x+3)^2-9]+5$.', 'Therefore the form is $2(x+3)^2-13$.'],
  ['p1_quad_solve_equations', 'Solve $3x^2+x-2=0$.', '$x=2/3$ or $x=-1$', '$x=-2/3$ or $x=1$', '$x=2$ or $x=-3$', 'Factor the quadratic.', '$(3x-2)(x+1)=0$.', 'Hence $x=2/3$ or $x=-1$.'],
  ['p1_func_ranges', 'Find the range of $f(x)=2-(x+1)^2$ for real x.', '$(-\\infty,2]$', '$[2,\\infty)$', '$(-\\infty,-1]$', 'The squared term is subtracted.', 'Since $(x+1)^2\\ge0$, $2-(x+1)^2\\le2$.', 'Every value at or below 2 occurs.'],
  ['p1_func_inverse_formula', 'Find the inverse of $f(x)=5-2x$.', '$f^{-1}(x)=(5-x)/2$', '$f^{-1}(x)=5-2x$', '$f^{-1}(x)=(x-5)/2$', 'Solve y=5-2x for x.', '$2x=5-y$, so $x=(5-y)/2$.', 'Thus $f^{-1}(x)=(5-x)/2$.'],
  ['p1_func_transform_translate_reflect', 'Describe the transformation from $y=f(x)$ to $y=-f(x+4)$.', 'Translate left 4, then reflect in the x-axis', 'Translate right 4, then reflect in the y-axis', 'Reflect in the x-axis, then translate up 4', 'Separate the inside and outside changes.', '$x+4$ translates left 4.', 'The outside minus reflects in the x-axis.'],
  ['p1_coord_distance', 'Find the distance between $(2,-1)$ and $(8,7)$.', '10', '14', '$\\sqrt{10}$', 'Use coordinate differences 6 and 8.', '$d=\\sqrt{6^2+8^2}$.', 'Therefore $d=10$.'],
  ['p1_coord_parallel_perpendicular', 'A line is parallel to $y=-3x+4$. What is its gradient?', '-3', '$1/3$', '3', 'Parallel lines have the same gradient.', 'The given line has gradient -3.', 'The parallel gradient is also -3.'],
  ['p1_coord_line_intersections', 'Find the intersection of $y=4x+1$ and $y=10-2x$.', '$(3/2,7)$', '$(1,5)$', '$(3/2,4)$', 'Equate the two expressions for y.', '$4x+1=10-2x$ gives $x=3/2$.', 'Then $y=7$.'],
  ['p1_coord_circle_standard_form', 'Form the circle with centre $(4,-2)$ and radius 5.', '$(x-4)^2+(y+2)^2=25$', '$(x+4)^2+(y-2)^2=25$', '$(x-4)^2+(y+2)^2=5$', 'Use centre-radius form.', 'Centre $(4,-2)$ gives brackets $(x-4)$ and $(y+2)$.', 'The squared radius is 25.'],
  ['p1_coord_line_circle_intersections', 'Where does $x=0$ meet $x^2+y^2=9$?', '$(0,-3)$ and $(0,3)$', '$(-3,0)$ and $(3,0)$', '$(0,3)$ only', 'Substitute x=0.', '$y^2=9$, so $y=\\pm3$.', 'The two points are $(0,-3)$ and $(0,3)$.'],
  ['p1_circ_arc_length', 'Find the arc length when $r=4$ and $\\theta=5\\pi/6$.', '$10\\pi/3$', '$5\\pi/3$', '$20\\pi/3$', 'Use $s=r\\theta$.', '$s=4(5\\pi/6)$.', 'This simplifies to $10\\pi/3$.'],
  ['p1_trig_exact_standard', 'What is the exact value of $\\sin60^\\circ$?', '$\\sqrt3/2$', '$1/2$', '$1/\\sqrt3$', 'Use the 30-60-90 triangle.', 'The side opposite 60 degrees is $\\sqrt3$ when the hypotenuse is 2.', 'Therefore $\\sin60^\\circ=\\sqrt3/2$.'],
  ['p1_series_binomial_expand', 'Expand $(1-2x)^3$.', '$1-6x+12x^2-8x^3$', '$1-3x+3x^2-x^3$', '$1+6x+12x^2+8x^3$', 'Use coefficients 1,3,3,1 and powers of -2x.', '$1+3(-2x)+3(-2x)^2+(-2x)^3$.', 'This is $1-6x+12x^2-8x^3$.'],
  ['p1_series_arithmetic_terms', 'Find the 15th term of $10,7,4,\\ldots$.', '-32', '-35', '52', 'The common difference is -3.', '$u_{15}=10+14(-3)$.', 'Therefore $u_{15}=-32$.'],
  ['p1_series_geometric_finite', 'Find the fourth term of $5,10,20,\\ldots$.', '40', '80', '35', 'Use three multiplications by the common ratio after the first term.', '$a=5$ and $r=2$.', '$u_4=5(2^3)=40$.'],
  ['p1_diff_limiting_gradient', 'Which expression is the derivative of f at x=2 from first principles?', '$\\lim_{h\\to0}[f(2+h)-f(2)]/h$', '$[f(2)+f(h)]/2$', '$\\lim_{h\\to0}f(2+h)/h$', 'Use the change in output divided by the change in input.', 'The two inputs are 2 and 2+h.', 'Their output difference divided by h is the required quotient.'],
  ['p1_diff_chain_rule', 'Differentiate $(4x+3)^{-2}$.', '$-8(4x+3)^{-3}$', '$-2(4x+3)^{-3}$', '$8(4x+3)^{-1}$', 'Multiply the outer derivative by the inner derivative 4.', 'The outer derivative is $-2(4x+3)^{-3}$.', 'Multiplying by 4 gives $-8(4x+3)^{-3}$.'],
  ['p1_diff_tangent_equations', 'Find the tangent to $y=x^2+1$ at $(1,2)$.', '$y=2x$', '$y=2x+2$', '$y=x+1$', 'The tangent gradient is 2 at x=1.', '$y-2=2(x-1)$.', 'This simplifies to $y=2x$.'],
  ['p1_diff_stationary_location', 'Locate the stationary point of $f(x)=x^2-8x+3$.', '$(4,-13)$', '$(-4,51)$', '$(4,13)$', 'Set the first derivative equal to zero.', '$2x-8=0$, so $x=4$.', '$f(4)=16-32+3=-13$.'],
  ['p1_int_linear_composites', 'Integrate $4(2x+5)^3$.', '$(2x+5)^4/2+C$', '$(2x+5)^4+C$', '$12(2x+5)^2+C$', 'Divide by the new power and the inner coefficient.', '$\\int(2x+5)^3dx=(2x+5)^4/8$.', 'Multiplying by 4 gives $(2x+5)^4/2+C$.'],
  ['p1_int_improper', 'Evaluate $\\int_1^\\infty 3x^{-4}\\,dx$.', '1', '3', 'Diverges', 'Use a variable upper bound and then take its limit.', 'An antiderivative is $-x^{-3}$.', '$\\lim_{b\\to\\infty}[-x^{-3}]_1^b=1$.'],
  ['p1_int_area_split', 'Which point must split the total area under $y=2x-4$ from x=0 to x=5?', '$x=2$', '$x=4$', '$x=0$', 'Find where the graph crosses the x-axis.', '$2x-4=0$.', 'Therefore the sign changes at $x=2$.'],
  ['p1_int_volume_y_axis', 'For rotation about the y-axis, $x=2\\sqrt y$ gives which disk integrand?', '$4\\pi y$', '$2\\pi\\sqrt y$', '$4\\pi\\sqrt y$', 'Square the radius x and multiply by pi.', '$x^2=(2\\sqrt y)^2=4y$.', 'The disk area is $4\\pi y$.'],
  ['p1_quad_hidden_substitution_solve', 'Solve $x^4-17x^2+16=0$.', '$x=-4,-1,1,4$', '$x=1,16$', '$x=-4,4$', 'Let $u=x^2$ and solve the temporary quadratic.', '$(u-1)(u-16)=0$, so $x^2=1$ or 16.', 'Restoring x gives $x=\\pm1,\\pm4$.'],
  ['p1_func_composition_domain', 'For $f(x)=x+3$ and $g(x)=\\sqrt{x}$, where is $gf(x)$ defined?', '$x\\ge-3$', '$x\\ge0$', '$x\\ne-3$', 'The output of f is the input to the square root.', '$gf(x)=\\sqrt{x+3}$.', 'Require $x+3\\ge0$, so $x\\ge-3$.'],
  ['p1_coord_tangent_gradient', 'A radius at contact has gradient 5. What is the tangent gradient?', '$-1/5$', '5', '$1/5$', 'Use the negative reciprocal.', '$5m=-1$.', 'Therefore $m=-1/5$.'],
  ['p1_circ_segment_area', 'Which calculation gives the area of a minor circular segment?', 'Sector area minus triangle area', 'Sector area plus triangle area', 'Triangle area minus sector area', 'The sector contains the triangle and the segment.', 'Remove the central triangle from the sector.', 'The remaining region is the minor segment.'],
  ['p1_series_geometric_infinity_sum', 'Find the sum to infinity of $8-4+2-1+\\cdots$.', '$16/3$', '4', '16', 'Here $a=8$ and $r=-1/2$.', '$|r|<1$, so the series converges.', '$S_\\infty=8/(1+1/2)=16/3$.'],
] satisfies RetrySeed[]).map(reviewedRetry);

const retryBySkillId = new Map(P1_RETRY_CHECKED_PRACTICE.map((retry) => [
  retry.retryVariantId.replace(':retry-1', ''),
  retry,
]));

export const P1_SKILL_STUDY_CONTENT: P1SkillStudyContent[] = P1_PRIMARY_SKILL_STUDY_CONTENT.map((primary) => ({
  ...primary,
  checkedPracticeRetry: retryBySkillId.get(primary.skillId),
}));

const contentBySkillId = new Map(P1_SKILL_STUDY_CONTENT.map((content) => [content.skillId, content]));

export const P1_TOPIC_STUDY_CONTENT: P1TopicStudyContent[] = P1_STUDY_TOPICS.map((topic) => {
  const skillIds = P1_SKILL_CONTRACT.filter((skill) => skill.topicId === topic.id).map((skill) => skill.id);
  const skillContent = skillIds.map((skillId) => contentBySkillId.get(skillId)).filter((content): content is P1SkillStudyContent => Boolean(content));

  return {
    courseId: P1_COURSE_ID,
    topicId: topic.id,
    topicSlug: topic.slug,
    skillIds,
    learn: skillContent.map((content) => content.learn),
    checkedPractice: skillContent.map((content) => content.checkedPractice),
    checkedPracticeRetries: skillContent.map((content) => content.checkedPracticeRetry),
  };
});

export function getP1TopicStudyContentBySlug(slug: string | undefined): P1TopicStudyContent | undefined {
  return slug ? P1_TOPIC_STUDY_CONTENT.find((topic) => topic.topicSlug === slug) : undefined;
}

export function getCourseTopicStudyContent(courseId: string | undefined): P1TopicStudyContent[] {
  return courseId === P1_COURSE_ID ? P1_TOPIC_STUDY_CONTENT : [];
}
