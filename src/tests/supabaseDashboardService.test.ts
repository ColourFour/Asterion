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
  const tableReads: string[] = [];
  const queryOps: string[] = [];
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
      const tableRows = rows[this.table] as Array<Record<string, unknown>>;
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
  const client: SupabaseDashboardClient = {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: session ? { user: { id: 'user-teacher-1' } } : null },
        error: null,
      })),
    },
    from: from as unknown as SupabaseDashboardClient['from'],
  };

  return {
    client,
    tableReads,
    queryOps,
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

  it('performs no Supabase writes, including when mutation methods are called', async () => {
    const fake = createFakeSupabaseClient();
    const service = createSupabaseDashboardDataService({
      config: validConfig,
      createClient: vi.fn(async () => fake.client),
    });

    await service.listTeacherClasses();
    await service.getTeacherClassDashboard('class-alpha');
    await service.listAdminClassRecords();
    await expect(service.addRosterStudent('teacher-1', 'class-alpha', 'New Student')).rejects.toBeInstanceOf(DashboardDataServiceError);
    await expect(service.setClassRegionAccess({
      actorRole: 'teacher',
      actorTeacherId: 'teacher-1',
      classId: 'class-alpha',
      regionId: 'algebra-forge',
      access: 'field_guide_only',
    })).rejects.toMatchObject({ code: 'read_only' });

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
