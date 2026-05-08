import type {
  AppSettings,
  Attempt,
  AttemptMarkBreakdown,
  AvatarSettings,
  IssueReport,
  IssueType,
  MistakeType,
  PaperFamily,
  RegionRank,
  StoredProgress,
  StudentProfile,
  TopicProfile,
} from '../types';
import { DEFAULT_AVATAR_SETTINGS, normalizeAvatarSettings } from './avatarStore';
import { updateTopicProfile } from './mastery';
import type { ProgressStorageAdapter } from './progressAdapter';

export const CURRENT_PROGRESS_SCHEMA_VERSION = 1;
export const LOCAL_PROGRESS_STORAGE_KEY = 'asterion.progress.v1';

const defaultSettings: AppSettings = { activePaperFamily: 'p3' };

const knownMistakeTypes: MistakeType[] = [
  'no_issue',
  'did_not_know_method',
  'algebra_error',
  'misread_question',
  'formula_issue',
  'diagram_or_modeling_issue',
  'ran_out_of_time',
  'rounding_accuracy',
  'could_not_start',
  'slow_method',
  'lucky_or_unsure',
  'other',
];

const knownRegionRanks: RegionRank[] = ['Dormant', 'Discovered', 'Bronze', 'Silver', 'Gold', 'Mastered'];

const knownIssueTypes: IssueType[] = [
  'question_image_missing',
  'mark_scheme_image_missing',
  'image_crop_wrong',
  'wrong_topic',
  'wrong_difficulty',
  'mark_scheme_mismatch',
  'unreadable_image',
  'duplicate_question',
  'app_bug',
  'other',
];

function browserStorage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeSettings(value: unknown): AppSettings {
  if (!isRecord(value) || typeof value.activePaperFamily !== 'string') return defaultSettings;
  return { activePaperFamily: value.activePaperFamily as PaperFamily };
}

function normalizeProfile(value: unknown): StudentProfile | undefined {
  if (!isRecord(value)) return undefined;
  const id = optionalString(value.id);
  const realName = optionalString(value.realName);
  const classGroup = optionalString(value.classGroup);
  const teacherName = optionalString(value.teacherName);
  const avatarName = optionalString(value.avatarName);
  const createdAt = optionalString(value.createdAt);
  const updatedAt = optionalString(value.updatedAt);
  if (!id || !realName || !classGroup || !teacherName || !avatarName || !createdAt || !updatedAt) return undefined;
  return { id, realName, classGroup, teacherName, avatarName, createdAt, updatedAt };
}

function normalizeMarkBreakdown(value: unknown): AttemptMarkBreakdown | undefined {
  if (!isRecord(value)) return undefined;
  if (!isFiniteNumber(value.m) || !isFiniteNumber(value.b) || !isFiniteNumber(value.a)) return undefined;
  return { m: value.m, b: value.b, a: value.a };
}

function normalizeMistakeType(value: unknown): MistakeType | undefined {
  return typeof value === 'string' && knownMistakeTypes.includes(value as MistakeType)
    ? value as MistakeType
    : undefined;
}

function normalizeRegionRank(value: unknown): RegionRank | undefined {
  return typeof value === 'string' && knownRegionRanks.includes(value as RegionRank)
    ? value as RegionRank
    : undefined;
}

function normalizeIssueType(value: unknown): IssueType | undefined {
  return typeof value === 'string' && knownIssueTypes.includes(value as IssueType)
    ? value as IssueType
    : undefined;
}

function normalizeAttempt(value: unknown): Attempt | undefined {
  if (!isRecord(value)) return undefined;

  const id = optionalString(value.id);
  const profileId = optionalString(value.profileId);
  const questionId = optionalString(value.questionId);
  const paperFamily = optionalString(value.paperFamily);
  const topicDisplayName = optionalString(value.topicDisplayName);
  const marksEarned = optionalNumber(value.marksEarned);
  const mistakeType = normalizeMistakeType(value.mistakeType);
  const timeSpentSeconds = optionalNumber(value.timeSpentSeconds);
  const markSchemeRevealed = optionalBoolean(value.markSchemeRevealed);
  const attemptedAt = optionalString(value.attemptedAt);

  if (!id || !profileId || !questionId || !paperFamily || !topicDisplayName || marksEarned === undefined || !mistakeType || timeSpentSeconds === undefined || markSchemeRevealed === undefined || !attemptedAt) {
    return undefined;
  }

  const markBreakdown = normalizeMarkBreakdown(value.markBreakdown);
  return {
    id,
    profileId,
    questionId,
    paperFamily,
    paper: optionalString(value.paper),
    questionNumber: optionalString(value.questionNumber),
    topicDisplayName,
    localTopic: optionalString(value.localTopic),
    deepseekTopic: optionalString(value.deepseekTopic),
    subtopic: optionalString(value.subtopic),
    difficulty: optionalString(value.difficulty),
    marksEarned,
    markBreakdown,
    marksAvailable: optionalNumber(value.marksAvailable),
    scoreRatio: optionalNumber(value.scoreRatio),
    mistakeType,
    note: optionalString(value.note),
    timeSpentSeconds,
    markSchemeRevealed,
    attemptedAt,
    worldName: optionalString(value.worldName),
    regionName: optionalString(value.regionName),
    regionRankAtAttempt: normalizeRegionRank(value.regionRankAtAttempt),
  };
}

function normalizeIssueReport(value: unknown): IssueReport | undefined {
  if (!isRecord(value)) return undefined;
  const id = optionalString(value.id);
  const questionId = optionalString(value.questionId);
  const issueType = normalizeIssueType(value.issueType);
  const createdAt = optionalString(value.createdAt);
  if (!id || !questionId || !issueType || !createdAt) return undefined;
  return {
    id,
    profileId: optionalString(value.profileId),
    questionId,
    issueType,
    note: optionalString(value.note),
    createdAt,
    worldName: optionalString(value.worldName),
    regionName: optionalString(value.regionName),
  };
}

function rebuildTopicProfiles(attempts: Attempt[]): Record<string, TopicProfile> {
  return attempts.reduce<Record<string, TopicProfile>>((profiles, attempt) => ({
    ...profiles,
    [attempt.topicDisplayName]: updateTopicProfile(profiles[attempt.topicDisplayName], attempt),
  }), {});
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyProgress(): StoredProgress {
  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    avatar: normalizeAvatarSettings(DEFAULT_AVATAR_SETTINGS),
    attempts: [],
    topicProfiles: {},
    issueReports: [],
    settings: defaultSettings,
  };
}

export function normalizeStoredProgress(value: unknown): StoredProgress {
  if (!isRecord(value)) return emptyProgress();

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== undefined && (!isFiniteNumber(schemaVersion) || !Number.isInteger(schemaVersion))) {
    return emptyProgress();
  }
  if (typeof schemaVersion === 'number' && schemaVersion > CURRENT_PROGRESS_SCHEMA_VERSION) {
    return emptyProgress();
  }

  const attempts = Array.isArray(value.attempts)
    ? value.attempts.map(normalizeAttempt).filter((attempt): attempt is Attempt => Boolean(attempt))
    : [];

  const issueReports = Array.isArray(value.issueReports)
    ? value.issueReports.map(normalizeIssueReport).filter((report): report is IssueReport => Boolean(report))
    : [];

  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    profile: normalizeProfile(value.profile),
    avatar: normalizeAvatarSettings(isRecord(value.avatar) ? value.avatar : undefined),
    attempts,
    topicProfiles: rebuildTopicProfiles(attempts),
    issueReports,
    settings: normalizeSettings(value.settings),
  };
}

export function loadLocalProgress(): StoredProgress {
  try {
    const raw = browserStorage()?.getItem(LOCAL_PROGRESS_STORAGE_KEY);
    if (!raw) return emptyProgress();
    return normalizeStoredProgress(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveLocalProgress(progress: StoredProgress): StoredProgress {
  const normalized = normalizeStoredProgress(progress);
  browserStorage()?.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export const localProgressAdapter: ProgressStorageAdapter = {
  mode: 'local',

  loadProgressContext(): StoredProgress {
    return loadLocalProgress();
  },

  saveProfile(profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>, current?: StudentProfile): StoredProgress {
    const now = new Date().toISOString();
    const progress = loadLocalProgress();
    return saveLocalProgress({
      ...progress,
      profile: {
        ...profile,
        id: current?.id ?? createId('profile'),
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      },
    });
  },

  saveAvatarSettings(settings: AvatarSettings): StoredProgress {
    const progress = loadLocalProgress();
    return saveLocalProgress({
      ...progress,
      avatar: normalizeAvatarSettings(settings),
    });
  },

  addAttempt(attempt: Attempt): StoredProgress {
    const progress = loadLocalProgress();
    return saveLocalProgress({
      ...progress,
      attempts: [...progress.attempts, attempt],
    });
  },

  addIssueReport(issueReport: IssueReport): StoredProgress {
    const progress = loadLocalProgress();
    return saveLocalProgress({
      ...progress,
      issueReports: [...progress.issueReports, issueReport],
    });
  },

  clearLocalDemoProgress(): StoredProgress {
    browserStorage()?.removeItem(LOCAL_PROGRESS_STORAGE_KEY);
    return emptyProgress();
  },
};
