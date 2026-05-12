import type { RegionDefinition } from '../types';

export interface WorkedExamplePlaceholder {
  title: string;
  focus: string;
  setup?: string;
  steps: string[];
  answer: string;
  keyMove: string;
  check: string;
  why: string;
}

export interface RegionFieldGuide {
  regionId: string;
  topic: string;
  whatToRecognize: string[];
  commonExamMoves: string[];
  commonTraps: string[];
  workedExamples: WorkedExamplePlaceholder[];
  readinessChecklist: string[];
}

const guides: Record<string, RegionFieldGuide> = {
  'algebra-forge': {
    regionId: 'algebra-forge',
    topic: 'Algebraic structure, functions, polynomials, partial fractions, and binomial expansions.',
    whatToRecognize: [
      'Expressions that need rearranging before a standard method appears.',
      'Polynomial division prompts such as factor, remainder, or quotient language.',
      'Proper and improper rational expressions before partial fractions.',
    ],
    commonExamMoves: [
      'Factor first, then compare coefficients.',
      'Use the remainder theorem before committing to long division.',
      'State restrictions when functions, inverses, or composite functions are involved.',
    ],
    commonTraps: [
      'Expanding too early and hiding a simple factor.',
      'Dropping domain restrictions for inverse functions.',
      'Forgetting repeated-linear-factor terms in partial fractions.',
    ],
    workedExamples: [
      {
        title: 'Binomial first terms',
        focus: 'Write the first three terms of $(1+2x)^5$.',
        setup: 'Use the first binomial terms with $u=2x$: $$ (1+u)^n=1+\\binom{n}{1}u+\\binom{n}{2}u^2+\\cdots $$',
        steps: [
          'Substitute $u=2x$ and $n=5$ into the first three binomial terms.',
          'Compute the linear term: $$ 5(2x)=10x $$',
          'Compute the quadratic term: $$ \\binom{5}{2}(2x)^2=10\\cdot4x^2=40x^2 $$',
        ],
        answer: '$$ 1+10x+40x^2 $$',
        keyMove: 'Choose the binomial coefficient before simplifying powers.',
        check: 'The final terms are arranged by increasing powers of $x$.',
        why: 'The expansion is arranged by powers of $x$, so stopping at $x^2$ is enough.',
      },
      {
        title: 'Partial fractions setup',
        focus: 'Decompose $\\frac{5x+1}{(x-1)(x+2)}$.',
        setup: 'Distinct linear factors need one constant numerator each: $$ \\frac{5x+1}{(x-1)(x+2)}=\\frac{A}{x-1}+\\frac{B}{x+2} $$',
        steps: [
          'Clear denominators: $$ 5x+1=A(x+2)+B(x-1) $$',
          'Set $x=1$: $$ 6=3A\\quad\\Rightarrow\\quad A=2 $$',
          'Set $x=-2$: $$ -9=-3B\\quad\\Rightarrow\\quad B=3 $$',
        ],
        answer: '$$ \\frac{2}{x-1}+\\frac{3}{x+2} $$',
        keyMove: 'After clearing denominators, substitute values that zero one factor.',
        check: 'Distinct linear factors get one constant numerator each.',
        why: 'Cover-up substitutions isolate one unknown constant at a time.',
      },
      {
        title: 'Remainder theorem',
        focus: 'For $f(x)=x^3-4x+3$, test $x-1$.',
        setup: 'Substitute the root from $x-1$, so use $x=1$.',
        steps: [
          'Compute the remainder value: $$ f(1)=1^3-4(1)+3 $$',
          'Simplify: $$ 1-4+3=0 $$',
          'A zero remainder means the divisor is a factor.',
        ],
        answer: '$$ x-1\\text{ is a factor of }f(x) $$',
        keyMove: 'Use $a$ for $x-a$, not the opposite sign.',
        check: 'The remainder is zero, so the factor test succeeds.',
        why: 'The remainder on division by $x-a$ is exactly $f(a)$.',
      },
    ],
    readinessChecklist: [
      'Divide a cubic by a linear factor without losing signs.',
      'Choose a partial-fraction form from the denominator.',
      'Explain when an inverse function exists.',
    ],
  },
  'logarithm-grove': {
    regionId: 'logarithm-grove',
    topic: 'Logarithms are the inverse language of exponentials. In this region you practise moving between exponential and logarithmic form, using log laws safely, solving logarithmic or exponential equations, and checking that every answer works in the original question.',
    whatToRecognize: [
      'An equation such as $a^x=b$ can usually be rewritten with logarithms once the exponential term is isolated.',
      'Multiple log terms with the same base often need expanding or combining before solving.',
      'Quadratic-looking exponential equations may need a substitution such as $y=2^x$ or $y=e^x$.',
      'Any expression inside a logarithm creates a domain restriction that must be checked at the end.',
    ],
    commonExamMoves: [
      'Convert between exponential and logarithmic form: $a^x=b$ means $x=\\log_a b$.',
      'Use log laws deliberately: $\\log(ab)=\\log a+\\log b$, $\\log(a/b)=\\log a-\\log b$, and $\\log(a^n)=n\\log a$.',
      'Combine log terms into one logarithm before removing logs from both sides.',
      'Use logarithms after isolating the exponential term; avoid taking logs of a whole messy equation too early.',
      'Substitute for repeated exponential terms, solve the simpler equation, then convert back to $x$.',
    ],
    commonTraps: [
      'Keeping a solution that makes an original log argument zero or negative.',
      'Using the false rule $\\log(a+b)=\\log a+\\log b$.',
      'Cancelling logs before both sides are a single log with the same base.',
      'Rounding too early in exponential equations and losing the final accuracy mark.',
      'Forgetting that a logarithm base must be positive and not equal to 1.',
    ],
    workedExamples: [
      {
        title: 'Combine logs',
        focus: 'Simplify $\\ln x+\\ln5$.',
        setup: 'Use the product law: $\\ln a+\\ln b=\\ln(ab)$.',
        steps: [
          'Check both logarithms have the same base.',
          'Apply the product law: $$ \\ln x+\\ln5=\\ln(5x) $$',
          'Keep the original domain restriction: $$ x>0 $$',
        ],
        answer: '$$ \\ln(5x),\\quad x>0 $$',
        keyMove: 'Adding logs multiplies inputs; it does not add inputs.',
        check: 'The product law is $\\ln a+\\ln b=\\ln(ab)$.',
        why: 'The product law comes from multiplying powers with the same base.',
      },
      {
        title: 'Isolate then log',
        focus: 'Solve $3e^{2x}=12$.',
        setup: 'Divide by $3$ first: $e^{2x}=4$.',
        steps: [
          'Divide by $3$: $$ e^{2x}=4 $$',
          'Take $\\ln$ of both sides: $$ 2x=\\ln4 $$',
          'Divide by $2$.',
        ],
        answer: '$$ x=\\frac{1}{2}\\ln4=\\ln2 $$',
        keyMove: 'Only take logs after the exponential term is isolated.',
        check: 'Substituting $x=\\ln2$ gives $e^{2x}=4$.',
        why: '$\\ln$ and $e^x$ are inverse operations once the exponential is alone.',
      },
      {
        title: 'Linearise power law',
        focus: 'For $y=2x^3$, take logs.',
        setup: 'Take natural logs and expand: $$ \\ln y=\\ln(2x^3)=\\ln2+3\\ln x $$',
        steps: [
          'Take natural logs of both sides: $$ \\ln y=\\ln(2x^3) $$',
          'Use log laws: $$ \\ln y=\\ln2+\\ln(x^3) $$',
          'Move the power down: $$ \\ln y=\\ln2+3\\ln x $$',
        ],
        answer: 'Plot $\\ln y$ against $\\ln x$; the gradient is $3$ and the intercept is $\\ln2$.',
        keyMove: 'Plot $\\ln y$ against $\\ln x$ for gradient $3$.',
        check: 'Power laws use $\\ln x$ on the horizontal axis.',
        why: 'The equation now has straight-line form $Y=c+mX$.',
      },
    ],
    readinessChecklist: [
      'Convert $a^x=b$ into logarithmic form and back again.',
      'Expand and combine logarithms using only valid log laws.',
      'Solve a logarithmic equation and check every original log argument.',
      'Solve an exponential equation by isolating the exponential term first.',
      'Explain why $\\log(a+b)$ is not the same as $\\log a+\\log b$.',
    ],
  },
  'trig-observatory': {
    regionId: 'trig-observatory',
    topic: 'Trigonometric identities, equations, angle formulae, and reciprocal functions.',
    whatToRecognize: [
      'Equations that need a common function before solving.',
      'Identity proofs where one side is more factorable than the other.',
      'Compound-angle expressions hiding standard forms.',
    ],
    commonExamMoves: [
      'Rewrite $\\sec x$, $\\operatorname{cosec} x$, and $\\cot x$ before simplifying.',
      'Use exact values and quadrant checks for final solutions.',
      'Factor trig equations before dividing by a variable expression.',
    ],
    commonTraps: [
      'Losing solutions by dividing by $\\sin x$ or $\\cos x$.',
      'Giving answers outside the requested interval.',
      'Using degree-mode values when radians are required.',
    ],
    workedExamples: [
      {
        title: 'Double-angle choice',
        focus: 'Rewrite $1-\\cos2x$ using $\\sin x$.',
        setup: 'Use $\\cos2x=1-2\\sin^2x$.',
        steps: [
          'Choose the double-angle identity already written in terms of $\\sin x$.',
          'Substitute: $$ 1-\\cos2x=1-(1-2\\sin^2x) $$',
          'Simplify the brackets.',
        ],
        answer: '$$ 2\\sin^2x $$',
        keyMove: 'Choose the identity that moves toward the requested function.',
        check: 'The final expression is entirely in terms of $\\sin x$.',
        why: 'A targeted identity avoids extra rearranging later.',
      },
      {
        title: 'Interval solution sweep',
        focus: 'Solve $\\sin x=\\frac12$ for $0\\le x<2\\pi$.',
        setup: 'Reference angle is $\\frac{\\pi}{6}$ and sine is positive in quadrants I and II.',
        steps: [
          'Find the reference angle: $$ \\sin^{-1}\\left(\\frac12\\right)=\\frac{\\pi}{6} $$',
          'Sine is positive in quadrants I and II.',
          'List the angles in the requested interval.',
        ],
        answer: '$$ x=\\frac{\\pi}{6}\\quad\\text{or}\\quad x=\\frac{5\\pi}{6} $$',
        keyMove: 'Use the interval before finalising the answer list.',
        check: 'The interval decides the final answer list.',
        why: 'The unit-circle quadrant check prevents missing valid angles.',
      },
      {
        title: 'R-form',
        focus: 'Write $3\\sin x+4\\cos x$ as $R\\sin(x+\\alpha)$.',
        setup: '$R=\\sqrt{3^2+4^2}=5$.',
        steps: [
          'Expand the target form: $$ R\\sin(x+\\alpha)=R\\sin x\\cos\\alpha+R\\cos x\\sin\\alpha $$',
          'Match coefficients: $$ R\\cos\\alpha=3\\quad\\text{and}\\quad R\\sin\\alpha=4 $$',
          'Use $$ R=\\sqrt{3^2+4^2}=5,\\quad \\tan\\alpha=\\frac43 $$',
        ],
        answer: '$$ 5\\sin(x+\\alpha),\\quad \\alpha=\\tan^{-1}\\left(\\frac43\\right) $$',
        keyMove: 'Match $R\\cos\\alpha=3$ and $R\\sin\\alpha=4$.',
        check: '$\\alpha=\\tan^{-1}\\left(\\frac43\\right)$ for acute $\\alpha$.',
        why: 'R-form combines two trig terms into one wave with amplitude $R$.',
      },
    ],
    readinessChecklist: [
      'Move between reciprocal and sin/cos forms.',
      'Solve a factored trig equation without losing roots.',
      'Check answer intervals carefully.',
    ],
  },
  'complex-harbor': {
    regionId: 'complex-harbor',
    topic: 'Complex numbers, Argand diagrams, polar form, arguments, loci, and roots.',
    whatToRecognize: [
      'Questions that ask for geometry in the Argand plane.',
      'Modulus-argument forms where multiplication or roots become easier.',
      'Conjugates that simplify quotients or real/imaginary conditions.',
    ],
    commonExamMoves: [
      'Convert between cartesian and polar form when the operation demands it.',
      'Draw a quick Argand sketch before solving locus conditions.',
      'Use De Moivre for roots and powers.',
    ],
    commonTraps: [
      'Using the wrong quadrant for the argument.',
      'Forgetting all roots when taking powers or roots.',
      'Treating modulus equations as ordinary linear equations.',
    ],
    workedExamples: [
      {
        title: 'Argument quadrant check',
        focus: 'Find the modulus and argument of $z=-1+i\\sqrt3$.',
        setup: 'Plot the point $(-1,\\sqrt3)$ before choosing the angle.',
        steps: [
          'Find the modulus: $$ r=\\sqrt{(-1)^2+(\\sqrt3)^2}=2 $$',
          'Find the reference angle: $$ \\tan^{-1}(\\sqrt3)=\\frac{\\pi}{3} $$',
          'The point is in quadrant II, so $$ \\arg z=\\frac{2\\pi}{3} $$',
        ],
        answer: '$$ z=2e^{2\\pi i/3} $$',
        keyMove: 'Use the quadrant after finding the reference angle.',
        check: 'A negative real part and positive imaginary part means quadrant II.',
        why: 'The argument is a directed angle from the positive real axis.',
      },
      {
        title: 'Root pattern',
        focus: 'Find the cube roots of $8e^{i\\pi}$.',
        setup: 'For cube roots, divide the modulus root and spread angles by $\\frac{2\\pi}{3}$.',
        steps: [
          'Cube-root the modulus: $$ \\sqrt[3]{8}=2 $$',
          'Use angles $$ \\frac{\\pi+2k\\pi}{3}\\quad\\text{for}\\quad k=0,1,2 $$',
          'This gives $$ \\frac{\\pi}{3},\\quad \\pi,\\quad \\frac{5\\pi}{3} $$',
        ],
        answer: '$$ 2e^{i\\pi/3},\\quad 2e^{i\\pi},\\quad 2e^{5\\pi i/3} $$',
        keyMove: 'Use every value of $k$ from $0$ to $n-1$.',
        check: 'Three cube roots should be equally spaced.',
        why: 'Adding $2\\pi$ before dividing creates the full set of roots.',
      },
      {
        title: 'Locus sketch',
        focus: 'Describe the locus $|z-(2+i)|=3$.',
        setup: 'A modulus from a fixed complex number is a distance.',
        steps: [
          'Identify the centre as the point represented by $2+i$, so $(2,1)$.',
          'The equation says $$ |z-(2+i)|=3 $$ so the distance from this centre is $3$.',
          'Sketch all points at that fixed distance.',
        ],
        answer: 'A circle with centre $(2,1)$ and radius $3$.',
        keyMove: 'Translate modulus notation into distance on the Argand diagram.',
        check: 'The number after the equals sign is the radius.',
        why: 'A constant distance from one point defines a circle.',
      },
    ],
    readinessChecklist: [
      'Plot a complex number and its conjugate.',
      'Convert between $a+bi$ and $re^{i\\theta}$.',
      'Explain what a modulus or argument condition means geometrically.',
    ],
  },
  'calculus-cliffs': {
    regionId: 'calculus-cliffs',
    topic: 'Differentiation, parametric equations, rates of change, and stationary points.',
    whatToRecognize: [
      'Products, quotients, chains, implicit relationships, and parametric forms.',
      'Stationary-point questions requiring both derivative and interpretation.',
      'Rates that require a chain of variables rather than direct substitution.',
    ],
    commonExamMoves: [
      'Choose the derivative rule before expanding.',
      'For parametric curves, compute $\\frac{dy}{dx}$ through $\\frac{dy/dt}{dx/dt}$.',
      'Use the second derivative or sign change to classify stationary points.',
    ],
    commonTraps: [
      'Forgetting implicit differentiation on both sides.',
      'Dividing by $\\frac{dx}{dt}$ when it is zero without checking the point.',
      'Reporting coordinates before substituting back into the original equation.',
    ],
    workedExamples: [
      {
        title: 'Rule selection',
        focus: 'Differentiate $y=x^2\\sin x$.',
        setup: 'This is a product of $x^2$ and $\\sin x$.',
        steps: [
          'Use $(uv)^{\\prime}=u^{\\prime}v+uv^{\\prime}$.',
          'Let $u=x^2$ and $v=\\sin x$.',
          'Differentiate with the product rule: $$ \\frac{dy}{dx}=2x\\sin x+x^2\\cos x $$',
        ],
        answer: '$$ \\frac{dy}{dx}=2x\\sin x+x^2\\cos x $$',
        keyMove: 'Name the product rule before differentiating.',
        check: 'Both original factors should appear in the derivative line.',
        why: 'The product rule accounts for each factor changing.',
      },
      {
        title: 'Parametric gradient',
        focus: 'For $x=t^2+1$ and $y=t^3$, find $\\frac{dy}{dx}$.',
        setup: 'Differentiate both variables with respect to $t$.',
        steps: [
          'Differentiate each equation: $$ \\frac{dx}{dt}=2t\\quad\\text{and}\\quad \\frac{dy}{dt}=3t^2 $$',
          'Use $\\frac{dy}{dx}=\\frac{dy/dt}{dx/dt}$.',
          'Divide the derivatives: $$ \\frac{dy}{dx}=\\frac{3t^2}{2t}=\\frac{3t}{2}\\quad(t\\ne0) $$',
        ],
        answer: '$$ \\frac{dy}{dx}=\\frac{3t}{2} $$',
        keyMove: 'Build $\\frac{dy}{dx}$ from two derivatives.',
        check: 'Do not divide by $\\frac{dx}{dt}$ at a point where it is zero without checking.',
        why: 'Parametric curves use $t$ as the link between $x$ and $y$.',
      },
      {
        title: 'Stationary point test',
        focus: 'Find and classify the stationary point of $y=x^2-4x+1$.',
        setup: 'Stationary points have $\\frac{dy}{dx}=0$.',
        steps: [
          'Differentiate: $$ \\frac{dy}{dx}=2x-4 $$',
          'Set the derivative to zero: $$ 2x-4=0\\quad\\Rightarrow\\quad x=2 $$',
          'Substitute back: $$ y=4-8+1=-3 $$',
          'Classify with the second derivative: $$ \\frac{d^2y}{dx^2}=2>0 $$ so it is a minimum.',
        ],
        answer: 'Minimum at $(2,-3)$.',
        keyMove: 'Use the derivative for location and the second derivative for classification.',
        check: 'Coordinates come from substituting into the original equation.',
        why: 'The derivative tells you slope; zero slope identifies stationary candidates.',
      },
    ],
    readinessChecklist: [
      'Differentiate a product and a composite expression.',
      'Find $\\frac{dy}{dx}$ for a parametric curve.',
      'Use a derivative to locate a stationary point.',
    ],
  },
  'integration-gardens': {
    regionId: 'integration-gardens',
    topic: 'Integration methods, areas, definite integrals, substitution, and parts.',
    whatToRecognize: [
      'Integrals that need substitution, parts, or partial fractions before evaluating.',
      'Area questions where limits and sign matter.',
      'Expressions that simplify before integration begins.',
    ],
    commonExamMoves: [
      'Choose substitution when a derivative-like factor is present.',
      'Choose parts for products involving logs, inverse trig, or mixed algebraic terms.',
      'Keep limits consistent when substituting in definite integrals.',
    ],
    commonTraps: [
      'Forgetting the constant for indefinite integrals.',
      'Using old limits after changing variables.',
      'Subtracting signed areas without considering the axis.',
    ],
    workedExamples: [
      {
        title: 'Substitution setup',
        focus: 'Evaluate $\\int 2x(x^2+1)^3\\,dx$.',
        setup: 'The factor $2x$ is the derivative of $x^2+1$.',
        steps: [
          'Let $u=x^2+1$, so $$ du=2x\\,dx $$',
          'Rewrite the integral as $$ \\int u^3\\,du $$',
          'Integrate to get $$ \\frac{u^4}{4}+C $$',
        ],
        answer: '$$ \\frac{(x^2+1)^4}{4}+C $$',
        keyMove: 'Choose substitution when a derivative-like factor is present.',
        check: 'Differentiate the answer to recover the original integrand.',
        why: 'Substitution turns a composite expression into a simpler power.',
      },
      {
        title: 'Integration by parts table',
        focus: 'Find $\\int x\\ln x\\,dx$.',
        setup: 'Choose $u=\\ln x$ and $dv=x\\,dx$.',
        steps: [
          'Differentiate and integrate the parts: $$ du=\\frac{1}{x}\\,dx\\quad\\text{and}\\quad v=\\frac{x^2}{2} $$',
          'Use the parts formula: $$ \\int u\\,dv=uv-\\int v\\,du $$',
          'Substitute into the formula: $$ \\int x\\ln x\\,dx=\\frac{x^2}{2}\\ln x-\\int\\frac{x}{2}\\,dx $$',
        ],
        answer: '$$ \\frac{x^2}{2}\\ln x-\\frac{x^2}{4}+C $$',
        keyMove: 'Pick $u$ so that differentiating it simplifies the product.',
        check: 'A logarithm usually works well as $u$.',
        why: 'Parts reverses the product rule.',
      },
      {
        title: 'Area under a curve',
        focus: 'Find the area between $y=x^2-4$ and the $x$-axis from $x=0$ to $x=3$.',
        setup: 'The curve crosses the axis at $x=2$, so split the area.',
        steps: [
          'Split signed area at the crossing: $$ -\\int_0^2 (x^2-4)\\,dx+\\int_2^3 (x^2-4)\\,dx $$',
          'Use antiderivative $$ \\frac{x^3}{3}-4x $$',
          'Evaluate each positive area piece separately.',
        ],
        answer: '$$ \\frac{16}{3}+\\frac{7}{3}=\\frac{23}{3} $$',
        keyMove: 'Split at the axis crossing before calculating area.',
        check: 'Area cannot be negative.',
        why: 'A definite integral is signed area; exam area questions usually want positive area.',
      },
    ],
    readinessChecklist: [
      'Recognize when substitution is likely.',
      'Apply integration by parts without losing terms.',
      'Evaluate a definite integral with correct limits.',
    ],
  },
  'vector-workshop': {
    regionId: 'vector-workshop',
    topic: 'Vectors, lines, scalar products, intersections, and angles in three dimensions.',
    whatToRecognize: [
      'Line equations in vector form and parameters that need solving together.',
      'Dot-product questions asking for angle, perpendicularity, or projection.',
      'Intersection and shortest-route prompts.',
    ],
    commonExamMoves: [
      'Compare components to solve for parameters.',
      'Use the scalar product formula $\\mathbf a\\cdot\\mathbf b=|\\mathbf a||\\mathbf b|\\cos\\theta$ for angles.',
      'State when lines are parallel, intersecting, or skew.',
    ],
    commonTraps: [
      'Mixing up position vectors and direction vectors.',
      'Using degrees or radians inconsistently for angles.',
      'Assuming lines intersect after checking only one component.',
    ],
    workedExamples: [
      {
        title: 'Line intersection check',
        focus: 'Test whether $\\mathbf r=(1,0,2)+s(2,1,-1)$ and $\\mathbf r=(3,1,1)+t(1,0,2)$ intersect.',
        setup: 'Equate components and solve for both parameters.',
        steps: [
          'From the $y$-component: $$ s=1 $$',
          'Use the $x$-component: $$ 1+2s=3+t\\quad\\Rightarrow\\quad t=0 $$',
          'Check the $z$-component: $$ 2-s=1+2t\\quad\\Rightarrow\\quad 1=1 $$',
        ],
        answer: 'The lines intersect at $(3,1,1)$.',
        keyMove: 'All three component equations must agree.',
        check: 'A solution from two components is not enough.',
        why: 'A 3D intersection needs one shared point satisfying every component.',
      },
      {
        title: 'Scalar product angle',
        focus: 'Find the angle between directions $\\mathbf a=(1,2,2)$ and $\\mathbf b=(2,0,1)$.',
        setup: 'Use $\\mathbf a\\cdot\\mathbf b=|\\mathbf a||\\mathbf b|\\cos\\theta$.',
        steps: [
          'Compute the dot product: $$ \\mathbf a\\cdot\\mathbf b=1\\cdot2+2\\cdot0+2\\cdot1=4 $$',
          'Compute the moduli: $$ |\\mathbf a|=3\\quad\\text{and}\\quad |\\mathbf b|=\\sqrt5 $$',
          'Substitute into the angle formula: $$ \\cos\\theta=\\frac{4}{3\\sqrt5} $$',
        ],
        answer: '$$ \\theta=\\cos^{-1}\\left(\\frac{4}{3\\sqrt5}\\right) $$',
        keyMove: 'Use direction vectors, not position vectors.',
        check: 'The cosine value must be between $-1$ and $1$.',
        why: 'The scalar product measures how much two vectors point in the same direction.',
      },
      {
        title: 'Line relationship',
        focus: 'Classify lines with directions $(2,4,6)$ and $(1,2,3)$.',
        setup: 'Compare direction vectors first.',
        steps: [
          'Notice $$ (2,4,6)=2(1,2,3) $$',
          'The direction vectors are scalar multiples.',
          'The lines are parallel unless their position vectors also put them on the same line.',
        ],
        answer: 'The lines are parallel or coincident; they are not skew.',
        keyMove: 'Check direction vectors before solving components.',
        check: 'Parallel directions rule out a single crossing point unless the lines coincide.',
        why: 'Skew lines are non-parallel lines that do not meet.',
      },
    ],
    readinessChecklist: [
      'Write and read a vector line equation.',
      'Compute a scalar product accurately.',
      'Use component equations to test an intersection.',
    ],
  },
  'numerical-mines': {
    regionId: 'numerical-mines',
    topic: 'Numerical solution of equations, iteration, roots, and accuracy checks.',
    whatToRecognize: [
      'Questions asking for sign changes, iterations, or decimal-place accuracy.',
      'Rearrangements of $f(x)=0$ into $x=g(x)$.',
      'Root intervals that need justified convergence or approximation.',
    ],
    commonExamMoves: [
      'Show sign changes with values of $f(x)$ at interval endpoints.',
      'Iterate using the exact formula requested by the question.',
      'Quote answers to the requested accuracy and justify rounding.',
    ],
    commonTraps: [
      'Rounding intermediate values too aggressively.',
      'Using a rearrangement different from the one given.',
      'Claiming a root without a sign-change or convergence argument.',
    ],
    workedExamples: [
      {
        title: 'Sign-change interval',
        focus: 'Show that $f(x)=x^3-x-1$ has a root between $1$ and $2$.',
        setup: 'Evaluate the function at both endpoints.',
        steps: [
          'Evaluate the first endpoint: $$ f(1)=1-1-1=-1 $$',
          'Evaluate the second endpoint: $$ f(2)=8-2-1=5 $$',
          'The signs are different, so a root lies between $1$ and $2$.',
        ],
        answer: 'A root exists in $(1,2)$.',
        keyMove: 'Show the sign change explicitly.',
        check: 'Write both values and their signs.',
        why: 'A continuous curve crossing from negative to positive must cross the axis.',
      },
      {
        title: 'Fixed-point iteration',
        focus: 'Use $x_{n+1}=\\sqrt{1+x_n}$ with $x_1=1$ to find $x_3$.',
        setup: 'Use the stated formula exactly each time.',
        steps: [
          'Calculate the next value: $$ x_2=\\sqrt{1+1}=\\sqrt2 $$',
          'Substitute again: $$ x_3=\\sqrt{1+\\sqrt2} $$',
          'Do not round $x_2$ before calculating $x_3$ unless the question asks for a table.',
        ],
        answer: '$$ x_3=\\sqrt{1+\\sqrt2}\\approx1.554 $$',
        keyMove: 'Carry repeated substitution accurately.',
        check: 'Each new value goes back into the right-hand side.',
        why: 'Iteration is deterministic; changing the formula changes the method.',
      },
      {
        title: 'Accuracy statement',
        focus: 'If an iteration gives $1.52137$ and $1.52139$, state the root to 3 decimal places.',
        setup: 'The two values agree when rounded to 3 decimal places.',
        steps: [
          'Both values round to $1.521$ to 3 decimal places.',
          'State the agreement, not just the rounded answer.',
          'Use the requested accuracy exactly.',
        ],
        answer: '$$ x=1.521 $$ to 3 decimal places.',
        keyMove: 'Justify the final rounded value.',
        check: 'Do not overstate accuracy beyond the agreement shown.',
        why: 'Accuracy marks often require evidence that rounding is stable.',
      },
    ],
    readinessChecklist: [
      'Evaluate a function accurately at two endpoints.',
      'Run an iteration table without changing the formula.',
      'State a final answer to a requested accuracy.',
    ],
  },
  'differential-shrine': {
    regionId: 'differential-shrine',
    topic: 'Forming and solving first-order differential equations, including separation of variables.',
    whatToRecognize: [
      'Rates described in words that translate into $\\frac{dy}{dx}$ or $dt$ equations.',
      'Separable forms where variables can be gathered on opposite sides.',
      'Initial conditions that determine the constant.',
    ],
    commonExamMoves: [
      'Separate variables before integrating.',
      'Use initial conditions after integration, not before.',
      'Keep arbitrary constants until the condition is applied.',
    ],
    commonTraps: [
      'Integrating before fully separating variables.',
      'Losing absolute values or constants in logarithmic integrals.',
      'Substituting the initial condition into the differential equation instead of the solution.',
    ],
    workedExamples: [
      {
        title: 'Separation layout',
        focus: 'Solve $\\frac{dy}{dx}=xy$ for the general solution.',
        setup: 'Move all $y$ terms to one side and all $x$ terms to the other.',
        steps: [
          'Separate the variables: $$ \\frac{1}{y}\\,dy=x\\,dx $$',
          'Integrate both sides: $$ \\ln|y|=\\frac{x^2}{2}+C $$',
          'Exponentiate if an explicit form is needed.',
        ],
        answer: '$$ y=Ae^{x^2/2} $$ where $A$ is a constant.',
        keyMove: 'Separate variables before integrating.',
        check: 'Both sides need an integral.',
        why: 'Separation turns one differential equation into two direct integrations.',
      },
      {
        title: 'Initial condition',
        focus: 'Given $y=Ae^{x^2/2}$ and $y=3$ when $x=0$, find $A$.',
        setup: 'Use the condition after finding the general solution.',
        steps: [
          'Substitute $x=0$ and $y=3$.',
          'Solve for the constant: $$ 3=Ae^0=A $$',
          'Put the constant back into the solution.',
        ],
        answer: '$$ y=3e^{x^2/2} $$',
        keyMove: 'Use initial conditions after integration, not before.',
        check: 'The constant belongs in the solution.',
        why: 'The condition selects one member of the family of solutions.',
      },
      {
        title: 'Model from words',
        focus: 'A quantity $y$ increases at a rate proportional to $y$. Write the differential equation.',
        setup: 'Translate “rate of change” and “proportional to” separately.',
        steps: [
          'Rate of change with respect to $t$ is $\\frac{dy}{dt}$.',
          'Proportional to $y$ means equal to $ky$ for a constant $k$.',
          'Combine the two pieces.',
        ],
        answer: '$$ \\frac{dy}{dt}=ky $$',
        keyMove: 'Translate the rate statement before solving.',
        check: 'Use the variable named in the context.',
        why: 'A model equation is the bridge from words to calculus.',
      },
    ],
    readinessChecklist: [
      'Separate a simple differential equation.',
      'Integrate both sides with a constant.',
      'Use an initial condition to produce a particular solution.',
    ],
  },
};

export function getRegionFieldGuide(region: RegionDefinition): RegionFieldGuide {
  return guides[region.id] ?? {
    regionId: region.id,
    topic: region.description,
    whatToRecognize: region.subtopics.slice(0, 4).map((subtopic) => `Questions involving ${subtopic}.`),
    commonExamMoves: [
      'Identify the topic signal in the question image before choosing a method.',
      'Write down the known formula or method before doing algebra.',
      'Use the mark scheme after solving to compare method and accuracy marks.',
    ],
    commonTraps: [
      'Starting calculations before identifying the exact subtopic.',
      'Ignoring the requested form or accuracy.',
      'Self-marking without checking the official mark scheme image.',
    ],
    workedExamples: [
      {
        title: 'Recognition card',
        focus: `A question asks about ${region.subtopics[0] ?? region.name}. State the first method decision.`,
        setup: 'Read the command word and identify the named structure before calculating.',
        steps: [
          'Circle the topic signal in the prompt.',
          'Write the matching formula, identity, or method name.',
          'Only then begin the algebraic or numerical work.',
        ],
        answer: 'The first line should name the relevant method and show the setup.',
        keyMove: 'Identify the topic signal in the question image before choosing a method.',
        check: 'Your first line should match the subtopic, not just start calculating.',
        why: 'A clear setup protects method marks when later algebra goes wrong.',
      },
      {
        title: 'Method card',
        focus: `Prepare the first two lines for a ${region.name} practice question.`,
        setup: 'Use the official image as the source and write a short route before solving.',
        steps: [
          'State the known formula or transformation.',
          'Substitute the values or variables from the question.',
          'Leave the detailed calculation for the main attempt.',
        ],
        answer: 'A correct method line followed by a substituted setup line.',
        keyMove: 'Write down the known formula or method before doing algebra.',
        check: 'Compare the method line with the official mark scheme after solving.',
        why: 'The mark scheme usually rewards visible method evidence before the final answer.',
      },
    ],
    readinessChecklist: region.subtopics.slice(0, 4).map((subtopic) => `Recognize a ${subtopic} prompt.`),
  };
}
