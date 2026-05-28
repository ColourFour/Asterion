import type { ClassRegionAccess, ClassRegionAccessMode, StudentProfile } from '../types';
import { canUseRegionActivity, getClassRegionAccess } from './dashboardMockService';

export type RegionActivityAccess = 'field_guide' | 'quick_check' | 'warm_up' | 'exam_practice' | 'guardian' | 'mastery_progression';

export interface StudentRegionAccess {
  regionId: string;
  access: ClassRegionAccessMode;
  accessRecord?: ClassRegionAccess;
  classroomControlled: boolean;
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
