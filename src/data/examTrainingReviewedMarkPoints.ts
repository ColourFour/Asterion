export interface ReviewedExamTrainingMarkPoint {
  mark_code: string;
  label: string;
  confidence?: number;
  review_status?: string;
}

const REVIEWED_EXAM_TRAINING_MARK_POINTS: Record<string, ReviewedExamTrainingMarkPoint[]> = {
  '31summer23_q03_whole': [
    {
      mark_code: 'B1',
      label: 'State unsimplified term in x^3, or its coefficient, in the expansion of (1+4x)^(1/2).',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'B1',
      label: 'State unsimplified term in x^2, or its coefficient, in the expansion of (1+4x)^(1/2).',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'M1',
      label: 'Multiply by (3+x) and combine terms in x^3, or their coefficients.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain answer 10, or accept 10x^3.',
      confidence: 1,
      review_status: 'reviewed',
    },
  ],
  '31summer24_q01_whole': [
    {
      mark_code: 'B1',
      label: 'State correct unsimplified first two terms of the expansion of (1-2x)^(1/2).',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'B1',
      label: 'State correct unsimplified term in x^2.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'M1',
      label: 'Obtain sufficient terms of the product of (3+x) and the expansion up to the term in x^2.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain final answer 3 - 2x - (5/2)x^2.',
      confidence: 1,
      review_status: 'reviewed',
    },
  ],
  '32autumn23_q03_whole': [
    {
      mark_code: 'M1',
      label: 'Substitute x = 1/2 and equate the result to zero, or use equivalent division remainder work.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain a correct evaluated equation, e.g. 1/4 + a/4 - 11/2 + b = 0 or a + 4b = 21.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'M1',
      label: 'Substitute x = -1 and equate the result to 12, or use equivalent division remainder work.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain a correct evaluated equation, e.g. -2 + a + 11 + b = 12 or a + b = 3.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain a = -3 and b = 6.',
      confidence: 1,
      review_status: 'reviewed',
    },
  ],
  '32spring23_q03_whole': [
    {
      mark_code: 'M1',
      label: 'Commence division and reach partial quotient 2x^2 + (a +/- 2)x.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain correct quotient 2x^2 + (a + 2)x + a.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'M1',
      label: 'Set their linear remainder equal to part of 3x + 2 and solve for a or for b.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain answer a = -3.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain answer b = 5.',
      confidence: 1,
      review_status: 'reviewed',
    },
  ],
  '32spring24_q01_whole': [
    {
      mark_code: 'M1',
      label: 'Commence division and reach partial quotient of the form x^2 +/- 3x, or equivalent coefficient comparison.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain quotient x^2 - 3x + 4.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain remainder 3x + 7.',
      confidence: 1,
      review_status: 'reviewed',
    },
  ],
  '33autumn23_q03_whole': [
    {
      mark_code: 'M1',
      label: 'Substitute x = -2 and equate the result to -38, or use equivalent division remainder work.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain a correct evaluated equation, e.g. -16 + 4a - 2b + 6 = -38 or 4a - 2b = -28.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'M1',
      label: 'Substitute x = 1/2 and equate the result to 19/2, or use equivalent division remainder work.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain a correct evaluated equation, e.g. 1/4 + a/4 + b/2 + 6 = 19/2 or a/4 + b/2 = 13/4.',
      confidence: 1,
      review_status: 'reviewed',
    },
    {
      mark_code: 'A1',
      label: 'Obtain a = -3 and b = 8.',
      confidence: 1,
      review_status: 'reviewed',
    },
  ],
};

export function reviewedExamTrainingMarkPointsForSubpart(
  subpartId: string | undefined,
): ReviewedExamTrainingMarkPoint[] | undefined {
  if (!subpartId) return undefined;
  return REVIEWED_EXAM_TRAINING_MARK_POINTS[subpartId];
}
