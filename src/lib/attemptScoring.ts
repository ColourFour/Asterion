import type { AttemptMarkBreakdown, AttemptPartScore, QuestionPartMark } from '../types';

export interface AttemptScoreValidation {
  earned?: number;
  markBreakdown?: AttemptMarkBreakdown;
  partScores?: AttemptPartScore[];
  scoreRatio?: number;
  isValid: boolean;
  error?: string;
}

const markKeys: Array<keyof AttemptMarkBreakdown> = ['m', 'b', 'a'];

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

export function parseAttemptMarkBreakdown(
  input: Record<keyof AttemptMarkBreakdown, string>,
  marksAvailable?: number,
  categoryCaps?: AttemptMarkBreakdown,
): AttemptScoreValidation {
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

  if (categoryCaps) {
    const overCategory = markKeys.find((key) => markBreakdown[key] > categoryCaps[key]);
    if (overCategory) {
      return { isValid: false, error: `${overCategory.toUpperCase()} marks cannot be higher than ${categoryCaps[overCategory]}.` };
    }
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

type PartScoreInput = string | Record<keyof AttemptMarkBreakdown, string>;

function parsePartMarkBreakdown(
  label: string,
  input: Record<keyof AttemptMarkBreakdown, string>,
  marksAvailable: number,
  categoryCaps?: AttemptMarkBreakdown,
): AttemptScoreValidation {
  const result = parseAttemptMarkBreakdown(input, marksAvailable, categoryCaps);
  if (!result.isValid) {
    if (!result.error) return { isValid: false, error: `Enter a mark for part ${label}.` };
    if (result.error === 'Enter valid M, B, and A marks.') return { isValid: false, error: `Enter valid M, B, and A marks for part ${label}.` };
    if (result.error === 'M, B, and A marks must be whole numbers.') return { isValid: false, error: `M, B, and A marks for part ${label} must be whole numbers.` };
    if (result.error === 'M, B, and A marks cannot be negative.') return { isValid: false, error: `M, B, and A marks for part ${label} cannot be negative.` };
    if (result.error === `M + B + A cannot be higher than ${marksAvailable}.`) {
      return { isValid: false, error: `M + B + A for part ${label} cannot be higher than ${marksAvailable}.` };
    }
    if (/^[MBA] marks cannot be higher than \d+\.$/.test(result.error)) {
      return { isValid: false, error: `Part ${label} ${result.error}` };
    }
    return { isValid: false, error: result.error };
  }
  return result;
}

export function parseAttemptPartScores(input: Record<string, PartScoreInput>, parts: QuestionPartMark[], marksAvailable?: number): AttemptScoreValidation {
  if (parts.length === 0) return { isValid: false };

  const missingPart = parts.find((part) => {
    const partInput = input[part.label];
    if (typeof partInput === 'string') return partInput.trim() === '';
    if (!partInput) return true;
    return markKeys.every((key) => partInput[key].trim() === '');
  });
  if (missingPart) {
    return { isValid: false, error: `Enter a mark for part ${missingPart.label}.` };
  }

  const partScores: AttemptPartScore[] = [];
  const markBreakdown: AttemptMarkBreakdown = { m: 0, b: 0, a: 0 };

  for (const part of parts) {
    const partInput = input[part.label];
    if (typeof partInput === 'string') {
      partScores.push({
        ...(part.partId ? { partId: part.partId } : {}),
        ...(part.subpartId ? { subpartId: part.subpartId } : {}),
        label: part.label,
        marksAvailable: part.marksAvailable,
        marksEarned: Number(partInput),
      });
      continue;
    }
    if (!partInput) return { isValid: false, error: `Enter a mark for part ${part.label}.` };

    const partResult = parsePartMarkBreakdown(part.label, partInput, part.marksAvailable, part.markBreakdown);
    const partBreakdown = partResult.markBreakdown;
    if (!partResult.isValid || typeof partResult.earned !== 'number' || !partBreakdown) return partResult;
    markKeys.forEach((key) => {
      markBreakdown[key] += partBreakdown[key];
    });
    partScores.push({
      ...(part.partId ? { partId: part.partId } : {}),
      ...(part.subpartId ? { subpartId: part.subpartId } : {}),
      label: part.label,
      marksAvailable: part.marksAvailable,
      marksEarned: partResult.earned,
      markBreakdown: partBreakdown,
    });
  }

  const invalidValue = partScores.find((part) => !Number.isFinite(part.marksEarned));
  if (invalidValue) {
    return { isValid: false, error: `Enter a valid mark for part ${invalidValue.label}.` };
  }

  const fractionalValue = partScores.find((part) => !Number.isInteger(part.marksEarned));
  if (fractionalValue) {
    return { isValid: false, error: `Part ${fractionalValue.label} marks must be whole numbers.` };
  }

  const negativeValue = partScores.find((part) => part.marksEarned < 0);
  if (negativeValue) {
    return { isValid: false, error: `Part ${negativeValue.label} marks cannot be negative.` };
  }

  const overMarkedPart = partScores.find((part) => part.marksEarned > part.marksAvailable);
  if (overMarkedPart) {
    return { isValid: false, error: `Part ${overMarkedPart.label} cannot be higher than ${overMarkedPart.marksAvailable}.` };
  }

  const earned = partScores.reduce((sum, part) => sum + part.marksEarned, 0);
  if (typeof marksAvailable === 'number' && marksAvailable >= 0 && earned > marksAvailable) {
    return { isValid: false, error: `Part marks cannot total higher than ${marksAvailable}.` };
  }

  return {
    earned,
    markBreakdown: partScores.some((part) => part.markBreakdown) ? markBreakdown : undefined,
    partScores,
    isValid: true,
    scoreRatio: typeof marksAvailable === 'number' && marksAvailable > 0 ? earned / marksAvailable : undefined,
  };
}
