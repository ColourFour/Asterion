import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PracticeView } from '../components/practice/PracticeView';
import { emptyProgress } from '../lib/progressStore';
import type { AvatarLocation } from '../lib/avatarLocation';
import type { Attempt, NormalizedQuestion, StoredProgress } from '../types';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

function render(ui: ReactNode): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  mountedContainers.push(container);

  act(() => {
    root.render(ui);
  });

  return container;
}

afterEach(() => {
  for (const root of mountedRoots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of mountedContainers.splice(0)) {
    container.remove();
  }
});

function progressWithProfile(): StoredProgress {
  return {
    ...emptyProgress(),
    profile: {
      id: 'profile_1',
      realName: 'Test Student',
      classGroup: 'Demo',
      teacherName: 'Teacher',
      avatarName: 'Aster',
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    },
  };
}

function question(overrides: Partial<NormalizedQuestion> = {}): NormalizedQuestion {
  return {
    id: 'p3_q1',
    paperFamily: 'p3',
    paper: '31autumn21',
    questionNumber: '1',
    displayTopic: 'Algebra',
    displaySubtopic: 'polynomials',
    displayDifficulty: 'core',
    marksAvailable: 4,
    deepseek: { hasError: false, topic: 'Algebra', subtopic: 'polynomials' },
    questionImageRawPaths: ['p3/31autumn21/questions/q01.png'],
    markSchemeImageRawPaths: ['p3/31autumn21/mark_scheme/q01.png'],
    questionImagePaths: ['p3/31autumn21/questions/q01.png'],
    markSchemeImagePaths: ['p3/31autumn21/mark_scheme/q01.png'],
    questionImageUrls: ['/assets/31autumn21/questions/q01.png'],
    markSchemeImageUrls: ['/assets/31autumn21/mark_scheme/q01.png'],
    questionImageCandidates: [['/assets/31autumn21/questions/q01.png']],
    markSchemeImageCandidates: [['/assets/31autumn21/mark_scheme/q01.png']],
    raw: { local: {} },
    ...overrides,
  };
}

const avatarLocation: AvatarLocation = { source: 'none', label: 'No open wing' };

function renderPractice(testQuestion: NormalizedQuestion, onAttempt = vi.fn<(attempt: Attempt) => void>()) {
  return {
    onAttempt,
    container: render(
      <PracticeView
        question={testQuestion}
        progress={progressWithProfile()}
        avatarName="Aster"
        avatar={emptyProgress().avatar}
        regionProgress={[]}
        avatarLocation={avatarLocation}
        onAttempt={onAttempt}
        onIssue={vi.fn()}
      />,
    ),
  };
}

function clickButton(container: HTMLElement, text: string) {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes(text));
  expect(button).toBeTruthy();
  act(() => {
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function saveAttemptButton(container: HTMLElement): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((candidate) => candidate.textContent?.includes('Save Attempt'));
  expect(button).toBeTruthy();
  return button!;
}

describe('PracticeView mark-scheme availability', () => {
  it('blocks attempt saving when no mark-scheme image candidates exist', () => {
    const { container } = renderPractice(question({
      markSchemeImageRawPaths: [],
      markSchemeImagePaths: [],
      markSchemeImageUrls: [],
      markSchemeImageCandidates: [],
    }));

    clickButton(container, 'Reveal Mark Scheme');

    expect(container.textContent).toContain('Mark scheme image unavailable');
    expect(container.textContent).toContain('Asterion will not save marks, XP, mastery, or avatar progress for this question.');
    expect(saveAttemptButton(container).disabled).toBe(true);
  });

  it('blocks attempt saving after all mark-scheme image candidates fail', () => {
    const { container } = renderPractice(question({
      markSchemeImageCandidates: [['/assets/missing-a.png', '/assets/missing-b.png']],
    }));

    clickButton(container, 'Reveal Mark Scheme');

    act(() => {
      container.querySelector<HTMLImageElement>('.mark-scheme-panel img')?.dispatchEvent(new Event('error', { bubbles: true }));
    });
    act(() => {
      container.querySelector<HTMLImageElement>('.mark-scheme-panel img')?.dispatchEvent(new Event('error', { bubbles: true }));
    });

    expect(container.textContent).toContain('Asterion will not save marks, XP, mastery, or avatar progress for this question.');
    expect(saveAttemptButton(container).disabled).toBe(true);
  });
});
