import type { EvidenceActivityType, EvidenceAction, EvidenceOutcome, RecommendedNextStep, RegionReadinessState, TeacherActionCardType } from '../../types';

export const nextStepLabels: Record<RecommendedNextStep, string> = {
  needs_field_guide: 'Needs Field Guide',
  needs_quick_check: 'Needs Skill Check',
  needs_warm_up: 'Needs Skill Check',
  ready_for_exam_training: 'Ready for Exam Training',
  needs_teacher_review: 'Needs Teacher Review',
  ready_for_guardian: 'Ready for Guardian',
};

export const readinessLabels: Record<RegionReadinessState, string> = {
  needs_field_guide: 'Field Guide first',
  needs_quick_check: 'Skill Check next',
  needs_warm_up: 'Skill Check next',
  ready_for_exam_training: 'Exam Training ready',
  needs_teacher_review: 'Teacher review',
  ready_for_guardian: 'Guardian ready',
  mixed: 'Mixed evidence',
};

export const actionTypeLabels: Record<TeacherActionCardType, string> = {
  reteach: 'Reteach now',
  small_group: 'Small group',
  ready_for_exam_practice: 'Ready for exam practice',
  needs_evidence: 'Needs evidence',
  teacher_review: 'Teacher review',
};

export const activityLabels: Record<EvidenceActivityType, string> = {
  field_guide: 'Field Guide',
  quick_check: 'Skill Check',
  warm_up: 'Skill Check',
  exam_training: 'Exam Training',
  guardian: 'Guardian',
};

export const evidenceActionLabels: Record<EvidenceAction, string> = {
  started: 'started',
  submitted: 'submitted',
  revealed: 'mark scheme revealed',
  completed: 'completed',
  skipped: 'skipped',
};

export const outcomeLabels: Record<EvidenceOutcome, string> = {
  correct: 'correct',
  incorrect: 'not yet secure',
  partial: 'partly secure',
  self_review: 'self-reviewed',
  unknown: 'not enough evidence',
};
