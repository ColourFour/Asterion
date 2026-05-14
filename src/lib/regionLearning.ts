import type {
  Attempt,
  LearningActivityAttempt,
  LearningActivityOutcome,
  NormalizedQuestion,
  RegionDefinition,
  RegionLearningRecord,
  RegionLearningState,
  RegionProgress,
  RegionVisualTreatment,
  TrainingSessionIntent,
} from '../types';
import { filterGuardianCandidateQuestionsForRegion, isGuardianCandidateQuestion } from './questionEligibility';

export const GUARDIAN_PASS_SCORE_RATIO = 0.75;

export const TRAINING_SESSION_LABELS: Record<TrainingSessionIntent, string> = {
  warm_up: 'Warm-up',
  core_practice: 'Core practice',
  weak_area_review: 'Weak-area review',
  challenge: 'Challenge',
};

export interface GuardianEligibility {
  eligible: boolean;
  requirements: GuardianRequirement[];
  missingRequirements: string[];
  guardianQuestion?: NormalizedQuestion;
}

export interface GuardianRequirement {
  id: 'field_guide' | 'attempt_count' | 'recent_high_score' | 'subtopic_spread' | 'guardian_asset';
  label: string;
  completed: boolean;
  detail: string;
  nextAction?: string;
}

export interface TrainingSessionRecommendation {
  intent: TrainingSessionIntent;
  label: string;
  reason: string;
}

export interface LearningActivityReadiness {
  attempts: number;
  quickCheckAttempts: number;
  warmUpAttempts: number;
  gotIt: number;
  partial: number;
  missed: number;
  earlyReveals: number;
  latestOutcome?: LearningActivityOutcome;
  nextActionHint?: string;
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
  learningActivityReadiness: LearningActivityReadiness;
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

function hasQuestionAndMarkScheme(question: NormalizedQuestion): boolean {
  return question.questionImageCandidates.length > 0 && question.markSchemeImageCandidates.length > 0;
}

function attemptCountText(count: number): string {
  return `${count} saved attempt${count === 1 ? '' : 's'}`;
}

function attemptsMissingText(count: number): string {
  return `${count} more saved attempt${count === 1 ? '' : 's'}`;
}

function compareLearningActivityAttempts(a: LearningActivityAttempt, b: LearningActivityAttempt): number {
  const timeA = Date.parse(a.completedAt);
  const timeB = Date.parse(b.completedAt);
  const stableTimeA = Number.isFinite(timeA) ? timeA : 0;
  const stableTimeB = Number.isFinite(timeB) ? timeB : 0;
  return stableTimeA - stableTimeB || a.id.localeCompare(b.id) || a.activityId.localeCompare(b.activityId);
}

export function summarizeLearningActivityReadiness(attempts: LearningActivityAttempt[] = []): LearningActivityReadiness {
  const sorted = attempts.slice().sort(compareLearningActivityAttempts);
  const latest = sorted[sorted.length - 1];
  const quickCheckAttempts = sorted.filter((attempt) => attempt.activityType === 'quick_check').length;
  const warmUpAttempts = sorted.filter((attempt) => attempt.activityType === 'warm_up').length;
  const gotIt = sorted.filter((attempt) => attempt.outcome === 'got_it').length;
  const partial = sorted.filter((attempt) => attempt.outcome === 'partial').length;
  const missed = sorted.filter((attempt) => attempt.outcome === 'missed').length;
  const earlyReveals = sorted.filter((attempt) => attempt.revealedEarly).length;
  const latestOutcome = latest?.outcome;
  const nextActionHint = sorted.length === 0
    ? 'Try a Quick Check or warm-up before moving into exam questions.'
    : latest?.outcome === 'got_it' && gotIt >= 2
      ? 'Quick Check and warm-up records look ready. Move into canonical Exam Training next.'
      : latest?.outcome === 'missed' || latest?.revealedEarly
        ? 'A recent support activity was missed or revealed early. Try another warm-up before exam training.'
        : 'Support activity records show partial readiness. Try one more warm-up or move carefully into training.';

  return {
    attempts: sorted.length,
    quickCheckAttempts,
    warmUpAttempts,
    gotIt,
    partial,
    missed,
    earlyReveals,
    latestOutcome,
    nextActionHint,
  };
}

export function selectGuardianQuestion(questions: NormalizedQuestion[]): NormalizedQuestion | undefined {
  return questions
    .filter((question) => isGuardianCandidateQuestion(question) && hasQuestionAndMarkScheme(question))
    .map((question) => ({
      question,
      score:
        (question.marksAvailable ?? 0) * 6
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
  const fieldGuideCompleted = Boolean(input.learningRecord?.fieldGuideCompletedAt);
  const guardianQuestions = filterGuardianCandidateQuestionsForRegion(input.regionQuestions, input.region);
  const guardianQuestion = selectGuardianQuestion(guardianQuestions);
  const recentAttempts = input.regionAttempts.slice(-5);
  const hasRecentHighScore = recentAttempts.some((attempt) => (ratio(attempt) ?? 0) >= 0.7);
  const possible = possibleSubtopics(guardianQuestions);
  const attempted = attemptedSubtopics(input.regionAttempts);
  const requiredSubtopics = possible.size >= 2 ? 2 : Math.min(1, possible.size);
  const attemptsMissing = Math.max(0, 3 - input.regionProgress.attempts);
  const subtopicRequirementApplies = requiredSubtopics >= 2;

  const requirements: GuardianRequirement[] = [
    {
      id: 'field_guide',
      label: 'Field Guide reviewed',
      completed: fieldGuideCompleted,
      detail: fieldGuideCompleted
        ? 'You have reviewed the key moves and traps for this region.'
        : 'Complete the Field Guide.',
      nextAction: 'Start with the Field Guide. You have not reviewed the key exam traps yet.',
    },
    {
      id: 'attempt_count',
      label: 'Practice evidence saved',
      completed: attemptsMissing === 0,
      detail: attemptsMissing === 0
        ? `${attemptCountText(input.regionProgress.attempts)} recorded in this region.`
        : `Save at least 3 attempts in this region (${input.regionProgress.attempts}/3).`,
      nextAction: `Train in this region and save ${attemptsMissingText(attemptsMissing)} to build guardian evidence.`,
    },
    {
      id: 'recent_high_score',
      label: 'Recent 70%+ attempt',
      completed: hasRecentHighScore,
      detail: hasRecentHighScore
        ? 'At least one recent saved attempt is 70% or higher.'
        : 'Save at least 1 recent attempt at 70% or higher.',
      nextAction: 'You are close to the Guardian. Earn one recent saved attempt at 70% or higher.',
    },
    {
      id: 'subtopic_spread',
      label: 'Subtopic spread',
      completed: !subtopicRequirementApplies || attempted.size >= requiredSubtopics,
      detail: subtopicRequirementApplies
        ? attempted.size >= requiredSubtopics
          ? `You have attempted ${attempted.size}/${requiredSubtopics} required subtopics.`
          : `Attempt at least ${requiredSubtopics} subtopics in this region (${attempted.size}/${requiredSubtopics}).`
        : 'Subtopic spread is skipped until this region has enough subtopic metadata.',
      nextAction: `Try a question from another subtopic before challenging the Guardian (${attempted.size}/${requiredSubtopics}).`,
    },
    {
      id: 'guardian_asset',
      label: 'Guardian question ready',
      completed: Boolean(guardianQuestion),
      detail: guardianQuestion
        ? 'A trainable guardian question with mark-scheme images is available.'
        : 'Fix guardian question asset data: no trainable guardian question has both question and mark-scheme images.',
      nextAction: 'This region needs a trainable guardian question with both question and mark-scheme images.',
    },
  ];
  const missingRequirements = requirements.filter((requirement) => !requirement.completed).map((requirement) => requirement.detail);

  return {
    eligible: missingRequirements.length === 0,
    requirements,
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
  learningActivityReadiness?: LearningActivityReadiness;
}): TrainingSessionRecommendation {
  const { regionProgress, learningRecord, regionAttempts, learningActivityReadiness } = input;
  const lastAttempt = regionAttempts[regionAttempts.length - 1];
  const lastRatio = lastAttempt ? ratio(lastAttempt) : undefined;
  const fieldGuideCompleted = Boolean(learningRecord?.fieldGuideCompletedAt);

  if (regionProgress.attempts === 0) {
    if (fieldGuideCompleted && learningActivityReadiness && learningActivityReadiness.gotIt >= 2) {
      return {
        intent: 'core_practice',
        label: TRAINING_SESSION_LABELS.core_practice,
        reason: learningActivityReadiness.nextActionHint ?? 'Support activity records show readiness for canonical exam training.',
      };
    }

    if (fieldGuideCompleted && learningActivityReadiness && (learningActivityReadiness.missed > 0 || learningActivityReadiness.earlyReveals > 0)) {
      return {
        intent: 'warm_up',
        label: TRAINING_SESSION_LABELS.warm_up,
        reason: learningActivityReadiness.nextActionHint ?? 'Warm-up is selected because support activity records show a recent miss or early reveal.',
      };
    }

    return {
      intent: 'warm_up',
      label: TRAINING_SESSION_LABELS.warm_up,
      reason: fieldGuideCompleted
        ? 'Warm-up is selected because you have completed the guide and have no saved attempts in this region yet.'
        : 'Warm-up is available, but the Field Guide is still the recommended first step.',
    };
  }

  if ((lastRatio ?? regionProgress.recentScoreRatio ?? 1) < 0.55) {
    return {
      intent: 'weak_area_review',
      label: TRAINING_SESSION_LABELS.weak_area_review,
      reason: 'Weak-area review is selected because your latest local evidence is below 55%. This uses simple saved-score rules for now.',
    };
  }

  if (regionProgress.attempts < 3) {
    return {
      intent: 'core_practice',
      label: TRAINING_SESSION_LABELS.core_practice,
      reason: 'Core practice is selected because the Field Guide is underway and the Guardian needs at least 3 saved attempts.',
    };
  }

  if ((regionProgress.averageScoreRatio ?? 0) >= 0.7 && (regionProgress.recentScoreRatio ?? 0) >= 0.7) {
    return {
      intent: 'challenge',
      label: TRAINING_SESSION_LABELS.challenge,
      reason: 'Challenge is selected because your average and recent scores are both at least 70%, so you are near Guardian readiness.',
    };
  }

  return {
    intent: 'core_practice',
    label: TRAINING_SESSION_LABELS.core_practice,
    reason: 'Core practice is selected because you are building stable region evidence before the Guardian unlocks.',
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
  learningActivityReadiness?: LearningActivityReadiness;
}): NextRegionAction {
  const { state, guardianEligibility, trainingSession, learningActivityReadiness } = input;

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
      explanation: 'The Guardian is ready. Challenge it to clear the region.',
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
      label: 'Region restored',
      explanation: 'The Guardian is cleared. Maintain mastery here or choose another region.',
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
    explanation: learningActivityReadiness?.attempts
      ? trainingSession.reason
      : guardianEligibility.requirements.find((requirement) => !requirement.completed)?.nextAction ?? trainingSession.reason,
  };
}

export function buildRegionLearningSummary(input: {
  regionProgress: RegionProgress;
  learningRecord?: RegionLearningRecord;
  regionQuestions: NormalizedQuestion[];
  regionAttempts: Attempt[];
  learningActivityAttempts?: LearningActivityAttempt[];
}): RegionLearningSummary {
  const learningActivityReadiness = summarizeLearningActivityReadiness(input.learningActivityAttempts);
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
    learningActivityReadiness,
  });
  const state = computeRegionLearningState({
    regionProgress: input.regionProgress,
    learningRecord: input.learningRecord,
    guardianEligibility,
  });

  return {
    state,
    visualTreatment: computeRegionVisualTreatment(state),
    nextAction: nextRecommendedRegionAction({ state, guardianEligibility, trainingSession, learningActivityReadiness }),
    trainingSession,
    guardianEligibility,
    learningActivityReadiness,
  };
}
