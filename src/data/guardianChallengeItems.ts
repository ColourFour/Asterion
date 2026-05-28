import type { QuickCheckContract, QuickCheckOption, QuickCheckTwoValueField } from '../types';
import type {
  SkillCheckComplexity,
  SkillCheckInputType,
  SkillCheckSourceRefs,
  SkillCheckSourceType,
  SkillCheckValidationMode,
} from './skillCheckItems';

export type GuardianChallengeInputType = Extract<SkillCheckInputType, 'numeric' | 'multiple_choice' | 'checkbox' | 'two_value'>;

export interface GuardianChallengeItem {
  itemId: string;
  paperFamily: 'p3';
  regionId: 'algebra-forge' | 'logarithm-grove';
  fieldGuideTopicId: string;
  fieldGuideSubtopicId: string;
  skillId: string;
  title: string;
  prompt: string;
  inputType: GuardianChallengeInputType;
  validationMode: Extract<SkillCheckValidationMode, 'deterministic'>;
  expectedAnswer?: string | string[];
  expectedOptionIds?: string[];
  options?: QuickCheckOption[];
  fields?: QuickCheckTwoValueField[];
  displayPrefix?: string;
  displaySuffix?: string;
  tolerance?: number;
  complexity: Extract<SkillCheckComplexity, 'core' | 'challenge'>;
  sourceTypes: SkillCheckSourceType[];
  sourceRefs: SkillCheckSourceRefs;
  explanation: string[];
  review: {
    status: 'teacher_reviewed';
    sourceSkillReviewed: true;
    runtimeSafe: true;
    affectsMastery: false;
  };
}

const SKILL_MAP_SOURCE = 'tools/content_lab/skill_maps/caie_9709_p3_skill_map.json' as const;

function sourceRefs(refs: Omit<SkillCheckSourceRefs, 'skillMapSource'>): SkillCheckSourceRefs {
  return {
    skillMapSource: SKILL_MAP_SOURCE,
    ...refs,
  };
}

function review(): GuardianChallengeItem['review'] {
  return {
    status: 'teacher_reviewed',
    sourceSkillReviewed: true,
    runtimeSafe: true,
    affectsMastery: false,
  };
}

export const AUTHORED_GUARDIAN_CHALLENGE_ITEMS: GuardianChallengeItem[] = [
  {
    itemId: 'guardian-alg-modulus-001',
    paperFamily: 'p3',
    regionId: 'algebra-forge',
    fieldGuideTopicId: 'algebra_modulus_graph_equations',
    fieldGuideSubtopicId: 'algebra_modulus_graph_equations',
    skillId: 'p3_alg_modulus_cases',
    title: 'Mirror Gate Intersections',
    prompt: 'The Algebra Vault mirror gate shows $y=|x+2|$ and $y=|3x|$. Select every $x$-coordinate where the two beams meet.',
    inputType: 'checkbox',
    validationMode: 'deterministic',
    expectedOptionIds: ['minus-half', 'one'],
    options: [
      { id: 'minus-half', label: '$x=-\\frac12$' },
      { id: 'one', label: '$x=1$' },
      { id: 'zero', label: '$x=0$' },
      { id: 'minus-one', label: '$x=-1$' },
    ],
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_modulus_equation_basic_0002'],
      teachingSnippetIds: ['p3-modulus-cases-001'],
    }),
    explanation: [
      'Use $x+2=3x$ or $x+2=-3x$ for equal moduli.',
      'The two cases give $x=1$ and $x=-\\frac12$.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-alg-polynomial-division-001',
    paperFamily: 'p3',
    regionId: 'algebra-forge',
    fieldGuideTopicId: 'algebra_polynomial_division',
    fieldGuideSubtopicId: 'algebra_polynomial_division',
    skillId: 'p3_alg_polynomial_remainder_factor',
    title: 'Engine Core Division',
    prompt: 'A Vault engine accepts the division of $2x^3-x^2+5x+7$ by $2x+1$. Give the quotient and the remainder.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    fields: [
      { id: 'quotient', label: 'quotient', expectedAnswer: ['x^2-x+3', 'x^2 - x + 3'], displayPrefix: 'quotient =' },
      { id: 'remainder', label: 'remainder', expectedAnswer: '4', displayPrefix: 'remainder =' },
    ],
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice'],
    sourceRefs: sourceRefs({ generatedPracticeIds: ['gen_polynomial_remainder_factor_basic_0001'] }),
    explanation: [
      'Long division gives quotient terms $x^2$, then $-x$, then $3$.',
      'The leftover constant is $4$, so the quotient is $x^2-x+3$ with remainder $4$.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-alg-remainder-factor-001',
    paperFamily: 'p3',
    regionId: 'algebra-forge',
    fieldGuideTopicId: 'algebra_remainder_factor_theorem',
    fieldGuideSubtopicId: 'algebra_remainder_factor_theorem',
    skillId: 'p3_alg_polynomial_remainder_factor',
    title: 'Factor Seal Calibration',
    prompt: 'The Vault seal $x+1$ is a factor of $f(x)=x^3+kx^2-x+5$. Find $k$.',
    inputType: 'numeric',
    validationMode: 'deterministic',
    expectedAnswer: '-5',
    displayPrefix: '$k=$',
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_polynomial_remainder_factor_basic_0004'],
      teachingSnippetIds: ['p3-polynomial-remainder-factor-001'],
    }),
    explanation: [
      '$x+1$ is a factor, so $f(-1)=0$.',
      '$-1+k+1+5=0$, so $k+5=0$ and $k=-5$.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-alg-partial-fractions-001',
    paperFamily: 'p3',
    regionId: 'algebra-forge',
    fieldGuideTopicId: 'algebra_partial_fractions',
    fieldGuideSubtopicId: 'algebra_partial_fractions',
    skillId: 'p3_alg_partial_fraction_form',
    title: 'Vault Gear Decomposition',
    prompt: 'Before the Guardian lets you solve, choose the correct partial-fraction form for $\\frac{3x^2+2}{x(x-1)^2}$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    expectedOptionIds: ['linear-repeated'],
    options: [
      { id: 'linear-repeated', label: '$\\frac{A}{x}+\\frac{B}{x-1}+\\frac{C}{(x-1)^2}$' },
      { id: 'missing-repeat', label: '$\\frac{A}{x}+\\frac{B}{(x-1)^2}$' },
      { id: 'quadratic-top', label: '$\\frac{A}{x}+\\frac{Bx+C}{(x-1)^2}$' },
      { id: 'single-denominator', label: '$\\frac{A}{x(x-1)}+\\frac{B}{(x-1)^2}$' },
    ],
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_partial_fractions_form_basic_0001'],
      teachingSnippetIds: ['p3-partial-fractions-form-001'],
    }),
    explanation: [
      'A repeated linear factor needs a term for each power up to that repeat.',
      'So $x$ gives $A/x$, while $(x-1)^2$ gives $B/(x-1)$ and $C/(x-1)^2$.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-alg-binomial-001',
    paperFamily: 'p3',
    regionId: 'algebra-forge',
    fieldGuideTopicId: 'algebra_binomial_expansion',
    fieldGuideSubtopicId: 'algebra_binomial_expansion',
    skillId: 'p3_alg_binomial_validity',
    title: 'Vault Series Range',
    prompt: 'The final Vault lock rewrites $\\sqrt{2-6x}$ as $\\sqrt2(1-3x)^{1/2}$ before expansion. Which validity range keeps the binomial series safe?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    expectedOptionIds: ['third-range'],
    options: [
      { id: 'third-range', label: '$|x|<\\frac13$' },
      { id: 'half-range', label: '$|x|<\\frac12$' },
      { id: 'one-range', label: '$|x|<1$' },
      { id: 'right-only', label: '$x>\\frac13$' },
    ],
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_binomial_expansion_basic_0002'],
      teachingSnippetIds: ['p3-binomial-validity-001'],
    }),
    explanation: [
      'For $(1+u)^n$, the P3 binomial expansion needs $|u|<1$.',
      'Here $u=-3x$, so $|-3x|<1$ gives $|x|<\\frac13$.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-log-graph-inverse-001',
    paperFamily: 'p3',
    regionId: 'logarithm-grove',
    fieldGuideTopicId: 'log_graph_inverse',
    fieldGuideSubtopicId: 'log_graph_inverse',
    skillId: 'p3_log_convert_forms',
    title: 'Observatory Mirror Star',
    prompt: 'A star at $(2,9)$ lies on $y=3^x$. The Logarithm Observatory reflects it onto $y=\\log_3 x$. Give the reflected point.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    fields: [
      { id: 'x', label: 'x-coordinate', expectedAnswer: '9', displayPrefix: '$x=$' },
      { id: 'y', label: 'y-coordinate', expectedAnswer: '2', displayPrefix: '$y=$' },
    ],
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_convert_forms_basic_0001'],
      teachingSnippetIds: ['p3-log-convert-forms-001'],
    }),
    explanation: [
      '$y=\\log_3x$ is the inverse of $y=3^x$.',
      'Inverse points swap coordinates, so $(2,9)$ becomes $(9,2)$.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-log-laws-001',
    paperFamily: 'p3',
    regionId: 'logarithm-grove',
    fieldGuideTopicId: 'log_laws',
    fieldGuideSubtopicId: 'log_laws',
    skillId: 'p3_log_laws_equations',
    title: 'Telescope Lens Compression',
    prompt: 'Compress the Observatory lens expression $2\\ln x+\\ln5-\\ln(x-1)$ into one logarithm, with the original domain.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    expectedOptionIds: ['correct-domain'],
    options: [
      { id: 'correct-domain', label: '$\\ln\\left(\\frac{5x^2}{x-1}\\right),\\ x>1$' },
      { id: 'wrong-domain', label: '$\\ln\\left(\\frac{5x^2}{x-1}\\right),\\ x>0$' },
      { id: 'coefficient-left', label: '$\\ln\\left(\\frac{10x}{x-1}\\right),\\ x>1$' },
      { id: 'false-split', label: '$\\ln\\left(\\frac{5(2x)}{x-1}\\right),\\ x>1$' },
    ],
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_laws_basic_0002'],
      teachingSnippetIds: ['p3-log-laws-001'],
    }),
    explanation: [
      'Use $2\\ln x=\\ln(x^2)$, then product and quotient laws.',
      'The original logs require $x>0$ and $x-1>0$, so $x>1$.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-log-natural-001',
    paperFamily: 'p3',
    regionId: 'logarithm-grove',
    fieldGuideTopicId: 'log_e_natural_logs',
    fieldGuideSubtopicId: 'log_e_natural_logs',
    skillId: 'p3_log_exponential_equations',
    title: 'Natural Log Focus Ring',
    prompt: 'The focus ring glows when $5e^{3x}=20$. Choose the exact value of $x$.',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    expectedOptionIds: ['one-third-ln-four'],
    options: [
      { id: 'one-third-ln-four', label: '$x=\\frac13\\ln4$' },
      { id: 'ln-four-minus-three', label: '$x=\\ln4-3$' },
      { id: 'three-ln-four', label: '$x=3\\ln4$' },
      { id: 'ln-twenty-over-three', label: '$x=\\frac13\\ln20$' },
    ],
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_exponential_basic_0001'],
      teachingSnippetIds: ['p3-log-exponential-001'],
    }),
    explanation: [
      'Divide by $5$ first: $e^{3x}=4$.',
      'Take natural logs: $3x=\\ln4$, so $x=\\frac13\\ln4$.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-log-equations-001',
    paperFamily: 'p3',
    regionId: 'logarithm-grove',
    fieldGuideTopicId: 'log_equations_inequalities',
    fieldGuideSubtopicId: 'log_equations_inequalities',
    skillId: 'p3_log_domain_validation',
    title: 'Domain Gate Root',
    prompt: 'Solve the Observatory gate equation $\\ln(x-2)+\\ln(x+1)=\\ln10$. Enter the accepted root after checking the original domain.',
    inputType: 'numeric',
    validationMode: 'deterministic',
    expectedAnswer: '4',
    displayPrefix: '$x=$',
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_domain_basic_0001'],
      teachingSnippetIds: ['p3-log-domain-001'],
    }),
    explanation: [
      'The original domain is $x>2$.',
      'Combining logs gives $(x-2)(x+1)=10$, so $x=4$ or $x=-3$.',
      'Only $x=4$ satisfies the original domain.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-log-exponential-001',
    paperFamily: 'p3',
    regionId: 'logarithm-grove',
    fieldGuideTopicId: 'exponential_equations_inequalities',
    fieldGuideSubtopicId: 'exponential_equations_inequalities',
    skillId: 'p3_log_exponential_equations',
    title: 'Descending Orbit Inequality',
    prompt: 'The Observatory orbit obeys $\\left(\\frac12\\right)^x\\le\\frac18$. Which final inequality opens the gate?',
    inputType: 'multiple_choice',
    validationMode: 'deterministic',
    expectedOptionIds: ['x-ge-3'],
    options: [
      { id: 'x-ge-3', label: '$x\\ge3$' },
      { id: 'x-le-3', label: '$x\\le3$' },
      { id: 'x-gt-3', label: '$x>3$' },
      { id: 'x-lt-3', label: '$x<3$' },
    ],
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_exponential_basic_0004'],
      teachingSnippetIds: ['p3-log-exponential-inequalities-001'],
    }),
    explanation: [
      '$\\frac18=(\\frac12)^3$.',
      'Since $0<\\frac12<1$, the function is decreasing, so the comparison gives $x\\ge3$.',
    ],
    review: review(),
  },
  {
    itemId: 'guardian-log-linearisation-001',
    paperFamily: 'p3',
    regionId: 'logarithm-grove',
    fieldGuideTopicId: 'log_linearisation',
    fieldGuideSubtopicId: 'log_linearisation',
    skillId: 'p3_log_linearisation',
    title: 'Signal Line Calibration',
    prompt: 'An Observatory signal gives the straight line $\\ln y=0.7x+1.2$ on a graph of $\\ln y$ against $x$. Enter the gradient and intercept of this line.',
    inputType: 'two_value',
    validationMode: 'deterministic',
    fields: [
      { id: 'gradient', label: 'gradient', expectedAnswer: '0.7', displayPrefix: 'gradient =' },
      { id: 'intercept', label: 'intercept', expectedAnswer: '1.2', displayPrefix: 'intercept =' },
    ],
    tolerance: 1e-10,
    complexity: 'core',
    sourceTypes: ['authored', 'generated practice', 'teaching snippet'],
    sourceRefs: sourceRefs({
      generatedPracticeIds: ['gen_log_linearisation_basic_0002'],
      teachingSnippetIds: ['p3-log-linearisation-001'],
    }),
    explanation: [
      'The straight-line form is $Y=mX+c$.',
      'Here $Y=\\ln y$ and $X=x$, so the gradient is $0.7$ and the intercept is $1.2$.',
    ],
    review: review(),
  },
];

export function guardianChallengeContractForItem(item: GuardianChallengeItem): QuickCheckContract {
  if (item.inputType === 'numeric') {
    return {
      prompt: item.prompt,
      answerType: 'single_value',
      expectedAnswer: item.expectedAnswer,
      displayPrefix: item.displayPrefix,
      displaySuffix: item.displaySuffix,
      tolerance: item.tolerance,
      hint: item.explanation[0],
      workedFirstStep: item.explanation[0],
      explanation: item.explanation.join(' '),
    };
  }

  if (item.inputType === 'two_value') {
    return {
      prompt: item.prompt,
      answerType: 'two_value',
      fields: item.fields,
      tolerance: item.tolerance,
      hint: item.explanation[0],
      workedFirstStep: item.explanation[0],
      explanation: item.explanation.join(' '),
    };
  }

  return {
    prompt: item.prompt,
    answerType: item.inputType === 'checkbox' ? 'multi_choice' : 'choice',
    options: item.options,
    expectedChoices: item.expectedOptionIds,
    hint: item.explanation[0],
    workedFirstStep: item.explanation[0],
    explanation: item.explanation.join(' '),
  };
}

export function getGuardianChallengeItemsForRegion(regionId: string | undefined): GuardianChallengeItem[] {
  return AUTHORED_GUARDIAN_CHALLENGE_ITEMS.filter((item) => item.regionId === regionId);
}

export function validateGuardianChallengeItemContract(item: GuardianChallengeItem): string[] {
  const errors: string[] = [];
  if (!item.itemId.trim()) errors.push('missing itemId');
  if (item.paperFamily !== 'p3') errors.push('paperFamily must be p3');
  if (!item.regionId.trim()) errors.push('missing regionId');
  if (!item.fieldGuideTopicId.trim()) errors.push('missing fieldGuideTopicId');
  if (!item.fieldGuideSubtopicId.trim()) errors.push('missing fieldGuideSubtopicId');
  if (!item.skillId.trim()) errors.push('missing skillId');
  if (!item.title.trim()) errors.push('missing title');
  if (!item.prompt.trim()) errors.push('missing prompt');
  if (item.validationMode !== 'deterministic') errors.push('Guardian items must use deterministic validation');
  if (item.inputType === 'numeric' && !item.expectedAnswer) errors.push('numeric item missing expectedAnswer');
  if ((item.inputType === 'multiple_choice' || item.inputType === 'checkbox') && (!item.options?.length || !item.expectedOptionIds?.length)) {
    errors.push('choice item missing options or expectedOptionIds');
  }
  if (item.inputType === 'two_value' && !item.fields?.every((field) => field.expectedAnswer)) {
    errors.push('two_value item missing field expectedAnswer');
  }
  if (!item.explanation.length) errors.push('missing explanation');
  if (item.review.affectsMastery !== false) errors.push('affectsMastery must be false');
  if (item.sourceRefs.contentLabCandidateIds?.length) errors.push('contentLabCandidateIds are not allowed for Guardian runtime items');
  return errors;
}
