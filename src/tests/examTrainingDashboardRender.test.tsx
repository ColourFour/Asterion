import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AVATAR_SETTINGS } from '../lib/avatarStore';
import { emptyProgress } from '../lib/progressStore';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import { ExamTrainingDashboard } from '../components/world/regionHub/ExamTrainingDashboard';
import type { Attempt, AvatarGear, RegionProgress } from '../types';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const mountedRoots: Root[] = [];
const mountedContainers: HTMLElement[] = [];

const definitions = [
  'Balanced exam-style practice. Start here when you want a steady next question.',
  'Review based on saved mistakes and lower scores. If you have no saved attempt yet, start with Core.',
  'Challenge-style practice. Selection is still exam-style, not a precise difficulty engine.',
];

const avatarGear: AvatarGear = {
  title: 'Region Specialist',
  gear: ['Bronze Academy Frame'],
  restoredRegions: 1,
  goldRegions: 0,
  strongestRegionName: 'Algebra Vault',
  strongestRegionRank: 'Bronze',
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

function savedAttempt(): Attempt {
  return {
    id: 'attempt-exam-training-render',
    profileId: 'profile-1',
    questionId: 'q1',
    paperFamily: 'p3',
    topicDisplayName: 'Algebra',
    marksEarned: 4,
    marksAvailable: 5,
    scoreRatio: 0.8,
    timeSpentSeconds: 300,
    markSchemeRevealed: true,
    attemptedAt: '2026-05-27T00:00:00.000Z',
  };
}

function weakAttempt(): Attempt {
  return {
    ...savedAttempt(),
    id: 'attempt-exam-training-weak',
    marksEarned: 2,
    scoreRatio: 0.4,
    mistakeTypes: ['algebra_error'],
    validatedRegionId: 'algebra-forge',
    displayRegionId: 'algebra-forge',
  };
}

function worldProgress(): RegionProgress[] {
  return P3_ASTRAL_ACADEMY.regions.map((region) => ({
    region,
    availableQuestions: 1,
    attempts: region.id === 'algebra-forge' ? 1 : 0,
    totalMarksEarned: region.id === 'algebra-forge' ? 4 : 0,
    totalMarksAvailable: region.id === 'algebra-forge' ? 5 : 0,
    averageScoreRatio: region.id === 'algebra-forge' ? 0.8 : undefined,
    recentScoreRatio: region.id === 'algebra-forge' ? 0.8 : undefined,
    subtopicsTouched: 1,
    rank: region.id === 'algebra-forge' ? 'Discovered' : 'Dormant',
    isActive: true,
  }));
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

describe('ExamTrainingDashboard practice choices', () => {
  it('glows Core Practice until saved evidence can recommend a targeted mode', () => {
    const container = render(
      <ExamTrainingDashboard
        progress={emptyProgress()}
        questions={[]}
        worldProgress={worldProgress()}
        avatarName="Pilot Star"
        avatar={DEFAULT_AVATAR_SETTINGS}
        avatarGear={avatarGear}
        onOpenRegions={vi.fn()}
        onReturnToMap={vi.fn()}
        onNavigateRegionPage={vi.fn()}
        onStartPractice={vi.fn()}
      />,
    );

    expect(container.querySelector('.exam-training-practice-choice.practice-core')?.classList.contains('next-step-glow')).toBe(true);
    expect(container.querySelector('.exam-training-practice-choice.practice-weak')?.classList.contains('next-step-glow')).toBe(false);
    expect(container.querySelector('.exam-training-practice-choice.practice-stretch')?.classList.contains('next-step-glow')).toBe(false);
    expect(container.textContent).toContain('Save a scored attempt with missed marks before Weak Area Review can target a real weak spot.');
  });

  it('moves the recommendation glow to Weak Area Review when missed-mark evidence exists', () => {
    const container = render(
      <ExamTrainingDashboard
        progress={{ ...emptyProgress(), attempts: [weakAttempt()] }}
        questions={[]}
        worldProgress={worldProgress()}
        avatarName="Pilot Star"
        avatar={DEFAULT_AVATAR_SETTINGS}
        avatarGear={avatarGear}
        onOpenRegions={vi.fn()}
        onReturnToMap={vi.fn()}
        onNavigateRegionPage={vi.fn()}
        onStartPractice={vi.fn()}
      />,
    );

    expect(container.querySelector('.exam-training-practice-choice.practice-core')?.classList.contains('next-step-glow')).toBe(false);
    expect(container.querySelector('.exam-training-practice-choice.practice-weak')?.classList.contains('next-step-glow')).toBe(true);
  });

  it('keeps default practice choice buttons to titles while preserving accessible definitions and clicks', () => {
    const onStartPractice = vi.fn();
    const container = render(
      <ExamTrainingDashboard
        progress={{ ...emptyProgress(), attempts: [savedAttempt()] }}
        questions={[]}
        worldProgress={worldProgress()}
        avatarName="Pilot Star"
        avatar={DEFAULT_AVATAR_SETTINGS}
        avatarGear={avatarGear}
        onOpenRegions={vi.fn()}
        onReturnToMap={vi.fn()}
        onNavigateRegionPage={vi.fn()}
        onStartPractice={onStartPractice}
      />,
    );

    const choiceButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.exam-training-practice-card'));
    expect(choiceButtons.map((button) => button.textContent?.trim())).toEqual([
      'Core Practice',
      'Weak Area Review',
      'Stretch Problems',
    ]);

    for (const button of choiceButtons) {
      for (const definition of definitions) {
        expect(button.textContent).not.toContain(definition);
      }
      expect(button.getAttribute('aria-describedby')).toMatch(/^exam-training-practice-.+-definition$/);
    }

    for (const definition of definitions) {
      expect(container.textContent).toContain(definition);
    }

    const weakChoice = container.querySelector<HTMLElement>('.exam-training-practice-choice.practice-weak');
    const weakInfo = weakChoice?.querySelector<HTMLButtonElement>('.exam-training-practice-info-button');
    expect(weakInfo).toBeTruthy();

    act(() => {
      weakInfo?.click();
    });

    expect(weakChoice?.dataset.infoOpen).toBe('true');
    expect(weakInfo?.getAttribute('aria-expanded')).toBe('true');
    expect(onStartPractice).not.toHaveBeenCalled();

    for (const button of choiceButtons) {
      act(() => {
        button.click();
      });
    }

    expect(onStartPractice).toHaveBeenNthCalledWith(1, 'core');
    expect(onStartPractice).toHaveBeenNthCalledWith(2, 'weak');
    expect(onStartPractice).toHaveBeenNthCalledWith(3, 'stretch');
  });
});
