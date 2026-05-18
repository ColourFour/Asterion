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

beforeEach(() => {
  localStorage.clear();
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
  window.history.replaceState(null, '', '/');
});

describe('dashboard routes', () => {
  it('renders the teacher dashboard before student onboarding', async () => {
    window.history.replaceState(null, '', '/#/teacher');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('Teacher Planning');
    expect(container.textContent).toContain('What should I do with this class next?');
    expect(container.textContent).toContain('Mock classroom signals for planning');
    expect(container.textContent).toContain('Planning evidence snapshot');
    expect(container.textContent).toContain('Reteach now');
    expect(container.textContent).toContain('Ready for exam practice');
    expect(container.textContent).not.toContain('Enter Astral Academy');
  });

  it('renders teacher class detail groups by recommended next step', async () => {
    window.history.replaceState(null, '', '/#/teacher/classes/class-p3-alpha');
    const container = await render(<App />);

    expect(container.textContent).toContain('Class detail');
    expect(container.textContent).toContain('Join code AST-P3A');
    expect(container.textContent).toContain('Needs Field Guide');
    expect(container.textContent).toContain('Ready for Guardian');
    expect(container.textContent).toContain('Ada L.');
  });

  it('renders the admin console with disabled support actions', async () => {
    window.history.replaceState(null, '', '/#/admin');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('Admin Console');
    expect(container.textContent).toContain('Teacher list');
    expect(container.textContent).toContain('Recent admin audit events');
    expect(Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Archive class'))?.disabled).toBe(true);
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
    expect(container.textContent).toContain('Enter Astral Academy');
  });

  it('still accepts path dashboard routes when the host provides an SPA fallback', async () => {
    window.history.replaceState(null, '', '/teacher');
    const container = await render(<App />);

    expect(container.querySelector('h1')?.textContent).toBe('Teacher Planning');
  });
});
