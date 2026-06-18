import type { QuickCheckContract, QuickCheckOption, QuickCheckTwoValueField } from '../types';
import type { CourseId } from './courses';
import type { P3RegionId } from '../lib/p3SkillContract';
import type { SkillCheckAnswerSpec, SkillCheckAnswerType } from '../skill-checks/answerChecker';
import { SUPPORTED_SKILL_CHECK_ANSWER_TYPES } from '../skill-checks/answerChecker';
import { isSkillCheckMistakeTag } from '../skill-checks/mistakeRecovery';
import { REMAINING_REGION_SKILL_CHECK_ITEMS } from './remainingSkillCheckItems';

export type SkillCheckInputType =
  | 'numeric'
  | 'multiple_choice'
  | 'checkbox'
  | 'ordered_cards'
  | 'two_value';

export type SkillCheckValidationMode = 'deterministic' | 'self_check' | 'teacher_review';
export type SkillCheckComplexity = 'foundation' | 'core' | 'challenge';

export type SkillCheckSourceType =
  | 'authored'
  | 'quick-check contract'
  | 'generated practice'
  | 'exam-bank reference'
  | 'teaching snippet';

export interface SkillCheckSourceRefs {
  skillMapSource?: 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json';
  visualTemplateIds?: string[];
  generatedPracticeIds?: string[];
  quickCheckContractIds?: string[];
  teachingSnippetIds?: string[];
  canonicalQuestionIds?: string[];
  questionAssetIds?: string[];
  markSchemeAssetIds?: string[];
  contentLabCandidateIds?: string[];
}

export interface SkillCheckItem {
  itemId: string;
  courseId?: CourseId;
  paperFamily: 'p3';
  regionId: P3RegionId | string;
  fieldGuideTopicId: string;
  fieldGuideSubtopicId: string;
  skillId: string;
  prompt: string;
  inputType: SkillCheckInputType;
  validationMode: SkillCheckValidationMode;
  expectedAnswer?: string | string[];
  expectedOptionIds?: string[];
  expectedOrder?: string[];
  options?: QuickCheckOption[];
  fields?: QuickCheckTwoValueField[];
  cards?: QuickCheckOption[];
  displayPrefix?: string;
  displaySuffix?: string;
  tolerance?: number;
  answerType?: SkillCheckAnswerType;
  acceptedAnswers?: string[];
  orderInsensitive?: boolean;
  repairStep?: string;
  mistakeTags?: string[];
  checkable?: boolean;
  unsupportedAnswerReason?: string;
  visualTemplateId?: string;
  commonMistake?: string;
  complexity: SkillCheckComplexity;
  hints: {
    nudge: string;
    methodCue?: string;
    firstStep?: string;
  };
  workedRoute: string[];
  sourceTypes: SkillCheckSourceType[];
  sourceRefs: SkillCheckSourceRefs;
  review: {
    status: 'teacher_reviewed';
    sourceSkillReviewed: boolean;
    markEventReviewed: boolean;
    affectsProgression: false;
  };
}

export type SkillCheckCheckabilityStatus =
  | 'deterministically-checkable'
  | 'not-yet-checkable'
  | 'unsupported-answer-form';

export interface SkillCheckCheckabilitySummary {
  itemId: string;
  regionId: string;
  skillId: string;
  status: SkillCheckCheckabilityStatus;
  answerType?: SkillCheckAnswerType;
  reason?: string;
}

export interface SkillCheckTopicMigrationSummary {
  regionId: string;
  totalChecks: number;
  checkableChecks: number;
  uncheckableChecks: number;
  unsupportedAnswerReasons: string[];
  answerTypes: SkillCheckAnswerType[];
}

const SKILL_MAP_SOURCE = 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json' as const;

function sourceRefs(refs: Omit<SkillCheckSourceRefs, 'skillMapSource'>): SkillCheckSourceRefs {
  return {
    skillMapSource: SKILL_MAP_SOURCE,
    ...refs,
  };
}

function review(): SkillCheckItem['review'] {
  return {
    status: 'teacher_reviewed',
    sourceSkillReviewed: true,
    markEventReviewed: false,
    affectsProgression: false,
  };
}

export const AUTHORED_SKILL_CHECK_ITEMS: SkillCheckItem[] = [
  {
    itemId: 'sc-alg-modulus-foundation-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_modulus_graph_equations',
    fieldGuideSubtopicId: 'algebra_modulus_graph_equations',
    skillId: 'p3_alg_modulus_cases',
    prompt: 'Solve $|3x+1|=7$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['-8/3, 2'],
    orderInsensitive: true,
    repairStep: 'Split the modulus equation into $3x+1=7$ and $3x+1=-7$, then keep both roots.',
    mistakeTags: ['method choice', 'sign error', 'incomplete reasoning'],
    expectedOptionIds: ['both-roots'],
    options: [
      { id: 'both-roots', label: '$x=-\\frac83$ or $x=2$' },
      { id: 'positive-only', label: '$x=2$ only' },
      { id: 'sign-error', label: '$x=-2$ or $x=\\frac83$' },
      { id: 'inside-zero', label: '$x=-\\frac13$' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'A modulus equation with one absolute value has two linear cases.',
      methodCue: 'Use $3x+1=7$ or $3x+1=-7$.',
      firstStep: '$3x+1=7$ gives one root immediately.',
    },
    workedRoute: [
      'Split into $3x+1=7$ and $3x+1=-7$.',
      'The first case gives $x=2$.',
      'The second case gives $x=-\\frac83$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_modulus_equation_basic_0001'],
      quickCheckContractIds: ['p3-modulus-cases-001-qc'],
      teachingSnippetIds: ['p3-modulus-cases-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-alg-modulus-core-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_modulus_graph_equations',
    fieldGuideSubtopicId: 'algebra_modulus_graph_equations',
    skillId: 'p3_alg_modulus_cases',
    prompt: 'Select every solution of $|x+2|=|3x|$.',
    inputType: 'checkbox',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['-1/2, 1'],
    orderInsensitive: true,
    repairStep: 'Split the equation into $x+2=3x$ and $x+2=-3x$, then list both roots.',
    mistakeTags: ['method choice', 'incomplete reasoning', 'sign error'],
    expectedOptionIds: ['minus-half', 'one'],
    options: [
      { id: 'minus-half', label: '$x=-\\frac12$' },
      { id: 'one', label: '$x=1$' },
      { id: 'zero', label: '$x=0$' },
      { id: 'minus-one', label: '$x=-1$' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Equal moduli can mean equal or opposite inside expressions.',
      methodCue: 'Use $x+2=3x$ and $x+2=-3x$.',
      firstStep: 'The first case gives $x=1$.',
    },
    workedRoute: [
      '$x+2=3x$ gives $x=1$.',
      '$x+2=-3x$ gives $x=-\\frac12$.',
      'Both values satisfy the original modulus equation.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_modulus_equation_basic_0002'],
      teachingSnippetIds: ['p3-modulus-cases-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-alg-modulus-challenge-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_modulus_graph_equations',
    fieldGuideSubtopicId: 'algebra_modulus_graph_equations',
    skillId: 'p3_alg_modulus_cases',
    prompt: 'The graphs $y=|x+2|$ and $y=|3x|$ meet at $x=-\\frac12$ and $x=1$. Where is $|x+2|<|3x|$?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['x<-1/2, x>1'],
    orderInsensitive: true,
    repairStep: 'Test a value in the middle interval; since it fails, the solution is outside the two intersection points.',
    mistakeTags: ['domain/range issue', 'method choice', 'sign error'],
    expectedOptionIds: ['outside'],
    options: [
      { id: 'outside', label: '$x<-\\frac12$ or $x>1$' },
      { id: 'inside', label: '$-\\frac12<x<1$' },
      { id: 'left-only', label: '$x<-\\frac12$ only' },
      { id: 'right-only', label: '$x>1$ only' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'The intersection points split the number line into three test intervals.',
      methodCue: 'Test one value in the middle interval before deciding inside or outside.',
      firstStep: 'At $x=0$, $|x+2|<|3x|$ becomes $2<0$, which is false.',
    },
    workedRoute: [
      'The equality points split the line at $-\\frac12$ and $1$.',
      'Testing $x=0$ shows the middle interval is false.',
      'The solution is therefore outside the two intersections: $x<-\\frac12$ or $x>1$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_modulus_equation_basic_0004'],
      teachingSnippetIds: ['p3-modulus-cases-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-alg-polynomial-division-foundation-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_polynomial_division',
    fieldGuideSubtopicId: 'algebra_polynomial_division',
    skillId: 'p3_alg_polynomial_remainder_factor',
    prompt: 'Order the opening long-division moves for dividing $x^3-6x^2+11x-6$ by $x-1$.',
    inputType: 'ordered_cards',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['divide-leading, multiply-back, subtract, continue'],
    orderInsensitive: false,
    repairStep: 'Long division starts by dividing leading terms, then multiplying back, subtracting, and continuing with the new leading term.',
    mistakeTags: ['method choice', 'incomplete reasoning'],
    expectedOrder: ['divide-leading', 'multiply-back', 'subtract', 'continue'],
    cards: [
      { id: 'divide-leading', label: 'Divide leading terms: $x^3\\div x=x^2$.' },
      { id: 'multiply-back', label: 'Multiply back: $x^2(x-1)=x^3-x^2$.' },
      { id: 'subtract', label: 'Subtract to get $-5x^2+11x-6$.' },
      { id: 'continue', label: 'Continue with $-5x^2\\div x=-5x$.' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'Long division alternates divide, multiply back, subtract, then repeat.',
      methodCue: 'Start with leading term divided by leading term.',
      firstStep: '$x^3\\div x=x^2$.',
    },
    workedRoute: [
      'First divide leading terms: $x^3\\div x=x^2$.',
      'Multiply back by the divisor and subtract: $(x^3-6x^2+11x-6)-(x^3-x^2)=-5x^2+11x-6$.',
      'Then continue by dividing the new leading term: $-5x^2\\div x=-5x$.',
    ],
    sourceTypes: ['authored', 'generated practice'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_polynomial_remainder_factor_basic_0001'] }),
    review: review(),
  },
  {
    itemId: 'sc-alg-polynomial-division-core-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_polynomial_division',
    fieldGuideSubtopicId: 'algebra_polynomial_division',
    skillId: 'p3_alg_polynomial_remainder_factor',
    prompt: 'Divide $x^3+3x^2-x+5$ by $x-2$. Give the quotient and remainder.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['x^2+5x+9, 23', 'quotient x^2+5x+9, remainder 23'],
    orderInsensitive: false,
    repairStep: 'Continue the division until the remainder is constant: the quotient is $x^2+5x+9$ and the remainder is $23$.',
    mistakeTags: ['coefficient error', 'sign error', 'incomplete reasoning'],
    fields: [
      { id: 'quotient', label: 'quotient', expectedAnswer: ['x^2+5x+9', 'x^2 + 5x + 9'], displayPrefix: 'quotient =' },
      { id: 'remainder', label: 'remainder', expectedAnswer: '23', displayPrefix: 'remainder =' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Continue subtracting after each quotient term.',
      methodCue: 'The quotient terms are found from leading term over leading term.',
      firstStep: '$x^3\\div x=x^2$, then subtract $x^3-2x^2$.',
    },
    workedRoute: [
      'After the first subtraction, the next line is $5x^2-x+5$.',
      'The next quotient terms are $5x$ and $9$.',
      'The quotient is $x^2+5x+9$ and the remainder is $23$.',
    ],
    sourceTypes: ['authored', 'generated practice'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_polynomial_remainder_factor_basic_0002'] }),
    review: review(),
  },
  {
    itemId: 'sc-alg-polynomial-division-challenge-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_polynomial_division',
    fieldGuideSubtopicId: 'algebra_polynomial_division',
    skillId: 'p3_alg_polynomial_remainder_factor',
    prompt: 'Divide $2x^3-x^2+5x+7$ by $2x+1$. Give the quotient and remainder.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['x^2-x+3, 4', 'quotient x^2-x+3, remainder 4'],
    orderInsensitive: false,
    repairStep: 'Because the divisor is $2x+1$, divide each current leading term by $2x$ before multiplying back.',
    mistakeTags: ['coefficient error', 'sign error', 'incomplete reasoning'],
    fields: [
      { id: 'quotient', label: 'quotient', expectedAnswer: ['x^2-x+3', 'x^2 - x + 3'], displayPrefix: 'quotient =' },
      { id: 'remainder', label: 'remainder', expectedAnswer: '4', displayPrefix: 'remainder =' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'The divisor is not monic, so divide by $2x$ each time.',
      methodCue: 'Start with $2x^3\\div2x=x^2$.',
      firstStep: 'Subtract $(2x+1)x^2$ from the dividend.',
    },
    workedRoute: [
      'The quotient terms are $x^2$, then $-x$, then $3$.',
      'Multiplying back gives $2x^3-x^2+5x+3$.',
      'The remainder is $4$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_polynomial_remainder_factor_basic_0004'] }),
    review: review(),
  },
  {
    itemId: 'sc-alg-remainder-factor-foundation-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_remainder_factor_theorem',
    fieldGuideSubtopicId: 'algebra_remainder_factor_theorem',
    skillId: 'p3_alg_polynomial_remainder_factor',
    prompt: 'For $f(x)=x^3-4x+1$, what substitution gives the remainder on division by $x+2$?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'numeric',
    acceptedAnswers: ['-2'],
    repairStep: 'Set the divisor equal to zero: $x+2=0$, so substitute $x=-2$.',
    mistakeTags: ['sign error', 'method choice'],
    expectedOptionIds: ['minus-two'],
    options: [
      { id: 'minus-two', label: '$x=-2$' },
      { id: 'two', label: '$x=2$' },
      { id: 'zero', label: '$x=0$' },
      { id: 'minus-four', label: '$x=-4$' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'Set the divisor equal to zero.',
      methodCue: '$x+2=0$.',
      firstStep: '$x=-2$.',
    },
    workedRoute: [
      'The remainder theorem uses the value that makes the divisor zero.',
      '$x+2=0$ gives $x=-2$.',
      'The first move is to evaluate $f(-2)$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_polynomial_remainder_factor_basic_0005'],
      quickCheckContractIds: ['p3-polynomial-theorem-001-qc'],
      teachingSnippetIds: ['p3-polynomial-theorem-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-alg-remainder-factor-core-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_remainder_factor_theorem',
    fieldGuideSubtopicId: 'algebra_remainder_factor_theorem',
    skillId: 'p3_alg_polynomial_remainder_factor',
    prompt: 'Find the remainder when $f(x)=2x^3-x+4$ is divided by $2x+1$.',
    inputType: 'numeric',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'numeric',
    acceptedAnswers: ['17/4'],
    repairStep: 'Use the root of the divisor, $x=-\\frac12$, and evaluate $f\\left(-\\frac12\\right)$.',
    mistakeTags: ['sign error', 'calculator', 'method choice'],
    expectedAnswer: ['17/4', '\\frac{17}{4}', '4.25'],
    complexity: 'core',
    hints: {
      nudge: 'Use the root of the linear divisor.',
      methodCue: 'Evaluate $f\\left(-\\frac12\\right)$.',
      firstStep: '$2x+1=0$ gives $x=-\\frac12$.',
    },
    workedRoute: [
      'Set $2x+1=0$, so $x=-\\frac12$.',
      '$f\\left(-\\frac12\\right)=2\\left(-\\frac18\\right)-\\left(-\\frac12\\right)+4$.',
      'The value is $\\frac{17}{4}$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_polynomial_remainder_factor_basic_0006'] }),
    review: review(),
  },
  {
    itemId: 'sc-alg-remainder-factor-challenge-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_remainder_factor_theorem',
    fieldGuideSubtopicId: 'algebra_remainder_factor_theorem',
    skillId: 'p3_alg_polynomial_remainder_factor',
    prompt: 'For $f(x)=x^3+ax^2+bx+6$, $x-1$ is a factor and the remainder on division by $x+2$ is $12$. Find $a$ and $b$.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'coordinate',
    acceptedAnswers: ['(0,-7)'],
    repairStep: 'Use $f(1)=0$ and $f(-2)=12$ to form two simultaneous equations in $a$ and $b$.',
    mistakeTags: ['method choice', 'sign error', 'coefficient error'],
    fields: [
      { id: 'a', label: 'a', expectedAnswer: '0', displayPrefix: '$a=$' },
      { id: 'b', label: 'b', expectedAnswer: '-7', displayPrefix: '$b=$' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'Turn each condition into an equation in $a$ and $b$.',
      methodCue: 'Use $f(1)=0$ and $f(-2)=12$.',
      firstStep: '$f(1)=0$ gives $a+b=-7$.',
    },
    workedRoute: [
      '$f(1)=0$ gives $1+a+b+6=0$, so $a+b=-7$.',
      '$f(-2)=12$ gives $-8+4a-2b+6=12$, so $2a-b=7$.',
      'Solving gives $a=0$ and $b=-7$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_polynomial_remainder_factor_basic_0009'] }),
    review: review(),
  },
  {
    itemId: 'sc-alg-partial-fractions-foundation-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_partial_fractions',
    fieldGuideSubtopicId: 'algebra_partial_fractions',
    skillId: 'p3_alg_partial_fraction_form',
    prompt: 'What partial-fraction form fits $\\frac{x+3}{(x-2)(x+1)}$?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['A/(x-2)+B/(x+1)', 'B/(x+1)+A/(x-2)'],
    repairStep: 'Each distinct linear factor gets one constant numerator over that factor.',
    mistakeTags: ['method choice', 'notation'],
    expectedOptionIds: ['distinct'],
    options: [
      { id: 'distinct', label: '$\\frac{A}{x-2}+\\frac{B}{x+1}$' },
      { id: 'repeated', label: '$\\frac{A}{x-2}+\\frac{B}{(x-2)^2}$' },
      { id: 'quadratic', label: '$\\frac{Ax+B}{x-2}+\\frac{C}{x+1}$' },
      { id: 'constant', label: '$A+\\frac{B}{(x-2)(x+1)}$' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'Each distinct linear factor gets one constant numerator.',
      methodCue: 'There are two different linear factors.',
      firstStep: 'Use one term over $x-2$ and one term over $x+1$.',
    },
    workedRoute: [
      'The denominator has distinct linear factors.',
      'Use $\\frac{A}{x-2}+\\frac{B}{x+1}$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_partial_fractions_distinct_linear_0001'],
      quickCheckContractIds: ['p3-partial-fractions-form-001-qc'],
      teachingSnippetIds: ['p3-partial-fractions-form-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-alg-partial-fractions-core-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_partial_fractions',
    fieldGuideSubtopicId: 'algebra_partial_fractions',
    skillId: 'p3_alg_partial_fraction_form',
    prompt: 'What form fits $\\frac{3x^2+2}{x(x-1)^2}$ before solving constants?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['A/x+B/(x-1)+C/(x-1)^2'],
    repairStep: 'Use one term for $x$, then include both powers of the repeated factor $(x-1)^2$.',
    mistakeTags: ['method choice', 'incomplete reasoning', 'notation'],
    expectedOptionIds: ['repeated'],
    options: [
      { id: 'repeated', label: '$\\frac{A}{x}+\\frac{B}{x-1}+\\frac{C}{(x-1)^2}$' },
      { id: 'missing-power', label: '$\\frac{A}{x}+\\frac{B}{(x-1)^2}$' },
      { id: 'distinct-only', label: '$\\frac{A}{x}+\\frac{B}{x-1}$' },
      { id: 'quadratic-top', label: '$\\frac{Ax+B}{x}+\\frac{C}{(x-1)^2}$' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'A repeated linear factor needs each power up to the repeated power.',
      methodCue: 'Include both $x-1$ and $(x-1)^2$.',
      firstStep: 'The separate factor $x$ also needs its own term.',
    },
    workedRoute: [
      '$x$ gives a term $\\frac{A}{x}$.',
      'The repeated factor $(x-1)^2$ gives $\\frac{B}{x-1}+\\frac{C}{(x-1)^2}$.',
      'Put together: $\\frac{A}{x}+\\frac{B}{x-1}+\\frac{C}{(x-1)^2}$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_partial_fractions_repeated_linear_0001'],
      quickCheckContractIds: ['p3-partial-fractions-repeated-linear-001-qc'],
      teachingSnippetIds: ['p3-partial-fractions-repeated-linear-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-alg-partial-fractions-challenge-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_partial_fractions',
    fieldGuideSubtopicId: 'algebra_partial_fractions',
    skillId: 'p3_alg_partial_fraction_form',
    prompt: 'Select every correct denominator-to-form match.',
    inputType: 'checkbox',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['A/(x-2)+B/(x+1), A/x+B/(x-1)+C/(x-1)^2, A/(x+1)+(Bx+C)/(x^2+2)'],
    orderInsensitive: true,
    repairStep: 'Match each denominator type: distinct linear, repeated linear, and irreducible quadratic with a linear numerator.',
    mistakeTags: ['method choice', 'notation', 'incomplete reasoning'],
    expectedOptionIds: ['distinct-form', 'repeated-form', 'quadratic-form'],
    options: [
      { id: 'distinct-form', label: '$(x-2)(x+1)\\rightarrow \\frac{A}{x-2}+\\frac{B}{x+1}$' },
      { id: 'repeated-form', label: '$x(x-1)^2\\rightarrow \\frac{A}{x}+\\frac{B}{x-1}+\\frac{C}{(x-1)^2}$' },
      { id: 'quadratic-form', label: '$(x+1)(x^2+2)\\rightarrow \\frac{A}{x+1}+\\frac{Bx+C}{x^2+2}$' },
      { id: 'quadratic-wrong', label: '$(x+1)(x^2+2)\\rightarrow \\frac{A}{x+1}+\\frac{B}{x^2+2}$' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'Use the denominator type, not the numerator, to choose the form.',
      methodCue: 'Quadratic factors need linear numerators; repeated linear factors need every power.',
      firstStep: 'Check the three denominator shapes one by one.',
    },
    workedRoute: [
      'Distinct linear factors each get one constant numerator.',
      'Repeated linear factors use every power up to the repeated power.',
      'An irreducible quadratic factor needs a linear numerator $Bx+C$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_partial_fractions_repeated_linear_0003'] }),
    review: review(),
  },
  {
    itemId: 'sc-alg-binomial-foundation-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_binomial_expansion',
    fieldGuideSubtopicId: 'algebra_binomial_expansion',
    skillId: 'p3_alg_binomial_terms_coefficients',
    prompt: 'Find the coefficient of $x$ in the expansion of $(1-2x)^{-2}$.',
    inputType: 'numeric',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'numeric',
    acceptedAnswers: ['4'],
    repairStep: 'Use the linear binomial term $nu$ with $n=-2$ and $u=-2x$.',
    mistakeTags: ['coefficient error', 'method choice'],
    expectedAnswer: ['4', '$4'],
    complexity: 'foundation',
    hints: {
      nudge: 'Use the generalized binomial linear term $nu$.',
      methodCue: 'Here $n=-2$ and $u=-2x$.',
      firstStep: '$(-2)(-2x)=4x$.',
    },
    workedRoute: [
      'The linear term in $(1+u)^n$ is $nu$.',
      'Here $u=-2x$ and $n=-2$, so $nu=(-2)(-2x)=4x$.',
      'The coefficient of $x$ is $4$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'exam-bank reference'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_binomial_first_terms_and_coefficient_0001'],
      canonicalQuestionIds: ['33summer21_q01'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-alg-binomial-core-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_binomial_expansion',
    fieldGuideSubtopicId: 'algebra_binomial_expansion',
    skillId: 'p3_alg_binomial_validity',
    prompt: 'State the interval of validity for expanding $(1+3x)^{-2}$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'interval',
    acceptedAnswers: ['-1/3 < x < 1/3'],
    repairStep: 'Start from $|3x|<1$, then divide the whole inequality by $3$.',
    mistakeTags: ['domain/range issue', 'notation'],
    expectedOptionIds: ['thirds'],
    options: [
      { id: 'thirds', label: '$-\\frac13<x<\\frac13$' },
      { id: 'halves', label: '$-\\frac12<x<\\frac12$' },
      { id: 'positive-only', label: '$0<x<\\frac13$' },
      { id: 'closed', label: '$-\\frac13\\le x\\le\\frac13$' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'The validity condition is on the variable part inside the bracket.',
      methodCue: 'For $(1+u)^n$, use $|u|<1$.',
      firstStep: 'Here $u=3x$, so $|3x|<1$.',
    },
    workedRoute: [
      'Use $|3x|<1$.',
      'Divide by $3$ to get $|x|<\\frac13$.',
      'So $-\\frac13<x<\\frac13$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_binomial_validity_range_0001'],
      quickCheckContractIds: ['p3-binomial-validity-range-001-qc'],
      teachingSnippetIds: ['p3-binomial-validity-range-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-alg-binomial-challenge-001',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_binomial_expansion',
    fieldGuideSubtopicId: 'algebra_binomial_expansion',
    skillId: 'p3_alg_binomial_terms_coefficients',
    prompt: 'Using a binomial expansion, find the coefficient of $x^3$ in $\\frac{3+x}{1+3x}$.',
    inputType: 'numeric',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'numeric',
    acceptedAnswers: ['-72'],
    repairStep: 'Collect the $x^3$ terms from $(3+x)(1+3x)^{-1}$: $3(-27x^3)$ and $x(9x^2)$.',
    mistakeTags: ['coefficient error', 'sign error', 'method choice'],
    expectedAnswer: '-72',
    complexity: 'challenge',
    hints: {
      nudge: 'Rewrite the fraction as a product before collecting the $x^3$ terms.',
      methodCue: 'Use $(3+x)(1+3x)^{-1}$.',
      firstStep: '$(1+3x)^{-1}=1-3x+9x^2-27x^3+\\cdots$.',
    },
    workedRoute: [
      'Write the expression as $(3+x)(1+3x)^{-1}$.',
      'The $x^3$ terms come from $3(-27x^3)$ and $x(9x^2)$.',
      'The coefficient is $-81+9=-72$.',
    ],
    sourceTypes: ['authored', 'generated practice'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_binomial_first_terms_and_coefficient_0003'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-graph-foundation-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_graph_inverse',
    fieldGuideSubtopicId: 'log_graph_inverse',
    skillId: 'p3_log_convert_forms',
    prompt: 'Rewrite $\\log_2 32=5$ in exponential form.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['2^5=32', '32=2^5'],
    repairStep: 'Use $\\log_a b=c \\iff a^c=b$ and keep the base as $2$.',
    mistakeTags: ['notation', 'method choice'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$2^5=32$' },
      { id: 'swapped', label: '$32^2=5$' },
      { id: 'wrong-base', label: '$5^2=32$' },
      { id: 'reciprocal', label: '$2^{32}=5$' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'Read the base, exponent, and result separately.',
      methodCue: '$\\log_a b=c$ means $a^c=b$.',
      firstStep: 'The base is $2$ and the exponent is $5$.',
    },
    workedRoute: [
      '$\\log_a b=c$ means $a^c=b$.',
      'So $\\log_2 32=5$ becomes $2^5=32$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_graph_inverse_basic_0001'],
      quickCheckContractIds: ['p3-log-exp-convert-001-qc'],
      teachingSnippetIds: ['p3-log-exp-convert-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-log-graph-core-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_graph_inverse',
    fieldGuideSubtopicId: 'log_graph_inverse',
    skillId: 'p3_log_convert_forms',
    prompt: 'The point $(3,8)$ lies on $y=2^x$. Enter the matching point on $y=\\log_2x$.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'coordinate',
    acceptedAnswers: ['(8,3)'],
    repairStep: 'Swap the coordinates of the point on the inverse graph.',
    mistakeTags: ['domain/range issue', 'notation'],
    fields: [
      { id: 'x', label: 'x-coordinate', expectedAnswer: '8', displayPrefix: '$x=$' },
      { id: 'y', label: 'y-coordinate', expectedAnswer: '3', displayPrefix: '$y=$' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Inverse graph points swap coordinates.',
      methodCue: 'The inverse of $y=2^x$ is $y=\\log_2x$.',
      firstStep: 'Swap $(3,8)$ to $(8,3)$.',
    },
    workedRoute: [
      'The logarithm graph is the inverse of the exponential graph.',
      'Inverse points swap coordinates.',
      'So the matching point is $(8,3)$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_graph_inverse_basic_0002'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-graph-challenge-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_graph_inverse',
    fieldGuideSubtopicId: 'log_graph_inverse',
    skillId: 'p3_log_convert_forms',
    prompt: 'Select every true statement for $y=\\log_3x$.',
    inputType: 'checkbox',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: [
      'domain x>0, range all real y',
      'domain positive, range real',
      'x>0, all real y',
    ],
    orderInsensitive: true,
    repairStep: 'Use the inverse of $y=3^x$: exponential outputs are positive, while exponential inputs can be any real number.',
    mistakeTags: ['domain/range issue', 'method choice', 'notation'],
    expectedOptionIds: ['domain-positive', 'range-real'],
    options: [
      { id: 'domain-positive', label: 'The domain is $x>0$.' },
      { id: 'range-real', label: 'The range is all real $y$.' },
      { id: 'domain-real', label: 'The domain is all real $x$.' },
      { id: 'range-positive', label: 'The range is $y>0$ only.' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'Use the inverse relationship with $y=3^x$.',
      methodCue: 'The exponential range becomes the logarithm domain.',
      firstStep: '$3^x$ has positive output only.',
    },
    workedRoute: [
      '$y=\\log_3x$ is the inverse of $y=3^x$.',
      'The exponential output is positive, so the logarithm input must be positive.',
      'The logarithm output can be any real number.',
    ],
    sourceTypes: ['authored', 'generated practice'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_graph_inverse_basic_0003'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-laws-foundation-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_laws',
    fieldGuideSubtopicId: 'log_laws',
    skillId: 'p3_log_laws_equations',
    prompt: 'Select every form equivalent to $\\ln x+\\ln5$.',
    inputType: 'checkbox',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['ln(5x), ln(x*5)', 'ln5x, ln(x*5)', 'ln(5x), ln(x times 5)'],
    orderInsensitive: true,
    repairStep: 'Use the product law: a sum of logarithms becomes one logarithm of a product.',
    mistakeTags: ['wrong identity', 'notation', 'method choice'],
    expectedOptionIds: ['ln-5x', 'ln-x5'],
    options: [
      { id: 'ln-5x', label: '$\\ln(5x)$' },
      { id: 'ln-x5', label: '$\\ln(x\\cdot5)$' },
      { id: 'ln-x-plus-5', label: '$\\ln(x+5)$' },
      { id: 'five-ln-x', label: '$5\\ln x$' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'A sum of logs becomes one log of a product.',
      methodCue: 'Use $\\ln a+\\ln b=\\ln(ab)$.',
      firstStep: '$\\ln x+\\ln5=\\ln(5x)$.',
    },
    workedRoute: [
      'Use the product law.',
      '$\\ln x+\\ln5=\\ln(5x)$, which is the same as $\\ln(x\\cdot5)$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_laws_basic_0001'],
      quickCheckContractIds: ['p3-log-laws-001-qc'],
      teachingSnippetIds: ['p3-log-laws-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-log-laws-core-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_laws',
    fieldGuideSubtopicId: 'log_laws',
    skillId: 'p3_log_laws_equations',
    prompt: 'Select every valid step for writing $2\\ln x-\\ln(x+1)$ as a single logarithm.',
    inputType: 'checkbox',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['2lnx=ln(x^2), ln(x^2)-ln(x+1)=ln(x^2/(x+1))'],
    orderInsensitive: true,
    repairStep: 'Use the power law first, then use the quotient law for the subtraction.',
    mistakeTags: ['wrong identity', 'method choice', 'notation'],
    expectedOptionIds: ['power-law', 'quotient-law'],
    options: [
      { id: 'power-law', label: '$2\\ln x=\\ln(x^2)$' },
      { id: 'quotient-law', label: '$\\ln(x^2)-\\ln(x+1)=\\ln\\left(\\frac{x^2}{x+1}\\right)$' },
      { id: 'coefficient-error', label: '$2\\ln x=\\ln(2x)$' },
      { id: 'subtraction-error', label: '$\\ln(x^2)-\\ln(x+1)=\\ln(x^2(x+1))$' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Select the power-law step and the quotient-law step.',
      methodCue: 'Use the power law, then the quotient law.',
      firstStep: '$2\\ln x=\\ln(x^2)$.',
    },
    workedRoute: [
      '$2\\ln x=\\ln(x^2)$.',
      'Subtracting logs gives a quotient.',
      'So the result is $\\ln\\left(\\frac{x^2}{x+1}\\right)$.',
    ],
    sourceTypes: ['authored', 'generated practice'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_laws_basic_0002'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-laws-challenge-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_laws',
    fieldGuideSubtopicId: 'log_laws',
    skillId: 'p3_log_laws_equations',
    prompt: 'Why is $\\ln(x+3)=\\ln x+\\ln3$ invalid?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'exact-text',
    acceptedAnswers: [
      'there is no log law that splits a sum inside one logarithm',
      'no log law splits a sum inside one logarithm',
      'log laws split products not sums',
      'the product law is for multiplication not addition',
    ],
    repairStep: 'Compare $x+3$ with $3x$: logarithm laws combine products and quotients, not sums inside a logarithm.',
    mistakeTags: ['wrong identity', 'method choice'],
    expectedOptionIds: ['sum-not-product'],
    options: [
      { id: 'sum-not-product', label: 'There is no log law that splits a sum inside one logarithm.' },
      { id: 'base-wrong', label: 'The base of $\\ln$ changes from term to term.' },
      { id: 'constant-wrong', label: '$3$ is too small to appear inside a logarithm.' },
      { id: 'always-valid', label: 'It is valid for every positive $x$.' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'The product law is about multiplication, not addition.',
      methodCue: '$\\ln x+\\ln3=\\ln(3x)$.',
      firstStep: 'Compare $x+3$ with $3x$.',
    },
    workedRoute: [
      'The product law says $\\ln x+\\ln3=\\ln(3x)$.',
      '$x+3$ is a sum, not the product $3x$.',
      'So the proposed split is not a valid log law.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_laws_basic_0003'],
      quickCheckContractIds: ['p3-log-invalid-operations-001-qc'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-log-natural-foundation-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_e_natural_logs',
    fieldGuideSubtopicId: 'log_e_natural_logs',
    skillId: 'p3_log_exponential_equations',
    prompt: 'Solve $e^{2x}=7$ exactly.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['1/2ln7', '(1/2)ln7', 'ln7/2', 'ln(7)/2', '(ln7)/2', '\\frac12\\ln7', '\\frac{1}{2}\\ln7', '\\frac{\\ln7}{2}'],
    repairStep: 'Take natural logs to get $2x=\\ln7$, then divide by $2$.',
    mistakeTags: ['coefficient error', 'method choice', 'notation'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$x=\\frac12\\ln7$' },
      { id: 'missing-half', label: '$x=\\ln7$' },
      { id: 'wrong-base', label: '$x=\\log_7 2$' },
      { id: 'reciprocal', label: '$x=\\frac{2}{\\ln7}$' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: '$\\ln$ is the inverse of $e^x$.',
      methodCue: 'Take natural logs of both sides.',
      firstStep: '$2x=\\ln7$.',
    },
    workedRoute: [
      'Take natural logs: $2x=\\ln7$.',
      'Divide by $2$ to get $x=\\frac12\\ln7$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_equation_basic_0001'],
      quickCheckContractIds: ['p3-ln-e-inverse-001-qc'],
      teachingSnippetIds: ['p3-ln-e-inverse-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-log-natural-core-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_e_natural_logs',
    fieldGuideSubtopicId: 'log_e_natural_logs',
    skillId: 'p3_log_exponential_equations',
    prompt: 'Solve $5e^{3x}=20$ exactly.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['1/3ln4', '(1/3)ln4', 'ln4/3', 'ln(4)/3', '(ln4)/3', '\\frac13\\ln4', '\\frac{1}{3}\\ln4', '\\frac{\\ln4}{3}'],
    repairStep: 'Divide by $5$ before taking natural logs, then divide the exponent equation by $3$.',
    mistakeTags: ['coefficient error', 'method choice', 'notation'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$x=\\frac13\\ln4$' },
      { id: 'no-divide', label: '$x=\\ln20$' },
      { id: 'miss-scale', label: '$x=\\frac13\\ln20$' },
      { id: 'missing-third', label: '$x=\\ln4$' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Isolate the exponential term before taking logs.',
      methodCue: 'Divide by $5$ first.',
      firstStep: '$e^{3x}=4$.',
    },
    workedRoute: [
      'Divide by $5$: $e^{3x}=4$.',
      'Take natural logs: $3x=\\ln4$.',
      'So $x=\\frac13\\ln4$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_equation_basic_0002'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-natural-challenge-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_e_natural_logs',
    fieldGuideSubtopicId: 'log_e_natural_logs',
    skillId: 'p3_log_exponential_equations',
    prompt: 'Order the moves to solve $2e^{x+1}=9$ exactly.',
    inputType: 'ordered_cards',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['divide by 2, take natural logs, subtract 1', 'divide-two, take-ln, subtract-one'],
    orderInsensitive: false,
    repairStep: 'First isolate $e^{x+1}$, then take natural logs, then subtract $1$.',
    mistakeTags: ['method choice', 'incomplete reasoning'],
    expectedOrder: ['divide-two', 'take-ln', 'subtract-one'],
    cards: [
      { id: 'take-ln', label: 'Take natural logs: $x+1=\\ln\\left(\\frac92\\right)$.' },
      { id: 'subtract-one', label: 'Subtract $1$: $x=\\ln\\left(\\frac92\\right)-1$.' },
      { id: 'divide-two', label: 'Divide by $2$: $e^{x+1}=\\frac92$.' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'Do not take logs until the exponential term is isolated.',
      methodCue: 'Divide, then take $\\ln$, then isolate $x$.',
      firstStep: 'Start with $e^{x+1}=\\frac92$.',
    },
    workedRoute: [
      'Divide by $2$ to isolate the exponential term.',
      'Take natural logs to get $x+1=\\ln\\left(\\frac92\\right)$.',
      'Subtract $1$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_equation_basic_0003'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-domain-foundation-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_equations_inequalities',
    fieldGuideSubtopicId: 'log_equations_inequalities',
    skillId: 'p3_log_domain_validation',
    prompt: 'What condition must $x$ satisfy before working with $\\ln(x-2)$?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['x>2'],
    repairStep: 'Set the logarithm input positive: $x-2>0$.',
    mistakeTags: ['domain/range issue', 'sign error', 'notation'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$x>2$' },
      { id: 'nonnegative', label: '$x\\ge2$' },
      { id: 'less', label: '$x<2$' },
      { id: 'all-real', label: 'All real $x$' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'The input to a logarithm must be positive.',
      methodCue: 'Set $x-2>0$.',
      firstStep: '$x>2$.',
    },
    workedRoute: [
      'A logarithm input must be positive.',
      '$x-2>0$, so $x>2$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_domain_validation_basic_0001'],
      quickCheckContractIds: ['p3-log-domain-001-qc'],
      teachingSnippetIds: ['p3-log-domain-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-log-domain-core-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_equations_inequalities',
    fieldGuideSubtopicId: 'log_equations_inequalities',
    skillId: 'p3_log_domain_validation',
    prompt: 'Solve $\\ln(x-1)=\\ln5$, checking the domain.',
    inputType: 'numeric',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'numeric',
    acceptedAnswers: ['6'],
    repairStep: 'Equal natural logarithms have equal positive inputs, so solve $x-1=5$ and check $x>1$.',
    mistakeTags: ['domain/range issue', 'method choice'],
    expectedAnswer: '6',
    displayPrefix: '$x=$',
    complexity: 'core',
    hints: {
      nudge: 'Equal natural logs have equal positive arguments.',
      methodCue: 'First note $x-1>0$, then compare arguments.',
      firstStep: '$x-1=5$.',
    },
    workedRoute: [
      'The domain is $x>1$.',
      '$\\ln(x-1)=\\ln5$ gives $x-1=5$.',
      'So $x=6$, which satisfies the domain.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_domain_validation_basic_0002'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-domain-challenge-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_equations_inequalities',
    fieldGuideSubtopicId: 'log_equations_inequalities',
    skillId: 'p3_log_domain_validation',
    prompt: 'Order the safe solving moves for $\\ln(x-2)+\\ln(x+1)=\\ln10$.',
    inputType: 'ordered_cards',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['domain, combine, solve, reject'],
    orderInsensitive: false,
    repairStep: 'State the original domain first, then combine logs, solve, and reject invalid candidates.',
    mistakeTags: ['domain/range issue', 'method choice', 'incomplete reasoning'],
    expectedOrder: ['domain', 'combine', 'solve', 'reject'],
    cards: [
      { id: 'solve', label: 'Solve $(x-2)(x+1)=10$ to get candidate roots.' },
      { id: 'reject', label: 'Reject any candidate that breaks the original log domain.' },
      { id: 'domain', label: 'State the original-domain restrictions.' },
      { id: 'combine', label: 'Combine the left side into one logarithm.' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'Domain checking must happen before trusting algebraic roots.',
      methodCue: 'Domain, combine, solve, reject.',
      firstStep: 'Start by requiring both $x-2>0$ and $x+1>0$.',
    },
    workedRoute: [
      'First require both original log inputs to be positive.',
      'Then combine logs and solve the resulting equation.',
      'Finally reject roots that make an original log input non-positive.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_domain_validation_basic_0003'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-exponential-foundation-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'exponential_equations_inequalities',
    fieldGuideSubtopicId: 'exponential_equations_inequalities',
    skillId: 'p3_log_exponential_equations',
    prompt: 'Solve $3^x>27$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['x>3'],
    repairStep: 'Rewrite $27$ as $3^3$ and compare exponents because base $3$ is increasing.',
    mistakeTags: ['method choice', 'notation'],
    expectedOptionIds: ['x-greater-3'],
    options: [
      { id: 'x-greater-3', label: '$x>3$' },
      { id: 'x-less-3', label: '$x<3$' },
      { id: 'x-equals-3', label: '$x=3$' },
      { id: 'x-greater-27', label: '$x>27$' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'Rewrite $27$ as a power of $3$.',
      methodCue: '$27=3^3$, and base $3$ is increasing.',
      firstStep: '$3^x>3^3$.',
    },
    workedRoute: [
      '$27=3^3$.',
      'Since $3>1$, the exponential function is increasing.',
      'Therefore $x>3$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_exponential_inequality_basic_0001'],
      quickCheckContractIds: ['p3-exp-equations-001-qc'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-log-exponential-core-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'exponential_equations_inequalities',
    fieldGuideSubtopicId: 'exponential_equations_inequalities',
    skillId: 'p3_log_exponential_equations',
    prompt: 'Solve $\\left(\\frac12\\right)^x\\le\\left(\\frac12\\right)^3$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['x>=3', 'x\\ge3', 'x\\geq3'],
    repairStep: 'Because $0<\\frac12<1$, the exponential function is decreasing, so the inequality reverses when comparing exponents.',
    mistakeTags: ['domain/range issue', 'method choice', 'notation'],
    expectedOptionIds: ['x-greater-equal-3'],
    options: [
      { id: 'x-greater-equal-3', label: '$x\\ge3$' },
      { id: 'x-less-equal-3', label: '$x\\le3$' },
      { id: 'x-greater-3', label: '$x>3$' },
      { id: 'x-equals-3', label: '$x=3$ only' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'A base between $0$ and $1$ is decreasing.',
      methodCue: 'The inequality reverses when you compare exponents.',
      firstStep: 'The base $\\frac12$ is decreasing.',
    },
    workedRoute: [
      'The base $\\frac12$ is between $0$ and $1$.',
      'The exponential function is decreasing.',
      'So $\\left(\\frac12\\right)^x\\le\\left(\\frac12\\right)^3$ gives $x\\ge3$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_exponential_inequality_basic_0002'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-exponential-challenge-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'exponential_equations_inequalities',
    fieldGuideSubtopicId: 'exponential_equations_inequalities',
    skillId: 'p3_log_exponential_equations',
    prompt: 'Solve $3e^{2x}<12$ exactly.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['x<1/2ln4', 'x<(1/2)ln4', 'x<ln4/2', 'x<ln(4)/2', 'x<(ln4)/2', 'x<\\frac12\\ln4', 'x<\\frac{1}{2}\\ln4', 'x<\\frac{\\ln4}{2}'],
    repairStep: 'Divide by $3$, take natural logs, and keep the inequality direction because $e^x$ is increasing.',
    mistakeTags: ['coefficient error', 'method choice', 'notation'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$x<\\frac12\\ln4$' },
      { id: 'wrong-direction', label: '$x>\\frac12\\ln4$' },
      { id: 'missing-half', label: '$x<\\ln4$' },
      { id: 'no-divide', label: '$x<\\frac12\\ln12$' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'Isolate the exponential term before taking logs.',
      methodCue: 'Divide by $3$, then use $\\ln$; $e^x$ is increasing.',
      firstStep: '$e^{2x}<4$.',
    },
    workedRoute: [
      'Divide by $3$: $e^{2x}<4$.',
      'Take natural logs; the direction stays the same because $e^x$ is increasing.',
      'Then $2x<\\ln4$, so $x<\\frac12\\ln4$.',
    ],
    sourceTypes: ['authored', 'generated practice'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_exponential_inequality_basic_0003'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-linearisation-foundation-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_linearisation',
    fieldGuideSubtopicId: 'log_linearisation',
    skillId: 'p3_log_linearisation',
    prompt: 'For $y=Ae^{kx}$, order the steps that produce the linear form for plotting $\\ln y$ against $x$.',
    inputType: 'ordered_cards',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['take logs, split product, simplify exponential, read line', 'take-logs, split-product, simplify-exponential, read-line'],
    orderInsensitive: false,
    repairStep: 'Take natural logs of the whole model, split the product, simplify $\\ln(e^{kx})$, then read the straight-line form.',
    mistakeTags: ['method choice', 'incomplete reasoning', 'notation'],
    expectedOrder: ['take-logs', 'split-product', 'simplify-exponential', 'read-line'],
    cards: [
      { id: 'take-logs', label: 'Take logs: $\\ln y=\\ln(Ae^{kx})$' },
      { id: 'split-product', label: 'Split the product: $\\ln y=\\ln A+\\ln(e^{kx})$' },
      { id: 'simplify-exponential', label: 'Simplify: $\\ln(e^{kx})=kx$' },
      { id: 'read-line', label: 'Use $\\ln y=\\ln A+kx$ as the straight-line form' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'Start by taking logs of the whole model, then simplify the exponential term.',
      methodCue: 'Use $\\ln(uv)=\\ln u+\\ln v$ and $\\ln(e^{kx})=kx$.',
      firstStep: '$\\ln y=\\ln(Ae^{kx})$.',
    },
    workedRoute: [
      'Take natural logs: $\\ln y=\\ln(Ae^{kx})$.',
      'Split the product and simplify $\\ln(e^{kx})$.',
      'The linear form is $\\ln y=\\ln A+kx$.',
    ],
    sourceTypes: ['authored', 'generated practice'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_linearisation_basic_0001'] }),
    review: review(),
  },
  {
    itemId: 'sc-log-linearisation-core-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_linearisation',
    fieldGuideSubtopicId: 'log_linearisation',
    skillId: 'p3_log_linearisation',
    prompt: 'If $\\ln y=2+3x$, give the gradient and intercept on a graph of $\\ln y$ against $x$.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'coordinate',
    acceptedAnswers: ['(3,2)'],
    repairStep: 'Match $\\ln y=2+3x$ to $Y=c+mX$: gradient first, intercept second.',
    mistakeTags: ['coefficient error', 'notation'],
    fields: [
      { id: 'gradient', label: 'gradient', expectedAnswer: '3', displayPrefix: 'gradient =' },
      { id: 'intercept', label: 'intercept', expectedAnswer: '2', displayPrefix: 'intercept =' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Match the equation to $Y=c+mX$.',
      methodCue: 'Here $Y=\\ln y$ and $X=x$.',
      firstStep: 'The coefficient of $x$ is the gradient.',
    },
    workedRoute: [
      'Compare $\\ln y=2+3x$ with $Y=c+mX$.',
      'The gradient is $3$.',
      'The intercept is $2$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'quick-check contract'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_linearisation_basic_0002'],
      quickCheckContractIds: ['p3-log-linearisation-001-qc'],
      teachingSnippetIds: ['p3-log-linearisation-001'],
    }),
    review: review(),
  },
  {
    itemId: 'sc-log-linearisation-challenge-001',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_linearisation',
    fieldGuideSubtopicId: 'log_linearisation',
    skillId: 'p3_log_linearisation',
    prompt: 'Order the moves to linearise $y=4e^{2x}$ by taking natural logs.',
    inputType: 'ordered_cards',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['take logs, split product, simplify exponential, read line', 'take-logs, split-product, simplify-exponential, read-line'],
    orderInsensitive: false,
    repairStep: 'Take logs of both sides, split $\\ln(4e^{2x})$, simplify $\\ln(e^{2x})$, then read the linear form.',
    mistakeTags: ['method choice', 'incomplete reasoning', 'notation'],
    expectedOrder: ['take-logs', 'split-product', 'simplify-exponential', 'read-line'],
    cards: [
      { id: 'take-logs', label: 'Take logs: $\\ln y=\\ln(4e^{2x})$.' },
      { id: 'split-product', label: 'Split the product: $\\ln y=\\ln4+\\ln(e^{2x})$.' },
      { id: 'simplify-exponential', label: 'Simplify: $\\ln(e^{2x})=2x$.' },
      { id: 'read-line', label: 'Read the linear form: $\\ln y=\\ln4+2x$.' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'Start by taking logs, then use product and exponential log laws.',
      methodCue: '$\\ln(4e^{2x})=\\ln4+\\ln(e^{2x})$.',
      firstStep: 'Take $\\ln$ of both sides.',
    },
    workedRoute: [
      'Take logs of both sides.',
      '$\\ln(4e^{2x})=\\ln4+\\ln(e^{2x})$.',
      'So $\\ln y=\\ln4+2x$.',
    ],
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_log_linearisation_basic_0003'] }),
    review: review(),
  },
  {
    itemId: 'sc-alg-modulus-graph-interval-002',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_modulus_graph_equations',
    fieldGuideSubtopicId: 'algebra_modulus_graph_equations',
    skillId: 'p3_alg_modulus_cases',
    prompt: 'The graph of $y=|2x-3|$ meets $y=5$ at $x=-1$ and $x=4$. Where is $|2x-3|<5$?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'interval',
    acceptedAnswers: ['-1 < x < 4', '-1<x<4'],
    repairStep: 'Below the horizontal line is between the two graph intersections.',
    mistakeTags: ['domain/range issue', 'method choice'],
    expectedOptionIds: ['between'],
    options: [
      { id: 'between', label: '$-1<x<4$' },
      { id: 'outside', label: '$x<-1$ or $x>4$' },
      { id: 'left-only', label: '$x<-1$ only' },
      { id: 'right-only', label: '$x>4$ only' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Less than means the modulus graph is below the horizontal line.',
      methodCue: 'A V-shape lies below the line between its two crossings.',
      firstStep: 'Use the interval between $-1$ and $4$.',
    },
    workedRoute: [
      'The equality points are $x=-1$ and $x=4$.',
      '$|2x-3|<5$ asks where the graph is below $y=5$.',
      'That interval is $-1<x<4$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-alg-polynomial-division-quartic-002',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_polynomial_division',
    fieldGuideSubtopicId: 'algebra_polynomial_division',
    skillId: 'p3_alg_polynomial_remainder_factor',
    prompt: 'Divide $x^4+2x^3-3x^2+4x-4$ by $x^2+2x-1$. Give the quotient and remainder.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['x^2-2, 2', 'quotient x^2-2, remainder 2'],
    orderInsensitive: false,
    repairStep: 'Use long division until the remainder has degree below $2$: quotient $x^2-2$, remainder $2$.',
    mistakeTags: ['coefficient error', 'sign error', 'incomplete reasoning'],
    fields: [
      { id: 'quotient', label: 'quotient', expectedAnswer: ['x^2-2', 'x^2 - 2'], displayPrefix: 'quotient =' },
      { id: 'remainder', label: 'remainder', expectedAnswer: '2', displayPrefix: 'remainder =' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'This is still leading-term division, even with a quartic and a quadratic divisor.',
      methodCue: 'Start with $x^4\\div x^2=x^2$.',
      firstStep: 'Subtract $x^2(x^2+2x-1)$.',
    },
    workedRoute: [
      'The first quotient term is $x^2$.',
      'The next quotient term is $-2$.',
      'The quotient is $x^2-2$ and the remainder is $2$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-alg-remainder-factor-nonmonic-002',
    paperFamily: 'p3',
    regionId: 'algebra',
    fieldGuideTopicId: 'algebra_remainder_factor_theorem',
    fieldGuideSubtopicId: 'algebra_remainder_factor_theorem',
    skillId: 'p3_alg_polynomial_remainder_factor',
    prompt: 'For $f(x)=4x^3+ax+b$, $2x-3$ is a factor and the remainder on division by $x+1$ is $10$. Find $a$ and $b$.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'coordinate',
    acceptedAnswers: ['(-6,0)'],
    repairStep: 'Use $f(3/2)=0$ and $f(-1)=10$, then solve the two simultaneous equations.',
    mistakeTags: ['coefficient error', 'sign error', 'method choice'],
    fields: [
      { id: 'a', label: 'a', expectedAnswer: '-6', displayPrefix: '$a=$' },
      { id: 'b', label: 'b', expectedAnswer: '0', displayPrefix: '$b=$' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'A non-monic factor $2x-3$ uses $x=3/2$ in the theorem.',
      methodCue: 'Use $f(3/2)=0$ and $f(-1)=10$.',
      firstStep: '$f(3/2)=0$ gives $27+3a+2b=0$.',
    },
    workedRoute: [
      '$f(\\frac32)=0$ gives $27+3a+2b=0$.',
      '$f(-1)=10$ gives $-4-a+b=10$.',
      'Solving gives $a=-6$ and $b=0$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-log-power-law-linearisation-002',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_linearisation',
    fieldGuideSubtopicId: 'log_linearisation',
    skillId: 'p3_log_linearisation',
    prompt: 'For $y=kx^n$, which straight-line form is used for a graph of $\\ln y$ against $\\ln x$?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['ln y = ln k + n ln x', 'correct'],
    repairStep: 'Take logs of $y=kx^n$ to get $\\ln y=\\ln k+n\\ln x$.',
    mistakeTags: ['method choice', 'coefficient error', 'notation'],
    expectedOptionIds: ['power-law'],
    options: [
      { id: 'power-law', label: '$\\ln y=\\ln k+n\\ln x$' },
      { id: 'exponential', label: '$\\ln y=\\ln k+nx$' },
      { id: 'wrong-product', label: '$\\ln y=k+n\\ln x$' },
      { id: 'wrong-axis', label: '$y=\\ln k+n\\ln x$' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'The exponent $n$ becomes the gradient against $\\ln x$.',
      methodCue: 'Use $\\ln(x^n)=n\\ln x$.',
      firstStep: 'Take logs of both sides.',
    },
    workedRoute: [
      'Take logs: $\\ln y=\\ln(kx^n)$.',
      'Split the product and apply the power law.',
      'The linear form is $\\ln y=\\ln k+n\\ln x$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-log-inequalities-domain-002',
    paperFamily: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    fieldGuideTopicId: 'log_equations_inequalities',
    fieldGuideSubtopicId: 'log_equations_inequalities',
    skillId: 'p3_log_domain_validation',
    prompt: 'Solve $\\ln(x-1)<\\ln5$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'interval',
    acceptedAnswers: ['1 < x < 6', '1<x<6'],
    repairStep: 'Use both the domain $x>1$ and the comparison $x-1<5$.',
    mistakeTags: ['domain/range issue', 'method choice'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$1<x<6$' },
      { id: 'no-domain', label: '$x<6$' },
      { id: 'wrong-side', label: '$x>6$' },
      { id: 'closed', label: '$1\\le x\\le6$' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Do not lose the original logarithm domain.',
      methodCue: '$x-1>0$ and $x-1<5$.',
      firstStep: 'The domain is $x>1$.',
    },
    workedRoute: [
      '$\\ln(x-1)$ requires $x>1$.',
      'Since $\\ln$ is increasing, compare inputs: $x-1<5$.',
      'Together this gives $1<x<6$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-trig-reciprocal-graphs-equations-002',
    paperFamily: 'p3',
    regionId: 'trigonometry',
    fieldGuideTopicId: 'trig_reciprocal_functions',
    fieldGuideSubtopicId: 'trig_reciprocal_functions',
    skillId: 'p3_trig_reciprocal_double_angle',
    prompt: 'Solve $\\cot x=1$ for $0\\le x<2\\pi$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['pi/4, 5pi/4', '\\pi/4, 5\\pi/4'],
    orderInsensitive: true,
    repairStep: 'Rewrite $\\cot x=1$ as $\\tan x=1$, then solve in quadrants I and III.',
    mistakeTags: ['wrong identity', 'domain/range issue'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$x=\\frac\\pi4,\\frac{5\\pi}{4}$' },
      { id: 'sine', label: '$x=\\frac\\pi2$ only' },
      { id: 'cosine', label: '$x=0,\\pi$' },
      { id: 'one-root', label: '$x=\\frac\\pi4$ only' },
    ],
    complexity: 'core',
    hints: {
      nudge: '$\\cot x=1$ is a tangent equation after reciprocal rewriting.',
      methodCue: '$\\tan x=1$.',
      firstStep: 'The reference angle is $\\pi/4$.',
    },
    workedRoute: [
      '$\\cot x=1$ gives $\\tan x=1$.',
      'Tangent is positive in quadrants I and III.',
      'The solutions are $\\frac\\pi4$ and $\\frac{5\\pi}{4}$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-trig-r-form-002',
    paperFamily: 'p3',
    regionId: 'trigonometry',
    fieldGuideTopicId: 'trig_r_form_transformations',
    fieldGuideSubtopicId: 'trig_r_form_transformations',
    skillId: 'p3_trig_r_form_compound_angles',
    prompt: 'For $3\\sin x+4\\cos x=R\\sin(x+\\alpha)$ with acute $\\alpha$, find $R$ and $\\tan\\alpha$.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['5, 4/3', 'R=5, tan alpha=4/3'],
    orderInsensitive: false,
    repairStep: 'Expand $R\\sin(x+\\alpha)$, then match $R\\cos\\alpha=3$ and $R\\sin\\alpha=4$.',
    mistakeTags: ['coefficient error', 'method choice'],
    fields: [
      { id: 'r', label: 'R', expectedAnswer: '5', displayPrefix: '$R=$' },
      { id: 'tan-alpha', label: 'tan alpha', expectedAnswer: ['4/3', '\\frac43', '\\frac{4}{3}'], displayPrefix: '$\\tan\\alpha=$' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'Match coefficients after expanding the compound-angle form.',
      methodCue: '$R\\cos\\alpha=3$, $R\\sin\\alpha=4$.',
      firstStep: '$R^2=3^2+4^2$.',
    },
    workedRoute: [
      'Expanding gives $R\\sin x\\cos\\alpha+R\\cos x\\sin\\alpha$.',
      'Match $R\\cos\\alpha=3$ and $R\\sin\\alpha=4$.',
      'Thus $R=5$ and $\\tan\\alpha=4/3$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-diff-arctan-derivative-002',
    paperFamily: 'p3',
    regionId: 'differentiation',
    fieldGuideTopicId: 'derivatives_inverse_tangent_support',
    fieldGuideSubtopicId: 'derivatives_inverse_tangent_support',
    skillId: 'p3_diff_chain_product_quotient',
    prompt: 'Differentiate $\\tan^{-1}(2x-1)$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'expression-text',
    acceptedAnswers: ['2/(1+(2x-1)^2)', 'correct'],
    repairStep: 'Use $d(\\tan^{-1}u)/dx=u\\prime/(1+u^2)$ with $u=2x-1$.',
    mistakeTags: ['wrong identity', 'coefficient error'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$\\frac{2}{1+(2x-1)^2}$' },
      { id: 'missing-chain', label: '$\\frac{1}{1+(2x-1)^2}$' },
      { id: 'tan-derivative', label: '$2\\sec^2(2x-1)$' },
      { id: 'reciprocal', label: '$\\frac{1}{\\tan(2x-1)}$' },
    ],
    complexity: 'core',
    hints: {
      nudge: '$\\tan^{-1}$ here is inverse tangent.',
      methodCue: 'Use $u\\prime/(1+u^2)$.',
      firstStep: '$u=2x-1$, so $u\\prime=2$.',
    },
    workedRoute: [
      'Let $u=2x-1$.',
      'The inverse-tangent derivative is $u\\prime/(1+u^2)$.',
      'The derivative is $\\frac{2}{1+(2x-1)^2}$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-int-arctan-distinguish-002',
    paperFamily: 'p3',
    regionId: 'integration',
    fieldGuideTopicId: 'integrals_arctan_forms',
    fieldGuideSubtopicId: 'integrals_arctan_forms',
    skillId: 'p3_int_method_choice',
    prompt: 'Which integral is the direct arctangent form?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'exact-text',
    acceptedAnswers: ['int 1/(x^2+9) dx', 'correct'],
    repairStep: 'Arctangent form needs $1/(x^2+a^2)$; reciprocal linear factors lead to logarithms or partial fractions.',
    mistakeTags: ['method choice', 'wrong identity'],
    expectedOptionIds: ['arctan'],
    options: [
      { id: 'arctan', label: '$\\int \\frac{1}{x^2+9}\\,dx$' },
      { id: 'log-linear', label: '$\\int \\frac{1}{x-3}\\,dx$' },
      { id: 'partial-fractions', label: '$\\int \\frac{1}{(x-3)(x+1)}\\,dx$' },
      { id: 'reverse-chain', label: '$\\int \\frac{2x}{x^2+9}\\,dx$' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Look for a sum of squares with constant numerator.',
      methodCue: '$x^2+9=x^2+3^2$.',
      firstStep: 'Match $x^2+a^2$.',
    },
    workedRoute: [
      '$x^2+9$ is a sum of squares.',
      '$\\int 1/(x^2+a^2)\\,dx$ gives an arctangent.',
      'The other listed forms lead to logarithms or partial fractions.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-vectors-foundation-midpoint-proof-002',
    paperFamily: 'p3',
    regionId: 'vectors',
    fieldGuideTopicId: 'vectors_geometric_add_subtract',
    fieldGuideSubtopicId: 'vectors_geometric_add_subtract',
    skillId: 'p3_vec_3d_geometry_modelling',
    prompt: 'Find the midpoint of $A(2,-1,3)$ and $B(8,5,1)$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'coordinate',
    acceptedAnswers: ['(5,2,2)'],
    repairStep: 'Average corresponding coordinates: $((2+8)/2,(-1+5)/2,(3+1)/2)$.',
    mistakeTags: ['method choice', 'calculator'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$(5,2,2)$' },
      { id: 'sum', label: '$(10,4,4)$' },
      { id: 'difference', label: '$(6,6,-2)$' },
      { id: 'wrong-order', label: '$(3,2,5)$' },
    ],
    complexity: 'foundation',
    hints: {
      nudge: 'A midpoint is the average of endpoints.',
      methodCue: '$M=\\frac12(A+B)$.',
      firstStep: 'Average the x-coordinates first.',
    },
    workedRoute: [
      'Average x-coordinates: $(2+8)/2=5$.',
      'Average y-coordinates: $(-1+5)/2=2$.',
      'Average z-coordinates: $(3+1)/2=2$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-complex-square-roots-exact-002',
    paperFamily: 'p3',
    regionId: 'complex-numbers',
    fieldGuideTopicId: 'roots',
    fieldGuideSubtopicId: 'roots',
    skillId: 'p3_complex_roots_powers',
    prompt: 'Find the two square roots of $3+4i$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'multi-value',
    acceptedAnswers: ['2+i, -2-i', '-2-i, 2+i'],
    orderInsensitive: true,
    repairStep: 'Check $(2+i)^2=3+4i$, then include the opposite root.',
    mistakeTags: ['sign error', 'incomplete reasoning'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: '$2+i$ and $-2-i$' },
      { id: 'one-root', label: '$2+i$ only' },
      { id: 'conjugates', label: '$2+i$ and $2-i$' },
      { id: 'swapped', label: '$1+2i$ and $-1-2i$' },
    ],
    complexity: 'challenge',
    hints: {
      nudge: 'Square the proposed root and remember the second root is its negative.',
      methodCue: '$(2+i)^2=4+4i+i^2$.',
      firstStep: 'Use $i^2=-1$.',
    },
    workedRoute: [
      '$(2+i)^2=4+4i-1=3+4i$.',
      'So $2+i$ is one square root.',
      'The other square root is $-2-i$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  {
    itemId: 'sc-complex-argand-transformations-002',
    paperFamily: 'p3',
    regionId: 'complex-numbers',
    fieldGuideTopicId: 'cartesian-conjugate',
    fieldGuideSubtopicId: 'cartesian-conjugate',
    skillId: 'p3_complex_cartesian_conjugate',
    prompt: 'What is the Argand effect of $z\\mapsto\\overline z+(2-i)$?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    checkable: true,
    answerType: 'exact-text',
    acceptedAnswers: ['reflect in real axis then translate by (2,-1)', 'correct'],
    repairStep: 'Conjugation reflects in the real axis; adding $2-i$ then translates by $(2,-1)$.',
    mistakeTags: ['sign error', 'method choice'],
    expectedOptionIds: ['correct'],
    options: [
      { id: 'correct', label: 'Reflect in the real axis, then translate by $(2,-1)$' },
      { id: 'imag-axis', label: 'Reflect in the imaginary axis, then translate by $(2,-1)$' },
      { id: 'rotate', label: 'Rotate by $\\pi/2$, then translate by $(2,-1)$' },
      { id: 'translate-only', label: 'Translate by $(2,-1)$ only' },
    ],
    complexity: 'core',
    hints: {
      nudge: 'Read the conjugation and the addition as two separate Argand effects.',
      methodCue: '$\\overline z$ reflects in the real axis.',
      firstStep: '$2-i$ is the displacement $(2,-1)$.',
    },
    workedRoute: [
      '$z\\mapsto\\overline z$ reflects the point in the real axis.',
      'Adding $2-i$ translates every point right $2$ and down $1$.',
      'So the combined effect is reflection in the real axis followed by translation by $(2,-1)$.',
    ],
    sourceTypes: ['authored'],
    sourceRefs: sourceRefs({}),
    review: review(),
  },
  ...REMAINING_REGION_SKILL_CHECK_ITEMS,
];

export function skillCheckContractForItem(item: SkillCheckItem): QuickCheckContract {
  if (item.inputType === 'numeric') {
    return {
      prompt: item.prompt,
      answerType: 'single_value',
      expectedAnswer: item.expectedAnswer,
      displayPrefix: item.displayPrefix,
      displaySuffix: item.displaySuffix,
      tolerance: item.tolerance,
      hint: item.hints.nudge,
      workedFirstStep: item.hints.firstStep,
      explanation: item.workedRoute.join(' '),
    };
  }

  if (item.inputType === 'two_value') {
    return {
      prompt: item.prompt,
      answerType: 'two_value',
      fields: item.fields,
      tolerance: item.tolerance,
      hint: item.hints.nudge,
      workedFirstStep: item.hints.firstStep,
      explanation: item.workedRoute.join(' '),
    };
  }

  if (item.inputType === 'ordered_cards') {
    return {
      prompt: item.prompt,
      answerType: 'ordered_cards',
      orderedCards: item.cards,
      expectedOrder: item.expectedOrder,
      hint: item.hints.nudge,
      workedFirstStep: item.hints.firstStep,
      explanation: item.workedRoute.join(' '),
    };
  }

  return {
    prompt: item.prompt,
    answerType: item.inputType === 'checkbox' ? 'multi_choice' : 'choice',
    options: item.options,
    expectedChoices: item.expectedOptionIds,
    hint: item.hints.nudge,
    workedFirstStep: item.hints.firstStep,
    explanation: item.workedRoute.join(' '),
  };
}

export function getSkillCheckItemsForRegion(regionId: string | undefined): SkillCheckItem[] {
  return AUTHORED_SKILL_CHECK_ITEMS.filter((item) => item.regionId === regionId);
}

export function getSkillCheckItemsForFieldGuideTopic(topicId: string | undefined): SkillCheckItem[] {
  return AUTHORED_SKILL_CHECK_ITEMS.filter((item) => item.fieldGuideTopicId === topicId);
}

export function getSkillCheckItemsForCourseTopic(courseId: CourseId | undefined, topicId: string | undefined): SkillCheckItem[] {
  return AUTHORED_SKILL_CHECK_ITEMS.filter((item) => (
    item.courseId === courseId && item.fieldGuideTopicId === topicId
  ));
}

export function skillCheckAnswerSpecForItem(item: SkillCheckItem): SkillCheckAnswerSpec | undefined {
  if (item.checkable !== true || !item.answerType || !item.acceptedAnswers?.length) return undefined;
  return {
    answerType: item.answerType,
    acceptedAnswers: item.acceptedAnswers,
    tolerance: item.tolerance,
    orderMatters: item.answerType === 'multi-value' ? !(item.orderInsensitive ?? true) : undefined,
  };
}

export function skillCheckCheckabilityForItem(item: SkillCheckItem): SkillCheckCheckabilitySummary {
  if (item.checkable === true) {
    return {
      itemId: item.itemId,
      regionId: item.regionId,
      skillId: item.skillId,
      status: 'deterministically-checkable',
      answerType: item.answerType,
    };
  }

  const reason = item.unsupportedAnswerReason ?? 'Not yet migrated to Phase 3 machine-checkable answer fields.';
  return {
    itemId: item.itemId,
    regionId: item.regionId,
    skillId: item.skillId,
    status: item.unsupportedAnswerReason ? 'unsupported-answer-form' : 'not-yet-checkable',
    reason,
  };
}

export function skillCheckCheckabilityReport(items: SkillCheckItem[] = AUTHORED_SKILL_CHECK_ITEMS): SkillCheckCheckabilitySummary[] {
  return items.map(skillCheckCheckabilityForItem);
}

export function skillCheckTopicMigrationSummary(
  regionId: string,
  items: SkillCheckItem[] = AUTHORED_SKILL_CHECK_ITEMS,
): SkillCheckTopicMigrationSummary {
  const topicItems = items.filter((item) => item.regionId === regionId);
  const checkability = topicItems.map(skillCheckCheckabilityForItem);
  return {
    regionId,
    totalChecks: topicItems.length,
    checkableChecks: checkability.filter((item) => item.status === 'deterministically-checkable').length,
    uncheckableChecks: checkability.filter((item) => item.status !== 'deterministically-checkable').length,
    unsupportedAnswerReasons: Array.from(new Set(
      checkability
        .filter((item) => item.status === 'unsupported-answer-form')
        .map((item) => item.reason)
        .filter((reason): reason is string => Boolean(reason)),
    )),
    answerTypes: Array.from(new Set(
      checkability
        .map((item) => item.answerType)
        .filter((answerType): answerType is SkillCheckAnswerType => Boolean(answerType)),
    )).sort(),
  };
}

export function validateSkillCheckItemContract(item: SkillCheckItem): string[] {
  const errors: string[] = [];
  if (!item.itemId.trim()) errors.push('missing itemId');
  if (item.paperFamily !== 'p3') errors.push('paperFamily must be p3');
  if (!item.regionId.trim()) errors.push('missing regionId');
  if (!item.fieldGuideTopicId.trim()) errors.push('missing fieldGuideTopicId');
  if (!item.fieldGuideSubtopicId.trim()) errors.push('missing fieldGuideSubtopicId');
  if (!item.skillId.trim()) errors.push('missing skillId');
  if (!item.prompt.trim()) errors.push('missing prompt');
  if (item.validationMode === 'deterministic') {
    if (item.inputType === 'numeric' && !item.expectedAnswer) errors.push('numeric item missing expectedAnswer');
    if ((item.inputType === 'multiple_choice' || item.inputType === 'checkbox') && (!item.options?.length || !item.expectedOptionIds?.length)) {
      errors.push('choice item missing options or expectedOptionIds');
    }
    if (item.inputType === 'ordered_cards' && (!item.cards?.length || !item.expectedOrder?.length)) {
      errors.push('ordered item missing cards or expectedOrder');
    }
    if (item.inputType === 'two_value' && !item.fields?.every((field) => field.expectedAnswer)) {
      errors.push('two_value item missing field expectedAnswer');
    }
  }
  const hasMachineAnswerData = Boolean(item.answerType || item.acceptedAnswers?.length);
  if (item.checkable === true) {
    if (!item.answerType) errors.push('checkable item missing answerType');
    if (item.answerType && !SUPPORTED_SKILL_CHECK_ANSWER_TYPES.includes(item.answerType)) errors.push('checkable item has unsupported answerType');
    if (!item.acceptedAnswers?.length) errors.push('checkable item missing acceptedAnswers');
    if (item.answerType === 'multi-value' && typeof item.orderInsensitive !== 'boolean') {
      errors.push('multi-value checkable item missing orderInsensitive flag');
    }
    if (item.unsupportedAnswerReason) errors.push('checkable item must not set unsupportedAnswerReason');
  } else {
    if (hasMachineAnswerData) errors.push('machine-check answer fields require checkable=true');
    if (item.checkable === false && !item.unsupportedAnswerReason?.trim()) {
      errors.push('uncheckable item missing unsupportedAnswerReason');
    }
  }
  for (const tag of item.mistakeTags ?? []) {
    if (!isSkillCheckMistakeTag(tag)) errors.push(`unsupported mistake tag: ${tag}`);
  }
  if (!item.hints.nudge.trim()) errors.push('missing nudge');
  if (!item.workedRoute.length) errors.push('missing workedRoute');
  if (item.review.affectsProgression !== false) errors.push('affectsProgression must be false');
  if (item.sourceRefs.contentLabCandidateIds?.length) errors.push('contentLabCandidateIds are not allowed in this first slice');
  return errors;
}
