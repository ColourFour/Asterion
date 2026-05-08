import { describe, expect, it } from 'vitest';
import { parseAttemptMarkBreakdown, parseAttemptScore } from '../lib/attemptScoring';

describe('parseAttemptScore', () => {
  it('accepts whole marks within the canonical maximum', () => {
    expect(parseAttemptScore('4', 8)).toEqual({ earned: 4, isValid: true, scoreRatio: 0.5 });
  });

  it('rejects impossible marks above the available marks', () => {
    expect(parseAttemptScore('9', 8)).toMatchObject({ isValid: false, error: 'Marks cannot be higher than 8.' });
  });

  it('rejects negative and fractional marks', () => {
    expect(parseAttemptScore('-1', 8).isValid).toBe(false);
    expect(parseAttemptScore('3.5', 8).isValid).toBe(false);
  });

  it('allows evidence entry when marks available are missing', () => {
    expect(parseAttemptScore('3')).toEqual({ earned: 3, isValid: true, scoreRatio: undefined });
  });

  it('sums M, B, and A marks into the attempt total', () => {
    expect(parseAttemptMarkBreakdown({ m: '1', b: '0', a: '3' }, 6)).toEqual({
      earned: 4,
      markBreakdown: { m: 1, b: 0, a: 3 },
      isValid: true,
      scoreRatio: 4 / 6,
    });
  });

  it('treats blank M, B, or A boxes as zero once a mark is entered', () => {
    expect(parseAttemptMarkBreakdown({ m: '2', b: '', a: '' }, 4)).toMatchObject({
      earned: 2,
      markBreakdown: { m: 2, b: 0, a: 0 },
      isValid: true,
    });
  });

  it('rejects M, B, and A sums above the available marks', () => {
    expect(parseAttemptMarkBreakdown({ m: '2', b: '1', a: '2' }, 4)).toMatchObject({
      isValid: false,
      error: 'M + B + A cannot be higher than 4.',
    });
  });
});
