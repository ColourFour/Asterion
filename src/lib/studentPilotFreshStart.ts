import { LOCAL_PROGRESS_STORAGE_KEY } from './localProgressAdapter';
import { PENDING_CLASS_CLAIM_STORAGE_KEY } from './studentClassClaimStore';

export const STUDENT_PILOT_FRESH_START_PARAMS = ['fresh', 'resetOnboarding'] as const;

export interface StudentPilotFreshStartResult {
  requested: boolean;
  resetApplied: boolean;
  resetKeys: string[];
}

function browserStorage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}

export function isStudentPilotFreshStartRequested(search: string): boolean {
  const params = new URLSearchParams(search);
  return STUDENT_PILOT_FRESH_START_PARAMS.some((key) => params.get(key) === '1');
}

export function isStudentPilotEntryPath(pathname: string): boolean {
  return pathname === '/student-pilot' || pathname === '/student-pilot/';
}

export function resetStudentPilotFreshStartState(storage: Storage | undefined = browserStorage()): string[] {
  // Fresh student-pilot preview is browser-local only. It clears the saved
  // local profile/progress and any in-progress mock roster claim, but never
  // touches Supabase auth/session keys or hosted classroom records.
  const resetKeys = [
    LOCAL_PROGRESS_STORAGE_KEY,
    PENDING_CLASS_CLAIM_STORAGE_KEY,
  ];
  for (const key of resetKeys) {
    storage?.removeItem(key);
  }
  return resetKeys;
}

export function prepareStudentPilotFreshStart(input: {
  pathname: string;
  hash: string;
  search: string;
  appProfile: string;
  claimSource: string;
  storage?: Storage;
}): StudentPilotFreshStartResult {
  const studentEntryRoute = isStudentPilotEntryPath(input.pathname) || input.hash === '#/student' || input.hash === '#/student/';
  const requested = input.appProfile === 'student-pilot'
    && input.claimSource === 'mock'
    && studentEntryRoute
    && isStudentPilotFreshStartRequested(input.search);

  if (!requested) {
    return { requested: false, resetApplied: false, resetKeys: [] };
  }

  return {
    requested: true,
    resetApplied: true,
    resetKeys: resetStudentPilotFreshStartState(input.storage),
  };
}
