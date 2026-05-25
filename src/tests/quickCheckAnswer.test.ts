import { describe, expect, it } from 'vitest';
import { checkQuickCheckAnswer, quickCheckContractFor } from '../lib/quickCheckAnswer';
import type { QuickCheckContract, QuickCheckResponse } from '../types';

describe('checkQuickCheckAnswer', () => {
  it('checks single values with safe numeric normalization', () => {
    const contract = quickCheckContractFor({
      id: 'p3-exp-equations-001-qc',
      prompt: 'Solve $2^{x-1}=8$.',
      answer: '$x=4$',
      explanation: '$8=2^3$.',
    });

    expect(checkQuickCheckAnswer(contract, { value: '' }).status).toBe('empty');
    expect(checkQuickCheckAnswer(contract, { value: '4' }).status).toBe('correct');
    expect(checkQuickCheckAnswer(contract, { value: '4.0' }).status).toBe('correct');
    expect(checkQuickCheckAnswer(contract, { value: 'x = 4' }).status).toBe('correct');
    expect(checkQuickCheckAnswer(contract, { value: '3' })).toMatchObject({
      status: 'incorrect',
      hint: expect.stringContaining('power of $2$'),
    });
  });

  it('accepts simple fractions without broad symbolic parsing', () => {
    const contract: QuickCheckContract = {
      prompt: 'Give the value.',
      answerType: 'single_value',
      expectedAnswer: '0.5',
    };

    expect(checkQuickCheckAnswer(contract, { value: '1/2' }).status).toBe('correct');
    expect(checkQuickCheckAnswer(contract, { value: '\\frac{1}{2}' }).status).toBe('correct');
    expect(checkQuickCheckAnswer(contract, { value: 'sqrt(1/4)' }).status).toBe('incorrect');
  });

  it('checks ordered cards by ID order', () => {
    const contract = quickCheckContractFor({
      id: 'p3-algebra-rearrangement-001-qc',
      prompt: 'Order the moves.',
      answer: 'Factor first.',
      explanation: 'Look for a shared factor.',
    });

    expect(checkQuickCheckAnswer(contract, {
      orderedIds: ['spot-shared-factor', 'factor-out', 'simplify-bracket'],
    }).status).toBe('correct');
    expect(checkQuickCheckAnswer(contract, {
      orderedIds: ['factor-out', 'spot-shared-factor', 'simplify-bracket'],
    }).status).toBe('incorrect');
  });

  it('checks single-choice and multi-choice selections deterministically', () => {
    const choice = quickCheckContractFor({
      id: 'p3-log-invalid-operations-001-qc',
      prompt: 'Valid law?',
      answer: 'No.',
      explanation: 'Product law only.',
    });
    const multi = quickCheckContractFor({
      id: 'p3-log-laws-001-qc',
      prompt: 'Equivalent forms?',
      answer: '$\\ln(5x)$',
      explanation: 'Use product law.',
    });

    expect(checkQuickCheckAnswer(choice, { selectedChoiceId: 'no' }).status).toBe('correct');
    expect(checkQuickCheckAnswer(choice, { selectedChoiceId: 'yes' }).status).toBe('incorrect');
    expect(checkQuickCheckAnswer(multi, { selectedChoiceIds: ['ln-x5', 'ln-5x'] }).status).toBe('correct');
    expect(checkQuickCheckAnswer(multi, { selectedChoiceIds: ['ln-5x'] }).status).toBe('incorrect');
  });

  it('checks two-value responses field by field', () => {
    const contract: QuickCheckContract = {
      prompt: 'Give the stationary point.',
      answerType: 'two_value',
      fields: [
        { id: 'x', label: 'x', expectedAnswer: '2' },
        { id: 'y', label: 'y', expectedAnswer: ['-3', '-3.0'] },
      ],
      hint: 'Find both coordinates.',
    };

    expect(checkQuickCheckAnswer(contract, { values: { x: '2', y: '-3.0' } }).status).toBe('correct');
    expect(checkQuickCheckAnswer(contract, { values: { x: '2', y: '' } }).status).toBe('empty');
    expect(checkQuickCheckAnswer(contract, { values: { x: '2', y: '3' } })).toMatchObject({
      status: 'incorrect',
      hint: 'Find both coordinates.',
    });
  });

  it('uses mathematical contracts for representative visible P3 checks', () => {
    const cases = [
      {
        id: 'p3-binomial-term-001-qc',
        correct: { value: '-6' },
        incorrect: { value: '6' },
      },
      {
        id: 'p3-complex-form-001-qc',
        correct: { value: '5' },
        incorrect: { value: '7' },
      },
      {
        id: 'p3-integration-definite-area-001-qc',
        correct: { value: '8' },
        incorrect: { value: '4' },
      },
      {
        id: 'p3-trig-r-form-source-001-qc',
        correct: { value: '10' },
        incorrect: { value: '14' },
      },
    ] as const;

    for (const item of cases) {
      const contract = quickCheckContractFor({
        id: item.id,
        prompt: 'Prompt.',
        answer: 'Answer.',
        explanation: 'Explanation.',
      });
      expect(contract.answerType, item.id).toBe('single_value');
      expect(checkQuickCheckAnswer(contract, item.correct).status, item.id).toBe('correct');
      expect(checkQuickCheckAnswer(contract, item.incorrect).status, item.id).toBe('incorrect');
    }
  });

  it('uses constrained mathematical choices where broad symbolic parsing would be risky', () => {
    const contractCases: Array<{
      id: string;
      answerType: QuickCheckContract['answerType'];
      correct: QuickCheckResponse;
      incorrect: QuickCheckResponse;
    }> = [
      {
        id: 'p3-trig-interval-001-qc',
        answerType: 'multi_choice',
        correct: { selectedChoiceIds: ['150', '30'] },
        incorrect: { selectedChoiceIds: ['30'] },
      },
      {
        id: 'p3-parametric-derivative-001-qc',
        answerType: 'choice',
        correct: { selectedChoiceId: 'correct' },
        incorrect: { selectedChoiceId: 'inverse' },
      },
      {
        id: 'p3-differentiation-implicit-log-exp-001-qc',
        answerType: 'choice',
        correct: { selectedChoiceId: 'correct' },
        incorrect: { selectedChoiceId: 'missing-chain' },
      },
      {
        id: 'p3-vectors-lines-001-qc',
        answerType: 'choice',
        correct: { selectedChoiceId: 'point' },
        incorrect: { selectedChoiceId: 'direction' },
      },
    ];

    for (const item of contractCases) {
      const contract = quickCheckContractFor({
        id: item.id,
        prompt: 'Prompt.',
        answer: 'Answer.',
        explanation: 'Explanation.',
      });
      expect(contract.answerType, item.id).toBe(item.answerType);
      expect(checkQuickCheckAnswer(contract, item.correct).status, item.id).toBe('correct');
      expect(checkQuickCheckAnswer(contract, item.incorrect).status, item.id).toBe('incorrect');
    }
  });
});
