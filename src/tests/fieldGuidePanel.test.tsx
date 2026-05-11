import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRegionFieldGuide } from '../data/regionFieldGuides';
import { buildRegionLearningSummary } from '../lib/regionLearning';
import type { GeneratedPracticeItem } from '../lib/generatedPractice';
import { getRegionTheme } from '../lib/regionThemes';
import type { TeachingSnippet } from '../lib/teachingSnippets';
import type { NormalizedQuestion, RegionProgress } from '../types';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import { RegionHub } from '../components/world/RegionHub';
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

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
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
  workedExamples: [
    {
      id: 'p3-log-check-example-1',
      prompt: 'Rewrite log base two of eight equals three.',
      steps: ['Keep base two.', 'Use three as the exponent.'],
      answer: 'Two cubed equals eight.',
      teachingNote: 'The log value is the exponent.',
      questionType: 'Logarithm conversion',
      keyMethod: 'Rewrite the logarithm as an exponent statement.',
      examMove: 'Convert form before solving.',
      sourceQuestionIds: ['32spring21_q01'],
      sourceQuestionAssetIds: ['p3/32spring21/questions/q01.png'],
      sourceMarkSchemeAssetIds: ['p3/32spring21/mark_scheme/q01.png'],
    },
  ],
  quickCheck: {
    prompt: 'Rewrite log base two of eight equals three.',
    answer: 'Two cubed equals eight.',
    explanation: 'The log value is the exponent.',
    exampleModelId: 'p3-log-check-example-1',
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
  relatedSkillTargetIds: [],
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
  sourceSnippetId: 'p3-log-laws-001',
  exampleModelId: 'p3-log-laws-001-example-1',
  questionType: 'Logarithm equation',
  keyMethod: 'Combine logarithms before solving.',
  examMove: 'Use one logarithm before comparing arguments.',
  verification: { status: 'pass', method: 'deterministic', verifier: 'content_lab_schema_v2' },
  difficultyBand: 'easy',
  reviewStatus: 'teacher_reviewed',
};

function snippetVariant(index: number): TeachingSnippet {
  return {
    ...snippet,
    snippetId: `p3-log-check-${index}`,
    title: `Log snippet ${index}`,
    quickCheck: {
      prompt: `Quick prompt ${index}`,
      answer: `Quick answer ${index}`,
      explanation: `Quick explanation ${index}`,
    },
  };
}

function practiceVariant(index: number): GeneratedPracticeItem {
  return {
    ...generatedPractice,
    practiceId: `gen_log_equation_basic_000${index}`,
    prompt: `Warm-up prompt ${index}`,
    answer: `Warm-up answer ${index}`,
  };
}

function normalizedQuestion(): NormalizedQuestion {
  return {
    id: 'q1',
    paperFamily: 'p3',
    paper: '31autumn21',
    questionNumber: '1',
    displayTopic: 'Logarithms',
    displaySubtopic: 'logarithmic equations',
    displayDifficulty: 'core',
    marksAvailable: 6,
    deepseek: { hasError: false, topic: 'Logarithms', subtopic: 'logarithmic equations' },
    questionImageRawPaths: ['p3/31autumn21/questions/q01.png'],
    markSchemeImageRawPaths: ['p3/31autumn21/mark_scheme/q01.png'],
    questionImagePaths: ['p3/31autumn21/questions/q01.png'],
    markSchemeImagePaths: ['p3/31autumn21/mark_scheme/q01.png'],
    questionImageUrls: ['/assets/31autumn21/questions/q01.png'],
    markSchemeImageUrls: ['/assets/31autumn21/mark_scheme/q01.png'],
    questionImageCandidates: [['/assets/31autumn21/questions/q01.png']],
    markSchemeImageCandidates: [['/assets/31autumn21/mark_scheme/q01.png']],
    raw: { local: {} },
  };
}

function regionProgress(): RegionProgress {
  const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove')!;
  return {
    region: logRegion,
    availableQuestions: 4,
    attempts: 0,
    totalMarksEarned: 0,
    totalMarksAvailable: 0,
    subtopicsTouched: 0,
    rank: 'Discovered',
    isActive: true,
  };
}

describe('FieldGuidePanel teaching snippets', () => {
  it('renders enriched snippet support with an answer-first quick check', () => {
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
        <QuickChecksPanel teachingSnippets={[snippet]} region={logRegion!} />
      </>,
    );

    expect(container.textContent).toContain('Teaching snippets');
    expect(container.textContent).toContain('Worked example');
    expect(container.textContent).toContain('What the question is asking');
    expect(container.textContent).toContain('Question type');
    expect(container.textContent).toContain('Key method');
    expect(container.textContent).toContain('Step-by-step math');
    expect(container.textContent).toContain('Exam move');
    expect(container.textContent).toContain('Two cubed equals eight.');
    expect(container.textContent).toContain('Micro steps');
    expect(container.textContent).toContain('Common mistakes');

    const quickCheck = container.querySelector<HTMLElement>('.quick-check-card .quick-check-reveal');
    expect(quickCheck).toBeTruthy();
    expect(quickCheck?.textContent).toContain('Quick check');

    const revealButton = Array.from(quickCheck!.querySelectorAll('button')).find((button) => button.textContent === 'Check answer');
    expect(revealButton).toBeTruthy();
    expect(revealButton?.hasAttribute('disabled')).toBe(true);
    expect(quickCheck?.textContent).not.toContain('Reveal answer');

    const textarea = quickCheck!.querySelector<HTMLTextAreaElement>('textarea');
    act(() => {
      setTextareaValue(textarea!, '2^3 = 8');
    });
    expect(revealButton?.hasAttribute('disabled')).toBe(false);

    act(() => {
      revealButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(quickCheck?.textContent).toContain('Feedback');
    expect(quickCheck?.textContent).toContain('Linked example');
    expect(quickCheck?.textContent).toContain('Two cubed equals eight.');
  });

  it('renders answer-first generated warm-up practice', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();

    const container = render(
      <WarmUpPracticePanel practiceItems={[generatedPractice]} region={logRegion!} />,
    );

    expect(container.textContent).toContain('Warm-up Practice');
    expect(container.textContent).toContain('Solve ln(x) + ln(3) = ln(12).');
    expect(container.textContent).toContain('Question type');
    expect(container.textContent).toContain('Logarithm equation');
    expect(container.textContent).toContain('Key method');
    expect(container.textContent).not.toContain('x = 4');

    const revealButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Reveal solution');
    expect(revealButton).toBeTruthy();
    expect(revealButton?.getAttribute('aria-controls')).toBe('warm-up-solution-gen_log_equation_basic_0001');
    expect(revealButton?.getAttribute('aria-expanded')).toBe('false');
    expect(revealButton?.hasAttribute('disabled')).toBe(true);

    const textarea = container.querySelector<HTMLTextAreaElement>('.warm-up-practice-card textarea');
    act(() => {
      setTextareaValue(textarea!, 'Combine the logs first.');
    });
    expect(revealButton?.hasAttribute('disabled')).toBe(false);

    act(() => {
      revealButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('x = 4');
    expect(container.textContent).toContain('Use the product law.');
  });

  it('records an early warm-up reveal with outcome, confidence, and error type', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    const onLearningActivityAttempt = vi.fn();
    const container = render(
      <WarmUpPracticePanel
        practiceItems={[generatedPractice]}
        region={logRegion!}
        profileId="profile_1"
        onLearningActivityAttempt={onLearningActivityAttempt}
      />,
    );

    const revealAnyway = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Reveal anyway');
    act(() => {
      revealAnyway!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const missed = container.querySelector<HTMLInputElement>('input[value="missed"]');
    const confidence = Array.from(container.querySelectorAll('select'))[0];
    const error = Array.from(container.querySelectorAll('select'))[1];
    act(() => {
      missed!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      confidence!.value = '2';
      confidence!.dispatchEvent(new Event('change', { bubbles: true }));
      error!.value = 'did_not_know_method';
      error!.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const save = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Save warm-up');
    act(() => {
      save!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onLearningActivityAttempt).toHaveBeenCalledTimes(1);
    expect(onLearningActivityAttempt.mock.calls[0][0]).toMatchObject({
      activityType: 'warm_up',
      activityId: 'gen_log_equation_basic_0001',
      profileId: 'profile_1',
      regionId: 'logarithm-grove',
      learnerResponse: '',
      revealedEarly: true,
      outcome: 'missed',
      confidence: 2,
      errorType: 'did_not_know_method',
    });
  });

  it('renders a friendly warm-up empty state for regions without generated practice', () => {
    const container = render(<WarmUpPracticePanel practiceItems={[]} />);
    const emptyState = container.querySelector('.region-empty-state');

    expect(emptyState).toBeTruthy();
    expect(container.textContent).toContain('Warm-ups for this region are being prepared.');
    expect(container.textContent).toContain('Field Guide');
    expect(container.textContent).toContain('Exam Training');
  });

  it('limits snippets, quick checks, and warm-ups by default', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();
    const snippets = [snippetVariant(1), snippetVariant(2), snippetVariant(3)];
    const practiceItems = [practiceVariant(1), practiceVariant(2), practiceVariant(3)];

    const container = render(
      <>
        <FieldGuidePanel
          fieldGuide={getRegionFieldGuide(logRegion!)}
          fieldGuideCompleted={false}
          theme={getRegionTheme(logRegion!)}
          teachingSnippets={snippets}
          onCompleteFieldGuide={vi.fn()}
        />
        <QuickChecksPanel teachingSnippets={snippets} />
        <WarmUpPracticePanel practiceItems={practiceItems} />
      </>,
    );

    expect(container.querySelectorAll('.teaching-snippet-card')).toHaveLength(2);
    expect(container.querySelectorAll('.quick-check-card .quick-check-reveal')).toHaveLength(2);
    expect(container.querySelectorAll('.warm-up-practice-card')).toHaveLength(3);
    expect(container.textContent).toContain('1 more reviewed snippet available for this region.');
    expect(container.textContent).toContain('1 more reviewed quick check available.');
    expect(container.textContent).not.toContain('Showing 2 of 3 reviewed warm-ups.');
  });

  it('renders the region learning sections in the expected order', () => {
    const progress = regionProgress();
    const summary = buildRegionLearningSummary({
      regionProgress: progress,
      regionQuestions: [normalizedQuestion()],
      regionAttempts: [],
    });

    const container = render(
      <RegionHub
        regionProgress={progress}
        fieldGuide={getRegionFieldGuide(progress.region)}
        fieldGuideCompleted={false}
        teachingSnippets={[snippet]}
        generatedPractice={[generatedPractice]}
        learningActivityAttempts={[]}
        summary={summary}
        onCompleteFieldGuide={vi.fn()}
        onLearningActivityAttempt={vi.fn()}
        onStartTraining={vi.fn()}
        onChallengeGuardian={vi.fn()}
        onReturnToMap={vi.fn()}
      />,
    );

    const sectionTitles = Array.from(container.querySelectorAll('.region-learning-main .region-action-card-title h3'))
      .map((heading) => heading.textContent);

    expect(sectionTitles).toEqual([
      'Field Guide',
      'Quick Checks',
      'Warm-up Practice',
      'Exam Training',
      'Guardian Challenge',
    ]);
  });

  it('places the region summary directly above the learning content', () => {
    const progress = regionProgress();
    const summary = buildRegionLearningSummary({
      regionProgress: progress,
      regionQuestions: [normalizedQuestion()],
      regionAttempts: [],
    });

    const container = render(
      <RegionHub
        regionProgress={progress}
        fieldGuide={getRegionFieldGuide(progress.region)}
        fieldGuideCompleted={false}
        teachingSnippets={[snippet]}
        generatedPractice={[generatedPractice]}
        learningActivityAttempts={[]}
        summary={summary}
        onCompleteFieldGuide={vi.fn()}
        onLearningActivityAttempt={vi.fn()}
        onStartTraining={vi.fn()}
        onChallengeGuardian={vi.fn()}
        onReturnToMap={vi.fn()}
      />,
    );

    const summaryBand = container.querySelector<HTMLElement>('.region-summary-band');
    const learningContent = container.querySelector<HTMLElement>('.region-learning-content');

    expect(summaryBand).toBeTruthy();
    expect(learningContent).toBeTruthy();
    expect(summaryBand!.compareDocumentPosition(learningContent!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(summaryBand?.textContent).toContain('Recommended next step');
    expect(summaryBand?.textContent).toContain('Rank');
    expect(summaryBand?.textContent).toContain('Attempts');
    expect(summaryBand?.textContent).toContain('Average');
    expect(summaryBand?.textContent).toContain('Subtopics');
    expect(summaryBand?.textContent).toContain('Focus');
    expect(summaryBand?.textContent).toContain('Guardian');
  });

  it('keeps every P3 field-guide worked-example card complete', () => {
    for (const region of P3_ASTRAL_ACADEMY.regions) {
      const guide = getRegionFieldGuide(region);
      expect(guide.workedExamples.length, region.id).toBeGreaterThan(0);
      for (const example of guide.workedExamples) {
        expect(example.focus.trim(), `${region.id} ${example.title} focus`).not.toBe('');
        expect(example.steps?.length, `${region.id} ${example.title} steps`).toBeGreaterThanOrEqual(2);
        expect(example.answer?.trim(), `${region.id} ${example.title} answer`).not.toBe('');
      }
    }
  });
});
