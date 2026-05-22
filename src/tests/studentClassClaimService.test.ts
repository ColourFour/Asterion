import { describe, expect, it, vi } from 'vitest';
import { claimStudentRosterSlot, normalizeRosterClaimRpcResult } from '../lib/studentClassClaimService';
import type { AsterionRuntimeConfig } from '../lib/appConfig';
import type { AsterionSupabaseClient } from '../lib/supabaseClient';

function runtimeConfig(source: AsterionRuntimeConfig['studentClassClaimSource']): AsterionRuntimeConfig {
  return {
    profile: {
      name: source === 'supabase' ? 'custom' : 'student-pilot',
      explicit: false,
      staticHostingCompatible: true,
      browserLocalProgress: true,
      supabaseRequired: source === 'supabase',
      hostedProgressSyncEnabled: source === 'supabase',
      aiMarkingEnabled: false,
      productionDashboardAuthority: source === 'supabase',
      dashboardDemoBehaviorEnabled: false,
    },
    configurationBlocked: false,
    requestedStorageMode: 'local',
    effectiveStorageMode: 'local',
    dashboardDemoEnabled: false,
    dashboardDataSource: 'mock',
    dashboardDataSourceExplicit: false,
    dashboardRoutesEnabled: false,
    hostedStorageRequested: false,
    hostedStorageAvailable: false,
    supabaseConfigured: source === 'supabase',
    studentClassClaimSource: source,
    studentClassClaimSourceExplicit: source === 'supabase',
    diagnostics: {
      profileName: source === 'supabase' ? 'custom' : 'student-pilot',
      profileExplicit: false,
      supabaseConfigured: source === 'supabase',
      supabaseRequired: source === 'supabase',
      dashboardDataSource: 'mock',
      dashboardRoutesEnabled: false,
      studentClassClaimSource: source,
      hostedProgressSyncEnabled: source === 'supabase',
      productionDashboardAuthority: source === 'supabase',
    },
  };
}

function mockRpcClient(row: unknown, error: unknown = null, session = true): AsterionSupabaseClient {
  const data = row && typeof row === 'object'
    ? { functionName: 'claim_class_roster_slot', ...(row as Record<string, unknown>) }
    : row;
  return {
    auth: {
      getSession: async () => ({
        data: { session: session ? { user: { id: 'student-user-1', email: 'student@example.test' } } : null },
        error: null,
      }),
      signInAnonymously: async () => ({
        data: { session: { user: { id: 'anonymous-student-user-1' } } },
        error: null,
      }),
    },
    rpc: (functionName: string, params: Record<string, unknown>) => ({
      single: async () => ({
        data: data && typeof data === 'object' ? { ...(data as Record<string, unknown>), functionName, params } : data,
        error,
      }),
    }),
  } as unknown as AsterionSupabaseClient;
}

function capturingRpcClient(
  row: unknown,
  calls: Array<{ functionName: string; params: Record<string, unknown> }>,
  session = true,
  signInAnonymously: () => Promise<unknown> = vi.fn(async () => ({
    data: { session: { user: { id: 'anonymous-student-user-1' } } },
    error: null,
  })),
): AsterionSupabaseClient {
  return {
    auth: {
      getSession: async () => ({
        data: { session: session ? { user: { id: 'student-user-1', email: 'student@example.test' } } : null },
        error: null,
      }),
      signInAnonymously,
    },
    rpc: (functionName: string, params: Record<string, unknown>) => {
      calls.push({ functionName, params });
      return {
        single: async () => ({
          data: row,
          error: null,
        }),
      };
    },
  } as unknown as AsterionSupabaseClient;
}

describe('student class claim service', () => {
  it('normalizes the safe RPC claim result shape used by pending profile setup', () => {
    expect(normalizeRosterClaimRpcResult({
      status: 'claimed',
      class_id: 'class-id',
      class_name: 'P3 Alpha',
      class_code: 'AST-P3A',
      teacher_id: 'teacher-id',
      teacher_name: 'Teacher Hypatia',
      roster_membership_id: 'membership-id',
      roster_name: 'Lyra C.',
      message: 'claimed',
    })).toEqual({
      status: 'claimed',
      classId: 'class-id',
      className: 'P3 Alpha',
      classCode: 'AST-P3A',
      teacherId: 'teacher-id',
      teacherName: 'Teacher Hypatia',
      rosterStudentId: 'membership-id',
      displayName: 'Lyra C.',
      message: 'claimed',
    });
  });

  it('uses the Supabase RPC when runtime student claim source is Supabase', async () => {
    const claim = await claimStudentRosterSlot(
      { classCode: 'AST-P3A', displayName: 'Lyra C.', optionalEmail: 'ignored@example.test' },
      {
        runtimeConfig: runtimeConfig('supabase'),
        createClient: async () => mockRpcClient({
          status: 'claimed',
          class_id: 'class-id',
          class_name: 'P3 Alpha',
          class_code: 'AST-P3A',
          teacher_id: 'teacher-id',
          teacher_name: 'Teacher Hypatia',
          roster_membership_id: 'membership-id',
          roster_name: 'Lyra C.',
        }),
      },
    );

    expect(claim).toMatchObject({
      status: 'claimed',
      rosterStudentId: 'membership-id',
      displayName: 'Lyra C.',
    });
  });

  it('calls the hosted claim RPC with the generated class code and exact roster name', async () => {
    const calls: Array<{ functionName: string; params: Record<string, unknown> }> = [];
    const claim = await claimStudentRosterSlot(
      { classCode: 'AST-E87C6A', displayName: 'Blake' },
      {
        runtimeConfig: runtimeConfig('supabase'),
        createClient: async () => capturingRpcClient({
          status: 'claimed',
          class_id: 'class-id',
          class_name: 'Generated class',
          class_code: 'AST-E87C6A',
          teacher_id: 'teacher-id',
          teacher_name: 'Teacher',
          roster_membership_id: 'membership-id',
          roster_name: 'Blake',
          message: 'claimed',
        }, calls),
      },
    );

    expect(calls).toEqual([{
      functionName: 'claim_class_roster_slot',
      params: {
        p_class_code: 'AST-E87C6A',
        p_roster_name: 'Blake',
      },
    }]);
    expect(claim).toMatchObject({
      status: 'claimed',
      classCode: 'AST-E87C6A',
      displayName: 'Blake',
    });
  });

  it('does not silently fall back to a local trusted claim when the hosted RPC fails', async () => {
    const claim = await claimStudentRosterSlot(
      { classCode: 'AST-P3A', displayName: 'Test Roster Student' },
      {
        runtimeConfig: runtimeConfig('supabase'),
        createClient: async () => mockRpcClient(null, { message: 'rpc failed' }),
      },
    );

    expect(claim.status).toBe('claim_unavailable');
    expect(claim.rosterStudentId).toBeUndefined();
  });

  it('silently creates an anonymous student session before hosted claim when no session exists', async () => {
    const calls: Array<{ functionName: string; params: Record<string, unknown> }> = [];
    const signInAnonymously = vi.fn(async () => ({
      data: { session: { user: { id: 'anonymous-student-user-1' } } },
      error: null,
    }));
    const claim = await claimStudentRosterSlot(
      { classCode: 'AST-P3A', displayName: 'Test Roster Student' },
      {
        runtimeConfig: runtimeConfig('supabase'),
        createClient: async () => capturingRpcClient({
          status: 'claimed',
          roster_membership_id: 'membership-id',
          roster_name: 'Test Roster Student',
        }, calls, false, signInAnonymously),
      },
    );

    expect(signInAnonymously).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
    expect(claim).toMatchObject({
      status: 'claimed',
      rosterStudentId: 'membership-id',
      displayName: 'Test Roster Student',
    });
  });

  it('does not create an anonymous session when a valid session already exists', async () => {
    const calls: Array<{ functionName: string; params: Record<string, unknown> }> = [];
    const signInAnonymously = vi.fn(async () => ({
      data: { session: { user: { id: 'anonymous-student-user-1' } } },
      error: null,
    }));

    await claimStudentRosterSlot(
      { classCode: 'AST-P3A', displayName: 'Test Roster Student' },
      {
        runtimeConfig: runtimeConfig('supabase'),
        createClient: async () => capturingRpcClient({ status: 'claimed' }, calls, true, signInAnonymously),
      },
    );

    expect(signInAnonymously).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });

  it('returns a student-friendly error when anonymous session creation fails', async () => {
    const signInAnonymously = vi.fn(async () => ({
      data: { session: null },
      error: { message: 'anonymous sign-ins disabled' },
    }));
    const calls: Array<{ functionName: string; params: Record<string, unknown> }> = [];

    const claim = await claimStudentRosterSlot(
      { classCode: 'AST-P3A', displayName: 'Test Roster Student' },
      {
        runtimeConfig: runtimeConfig('supabase'),
        createClient: async () => capturingRpcClient({ status: 'claimed' }, calls, false, signInAnonymously),
      },
    );

    expect(claim).toMatchObject({
      status: 'claim_unavailable',
      message: 'Could not start your student session. Tell your teacher.',
    });
    expect(calls).toHaveLength(0);
  });

  it('maps staff-account claim blocks to a clean student route message', async () => {
    const claim = await claimStudentRosterSlot(
      { classCode: 'AST-P3A', displayName: 'Test Roster Student' },
      {
        runtimeConfig: runtimeConfig('supabase'),
        createClient: async () => mockRpcClient({
          status: 'staff_account_cannot_claim_student_slot',
          message: 'This browser is signed in as staff. Use a private window for student testing.',
        }),
      },
    );

    expect(claim).toMatchObject({
      status: 'staff_account_cannot_claim_student_slot',
      message: 'This browser is signed in as staff. Use a private window for student testing.',
    });
  });

  it('accepts code-and-name resume or rebind success from the hosted claim RPC', async () => {
    const claim = await claimStudentRosterSlot(
      { classCode: 'AST-P3A', displayName: 'Test Roster Student' },
      {
        runtimeConfig: runtimeConfig('supabase'),
        createClient: async () => mockRpcClient({
          status: 'claimed',
          class_id: 'class-id',
          class_name: 'P3 Alpha',
          class_code: 'AST-P3A',
          roster_membership_id: 'membership-id',
          roster_name: 'Test Roster Student',
          message: 'Class entry resumed on this browser. Student access is active.',
        }),
      },
    );

    expect(claim).toMatchObject({
      status: 'claimed',
      rosterStudentId: 'membership-id',
      message: 'Class entry resumed on this browser. Student access is active.',
    });
  });

  it.each([
    'claimed',
    'unauthenticated',
    'unauthorized',
    'invalid_class_code',
    'roster_name_not_found',
    'ambiguous_roster_name',
    'archived',
    'already_claimed',
    'reserved_for_other_user',
    'staff_account_cannot_claim_student_slot',
  ])('maps hosted claim RPC status %s', (status) => {
    expect(normalizeRosterClaimRpcResult({ status })).toMatchObject({ status });
  });

  it('keeps the existing mock path as the default local/demo mode', async () => {
    const claim = await claimStudentRosterSlot(
      { classCode: 'NOPE', displayName: 'Missing Student' },
      { runtimeConfig: runtimeConfig('mock') },
    );

    expect(claim.status).toBe('invalid_class_code');
  });
});
