import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRegionFieldGuide } from '../data/regionFieldGuides';
import { buildRegionLearningSummary } from '../lib/regionLearning';
import type { GeneratedPracticeItem } from '../lib/generatedPractice';
import { getRegionTheme } from '../lib/regionThemes';
import {
  REGION_LEARNING_PAGE_LABELS,
  parseAsterionHashRoute,
  regionHashPath,
  type RegionLearningPageId,
} from '../lib/regionRoutes';
import type { TeachingSnippet } from '../lib/teachingSnippets';
import type { LearningActivityAttempt, NormalizedQuestion, RegionProgress, TrainingSessionIntent } from '../types';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import { RegionHub } from '../components/world/RegionHub';
import { FieldGuidePanel } from '../components/world/regionHub/FieldGuidePanel';
import { QuickChecksPanel } from '../components/world/regionHub/QuickChecksPanel';
import { WarmUpPracticePanel } from '../components/world/regionHub/WarmUpPracticePanel';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const stylesCss = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');

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

async function waitForKatex(container: HTMLElement, minimumCount = 1): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (container.querySelectorAll('.katex').length >= minimumCount) return;
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 10));
    });
  }
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function workedExampleTextParts(example: ReturnType<typeof getRegionFieldGuide>['workedExamples'][number]): string[] {
  return [
    example.title,
    example.focus,
    example.setup ?? '',
    ...example.steps,
    example.answer,
    example.keyMove,
    example.check,
    example.why,
  ].filter((text) => text.trim());
}

function hasBalancedDollarDelimiters(text: string): boolean {
  return (text.match(/\$/g) ?? []).length % 2 === 0;
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

function renderRegionHubPage(options: {
  activePage?: RegionLearningPageId;
  snippets?: TeachingSnippet[];
  practiceItems?: GeneratedPracticeItem[];
  onCompleteFieldGuide?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
  onStartTraining?: (intent: TrainingSessionIntent) => void;
  onChallengeGuardian?: (question: NormalizedQuestion) => void;
  onNavigatePage?: (page: RegionLearningPageId) => void;
} = {}) {
  const progress = regionProgress();
  const summary = buildRegionLearningSummary({
    regionProgress: progress,
    regionQuestions: [normalizedQuestion()],
    regionAttempts: [],
  });

  return render(
    <RegionHub
      regionProgress={progress}
      fieldGuide={getRegionFieldGuide(progress.region)}
      fieldGuideCompleted={false}
      teachingSnippets={options.snippets ?? [snippet]}
      generatedPractice={options.practiceItems ?? [generatedPractice]}
      learningActivityAttempts={[]}
      summary={summary}
      activePage={options.activePage}
      onCompleteFieldGuide={options.onCompleteFieldGuide ?? vi.fn()}
      onLearningActivityAttempt={options.onLearningActivityAttempt ?? vi.fn()}
      onStartTraining={options.onStartTraining ?? vi.fn()}
      onChallengeGuardian={options.onChallengeGuardian ?? vi.fn()}
      onNavigatePage={options.onNavigatePage ?? vi.fn()}
      onReturnToMap={vi.fn()}
    />,
  );
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

  it('renders the region hub as orientation and page navigation instead of the full learning stack', () => {
    const progress = regionProgress();
    const onNavigatePage = vi.fn<(page: RegionLearningPageId) => void>();
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
        onNavigatePage={onNavigatePage}
        onReturnToMap={vi.fn()}
      />,
    );

    expect(container.textContent).toContain('Choose one focused step');
    expect(container.textContent).toContain('Skill and subtopic overview');
    expect(container.querySelector('.region-learning-nav')).toBeFalsy();
    expect(container.querySelector('.field-guide-card')).toBeFalsy();
    expect(container.querySelector('.quick-check-card')).toBeFalsy();
    expect(container.querySelector('.warm-up-card')).toBeFalsy();
    expect(container.querySelector('.training-card')).toBeFalsy();
    expect(container.querySelector('.guardian-card')).toBeFalsy();

    const fieldGuideCard = Array.from(container.querySelectorAll<HTMLButtonElement>('.region-page-card'))
      .find((button) => button.textContent?.includes('Field Guide'));
    expect(fieldGuideCard).toBeTruthy();
    expect(container.querySelectorAll('.region-page-card')).toHaveLength(5);
    act(() => {
      fieldGuideCard!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onNavigatePage).toHaveBeenCalledWith('field-guide');
  });

  it('renders each focused region page with its preserved panel behavior', () => {
    const fieldGuidePage = renderRegionHubPage({ activePage: 'field-guide' });
    expect(fieldGuidePage.textContent).toContain('Field Guide');
    expect(fieldGuidePage.textContent).toContain('What this topic is');
    expect(fieldGuidePage.querySelector('.region-learning-nav')).toBeTruthy();
    expect(fieldGuidePage.textContent).not.toContain('Back to region hub');
    expect(fieldGuidePage.querySelector('.field-guide-card')).toBeTruthy();
    expect(fieldGuidePage.querySelector('.quick-check-card')).toBeFalsy();

    const quickCheckPage = renderRegionHubPage({ activePage: 'quick-check' });
    expect(quickCheckPage.textContent).toContain('Quick Checks');
    expect(quickCheckPage.textContent).toContain('Rewrite \\log base two of eight equals three.');
    expect(quickCheckPage.querySelector('.quick-check-card .quick-check-reveal')).toBeTruthy();
    expect(quickCheckPage.querySelector('.field-guide-card')).toBeFalsy();

    const warmUpPage = renderRegionHubPage({ activePage: 'warm-up' });
    expect(warmUpPage.textContent).toContain('Warm-up Practice');
    expect(warmUpPage.textContent).toContain('Solve ln(x) + ln(3) = ln(12).');
    expect(warmUpPage.querySelector('.warm-up-practice-card')).toBeTruthy();

    const examTrainingPage = renderRegionHubPage({ activePage: 'exam-training' });
    expect(examTrainingPage.textContent).toContain('Exam Training');
    expect(examTrainingPage.textContent).toContain('Recommended session');
    expect(examTrainingPage.querySelector('.training-card')).toBeTruthy();

    const guardianPage = renderRegionHubPage({ activePage: 'guardian' });
    expect(guardianPage.textContent).toContain('Guardian Challenge');
    expect(guardianPage.textContent).toContain('Guardian not ready yet');
    expect(guardianPage.querySelector('.guardian-card')).toBeTruthy();
  });

  it('supports calm missing states and back navigation from focused pages', () => {
    const onNavigatePage = vi.fn<(page: RegionLearningPageId) => void>();
    const container = renderRegionHubPage({
      activePage: 'warm-up',
      snippets: [],
      practiceItems: [],
      onNavigatePage,
    });

    expect(container.textContent).toContain('Warm-ups for this region are being prepared.');
    const back = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Region Hub');
    expect(back).toBeTruthy();
    act(() => {
      back!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onNavigatePage).toHaveBeenCalledWith('hub');
  });

  it('keeps region navigation destinations unique and stage indicators non-interactive', () => {
    const container = renderRegionHubPage({ activePage: 'quick-check' });
    const navButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.region-learning-nav button'));
    const navLabels = navButtons.map((button) => button.textContent);

    expect(navLabels).toEqual([
      REGION_LEARNING_PAGE_LABELS.hub,
      REGION_LEARNING_PAGE_LABELS['field-guide'],
      REGION_LEARNING_PAGE_LABELS['quick-check'],
      REGION_LEARNING_PAGE_LABELS['warm-up'],
      REGION_LEARNING_PAGE_LABELS['exam-training'],
      REGION_LEARNING_PAGE_LABELS.guardian,
    ]);
    expect(new Set(navLabels).size).toBe(navLabels.length);
    expect(container.querySelectorAll('.region-arc-timeline button')).toHaveLength(0);
    expect(container.querySelectorAll('.arc-phase[role="button"]')).toHaveLength(0);
  });

  it('humanizes warm-up fallback labels without inventing curriculum mappings', () => {
    const fallbackPractice = {
      ...generatedPractice,
      questionType: undefined,
      generatorFamily: 'logarithms_and_exponentials.log_equation_basic',
    };

    const container = renderRegionHubPage({
      activePage: 'warm-up',
      practiceItems: [fallbackPractice],
    });

    expect(container.querySelector('.warm-up-practice-heading strong')?.textContent).toBe('Log Equation Basic');
    expect(container.textContent).not.toContain('log_equation_basic');
    expect(container.textContent).not.toContain('logarithms_and_exponentials');
  });

  it('does not award progress or save activity attempts from passive page viewing', () => {
    const onCompleteFieldGuide = vi.fn();
    const onLearningActivityAttempt = vi.fn();

    renderRegionHubPage({
      activePage: 'field-guide',
      onCompleteFieldGuide,
      onLearningActivityAttempt,
    });
    renderRegionHubPage({
      activePage: 'quick-check',
      onCompleteFieldGuide,
      onLearningActivityAttempt,
    });
    renderRegionHubPage({
      activePage: 'warm-up',
      onCompleteFieldGuide,
      onLearningActivityAttempt,
    });

    expect(onCompleteFieldGuide).not.toHaveBeenCalled();
    expect(onLearningActivityAttempt).not.toHaveBeenCalled();
  });

  it('parses region hash routes and treats unknown region ids as safe route errors', () => {
    expect(regionHashPath('logarithm-grove')).toBe('#/regions/logarithm-grove');
    expect(regionHashPath('logarithm-grove', 'exam-training')).toBe('#/regions/logarithm-grove/exam-training');
    expect(parseAsterionHashRoute('#/regions/logarithm-grove/quick-check')).toMatchObject({
      kind: 'region',
      regionId: 'logarithm-grove',
      page: 'quick-check',
      isKnownRegion: true,
    });
    expect(parseAsterionHashRoute('#/regions/not-a-region/guardian')).toMatchObject({
      kind: 'region',
      regionId: 'not-a-region',
      page: 'guardian',
      isKnownRegion: false,
    });
    expect(parseAsterionHashRoute('#/regions/logarithm-grove/not-real')).toMatchObject({
      kind: 'region',
      regionId: 'logarithm-grove',
      page: 'hub',
      isKnownRegion: true,
    });
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
        onNavigatePage={vi.fn()}
        onReturnToMap={vi.fn()}
      />,
    );

    const summaryBand = container.querySelector<HTMLElement>('.region-summary-band');
    const learningContent = container.querySelector<HTMLElement>('.region-page-shell');

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

  it('renders numbered phase classes for progressive step tinting', () => {
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
        onNavigatePage={vi.fn()}
        onReturnToMap={vi.fn()}
      />,
    );

    const phases = Array.from(container.querySelectorAll('.region-arc-timeline .arc-phase'));
    expect(phases).toHaveLength(5);
    phases.forEach((phase, index) => {
      expect(phase.classList.contains(`arc-phase-${index + 1}`)).toBe(true);
    });
  });

  it('keeps region summary cards equal-height and phases progressively tinted in CSS', () => {
    expect(stylesCss).toMatch(/\.region-summary-band\s*\{[\s\S]*?align-items:\s*stretch;/);
    expect(stylesCss).toMatch(/\.region-summary-band\s*>\s*\.region-next-action,\s*[\r\n\s]*\.region-summary-band\s*>\s*\.region-progress-strip\s*\{[\s\S]*?height:\s*100%;[\s\S]*?margin-bottom:\s*0;/);
    expect(stylesCss).toContain('.arc-phase-1');
    expect(stylesCss).toContain('.arc-phase-5');
    expect(stylesCss).toMatch(/\.arc-phase-1\s*\{[\s\S]*?var\(--region-accent[^)]*\)\s*5%/);
    expect(stylesCss).toMatch(/\.arc-phase-5\s*\{[\s\S]*?var\(--region-accent[^)]*\)\s*17%/);
  });

  it('keeps every P3 field-guide worked-example card complete and delimiter-safe', () => {
    for (const region of P3_ASTRAL_ACADEMY.regions) {
      const guide = getRegionFieldGuide(region);
      expect(guide.workedExamples.length, region.id).toBeGreaterThan(0);
      for (const example of guide.workedExamples) {
        expect(example.title.trim(), `${region.id} title`).not.toBe('');
        expect(example.focus.trim(), `${region.id} ${example.title} focus`).not.toBe('');
        expect(example.steps.length, `${region.id} ${example.title} steps`).toBeGreaterThanOrEqual(2);
        expect(example.answer.trim(), `${region.id} ${example.title} answer`).not.toBe('');
        expect(example.keyMove.trim(), `${region.id} ${example.title} move`).not.toBe('');
        expect(example.check.trim(), `${region.id} ${example.title} check`).not.toBe('');
        expect(example.why.trim(), `${region.id} ${example.title} why`).not.toBe('');
        for (const text of workedExampleTextParts(example)) {
          expect(hasBalancedDollarDelimiters(text), `${region.id} ${example.title}: ${text}`).toBe(true);
        }
      }
    }
  });

  it('preserves escaped LaTeX source for major worked-example notation', () => {
    const source = P3_ASTRAL_ACADEMY.regions
      .flatMap((region) => getRegionFieldGuide(region).workedExamples)
      .flatMap(workedExampleTextParts)
      .join('\n');

    expect(source).toContain('\\binom');
    expect(source).toContain('\\frac');
    expect(source).toContain('\\ln');
    expect(source).toContain('\\int');
    expect(source).toContain('\\mathbf');
    expect(source).toContain('\\frac{dy}{dx}');
  });

  it('routes field-guide worked-example inline and block math through KaTeX', async () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();

    const container = render(
      <FieldGuidePanel
        fieldGuide={getRegionFieldGuide(logRegion!)}
        fieldGuideCompleted={false}
        theme={getRegionTheme(logRegion!)}
        teachingSnippets={[]}
        onCompleteFieldGuide={vi.fn()}
      />,
    );
    await waitForKatex(container, 6);

    const combineLogsCard = Array.from(container.querySelectorAll<HTMLElement>('.worked-example-card'))
      .find((card) => card.textContent?.includes('Combine logs'));
    expect(combineLogsCard).toBeTruthy();
    expect(combineLogsCard?.querySelector('.math-text:not(.math-display) .katex')).toBeTruthy();
    expect(combineLogsCard?.querySelector('.math-display .katex')).toBeTruthy();
    expect(combineLogsCard?.textContent).not.toContain('$$');
  });

  it('renders worked examples with P3 notation as math instead of raw fragments', async () => {
    const container = render(
      <>
        {P3_ASTRAL_ACADEMY.regions.map((region) => (
          <FieldGuidePanel
            fieldGuide={getRegionFieldGuide(region)}
            fieldGuideCompleted={false}
            theme={getRegionTheme(region)}
            teachingSnippets={[]}
            onCompleteFieldGuide={vi.fn()}
            key={region.id}
          />
        ))}
      </>,
    );
    await waitForKatex(container, 40);

    expect(container.querySelectorAll('.worked-example-card .katex').length).toBeGreaterThan(40);
    expect(container.querySelectorAll('.worked-example-card .math-display .katex').length).toBeGreaterThan(20);
    expect(container.querySelector('.worked-example-card .mfrac')).toBeTruthy();
    expect(container.innerHTML).toContain('katex-display');
    expect(container.textContent).not.toContain('$$');
  });

  it('does not force every worked-example span to block layout', () => {
    expect(stylesCss).not.toMatch(/\.worked-example-card\s+span\s*\{/);
    expect(stylesCss).not.toMatch(/\.worked-example-card\s+strong,\s*[\r\n\s]*\.worked-example-card\s+span/);
  });
});
