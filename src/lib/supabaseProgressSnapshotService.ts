import type { ClassRegionAccess, NormalizedQuestion, StoredProgress } from '../types';
import type { P3RegionId } from './p3SkillContract';
import { isValidP3RegionId } from './p3SkillContract';
import {
  buildProgressSnapshotPayload,
  PROGRESS_SNAPSHOT_SOURCE,
  type ProgressSnapshotAccessStatus,
} from './progressSnapshot';
import { createSupabaseBrowserClient } from './supabaseClient';
import { resolveSupabaseConfig, type SupabaseConfig } from './supabaseConfig';
import type { StudentClassroomContext } from './studentClassroomService';

interface SupabaseInsertResult<T> {
  data: T[] | null;
  error: unknown;
}

export interface SupabaseProgressSnapshotInsertBuilder<T = Record<string, unknown>> extends PromiseLike<SupabaseInsertResult<T>> {
  select(columns: string): SupabaseProgressSnapshotInsertBuilder<T>;
}

export interface SupabaseProgressSnapshotQueryBuilder<T = Record<string, unknown>> {
  insert(values: Record<string, unknown>): SupabaseProgressSnapshotInsertBuilder<T>;
}

export interface SupabaseProgressSnapshotClient {
  from<T = Record<string, unknown>>(table: string): SupabaseProgressSnapshotQueryBuilder<T>;
}

export interface SyncCurrentProgressSnapshotInput {
  progress: StoredProgress;
  questions?: NormalizedQuestion[];
  classroomContext: StudentClassroomContext;
  config?: SupabaseConfig;
  createClient?: () => Promise<SupabaseProgressSnapshotClient | undefined>;
  now?: string;
}

export type ProgressSnapshotSyncResult =
  | { status: 'synced'; snapshotId?: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string };

interface InsertedSnapshotRow {
  id?: string;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}

function hostedRegionAccessMap(regionAccess: ClassRegionAccess[]): Partial<Record<P3RegionId, ProgressSnapshotAccessStatus>> {
  return regionAccess.reduce<Partial<Record<P3RegionId, ProgressSnapshotAccessStatus>>>((acc, item) => {
    if (!isValidP3RegionId(item.regionId)) return acc;
    acc[item.regionId] = item.access === 'field_guide_only' ? 'field_guide_only' : 'open';
    return acc;
  }, {});
}

async function createDefaultClient(config: SupabaseConfig): Promise<SupabaseProgressSnapshotClient | undefined> {
  return await createSupabaseBrowserClient(config, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }) as SupabaseProgressSnapshotClient | undefined;
}

export async function syncCurrentProgressSnapshot(input: SyncCurrentProgressSnapshotInput): Promise<ProgressSnapshotSyncResult> {
  const config = input.config ?? resolveSupabaseConfig();
  if (config.missing.length > 0 || !config.isConfigured) {
    return { status: 'skipped', reason: 'Supabase browser configuration is not available.' };
  }

  const client = await (input.createClient ? input.createClient() : createDefaultClient(config));
  if (!client) return { status: 'failed', error: 'Supabase progress snapshot client could not be created.' };

  try {
    const payload = buildProgressSnapshotPayload({
      progress: input.progress,
      questions: input.questions,
      regionAccess: hostedRegionAccessMap(input.classroomContext.regionAccess),
      now: input.now,
    });

    const { data, error } = await client.from<InsertedSnapshotRow>('student_progress_snapshots')
      .insert({
        class_membership_id: input.classroomContext.membership.id,
        student_profile_id: input.classroomContext.studentProfile.id,
        class_id: input.classroomContext.classRecord.id,
        snapshot_version: payload.snapshotVersion,
        source: PROGRESS_SNAPSHOT_SOURCE,
        summary_json: payload.summaryJson,
        region_summary_json: payload.regionSummaryJson,
      })
      .select('id');

    if (error) {
      return { status: 'failed', error: errorMessage(error, 'Supabase progress snapshot insert failed.') };
    }

    return { status: 'synced', snapshotId: data?.[0]?.id };
  } catch (error) {
    return { status: 'failed', error: errorMessage(error, 'Progress snapshot could not be built or inserted.') };
  }
}
