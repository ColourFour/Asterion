import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import {
  addRosterStudent,
  claimRosterSlotByClassCode,
  resetRosterClaim,
} from '../lib/dashboardMockService';
import { checkSupabaseHealth } from '../lib/supabaseHealth';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../components/shared/TwinklingStarfield', () => ({
  TwinklingStarfield: () => <div data-testid="starfield" />,
}));

vi.mock('../lib/loadQuestionBank', () => ({
  loadQuestionBankWithDiagnostics: vi.fn(() => Promise.resolve({
    questions: [],
    diagnostics: {
      mainQuestionsLength: 0,
      mainAppearsPlaceholder: true,
      sidecarAppearsPlaceholder: true,
      loadedQuestionCount: 0,
      normalizedQuestionCount: 0,
      sidecarEnrichmentCount: 0,
      sidecarMergeCount: 0,
      sidecarErrorCount: 0,
    },
  })),
}));

vi.mock('../lib/teachingSnippets', () => ({
  getTeachingSnippetsForRegion: vi.fn(() => []),
  loadTeachingSnippets: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../lib/generatedPractice', () => ({
  getGeneratedPracticeForRegion: vi.fn(() => []),
  loadGeneratedPractice: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../lib/supabaseHealth', () => ({
  checkSupabaseHealth: vi.fn(() => Promise.resolve({
    status: 'connected',
    payload: {
      ok: true,
      service: 'asterion',
      schema_phase: 'classroom_phase_1',
      checked_at: '2026-05-18T00:00:00.000Z',
    },
    checkedAt: '2026-05-18T00:00:00.000Z',
  })),
}));

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

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

function enableDashboardDemo() {
  vi.stubEnv('VITE_ASTERION_DASHBOARD_DEMO', 'enabled');
}

function useMockRuntimeEnv() {
  vi.stubEnv('VITE_ASTERION_DASHBOARD_DEMO', '');
  vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', '');
  vi.stubEnv('VITE_ASTERION_STUDENT_CLAIM_SOURCE', '');
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
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
  vi.unstubAllEnvs();
  useMockRuntimeEnv();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
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
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('dashboard routes', () => {
  it('keeps the normal student onboarding route rendering by default', async () => {
    window.history.replaceState(null, '', '/');
    const container = await render(<App />);

    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).toContain('Claim roster slot');
    expect(container.textContent).not.toContain('Teacher class dashboard');
    expect(container.textContent).not.toContain('Admin Console');
    expect(container.textContent).not.toContain('Demo dashboard disabled');
  });

  it('does not expose teacher dashboard routes by default', async () => {
    window.history.replaceState(null, '', '/#/teacher');
    const container = await render(<App />);

    expect(container.textContent).toContain('Demo dashboard disabled');
    expect(container.textContent).toContain('teacher dashboard is private review-build functionality');
    expect(container.textContent).toContain('VITE_ASTERION_DASHBOARD_DEMO=enabled');
    expect(container.textContent).toContain('Student app');
    expect(container.textContent).not.toContain('Teacher class dashboard');
    expect(container.textContent).not.toContain('Class progress register');
    expect(container.textContent).not.toContain('Export CSV');
  });

  it('does not expose admin dashboard routes by default', async () => {
    window.history.replaceState(null, '', '/#/admin');
    const container = await render(<App />);

    expect(container.textContent).toContain('Demo dashboard disabled');
    expect(container.textContent).toContain('admin console is private review-build functionality');
    expect(container.textContent).toContain('VITE_ASTERION_DASHBOARD_DEMO=enabled');
    expect(container.textContent).not.toContain('Admin Console');
    expect(container.textContent).not.toContain('Teacher list');
    expect(container.textContent).not.toContain('Admin view and override');
  });

  it('quarantines generic dashboard aliases in the student pilot build', async () => {
    window.history.replaceState(null, '', '/#/dashboard');
    const container = await render(<App />);

    expect(container.textContent).toContain('Demo dashboard disabled');
    expect(container.textContent).toContain('dashboard route is private review-build functionality');
    expect(container.textContent).toContain('Student app active');
    expect(container.textContent).not.toContain('Teacher class dashboard');
    expect(container.textContent).not.toContain('Admin Console');
    expect(container.textContent).not.toContain('Export CSV');
  });

  it('keeps normal student startup independent when Supabase dashboard mode lacks config', async () => {
    vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', 'supabase');
    window.history.replaceState(null, '', '/');
    const container = await render(<App />);

    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).toContain('Claim roster slot');
    expect(container.textContent).not.toContain('Supabase dashboard not configured');
    expect(container.textContent).not.toContain('Teacher class dashboard');
  });

  it('shows a safe blocked state when Supabase dashboard mode lacks browser config', async () => {
    vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', 'supabase');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    window.history.replaceState(null, '', '/#/teacher');
    const container = await render(<App />);
    await waitForText(container, 'Supabase dashboard not configured');

    expect(container.textContent).toContain('Supabase dashboard not configured');
    expect(container.textContent).toContain('Supabase classroom setup data');
    expect(container.textContent).toContain('Normal student practice remains local and available.');
    expect(container.textContent).not.toContain('P3 Alpha');
    expect(container.textContent).not.toContain('Class progress register');
  });

  it('requires an authenticated Supabase session before Supabase dashboard data is shown', async () => {
    vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', 'supabase');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://asterion-example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example');
    window.history.replaceState(null, '', '/#/teacher');
    const container = await render(<App />);
    await waitForText(container, 'Supabase sign-in required');

    expect(container.textContent).toContain('Supabase sign-in required');
    expect(container.textContent).toContain('Mock data is not shown in Supabase dashboard mode.');
    expect(container.textContent).toContain('Supabase classroom setup data');
    expect(container.textContent).not.toContain('P3 Alpha');
    expect(container.textContent).not.toContain('Class progress register');
  });

  it('requires the explicit demo flag before dashboards can render before onboarding', async () => {
    window.history.replaceState(null, '', '/#/teacher/classes/class-p3-alpha');
    let container = await render(<App />);

    expect(container.textContent).toContain('Demo dashboard disabled');
    expect(container.textContent).not.toContain('Class progress register');

    for (const root of mountedRoots.splice(0)) {
      act(() => {
        root.unmount();
      });
    }
    for (const mountedContainer of mountedContainers.splice(0)) {
      mountedContainer.remove();
    }
    document.body.innerHTML = '';

    enableDashboardDemo();
    container = await render(<App />);

    expect(container.textContent).toContain('Teacher class dashboard');
    expect(container.textContent).toContain('Class progress register');
    expect(container.textContent).not.toContain('Class access required');
  });

  it('renders the teacher dashboard before student onboarding when demo access is enabled', async () => {
    enableDashboardDemo();
    window.history.replaceState(null, '', '/#/teacher');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('P3 Alpha');
    expect(container.textContent).toContain('Teacher class dashboard');
    expect(container.textContent).toContain('Overall progress');
    expect(container.textContent).toContain('Focus this week');
    expect(container.textContent).toContain('Class progress register');
    expect(container.textContent).toContain('Class code and roster');
    expect(container.textContent).not.toContain('Use Reset claim only if a student claimed the wrong slot or needs to rejoin.');
    expect(container.textContent).not.toContain('Reset claim');
    expect(container.textContent).toContain('Open or lock P3 regions');
    expect(container.textContent).toContain('Export CSV');
    expect(container.textContent).not.toContain('Enter Astral Academy');
  });

  it('renders teacher class detail as a student register with region cells', async () => {
    enableDashboardDemo();
    window.history.replaceState(null, '', '/#/teacher/classes/class-p3-alpha');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('P3 Alpha');
    expect(container.textContent).toContain('Class progress register');
    expect(container.textContent).toContain('Algebra Vault');
    expect(container.textContent).toContain('Trigonometry Spire');
    expect(container.textContent).toContain('Needs help');
    expect(container.textContent).toContain('Weekly email preview');
    expect(container.textContent).toContain('Ada L.');
    expect(container.textContent).toContain('Locked / not taught yet');
    expect(container.textContent).toContain('Field Guide only');
  });

  it('opens class code and roster management on a separate teacher page', async () => {
    enableDashboardDemo();
    window.history.replaceState(null, '', '/#/teacher/classes/class-p3-alpha/roster');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('P3 Alpha');
    expect(container.textContent).toContain('Class code and student roster');
    expect(container.textContent).toContain('Use Reset claim only if a student claimed the wrong slot or needs to rejoin.');
    expect(container.textContent).toContain('Add student');
    expect(container.textContent).toContain('Reset claim');
    expect(container.textContent).not.toContain('Class progress register');
  });

  it('opens a clicked teacher region as a student progress detail page', async () => {
    enableDashboardDemo();
    window.history.replaceState(null, '', '/#/teacher/classes/class-p3-alpha');
    const container = await render(<App />);

    const algebraButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Algebra Vault'));
    await act(async () => {
      algebraButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(window.location.hash).toBe('#/teacher/classes/class-p3-alpha/regions/algebra-forge');
    expect(container.textContent).toContain('Region progress');
    expect(container.textContent).toContain('Algebra Vault');
    expect(container.textContent).toContain('Average mastery');
    expect(container.textContent).toContain('Ada L.');
    expect(container.textContent).not.toContain('Class code and student roster');
  });

  it('renders the admin console with teacher and class setup records', async () => {
    enableDashboardDemo();
    window.history.replaceState(null, '', '/#/admin');
    const container = await render(<App />);
    await waitForText(container, 'Admin Console');

    expect(container.querySelector('h1')?.textContent).toBe('Admin Console');
    expect(container.textContent).toContain('Teacher list');
    expect(container.textContent).toContain('Add teacher');
    expect(container.textContent).toContain('Add class');
    expect(container.textContent).toContain('Class code AST-P3A');
    expect(container.textContent).toContain('Supabase diagnostic');
    expect(container.textContent).toContain('Check connection');
    expect(container.textContent).toContain('Admin view and override');
    expect(container.textContent).toContain('Recent admin audit events');
  });

  it('runs the admin Supabase diagnostic only when requested', async () => {
    enableDashboardDemo();
    window.history.replaceState(null, '', '/#/admin');
    const container = await render(<App />);
    await waitForText(container, 'Admin Console');

    expect(checkSupabaseHealth).not.toHaveBeenCalled();

    const diagnosticButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Check connection');
    await act(async () => {
      diagnosticButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(checkSupabaseHealth).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Connected');
    expect(container.textContent).toContain('asterion classroom_phase_1');
    expect(container.textContent).toContain('Teacher list');
    expect(container.textContent).toContain('Class code AST-P3A');
  });

  it('adds teacher and class records from the admin forms', async () => {
    enableDashboardDemo();
    window.history.replaceState(null, '', '/#/admin');
    const container = await render(<App />);
    await waitForText(container, 'Admin Console');

    const teacherForm = container.querySelector('form[aria-label="Add teacher"]') as HTMLFormElement;
    const [teacherName, teacherEmail] = Array.from(teacherForm.querySelectorAll('input'));
    await act(async () => {
      setInputValue(teacherName, 'Dr Curie');
      setInputValue(teacherEmail, 'curie@example.school');
      teacherForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Dr Curie');

    const classForm = container.querySelector('form[aria-label="Add class"]') as HTMLFormElement;
    const classInputs = Array.from(classForm.querySelectorAll('input'));
    await act(async () => {
      setInputValue(classInputs[0], 'P3 Delta');
      setInputValue(classInputs[2], 'AST-P3D');
      classForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('P3 Delta');
    expect(container.textContent).toContain('Class code AST-P3D');
  });

  it('keeps Teacher/Admin/Student app navigation reachable from dashboard routes', async () => {
    enableDashboardDemo();
    window.history.replaceState(null, '', '/#/teacher');
    const container = await render(<App />);

    const adminButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Admin');
    await act(async () => {
      adminButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitForText(container, 'Admin Console');

    expect(window.location.hash).toBe('#/admin');
    expect(container.querySelector('h1')?.textContent).toBe('Admin Console');

    const studentButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Student app');
    await act(async () => {
      studentButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(window.location.pathname).toBe('/');
    expect(window.location.hash).toBe('');
    expect(container.querySelector('.dashboard-shell')).toBeNull();
    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).toContain('Claim roster slot');
    expect(container.textContent).not.toContain('Teacher Tools');
    expect(container.textContent).not.toContain('Open Export');
  });

  it('still accepts path dashboard routes when the host provides an SPA fallback', async () => {
    enableDashboardDemo();
    window.history.replaceState(null, '', '/teacher');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('P3 Alpha');
  });

  it('blocks already-claimed student roster slots until a teacher resets the claim', async () => {
    const student = await addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'Route Reset Student');
    await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Route Reset Student' });

    const container = await render(<App />);
    const claimForm = container.querySelector('form[aria-label="Claim class roster slot"]') as HTMLFormElement;
    const [classCodeInput, rosterNameInput] = Array.from(claimForm.querySelectorAll('input')) as HTMLInputElement[];

    await act(async () => {
      setInputValue(classCodeInput, 'AST-P3A');
      setInputValue(rosterNameInput, 'Route Reset Student');
      claimForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('This roster entry has already been claimed. Ask your teacher or admin for help.');
    expect(container.textContent).toContain('Claim roster slot');

    await resetRosterClaim({
      actorRole: 'teacher',
      actorTeacherId: 'teacher-hypatia',
      classId: 'class-p3-alpha',
      rosterStudentId: student!.id,
    });

    await act(async () => {
      claimForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Student real name');
    expect(container.textContent).toContain('Class details came from the claimed roster slot.');
    expect(container.textContent).not.toContain('Teacher Tools');
    expect(container.textContent).not.toContain('Open Export');
  });
});
