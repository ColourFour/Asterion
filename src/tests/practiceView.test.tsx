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

function markSchemeLoaded(container: HTMLElement) {
  act(() => {
    container.querySelector<HTMLImageElement>('.mark-scheme-panel img')?.dispatchEvent(new Event('load', { bubbles: true }));
  });
}

function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(
    input instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
    'value',
  );
  act(() => {
    descriptor?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function clickInput(input: HTMLInputElement | null) {
  expect(input).toBeTruthy();
  act(() => {
    input?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
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

describe('PracticeView self-mark reflection', () => {
  it('saves multiple mistake tags for non-perfect attempts', () => {
    const { container, onAttempt } = renderPractice(question());

    clickButton(container, 'Reveal Mark Scheme');
    markSchemeLoaded(container);

    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="M marks"]')!, '1');
    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="B marks"]')!, '1');
    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="A marks"]')!, '1');
    clickInput(container.querySelector<HTMLInputElement>('input[value="algebra_error"]'));
    clickInput(container.querySelector<HTMLInputElement>('input[value="misread_question"]'));

    expect(saveAttemptButton(container).disabled).toBe(false);
    clickButton(container, 'Save Attempt');

    expect(onAttempt).toHaveBeenCalledTimes(1);
    expect(onAttempt.mock.calls[0][0]).toMatchObject({
      marksEarned: 3,
      mistakeType: 'algebra_error',
      mistakeTypes: ['algebra_error', 'misread_question'],
    });
  });

  it('requires a mark-scheme confirmation and evidence note for full-score attempts', () => {
    const { container, onAttempt } = renderPractice(question());

    clickButton(container, 'Reveal Mark Scheme');
    markSchemeLoaded(container);

    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="M marks"]')!, '2');
    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="B marks"]')!, '1');
    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="A marks"]')!, '1');

    expect(container.textContent).not.toContain('No issue');
    expect(container.textContent).toContain('Full score selected.');
    expect(saveAttemptButton(container).disabled).toBe(true);

    clickInput(container.querySelector<HTMLInputElement>('.full-score-check-label input'));
    expect(saveAttemptButton(container).disabled).toBe(true);

    setInputValue(container.querySelector<HTMLTextAreaElement>('textarea')!, 'Checked every mark-scheme line.');
    expect(saveAttemptButton(container).disabled).toBe(false);
    clickButton(container, 'Save Attempt');

    expect(onAttempt).toHaveBeenCalledTimes(1);
    expect(onAttempt.mock.calls[0][0]).toMatchObject({
      marksEarned: 4,
      mistakeTypes: [],
      fullScoreConfirmed: true,
      note: 'Checked every mark-scheme line.',
    });
    expect(onAttempt.mock.calls[0][0].mistakeType).toBeUndefined();
  });
});
