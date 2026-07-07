import { describe, expect, it } from 'vitest';
import { answerFormatGuidance } from '../src/lib/answerFormatGuidance';

describe('answerFormatGuidance', () => {
  it('describes numeric answers without expression-specific copy', () => {
    expect(answerFormatGuidance({
      answerType: 'numeric',
      acceptedAnswers: ['3/2'],
    })).toMatchObject({
      kind: 'numeric',
      instruction: 'Answer format: number, fraction, radical, or pi form.',
      placeholder: '3/2',
      examples: ['3/2', 'sqrt(3)/2', 'pi/3'],
      symbols: ['/', 'sqrt()', 'pi'],
    });
  });

  it('describes compact expressions with power syntax', () => {
    expect(answerFormatGuidance({
      answerType: 'expression-text',
      acceptedAnswers: ['x^2-x-6'],
    })).toMatchObject({
      kind: 'expression',
      instruction: 'Answer format: type a compact expression using ^ for powers.',
      placeholder: 'x^2-x-6',
      examples: ['x^2-x-6', '(x+1)/(x-2)', 'sqrt(3)/2'],
      symbols: ['^', '/', 'sqrt()', 'pi'],
    });
  });

  it('adds log and exponential keyboard examples for expression answers', () => {
    expect(answerFormatGuidance({
      answerType: 'expression-text',
      acceptedAnswers: ['ln(x^3)'],
      prompt: 'Rewrite 3 ln x as one logarithm.',
    })).toMatchObject({
      kind: 'expression',
      instruction: 'Answer format: type a compact expression using ^ for powers.',
      placeholder: 'ln(5x)',
      examples: ['ln(5x)', 'log_a(6)', 'e^(2x)'],
      symbols: ['^', '/', 'ln()', 'log_a()', 'e^()'],
    });
  });

  it('adds trigonometry keyboard examples for expression answers', () => {
    expect(answerFormatGuidance({
      answerType: 'expression-text',
      acceptedAnswers: ['cos^2x'],
      prompt: 'Rewrite 1 - sin^2 x.',
    })).toMatchObject({
      kind: 'expression',
      instruction: 'Answer format: type a compact expression using ^ for powers.',
      placeholder: 'sin^2x',
      examples: ['sin^2x', 'cos(2x)', 'pi/3'],
      symbols: ['^', '/', 'sin', 'cos', 'tan', 'pi'],
    });
  });

  it('describes coordinate/vector answers as comma-separated tuples', () => {
    expect(answerFormatGuidance({
      answerType: 'coordinate',
      acceptedAnswers: ['(2,-3,4)'],
      prompt: 'Which column vector matches 2i - 3j + 4k?',
    })).toMatchObject({
      kind: 'coordinate-vector',
      instruction: 'Answer format: column-vector components as (a,b,c), with commas.',
      placeholder: '(a,b,c)',
      examples: ['(a,b,c)', '<a,b,c>'],
      symbols: ['commas', '( )', '< >'],
    });
  });

  it('detects tuple-like expression answers before generic expression guidance', () => {
    expect(answerFormatGuidance({
      answerType: 'expression-text',
      acceptedAnswers: ['(5,-1)'],
    })).toMatchObject({
      kind: 'coordinate-vector',
      instruction: 'Answer format: use commas, e.g. (a,b).',
      placeholder: '(a,b)',
      examples: ['(a,b)', '<a,b>'],
    });
  });

  it('describes multi-value answers as comma-separated lists', () => {
    expect(answerFormatGuidance({
      answerType: 'multi-value',
      acceptedAnswers: ['-60, 120'],
    })).toMatchObject({
      kind: 'multi-value',
      instruction: 'Answer format: separate values with commas, e.g. a, b.',
      placeholder: 'a, b',
      examples: ['a, b', 'x=1, x=2'],
      symbols: ['commas', 'and'],
    });

    expect(answerFormatGuidance({
      answerType: 'multi-value',
      acceptedAnswers: ['(0, 180)'],
    })).toMatchObject({
      kind: 'multi-value',
      instruction: 'Answer format: separate values with commas, e.g. a, b.',
      placeholder: 'a, b',
    });
  });

  it('describes interval and complex answers with type-specific syntax', () => {
    expect(answerFormatGuidance({
      answerType: 'interval',
      acceptedAnswers: ['-1 < x < 4'],
    })).toMatchObject({
      kind: 'interval',
      instruction: 'Answer format: interval or inequality.',
      placeholder: '-1 < x < 4',
      examples: ['-1 < x < 4', 'x >= 1 and x < 4', '(1, 4)'],
    });

    expect(answerFormatGuidance({
      answerType: 'complex-number',
      acceptedAnswers: ['3+2i'],
    })).toMatchObject({
      kind: 'complex',
      instruction: 'Answer format: complex number in a+bi form.',
      placeholder: '3+2i',
      examples: ['3+2i', '-1-sqrt(7)i', '4i+3'],
      symbols: ['i', '+', '-'],
    });
  });

  it('describes exact-text answers as short phrases without a spoiler placeholder', () => {
    expect(answerFormatGuidance({
      answerType: 'exact-text',
      acceptedAnswers: ['one repeated real root'],
    })).toMatchObject({
      kind: 'exact-text',
      instruction: 'Answer format: short phrase.',
      examples: ['short phrase'],
      symbols: ['words'],
    });
  });

  it('supports field-level guidance for two-value inputs', () => {
    expect(answerFormatGuidance({
      answerType: 'expression-text',
      expectedAnswer: ['x^2+5x+9', 'x^2 + 5x + 9'],
      label: 'quotient',
    })).toMatchObject({
      kind: 'expression',
      instruction: 'Answer format: type a compact expression using ^ for powers.',
      placeholder: 'x^2-x-6',
    });

    expect(answerFormatGuidance({
      answerType: 'numeric',
      expectedAnswer: '23',
      label: 'remainder',
    })).toMatchObject({
      kind: 'numeric',
      instruction: 'Answer format: number, fraction, radical, or pi form.',
      placeholder: '3/2',
    });
  });
});
