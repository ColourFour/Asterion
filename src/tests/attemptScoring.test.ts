import { describe, expect, it } from 'vitest';
import { parseAttemptScore } from '../lib/attemptScoring';

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
});
