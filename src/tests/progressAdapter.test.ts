import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_EQUIPPED_AVATAR_ITEMS } from '../lib/avatarStore';
import {
  CURRENT_PROGRESS_SCHEMA_VERSION,
  LOCAL_PROGRESS_STORAGE_KEY,
  emptyProgress,
  localProgressAdapter,
} from '../lib/progressStore';
import type { Attempt, IssueReport } from '../types';

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
    expect(withAttempt.topicProfiles.Algebra.attempts).toBe(1);
    expect(withAttempt.topicProfiles.Algebra.totalMarksEarned).toBe(3);

    const withIssue = localProgressAdapter.addIssueReport({
      ...issueReport,
      profileId: withProfile.profile!.id,
    });

    expect(withIssue.issueReports).toHaveLength(1);

    const cleared = localProgressAdapter.clearLocalDemoProgress();
    expect(cleared.attempts).toEqual([]);
    expect(localProgressAdapter.loadProgressContext().profile).toBeUndefined();
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
      issueReports: [issueReport],
    }));

    const loaded = localProgressAdapter.loadProgressContext();

    expect(loaded.schemaVersion).toBe(CURRENT_PROGRESS_SCHEMA_VERSION);
    expect(loaded.settings.activePaperFamily).toBe('p3');
    expect(loaded.avatar.equipped?.base).toBe('academy-student-base');
    expect(loaded.avatar.equipped?.outfit).toBe('academy-uniform');
    expect(loaded.avatar.equipped?.cloak).toBe('apprentice-cloak');
    expect(loaded.attempts).toHaveLength(1);
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
