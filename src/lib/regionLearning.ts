import type {
  Attempt,
  NormalizedQuestion,
  RegionDefinition,
  RegionLearningRecord,
  RegionLearningState,
  RegionProgress,
  RegionVisualTreatment,
  TrainingSessionIntent,
} from '../types';

export const GUARDIAN_PASS_SCORE_RATIO = 0.75;

export const TRAINING_SESSION_LABELS: Record<TrainingSessionIntent, string> = {
  warm_up: 'Warm-up',
  core_practice: 'Core practice',
  weak_area_review: 'Weak-area review',
  challenge: 'Challenge',
};

export interface GuardianEligibility {
  eligible: boolean;
  missingRequirements: string[];
  guardianQuestion?: NormalizedQuestion;
}

export interface TrainingSessionRecommendation {
  intent: TrainingSessionIntent;
  label: string;
  reason: string;
}

export interface NextRegionAction {
  kind: 'field_guide' | 'training' | 'guardian' | 'review' | 'complete' | 'locked';
  label: string;
  explanation: string;
}

export interface RegionLearningSummary {
  state: RegionLearningState;
  visualTreatment: RegionVisualTreatment;
  nextAction: NextRegionAction;
  trainingSession: TrainingSessionRecommendation;
  guardianEligibility: GuardianEligibility;
}

function ratio(attempt: Attempt): number | undefined {
  if (typeof attempt.scoreRatio === 'number' && Number.isFinite(attempt.scoreRatio)) return attempt.scoreRatio;
  if (typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0) return attempt.marksEarned / attempt.marksAvailable;
  return undefined;
}

function attemptedSubtopics(attempts: Attempt[]): Set<string> {
  return new Set(attempts.map((attempt) => attempt.subtopic).filter((value): value is string => Boolean(value)));
}

function possibleSubtopics(questions: NormalizedQuestion[]): Set<string> {
  const fromQuestions = questions
    .map((question) => question.displaySubtopic ?? question.localSubtopic ?? question.deepseek.subtopic)
    .filter((value): value is string => Boolean(value));
  return new Set(fromQuestions);
}

function difficultyWeight(difficulty?: string): number {
  const lower = difficulty?.toLowerCase() ?? '';
  if (lower.includes('challenge') || lower.includes('stretch') || lower.includes('hard')) return 3;
  if (lower.includes('foundation') || lower.includes('easy')) return 1;
  return 2;
}

function hasQuestionAndMarkScheme(question: NormalizedQuestion): boolean {
  return question.questionImageCandidates.length > 0 && question.markSchemeImageCandidates.length > 0;
}

export function selectGuardianQuestion(questions: NormalizedQuestion[]): NormalizedQuestion | undefined {
  return questions
    .filter(hasQuestionAndMarkScheme)
    .map((question) => ({
      question,
      score:
        difficultyWeight(question.displayDifficulty) * 100
        + (question.marksAvailable ?? 0) * 6
        + (question.displaySubtopic ? 4 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id))[0]?.question;
}

export function computeGuardianEligibility(input: {
  region: RegionDefinition;
  regionProgress: RegionProgress;
  learningRecord?: RegionLearningRecord;
  regionQuestions: NormalizedQuestion[];
  regionAttempts: Attempt[];
}): GuardianEligibility {
  const missingRequirements: string[] = [];
  const fieldGuideCompleted = Boolean(input.learningRecord?.fieldGuideCompletedAt);
  const guardianQuestion = selectGuardianQuestion(input.regionQuestions);
  const recentAttempts = input.regionAttempts.slice(-5);
  const hasRecentHighScore = recentAttempts.some((attempt) => (ratio(attempt) ?? 0) >= 0.7);
  const possible = possibleSubtopics(input.regionQuestions);
  const attempted = attemptedSubtopics(input.regionAttempts);
  const requiredSubtopics = possible.size >= 2 ? 2 : Math.min(1, possible.size);

  if (!fieldGuideCompleted) {
    missingRequirements.push('Complete the Field Guide.');
  }
  if (input.regionProgress.attempts < 3) {
    missingRequirements.push(`Save at least 3 attempts in this region (${input.regionProgress.attempts}/3).`);
  }
  if (!hasRecentHighScore) {
    missingRequirements.push('Save at least 1 recent attempt at 70% or higher.');
  }
  if (requiredSubtopics >= 2 && attempted.size < requiredSubtopics) {
    missingRequirements.push(`Attempt at least ${requiredSubtopics} subtopics in this region (${attempted.size}/${requiredSubtopics}).`);
  }
  if (!guardianQuestion) {
    missingRequirements.push('Fix guardian question asset data: no trainable guardian question has both question and mark-scheme images.');
  }

  return {
    eligible: missingRequirements.length === 0,
    missingRequirements,
    guardianQuestion,
  };
}

export function computeRegionLearningState(input: {
  regionProgress: RegionProgress;
  learningRecord?: RegionLearningRecord;
  guardianEligibility: GuardianEligibility;
}): RegionLearningState {
  const { regionProgress, learningRecord, guardianEligibility } = input;

  if (!regionProgress.isActive || regionProgress.availableQuestions === 0) return 'locked';
  if (regionProgress.rank === 'Mastered') return 'mastered';
  if (learningRecord?.guardianClearedAt) {
    return (regionProgress.recentScoreRatio ?? 1) < 0.55 ? 'needs_review' : 'guardian_cleared';
  }
  if (learningRecord?.guardianAttemptedAt) return 'guardian_attempted';
  if (guardianEligibility.eligible) return 'guardian_unlocked';
  if (regionProgress.attempts > 0) return 'training_in_progress';
  if (learningRecord?.fieldGuideCompletedAt) return 'field_guide_completed';
  if (learningRecord?.fieldGuideStartedAt) return 'field_guide_started';
  return 'available';
}

export function recommendTrainingSession(input: {
  regionProgress: RegionProgress;
  learningRecord?: RegionLearningRecord;
  regionAttempts: Attempt[];
}): TrainingSessionRecommendation {
  const { regionProgress, learningRecord, regionAttempts } = input;
  const lastAttempt = regionAttempts[regionAttempts.length - 1];
  const lastRatio = lastAttempt ? ratio(lastAttempt) : undefined;
  const fieldGuideCompleted = Boolean(learningRecord?.fieldGuideCompletedAt);

  if (regionProgress.attempts === 0) {
    return {
      intent: 'warm_up',
      label: TRAINING_SESSION_LABELS.warm_up,
      reason: fieldGuideCompleted
        ? 'You are starting this region with no saved attempts here yet.'
        : 'You can try a warm-up, but the Field Guide is still the recommended first step.',
    };
  }

  if ((lastRatio ?? regionProgress.recentScoreRatio ?? 1) < 0.55) {
    return {
      intent: 'weak_area_review',
      label: TRAINING_SESSION_LABELS.weak_area_review,
      reason: 'You are training this region because your recent saved evidence shows a weak area.',
    };
  }

  if (regionProgress.attempts < 3) {
    return {
      intent: 'core_practice',
      label: TRAINING_SESSION_LABELS.core_practice,
      reason: 'You are training this region because you have not yet completed enough saved attempts here.',
    };
  }

  if ((regionProgress.averageScoreRatio ?? 0) >= 0.7 && (regionProgress.recentScoreRatio ?? 0) >= 0.7) {
    return {
      intent: 'challenge',
      label: TRAINING_SESSION_LABELS.challenge,
      reason: 'You are ready for a harder session because your average and recent scores are both at least 70%.',
    };
  }

  return {
    intent: 'core_practice',
    label: TRAINING_SESSION_LABELS.core_practice,
    reason: 'You are building stable region evidence before the guardian check unlocks.',
  };
}

export function computeRegionVisualTreatment(state: RegionLearningState): RegionVisualTreatment {
  if (state === 'locked') return 'not_started';
  if (state === 'available' || state === 'field_guide_started' || state === 'field_guide_completed') return 'available';
  if (state === 'training_in_progress') return 'training';
  if (state === 'guardian_unlocked' || state === 'guardian_attempted') return 'guardian_unlocked';
  if (state === 'guardian_cleared') return 'guardian_cleared';
  if (state === 'needs_review') return 'needs_review';
  return 'mastered';
}

export function nextRecommendedRegionAction(input: {
  state: RegionLearningState;
  guardianEligibility: GuardianEligibility;
  trainingSession: TrainingSessionRecommendation;
}): NextRegionAction {
  const { state, guardianEligibility, trainingSession } = input;

  if (state === 'locked') {
    return {
      kind: 'locked',
      label: 'Waiting for trainable questions',
      explanation: 'This region needs canonical question and mark-scheme assets before it can open.',
    };
  }

  if (state === 'available' || state === 'field_guide_started') {
    return {
      kind: 'field_guide',
      label: 'Read the Field Guide',
      explanation: 'Start with the region guide so the first practice attempt has a clear target.',
    };
  }

  if (state === 'guardian_unlocked') {
    return {
      kind: 'guardian',
      label: 'Challenge the Guardian',
      explanation: 'Your local evidence meets the guardian requirements for this region.',
    };
  }

  if (state === 'guardian_attempted') {
    if (guardianEligibility.eligible) {
      return {
        kind: 'guardian',
        label: 'Retry the Guardian',
        explanation: 'A guardian attempt is already saved. Your evidence still allows another challenge.',
      };
    }
    return {
      kind: 'review',
      label: 'Rebuild evidence',
      explanation: guardianEligibility.missingRequirements[0] ?? 'Review training evidence before retrying the guardian.',
    };
  }

  if (state === 'guardian_cleared' || state === 'mastered') {
    return {
      kind: 'complete',
      label: 'Region reward unlocked',
      explanation: 'The guardian is cleared. Keep this region healthy through later mixed review.',
    };
  }

  if (state === 'needs_review') {
    return {
      kind: 'review',
      label: 'Review this region',
      explanation: 'The guardian was cleared earlier, but recent evidence has dropped below the review threshold.',
    };
  }

  return {
    kind: 'training',
    label: `Start ${trainingSession.label}`,
    explanation: trainingSession.reason,
  };
}

export function buildRegionLearningSummary(input: {
  regionProgress: RegionProgress;
  learningRecord?: RegionLearningRecord;
  regionQuestions: NormalizedQuestion[];
  regionAttempts: Attempt[];
}): RegionLearningSummary {
  const guardianEligibility = computeGuardianEligibility({
    region: input.regionProgress.region,
    regionProgress: input.regionProgress,
    learningRecord: input.learningRecord,
    regionQuestions: input.regionQuestions,
    regionAttempts: input.regionAttempts,
  });
  const trainingSession = recommendTrainingSession({
    regionProgress: input.regionProgress,
    learningRecord: input.learningRecord,
    regionAttempts: input.regionAttempts,
  });
  const state = computeRegionLearningState({
    regionProgress: input.regionProgress,
    learningRecord: input.learningRecord,
    guardianEligibility,
  });

  return {
    state,
    visualTreatment: computeRegionVisualTreatment(state),
    nextAction: nextRecommendedRegionAction({ state, guardianEligibility, trainingSession }),
    trainingSession,
    guardianEligibility,
  };
}
