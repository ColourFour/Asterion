import type { ClassRegionAccess, ClassRegionAccessMode, StudentProfile } from '../types';
import { canUseRegionActivity, getClassRegionAccess } from './dashboardMockService';

export type RegionActivityAccess = 'field_guide' | 'quick_check' | 'warm_up' | 'exam_practice' | 'guardian' | 'mastery_progression';

export interface StudentRegionAccess {
  regionId: string;
  access: ClassRegionAccessMode;
  accessRecord?: ClassRegionAccess;
  classroomControlled: boolean;
}

export function getStudentRegionAccess(profile: StudentProfile | undefined, regionId: string): StudentRegionAccess {
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
    ? 'Your teacher has opened the Field Guide for this region. Quick Check, Warm-Up, Exam Practice, Guardian, and mastery progress are locked for now.'
    : 'This region is open for local practice.';
}
