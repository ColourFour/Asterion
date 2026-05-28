import type { ClassRegionAccess, ClassRegionAccessMode, StudentProfile } from '../types';
import { canUseRegionActivity, getClassRegionAccess } from './dashboardMockService';

export type RegionActivityAccess = 'field_guide' | 'quick_check' | 'warm_up' | 'exam_practice' | 'guardian' | 'mastery_progression';

export type ActivityGateBlocker =
  | 'none'
  | 'student_readiness'
  | 'class_settings'
  | 'student_readiness_and_class_settings'
  | 'content_unavailable';

export interface StudentRegionAccess {
  regionId: string;
  access: ClassRegionAccessMode;
  accessRecord?: ClassRegionAccess;
  classroomControlled: boolean;
}

export interface ActivityGateDecision {
  canStart: boolean;
  blocker: ActivityGateBlocker;
  reason?: string;
  studentReady: boolean;
  classAllowsActivity: boolean;
}

function activityOverride(access: StudentRegionAccess | undefined, activity: RegionActivityAccess): boolean | undefined {
  const activityAccess = access?.accessRecord?.activityAccess;
  if (!activityAccess) return undefined;

  const key = {
    field_guide: undefined,
    quick_check: 'quickCheck',
    warm_up: 'warmUp',
    exam_practice: 'examTraining',
    guardian: 'guardian',
    mastery_progression: 'masteryProgression',
  }[activity] as keyof NonNullable<ClassRegionAccess['activityAccess']> | undefined;

  if (!key) return undefined;
  const configured = activityAccess[key];
  return configured ? configured === 'open' : undefined;
}

export function getStudentRegionAccess(
  profile: StudentProfile | undefined,
  regionId: string,
  hostedRegionAccess?: ClassRegionAccess[],
): StudentRegionAccess {
  if (hostedRegionAccess) {
    const accessRecord = hostedRegionAccess.find((item) => item.regionId === regionId);
    return {
      regionId,
      access: accessRecord?.access ?? 'field_guide_only',
      accessRecord,
      classroomControlled: true,
    };
  }

  const classId = profile?.classClaim?.status === 'claimed' ? profile.classClaim.classId : undefined;
  if (!classId) {
    return {
      regionId,
      access: 'open',
      classroomControlled: false,
    };
  }

  const accessRecord = getClassRegionAccess(classId).find((item) => item.regionId === regionId);
  return {
    regionId,
    access: accessRecord?.access ?? 'field_guide_only',
    accessRecord,
    classroomControlled: true,
  };
}

export function canStudentUseRegionActivity(access: StudentRegionAccess | undefined, activity: RegionActivityAccess): boolean {
  if (activity === 'field_guide') return true;
  const override = activityOverride(access, activity);
  if (typeof override === 'boolean') return override;
  return canUseRegionActivity(access?.access ?? 'open', activity);
}

export function isStudentRegionLocked(access: StudentRegionAccess | undefined): boolean {
  return !canStudentUseRegionActivity(access, 'exam_practice');
}

export function lockedRegionMessage(access: StudentRegionAccess | undefined): string {
  return access?.classroomControlled
    ? 'Your teacher has opened the Field Guide for this region. Skill Check, Exam Practice, Guardian, and mastery progress are locked for now.'
    : 'This region is open for local practice.';
}

export function lockedActivityMessage(access: StudentRegionAccess | undefined, activity: RegionActivityAccess): string {
  if (!access?.classroomControlled) {
    return 'This activity is not available right now.';
  }

  // TODO: split this into independent Guardian and Exam Training controls when class settings support per-activity switches.
  if (activity === 'guardian') {
    return 'Your teacher has not opened the Guardian Challenge for this region yet. Your checklist stays visible, but the challenge cannot start from class settings right now.';
  }

  if (activity === 'exam_practice') {
    return 'Your teacher has not opened Exam Training for this region yet. Your dashboard and topic status stay visible, but real question practice is locked by class settings right now.';
  }

  if (activity === 'quick_check' || activity === 'warm_up') {
    return 'Your teacher has not opened Skill Check for this region yet. Field Guide stays available, but Skill Check attempts are locked by class settings right now.';
  }

  return lockedRegionMessage(access);
}

function guardianStudentReadinessReason(reason?: string): string {
  return reason ?? 'Complete the Field Guide and Skill Check before starting the Guardian Challenge.';
}

export function evaluateGuardianChallengeGate(input: {
  access: StudentRegionAccess | undefined;
  studentReady: boolean;
  studentReadinessReason?: string;
}): ActivityGateDecision {
  const classAllowsActivity = canStudentUseRegionActivity(input.access, 'guardian');
  if (input.studentReady && classAllowsActivity) {
    return {
      canStart: true,
      blocker: 'none',
      studentReady: true,
      classAllowsActivity: true,
    };
  }

  const readinessReason = guardianStudentReadinessReason(input.studentReadinessReason);
  const classReason = lockedActivityMessage(input.access, 'guardian');

  if (!input.studentReady && !classAllowsActivity) {
    return {
      canStart: false,
      blocker: 'student_readiness_and_class_settings',
      reason: `${readinessReason} Your teacher also has not opened the Guardian Challenge for this region yet.`,
      studentReady: false,
      classAllowsActivity: false,
    };
  }

  if (!input.studentReady) {
    return {
      canStart: false,
      blocker: 'student_readiness',
      reason: readinessReason,
      studentReady: false,
      classAllowsActivity,
    };
  }

  return {
    canStart: false,
    blocker: 'class_settings',
    reason: classReason,
    studentReady: true,
    classAllowsActivity: false,
  };
}

export function evaluateExamTrainingGate(input: {
  access: StudentRegionAccess | undefined;
  hasTrainableQuestions: boolean;
  noQuestionsReason?: string;
}): ActivityGateDecision {
  const classAllowsActivity = canStudentUseRegionActivity(input.access, 'exam_practice');
  if (classAllowsActivity && input.hasTrainableQuestions) {
    return {
      canStart: true,
      blocker: 'none',
      studentReady: true,
      classAllowsActivity: true,
    };
  }

  if (!classAllowsActivity) {
    return {
      canStart: false,
      blocker: 'class_settings',
      reason: lockedActivityMessage(input.access, 'exam_practice'),
      studentReady: true,
      classAllowsActivity: false,
    };
  }

  return {
    canStart: false,
    blocker: 'content_unavailable',
    reason: input.noQuestionsReason ?? 'No trainable question and mark-scheme image pairs are loaded for this region yet.',
    studentReady: false,
    classAllowsActivity: true,
  };
}
