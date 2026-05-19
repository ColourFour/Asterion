import { describe, expect, it } from 'vitest';
import { claimStudentRosterSlot, normalizeRosterClaimRpcResult } from '../lib/studentClassClaimService';
import type { AsterionRuntimeConfig } from '../lib/appConfig';
import type { AsterionSupabaseClient } from '../lib/supabaseClient';

function runtimeConfig(source: AsterionRuntimeConfig['studentClassClaimSource']): AsterionRuntimeConfig {
  return {
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

  it('uses the Supabase RPC only when student claim source is explicitly Supabase', async () => {
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
