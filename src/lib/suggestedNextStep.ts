import type { LearningActivityAttempt, RegionProgress, StoredProgress, WorldDefinition } from '../types';
import { regionHashPath, type RegionLearningPageId } from './regionRoutes';
import { FIRST_WIN_REGION_ID, firstTopicBonusXpEventId } from './studentProgression';
import { P3_ASTRAL_ACADEMY } from './worldMap';

export type SuggestedNextStepKind =
  | 'first_topic'
  | 'field_guide'
  | 'skill_practice'
  | 'exam_training'
  | 'region_hub';

export interface SuggestedNextStep {
  kind: SuggestedNextStepKind;
  label: string;
  destinationHash: string;
  regionId?: string;
  page?: RegionLearningPageId;
}

function hasXpEvent(progress: StoredProgress, eventId: string): boolean {
  return Boolean(progress.xp?.ledger.some((entry) => entry.eventId === eventId));
}

function firstRecommendedRegion(world: WorldDefinition): string {
  return world.regions.find((region) => region.id === FIRST_WIN_REGION_ID)?.id
    ?? world.regions.find((region) => region.activeByDefault)?.id
    ?? world.regions[0]?.id
    ?? FIRST_WIN_REGION_ID;
}

function regionHasSkillPracticeAttempt(attempts: LearningActivityAttempt[], regionId: string): boolean {
  return attempts.some((attempt) => attempt.regionId === regionId);
}

function regionProgressForId(worldProgress: RegionProgress[], regionId: string): RegionProgress | undefined {
  return worldProgress.find((item) => item.region.id === regionId);
}

function mostRecentLearningRegion(progress: StoredProgress): string | undefined {
  const records = Object.values(progress.regionLearning ?? {})
    .filter((record) => record.regionId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return records[0]?.regionId;
}

function buildStep(kind: SuggestedNextStepKind, regionId: string, page: RegionLearningPageId, label: string): SuggestedNextStep {
  return {
    kind,
    label,
    destinationHash: regionHashPath(regionId, page),
    regionId,
    page,
  };
}

export function resolveSuggestedNextStep(input: {
  progress: StoredProgress;
  worldProgress: RegionProgress[];
  currentRegionId?: string;
  world?: WorldDefinition;
}): SuggestedNextStep {
  const world = input.world ?? P3_ASTRAL_ACADEMY;
  const firstRegionId = firstRecommendedRegion(world);
  const firstTopicComplete = hasXpEvent(input.progress, firstTopicBonusXpEventId(firstRegionId))
    || Boolean(input.progress.regionLearning?.[firstRegionId]?.fieldGuideCompletedAt);

  if (!firstTopicComplete) {
    return buildStep('first_topic', firstRegionId, 'field-guide', 'Start the first Field Guide');
  }

  const currentRegionId = input.currentRegionId
    ?? mostRecentLearningRegion(input.progress)
    ?? firstRegionId;
  const currentRegionProgress = regionProgressForId(input.worldProgress, currentRegionId);
  const currentLearning = input.progress.regionLearning?.[currentRegionId];

  if (!currentLearning?.fieldGuideCompletedAt) {
    return buildStep('field_guide', currentRegionId, 'field-guide', 'Open the Field Guide');
  }

  if (!regionHasSkillPracticeAttempt(input.progress.learningActivityAttempts, currentRegionId)) {
    return buildStep('skill_practice', currentRegionId, 'skill-practice', 'Try one Skill Practice');
  }

  if (currentRegionProgress && currentRegionProgress.availableQuestions > 0) {
    return buildStep('exam_training', currentRegionId, 'exam-training', 'Save one Exam Training attempt');
  }

  return buildStep('region_hub', currentRegionId, 'hub', 'Return to the Region Hub');
}
