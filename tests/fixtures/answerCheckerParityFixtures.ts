import type { SkillCheckAnswerCheckResult, SkillCheckAnswerSpec } from '../../src/skill-checks/answerChecker';

export interface AnswerCheckerParityCase {
  name: string;
  spec: SkillCheckAnswerSpec;
  submittedAnswer: string;
  expected: SkillCheckAnswerCheckResult;
}

// Any future answer type must be added to the TypeScript checker, the static runtime checker,
// and this shared fixture list so parity cannot drift silently.
export const ANSWER_CHECKER_PARITY_CASES: AnswerCheckerParityCase[] = [
  {
    name: 'numeric tolerance',
    spec: { answerType: 'numeric', acceptedAnswers: ['2.5'], tolerance: 0.01 },
    submittedAnswer: '2.504',
    expected: {
      isCorrect: true,
      normalizedSubmittedAnswer: '2.504',
      matchedAcceptedAnswer: '2.5',
      reason: 'Matched numeric answer within tolerance.',
      answerType: 'numeric',
      unsupported: false,
    },
  },
  {
    name: 'decimal/fraction equivalence',
    spec: { answerType: 'numeric', acceptedAnswers: ['5/2'] },
    submittedAnswer: '\\frac{5}{2}',
    expected: {
      isCorrect: true,
      normalizedSubmittedAnswer: '2.5',
      matchedAcceptedAnswer: '5/2',
      reason: 'Matched numeric answer within tolerance.',
      answerType: 'numeric',
      unsupported: false,
    },
  },
  {
    name: 'exact-text normalization',
    spec: { answerType: 'exact-text', acceptedAnswers: ['one repeated real root'] },
    submittedAnswer: '  One   repeated real root. ',
    expected: {
      isCorrect: true,
      normalizedSubmittedAnswer: 'one repeated real root',
      matchedAcceptedAnswer: 'one repeated real root',
      reason: 'Matched normalized exact text.',
      answerType: 'exact-text',
      unsupported: false,
    },
  },
  {
    name: 'expression-text accepted forms',
    spec: { answerType: 'expression-text', acceptedAnswers: ['2^5=32', '32=2^5'] },
    submittedAnswer: ' 2 ^ 5 = 32 ',
    expected: {
      isCorrect: true,
      normalizedSubmittedAnswer: '2^5=32',
      matchedAcceptedAnswer: '2^5=32',
      reason: 'Matched normalized expression text.',
      answerType: 'expression-text',
      unsupported: false,
    },
  },
  {
    name: 'multi-value order-insensitive answers',
    spec: { answerType: 'multi-value', acceptedAnswers: ['-1/2, 1'] },
    submittedAnswer: '1, -0.5',
    expected: {
      isCorrect: true,
      normalizedSubmittedAnswer: '#1, #-0.5',
      matchedAcceptedAnswer: '-1/2, 1',
      reason: 'Matched multi-value answer.',
      answerType: 'multi-value',
      unsupported: false,
    },
  },
  {
    name: 'coordinate answers',
    spec: { answerType: 'coordinate', acceptedAnswers: ['(8,3)'] },
    submittedAnswer: ' ( 8.0 , 3 ) ',
    expected: {
      isCorrect: true,
      normalizedSubmittedAnswer: '(8, 3)',
      matchedAcceptedAnswer: '(8,3)',
      reason: 'Matched coordinate values within tolerance.',
      answerType: 'coordinate',
      unsupported: false,
    },
  },
  {
    name: 'interval answers',
    spec: { answerType: 'interval', acceptedAnswers: ['[1, 4)'] },
    submittedAnswer: 'x >= 1 and x < 4',
    expected: {
      isCorrect: true,
      normalizedSubmittedAnswer: '[1, 4)',
      matchedAcceptedAnswer: '[1, 4)',
      reason: 'Matched interval bounds and endpoint inclusivity.',
      answerType: 'interval',
      unsupported: false,
    },
  },
  {
    name: 'complex-number answers',
    spec: { answerType: 'complex-number', acceptedAnswers: ['2 + 3i'] },
    submittedAnswer: 'z = 2+3i',
    expected: {
      isCorrect: true,
      normalizedSubmittedAnswer: '2 + 3i',
      matchedAcceptedAnswer: '2 + 3i',
      reason: 'Matched complex number components within tolerance.',
      answerType: 'complex-number',
      unsupported: false,
    },
  },
  {
    name: 'complex-number j notation',
    spec: { answerType: 'complex-number', acceptedAnswers: ['2 + 3i'] },
    submittedAnswer: 'z = 2+3j',
    expected: {
      isCorrect: true,
      normalizedSubmittedAnswer: '2 + 3i',
      matchedAcceptedAnswer: '2 + 3i',
      reason: 'Matched complex number components within tolerance.',
      answerType: 'complex-number',
      unsupported: false,
    },
  },
  {
    name: 'empty input rejection',
    spec: { answerType: 'numeric', acceptedAnswers: ['4'] },
    submittedAnswer: '   ',
    expected: {
      isCorrect: false,
      normalizedSubmittedAnswer: '',
      reason: 'Submitted answer is empty.',
      answerType: 'numeric',
      unsupported: false,
    },
  },
  {
    name: 'invalid input rejection',
    spec: { answerType: 'numeric', acceptedAnswers: ['4'] },
    submittedAnswer: 'four',
    expected: {
      isCorrect: false,
      normalizedSubmittedAnswer: 'four',
      reason: 'Submitted answer is not a supported integer, decimal, or simple fraction.',
      answerType: 'numeric',
      unsupported: false,
    },
  },
  {
    name: 'unsupported answer type',
    spec: { answerType: 'symbolic-proof', acceptedAnswers: ['valid proof'] },
    submittedAnswer: 'valid proof',
    expected: {
      isCorrect: false,
      normalizedSubmittedAnswer: 'valid proof',
      reason: 'Unsupported answer type: symbolic-proof.',
      answerType: 'symbolic-proof',
      unsupported: true,
    },
  },
];
