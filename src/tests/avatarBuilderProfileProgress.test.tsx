import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AvatarBuilder } from '../components/profile/AvatarBuilder';
import { DEFAULT_AVATAR_SETTINGS } from '../lib/avatarStore';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import type { AvatarGear, RegionProgress, StudentProfile } from '../types';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

const profile: StudentProfile = {
  id: 'profile-progress-dashboard',
  realName: 'Ada Lovelace',
  classGroup: 'P3 Alpha',
  teacherName: 'Ms Hypatia',
  avatarName: 'Aster',
  avatarId: 'star-apprentice',
  onboardingCompleted: true,
  onboardingCompletedAt: '2026-05-28T00:00:00.000Z',
  createdAt: '2026-05-28T00:00:00.000Z',
  updatedAt: '2026-05-28T00:00:00.000Z',
};

const avatarGear: AvatarGear = {
  title: 'Region Scout',
  gear: ['Starter crest'],
  restoredRegions: 0,
  goldRegions: 0,
};

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

async function flushMathText(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

function worldProgress(): RegionProgress[] {
  return P3_ASTRAL_ACADEMY.regions.map((region) => ({
    region,
    availableQuestions: region.id === 'algebra-forge' ? 5 : 1,
    attempts: region.id === 'logarithm-grove' ? 2 : 0,
    totalMarksEarned: region.id === 'logarithm-grove' ? 7 : 0,
    totalMarksAvailable: region.id === 'logarithm-grove' ? 10 : 0,
    averageScoreRatio: region.id === 'logarithm-grove' ? 0.7 : undefined,
    recentScoreRatio: region.id === 'logarithm-grove' ? 0.7 : undefined,
    subtopicsTouched: region.id === 'logarithm-grove' ? 2 : 0,
    rank: region.id === 'logarithm-grove' ? 'Discovered' : 'Dormant',
    isActive: true,
  }));
}

function renderProfileProgress(): HTMLElement {
  return render(
    <AvatarBuilder
      profile={profile}
      avatar={DEFAULT_AVATAR_SETTINGS}
      avatarGear={avatarGear}
      attempts={[]}
      questions={[]}
      regionLearning={{
        'algebra-forge': {
          regionId: 'algebra-forge',
          fieldGuideStartedAt: '2026-05-28T00:00:00.000Z',
          fieldGuideCompletedAt: '2026-05-28T00:05:00.000Z',
          updatedAt: '2026-05-28T00:05:00.000Z',
        },
      }}
      regionProgress={worldProgress()}
      onAvatarChange={vi.fn()}
    />,
  );
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

describe('AvatarBuilder profile progress dashboard', () => {
  it('removes the student-facing P3 evidence readiness panel', async () => {
    const container = renderProfileProgress();
    await flushMathText();

    expect(container.textContent).not.toContain('P3 Evidence Readiness');
    expect(container.textContent).not.toContain('Local evidence index');
    expect(container.textContent).not.toContain('Informal local signal');
  });

  it('renders all nine regions in the Region Completion Status card', async () => {
    const container = renderProfileProgress();
    await flushMathText();

    const regionCard = container.querySelector('.profile-region-progress-card');
    expect(regionCard?.textContent).toContain('Region Completion Status');
    expect(regionCard?.querySelectorAll('.profile-region-row')).toHaveLength(9);
    for (const region of P3_ASTRAL_ACADEMY.regions) {
      expect(regionCard?.textContent).toContain(region.name);
    }
  });

  it('shows the visible Field Guide, Skill Check, Guardian loop without Exam Training', async () => {
    const container = renderProfileProgress();
    await flushMathText();

    const regionCard = container.querySelector('.profile-region-progress-card');
    expect(regionCard?.textContent).toContain('Field Guide');
    expect(regionCard?.textContent).toContain('Skill Check');
    expect(regionCard?.textContent).toContain('Guardian');
    expect(regionCard?.textContent).not.toContain('Exam Training');
    expect(regionCard?.textContent).not.toContain('Skill Practice');
  });

  it('renders compact topic status entries with student-facing labels', async () => {
    const container = renderProfileProgress();
    await flushMathText();

    const topicCard = container.querySelector('.profile-topic-status-card');
    expect(topicCard?.textContent).toContain('Topic Mastery Status');
    expect(topicCard?.textContent).toContain('Practice progress by subtopic');
    expect(topicCard?.textContent).toContain('Modulus Graphs and Equations');
    expect(topicCard?.textContent).toContain('Not started');
    expect(topicCard?.textContent).not.toContain('Skill Practice');
  });
});
