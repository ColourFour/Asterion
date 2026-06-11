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
}

export interface SkillCheckReviewGroup {
  mistakeTag: SkillCheckMistakeTag;
  count: number;
  candidates: SkillCheckReviewCandidate[];
}

export interface SkillCheckReviewSession {
  groups: SkillCheckReviewGroup[];
  totalCandidates: number;
}

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

export function buildSkillCheckReviewSession(
  records: unknown,
  options: { maxAttempts?: number; maxCandidatesPerGroup?: number } = {},
): SkillCheckReviewSession {
  const maxAttempts = options.maxAttempts ?? 30;
  const maxCandidatesPerGroup = options.maxCandidatesPerGroup ?? 6;
  const recentAttempts = parseSkillCheckAttemptRecords(records)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, maxAttempts);
  const groups = new Map<SkillCheckMistakeTag, SkillCheckReviewCandidate[]>();

  for (const attempt of recentAttempts) {
    const state = candidateState(attempt);
    const mistakeTags = attempt.mistakeTags.filter(isSkillCheckMistakeTag);
    if (!state || !mistakeTags.length) continue;
    const candidate: SkillCheckReviewCandidate = {
      attemptId: attempt.attemptId,
      topic: attempt.topic,
      skillId: attempt.skillId,
      checkId: attempt.checkId,
      submittedAnswer: attempt.submittedAnswer,
      timestamp: attempt.timestamp,
      state,
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
  };
}
