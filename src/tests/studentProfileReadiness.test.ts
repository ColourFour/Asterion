import { describe, expect, it } from 'vitest';
import {
  hasCompleteClassClaim,
  hasCompleteOnboardingProfile,
  profileMatchesClassClaim,
} from '../lib/studentProfileReadiness';
import type { StudentClaimState, StudentProfile } from '../types';

const claim: StudentClaimState = {
  status: 'claimed',
  classId: 'class-p3-alpha',
  className: 'P3 Alpha',
  classCode: 'AST-P3A',
  teacherId: 'teacher-hypatia',
  teacherName: 'Ms Hypatia',
  rosterStudentId: 'roster-ada',
  displayName: 'Ada L.',
  message: 'Class membership verified.',
};

const profile: StudentProfile = {
  id: 'profile-ada',
  realName: 'Ada L.',
  classGroup: 'P3 Alpha',
  teacherName: 'Ms Hypatia',
  avatarName: 'Ada Prime',
  avatarId: 'star-apprentice',
  onboardingCompleted: true,
  onboardingCompletedAt: '2026-05-24T08:00:00.000Z',
  classClaim: claim,
  createdAt: '2026-05-24T08:00:00.000Z',
  updatedAt: '2026-05-24T08:00:00.000Z',
};

describe('student profile readiness guards', () => {
  it('requires completed onboarding plus avatar fields before skipping onboarding', () => {
    expect(hasCompleteOnboardingProfile(profile)).toBe(true);
    expect(hasCompleteOnboardingProfile({ ...profile, avatarId: undefined })).toBe(false);
    expect(hasCompleteOnboardingProfile({ ...profile, avatarName: '   ' })).toBe(false);
    expect(hasCompleteOnboardingProfile({ ...profile, onboardingCompleted: undefined })).toBe(false);
  });

  it('requires a complete claimed class slot before treating a profile as class-valid', () => {
    expect(hasCompleteClassClaim(claim)).toBe(true);
    expect(hasCompleteClassClaim({ ...claim, status: 'already_claimed' })).toBe(false);
    expect(hasCompleteClassClaim({ ...claim, rosterStudentId: undefined })).toBe(false);
  });

  it('rejects stale profiles whose saved class claim does not match the current claim', () => {
    expect(profileMatchesClassClaim(profile, claim)).toBe(true);
    expect(profileMatchesClassClaim(profile, { ...claim, rosterStudentId: 'roster-other' })).toBe(false);
    expect(profileMatchesClassClaim({ ...profile, classClaim: { ...claim, displayName: 'Other Student' } }, claim)).toBe(false);
  });
});
