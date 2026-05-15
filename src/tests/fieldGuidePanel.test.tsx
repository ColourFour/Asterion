import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRegionFieldGuide } from '../data/regionFieldGuides';
import {
  findVisualSupportSource,
  isDisplayableVisualSupportSource,
  visualSupportSources,
  type VisualSupportSource,
} from '../data/visualSupportSources';
import { buildRegionLearningSummary } from '../lib/regionLearning';
import type { GeneratedPracticeItem } from '../lib/generatedPractice';
import { getRegionTheme } from '../lib/regionThemes';
import {
  REGION_LEARNING_PAGE_LABELS,
  parseAsterionHashRoute,
  regionHashPath,
  type RegionLearningPageId,
} from '../lib/regionRoutes';
import { getTeachingSnippetsForRegion, normalizeTeachingSnippetsData, type TeachingSnippet } from '../lib/teachingSnippets';
import type { Attempt, LearningActivityAttempt, NormalizedQuestion, RegionLearningRecord, RegionProgress, TrainingSessionIntent } from '../types';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import { RegionHub } from '../components/world/RegionHub';
import { FieldGuidePanel } from '../components/world/regionHub/FieldGuidePanel';
import { QuickChecksPanel } from '../components/world/regionHub/QuickChecksPanel';
import { RegionProgressStrip } from '../components/world/regionHub/RegionProgressStrip';
import { TrainingGroundsPanel } from '../components/world/regionHub/TrainingGroundsPanel';
import { VisualSupportCard } from '../components/world/regionHub/VisualSupportCard';
import { WarmUpPracticePanel } from '../components/world/regionHub/WarmUpPracticePanel';

type ActGlobal = typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

(globalThis as ActGlobal).IS_REACT_ACT_ENVIRONMENT = true;

const stylesCss = readFileSync(`${process.cwd()}/src/styles.css`, 'utf8');
const publicTeachingSnippets = normalizeTeachingSnippetsData(
  JSON.parse(readFileSync(`${process.cwd()}/public/data/teaching_snippets.json`, 'utf8')),
);

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

function realSnippetsForRegion(regionId: string): TeachingSnippet[] {
  const region = P3_ASTRAL_ACADEMY.regions.find((candidate) => candidate.id === regionId)!;
  return getTeachingSnippetsForRegion(publicTeachingSnippets, P3_ASTRAL_ACADEMY.paperFamily, region);
}

function snippetWithMathWorkedExample(): TeachingSnippet {
  return {
    ...snippet,
    snippetId: 'p3-log-katex-check',
    title: 'Combine logs',
    workedExamples: [
      {
        ...snippet.workedExamples[0],
        prompt: 'Combine logs: use $\\ln x + \\ln 3 = \\ln(3x)$ and compare with $$\\frac{dy}{dx}=2x$$.',
        steps: [
          'Use $$\\ln a + \\ln b = \\ln(ab)$$ first.',
          'Then solve $\\ln(3x)=\\ln(12)$.',
        ],
        answer: '$$x = 4$$',
        teachingNote: 'Check $x > 0$ in the original equation.',
      },
    ],
  };
}

function normalizedQuestion(regionId = 'logarithm-grove'): NormalizedQuestion {
  const region = P3_ASTRAL_ACADEMY.regions.find((item) => item.id === regionId)!;
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
    routeEvidence: {
      status: 'clean',
      source: 'topic-routing',
      regionId: region.id,
      regionName: region.name,
      validatedRegionId: region.id,
      validatedRegionName: region.name,
      displayRegionId: region.id,
      displayRegionName: region.name,
      reasonCodes: ['validated-topic-routing'],
    },
    eligibility: {
      regionDisplayEligible: { eligible: true, reasonCodes: ['has-display-region'] },
      practiceEligible: { eligible: true, reasonCodes: ['has-image-practice-assets'] },
      masteryEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      guardianEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      generationEligible: { eligible: true, reasonCodes: ['validated-topic-routing'] },
      textOnlyEligible: { eligible: false, reasonCodes: ['missing-question-or-mark-scheme-text'] },
    },
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

function regionProgress(regionId = 'logarithm-grove', overrides: Partial<RegionProgress> = {}): RegionProgress {
  const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === regionId)!;
  return {
    region: logRegion,
    availableQuestions: 4,
    attempts: 0,
    totalMarksEarned: 0,
    totalMarksAvailable: 0,
    subtopicsTouched: 0,
    rank: 'Discovered',
    isActive: true,
    ...overrides,
  };
}

function regionAttempt(index: number, overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: `attempt-${index}`,
    profileId: 'profile-1',
    questionId: 'q1',
    paperFamily: 'p3',
    paper: '31autumn21',
    questionNumber: '1',
    topicDisplayName: 'Algebra',
    subtopic: 'polynomials',
    difficulty: 'core',
    marksEarned: 5,
    marksAvailable: 6,
    scoreRatio: 5 / 6,
    timeSpentSeconds: 420,
    markSchemeRevealed: true,
    attemptedAt: `2026-05-0${index}T10:00:00.000Z`,
    ...overrides,
  };
}

function renderRegionHubPage(options: {
  activePage?: RegionLearningPageId;
  fieldGuideCompleted?: boolean;
  learningRecord?: RegionLearningRecord;
  progressOverrides?: Partial<RegionProgress>;
  regionAttempts?: Attempt[];
  regionId?: string;
  regionQuestions?: NormalizedQuestion[];
  snippets?: TeachingSnippet[];
  practiceItems?: GeneratedPracticeItem[];
  onCompleteFieldGuide?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
  onStartTraining?: (intent: TrainingSessionIntent) => void;
  onChallengeGuardian?: (question: NormalizedQuestion) => void;
  onNavigatePage?: (page: RegionLearningPageId) => void;
} = {}) {
  const progress = regionProgress(options.regionId, options.progressOverrides);
  const summary = buildRegionLearningSummary({
    regionProgress: progress,
    learningRecord: options.learningRecord,
    regionQuestions: options.regionQuestions ?? [normalizedQuestion(progress.region.id)],
    regionAttempts: options.regionAttempts ?? [],
  });

  return render(
    <RegionHub
      regionProgress={progress}
      fieldGuide={getRegionFieldGuide(progress.region)}
      fieldGuideCompleted={options.fieldGuideCompleted ?? Boolean(options.learningRecord?.fieldGuideCompletedAt)}
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
  it('keeps approved visual-support registry records complete and inspectable', () => {
    expect(visualSupportSources.length).toBeGreaterThan(0);
    for (const source of visualSupportSources) {
      expect(source.id.trim(), source.id).not.toBe('');
      expect(source.title.trim(), source.id).not.toBe('');
      expect(source.purpose.trim(), source.id).not.toBe('');
      expect(source.status.trim(), source.id).not.toBe('');
      expect(source.replacementNotes.trim(), source.id).not.toBe('');
      expect(Boolean(source.regionId || source.topicIds?.length || source.skillIds?.length), source.id).toBe(true);

      if (source.status === 'temporary-online-source') {
        expect(isDisplayableVisualSupportSource(source), source.id).toBe(true);
        expect(source.imageUrl.trim(), source.id).not.toBe('');
        expect(source.sourceUrl.trim(), source.id).not.toBe('');
        expect(source.license.trim(), source.id).not.toBe('');
        expect(source.attribution.trim(), source.id).not.toBe('');
        expect(source.altText.trim(), source.id).not.toBe('');
      }
    }
  });

  it('does not treat review-required or incomplete visual-support records as displayable', () => {
    const reviewRequired: VisualSupportSource = {
      id: 'review-required-example',
      regionId: 'logarithm-grove',
      pageType: 'field-guide',
      title: 'Review required',
      purpose: 'Placeholder visual pending source review',
      imageUrl: '',
      sourceUrl: '',
      license: '',
      attribution: '',
      altText: '',
      status: 'review-required',
      replacementNotes: 'Select or create a reviewed source before display.',
    };

    expect(isDisplayableVisualSupportSource(reviewRequired)).toBe(false);
    expect(findVisualSupportSource({
      pageType: 'field-guide',
      regionId: 'logarithm-grove',
      topicIds: ['logarithms_and_exponentials'],
    })?.status).toBe('temporary-online-source');
  });

  it('renders VisualSupportCard attribution and falls back safely when an image is unavailable', () => {
    const source = visualSupportSources[0];
    const container = render(<VisualSupportCard source={source} />);

    const image = container.querySelector<HTMLImageElement>('.visual-support-card img');
    expect(image?.getAttribute('alt')).toBe(source.altText);
    expect(container.textContent).toContain(source.attribution);
    expect(container.textContent).toContain(source.license);
    expect(container.querySelector<HTMLAnchorElement>('.visual-support-attribution a')?.href).toBe(source.sourceUrl);

    act(() => {
      image!.dispatchEvent(new Event('error', { bubbles: false }));
    });

    expect(container.querySelector('.visual-support-card img')).toBeFalsy();
    expect(container.textContent).toContain('Visual preview unavailable.');
  });

  it('renders enriched snippet support with an answer-first quick check', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();

    const onLearningActivityAttempt = vi.fn();
    const container = render(
      <>
        <FieldGuidePanel
          fieldGuide={getRegionFieldGuide(logRegion!)}
          fieldGuideCompleted={false}
          theme={getRegionTheme(logRegion!)}
          teachingSnippets={[snippet]}
          onCompleteFieldGuide={vi.fn()}
        />
        <QuickChecksPanel
          teachingSnippets={[snippet]}
          region={logRegion!}
          onLearningActivityAttempt={onLearningActivityAttempt}
        />
      </>,
    );

    expect(container.textContent).toContain('Teaching snippet');
    expect(container.textContent).toContain('Key idea');
    expect(container.textContent).toContain('Small explanation');
    expect(container.textContent).toContain('Log and exponential shape reminder');
    const visual = container.querySelector<HTMLImageElement>('.visual-support-card img');
    expect(visual?.getAttribute('alt')).toBe('Graphs of logarithm functions with different bases, showing logarithmic growth shape.');
    expect(container.textContent).toContain('Richard F. Lyon');
    expect(container.textContent).toContain('Worked move');
    expect(container.textContent).toContain('What the question is asking');
    expect(container.textContent).toContain('Question type');
    expect(container.textContent).toContain('Reveal method');
    expect(container.textContent).not.toContain('Key method');
    expect(container.textContent).not.toContain('Method steps');
    expect(container.textContent).not.toContain('Exam move');
    expect(container.textContent).not.toContain('Two cubed equals eight.');
    expect(container.textContent).toContain('Watch for');
    expect(container.textContent).toContain('Next action');
    expect(container.textContent).not.toContain('Before this');
    expect(container.textContent).not.toContain('Micro steps');
    expect(container.textContent).not.toContain('Common mistakes');

    const methodButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Reveal method');
    expect(methodButton).toBeTruthy();
    expect(methodButton?.getAttribute('aria-controls')).toBe('worked-example-method-p3-log-check-example-1');
    expect(methodButton?.getAttribute('aria-expanded')).toBe('false');

    act(() => {
      methodButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Key method');
    expect(container.textContent).toContain('Method steps');
    expect(container.textContent).toContain('Keep base two.');
    expect(container.textContent).toContain('Use three as the exponent.');
    expect(container.querySelectorAll('.worked-example-stage')).toHaveLength(2);
    expect(container.textContent).toContain('Stage 1');
    expect(container.textContent).toContain('Stage 2');
    expect(container.textContent).toContain('Exam move');
    expect(container.textContent).not.toContain('Two cubed equals eight.');

    const answerButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Show final answer');
    expect(answerButton).toBeTruthy();
    expect(answerButton?.getAttribute('aria-controls')).toBe('worked-example-answer-p3-log-check-example-1');
    expect(answerButton?.getAttribute('aria-expanded')).toBe('false');

    act(() => {
      answerButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Final answer');
    expect(container.textContent).toContain('Two cubed equals eight.');
    expect(container.textContent).toContain('Next action: try the linked Quick Check without looking back at the final answer.');

    const quickCheck = container.querySelector<HTMLElement>('.quick-check-card .quick-check-reveal');
    expect(quickCheck).toBeTruthy();
    expect(quickCheck?.textContent).toContain('Quick check');
    expect(quickCheck?.textContent).toContain('Check 1 of 1');
    expect(quickCheck?.textContent).not.toContain('Next action');

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
    expect(quickCheck?.textContent).toContain('Save check');
    expect(quickCheck?.textContent).not.toContain('Next action');
    expect(quickCheck?.textContent).not.toContain('Try again');

    const gotIt = quickCheck!.querySelector<HTMLInputElement>('input[value="got_it"]');
    act(() => {
      gotIt!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const saveCheck = Array.from(quickCheck!.querySelectorAll('button')).find((button) => button.textContent === 'Save check');
    act(() => {
      saveCheck!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onLearningActivityAttempt).toHaveBeenCalledTimes(1);
    expect(quickCheck?.textContent).toContain('Next action');
    expect(quickCheck?.textContent).toContain('Try again');
  });

  it('renders generated warm-up practice as a check-first active item', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();

    const container = render(
      <WarmUpPracticePanel practiceItems={[generatedPractice]} region={logRegion!} />,
    );

    expect(container.textContent).toContain('Warm-up Practice');
    expect(container.textContent).toContain('Work through one prompt at a time.');
    expect(container.textContent).toContain('Item 1 of 1');
    expect(container.textContent).toContain('Solve ln(x) + ln(3) = ln(12).');
    expect(container.textContent).toContain('Question type');
    expect(container.textContent).toContain('Logarithm equation');
    expect(container.textContent).toContain('Key method');
    expect(container.textContent).not.toContain('x = 4');
    expect(container.textContent).not.toContain('Log and exponential shape reminder');

    const checkButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Check answer');
    expect(checkButton).toBeTruthy();
    expect(checkButton?.hasAttribute('disabled')).toBe(true);

    expect(Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Reveal solution')).toBeFalsy();
    const helpDetail = container.querySelector<HTMLDetailsElement>('.warm-up-help-detail');
    expect(helpDetail).toBeTruthy();
    expect(helpDetail?.open).toBe(false);

    const textarea = container.querySelector<HTMLTextAreaElement>('.warm-up-practice-card textarea');
    act(() => {
      setTextareaValue(textarea!, 'Combine the logs first.');
    });
    expect(checkButton?.hasAttribute('disabled')).toBe(false);
    expect(Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Reveal solution')).toBeFalsy();
    expect(container.textContent).not.toContain('Feedback');

    act(() => {
      checkButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Feedback');
    expect(container.textContent).toContain('Reveal the solution');
    const revealButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Reveal solution');
    expect(revealButton).toBeTruthy();
    expect(revealButton?.getAttribute('aria-controls')).toBe('warm-up-solution-gen_log_equation_basic_0001');
    expect(revealButton?.getAttribute('aria-expanded')).toBe('false');
    expect(revealButton?.hasAttribute('disabled')).toBe(false);
    expect(container.textContent).not.toContain('Use the product law.');
    expect(container.textContent).not.toContain('Log and exponential shape reminder');

    act(() => {
      revealButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('x = 4');
    expect(container.textContent).toContain('Use the product law.');
    expect(container.textContent).toContain('Log and exponential shape reminder');
    expect(container.querySelector<HTMLImageElement>('.warm-up-solution .visual-support-card img')?.getAttribute('alt'))
      .toBe('Graphs of logarithm functions with different bases, shown as a post-solution reminder.');
  });

  it('renders no visual support when no approved source matches the Field Guide context', () => {
    const region = P3_ASTRAL_ACADEMY.regions.find((candidate) => candidate.id === 'numerical-mines')!;
    const container = render(
      <FieldGuidePanel
        fieldGuide={getRegionFieldGuide(region)}
        fieldGuideCompleted={false}
        theme={getRegionTheme(region)}
        teachingSnippets={[{
          ...snippet,
          snippetId: 'p3-num-check',
          regionIds: ['numerical-mines'],
          topics: ['numerical_solution'],
        }]}
        onCompleteFieldGuide={vi.fn()}
      />,
    );

    expect(container.querySelector('.visual-support-card')).toBeFalsy();
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
    expect(Array.from(container.querySelectorAll('button'))[0].textContent).toBe('Check answer');
    expect(container.querySelector<HTMLDetailsElement>('.warm-up-help-detail')?.open).toBe(false);
    act(() => {
      const helpDetail = container.querySelector<HTMLDetailsElement>('.warm-up-help-detail')!;
      helpDetail.open = true;
      helpDetail.dispatchEvent(new Event('toggle', { bubbles: true }));
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

    expect(container.querySelectorAll('.teaching-snippet-card')).toHaveLength(1);
    const fieldGuideSnippet = container.querySelector('.field-guide-snippet-card');
    expect(fieldGuideSnippet?.textContent).toContain('Log snippet 1');
    expect(fieldGuideSnippet?.textContent).not.toContain('Log snippet 2');
    expect(fieldGuideSnippet?.textContent).toContain('Use Next when this idea is clear.');
    expect(container.querySelectorAll('.quick-check-card .quick-check-reveal')).toHaveLength(1);
    expect(container.textContent).toContain('Check 1 of 3');
    expect(container.textContent).toContain('Quick prompt 1');
    expect(container.textContent).not.toContain('Quick prompt 2');
    expect(container.textContent).not.toContain('Quick prompt 3');
    expect(container.querySelectorAll('.warm-up-practice-card')).toHaveLength(1);
    expect(container.querySelector('.warm-up-practice-card')?.textContent).toContain('Warm-up prompt 1');
    expect(container.querySelector('.warm-up-practice-card')?.textContent).not.toContain('Warm-up prompt 2');
    expect(container.querySelectorAll('.warm-up-sequence-list li')).toHaveLength(3);
    expect(container.textContent).toContain('2 more reviewed quick checks queued after this one.');
    expect(container.textContent).not.toContain('Showing 2 of 3 reviewed warm-ups.');

    const nextSnippet = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Next'));
    expect(nextSnippet).toBeTruthy();
    act(() => {
      nextSnippet!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(fieldGuideSnippet?.textContent).toContain('Log snippet 2');
  });

  it('advances Warm-Ups one at a time and shows a completion next action', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    const practiceItems = [practiceVariant(1), practiceVariant(2)];
    const onLearningActivityAttempt = vi.fn();
    const onContinueToExamPractice = vi.fn();
    const container = render(
      <WarmUpPracticePanel
        practiceItems={practiceItems}
        region={logRegion!}
        onLearningActivityAttempt={onLearningActivityAttempt}
        onContinueToExamPractice={onContinueToExamPractice}
      />,
    );

    expect(container.querySelectorAll('.warm-up-practice-card')).toHaveLength(1);
    expect(container.textContent).toContain('Warm-up prompt 1');
    expect(container.textContent).not.toContain('Warm-up prompt 2');

    const firstTextarea = container.querySelector<HTMLTextAreaElement>('.warm-up-practice-card textarea');
    act(() => {
      setTextareaValue(firstTextarea!, 'Warm-up answer 1');
    });
    const checkFirst = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Check answer');
    act(() => {
      checkFirst!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Your answer looks close.');
    expect(container.textContent).not.toContain('Use the product law.');

    const revealFirst = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Reveal solution');
    act(() => {
      revealFirst!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const gotItFirst = container.querySelector<HTMLInputElement>('input[value="got_it"]');
    act(() => {
      gotItFirst!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const saveFirst = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Save warm-up');
    act(() => {
      saveFirst!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Next warm-up');
    act(() => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Next warm-up')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelectorAll('.warm-up-practice-card')).toHaveLength(1);
    expect(container.textContent).toContain('Warm-up prompt 2');
    expect(container.textContent).not.toContain('Warm-up prompt 1');

    const secondTextarea = container.querySelector<HTMLTextAreaElement>('.warm-up-practice-card textarea');
    act(() => {
      setTextareaValue(secondTextarea!, 'Warm-up answer 2');
    });
    act(() => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Check answer')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Reveal solution')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const gotItSecond = container.querySelector<HTMLInputElement>('input[value="got_it"]');
    act(() => {
      gotItSecond!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Save warm-up')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Warm-up sequence complete');
    const continueExam = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Continue to Exam Training');
    expect(continueExam).toBeTruthy();
    act(() => {
      continueExam!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onContinueToExamPractice).toHaveBeenCalledTimes(1);
    expect(onLearningActivityAttempt).toHaveBeenCalledTimes(2);
  });

  it('advances Quick Checks one at a time after saving answer feedback', () => {
    const snippets = [snippetVariant(1), snippetVariant(2), snippetVariant(3)];
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    const onLearningActivityAttempt = vi.fn();
    const container = render(
      <QuickChecksPanel
        teachingSnippets={snippets}
        region={logRegion!}
        onLearningActivityAttempt={onLearningActivityAttempt}
      />,
    );

    expect(container.querySelectorAll('.quick-check-card .quick-check-reveal')).toHaveLength(1);
    expect(container.textContent).toContain('Quick prompt 1');
    expect(container.textContent).toContain('Check 1 of 3');
    expect(container.textContent).not.toContain('Quick prompt 2');
    expect(container.textContent).not.toContain('Quick prompt 3');

    const check = container.querySelector<HTMLElement>('.quick-check-reveal');
    const checkAnswerButton = Array.from(check!.querySelectorAll('button')).find((button) => button.textContent === 'Check answer');
    expect(checkAnswerButton?.hasAttribute('disabled')).toBe(true);

    const textarea = check!.querySelector<HTMLTextAreaElement>('textarea');
    act(() => {
      setTextareaValue(textarea!, 'answer attempt');
    });
    expect(checkAnswerButton?.hasAttribute('disabled')).toBe(false);

    act(() => {
      checkAnswerButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Feedback');
    expect(container.textContent).toContain('Quick answer 1');
    expect(container.textContent).toContain('Save check');
    expect(container.textContent).not.toContain('Next action');
    expect(container.textContent).not.toContain('Next check');
    expect(container.querySelectorAll('.quick-check-card .quick-check-reveal')).toHaveLength(1);

    const gotIt = container.querySelector<HTMLInputElement>('input[value="got_it"]');
    act(() => {
      gotIt!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const saveCheck = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Save check');
    act(() => {
      saveCheck!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onLearningActivityAttempt).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Next action');
    expect(container.textContent).toContain('Next check');

    const nextCheckButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Next check');
    act(() => {
      nextCheckButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelectorAll('.quick-check-card .quick-check-reveal')).toHaveLength(1);
    expect(container.textContent).toContain('Quick prompt 2');
    expect(container.textContent).toContain('Check 2 of 3');
    expect(container.textContent).not.toContain('Quick prompt 1');
    expect(container.textContent).not.toContain('Quick prompt 3');
    expect(container.textContent).not.toContain('Feedback');
  });

  it('keeps the focused region Quick Checks page from dumping multiple checks open', () => {
    const container = renderRegionHubPage({
      activePage: 'quick-check',
      snippets: [snippetVariant(1), snippetVariant(2), snippetVariant(3)],
    });

    expect(container.textContent).toContain('Quick Checks');
    expect(container.querySelectorAll('.quick-check-card .quick-check-reveal')).toHaveLength(1);
    expect(container.textContent).toContain('Quick prompt 1');
    expect(container.textContent).toContain('Check 1 of 3');
    expect(container.textContent).not.toContain('Quick prompt 2');
    expect(container.textContent).not.toContain('Quick prompt 3');
  });

  it('keeps dense reviewed snippets collapsed into one primary teaching chunk', () => {
    const denseSnippet: TeachingSnippet = {
      ...snippet,
      snippetId: 'p3-log-dense',
      prerequisites: ['Know index notation.', 'Know inverse operations.'],
      microSteps: ['Circle the base.', 'Name the exponent.', 'Rewrite the statement.'],
      commonMistakes: [
        'Treating the argument as the exponent.',
        'Dropping the base during conversion.',
      ],
      workedExamples: [
        snippet.workedExamples[0],
        {
          ...snippet.workedExamples[0],
          id: 'p3-log-check-example-2',
          prompt: 'Rewrite log base three of twenty seven equals three.',
          answer: 'Three cubed equals twenty seven.',
        },
      ],
    };

    const container = render(
      <FieldGuidePanel
        fieldGuide={getRegionFieldGuide(P3_ASTRAL_ACADEMY.regions[0])}
        fieldGuideCompleted={false}
        theme={getRegionTheme(P3_ASTRAL_ACADEMY.regions[0])}
        teachingSnippets={[denseSnippet, snippetVariant(2)]}
        onCompleteFieldGuide={vi.fn()}
      />,
    );

    const activeSnippet = container.querySelector<HTMLElement>('.field-guide-snippet-card');
    expect(activeSnippet).toBeTruthy();
    expect(container.querySelectorAll('.field-guide-snippet-card')).toHaveLength(1);
    expect(container.querySelectorAll('.worked-example-card')).toHaveLength(1);
    expect(activeSnippet?.textContent).toContain('Rewrite \\log base two of eight equals three.');
    expect(activeSnippet?.textContent).toContain('Reveal method');
    expect(activeSnippet?.textContent).not.toContain('Two cubed equals eight.');
    expect(activeSnippet?.textContent).not.toContain('Three cubed equals twenty seven.');
    expect(activeSnippet?.textContent).toContain('Treating the argument as the exponent.');
    expect(activeSnippet?.textContent).not.toContain('Dropping the base during conversion.');
    expect(activeSnippet?.textContent).not.toContain('Know inverse operations.');
    expect(activeSnippet?.textContent).toContain('Use Next when this idea is clear.');
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('Next'))).toBe(true);

    const revealMethod = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Reveal method');
    act(() => {
      revealMethod!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(activeSnippet?.textContent).toContain('Keep base two.');
    expect(activeSnippet?.textContent).not.toContain('Two cubed equals eight.');

    const showAnswer = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Show final answer');
    act(() => {
      showAnswer!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(activeSnippet?.textContent).toContain('Two cubed equals eight.');

    const nextSnippet = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Next'));
    act(() => {
      nextSnippet!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(activeSnippet?.textContent).toContain('Log snippet 2');
    expect(activeSnippet?.textContent).toContain('Reveal method');
    expect(activeSnippet?.textContent).not.toContain('Show final answer');
    expect(activeSnippet?.textContent).not.toContain('Two cubed equals eight.');
  });

  it('renders the Algebra Vault region hub as a click-first homepage', () => {
    const onNavigatePage = vi.fn<(page: RegionLearningPageId) => void>();
    const container = renderRegionHubPage({
      regionId: 'algebra-forge',
      onNavigatePage,
    });

    expect(container.querySelector('.region-home')).toBeTruthy();
    expect(container.textContent).toContain('P3 Region');
    expect(container.querySelector('#region-hub-title')?.textContent).toBe('Algebra Vault');
    expect(container.textContent).toContain('A guarded vault for expansions, factors, remainders, and locked algebraic forms.');

    const stats = container.querySelector('.region-home-stats');
    expect(stats).toBeTruthy();
    expect(stats?.textContent).toContain('Rank');
    expect(stats?.textContent).toContain('Attempts');
    expect(stats?.textContent).toContain('Average');
    expect(stats?.textContent).toContain('Guardian');
    expect(stats?.textContent).toContain('Locked');

    const artwork = container.querySelector('.region-home-artwork');
    expect(artwork).toBeTruthy();
    expect(artwork?.getAttribute('aria-label')).toBe('Algebra Vault region artwork');
    const artworkImage = artwork?.querySelector<HTMLImageElement>('.region-home-artwork-image');
    expect(artworkImage).toBeTruthy();
    expect(artworkImage?.getAttribute('src')).toBe('/assets/region-art/algebra-region-hub.png');
    expect(artwork?.textContent).not.toContain('placeholder');

    const primaryAction = container.querySelector<HTMLButtonElement>('.region-home-primary-action');
    expect(primaryAction).toBeTruthy();
    expect(primaryAction?.dataset.regionPage).toBe('field-guide');
    expect(primaryAction?.textContent).toContain('Current step');
    expect(primaryAction?.textContent).toContain('Field Guide');
    expect(primaryAction?.textContent).toContain('Read the Field Guide');
    expect(primaryAction?.textContent).toContain('Start with the region guide');
    expect(primaryAction?.textContent).toContain('Ready');

    const secondaryRoutes = container.querySelector<HTMLDetailsElement>('.region-home-secondary-routes');
    expect(secondaryRoutes).toBeTruthy();
    expect(secondaryRoutes?.open).toBe(false);
    expect(secondaryRoutes?.querySelector('summary')?.textContent).toContain('Other routes');
    expect(secondaryRoutes?.querySelector('summary')?.textContent).toContain('Choose another path');

    const secondaryActions = Array.from(container.querySelectorAll<HTMLButtonElement>('.region-home-secondary-step'));
    expect(secondaryActions).toHaveLength(4);
    expect(secondaryActions.map((button) => button.dataset.regionPage)).toEqual([
      'quick-check',
      'warm-up',
      'exam-training',
      'guardian',
    ]);
    act(() => {
      secondaryRoutes!.open = true;
      secondaryRoutes!.dispatchEvent(new Event('toggle', { bubbles: true }));
    });
    expect(secondaryRoutes?.open).toBe(true);
    const allActionPages = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-region-page]'))
      .map((button) => button.dataset.regionPage);
    expect(allActionPages).toEqual([
      'field-guide',
      'quick-check',
      'warm-up',
      'exam-training',
      'guardian',
    ]);
    expect(new Set(allActionPages).size).toBe(allActionPages.length);
    expect(container.textContent).toContain('Field Guide');
    expect(container.querySelectorAll('.region-home-primary-action')).toHaveLength(1);
    expect(container.querySelector('.region-home-primary-action')?.textContent).not.toContain('Quick Checks');
    expect(container.textContent).toContain('Quick Checks');
    expect(container.textContent).toContain('Check one skill');
    expect(container.textContent).toContain('Warm-Up Practice');
    expect(container.textContent).toContain('Build fluency');
    expect(container.textContent).toContain('Exam Training');
    expect(container.textContent).toContain('Practice real questions');
    expect(container.textContent).toContain('Guardian Challenge');
    expect(container.textContent).toContain('Prove mastery');

    expect(container.querySelector('.region-learning-nav')).toBeFalsy();
    expect(container.querySelector('.region-arc-timeline')).toBeFalsy();
    expect(container.querySelector('.region-summary-band')).toBeFalsy();
    expect(container.querySelector('.region-hub-overview-card')).toBeFalsy();
    expect(container.textContent).not.toContain('Skill and subtopic overview');
    expect(container.querySelector('.field-guide-card')).toBeFalsy();
    expect(container.querySelector('.quick-check-card')).toBeFalsy();
    expect(container.querySelector('.warm-up-card')).toBeFalsy();
    expect(container.querySelector('.training-card')).toBeFalsy();
    expect(container.querySelector('.guardian-card')).toBeFalsy();
    expect(container.querySelector('.quick-check-reveal')).toBeFalsy();
    expect(container.querySelector('.warm-up-practice-card')).toBeFalsy();
    expect(container.querySelector('.field-guide-snippet-card')).toBeFalsy();

    const guardianCard = secondaryActions.find((button) => button.dataset.regionPage === 'guardian');
    expect(guardianCard?.disabled).toBe(true);
    act(() => {
      guardianCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onNavigatePage).not.toHaveBeenCalled();
  });

  it('wires available region hub art files with the established naming convention', () => {
    const expectedArt: Record<string, string> = {
      'algebra-forge': '/assets/region-art/algebra-region-hub.png',
      'calculus-cliffs': '/assets/region-art/calc-region-hub.png',
      'complex-harbor': '/assets/region-art/argand-region-hub.png',
      'differential-shrine': '/assets/region-art/differential-region-hub.png',
      'integration-gardens': '/assets/region-art/integral-region-hub.png',
      'logarithm-grove': '/assets/region-art/log-region-hub.png',
      'numerical-mines': '/assets/region-art/iteration-region-hub.png',
      'trig-observatory': '/assets/region-art/trig-region-hub.png',
      'vector-workshop': '/assets/region-art/vectors-region-hub.png',
    };

    for (const [regionId, src] of Object.entries(expectedArt)) {
      const container = renderRegionHubPage({ regionId });
      expect(container.querySelector<HTMLImageElement>('.region-home-artwork-image')?.getAttribute('src')).toBe(src);
    }
  });

  it('routes each unlocked hub action to the existing focused region page', () => {
    const onNavigatePage = vi.fn<(page: RegionLearningPageId) => void>();
    const learningRecord: RegionLearningRecord = {
      regionId: 'algebra-forge',
      fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    };
    const container = renderRegionHubPage({
      regionId: 'algebra-forge',
      fieldGuideCompleted: true,
      learningRecord,
      progressOverrides: {
        attempts: 3,
        totalMarksEarned: 15,
        totalMarksAvailable: 18,
        averageScoreRatio: 15 / 18,
        subtopicsTouched: 1,
        rank: 'Bronze',
      },
      regionAttempts: [regionAttempt(1), regionAttempt(2), regionAttempt(3)],
      onNavigatePage,
    });

    const actionButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-region-page]'));
    expect(actionButtons).toHaveLength(5);
    expect(container.querySelectorAll('.region-home-primary-action')).toHaveLength(1);
    const secondaryRoutes = container.querySelector<HTMLDetailsElement>('.region-home-secondary-routes');
    expect(secondaryRoutes?.open).toBe(false);
    act(() => {
      secondaryRoutes!.open = true;
      secondaryRoutes!.dispatchEvent(new Event('toggle', { bubbles: true }));
    });
    expect(actionButtons.find((button) => button.dataset.regionPage === 'guardian')?.disabled).toBe(false);

    for (const page of ['field-guide', 'quick-check', 'warm-up', 'exam-training', 'guardian']) {
      const button = actionButtons.find((candidate) => candidate.dataset.regionPage === page);
      expect(button).toBeTruthy();
      act(() => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    }

    expect(onNavigatePage.mock.calls.map(([page]) => page)).toEqual([
      'field-guide',
      'quick-check',
      'warm-up',
      'exam-training',
      'guardian',
    ]);
  });

  it('renders each focused region page with its preserved panel behavior', () => {
    const fieldGuidePage = renderRegionHubPage({ activePage: 'field-guide' });
    expect(fieldGuidePage.textContent).toContain('Field Guide');
    expect(fieldGuidePage.textContent).toContain('Logarithm Observatory');
    expect(fieldGuidePage.textContent).toContain('Logarithms are the inverse language of exponentials.');
    expect(fieldGuidePage.querySelector('.focused-region-page-header')).toBeTruthy();
    expect(fieldGuidePage.querySelector('.region-learning-navigation-block')).toBeFalsy();
    expect(fieldGuidePage.querySelector('.region-arc-timeline')).toBeFalsy();
    expect(fieldGuidePage.querySelector('.region-learning-nav')).toBeTruthy();
    expect(fieldGuidePage.querySelector('.region-learning-nav button.active')?.textContent).toBe('Field Guide');
    expect(fieldGuidePage.textContent).toContain('Back to Region Hub');
    expect(fieldGuidePage.querySelector('.field-guide-card')).toBeTruthy();
    expect(fieldGuidePage.querySelector('.quick-check-card')).toBeFalsy();

    const quickCheckPage = renderRegionHubPage({ activePage: 'quick-check' });
    expect(quickCheckPage.textContent).toContain('Quick Checks');
    expect(quickCheckPage.textContent).toContain('Rewrite \\log base two of eight equals three.');
    expect(quickCheckPage.querySelector('.quick-check-card .quick-check-reveal')).toBeTruthy();
    expect(quickCheckPage.querySelector('.field-guide-card')).toBeFalsy();
    expect(quickCheckPage.querySelector<HTMLTextAreaElement>('.quick-check-card textarea')?.placeholder).toBe('Use exact form if needed, e.g. 3/2 or sqrt(5)');

    const warmUpPage = renderRegionHubPage({ activePage: 'warm-up' });
    expect(warmUpPage.textContent).toContain('Warm-up Practice');
    expect(warmUpPage.textContent).toContain('Solve ln(x) + ln(3) = ln(12).');
    expect(warmUpPage.querySelector('.warm-up-practice-card')).toBeTruthy();
    expect(warmUpPage.querySelector<HTMLTextAreaElement>('.warm-up-practice-card textarea')?.placeholder).toBe('For equations, include the variable, e.g. y = 2x + 1');

    const examTrainingPage = renderRegionHubPage({ activePage: 'exam-training' });
    expect(examTrainingPage.textContent).toContain('Exam Training');
    expect(examTrainingPage.textContent).toContain('Recommended session');
    expect(examTrainingPage.querySelector('.training-card')).toBeTruthy();
    expect(examTrainingPage.querySelector('.region-hero')).toBeFalsy();
    expect(examTrainingPage.querySelector('.region-summary-band')).toBeFalsy();
    expect(examTrainingPage.querySelector('.region-arc-timeline')).toBeFalsy();

    const guardianPage = renderRegionHubPage({ activePage: 'guardian' });
    expect(guardianPage.textContent).toContain('Guardian Challenge');
    expect(guardianPage.textContent).toContain('Guardian not ready yet');
    expect(guardianPage.querySelector('.guardian-card')).toBeTruthy();
  });

  it('shows one primary recommended Training Grounds action and hides alternatives until expanded', () => {
    const onStartTraining = vi.fn<(intent: TrainingSessionIntent) => void>();
    const progress = regionProgress('algebra-forge', {
      attempts: 2,
      totalMarksEarned: 7,
      totalMarksAvailable: 12,
      averageScoreRatio: 7 / 12,
    });
    const summary = buildRegionLearningSummary({
      regionProgress: progress,
      learningRecord: {
        regionId: progress.region.id,
        fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
        updatedAt: '2026-05-08T00:00:00.000Z',
      },
      regionQuestions: [normalizedQuestion(progress.region.id)],
      regionAttempts: [regionAttempt(1), regionAttempt(2)],
    });
    const container = render(
      <TrainingGroundsPanel canTrain summary={summary} onStartTraining={onStartTraining} />,
    );

    const primaryStart = container.querySelector<HTMLButtonElement>('.training-primary-start');
    expect(primaryStart).toBeTruthy();
    expect(container.querySelectorAll('.training-primary-start')).toHaveLength(1);
    expect(container.querySelector('.training-alternatives-detail:not([open]) .training-intent-grid')).toBeTruthy();

    act(() => {
      primaryStart!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onStartTraining).toHaveBeenCalledWith(summary.trainingSession.intent);

    const alternatives = container.querySelector<HTMLDetailsElement>('.training-alternatives-detail');
    act(() => {
      alternatives!.open = true;
      alternatives!.dispatchEvent(new Event('toggle', { bubbles: true }));
    });

    const alternateButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.training-alternatives-detail button'));
    expect(alternateButtons).toHaveLength(3);
    act(() => {
      alternateButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const lastIntent = onStartTraining.mock.calls[onStartTraining.mock.calls.length - 1]?.[0];
    expect(lastIntent).toBeTruthy();
    expect(lastIntent).not.toBe(summary.trainingSession.intent);
  });

  it('renders Algebra Vault Field Guide as a one-snippet stepper using existing snippets', () => {
    const snippets = realSnippetsForRegion('algebra-forge');
    expect(snippets.length).toBeGreaterThan(1);
    expect(snippets[0].title).toBe('Rearrange before expanding');

    const onCompleteFieldGuide = vi.fn();
    const onNavigatePage = vi.fn<(page: RegionLearningPageId) => void>();
    const container = renderRegionHubPage({
      activePage: 'field-guide',
      regionId: 'algebra-forge',
      snippets,
      onCompleteFieldGuide,
      onNavigatePage,
    });

    expect(container.querySelector('.focused-region-page-header')).toBeTruthy();
    expect(container.querySelector('.field-guide-compact-stats')).toBeFalsy();

    expect(container.querySelector('.region-hero')).toBeFalsy();
    expect(container.querySelector('.region-summary-band')).toBeFalsy();
    expect(container.querySelector('.region-learning-navigation-block')).toBeFalsy();
    expect(container.querySelector('.region-arc-timeline')).toBeFalsy();
    expect(container.querySelector('.region-home-actions')).toBeFalsy();
    expect(container.querySelector('.region-learning-nav')).toBeTruthy();
    expect(container.querySelector('.region-learning-nav button.active')?.textContent).toBe('Field Guide');
    expect(container.textContent).not.toContain('Choose one focused step');
    expect(container.textContent).not.toContain('Skill and subtopic overview');

    let activeSnippet = container.querySelector<HTMLElement>('.field-guide-snippet-card');
    expect(activeSnippet).toBeTruthy();
    expect(container.querySelectorAll('.field-guide-snippet-card')).toHaveLength(1);
    expect(activeSnippet?.textContent).toContain('Snippet 1 of');
    expect(activeSnippet?.textContent).toContain('Rearrange before expanding');
    expect(activeSnippet?.textContent).not.toContain(snippets[1].title);
    expect(container.querySelector('details')).toBeFalsy();

    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('Previous'))).toBe(false);
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('Continue to Quick Checks'))).toBe(false);
    const next = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Next'));
    expect(next).toBeTruthy();

    act(() => {
      next!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    activeSnippet = container.querySelector<HTMLElement>('.field-guide-snippet-card');
    expect(activeSnippet?.textContent).toContain(snippets[1].title);
    expect(activeSnippet?.textContent).not.toContain('Rearrange before expanding');
    expect(onCompleteFieldGuide).not.toHaveBeenCalled();

    const previous = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Previous'));
    expect(previous).toBeTruthy();
    act(() => {
      previous!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    activeSnippet = container.querySelector<HTMLElement>('.field-guide-snippet-card');
    expect(activeSnippet?.textContent).toContain('Rearrange before expanding');
    expect(onCompleteFieldGuide).not.toHaveBeenCalled();

    for (let index = 1; index < snippets.length; index += 1) {
      const nextButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Next'));
      expect(nextButton).toBeTruthy();
      act(() => {
        nextButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    }

    expect(container.querySelector<HTMLElement>('.field-guide-snippet-card')?.textContent).toContain(`Snippet ${snippets.length} of ${snippets.length}`);
    const continueButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Continue to Quick Checks'));
    expect(continueButton).toBeTruthy();
    act(() => {
      continueButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onCompleteFieldGuide).toHaveBeenCalledTimes(1);
    expect(onNavigatePage).toHaveBeenCalledWith('quick-check');
  });

  it('shows a safe Field Guide empty state without creating reading progress', () => {
    const onCompleteFieldGuide = vi.fn();
    const onNavigatePage = vi.fn<(page: RegionLearningPageId) => void>();
    const container = renderRegionHubPage({
      activePage: 'field-guide',
      snippets: [],
      onCompleteFieldGuide,
      onNavigatePage,
    });

    expect(container.textContent).toContain('Field Guide content for this region is still being prepared.');
    expect(container.querySelector('.field-guide-snippet-card')).toBeFalsy();
    expect(container.textContent).not.toContain('Continue to Quick Checks');
    expect(onCompleteFieldGuide).not.toHaveBeenCalled();

    const back = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Back to Region Hub');
    expect(back).toBeTruthy();
    act(() => {
      back!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onNavigatePage).toHaveBeenCalledWith('hub');
    expect(onCompleteFieldGuide).not.toHaveBeenCalled();
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
      onCompleteFieldGuide,
      onLearningActivityAttempt,
    });
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

  it('keeps heavy region summary scaffolding off focused learning pages', () => {
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
        activePage="quick-check"
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

    expect(summaryBand).toBeFalsy();
    expect(learningContent).toBeTruthy();
    expect(container.querySelector('.focused-region-page-header')).toBeTruthy();
    expect(container.querySelector('.region-arc-timeline')).toBeFalsy();
  });

  it('does not render full phase timeline on focused pages', () => {
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
        activePage="quick-check"
        onCompleteFieldGuide={vi.fn()}
        onLearningActivityAttempt={vi.fn()}
        onStartTraining={vi.fn()}
        onChallengeGuardian={vi.fn()}
        onNavigatePage={vi.fn()}
        onReturnToMap={vi.fn()}
      />,
    );

    expect(container.querySelectorAll('.region-arc-timeline .arc-phase')).toHaveLength(0);
  });

  it('keeps region summary cards equal-height and focused navigation compact in CSS', () => {
    expect(stylesCss).toMatch(/\.region-summary-band\s*\{[\s\S]*?align-items:\s*stretch;/);
    expect(stylesCss).toMatch(/\.region-summary-band\s*>\s*\.region-next-action,\s*[\r\n\s]*\.region-summary-band\s*>\s*\.region-progress-strip\s*\{[\s\S]*?height:\s*100%;[\s\S]*?margin-bottom:\s*0;/);
    expect(stylesCss).toMatch(/\.focused-region-page-header\s*\{[\s\S]*?display:\s*flex;/);
    expect(stylesCss).toMatch(/\.focused-region-next-step\s*\{[\s\S]*?border-radius:\s*999px;/);
    expect(stylesCss).toContain('.arc-phase-1');
    expect(stylesCss).toContain('.arc-phase-5');
    expect(stylesCss).toMatch(/\.arc-phase-1\s*\{[\s\S]*?var\(--region-accent[^)]*\)\s*5%/);
    expect(stylesCss).toMatch(/\.arc-phase-5\s*\{[\s\S]*?var\(--region-accent[^)]*\)\s*17%/);
  });

  it('lets the Field Guide snippet card span the focused page width', () => {
    expect(stylesCss).toMatch(/\.region-page-field-guide\s+\.field-guide-card\s*\{[\s\S]*?width:\s*100%;/);
  });

  it('renders RegionProgressStrip as compact current, evidence, and Guardian indicators', () => {
    const progress = regionProgress('logarithm-grove', {
      attempts: 2,
      totalMarksEarned: 8,
      totalMarksAvailable: 10,
      averageScoreRatio: 0.8,
      subtopicsTouched: 1,
    });
    const summary = buildRegionLearningSummary({
      regionProgress: progress,
      learningRecord: undefined,
      regionQuestions: [normalizedQuestion(progress.region.id)],
      regionAttempts: [regionAttempt(1), regionAttempt(2)],
    });
    const container = render(<RegionProgressStrip regionProgress={progress} summary={summary} />);

    expect(container.textContent).toContain('Current step');
    expect(container.textContent).toContain('Evidence now');
    expect(container.textContent).toContain('Guardian');
    expect(container.textContent).toContain('2 attempts');
    expect(container.textContent).not.toContain('Rank');
    expect(container.textContent).not.toContain('Subtopics');
    expect(container.querySelectorAll('.region-progress-step')).toHaveLength(3);
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

  it('routes teaching-snippet worked-example inline and block math through KaTeX', async () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();

    const container = render(
      <FieldGuidePanel
        fieldGuide={getRegionFieldGuide(logRegion!)}
        fieldGuideCompleted={false}
        theme={getRegionTheme(logRegion!)}
        teachingSnippets={[snippetWithMathWorkedExample()]}
        onCompleteFieldGuide={vi.fn()}
      />,
    );
    const revealMethod = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Reveal method');
    act(() => {
      revealMethod!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const showAnswer = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Show final answer');
    act(() => {
      showAnswer!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await waitForKatex(container, 6);

    const combineLogsCard = Array.from(container.querySelectorAll<HTMLElement>('.worked-example-card'))
      .find((card) => card.textContent?.includes('Combine logs'));
    expect(combineLogsCard).toBeTruthy();
    expect(combineLogsCard?.querySelector('.math-text:not(.math-display) .katex')).toBeTruthy();
    expect(combineLogsCard?.querySelector('.math-display .katex')).toBeTruthy();
    expect(combineLogsCard?.textContent).not.toContain('$$');
  });

  it('renders teaching-snippet worked examples with P3 notation as math instead of raw fragments', async () => {
    const container = render(
      <FieldGuidePanel
        fieldGuide={getRegionFieldGuide(P3_ASTRAL_ACADEMY.regions[0])}
        fieldGuideCompleted={false}
        theme={getRegionTheme(P3_ASTRAL_ACADEMY.regions[0])}
        teachingSnippets={[snippetWithMathWorkedExample()]}
        onCompleteFieldGuide={vi.fn()}
      />,
    );
    const revealMethod = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Reveal method');
    act(() => {
      revealMethod!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const showAnswer = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Show final answer');
    act(() => {
      showAnswer!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await waitForKatex(container, 6);

    expect(container.querySelectorAll('.worked-example-card .katex').length).toBeGreaterThan(5);
    expect(container.querySelectorAll('.worked-example-card .math-display .katex').length).toBeGreaterThan(2);
    expect(container.querySelector('.worked-example-card .mfrac')).toBeTruthy();
    expect(container.innerHTML).toContain('katex-display');
    expect(container.textContent).not.toContain('$$');
  });

  it('does not force every worked-example span to block layout', () => {
    expect(stylesCss).not.toMatch(/\.worked-example-card\s+span\s*\{/);
    expect(stylesCss).not.toMatch(/\.worked-example-card\s+strong,\s*[\r\n\s]*\.worked-example-card\s+span/);
  });
});
