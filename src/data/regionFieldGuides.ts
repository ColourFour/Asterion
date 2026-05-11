import type { RegionDefinition } from '../types';

export interface WorkedExamplePlaceholder {
  title: string;
  focus: string;
  setup?: string;
  keyMove?: string;
  check?: string;
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
        setup: 'Use $(1+u)^n=1+nu+\\frac{n(n-1)}{2}u^2+\\cdots$ with $u=2x$.',
        keyMove: '$1+5(2x)+10(2x)^2=1+10x+40x^2$.',
        check: 'Choose the binomial coefficient before simplifying powers.',
      },
      {
        title: 'Partial fractions setup',
        focus: 'Decompose $\\frac{5x+1}{(x-1)(x+2)}$.',
        setup: 'Start with $\\frac{A}{x-1}+\\frac{B}{x+2}$.',
        keyMove: 'After clearing denominators, substitute $x=1$ and $x=-2$.',
        check: 'Distinct linear factors get one constant numerator each.',
      },
      {
        title: 'Remainder theorem',
        focus: 'For $f(x)=x^3-4x+3$, test $x-1$.',
        setup: 'Substitute the root from $x-1$, so use $x=1$.',
        keyMove: '$f(1)=1-4+3=0$, so $x-1$ is a factor.',
        check: 'Use $a$ for $x-a$, not the opposite sign.',
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
        keyMove: '$\\ln x+\\ln5=\\ln(5x)$.',
        check: 'Adding logs multiplies inputs; it does not add inputs.',
      },
      {
        title: 'Isolate then log',
        focus: 'Solve $3e^{2x}=12$.',
        setup: 'Divide by $3$ first: $e^{2x}=4$.',
        keyMove: 'Take $\\ln$ to get $2x=\\ln4$, then divide by $2$.',
        check: 'Only take logs after the exponential term is isolated.',
      },
      {
        title: 'Linearise power law',
        focus: 'For $y=2x^3$, take logs.',
        setup: '$\\ln y=\\ln(2x^3)=\\ln2+3\\ln x$.',
        keyMove: 'Plot $\\ln y$ against $\\ln x$ for gradient $3$.',
        check: 'Power laws use $\\ln x$ on the horizontal axis.',
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
        keyMove: '$1-(1-2\\sin^2x)=2\\sin^2x$.',
        check: 'Choose the identity that moves toward the requested function.',
      },
      {
        title: 'Interval solution sweep',
        focus: 'Solve $\\sin x=\\frac12$ for $0\\le x<2\\pi$.',
        setup: 'Reference angle is $\\frac{\\pi}{6}$ and sine is positive in quadrants I and II.',
        keyMove: '$x=\\frac{\\pi}{6}$ or $x=\\frac{5\\pi}{6}$.',
        check: 'The interval decides the final answer list.',
      },
      {
        title: 'R-form',
        focus: 'Write $3\\sin x+4\\cos x$ as $R\\sin(x+\\alpha)$.',
        setup: '$R=\\sqrt{3^2+4^2}=5$.',
        keyMove: 'Match $5\\cos\\alpha=3$ and $5\\sin\\alpha=4$.',
        check: '$\\alpha=\\tan^{-1}(4/3)$ for acute $\\alpha$.',
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
      { title: 'Argument quadrant check', focus: 'Choose the correct angle from the coordinates.' },
      { title: 'Root pattern', focus: 'List roots with equal angular spacing.' },
      { title: 'Locus sketch', focus: 'Translate modulus conditions into geometry.' },
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
      { title: 'Rule selection', focus: 'Identify product, quotient, chain, or implicit structure.' },
      { title: 'Parametric gradient', focus: 'Build $\\frac{dy}{dx}$ from two derivatives.' },
      { title: 'Stationary point test', focus: 'Classify and interpret the result.' },
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
      { title: 'Substitution setup', focus: 'Choose u and transform limits cleanly.' },
      { title: 'Integration by parts table', focus: 'Pick $u$ and $dv$ deliberately.' },
      { title: 'Area under a curve', focus: 'Use limits and signs correctly.' },
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
      { title: 'Line intersection check', focus: 'Solve parameters across all components.' },
      { title: 'Scalar product angle', focus: 'Use direction vectors and the dot product.' },
      { title: 'Line relationship', focus: 'Classify parallel, intersecting, or skew.' },
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
      { title: 'Sign-change interval', focus: 'Show a root exists between two bounds.' },
      { title: 'Fixed-point iteration', focus: 'Carry repeated substitution accurately.' },
      { title: 'Accuracy statement', focus: 'Justify the final rounded value.' },
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
      { title: 'Separation layout', focus: 'Move variables to the correct sides.' },
      { title: 'Initial condition', focus: 'Find the constant from a known point.' },
      { title: 'Model from words', focus: 'Translate a rate statement into an equation.' },
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
      { title: 'Recognition card', focus: 'Spot the subtopic and expected method.' },
      { title: 'Method card', focus: 'Outline the first two lines of working.' },
    ],
    readinessChecklist: region.subtopics.slice(0, 4).map((subtopic) => `Recognize a ${subtopic} prompt.`),
  };
}
