import type { Attempt, AvatarSettings, IssueReport, LearningActivityAttempt, StoredProgress, StudentProfile } from '../types';

export type ProgressStorageMode = 'local' | 'hosted';

export interface RegionGuardianAttemptRecordInput {
  regionId: string;
  questionId: string;
  attemptId: string;
  passed: boolean;
  attemptedAt?: string;
}

export interface ProgressStorageAdapter {
  mode: ProgressStorageMode;
  loadProgressContext(): StoredProgress;
  saveProfile(profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>, current?: StudentProfile): StoredProgress;
  saveAvatarSettings(settings: AvatarSettings): StoredProgress;
  addAttempt(attempt: Attempt): StoredProgress;
  addLearningActivityAttempt(attempt: LearningActivityAttempt): StoredProgress;
  addIssueReport(issueReport: IssueReport): StoredProgress;
  startRegionFieldGuide(regionId: string): StoredProgress;
  completeRegionFieldGuide(regionId: string): StoredProgress;
  recordRegionGuardianAttempt(input: RegionGuardianAttemptRecordInput): StoredProgress;
  clearLocalDemoProgress(): StoredProgress;
}
