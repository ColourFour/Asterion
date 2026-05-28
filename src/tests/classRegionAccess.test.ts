import { describe, expect, it } from 'vitest';
import {
  canStudentUseRegionActivity,
  evaluateExamTrainingGate,
  evaluateGuardianChallengeGate,
  getStudentRegionAccess,
  lockedActivityMessage,
  type StudentRegionAccess,
} from '../lib/classRegionAccess';
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

  it('keeps Skill Check gates aligned with classroom region access modes', () => {
    const lockedAccess = getStudentRegionAccess(claimedAlphaProfile, 'complex-harbor');
    const openAccess = getStudentRegionAccess(claimedAlphaProfile, 'algebra-forge');

    expect(canStudentUseRegionActivity(lockedAccess, 'quick_check')).toBe(false);
    expect(canStudentUseRegionActivity(lockedAccess, 'warm_up')).toBe(false);
    expect(canStudentUseRegionActivity(openAccess, 'quick_check')).toBe(true);
    expect(canStudentUseRegionActivity(openAccess, 'warm_up')).toBe(true);
  });

  it('explains Guardian and Exam Training gates as class settings, not student failure', () => {
    const lockedAccess = getStudentRegionAccess(claimedAlphaProfile, 'complex-harbor');

    expect(lockedActivityMessage(lockedAccess, 'guardian')).toContain('not opened the Guardian Challenge');
    expect(lockedActivityMessage(lockedAccess, 'guardian')).toContain('class settings');
    expect(lockedActivityMessage(lockedAccess, 'exam_practice')).toContain('not opened Exam Training');
    expect(lockedActivityMessage(lockedAccess, 'exam_practice')).toContain('topic status stay visible');
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

  it('uses hosted region access ahead of mock/local class labels', () => {
    const hostedLockedAccess = getStudentRegionAccess(claimedAlphaProfile, 'algebra-forge', [
      {
        regionId: 'algebra-forge',
        regionName: 'Algebra Forge',
        access: 'field_guide_only',
        updatedByRole: 'teacher',
        updatedAt: '2026-05-20T08:00:00.000Z',
      },
    ]);

    expect(hostedLockedAccess).toMatchObject({
      regionId: 'algebra-forge',
      access: 'field_guide_only',
      classroomControlled: true,
    });
    expect(canStudentUseRegionActivity(hostedLockedAccess, 'field_guide')).toBe(true);
    expect(canStudentUseRegionActivity(hostedLockedAccess, 'mastery_progression')).toBe(false);
  });

  it('supports future per-activity teacher gates while falling back to region access', () => {
    const access: StudentRegionAccess = {
      regionId: 'algebra-forge',
      access: 'open',
      classroomControlled: true,
      accessRecord: {
        regionId: 'algebra-forge',
        regionName: 'Algebra Vault',
        access: 'open',
        activityAccess: {
          examTraining: 'locked',
          guardian: 'locked',
        },
        updatedByRole: 'teacher',
        updatedAt: '2026-05-28T00:00:00.000Z',
      },
    };

    expect(canStudentUseRegionActivity(access, 'field_guide')).toBe(true);
    expect(canStudentUseRegionActivity(access, 'quick_check')).toBe(true);
    expect(canStudentUseRegionActivity(access, 'exam_practice')).toBe(false);
    expect(canStudentUseRegionActivity(access, 'guardian')).toBe(false);
  });

  it('keeps Guardian visible but blocks start unless readiness and class settings both allow it', () => {
    const classLocked = getStudentRegionAccess(claimedAlphaProfile, 'complex-harbor');
    const classOpen = getStudentRegionAccess(claimedAlphaProfile, 'algebra-forge');

    expect(evaluateGuardianChallengeGate({
      access: classOpen,
      studentReady: false,
      studentReadinessReason: 'Complete each Skill Check topic (3/5).',
    })).toMatchObject({
      canStart: false,
      blocker: 'student_readiness',
      reason: 'Complete each Skill Check topic (3/5).',
    });

    expect(evaluateGuardianChallengeGate({
      access: classLocked,
      studentReady: true,
    })).toMatchObject({
      canStart: false,
      blocker: 'class_settings',
    });

    expect(evaluateGuardianChallengeGate({
      access: classLocked,
      studentReady: false,
      studentReadinessReason: 'Complete the Field Guide topics (2/5).',
    })).toMatchObject({
      canStart: false,
      blocker: 'student_readiness_and_class_settings',
    });

    expect(evaluateGuardianChallengeGate({
      access: classOpen,
      studentReady: true,
    })).toMatchObject({
      canStart: true,
      blocker: 'none',
    });
  });

  it('keeps Exam Training dashboards visible but blocks real-question starts by class gate or missing content', () => {
    const classLocked = getStudentRegionAccess(claimedAlphaProfile, 'complex-harbor');
    const classOpen = getStudentRegionAccess(claimedAlphaProfile, 'algebra-forge');

    expect(evaluateExamTrainingGate({
      access: classLocked,
      hasTrainableQuestions: true,
    })).toMatchObject({
      canStart: false,
      blocker: 'class_settings',
    });

    expect(evaluateExamTrainingGate({
      access: classOpen,
      hasTrainableQuestions: false,
    })).toMatchObject({
      canStart: false,
      blocker: 'content_unavailable',
      reason: 'No trainable question and mark-scheme image pairs are loaded for this region yet.',
    });

    expect(evaluateExamTrainingGate({
      access: classOpen,
      hasTrainableQuestions: true,
    })).toMatchObject({
      canStart: true,
      blocker: 'none',
    });
  });
});
