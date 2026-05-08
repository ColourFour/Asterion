import type { Attempt, AvatarSettings, IssueReport, StoredProgress, StudentProfile, TopicProfile } from '../types';
import {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  LOCAL_PROGRESS_STORAGE_KEY,
  createId,
  emptyProgress,
  localProgressAdapter,
  loadLocalProgress,
  normalizeStoredProgress,
  saveLocalProgress,
} from './localProgressAdapter';
import type { ProgressStorageAdapter } from './progressAdapter';

export function getProgressStorageAdapter(): ProgressStorageAdapter {
  return localProgressAdapter;
}

export function loadProgress(): StoredProgress {
  return getProgressStorageAdapter().loadProgressContext();
}

export function saveProgress(progress: StoredProgress): void {
  saveLocalProgress(progress);
}

export function saveProfile(profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>, current?: StudentProfile): StoredProgress {
  return getProgressStorageAdapter().saveProfile(profile, current);
}

export function saveAvatar(avatar: AvatarSettings): StoredProgress {
  return getProgressStorageAdapter().saveAvatarSettings(avatar);
}

export function addAttempt(attempt: Attempt): StoredProgress {
  return getProgressStorageAdapter().addAttempt(attempt);
}

export function addIssueReport(report: IssueReport): StoredProgress {
  return getProgressStorageAdapter().addIssueReport(report);
}

export function clearProgress(): StoredProgress {
  return getProgressStorageAdapter().clearLocalDemoProgress();
}

export {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  LOCAL_PROGRESS_STORAGE_KEY,
  createId,
  emptyProgress,
  loadLocalProgress,
  localProgressAdapter,
  normalizeStoredProgress,
};

export type { ProgressStorageAdapter, TopicProfile };
