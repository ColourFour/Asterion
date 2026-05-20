import { resolveSupabaseConfig, type SupabaseConfig } from './supabaseConfig';
import type { StudentClassroomContext } from './studentClassroomService';
import type { NormalizedQuestion, StoredProgress } from '../types';

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

export async function syncCurrentProgressSnapshot(input: SyncCurrentProgressSnapshotInput): Promise<ProgressSnapshotSyncResult> {
  const config = input.config ?? resolveSupabaseConfig();
  if (config.missing.length > 0 || !config.isConfigured) {
    return { status: 'skipped', reason: 'Supabase browser configuration is not available.' };
  }

  void input;
  return {
    status: 'skipped',
    reason: 'Hosted teacher-visible progress snapshots are disabled; classroom-pilot progress is event-derived.',
  };
}
