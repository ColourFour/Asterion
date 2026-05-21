import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleGate } from '../components/auth/RoleGate';
import type { SupabaseRoleClient, SupabaseRoleQueryBuilder } from '../lib/supabaseRoleService';
import { resolveSupabaseConfig } from '../lib/supabaseConfig';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const validConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: 'https://asterion-example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
});

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

type RoleName = 'admin' | 'teacher' | 'student';

function createRoleGateClient({
  userId,
  roles,
}: {
  userId?: string;
  roles: RoleName[];
}) {
  const now = '2026-05-20T08:00:00.000Z';
  const rows = {
    organizations: [{
      id: 'org-1',
      name: 'Test School',
      status: 'active',
      created_at: now,
      updated_at: now,
    }],
    user_roles: roles.map((role) => ({
      id: `role-${role}`,
      user_id: userId,
      organization_id: 'org-1',
      role,
      status: 'active',
      created_at: now,
      updated_at: now,
    })),
    teacher_profiles: roles.includes('teacher') ? [{
      id: 'teacher-profile-1',
      user_id: userId,
      organization_id: 'org-1',
      display_name: 'Teacher One',
      email: 'teacher@example.school',
      status: 'active',
      created_at: now,
      updated_at: now,
    }] : [],
    student_profiles: roles.includes('student') ? [{
      id: 'student-profile-1',
      user_id: userId,
      organization_id: 'org-1',
      display_name: 'Student One',
      optional_email: null,
      status: 'active',
      created_at: now,
      updated_at: now,
    }] : [],
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

  const client: SupabaseRoleClient = {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: userId ? { user: { id: userId, email: `${userId}@example.school` } } : null },
        error: null,
      })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn((table: string) => new QueryBuilder<Record<string, unknown>>(table as FixtureTable)) as unknown as SupabaseRoleClient['from'],
  };
  return client;
}

async function render(ui: ReactNode): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  mountedContainers.push(container);

  await act(async () => {
    root.render(ui);
    await Promise.resolve();
    await Promise.resolve();
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

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://asterion-example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example');
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
  vi.unstubAllEnvs();
});

describe('RoleGate', () => {
  it('shows sign-in required before hosted dashboard access', async () => {
    const container = await render(
      <RoleGate
        requiredRole="teacher"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleGateClient({ roles: [] }) }}
        onNavigatePath={vi.fn()}
      >
        {() => <div>Teacher Shell</div>}
      </RoleGate>,
    );
    await waitForText(container, 'Supabase sign-in required');

    expect(container.textContent).toContain('Supabase sign-in required');
    expect(container.textContent).toContain('Mock data is not shown in Supabase dashboard mode.');
    expect(container.textContent).not.toContain('Teacher Shell');
  });

  it('blocks a signed-in student from teacher dashboard content and nav controls', async () => {
    const container = await render(
      <RoleGate
        requiredRole="teacher"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleGateClient({ userId: 'student-user-1', roles: ['student'] }) }}
        onNavigatePath={vi.fn()}
      >
        {() => <div>Teacher Shell</div>}
      </RoleGate>,
    );
    await waitForText(container, 'Teacher access required');

    expect(container.textContent).toContain('Teacher access required');
    expect(container.textContent).toContain('Active hosted roles: student.');
    expect(container.textContent).not.toContain('Teacher Shell');
    expect(Array.from(container.querySelectorAll('nav button')).map((button) => button.textContent)).toEqual(['Student app']);
  });

  it('allows a signed-in teacher into the teacher dashboard shell', async () => {
    const container = await render(
      <RoleGate
        requiredRole="teacher"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleGateClient({ userId: 'teacher-user-1', roles: ['teacher'] }) }}
        onNavigatePath={vi.fn()}
      >
        {(context) => <div>Teacher Shell for {context.user.email}</div>}
      </RoleGate>,
    );
    await waitForText(container, 'Teacher Shell');

    expect(container.textContent).toContain('Teacher Shell for teacher-user-1@example.school');
    expect(container.textContent).not.toContain('Admin access required');
  });

  it('allows a signed-in admin into the admin dashboard shell', async () => {
    const container = await render(
      <RoleGate
        requiredRole="admin"
        roleServiceOptions={{ config: validConfig, createClient: async () => createRoleGateClient({ userId: 'admin-user-1', roles: ['admin'] }) }}
        onNavigatePath={vi.fn()}
      >
        {(context) => <div>Admin Shell for {context.user.email}</div>}
      </RoleGate>,
    );
    await waitForText(container, 'Admin Shell');

    expect(container.textContent).toContain('Admin Shell for admin-user-1@example.school');
    expect(container.textContent).not.toContain('Teacher access required');
  });
});
