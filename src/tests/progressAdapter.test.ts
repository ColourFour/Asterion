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
  masteryEligible: true,
  validatedRegionId: 'algebra-forge',
  displayRegionId: 'algebra-forge',
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
      avatarId: 'star-apprentice',
      onboardingCompleted: true,
      onboardingCompletedAt: '2026-05-08T00:00:00.000Z',
    });

    expect(withProfile.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION);
    expect(withProfile.profile?.id).toMatch(/^profile_/);
    expect(withProfile.profile).toMatchObject({
      avatarId: 'star-apprentice',
      onboardingCompleted: true,
      onboardingCompletedAt: '2026-05-08T00:00:00.000Z',
    });

    const withAvatar = localProgressAdapter.saveAvatarSettings({
      ...emptyProgress().avatar,
      equipped: { ...DEFAULT_EQUIPPED_AVATAR_ITEMS, hair: 'shoulder-length-straight' },
    });

    expect(withAvatar.avatar.equipped?.hair).toBe('shoulder-length-straight');

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

  it('loads an empty local context when this browser has no saved progress', () => {
    localProgressAdapter.saveProfile({
      realName: 'Ada Lovelace',
      classGroup: 'P3',
      teacherName: 'Dr Noether',
      avatarName: 'Aster',
    });
    expect(localProgressAdapter.loadProgressContext().profile?.realName).toBe('Ada Lovelace');

    localStorage.removeItem(LOCAL_PROGRESS_STORAGE_KEY);
    const freshBrowserContext = localProgressAdapter.loadProgressContext();

    expect(freshBrowserContext.profile).toBeUndefined();
    expect(freshBrowserContext.attempts).toEqual([]);
    expect(freshBrowserContext.learningActivityAttempts).toEqual([]);
    expect(freshBrowserContext.regionLearning).toEqual({});
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
    expect(loaded.avatar.equipped?.base).toBe('student-body-a');
    expect(loaded.avatar.equipped?.outfit).toBe('school-spirit-tracksuit');
    expect(loaded.avatar.equipped?.cloak).toBe('no-cloak');
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

  it('round-trips the student pilot evidence loop through local reloads', () => {
    const withProfile = localProgressAdapter.saveProfile({
      realName: 'Ada Lovelace',
      classGroup: 'P3 Alpha',
      teacherName: 'Dr Noether',
      avatarName: 'Aster',
      classClaim: {
        status: 'claimed',
        classId: 'class-p3-alpha',
        className: 'P3 Alpha',
        classCode: 'AST-P3A',
        teacherId: 'teacher-noether',
        teacherName: 'Dr Noether',
        rosterStudentId: 'roster-ada',
        displayName: 'Ada Lovelace',
        message: 'Claimed roster slot.',
      },
    });

    localProgressAdapter.saveAvatarSettings({
      ...emptyProgress().avatar,
      crest: 'compass',
      equipped: { ...DEFAULT_EQUIPPED_AVATAR_ITEMS, hair: 'shoulder-length-straight' },
    });
    localProgressAdapter.completeRegionFieldGuide('logarithm-grove');
    localProgressAdapter.addLearningActivityAttempt({
      ...learningActivityAttempt,
      profileId: withProfile.profile!.id,
    });
    localProgressAdapter.addAttempt({
      ...attempt,
      id: 'attempt-self-mark',
      profileId: withProfile.profile!.id,
      questionId: 'p3-log-q1',
      topicDisplayName: 'Logarithms',
      marksEarned: 6,
      markBreakdown: { m: 3, b: 1, a: 2 },
      partScores: [
        { label: '(a)', marksEarned: 5, marksAvailable: 6, markBreakdown: { m: 3, b: 0, a: 2 } },
        { label: '(b)', marksEarned: 1, marksAvailable: 1, markBreakdown: { m: 0, b: 1, a: 0 } },
      ],
      marksAvailable: 7,
      scoreRatio: 6 / 7,
      validatedRegionId: 'logarithm-grove',
      displayRegionId: 'logarithm-grove',
      regionName: 'Logarithm Observatory',
    });
    localProgressAdapter.recordRegionGuardianAttempt({
      regionId: 'logarithm-grove',
      questionId: 'p3-log-q1',
      attemptId: 'attempt-self-mark',
      passed: true,
      attemptedAt: '2026-05-08T00:15:00.000Z',
    });

    const reloaded = localProgressAdapter.loadProgressContext();

    expect(reloaded.profile).toMatchObject({
      id: withProfile.profile!.id,
      classClaim: {
        status: 'claimed',
        classId: 'class-p3-alpha',
        rosterStudentId: 'roster-ada',
      },
    });
    expect(reloaded.avatar.crest).toBe('compass');
    expect(reloaded.avatar.equipped?.hair).toBe('shoulder-length-straight');
    expect(reloaded.learningActivityAttempts).toHaveLength(1);
    expect(reloaded.attempts).toHaveLength(1);
    expect(reloaded.attempts[0]).toMatchObject({
      id: 'attempt-self-mark',
      profileId: withProfile.profile!.id,
      questionId: 'p3-log-q1',
      markSchemeRevealed: true,
      marksEarned: 6,
      marksAvailable: 7,
      markBreakdown: { m: 3, b: 1, a: 2 },
      partScores: [
        { label: '(a)', marksEarned: 5, marksAvailable: 6, markBreakdown: { m: 3, b: 0, a: 2 } },
        { label: '(b)', marksEarned: 1, marksAvailable: 1, markBreakdown: { m: 0, b: 1, a: 0 } },
      ],
      validatedRegionId: 'logarithm-grove',
    });
    expect(reloaded.regionLearning?.['logarithm-grove']).toMatchObject({
      regionId: 'logarithm-grove',
      fieldGuideCompletedAt: expect.any(String),
      guardianQuestionId: 'p3-log-q1',
      guardianAttemptId: 'attempt-self-mark',
      guardianAttemptedAt: '2026-05-08T00:15:00.000Z',
      guardianClearedAt: '2026-05-08T00:15:00.000Z',
    });
    expect(reloaded.topicProfiles.Logarithms.attempts).toBe(1);
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

  it('keeps region learning storage keys authoritative when malformed records contain mismatched region IDs', () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: CURRENT_PROGRESS_SCHEMA_VERSION,
      regionLearning: {
        'algebra-forge': {
          regionId: 'logarithm-grove',
          fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
        },
        'logarithm-grove': {
          regionId: 'algebra-forge',
          guardianAttemptId: 'guardian-log-1',
          guardianQuestionId: 'p3-log-q1',
          guardianAttemptedAt: '2026-05-08T00:10:00.000Z',
        },
      },
    }));

    const loaded = localProgressAdapter.loadProgressContext();

    expect(loaded.regionLearning?.['algebra-forge']).toMatchObject({
      regionId: 'algebra-forge',
      fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
    });
    expect(loaded.regionLearning?.['logarithm-grove']).toMatchObject({
      regionId: 'logarithm-grove',
      guardianAttemptId: 'guardian-log-1',
      guardianQuestionId: 'p3-log-q1',
    });
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
    expect(loaded.avatar.equipped?.base).toBe('student-body-a');
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
