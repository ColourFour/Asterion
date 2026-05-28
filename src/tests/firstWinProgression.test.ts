import { beforeEach, describe, expect, it } from 'vitest';
import { emptyProgress, localProgressAdapter } from '../lib/progressStore';
import { resolveSuggestedNextStep } from '../lib/suggestedNextStep';
import { FIRST_WIN_REGION_ID, firstTopicBonusXpEventId, STUDENT_LEVEL_THRESHOLDS, STUDENT_XP_REWARDS } from '../lib/studentProgression';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import type { Attempt, LearningActivityAttempt, RegionProgress } from '../types';

const algebra = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === FIRST_WIN_REGION_ID)!;

function regionProgress(overrides: Partial<RegionProgress> = {}): RegionProgress {
  return {
    region: algebra,
    availableQuestions: 4,
    attempts: 0,
    totalMarksEarned: 0,
    totalMarksAvailable: 0,
    subtopicsTouched: 0,
    rank: 'Discovered',
    isActive: true,
    ...overrides,
  };
}

const learningAttempt: LearningActivityAttempt = {
  id: 'learning-1',
  profileId: 'profile-1',
  regionId: FIRST_WIN_REGION_ID,
  regionName: algebra.name,
  activityType: 'quick_check',
  activityId: 'qc-1',
  prompt: 'Factor one expression.',
  learnerResponse: 'Done',
  revealedEarly: false,
  outcome: 'got_it',
  confidence: 4,
  createdAt: '2026-05-08T00:00:00.000Z',
  completedAt: '2026-05-08T00:01:00.000Z',
};

const examAttempt: Attempt = {
  id: 'attempt-1',
  profileId: 'profile-1',
  questionId: 'p3-q1',
  paperFamily: 'p3',
  topicDisplayName: 'Algebra',
  marksEarned: 3,
  marksAvailable: 4,
  scoreRatio: 0.75,
  mistakeType: 'no_issue',
  timeSpentSeconds: 120,
  markSchemeRevealed: true,
  attemptedAt: '2026-05-08T00:02:00.000Z',
  masteryEligible: true,
  validatedRegionId: FIRST_WIN_REGION_ID,
  displayRegionId: FIRST_WIN_REGION_ID,
};

describe('first-win progression loop', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps level thresholds centralized and makes the first topic guarantee Level 2', () => {
    expect(STUDENT_LEVEL_THRESHOLDS[1]).toEqual({ level: 2, xp: 100 });

    const completed = localProgressAdapter.completeRegionFieldGuide(FIRST_WIN_REGION_ID);

    expect(completed.xp?.totalXp).toBe(
      STUDENT_XP_REWARDS.field_guide_topic_complete + STUDENT_XP_REWARDS.first_topic_complete_bonus,
    );
    expect(completed.xp?.level).toBe(2);
    expect(completed.xp?.lastLevelUp).toMatchObject({
      fromLevel: 1,
      toLevel: 2,
      eventId: firstTopicBonusXpEventId(FIRST_WIN_REGION_ID),
    });
  });

  it('does not award duplicate XP for revisiting completed guide, skill check, or saved attempt events', () => {
    localProgressAdapter.completeRegionFieldGuide(FIRST_WIN_REGION_ID);
    localProgressAdapter.completeRegionFieldGuide(FIRST_WIN_REGION_ID);
    localProgressAdapter.addLearningActivityAttempt(learningAttempt);
    localProgressAdapter.addLearningActivityAttempt({ ...learningAttempt, id: 'learning-duplicate' });
    localProgressAdapter.addAttempt(examAttempt);
    const reloaded = localProgressAdapter.addAttempt({ ...examAttempt });

    expect(reloaded.xp?.ledger.map((entry) => entry.type)).toEqual([
      'field_guide_topic_complete',
      'first_topic_complete_bonus',
      'skill_practice_check_complete',
      'exam_training_attempt_saved',
    ]);
    expect(reloaded.xp?.totalXp).toBe(60 + 50 + 25 + 35);
  });

  it('routes new students to the first Field Guide, then Skill Check, then Exam Training', () => {
    const fresh = emptyProgress();

    expect(resolveSuggestedNextStep({
      progress: fresh,
      worldProgress: [regionProgress()],
    })).toMatchObject({
      kind: 'first_topic',
      destinationHash: '#/regions/algebra-forge/field-guide',
    });

    const afterGuide = localProgressAdapter.completeRegionFieldGuide(FIRST_WIN_REGION_ID);
    expect(resolveSuggestedNextStep({
      progress: afterGuide,
      worldProgress: [regionProgress()],
      currentRegionId: FIRST_WIN_REGION_ID,
    })).toMatchObject({
      kind: 'skill_practice',
      destinationHash: '#/regions/algebra-forge/skill-practice',
    });

    const afterSkill = localProgressAdapter.addLearningActivityAttempt(learningAttempt);
    expect(resolveSuggestedNextStep({
      progress: afterSkill,
      worldProgress: [regionProgress()],
      currentRegionId: FIRST_WIN_REGION_ID,
    })).toMatchObject({
      kind: 'exam_training',
      destinationHash: '#/regions/algebra-forge/exam-training',
    });
  });
});
