import { getFieldGuideTopicsForRegion, type FieldGuideTopic } from '../data/fieldGuideTopics';
import { getSkillCheckItemsForRegion } from '../data/skillCheckItems';
import type { LearningActivityAttempt } from '../types';

export const SKILL_CHECKLIST_GUARDIAN_REGION_IDS = ['algebra-forge', 'logarithm-grove'] as const;

export type SkillChecklistGuardianRegionId = typeof SKILL_CHECKLIST_GUARDIAN_REGION_IDS[number];

export interface SkillChecklistTopicProgress {
  topicId: string;
  title: string;
  completed: boolean;
  matchedAttemptId?: string;
}

export interface SkillChecklistCompletion {
  regionId: string;
  applies: boolean;
  completed: boolean;
  completedCount: number;
  requiredCount: number;
  requiredTopicIds: string[];
  topicProgress: SkillChecklistTopicProgress[];
}

export function isSkillChecklistGuardianRegion(regionId: string | undefined): regionId is SkillChecklistGuardianRegionId {
  return Boolean(regionId && SKILL_CHECKLIST_GUARDIAN_REGION_IDS.includes(regionId as SkillChecklistGuardianRegionId));
}

function activityCompletesTopic(attempt: LearningActivityAttempt, topic: FieldGuideTopic, itemIdsByTopic: Map<string, Set<string>>): boolean {
  if (attempt.outcome !== 'got_it') return false;
  if (attempt.regionId && attempt.regionId !== topicRegionLookup.get(topic.id)) return false;
  if (attempt.topic === topic.id) return true;
  if (attempt.skillTargetId && topic.skillIds.includes(attempt.skillTargetId)) return true;
  return Boolean(itemIdsByTopic.get(topic.id)?.has(attempt.activityId));
}

const topicRegionLookup = new Map<string, string>();
for (const regionId of SKILL_CHECKLIST_GUARDIAN_REGION_IDS) {
  for (const topic of getFieldGuideTopicsForRegion(regionId)) {
    topicRegionLookup.set(topic.id, regionId);
  }
}

export function computeSkillChecklistCompletion(input: {
  regionId: string | undefined;
  learningActivityAttempts?: LearningActivityAttempt[];
}): SkillChecklistCompletion {
  const regionId = input.regionId ?? '';
  const applies = isSkillChecklistGuardianRegion(regionId);
  const fieldGuideTopics = applies ? getFieldGuideTopicsForRegion(regionId) : [];
  const skillCheckItems = getSkillCheckItemsForRegion(regionId);
  const itemIdsByTopic = new Map<string, Set<string>>();

  for (const item of skillCheckItems) {
    const ids = itemIdsByTopic.get(item.fieldGuideTopicId) ?? new Set<string>();
    ids.add(item.itemId);
    itemIdsByTopic.set(item.fieldGuideTopicId, ids);
  }

  const topicProgress = fieldGuideTopics.map((topic) => {
    const matchedAttempt = (input.learningActivityAttempts ?? []).find((attempt) => activityCompletesTopic(attempt, topic, itemIdsByTopic));
    return {
      topicId: topic.id,
      title: topic.title,
      completed: Boolean(matchedAttempt),
      matchedAttemptId: matchedAttempt?.id,
    };
  });
  const completedCount = topicProgress.filter((topic) => topic.completed).length;

  return {
    regionId,
    applies,
    completed: applies && fieldGuideTopics.length > 0 && completedCount === fieldGuideTopics.length,
    completedCount,
    requiredCount: fieldGuideTopics.length,
    requiredTopicIds: fieldGuideTopics.map((topic) => topic.id),
    topicProgress,
  };
}
