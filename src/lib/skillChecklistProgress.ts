import { getFieldGuideTopicsForRegion, type FieldGuideTopic } from '../data/fieldGuideTopics';
import { getSkillCheckItemsForRegion } from '../data/skillCheckItems';
import type { LearningActivityAttempt } from '../types';
import { P3_ALLOWED_REGION_IDS, type P3RegionId } from './p3SkillContract';

export const SKILL_CHECKLIST_GUARDIAN_REGION_IDS = P3_ALLOWED_REGION_IDS;

export type SkillChecklistGuardianRegionId = P3RegionId;

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
  authoredItemCount: number;
  topicProgress: SkillChecklistTopicProgress[];
}

export function isSkillChecklistGuardianRegion(regionId: string | undefined): regionId is SkillChecklistGuardianRegionId {
  return Boolean(
    regionId
    && SKILL_CHECKLIST_GUARDIAN_REGION_IDS.includes(regionId as SkillChecklistGuardianRegionId)
    && getFieldGuideTopicsForRegion(regionId).length > 0
    && getSkillCheckItemsForRegion(regionId).length > 0,
  );
}

function activityCompletesTopic(attempt: LearningActivityAttempt, topic: FieldGuideTopic, itemIdsByTopic: Map<string, Set<string>>): boolean {
  if (attempt.activityType !== 'quick_check') return false;
  if (attempt.outcome !== 'got_it') return false;
  if (attempt.topic === topic.id) return true;
  return Boolean(itemIdsByTopic.get(topic.id)?.has(attempt.activityId));
}

export function computeSkillChecklistCompletion(input: {
  regionId: string | undefined;
  learningActivityAttempts?: LearningActivityAttempt[];
}): SkillChecklistCompletion {
  const regionId = input.regionId ?? '';
  const skillCheckItems = getSkillCheckItemsForRegion(regionId);
  const fieldGuideTopics = getFieldGuideTopicsForRegion(regionId);
  const applies = fieldGuideTopics.length > 0;
  const itemIdsByTopic = new Map<string, Set<string>>();

  for (const item of skillCheckItems) {
    const ids = itemIdsByTopic.get(item.fieldGuideTopicId) ?? new Set<string>();
    ids.add(item.itemId);
    itemIdsByTopic.set(item.fieldGuideTopicId, ids);
  }

  const topicProgress = (applies ? fieldGuideTopics : []).map((topic) => {
    const matchedAttempt = (input.learningActivityAttempts ?? [])
      .filter((attempt) => attempt.regionId === regionId)
      .find((attempt) => activityCompletesTopic(attempt, topic, itemIdsByTopic));
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
    authoredItemCount: skillCheckItems.length,
    topicProgress,
  };
}
