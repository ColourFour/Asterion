import { describe, expect, it, vi } from 'vitest';
import { recordHostedProgressEvent, type SupabaseProgressEventClient } from '../lib/supabaseProgressEventService';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';
import type { StudentClassroomContext } from '../lib/studentClassroomService';

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

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
  const rpc = vi.fn(async (_fn: string, _args?: Record<string, unknown>) => ({
    data: error ? null : [{ id: 'event-1' }],
    error,
  }));
  return { client: { rpc } as SupabaseProgressEventClient, rpc };
}

describe('Supabase progress event service', () => {
  it('records hosted activity through the membership-scoped RPC instead of table inserts', async () => {
    const fake = createClient();

    await expect(recordHostedProgressEvent({
      classroomContext: classroomContext(),
      regionId: 'algebra-forge',
      activityType: 'exam_practice',
      eventType: 'practice_attempt_saved',
      questionId: '9709_s23_qp32_q1',
      eventPayload: {
        scoreRatio: 0.75,
        marksEarned: 6,
        marksAvailable: 8,
        durationSeconds: 240,
      },
      config: validConfig,
      createClient: async () => fake.client,
    })).resolves.toEqual({ status: 'synced', eventId: 'event-1' });

    expect(fake.rpc).toHaveBeenCalledWith('record_student_progress_event', expect.objectContaining({
      p_class_id: 'class-alpha',
      p_class_membership_id: 'membership-1',
      p_student_profile_id: 'student-profile-1',
      p_region_id: 'algebra-forge',
      p_activity_type: 'exam_practice',
      p_event_type: 'practice_attempt_saved',
      p_question_id: '9709_s23_qp32_q1',
      p_event_payload: {
        scoreRatio: 0.75,
        marksEarned: 6,
        marksAvailable: 8,
        durationSeconds: 240,
      },
    }));
  });

  it('allows Field Guide events but blocks progression events in field-guide-only regions before RPC', async () => {
    const fieldGuide = createClient();
    await expect(recordHostedProgressEvent({
      classroomContext: classroomContext(),
      regionId: 'trig-observatory',
      activityType: 'field_guide',
      eventType: 'field_guide_completed',
      eventPayload: { completed: true },
      config: validConfig,
      createClient: async () => fieldGuide.client,
    })).resolves.toEqual({ status: 'synced', eventId: 'event-1' });
    expect(fieldGuide.rpc).toHaveBeenCalledTimes(1);

    for (const [activityType, eventType] of [
      ['quick_check', 'quick_check_completed'],
      ['warm_up', 'warm_up_completed'],
      ['exam_practice', 'practice_attempt_saved'],
      ['guardian', 'guardian_attempted'],
    ] as const) {
      const blocked = createClient();
      await expect(recordHostedProgressEvent({
        classroomContext: classroomContext(),
        regionId: 'trig-observatory',
        activityType,
        eventType,
        config: validConfig,
        createClient: async () => blocked.client,
      })).resolves.toEqual({ status: 'failed', error: 'This region is not open for that hosted progress activity.' });
      expect(blocked.rpc).not.toHaveBeenCalled();
    }
  });

  it('does not send raw learner text, image paths, full attempts, or localStorage payload keys', async () => {
    const fake = createClient();

    await recordHostedProgressEvent({
      classroomContext: classroomContext(),
      regionId: 'algebra-forge',
      activityType: 'quick_check',
      eventType: 'quick_check_completed',
      contentId: 'warmup/unsafe/path',
      skillId: 'skill.algebra.1',
      eventPayload: {
        outcome: 'got_it',
        completed: true,
        learnerResponse: 'raw answer',
        note: 'private note',
        localStorage: { attempts: [] },
        questionImageUrls: ['/raw.png'],
      } as never,
      config: validConfig,
      createClient: async () => fake.client,
    });

    const payload = fake.rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.p_content_id).toBeNull();
    expect(payload.p_skill_id).toBe('skill.algebra.1');
    expect(JSON.stringify(payload.p_event_payload)).toBe(JSON.stringify({ outcome: 'got_it', completed: true }));
    expect(JSON.stringify(payload)).not.toMatch(/raw answer|private note|localStorage|questionImageUrls|raw\.png/);
  });

  it('surfaces Supabase RPC failures without claiming hosted sync succeeded', async () => {
    const fake = createClient({ message: 'region_access_blocked' });

    await expect(recordHostedProgressEvent({
      classroomContext: classroomContext(),
      regionId: 'algebra-forge',
      activityType: 'guardian',
      eventType: 'guardian_attempted',
      config: validConfig,
      createClient: async () => fake.client,
    })).resolves.toEqual({ status: 'failed', error: 'region_access_blocked' });
  });
});
