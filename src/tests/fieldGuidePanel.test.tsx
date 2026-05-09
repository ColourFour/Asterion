import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRegionFieldGuide } from '../data/regionFieldGuides';
import type { GeneratedPracticeItem } from '../lib/generatedPractice';
import { getRegionTheme } from '../lib/regionThemes';
import type { TeachingSnippet } from '../lib/teachingSnippets';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import { FieldGuidePanel } from '../components/world/regionHub/FieldGuidePanel';
import { QuickChecksPanel } from '../components/world/regionHub/QuickChecksPanel';
import { WarmUpPracticePanel } from '../components/world/regionHub/WarmUpPracticePanel';

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

const snippet: TeachingSnippet = {
  snippetId: 'p3-log-check',
  paperFamily: 'p3',
  topics: ['logarithms_and_exponentials'],
  regionIds: ['logarithm-grove'],
  title: 'Switch forms before solving',
  studentGoal: 'Convert between logarithmic and exponential form.',
  body: 'A logarithm names the exponent needed.',
  steps: ['Identify the base.', 'Rewrite as an exponent statement.'],
  examMove: 'Convert form when the unknown is inside the logarithm.',
  commonTrap: 'Changing the base while converting.',
  reviewStatus: 'published',
  source: 'teacher_authored',
  prerequisites: ['Know index notation.'],
  microSteps: ['Circle the base.', 'Name the exponent.'],
  commonMistakes: ['Treating the argument as the exponent.'],
  quickCheck: {
    prompt: 'Rewrite log base two of eight equals three.',
    answer: 'Two cubed equals eight.',
    explanation: 'The log value is the exponent.',
  },
  guardianReadiness: {
    supportsTopics: ['logarithms_and_exponentials'],
    recommendedBeforeQuestionIds: [],
    readinessNote: 'Use before logarithm Guardian attempts.',
  },
  estimatedTimeMinutes: 3,
  snippetType: 'concept',
  sourceQuestionIds: [],
  sourceSkillTargetIds: [],
};

const generatedPractice: GeneratedPracticeItem = {
  practiceId: 'gen_log_equation_basic_0001',
  generatorFamily: 'logarithms_and_exponentials.log_equation_basic',
  paperFamily: 'p3',
  topic: 'logarithms_and_exponentials',
  snippetIds: ['p3-log-laws-001'],
  regionIds: ['logarithm-grove'],
  prompt: 'Solve ln(x) + ln(3) = ln(12).',
  answer: 'x = 4',
  workedSolution: [
    'The domain requires x > 0.',
    'Use the product law.',
  ],
  parameters: { a: 3, b: 12, solution: 4 },
  verification: { status: 'pass', method: 'deterministic', verifier: 'content_lab_v1' },
  difficultyBand: 'easy',
  reviewStatus: 'teacher_reviewed',
};

describe('FieldGuidePanel teaching snippets', () => {
  it('renders enriched snippet support with a revealable quick check', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();

    const container = render(
      <>
        <FieldGuidePanel
          fieldGuide={getRegionFieldGuide(logRegion!)}
          fieldGuideCompleted={false}
          theme={getRegionTheme(logRegion!)}
          teachingSnippets={[snippet]}
          onCompleteFieldGuide={vi.fn()}
        />
        <QuickChecksPanel teachingSnippets={[snippet]} />
      </>,
    );

    expect(container.textContent).toContain('Teaching snippets');
    expect(container.textContent).toContain('Micro steps');
    expect(container.textContent).toContain('Common mistakes');

    const details = container.querySelector<HTMLDetailsElement>('.quick-check-card details.quick-check-reveal');
    expect(details).toBeTruthy();
    expect(details?.querySelector('summary')?.textContent).toContain('Quick check');

    act(() => {
      details!.open = true;
      details!.dispatchEvent(new Event('toggle', { bubbles: true }));
    });

    expect(details?.open).toBe(true);
    expect(details?.textContent).toContain('Answer');
    expect(details?.textContent).toContain('Two cubed equals eight.');
  });

  it('renders revealable generated warm-up practice', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();

    const container = render(
      <WarmUpPracticePanel practiceItems={[generatedPractice]} />,
    );

    expect(container.textContent).toContain('Warm-up Practice');
    expect(container.textContent).toContain('Solve ln(x) + ln(3) = ln(12).');
    expect(container.textContent).not.toContain('x = 4');

    const revealButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Reveal solution');
    expect(revealButton).toBeTruthy();
    expect(revealButton?.getAttribute('aria-controls')).toBe('warm-up-solution-gen_log_equation_basic_0001');
    expect(revealButton?.getAttribute('aria-expanded')).toBe('false');

    act(() => {
      revealButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(revealButton?.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('x = 4');
    expect(container.textContent).toContain('Use the product law.');
  });

  it('renders a friendly warm-up empty state for regions without generated practice', () => {
    const container = render(<WarmUpPracticePanel practiceItems={[]} />);
    const emptyState = container.querySelector('.region-empty-state');

    expect(emptyState).toBeTruthy();
    expect(container.textContent).toContain('Warm-ups for this region are being prepared.');
    expect(container.textContent).toContain('Field Guide');
    expect(container.textContent).toContain('Exam Training');
  });
});
