import type { CourseId } from './courses';

export const DRAFT_SEED_CONTENT_LABEL = 'Draft seed content - needs syllabus-contract review.';

export type DraftSeedCourseId = Exclude<CourseId, 'p3'>;

export interface CourseSeedTopicSection {
  id: string;
  title: string;
  purpose: string;
  bullets: string[];
}

export interface CourseSeedTopic {
  courseId: DraftSeedCourseId;
  id: string;
  slug: string;
  syllabusRef: string;
  title: string;
  shortTitle: string;
  description: string;
  headerFormula: string;
  formulas: string[];
  studentGoals: string[];
  keyIdeas: string[];
  workedMethod: string[];
  commonMistakes: string[];
  selfChecks: string[];
  examStyle: string[];
  practiceHook: string;
  examTrainingHook: string;
  fieldGuideSections: CourseSeedTopicSection[];
}

const p1Topics: CourseSeedTopic[] = [
  {
    courseId: 'p1',
    id: 'p1-quadratics',
    slug: 'quadratics',
    syllabusRef: '9709 P1 1.1',
    title: 'Quadratics',
    shortTitle: 'Quadratics',
    description: 'Solve and interpret quadratic equations, graphs, discriminants, and completed-square forms.',
    headerFormula: 'b^2-4ac,\\quad a(x-h)^2+k',
    formulas: ['$b^2-4ac$', '$x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$', '$a(x-h)^2+k$'],
    studentGoals: [
      'Solve quadratics by factorising, completing the square, or using the formula.',
      'Use the discriminant to decide how many real roots exist.',
      'Read turning points and intercepts from algebraic forms.',
    ],
    keyIdeas: [
      'The form of the quadratic usually tells you the fastest method.',
      'Completing the square exposes the turning point and helps with range questions.',
      'The discriminant is a root-counting tool before it is a solving tool.',
    ],
    workedMethod: [
      'Put the equation in $ax^2+bx+c=0$ form and check whether it factorises cleanly.',
      'If a graph or range is involved, complete the square so the vertex is visible.',
      'If a parameter controls roots, write $D=b^2-4ac$ and apply $D>0$, $D=0$, or $D<0$.',
      'Interpret the algebra in the language of the question: roots, intersections, tangent, or minimum value.',
    ],
    commonMistakes: [
      'Using the quadratic formula before making one side equal to zero.',
      'Forgetting that $D=0$ means a repeated root, not no roots.',
      'Reading the wrong sign for the vertex after completing the square.',
    ],
    selfChecks: [
      'Can you complete the square for $x^2-6x+11$ and state its minimum value?',
      'What condition on $k$ gives two distinct roots for $x^2+kx+4=0$?',
      'How do roots of a quadratic connect to x-intercepts on its graph?',
    ],
    examStyle: [
      'Expect short algebra parts asking for roots, a range, or a parameter condition.',
      'Graph questions often combine a completed-square form with a transformation or intersection.',
    ],
    practiceHook: 'Seed practice will begin with discriminant checks, then mix solving and graph interpretation.',
    examTrainingHook: 'Later exam training should pair each quadratic result with the mark-scheme method condition.',
    fieldGuideSections: [
      {
        id: 'p1-quadratics-method-choice',
        title: 'Choose the method from the form',
        purpose: 'Avoid slow algebra by matching factorising, completing the square, or formula use to the question.',
        bullets: [
          'Factorise when integer roots are visible.',
          'Complete the square for turning points, ranges, and sketching.',
          'Use the formula or discriminant when roots are not tidy or include parameters.',
        ],
      },
      {
        id: 'p1-quadratics-root-conditions',
        title: 'Root conditions',
        purpose: 'Use the discriminant to translate graph language into algebra.',
        bullets: [
          '$D>0$ means two distinct real roots.',
          '$D=0$ means a repeated root or tangency.',
          '$D<0$ means no real roots and no x-axis crossing.',
        ],
      },
    ],
  },
  {
    courseId: 'p1',
    id: 'p1-functions',
    slug: 'functions',
    syllabusRef: '9709 P1 1.2',
    title: 'Functions',
    shortTitle: 'Functions',
    description: 'Work with function notation, domains, ranges, composite functions, inverses, and graph transformations.',
    headerFormula: 'fg(x),\\quad f^{-1}(x),\\quad y=f(x-a)+b',
    formulas: ['$fg(x)=f(g(x))$', '$f^{-1}(f(x))=x$', '$y=f(x-a)+b$'],
    studentGoals: [
      'Find composite functions in the correct order.',
      'Find inverse functions and state restrictions when needed.',
      'Describe simple graph transformations accurately.',
    ],
    keyIdeas: [
      'Function order matters: $fg(x)$ means apply $g$ first, then $f$.',
      'Inverses swap inputs and outputs, so domain and range swap too.',
      'Graph transformations are easiest when read from the outside of $f(x)$.',
    ],
    workedMethod: [
      'For a composite, substitute the whole inner expression into the outer function.',
      'For an inverse, write $y=f(x)$, swap $x$ and $y$, then solve for $y$.',
      'Check whether a restricted domain is needed to make the inverse a function.',
      'For transformations, describe horizontal changes inside the bracket and vertical changes outside.',
    ],
    commonMistakes: [
      'Reversing $fg$ and $gf$.',
      'Finding an inverse but forgetting the domain or range.',
      'Saying $f(x-a)$ shifts left; it shifts right by $a$.',
    ],
    selfChecks: [
      'If $f(x)=2x+3$ and $g(x)=x^2$, what is $fg(x)$?',
      'Why might $x^2$ need a restricted domain before an inverse exists?',
      'What transformation takes $y=f(x)$ to $y=f(x+4)-2$?',
    ],
    examStyle: [
      'Expect compact questions where notation accuracy carries most of the marks.',
      'Transformation parts often ask for a description rather than a full sketch.',
    ],
    practiceHook: 'Seed practice will use short composite, inverse, and transformation prompts.',
    examTrainingHook: 'Later exam training should check whether notation and domain statements earn method marks.',
    fieldGuideSections: [
      {
        id: 'p1-functions-composition',
        title: 'Composite order',
        purpose: 'Read $fg(x)$ as a process rather than a product.',
        bullets: [
          'Write the inner function in brackets before expanding.',
          'Keep restrictions from the inner function visible.',
          'Compare $fg$ and $gf$ only after both are formed.',
        ],
      },
      {
        id: 'p1-functions-inverses',
        title: 'Inverse route',
        purpose: 'Use a repeatable swap-and-solve method for inverses.',
        bullets: [
          'Start with $y=f(x)$.',
          'Swap $x$ and $y$, then solve for $y$.',
          'State the inverse domain from the original range when the question requires it.',
        ],
      },
    ],
  },
  {
    courseId: 'p1',
    id: 'p1-coordinate-geometry',
    slug: 'coordinate-geometry',
    syllabusRef: '9709 P1 1.3',
    title: 'Coordinate Geometry',
    shortTitle: 'Coordinate Geometry',
    description: 'Use gradient, distance, midpoint, line equations, intersections, and simple geometric conditions.',
    headerFormula: 'm=\\frac{y_2-y_1}{x_2-x_1},\\quad y-y_1=m(x-x_1)',
    formulas: ['$m=\\frac{y_2-y_1}{x_2-x_1}$', '$y-y_1=m(x-x_1)$', '$d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$'],
    studentGoals: [
      'Find gradients and equations of straight lines.',
      'Use parallel and perpendicular gradient relationships.',
      'Combine algebra and geometry to locate points or intersections.',
    ],
    keyIdeas: [
      'Gradient is a rate of change and a line descriptor.',
      'Parallel lines have equal gradients; perpendicular lines have gradients with product $-1$ when both are finite.',
      'Coordinate geometry answers often need both a diagram idea and an algebra equation.',
    ],
    workedMethod: [
      'Sketch the situation lightly and label known coordinates.',
      'Find the needed gradient, length, midpoint, or equation.',
      'Use simultaneous equations for intersections.',
      'Check whether the final point fits the geometric condition in the question.',
    ],
    commonMistakes: [
      'Using the reciprocal instead of the negative reciprocal for perpendicular gradients.',
      'Losing signs in the gradient formula.',
      'Solving line intersections but not answering the actual geometry question.',
    ],
    selfChecks: [
      'What is the gradient of the line through $(2,5)$ and $(6,1)$?',
      'How do you find the perpendicular bisector of a chord or segment?',
      'Why is a quick sketch useful before setting up equations?',
    ],
    examStyle: [
      'Questions often chain two or three short line facts together.',
      'A final coordinate may depend on solving two linear equations accurately.',
    ],
    practiceHook: 'Seed practice will start with line equations before adding intersections and perpendicular conditions.',
    examTrainingHook: 'Later exam training should make students justify each geometric condition used.',
    fieldGuideSections: [
      {
        id: 'p1-coordinate-lines',
        title: 'Line equations',
        purpose: 'Move cleanly between points, gradients, and equation forms.',
        bullets: [
          'Use two points to find a gradient.',
          'Use point-gradient form before rearranging.',
          'Only convert to $y=mx+c$ when it helps the next step.',
        ],
      },
      {
        id: 'p1-coordinate-geometry-conditions',
        title: 'Geometry conditions',
        purpose: 'Translate words such as parallel, perpendicular, and midpoint into equations.',
        bullets: [
          'Parallel means same gradient.',
          'Perpendicular means negative reciprocal gradient.',
          'A midpoint gives two average-coordinate equations.',
        ],
      },
    ],
  },
  {
    courseId: 'p1',
    id: 'p1-circular-measure',
    slug: 'circular-measure',
    syllabusRef: '9709 P1 1.4',
    title: 'Circular Measure',
    shortTitle: 'Circular Measure',
    description: 'Use radians, arc length, sector area, and basic circular geometry in exact or decimal form.',
    headerFormula: 's=r\\theta,\\quad A=\\frac12r^2\\theta',
    formulas: ['$s=r\\theta$', '$A=\\frac12r^2\\theta$', '$180^\\circ=\\pi\\text{ radians}$'],
    studentGoals: [
      'Convert between degrees and radians.',
      'Find arc lengths and sector areas.',
      'Combine sector and triangle areas in compound shapes.',
    ],
    keyIdeas: [
      'Radians make circular formulae short; the angle must be in radians.',
      'A sector area is proportional to the angle at the centre.',
      'Compound-region questions usually subtract triangles or smaller sectors.',
    ],
    workedMethod: [
      'Convert the angle to radians if it is given in degrees.',
      'Identify whether the question asks for arc length, area, perimeter, or a shaded region.',
      'Apply $s=r\\theta$ or $A=\\frac12r^2\\theta$ to each sector.',
      'Add or subtract simple shapes carefully and state units.',
    ],
    commonMistakes: [
      'Using degrees directly in radian formulae.',
      'Forgetting straight sides when finding a sector perimeter.',
      'Subtracting the wrong triangle or sector in a shaded-area question.',
    ],
    selfChecks: [
      'What is $60^\\circ$ in radians?',
      'How do sector area and arc length change if the angle doubles?',
      'What extra lengths are included in the perimeter of a sector?',
    ],
    examStyle: [
      'Expect a diagram with one or two linked circular formulae.',
      'Marks usually credit correct radian conversion, formula use, and compound-area setup.',
    ],
    practiceHook: 'Seed practice will use one-step sectors before shaded-region setups.',
    examTrainingHook: 'Later exam training should include diagram annotation before calculation.',
    fieldGuideSections: [
      {
        id: 'p1-circular-radians',
        title: 'Radians first',
        purpose: 'Make radian conversion automatic before using circular formulae.',
        bullets: [
          'Multiply degrees by $\\pi/180$ to get radians.',
          'Multiply radians by $180/\\pi$ to get degrees.',
          'Keep exact multiples of $\\pi$ where possible.',
        ],
      },
      {
        id: 'p1-circular-compound',
        title: 'Compound shapes',
        purpose: 'Break shaded regions into sectors and ordinary triangles.',
        bullets: [
          'Write one expression for each visible region.',
          'Use $\\frac12ab\\sin C$ when a triangle sits inside a sector.',
          'Check whether perimeter includes radii as well as arcs.',
        ],
      },
    ],
  },
  {
    courseId: 'p1',
    id: 'p1-trigonometry',
    slug: 'trigonometry',
    syllabusRef: '9709 P1 1.5',
    title: 'Trigonometry',
    shortTitle: 'Trigonometry',
    description: 'Use trigonometric ratios, identities, equations, exact values, and graph behaviour.',
    headerFormula: '\\sin^2x+\\cos^2x=1,\\quad \\tan x=\\frac{\\sin x}{\\cos x}',
    formulas: ['$\\sin^2x+\\cos^2x=1$', '$\\tan x=\\frac{\\sin x}{\\cos x}$', '$\\frac12ab\\sin C$'],
    studentGoals: [
      'Use exact values and basic identities confidently.',
      'Solve trigonometric equations over a stated interval.',
      'Connect graph shape, period, and transformations to solutions.',
    ],
    keyIdeas: [
      'The interval controls how many solutions are valid.',
      'Identities let you rewrite an equation into one trigonometric function.',
      'A calculator answer is usually only the first angle; symmetry gives the rest.',
    ],
    workedMethod: [
      'Simplify using identities until the equation has one main trigonometric function.',
      'Find the principal solution from exact values or a calculator.',
      'Use the graph or CAST-style symmetry to list every solution in the interval.',
      'Substitute solutions back into the transformed equation when extraneous values are possible.',
    ],
    commonMistakes: [
      'Giving only one solution when the interval contains more.',
      'Mixing degrees and radians without noticing the question setting.',
      'Dividing by a trigonometric expression and losing possible solutions.',
    ],
    selfChecks: [
      'How many solutions does $\\sin x=\\frac12$ have on $0^\\circ\\le x\\le360^\\circ$?',
      'When is it unsafe to divide both sides by $\\cos x$?',
      'How does the period of $\\sin 2x$ compare with $\\sin x$?',
    ],
    examStyle: [
      'Equations usually require interval discipline and exact or rounded answers as specified.',
      'Graph or identity parts may be paired with simple geometry.',
    ],
    practiceHook: 'Seed practice will focus on solution listing and identity substitution.',
    examTrainingHook: 'Later exam training should require students to state the interval method, not just final angles.',
    fieldGuideSections: [
      {
        id: 'p1-trig-identity-route',
        title: 'Identity route',
        purpose: 'Choose an identity that reduces the number of functions in the equation.',
        bullets: [
          'Replace $\\tan x$ with $\\sin x/\\cos x$ when useful.',
          'Replace $\\sin^2x$ or $\\cos^2x$ using $\\sin^2x+\\cos^2x=1$.',
          'Avoid cancelling a factor that could be zero.',
        ],
      },
      {
        id: 'p1-trig-all-solutions',
        title: 'All solutions in the interval',
        purpose: 'Turn one reference angle into the complete solution set.',
        bullets: [
          'Draw or imagine the sine, cosine, or tangent graph.',
          'Use the given interval boundaries exactly.',
          'Round only at the final step unless the question asks otherwise.',
        ],
      },
    ],
  },
  {
    courseId: 'p1',
    id: 'p1-series',
    slug: 'series',
    syllabusRef: '9709 P1 1.6',
    title: 'Series',
    shortTitle: 'Series',
    description: 'Use arithmetic and geometric progressions, sums, and binomial expansions with appropriate conditions.',
    headerFormula: 'S_n=\\frac n2(2a+(n-1)d),\\quad a(1-r^n)/(1-r)',
    formulas: ['$u_n=a+(n-1)d$', '$S_n=\\frac n2(2a+(n-1)d)$', '$S_n=\\frac{a(1-r^n)}{1-r}$'],
    studentGoals: [
      'Identify arithmetic and geometric sequences from term relationships.',
      'Find terms, sums, and unknown constants.',
      'Use binomial expansion for positive integer powers.',
    ],
    keyIdeas: [
      'Arithmetic means constant difference; geometric means constant ratio.',
      'Most series problems are equation setup problems before they are calculation problems.',
      'Binomial coefficients follow a predictable row pattern.',
    ],
    workedMethod: [
      'Decide whether the sequence is arithmetic, geometric, or binomial.',
      'Write the relevant term or sum formula before substituting values.',
      'Use simultaneous equations if the first term and difference or ratio are unknown.',
      'Check whether a geometric ratio gives a sensible sign and magnitude for the context.',
    ],
    commonMistakes: [
      'Using $n$ instead of $n-1$ in term formulae.',
      'Confusing common difference with common ratio.',
      'Dropping terms or powers in binomial expansion.',
    ],
    selfChecks: [
      'What is the fifth term of an AP with first term 7 and difference -3?',
      'How do you tell from two consecutive terms whether a sequence might be geometric?',
      'What are the coefficients in the expansion of $(1+x)^4$?',
    ],
    examStyle: [
      'Series questions often hide an AP or GP inside a worded context.',
      'Binomial expansion parts usually test correct coefficient and power ordering.',
    ],
    practiceHook: 'Seed practice will alternate AP, GP, and binomial recognition prompts.',
    examTrainingHook: 'Later exam training should include formula selection as a visible first mark.',
    fieldGuideSections: [
      {
        id: 'p1-series-ap-gp',
        title: 'AP or GP',
        purpose: 'Identify the sequence type before selecting a formula.',
        bullets: [
          'Check differences for AP behaviour.',
          'Check ratios for GP behaviour.',
          'Use term formulae before sum formulae when unknowns appear.',
        ],
      },
      {
        id: 'p1-series-binomial',
        title: 'Binomial expansion',
        purpose: 'Keep coefficients, powers, and signs ordered.',
        bullets: [
          'Write the coefficient row first.',
          'Decrease the first power while increasing the second.',
          'Track negative signs through the powered term.',
        ],
      },
    ],
  },
  {
    courseId: 'p1',
    id: 'p1-differentiation',
    slug: 'differentiation',
    syllabusRef: '9709 P1 1.7',
    title: 'Differentiation',
    shortTitle: 'Differentiation',
    description: 'Differentiate simple powers and use derivatives for gradients, tangents, normals, and stationary points.',
    headerFormula: '\\frac{d}{dx}x^n=nx^{n-1},\\quad f\\prime(x)=0',
    formulas: ['$\\frac{d}{dx}x^n=nx^{n-1}$', '$m_{\\text{normal}}=-1/m_{\\text{tangent}}$', '$f\\prime(x)=0$'],
    studentGoals: [
      'Differentiate polynomials and simple powers.',
      'Find tangents and normals at a point.',
      'Locate and classify stationary points from derivative signs or second derivatives where appropriate.',
    ],
    keyIdeas: [
      'A derivative is the gradient of a curve at a point.',
      'Tangents use the derivative gradient; normals use the negative reciprocal.',
      'Stationary points happen where the derivative is zero or undefined in the relevant domain.',
    ],
    workedMethod: [
      'Differentiate each term using the power rule.',
      'Substitute the x-coordinate to get the tangent gradient.',
      'Use the curve equation to find the y-coordinate if needed.',
      'Form the line equation or solve $f\\prime(x)=0$ for stationary points.',
    ],
    commonMistakes: [
      'Using the original function instead of the derivative for gradient.',
      'Forgetting the negative reciprocal for a normal.',
      'Solving $f(x)=0$ instead of $f\\prime(x)=0$ for stationary points.',
    ],
    selfChecks: [
      'Differentiate $3x^4-5x^2+7$.',
      'What is the normal gradient if the tangent gradient is $2/3$?',
      'Why does $f\\prime(x)=0$ matter for a maximum or minimum?',
    ],
    examStyle: [
      'Derivative questions frequently combine curve gradient, line equation, and stationary-point interpretation.',
      'Marks usually credit a clear derivative, correct substitution, and a final geometric statement.',
    ],
    practiceHook: 'Seed practice will use short derivative-to-line and derivative-to-turning-point chains.',
    examTrainingHook: 'Later exam training should separate calculus errors from line-equation errors.',
    fieldGuideSections: [
      {
        id: 'p1-differentiation-power-rule',
        title: 'Power rule fluency',
        purpose: 'Differentiate powers accurately before applying geometry.',
        bullets: [
          'Bring the power down as a multiplier.',
          'Reduce the power by one.',
          'Rewrite roots or reciprocals as powers first when needed.',
        ],
      },
      {
        id: 'p1-differentiation-lines',
        title: 'Tangents, normals, and stationary points',
        purpose: 'Turn derivative values into geometric answers.',
        bullets: [
          'Tangent gradient is $f\\prime(a)$.',
          'Normal gradient is the negative reciprocal.',
          'Stationary points come from $f\\prime(x)=0$ and need coordinates.',
        ],
      },
    ],
  },
  {
    courseId: 'p1',
    id: 'p1-integration',
    slug: 'integration',
    syllabusRef: '9709 P1 1.8',
    title: 'Integration',
    shortTitle: 'Integration',
    description: 'Integrate simple powers, use constants of integration, evaluate definite integrals, and find areas.',
    headerFormula: '\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C',
    formulas: ['$\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C$', '$\\int_a^b f(x)\\,dx=F(b)-F(a)$'],
    studentGoals: [
      'Reverse the power rule for simple functions.',
      'Use a point on a curve to find the constant of integration.',
      'Calculate areas under curves and between simple curves.',
    ],
    keyIdeas: [
      'Indefinite integration gives a family of curves, so $+C$ matters.',
      'Definite integration produces a signed area unless the region is handled carefully.',
      'Area between curves needs upper minus lower over the correct interval.',
    ],
    workedMethod: [
      'Raise each power by one and divide by the new power.',
      'Add $C$ for an indefinite integral and use any given point to find it.',
      'For a definite integral, substitute upper and lower limits into the antiderivative.',
      'For area between curves, find intersections first and integrate top minus bottom.',
    ],
    commonMistakes: [
      'Forgetting $+C$ in an indefinite integral.',
      'Dividing by the old power instead of the new power.',
      'Treating negative signed area as actual area without checking the graph.',
    ],
    selfChecks: [
      'Integrate $6x^2-4x+1$.',
      'How do you use the point $(1,5)$ after integrating a gradient function?',
      'Why might $\\int_a^b f(x)\\,dx$ be negative even when an area is positive?',
    ],
    examStyle: [
      'Integration questions often ask for a curve equation, a definite integral, or a shaded area.',
      'Area questions usually credit intersection setup as well as integration accuracy.',
    ],
    practiceHook: 'Seed practice will start with reverse power rule and add constants, limits, and simple areas.',
    examTrainingHook: 'Later exam training should ask students to show antiderivative and limit substitution lines.',
    fieldGuideSections: [
      {
        id: 'p1-integration-power-rule',
        title: 'Reverse power rule',
        purpose: 'Build the antiderivative without losing constants or powers.',
        bullets: [
          'Increase the power by one.',
          'Divide by the new power.',
          'Add $C$ unless definite limits are already present.',
        ],
      },
      {
        id: 'p1-integration-area',
        title: 'Definite integrals and area',
        purpose: 'Use limits and graph position to decide the correct area expression.',
        bullets: [
          'Find intersection x-values when the interval is not given.',
          'Use upper curve minus lower curve.',
          'Check whether signed area needs an absolute value or split interval.',
        ],
      },
    ],
  },
];

const m1Topics: CourseSeedTopic[] = [
  {
    courseId: 'm1',
    id: 'm1-forces-equilibrium',
    slug: 'forces-equilibrium',
    syllabusRef: '9709 M1 4.1',
    title: 'Forces and Equilibrium',
    shortTitle: 'Forces',
    description: 'Model particles with force diagrams, resolved components, weight, tension, normal reaction, and equilibrium conditions.',
    headerFormula: '\\sum F_x=0,\\quad \\sum F_y=0,\\quad W=mg',
    formulas: ['$W=mg$', '$\\sum F_x=0$', '$\\sum F_y=0$'],
    studentGoals: [
      'Draw a complete force diagram for a particle.',
      'Resolve forces horizontally and vertically or parallel and perpendicular to a plane.',
      'Use equilibrium equations to find unknown forces.',
    ],
    keyIdeas: [
      'Equilibrium means no acceleration, so resultant force is zero.',
      'A good diagram prevents most sign and missing-force errors.',
      'Choose axes that make the most forces easy to resolve.',
    ],
    workedMethod: [
      'Draw the particle and label every force with direction.',
      'Choose axes, usually along and perpendicular to a slope when one exists.',
      'Resolve each angled force into components.',
      'Set the sum of forces in each direction to zero and solve the simultaneous equations.',
    ],
    commonMistakes: [
      'Leaving weight off the diagram.',
      'Resolving weight with sine and cosine swapped on an inclined plane.',
      'Using $F=ma$ with $a\\ne0$ in an equilibrium question.',
    ],
    selfChecks: [
      'What forces act on a block resting on a rough horizontal surface?',
      'Why is the normal reaction perpendicular to the surface?',
      'If a particle is in equilibrium, what is the resultant force?',
    ],
    examStyle: [
      'Expect diagram-first questions with unknown tension, reaction, or applied force.',
      'Marks often attach to a correct force diagram and two resolved equations.',
    ],
    practiceHook: 'Seed practice will start with free-body diagrams and one or two unknown force equations.',
    examTrainingHook: 'Later exam training should check whether the model assumptions are stated from the diagram.',
    fieldGuideSections: [
      {
        id: 'm1-forces-diagrams',
        title: 'Free-body diagrams',
        purpose: 'Make every force visible before writing equations.',
        bullets: [
          'Weight acts vertically downward.',
          'Normal reaction is perpendicular to the contact surface.',
          'Tension acts along the string away from the particle.',
        ],
      },
      {
        id: 'm1-forces-resolving',
        title: 'Resolving in equilibrium',
        purpose: 'Turn a diagram into two zero-resultant equations.',
        bullets: [
          'Choose convenient perpendicular axes.',
          'Resolve angled forces once and keep signs consistent.',
          'Use $\\sum F=0$ in each direction.',
        ],
      },
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-kinematics',
    slug: 'kinematics',
    syllabusRef: '9709 M1 4.2',
    title: 'Kinematics of Motion in a Straight Line',
    shortTitle: 'Kinematics',
    description: 'Describe straight-line motion using displacement, velocity, acceleration, constant-acceleration formulae, and motion graphs.',
    headerFormula: 'v=u+at,\\quad s=ut+\\frac12at^2',
    formulas: ['$v=u+at$', '$s=ut+\\frac12at^2$', '$v^2=u^2+2as$'],
    studentGoals: [
      'Select the correct constant-acceleration formula.',
      'Interpret displacement-time and velocity-time graphs.',
      'Handle direction and sign in one-dimensional motion.',
    ],
    keyIdeas: [
      'State which direction is positive before using signs.',
      'Velocity-time graph area gives displacement; gradient gives acceleration.',
      'A formula is only valid over an interval of constant acceleration.',
    ],
    workedMethod: [
      'List known values with signs and units.',
      'Choose the suvat formula containing the unknown and known quantities.',
      'Solve the equation, then interpret sign and direction.',
      'For graphs, use gradient for acceleration and area for displacement.',
    ],
    commonMistakes: [
      'Using distance when displacement with sign is required.',
      'Applying one acceleration value across separate stages.',
      'Forgetting that velocity can be negative.',
    ],
    selfChecks: [
      'Which formula avoids time when $u$, $v$, $a$, and $s$ are involved?',
      'What does the area under a velocity-time graph represent?',
      'How do you show that a particle has changed direction?',
    ],
    examStyle: [
      'Multi-stage motion questions often require separate equations for separate intervals.',
      'Graph questions usually credit labelled gradients, areas, and sign interpretation.',
    ],
    practiceHook: 'Seed practice will begin with formula selection and motion-graph interpretation.',
    examTrainingHook: 'Later exam training should include staged motion with a clear positive-direction statement.',
    fieldGuideSections: [
      {
        id: 'm1-kinematics-suvat',
        title: 'Suvat selection',
        purpose: 'Choose the formula from the known and missing variables.',
        bullets: [
          'Write $s$, $u$, $v$, $a$, and $t$ in a mini table.',
          'Pick the equation that does not include the irrelevant variable.',
          'Use signs consistently for motion in opposite directions.',
        ],
      },
      {
        id: 'm1-kinematics-graphs',
        title: 'Motion graphs',
        purpose: 'Read physical meaning from slope and area.',
        bullets: [
          'Displacement-time gradient is velocity.',
          'Velocity-time gradient is acceleration.',
          'Velocity-time area is displacement, with sign.',
        ],
      },
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-momentum',
    slug: 'momentum',
    syllabusRef: '9709 M1 4.3',
    title: 'Momentum',
    shortTitle: 'Momentum',
    description: 'Use linear momentum, impulse, and conservation of momentum in direct-collision models.',
    headerFormula: 'p=mv,\\quad I=mv-mu',
    formulas: ['$p=mv$', '$I=mv-mu$', '$\\text{total momentum before}=\\text{total momentum after}$'],
    studentGoals: [
      'Calculate momentum and impulse with direction.',
      'Use conservation of momentum for particles in a straight line.',
      'Interpret collision and separation speeds from signs.',
    ],
    keyIdeas: [
      'Momentum is a vector in one-dimensional models, so signs matter.',
      'Momentum is conserved for the system during a collision when external impulse is absent.',
      'Impulse equals change in momentum.',
    ],
    workedMethod: [
      'Choose a positive direction and assign signed velocities.',
      'Write total momentum before and total momentum after.',
      'Set them equal for a closed collision system.',
      'Use impulse as final momentum minus initial momentum for one particle.',
    ],
    commonMistakes: [
      'Treating opposite directions as both positive.',
      'Conserving kinetic energy when only momentum conservation is justified.',
      'Using impulse without direction.',
    ],
    selfChecks: [
      'What is the momentum of a 3 kg particle moving at -4 m s^-1?',
      'When can total momentum be conserved in a collision model?',
      'Why can impulse be negative?',
    ],
    examStyle: [
      'Expect two-particle collisions with one unknown speed or mass.',
      'Impulse parts often follow directly from the collision result.',
    ],
    practiceHook: 'Seed practice will use signed momentum tables before moving to collision equations.',
    examTrainingHook: 'Later exam training should require a declared positive direction for every momentum setup.',
    fieldGuideSections: [
      {
        id: 'm1-momentum-signs',
        title: 'Signed momentum',
        purpose: 'Keep direction attached to every velocity.',
        bullets: [
          'Pick one positive direction at the start.',
          'Use negative velocities for motion opposite that direction.',
          'Do not remove signs just because speed is positive.',
        ],
      },
      {
        id: 'm1-momentum-collisions',
        title: 'Collision equations',
        purpose: 'Build a conservation equation for the whole system.',
        bullets: [
          'Sum momentum before the collision.',
          'Sum momentum after the collision.',
          'Equate the two totals when no external impulse acts.',
        ],
      },
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-newton-laws',
    slug: 'newtons-laws',
    syllabusRef: '9709 M1 4.4',
    title: "Newton's Laws of Motion",
    shortTitle: "Newton's Laws",
    description: 'Apply $F=ma$ to particles, connected bodies, pulleys, and simple models with acceleration.',
    headerFormula: 'F=ma',
    formulas: ['$F=ma$', '$R=mg$ on a horizontal surface when no other vertical forces act'],
    studentGoals: [
      'Draw force diagrams for accelerating particles.',
      'Write equations of motion along the direction of acceleration.',
      'Model connected particles with common acceleration and shared tension.',
    ],
    keyIdeas: [
      'Resultant force, not a single force, equals $ma$.',
      'Connected particles usually share acceleration magnitude.',
      'Tension can be internal to the two-particle system but appears in each separate particle equation.',
    ],
    workedMethod: [
      'Draw a separate force diagram for each particle if bodies are connected.',
      'Choose the positive direction to match the expected acceleration.',
      'Write resultant force equals mass times acceleration for each body.',
      'Solve the equations simultaneously for acceleration and tension or force.',
    ],
    commonMistakes: [
      'Writing $F=ma$ for one force rather than the resultant.',
      'Giving connected particles different accelerations in an inextensible-string model.',
      'Putting tension in the wrong direction on one particle.',
    ],
    selfChecks: [
      'Why does a hanging mass and a table mass usually have the same acceleration magnitude?',
      'What is the resultant force if acceleration is zero?',
      'When should you write separate equations for separate particles?',
    ],
    examStyle: [
      'Connected-particle questions often ask for acceleration first and tension second.',
      'Marks usually credit a correct force diagram and a correct equation for each particle.',
    ],
    practiceHook: 'Seed practice will use one-particle $F=ma$ before connected-particle systems.',
    examTrainingHook: 'Later exam training should make students identify the model assumptions behind common acceleration.',
    fieldGuideSections: [
      {
        id: 'm1-newton-resultant',
        title: 'Resultant force',
        purpose: 'Use all forces in the direction of motion, not just the largest force.',
        bullets: [
          'Add forces in the positive direction.',
          'Subtract forces in the opposite direction.',
          'Set the result equal to $ma$.',
        ],
      },
      {
        id: 'm1-newton-connected',
        title: 'Connected particles',
        purpose: 'Write one equation per body and solve them together.',
        bullets: [
          'Tension pulls each particle along the string.',
          'The string constraint usually gives a shared acceleration magnitude.',
          'Eliminate tension if only acceleration is needed.',
        ],
      },
    ],
  },
  {
    courseId: 'm1',
    id: 'm1-energy-work-power',
    slug: 'energy-work-power',
    syllabusRef: '9709 M1 4.5',
    title: 'Energy, Work and Power',
    shortTitle: 'Energy',
    description: 'Use work done, kinetic energy, potential energy, conservation of energy, and power in simple mechanical models.',
    headerFormula: 'W=Fs,\\quad KE=\\frac12mv^2,\\quad P=Fv',
    formulas: ['$W=Fs$', '$KE=\\frac12mv^2$', '$PE=mgh$', '$P=Fv$'],
    studentGoals: [
      'Calculate work done by constant forces.',
      'Use energy conservation where non-conservative work is absent or accounted for.',
      'Relate power to work rate or force times velocity.',
    ],
    keyIdeas: [
      'Work done transfers energy.',
      'Energy equations are scalar, but signs still matter for gains and losses.',
      'Power describes how quickly work is done.',
    ],
    workedMethod: [
      'Identify initial and final kinetic and potential energy.',
      'Add work done by driving or resistive forces with signs.',
      'Write energy before plus work done equals energy after.',
      'Use $P=Fv$ only when force and velocity are aligned in the model.',
    ],
    commonMistakes: [
      'Using mass instead of weight for work against gravity.',
      'Forgetting resistive work when a resistance force is given.',
      'Using $P=Fv$ with the wrong force or non-instantaneous velocity.',
    ],
    selfChecks: [
      'What is the kinetic energy of a 2 kg particle moving at 5 m s^-1?',
      'How does gravitational potential energy change when height increases by 3 m?',
      'What does a constant power engine imply about force as speed changes?',
    ],
    examStyle: [
      'Expect slope or vertical-height diagrams paired with energy balance.',
      'Power parts may follow after finding speed, force, or work done.',
    ],
    practiceHook: 'Seed practice will use energy tables before adding power and resistance.',
    examTrainingHook: 'Later exam training should compare energy methods with Newton-law methods where both are possible.',
    fieldGuideSections: [
      {
        id: 'm1-energy-balance',
        title: 'Energy balance',
        purpose: 'Account for every energy change and every work term.',
        bullets: [
          'List initial and final $KE$ and $PE$.',
          'Add driving work and subtract resistive work.',
          'Use conservation only when no extra work term is present.',
        ],
      },
      {
        id: 'm1-energy-power',
        title: 'Power links',
        purpose: 'Connect force, speed, work, and time.',
        bullets: [
          '$P=W/t$ for average power over a time interval.',
          '$P=Fv$ for instantaneous power in a simple straight-line model.',
          'Check units: watts are joules per second.',
        ],
      },
    ],
  },
];

const s1Topics: CourseSeedTopic[] = [
  {
    courseId: 's1',
    id: 's1-data-representation',
    slug: 'data-representation',
    syllabusRef: '9709 S1 5.1',
    title: 'Representation of Data',
    shortTitle: 'Data',
    description: 'Summarise, compare, and interpret data using tables, diagrams, averages, spread, coding, and grouped-data methods.',
    headerFormula: '\\bar{x}=\\frac{\\sum x}{n},\\quad s^2=\\frac{\\sum x^2}{n}-\\bar{x}^2',
    formulas: ['$\\bar{x}=\\frac{\\sum x}{n}$', '$s^2=\\frac{\\sum x^2}{n}-\\bar{x}^2$', '$\\text{frequency density}=\\frac{\\text{frequency}}{\\text{class width}}$'],
    studentGoals: [
      'Calculate and interpret measures of centre and spread.',
      'Use cumulative frequency, box plots, histograms, and grouped-data estimates.',
      'Compare two data sets using context, not just numbers.',
    ],
    keyIdeas: [
      'A statistic is useful only when interpreted in context.',
      'Grouped data gives estimates because exact values are not known.',
      'Histograms use frequency density when class widths differ.',
    ],
    workedMethod: [
      'Identify whether data is raw, grouped, or coded.',
      'Choose the measure required: mean, median, quartiles, variance, or standard deviation.',
      'For grouped data, use class midpoints for estimates.',
      'Write a comparison sentence that mentions centre, spread, and context.',
    ],
    commonMistakes: [
      'Using bar heights as frequencies in unequal-width histograms.',
      'Comparing means without mentioning spread.',
      'Forgetting to reverse a coding transformation.',
    ],
    selfChecks: [
      'Why are grouped-data means estimates?',
      'What does the interquartile range measure?',
      'When do you need frequency density instead of frequency?',
    ],
    examStyle: [
      'Expect calculation plus interpretation, not calculation alone.',
      'Histogram questions often test class width and area reasoning.',
    ],
    practiceHook: 'Seed practice will use small tables and diagrams with interpretation prompts.',
    examTrainingHook: 'Later exam training should require context-rich comparison sentences.',
    fieldGuideSections: [
      {
        id: 's1-data-measures',
        title: 'Measures and comparison',
        purpose: 'Use centre and spread together when describing data.',
        bullets: [
          'Mean and median describe typical values in different ways.',
          'Range and interquartile range describe spread.',
          'A strong comparison names both a statistic and what it means in context.',
        ],
      },
      {
        id: 's1-data-grouped',
        title: 'Grouped data and histograms',
        purpose: 'Handle estimates and unequal classes safely.',
        bullets: [
          'Use midpoints for grouped-data mean estimates.',
          'Use frequency density for histogram height.',
          'Read frequency from area, not from height alone, when widths differ.',
        ],
      },
    ],
  },
  {
    courseId: 's1',
    id: 's1-permutations-combinations',
    slug: 'permutations-combinations',
    syllabusRef: '9709 S1 5.2',
    title: 'Permutations and Combinations',
    shortTitle: 'Counting',
    description: 'Count ordered and unordered selections using factorials, permutations, combinations, and complementary cases.',
    headerFormula: '{}^nP_r,\\quad {}^nC_r,\\quad n!',
    formulas: ['$n!$', '${}^nP_r=\\frac{n!}{(n-r)!}$', '${}^nC_r=\\frac{n!}{r!(n-r)!}$'],
    studentGoals: [
      'Decide whether order matters.',
      'Count arrangements and selections with restrictions.',
      'Use complementary counting when direct counting is messy.',
    ],
    keyIdeas: [
      'Permutation problems count order; combination problems count groups.',
      'Restrictions are usually easier when handled before arranging the remaining items.',
      'Complementary counting means total minus unwanted cases.',
    ],
    workedMethod: [
      'Underline the wording that tells you whether order matters.',
      'Count the restricted part first if items must stay together, be separated, or include a required item.',
      'Multiply independent stages and add separate cases.',
      'Check whether any identical items or overcounting need correction.',
    ],
    commonMistakes: [
      'Using permutations when the order of a selected group does not matter.',
      'Adding stages that should be multiplied.',
      'Counting the same arrangement twice in casework.',
    ],
    selfChecks: [
      'How many ways can 3 students be chosen from 10?',
      'How many ways can 3 different prizes be awarded to 10 students?',
      'What phrase in a question tells you order matters?',
    ],
    examStyle: [
      'Counting questions often look short but depend on one key interpretation.',
      'A later probability part may use the count as the denominator or numerator.',
    ],
    practiceHook: 'Seed practice will ask students to classify the count before calculating it.',
    examTrainingHook: 'Later exam training should include restricted arrangements and complementary counts.',
    fieldGuideSections: [
      {
        id: 's1-counting-order',
        title: 'Order or no order',
        purpose: 'Choose permutations or combinations from the wording.',
        bullets: [
          'Use permutations for ordered placements, codes, arrangements, and ordered prizes.',
          'Use combinations for committees, groups, and selections.',
          'Write a one-line reason before calculating.',
        ],
      },
      {
        id: 's1-counting-restrictions',
        title: 'Restrictions and cases',
        purpose: 'Break difficult counts into safe stages.',
        bullets: [
          'Handle required or forbidden choices first.',
          'Use total minus unwanted when unwanted cases are easier.',
          'Check that cases do not overlap.',
        ],
      },
    ],
  },
  {
    courseId: 's1',
    id: 's1-probability',
    slug: 'probability',
    syllabusRef: '9709 S1 5.3',
    title: 'Probability',
    shortTitle: 'Probability',
    description: 'Use probability rules, Venn diagrams, tree diagrams, conditional probability, and independence.',
    headerFormula: 'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)',
    formulas: ['$P(A\\cup B)=P(A)+P(B)-P(A\\cap B)$', '$P(A|B)=\\frac{P(A\\cap B)}{P(B)}$', '$P(A\\cap B)=P(A)P(B)$ for independent events'],
    studentGoals: [
      'Represent events with Venn diagrams, tree diagrams, or probability notation.',
      'Use conditional probability and independence correctly.',
      'Translate worded probabilities into event equations.',
    ],
    keyIdeas: [
      'The diagram choice should match the structure of the problem.',
      'Conditional probability changes the sample space.',
      'Mutually exclusive and independent are different ideas.',
    ],
    workedMethod: [
      'Define event letters clearly.',
      'Choose a Venn diagram for overlapping sets or a tree for stages.',
      'Fill known probabilities before using addition or multiplication rules.',
      'For conditional probability, restrict to the condition first, then divide.',
    ],
    commonMistakes: [
      'Treating mutually exclusive events as independent.',
      'Forgetting to subtract an intersection in a union.',
      'Using the original denominator after a condition has changed the sample space.',
    ],
    selfChecks: [
      'What does $P(A|B)$ mean in words?',
      'How do you test whether two events are independent?',
      'Why can two events with overlap not be mutually exclusive?',
    ],
    examStyle: [
      'Probability questions usually credit a labelled diagram and a clear event equation.',
      'Conditional probability often appears after a table, Venn diagram, or tree diagram has been built.',
    ],
    practiceHook: 'Seed practice will start with event notation and simple conditional probability.',
    examTrainingHook: 'Later exam training should require students to state whether independence is assumed, given, or tested.',
    fieldGuideSections: [
      {
        id: 's1-probability-diagrams',
        title: 'Choose a diagram',
        purpose: 'Use the structure of the question to organise probabilities.',
        bullets: [
          'Use Venn diagrams for set overlap.',
          'Use tree diagrams for sequential choices.',
          'Use tables when two categories cross-classify outcomes.',
        ],
      },
      {
        id: 's1-probability-conditional',
        title: 'Conditional probability',
        purpose: 'Shrink the sample space before calculating.',
        bullets: [
          '$P(A|B)$ means probability of $A$ given $B$ has happened.',
          'The denominator is $P(B)$.',
          'The numerator is $P(A\\cap B)$.',
        ],
      },
    ],
  },
  {
    courseId: 's1',
    id: 's1-discrete-random-variables',
    slug: 'discrete-random-variables',
    syllabusRef: '9709 S1 5.4',
    title: 'Discrete Random Variables',
    shortTitle: 'Discrete Variables',
    description: 'Work with probability distributions, expectation, variance, and binomial modelling where conditions fit.',
    headerFormula: 'E(X)=\\sum x p,\\quad Var(X)=E(X^2)-[E(X)]^2',
    formulas: ['$E(X)=\\sum x p$', '$Var(X)=E(X^2)-[E(X)]^2$', '$X\\sim B(n,p)$'],
    studentGoals: [
      'Complete and use a discrete probability distribution.',
      'Calculate expectation and variance.',
      'Recognise and use a binomial distribution when trials are independent and identical.',
    ],
    keyIdeas: [
      'Probabilities in a distribution must add to 1.',
      'Expectation is a long-run mean, not necessarily a possible value.',
      'A binomial model needs fixed trials, two outcomes, constant probability, and independence.',
    ],
    workedMethod: [
      'Check that the probability distribution totals 1 and find any missing probability.',
      'Calculate $E(X)$ from $\\sum x p$.',
      'Calculate $E(X^2)$, then use $Var(X)=E(X^2)-[E(X)]^2$.',
      'For binomial questions, verify the model conditions before using binomial probabilities.',
    ],
    commonMistakes: [
      'Forgetting to square $x$ when finding $E(X^2)$.',
      'Interpreting expectation as a guaranteed outcome.',
      'Using binomial formulae when the probability changes between trials.',
    ],
    selfChecks: [
      'Why must probabilities in a distribution add to 1?',
      'What does $X\\sim B(8,0.3)$ tell you?',
      'How do you calculate $P(X\\ge 2)$ efficiently in a binomial model?',
    ],
    examStyle: [
      'Distribution-table questions often include an unknown probability or parameter.',
      'Binomial questions often credit complement use for at least or at most events.',
    ],
    practiceHook: 'Seed practice will build distribution tables before adding binomial probability prompts.',
    examTrainingHook: 'Later exam training should require model-condition checks before binomial calculations.',
    fieldGuideSections: [
      {
        id: 's1-discrete-expectation',
        title: 'Expectation and variance',
        purpose: 'Use a table layout to avoid missing terms.',
        bullets: [
          'Add an $x p$ row for expectation.',
          'Add an $x^2p$ row for $E(X^2)$.',
          'Subtract $[E(X)]^2$ to get variance.',
        ],
      },
      {
        id: 's1-discrete-binomial',
        title: 'Binomial model',
        purpose: 'Check the model before using binomial probabilities.',
        bullets: [
          'Fixed number of trials.',
          'Only success or failure on each trial.',
          'Constant success probability and independent trials.',
        ],
      },
    ],
  },
  {
    courseId: 's1',
    id: 's1-normal-distribution',
    slug: 'normal-distribution',
    syllabusRef: '9709 S1 5.5',
    title: 'The Normal Distribution',
    shortTitle: 'Normal',
    description: 'Use normal models, standardisation, z-values, inverse normal calculations, and probability interpretation.',
    headerFormula: 'Z=\\frac{X-\\mu}{\\sigma}',
    formulas: ['$Z=\\frac{X-\\mu}{\\sigma}$', '$X\\sim N(\\mu,\\sigma^2)$'],
    studentGoals: [
      'Standardise a normal random variable.',
      'Find probabilities and unknown values using normal tables or calculator functions.',
      'Interpret mean and standard deviation in context.',
    ],
    keyIdeas: [
      'Normal notation uses variance, so $N(\\mu,\\sigma^2)$ contains $\\sigma^2$, not $\\sigma$.',
      'Standardising converts any normal variable into the standard normal variable $Z$.',
      'Diagram shading helps decide tails, complements, and inverse inputs.',
    ],
    workedMethod: [
      'Sketch the normal curve and shade the requested probability.',
      'Identify $\\mu$ and $\\sigma$, taking the square root if variance is given.',
      'Standardise using $z=(x-\\mu)/\\sigma$ or use calculator normal functions directly.',
      'For inverse questions, match the shaded area to the correct side of the distribution.',
    ],
    commonMistakes: [
      'Using variance as the standard deviation.',
      'Putting the wrong tail probability into an inverse normal calculation.',
      'Forgetting symmetry when converting upper-tail probabilities.',
    ],
    selfChecks: [
      'If $X\\sim N(50,16)$, what is $\\sigma$?',
      'What z-value expression represents $P(X<58)$?',
      'Why should you sketch before using inverse normal?',
    ],
    examStyle: [
      'Normal questions often combine a probability calculation with an unknown boundary or parameter.',
      'Marks usually credit correct standardisation and correct tail interpretation.',
    ],
    practiceHook: 'Seed practice will use sketch-first normal probability and inverse-normal prompts.',
    examTrainingHook: 'Later exam training should include calculator and table-compatible routes.',
    fieldGuideSections: [
      {
        id: 's1-normal-standardise',
        title: 'Standardising',
        purpose: 'Convert normal values to z-values safely.',
        bullets: [
          'Read variance and standard deviation correctly.',
          'Use $z=(x-\\mu)/\\sigma$.',
          'Keep the inequality direction attached to the shaded region.',
        ],
      },
      {
        id: 's1-normal-inverse',
        title: 'Inverse normal',
        purpose: 'Work backwards from an area to a boundary value.',
        bullets: [
          'Sketch the shaded tail or central region.',
          'Convert upper-tail areas to lower-tail inputs when required.',
          'Translate the z-value back to $x$ using $x=\\mu+z\\sigma$.',
        ],
      },
    ],
  },
];

export const COURSE_SEED_TOPICS: CourseSeedTopic[] = [
  ...p1Topics,
  ...m1Topics,
  ...s1Topics,
];

export const COURSE_SEED_TOPICS_BY_COURSE: Record<DraftSeedCourseId, CourseSeedTopic[]> = {
  p1: p1Topics,
  m1: m1Topics,
  s1: s1Topics,
};

export function getSeedTopicsForCourse(courseId: CourseId | undefined): CourseSeedTopic[] {
  if (courseId === 'p1' || courseId === 'm1' || courseId === 's1') return COURSE_SEED_TOPICS_BY_COURSE[courseId];
  return [];
}

export function getSeedTopicBySlug(courseId: CourseId | undefined, slug: string | undefined): CourseSeedTopic | undefined {
  if (!slug) return undefined;
  return getSeedTopicsForCourse(courseId).find((topic) => topic.slug === slug);
}

export function hasDraftSeedTopics(courseId: CourseId | undefined): courseId is DraftSeedCourseId {
  return getSeedTopicsForCourse(courseId).length > 0;
}

export function courseSeedTopicSummaries(courseId: CourseId | undefined) {
  return getSeedTopicsForCourse(courseId).map((topic) => ({
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    note: `${topic.syllabusRef}. ${DRAFT_SEED_CONTENT_LABEL}`,
  }));
}
