import { describe, expect, it } from 'vitest';
import { answerFormatGuidance } from '../src/lib/answerFormatGuidance';

describe('answerFormatGuidance', () => {
  it('describes numeric answers without expression-specific copy', () => {
    expect(answerFormatGuidance({
      answerType: 'numeric',
      acceptedAnswers: ['3/2'],
    })).toEqual({
      instruction: 'Answer format: number, fraction, radical, or pi form.',
      placeholder: '3/2',
    });
  });

  it('describes compact expressions with power syntax', () => {
    expect(answerFormatGuidance({
      answerType: 'expression-text',
      acceptedAnswers: ['x^2-x-6'],
    })).toEqual({
      instruction: 'Answer format: type a compact expression using ^ for powers.',
      placeholder: 'x^2-x-6',
    });
  });

  it('describes coordinate/vector answers as comma-separated tuples', () => {
    expect(answerFormatGuidance({
      answerType: 'coordinate',
      acceptedAnswers: ['(2,-3,4)'],
      prompt: 'Which column vector matches 2i - 3j + 4k?',
    })).toEqual({
      instruction: 'Answer format: column-vector components as (a,b,c), with commas.',
      placeholder: '(a,b,c)',
    });
  });

  it('detects tuple-like expression answers before generic expression guidance', () => {
    expect(answerFormatGuidance({
      answerType: 'expression-text',
      acceptedAnswers: ['(5,-1)'],
    })).toEqual({
      instruction: 'Answer format: use commas, e.g. (a,b).',
      placeholder: '(a,b)',
    });
  });

  it('describes multi-value answers as comma-separated lists', () => {
    expect(answerFormatGuidance({
      answerType: 'multi-value',
      acceptedAnswers: ['-60, 120'],
    })).toEqual({
      instruction: 'Answer format: separate values with commas, e.g. a, b.',
      placeholder: 'a, b',
    });

    expect(answerFormatGuidance({
      answerType: 'multi-value',
      acceptedAnswers: ['(0, 180)'],
    })).toEqual({
      instruction: 'Answer format: separate values with commas, e.g. a, b.',
      placeholder: 'a, b',
    });
  });

  it('describes exact-text answers as short phrases without a spoiler placeholder', () => {
    expect(answerFormatGuidance({
      answerType: 'exact-text',
      acceptedAnswers: ['one repeated real root'],
    })).toEqual({
      instruction: 'Answer format: short phrase.',
    });
  });

  it('supports field-level guidance for two-value inputs', () => {
    expect(answerFormatGuidance({
      answerType: 'expression-text',
      expectedAnswer: ['x^2+5x+9', 'x^2 + 5x + 9'],
      label: 'quotient',
    })).toEqual({
      instruction: 'Answer format: type a compact expression using ^ for powers.',
      placeholder: 'x^2-x-6',
    });

    expect(answerFormatGuidance({
      answerType: 'numeric',
      expectedAnswer: '23',
      label: 'remainder',
    })).toEqual({
      instruction: 'Answer format: number, fraction, radical, or pi form.',
      placeholder: '3/2',
    });
  });
});
