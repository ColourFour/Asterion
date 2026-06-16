export interface ExamQuestionSupportPrompt {
  firstStep: string;
}

export const EXAM_QUESTION_SUPPORT_PROMPTS: Record<string, ExamQuestionSupportPrompt> = {
  '32spring23_q01': {
    firstStep: 'Use the subtraction law first: ln A - ln B = ln(A/B). Then exponentiate both sides.',
  },
};

export function examQuestionSupportPrompt(questionId: string): ExamQuestionSupportPrompt | undefined {
  return EXAM_QUESTION_SUPPORT_PROMPTS[questionId];
}
