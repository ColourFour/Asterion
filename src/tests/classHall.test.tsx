import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClassHall } from '../components/classHall/ClassHall';
import { AstralRegionLedger, P3AstralAcademy } from '../components/world/P3AstralAcademy';
import type { AvatarLocation } from '../lib/avatarLocation';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import { buildLocalClassHallSnapshot, type ClassHallAvatarSnapshot } from '../lib/classHall';
import type { AvatarGear, RegionProgress, StudentProfile } from '../types';
import { emptyProgress } from '../lib/progressStore';

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
  document.body.innerHTML = '';
});

const baseSnapshot: ClassHallAvatarSnapshot = {
  id: 'test-student',
  nickname: 'Nova',
  house: { name: 'Star House', crest: 'star' },
  avatar: {
    palette: 'violet',
    crest: 'star',
    equipped: {
      hair: 'stargazer-sweep',
      outfit: 'academy-uniform',
      cloak: 'apprentice-cloak',
      accessory: 'algebra-pin',
      frame: 'bronze-academy-frame',
    },
  },
  titles: ['Class Hall Curator'],
  badges: ['Algebra Pin Bearer'],
  motto: 'Check each route.',
  favoriteRegion: 'Algebra Vault',
};

const profile: StudentProfile = {
  id: 'profile-local',
  realName: 'Maya Q.',
  classGroup: 'P3 Alpha',
  teacherName: 'Ms Hypatia',
  avatarName: 'Aster',
  createdAt: '2026-05-20T00:00:00.000Z',
  updatedAt: '2026-05-20T00:00:00.000Z',
};

const avatarGear: AvatarGear = {
  title: 'Region Specialist',
  gear: ['Bronze Academy Frame', 'Algebra Pin'],
  restoredRegions: 1,
  goldRegions: 0,
  strongestRegionName: 'Algebra Vault',
  strongestRegionRank: 'Silver',
};

function regionProgress(overrides: Partial<RegionProgress> = {}): RegionProgress {
  const region = P3_ASTRAL_ACADEMY.regions[0];
  return {
    region,
    availableQuestions: 8,
    attempts: 2,
    totalMarksEarned: 7,
    totalMarksAvailable: 10,
    averageScoreRatio: 0.7,
    recentScoreRatio: 0.7,
    subtopicsTouched: 2,
    rank: 'Bronze',
    isActive: true,
    ...overrides,
  };
}

const avatarLocation: AvatarLocation = { source: 'none', label: 'No open wing' };

describe('ClassHall', () => {
  it('renders demo avatars', () => {
    const container = render(<ClassHall />);

    expect(container.textContent).toContain('Lyra');
    expect(container.textContent).toContain('Orin');
    expect(container.textContent).toContain('Sena');
    expect(container.textContent).toContain('Hosted teacher summaries are separate.');
    expect(container.textContent).toContain('This showcase does not sync marks, weak topics, exact scores, rankings, or official grades.');
    expect(container.querySelectorAll('[data-class-hall-card]').length).toBeGreaterThanOrEqual(4);
  });

  it('can render the current browser-local student without academic scores or sync claims', () => {
    const currentStudentAvatar = buildLocalClassHallSnapshot({
      profile,
      avatar: {
        ...emptyProgress().avatar,
        crest: 'compass',
        equipped: {
          hair: 'stargazer-sweep',
          outfit: 'academy-uniform',
          accessory: 'algebra-pin',
          frame: 'bronze-academy-frame',
        },
      },
      avatarGear,
    });
    const container = render(<ClassHall avatars={[]} currentStudentAvatar={currentStudentAvatar} />);

    expect(container.textContent).toContain('Aster');
    expect(container.textContent).toContain('This browser');
    expect(container.textContent).toContain('Region Specialist');
    expect(container.textContent).toContain('Algebra Pin');
    expect(container.textContent).toContain('Favorite wing: Algebra Vault');
    expect(container.textContent).toContain('Saved locally on this device.');
    expect(container.textContent).not.toContain('Maya Q.');
    expect(container.textContent).not.toContain('P3 Alpha');
    expect(container.textContent).not.toContain('Ms Hypatia');
    expect(container.textContent).not.toContain('97%');
  });

  it('renders avatar metadata and equipped cosmetics', () => {
    const container = render(<ClassHall avatars={[baseSnapshot]} />);

    expect(container.textContent).toContain('Nova');
    expect(container.textContent).toContain('Star House');
    expect(container.textContent).toContain('Class Hall Curator');
    expect(container.textContent).toContain('Algebra Pin Bearer');
    expect(container.textContent).toContain('Hair: Stargazer Sweep');
    expect(container.textContent).toContain('Cloak: Apprentice Cloak');
    expect(container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Nova Class Hall avatar');
  });

  it('does not render sensitive fields accidentally present in snapshots', () => {
    const sensitiveSnapshot = {
      ...baseSnapshot,
      hiddenMarks: 'HiddenMarkValue-999',
      exactQuizScore: 'ExactQuizScore-97',
      weakTopic: 'WeakTopic-PolarRoutes',
      shameRank: 'ShameRank-TopStudent',
      privateGrade: 'PrivateGrade-AStar',
    } as ClassHallAvatarSnapshot;

    const container = render(<ClassHall avatars={[sensitiveSnapshot]} />);

    expect(container.textContent).not.toContain('HiddenMarkValue-999');
    expect(container.textContent).not.toContain('ExactQuizScore-97');
    expect(container.textContent).not.toContain('WeakTopic-PolarRoutes');
    expect(container.textContent).not.toContain('ShameRank-TopStudent');
    expect(container.textContent).not.toContain('PrivateGrade-AStar');
  });

  it('renders an empty state when no avatars exist', () => {
    const container = render(<ClassHall avatars={[]} />);

    expect(container.textContent).toContain('The Class Hall is quiet.');
    expect(container.textContent).toContain('No local avatar snapshots are stored in this browser yet.');
    expect(container.textContent).not.toContain('Academy Commons');
    expect(container.querySelectorAll('[data-class-hall-card]')).toHaveLength(0);
  });

  it('keeps the world map focused on region entry points without duplicate bottom navigation', () => {
    const container = render(
      <P3AstralAcademy
        world={P3_ASTRAL_ACADEMY}
        progress={[regionProgress()]}
        avatarName="Aster"
        avatar={emptyProgress().avatar}
        avatarLocation={avatarLocation}
        onTrain={vi.fn()}
      />,
    );

    expect(container.querySelector('.bottom-menu')).toBeNull();
    const regionButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Algebra Vault'));
    expect(regionButton).toBeTruthy();
    expect(document.body.querySelector('.region-glyph')).toBeNull();
    expect(document.body.textContent).not.toContain('ALG');
  });

  it('opens a region from the whole ledger card without double-firing the nested button', () => {
    const onTrain = vi.fn();
    const progress = regionProgress();
    const container = render(
      <AstralRegionLedger
        progress={[progress]}
        regionLearningSummaries={{}}
        onTrain={onTrain}
      />,
    );

    const card = container.querySelector<HTMLElement>('.region-card');
    expect(card).toBeTruthy();
    expect(card?.getAttribute('role')).toBe('link');
    expect(card?.getAttribute('tabIndex')).toBe('0');

    act(() => {
      card!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onTrain).toHaveBeenCalledTimes(1);
    expect(onTrain).toHaveBeenLastCalledWith(progress.region);

    const button = card!.querySelector<HTMLButtonElement>('button');
    act(() => {
      button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onTrain).toHaveBeenCalledTimes(2);

    act(() => {
      card!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(onTrain).toHaveBeenCalledTimes(3);
  });

  it('renders the P3 restoration ledger in the requested vertical topic order', () => {
    const progress = [...P3_ASTRAL_ACADEMY.regions]
      .reverse()
      .map((region) => regionProgress({ region }));

    const container = render(
      <AstralRegionLedger
        progress={progress}
        regionLearningSummaries={{}}
        onTrain={vi.fn()}
      />,
    );

    const renderedRegionNames = Array.from(container.querySelectorAll('.region-card h3'))
      .map((heading) => heading.textContent);

    expect(renderedRegionNames).toEqual([
      'Algebra Vault',
      'Logarithm Observatory',
      'Trigonometry Spire',
      'Calculus Cliffs',
      'Integral Terraces',
      'Differential Shrine',
      'Iteration Forge',
      'Vectors Gate',
      'Argand Atrium',
    ]);
  });
});
