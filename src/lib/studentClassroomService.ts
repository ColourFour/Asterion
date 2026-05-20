import { useCallback, useEffect, useState } from 'react';
import type { ClassRegionAccess, ClassRegionAccessMode, StudentClaimState } from '../types';
import { createSupabaseBrowserClient } from './supabaseClient';
import { resolveSupabaseConfig, type SupabaseConfig } from './supabaseConfig';
import { P3_REGION_DEFINITIONS, isValidP3RegionId } from './p3SkillContract';

interface SupabaseAuthSession {
  user?: {
    id?: string;
    email?: string;
  } | null;
}

interface SupabaseAuthSubscription {
  unsubscribe(): void;
}

interface SupabaseAuthClient {
  getSession(): Promise<{ data?: { session?: SupabaseAuthSession | null } | null; error?: unknown }>;
  onAuthStateChange?(
    callback: (event: string, session: SupabaseAuthSession | null) => void,
  ): { data?: { subscription?: SupabaseAuthSubscription | null } | null };
}

interface SupabaseQueryResult<T> {
  data: T[] | null;
  error: unknown;
}

export interface SupabaseStudentClassroomQueryBuilder<T = Record<string, unknown>> extends PromiseLike<SupabaseQueryResult<T>> {
  select(columns: string): SupabaseStudentClassroomQueryBuilder<T>;
  eq(column: string, value: unknown): SupabaseStudentClassroomQueryBuilder<T>;
  in(column: string, values: unknown[]): SupabaseStudentClassroomQueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): SupabaseStudentClassroomQueryBuilder<T>;
}

export interface SupabaseStudentClassroomClient {
  auth: SupabaseAuthClient;
  from<T = Record<string, unknown>>(table: string): SupabaseStudentClassroomQueryBuilder<T>;
}

export interface StudentClassroomServiceOptions {
  config?: SupabaseConfig;
  createClient?: () => Promise<SupabaseStudentClassroomClient | undefined>;
  enabled?: boolean;
  reloadKey?: number;
}

export interface HostedStudentProfileContext {
  id: string;
  userId: string;
  organizationId: string;
  displayName: string;
  optionalEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HostedClassMembershipContext {
  id: string;
  classId: string;
  studentProfileId: string;
  rosterName: string;
  claimedByUserId: string;
  claimedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface HostedClassContext {
  id: string;
  organizationId: string;
  teacherId: string;
  name: string;
  classCode: string;
  academicYearTerm?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HostedTeacherContext {
  id: string;
  userId: string;
  organizationId: string;
  displayName: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentClassroomContext {
  user: {
    id: string;
    email?: string;
  };
  studentProfile: HostedStudentProfileContext;
  membership: HostedClassMembershipContext;
  classRecord: HostedClassContext;
  teacher: HostedTeacherContext;
  regionAccess: ClassRegionAccess[];
  claim: StudentClaimState;
}

export type StudentClassroomContextState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'missing-membership'; message: string }
  | { status: 'ready'; context: StudentClassroomContext }
  | { status: 'error'; error: string; detail?: string };

interface StudentProfileRow {
  id: string;
  user_id: string | null;
  organization_id: string;
  display_name: string;
  optional_email: string | null;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

interface ClassMembershipRow {
  id: string;
  class_id: string;
  student_profile_id: string;
  roster_name: string;
  roster_status: 'unclaimed' | 'claimed' | 'archived';
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ClassRow {
  id: string;
  organization_id: string;
  teacher_id: string;
  name: string;
  academic_year_or_term: string | null;
  class_code: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

interface TeacherProfileRow {
  id: string;
  user_id: string;
  organization_id: string;
  display_name: string;
  email: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface ClassRegionAccessRow {
  id: string;
  class_id: string;
  region_id: string;
  access_status: 'open' | 'field_guide_only';
  updated_by_user_id: string | null;
  updated_at: string;
  created_at: string;
}

const studentProfileColumns = 'id, user_id, organization_id, display_name, optional_email, status, created_at, updated_at';
const membershipColumns = 'id, class_id, student_profile_id, roster_name, roster_status, claimed_by_user_id, claimed_at, archived_at, created_at, updated_at';
const classColumns = 'id, organization_id, teacher_id, name, academic_year_or_term, class_code, status, created_at, updated_at';
const teacherColumns = 'id, user_id, organization_id, display_name, email, status, created_at, updated_at';
const regionAccessColumns = 'id, class_id, region_id, access_status, updated_by_user_id, updated_at, created_at';

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}

function configErrorState(config: SupabaseConfig): StudentClassroomContextState | undefined {
  if (config.missing.length > 0) {
    return {
      status: 'error',
      error: 'Browser-safe Supabase configuration is missing.',
      detail: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for classroom-pilot student access.',
    };
  }
  if (!config.isConfigured) {
    return {
      status: 'error',
      error: 'Browser-safe Supabase configuration is invalid.',
      detail: 'VITE_SUPABASE_URL must be a valid HTTPS Supabase project URL.',
    };
  }
  return undefined;
}

async function createDefaultClient(config: SupabaseConfig): Promise<SupabaseStudentClassroomClient | undefined> {
  return await createSupabaseBrowserClient(config, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }) as SupabaseStudentClassroomClient | undefined;
}

async function readRows<T>(query: PromiseLike<SupabaseQueryResult<T>>, context: string): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(`${context}: ${errorMessage(error, 'Supabase classroom data could not be read.')}`);
  return data ?? [];
}

function firstRow<T>(rows: T[]): T | undefined {
  return rows[0];
}

function mapAccessRow(row: ClassRegionAccessRow): ClassRegionAccess | undefined {
  if (!isValidP3RegionId(row.region_id)) return undefined;
  const region = P3_REGION_DEFINITIONS.find((item) => item.id === row.region_id);
  if (!region) return undefined;
  const access: ClassRegionAccessMode = row.access_status === 'open' ? 'open' : 'field_guide_only';
  return {
    regionId: region.id,
    regionName: region.name,
    access,
    openedAt: access === 'open' ? row.updated_at : undefined,
    lockedAt: access === 'field_guide_only' ? row.updated_at : undefined,
    updatedByRole: 'teacher',
    updatedAt: row.updated_at,
  };
}

function regionAccessFromRows(rows: ClassRegionAccessRow[]): ClassRegionAccess[] {
  const byRegion = new Map(
    rows
      .map(mapAccessRow)
      .filter((item): item is ClassRegionAccess => Boolean(item))
      .map((item) => [item.regionId, item]),
  );

  return P3_REGION_DEFINITIONS.map((region) => (
    byRegion.get(region.id) ?? {
      regionId: region.id,
      regionName: region.name,
      access: 'field_guide_only',
      updatedByRole: 'teacher',
      updatedAt: new Date(0).toISOString(),
    }
  ));
}

function buildClaim(classRow: ClassRow, teacher: TeacherProfileRow, membership: ClassMembershipRow): StudentClaimState {
  return {
    status: 'claimed',
    classId: classRow.id,
    className: classRow.name,
    classCode: classRow.class_code,
    teacherId: teacher.id,
    teacherName: teacher.display_name,
    rosterStudentId: membership.id,
    displayName: membership.roster_name,
    message: 'Hosted classroom membership verified through Supabase.',
  };
}

async function readContextForSession(client: SupabaseStudentClassroomClient, session: SupabaseAuthSession | null | undefined): Promise<StudentClassroomContextState> {
  const userId = session?.user?.id;
  if (!userId) return { status: 'signed-out' };

  try {
    const studentProfile = firstRow(await readRows(
      client.from<StudentProfileRow>('student_profiles')
        .select(studentProfileColumns)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false }),
      'student_profiles',
    ));

    if (!studentProfile?.user_id) {
      return {
        status: 'missing-membership',
        message: 'Sign in and claim a roster slot before entering the classroom pilot.',
      };
    }

    const membership = firstRow(await readRows(
      client.from<ClassMembershipRow>('class_memberships')
        .select(membershipColumns)
        .eq('student_profile_id', studentProfile.id)
        .eq('claimed_by_user_id', userId)
        .eq('roster_status', 'claimed')
        .order('updated_at', { ascending: false }),
      'class_memberships',
    ));

    if (!membership?.claimed_by_user_id || !membership.claimed_at) {
      return {
        status: 'missing-membership',
        message: 'Your hosted roster slot is not currently claimed. Ask your teacher if it was reset or archived.',
      };
    }

    const classRow = firstRow(await readRows(
      client.from<ClassRow>('classes')
        .select(classColumns)
        .eq('id', membership.class_id)
        .eq('status', 'active'),
      'classes',
    ));

    if (!classRow) {
      return {
        status: 'missing-membership',
        message: 'Your claimed class is not active. Ask your teacher for the current class code.',
      };
    }

    const [teacher, regionAccessRows] = await Promise.all([
      readRows(
        client.from<TeacherProfileRow>('teacher_profiles')
          .select(teacherColumns)
          .eq('id', classRow.teacher_id)
          .eq('status', 'active'),
        'teacher_profiles',
      ).then(firstRow),
      readRows(
        client.from<ClassRegionAccessRow>('class_region_access')
          .select(regionAccessColumns)
          .eq('class_id', classRow.id)
          .order('region_id', { ascending: true }),
        'class_region_access',
      ),
    ]);

    if (!teacher) {
      return {
        status: 'missing-membership',
        message: 'Your class teacher profile is not active. Ask your teacher or admin for help.',
      };
    }

    return {
      status: 'ready',
      context: {
        user: {
          id: userId,
          email: session.user?.email,
        },
        studentProfile: {
          id: studentProfile.id,
          userId: studentProfile.user_id,
          organizationId: studentProfile.organization_id,
          displayName: studentProfile.display_name,
          optionalEmail: studentProfile.optional_email ?? undefined,
          createdAt: studentProfile.created_at,
          updatedAt: studentProfile.updated_at,
        },
        membership: {
          id: membership.id,
          classId: membership.class_id,
          studentProfileId: membership.student_profile_id,
          rosterName: membership.roster_name,
          claimedByUserId: membership.claimed_by_user_id,
          claimedAt: membership.claimed_at,
          createdAt: membership.created_at,
          updatedAt: membership.updated_at,
        },
        classRecord: {
          id: classRow.id,
          organizationId: classRow.organization_id,
          teacherId: classRow.teacher_id,
          name: classRow.name,
          classCode: classRow.class_code,
          academicYearTerm: classRow.academic_year_or_term ?? undefined,
          createdAt: classRow.created_at,
          updatedAt: classRow.updated_at,
        },
        teacher: {
          id: teacher.id,
          userId: teacher.user_id,
          organizationId: teacher.organization_id,
          displayName: teacher.display_name,
          email: teacher.email ?? undefined,
          createdAt: teacher.created_at,
          updatedAt: teacher.updated_at,
        },
        regionAccess: regionAccessFromRows(regionAccessRows),
        claim: buildClaim(classRow, teacher, membership),
      },
    };
  } catch (error) {
    return {
      status: 'error',
      error: 'Supabase student classroom context could not be loaded.',
      detail: errorMessage(error, 'Check the signed-in student membership and classroom RLS policies.'),
    };
  }
}

export async function getCurrentStudentClassroomContext(options: StudentClassroomServiceOptions = {}): Promise<StudentClassroomContextState> {
  if (options.enabled === false) return { status: 'signed-out' };

  const config = options.config ?? resolveSupabaseConfig();
  const configError = configErrorState(config);
  if (configError) return configError;

  const createClient = options.createClient ?? (() => createDefaultClient(config));
  const client = await createClient();
  if (!client) {
    return {
      status: 'error',
      error: 'Supabase student classroom client could not be created.',
      detail: 'Hosted classroom access requires the browser Supabase client.',
    };
  }

  const sessionResult = await client.auth.getSession();
  if (sessionResult.error) {
    return {
      status: 'error',
      error: 'Supabase Auth session could not be read.',
      detail: errorMessage(sessionResult.error, 'Sign in again before entering the classroom pilot.'),
    };
  }

  return readContextForSession(client, sessionResult.data?.session ?? null);
}

export function useStudentClassroomContext(options: StudentClassroomServiceOptions = {}): [StudentClassroomContextState, () => void] {
  const enabled = options.enabled ?? true;
  const createClient = options.createClient;
  const reloadKey = options.reloadKey ?? 0;
  const [config] = useState(() => options.config ?? resolveSupabaseConfig());
  const [manualReloadKey, setManualReloadKey] = useState(0);
  const [state, setState] = useState<StudentClassroomContextState>(() => (enabled ? { status: 'loading' } : { status: 'signed-out' }));
  const refresh = useCallback(() => setManualReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'signed-out' });
      return undefined;
    }

    const configError = configErrorState(config);
    if (configError) {
      setState(configError);
      return undefined;
    }

    let cancelled = false;
    let subscription: SupabaseAuthSubscription | undefined;

    async function syncSession() {
      setState({ status: 'loading' });
      const client = await (createClient ? createClient() : createDefaultClient(config));
      if (cancelled) return;
      if (!client) {
        setState({
          status: 'error',
          error: 'Supabase student classroom client could not be created.',
          detail: 'Hosted classroom access requires the browser Supabase client.',
        });
        return;
      }

      const sessionResult = await client.auth.getSession();
      if (cancelled) return;
      if (sessionResult.error) {
        setState({
          status: 'error',
          error: 'Supabase Auth session could not be read.',
          detail: errorMessage(sessionResult.error, 'Sign in again before entering the classroom pilot.'),
        });
        return;
      }

      setState(await readContextForSession(client, sessionResult.data?.session ?? null));
      subscription = client.auth.onAuthStateChange?.((_event, session) => {
        void readContextForSession(client, session ?? null).then((nextState) => {
          if (!cancelled) setState(nextState);
        });
      }).data?.subscription ?? undefined;
    }

    syncSession();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [config, createClient, enabled, manualReloadKey, reloadKey]);

  return [state, refresh];
}
