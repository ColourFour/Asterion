import { describe, expect, it } from 'vitest';
import { checkSkillCheckAnswer, type SkillCheckAnswerSpec } from '../src/skill-checks/answerChecker';

function check(spec: SkillCheckAnswerSpec, submittedAnswer: string | string[]) {
  return checkSkillCheckAnswer({ spec, submittedAnswer });
}

describe('Skill Check answer checker', () => {
  it('accepts numeric answers within tolerance', () => {
    const result = check(
      { answerType: 'numeric', acceptedAnswers: ['2.5'], tolerance: 0.01 },
      '2.504',
    );

    expect(result).toMatchObject({
      isCorrect: true,
      answerType: 'numeric',
      matchedAcceptedAnswer: '2.5',
      unsupported: false,
    });
  });

  it('treats integers, decimals, and simple fractions as equivalent numeric values', () => {
    expect(check({ answerType: 'numeric', acceptedAnswers: ['5/2'] }, '2.5').isCorrect).toBe(true);
    expect(check({ answerType: 'numeric', acceptedAnswers: ['2.5'] }, '\\frac{5}{2}').isCorrect).toBe(true);
    expect(check({ answerType: 'numeric', acceptedAnswers: ['3'] }, '3.0').isCorrect).toBe(true);
  });

  it('accepts simple exact radical forms for numeric answers', () => {
    const exactSineValue: SkillCheckAnswerSpec = {
      answerType: 'numeric',
      acceptedAnswers: ['0.8660254037844386'],
      tolerance: 1e-12,
    };

    expect(check(exactSineValue, 'sqrt(3)/2').isCorrect).toBe(true);
    expect(check(exactSineValue, '\\sqrt{3}/2').isCorrect).toBe(true);
    expect(check(exactSineValue, '\\frac{\\sqrt{3}}{2}').isCorrect).toBe(true);
    expect(check({ ...exactSineValue, acceptedAnswers: ['-0.8660254037844386'] }, '-\\sqrt{3}/2').isCorrect).toBe(true);
  });

  it('accepts simple exact pi forms for numeric answers', () => {
    const oneThirdTurn: SkillCheckAnswerSpec = {
      answerType: 'numeric',
      acceptedAnswers: [String(Math.PI / 3)],
      tolerance: 1e-12,
    };

    expect(check(oneThirdTurn, 'pi/3').isCorrect).toBe(true);
    expect(check(oneThirdTurn, '\\pi/3').isCorrect).toBe(true);
    expect(check({ ...oneThirdTurn, acceptedAnswers: [String(2 * Math.PI)] }, '2pi').isCorrect).toBe(true);
    expect(check({ ...oneThirdTurn, acceptedAnswers: [String(2 * Math.PI)] }, '2\\pi').isCorrect).toBe(true);
    expect(check({ ...oneThirdTurn, acceptedAnswers: [String(-Math.PI / 4)] }, '-\\pi/4').isCorrect).toBe(true);
  });

  it('rejects empty and invalid numeric input', () => {
    const empty = check({ answerType: 'numeric', acceptedAnswers: ['4'] }, '   ');
    const invalid = check({ answerType: 'numeric', acceptedAnswers: ['4'] }, 'four');

    expect(empty).toMatchObject({
      isCorrect: false,
      normalizedSubmittedAnswer: '',
      reason: 'Submitted answer is empty.',
      unsupported: false,
    });
    expect(invalid).toMatchObject({
      isCorrect: false,
      reason: 'Submitted answer is not a supported integer, decimal, simple fraction, simple radical, or simple pi form.',
      unsupported: false,
    });
  });

  it('normalizes exact text answers without inferring new meaning', () => {
    const result = check(
      { answerType: 'exact-text', acceptedAnswers: ['one repeated real root'] },
      '  One   repeated real root. ',
    );

    expect(result).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: 'one repeated real root',
      matchedAcceptedAnswer: 'one repeated real root',
    });
  });

  it('checks expression text by normalized form only', () => {
    const accepted = check(
      { answerType: 'expression-text', acceptedAnswers: ['6x(x^2+1)^2'] },
      '6 x ( x^2 + 1 ) ^2',
    );
    const notInferred = check(
      { answerType: 'expression-text', acceptedAnswers: ['(x+1)^2'] },
      'x^2+2x+1',
    );

    expect(accepted.isCorrect).toBe(true);
    expect(notInferred).toMatchObject({
      isCorrect: false,
      reason: 'Expression did not match an accepted normalized text form. Algebraic equivalence is not inferred.',
    });
  });

  it('supports order-insensitive multi-value checking by default', () => {
    const result = check(
      { answerType: 'multi-value', acceptedAnswers: ['-1, 1, 5/2'] },
      ['2.5', '1', '-1'],
    );

    expect(result).toMatchObject({
      isCorrect: true,
      matchedAcceptedAnswer: '-1, 1, 5/2',
      unsupported: false,
    });
  });

  it('accepts and as a multi-value separator for labelled roots', () => {
    const result = check(
      { answerType: 'multi-value', acceptedAnswers: ['1, 2'] },
      'x=1 and x=2',
    );

    expect(result).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: '#1, #2',
      matchedAcceptedAnswer: '1, 2',
      unsupported: false,
    });
  });

  it('can require ordered multi-value checking when configured', () => {
    const spec: SkillCheckAnswerSpec = {
      answerType: 'multi-value',
      acceptedAnswers: ['-1, 1, 5/2'],
      orderMatters: true,
    };

    expect(check(spec, ['-1', '1', '2.5']).isCorrect).toBe(true);
    expect(check(spec, ['2.5', '1', '-1']).isCorrect).toBe(false);
  });

  it('checks numeric coordinate tuples', () => {
    const result = check(
      { answerType: 'coordinate', acceptedAnswers: ['(3, -1)'] },
      ' ( 3.0 , -1 ) ',
    );

    expect(result).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: '(3, -1)',
      matchedAcceptedAnswer: '(3, -1)',
    });
  });

  it('checks bounded intervals across practical equivalent forms', () => {
    const open = check(
      { answerType: 'interval', acceptedAnswers: ['1 < x < 4'] },
      '(1, 4)',
    );
    const closedOpen = check(
      { answerType: 'interval', acceptedAnswers: ['[1, 4)'] },
      'x >= 1 and x < 4',
    );

    expect(open).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: '(1, 4)',
      matchedAcceptedAnswer: '1 < x < 4',
    });
    expect(closedOpen).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: '[1, 4)',
      matchedAcceptedAnswer: '[1, 4)',
    });
  });

  it('checks one-sided intervals across practical equivalent forms', () => {
    const openRight = check(
      { answerType: 'interval', acceptedAnswers: ['x > 2'] },
      '(2, infinity)',
    );
    const closedLeft = check(
      { answerType: 'interval', acceptedAnswers: ['x <= 2'] },
      '(-infinity, 2]',
    );
    const exactPiBound = check(
      { answerType: 'interval', acceptedAnswers: [`x <= ${Math.PI / 3}`], tolerance: 1e-12 },
      'x <= \\pi/3',
    );
    const reverseOpenRight = check(
      { answerType: 'interval', acceptedAnswers: ['x > 2'] },
      '2 < x',
    );
    const reverseClosedLeft = check(
      { answerType: 'interval', acceptedAnswers: ['x <= 2'] },
      '2 >= x',
    );
    const reverseExactPiBound = check(
      { answerType: 'interval', acceptedAnswers: [`x <= ${Math.PI / 3}`], tolerance: 1e-12 },
      '\\pi/3 >= x',
    );

    expect(openRight).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: '(2, infinity)',
      matchedAcceptedAnswer: 'x > 2',
    });
    expect(closedLeft).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: '(-infinity, 2]',
      matchedAcceptedAnswer: 'x <= 2',
    });
    expect(exactPiBound.isCorrect).toBe(true);
    expect(reverseOpenRight.normalizedSubmittedAnswer).toBe('(2, infinity)');
    expect(reverseOpenRight.isCorrect).toBe(true);
    expect(reverseClosedLeft.normalizedSubmittedAnswer).toBe('(-infinity, 2]');
    expect(reverseClosedLeft.isCorrect).toBe(true);
    expect(reverseExactPiBound.isCorrect).toBe(true);
  });

  it('fails closed for unsupported interval unions', () => {
    const result = check(
      { answerType: 'interval', acceptedAnswers: ['1 < x < 4'] },
      'x < 1 or x > 4',
    );

    expect(result).toMatchObject({
      isCorrect: false,
      reason: 'Submitted interval is not a supported bounded interval form.',
      unsupported: false,
    });
  });

  it('checks complex numbers in a + bi form', () => {
    const result = check(
      { answerType: 'complex-number', acceptedAnswers: ['2 + 3i'] },
      'z = 2+3i',
    );

    expect(result).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: '2 + 3i',
      matchedAcceptedAnswer: '2 + 3i',
    });
  });

  it('accepts j as an imaginary-unit notation for complex numbers', () => {
    const result = check(
      { answerType: 'complex-number', acceptedAnswers: ['2 + 3i'] },
      'z = 2+3j',
    );

    expect(result).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: '2 + 3i',
      matchedAcceptedAnswer: '2 + 3i',
    });
  });

  it('accepts imaginary-first complex-number notation without symbolic inference', () => {
    const result = check(
      { answerType: 'complex-number', acceptedAnswers: ['3 + 4i'] },
      '4i + 3',
    );

    expect(result).toMatchObject({
      isCorrect: true,
      normalizedSubmittedAnswer: '3 + 4i',
      matchedAcceptedAnswer: '3 + 4i',
    });
  });

  it('fails closed for unsupported answer types', () => {
    const result = check(
      { answerType: 'symbolic-proof', acceptedAnswers: ['valid proof'] },
      'valid proof',
    );

    expect(result).toEqual({
      isCorrect: false,
      normalizedSubmittedAnswer: 'valid proof',
      reason: 'Unsupported answer type: symbolic-proof.',
      answerType: 'symbolic-proof',
      unsupported: true,
    });
  });
});
