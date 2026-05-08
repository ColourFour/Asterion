import type { NormalizedQuestion, TrainingSessionIntent } from '../../../types';
import type { RegionLearningSummary } from '../../../lib/regionLearning';

export const trainingIntents: TrainingSessionIntent[] = ['warm_up', 'core_practice', 'weak_area_review', 'challenge'];

export function percent(value: number | undefined): string {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : 'n/a';
}

export function questionSummary(question: NormalizedQuestion): string {
  return [
    question.paper,
    question.questionNumber ? `Q${question.questionNumber}` : undefined,
    question.displayDifficulty,
    typeof question.marksAvailable === 'number' ? `${question.marksAvailable} marks` : undefined,
  ].filter(Boolean).join(' · ');
}

export function phaseStatus(
  summary: RegionLearningSummary,
  fieldGuideCompleted: boolean,
  phase: 'guide' | 'training' | 'guardian',
): 'complete' | 'active' | 'locked' {
  const guardianCleared = summary.state === 'guardian_cleared' || summary.state === 'mastered';
  if (phase === 'guide') return fieldGuideCompleted ? 'complete' : 'active';
  if (phase === 'training') {
    if (guardianCleared || summary.guardianEligibility.eligible) return 'complete';
    return fieldGuideCompleted ? 'active' : 'locked';
  }
  if (guardianCleared) return 'complete';
  return summary.guardianEligibility.eligible ? 'active' : 'locked';
}
