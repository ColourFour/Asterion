import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleGate } from '../components/auth/RoleGate';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { TeacherDashboard } from '../components/dashboard/TeacherDashboard';
import type { DashboardDataService } from '../lib/dashboardDataService';
import type { SupabaseRoleClient, SupabaseRoleQueryBuilder } from '../lib/supabaseRoleService';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';
import type { AdminClassRecord, AdminTeacherRecord } from '../types';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const dashboardServiceMock = vi.hoisted(() => ({
  service: {} as DashboardDataService,
}));

vi.mock('../lib/dashboardDataService', async () => {
  const actual = await vi.importActual<typeof import('../lib/dashboardDataService')>('../lib/dashboardDataService');
  return {
    ...actual,
    dashboardDataService: dashboardServiceMock.service,
  };
});

vi.mock('../components/auth/SupabaseAuthPanel', () => ({
  SupabaseAuthPanel: ({ title }: { title: string }) => <section>{title}</section>,
}));

vi.mock('../components/dashboard/SupabaseDiagnosticPanel', () => ({
  SupabaseDiagnosticPanel: () => <section>Supabase diagnostic</section>,
}));

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

const now = '2026-05-20T08:00:00.000Z';
const teacherRecord: AdminTeacherRecord = {
  id: 'teacher-1',
  name: 'Ms Supabase',
  email: 'teacher@example.school',
  assignedClassIds: ['class-alpha'],
  status: 'active',
  createdAt: now,
  updatedAt: now,
};

const pendingTeacherRecord: AdminTeacherRecord = {
  id: 'teacher-pending',
  name: 'Pending Teacher',
  email: 'pending.teacher@example.school',
  assignedClassIds: [],
  status: 'pending',
  createdAt: now,
  updatedAt: now,
};

const classRecord: AdminClassRecord = {
  id: 'class-alpha',
  name: 'Hosted P3 Alpha',
  teacherId: 'teacher-1',
  focus: 'CAIE 9709 P3',
  academicYearTerm: '2026 Term 2',
  status: 'active',
  classCode: {
    id: 'code-class-alpha',
    classId: 'class-alpha',
    code: 'SUP-P3A',
    status: 'active',
    createdAt: now,
  },
  rosterStudentIds: [],
  regionAccess: [],
  createdAt: now,
  updatedAt: now,
};

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

function resetDashboardService(overrides: Partial<DashboardDataService> = {}) {
  Object.assign(dashboardServiceMock.service, {
    source: {
      kind: 'supabase',
      label: 'Supabase classroom setup data',
      readOnly: false,
      detail: 'Auth required. Mock data is not shown.',
    },
    listTeacherClasses: vi.fn(async () => []),
    getTeacherClassDashboard: vi.fn(),
    getTeacherClassDashboardForTeacher: vi.fn(),
    getTeacherClassRoster: vi.fn(),
    getClassRegionSignals: vi.fn(async () => []),
    getStudentSummaries: vi.fn(async () => []),
    getStudentEvidence: vi.fn(async () => []),
    getClassRegionAccess: vi.fn(() => []),
    addRosterStudent: vi.fn(),
    archiveRosterStudent: vi.fn(),
    resetRosterClaim: vi.fn(),
    setClassRegionAccess: vi.fn(),
    listAdminTeachers: vi.fn(async () => []),
    listAdminTeacherRecords: vi.fn(async () => []),
    listAdminClasses: vi.fn(async () => []),
    listAdminClassRecords: vi.fn(async () => []),
    listAdminAuditEvents: vi.fn(async () => []),
    addAdminTeacher: vi.fn(async () => teacherRecord),
    addAdminClass: vi.fn(),
    generateTeacherCsvExport: vi.fn(() => ''),
    labelForClassRegionAccess: vi.fn((access) => access),
    labelForTeacherRegionStatus: vi.fn((status) => status),
    canUseRegionActivity: vi.fn(() => true),
    ...overrides,
  });
}

function createRoleClient({
  userId = 'admin-user-1',
  roles,
  includeTeacherProfile = false,
}: {
  userId?: string;
  roles: Array<'admin' | 'teacher' | 'student'>;
  includeTeacherProfile?: boolean;
}) {
  const rows = {
    organizations: [{
      id: '5e3315b2-3882-46b5-812c-b2584b1b334a',
      name: 'RDFZCYGJ',
      status: 'active',
      created_at: now,
      updated_at: now,
    }],
    user_roles: roles.map((role) => ({
      id: `role-${role}`,
      user_id: userId,
      organization_id: '5e3315b2-3882-46b5-812c-b2584b1b334a',
      role,
      status: 'active',
      created_at: now,
      updated_at: now,
    })),
    teacher_profiles: includeTeacherProfile ? [{
      id: 'teacher-1',
      user_id: userId,
      organization_id: '5e3315b2-3882-46b5-812c-b2584b1b334a',
      display_name: 'Ms Supabase',
      email: 'teacher@example.school',
      status: 'active',
      created_at: now,
      updated_at: now,
    }] : [],
    student_profiles: [],
  };
  type FixtureTable = keyof typeof rows;

  class QueryBuilder<T extends Record<string, unknown>> implements SupabaseRoleQueryBuilder<T> {
    private filters: Array<(row: Record<string, unknown>) => boolean> = [];

    constructor(private readonly table: FixtureTable) {}

    select() {
      return this;
    }

    eq(column: string, value: unknown) {
      this.filters.push((row) => row[column] === value);
      return this;
    }

    in(column: string, values: unknown[]) {
      this.filters.push((row) => values.includes(row[column]));
      return this;
    }

    order() {
      return this;
    }

    then<TResult1 = { data: T[] | null; error: unknown }, TResult2 = never>(
      onfulfilled?: ((value: { data: T[] | null; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      const tableRows = rows[this.table] as Array<Record<string, unknown>>;
      const data = tableRows.filter((row) => this.filters.every((filter) => filter(row))) as unknown as T[];
      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    }
  }

  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { user: { id: userId, email: `${userId}@example.school` } } },
        error: null,
      })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn((table: string) => new QueryBuilder<Record<string, unknown>>(table as FixtureTable)) as unknown as SupabaseRoleClient['from'],
  } satisfies SupabaseRoleClient;
}

async function render(ui: ReactNode): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  mountedContainers.push(container);

  await act(async () => {
    root.render(ui);
    for (let index = 0; index < 5; index += 1) {
      await Promise.resolve();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  return container;
}

async function waitForText(container: HTMLElement, text: string) {
  for (let index = 0; index < 40; index += 1) {
    if (container.textContent?.includes(text)) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  resetDashboardService();
});

afterEach(() => {
  for (const root of mountedRoots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of mountedContainers.splice(0)) {
    container.remove();
  }
  document.body.innerHTML = '';
});

describe('hosted dashboard empty states', () => {
  it('renders admin first-run empty state for an active admin with no organization rows yet', async () => {
    const container = await render(
      <RoleGate
        requiredRole="admin"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleClient({ roles: ['admin'] }) }}
        onNavigatePath={vi.fn()}
      >
        {(context) => <AdminDashboard hostedRoleContext={context} onNavigatePath={vi.fn()} />}
      </RoleGate>,
    );
    await waitForText(container, 'First-run setup');

    expect(container.textContent).toContain('Admin Console');
    expect(container.textContent).toContain('RDFZCYGJ');
    expect(container.textContent).toContain('No teachers or classes exist for this organization yet.');
    expect(container.textContent).toContain('public.admin_add_teacher_by_email(...)');
    expect(container.textContent).toContain('Add teacher');
    expect(container.textContent).not.toContain('No authorized dashboard data');
    expect(container.textContent).not.toContain('P3 Alpha');
    expect(container.textContent).not.toContain('Ms Hypatia');

    const form = container.querySelector('form[aria-label="Add teacher"]') as HTMLFormElement;
    const [nameInput, emailInput] = Array.from(form.querySelectorAll('input')) as HTMLInputElement[];
    await act(async () => {
      setInputValue(nameInput, 'Dr Noether');
      setInputValue(emailInput, 'noether@example.school');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(dashboardServiceMock.service.addAdminTeacher).toHaveBeenCalledWith({
      name: 'Dr Noether',
      email: 'noether@example.school',
      organizationId: '5e3315b2-3882-46b5-812c-b2584b1b334a',
    });
  });

  it('renders normal admin dashboard records for an active admin with organization rows', async () => {
    resetDashboardService({
      listAdminTeacherRecords: vi.fn(async () => [teacherRecord]),
      listAdminClassRecords: vi.fn(async () => [classRecord]),
    });

    const container = await render(
      <RoleGate
        requiredRole="admin"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleClient({ roles: ['admin'] }) }}
        onNavigatePath={vi.fn()}
      >
        {(context) => <AdminDashboard hostedRoleContext={context} onNavigatePath={vi.fn()} />}
      </RoleGate>,
    );
    await waitForText(container, 'Hosted P3 Alpha');

    expect(container.textContent).toContain('Admin Console');
    expect(container.textContent).toContain('Ms Supabase');
    expect(container.textContent).toContain('Class code SUP-P3A');
    expect(container.textContent).not.toContain('First-run setup');
    expect(container.textContent).not.toContain('No authorized dashboard data');
  });

  it('includes pending teachers as class owners in admin class setup', async () => {
    resetDashboardService({
      listAdminTeacherRecords: vi.fn(async () => [teacherRecord, pendingTeacherRecord]),
      listAdminClassRecords: vi.fn(async () => []),
    });

    const container = await render(
      <RoleGate
        requiredRole="admin"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleClient({ roles: ['admin'] }) }}
        onNavigatePath={vi.fn()}
      >
        {(context) => <AdminDashboard hostedRoleContext={context} onNavigatePath={vi.fn()} />}
      </RoleGate>,
    );
    await waitForText(container, 'Pending Teacher');

    const classForm = container.querySelector('form[aria-label="Add class"]') as HTMLFormElement;
    const teacherOptions = Array.from(classForm.querySelectorAll('option')).map((option) => option.textContent);
    expect(teacherOptions).toContain('Ms Supabase');
    expect(teacherOptions).toContain('Pending Teacher (pending sign-in)');
  });

  it('renders teacher empty state for an active teacher with no assigned classes', async () => {
    const container = await render(
      <RoleGate
        requiredRole="teacher"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleClient({ userId: 'teacher-user-1', roles: ['teacher'], includeTeacherProfile: true }) }}
        onNavigatePath={vi.fn()}
      >
        {(context) => <TeacherDashboard hostedRoleContext={context} onNavigatePath={vi.fn()} />}
      </RoleGate>,
    );
    await waitForText(container, 'Create a class');

    expect(container.textContent).toContain('Create a class');
    expect(container.textContent).toContain('Start a pilot class');
    expect(container.textContent).toContain('Create class');
    expect(container.textContent).not.toContain('No authorized dashboard data');
    expect(container.textContent).not.toContain('P3 Alpha');
  });

  it('shows an actionable admin operator repair error instead of the teacher-profile blocker', async () => {
    const container = await render(
      <RoleGate
        requiredRole="teacher"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleClient({ roles: ['admin'] }) }}
        onNavigatePath={vi.fn()}
      >
        {(context) => <TeacherDashboard hostedRoleContext={context} onNavigatePath={vi.fn()} />}
      </RoleGate>,
    );
    await waitForText(container, 'Admin teacher-operator profile is missing. Run the admin bootstrap/repair migration.');

    expect(container.textContent).toContain('Admin operator mode: you can create and manage classes for setup/troubleshooting.');
    expect(container.textContent).toContain('Admin teacher-operator profile is missing. Run the admin bootstrap/repair migration.');
    expect(container.textContent).not.toContain('No active hosted teacher profile is attached to this signed-in account.');
  });

  it('blocks a signed-in user with no active role before dashboard data renders', async () => {
    const container = await render(
      <RoleGate
        requiredRole="admin"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleClient({ roles: [] }) }}
        onNavigatePath={vi.fn()}
      >
        {(context) => <AdminDashboard hostedRoleContext={context} onNavigatePath={vi.fn()} />}
      </RoleGate>,
    );
    await waitForText(container, 'Admin access required');

    expect(container.textContent).toContain('Admin access required');
    expect(container.textContent).toContain('Active hosted roles: no active hosted role.');
    expect(container.textContent).not.toContain('Admin Console');
    expect(dashboardServiceMock.service.listAdminTeacherRecords).not.toHaveBeenCalled();
  });

  it('blocks an active teacher from admin-only dashboard actions', async () => {
    const container = await render(
      <RoleGate
        requiredRole="admin"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleClient({ userId: 'teacher-user-1', roles: ['teacher'], includeTeacherProfile: true }) }}
        onNavigatePath={vi.fn()}
      >
        {(context) => <AdminDashboard hostedRoleContext={context} onNavigatePath={vi.fn()} />}
      </RoleGate>,
    );
    await waitForText(container, 'Admin access required');

    expect(container.textContent).toContain('Admin access required');
    expect(container.textContent).toContain('Active hosted roles: teacher.');
    expect(container.textContent).not.toContain('Add teacher');
    expect(container.textContent).not.toContain('Admin Console');
    expect(dashboardServiceMock.service.addAdminTeacher).not.toHaveBeenCalled();
    expect(dashboardServiceMock.service.listAdminTeacherRecords).not.toHaveBeenCalled();
  });
});
