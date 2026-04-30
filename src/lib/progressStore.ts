import type { AppSettings, Attempt, AvatarSettings, IssueReport, StoredProgress, StudentProfile, TopicProfile } from '../types';
import { updateTopicProfile } from './mastery';

const STORAGE_KEY = 'asterion.progress.v1';

const defaultAvatar: AvatarSettings = { palette: 'ember', crest: 'star' };
const defaultSettings: AppSettings = { activePaperFamily: 'p3' };

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyProgress(): StoredProgress {
  return {
    avatar: defaultAvatar,
    attempts: [],
    topicProfiles: {},
    issueReports: [],
    settings: defaultSettings,
  };
}

export function loadProgress(): StoredProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    return {
      avatar: parsed.avatar ?? defaultAvatar,
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      topicProfiles: parsed.topicProfiles ?? {},
      issueReports: Array.isArray(parsed.issueReports) ? parsed.issueReports : [],
      settings: parsed.settings ?? defaultSettings,
      profile: parsed.profile,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: StoredProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function saveProfile(profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>, current?: StudentProfile): StoredProgress {
  const now = new Date().toISOString();
  const progress = loadProgress();
  progress.profile = {
    ...profile,
    id: current?.id ?? createId('profile'),
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
  saveProgress(progress);
  return progress;
}

export function saveAvatar(avatar: AvatarSettings): StoredProgress {
  const progress = loadProgress();
  progress.avatar = avatar;
  saveProgress(progress);
  return progress;
}

export function addAttempt(attempt: Attempt): StoredProgress {
  const progress = loadProgress();
  progress.attempts = [...progress.attempts, attempt];
  progress.topicProfiles = {
    ...progress.topicProfiles,
    [attempt.topicDisplayName]: updateTopicProfile(progress.topicProfiles[attempt.topicDisplayName], attempt),
  };
  saveProgress(progress);
  return progress;
}

export function addIssueReport(report: IssueReport): StoredProgress {
  const progress = loadProgress();
  progress.issueReports = [...progress.issueReports, report];
  saveProgress(progress);
  return progress;
}

export function clearProgress(): StoredProgress {
  localStorage.removeItem(STORAGE_KEY);
  return emptyProgress();
}

export type { TopicProfile };
