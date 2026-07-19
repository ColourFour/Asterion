import type { SkillCheckAttemptRecord } from '../types';
import { isSkillCheckMistakeTag, type SkillCheckMistakeTag } from './mistakeRecovery';

export interface SkillCheckReviewCandidate {
  attemptId: string;
  topic: string;
  skillId: string;
  checkId: string;
  submittedAnswer: string;
  timestamp: string;
  state: 'incorrect' | 'repaired' | 'revealed';
  repairAttemptNumber: number;
  dueAt: string;
  dueLabel: string;
  relatedSkillId: string;
  regionId?: string;
}

export interface SkillCheckReviewGroup {
  mistakeTag: SkillCheckMistakeTag;
  count: number;
  candidates: SkillCheckReviewCandidate[];
}

export interface SkillCheckReviewSession {
  groups: SkillCheckReviewGroup[];
  totalCandidates: number;
  dueCandidates: number;
}

export interface SkillCheckReviewInterval {
  days: number;
  label: string;
}

const DEFAULT_REPAIR_INTERVALS: SkillCheckReviewInterval[] = [
  { days: 2, label: '2-day repair' },
  { days: 7, label: 'next-week repair' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function booleanValue(value: unknown): boolean {
  return value === true;
}

export function parseSkillCheckAttemptRecords(records: unknown): SkillCheckAttemptRecord[] {
  if (!Array.isArray(records)) return [];
  return records.flatMap((record): SkillCheckAttemptRecord[] => {
    if (!record || typeof record !== 'object') return [];
    const item = record as Record<string, unknown>;
    const course = item.course === 'p3' ? 'p3' : undefined;
    const checkId = stringValue(item.checkId);
    const timestamp = stringValue(item.timestamp);
    if (!course || !checkId || !timestamp) return [];
    const mistakeTags = Array.isArray(item.mistakeTags)
      ? item.mistakeTags.filter((tag): tag is SkillCheckMistakeTag => typeof tag === 'string' && isSkillCheckMistakeTag(tag))
      : [];

    return [{
      attemptId: stringValue(item.attemptId),
      course,
      topic: stringValue(item.topic),
      skillId: stringValue(item.skillId),
      checkId,
      submittedAnswer: stringValue(item.submittedAnswer),
      isCorrect: booleanValue(item.isCorrect),
      usedHint: booleanValue(item.usedHint),
      revealedAnswer: booleanValue(item.revealedAnswer),
      revealedRepairStep: booleanValue(item.revealedRepairStep),
      mistakeTags,
      timestamp,
      regionId: stringValue(item.regionId) || undefined,
    }];
  });
}

function candidateState(attempt: SkillCheckAttemptRecord): SkillCheckReviewCandidate['state'] | undefined {
  if (attempt.revealedAnswer) return 'revealed';
  if (attempt.revealedRepairStep) return 'repaired';
  if (!attempt.isCorrect) return 'incorrect';
  return undefined;
}

function timestampMs(value: string): number | undefined {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

function dueTimestamp(attempt: SkillCheckAttemptRecord, interval: SkillCheckReviewInterval): number | undefined {
  const base = timestampMs(attempt.timestamp);
  return base === undefined ? undefined : base + interval.days * DAY_MS;
}

function isCleanCorrectRelatedAttempt(attempt: SkillCheckAttemptRecord, source: SkillCheckAttemptRecord): boolean {
  return attempt.course === 'p3'
    && attempt.skillId === source.skillId
    && attempt.isCorrect
    && !attempt.usedHint
    && !attempt.revealedAnswer
    && !attempt.revealedRepairStep;
}

function cleanRelatedRepairTimes(
  attempts: SkillCheckAttemptRecord[],
  source: SkillCheckAttemptRecord,
): number[] {
  const sourceAt = timestampMs(source.timestamp);
  if (sourceAt === undefined) return [];
  return attempts
    .flatMap((attempt) => {
      const attemptAt = timestampMs(attempt.timestamp);
      return attemptAt !== undefined
        && attemptAt > sourceAt
        && isCleanCorrectRelatedAttempt(attempt, source)
        ? [attemptAt]
        : [];
    })
    .sort((a, b) => a - b);
}

function completedRepairStages(
  attempts: SkillCheckAttemptRecord[],
  source: SkillCheckAttemptRecord,
  intervals: SkillCheckReviewInterval[],
): number {
  const repairTimes = cleanRelatedRepairTimes(attempts, source);
  let nextRepairIndex = 0;
  let completed = 0;

  for (const interval of intervals) {
    const dueAt = dueTimestamp(source, interval);
    if (dueAt === undefined) break;
    const repairIndex = repairTimes.findIndex((time, index) => index >= nextRepairIndex && time >= dueAt);
    if (repairIndex < 0) break;
    completed += 1;
    nextRepairIndex = repairIndex + 1;
  }

  return completed;
}

export function buildSkillCheckReviewSession(
  records: unknown,
  options: {
    maxAttempts?: number;
    maxCandidatesPerGroup?: number;
    now?: string | number | Date;
    repairIntervals?: SkillCheckReviewInterval[];
  } = {},
): SkillCheckReviewSession {
  const maxAttempts = options.maxAttempts ?? 30;
  const maxCandidatesPerGroup = options.maxCandidatesPerGroup ?? 6;
  const nowMs = options.now instanceof Date
    ? options.now.getTime()
    : typeof options.now === 'string'
      ? Date.parse(options.now)
      : typeof options.now === 'number'
        ? options.now
        : Date.now();
  const repairIntervals = options.repairIntervals ?? DEFAULT_REPAIR_INTERVALS;
  const allAttempts = parseSkillCheckAttemptRecords(records);
  const recentAttempts = allAttempts
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, maxAttempts);
  const groups = new Map<SkillCheckMistakeTag, SkillCheckReviewCandidate[]>();

  for (const attempt of recentAttempts) {
    const state = candidateState(attempt);
    const mistakeTags = attempt.mistakeTags.filter(isSkillCheckMistakeTag);
    if (!state || !mistakeTags.length) continue;
    const completedStages = completedRepairStages(allAttempts, attempt, repairIntervals);
    const nextDueInterval = repairIntervals.find((interval, index) => index >= completedStages && (dueTimestamp(attempt, interval) ?? Number.POSITIVE_INFINITY) <= nowMs);
    const dueAt = nextDueInterval ? dueTimestamp(attempt, nextDueInterval) : undefined;
    if (!nextDueInterval || dueAt === undefined) continue;
    const candidate: SkillCheckReviewCandidate = {
      attemptId: attempt.attemptId,
      topic: attempt.topic,
      skillId: attempt.skillId,
      checkId: attempt.checkId,
      submittedAnswer: attempt.submittedAnswer,
      timestamp: attempt.timestamp,
      state,
      repairAttemptNumber: repairIntervals.indexOf(nextDueInterval) + 1,
      dueAt: new Date(dueAt).toISOString(),
      dueLabel: nextDueInterval.label,
      relatedSkillId: attempt.skillId,
      regionId: attempt.regionId,
    };
    for (const tag of mistakeTags) {
      const candidates = groups.get(tag) ?? [];
      if (candidates.length < maxCandidatesPerGroup) candidates.push(candidate);
      groups.set(tag, candidates);
    }
  }

  const reviewGroups = Array.from(groups, ([mistakeTag, candidates]) => ({
    mistakeTag,
    count: candidates.length,
    candidates,
  })).sort((a, b) => b.count - a.count || a.mistakeTag.localeCompare(b.mistakeTag));

  return {
    groups: reviewGroups,
    totalCandidates: reviewGroups.reduce((sum, group) => sum + group.count, 0),
    dueCandidates: reviewGroups.reduce((sum, group) => sum + group.count, 0),
  };
}
