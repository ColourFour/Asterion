import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { LOCAL_PROGRESS_STORAGE_KEY } from '../lib/progressStore';
import { PENDING_CLASS_CLAIM_STORAGE_KEY } from '../lib/studentClassClaimStore';

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

const stylesCss = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

function setReducedMotion(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
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
  });

  return container;
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function inputForLabel(container: HTMLElement, labelText: string): HTMLInputElement {
  const label = Array.from(container.querySelectorAll('label')).find((candidate) => (
    candidate.textContent?.includes(labelText)
  ));
  expect(label).toBeTruthy();
  const input = label?.querySelector('input');
  expect(input).toBeTruthy();
  return input!;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setReducedMotion(false);
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
  localStorage.clear();
  sessionStorage.clear();
});

describe('Asterion intro page', () => {
  it('renders the lighter academy entrance copy, emblem, and entry form', async () => {
    const container = await render(<App />);

    expect(container.textContent).toContain('CAIE 9709 · Paper 3 Astral Academy');
    expect(container.querySelector('.intro-copy h1')?.textContent).toBe('Asterion');
    expect(container.textContent).not.toContain('Step into a local-first maths academy');
    expect(container.textContent).not.toContain('No AI marking');
    expect(container.textContent).not.toContain('generated exam clones');

    expect(container.textContent).toContain('Academy charter');
    expect(container.textContent).toContain('Your quest begins here.');
    expect(container.textContent).toContain('Restore the P3 regions, collect evidence from real practice, and travel toward the A*.');
    expect(container.textContent).toContain('One region at a time. One skill at a time.');

    const emblem = container.querySelector('[data-testid="asterion-emblem"]');
    expect(emblem).toBeTruthy();
    expect(emblem?.getAttribute('aria-label')).toBe('Golden Asterion A emblem');
    expect(emblem?.querySelector('.emblem-letter')?.textContent).toBe('A');
    expect(emblem?.querySelector('.emblem-orbit-star')).toBeTruthy();

    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).toContain('Join your teacher');
    expect(container.textContent).toContain('Class code');
    expect(container.textContent).toContain('Roster name');
    expect(container.textContent).toContain('If your name is missing, ask your teacher. You cannot add yourself.');
    expect(Array.from(container.querySelectorAll('button')).some((button) => (
      button.textContent?.includes('Claim roster slot')
    ))).toBe(true);
  });

  it('requires a valid class-code roster claim before saving local progress', async () => {
    const container = await render(<App />);

    setInputValue(inputForLabel(container, 'Class code'), 'AST-P3A');
    setInputValue(inputForLabel(container, 'Roster name'), 'Student Not On Roster');

    const claimForm = container.querySelector('form[aria-label="Claim class roster slot"]');
    expect(claimForm).toBeTruthy();

    await act(async () => {
      claimForm?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Ask your teacher to add your name to the roster first.');
    expect(localStorage.getItem(LOCAL_PROGRESS_STORAGE_KEY)).toBeNull();

    setInputValue(inputForLabel(container, 'Roster name'), 'Maya Q.');

    await act(async () => {
      claimForm?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('Student real name');
    expect(inputForLabel(container, 'Student real name').value).toBe('Maya Q.');
    expect(inputForLabel(container, 'Class/group').value).toBe('P3 Alpha');
    expect(inputForLabel(container, 'Teacher name').value).toBe('Ms Hypatia');
    expect(inputForLabel(container, 'Class/group').readOnly).toBe(true);
    expect(inputForLabel(container, 'Teacher name').readOnly).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY) ?? '{}')).toMatchObject({
      status: 'claimed',
      classCode: 'AST-P3A',
      displayName: 'Maya Q.',
    });

    setInputValue(inputForLabel(container, 'Character name'), 'Aster');

    const form = Array.from(container.querySelectorAll('form')).find((candidate) => (
      candidate.textContent?.includes('Enter Astral Academy')
    ));
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    const storedProgress = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_STORAGE_KEY) ?? '{}');
    expect(storedProgress.profile).toMatchObject({
      realName: 'Maya Q.',
      classGroup: 'P3 Alpha',
      teacherName: 'Ms Hypatia',
      avatarName: 'Aster',
      classClaim: expect.objectContaining({
        status: 'claimed',
        classCode: 'AST-P3A',
        displayName: 'Maya Q.',
      }),
    });
    expect(sessionStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY)).toBeNull();
    expect(container.textContent).toContain('World Map');
    expect(container.textContent).not.toContain('Enter Astral Academy');
  });

  it('restores a pending claim after refresh without granting app access', async () => {
    sessionStorage.setItem(PENDING_CLASS_CLAIM_STORAGE_KEY, JSON.stringify({
      status: 'claimed',
      classId: 'class-p3-beta',
      className: 'P3 Beta',
      classCode: 'AST-P3B',
      teacherId: 'teacher-hypatia',
      teacherName: 'Ms Hypatia',
      rosterStudentId: 'roster-beta-unclaimed-1',
      displayName: 'Ken I.',
      message: 'Roster slot claimed. Optional details can be added later.',
    }));

    const container = await render(<App />);

    expect(container.textContent).toContain('Student real name');
    expect(inputForLabel(container, 'Student real name').value).toBe('Ken I.');
    expect(inputForLabel(container, 'Class/group').value).toBe('P3 Beta');
    expect(inputForLabel(container, 'Teacher name').value).toBe('Ms Hypatia');
    expect(container.textContent).not.toContain('World Map');

    const restartButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Use a different class code'));
    await act(async () => {
      restartButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(sessionStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY)).toBeNull();
    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).toContain('Claim roster slot');
  });

  it('still renders the emblem when reduced motion is requested', async () => {
    setReducedMotion(true);
    const container = await render(<App />);

    expect(container.querySelector('[data-testid="asterion-emblem"]')).toBeTruthy();
    expect(stylesCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.asterion-emblem,[\s\S]*\.emblem-orbit[\s\S]*animation:\s*none !important/);
  });
});
