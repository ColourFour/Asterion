export interface AttemptScoreValidation {
  earned?: number;
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
