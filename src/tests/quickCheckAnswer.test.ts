import { describe, expect, it } from 'vitest';
import { checkQuickCheckAnswer, quickCheckContractFor } from '../lib/quickCheckAnswer';
import type { QuickCheckContract } from '../types';

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
});
