import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { LOCAL_PROGRESS_STORAGE_KEY } from '../lib/progressStore';
import type { StudentClaimState } from '../types';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const classroomMock = vi.hoisted(() => {
  const holder: { state: unknown } = { state: { status: 'signed-out' } };
  return {
    holder,
    refresh: vi.fn(),
    useStudentClassroomContext: vi.fn(() => [holder.state, vi.fn()]),
  };
});

const claimServiceMock = vi.hoisted(() => ({
  claimStudentRosterSlot: vi.fn(),
}));

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

vi.mock('../lib/studentClassroomService', () => ({
  useStudentClassroomContext: classroomMock.useStudentClassroomContext,
}));

vi.mock('../lib/studentClassClaimService', () => ({
  claimStudentRosterSlot: claimServiceMock.claimStudentRosterSlot,
}));

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

const hostedClaim: StudentClaimState = {
  status: 'claimed',
  classId: 'class-alpha',
  className: 'Hosted P3 Alpha',
  classCode: 'SUP-P3A',
  teacherId: 'teacher-1',
  teacherName: 'Ms Supabase',
  rosterStudentId: 'membership-1',
  displayName: 'Ada S.',
  message: 'Hosted classroom membership verified through Supabase.',
};

function hostedReadyState() {
  return {
    status: 'ready',
    context: {
      accessMode: 'student',
      user: { id: 'anonymous-student-user-1' },
      studentProfile: {
        id: 'student-profile-1',
        userId: 'anonymous-student-user-1',
        organizationId: 'org-1',
        displayName: 'Ada S.',
        createdAt: '2026-05-12T08:00:00.000Z',
        updatedAt: '2026-05-12T08:00:00.000Z',
      },
      membership: {
        id: 'membership-1',
        classId: 'class-alpha',
        studentProfileId: 'student-profile-1',
        rosterName: 'Ada S.',
        claimedByUserId: 'anonymous-student-user-1',
        claimedAt: '2026-05-12T08:00:00.000Z',
        createdAt: '2026-05-12T08:00:00.000Z',
        updatedAt: '2026-05-12T08:00:00.000Z',
      },
      classRecord: {
        id: 'class-alpha',
        organizationId: 'org-1',
        teacherId: 'teacher-1',
        name: 'Hosted P3 Alpha',
        classCode: 'SUP-P3A',
        academicYearTerm: '2026 Term 2',
        createdAt: '2026-05-12T08:00:00.000Z',
        updatedAt: '2026-05-12T08:00:00.000Z',
      },
      teacher: {
        id: 'teacher-1',
        userId: 'teacher-user-1',
        organizationId: 'org-1',
        displayName: 'Ms Supabase',
        email: 'teacher@example.school',
        createdAt: '2026-05-12T08:00:00.000Z',
        updatedAt: '2026-05-12T08:00:00.000Z',
      },
      regionAccess: [],
      claim: hostedClaim,
    },
  };
}

function staffReadyState() {
  return {
    status: 'ready',
    context: {
      accessMode: 'staff_preview',
      staffRole: 'teacher',
      organizationIds: ['org-1'],
      user: { id: 'teacher-user-1', email: 'teacher@example.school' },
      regionAccess: [],
      claim: {
        status: 'unclaimed',
        displayName: 'Teacher preview',
        message: 'Staff preview: regions are unlocked and progress is not recorded as student work.',
      },
    },
  };
}

function storedProgress({ onboarded }: { onboarded: boolean }) {
  return {
    schemaVersion: 1,
    profile: {
      id: 'profile-hosted-1',
      realName: 'Ada S.',
      classGroup: 'Hosted P3 Alpha',
      teacherName: 'Ms Supabase',
      avatarName: 'Ada Prime',
      avatarId: onboarded ? 'star-apprentice' : undefined,
      onboardingCompleted: onboarded ? true : undefined,
      onboardingCompletedAt: onboarded ? '2026-05-22T08:00:00.000Z' : undefined,
      classClaim: hostedClaim,
      createdAt: '2026-05-22T08:00:00.000Z',
      updatedAt: '2026-05-22T08:00:00.000Z',
    },
    avatar: { palette: 'ember', crest: 'star' },
    attempts: [],
    learningActivityAttempts: [],
    issueReports: [],
    regionLearning: {},
    settings: { activePaperFamily: 'p3' },
  };
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
    await Promise.resolve();
    await Promise.resolve();
  });

  return container;
}

async function remountApp(): Promise<HTMLElement> {
  await act(async () => {
    mountedRoots.pop()?.unmount();
    mountedContainers.pop()?.remove();
    await Promise.resolve();
  });
  return render(<App />);
}

async function clickButtonContaining(container: HTMLElement, text: string): Promise<void> {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) => candidate.textContent?.includes(text));
  expect(button).toBeTruthy();
  await act(async () => {
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_ASTERION_APP_PROFILE', 'classroom-pilot');
  vi.stubEnv('VITE_ASTERION_DASHBOARD_DATA_SOURCE', 'supabase');
  vi.stubEnv('VITE_ASTERION_STUDENT_CLAIM_SOURCE', 'supabase');
  vi.stubEnv('VITE_SUPABASE_URL', 'https://asterion-example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example');
  classroomMock.holder.state = { status: 'signed-out' };
  classroomMock.useStudentClassroomContext.mockClear();
  claimServiceMock.claimStudentRosterSlot.mockClear();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/#/student');
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

describe('hosted student session persistence', () => {
  it('restores a claimed hosted student session to the map without showing the class-code form', async () => {
    classroomMock.holder.state = hostedReadyState();
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify(storedProgress({ onboarded: true })));

    const container = await render(<App />);

    expect(container.textContent).toContain('World Map');
    expect(container.textContent).toContain('Classroom practice mode');
    expect(container.textContent).toContain('Ada Prime');
    expect(container.textContent).not.toContain('Join your teacher');
    expect(container.textContent).not.toContain('Class access required');
    expect(claimServiceMock.claimStudentRosterSlot).not.toHaveBeenCalled();
  });

  it('loads hosted classroom context before profile setup instead of asking the student to claim again', async () => {
    classroomMock.holder.state = hostedReadyState();

    const container = await render(<App />);

    expect(container.textContent).toContain('Name your academy character');
    expect(container.textContent).toContain('Hosted classroom profile');
    expect(container.textContent).toContain('Class membership comes from the hosted roster.');
    expect(container.textContent).not.toContain('Join your teacher');
    expect(container.textContent).not.toContain('Class access required');
    expect(claimServiceMock.claimStudentRosterSlot).not.toHaveBeenCalled();
  });

  it('shows the class-code form only when no valid hosted session or claimed membership exists', async () => {
    classroomMock.holder.state = { status: 'signed-out' };

    let container = await render(<App />);

    expect(container.textContent).toContain('Join your teacher');
    expect(container.textContent).toContain('Enter the class code and roster name your teacher gave you.');
    expect(container.textContent).not.toContain('Supabase Auth');
    expect(container.querySelector('input[type="email"]')).toBeNull();
    expect(container.querySelector('input[type="password"]')).toBeNull();

    container = await remountApp();
    classroomMock.holder.state = {
      status: 'missing-membership',
      message: 'Your hosted roster slot is not currently claimed. Ask your teacher if it was reset or archived.',
    };

    container = await remountApp();

    expect(container.textContent).toContain('Your hosted roster slot is not currently claimed.');
    expect(container.textContent).toContain('Join your teacher');
    expect(container.textContent).not.toContain('Supabase Auth');
  });

  it('resumes incomplete hosted onboarding at avatar setup and persists completion across reload', async () => {
    classroomMock.holder.state = hostedReadyState();
    localStorage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify(storedProgress({ onboarded: false })));

    let container = await render(<App />);

    expect(container.textContent).toContain('Choose your academy avatar');
    expect(container.textContent).not.toContain('World Map');

    await clickButtonContaining(container, 'Next step');
    await clickButtonContaining(container, 'Continue');
    await clickButtonContaining(container, 'Enter the P3 world map');

    const saved = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_STORAGE_KEY) ?? '{}');
    expect(saved.profile).toMatchObject({
      id: 'profile-hosted-1',
      avatarName: 'Ada Prime',
      avatarId: 'star-apprentice',
      onboardingCompleted: true,
      classClaim: expect.objectContaining({
        status: 'claimed',
        rosterStudentId: 'membership-1',
      }),
    });
    expect(container.textContent).toContain('World Map');

    container = await remountApp();

    expect(container.textContent).toContain('World Map');
    expect(container.textContent).toContain('Ada Prime');
    expect(container.textContent).not.toContain('Choose your academy avatar');
    expect(container.textContent).not.toContain('Join your teacher');
  });

  it('does not silently claim a roster slot for staff sessions on the student route', async () => {
    classroomMock.holder.state = staffReadyState();

    const container = await render(<App />);

    expect(container.textContent).toContain('Staff preview');
    expect(container.textContent).toContain('Use a private window to test student roster claiming.');
    expect(container.textContent).not.toContain('Join your teacher');
    expect(claimServiceMock.claimStudentRosterSlot).not.toHaveBeenCalled();
  });
});
