import type {
  AppSettings,
  Attempt,
  AttemptMarkBreakdown,
  AttemptPartScore,
  AvatarSettings,
  IssueReport,
  IssueType,
  LearningActivityAttempt,
  LearningActivityOutcome,
  LearningActivityType,
  MistakeType,
  PaperFamily,
  RegionRank,
  RegionLearningRecord,
  StoredProgress,
  StudentClaimState,
  StudentProfile,
  TopicProfile,
} from '../types';
import type { MasteryEvidenceReadinessStatus } from '../types';
import { DEFAULT_AVATAR_SETTINGS, normalizeAvatarSettings } from './avatarStore';
import { updateTopicProfile } from './mastery';
import { filterMasteryEvidence } from './masteryEvidence';
import type { ProgressStorageAdapter, RegionGuardianAttemptRecordInput } from './progressAdapter';

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
const knownMasteryEvidenceReadinessStatuses: MasteryEvidenceReadinessStatus[] = [
  'precise_skill_evidence',
  'broad_region_evidence_only',
  'practice_only_insufficient_part_mapping',
  'rejected_unsafe_route',
  'rejected_ambiguous_without_part_mapping',
];

const knownIssueTypes: IssueType[] = [
  'question_image_missing',
  'mark_scheme_image_missing',
  'image_crop_wrong',
  'wrong_topic',
  'mark_scheme_mismatch',
  'unreadable_image',
  'duplicate_question',
  'app_bug',
  'other',
];

const knownLearningActivityTypes: LearningActivityType[] = ['quick_check', 'warm_up'];
const knownLearningActivityOutcomes: LearningActivityOutcome[] = ['got_it', 'partial', 'missed'];

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

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.map((item) => typeof item === 'string' ? item : undefined)
    .filter((item): item is string => Boolean(item));
  return strings.length ? Array.from(new Set(strings)) : undefined;
}

function normalizeSettings(value: unknown): AppSettings {
  if (!isRecord(value) || typeof value.activePaperFamily !== 'string') return defaultSettings;
  return { activePaperFamily: value.activePaperFamily as PaperFamily };
}

function normalizeStudentClaim(value: unknown): StudentClaimState | undefined {
  if (!isRecord(value)) return undefined;
  const status = optionalString(value.status);
  const message = optionalString(value.message);
  if (!status || !message) return undefined;
  if (!['unclaimed', 'claimed', 'invalid_class_code', 'roster_name_not_found', 'already_claimed', 'archived'].includes(status)) return undefined;
  return {
    status: status as StudentClaimState['status'],
    classId: optionalString(value.classId),
    className: optionalString(value.className),
    classCode: optionalString(value.classCode),
    teacherId: optionalString(value.teacherId),
    teacherName: optionalString(value.teacherName),
    rosterStudentId: optionalString(value.rosterStudentId),
    displayName: optionalString(value.displayName),
    message,
  };
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
  return {
    id,
    realName,
    classGroup,
    teacherName,
    avatarName,
    avatarId: optionalString(value.avatarId),
    onboardingCompleted: optionalBoolean(value.onboardingCompleted),
    onboardingCompletedAt: optionalString(value.onboardingCompletedAt),
    classClaim: normalizeStudentClaim(value.classClaim),
    createdAt,
    updatedAt,
  };
}

function normalizeMarkBreakdown(value: unknown): AttemptMarkBreakdown | undefined {
  if (!isRecord(value)) return undefined;
  if (!isFiniteNumber(value.m) || !isFiniteNumber(value.b) || !isFiniteNumber(value.a)) return undefined;
  return { m: value.m, b: value.b, a: value.a };
}

function normalizeAttemptPartScores(value: unknown): AttemptPartScore[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const scores = value.map((item) => {
    if (!isRecord(item)) return undefined;
    const label = optionalString(item.label);
    const marksEarned = optionalNumber(item.marksEarned);
    const marksAvailable = optionalNumber(item.marksAvailable);
    const markBreakdown = normalizeMarkBreakdown(item.markBreakdown);
    if (!label || marksEarned === undefined || marksAvailable === undefined) return undefined;
    const score: AttemptPartScore = {
      label,
      marksEarned,
      marksAvailable,
      ...(optionalString(item.partId) ? { partId: optionalString(item.partId) } : {}),
      ...(optionalString(item.subpartId) ? { subpartId: optionalString(item.subpartId) } : {}),
    };
    if (markBreakdown) score.markBreakdown = markBreakdown;
    return score;
  }).filter((item): item is AttemptPartScore => Boolean(item));
  return scores.length ? scores : undefined;
}

function normalizeMistakeType(value: unknown): MistakeType | undefined {
  return typeof value === 'string' && knownMistakeTypes.includes(value as MistakeType)
    ? value as MistakeType
    : undefined;
}

function normalizeMistakeTypes(value: unknown, legacyMistakeType?: MistakeType): MistakeType[] {
  const normalized = Array.isArray(value)
    ? value.map(normalizeMistakeType).filter((type): type is MistakeType => Boolean(type) && type !== 'no_issue')
    : [];
  if (normalized.length === 0 && legacyMistakeType && legacyMistakeType !== 'no_issue') {
    normalized.push(legacyMistakeType);
  }
  return Array.from(new Set(normalized));
}

function normalizeRegionRank(value: unknown): RegionRank | undefined {
  return typeof value === 'string' && knownRegionRanks.includes(value as RegionRank)
    ? value as RegionRank
    : undefined;
}

function normalizeMasteryEvidenceReadinessStatus(value: unknown): MasteryEvidenceReadinessStatus | undefined {
  return typeof value === 'string' && knownMasteryEvidenceReadinessStatuses.includes(value as MasteryEvidenceReadinessStatus)
    ? value as MasteryEvidenceReadinessStatus
    : undefined;
}

function normalizeIssueType(value: unknown): IssueType | undefined {
  return typeof value === 'string' && knownIssueTypes.includes(value as IssueType)
    ? value as IssueType
    : undefined;
}

function normalizeLearningActivityType(value: unknown): LearningActivityType | undefined {
  return typeof value === 'string' && knownLearningActivityTypes.includes(value as LearningActivityType)
    ? value as LearningActivityType
    : undefined;
}

function normalizeLearningActivityOutcome(value: unknown): LearningActivityOutcome | undefined {
  return typeof value === 'string' && knownLearningActivityOutcomes.includes(value as LearningActivityOutcome)
    ? value as LearningActivityOutcome
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
  const marksAvailable = optionalNumber(value.marksAvailable);
  const scoreRatio = optionalNumber(value.scoreRatio);
  const mistakeType = normalizeMistakeType(value.mistakeType);
  const mistakeTypes = normalizeMistakeTypes(value.mistakeTypes, mistakeType);
  const timeSpentSeconds = optionalNumber(value.timeSpentSeconds);
  const markSchemeRevealed = optionalBoolean(value.markSchemeRevealed);
  const attemptedAt = optionalString(value.attemptedAt);
  const isFullScore = (marksAvailable !== undefined && marksAvailable > 0 && marksEarned === marksAvailable) || scoreRatio === 1;
  const fullScoreConfirmed = optionalBoolean(value.fullScoreConfirmed) === true && isFullScore;
  const hasReflectionEvidence = mistakeTypes.length > 0 || mistakeType === 'no_issue' || fullScoreConfirmed;

  if (!id || !profileId || !questionId || !paperFamily || !topicDisplayName || marksEarned === undefined || !hasReflectionEvidence || timeSpentSeconds === undefined || markSchemeRevealed === undefined || !attemptedAt) {
    return undefined;
  }

  const markBreakdown = normalizeMarkBreakdown(value.markBreakdown);
  const partScores = normalizeAttemptPartScores(value.partScores);
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
    partScores,
    marksAvailable,
    scoreRatio,
    mistakeType,
    mistakeTypes,
    fullScoreConfirmed: fullScoreConfirmed || undefined,
    note: optionalString(value.note),
    timeSpentSeconds,
    markSchemeRevealed,
    attemptedAt,
    masteryEligible: optionalBoolean(value.masteryEligible),
    masteryEvidenceReadiness: normalizeMasteryEvidenceReadinessStatus(value.masteryEvidenceReadiness),
    masteryEvidenceReasonCodes: stringArray(value.masteryEvidenceReasonCodes),
    guardianEligible: optionalBoolean(value.guardianEligible),
    validatedRegionId: optionalString(value.validatedRegionId),
    displayRegionId: optionalString(value.displayRegionId),
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

function normalizeLearningActivityAttempt(value: unknown): LearningActivityAttempt | undefined {
  if (!isRecord(value)) return undefined;
  const id = optionalString(value.id);
  const regionId = optionalString(value.regionId);
  const activityType = normalizeLearningActivityType(value.activityType);
  const activityId = optionalString(value.activityId);
  const prompt = optionalString(value.prompt);
  const learnerResponse = optionalString(value.learnerResponse);
  const revealedEarly = optionalBoolean(value.revealedEarly);
  const outcome = normalizeLearningActivityOutcome(value.outcome);
  const confidence = optionalNumber(value.confidence);
  const createdAt = optionalString(value.createdAt);
  const completedAt = optionalString(value.completedAt);

  if (
    !id
    || !regionId
    || !activityType
    || !activityId
    || !prompt
    || learnerResponse === undefined
    || revealedEarly === undefined
    || !outcome
    || confidence === undefined
    || confidence < 1
    || confidence > 5
    || !createdAt
    || !completedAt
  ) {
    return undefined;
  }

  return {
    id,
    profileId: optionalString(value.profileId),
    regionId,
    regionName: optionalString(value.regionName),
    activityType,
    activityId,
    sourceId: optionalString(value.sourceId),
    topic: optionalString(value.topic),
    skillTargetId: optionalString(value.skillTargetId),
    prompt,
    learnerResponse,
    revealedEarly,
    outcome,
    confidence,
    errorType: normalizeMistakeType(value.errorType),
    createdAt,
    completedAt,
  };
}

function normalizeRegionLearningRecord(regionId: string, value: unknown): RegionLearningRecord | undefined {
  if (!isRecord(value)) return undefined;
  if (!regionId) return undefined;
  return {
    regionId,
    fieldGuideStartedAt: optionalString(value.fieldGuideStartedAt),
    fieldGuideCompletedAt: optionalString(value.fieldGuideCompletedAt),
    guardianQuestionId: optionalString(value.guardianQuestionId),
    guardianAttemptId: optionalString(value.guardianAttemptId),
    guardianAttemptedAt: optionalString(value.guardianAttemptedAt),
    guardianClearedAt: optionalString(value.guardianClearedAt),
    updatedAt: optionalString(value.updatedAt) ?? optionalString(value.fieldGuideCompletedAt) ?? optionalString(value.guardianAttemptedAt) ?? new Date(0).toISOString(),
  };
}

function normalizeRegionLearningMap(value: unknown): Record<string, RegionLearningRecord> {
  if (!isRecord(value)) return {};
  return Object.entries(value).reduce<Record<string, RegionLearningRecord>>((records, [regionId, record]) => {
    const normalized = normalizeRegionLearningRecord(regionId, record);
    if (normalized) records[normalized.regionId] = normalized;
    return records;
  }, {});
}

function rebuildTopicProfiles(attempts: Attempt[]): Record<string, TopicProfile> {
  return filterMasteryEvidence({ attempts }).reduce<Record<string, TopicProfile>>((profiles, evidence) => ({
    ...profiles,
    [evidence.topic]: updateTopicProfile(profiles[evidence.topic], evidence),
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
    learningActivityAttempts: [],
    topicProfiles: {},
    issueReports: [],
    regionLearning: {},
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

  const learningActivityAttempts = Array.isArray(value.learningActivityAttempts)
    ? value.learningActivityAttempts.map(normalizeLearningActivityAttempt).filter((attempt): attempt is LearningActivityAttempt => Boolean(attempt))
    : [];

  return {
    schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
    profile: normalizeProfile(value.profile),
    avatar: normalizeAvatarSettings(isRecord(value.avatar) ? value.avatar : undefined),
    attempts,
    learningActivityAttempts,
    topicProfiles: rebuildTopicProfiles(attempts),
    issueReports,
    regionLearning: normalizeRegionLearningMap(value.regionLearning),
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

function updateRegionLearningRecord(
  regionId: string,
  update: (current: RegionLearningRecord | undefined, now: string) => RegionLearningRecord,
): StoredProgress {
  const progress = loadLocalProgress();
  const now = new Date().toISOString();
  const current = progress.regionLearning?.[regionId];
  const nextRecord = update(current, now);
  return saveLocalProgress({
    ...progress,
    regionLearning: {
      ...(progress.regionLearning ?? {}),
      [regionId]: nextRecord,
    },
  });
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

  addLearningActivityAttempt(attempt: LearningActivityAttempt): StoredProgress {
    const progress = loadLocalProgress();
    return saveLocalProgress({
      ...progress,
      learningActivityAttempts: [...progress.learningActivityAttempts, attempt],
    });
  },

  addIssueReport(issueReport: IssueReport): StoredProgress {
    const progress = loadLocalProgress();
    return saveLocalProgress({
      ...progress,
      issueReports: [...progress.issueReports, issueReport],
    });
  },

  startRegionFieldGuide(regionId: string): StoredProgress {
    return updateRegionLearningRecord(regionId, (current, now) => ({
      ...current,
      regionId,
      fieldGuideStartedAt: current?.fieldGuideStartedAt ?? now,
      updatedAt: now,
    }));
  },

  completeRegionFieldGuide(regionId: string): StoredProgress {
    return updateRegionLearningRecord(regionId, (current, now) => ({
      ...current,
      regionId,
      fieldGuideStartedAt: current?.fieldGuideStartedAt ?? now,
      fieldGuideCompletedAt: current?.fieldGuideCompletedAt ?? now,
      updatedAt: now,
    }));
  },

  recordRegionGuardianAttempt(input: RegionGuardianAttemptRecordInput): StoredProgress {
    return updateRegionLearningRecord(input.regionId, (current, now) => {
      const attemptedAt = input.attemptedAt ?? now;
      return {
        ...current,
        regionId: input.regionId,
        guardianQuestionId: input.questionId,
        guardianAttemptId: input.attemptId,
        guardianAttemptedAt: attemptedAt,
        guardianClearedAt: input.passed ? (current?.guardianClearedAt ?? attemptedAt) : current?.guardianClearedAt,
        updatedAt: now,
      };
    });
  },

  clearLocalDemoProgress(): StoredProgress {
    browserStorage()?.removeItem(LOCAL_PROGRESS_STORAGE_KEY);
    return emptyProgress();
  },
};
