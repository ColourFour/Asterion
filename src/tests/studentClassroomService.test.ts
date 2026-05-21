import { describe, expect, it, vi } from 'vitest';
import {
  getCurrentStudentClassroomContext,
  type SupabaseStudentClassroomClient,
  type SupabaseStudentClassroomQueryBuilder,
} from '../lib/studentClassroomService';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

const fixtureRows = {
  user_roles: [
    {
      id: 'role-student',
      user_id: 'student-user-1',
      organization_id: 'org-1',
      role: 'student',
      status: 'active',
      created_at: '2026-05-01T08:00:00.000Z',
      updated_at: '2026-05-12T08:00:00.000Z',
    },
  ],
  student_profiles: [
    {
      id: 'student-profile-1',
      user_id: 'student-user-1',
      organization_id: 'org-1',
      display_name: 'Ada S.',
      optional_email: null,
      status: 'active',
      created_at: '2026-05-01T08:00:00.000Z',
      updated_at: '2026-05-12T08:00:00.000Z',
    },
  ],
  class_memberships: [
    {
      id: 'membership-1',
      class_id: 'class-alpha',
      student_profile_id: 'student-profile-1',
      roster_name: 'Ada S.',
      roster_status: 'claimed',
      claimed_by_user_id: 'student-user-1',
      claimed_at: '2026-05-12T08:00:00.000Z',
      archived_at: null,
      created_at: '2026-05-02T08:00:00.000Z',
      updated_at: '2026-05-12T08:00:00.000Z',
    },
  ],
  classes: [
    {
      id: 'class-alpha',
      organization_id: 'org-1',
      teacher_id: 'teacher-1',
      name: 'Hosted P3 Alpha',
      academic_year_or_term: '2026 Term 2',
      class_code: 'SUP-P3A',
      status: 'active',
      created_at: '2026-05-02T08:00:00.000Z',
      updated_at: '2026-05-11T08:00:00.000Z',
    },
  ],
  teacher_profiles: [
    {
      id: 'teacher-1',
      user_id: 'teacher-user-1',
      organization_id: 'org-1',
      display_name: 'Ms Supabase',
      email: 'teacher@example.school',
      status: 'active',
      created_at: '2026-05-01T08:00:00.000Z',
      updated_at: '2026-05-10T08:00:00.000Z',
    },
  ],
  class_region_access: [
    {
      id: 'access-algebra',
      class_id: 'class-alpha',
      region_id: 'algebra-forge',
      access_status: 'open',
      updated_by_user_id: 'teacher-user-1',
      updated_at: '2026-05-12T08:00:00.000Z',
      created_at: '2026-05-02T08:00:00.000Z',
    },
    {
      id: 'access-trig',
      class_id: 'class-alpha',
      region_id: 'trig-observatory',
      access_status: 'field_guide_only',
      updated_by_user_id: 'teacher-user-1',
      updated_at: '2026-05-12T08:00:00.000Z',
      created_at: '2026-05-02T08:00:00.000Z',
    },
  ],
};

type FixtureTable = keyof typeof fixtureRows;
type FixtureRows = Record<FixtureTable, Array<Record<string, unknown>>>;

function createFakeClient({
  session = true,
  userId = 'student-user-1',
  email = 'student@example.school',
  rows = fixtureRows,
}: {
  session?: boolean;
  userId?: string;
  email?: string;
  rows?: FixtureRows;
} = {}) {
  const tableReads: string[] = [];
  const queryOps: string[] = [];

  class QueryBuilder<T extends Record<string, unknown>> implements SupabaseStudentClassroomQueryBuilder<T> {
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
      const tableRows = rows[this.table];
      const data = [...tableRows]
        .filter((row) => this.filters.every((filter) => filter(row)))
        .sort((a, b) => {
          if (!this.orderColumn) return 0;
          return String(a[this.orderColumn] ?? '').localeCompare(String(b[this.orderColumn] ?? ''));
        }) as unknown as T[];
      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    }
  }

  const client: SupabaseStudentClassroomClient = {
    auth: {
      getSession: vi.fn(async () => ({
        data: {
          session: session
            ? { user: { id: userId, email } }
            : null,
        },
        error: null,
      })),
    },
    from: vi.fn((table: string) => new QueryBuilder<Record<string, unknown>>(table as FixtureTable)) as unknown as SupabaseStudentClassroomClient['from'],
  };

  return { client, tableReads, queryOps };
}

describe('student classroom service', () => {
  it('loads claimed membership context and class-region access through RLS-safe table reads', async () => {
    const fake = createFakeClient();
    const state = await getCurrentStudentClassroomContext({
      config: validConfig,
      createClient: async () => fake.client,
    });

    expect(state.status).toBe('ready');
    if (state.status !== 'ready') throw new Error('expected ready state');
    expect(state.context.claim).toMatchObject({
      status: 'claimed',
      classId: 'class-alpha',
      className: 'Hosted P3 Alpha',
      classCode: 'SUP-P3A',
      teacherName: 'Ms Supabase',
      rosterStudentId: 'membership-1',
      displayName: 'Ada S.',
    });
    expect(state.context.regionAccess.find((item) => item.regionId === 'algebra-forge')?.access).toBe('open');
    expect(state.context.regionAccess.find((item) => item.regionId === 'trig-observatory')?.access).toBe('field_guide_only');
    expect(state.context.regionAccess.find((item) => item.regionId === 'complex-harbor')?.access).toBe('field_guide_only');
    expect(fake.tableReads).toEqual(expect.arrayContaining([
      'student_profiles',
      'class_memberships',
      'classes',
      'teacher_profiles',
      'class_region_access',
    ]));
    expect(fake.queryOps).toEqual(expect.arrayContaining([
      'user_roles.eq:user_id',
      'student_profiles.eq:user_id',
      'class_memberships.eq:claimed_by_user_id',
      'class_memberships.eq:roster_status',
      'class_region_access.eq:class_id',
    ]));
  });

  it('returns staff-preview context for hosted admin without requiring a claimed roster slot', async () => {
    const fake = createFakeClient({
      userId: 'admin-user-1',
      email: 'admin@example.school',
      rows: {
        ...fixtureRows,
        user_roles: [{
          id: 'role-admin',
          user_id: 'admin-user-1',
          organization_id: 'org-1',
          role: 'admin',
          status: 'active',
          created_at: '2026-05-01T08:00:00.000Z',
          updated_at: '2026-05-12T08:00:00.000Z',
        }],
        student_profiles: [],
        class_memberships: [],
      },
    });

    const state = await getCurrentStudentClassroomContext({
      config: validConfig,
      createClient: async () => fake.client,
    });

    expect(state.status).toBe('ready');
    if (state.status !== 'ready') throw new Error('expected ready state');
    expect(state.context).toMatchObject({
      accessMode: 'staff_preview',
      staffRole: 'admin',
      claim: {
        status: 'unclaimed',
        message: 'Staff preview: regions are unlocked and progress is not recorded as student work.',
      },
    });
    expect(state.context.regionAccess.length).toBeGreaterThan(0);
    expect(state.context.regionAccess.every((item) => item.access === 'open')).toBe(true);
    expect(fake.tableReads).toEqual(['user_roles']);
  });

  it('returns staff-preview context for hosted teacher without requiring class-region access rows', async () => {
    const fake = createFakeClient({
      userId: 'teacher-user-1',
      email: 'teacher@example.school',
      rows: {
        ...fixtureRows,
        user_roles: [{
          id: 'role-teacher',
          user_id: 'teacher-user-1',
          organization_id: 'org-1',
          role: 'teacher',
          status: 'active',
          created_at: '2026-05-01T08:00:00.000Z',
          updated_at: '2026-05-12T08:00:00.000Z',
        }],
        student_profiles: [],
        class_memberships: [],
        class_region_access: [],
      },
    });

    const state = await getCurrentStudentClassroomContext({
      config: validConfig,
      createClient: async () => fake.client,
    });

    expect(state.status).toBe('ready');
    if (state.status !== 'ready') throw new Error('expected ready state');
    expect(state.context.accessMode).toBe('staff_preview');
    expect(state.context.regionAccess.find((item) => item.regionId === 'trig-observatory')?.access).toBe('open');
    expect(fake.tableReads).toEqual(['user_roles']);
  });

  it('does not grant app context when the student is signed out', async () => {
    const fake = createFakeClient({ session: false });
    await expect(getCurrentStudentClassroomContext({
      config: validConfig,
      createClient: async () => fake.client,
    })).resolves.toEqual({ status: 'signed-out' });
  });

  it('does not treat an unclaimed or reset membership as authority', async () => {
    const fake = createFakeClient({
      rows: {
        ...fixtureRows,
        class_memberships: [
          {
            ...fixtureRows.class_memberships[0],
            roster_status: 'unclaimed',
            claimed_by_user_id: null,
            claimed_at: null,
          },
        ],
      },
    });

    await expect(getCurrentStudentClassroomContext({
      config: validConfig,
      createClient: async () => fake.client,
    })).resolves.toMatchObject({
      status: 'missing-membership',
    });
  });
});
