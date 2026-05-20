import type { ClassRegionAccess } from '../types';
import { canStudentUseRegionActivity, type RegionActivityAccess } from './classRegionAccess';
import { createSupabaseBrowserClient } from './supabaseClient';
import { resolveSupabaseConfig, type SupabaseConfig } from './supabaseConfig';
import type { StudentClassroomContext } from './studentClassroomService';

export type HostedProgressActivityType = 'field_guide' | 'quick_check' | 'warm_up' | 'exam_practice' | 'mark_scheme' | 'guardian';

export type HostedProgressEventType =
  | 'field_guide_completed'
  | 'quick_check_completed'
  | 'warm_up_completed'
  | 'practice_attempt_saved'
  | 'mark_scheme_revealed'
  | 'guardian_attempted'
  | 'guardian_completed';

export type HostedProgressEventPayload = Partial<{
  scoreRatio: number;
  marksEarned: number;
  marksAvailable: number;
  outcome: 'got_it' | 'partial' | 'missed';
  completed: boolean;
  passed: boolean;
  durationSeconds: number;
}>;

interface SupabaseRpcResult<T> {
  data: T[] | T | null;
  error: unknown;
}

export interface SupabaseProgressEventClient {
  rpc<T = Record<string, unknown>>(fn: string, args?: Record<string, unknown>): Promise<SupabaseRpcResult<T>>;
}

export interface RecordHostedProgressEventInput {
  classroomContext: StudentClassroomContext;
  regionId: string;
  activityType: HostedProgressActivityType;
  eventType: HostedProgressEventType;
  contentId?: string;
  questionId?: string;
  skillId?: string;
  eventPayload?: HostedProgressEventPayload;
  config?: SupabaseConfig;
  createClient?: () => Promise<SupabaseProgressEventClient | undefined>;
}

export type HostedProgressEventResult =
  | { status: 'synced'; eventId?: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string };

interface InsertedProgressEventRow {
  id?: string;
}

const idPattern = /^[A-Za-z0-9._:-]{1,128}$/;
const eventTypeByActivity: Record<HostedProgressActivityType, HostedProgressEventType[]> = {
  field_guide: ['field_guide_completed'],
  quick_check: ['quick_check_completed'],
  warm_up: ['warm_up_completed'],
  exam_practice: ['practice_attempt_saved'],
  mark_scheme: ['mark_scheme_revealed'],
  guardian: ['guardian_attempted', 'guardian_completed'],
};

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}

function safeIdentifier(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return idPattern.test(trimmed) ? trimmed : null;
}

function regionAccessRecord(regionAccess: ClassRegionAccess[], regionId: string): ClassRegionAccess | undefined {
  return regionAccess.find((item) => item.regionId === regionId);
}

function regionActivityFor(activityType: HostedProgressActivityType): RegionActivityAccess {
  if (activityType === 'field_guide') return 'field_guide';
  if (activityType === 'quick_check') return 'quick_check';
  if (activityType === 'warm_up') return 'warm_up';
  if (activityType === 'guardian') return 'guardian';
  return 'exam_practice';
}

function sanitizedPayload(payload: HostedProgressEventPayload | undefined): HostedProgressEventPayload {
  const next: HostedProgressEventPayload = {};
  if (!payload) return next;

  if (typeof payload.scoreRatio === 'number' && Number.isFinite(payload.scoreRatio)) {
    next.scoreRatio = Math.max(0, Math.min(1, payload.scoreRatio));
  }
  if (typeof payload.marksEarned === 'number' && Number.isFinite(payload.marksEarned)) {
    next.marksEarned = Math.max(0, Math.min(999, payload.marksEarned));
  }
  if (typeof payload.marksAvailable === 'number' && Number.isFinite(payload.marksAvailable)) {
    next.marksAvailable = Math.max(0, Math.min(999, payload.marksAvailable));
  }
  if (payload.outcome === 'got_it' || payload.outcome === 'partial' || payload.outcome === 'missed') {
    next.outcome = payload.outcome;
  }
  if (typeof payload.completed === 'boolean') next.completed = payload.completed;
  if (typeof payload.passed === 'boolean') next.passed = payload.passed;
  if (typeof payload.durationSeconds === 'number' && Number.isFinite(payload.durationSeconds)) {
    next.durationSeconds = Math.max(0, Math.min(86400, Math.round(payload.durationSeconds)));
  }

  return next;
}

async function createDefaultClient(config: SupabaseConfig): Promise<SupabaseProgressEventClient | undefined> {
  return await createSupabaseBrowserClient(config, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }) as SupabaseProgressEventClient | undefined;
}

export async function recordHostedProgressEvent(input: RecordHostedProgressEventInput): Promise<HostedProgressEventResult> {
  const config = input.config ?? resolveSupabaseConfig();
  if (config.missing.length > 0 || !config.isConfigured) {
    return { status: 'skipped', reason: 'Supabase browser configuration is not available.' };
  }

  if (!eventTypeByActivity[input.activityType]?.includes(input.eventType)) {
    return { status: 'failed', error: 'Unsupported hosted progress event type.' };
  }

  const accessRecord = regionAccessRecord(input.classroomContext.regionAccess, input.regionId);
  const allowed = canStudentUseRegionActivity(
    {
      regionId: input.regionId,
      access: accessRecord?.access ?? 'field_guide_only',
      accessRecord,
      classroomControlled: true,
    },
    regionActivityFor(input.activityType),
  );
  if (!allowed) {
    return { status: 'failed', error: 'This region is not open for that hosted progress activity.' };
  }

  const client = await (input.createClient ? input.createClient() : createDefaultClient(config));
  if (!client) return { status: 'failed', error: 'Supabase progress event client could not be created.' };

  const { data, error } = await client.rpc<InsertedProgressEventRow>('record_student_progress_event', {
    p_class_id: input.classroomContext.classRecord.id,
    p_class_membership_id: input.classroomContext.membership.id,
    p_student_profile_id: input.classroomContext.studentProfile.id,
    p_region_id: input.regionId,
    p_activity_type: input.activityType,
    p_event_type: input.eventType,
    p_content_id: safeIdentifier(input.contentId),
    p_question_id: safeIdentifier(input.questionId),
    p_skill_id: safeIdentifier(input.skillId),
    p_event_payload: sanitizedPayload(input.eventPayload),
  });

  if (error) {
    return { status: 'failed', error: errorMessage(error, 'Supabase progress event RPC failed.') };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return { status: 'synced', eventId: row?.id };
}
