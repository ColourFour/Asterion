import { getFieldGuideTopicsForRegion } from '../data/fieldGuideTopics';
import { getSkillCheckItemsForRegion } from '../data/skillCheckItems';
import type {
  LearningActivityAttempt,
  RegionChecklistProgressSummary,
  RegionDefinition,
  RegionLearningRecord,
  TopicCompletionRecord,
} from '../types';

export interface TopicProgressRecord {
  regionId: string;
  topicId: string;
  subtopicId?: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  source: 'field_guide' | 'quick_check' | 'warm_up';
  activityId?: string;
  attemptId?: string;
}

function fieldGuideCompletionForTopic(record: RegionLearningRecord | undefined, topicId: string): TopicCompletionRecord | undefined {
  return record?.fieldGuideTopicCompletions?.[topicId];
}

export function fieldGuideTopicProgressForRegion(input: {
  regionId: string;
  learningRecord?: RegionLearningRecord;
}): TopicProgressRecord[] {
  return getFieldGuideTopicsForRegion(input.regionId).map((topic) => {
    const completion = fieldGuideCompletionForTopic(input.learningRecord, topic.id);
    return {
      regionId: input.regionId,
      topicId: topic.id,
      subtopicId: topic.id,
      title: topic.title,
      completed: Boolean(completion),
      completedAt: completion?.completedAt,
      source: 'field_guide',
    };
  });
}

function attemptCompletesTopic(
  attempt: LearningActivityAttempt,
  topicId: string,
  skillIds: string[],
  itemIds: Set<string>,
): boolean {
  if (attempt.outcome !== 'got_it') return false;
  if (attempt.topic === topicId) return true;
  if (attempt.skillTargetId && skillIds.includes(attempt.skillTargetId)) return true;
  return itemIds.has(attempt.activityId);
}

export function skillCheckTopicProgressForRegion(input: {
  regionId: string;
  learningActivityAttempts?: LearningActivityAttempt[];
}): TopicProgressRecord[] {
  const attempts = input.learningActivityAttempts ?? [];
  const itemIdsByTopic = new Map<string, Set<string>>();
  for (const item of getSkillCheckItemsForRegion(input.regionId)) {
    const ids = itemIdsByTopic.get(item.fieldGuideTopicId) ?? new Set<string>();
    ids.add(item.itemId);
    itemIdsByTopic.set(item.fieldGuideTopicId, ids);
  }

  return getFieldGuideTopicsForRegion(input.regionId).map((topic) => {
    const matchedAttempt = attempts.find((attempt) => (
      attempt.regionId === input.regionId
      && attemptCompletesTopic(attempt, topic.id, topic.skillIds, itemIdsByTopic.get(topic.id) ?? new Set())
    ));
    return {
      regionId: input.regionId,
      topicId: topic.id,
      subtopicId: topic.id,
      title: topic.title,
      completed: Boolean(matchedAttempt),
      completedAt: matchedAttempt?.completedAt,
      source: matchedAttempt?.activityType ?? 'quick_check',
      activityId: matchedAttempt?.activityId,
      attemptId: matchedAttempt?.id,
    };
  });
}

export function regionChecklistProgressSummary(input: {
  region: RegionDefinition;
  learningRecord?: RegionLearningRecord;
  learningActivityAttempts?: LearningActivityAttempt[];
}): RegionChecklistProgressSummary {
  const fieldGuide = fieldGuideTopicProgressForRegion({
    regionId: input.region.id,
    learningRecord: input.learningRecord,
  });
  const skillCheck = skillCheckTopicProgressForRegion({
    regionId: input.region.id,
    learningActivityAttempts: input.learningActivityAttempts,
  });
  const fieldGuideComplete = fieldGuide.length > 0 && fieldGuide.every((topic) => topic.completed);
  const skillCheckComplete = skillCheck.length > 0 && skillCheck.every((topic) => topic.completed);
  const guardianStatus = input.learningRecord?.guardianClearedAt
    ? 'completed'
    : fieldGuideComplete && skillCheckComplete
      ? 'unlocked'
      : 'locked';

  return {
    regionId: input.region.id,
    regionName: input.region.name,
    fieldGuideCompleted: fieldGuide.filter((topic) => topic.completed).length,
    fieldGuideTotal: fieldGuide.length,
    skillCheckCompleted: skillCheck.filter((topic) => topic.completed).length,
    skillCheckTotal: skillCheck.length,
    guardianStatus,
  };
}
