import type { StudentClaimState } from '../types';

export const PENDING_CLASS_CLAIM_STORAGE_KEY = 'asterion.pendingClassClaim.v1';

function storage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function normalizePendingClassClaim(value: unknown): StudentClaimState | undefined {
  if (!isRecord(value)) return undefined;
  if (value.status !== 'claimed') return undefined;
  const classId = optionalString(value.classId);
  const className = optionalString(value.className);
  const classCode = optionalString(value.classCode);
  const teacherId = optionalString(value.teacherId);
  const teacherName = optionalString(value.teacherName);
  const rosterStudentId = optionalString(value.rosterStudentId);
  const displayName = optionalString(value.displayName);
  const message = optionalString(value.message);
  if (!classId || !className || !classCode || !teacherId || !teacherName || !rosterStudentId || !displayName || !message) return undefined;
  return {
    status: 'claimed',
    classId,
    className,
    classCode,
    teacherId,
    teacherName,
    rosterStudentId,
    displayName,
    message,
  };
}

export function loadPendingClassClaim(): StudentClaimState | undefined {
  try {
    const raw = storage()?.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY);
    if (!raw) return undefined;
    return normalizePendingClassClaim(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export function savePendingClassClaim(claim: StudentClaimState): StudentClaimState | undefined {
  const normalized = normalizePendingClassClaim(claim);
  if (!normalized) return undefined;
  storage()?.setItem(PENDING_CLASS_CLAIM_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearPendingClassClaim(): void {
  storage()?.removeItem(PENDING_CLASS_CLAIM_STORAGE_KEY);
}
