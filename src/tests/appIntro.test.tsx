import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { LOCAL_PROGRESS_STORAGE_KEY } from '../lib/progressStore';

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

    expect(container.textContent).toContain('Student real name');
    expect(container.textContent).toContain('Class/group');
    expect(container.textContent).toContain('Teacher name');
    expect(container.textContent).toContain('Character name');
    expect(Array.from(container.querySelectorAll('button')).some((button) => (
      button.textContent?.includes('Enter Astral Academy')
    ))).toBe(true);
  });

  it('keeps the Enter Astral Academy submit flow wired to local progress', async () => {
    const container = await render(<App />);

    setInputValue(inputForLabel(container, 'Student real name'), 'Ada Lovelace');
    setInputValue(inputForLabel(container, 'Class/group'), 'P3 Alpha');
    setInputValue(inputForLabel(container, 'Teacher name'), 'Ms Hypatia');
    setInputValue(inputForLabel(container, 'Character name'), 'Aster');

    const form = container.querySelector('form');
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    const storedProgress = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_STORAGE_KEY) ?? '{}');
    expect(storedProgress.profile).toMatchObject({
      realName: 'Ada Lovelace',
      classGroup: 'P3 Alpha',
      teacherName: 'Ms Hypatia',
      avatarName: 'Aster',
    });
    expect(container.textContent).toContain('World Map');
    expect(container.textContent).not.toContain('Enter Astral Academy');
  });

  it('still renders the emblem when reduced motion is requested', async () => {
    setReducedMotion(true);
    const container = await render(<App />);

    expect(container.querySelector('[data-testid="asterion-emblem"]')).toBeTruthy();
    expect(stylesCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.asterion-emblem,[\s\S]*\.emblem-orbit[\s\S]*animation:\s*none !important/);
  });
});
