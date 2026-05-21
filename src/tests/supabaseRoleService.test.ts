import { describe, expect, it, vi } from 'vitest';
import {
  hasSupabaseRole,
  readSupabaseRoleContext,
  type SupabaseRoleClient,
  type SupabaseRoleQueryBuilder,
} from '../lib/supabaseRoleService';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

const baseRows = {
  organizations: [
    {
      id: 'org-1',
      name: 'Hosted School',
      status: 'active',
      created_at: '2026-05-18T08:00:00.000Z',
      updated_at: '2026-05-18T08:00:00.000Z',
    },
  ],
  user_roles: [
    {
      id: 'role-student',
      user_id: 'student-user-1',
      organization_id: 'org-1',
      role: 'student',
      status: 'active',
      created_at: '2026-05-18T08:00:00.000Z',
      updated_at: '2026-05-18T08:00:00.000Z',
    },
    {
      id: 'role-teacher',
      user_id: 'teacher-user-1',
      organization_id: 'org-1',
      role: 'teacher',
      status: 'active',
      created_at: '2026-05-18T08:00:00.000Z',
      updated_at: '2026-05-18T08:00:00.000Z',
    },
    {
      id: 'role-admin',
      user_id: 'teacher-user-1',
      organization_id: 'org-1',
      role: 'admin',
      status: 'active',
      created_at: '2026-05-18T08:00:00.000Z',
      updated_at: '2026-05-18T08:00:00.000Z',
    },
    {
      id: 'role-inactive-admin',
      user_id: 'student-user-1',
      organization_id: 'org-1',
      role: 'admin',
      status: 'inactive',
      created_at: '2026-05-18T08:00:00.000Z',
      updated_at: '2026-05-18T08:00:00.000Z',
    },
  ],
  teacher_profiles: [
    {
      id: 'teacher-profile-1',
      user_id: 'teacher-user-1',
      organization_id: 'org-1',
      display_name: 'Ms Hosted',
      email: 'teacher@example.school',
      status: 'active',
      created_at: '2026-05-18T08:00:00.000Z',
      updated_at: '2026-05-18T08:00:00.000Z',
    },
  ],
  student_profiles: [
    {
      id: 'student-profile-1',
      user_id: 'student-user-1',
      organization_id: 'org-1',
      display_name: 'Ada Student',
      optional_email: 'ada@example.school',
      status: 'active',
      created_at: '2026-05-18T08:00:00.000Z',
      updated_at: '2026-05-18T08:00:00.000Z',
    },
  ],
};

type FixtureTable = keyof typeof baseRows;

function createFakeRoleClient({
  userId,
  email,
  rows = baseRows,
  rpc,
}: {
  userId?: string;
  email?: string;
  rows?: typeof baseRows;
  rpc?: SupabaseRoleClient['rpc'];
}) {
  const mutableRows = rows;
  const tableReads: string[] = [];
  const queryOps: string[] = [];
  const unsubscribe = vi.fn();

  class QueryBuilder<T extends Record<string, unknown>> implements SupabaseRoleQueryBuilder<T> {
    private filters: Array<(row: Record<string, unknown>) => boolean> = [];
    private orderColumn?: string;

    constructor(private readonly table: FixtureTable) {}

    select(columns: string) {
      queryOps.push(`${this.table}.select:${columns}`);
      return this;
    }

    eq(column: string, value: unknown) {
      queryOps.push(`${this.table}.eq:${column}`);
      this.filters.push((row) => row[column] === value);
      return this;
    }

    in(column: string, values: unknown[]) {
      queryOps.push(`${this.table}.in:${column}`);
      this.filters.push((row) => values.includes(row[column]));
      return this;
    }

    order(column: string) {
      queryOps.push(`${this.table}.order:${column}`);
      this.orderColumn = column;
      return this;
    }

    then<TResult1 = { data: T[] | null; error: unknown }, TResult2 = never>(
      onfulfilled?: ((value: { data: T[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      tableReads.push(this.table);
      const tableRows = mutableRows[this.table] as Array<Record<string, unknown>>;
      const data = [...tableRows]
        .filter((row) => this.filters.every((filter) => filter(row)))
        .sort((a, b) => {
          if (!this.orderColumn) return 0;
          return String(a[this.orderColumn] ?? '').localeCompare(String(b[this.orderColumn] ?? ''));
        }) as unknown as T[];
      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    }
  }

  const from = vi.fn((table: string) => new QueryBuilder<Record<string, unknown>>(table as FixtureTable));
  const client: SupabaseRoleClient = {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: userId ? { user: { id: userId, email } } : null,
        },
        error: null,
      })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe } } })),
    },
    from: from as unknown as SupabaseRoleClient['from'],
    rpc,
  };

  return {
    client,
    tableReads,
    queryOps,
    unsubscribe,
  };
}

describe('Supabase role service', () => {
  it('reports missing browser-safe config before creating a client', async () => {
    const createClient = vi.fn();

    await expect(readSupabaseRoleContext({ config: resolveSupabaseConfig({}), createClient })).resolves.toMatchObject({
      status: 'error',
      error: expect.stringContaining('configuration is missing'),
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('returns signed-out state without reading classroom role tables', async () => {
    const fake = createFakeRoleClient({});

    await expect(readSupabaseRoleContext({ config: validConfig, createClient: async () => fake.client })).resolves.toEqual({
      status: 'signed-out',
    });
    expect(fake.client.from).not.toHaveBeenCalled();
    expect(fake.tableReads).toEqual([]);
  });

  it('loads student role and profile context without granting dashboard roles', async () => {
    const fake = createFakeRoleClient({ userId: 'student-user-1', email: 'student@example.school' });
    const state = await readSupabaseRoleContext({ config: validConfig, createClient: async () => fake.client });

    expect(state.status).toBe('ready');
    if (state.status !== 'ready') return;
    expect(state.context.user).toEqual({ id: 'student-user-1', email: 'student@example.school' });
    expect(state.context.roleNames).toEqual(['student']);
    expect(state.context.studentProfiles).toEqual([
      expect.objectContaining({ id: 'student-profile-1', displayName: 'Ada Student' }),
    ]);
    expect(state.context.organizations).toEqual([
      expect.objectContaining({ id: 'org-1', name: 'Hosted School' }),
    ]);
    expect(hasSupabaseRole(state.context, 'student')).toBe(true);
    expect(hasSupabaseRole(state.context, 'teacher')).toBe(false);
    expect(hasSupabaseRole(state.context, 'admin')).toBe(false);
    expect(fake.tableReads).toEqual(expect.arrayContaining(['user_roles', 'teacher_profiles', 'student_profiles', 'organizations']));
  });

  it('attempts pending teacher activation after sign-in before reading hosted roles', async () => {
    const rpc = vi.fn(async () => ({ data: [], error: null }));
    const fake = createFakeRoleClient({ userId: 'teacher-user-1', email: 'teacher@example.school', rpc });

    const state = await readSupabaseRoleContext({ config: validConfig, createClient: async () => fake.client });

    expect(state.status).toBe('ready');
    expect(rpc).toHaveBeenCalledWith('activate_pending_teacher_role_for_current_user');
    expect(rpc).toHaveBeenCalledWith('ensure_admin_teacher_operator_profile_for_current_user');
    expect(fake.tableReads).toEqual(expect.arrayContaining(['user_roles', 'teacher_profiles']));
  });

  it('does not let sign-in alone grant teacher access when no hosted role is activated', async () => {
    const rpc = vi.fn(async () => ({ data: [], error: null }));
    const rows = {
      ...baseRows,
      user_roles: [],
      teacher_profiles: [],
      student_profiles: [],
    };
    const fake = createFakeRoleClient({ userId: 'unapproved-user', email: 'wrong@example.school', rows, rpc });

    const state = await readSupabaseRoleContext({ config: validConfig, createClient: async () => fake.client });

    expect(state.status).toBe('ready');
    if (state.status !== 'ready') return;
    expect(state.context.roleNames).toEqual([]);
    expect(hasSupabaseRole(state.context, 'teacher')).toBe(false);
    expect(rpc).toHaveBeenCalledWith('activate_pending_teacher_role_for_current_user');
    expect(rpc).toHaveBeenCalledWith('ensure_admin_teacher_operator_profile_for_current_user');
  });

  it('does not fail hosted role loading when optional activation RPCs are missing from schema cache', async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find the function public.activate_pending_teacher_role_for_current_user without parameters in the schema cache',
      },
    }));
    const fake = createFakeRoleClient({ userId: 'teacher-user-1', email: 'teacher@example.school', rpc });

    const state = await readSupabaseRoleContext({ config: validConfig, createClient: async () => fake.client });

    expect(state.status).toBe('ready');
    if (state.status !== 'ready') return;
    expect(state.context.roleNames).toEqual(['admin', 'teacher']);
    expect(rpc).toHaveBeenCalledWith('activate_pending_teacher_role_for_current_user');
    expect(rpc).toHaveBeenCalledWith('ensure_admin_teacher_operator_profile_for_current_user');
  });

  it('loads an admin operator teacher profile after the repair RPC creates it', async () => {
    const rows: typeof baseRows = {
      ...baseRows,
      user_roles: [{
        id: 'role-admin',
        user_id: 'admin-user-1',
        organization_id: 'org-1',
        role: 'admin',
        status: 'active',
        created_at: '2026-05-18T08:00:00.000Z',
        updated_at: '2026-05-18T08:00:00.000Z',
      }],
      teacher_profiles: [],
      student_profiles: [],
    };
    const rpc = vi.fn(async (fn: string) => {
      if (fn === 'ensure_admin_teacher_operator_profile_for_current_user') {
        rows.teacher_profiles.push({
          id: 'admin-operator-profile',
          user_id: 'admin-user-1',
          organization_id: 'org-1',
          display_name: 'admin@example.school',
          email: 'admin@example.school',
          status: 'active',
          created_at: '2026-05-20T08:00:00.000Z',
          updated_at: '2026-05-20T08:00:00.000Z',
        });
      }
      return { data: [], error: null };
    });
    const fake = createFakeRoleClient({ userId: 'admin-user-1', email: 'admin@example.school', rows, rpc });

    const state = await readSupabaseRoleContext({ config: validConfig, createClient: async () => fake.client });

    expect(state.status).toBe('ready');
    if (state.status !== 'ready') return;
    expect(state.context.roleNames).toEqual(['admin']);
    expect(state.context.teacherProfiles).toEqual([
      expect.objectContaining({ id: 'admin-operator-profile', userId: 'admin-user-1' }),
    ]);
  });

  it('loads multi-role teacher/admin context through the service boundary', async () => {
    const fake = createFakeRoleClient({ userId: 'teacher-user-1', email: 'teacher@example.school' });
    const state = await readSupabaseRoleContext({ config: validConfig, createClient: async () => fake.client });

    expect(state.status).toBe('ready');
    if (state.status !== 'ready') return;
    expect(state.context.roleNames).toEqual(['admin', 'teacher']);
    expect(state.context.organizationIds).toEqual(['org-1']);
    expect(state.context.organizations).toEqual([
      expect.objectContaining({ id: 'org-1', name: 'Hosted School' }),
    ]);
    expect(state.context.teacherProfiles).toEqual([
      expect.objectContaining({ id: 'teacher-profile-1', displayName: 'Ms Hosted' }),
    ]);
    expect(hasSupabaseRole(state.context, 'teacher')).toBe(true);
    expect(hasSupabaseRole(state.context, 'admin')).toBe(true);
    expect(fake.queryOps).toEqual(expect.arrayContaining([
      'user_roles.eq:user_id',
      'user_roles.eq:status',
      'teacher_profiles.eq:user_id',
      'student_profiles.eq:user_id',
      'organizations.in:id',
    ]));
  });
});
