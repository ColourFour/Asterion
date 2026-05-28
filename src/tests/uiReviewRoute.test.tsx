import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { emptyProgress, saveProgress } from '../lib/progressStore';

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
    for (let index = 0; index < 4; index += 1) {
      await Promise.resolve();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  return container;
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_ASTERION_APP_PROFILE', '');
  vi.stubEnv('VITE_ASTERION_DASHBOARD_DEMO', '');
  vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', '');
  vi.stubEnv('VITE_ASTERION_STUDENT_CLAIM_SOURCE', '');
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
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
  document.body.removeAttribute('style');
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllEnvs();
  window.history.replaceState(null, '', '/');
});

describe('UI review route', () => {
  it('renders the internal UI review index at /#/ui-review', async () => {
    window.history.replaceState(null, '', '/#/ui-review');
    const container = await render(<App />);

    expect(container.textContent).toContain('Asterion UI Review');
    expect(container.textContent).toContain('Internal review surface. Do not use with students.');
    expect(container.textContent).toContain('How to use this page');
    expect(container.textContent).toContain('Open /#/ui-review.');
    expect(container.textContent).toContain('Record the needed fix.');
  }, 20_000);

  it('renders the required review sections and major route cards', async () => {
    window.history.replaceState(null, '', '/#/ui-review');
    const container = await render(<App />);

    for (const section of ['Student Flow', 'World And Regions', 'Learning Pages', 'Teacher/Admin', 'System States']) {
      expect(container.textContent).toContain(section);
    }

    for (const card of [
      'Home landing',
      'Student class-code / roster-name entry',
      'World map',
      'Algebra Vault',
      'Field Guide',
      'Teacher dashboard',
      'Admin dashboard',
      'Runtime configuration blocked diagnostic',
    ]) {
      expect(container.textContent).toContain(card);
    }

    expect(container.querySelector('a[href="#/student"]')).toBeTruthy();
    expect(container.querySelector('a[href="#/teacher"]')).toBeTruthy();
    expect(container.querySelector('a[href="#/admin"]')).toBeTruthy();
    expect(container.querySelector('a[href="#/ui-review/world-map"]')).toBeTruthy();
  });

  it('explains route labels', async () => {
    window.history.replaceState(null, '', '/#/ui-review');
    const container = await render(<App />);

    expect(container.textContent).toContain('Live route:');
    expect(container.textContent).toContain('opens the real app route and may require login/context.');
    expect(container.textContent).toContain('Preview route:');
    expect(container.textContent).toContain('read-only fixture state used for visual review.');
    expect(container.textContent).toContain('Mock state:');
    expect(container.textContent).toContain('fake local data, no Supabase writes.');
    expect(container.textContent).toContain('Requires login:');
    expect(container.textContent).toContain('normal auth still applies.');
  });

  it.each([
    ['student-entry', 'Student class-code / roster-name entry'],
    ['student-onboarding', 'Welcome to Asterion'],
    ['avatar', 'Avatar/profile setup'],
    ['world-map', 'Returning student map state'],
    ['system-loading', 'Loading classroom context...'],
    ['system-empty', 'No review data available'],
    ['system-error', 'Something needs attention'],
  ])('renders preview page %s with a back link', async (page, expectedText) => {
    window.history.replaceState(null, '', `/#/ui-review/${page}`);
    const container = await render(<App />);

    expect(container.textContent).toContain(expectedText);
    expect(container.textContent).toContain('Preview / internal');
    expect(container.querySelector('a[href="#/ui-review"]')).toBeTruthy();
  });

  it('shows internal guidance for unknown UI review subroutes', async () => {
    window.history.replaceState(null, '', '/#/ui-review/missing-preview');
    const container = await render(<App />);

    expect(container.textContent).toContain('Unknown UI review page');
    expect(container.textContent).toContain('Return to the index and choose a listed review item.');
    expect(container.querySelector('a[href="#/ui-review"]')).toBeTruthy();
  });

  it('does not expose the UI review route in normal student navigation', async () => {
    const progress = emptyProgress();
    saveProgress({
      ...progress,
      profile: {
        id: 'student-1',
        realName: 'Pilot Student',
        classGroup: 'P3 Alpha',
        teacherName: 'Ms Hypatia',
        avatarName: 'Maya',
        avatarId: 'star-apprentice',
        onboardingCompleted: true,
        onboardingCompletedAt: '2026-05-22T00:00:00.000Z',
        createdAt: '2026-05-22T00:00:00.000Z',
        updatedAt: '2026-05-22T00:00:00.000Z',
        classClaim: {
          status: 'claimed',
          classCode: 'AST-P3A',
          classId: 'class-p3-alpha',
          className: 'P3 Alpha',
          teacherId: 'teacher-hypatia',
          teacherName: 'Ms Hypatia',
          rosterStudentId: 'roster-alpha-resettable-pilot',
          displayName: 'Pilot Student',
          message: 'Reusable pilot roster slot claimed.',
        },
      },
    });
    window.history.replaceState(null, '', '/');
    const container = await render(<App />);

    expect(container.textContent).toContain('World Map');
    expect(container.textContent).toContain('Regions');
    expect(container.textContent).not.toContain('UI Review');
    expect(container.querySelector('a[href="#/ui-review"]')).toBeNull();
    expect(container.querySelector('button')?.textContent).not.toContain('UI Review');
  });

  it('keeps existing student, teacher, and admin route behavior unchanged', async () => {
    window.history.replaceState(null, '', '/#/student');
    const student = await render(<App />);
    expect(student.textContent).toContain('Class access required');
    expect(student.textContent).not.toContain('Asterion UI Review');

    window.history.replaceState(null, '', '/#/teacher');
    const teacher = await render(<App />);
    expect(teacher.textContent).toContain('Demo dashboard disabled');
    expect(teacher.textContent).not.toContain('Asterion UI Review');

    window.history.replaceState(null, '', '/#/admin');
    const admin = await render(<App />);
    expect(admin.textContent).toContain('Demo dashboard disabled');
    expect(admin.textContent).not.toContain('Asterion UI Review');
  });

  it('does not reintroduce student-visible email/password or magic-link auth UI', async () => {
    window.history.replaceState(null, '', '/#/ui-review/student-entry');
    const container = await render(<App />);

    expect(container.querySelector('input[type="email"]')).toBeNull();
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(container.textContent?.toLowerCase()).not.toContain('magic link');
    expect(container.textContent).toContain('Class code');
    expect(container.textContent).toContain('Roster name');
  });
});
