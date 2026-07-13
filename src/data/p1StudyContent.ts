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
  id: 'correct' | 'distractor-a' | 'distractor-b';
  label: string;
}

export interface P1CheckedPracticeContent {
  itemId: string;
  prompt: string;
  answerType: 'single-choice';
  options: P1CheckedPracticeOption[];
  expectedOptionId: 'correct';
  hint: string;
  workedSolution: string[];
  progressionEligible: true;
  reviewStatus: 'reviewed';
  retryVariantId?: string;
}

export interface P1SkillStudyContent {
  skillId: string;
  learn: P1LearnContent;
  checkedPractice: P1CheckedPracticeContent;
  checkedPracticeRetry: P1CheckedPracticeContent & { retryVariantId: string };
}

export interface P1TopicStudyContent {
  courseId: typeof P1_COURSE_ID;
  topicId: string;
  topicSlug: string;
  learn: P1LearnContent[];
  checkedPractice: P1CheckedPracticeContent[];
  checkedPracticeRetries: (P1CheckedPracticeContent & { retryVariantId: string })[];
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

const skillTitleById = new Map(P1_SKILL_CONTRACT.map((skill) => [skill.id, skill.title]));

function authored(seed: AuthoredContentSeed): P1PrimarySkillStudyContent {
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
      options: [
        { id: 'correct', label: seed.correct },
        { id: 'distractor-a', label: seed.distractorA },
        { id: 'distractor-b', label: seed.distractorB },
      ],
      expectedOptionId: 'correct',
      hint: seed.hint,
      workedSolution: seed.solution,
      progressionEligible: true,
      reviewStatus: 'reviewed',
    },
  };
}

const P1_PRIMARY_SKILL_STUDY_CONTENT: P1PrimarySkillStudyContent[] = [
  authored({
    skillId: 'p1_quad_complete_square', goal: 'Rewrite a quadratic so its vertex is visible.',
    teachingPoints: ['Factor the leading coefficient when it is not 1.', 'Balance the added square term with the constant outside the bracket.'],
    commonError: 'Changing the sign of the bracket shift when reading the vertex.',
    workedPrompt: 'Write $x^2-6x+11$ in completed-square form.',
    workedSteps: ['$x^2-6x=(x-3)^2-9$.', 'Add 11 to obtain $(x-3)^2+2$.'], workedAnswer: '$(x-3)^2+2$',
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
    teachingPoints: ['Choose a substitution that turns the equation into $au^2+bu+c=0$.', 'Solve again after restoring the original expression.'],
    commonError: 'Stopping after finding the temporary variable.',
    workedPrompt: 'Solve $x^4-5x^2+4=0$.', workedSteps: ['Let $u=x^2$, so $u^2-5u+4=0$.', '$u=1$ or $4$, so $x=\\pm1$ or $\\pm2$.'], workedAnswer: '$x=-2,-1,1,2$',
    practicePrompt: 'Which substitution simplifies $(x+1)^2-5(x+1)+6=0$?', correct: '$u=x+1$', distractorA: '$u=x^2$', distractorB: '$u=5x$',
    hint: 'Name the repeated bracket.', solution: ['Both terms use $x+1$.', 'Set $u=x+1$ to obtain $u^2-5u+6=0$.'],
  }),
  authored({
    skillId: 'p1_func_language_domain_range', goal: 'Distinguish permitted inputs from produced outputs.',
    teachingPoints: ['The domain is the set of allowed inputs.', 'The range is the set of values the function actually outputs.'],
    commonError: 'Giving the domain when the question asks for the range.',
    workedPrompt: 'Find the range of $f(x)=x^2+1$ for all real x.', workedSteps: ['$x^2\\ge0$.', 'Therefore $x^2+1\\ge1$.'], workedAnswer: '$[1,\\infty)$',
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
    workedPrompt: 'Find the inverse of $f(x)=3x-4$.', workedSteps: ['$y=3x-4$ gives $x=(y+4)/3$.', 'Swap labels to obtain $f^{-1}(x)=(x+4)/3$.'], workedAnswer: '$f^{-1}(x)=(x+4)/3$',
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
    workedPrompt: 'Describe the change from $y=f(x)$ to $y=f(x-3)+2$.', workedSteps: ['$x-3$ translates the graph 3 units right.', '$+2$ translates it 2 units up.'], workedAnswer: 'Right 3, up 2',
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
    teachingPoints: ['Parallel lines have equal gradients.', 'Perpendicular non-vertical gradients multiply to -1.'],
    commonError: 'Using the negative gradient rather than the negative reciprocal.',
    workedPrompt: 'Find the gradient perpendicular to a line of gradient 3.', workedSteps: ['Let the new gradient be m.', '$3m=-1$, so $m=-1/3$.'], workedAnswer: '$-1/3$',
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
    skillId: 'p1_coord_line_circle_problems', goal: 'Combine algebraic intersections with circle geometry.',
    teachingPoints: ['Substitute the line into the circle for intersection coordinates.', 'A tangent is perpendicular to the radius at contact.'],
    commonError: 'Assuming a tangent gradient equals the radius gradient.',
    workedPrompt: 'A radius to a tangent point has gradient 2. Find the tangent gradient.', workedSteps: ['Radius and tangent are perpendicular.', '$2m=-1$.'], workedAnswer: '$m=-1/2$',
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
    workedPrompt: 'Find the arc length for $r=6$ and $\\theta=\\pi/3$.', workedSteps: ['$s=r\\theta$.', '$s=6\\times\\pi/3=2\\pi$.'], workedAnswer: '$2\\pi$',
    practicePrompt: 'Find the sector area for $r=4$ and $\\theta=\\pi/2$.', correct: '$4\\pi$', distractorA: '$2\\pi$', distractorB: '$8\\pi$',
    hint: 'Use one half times radius squared times angle.', solution: ['$A=\\frac12(4^2)(\\pi/2)$.', 'So $A=4\\pi$.'],
  }),
  authored({
    skillId: 'p1_circ_composite_geometry', goal: 'Assemble a composite perimeter or area from simple pieces.',
    teachingPoints: ['Label every arc, radius, triangle and sector contribution.', 'Use sector minus triangle for a minor segment.'],
    commonError: 'Counting only the curved edge in a perimeter.',
    workedPrompt: 'How is a minor segment area found from its sector and triangle?', workedSteps: ['Find the sector area.', 'Subtract the triangle formed by the two radii and chord.'], workedAnswer: 'Sector area minus triangle area',
    practicePrompt: 'A sector perimeter contains which lengths?', correct: 'Arc plus two radii', distractorA: 'Arc only', distractorB: 'Two radii only',
    hint: 'Trace the full boundary.', solution: ['The curved boundary is the arc.', 'The two straight boundaries are radii.'],
  }),
  authored({
    skillId: 'p1_trig_graphs', goal: 'Sketch transformed trigonometric graphs with correct key features.',
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
    teachingPoints: ['Use $u_n=a+(n-1)d$ for an arithmetic term.', 'Use a sum formula only when the question asks for a total.'],
    commonError: 'Using n instead of n-1 in the nth term.',
    workedPrompt: 'Find the 10th term of $4,7,10,\\ldots$.', workedSteps: ['$a=4$ and $d=3$.', '$u_{10}=4+9(3)=31$.'], workedAnswer: '31',
    practicePrompt: 'Find the sum of the first 5 terms of $2,5,8,\\ldots$.', correct: '40', distractorA: '14', distractorB: '35',
    hint: 'List five terms or use the arithmetic sum formula.', solution: ['The terms are $2,5,8,11,14$.', 'Their sum is 40.'],
  }),
  authored({
    skillId: 'p1_series_geometric_infinity', goal: 'Check convergence before summing infinitely many geometric terms.',
    teachingPoints: ['A geometric progression converges only when $|r|<1$.', 'Then $S_\\infty=a/(1-r)$.'],
    commonError: 'Using the infinity formula when the ratio has magnitude at least 1.',
    workedPrompt: 'Find the sum to infinity of $6+3+1.5+\\cdots$.', workedSteps: ['$a=6$ and $r=1/2$, so it converges.', '$S_\\infty=6/(1-1/2)=12$.'], workedAnswer: '12',
    practicePrompt: 'Does $2-3+4.5-\\cdots$ have a sum to infinity?', correct: 'No, because $|r|=1.5$', distractorA: 'Yes, equal to $4/5$', distractorB: 'Yes, equal to $-1$',
    hint: 'Find the common ratio and test its magnitude.', solution: ['$r=-3/2$.', 'Since $|r|>1$, the progression does not converge.'],
  }),
  authored({
    skillId: 'p1_diff_gradient_limit_notation', goal: 'Interpret first and second derivatives as information about a curve.',
    teachingPoints: ['The first derivative gives instantaneous gradient.', 'The second derivative describes how the gradient changes.'],
    commonError: 'Treating the second derivative as the square of the first derivative.',
    workedPrompt: 'What does $f\\prime(2)=5$ say geometrically?', workedSteps: ['The derivative is the tangent gradient.', 'At x=2, that gradient is 5.'], workedAnswer: 'The tangent at x=2 has gradient 5',
    practicePrompt: 'Which notation is a second derivative?', correct: '$d^2y/dx^2$', distractorA: '$(dy/dx)^2$', distractorB: '$dy/dx$',
    hint: 'Look for the derivative being taken twice.', solution: ['$d^2y/dx^2$ is standard second-derivative notation.', 'It is not the square of $dy/dx$.'],
  }),
  authored({
    skillId: 'p1_diff_power_chain', goal: 'Differentiate powers and simple composites accurately.',
    teachingPoints: ['For $x^n$, multiply by n and reduce the power by one.', 'For a composite, multiply by the inner derivative.'],
    commonError: 'Applying the outer derivative but omitting the inner derivative.',
    workedPrompt: 'Differentiate $(2x+1)^4$.', workedSteps: ['Outer derivative: $4(2x+1)^3$.', 'Multiply by the inner derivative 2.'], workedAnswer: '$8(2x+1)^3$',
    practicePrompt: 'Differentiate $3x^{1/2}$.', correct: '$\\frac32x^{-1/2}$', distractorA: '$3x^{-1/2}$', distractorB: '$\\frac12x^{-1/2}$',
    hint: 'Multiply by the power one half.', solution: ['$3\\times\\frac12=\\frac32$.', 'Reduce the power to $-1/2$.'],
  }),
  authored({
    skillId: 'p1_diff_tangent_normal', goal: 'Turn a derivative value into a line equation.',
    teachingPoints: ['Evaluate the derivative at the stated point.', 'For the normal, use the negative reciprocal gradient.'],
    commonError: 'Finding the gradient but not writing the requested equation.',
    workedPrompt: 'Find the tangent to $y=x^2$ at $(2,4)$.', workedSteps: ['$dy/dx=2x$, so the gradient is 4.', '$y-4=4(x-2)$, hence $y=4x-4$.'], workedAnswer: '$y=4x-4$',
    practicePrompt: 'What is the normal gradient to $y=x^2$ at x=1?', correct: '$-1/2$', distractorA: '2', distractorB: '$1/2$',
    hint: 'First find the tangent gradient.', solution: ['At x=1, the tangent gradient is 2.', 'The normal gradient is the negative reciprocal, $-1/2$.'],
  }),
  authored({
    skillId: 'p1_diff_increasing_decreasing', goal: 'Use derivative signs to describe curve direction.',
    teachingPoints: ['$f\\prime(x)>0$ means increasing.', '$f\\prime(x)<0$ means decreasing.'],
    commonError: 'Using the sign of f(x) instead of the sign of its derivative.',
    workedPrompt: 'For $f\\prime(x)=2x-4$, where is f increasing?', workedSteps: ['Solve $2x-4>0$.', 'This gives $x>2$.'], workedAnswer: '$x>2$',
    practicePrompt: 'For $f\\prime(x)=6-3x$, where is f decreasing?', correct: '$x>2$', distractorA: '$x<2$', distractorB: '$x>6$',
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
    teachingPoints: ['Solve $f\\prime(x)=0$.', 'A positive second derivative gives a local minimum; negative gives a local maximum.'],
    commonError: 'Setting the second derivative to zero to locate every stationary point.',
    workedPrompt: 'Classify the stationary point of $f(x)=x^2-4x$.', workedSteps: ['$f\\prime(x)=2x-4=0$ gives x=2.', '$f\\doubleprime(x)=2>0$, so it is a minimum.'], workedAnswer: 'Local minimum at x=2',
    practicePrompt: 'If $f\\prime(a)=0$ and $f\\doubleprime(a)=-3$, what is the stationary point?', correct: 'A local maximum', distractorA: 'A local minimum', distractorB: 'Not stationary',
    hint: 'Use the sign of the second derivative.', solution: ['The first derivative confirms stationarity.', 'The negative second derivative confirms a local maximum.'],
  }),
  authored({
    skillId: 'p1_int_reverse_power', goal: 'Reverse the power and chain rules for simple integrands.',
    teachingPoints: ['Increase a power by one and divide by the new power.', 'For $(ax+b)^n$, also divide by a.'],
    commonError: 'Forgetting the coefficient from the inner linear expression.',
    workedPrompt: 'Integrate $6(2x+1)^2$.', workedSteps: ['Increase the power to 3.', 'Divide by $2\\times3$, which cancels the factor 6.'], workedAnswer: '$(2x+1)^3+C$',
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
    teachingPoints: ['Use $F(b)-F(a)$.', 'For an allowed improper endpoint, use the limiting value indicated by the expression.'],
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
  return {
    itemId: 'p1-cp-' + skillId.slice(3) + '-retry-1',
    retryVariantId: skillId + ':retry-1',
    prompt,
    answerType: 'single-choice',
    options: [
      { id: 'correct', label: correct },
      { id: 'distractor-a', label: distractorA },
      { id: 'distractor-b', label: distractorB },
    ],
    expectedOptionId: 'correct',
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
  ['p1_quad_substitution_forms', 'Solve $x^4-10x^2+9=0$.', '$x=-3,-1,1,3$', '$x=1,9$', '$x=-3,3$', 'Let $u=x^2$.', '$u^2-10u+9=(u-1)(u-9)=0$.', '$x^2=1$ or 9, so $x=\\pm1,\\pm3$.'],
  ['p1_func_language_domain_range', 'What is the range of $f(x)=(x-1)^2+4$ for real x?', '$y\\ge4$', '$y\\ge1$', '$y>4$', 'A square is never negative.', '$(x-1)^2\\ge0$.', 'The least output is 4, so $y\\ge4$.'],
  ['p1_func_composition', 'For $f(x)=2x+1$ and $g(x)=x-3$, find $gf(x)$.', '$2x-2$', '$2x-5$', '$2x+4$', 'Apply f first, then g.', '$gf(x)=g(2x+1)$.', '$g(2x+1)=2x+1-3=2x-2$.'],
  ['p1_func_one_one_inverse', 'Find the inverse of $f(x)=2x+5$.', '$f^{-1}(x)=(x-5)/2$', '$f^{-1}(x)=2x-5$', '$f^{-1}(x)=(x+5)/2$', 'Solve y=2x+5 for x.', '$x=(y-5)/2$.', 'Swapping labels gives $f^{-1}(x)=(x-5)/2$.'],
  ['p1_func_inverse_graphs', 'The graph of f contains $(-1,4)$. Which point lies on $f^{-1}$?', '$(4,-1)$', '$(1,-4)$', '$(-4,1)$', 'Swap input and output coordinates.', '$f(-1)=4$.', 'Therefore $f^{-1}(4)=-1$, giving $(4,-1)$.'],
  ['p1_func_transformations', 'Describe the transformation from $y=f(x)$ to $y=f(x)+5$.', 'Translation 5 units upward', 'Translation 5 units left', 'Vertical stretch factor 5', 'The change is outside f.', 'Every output increases by 5.', 'The graph translates 5 units upward.'],
  ['p1_coord_line_equations', 'Find the line through $(-1,2)$ with gradient $-2$.', '$y=-2x$', '$y=-2x+4$', '$y=2x+4$', 'Use $y-2=-2(x+1)$.', '$y-2=-2(x+1)$.', 'Expanding gives $y=-2x$.'],
  ['p1_coord_line_relationships', 'What gradient is perpendicular to a line with gradient $-1/4$?', '4', '$1/4$', '-4', 'Perpendicular gradients multiply to -1.', '$(-1/4)m=-1$.', 'Hence $m=4$.'],
  ['p1_coord_circle_equations', 'State the centre and radius of $(x+4)^2+(y-3)^2=25$.', 'Centre $(-4,3)$, radius 5', 'Centre $(4,-3)$, radius 5', 'Centre $(-4,3)$, radius 25', 'Reverse the bracket signs and square-root 25.', 'The centre is $(-4,3)$.', '$r^2=25$, so the radius is 5.'],
  ['p1_coord_line_circle_problems', 'A radius has gradient $-3$ at contact. What is the tangent gradient?', '$1/3$', '-3', '3', 'The radius and tangent are perpendicular.', '$(-3)m=-1$.', 'The tangent gradient is $m=1/3$.'],
  ['p1_coord_graph_intersections', 'Which discriminant condition means a line crosses a quadratic curve at two points?', '$D>0$', '$D=0$', '$D<0$', 'Two crossing points give two distinct roots.', 'Equating the graphs produces a quadratic.', 'Two distinct real roots require $D>0$.'],
  ['p1_circ_radians_degrees', 'Convert $225^\\circ$ to radians.', '$5\\pi/4$', '$4\\pi/5$', '$3\\pi/4$', 'Multiply by $\\pi/180$.', '$225\\times\\pi/180$.', 'Simplifying gives $5\\pi/4$.'],
  ['p1_circ_arc_sector', 'Find the sector area when $r=3$ and $\\theta=2$ radians.', '9', '6', '18', 'Use $A=\\frac12r^2\\theta$.', '$A=\\frac12(3^2)(2)$.', 'Therefore $A=9$.'],
  ['p1_circ_composite_geometry', 'Which calculation gives the area of a minor circular segment?', 'Sector area minus triangle area', 'Sector area plus triangle area', 'Triangle area minus sector area', 'The segment is the part outside the central triangle.', 'The sector contains the triangle and segment.', 'Subtract the triangle to leave the segment.'],
  ['p1_trig_graphs', 'What is the period of $y=\\sin(x/2)$?', '$4\\pi$', '$\\pi$', '$2\\pi$', 'Divide $2\\pi$ by the coefficient $1/2$.', 'The x coefficient is $1/2$.', '$2\\pi/(1/2)=4\\pi$.'],
  ['p1_trig_exact_values', 'Find the exact value of $\\cos240^\\circ$.', '$-1/2$', '$1/2$', '$-\\sqrt3/2$', 'Use a 60-degree reference angle in quadrant III.', 'Cosine is negative in quadrant III.', '$\\cos60^\\circ=1/2$, so $\\cos240^\\circ=-1/2$.'],
  ['p1_trig_inverse_principal', 'Find the principal value of $\\tan^{-1}(1)$ in degrees.', '$45^\\circ$', '$135^\\circ$', '$225^\\circ$', 'Use the principal inverse-tangent range.', '$\\tan45^\\circ=1$.', 'The principal value is $45^\\circ$.'],
  ['p1_trig_identities', 'Simplify $\\sin^2x/(1-\\cos^2x)$ where defined.', '1', '$\\sin x$', '$\\tan^2x$', 'Use $1-\\cos^2x=\\sin^2x$.', 'Replace the denominator by $\\sin^2x$.', 'The quotient is 1 where defined.'],
  ['p1_trig_equations_intervals', 'Solve $\\tan x=0$ for $0^\\circ\\le x\\le360^\\circ$.', '$x=0^\\circ,180^\\circ,360^\\circ$', '$x=90^\\circ,270^\\circ$', '$x=0^\\circ,360^\\circ$', 'Tangent is zero every 180 degrees.', 'The reference solution is $0^\\circ$.', 'Including endpoints gives 0, 180 and 360 degrees.'],
  ['p1_series_binomial', 'Find the coefficient of $x^3$ in $(2+x)^4$.', '8', '4', '16', 'Use three x factors and one factor of 2.', 'The term is $\\binom43 2x^3$.', 'Its coefficient is $4\\times2=8$.'],
  ['p1_series_progression_recognition', 'Classify $81,27,9,3,\\ldots$.', 'Geometric, ratio $1/3$', 'Arithmetic, difference -54', 'Geometric, ratio 3', 'Divide consecutive terms.', '$27/81=1/3$ and $9/27=1/3$.', 'The constant ratio makes it geometric.'],
  ['p1_series_finite_sums', 'Find the sum of the first four terms of $3,6,12,24,\\ldots$.', '45', '24', '48', 'Add the four shown terms.', '$3+6+12+24$.', 'The total is 45.'],
  ['p1_series_geometric_infinity', 'Find the sum to infinity of $8-4+2-1+\\cdots$.', '$16/3$', '4', '16', 'Here $a=8$ and $r=-1/2$.', '$|r|<1$, so the series converges.', '$S_\\infty=8/(1+1/2)=16/3$.'],
  ['p1_diff_gradient_limit_notation', 'What does $f\\doubleprime(x)<0$ say about the gradient of f?', 'The gradient is decreasing', 'The function value is negative', 'The gradient is zero', 'The second derivative tracks change in the first.', '$f\\doubleprime$ describes how $f\\prime$ changes.', 'A negative value means the gradient is decreasing.'],
  ['p1_diff_power_chain', 'Differentiate $(3x-2)^5$.', '$15(3x-2)^4$', '$5(3x-2)^4$', '$15(3x-2)^5$', 'Differentiate outside, then multiply by 3.', 'The outer derivative is $5(3x-2)^4$.', 'Multiplying by 3 gives $15(3x-2)^4$.'],
  ['p1_diff_tangent_normal', 'What is the normal gradient to $y=x^3$ at x=1?', '$-1/3$', '3', '$1/3$', 'Find the tangent gradient, then its negative reciprocal.', '$dy/dx=3x^2$, so the tangent gradient is 3.', 'The normal gradient is $-1/3$.'],
  ['p1_diff_increasing_decreasing', 'If $f\\prime(x)=x+2$, where is f increasing?', '$x>-2$', '$x<-2$', '$x>2$', 'Solve $f\\prime(x)>0$.', '$x+2>0$.', 'Therefore f increases for $x>-2$.'],
  ['p1_diff_connected_rates', 'A square side grows at 3 cm/s. Find $dA/dt$ when the side is 4 cm.', '24 cm$^2$/s', '12 cm$^2$/s', '48 cm$^2$/s', 'Differentiate $A=s^2$ with respect to time.', '$dA/dt=2s\\,ds/dt$.', 'At s=4 and $ds/dt=3$, the rate is 24 cm$^2$/s.'],
  ['p1_diff_stationary_classification', 'If $f\\prime(a)=0$ and $f\\doubleprime(a)=5$, classify the stationary point.', 'A local minimum', 'A local maximum', 'A point of inflexion', 'Use the positive second-derivative test.', '$f\\prime(a)=0$ confirms stationarity.', '$f\\doubleprime(a)>0$ gives a local minimum.'],
  ['p1_int_reverse_power', 'Integrate $3(3x+1)^2$.', '$(3x+1)^3/3+C$', '$(3x+1)^3+C$', '$9(3x+1)+C$', 'Increase the power and divide by the inner coefficient.', 'An antiderivative of $(3x+1)^2$ is $(3x+1)^3/9$.', 'Multiplying by 3 gives $(3x+1)^3/3+C$.'],
  ['p1_int_constant', 'A curve has $dy/dx=2x+1$ and passes through $(0,4)$. Find C in $y=x^2+x+C$.', '4', '0', '1', 'Substitute the given point.', '$4=0^2+0+C$.', 'Therefore $C=4$.'],
  ['p1_int_definite', 'Evaluate $\\int_1^2 3x^2\\,dx$.', '7', '8', '9', 'Use the antiderivative $x^3$.', 'Evaluate $[x^3]_1^2$.', '$2^3-1^3=7$.'],
  ['p1_int_areas', 'On $0\\le x\\le1$, which integrand gives the area between $y=x$ and $y=x^2$?', '$x-x^2$', '$x^2-x$', '$x+x^2$', 'Identify the upper curve on this interval.', '$x\\ge x^2$ on $0\\le x\\le1$.', 'Top minus bottom is $x-x^2$.'],
  ['p1_int_volumes', 'For rotation about the y-axis using $x=g(y)$, which disk integrand is required?', '$\\pi[g(y)]^2$', '$2\\pi g(y)$', '$\\pi g(y)$', 'The horizontal distance x is the disk radius.', 'A disk of radius $g(y)$ has area $\\pi[g(y)]^2$.', 'Integrate this expression with respect to y.'],
] satisfies RetrySeed[]).map(reviewedRetry);

const retryBySkillId = new Map(P1_RETRY_CHECKED_PRACTICE.map((retry) => [
  retry.retryVariantId.replace(':retry-1', ''),
  retry,
]));

export const P1_SKILL_STUDY_CONTENT: P1SkillStudyContent[] = P1_PRIMARY_SKILL_STUDY_CONTENT.map((primary) => ({
  ...primary,
  checkedPracticeRetry: retryBySkillId.get(primary.skillId)!,
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
