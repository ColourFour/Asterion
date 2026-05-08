import type { AttemptMarkBreakdown } from '../types';

export interface AttemptScoreValidation {
  earned?: number;
  markBreakdown?: AttemptMarkBreakdown;
  scoreRatio?: number;
  isValid: boolean;
  error?: string;
}

export function parseAttemptScore(input: string, marksAvailable?: number): AttemptScoreValidation {
  const trimmed = input.trim();
  if (!trimmed) return { isValid: false };

  const earned = Number(trimmed);
  if (!Number.isFinite(earned)) {
    return { isValid: false, error: 'Enter a valid mark.' };
  }

  if (!Number.isInteger(earned)) {
    return { isValid: false, error: 'Marks must be whole numbers.' };
  }

  if (earned < 0) {
    return { isValid: false, error: 'Marks cannot be negative.' };
  }

  if (typeof marksAvailable === 'number' && marksAvailable >= 0 && earned > marksAvailable) {
    return { isValid: false, error: `Marks cannot be higher than ${marksAvailable}.` };
  }

  return {
    earned,
    isValid: true,
    scoreRatio: typeof marksAvailable === 'number' && marksAvailable > 0 ? earned / marksAvailable : undefined,
  };
}

export function parseAttemptMarkBreakdown(input: Record<keyof AttemptMarkBreakdown, string>, marksAvailable?: number): AttemptScoreValidation {
  const markKeys: Array<keyof AttemptMarkBreakdown> = ['m', 'b', 'a'];
  const hasEntry = markKeys.some((key) => input[key].trim() !== '');

  if (!hasEntry) return { isValid: false };

  const markBreakdown = markKeys.reduce<AttemptMarkBreakdown>(
    (breakdown, key) => {
      const rawValue = input[key].trim();
      const value = rawValue === '' ? 0 : Number(rawValue);

      breakdown[key] = value;
      return breakdown;
    },
    { m: 0, b: 0, a: 0 },
  );

  const invalidValue = markKeys.find((key) => !Number.isFinite(markBreakdown[key]));
  if (invalidValue) {
    return { isValid: false, error: 'Enter valid M, B, and A marks.' };
  }

  const fractionalValue = markKeys.find((key) => !Number.isInteger(markBreakdown[key]));
  if (fractionalValue) {
    return { isValid: false, error: 'M, B, and A marks must be whole numbers.' };
  }

  const negativeValue = markKeys.find((key) => markBreakdown[key] < 0);
  if (negativeValue) {
    return { isValid: false, error: 'M, B, and A marks cannot be negative.' };
  }

  const earned = markBreakdown.m + markBreakdown.b + markBreakdown.a;
  if (typeof marksAvailable === 'number' && marksAvailable >= 0 && earned > marksAvailable) {
    return { isValid: false, error: `M + B + A cannot be higher than ${marksAvailable}.` };
  }

  return {
    earned,
    markBreakdown,
    isValid: true,
    scoreRatio: typeof marksAvailable === 'number' && marksAvailable > 0 ? earned / marksAvailable : undefined,
  };
}
