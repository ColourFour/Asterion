import type { SkillCheckAnswerType } from '../skill-checks/answerChecker';
import type { P1RepairSkillTag } from './p1RepairLane';

export const P3_DIAGNOSTIC_DURATION_TARGET_MINUTES = '45-60' as const;

export const P3_DIAGNOSTIC_RISK_FLAGS = [
  'ALGEBRA_WEAK',
  'TRIG_WEAK',
  'LOGS_WEAK',
  'DIFF_WEAK',
  'INTEGRATION_WEAK',
  'VECTOR_WEAK',
  'COMPLEX_WEAK',
] as const;

export type P3DiagnosticRiskFlag = typeof P3_DIAGNOSTIC_RISK_FLAGS[number];

export type P3DiagnosticSectionId =
  | 'algebra_foundation'
  | 'p3_transition'
  | 'problem_solving';

export type P3DiagnosticReadinessLevel =
  | 'FOUNDATION_RISK'
  | 'STANDARD_ENTRY'
  | 'HIGH_FLUENCY';

export type P3DiagnosticRecommendedPath =
  | 'P1_REPAIR_REQUIRED'
  | 'FULL_P3_PATH'
  | 'ACCELERATED_P3_PATH';

export interface P3DiagnosticUnlockPermissions {
  field_guide: boolean;
  skill_checks: boolean;
  exam_training: boolean;
  topic_exam_strips: boolean;
  mocks: boolean;
}

export interface P3DiagnosticReport {
  total_score: number;
  section_scores: Record<P3DiagnosticSectionId, number>;
  risk_flags: P3DiagnosticRiskFlag[];
  readiness_level: P3DiagnosticReadinessLevel;
  recommended_path: P3DiagnosticRecommendedPath;
  unlock_permissions: P3DiagnosticUnlockPermissions;
  priority_repair_modules: string[];
  foundation_repair_skill_tags: P1RepairSkillTag[];
  lock_message?: string;
}

export interface P3DiagnosticMarkPoint {
  id: string;
  label: string;
  answerType: SkillCheckAnswerType;
  acceptedAnswers: string[];
  tolerance?: number;
  orderMatters?: boolean;
  answerFormatHint?: string;
  answerPlaceholder?: string;
  riskFlags: P3DiagnosticRiskFlag[];
  criticalFoundationSkill?: 'manipulation' | 'equation';
}

export interface P3DiagnosticQuestion {
  id: string;
  sectionId: P3DiagnosticSectionId;
  sectionLabel: string;
  title: string;
  prompt: string;
  answerFormat: 'numeric' | 'exact expression' | 'multi-step structured input' | 'short algebraic form';
  markPoints: P3DiagnosticMarkPoint[];
}

export const P3_DIAGNOSTIC_SECTIONS: Array<{
  id: P3DiagnosticSectionId;
  label: string;
  purpose: string;
}> = [
  {
    id: 'algebra_foundation',
    label: 'Section A - Core Algebra Fluency',
    purpose: 'P1 dependency check',
  },
  {
    id: 'p3_transition',
    label: 'Section B - Early P3 Transition Skills',
    purpose: 'P3 method readiness check',
  },
  {
    id: 'problem_solving',
    label: 'Section C - Mixed Problem Solving',
    purpose: 'Light AO2 combination check',
  },
];

const algebra = ['ALGEBRA_WEAK'] as const;
const logs = ['LOGS_WEAK'] as const;
const trig = ['TRIG_WEAK'] as const;
const diff = ['DIFF_WEAK'] as const;
const integration = ['INTEGRATION_WEAK'] as const;
const vectors = ['VECTOR_WEAK'] as const;

export const P3_DIAGNOSTIC_QUESTIONS: P3DiagnosticQuestion[] = [
  {
    id: 'p3diag-a01',
    sectionId: 'algebra_foundation',
    sectionLabel: 'A',
    title: 'Expansion and simplification',
    prompt: 'Simplify $3(2x-5)-2(x+4)$.',
    answerFormat: 'short algebraic form',
    markPoints: [
      {
        id: 'a01-final',
        label: 'Simplified expression',
        answerType: 'expression-text',
        acceptedAnswers: ['4x-23'],
        riskFlags: [...algebra],
        criticalFoundationSkill: 'manipulation',
      },
    ],
  },
  {
    id: 'p3diag-a02',
    sectionId: 'algebra_foundation',
    sectionLabel: 'A',
    title: 'Quadratic factorisation',
    prompt: 'Factorise $x^2-5x+6$.',
    answerFormat: 'short algebraic form',
    markPoints: [
      {
        id: 'a02-final',
        label: 'Factorised form',
        answerType: 'expression-text',
        acceptedAnswers: ['(x-2)(x-3)', '(x-3)(x-2)'],
        riskFlags: [...algebra],
        criticalFoundationSkill: 'manipulation',
      },
    ],
  },
  {
    id: 'p3diag-a03',
    sectionId: 'algebra_foundation',
    sectionLabel: 'A',
    title: 'Algebraic fraction simplification',
    prompt: 'Simplify $\\frac{6x^2y}{3xy^2}$.',
    answerFormat: 'short algebraic form',
    markPoints: [
      {
        id: 'a03-final',
        label: 'Simplified expression',
        answerType: 'expression-text',
        acceptedAnswers: ['2x/y', '2*x/y', '2x y^-1'],
        riskFlags: [...algebra],
        criticalFoundationSkill: 'manipulation',
      },
    ],
  },
  {
    id: 'p3diag-a04',
    sectionId: 'algebra_foundation',
    sectionLabel: 'A',
    title: 'Linear equation solving',
    prompt: 'Solve $2x-7=11$.',
    answerFormat: 'numeric',
    markPoints: [
      {
        id: 'a04-final',
        label: 'Value of $x$',
        answerType: 'numeric',
        acceptedAnswers: ['9'],
        riskFlags: [...algebra],
        criticalFoundationSkill: 'equation',
      },
    ],
  },
  {
    id: 'p3diag-a05',
    sectionId: 'algebra_foundation',
    sectionLabel: 'A',
    title: 'Quadratic equation solving',
    prompt: 'Solve $x^2-5x+6=0$.',
    answerFormat: 'exact expression',
    markPoints: [
      {
        id: 'a05-final',
        label: 'Values of $x$',
        answerType: 'multi-value',
        acceptedAnswers: ['2, 3'],
        orderMatters: false,
        riskFlags: [...algebra],
        criticalFoundationSkill: 'equation',
      },
    ],
  },
  {
    id: 'p3diag-a06',
    sectionId: 'algebra_foundation',
    sectionLabel: 'A',
    title: 'Function substitution',
    prompt: 'For $f(x)=2x^2-3$, find $f(-2)$.',
    answerFormat: 'numeric',
    markPoints: [
      {
        id: 'a06-final',
        label: 'Value of $f(-2)$',
        answerType: 'numeric',
        acceptedAnswers: ['5'],
        riskFlags: [...algebra],
      },
    ],
  },
  {
    id: 'p3diag-a07',
    sectionId: 'algebra_foundation',
    sectionLabel: 'A',
    title: 'Rearranging formulae',
    prompt: 'Rearrange $y=3x+2$ to make $x$ the subject.',
    answerFormat: 'short algebraic form',
    markPoints: [
      {
        id: 'a07-final',
        label: 'Expression for $x$',
        answerType: 'expression-text',
        acceptedAnswers: ['(y-2)/3', 'x=(y-2)/3', 'y/3-2/3', 'x=y/3-2/3'],
        riskFlags: [...algebra],
        criticalFoundationSkill: 'manipulation',
      },
    ],
  },
  {
    id: 'p3diag-a08',
    sectionId: 'algebra_foundation',
    sectionLabel: 'A',
    title: 'Cancelling after factorising',
    prompt: 'Simplify $\\frac{x^2-9}{x-3}$.',
    answerFormat: 'multi-step structured input',
    markPoints: [
      {
        id: 'a08-factor',
        label: 'Factorised numerator',
        answerType: 'expression-text',
        acceptedAnswers: ['(x-3)(x+3)', '(x+3)(x-3)'],
        riskFlags: [...algebra],
        criticalFoundationSkill: 'manipulation',
      },
      {
        id: 'a08-final',
        label: 'Simplified expression',
        answerType: 'expression-text',
        acceptedAnswers: ['x+3'],
        riskFlags: [...algebra],
        criticalFoundationSkill: 'manipulation',
      },
    ],
  },
  {
    id: 'p3diag-b01',
    sectionId: 'p3_transition',
    sectionLabel: 'B',
    title: 'Remainder theorem',
    prompt: 'For $P(x)=x^3-4x+1$, find the remainder when $P(x)$ is divided by $x-2$.',
    answerFormat: 'multi-step structured input',
    markPoints: [
      {
        id: 'b01-substitution',
        label: 'Substitution used',
        answerType: 'exact-text',
        acceptedAnswers: ['P(2)', 'x=2', '2', 'substitute 2', 'use x=2', 'P(2)=1'],
        riskFlags: [...algebra],
      },
      {
        id: 'b01-final',
        label: 'Remainder',
        answerType: 'numeric',
        acceptedAnswers: ['1'],
        riskFlags: [...algebra],
      },
    ],
  },
  {
    id: 'p3diag-b02',
    sectionId: 'p3_transition',
    sectionLabel: 'B',
    title: 'Factor theorem',
    prompt: 'For $P(x)=x^3-3x^2+4$, decide whether $x-2$ is a factor.',
    answerFormat: 'multi-step structured input',
    markPoints: [
      {
        id: 'b02-value',
        label: 'Value of $P(2)$',
        answerType: 'numeric',
        acceptedAnswers: ['0'],
        riskFlags: [...algebra],
      },
      {
        id: 'b02-conclusion',
        label: 'Conclusion',
        answerType: 'exact-text',
        acceptedAnswers: [
          'yes',
          'x-2 is a factor',
          'yes, x-2 is a factor',
          'yes because P(2)=0',
          'yes, because P(2)=0',
          'it is a factor',
          'therefore x=2 is a root, so x-2 is a factor',
        ],
        riskFlags: [...algebra],
      },
    ],
  },
  {
    id: 'p3diag-b03',
    sectionId: 'p3_transition',
    sectionLabel: 'B',
    title: 'Log law manipulation',
    prompt: 'Simplify $\\log_a 8+\\log_a 2$.',
    answerFormat: 'exact expression',
    markPoints: [
      {
        id: 'b03-final',
        label: 'Single logarithm',
        answerType: 'exact-text',
        acceptedAnswers: [
          'log_a 16',
          'log_a(16)',
          '\\log_a 16',
          '\\log_a(16)',
          'log_a(8*2)',
          'log_a(2*8)',
          '\\log_a(8*2)',
          '\\log_a(2*8)',
        ],
        riskFlags: [...logs],
      },
    ],
  },
  {
    id: 'p3diag-b04',
    sectionId: 'p3_transition',
    sectionLabel: 'B',
    title: 'Exponential equation',
    prompt: 'Solve $e^{2x}=5$ exactly.',
    answerFormat: 'exact expression',
    markPoints: [
      {
        id: 'b04-final',
        label: 'Value of $x$',
        answerType: 'expression-text',
        acceptedAnswers: [
          '1/2ln5',
          '(1/2)ln5',
          '0.5ln5',
          '(ln5)/2',
          'ln(5)/2',
          'ln5/2',
          'x=ln5/2',
          'x=(ln5)/2',
          'x=(1/2)ln5',
        ],
        riskFlags: [...logs],
      },
    ],
  },
  {
    id: 'p3diag-b05',
    sectionId: 'p3_transition',
    sectionLabel: 'B',
    title: 'Basic trig identity use',
    prompt: 'Simplify $\\sin^2x+\\cos^2x+\\tan x\\cos x$.',
    answerFormat: 'short algebraic form',
    markPoints: [
      {
        id: 'b05-final',
        label: 'Simplified expression',
        answerType: 'expression-text',
        acceptedAnswers: ['1+sinx', 'sinx+1', '1+\\sinx', '\\sinx+1'],
        riskFlags: [...trig],
      },
    ],
  },
  {
    id: 'p3diag-b06',
    sectionId: 'p3_transition',
    sectionLabel: 'B',
    title: 'Simple trig equation',
    prompt: 'Solve $\\sin x=\\frac12$ for $0\\leq x\\leq 2\\pi$.',
    answerFormat: 'exact expression',
    markPoints: [
      {
        id: 'b06-final',
        label: 'Values of $x$',
        answerType: 'multi-value',
        acceptedAnswers: ['pi/6, 5pi/6'],
        orderMatters: false,
        riskFlags: [...trig],
      },
    ],
  },
  {
    id: 'p3diag-b07',
    sectionId: 'p3_transition',
    sectionLabel: 'B',
    title: 'Power-rule differentiation',
    prompt: 'Differentiate $y=3x^4-2x+5$.',
    answerFormat: 'short algebraic form',
    markPoints: [
      {
        id: 'b07-final',
        label: '$\\frac{dy}{dx}$',
        answerType: 'expression-text',
        acceptedAnswers: ['12x^3-2', 'dy/dx=12x^3-2', "y'=12x^3-2"],
        riskFlags: [...diff],
      },
    ],
  },
  {
    id: 'p3diag-b08',
    sectionId: 'p3_transition',
    sectionLabel: 'B',
    title: 'Chain-rule awareness',
    prompt: 'Differentiate $y=(2x+1)^5$.',
    answerFormat: 'short algebraic form',
    markPoints: [
      {
        id: 'b08-final',
        label: '$\\frac{dy}{dx}$',
        answerType: 'expression-text',
        acceptedAnswers: ['10(2x+1)^4', 'dy/dx=10(2x+1)^4', "y'=10(2x+1)^4"],
        riskFlags: [...diff],
      },
    ],
  },
  {
    id: 'p3diag-c01',
    sectionId: 'problem_solving',
    sectionLabel: 'C',
    title: 'Mixed algebra and trigonometry',
    prompt: 'Solve $2\\sin^2x-\\sin x=0$ for $0\\leq x<2\\pi$.',
    answerFormat: 'multi-step structured input',
    markPoints: [
      {
        id: 'c01-factor',
        label: 'Factorised form',
        answerType: 'expression-text',
        acceptedAnswers: ['sinx(2sinx-1)', '\\sinx(2\\sinx-1)'],
        riskFlags: [...trig, ...algebra],
      },
      {
        id: 'c01-equations',
        label: 'Equations after factorising',
        answerType: 'multi-value',
        acceptedAnswers: ['sinx=0, sinx=1/2'],
        orderMatters: false,
        riskFlags: [...trig],
      },
      {
        id: 'c01-final',
        label: 'Values of $x$',
        answerType: 'multi-value',
        acceptedAnswers: ['0, pi/6, 5pi/6, pi'],
        orderMatters: false,
        riskFlags: [...trig],
      },
    ],
  },
  {
    id: 'p3diag-c02',
    sectionId: 'problem_solving',
    sectionLabel: 'C',
    title: 'Differentiation application',
    prompt: 'For $y=x^3-3x$, find the stationary points.',
    answerFormat: 'multi-step structured input',
    markPoints: [
      {
        id: 'c02-derivative',
        label: 'Derivative',
        answerType: 'expression-text',
        acceptedAnswers: ['3x^2-3', 'dy/dx=3x^2-3', "y'=3x^2-3"],
        riskFlags: [...diff],
      },
      {
        id: 'c02-x-values',
        label: 'Stationary $x$-values',
        answerType: 'multi-value',
        acceptedAnswers: ['-1, 1'],
        orderMatters: false,
        riskFlags: [...diff, ...algebra],
      },
      {
        id: 'c02-points',
        label: 'Stationary points',
        answerType: 'exact-text',
        acceptedAnswers: [
          '(-1,2), (1,-2)',
          '(-1, 2), (1, -2)',
          '(1,-2), (-1,2)',
          '(1, -2), (-1, 2)',
          '(-1,2) and (1,-2)',
          '(-1, 2) and (1, -2)',
          '(1,-2) and (-1,2)',
          '(1, -2) and (-1, 2)',
        ],
        riskFlags: [...diff],
      },
    ],
  },
  {
    id: 'p3diag-c03',
    sectionId: 'problem_solving',
    sectionLabel: 'C',
    title: 'Reverse-chain integration',
    prompt: 'Integrate $6x(3x^2+1)^4$ with respect to $x$.',
    answerFormat: 'multi-step structured input',
    markPoints: [
      {
        id: 'c03-inside',
        label: 'Inside function recognised',
        answerType: 'expression-text',
        acceptedAnswers: ['3x^2+1'],
        riskFlags: [...integration],
      },
      {
        id: 'c03-final',
        label: 'Integral',
        answerType: 'expression-text',
        acceptedAnswers: [
          '(3x^2+1)^5/5+C',
          '((3x^2+1)^5)/5+C',
          '1/5(3x^2+1)^5+C',
          '(1/5)(3x^2+1)^5+C',
        ],
        riskFlags: [...integration],
      },
    ],
  },
  {
    id: 'p3diag-c04',
    sectionId: 'problem_solving',
    sectionLabel: 'C',
    title: 'Vector interpretation',
    prompt: 'Given $A(1,2,3)$ and $B(4,0,5)$, find $\\overrightarrow{AB}$ and its magnitude.',
    answerFormat: 'multi-step structured input',
    markPoints: [
      {
        id: 'c04-vector',
        label: '$\\overrightarrow{AB}$',
        answerType: 'coordinate',
        acceptedAnswers: ['(3,-2,2)'],
        riskFlags: [...vectors],
      },
      {
        id: 'c04-magnitude',
        label: 'Magnitude',
        answerType: 'numeric',
        acceptedAnswers: ['sqrt17'],
        tolerance: 0.01,
        riskFlags: [...vectors],
      },
    ],
  },
];
