import type { QuickCheckContract } from '../types';

export const quickCheckContractSeeds: Record<string, QuickCheckContract> = {
  'p3-exp-equations-001-qc': {
    prompt: 'Solve $2^{x-1}=8$.',
    answerType: 'single_value',
    expectedAnswer: '4',
    displayPrefix: '$x=$',
    hint: 'Rewrite $8$ as a power of $2$ before matching exponents.',
    workedFirstStep: '$8=2^3$, so $2^{x-1}=2^3$.',
    explanation: 'Match exponents: $x-1=3$, so $x=4$.',
  },
  'p3-algebra-rearrangement-001-qc': {
    prompt: 'Order the first moves for simplifying $(x+1)^2-(x+1)(x-2)$.',
    answerType: 'ordered_cards',
    orderedCards: [
      { id: 'factor-out', label: 'Factor out $(x+1)$.' },
      { id: 'simplify-bracket', label: 'Simplify the remaining bracket.' },
      { id: 'spot-shared-factor', label: 'Spot the shared factor $(x+1)$.' },
    ],
    expectedOrder: ['spot-shared-factor', 'factor-out', 'simplify-bracket'],
    hint: 'Look for the common bracket before expanding.',
    workedFirstStep: 'Both terms contain $(x+1)$.',
    explanation: 'Factoring first gives $(x+1)((x+1)-(x-2))$, which then simplifies cleanly.',
  },
  'p3-log-invalid-operations-001-qc': {
    prompt: 'Is $\\ln(x+3)=\\ln x+\\ln3$ a valid log law?',
    answerType: 'choice',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
    ],
    expectedChoices: ['no'],
    hint: 'The product law works for multiplication inside the logarithm, not addition.',
    workedFirstStep: '$\\ln x+\\ln3=\\ln(3x)$, not $\\ln(x+3)$.',
    explanation: 'There is no log law that splits a sum inside one logarithm.',
  },
  'p3-log-laws-001-qc': {
    prompt: 'Which expressions are equivalent to $\\ln x+\\ln5$?',
    answerType: 'multi_choice',
    options: [
      { id: 'ln-5x', label: '$\\ln(5x)$' },
      { id: 'ln-x-plus-5', label: '$\\ln(x+5)$' },
      { id: 'ln-x5', label: '$\\ln(x\\cdot5)$' },
      { id: 'five-ln-x', label: '$5\\ln x$' },
    ],
    expectedChoices: ['ln-5x', 'ln-x5'],
    hint: 'Use the product law: a sum of logs becomes one log of a product.',
    workedFirstStep: '$\\ln a+\\ln b=\\ln(ab)$.',
    explanation: '$\\ln x+\\ln5=\\ln(5x)$, which is the same as $\\ln(x\\cdot5)$.',
  },
};
