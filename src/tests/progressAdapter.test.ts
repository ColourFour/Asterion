import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_EQUIPPED_AVATAR_ITEMS } from '../lib/avatarStore';
import {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  LOCAL_PROGRESS_STORAGE_KEY,
  emptyProgress,
  localProgressAdapter,
} from '../lib/progressStore';
import type { Attempt, IssueReport, LearningActivityAttempt } from '../types';

const attempt: Attempt = {
  id: 'attempt-1',
  profileId: 'profile-1',
  questionId: 'p3-q1',
  paperFamily: 'p3',
  paper: '33',
  questionNumber: '1',
  topicDisplayName: 'Algebra',
  marksEarned: 3,
  markBreakdown: { m: 1, b: 1, a: 1 },
  marksAvailable: 4,
  scoreRatio: 0.75,
  mistakeType: 'algebra_error',
  mistakeTypes: ['algebra_error'],
  timeSpentSeconds: 120,
  markSchemeRevealed: true,
  attemptedAt: '2026-05-08T00:00:00.000Z',
  worldName: 'P3 Astral Academy',
  regionName: 'Algebra Forge',
  regionRankAtAttempt: 'Bronze',
};

const issueReport: IssueReport = {
  id: 'issue-1',
  profileId: 'profile-1',
  questionId: 'p3-q1',
  issueType: 'mark_scheme_image_missing',
  createdAt: '2026-05-08T00:00:00.000Z',
};

const learningActivityAttempt: LearningActivityAttempt = {
  id: 'learning-1',
  profileId: 'profile-1',
  regionId: 'logarithm-grove',
  regionName: 'Logarithm Observatory',
  activityType: 'quick_check',
  activityId: 'qc-1',
  sourceId: 'snippet-1',
  topic: 'Logarithms',
  skillTargetId: 'skill-1',
  prompt: 'Rewrite log base two of eight equals three.',
  learnerResponse: '2^3 = 8',
  revealedEarly: false,
  outcome: 'got_it',
  confidence: 4,
  createdAt: '2026-05-08T00:00:00.000Z',
  completedAt: '2026-05-08T00:01:00.000Z',
};

describe('local progress adapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves the current local profile, avatar, attempt, issue, and clear flow', () => {
    const withProfile = localProgressAdapter.saveProfile({
      realName: 'Ada Lovelace',
      classGroup: 'P3',
      teacherName: 'Dr Noether',
      avatarName: 'Aster',
    });

    expect(withProfile.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION);
    expect(withProfile.profile?.id).toMatch(/^profile_/);

    const withAvatar = localProgressAdapter.saveAvatarSettings({
      ...emptyProgress().avatar,
      equipped: { ...DEFAULT_EQUIPPED_AVATAR_ITEMS, cloak: 'apprentice-cloak' },
    });

    expect(withAvatar.avatar.equipped?.cloak).toBe('apprentice-cloak');

    const withAttempt = localProgressAdapter.addAttempt({
      ...attempt,
      profileId: withProfile.profile!.id,
    });

    expect(withAttempt.attempts).toHaveLength(1);
    expect(withAttempt.attempts[0].mistakeTypes).toEqual(['algebra_error']);
    expect(withAttempt.topicProfiles.Algebra.attempts).toBe(1);
    expect(withAttempt.topicProfiles.Algebra.totalMarksEarned).toBe(3);

    const withLearningActivity = localProgressAdapter.addLearningActivityAttempt({
      ...learningActivityAttempt,
      profileId: withProfile.profile!.id,
    });
    expect(withLearningActivity.learningActivityAttempts).toHaveLength(1);
    expect(withLearningActivity.learningActivityAttempts[0].outcome).toBe('got_it');
    expect(withLearningActivity.attempts).toHaveLength(1);
    expect(withLearningActivity.topicProfiles.Algebra.attempts).toBe(1);

    const withIssue = localProgressAdapter.addIssueReport({
      ...issueReport,
      profileId: withProfile.profile!.id,
    });

    expect(withIssue.issueReports).toHaveLength(1);

    const withFieldGuide = localProgressAdapter.completeRegionFieldGuide('logarithm-grove');
    expect(withFieldGuide.regionLearning?.['logarithm-grove'].fieldGuideCompletedAt).toBeTruthy();

    const withGuardian = localProgressAdapter.recordRegionGuardianAttempt({
      regionId: 'logarithm-grove',
      questionId: 'p3-q1',
      attemptId: 'attempt-guardian',
      passed: true,
      attemptedAt: '2026-05-08T00:10:00.000Z',
    });
    expect(withGuardian.regionLearning?.['logarithm-grove'].guardianClearedAt).toBe('2026-05-08T00:10:00.000Z');

    const cleared = localProgressAdapter.clearLocalDemoProgress();
    expect(cleared.attempts).toEqual([]);
    expect(localProgressAdapter.loadProgressContext().profile).toBeUndefined();
  });

  it('stores explicitly mastery-ineligible attempts without advancing topic profiles', () => {
    const stored = localProgressAdapter.addAttempt({
      ...attempt,
      id: 'attempt-unsafe',
      masteryEligible: false,
      guardianEligible: false,
      displayRegionId: 'algebra-forge',
    });

    expect(stored.attempts).toHaveLength(1);
    expect(stored.attempts[0].masteryEligible).toBe(false);
    expect(stored.attempts[0].guardianEligible).toBe(false);
    expect(stored.attempts[0].displayRegionId).toBe('algebra-forge');
    expect(stored.topicProfiles).toEqual({});
  });

  it('loads legacy no-version progress with default settings and canonical avatar IDs', () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      avatar: {
        palette: 'aqua',
        crest: 'compass',
        equipped: {
          ...DEFAULT_EQUIPPED_AVATAR_ITEMS,
          base: 'base-academy-student',
          outfit: 'outfit-academy-tunic',
          cloak: 'cloak-apprentice',
        },
      },
      attempts: [attempt],
      learningActivityAttempts: [learningActivityAttempt],
      issueReports: [issueReport],
    }));

    const loaded = localProgressAdapter.loadProgressContext();

    expect(loaded.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION);
    expect(loaded.settings.activePaperFamily).toBe('p3');
    expect(loaded.avatar.equipped?.base).toBe('academy-student-base');
    expect(loaded.avatar.equipped?.outfit).toBe('academy-uniform');
    expect(loaded.avatar.equipped?.cloak).toBe('apprentice-cloak');
    expect(loaded.attempts).toHaveLength(1);
    expect(loaded.learningActivityAttempts).toHaveLength(1);
    expect(loaded.topicProfiles.Algebra.rank).toBe('none');
  });

  it('drops malformed attempts without crashing and rebuilds derived topic profiles', () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      attempts: [
        attempt,
        { id: 'broken-attempt', questionId: 42, marksEarned: 'three' },
      ],
      topicProfiles: {
        Algebra: { attempts: 99, totalMarksEarned: 999 },
      },
    }));

    const loaded = localProgressAdapter.loadProgressContext();

    expect(loaded.attempts).toHaveLength(1);
    expect(loaded.topicProfiles.Algebra.attempts).toBe(1);
    expect(loaded.topicProfiles.Algebra.totalMarksEarned).toBe(3);
  });

  it('preserves multi-tag reflections and full-score confirmation attempts', () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      attempts: [
        {
          ...attempt,
          id: 'attempt-multi',
          mistakeTypes: ['algebra_error', 'misread_question'],
          partScores: [
            { label: '(a)', marksEarned: 2, marksAvailable: 3, markBreakdown: { m: 1, b: 0, a: 1 } },
            { label: '(b)', marksEarned: 1, marksAvailable: 1 },
          ],
        },
        {
          ...attempt,
          id: 'attempt-full',
          marksEarned: 4,
          scoreRatio: 1,
          mistakeType: undefined,
          mistakeTypes: [],
          fullScoreConfirmed: true,
          note: 'Checked all mark-scheme lines.',
        },
      ],
    }));

    const loaded = localProgressAdapter.loadProgressContext();

    expect(loaded.attempts).toHaveLength(2);
    expect(loaded.attempts[0].mistakeTypes).toEqual(['algebra_error', 'misread_question']);
    expect(loaded.attempts[0].partScores).toEqual([
      { label: '(a)', marksEarned: 2, marksAvailable: 3, markBreakdown: { m: 1, b: 0, a: 1 } },
      { label: '(b)', marksEarned: 1, marksAvailable: 1 },
    ]);
    expect(loaded.attempts[1].mistakeType).toBeUndefined();
    expect(loaded.attempts[1].mistakeTypes).toEqual([]);
    expect(loaded.attempts[1].fullScoreConfirmed).toBe(true);
  });

  it('normalizes malformed region learning records without blocking progress load', () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      regionLearning: {
        'logarithm-grove': {
          regionId: 'logarithm-grove',
          fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
          guardianClearedAt: 42,
        },
        broken: 'not-a-record',
      },
    }));

    const loaded = localProgressAdapter.loadProgressContext();

    expect(loaded.regionLearning?.['logarithm-grove'].fieldGuideCompletedAt).toBe('2026-05-08T00:00:00.000Z');
    expect(loaded.regionLearning?.['logarithm-grove'].guardianClearedAt).toBeUndefined();
    expect(loaded.regionLearning?.broken).toBeUndefined();
  });

  it('drops malformed learning activity attempts without inflating canonical attempts', () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      attempts: [],
      learningActivityAttempts: [
        learningActivityAttempt,
        { ...learningActivityAttempt, id: 'broken-learning', outcome: 'perfect' },
      ],
    }));

    const loaded = localProgressAdapter.loadProgressContext();

    expect(loaded.learningActivityAttempts).toHaveLength(1);
    expect(loaded.attempts).toEqual([]);
    expect(loaded.topicProfiles).toEqual({});
  });

  it('does not create mastery evidence from Field Guide, Quick Check, or warm-up activity records', () => {
    const withFieldGuide = localProgressAdapter.completeRegionFieldGuide('logarithm-grove');
    expect(withFieldGuide.attempts).toEqual([]);
    expect(withFieldGuide.topicProfiles).toEqual({});

    const withQuickCheck = localProgressAdapter.addLearningActivityAttempt(learningActivityAttempt);
    expect(withQuickCheck.learningActivityAttempts).toHaveLength(1);
    expect(withQuickCheck.attempts).toEqual([]);
    expect(withQuickCheck.topicProfiles).toEqual({});

    const withWarmUp = localProgressAdapter.addLearningActivityAttempt({
      ...learningActivityAttempt,
      id: 'learning-warm-1',
      activityType: 'warm_up',
      activityId: 'warm-1',
    });
    expect(withWarmUp.learningActivityAttempts).toHaveLength(2);
    expect(withWarmUp.attempts).toEqual([]);
    expect(withWarmUp.topicProfiles).toEqual({});
  });

  it('normalizes unknown avatar settings and item IDs back to safe defaults', () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      avatar: {
        palette: 'infrared',
        crest: 'comet',
        equipped: {
          base: 'missing-base',
          cloak: 'missing-cloak',
        },
      },
    }));

    const loaded = localProgressAdapter.loadProgressContext();

    expect(loaded.avatar.palette).toBe('ember');
    expect(loaded.avatar.crest).toBe('star');
    expect(loaded.avatar.equipped?.base).toBe('academy-student-base');
    expect(loaded.avatar.equipped?.cloak).toBe('no-cloak');
  });

  it('handles malformed JSON and future schema versions conservatively', () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, '{not-json');
    expect(localProgressAdapter.loadProgressContext().attempts).toEqual([]);

    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION + 1,
      attempts: [attempt],
      avatar: { palette: 'aqua', crest: 'bolt' },
    }));

    const loaded = localProgressAdapter.loadProgressContext();

    expect(loaded.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION);
    expect(loaded.attempts).toEqual([]);
    expect(loaded.avatar.palette).toBe('ember');
  });
});
