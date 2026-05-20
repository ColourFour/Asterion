import { describe, expect, it, vi } from 'vitest';
import { emptyProgress } from '../lib/progressStore';
import { syncCurrentProgressSnapshot, type SupabaseProgressSnapshotClient, type SupabaseProgressSnapshotInsertBuilder } from '../lib/supabaseProgressSnapshotService';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';
import type { Attempt, NormalizedQuestion } from '../types';
import type { StudentClassroomContext } from '../lib/studentClassroomService';

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

function question(): NormalizedQuestion {
  return {
    id: 'q1',
    paperFamily: 'p3',
    displayTopic: 'Algebra',
    deepseek: { hasError: false, topic: 'Algebra' },
    routeEvidence: {
      status: 'clean',
      source: 'topic-routing',
      regionId: 'algebra-forge',
      regionName: 'Algebra Vault',
      validatedRegionId: 'algebra-forge',
      validatedRegionName: 'Algebra Vault',
      displayRegionId: 'algebra-forge',
      displayRegionName: 'Algebra Vault',
      reasonCodes: ['validated-topic-routing'],
    },
    eligibility: {
      regionDisplayEligible: { eligible: true, reasonCodes: [] },
      practiceEligible: { eligible: true, reasonCodes: [] },
      masteryEligible: { eligible: true, reasonCodes: [] },
      guardianEligible: { eligible: true, reasonCodes: [] },
      generationEligible: { eligible: true, reasonCodes: [] },
      textOnlyEligible: { eligible: false, reasonCodes: [] },
    },
    questionImageRawPaths: ['raw/question.png'],
    markSchemeImageRawPaths: ['raw/ms.png'],
    questionImagePaths: ['question.png'],
    markSchemeImagePaths: ['ms.png'],
    questionImageUrls: ['/question.png'],
    markSchemeImageUrls: ['/ms.png'],
    questionImageCandidates: [['/question.png']],
    markSchemeImageCandidates: [['/ms.png']],
    raw: { local: {} },
  };
}

function attempt(): Attempt {
  return {
    id: 'attempt-1',
    profileId: 'profile-1',
    questionId: 'q1',
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    marksEarned: 7,
    marksAvailable: 10,
    scoreRatio: 0.7,
    mistakeType: 'algebra_error',
    mistakeTypes: ['algebra_error'],
    note: 'raw local note must not be inserted',
    timeSpentSeconds: 120,
    markSchemeRevealed: true,
    attemptedAt: '2026-05-20T09:00:00.000Z',
    masteryEligible: true,
    guardianEligible: true,
    validatedRegionId: 'algebra-forge',
    displayRegionId: 'algebra-forge',
  };
}

function classroomContext(): StudentClassroomContext {
  return {
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
      { regionId: 'trig-observatory', regionName: 'Trigonometry Observatory', access: 'field_guide_only', updatedByRole: 'teacher', updatedAt: '2026-05-12T08:00:00.000Z' },
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

function createClient(error: unknown = null) {
  const inserts: Record<string, unknown>[] = [];
  const selects: string[] = [];

  class InsertBuilder<T extends Record<string, unknown>> implements SupabaseProgressSnapshotInsertBuilder<T> {
    select(columns: string) {
      selects.push(columns);
      return this;
    }

    then<TResult1 = { data: T[] | null; error: unknown }, TResult2 = never>(
      onfulfilled?: ((value: { data: T[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      return Promise.resolve({
        data: error ? null : ([{ id: 'snapshot-1' }] as unknown as T[]),
        error,
      }).then(onfulfilled, onrejected);
    }
  }

  const client: SupabaseProgressSnapshotClient = {
    from: vi.fn((_table: string) => ({
      insert(values: Record<string, unknown>) {
        inserts.push(values);
        return new InsertBuilder();
      },
    })) as unknown as SupabaseProgressSnapshotClient['from'],
  };

  return { client, inserts, selects };
}

describe('Supabase progress snapshot service', () => {
  it('inserts only bounded summary fields for the hosted student membership', async () => {
    const fake = createClient();
    const progress = {
      ...emptyProgress(),
      attempts: [attempt()],
    };

    const result = await syncCurrentProgressSnapshot({
      progress,
      questions: [question()],
      classroomContext: classroomContext(),
      config: validConfig,
      createClient: async () => fake.client,
      now: '2026-05-20T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'synced', snapshotId: 'snapshot-1' });
    expect(fake.client.from).toHaveBeenCalledWith('student_progress_snapshots');
    expect(fake.inserts).toHaveLength(1);
    expect(fake.inserts[0]).toMatchObject({
      class_membership_id: 'membership-1',
      student_profile_id: 'student-profile-1',
      class_id: 'class-alpha',
      snapshot_version: 1,
      source: 'local_student_app',
    });
    expect(fake.inserts[0].summary_json).toMatchObject({ attemptCount: 1 });
    expect(fake.inserts[0].region_summary_json).toMatchObject({
      'algebra-forge': expect.objectContaining({ accessStatus: 'open' }),
      'trig-observatory': expect.objectContaining({ accessStatus: 'field_guide_only' }),
    });
    const serializedInsert = JSON.stringify(fake.inserts[0]);
    expect(serializedInsert).not.toContain('raw local note');
    expect(serializedInsert).not.toContain('/question.png');
    expect(serializedInsert).not.toContain('/ms.png');
  });

  it('returns a failed result without throwing when Supabase insert fails', async () => {
    const fake = createClient({ message: 'RLS denied' });

    await expect(syncCurrentProgressSnapshot({
      progress: emptyProgress(),
      questions: [],
      classroomContext: classroomContext(),
      config: validConfig,
      createClient: async () => fake.client,
    })).resolves.toEqual({ status: 'failed', error: 'RLS denied' });
  });

  it('skips sync when Supabase browser config is missing', async () => {
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
