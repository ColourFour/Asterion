import { describe, expect, it, vi } from 'vitest';
import { emptyProgress } from '../lib/progressStore';
import { syncCurrentProgressSnapshot } from '../lib/supabaseProgressSnapshotService';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';
import type { StudentClassroomContext } from '../lib/studentClassroomService';

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

function classroomContext(): StudentClassroomContext {
  return {
    accessMode: 'student',
    user: { id: 'student-user-1', email: 'student@example.school' },
    studentProfile: {
      id: 'student-profile-1',
      userId: 'student-user-1',
      organizationId: 'org-1',
      displayName: 'Ada S.',
      createdAt: '2026-05-01T08:00:00.000Z',
      updatedAt: '2026-05-12T08:00:00.000Z',
    },
    membership: {
      id: 'membership-1',
      classId: 'class-alpha',
      studentProfileId: 'student-profile-1',
      rosterName: 'Ada S.',
      claimedByUserId: 'student-user-1',
      claimedAt: '2026-05-12T08:00:00.000Z',
      createdAt: '2026-05-02T08:00:00.000Z',
      updatedAt: '2026-05-12T08:00:00.000Z',
    },
    classRecord: {
      id: 'class-alpha',
      organizationId: 'org-1',
      teacherId: 'teacher-1',
      name: 'Hosted P3 Alpha',
      classCode: 'SUP-P3A',
      createdAt: '2026-05-02T08:00:00.000Z',
      updatedAt: '2026-05-11T08:00:00.000Z',
    },
    teacher: {
      id: 'teacher-1',
      userId: 'teacher-user-1',
      organizationId: 'org-1',
      displayName: 'Ms Supabase',
      createdAt: '2026-05-01T08:00:00.000Z',
      updatedAt: '2026-05-10T08:00:00.000Z',
    },
    regionAccess: [
      { regionId: 'algebra-forge', regionName: 'Algebra Vault', access: 'open', updatedByRole: 'teacher', updatedAt: '2026-05-12T08:00:00.000Z' },
    ],
    claim: {
      status: 'claimed',
      classId: 'class-alpha',
      className: 'Hosted P3 Alpha',
      classCode: 'SUP-P3A',
      teacherId: 'teacher-1',
      teacherName: 'Ms Supabase',
      rosterStudentId: 'membership-1',
      displayName: 'Ada S.',
      message: 'Hosted classroom membership verified through Supabase.',
    },
  };
}

describe('Supabase progress snapshot service', () => {
  it('does not insert StoredProgress or localStorage-derived summaries into hosted snapshots', async () => {
    const createClient = vi.fn();
    const progress = {
      ...emptyProgress(),
      attempts: [{
        id: 'attempt-1',
        profileId: 'profile-1',
        questionId: 'q1',
        paperFamily: 'p3' as const,
        topicDisplayName: 'Algebra',
        marksEarned: 10,
        marksAvailable: 10,
        scoreRatio: 1,
        note: 'raw local note must not leave browser',
        timeSpentSeconds: 60,
        markSchemeRevealed: true,
        attemptedAt: '2026-05-20T09:00:00.000Z',
      }],
    };

    await expect(syncCurrentProgressSnapshot({
      progress,
      questions: [],
      classroomContext: classroomContext(),
      config: validConfig,
      createClient,
    })).resolves.toEqual({
      status: 'skipped',
      reason: 'Hosted teacher-visible progress snapshots are disabled; classroom-pilot progress is event-derived.',
    });

    expect(createClient).not.toHaveBeenCalled();
  });

  it('skips before creating a client when Supabase browser config is missing', async () => {
    const createClient = vi.fn();

    await expect(syncCurrentProgressSnapshot({
      progress: emptyProgress(),
      classroomContext: classroomContext(),
      config: resolveSupabaseConfig({}),
      createClient,
    })).resolves.toEqual({ status: 'skipped', reason: 'Supabase browser configuration is not available.' });
    expect(createClient).not.toHaveBeenCalled();
  });
});
