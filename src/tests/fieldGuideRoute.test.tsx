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
  localStorage.clear();
  const progress = emptyProgress();
  localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
    ...progress,
    profile: {
      id: 'profile_route',
      realName: 'Ada Lovelace',
      classGroup: 'P3 Alpha',
      teacherName: 'Ms Hypatia',
      avatarName: 'Aster',
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
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
  window.history.replaceState(null, '', '/');
});

describe('Field Guide app route', () => {
  it('keeps the global navigation visible above the focused Field Guide page', async () => {
    const container = await render(<App />);
    await waitForText(container, 'Rearrange before expanding');

    const topbar = container.querySelector<HTMLElement>('.topbar');
    const fieldGuideHeader = container.querySelector<HTMLElement>('.focused-region-page-header');

    expect(topbar).toBeTruthy();
    expect(topbar?.textContent).toContain('World Map');
    expect(topbar?.textContent).toContain('Regions');
    expect(topbar?.textContent).toContain('Start Practice');
    expect(topbar?.textContent).not.toContain('Review Weak Areas');
    expect(topbar?.querySelector('nav')?.textContent).not.toContain('Teacher/Export');
    expect(topbar?.textContent).not.toContain('Teacher tools');
    expect(topbar?.textContent).not.toContain('Open export');
    expect(topbar?.textContent).not.toContain('local-first classroom mode');
    expect(fieldGuideHeader).toBeTruthy();
    expect(fieldGuideHeader?.textContent).toContain('Field Guide');
    expect(fieldGuideHeader?.textContent).toContain('Algebra Vault');
    expect(container.textContent).toContain('Rearrange before expanding');
    expect(topbar!.compareDocumentPosition(fieldGuideHeader!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(topbar?.querySelector('.teacher-access-menu')).toBeNull();
  });
});
