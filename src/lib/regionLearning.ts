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
import { getGuardianChallengeItemsForRegion } from '../data/guardianChallengeItems';
import { getFieldGuideTopicsForRegion } from '../data/fieldGuideTopics';
import { computeSkillChecklistCompletion, type SkillChecklistCompletion } from './skillChecklistProgress';

export const GUARDIAN_PASS_SCORE_RATIO = 0.75;

export const TRAINING_SESSION_LABELS: Record<TrainingSessionIntent, string> = {
  warm_up: 'Skill Practice review',
  core_practice: 'Core Practice',
  weak_area_review: 'Weak Area Review',
  challenge: 'Stretch Practice',
};

export interface GuardianEligibility {
  eligible: boolean;
  requirements: GuardianRequirement[];
  missingRequirements: string[];
  guardianQuestion?: NormalizedQuestion;
  guardianChallengeAvailable?: boolean;
  skillChecklistCompletion?: SkillChecklistCompletion;
}

export interface GuardianRequirement {
  id: 'field_guide' | 'skill_checklist';
  label: string;
  completed: boolean;
  detail: string;
  nextAction?: string;
  progress?: {
    current: number;
    target: number;
    label?: string;
  };
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

function hasQuestionAndMarkScheme(question: NormalizedQuestion): boolean {
  return question.questionImageCandidates.length > 0 && question.markSchemeImageCandidates.length > 0;
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
    ? 'Try Skill Practice before moving into exam questions.'
    : latest?.outcome === 'got_it' && gotIt >= 2
      ? 'Skill Practice is looking steady. Move into exam practice next.'
      : latest?.outcome === 'missed' || latest?.revealedEarly
      ? 'A recent Skill Practice item was missed or revealed early. Try Skill Practice before exam practice.'
      : 'Your Skill Practice work shows partial readiness. Try one more guided practice item or move carefully into training.';

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
  learningActivityAttempts?: LearningActivityAttempt[];
}): GuardianEligibility {
  const fieldGuideCompleted = Boolean(input.learningRecord?.fieldGuideCompletedAt);
  const fieldGuideTopicCount = getFieldGuideTopicsForRegion(input.region.id).length;
  const fieldGuideTarget = Math.max(1, fieldGuideTopicCount);
  const fieldGuideCompletedCount = fieldGuideTopicCount
    ? Math.min(fieldGuideTopicCount, Object.keys(input.learningRecord?.fieldGuideTopicCompletions ?? {}).length)
    : fieldGuideCompleted ? 1 : 0;
  const skillChecklistCompletion = computeSkillChecklistCompletion({
    regionId: input.region.id,
    learningActivityAttempts: input.learningActivityAttempts,
  });
  const guardianQuestions = filterGuardianCandidateQuestionsForRegion(input.regionQuestions, input.region);
  const guardianQuestion = selectGuardianQuestion(guardianQuestions);
  const guardianChallengeAvailable = getGuardianChallengeItemsForRegion(input.region.id).length > 0;

  const requirements: GuardianRequirement[] = [
    {
      id: 'field_guide',
      label: 'Field Guide complete',
      completed: fieldGuideCompleted,
      detail: fieldGuideCompleted
        ? `All ${fieldGuideTarget} Field Guide topic${fieldGuideTarget === 1 ? '' : 's'} are complete.`
        : `Complete the Field Guide topics (${fieldGuideCompletedCount}/${fieldGuideTarget}).`,
      nextAction: 'Start with the Field Guide before the Skill Practice.',
      progress: { current: fieldGuideCompleted ? fieldGuideTarget : fieldGuideCompletedCount, target: fieldGuideTarget },
    },
    {
      id: 'skill_checklist',
      label: 'Skill Practice complete',
      completed: skillChecklistCompletion.completed,
      detail: skillChecklistCompletion.completed
        ? `All ${skillChecklistCompletion.requiredCount} Skill Practice topic${skillChecklistCompletion.requiredCount === 1 ? '' : 's'} are complete.`
        : `Complete each Skill Practice topic (${skillChecklistCompletion.completedCount}/${skillChecklistCompletion.requiredCount}).`,
      nextAction: 'Use Skill Practice until every authored topic has a completed item.',
      progress: {
        current: skillChecklistCompletion.completedCount,
        target: skillChecklistCompletion.requiredCount,
      },
    },
  ];
  const missingRequirements = requirements.filter((requirement) => !requirement.completed).map((requirement) => requirement.detail);

  return {
    eligible: missingRequirements.length === 0,
    requirements,
    missingRequirements,
    guardianQuestion,
    guardianChallengeAvailable,
    skillChecklistCompletion,
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
  if (learningRecord?.guardianClearedAt && guardianEligibility.eligible) {
    return (regionProgress.recentScoreRatio ?? 1) < 0.55 ? 'needs_review' : 'guardian_cleared';
  }
  if (learningRecord?.guardianAttemptedAt && guardianEligibility.eligible) return 'guardian_attempted';
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
        reason: learningActivityReadiness.nextActionHint ?? 'Skill Practice work shows readiness for exam practice.',
      };
    }

    if (fieldGuideCompleted && learningActivityReadiness && (learningActivityReadiness.missed > 0 || learningActivityReadiness.earlyReveals > 0)) {
      return {
        intent: 'warm_up',
        label: TRAINING_SESSION_LABELS.warm_up,
        reason: learningActivityReadiness.nextActionHint ?? 'Skill Practice review is selected because a recent item was missed or revealed early.',
      };
    }

    return {
      intent: 'warm_up',
      label: TRAINING_SESSION_LABELS.warm_up,
      reason: fieldGuideCompleted
        ? 'Skill Practice review is selected because you have completed the guide and have no saved attempts in this topic yet.'
        : 'Skill Practice review is available, but the Field Guide is still the recommended first step.',
    };
  }

  if ((lastRatio ?? regionProgress.recentScoreRatio ?? 1) < 0.55) {
    return {
      intent: 'weak_area_review',
      label: TRAINING_SESSION_LABELS.weak_area_review,
      reason: 'Weak Area Review is suggested because your latest saved score is below 55%.',
    };
  }

  if (regionProgress.attempts < 3) {
    return {
      intent: 'core_practice',
      label: TRAINING_SESSION_LABELS.core_practice,
      reason: 'Core Practice is suggested because you are building your first saved attempts in this topic.',
    };
  }

  if ((regionProgress.averageScoreRatio ?? 0) >= 0.7 && (regionProgress.recentScoreRatio ?? 0) >= 0.7) {
    return {
      intent: 'challenge',
      label: TRAINING_SESSION_LABELS.challenge,
      reason: 'Stretch Problems are suggested because your average and recent saved scores are both at least 70%.',
    };
  }

  return {
    intent: 'core_practice',
    label: TRAINING_SESSION_LABELS.core_practice,
    reason: 'Core Practice is suggested because it gives balanced exam-style practice after the topic practice steps.',
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
      explanation: 'This topic needs question and mark-scheme images before practice can open.',
    };
  }

  if (state === 'available' || state === 'field_guide_started') {
    return {
      kind: 'field_guide',
      label: 'Read the Field Guide',
      explanation: 'Start with the topic guide so the first practice attempt has a clear target.',
    };
  }

  if (state === 'guardian_unlocked') {
    return {
      kind: 'guardian',
      label: 'Move to exam practice',
      explanation: 'The topic learning steps are complete. Move into exam-style practice.',
    };
  }

  if (state === 'guardian_attempted') {
    if (guardianEligibility.eligible) {
      return {
        kind: 'guardian',
        label: 'Continue exam practice',
        explanation: 'A saved topic attempt is already available. Continue with another exam-style question.',
      };
    }
    return {
      kind: 'review',
      label: 'Rebuild evidence',
      explanation: guardianEligibility.missingRequirements[0] ?? 'Review topic evidence before continuing exam-style practice.',
    };
  }

  if (state === 'guardian_cleared' || state === 'mastered') {
    return {
      kind: 'complete',
      label: 'Topic practice complete',
      explanation: 'Maintain exam practice here or choose another topic.',
    };
  }

  if (state === 'needs_review') {
    return {
      kind: 'review',
      label: 'Review this topic',
      explanation: 'Recent evidence has dropped below the review threshold.',
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
    learningActivityAttempts: input.learningActivityAttempts,
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
