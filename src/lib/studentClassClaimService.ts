import type { StudentClaimState, StudentClaimStatus } from '../types';
import { resolveRuntimeConfig, type AsterionRuntimeConfig } from './appConfig';
import { claimRosterSlotByClassCode } from './dashboardMockService';
import { createSupabaseBrowserClient, type AsterionSupabaseClient } from './supabaseClient';

export interface StudentClassClaimInput {
  classCode: string;
  displayName: string;
  optionalEmail?: string;
}

interface ClaimRosterSlotRpcRow {
  status?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  class_code?: string | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
  roster_membership_id?: string | null;
  roster_name?: string | null;
  message?: string | null;
}

const claimStatusMessages: Record<StudentClaimStatus, string> = {
  unclaimed: 'Ask your teacher to add your name to the roster first.',
  claimed: 'Roster slot claimed. Optional details can be added later.',
  invalid_class_code: 'Enter a valid active class code from your teacher.',
  roster_name_not_found: 'Ask your teacher to add your name to the roster first.',
  ambiguous_roster_name: 'More than one roster entry uses that name. Ask your teacher to make the roster name unique before claiming.',
  already_claimed: 'This roster entry has already been claimed. Ask your teacher or admin for help.',
  archived: 'This roster entry is archived. Ask your teacher or admin for help.',
  unauthenticated: 'Sign in before claiming a roster slot.',
  unauthorized: 'This signed-in account is not authorized to claim that roster slot.',
  claim_unavailable: 'Hosted roster claiming is unavailable in this build. Ask your teacher or admin for help.',
};

function isStudentClaimStatus(value: unknown): value is StudentClaimStatus {
  return typeof value === 'string' && value in claimStatusMessages;
}

export function normalizeRosterClaimRpcResult(row: ClaimRosterSlotRpcRow | null | undefined): StudentClaimState {
  const status = isStudentClaimStatus(row?.status) ? row.status : 'claim_unavailable';
  const message = typeof row?.message === 'string' && row.message.trim() ? row.message : claimStatusMessages[status];

  return {
    status,
    classId: row?.class_id ?? undefined,
    className: row?.class_name ?? undefined,
    classCode: row?.class_code ?? undefined,
    teacherId: row?.teacher_id ?? undefined,
    teacherName: row?.teacher_name ?? undefined,
    rosterStudentId: row?.roster_membership_id ?? undefined,
    displayName: row?.roster_name ?? undefined,
    message,
  };
}

async function claimViaSupabase(
  input: StudentClassClaimInput,
  createClient: () => Promise<AsterionSupabaseClient | undefined> = () => createSupabaseBrowserClient(),
): Promise<StudentClaimState> {
  const client = await createClient();
  if (!client) {
    return {
      status: 'claim_unavailable',
      message: claimStatusMessages.claim_unavailable,
    };
  }

  const { data, error } = await client
    .rpc('claim_class_roster_slot', {
      p_class_code: input.classCode,
      p_roster_name: input.displayName,
    })
    .single();

  if (error) {
    return {
      status: 'claim_unavailable',
      message: 'Hosted roster claiming failed without creating a local class claim. Ask your teacher or admin for help.',
    };
  }

  return normalizeRosterClaimRpcResult(data as ClaimRosterSlotRpcRow | null);
}

export async function claimStudentRosterSlot(
  input: StudentClassClaimInput,
  options: {
    runtimeConfig?: AsterionRuntimeConfig;
    createClient?: () => Promise<AsterionSupabaseClient | undefined>;
  } = {},
): Promise<StudentClaimState> {
  const runtimeConfig = options.runtimeConfig ?? resolveRuntimeConfig();

  if (runtimeConfig.studentClassClaimSource !== 'supabase') {
    return claimRosterSlotByClassCode(input);
  }

  return claimViaSupabase(input, options.createClient);
}
