import { useEffect, useState } from 'react';
import type { AsterionRole } from '../types';
import { canAccessHostedRole, type HostedRoleRequirement } from './hostedRoleHierarchy';
import { createSupabaseBrowserClient } from './supabaseClient';
import { resolveSupabaseConfig, type SupabaseConfig } from './supabaseConfig';

interface SupabaseRoleAuthSession {
  user?: {
    id?: string;
    email?: string;
  } | null;
}

interface SupabaseRoleAuthSubscription {
  unsubscribe(): void;
}

interface SupabaseRoleAuthClient {
  getSession(): Promise<{ data?: { session?: SupabaseRoleAuthSession | null } | null; error?: unknown }>;
  onAuthStateChange?(
    callback: (event: string, session: SupabaseRoleAuthSession | null) => void,
  ): { data?: { subscription?: SupabaseRoleAuthSubscription | null } | null };
}

interface SupabaseQueryResult<T> {
  data: T[] | null;
  error: unknown;
}

interface SupabaseRpcResult<T> {
  data: T[] | T | null;
  error: unknown;
}

export interface SupabaseRoleQueryBuilder<T = Record<string, unknown>> extends PromiseLike<SupabaseQueryResult<T>> {
  select(columns: string): SupabaseRoleQueryBuilder<T>;
  eq(column: string, value: unknown): SupabaseRoleQueryBuilder<T>;
  in(column: string, values: unknown[]): SupabaseRoleQueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): SupabaseRoleQueryBuilder<T>;
}

export interface SupabaseRoleClient {
  auth: SupabaseRoleAuthClient;
  from<T = Record<string, unknown>>(table: string): SupabaseRoleQueryBuilder<T>;
  rpc?<T = Record<string, unknown>>(fn: string, args?: Record<string, unknown>): Promise<SupabaseRpcResult<T>>;
}

export interface SupabaseRoleServiceOptions {
  config?: SupabaseConfig;
  createClient?: () => Promise<SupabaseRoleClient | undefined>;
  enabled?: boolean;
}

export interface SupabaseRoleUser {
  id: string;
  email?: string;
}

export interface SupabaseUserRoleRecord {
  id: string;
  userId: string;
  organizationId: string;
  role: AsterionRole;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseTeacherProfileContext {
  id: string;
  userId: string;
  organizationId: string;
  displayName: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseStudentProfileContext {
  id: string;
  userId?: string;
  organizationId: string;
  displayName: string;
  optionalEmail?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseOrganizationContext {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SupabaseRoleContext {
  user: SupabaseRoleUser;
  roles: SupabaseUserRoleRecord[];
  roleNames: AsterionRole[];
  organizationIds: string[];
  organizations: SupabaseOrganizationContext[];
  teacherProfiles: SupabaseTeacherProfileContext[];
  studentProfiles: SupabaseStudentProfileContext[];
}

export type SupabaseRoleContextState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'ready'; context: SupabaseRoleContext }
  | { status: 'error'; error: string; detail?: string };

interface UserRoleRow {
  id: string;
  user_id: string;
  organization_id: string;
  role: AsterionRole;
  status: 'active' | 'inactive';
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

interface ActivationRow {
  id: string;
  user_id: string;
  organization_id: string;
  display_name: string;
  email: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

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

interface OrganizationRow {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

const roleColumns = 'id, user_id, organization_id, role, status, created_at, updated_at';
const teacherProfileColumns = 'id, user_id, organization_id, display_name, email, status, created_at, updated_at';
const studentProfileColumns = 'id, user_id, organization_id, display_name, optional_email, status, created_at, updated_at';
const organizationColumns = 'id, name, status, created_at, updated_at';
const roleOrder: AsterionRole[] = ['admin', 'teacher', 'student'];

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}

function configErrorState(config: SupabaseConfig): SupabaseRoleContextState | undefined {
  if (config.missing.length > 0) {
    return {
      status: 'error',
      error: 'Browser-safe Supabase configuration is missing.',
      detail: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for hosted dashboard access. Normal student practice remains local and available.',
    };
  }
  if (!config.isConfigured) {
    return {
      status: 'error',
      error: 'Browser-safe Supabase configuration is invalid.',
      detail: 'VITE_SUPABASE_URL must be a valid HTTPS Supabase project URL. Normal student practice remains local and available.',
    };
  }
  return undefined;
}

async function createDefaultRoleClient(config: SupabaseConfig): Promise<SupabaseRoleClient | undefined> {
  return await createSupabaseBrowserClient(config, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }) as SupabaseRoleClient | undefined;
}

async function readRows<T>(query: PromiseLike<SupabaseQueryResult<T>>, context: string): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(`${context}: ${errorMessage(error, 'Supabase role context could not be read.')}`);
  return data ?? [];
}

async function activatePendingTeacherRole(client: SupabaseRoleClient): Promise<void> {
  if (!client.rpc) return;
  const { error } = await client.rpc<ActivationRow>('activate_pending_teacher_role_for_current_user');
  if (error) throw new Error(`activate_pending_teacher_role_for_current_user: ${errorMessage(error, 'Pending teacher access could not be activated.')}`);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function mapRoleRow(row: UserRoleRow): SupabaseUserRoleRecord {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTeacherProfile(row: TeacherProfileRow): SupabaseTeacherProfileContext {
  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    displayName: row.display_name,
    email: row.email ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStudentProfile(row: StudentProfileRow): SupabaseStudentProfileContext {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    organizationId: row.organization_id,
    displayName: row.display_name,
    optionalEmail: row.optional_email ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrganization(row: OrganizationRow): SupabaseOrganizationContext {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readContextForSession(client: SupabaseRoleClient, session: SupabaseRoleAuthSession | null | undefined): Promise<SupabaseRoleContextState> {
  const userId = session?.user?.id;
  if (!userId) return { status: 'signed-out' };

  try {
    await activatePendingTeacherRole(client);
    const [roleRows, teacherProfileRows, studentProfileRows] = await Promise.all([
      readRows(
        client.from<UserRoleRow>('user_roles')
          .select(roleColumns)
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('role', { ascending: true }),
        'user_roles',
      ),
      readRows(
        client.from<TeacherProfileRow>('teacher_profiles')
          .select(teacherProfileColumns)
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('display_name', { ascending: true }),
        'teacher_profiles',
      ),
      readRows(
        client.from<StudentProfileRow>('student_profiles')
          .select(studentProfileColumns)
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('display_name', { ascending: true }),
        'student_profiles',
      ),
    ]);

    const roles = roleRows.map(mapRoleRow);
    const teacherProfiles = teacherProfileRows.map(mapTeacherProfile);
    const studentProfiles = studentProfileRows.map(mapStudentProfile);
    const roleNames = roleOrder.filter((role) => roles.some((record) => record.role === role));
    const organizationIds = unique([
      ...roles.map((role) => role.organizationId),
      ...teacherProfiles.map((profile) => profile.organizationId),
      ...studentProfiles.map((profile) => profile.organizationId),
    ]);
    const organizationRows = organizationIds.length
      ? await readRows(
        client.from<OrganizationRow>('organizations')
          .select(organizationColumns)
          .in('id', organizationIds)
          .order('name', { ascending: true }),
        'organizations',
      )
      : [];
    const organizations = organizationRows.map(mapOrganization);

    return {
      status: 'ready',
      context: {
        user: {
          id: userId,
          email: session.user?.email,
        },
        roles,
        roleNames,
        organizationIds,
        organizations,
        teacherProfiles,
        studentProfiles,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      error: 'Supabase role context could not be loaded.',
      detail: errorMessage(error, 'Check the signed-in user role rows and Supabase RLS policies.'),
    };
  }
}

export async function readSupabaseRoleContext(options: SupabaseRoleServiceOptions = {}): Promise<SupabaseRoleContextState> {
  if (options.enabled === false) return { status: 'signed-out' };

  const config = options.config ?? resolveSupabaseConfig();
  const configError = configErrorState(config);
  if (configError) return configError;

  const createClient = options.createClient ?? (() => createDefaultRoleClient(config));
  const client = await createClient();
  if (!client) {
    return {
      status: 'error',
      error: 'Supabase role client could not be created.',
      detail: 'Hosted dashboard access requires the browser Supabase client.',
    };
  }

  const sessionResult = await client.auth.getSession();
  if (sessionResult.error) {
    return {
      status: 'error',
      error: 'Supabase Auth session could not be read.',
      detail: errorMessage(sessionResult.error, 'Sign in again and retry the dashboard route.'),
    };
  }

  return readContextForSession(client, sessionResult.data?.session ?? null);
}

export function hasSupabaseRole(context: SupabaseRoleContext | undefined, role: HostedRoleRequirement): boolean {
  return canAccessHostedRole(context?.roleNames, role);
}

export function roleSummary(context: SupabaseRoleContext): string {
  return context.roleNames.length ? context.roleNames.join(', ') : 'no active hosted role';
}

export function useSupabaseRoleContext(options: SupabaseRoleServiceOptions = {}): SupabaseRoleContextState {
  const enabled = options.enabled ?? true;
  const createClient = options.createClient;
  const [config] = useState(() => options.config ?? resolveSupabaseConfig());
  const [state, setState] = useState<SupabaseRoleContextState>(() => (enabled ? { status: 'loading' } : { status: 'signed-out' }));

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
    let subscription: SupabaseRoleAuthSubscription | undefined;

    async function syncSession() {
      setState({ status: 'loading' });
      const client = await (createClient ? createClient() : createDefaultRoleClient(config));
      if (cancelled) return;
      if (!client) {
        setState({
          status: 'error',
          error: 'Supabase role client could not be created.',
          detail: 'Hosted dashboard access requires the browser Supabase client.',
        });
        return;
      }

      const sessionResult = await client.auth.getSession();
      if (cancelled) return;
      if (sessionResult.error) {
        setState({
          status: 'error',
          error: 'Supabase Auth session could not be read.',
          detail: errorMessage(sessionResult.error, 'Sign in again and retry the dashboard route.'),
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
  }, [config, createClient, enabled]);

  return state;
}
