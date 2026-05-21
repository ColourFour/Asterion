import type { AsterionRole } from '../types';

export type HostedRoleRequirement = AsterionRole | 'student_preview';

const roleRank: Record<AsterionRole, number> = {
  student: 0,
  teacher: 1,
  admin: 2,
};

export function canAccessHostedRole(
  activeRoles: readonly AsterionRole[] | undefined,
  requiredRole: HostedRoleRequirement,
): boolean {
  const roles = activeRoles ?? [];
  if (requiredRole === 'student_preview') {
    return roles.includes('admin') || roles.includes('teacher');
  }

  const requiredRank = roleRank[requiredRole];
  return roles.some((role) => roleRank[role] >= requiredRank);
}

export function highestHostedRole(activeRoles: readonly AsterionRole[] | undefined): AsterionRole | undefined {
  return [...(activeRoles ?? [])].sort((a, b) => roleRank[b] - roleRank[a])[0];
}
