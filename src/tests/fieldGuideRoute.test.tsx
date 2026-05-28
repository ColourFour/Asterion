import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { emptyProgress, LOCAL_PROGRESS_STORAGE_KEY } from '../lib/progressStore';
import type { TeachingSnippet } from '../lib/teachingSnippets';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const routeSnippets = vi.hoisted<TeachingSnippet[]>(() => [
  {
    snippetId: 'p3-algebra-route-check',
    paperFamily: 'p3',
    topics: ['algebra'],
    regionIds: ['algebra-forge'],
    title: 'Rearrange before expanding',
    studentGoal: 'Choose algebraic simplification before opening every bracket.',
    body: 'P3 algebra often rewards seeing structure before expanding.',
    explanation: 'Look for a common expression or a factor that can be kept intact.',
    steps: ['Look for a repeated bracket or factor.', 'Expand only if the next step needs expanded form.'],
    examMove: 'Pause before expansion and ask whether the expression has a shared structure.',
    commonTrap: 'Cancelling part of a sum as if it were a factor.',
    reviewStatus: 'teacher_reviewed',
    source: 'teacher_authored',
    prerequisites: [],
    microSteps: ['Look for a repeated bracket or factor.'],
    commonMistakes: ['Expanding first and creating avoidable long algebra.'],
    workedExamples: [],
    estimatedTimeMinutes: 4,
    snippetType: 'method',
    sourceQuestionIds: [],
    sourceSkillTargetIds: [],
    relatedSkillTargetIds: [],
  },
]);

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
  getTeachingSnippetsForRegion: vi.fn(() => routeSnippets),
  loadTeachingSnippets: vi.fn(() => Promise.resolve(routeSnippets)),
}));

vi.mock('../lib/generatedPractice', () => ({
  getGeneratedPracticeForRegion: vi.fn(() => []),
  loadGeneratedPractice: vi.fn(() => Promise.resolve([])),
  orderGeneratedPracticeForFieldGuideTopic: vi.fn((items) => ({ items, exactMatchCount: 0 })),
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
    for (let index = 0; index < 5; index += 1) {
      await Promise.resolve();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  return container;
}

async function waitForText(container: HTMLElement, text: string) {
  for (let index = 0; index < 120; index += 1) {
    if (container.textContent?.includes(text)) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

async function clickButton(container: HTMLElement, text: string) {
  await act(async () => {
    Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes(text))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_ASTERION_APP_PROFILE', 'student-pilot');
  vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', 'mock');
  vi.stubEnv('VITE_ASTERION_STUDENT_CLAIM_SOURCE', 'mock');
  localStorage.clear();
  sessionStorage.clear();
  const progress = emptyProgress();
  localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
    ...progress,
    profile: {
      id: 'profile_route',
      realName: 'Ada Lovelace',
      classGroup: 'P3 Alpha',
      teacherName: 'Ms Hypatia',
      avatarName: 'Aster',
      avatarId: 'star-apprentice',
      onboardingCompleted: true,
      onboardingCompletedAt: '2026-05-08T00:00:00.000Z',
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
      classClaim: {
        status: 'claimed',
        source: 'mock',
        classCode: 'AST-P3A',
        classId: 'class-p3-alpha',
        className: 'P3 Alpha',
        teacherId: 'teacher-hypatia',
        teacherName: 'Ms Hypatia',
        rosterStudentId: 'roster-alpha-resettable-pilot',
        displayName: 'Pilot Student',
        claimedAt: '2026-05-08T00:00:00.000Z',
        message: 'Reusable pilot roster slot claimed.',
      },
    },
  }));
  window.history.replaceState(null, '', '/#/regions/algebra-forge/field-guide');
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
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllEnvs();
  window.history.replaceState(null, '', '/');
});

describe('Field Guide app route', () => {
  it('keeps the global navigation visible above the focused Field Guide page', async () => {
    const container = await render(<App />);
    await waitForText(container, 'Choose the Topic');

    const topbar = container.querySelector<HTMLElement>('.topbar');
    const fieldGuideHeader = container.querySelector<HTMLElement>('.focused-region-page-header');

    expect(topbar).toBeTruthy();
    expect(topbar?.textContent).toContain('World Map');
    expect(topbar?.textContent).toContain('Regions');
    expect(topbar?.textContent).toContain('Exam Training');
    expect(topbar?.textContent).not.toContain('Class Hall');
    expect(topbar?.textContent).not.toContain('Review Weak Areas');
    expect(topbar?.querySelector('nav')?.textContent).not.toContain('Teacher/Export');
    expect(topbar?.textContent).not.toContain('Teacher tools');
    expect(topbar?.textContent).not.toContain('Open export');
    expect(topbar?.textContent).not.toContain('Teacher login');
    expect(topbar?.textContent).not.toContain('Admin login');
    expect(topbar?.textContent).not.toContain('Admin Console');
    expect(topbar?.textContent).not.toContain('local-first classroom mode');
    expect(fieldGuideHeader).toBeTruthy();
    expect(fieldGuideHeader?.textContent).toContain('Field Guide');
    expect(fieldGuideHeader?.textContent).toContain('Algebra Vault');
    expect(container.textContent).toContain('Choose a topic to learn.');
    expect(container.textContent).toContain('Polynomial Division');
    expect(container.textContent).toContain('Binomial Expansions');
    expect(topbar!.compareDocumentPosition(fieldGuideHeader!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(topbar?.querySelector('.teacher-access-menu')).toBeNull();
  });

  it('shows a safe unavailable state for direct Class Hall routes', async () => {
    window.history.replaceState(null, '', '/#/class-hall');
    const container = await render(<App />);
    await waitForText(container, 'Class Hall is unavailable during pilot prep.');

    expect(container.textContent).toContain('Pilot prep');
    expect(container.textContent).not.toContain('Class Hall avatar showcase');
    expect(container.textContent).not.toContain('Class Hall Welcomer');
  });

  it('keeps the legacy Quick Check hash route on the merged Skill Check page', async () => {
    window.history.replaceState(null, '', '/#/regions/algebra-forge/quick-check');
    const container = await render(<App />);
    await waitForText(container, 'Skill Check');

    expect(container.querySelector<HTMLElement>('.focused-region-page-header')?.textContent).toContain('Skill Check');
    expect(container.querySelector<HTMLElement>('.region-learning-nav button.active')?.textContent).toContain('Skill Check');
    expect(container.querySelector('.skill-practice-topic-grid')).toBeTruthy();
    expect(container.textContent).toContain('Field Guide topic');
    expect(container.textContent).not.toContain('Quick Check');
    expect(container.textContent).toContain('Worked-route item');
    expect(container.querySelector('.skill-check-authored-card')).toBeTruthy();
    expect(container.querySelector('.skill-practice-exam-transition')).toBeTruthy();
    expect(container.textContent).not.toContain('Warm-Up');
  });

  it('keeps the legacy Warm-Up hash route on the merged Skill Check page', async () => {
    window.history.replaceState(null, '', '/#/regions/algebra-forge/warm-up');
    const container = await render(<App />);
    await waitForText(container, 'Skill Check');

    expect(container.querySelector<HTMLElement>('.focused-region-page-header')?.textContent).toContain('Skill Check');
    expect(container.querySelector<HTMLElement>('.region-learning-nav button.active')?.textContent).toContain('Skill Check');
    expect(container.querySelector('.skill-practice-topic-grid')).toBeTruthy();
    expect(container.textContent).toContain('Worked-route item');
    expect(container.querySelector('.warm-up-card')).toBeTruthy();
    expect(container.querySelector('.skill-practice-exam-transition')).toBeTruthy();
    expect(container.textContent).not.toContain('Warm-Up');
    expect(container.textContent).not.toContain('answer-first set with worked solutions');
  });

  it('opens the Exam Training dashboard from the global student navigation', async () => {
    const container = await render(<App />);
    await waitForText(container, 'Choose the Topic');

    await clickButton(container, 'Exam Training');
    await waitForText(container, 'Your Topic Mastery');

    expect(container.querySelector('.exam-training-dashboard')).toBeTruthy();
    expect(window.location.hash).toBe('#/exam-training');
    expect(container.textContent).toContain('Core Practice');
    expect(container.textContent).toContain('Weak Area Review');
    expect(container.textContent).toContain('Stretch Problems');
    expect(container.querySelector('.encounter-chamber')).toBeFalsy();
  });

  it('opens the Exam Training dashboard for the region hash route', async () => {
    window.history.replaceState(null, '', '/#/regions/algebra-forge/exam-training');
    const container = await render(<App />);
    await waitForText(container, 'Your Topic Mastery');

    expect(container.querySelector('.exam-training-dashboard')).toBeTruthy();
    expect(container.textContent).toContain('Focused on Algebra Vault');
    expect(container.textContent).toContain('Balanced exam-style practice. Start here when you want a steady next question.');
    expect(container.querySelector('.encounter-chamber')).toBeFalsy();
  });

  it('opens the global Exam Training dashboard for the stable dashboard hash route', async () => {
    window.history.replaceState(null, '', '/#/exam-training');
    const container = await render(<App />);
    await waitForText(container, 'Your Topic Mastery');

    expect(container.querySelector('.exam-training-dashboard')).toBeTruthy();
    expect(container.textContent).toContain('Choose a practice route, then self-mark from the official mark scheme.');
    expect(container.querySelector('.encounter-chamber')).toBeFalsy();
  });

  it('keeps locked legacy and merged Skill Check hashes behind class access', async () => {
    for (const page of ['quick-check', 'warm-up', 'skill-practice']) {
      window.history.replaceState(null, '', `/#/regions/complex-harbor/${page}`);
      const container = await render(<App />);
      await waitForText(container, 'Skill Check is locked for this class');

      expect(container.querySelector<HTMLElement>('.focused-region-page-header')?.textContent).toContain('Skill Check');
      expect(container.querySelector<HTMLElement>('.region-learning-nav button.active')?.textContent).toContain('Skill Check');
      expect(container.textContent).toContain('cannot save new attempts or clear the Guardian');
      expect(container.querySelector('.quick-check-card')).toBeFalsy();
      expect(container.querySelector('.warm-up-practice-card')).toBeFalsy();

      for (const root of mountedRoots.splice(0)) {
        act(() => {
          root.unmount();
        });
      }
      for (const mountedContainer of mountedContainers.splice(0)) {
        mountedContainer.remove();
      }
    }
  });
});
