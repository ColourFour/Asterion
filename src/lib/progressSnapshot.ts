import type {
  Attempt,
  LearningActivityAttempt,
  NormalizedQuestion,
  RegionLearningRecord,
  RegionLearningState,
  RegionRank,
  StoredProgress,
} from '../types';
import type { P3RegionId } from './p3SkillContract';
import { isValidP3RegionId, P3_ALLOWED_REGION_IDS } from './p3SkillContract';
import { buildRegionLearningSummary } from './regionLearning';
import { calculateWorldProgress, filterAttemptsForRegion } from './regionProgress';
import { P3_ASTRAL_ACADEMY } from './worldMap';

export const PROGRESS_SNAPSHOT_CONTRACT_VERSION = 1;
export const PROGRESS_SNAPSHOT_SOURCE = 'local_student_app';
export const MAX_PROGRESS_SNAPSHOT_SUMMARY_JSON_CHARS = 2_048;
export const MAX_PROGRESS_SNAPSHOT_REGION_JSON_CHARS = 12_000;
export const MAX_PROGRESS_SNAPSHOT_TOTAL_JSON_CHARS = 16_000;

const regionIds = P3_ALLOWED_REGION_IDS as readonly P3RegionId[];
const regionIdSet = new Set<string>(regionIds);
const regionRanks: RegionRank[] = ['Dormant', 'Discovered', 'Bronze', 'Silver', 'Gold', 'Mastered'];
const regionStates: RegionLearningState[] = [
  'locked',
  'available',
  'field_guide_started',
  'field_guide_completed',
  'training_in_progress',
  'guardian_unlocked',
  'guardian_attempted',
  'guardian_cleared',
  'mastered',
  'needs_review',
];
const guardianStatuses = ['locked', 'ready', 'attempted', 'cleared', 'mastered', 'needs_review'] as const;
const fieldGuideStatuses = ['not_started', 'started', 'completed'] as const;
const accessStatuses = ['open', 'field_guide_only'] as const;

export type ProgressSnapshotGuardianStatus = typeof guardianStatuses[number];
export type ProgressSnapshotFieldGuideStatus = typeof fieldGuideStatuses[number];
export type ProgressSnapshotAccessStatus = typeof accessStatuses[number];

export interface ProgressSnapshotSummaryJson {
  schemaVersion: typeof PROGRESS_SNAPSHOT_CONTRACT_VERSION;
  paperFamily: 'p3';
  generatedAt: string;
  attemptCount: number;
  masteryEligibleAttemptCount: number;
  learningActivityAttemptCount: number;
  issueReportCount: number;
  regionsStarted: number;
  guardianReadyRegionCount: number;
  guardianClearedRegionCount: number;
  openRegionCount: number;
  fieldGuideOnlyRegionCount: number;
  lastActivityAt?: string;
}

export interface ProgressSnapshotRegionJson {
  regionId: P3RegionId;
  rank: RegionRank;
  status: RegionLearningState;
  progressRatio: number;
  attemptCount: number;
  totalMarksEarned: number;
  totalMarksAvailable: number;
  guardianStatus: ProgressSnapshotGuardianStatus;
  fieldGuideStatus: ProgressSnapshotFieldGuideStatus;
  accessStatus: ProgressSnapshotAccessStatus;
  lastActivityAt?: string;
}

export type ProgressSnapshotRegionSummaryJson = Partial<Record<P3RegionId, ProgressSnapshotRegionJson>>;

export interface ProgressSnapshotPayload {
  snapshotVersion: typeof PROGRESS_SNAPSHOT_CONTRACT_VERSION;
  source: typeof PROGRESS_SNAPSHOT_SOURCE;
  summaryJson: ProgressSnapshotSummaryJson;
  regionSummaryJson: ProgressSnapshotRegionSummaryJson;
}

export interface BuildProgressSnapshotInput {
  progress: StoredProgress;
  questions?: NormalizedQuestion[];
  regionAccess?: Partial<Record<P3RegionId, ProgressSnapshotAccessStatus>>;
  now?: string;
}

export interface ProgressSnapshotValidationResult {
  valid: boolean;
  errors: string[];
}

const summaryKeys = [
  'schemaVersion',
  'paperFamily',
  'generatedAt',
  'attemptCount',
  'masteryEligibleAttemptCount',
  'learningActivityAttemptCount',
  'issueReportCount',
  'regionsStarted',
  'guardianReadyRegionCount',
  'guardianClearedRegionCount',
  'openRegionCount',
  'fieldGuideOnlyRegionCount',
  'lastActivityAt',
] as const;

const regionSummaryKeys = [
  'regionId',
  'rank',
  'status',
  'progressRatio',
  'attemptCount',
  'totalMarksEarned',
  'totalMarksAvailable',
  'guardianStatus',
  'fieldGuideStatus',
  'accessStatus',
  'lastActivityAt',
] as const;

const payloadKeys = ['snapshotVersion', 'source', 'summaryJson', 'regionSummaryJson'] as const;

const forbiddenRawFieldNames = new Set([
  'answer',
  'answerText',
  'attempt',
  'attempts',
  'explanation',
  'imagePaths',
  'imageUrls',
  'issueReport',
  'issueReports',
  'learnerResponse',
  'learningActivityAttempts',
  'localStorage',
  'markSchemeImagePaths',
  'markSchemeImageRawPaths',
  'markSchemeImageUrls',
  'markSchemeImages',
  'note',
  'notes',
  'prompt',
  'questionImagePaths',
  'questionImageRawPaths',
  'questionImageUrls',
  'questionImages',
  'raw',
  'rawAnswer',
  'rawResponse',
  'response',
  'studentExplanation',
  'studentNote',
  'studentResponse',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
}

function jsonSize(value: unknown): number {
  return JSON.stringify(value).length;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowedKeys: readonly string[], path: string, errors: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${path}.${key} is not allowed`);
  }
}

function rejectForbiddenRawFields(value: unknown, path: string, errors: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectForbiddenRawFields(item, `${path}[${index}]`, errors));
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    if (forbiddenRawFieldNames.has(key)) errors.push(`${path}.${key} is forbidden in progress snapshots`);
    rejectForbiddenRawFields(child, `${path}.${key}`, errors);
  }
}

function validateSummaryJson(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('summaryJson must be an object');
    return;
  }

  rejectUnknownKeys(value, summaryKeys, 'summaryJson', errors);

  if (value.schemaVersion !== PROGRESS_SNAPSHOT_CONTRACT_VERSION) errors.push('summaryJson.schemaVersion is invalid');
  if (value.paperFamily !== 'p3') errors.push('summaryJson.paperFamily must be p3');
  if (!isIsoTimestamp(value.generatedAt)) errors.push('summaryJson.generatedAt must be an ISO timestamp');
  if (value.lastActivityAt !== undefined && !isIsoTimestamp(value.lastActivityAt)) errors.push('summaryJson.lastActivityAt must be an ISO timestamp');

  for (const key of [
    'attemptCount',
    'masteryEligibleAttemptCount',
    'learningActivityAttemptCount',
    'issueReportCount',
    'regionsStarted',
    'guardianReadyRegionCount',
    'guardianClearedRegionCount',
    'openRegionCount',
    'fieldGuideOnlyRegionCount',
  ]) {
    if (!isIntegerInRange(value[key], 0, 100_000)) errors.push(`summaryJson.${key} must be a bounded non-negative integer`);
  }

  if (jsonSize(value) > MAX_PROGRESS_SNAPSHOT_SUMMARY_JSON_CHARS) {
    errors.push(`summaryJson exceeds ${MAX_PROGRESS_SNAPSHOT_SUMMARY_JSON_CHARS} characters`);
  }
}

function validateRegionSummaryJson(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('regionSummaryJson must be an object');
    return;
  }

  const entries = Object.entries(value);
  if (entries.length > regionIds.length) errors.push('regionSummaryJson contains too many regions');

  for (const [regionId, summary] of entries) {
    if (!isValidP3RegionId(regionId)) {
      errors.push(`regionSummaryJson.${regionId} is not an allowed P3 region ID`);
      continue;
    }

    if (!isRecord(summary)) {
      errors.push(`regionSummaryJson.${regionId} must be an object`);
      continue;
    }

    rejectUnknownKeys(summary, regionSummaryKeys, `regionSummaryJson.${regionId}`, errors);
    if (summary.regionId !== regionId) errors.push(`regionSummaryJson.${regionId}.regionId must match its key`);
    if (!regionRanks.includes(summary.rank as RegionRank)) errors.push(`regionSummaryJson.${regionId}.rank is invalid`);
    if (!regionStates.includes(summary.status as RegionLearningState)) errors.push(`regionSummaryJson.${regionId}.status is invalid`);
    if (!guardianStatuses.includes(summary.guardianStatus as ProgressSnapshotGuardianStatus)) errors.push(`regionSummaryJson.${regionId}.guardianStatus is invalid`);
    if (!fieldGuideStatuses.includes(summary.fieldGuideStatus as ProgressSnapshotFieldGuideStatus)) errors.push(`regionSummaryJson.${regionId}.fieldGuideStatus is invalid`);
    if (!accessStatuses.includes(summary.accessStatus as ProgressSnapshotAccessStatus)) errors.push(`regionSummaryJson.${regionId}.accessStatus is invalid`);
    if (!isNumberInRange(summary.progressRatio, 0, 1)) errors.push(`regionSummaryJson.${regionId}.progressRatio must be between 0 and 1`);
    if (!isIntegerInRange(summary.attemptCount, 0, 100_000)) errors.push(`regionSummaryJson.${regionId}.attemptCount must be a bounded non-negative integer`);
    if (!isNumberInRange(summary.totalMarksEarned, 0, 1_000_000)) errors.push(`regionSummaryJson.${regionId}.totalMarksEarned must be bounded`);
    if (!isNumberInRange(summary.totalMarksAvailable, 0, 1_000_000)) errors.push(`regionSummaryJson.${regionId}.totalMarksAvailable must be bounded`);
    if ((summary.totalMarksEarned as number) > (summary.totalMarksAvailable as number)) errors.push(`regionSummaryJson.${regionId}.totalMarksEarned cannot exceed totalMarksAvailable`);
    if (summary.lastActivityAt !== undefined && !isIsoTimestamp(summary.lastActivityAt)) errors.push(`regionSummaryJson.${regionId}.lastActivityAt must be an ISO timestamp`);
  }

  if (jsonSize(value) > MAX_PROGRESS_SNAPSHOT_REGION_JSON_CHARS) {
    errors.push(`regionSummaryJson exceeds ${MAX_PROGRESS_SNAPSHOT_REGION_JSON_CHARS} characters`);
  }
}

export function validateProgressSnapshotPayload(payload: unknown): ProgressSnapshotValidationResult {
  const errors: string[] = [];
  rejectForbiddenRawFields(payload, 'payload', errors);

  if (!isRecord(payload)) {
    return { valid: false, errors: ['payload must be an object', ...errors] };
  }

  rejectUnknownKeys(payload, payloadKeys, 'payload', errors);
  if (payload.snapshotVersion !== PROGRESS_SNAPSHOT_CONTRACT_VERSION) errors.push('snapshotVersion is invalid');
  if (payload.source !== PROGRESS_SNAPSHOT_SOURCE) errors.push('source is invalid');
  validateSummaryJson(payload.summaryJson, errors);
  validateRegionSummaryJson(payload.regionSummaryJson, errors);

  if (jsonSize(payload) > MAX_PROGRESS_SNAPSHOT_TOTAL_JSON_CHARS) {
    errors.push(`payload exceeds ${MAX_PROGRESS_SNAPSHOT_TOTAL_JSON_CHARS} characters`);
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidProgressSnapshotPayload(payload: unknown): asserts payload is ProgressSnapshotPayload {
  const result = validateProgressSnapshotPayload(payload);
  if (!result.valid) {
    throw new Error(`Invalid progress snapshot payload: ${result.errors.join('; ')}`);
  }
}

function latestIso(values: Array<string | undefined>): string | undefined {
  const sorted = values
    .filter((value): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return sorted[sorted.length - 1];
}

function attemptLastActivity(attempts: Attempt[]): string | undefined {
  return latestIso(attempts.map((attempt) => attempt.attemptedAt));
}

function learningActivityLastActivity(attempts: LearningActivityAttempt[]): string | undefined {
  return latestIso(attempts.flatMap((attempt) => [attempt.createdAt, attempt.completedAt]));
}

function regionLearningLastActivity(record: RegionLearningRecord | undefined): string | undefined {
  if (!record) return undefined;
  return latestIso([
    record.fieldGuideStartedAt,
    record.fieldGuideCompletedAt,
    record.guardianAttemptedAt,
    record.guardianClearedAt,
    record.updatedAt,
  ]);
}

function fieldGuideStatus(record: RegionLearningRecord | undefined): ProgressSnapshotFieldGuideStatus {
  if (record?.fieldGuideCompletedAt) return 'completed';
  if (record?.fieldGuideStartedAt) return 'started';
  return 'not_started';
}

function guardianStatus(state: RegionLearningState): ProgressSnapshotGuardianStatus {
  if (state === 'mastered') return 'mastered';
  if (state === 'needs_review') return 'needs_review';
  if (state === 'guardian_cleared') return 'cleared';
  if (state === 'guardian_attempted') return 'attempted';
  if (state === 'guardian_unlocked') return 'ready';
  return 'locked';
}

function progressRatio(totalMarksEarned: number, totalMarksAvailable: number): number {
  if (totalMarksAvailable <= 0) return 0;
  return Math.max(0, Math.min(1, Math.round((totalMarksEarned / totalMarksAvailable) * 100) / 100));
}

function regionLearningActivities(regionId: P3RegionId, attempts: LearningActivityAttempt[]): LearningActivityAttempt[] {
  return attempts.filter((attempt) => attempt.regionId === regionId);
}

export function buildProgressSnapshotPayload(input: BuildProgressSnapshotInput): ProgressSnapshotPayload {
  const questions = input.questions ?? [];
  const now = input.now ?? new Date().toISOString();
  const worldProgress = calculateWorldProgress(questions, input.progress.attempts, P3_ASTRAL_ACADEMY, input.progress.regionLearning);
  const regionSummaryJson: ProgressSnapshotRegionSummaryJson = {};

  for (const regionProgress of worldProgress) {
    const regionId = regionProgress.region.id;
    if (!regionIdSet.has(regionId)) continue;

    const typedRegionId = regionId as P3RegionId;
    const learningRecord = input.progress.regionLearning?.[typedRegionId];
    const regionAttempts = filterAttemptsForRegion(regionProgress.region, input.progress.attempts, questions);
    const regionLearningAttempts = regionLearningActivities(typedRegionId, input.progress.learningActivityAttempts);
    const learningSummary = buildRegionLearningSummary({
      regionProgress,
      learningRecord,
      regionQuestions: questions,
      regionAttempts,
      learningActivityAttempts: regionLearningAttempts,
    });

    const lastActivityAt = latestIso([
      attemptLastActivity(regionAttempts),
      learningActivityLastActivity(regionLearningAttempts),
      regionLearningLastActivity(learningRecord),
    ]);

    regionSummaryJson[typedRegionId] = {
      regionId: typedRegionId,
      rank: regionProgress.rank,
      status: learningSummary.state,
      progressRatio: progressRatio(regionProgress.totalMarksEarned, regionProgress.totalMarksAvailable),
      attemptCount: regionProgress.attempts,
      totalMarksEarned: regionProgress.totalMarksEarned,
      totalMarksAvailable: regionProgress.totalMarksAvailable,
      guardianStatus: guardianStatus(learningSummary.state),
      fieldGuideStatus: fieldGuideStatus(learningRecord),
      accessStatus: input.regionAccess?.[typedRegionId] ?? 'open',
      ...(lastActivityAt ? { lastActivityAt } : {}),
    };
  }

  const regions = Object.values(regionSummaryJson).filter((region): region is ProgressSnapshotRegionJson => Boolean(region));
  const lastActivityAt = latestIso([
    attemptLastActivity(input.progress.attempts),
    learningActivityLastActivity(input.progress.learningActivityAttempts),
    ...Object.values(input.progress.regionLearning ?? {}).map(regionLearningLastActivity),
  ]);
  const payload: ProgressSnapshotPayload = {
    snapshotVersion: PROGRESS_SNAPSHOT_CONTRACT_VERSION,
    source: PROGRESS_SNAPSHOT_SOURCE,
    summaryJson: {
      schemaVersion: PROGRESS_SNAPSHOT_CONTRACT_VERSION,
      paperFamily: 'p3',
      generatedAt: now,
      attemptCount: input.progress.attempts.length,
      masteryEligibleAttemptCount: input.progress.attempts.filter((attempt) => attempt.masteryEligible !== false).length,
      learningActivityAttemptCount: input.progress.learningActivityAttempts.length,
      issueReportCount: input.progress.issueReports.length,
      regionsStarted: regions.filter((region) => region.attemptCount > 0 || region.fieldGuideStatus !== 'not_started' || region.guardianStatus !== 'locked').length,
      guardianReadyRegionCount: regions.filter((region) => region.guardianStatus === 'ready' || region.guardianStatus === 'attempted').length,
      guardianClearedRegionCount: regions.filter((region) => region.guardianStatus === 'cleared' || region.guardianStatus === 'mastered').length,
      openRegionCount: regions.filter((region) => region.accessStatus === 'open').length,
      fieldGuideOnlyRegionCount: regions.filter((region) => region.accessStatus === 'field_guide_only').length,
      ...(lastActivityAt ? { lastActivityAt } : {}),
    },
    regionSummaryJson,
  };

  assertValidProgressSnapshotPayload(payload);
  return payload;
}
