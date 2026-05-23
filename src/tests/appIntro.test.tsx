import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { addRosterStudent, archiveRosterStudent, claimRosterSlotByClassCode } from '../lib/dashboardMockService';
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

async function openStudentEntry(container: HTMLElement): Promise<void> {
  await act(async () => {
    Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Student entry'))?.click();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function clickButtonContaining(container: HTMLElement, text: string): Promise<void> {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes(text));
  expect(button).toBeTruthy();
  await act(async () => {
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_ASTERION_APP_PROFILE', '');
  vi.stubEnv('VITE_ASTERION_DASHBOARD_DEMO', '');
  vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', 'mock');
  vi.stubEnv('VITE_ASTERION_STUDENT_CLAIM_SOURCE', 'mock');
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
  vi.unstubAllEnvs();
});

describe('Asterion intro page', () => {
  it('renders the branded public landing page', async () => {
    const container = await render(<App />);

    expect(container.textContent).toContain('CAIE 9709 · Paper 3 Astral Academy');
    expect(container.querySelector('#home-landing-title')?.textContent).toBe('Asterion');
    expect(container.textContent).not.toContain('Step into a local-first maths academy');
    expect(container.textContent).not.toContain('No AI marking');
    expect(container.textContent).not.toContain('generated exam clones');
    expect(container.textContent).toContain('Student entry');
    expect(container.textContent).toContain('Teacher login');
    expect(container.textContent).toContain('Admin login');

    const emblem = container.querySelector('[data-testid="asterion-emblem"]');
    expect(emblem).toBeTruthy();
    expect(emblem?.getAttribute('aria-label')).toBe('Golden Asterion A emblem');
    expect(emblem?.querySelector('.emblem-letter')?.textContent).toBe('A');
    expect(emblem?.querySelector('.emblem-orbit-star')).toBeTruthy();

    expect(container.textContent).not.toContain('Class access required');
    expect(container.textContent).not.toContain('This starts a local browser profile, not a cross-device gradebook.');
  });

  it('opens the student entry claim form from the landing page', async () => {
    const container = await render(<App />);
    await openStudentEntry(container);

    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).toContain('Join your teacher');
    expect(container.textContent).toContain('Enter the class code your teacher gave you. Next you will name your character, then open the P3 world map.');
    expect(container.textContent).toContain('Use the class code and roster name provided by your teacher.');
    expect(container.textContent).toContain('Class code');
    expect(container.textContent).toContain('Roster name');
    expect(container.textContent).toContain('If your name is missing, ask your teacher. You cannot add yourself.');
    expect(container.textContent).not.toContain('Email, optional');
    expect(container.querySelector('input[type="email"]')).toBeNull();
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(container.textContent).not.toContain('magic link');
    expect(Array.from(container.querySelectorAll('button')).some((button) => (
      button.textContent?.includes('Claim roster slot')
    ))).toBe(true);
  });

  it('renders without Supabase browser env', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined);
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', undefined);

    const container = await render(<App />);

    expect(container.querySelector('#home-landing-title')?.textContent).toBe('Asterion');
    expect(container.textContent).toContain('Student entry');
    expect(container.textContent).not.toContain('Class access required');
  });

  it('uses hosted classroom copy in the classroom pilot profile without local-only classroom language', async () => {
    vi.stubEnv('VITE_ASTERION_APP_PROFILE', 'classroom-pilot');
    vi.stubEnv('VITE_SUPABASE_URL', undefined);
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', undefined);

    const container = await render(<App />);
    await openStudentEntry(container);

    expect(container.textContent).toContain('Enter the class code and roster name your teacher gave you.');
    expect(container.textContent).toContain('Your teacher must add your roster name first. You cannot add yourself to a class.');
    expect(container.textContent).not.toContain('Teacher login');
    expect(container.textContent).not.toContain('Admin login');
    expect(container.textContent).toContain('Classroom pilot profile requires hosted classroom browser configuration');
    expect(container.textContent).toContain('Classroom roster entry is active, but the hosted classroom browser configuration is incomplete.');
    expect(container.textContent).toContain('Classroom unavailable');
    expect(Array.from(container.querySelectorAll('button')).find((button) => (
      button.textContent === 'Classroom unavailable'
    ))?.hasAttribute('disabled')).toBe(true);
    expect(container.textContent).not.toContain('This starts a local browser profile, not a cross-device gradebook.');
    expect(container.textContent).not.toContain('Email, optional');
    expect(container.textContent).not.toContain('Supabase Auth');
    expect(container.textContent).not.toContain('magic link');
    expect(container.textContent).not.toContain('Progress is saved on this browser/device only.');
    expect(container.textContent).not.toContain('local-first classroom mode');
  });

  it('blocks Supabase classroom sources without the classroom-pilot profile', async () => {
    vi.stubEnv('VITE_ASTERION_APP_PROFILE', undefined);
    vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', 'supabase');
    vi.stubEnv('VITE_ASTERION_STUDENT_CLAIM_SOURCE', 'supabase');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://asterion-example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example');

    const container = await render(<App />);

    expect(container.textContent).toContain('Configuration blocked');
    expect(container.textContent).toContain('Supabase classroom sources are active without VITE_ASTERION_APP_PROFILE=classroom-pilot');
    expect(container.textContent).toContain('Profile: custom');
    expect(container.textContent).toContain('Dashboard source: supabase');
    expect(container.textContent).toContain('Student claim source: supabase');
    expect(container.textContent).not.toContain('Student entry');
    expect(container.textContent).not.toContain('Class access required');
  });

  it('does not accept a stored local pending claim in classroom pilot hosted claim mode', async () => {
    vi.stubEnv('VITE_ASTERION_APP_PROFILE', 'classroom-pilot');
    vi.stubEnv('VITE_SUPABASE_URL', undefined);
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', undefined);
    localStorage.setItem(PENDING_CLASS_CLAIM_STORAGE_KEY, JSON.stringify({
      status: 'claimed',
      classId: 'class-1',
      className: 'Local class',
      classCode: 'AST-P3A',
      teacherId: 'teacher-1',
      teacherName: 'Teacher',
      rosterStudentId: 'roster-1',
      displayName: 'Maya Q.',
      message: 'Local claim',
    }));

    const container = await render(<App />);
    await openStudentEntry(container);

    expect(localStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY)).toBeNull();
    expect(container.textContent).toContain('Hosted classroom access');
    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).not.toContain('Local class');
    expect(container.textContent).not.toContain('This starts a local browser profile, not a cross-device gradebook.');
  });

  it('requires a valid class-code roster claim before saving local progress', async () => {
    const container = await render(<App />);
    await openStudentEntry(container);

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
    expect(JSON.parse(localStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY) ?? '{}')).toMatchObject({
      status: 'claimed',
      classCode: 'AST-P3A',
      displayName: 'Maya Q.',
    });

    setInputValue(inputForLabel(container, 'Character name'), 'Aster');

    const form = Array.from(container.querySelectorAll('form')).find((candidate) => (
      candidate.textContent?.includes('Continue to academy avatar')
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
    expect(localStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY)).toBeNull();

    expect(container.textContent).toContain('Choose your academy avatar');
    expect(container.textContent).toContain('Pick a starter look.');
    expect(container.textContent).toContain('Next step');
    expect(Array.from(container.querySelectorAll('.academy-step-list button')).map((button) => button.textContent?.trim())).toEqual([
      '1Welcome',
      '2Name',
      '3Avatar',
    ]);
    expect(container.textContent).not.toContain('Academy name');
    expect(container.querySelectorAll('.avatar-preset-card')).toHaveLength(0);
    expect(container.querySelector('.academy-path-grid')).toBeNull();
    expect(container.textContent).not.toContain('World Map');

    await clickButtonContaining(container, 'Next step');

    setInputValue(inputForLabel(container, 'Academy name'), 'Maya Prime');
    expect(container.textContent).toContain('Continue');
    expect(container.querySelectorAll('.avatar-preset-card')).toHaveLength(0);

    await clickButtonContaining(container, 'Welcome');
    expect(container.textContent).toContain('Class slot ready');
    expect(container.textContent).not.toContain('Academy name');

    await clickButtonContaining(container, 'Name');
    expect(container.textContent).toContain('Academy name');
    expect(inputForLabel(container, 'Academy name').value).toBe('Maya Prime');

    await clickButtonContaining(container, 'Continue');

    const avatarForm = container.querySelector('form[aria-label="Create academy avatar"]');
    expect(avatarForm).toBeTruthy();
    expect(container.textContent).toContain('Back');
    expect(avatarForm?.querySelectorAll('.avatar-preset-card')).toHaveLength(4);
    expect(avatarForm?.querySelectorAll('.avatar-preset-card.selected')).toHaveLength(1);
    expect(avatarForm?.querySelector('.avatar-preset-card.selected')?.textContent).toContain('Selected');
    expect(avatarForm?.querySelector('.avatar-preset-card.selected')?.getAttribute('data-selected')).toBe('true');

    const aquaPreset = Array.from(avatarForm?.querySelectorAll('label') ?? []).find((label) => label.textContent?.includes('Aqua Analyst'));
    expect(aquaPreset).toBeTruthy();

    await act(async () => {
      aquaPreset?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(avatarForm?.querySelector('.avatar-preset-card.selected')?.textContent).toContain('Aqua Analyst');

    await act(async () => {
      avatarForm?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    const onboardedProgress = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_STORAGE_KEY) ?? '{}');
    expect(onboardedProgress.profile).toMatchObject({
      id: storedProgress.profile.id,
      realName: 'Maya Q.',
      classGroup: 'P3 Alpha',
      teacherName: 'Ms Hypatia',
      avatarName: 'Maya Prime',
      avatarId: 'aqua-analyst',
      onboardingCompleted: true,
      onboardingCompletedAt: expect.any(String),
    });
    expect(container.textContent).toContain('World Map');
    expect(container.textContent).toContain('Maya Prime');
    expect(container.textContent).toContain('Academy avatar');
    expect(container.textContent).not.toContain('Start here');
    expect(container.textContent).not.toContain('Choose a region to begin Paper 3 practice.');
    expect(container.textContent).not.toContain('Try Quick Check, Warm-Up, then real image questions.');
    expect(container.textContent).toContain('Browser-local practice mode');
    expect(container.textContent).not.toContain('Create your avatar');
    expect(container.textContent).not.toContain('magic link');
    expect(container.querySelector('input[type="email"]')).toBeNull();
    expect(container.querySelector('input[type="password"]')).toBeNull();
  });

  it('treats cleared site storage or a different browser as a fresh local start', async () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      profile: {
        id: 'profile-existing',
        realName: 'Stored Student',
        classGroup: 'P3 Alpha',
        teacherName: 'Ms Hypatia',
        avatarName: 'Aster',
        avatarId: 'star-apprentice',
        onboardingCompleted: true,
        onboardingCompletedAt: '2026-05-20T00:00:00.000Z',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z',
      },
      attempts: [],
      learningActivityAttempts: [],
      issueReports: [],
      regionLearning: {},
      settings: { activePaperFamily: 'p3' },
    }));

    let container = await render(<App />);
    expect(container.textContent).toContain('World Map');
    expect(container.textContent).not.toContain('Welcome to Asterion Academy');

    await act(async () => {
      mountedRoots.pop()?.unmount();
      mountedContainers.pop()?.remove();
      await Promise.resolve();
    });
    localStorage.removeItem(LOCAL_PROGRESS_STORAGE_KEY);

    container = await render(<App />);

    expect(container.textContent).toContain('Student entry');
    expect(container.textContent).not.toContain('World Map');
    await openStudentEntry(container);

    expect(container.textContent).toContain('Enter the class code your teacher gave you.');
    expect(container.textContent).toContain('Claim roster slot');
    expect(container.textContent).not.toContain('World Map');
  });

  it('routes an existing student profile without completed onboarding through avatar setup', async () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      profile: {
        id: 'profile-not-onboarded',
        realName: 'Stored Student',
        classGroup: 'P3 Alpha',
        teacherName: 'Ms Hypatia',
        avatarName: 'Aster',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z',
      },
      attempts: [],
      learningActivityAttempts: [],
      issueReports: [],
      regionLearning: {},
      settings: { activePaperFamily: 'p3' },
    }));

    const container = await render(<App />);

    expect(container.textContent).toContain('Choose your academy avatar');
    expect(container.textContent).not.toContain('World Map');
  });

  it('trims academy names, allows empty fallback, and preserves onboarding after refresh', async () => {
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      profile: {
        id: 'profile-fallback-name',
        realName: 'Fallback Student',
        classGroup: 'P3 Alpha',
        teacherName: 'Ms Hypatia',
        avatarName: 'Aster',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z',
      },
      attempts: [],
      learningActivityAttempts: [],
      issueReports: [],
      regionLearning: {},
      settings: { activePaperFamily: 'p3' },
    }));

    let container = await render(<App />);
    await clickButtonContaining(container, 'Next step');
    const academyName = inputForLabel(container, 'Academy name');
    expect(academyName.maxLength).toBe(40);
    expect(academyName.required).toBe(false);

    setInputValue(academyName, '   ');

    await clickButtonContaining(container, 'Continue');

    await act(async () => {
      container.querySelector('form[aria-label="Create academy avatar"]')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    const onboardedProgress = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_STORAGE_KEY) ?? '{}');
    expect(onboardedProgress.profile).toMatchObject({
      avatarName: 'Aster',
      avatarId: 'star-apprentice',
      onboardingCompleted: true,
      onboardingCompletedAt: expect.any(String),
    });
    expect(container.textContent).toContain('World Map');
    expect(container.textContent).toContain('Aster');

    await act(async () => {
      mountedRoots.pop()?.unmount();
      mountedContainers.pop()?.remove();
      await Promise.resolve();
    });

    container = await render(<App />);

    expect(container.textContent).toContain('World Map');
    expect(container.textContent).toContain('Aster');
    expect(container.textContent).not.toContain('Welcome to Asterion Academy');
  });

  it('restores a revalidated pending claim after refresh without granting app access', async () => {
    await addRosterStudent('teacher-hypatia', 'class-p3-beta', 'Refresh Valid Student');
    const pendingClaim = await claimRosterSlotByClassCode({ classCode: 'AST-P3B', displayName: 'Refresh Valid Student' });
    localStorage.setItem(PENDING_CLASS_CLAIM_STORAGE_KEY, JSON.stringify(pendingClaim));

    const container = await render(<App />);

    expect(container.textContent).toContain('Student real name');
    expect(inputForLabel(container, 'Student real name').value).toBe('Refresh Valid Student');
    expect(inputForLabel(container, 'Class/group').value).toBe('P3 Beta');
    expect(inputForLabel(container, 'Teacher name').value).toBe('Ms Hypatia');
    expect(container.textContent).not.toContain('World Map');

    const restartButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Use a different class code'));
    await act(async () => {
      restartButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(localStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY)).toBeNull();
    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).toContain('Claim roster slot');
  });

  it('clears forged or stale pending claims and returns to class-code claim', async () => {
    localStorage.setItem(PENDING_CLASS_CLAIM_STORAGE_KEY, JSON.stringify({
      status: 'claimed',
      classId: 'class-p3-alpha',
      className: 'P3 Alpha',
      classCode: 'AST-P3A',
      teacherId: 'teacher-hypatia',
      teacherName: 'Ms Hypatia',
      rosterStudentId: 'forged-roster-id',
      displayName: 'Forged Student',
      message: 'Roster slot claimed. Optional details can be added later.',
    }));

    let container = await render(<App />);

    expect(localStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY)).toBeNull();
    await openStudentEntry(container);
    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).toContain('Claim roster slot');
    expect(container.textContent).not.toContain('Student real name');

    await act(async () => {
      mountedRoots.pop()?.unmount();
      mountedContainers.pop()?.remove();
      await Promise.resolve();
    });

    await addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'Archived Pending Student');
    const staleClaim = await claimRosterSlotByClassCode({ classCode: 'AST-P3A', displayName: 'Archived Pending Student' });
    await archiveRosterStudent('teacher-hypatia', 'class-p3-alpha', staleClaim.rosterStudentId!);
    localStorage.setItem(PENDING_CLASS_CLAIM_STORAGE_KEY, JSON.stringify(staleClaim));

    container = await render(<App />);

    expect(localStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY)).toBeNull();
    await openStudentEntry(container);
    expect(container.textContent).toContain('Class access required');
    expect(container.textContent).toContain('Claim roster slot');
    expect(container.textContent).not.toContain('Archived Pending Student');
  });

  it('shows duplicate roster names as ambiguous and keeps students on the claim form', async () => {
    await addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'Intro Duplicate Student');
    await addRosterStudent('teacher-hypatia', 'class-p3-alpha', 'intro duplicate student');

    const container = await render(<App />);
    await openStudentEntry(container);
    const claimForm = container.querySelector('form[aria-label="Claim class roster slot"]');

    setInputValue(inputForLabel(container, 'Class code'), 'AST-P3A');
    setInputValue(inputForLabel(container, 'Roster name'), 'INTRO DUPLICATE STUDENT');

    await act(async () => {
      claimForm?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain('More than one unclaimed roster entry uses that name.');
    expect(container.textContent).toContain('Claim roster slot');
    expect(container.textContent).not.toContain('Student real name');
    expect(localStorage.getItem(PENDING_CLASS_CLAIM_STORAGE_KEY)).toBeNull();
  });

  it('still renders the emblem when reduced motion is requested', async () => {
    setReducedMotion(true);
    const container = await render(<App />);

    expect(container.querySelector('[data-testid="asterion-emblem"]')).toBeTruthy();
    expect(stylesCss).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.asterion-emblem,[\s\S]*\.emblem-orbit[\s\S]*animation:\s*none !important/);
  });
});
