import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClassHall } from '../components/classHall/ClassHall';
import { P3AstralAcademy } from '../components/world/P3AstralAcademy';
import type { AvatarLocation } from '../lib/avatarLocation';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import type { ClassHallAvatarSnapshot } from '../lib/classHall';
import type { RegionProgress } from '../types';
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
  titles: ['Commons Curator'],
  badges: ['Algebra Pin Bearer'],
  motto: 'Check each route.',
  favoriteRegion: 'Algebra Vault',
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
    expect(container.querySelectorAll('[data-class-hall-card]').length).toBeGreaterThanOrEqual(4);
  });

  it('renders avatar metadata and equipped cosmetics', () => {
    const container = render(<ClassHall avatars={[baseSnapshot]} />);

    expect(container.textContent).toContain('Nova');
    expect(container.textContent).toContain('Star House');
    expect(container.textContent).toContain('Commons Curator');
    expect(container.textContent).toContain('Algebra Pin Bearer');
    expect(container.textContent).toContain('Hair: Stargazer Sweep');
    expect(container.textContent).toContain('Cloak: Apprentice Cloak');
    expect(container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Nova academy commons avatar');
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

    expect(container.textContent).toContain('The Commons is quiet.');
    expect(container.querySelectorAll('[data-class-hall-card]')).toHaveLength(0);
  });

  it('exposes a world map entry point for the Commons', () => {
    const container = render(
      <P3AstralAcademy
        world={P3_ASTRAL_ACADEMY}
        progress={[regionProgress()]}
        avatarName="Aster"
        avatar={emptyProgress().avatar}
        avatarLocation={avatarLocation}
        onTrain={vi.fn()}
        onRegions={vi.fn()}
        onProfile={vi.fn()}
        onClassHall={vi.fn()}
        onTeacher={vi.fn()}
      />,
    );

    const commonsButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Commons'));
    expect(commonsButton).toBeTruthy();
  });
});
