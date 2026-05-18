import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

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

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
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
  it('renders the teacher dashboard before student onboarding', async () => {
    window.history.replaceState(null, '', '/#/teacher');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('P3 Alpha');
    expect(container.textContent).toContain('Teacher class dashboard');
    expect(container.textContent).toContain('Overall progress');
    expect(container.textContent).toContain('Focus this week');
    expect(container.textContent).toContain('Class progress register');
    expect(container.textContent).toContain('Class code and student roster');
    expect(container.textContent).toContain('Open or lock P3 regions');
    expect(container.textContent).toContain('Export CSV');
    expect(container.textContent).not.toContain('Enter Astral Academy');
  });

  it('renders teacher class detail as a student register with region cells', async () => {
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

  it('renders the admin console with teacher and class setup records', async () => {
    window.history.replaceState(null, '', '/#/admin');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('Admin Console');
    expect(container.textContent).toContain('Teacher list');
    expect(container.textContent).toContain('Add teacher');
    expect(container.textContent).toContain('Add class');
    expect(container.textContent).toContain('Class code AST-P3A');
    expect(container.textContent).toContain('Admin view and override');
    expect(container.textContent).toContain('Recent admin audit events');
  });

  it('adds teacher and class records from the admin forms', async () => {
    window.history.replaceState(null, '', '/#/admin');
    const container = await render(<App />);

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
    window.history.replaceState(null, '', '/#/teacher');
    const container = await render(<App />);

    const adminButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Admin');
    await act(async () => {
      adminButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

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
  });

  it('still accepts path dashboard routes when the host provides an SPA fallback', async () => {
    window.history.replaceState(null, '', '/teacher');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('P3 Alpha');
  });
});
