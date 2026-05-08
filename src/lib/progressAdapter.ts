import type { Attempt, AvatarSettings, IssueReport, StoredProgress, StudentProfile } from '../types';

export type ProgressStorageMode = 'local' | 'hosted';

export interface ProgressStorageAdapter {
  mode: ProgressStorageMode;
  loadProgressContext(): StoredProgress;
  saveProfile(profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>, current?: StudentProfile): StoredProgress;
  saveAvatarSettings(settings: AvatarSettings): StoredProgress;
  addAttempt(attempt: Attempt): StoredProgress;
  addIssueReport(issueReport: IssueReport): StoredProgress;
  clearLocalDemoProgress(): StoredProgress;
}
