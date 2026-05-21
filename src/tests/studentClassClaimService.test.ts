import { describe, expect, it } from 'vitest';
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
): AsterionSupabaseClient {
  return {
    auth: {
      getSession: async () => ({
        data: { session: session ? { user: { id: 'student-user-1', email: 'student@example.test' } } : null },
        error: null,
      }),
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

  it('requires a Supabase session before calling the hosted claim RPC', async () => {
    const claim = await claimStudentRosterSlot(
      { classCode: 'AST-P3A', displayName: 'Test Roster Student' },
      {
        runtimeConfig: runtimeConfig('supabase'),
        createClient: async () => mockRpcClient({ status: 'claimed' }, null, false),
      },
    );

    expect(claim.status).toBe('unauthenticated');
    expect(claim.message).toBe('Sign in before claiming a roster slot.');
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
