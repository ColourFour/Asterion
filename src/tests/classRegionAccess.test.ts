import { describe, expect, it } from 'vitest';
import { canStudentUseRegionActivity, getStudentRegionAccess } from '../lib/classRegionAccess';
import type { StudentProfile } from '../types';

const claimedAlphaProfile: StudentProfile = {
  id: 'profile-alpha',
  realName: 'Ada L.',
  classGroup: 'P3 Alpha',
  teacherName: 'Ms Hypatia',
  avatarName: 'Aster',
  classClaim: {
    status: 'claimed',
    classId: 'class-p3-alpha',
    className: 'P3 Alpha',
    classCode: 'AST-P3A',
    teacherId: 'teacher-hypatia',
    teacherName: 'Ms Hypatia',
    rosterStudentId: 'student-ada',
    displayName: 'Ada L.',
    message: 'Roster slot claimed.',
  },
  createdAt: '2026-05-08T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
};

describe('student class region access', () => {
  it('uses the claimed mock class to lock non-Field Guide activities', () => {
    const lockedAccess = getStudentRegionAccess(claimedAlphaProfile, 'complex-harbor');

    expect(lockedAccess).toMatchObject({
      regionId: 'complex-harbor',
      access: 'field_guide_only',
      classroomControlled: true,
    });
    expect(canStudentUseRegionActivity(lockedAccess, 'field_guide')).toBe(true);
    expect(canStudentUseRegionActivity(lockedAccess, 'quick_check')).toBe(false);
    expect(canStudentUseRegionActivity(lockedAccess, 'warm_up')).toBe(false);
    expect(canStudentUseRegionActivity(lockedAccess, 'exam_practice')).toBe(false);
    expect(canStudentUseRegionActivity(lockedAccess, 'guardian')).toBe(false);
    expect(canStudentUseRegionActivity(lockedAccess, 'mastery_progression')).toBe(false);
  });

  it('keeps missing class-claim context migration-tolerant', () => {
    const openAccess = getStudentRegionAccess(undefined, 'complex-harbor');

    expect(openAccess).toMatchObject({
      regionId: 'complex-harbor',
      access: 'open',
      classroomControlled: false,
    });
    expect(canStudentUseRegionActivity(openAccess, 'exam_practice')).toBe(true);
    expect(canStudentUseRegionActivity(openAccess, 'guardian')).toBe(true);
  });
});
