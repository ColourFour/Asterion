import { describe, expect, it, vi } from 'vitest';
import { DashboardDataServiceError } from '../lib/dashboardServiceErrors';
import { createSupabaseDashboardDataService, type SupabaseDashboardClient, type SupabaseQueryBuilder } from '../lib/supabaseDashboardService';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

const fixtureRows = {
  teacher_profiles: [
    {
      id: 'teacher-1',
      user_id: 'user-teacher-1',
      organization_id: 'org-1',
      display_name: 'Ms Supabase',
      email: 'teacher@example.school',
      status: 'active',
      created_at: '2026-05-01T08:00:00.000Z',
      updated_at: '2026-05-10T08:00:00.000Z',
    },
  ],
  classes: [
    {
      id: 'class-alpha',
      organization_id: 'org-1',
      teacher_id: 'teacher-1',
      name: 'Hosted P3 Alpha',
      course_code: 'CAIE_9709_P3',
      academic_year_or_term: '2026 Term 2',
      class_code: 'SUP-P3A',
      status: 'active',
      created_at: '2026-05-02T08:00:00.000Z',
      updated_at: '2026-05-11T08:00:00.000Z',
    },
  ],
  class_memberships: [
    {
      id: 'membership-claimed',
      class_id: 'class-alpha',
      student_profile_id: 'student-1',
      roster_name: 'Ada S.',
      roster_status: 'claimed',
      claimed_by_user_id: 'student-user-1',
      claimed_at: '2026-05-12T08:00:00.000Z',
      archived_at: null,
      created_at: '2026-05-03T08:00:00.000Z',
      updated_at: '2026-05-12T08:00:00.000Z',
    },
    {
      id: 'membership-unclaimed',
      class_id: 'class-alpha',
      student_profile_id: 'student-2',
      roster_name: 'Noor T.',
      roster_status: 'unclaimed',
      claimed_by_user_id: null,
      claimed_at: null,
      archived_at: null,
      created_at: '2026-05-03T08:00:00.000Z',
      updated_at: '2026-05-03T08:00:00.000Z',
    },
    {
      id: 'membership-archived',
      class_id: 'class-alpha',
      student_profile_id: 'student-3',
      roster_name: 'Archived Student',
      roster_status: 'archived',
      claimed_by_user_id: null,
      claimed_at: null,
      archived_at: '2026-05-13T08:00:00.000Z',
      created_at: '2026-05-03T08:00:00.000Z',
      updated_at: '2026-05-13T08:00:00.000Z',
    },
  ],
  class_region_access: [
    {
      id: 'access-algebra',
      class_id: 'class-alpha',
      region_id: 'algebra-forge',
      access_status: 'open',
      updated_by_user_id: 'user-teacher-1',
      updated_at: '2026-05-12T08:00:00.000Z',
      created_at: '2026-05-02T08:00:00.000Z',
    },
    {
      id: 'access-trig',
      class_id: 'class-alpha',
      region_id: 'trig-observatory',
      access_status: 'field_guide_only',
      updated_by_user_id: 'user-teacher-1',
      updated_at: '2026-05-12T08:00:00.000Z',
      created_at: '2026-05-02T08:00:00.000Z',
    },
  ],
};

type FixtureTable = keyof typeof fixtureRows;

function createFakeSupabaseClient({
  session = true,
  rows = fixtureRows,
  errorByTable = {},
}: {
  session?: boolean;
  rows?: typeof fixtureRows;
  errorByTable?: Partial<Record<FixtureTable, unknown>>;
} = {}) {
  const mutableRows = JSON.parse(JSON.stringify(rows)) as typeof fixtureRows;
  const tableReads: string[] = [];
  const queryOps: string[] = [];
  const rpcCalls: Array<{ fn: string; args?: Record<string, unknown> }> = [];
  const writes = {
    insert: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  class QueryBuilder<T extends Record<string, unknown>> implements SupabaseQueryBuilder<T> {
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

    insert() {
      writes.insert();
      return this;
    }

    upsert() {
      writes.upsert();
      return this;
    }

    update() {
      writes.update();
      return this;
    }

    delete() {
      writes.delete();
      return this;
    }

    then<TResult1 = { data: T[] | null; error: unknown }, TResult2 = never>(
      onfulfilled?: ((value: { data: T[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      tableReads.push(this.table);
      const error = errorByTable[this.table] ?? null;
      const tableRows = mutableRows[this.table] as Array<Record<string, unknown>>;
      const data = error
        ? null
        : [...tableRows]
          .filter((row) => this.filters.every((filter) => filter(row)))
          .sort((a, b) => {
            if (!this.orderColumn) return 0;
            return String(a[this.orderColumn] ?? '').localeCompare(String(b[this.orderColumn] ?? ''));
          }) as unknown as T[];
      return Promise.resolve({ data, error }).then(onfulfilled, onrejected);
    }
  }

  const from = vi.fn((table: string) => new QueryBuilder<Record<string, unknown>>(table as FixtureTable));
  const rpc = vi.fn(async (fn: string, args?: Record<string, unknown>) => {
    rpcCalls.push({ fn, args });
    if (fn === 'admin_add_teacher_by_email') {
      const teacher = {
        id: 'teacher-new',
        user_id: 'user-teacher-new',
        organization_id: 'org-1',
        display_name: String(args?.p_display_name),
        email: String(args?.p_email),
        status: 'active' as const,
        created_at: '2026-05-20T08:00:00.000Z',
        updated_at: '2026-05-20T08:00:00.000Z',
      };
      mutableRows.teacher_profiles.push(teacher);
      return { data: [teacher], error: null };
    }
    if (fn === 'create_class_with_region_access') {
      const classRow = {
        id: 'class-new',
        organization_id: 'org-1',
        teacher_id: String(args?.p_teacher_id),
        name: String(args?.p_name),
        course_code: 'CAIE_9709_P3',
        academic_year_or_term: String(args?.p_academic_year_or_term),
        class_code: args?.p_class_code ? String(args.p_class_code) : 'AST-NEW1',
        status: 'active' as const,
        created_at: '2026-05-20T08:00:00.000Z',
        updated_at: '2026-05-20T08:00:00.000Z',
      };
      mutableRows.classes.push(classRow);
      mutableRows.class_region_access.push(
        ...[
          'algebra-forge',
          'logarithm-grove',
          'trig-observatory',
          'complex-harbor',
          'calculus-cliffs',
          'integration-gardens',
          'vector-workshop',
          'numerical-mines',
          'differential-shrine',
        ].map((regionId) => ({
          id: `access-new-${regionId}`,
          class_id: 'class-new',
          region_id: regionId,
          access_status: 'field_guide_only' as const,
          updated_by_user_id: 'user-teacher-1',
          updated_at: '2026-05-20T08:00:00.000Z',
          created_at: '2026-05-20T08:00:00.000Z',
        })),
      );
      return { data: [classRow], error: null };
    }
    if (fn === 'set_class_region_access') {
      const row = {
        id: `access-${String(args?.p_region_id)}`,
        class_id: String(args?.p_class_id),
        region_id: String(args?.p_region_id),
        access_status: args?.p_access_status === 'open' ? 'open' as const : 'field_guide_only' as const,
        updated_by_user_id: 'user-teacher-1',
        updated_at: '2026-05-20T08:00:00.000Z',
        created_at: '2026-05-02T08:00:00.000Z',
      };
      return { data: [row], error: null };
    }
    if (fn === 'add_class_roster_student') {
      const row = {
        id: 'membership-new',
        class_id: String(args?.p_class_id),
        student_profile_id: 'student-new',
        roster_name: String(args?.p_roster_name),
        roster_status: 'unclaimed' as const,
        claimed_by_user_id: null,
        claimed_at: null,
        archived_at: null,
        created_at: '2026-05-20T08:00:00.000Z',
        updated_at: '2026-05-20T08:00:00.000Z',
      };
      mutableRows.class_memberships.push(row);
      return { data: [row], error: null };
    }
    if (fn === 'archive_class_roster_student') {
      const row = mutableRows.class_memberships.find((item) => item.id === args?.p_membership_id);
      if (!row) return { data: null, error: { message: 'roster_membership_required' } };
      row.roster_status = 'archived';
      row.claimed_by_user_id = null;
      row.claimed_at = null;
      row.archived_at = '2026-05-20T08:00:00.000Z';
      row.updated_at = '2026-05-20T08:00:00.000Z';
      return { data: [row], error: null };
    }
    if (fn === 'reset_class_roster_claim') {
      const row = mutableRows.class_memberships.find((item) => item.id === args?.p_membership_id);
      if (!row) return { data: null, error: { message: 'roster_membership_required' } };
      row.roster_status = 'unclaimed';
      row.claimed_by_user_id = null;
      row.claimed_at = null;
      row.archived_at = null;
      row.updated_at = '2026-05-20T08:00:00.000Z';
      return { data: [row], error: null };
    }
    return { data: null, error: { message: `Unexpected RPC ${fn}` } };
  });
  const client: SupabaseDashboardClient = {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: session ? { user: { id: 'user-teacher-1' } } : null },
        error: null,
      })),
    },
    from: from as unknown as SupabaseDashboardClient['from'],
    rpc: rpc as unknown as SupabaseDashboardClient['rpc'],
  };

  return {
    client,
    tableReads,
    queryOps,
    rpcCalls,
    writes,
  };
}

describe('Supabase dashboard service', () => {
  it('maps Supabase classroom setup rows into the dashboard contract', async () => {
    const fake = createFakeSupabaseClient();
    const service = createSupabaseDashboardDataService({
      config: validConfig,
      createClient: vi.fn(async () => fake.client),
      now: () => '2026-05-19T00:00:00.000Z',
    });

    const dashboard = await service.getTeacherClassDashboard('class-alpha');

    expect(dashboard.class).toMatchObject({
      id: 'class-alpha',
      name: 'Hosted P3 Alpha',
      teacherId: 'teacher-1',
      joinCode: 'SUP-P3A',
    });
    expect(dashboard.classCode).toMatchObject({ code: 'SUP-P3A', status: 'active' });
    expect(dashboard.roster.students).toEqual([
      expect.objectContaining({ id: 'membership-claimed', displayName: 'Ada S.', status: 'claimed' }),
      expect.objectContaining({ id: 'membership-archived', displayName: 'Archived Student', status: 'archived' }),
      expect.objectContaining({ id: 'membership-unclaimed', displayName: 'Noor T.', status: 'unclaimed' }),
    ]);
    expect(dashboard.studentRows).toHaveLength(1);
    expect(dashboard.studentRows[0]).toMatchObject({
      id: 'membership-claimed',
      displayName: 'Ada S.',
      overallProgressPercent: 0,
      attemptsCount: 0,
    });
    expect(dashboard.regionAccess).toHaveLength(9);
    expect(dashboard.regionAccess.find((item) => item.regionId === 'algebra-forge')).toMatchObject({ access: 'open' });
    expect(dashboard.regionAccess.find((item) => item.regionId === 'complex-harbor')).toMatchObject({ access: 'field_guide_only' });
    expect(dashboard.progressSummary).toMatchObject({
      studentCount: 1,
      overallProgressPercent: 0,
      totalAttempts: 0,
      openRegionCount: 1,
      lockedRegionCount: 8,
    });
    expect(dashboard.weeklySummary.exportDownloadText).toContain('no hosted progress snapshots');
    expect(fake.tableReads).toEqual(expect.arrayContaining([
      'classes',
      'teacher_profiles',
      'class_memberships',
      'class_region_access',
    ]));
    expect(fake.tableReads).not.toContain('student_progress_snapshots');
    expect(fake.tableReads).not.toContain('student_profiles');
  });

  it('maps admin teacher and class records without leaking raw rows', async () => {
    const fake = createFakeSupabaseClient();
    const service = createSupabaseDashboardDataService({
      config: validConfig,
      createClient: vi.fn(async () => fake.client),
    });

    await expect(service.listAdminTeacherRecords()).resolves.toEqual([
      expect.objectContaining({
        id: 'teacher-1',
        name: 'Ms Supabase',
        assignedClassIds: ['class-alpha'],
      }),
    ]);
    await expect(service.listAdminClassRecords()).resolves.toEqual([
      expect.objectContaining({
        id: 'class-alpha',
        classCode: expect.objectContaining({ code: 'SUP-P3A' }),
        rosterStudentIds: ['membership-claimed', 'membership-archived', 'membership-unclaimed'],
      }),
    ]);
  });

  it('requires auth before reading classroom tables', async () => {
    const fake = createFakeSupabaseClient({ session: false });
    const service = createSupabaseDashboardDataService({
      config: validConfig,
      createClient: vi.fn(async () => fake.client),
    });

    await expect(service.listTeacherClasses()).rejects.toMatchObject({
      code: 'auth_required',
    });
    expect(fake.client.from).not.toHaveBeenCalled();
    expect(fake.tableReads).toEqual([]);
  });

  it('does not create a client or read when config is missing', async () => {
    const createClient = vi.fn();
    const service = createSupabaseDashboardDataService({
      config: resolveSupabaseConfig({}),
      createClient,
    });

    await expect(service.listTeacherClasses()).rejects.toMatchObject({
      code: 'config_missing',
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('uses hosted setup RPCs for teacher attachment, class creation, roster management, and region access', async () => {
    const fake = createFakeSupabaseClient();
    const service = createSupabaseDashboardDataService({
      config: validConfig,
      createClient: vi.fn(async () => fake.client),
    });

    const teacher = await service.addAdminTeacher({ name: 'New Teacher', email: 'new.teacher@example.school' });
    const teacherClass = await service.addAdminClass({ name: 'Hosted P3 Beta', teacherId: 'teacher-1', academicYearTerm: '2026 Term 2' });
    const rosterStudent = await service.addRosterStudent('teacher-1', 'class-alpha', '  New Student  ');
    const archived = await service.archiveRosterStudent('teacher-1', 'class-alpha', 'membership-unclaimed');
    const reset = await service.resetRosterClaim({
      actorRole: 'teacher',
      actorTeacherId: 'teacher-1',
      classId: 'class-alpha',
      rosterStudentId: 'membership-claimed',
    });
    const access = await service.setClassRegionAccess({
      actorRole: 'teacher',
      actorTeacherId: 'teacher-1',
      classId: 'class-alpha',
      regionId: 'algebra-forge',
      access: 'field_guide_only',
    });

    expect(teacher).toMatchObject({ id: 'teacher-new', name: 'New Teacher', email: 'new.teacher@example.school' });
    expect(teacherClass).toMatchObject({
      id: 'class-new',
      classCode: expect.objectContaining({ code: 'AST-NEW1' }),
    });
    expect(teacherClass.regionAccess).toHaveLength(9);
    expect(teacherClass.regionAccess.every((row) => row.access === 'field_guide_only')).toBe(true);
    expect(rosterStudent).toMatchObject({ id: 'membership-new', displayName: 'New Student', status: 'unclaimed' });
    expect(archived).toMatchObject({ id: 'membership-unclaimed', status: 'archived' });
    expect(reset).toMatchObject({ id: 'membership-claimed', status: 'unclaimed' });
    expect(access).toMatchObject({ regionId: 'algebra-forge', access: 'field_guide_only' });
    expect(fake.rpcCalls.map((call) => call.fn)).toEqual([
      'admin_add_teacher_by_email',
      'create_class_with_region_access',
      'add_class_roster_student',
      'archive_class_roster_student',
      'reset_class_roster_claim',
      'set_class_region_access',
    ]);
    expect(fake.rpcCalls.find((call) => call.fn === 'add_class_roster_student')?.args).toMatchObject({
      p_class_id: 'class-alpha',
      p_roster_name: 'New Student',
    });
    expect(fake.writes.insert).not.toHaveBeenCalled();
    expect(fake.writes.upsert).not.toHaveBeenCalled();
    expect(fake.writes.update).not.toHaveBeenCalled();
    expect(fake.writes.delete).not.toHaveBeenCalled();
    expect(fake.queryOps.join('\n')).not.toMatch(/\b(insert|upsert|update|delete)\b/i);
  });

  it('surfaces read failures without falling back to mock data', async () => {
    const fake = createFakeSupabaseClient({
      errorByTable: {
        classes: { message: 'RLS denied' },
      },
    });
    const service = createSupabaseDashboardDataService({
      config: validConfig,
      createClient: vi.fn(async () => fake.client),
    });

    await expect(service.listTeacherClasses()).rejects.toMatchObject({
      code: 'read_failed',
      safeMessage: expect.stringContaining('RLS denied'),
    });
  });
});
