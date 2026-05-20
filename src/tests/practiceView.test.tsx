import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PracticeView } from '../components/practice/PracticeView';
import { emptyProgress } from '../lib/progressStore';
import type { AvatarLocation } from '../lib/avatarLocation';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import type { Attempt, IssueType, NormalizedQuestion, RegionDefinition, StoredProgress } from '../types';

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

function renderPractice(
  testQuestion: NormalizedQuestion,
  onAttempt = vi.fn<(attempt: Attempt) => void>(),
  options: { onContinuePractice?: () => void; continuePracticeLabel?: string; onIssue?: (questionId: string, issueType: IssueType, note?: string) => void; selectedRegion?: RegionDefinition; progressionBlockedReason?: string } = {},
) {
  const onIssue = options.onIssue ?? vi.fn<(questionId: string, issueType: IssueType, note?: string) => void>();
  return {
    onAttempt,
    onIssue,
    container: render(
      <PracticeView
        question={testQuestion}
        progress={progressWithProfile()}
        avatarName="Aster"
        avatar={emptyProgress().avatar}
        regionProgress={[]}
        avatarLocation={avatarLocation}
        selectedRegion={options.selectedRegion}
        progressionBlockedReason={options.progressionBlockedReason}
        onAttempt={onAttempt}
        onIssue={onIssue}
        onContinuePractice={options.onContinuePractice}
        continuePracticeLabel={options.continuePracticeLabel}
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

  it('blocks locked-region attempts from awarding mastery or progression', () => {
    const onAttempt = vi.fn<(attempt: Attempt) => void>();
    const { container } = renderPractice(question(), onAttempt, {
      progressionBlockedReason: 'Your teacher has opened the Field Guide for this region.',
    });

    clickButton(container, 'Reveal Mark Scheme');
    markSchemeLoaded(container);

    expect(container.textContent).toContain('Region activity locked');
    expect(container.textContent).toContain('Asterion will not save marks, XP, mastery, guardian clears, or avatar progress for this locked region.');
    expect(saveAttemptButton(container).disabled).toBe(true);

    act(() => {
      container.querySelector<HTMLFormElement>('.attempt-form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(onAttempt).not.toHaveBeenCalled();
  });
});

describe('PracticeView self-mark reflection', () => {
  it('sets the practice title accent from the selected region theme', () => {
    const algebraRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'algebra-forge');
    expect(algebraRegion).toBeTruthy();

    const { container } = renderPractice(question(), vi.fn(), { selectedRegion: algebraRegion });
    const practiceCard = container.querySelector<HTMLElement>('.encounter-chamber');

    expect(practiceCard?.style.getPropertyValue('--practice-region-accent')).toBe('#b8872d');
    expect(container.querySelector('.question-header h2')?.textContent).toBe('Algebra Vault');
  });

  it('prompts students to enter a mark and shows zero placeholders', () => {
    const { container } = renderPractice(question());

    const initialFooterButtons = Array.from(container.querySelectorAll('.practice-footer-actions button'))
      .map((button) => button.textContent?.trim());
    expect(initialFooterButtons).toEqual(['Reveal Mark Scheme', 'Save Attempt']);
    expect(container.querySelector('.question-header-actions')?.textContent).not.toContain('Report issue');
    const revealButton = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent === 'Reveal Mark Scheme');
    const reportButton = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent === 'Report issue');
    expect(revealButton).toBeTruthy();
    expect(reportButton).toBeTruthy();
    expect(Boolean(revealButton!.compareDocumentPosition(reportButton!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(container.querySelector<HTMLDetailsElement>('.practice-support-details')?.open).toBe(false);

    clickButton(container, 'Reveal Mark Scheme');
    markSchemeLoaded(container);

    expect(container.querySelector('.mark-scheme-panel img')).toBeTruthy();
    expect(container.querySelector('.self-mark-task-flow')?.textContent).toContain('Compare mark scheme');
    expect(container.querySelector('.self-mark-task-flow')?.textContent).toContain('Save attempt');
    expect(container.textContent).toContain('Use this image to decide every M, B, and A mark. Asterion does not auto-mark.');
    expect(container.textContent).toContain('Self-marking means you enter the exact marks you earned from the official mark scheme.');
    expect(container.textContent).toContain('Enter your mark from the official mark scheme above.');
    expect(Array.from(container.querySelectorAll<HTMLInputElement>('.mark-box-stepper input')).map((input) => input.placeholder)).toEqual(['0', '0', '0']);
  });

  it('renders duplicate question and mark-scheme image candidates only once', () => {
    const duplicateQuestion = question({
      questionImageCandidates: [
        ['/assets/31autumn21/questions/q01.png'],
        ['/assets/31autumn21/questions/q01.png'],
      ],
      markSchemeImageCandidates: [
        ['/assets/31autumn21/mark_scheme/q01.png'],
        ['/assets/31autumn21/mark_scheme/q01.png'],
      ],
    });
    const { container } = renderPractice(duplicateQuestion);

    expect(Array.from(container.querySelectorAll<HTMLImageElement>('.question-panel img')).map((img) => img.getAttribute('src'))).toEqual([
      '/assets/31autumn21/questions/q01.png',
    ]);

    clickButton(container, 'Reveal Mark Scheme');

    expect(Array.from(container.querySelectorAll<HTMLImageElement>('.mark-scheme-panel img')).map((img) => img.getAttribute('src'))).toEqual([
      '/assets/31autumn21/mark_scheme/q01.png',
    ]);
  });

  it('opens and closes a full-size canonical question image view', () => {
    const { container } = renderPractice(question());
    const questionImage = container.querySelector<HTMLImageElement>('.question-panel .image-stack-item img');
    const zoomButton = Array.from(container.querySelectorAll<HTMLButtonElement>('.question-panel button'))
      .find((button) => button.textContent === 'Open full-size question');

    expect(questionImage?.getAttribute('src')).toBe('/assets/31autumn21/questions/q01.png');
    expect(questionImage?.getAttribute('alt')).toBe('Question 1');
    expect(zoomButton).toBeTruthy();

    act(() => {
      zoomButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const dialog = container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
    const fullSizeImage = dialog?.querySelector<HTMLImageElement>('.image-lightbox-scroll img');
    expect(dialog?.getAttribute('aria-label')).toBe('Full-size question image');
    expect(fullSizeImage?.getAttribute('src')).toBe('/assets/31autumn21/questions/q01.png');
    expect(fullSizeImage?.getAttribute('alt')).toBe('Question 1');

    clickButton(container, 'Close');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('keeps mark-scheme images and full-size controls hidden until reveal', () => {
    const { container } = renderPractice(question());

    expect(container.querySelector('.mark-scheme-panel')).toBeNull();
    expect(container.textContent).not.toContain('Open full-size mark scheme');
    expect(container.querySelector<HTMLImageElement>('img[src="/assets/31autumn21/mark_scheme/q01.png"]')).toBeNull();

    clickButton(container, 'Reveal Mark Scheme');

    const markSchemeImage = container.querySelector<HTMLImageElement>('.mark-scheme-panel .image-stack-item img');
    const zoomButton = Array.from(container.querySelectorAll<HTMLButtonElement>('.mark-scheme-panel button'))
      .find((button) => button.textContent === 'Open full-size mark scheme');

    expect(markSchemeImage?.getAttribute('src')).toBe('/assets/31autumn21/mark_scheme/q01.png');
    expect(markSchemeImage?.getAttribute('alt')).toBe('Mark scheme 1');
    expect(zoomButton).toBeTruthy();
  });

  it('opens and closes a full-size canonical mark-scheme image view after reveal', () => {
    const { container } = renderPractice(question());

    clickButton(container, 'Reveal Mark Scheme');
    markSchemeLoaded(container);
    clickButton(container, 'Open full-size mark scheme');

    const dialog = container.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
    const fullSizeImage = dialog?.querySelector<HTMLImageElement>('.image-lightbox-scroll img');
    expect(dialog?.getAttribute('aria-label')).toBe('Full-size mark scheme image');
    expect(fullSizeImage?.getAttribute('src')).toBe('/assets/31autumn21/mark_scheme/q01.png');
    expect(fullSizeImage?.getAttribute('alt')).toBe('Mark scheme 1');

    clickButton(container, 'Close');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes the full-size mark-scheme image view with Escape', () => {
    const { container } = renderPractice(question());

    clickButton(container, 'Reveal Mark Scheme');
    markSchemeLoaded(container);
    clickButton(container, 'Open full-size mark scheme');
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes the full-size question image view with Escape', () => {
    const { container } = renderPractice(question());
    clickButton(container, 'Open full-size question');
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('saves part-by-part scores when question part metadata exists', () => {
    const { container, onAttempt } = renderPractice(question({
      marksAvailable: 7,
      parts: [
        { label: '(a)', marksAvailable: 6 },
        { label: '(b)', marksAvailable: 1 },
      ],
    }));

    clickButton(container, 'Reveal Mark Scheme');
    markSchemeLoaded(container);

    expect(container.textContent).toContain('Part-by-part marks');
    expect(container.textContent).toContain('Part (a): 6 marks');
    expect(container.textContent).toContain('Your Mark by Part');
    expect(container.textContent).toContain('Enter M, B, and A marks for each question part');
    expect(Array.from(container.querySelectorAll<HTMLInputElement>('.part-mark-grid input')).map((input) => input.placeholder)).toEqual(['0', '0', '0', '0', '0', '0']);

    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="Part (a) M marks"]')!, '3');
    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="Part (a) A marks"]')!, '2');
    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="Part (b) B marks"]')!, '1');
    clickInput(container.querySelector<HTMLInputElement>('input[value="algebra_error"]'));

    expect(saveAttemptButton(container).disabled).toBe(false);
    clickButton(container, 'Save Attempt');

    expect(onAttempt).toHaveBeenCalledTimes(1);
    expect(onAttempt.mock.calls[0][0]).toMatchObject({
      marksEarned: 6,
      markBreakdown: { m: 3, b: 1, a: 2 },
      partScores: [
        { label: '(a)', marksEarned: 5, marksAvailable: 6, markBreakdown: { m: 3, b: 0, a: 2 } },
        { label: '(b)', marksEarned: 1, marksAvailable: 1, markBreakdown: { m: 0, b: 1, a: 0 } },
      ],
      mistakeTypes: ['algebra_error'],
    });
  });

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

  it('shows an obvious next-question action after a full-score attempt is saved', () => {
    const onContinuePractice = vi.fn();
    const { container } = renderPractice(question(), vi.fn(), { onContinuePractice });

    clickButton(container, 'Reveal Mark Scheme');
    markSchemeLoaded(container);

    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="M marks"]')!, '2');
    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="B marks"]')!, '1');
    setInputValue(container.querySelector<HTMLInputElement>('input[aria-label="A marks"]')!, '1');
    clickInput(container.querySelector<HTMLInputElement>('.full-score-check-label input'));
    setInputValue(container.querySelector<HTMLTextAreaElement>('textarea')!, 'Checked every mark-scheme line.');
    clickButton(container, 'Save Attempt');

    expect(container.textContent).toContain('Next question');
    clickButton(container, 'Next question');
    expect(onContinuePractice).toHaveBeenCalledTimes(1);
  });
});
