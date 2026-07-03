import type { SkillCheckAnswerType } from '../skill-checks/answerChecker';

export const P1_REPAIR_LOCK_MESSAGE = 'P3 readiness recommendation: complete foundation review modules before continuing.' as const;
export const P1_REPAIR_REQUIRED_STATE_MESSAGE = 'Foundation review is recommended before P3 Exam Training.' as const;

export const P1_REPAIR_SKILL_TAGS = [
  'ALGEBRA_MANIPULATION',
  'EQUATION_SOLVING',
  'TRIG_BASIC',
  'DIFFERENTIATION_BASIC',
  'INTEGRATION_BASIC',
] as const;

export type P1RepairSkillTag = typeof P1_REPAIR_SKILL_TAGS[number];

export type P1RepairModuleStatus = 'LOCKED' | 'IN_PROGRESS' | 'COMPLETE';

export interface P1RepairQuestion {
  id: string;
  prompt: string;
  answerType: SkillCheckAnswerType;
  acceptedAnswers: string[];
  correction: string;
  tolerance?: number;
  orderMatters?: boolean;
  answerFormatHint?: string;
  answerPlaceholder?: string;
}

export interface P1RepairModuleDefinition {
  module_id: string;
  title: string;
  skill_tag: P1RepairSkillTag;
  learn_refresh_minutes: '10-20';
  weak_skill_tags: P1RepairSkillTag[];
  learn_refresh: string[];
  fast_questions: P1RepairQuestion[];
  mini_check: P1RepairQuestion;
}

export const P1_REPAIR_MODULES: P1RepairModuleDefinition[] = [
  {
    module_id: 'p1-repair-algebra-manipulation',
    title: 'Algebra Manipulation',
    skill_tag: 'ALGEBRA_MANIPULATION',
    learn_refresh_minutes: '10-20',
    weak_skill_tags: ['ALGEBRA_MANIPULATION'],
    learn_refresh: [
      'Expand brackets first only when it makes the expression simpler. Otherwise look for a common factor.',
      'Factorise by asking: common factor, difference of two squares, then quadratic brackets.',
      'For fractions, factor before cancelling. Never cancel terms joined by plus or minus.',
      'Do: rewrite the expression. See: the shared factor or bracket. Repeat until no illegal cancellation remains.',
    ],
    fast_questions: [
      {
        id: 'p1-alg-fast-01',
        prompt: 'Simplify $4(x-3)+2x$.',
        answerType: 'expression-text',
        acceptedAnswers: ['6x-12'],
        correction: 'Expand to $4x-12+2x$, then collect to $6x-12$.',
      },
      {
        id: 'p1-alg-fast-02',
        prompt: 'Factorise $6x+9$.',
        answerType: 'expression-text',
        acceptedAnswers: ['3(2x+3)', '(2x+3)3'],
        correction: 'Take out the common factor $3$: $3(2x+3)$.',
      },
      {
        id: 'p1-alg-fast-03',
        prompt: 'Factorise $x^2-16$.',
        answerType: 'expression-text',
        acceptedAnswers: ['(x-4)(x+4)', '(x+4)(x-4)'],
        correction: 'Use difference of two squares: $x^2-4^2=(x-4)(x+4)$.',
      },
      {
        id: 'p1-alg-fast-04',
        prompt: 'Factorise $x^2+7x+10$.',
        answerType: 'expression-text',
        acceptedAnswers: ['(x+5)(x+2)', '(x+2)(x+5)'],
        correction: 'Find two numbers with sum $7$ and product $10$: $5$ and $2$.',
      },
      {
        id: 'p1-alg-fast-05',
        prompt: 'Simplify $\\frac{3x^2}{6x}$.',
        answerType: 'expression-text',
        acceptedAnswers: ['x/2', '1/2x'],
        correction: 'Cancel $3x$ from numerator and denominator to get $x/2$.',
      },
      {
        id: 'p1-alg-fast-06',
        prompt: 'Simplify $\\frac{x^2-25}{x-5}$.',
        answerType: 'expression-text',
        acceptedAnswers: ['x+5'],
        correction: 'Factor the numerator: $(x-5)(x+5)$, then cancel the factor $x-5$.',
      },
      {
        id: 'p1-alg-fast-07',
        prompt: 'Expand and simplify $(x+3)(x-2)$.',
        answerType: 'expression-text',
        acceptedAnswers: ['x^2+x-6'],
        correction: 'Multiply each pair: $x^2-2x+3x-6=x^2+x-6$.',
      },
      {
        id: 'p1-alg-fast-08',
        prompt: 'Simplify $2a-3b+5a+b$.',
        answerType: 'expression-text',
        acceptedAnswers: ['7a-2b'],
        correction: 'Collect like terms: $2a+5a=7a$ and $-3b+b=-2b$.',
      },
    ],
    mini_check: {
      id: 'p1-alg-mini-01',
      prompt: 'Simplify fully $\\frac{x^2+x-6}{x+3}$.',
      answerType: 'expression-text',
      acceptedAnswers: ['x-2'],
      correction: 'Factor first: $x^2+x-6=(x+3)(x-2)$, then cancel $x+3$.',
    },
  },
  {
    module_id: 'p1-repair-equation-solving',
    title: 'Equation Solving',
    skill_tag: 'EQUATION_SOLVING',
    learn_refresh_minutes: '10-20',
    weak_skill_tags: ['EQUATION_SOLVING'],
    learn_refresh: [
      'For linear equations, undo operations in reverse order and keep both sides balanced.',
      'For quadratics, first put everything on one side. Then factorise, use the formula, or spot a square.',
      'For simultaneous equations, eliminate one variable cleanly before substituting back.',
      'Do: isolate or factor. See: the operation that removes clutter. Repeat with a final substitution check.',
    ],
    fast_questions: [
      {
        id: 'p1-eq-fast-01',
        prompt: 'Solve $3x+5=20$.',
        answerType: 'numeric',
        acceptedAnswers: ['5'],
        correction: 'Subtract $5$, then divide by $3$: $x=5$.',
      },
      {
        id: 'p1-eq-fast-02',
        prompt: 'Solve $7-2x=1$.',
        answerType: 'numeric',
        acceptedAnswers: ['3'],
        correction: 'Subtract $7$ to get $-2x=-6$, so $x=3$.',
      },
      {
        id: 'p1-eq-fast-03',
        prompt: 'Solve $\\frac{x}{4}+2=6$.',
        answerType: 'numeric',
        acceptedAnswers: ['16'],
        correction: 'Subtract $2$, then multiply by $4$: $x=16$.',
      },
      {
        id: 'p1-eq-fast-04',
        prompt: 'Solve $x^2-9=0$.',
        answerType: 'multi-value',
        acceptedAnswers: ['-3, 3'],
        orderMatters: false,
        correction: '$x^2=9$, so $x=-3$ or $x=3$.',
      },
      {
        id: 'p1-eq-fast-05',
        prompt: 'Solve $x^2-5x=0$.',
        answerType: 'multi-value',
        acceptedAnswers: ['0, 5'],
        orderMatters: false,
        correction: 'Factorise: $x(x-5)=0$, so $x=0$ or $x=5$.',
      },
      {
        id: 'p1-eq-fast-06',
        prompt: 'Solve $x^2+x-6=0$.',
        answerType: 'multi-value',
        acceptedAnswers: ['-3, 2'],
        orderMatters: false,
        correction: 'Factorise: $(x+3)(x-2)=0$, so $x=-3$ or $x=2$.',
      },
      {
        id: 'p1-eq-fast-07',
        prompt: 'If $2x+y=9$ and $y=3$, find $x$.',
        answerType: 'numeric',
        acceptedAnswers: ['3'],
        correction: 'Substitute $y=3$: $2x+3=9$, so $x=3$.',
      },
    ],
    mini_check: {
      id: 'p1-eq-mini-01',
      prompt: 'Solve $2x^2-5x-3=0$.',
      answerType: 'multi-value',
      acceptedAnswers: ['-1/2, 3'],
      orderMatters: false,
      correction: 'Factorise: $(2x+1)(x-3)=0$, so $x=-1/2$ or $x=3$.',
    },
  },
  {
    module_id: 'p1-repair-trig-basics',
    title: 'Trigonometry Basics',
    skill_tag: 'TRIG_BASIC',
    learn_refresh_minutes: '10-20',
    weak_skill_tags: ['TRIG_BASIC'],
    learn_refresh: [
      'Know the core identities: $\\sin^2 x+\\cos^2 x=1$ and $\\tan x=\\frac{\\sin x}{\\cos x}$.',
      'Use the unit circle signs: sine is y, cosine is x, tangent is sine over cosine.',
      'For exact angles, memorise $0,30,45,60,90$ degrees and reflect them into other quadrants.',
      'Do: identify the quadrant. See: the sign and reference angle. Repeat before solving P3 trig equations.',
    ],
    fast_questions: [
      {
        id: 'p1-trig-fast-01',
        prompt: 'Evaluate $\\sin 30^\\circ$.',
        answerType: 'numeric',
        acceptedAnswers: ['1/2', '0.5'],
        correction: '$\\sin 30^\\circ=1/2$.',
      },
      {
        id: 'p1-trig-fast-02',
        prompt: 'Evaluate $\\cos 60^\\circ$.',
        answerType: 'numeric',
        acceptedAnswers: ['1/2', '0.5'],
        correction: '$\\cos 60^\\circ=1/2$.',
      },
      {
        id: 'p1-trig-fast-03',
        prompt: 'Evaluate $\\tan 45^\\circ$.',
        answerType: 'numeric',
        acceptedAnswers: ['1'],
        correction: '$\\tan 45^\\circ=1$.',
      },
      {
        id: 'p1-trig-fast-04',
        prompt: 'If $\\sin^2 x=\\frac{9}{25}$, find $\\cos^2 x$.',
        answerType: 'numeric',
        acceptedAnswers: ['16/25', '0.64'],
        correction: 'Use $\\sin^2 x+\\cos^2 x=1$, so $\\cos^2 x=1-9/25=16/25$.',
      },
      {
        id: 'p1-trig-fast-05',
        prompt: 'In quadrant II, is $\\cos x$ positive or negative?',
        answerType: 'exact-text',
        acceptedAnswers: ['negative'],
        correction: 'Cosine is the x-coordinate, which is negative in quadrant II.',
      },
      {
        id: 'p1-trig-fast-06',
        prompt: 'Rewrite $\\frac{\\sin x}{\\cos x}$ as a single trig function.',
        answerType: 'exact-text',
        acceptedAnswers: ['tan x', 'tanx', 'tangent x'],
        correction: '$\\tan x=\\frac{\\sin x}{\\cos x}$.',
      },
      {
        id: 'p1-trig-fast-07',
        prompt: 'Solve $\\sin x=0$ for $0^\\circ\\leq x\\leq 360^\\circ$.',
        answerType: 'multi-value',
        acceptedAnswers: ['0, 180, 360'],
        orderMatters: false,
        correction: 'Sine is zero on the x-axis: $0^\\circ$, $180^\\circ$, and $360^\\circ$.',
      },
    ],
    mini_check: {
      id: 'p1-trig-mini-01',
      prompt: 'Solve $2\\cos x=1$ for $0^\\circ\\leq x\\leq 360^\\circ$.',
      answerType: 'multi-value',
      acceptedAnswers: ['60, 300'],
      orderMatters: false,
      correction: '$\\cos x=1/2$. Cosine is positive in quadrants I and IV, so $x=60^\\circ,300^\\circ$.',
    },
  },
  {
    module_id: 'p1-repair-differentiation-basics',
    title: 'Differentiation Basics',
    skill_tag: 'DIFFERENTIATION_BASIC',
    learn_refresh_minutes: '10-20',
    weak_skill_tags: ['DIFFERENTIATION_BASIC'],
    learn_refresh: [
      'Power rule: if $y=ax^n$, then $\\frac{dy}{dx}=anx^{n-1}$.',
      'Differentiate each term separately. Constants disappear.',
      'Gradient questions usually need substitution after differentiating.',
      'Do: apply the power rule. See: the new coefficient and power. Repeat, then substitute the requested x-value.',
    ],
    fast_questions: [
      {
        id: 'p1-diff-fast-01',
        prompt: 'Differentiate $x^3$.',
        answerType: 'expression-text',
        acceptedAnswers: ['3x^2'],
        correction: 'Bring down the power and subtract one: $3x^2$.',
      },
      {
        id: 'p1-diff-fast-02',
        prompt: 'Differentiate $5x^2$.',
        answerType: 'expression-text',
        acceptedAnswers: ['10x'],
        correction: '$5\\times2x^{1}=10x$.',
      },
      {
        id: 'p1-diff-fast-03',
        prompt: 'Differentiate $7$.',
        answerType: 'numeric',
        acceptedAnswers: ['0'],
        correction: 'The derivative of a constant is $0$.',
      },
      {
        id: 'p1-diff-fast-04',
        prompt: 'Differentiate $2x^3-4x$.',
        answerType: 'expression-text',
        acceptedAnswers: ['6x^2-4'],
        correction: 'Differentiate term by term: $6x^2-4$.',
      },
      {
        id: 'p1-diff-fast-05',
        prompt: 'For $y=x^2$, find $\\frac{dy}{dx}$ at $x=3$.',
        answerType: 'numeric',
        acceptedAnswers: ['6'],
        correction: '$dy/dx=2x$, so at $x=3$ the gradient is $6$.',
      },
      {
        id: 'p1-diff-fast-06',
        prompt: 'Differentiate $x^{-2}$.',
        answerType: 'expression-text',
        acceptedAnswers: ['-2x^-3', '-2/x^3'],
        correction: 'Use the same power rule: $-2x^{-3}$.',
      },
      {
        id: 'p1-diff-fast-07',
        prompt: 'Differentiate $3x^2+2x-1$.',
        answerType: 'expression-text',
        acceptedAnswers: ['6x+2'],
        correction: 'Differentiate term by term: $6x+2$.',
      },
    ],
    mini_check: {
      id: 'p1-diff-mini-01',
      prompt: 'For $y=2x^3-3x^2+4$, find the gradient at $x=1$.',
      answerType: 'numeric',
      acceptedAnswers: ['0'],
      correction: '$dy/dx=6x^2-6x$. At $x=1$, the gradient is $0$.',
    },
  },
  {
    module_id: 'p1-repair-integration-basics',
    title: 'Integration Basics',
    skill_tag: 'INTEGRATION_BASIC',
    learn_refresh_minutes: '10-20',
    weak_skill_tags: ['INTEGRATION_BASIC'],
    learn_refresh: [
      'Power rule in reverse: $\\int ax^n dx=\\frac{a}{n+1}x^{n+1}+C$ when $n\\neq -1$.',
      'Integrate each term separately and include $+C$ for indefinite integrals.',
      'For definite integrals, substitute upper limit, substitute lower limit, then subtract.',
      'Do: raise the power. See: the divided coefficient. Repeat, then check by differentiating.',
    ],
    fast_questions: [
      {
        id: 'p1-int-fast-01',
        prompt: 'Integrate $x^2$ with respect to $x$.',
        answerType: 'expression-text',
        acceptedAnswers: ['x^3/3+C', '1/3x^3+C'],
        correction: 'Raise the power to $3$ and divide by $3$: $x^3/3+C$.',
      },
      {
        id: 'p1-int-fast-02',
        prompt: 'Integrate $4x$ with respect to $x$.',
        answerType: 'expression-text',
        acceptedAnswers: ['2x^2+C'],
        correction: '$4x$ integrates to $4x^2/2=2x^2$, then add $C$.',
      },
      {
        id: 'p1-int-fast-03',
        prompt: 'Integrate $6$ with respect to $x$.',
        answerType: 'expression-text',
        acceptedAnswers: ['6x+C'],
        correction: 'A constant integrates to constant times $x$: $6x+C$.',
      },
      {
        id: 'p1-int-fast-04',
        prompt: 'Integrate $3x^2+2$ with respect to $x$.',
        answerType: 'expression-text',
        acceptedAnswers: ['x^3+2x+C'],
        correction: 'Integrate term by term: $x^3+2x+C$.',
      },
      {
        id: 'p1-int-fast-05',
        prompt: 'Evaluate $\\int_0^2 x\\,dx$.',
        answerType: 'numeric',
        acceptedAnswers: ['2'],
        correction: 'Antiderivative is $x^2/2$. Substitute: $2^2/2-0=2$.',
      },
      {
        id: 'p1-int-fast-06',
        prompt: 'What constant must be added to an indefinite integral?',
        answerType: 'exact-text',
        acceptedAnswers: ['C', '+C', 'constant of integration'],
        correction: 'Indefinite integrals need the constant of integration, written $+C$.',
      },
      {
        id: 'p1-int-fast-07',
        prompt: 'Integrate $x^{-2}$ with respect to $x$.',
        answerType: 'expression-text',
        acceptedAnswers: ['-x^-1+C', '-1/x+C'],
        correction: 'Raise the power to $-1$ and divide by $-1$: $-x^{-1}+C$.',
      },
    ],
    mini_check: {
      id: 'p1-int-mini-01',
      prompt: 'Evaluate $\\int_1^3 (2x+1)\\,dx$.',
      answerType: 'numeric',
      acceptedAnswers: ['10'],
      correction: 'Antiderivative is $x^2+x$. Evaluate: $(9+3)-(1+1)=10$.',
    },
  },
];
