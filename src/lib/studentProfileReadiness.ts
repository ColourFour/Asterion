import type { StudentClaimState, StudentProfile } from '../types';

function hasText(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function hasCompleteOnboardingProfile(profile: StudentProfile | undefined): boolean {
  return Boolean(
    profile
    && profile.onboardingCompleted === true
    && hasText(profile.avatarName)
    && hasText(profile.avatarId),
  );
}

export function hasCompleteClassClaim(claim: StudentClaimState | undefined): claim is StudentClaimState & {
  status: 'claimed';
  classId: string;
  className: string;
  classCode: string;
  teacherId: string;
  teacherName: string;
  rosterStudentId: string;
  displayName: string;
} {
  return Boolean(
    claim?.status === 'claimed'
    && hasText(claim.classId)
    && hasText(claim.className)
    && hasText(claim.classCode)
    && hasText(claim.teacherId)
    && hasText(claim.teacherName)
    && hasText(claim.rosterStudentId)
    && hasText(claim.displayName),
  );
}

export function profileMatchesClassClaim(
  profile: StudentProfile | undefined,
  claim: StudentClaimState | undefined,
): boolean {
  if (!profile || !hasCompleteClassClaim(profile.classClaim) || !hasCompleteClassClaim(claim)) return false;

  return profile.classClaim.classId === claim.classId
    && profile.classClaim.classCode.toLowerCase() === claim.classCode.toLowerCase()
    && profile.classClaim.teacherId === claim.teacherId
    && profile.classClaim.rosterStudentId === claim.rosterStudentId
    && profile.classClaim.displayName.toLowerCase() === claim.displayName.toLowerCase();
}
