import type { Attempt, LearningActivityAttempt, StudentLevelUpRecord, StudentXpEventType, StudentXpLedgerEntry, StudentXpProgress, StoredProgress } from '../types';

export const FIRST_WIN_REGION_ID = 'algebra-forge';

export const STUDENT_XP_REWARDS: Record<StudentXpEventType, number> = {
  field_guide_topic_complete: 60,
  skill_practice_check_complete: 25,
  exam_training_attempt_saved: 35,
  first_topic_complete_bonus: 50,
};

export const STUDENT_LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 220 },
  { level: 4, xp: 360 },
  { level: 5, xp: 530 },
] as const;

export function levelForXp(totalXp: number): number {
  const safeXp = Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0;
  return STUDENT_LEVEL_THRESHOLDS.reduce((level, threshold) => (
    safeXp >= threshold.xp ? threshold.level : level
  ), 1);
}

function isXpEventType(value: unknown): value is StudentXpEventType {
  return typeof value === 'string' && value in STUDENT_XP_REWARDS;
}

function normalizeLedgerEntry(value: unknown): StudentXpLedgerEntry | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.eventId !== 'string' || !isXpEventType(record.type)) return undefined;
  const xp = typeof record.xp === 'number' && Number.isFinite(record.xp) ? Math.max(0, Math.round(record.xp)) : STUDENT_XP_REWARDS[record.type];
  const createdAt = typeof record.createdAt === 'string' ? record.createdAt : new Date(0).toISOString();
  return {
    eventId: record.eventId,
    type: record.type,
    xp,
    createdAt,
    regionId: typeof record.regionId === 'string' ? record.regionId : undefined,
    activityId: typeof record.activityId === 'string' ? record.activityId : undefined,
    attemptId: typeof record.attemptId === 'string' ? record.attemptId : undefined,
    description: typeof record.description === 'string' ? record.description : undefined,
  };
}

export function normalizeStudentXpProgress(value: unknown): StudentXpProgress {
  const ledger = Array.isArray((value as { ledger?: unknown } | undefined)?.ledger)
    ? ((value as { ledger: unknown[] }).ledger)
      .map(normalizeLedgerEntry)
      .filter((entry): entry is StudentXpLedgerEntry => Boolean(entry))
    : [];
  const uniqueLedger = Array.from(new Map(ledger.map((entry) => [entry.eventId, entry])).values());
  const totalXp = uniqueLedger.reduce((sum, entry) => sum + entry.xp, 0);
  const rawLastLevelUp = (value as { lastLevelUp?: unknown } | undefined)?.lastLevelUp;
  const lastLevelUp = rawLastLevelUp && typeof rawLastLevelUp === 'object' && !Array.isArray(rawLastLevelUp)
    ? rawLastLevelUp as Record<string, unknown>
    : undefined;
  const normalizedLastLevelUp: StudentLevelUpRecord | undefined = lastLevelUp
    && typeof lastLevelUp.fromLevel === 'number'
    && typeof lastLevelUp.toLevel === 'number'
    && typeof lastLevelUp.eventId === 'string'
    && typeof lastLevelUp.createdAt === 'string'
    ? {
        fromLevel: lastLevelUp.fromLevel,
        toLevel: lastLevelUp.toLevel,
        eventId: lastLevelUp.eventId,
        createdAt: lastLevelUp.createdAt,
      }
    : undefined;
  return {
    totalXp,
    level: levelForXp(totalXp),
    ledger: uniqueLedger,
    lastLevelUp: normalizedLastLevelUp,
  };
}

export function fieldGuideXpEventId(regionId: string): string {
  return `field-guide-topic-complete:${regionId}`;
}

export function firstTopicBonusXpEventId(regionId: string): string {
  return `first-topic-complete-bonus:${regionId}`;
}

export function skillPracticeXpEventId(attempt: LearningActivityAttempt): string {
  return `skill-practice-check-complete:${attempt.regionId}:${attempt.activityType}:${attempt.activityId}`;
}

export function examTrainingXpEventId(attempt: Attempt): string {
  return `exam-training-attempt-saved:${attempt.id}`;
}

interface AwardXpEventInput {
  eventId: string;
  type: StudentXpEventType;
  createdAt: string;
  regionId?: string;
  activityId?: string;
  attemptId?: string;
  description?: string;
}

export function awardXpEvents(progress: StoredProgress, events: AwardXpEventInput[]): StoredProgress {
  let xp = normalizeStudentXpProgress(progress.xp);
  let lastLevelUp = xp.lastLevelUp;

  for (const event of events) {
    if (xp.ledger.some((entry) => entry.eventId === event.eventId)) continue;
    const beforeLevel = xp.level;
    const entry: StudentXpLedgerEntry = {
      eventId: event.eventId,
      type: event.type,
      xp: STUDENT_XP_REWARDS[event.type],
      createdAt: event.createdAt,
      regionId: event.regionId,
      activityId: event.activityId,
      attemptId: event.attemptId,
      description: event.description,
    };
    const ledger = [...xp.ledger, entry];
    const totalXp = ledger.reduce((sum, item) => sum + item.xp, 0);
    const nextLevel = levelForXp(totalXp);
    lastLevelUp = nextLevel > beforeLevel
      ? { fromLevel: beforeLevel, toLevel: nextLevel, eventId: entry.eventId, createdAt: entry.createdAt }
      : lastLevelUp;
    xp = {
      totalXp,
      level: nextLevel,
      ledger,
      lastLevelUp,
    };
  }

  return { ...progress, xp };
}

export function fieldGuideCompletionXpEvents(regionId: string, completedAt: string): AwardXpEventInput[] {
  const events: AwardXpEventInput[] = [{
    eventId: fieldGuideXpEventId(regionId),
    type: 'field_guide_topic_complete',
    createdAt: completedAt,
    regionId,
    description: 'Field Guide topic complete',
  }];
  if (regionId === FIRST_WIN_REGION_ID) {
    events.push({
      eventId: firstTopicBonusXpEventId(regionId),
      type: 'first_topic_complete_bonus',
      createdAt: completedAt,
      regionId,
      description: 'First topic complete',
    });
  }
  return events;
}

export function skillPracticeCompletionXpEvent(attempt: LearningActivityAttempt): AwardXpEventInput {
  return {
    eventId: skillPracticeXpEventId(attempt),
    type: 'skill_practice_check_complete',
    createdAt: attempt.completedAt,
    regionId: attempt.regionId,
    activityId: attempt.activityId,
    description: 'Skill Check item complete',
  };
}

export function examTrainingAttemptXpEvent(attempt: Attempt): AwardXpEventInput {
  return {
    eventId: examTrainingXpEventId(attempt),
    type: 'exam_training_attempt_saved',
    createdAt: attempt.attemptedAt,
    regionId: attempt.validatedRegionId ?? attempt.displayRegionId,
    attemptId: attempt.id,
    description: 'Exam Training attempt saved',
  };
}
