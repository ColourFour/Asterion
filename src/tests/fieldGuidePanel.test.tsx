import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FIELD_GUIDE_TOPICS_BY_REGION,
  REQUIRED_FIELD_GUIDE_SKILL_IDS,
  fieldGuideSkillCoverage,
} from '../data/fieldGuideTopics';
import { ITERATION_FORGE_TOPIC_ORDER } from '../data/iterationForgeContent';
import { LOGARITHM_OBSERVATORY_TOPIC_ORDER } from '../data/logarithmObservatoryContent';
import { TRIGONOMETRY_SPIRE_TOPIC_ORDER } from '../data/trigonometrySpireContent';
import { getRegionFieldGuide } from '../data/regionFieldGuides';
import { GUARDIAN_PLACEHOLDER_WARNING, guardianChallenges } from '../data/guardianChallenges';
import {
  findVisualSupportSource,
  fieldGuideVisualSupportNeeds,
  isDisplayableVisualSupportSource,
  visualSupportSources,
  type VisualSupportSource,
} from '../data/visualSupportSources';
import { buildRegionLearningSummary } from '../lib/regionLearning';
import type { GeneratedPracticeItem } from '../lib/generatedPractice';
import { regionHubAssets } from '../lib/regionAssets';
import { getRegionTheme } from '../lib/regionThemes';
import type { StudentRegionAccess } from '../lib/classRegionAccess';
import {
  REGION_LEARNING_PAGE_LABELS,
  REGION_LEARNING_PAGE_DESCRIPTIONS,
  parseAsterionHashRoute,
  regionHashPath,
  type RegionLearningPageId,
} from '../lib/regionRoutes';
import { getTeachingSnippetsForRegion, normalizeTeachingSnippetsData, type TeachingSnippet } from '../lib/teachingSnippets';
import type { Attempt, LearningActivityAttempt, NormalizedQuestion, RegionLearningRecord, RegionProgress, TrainingSessionIntent } from '../types';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import { RegionHub } from '../components/world/RegionHub';
import { FieldGuidePanel } from '../components/world/regionHub/FieldGuidePanel';
import { GuardianChallengePanel } from '../components/world/regionHub/GuardianChallengePanel';
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

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
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
  skillTargetId: 'p3_log_laws_equations',
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
  sequenceRole: 'first_step',
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

function supportActivityAttempt(activityType: LearningActivityAttempt['activityType'], id = activityType): LearningActivityAttempt {
  return {
    id,
    profileId: 'profile-1',
    regionId: 'logarithm-grove',
    regionName: 'Logarithm Grove',
    activityType,
    activityId: id,
    prompt: activityType === 'quick_check' ? 'Quick Check prompt.' : 'Warm-up prompt.',
    learnerResponse: 'Learner response.',
    revealedEarly: false,
    outcome: 'got_it',
    confidence: 4,
    createdAt: '2026-05-08T00:00:00.000Z',
    completedAt: '2026-05-08T00:01:00.000Z',
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
  learningActivityAttempts?: LearningActivityAttempt[];
  onCompleteFieldGuide?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
  onStartTraining?: (intent: TrainingSessionIntent) => void;
  onChallengeGuardian?: (question: NormalizedQuestion) => void;
  onNavigatePage?: (page: RegionLearningPageId) => void;
  studentRegionAccess?: StudentRegionAccess;
} = {}) {
  const progress = regionProgress(options.regionId, options.progressOverrides);
  const summary = buildRegionLearningSummary({
    regionProgress: progress,
    learningRecord: options.learningRecord,
    regionQuestions: options.regionQuestions ?? [normalizedQuestion(progress.region.id)],
    regionAttempts: options.regionAttempts ?? [],
    learningActivityAttempts: options.learningActivityAttempts,
  });

  return render(
    <RegionHub
      regionProgress={progress}
      fieldGuide={getRegionFieldGuide(progress.region)}
      fieldGuideCompleted={options.fieldGuideCompleted ?? Boolean(options.learningRecord?.fieldGuideCompletedAt)}
      teachingSnippets={options.snippets ?? [snippet]}
      generatedPractice={options.practiceItems ?? [generatedPractice]}
      learningActivityAttempts={options.learningActivityAttempts ?? []}
      summary={summary}
      studentRegionAccess={options.studentRegionAccess}
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

const lockedStudentRegionAccess: StudentRegionAccess = {
  regionId: 'logarithm-grove',
  access: 'field_guide_only',
  classroomControlled: true,
};

const openStudentRegionAccess: StudentRegionAccess = {
  regionId: 'logarithm-grove',
  access: 'open',
  classroomControlled: true,
};

describe('FieldGuidePanel teaching snippets', () => {
  it('represents every required Field Guide skill exactly once in topic metadata', () => {
    const coverage = fieldGuideSkillCoverage();
    const expectedSkills = [...REQUIRED_FIELD_GUIDE_SKILL_IDS].sort();
    const actualSkills = [...coverage.keys()].sort();

    expect(actualSkills).toEqual(expectedSkills);
    for (const skillId of REQUIRED_FIELD_GUIDE_SKILL_IDS) {
      expect(coverage.get(skillId), skillId).toHaveLength(1);
    }
  });

  it('keeps every topic card backed by required display fields, skill IDs, and lesson content', () => {
    for (const [regionId, topics] of Object.entries(FIELD_GUIDE_TOPICS_BY_REGION)) {
      expect(topics.length, regionId).toBeGreaterThan(0);
      const topicIds = new Set<string>();
      for (const topic of topics) {
        expect(topic.id.trim(), `${regionId}/${topic.id}`).not.toBe('');
        expect(topicIds.has(topic.id), `${regionId}/${topic.id}`).toBe(false);
        topicIds.add(topic.id);
        expect(topic.marker.trim(), `${regionId}/${topic.id}`).not.toBe('');
        expect(topic.title.trim(), `${regionId}/${topic.id}`).not.toBe('');
        expect(topic.purpose.trim(), `${regionId}/${topic.id}`).not.toBe('');
        expect(topic.preview.trim(), `${regionId}/${topic.id}`).not.toBe('');
        expect(topic.description.trim(), `${regionId}/${topic.id}`).not.toBe('');
        expect(topic.skillIds.length, `${regionId}/${topic.id}`).toBeGreaterThan(0);
        expect(topic.examples.length, `${regionId}/${topic.id}`).toBeGreaterThan(0);

        const example = topic.examples[0];
        expect(example?.title.trim(), `${regionId}/${topic.id}`).not.toBe('');
        expect(example?.prompt.trim(), `${regionId}/${topic.id}`).not.toBe('');
        expect(example?.workedLines.length, `${regionId}/${topic.id}`).toBeGreaterThan(0);
        expect(example?.patternRows.length, `${regionId}/${topic.id}`).toBeGreaterThan(0);
        expect(example?.tryPrompt.trim(), `${regionId}/${topic.id}`).not.toBe('');
        expect(example?.tryScaffold.length, `${regionId}/${topic.id}`).toBeGreaterThan(0);
        expect(example?.takeaway.length, `${regionId}/${topic.id}`).toBeGreaterThan(0);
        expect(example?.result.trim(), `${regionId}/${topic.id}`).not.toBe('');
      }
    }
  });

  it('keeps approved visual-support registry records complete and inspectable', () => {
    expect(visualSupportSources.length).toBeGreaterThan(0);
    for (const source of visualSupportSources) {
      expect(source.id.trim(), source.id).not.toBe('');
      expect(source.title.trim(), source.id).not.toBe('');
      expect(source.purpose.trim(), source.id).not.toBe('');
      expect(['mini_diagram', 'method_pattern', 'none', 'needs_visual']).toContain(source.visualKind);
      expect(source.status.trim(), source.id).not.toBe('');
      expect(source.replacementNotes.trim(), source.id).not.toBe('');
      expect(Boolean(source.regionId || source.topicIds?.length || source.skillIds?.length), source.id).toBe(true);

      if (source.status === 'approved' || source.status === 'temporary-online-source') {
        expect(['mini_diagram', 'method_pattern']).toContain(source.visualKind);
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
      visualKind: 'needs_visual',
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
    })?.status).toBe('approved');
  });

  it('keeps every P3 region covered by at least one approved displayable visual support', () => {
    for (const region of P3_ASTRAL_ACADEMY.regions) {
      const displayableRegionSources = visualSupportSources.filter((source) => (
        source.regionId === region.id
        && source.status === 'approved'
        && isDisplayableVisualSupportSource(source)
      ));

      if (region.id === 'numerical-mines') {
        expect(displayableRegionSources.length, region.name).toBe(0);
        continue;
      }
      expect(displayableRegionSources.length, region.name).toBeGreaterThanOrEqual(1);
      expect(displayableRegionSources.length, region.name).toBeLessThanOrEqual(4);
    }
  });

  it('keeps review-required visual supports out of Field Guide and Warm-Up lookup results', () => {
    const reviewRequiredIds = visualSupportSources
      .filter((source) => source.status === 'review-required')
      .map((source) => source.id);

    expect(reviewRequiredIds).toContain('numerical-mines-cobweb-iteration');
    expect(reviewRequiredIds).toContain('numerical-mines-newton-iteration');
    expect(reviewRequiredIds).toContain('numerical-mines-warm-up-newton-iteration');

    for (const source of visualSupportSources) {
      if (source.status === 'review-required') {
        expect(isDisplayableVisualSupportSource(source), source.id).toBe(false);
      }
    }

    expect(findVisualSupportSource({
      pageType: 'field-guide',
      regionId: 'numerical-mines',
      topicIds: ['9709_p3_topic_numerical_solution_of_equations'],
    })).toBeUndefined();
  });

  it('keeps approved visual supports sourced and non-empty for student display', () => {
    const approvedSources = visualSupportSources.filter((source) => source.status === 'approved');

    expect(approvedSources.length).toBeGreaterThan(0);
    for (const source of approvedSources) {
      expect(source.imageUrl.trim(), source.id).not.toBe('');
      expect(source.sourceUrl.trim(), source.id).not.toBe('');
      expect(source.license.trim(), source.id).not.toBe('');
      expect(source.attribution.trim(), source.id).not.toBe('');
      expect(source.altText.trim(), source.id).not.toBe('');
      expect(source.replacementNotes.trim(), source.id).not.toBe('');
    }
  });

  it('classifies Field Guide visual support honestly as mini-diagrams or method patterns', () => {
    const fieldGuideSources = visualSupportSources.filter((source) => source.pageType === 'field-guide');

    expect(fieldGuideSources.length).toBeGreaterThan(0);
    expect(fieldGuideSources.find((source) => source.id === 'algebra-forge-binomial-structure')?.visualKind)
      .toBe('method_pattern');
    expect(fieldGuideSources.find((source) => source.id === 'complex-harbor-argand-plane')?.visualKind)
      .toBe('mini_diagram');
    expect(fieldGuideSources.find((source) => source.id === 'numerical-mines-cobweb-iteration')?.visualKind)
      .toBe('needs_visual');
    expect(fieldGuideSources.find((source) => source.id === 'numerical-mines-newton-iteration')?.status)
      .toBe('review-required');

    for (const source of fieldGuideSources.filter(isDisplayableVisualSupportSource)) {
      expect(['mini_diagram', 'method_pattern'], source.id).toContain(source.visualKind);
      expect(source.purpose.toLowerCase(), source.id).not.toContain('decorative');
    }

    expect(fieldGuideVisualSupportNeeds.map((item) => `${item.regionId}/${item.topicId}`)).toEqual(expect.arrayContaining([
      'complex-harbor/locus',
      'complex-harbor/roots',
      'vector-workshop/vectors_intersect_parallel_skew',
      'numerical-mines/iteration_fixed_point_roots',
      'differential-shrine/differential_first_order_model',
    ]));
  });

  it('renders VisualSupportCard attribution and falls back safely when an image is unavailable', () => {
    const source = visualSupportSources[0];
    const container = render(<VisualSupportCard source={source} />);

    const image = container.querySelector<HTMLImageElement>('.visual-support-card img');
    expect(image?.getAttribute('alt')).toBe(source.altText);
    expect(container.textContent).toContain(source.visualKind === 'method_pattern' ? 'Method pattern' : 'Mini-diagram');
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
    expect(container.textContent).toContain('Next action: try the linked short check in Skill Practice without looking back at the final answer.');

    const quickCheck = container.querySelector<HTMLElement>('.quick-check-card .quick-check-reveal');
    expect(quickCheck).toBeTruthy();
    expect(quickCheck?.textContent).toContain('Short check');
    expect(quickCheck?.textContent).toContain('Check 1 of 1');
    expect(quickCheck?.textContent).not.toContain('Next action');

    const revealButton = Array.from(quickCheck!.querySelectorAll('button')).find((button) => button.textContent === 'Check answer');
    expect(revealButton).toBeTruthy();
    expect(revealButton?.hasAttribute('disabled')).toBe(false);
    expect(quickCheck?.textContent).not.toContain('Reveal answer');
    expect(quickCheck!.querySelector('textarea')).toBeFalsy();

    act(() => {
      revealButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(quickCheck?.textContent).toContain('Add an answer first');

    const modelChoice = Array.from(quickCheck!.querySelectorAll('button')).find((button) => button.textContent?.includes('Use the linked Field Guide move'));
    expect(modelChoice).toBeTruthy();
    act(() => {
      modelChoice!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    act(() => {
      revealButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(quickCheck?.textContent).toContain('Correct');
    expect(quickCheck?.querySelector('.quick-check-example-link')).toBeFalsy();
    expect(quickCheck?.textContent).toContain('Need help?');
    expect(quickCheck?.textContent).toContain('Show a similar example');
    expect(quickCheck?.textContent).not.toContain('Save check');
    expect(onLearningActivityAttempt).toHaveBeenCalledTimes(1);
    expect(quickCheck?.textContent).toContain('Next action');
    expect(quickCheck?.textContent).toContain('Try Again');
  });

  it('renders generated warm-up practice as a check-first active item', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    expect(logRegion).toBeTruthy();

    const container = render(
      <WarmUpPracticePanel practiceItems={[generatedPractice]} region={logRegion!} />,
    );

    expect(container.textContent).toContain('Guided Practice');
    expect(container.textContent).toContain('Work through one prompt at a time.');
    expect(container.textContent).toContain('Item 1 of 1');
    expect(container.textContent).toContain('Solve ln(x) + ln(3) = ln(12).');
    expect(container.textContent).toContain('Question type');
    expect(container.textContent).toContain('Logarithm equation');
    expect(container.textContent).toContain('Key method');
    expect(container.textContent).not.toContain('x = 4');
    expect(container.textContent).not.toContain('Log and exponential shape reminder');

    const checkButton = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent === 'Ready to compare');
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
    expect(container.textContent).toContain('No automatic marking here.');
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
          regionIds: ['uncovered-region'],
          topics: ['uncovered_topic'],
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
    expect(Array.from(container.querySelectorAll('button'))[0].textContent).toBe('Ready to compare');
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

    const save = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Save guided step');
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
    expect(container.textContent).toContain('Guided practice for this region is being prepared.');
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
    expect(container.textContent).toContain('2 more reviewed short checks queued after this one.');
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
    const checkFirst = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Ready to compare');
    act(() => {
      checkFirst!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('No automatic marking here.');
    expect(container.textContent).not.toContain('Your answer looks close.');
    expect(container.textContent).not.toContain('Use the product law.');

    const revealFirst = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Reveal solution');
    act(() => {
      revealFirst!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const gotItFirst = container.querySelector<HTMLInputElement>('input[value="got_it"]');
    act(() => {
      gotItFirst!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const saveFirst = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Save guided step');
    act(() => {
      saveFirst!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Next');
    act(() => {
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Next')!
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
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Ready to compare')!
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
      Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Save guided step')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Guided sequence complete');
    const continueExam = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Next');
    expect(continueExam).toBeTruthy();
    act(() => {
      continueExam!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onContinueToExamPractice).toHaveBeenCalledTimes(1);
    expect(onLearningActivityAttempt).toHaveBeenCalledTimes(2);
  });

  it('uses method-steering placeholders for warm-up practice', () => {
    const integrationRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'integration-gardens');
    const algebraRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'algebra-forge');
    expect(integrationRegion).toBeTruthy();
    expect(algebraRegion).toBeTruthy();

    const integrationPractice: GeneratedPracticeItem = {
      ...generatedPractice,
      practiceId: 'gen_integration_method_setup_basic_placeholder',
      generatorFamily: 'integration.method_setup_basic',
      topic: 'integration',
      regionIds: ['integration-gardens'],
      prompt: 'Using u = x^2 + 1, transform the integral of 2x(x^2 + 1)^4 dx.',
      answer: 'u = x^2 + 1, du = 2x dx',
      questionType: 'integration',
      keyMethod: 'Use the given substitution.',
      examMove: 'Transform the setup before evaluating.',
    };
    const binomialPractice: GeneratedPracticeItem = {
      ...generatedPractice,
      practiceId: 'gen_binomial_first_terms_placeholder',
      generatorFamily: 'binomial_expansion.first_terms_and_coefficient',
      topic: 'binomial_expansion',
      regionIds: ['algebra-forge'],
      prompt: 'Expand (1 - 2x)^-3/2 up to x^2, with the validity condition.',
      answer: '1 + 3x + (15/2)x^2, valid for |x| < 1/2',
      questionType: 'Binomial term or coefficient',
      keyMethod: 'Find requested binomial terms and validity.',
      examMove: 'Use the rational-index binomial expansion.',
    };

    const integrationContainer = render(
      <WarmUpPracticePanel practiceItems={[integrationPractice]} region={integrationRegion!} />,
    );
    expect(integrationContainer.querySelector<HTMLTextAreaElement>('.warm-up-practice-card textarea')?.placeholder)
      .toBe('Show the setup and answer, e.g. u = x^2 + 1, du = 2x dx');

    const binomialContainer = render(
      <WarmUpPracticePanel practiceItems={[binomialPractice]} region={algebraRegion!} />,
    );
    expect(binomialContainer.querySelector<HTMLTextAreaElement>('.warm-up-practice-card textarea')?.placeholder)
      .toBe('Include requested terms and validity, e.g. 1 - x, |x| < 1');
  });

  it('explains when guided practice falls back from the current Field Guide topic', () => {
    const algebraRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'algebra-forge');
    const container = render(
      <WarmUpPracticePanel
        practiceItems={[{
          ...generatedPractice,
          practiceId: 'nearby-algebra-guided',
          topic: 'algebra',
          regionIds: ['algebra-forge'],
          generatorFamily: 'algebra.structure_rearrangement_basic',
        }]}
        region={algebraRegion!}
        fieldGuideTopicTitle="Binomial Expansions"
        topicMatchFallbackReason="We do not have a reviewed guided item for Binomial Expansions yet, so this starts with a nearby skill from this region."
      />,
    );

    expect(container.textContent).toContain('Guided Practice');
    expect(container.textContent).toContain('We do not have a reviewed guided item for Binomial Expansions yet');
  });

  it('uses a deterministic choice contract for unstructured integration Quick Checks', () => {
    const integrationRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'integration-gardens');
    expect(integrationRegion).toBeTruthy();

    const integrationSnippet: TeachingSnippet = {
      ...snippet,
      snippetId: 'p3-integration-placeholder-check',
      regionIds: ['integration-gardens'],
      topics: ['integration'],
      title: 'Use the given substitution',
      quickCheck: {
        prompt: 'Using $u=x^2+1$, what does $\\int 2x(x^2+1)^5\\,dx$ become?',
        answer: '$\\int u^5\\,du$',
        explanation: '$du=2x\\,dx$, so transform the whole integral first.',
        topic: 'integration',
      },
    };

    const container = render(
      <QuickChecksPanel teachingSnippets={[integrationSnippet]} region={integrationRegion!} />,
    );

    expect(container.querySelector<HTMLTextAreaElement>('.quick-check-card textarea')).toBeFalsy();
    expect(container.querySelector('.quick-check-choice-grid')).toBeTruthy();
    expect(container.textContent).toContain('Use the linked Field Guide move');
  });

  it('advances Quick Checks one at a time after a correct deterministic check', () => {
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
    expect(checkAnswerButton?.hasAttribute('disabled')).toBe(false);

    act(() => {
      checkAnswerButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Add an answer first');

    const firstAnswer = Array.from(check!.querySelectorAll('button')).find((button) => button.textContent?.includes('Use the linked Field Guide move'));
    expect(firstAnswer).toBeTruthy();
    act(() => {
      firstAnswer!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    act(() => {
      checkAnswerButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Correct');
    expect(container.textContent).toContain('Use the linked Field Guide move');
    expect(container.textContent).not.toContain('Save check');
    expect(container.textContent).toContain('Next action');
    expect(container.textContent).toContain('Next');
    expect(container.querySelectorAll('.quick-check-card .quick-check-reveal')).toHaveLength(1);
    expect(onLearningActivityAttempt).toHaveBeenCalledTimes(1);

    const nextCheckButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Next');
    act(() => {
      nextCheckButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelectorAll('.quick-check-card .quick-check-reveal')).toHaveLength(1);
    expect(container.textContent).toContain('Quick prompt 2');
    expect(container.textContent).toContain('Check 2 of 3');
    expect(container.textContent).not.toContain('Quick prompt 1');
    expect(container.textContent).not.toContain('Quick prompt 3');
    expect(container.textContent).not.toContain('Correct');
  });

  it('renders deterministic Quick Check answer types without a free-text answer box', () => {
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove');
    const algebraRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'algebra-forge');
    const onLearningActivityAttempt = vi.fn();

    const singleValueContainer = render(
      <QuickChecksPanel
        teachingSnippets={[{
          ...snippet,
          snippetId: 'p3-exp-equations-001',
          quickCheck: {
            id: 'p3-exp-equations-001-qc',
            prompt: 'Solve $2^{x-1}=8$.',
            answer: '$x=4$',
            explanation: '$8=2^3$.',
          },
        }]}
        region={logRegion!}
        onLearningActivityAttempt={onLearningActivityAttempt}
      />,
    );

    expect(singleValueContainer.querySelector('textarea')).toBeFalsy();
    expect(singleValueContainer.querySelector('.quick-check-single-value')).toBeTruthy();
    const answerInput = singleValueContainer.querySelector<HTMLInputElement>('.quick-check-single-value input');
    act(() => {
      setInputValue(answerInput!, '4.0');
      Array.from(singleValueContainer.querySelectorAll('button')).find((button) => button.textContent === 'Check answer')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(singleValueContainer.textContent).toContain('Correct');

    const orderedContainer = render(
      <QuickChecksPanel
        teachingSnippets={[{
          ...snippet,
          snippetId: 'p3-algebra-rearrangement-001',
          quickCheck: {
            id: 'p3-algebra-rearrangement-001-qc',
            prompt: 'Order the moves.',
            answer: 'Factor first.',
            explanation: 'Look for a shared factor.',
          },
        }]}
        region={algebraRegion!}
      />,
    );

    expect(orderedContainer.querySelector('textarea')).toBeFalsy();
    expect(orderedContainer.querySelectorAll('.quick-check-order-list li')).toHaveLength(3);
    act(() => {
      Array.from(orderedContainer.querySelectorAll('button')).find((button) => button.getAttribute('aria-label')?.includes('Spot the shared factor') && button.getAttribute('aria-label')?.includes('up'))!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      Array.from(orderedContainer.querySelectorAll('button')).find((button) => button.getAttribute('aria-label')?.includes('Spot the shared factor') && button.getAttribute('aria-label')?.includes('up'))!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      Array.from(orderedContainer.querySelectorAll('button')).find((button) => button.textContent === 'Check answer')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(orderedContainer.textContent).toContain('Correct');

    const multiChoiceContainer = render(
      <QuickChecksPanel
        teachingSnippets={[{
          ...snippet,
          snippetId: 'p3-log-laws-001',
          quickCheck: {
            id: 'p3-log-laws-001-qc',
            prompt: 'Which expressions are equivalent?',
            answer: '$\\ln(5x)$',
            explanation: 'Use product law.',
          },
        }]}
        region={logRegion!}
      />,
    );

    expect(multiChoiceContainer.querySelector('textarea')).toBeFalsy();
    act(() => {
      Array.from(multiChoiceContainer.querySelectorAll('button')).find((button) => button.textContent?.includes('\\ln(5x)'))!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      Array.from(multiChoiceContainer.querySelectorAll('button')).find((button) => button.textContent?.includes('\\ln(x\\cdot5)'))!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    act(() => {
      Array.from(multiChoiceContainer.querySelectorAll('button')).find((button) => button.textContent === 'Check answer')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(multiChoiceContainer.textContent).toContain('Correct');
  });

  it('keeps the legacy quick-check route focused on one short check inside Skill Practice', () => {
    const container = renderRegionHubPage({
      activePage: 'quick-check',
      snippets: [snippetVariant(1), snippetVariant(2), snippetVariant(3)],
    });

    expect(container.textContent).toContain('Skill Practice');
    expect(container.textContent).toContain('One small check');
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
    expect(container.textContent).toContain('Learning loop');
    expect(container.textContent).toContain('Choose a step.');
    expect(container.textContent).not.toContain('Follow these steps in order the first time.');
    expect(container.textContent).not.toContain('Start simple');
    expect(container.textContent).not.toContain('Build the method');
    expect(container.querySelector('.region-home-stats')).toBeFalsy();

    const artwork = container.querySelector('.region-home-artwork');
    expect(artwork).toBeTruthy();
    expect(artwork?.getAttribute('aria-label')).toBe('Algebra Vault region artwork');
    const artworkImage = artwork?.querySelector<HTMLImageElement>('.region-home-artwork-image');
    expect(artworkImage).toBeFalsy();
    expect(artwork?.querySelector('.region-home-artwork-svg')).toBeTruthy();
    expect(artwork?.textContent).not.toContain('placeholder');

    const currentStep = container.querySelector<HTMLElement>('.region-current-step-card');
    expect(currentStep).toBeTruthy();
    expect(currentStep?.textContent).toContain('Current step');
    expect(currentStep?.textContent).toContain('Field Guide');
    expect(currentStep?.textContent).toContain('Read the next guide step before practice.');
    expect(currentStep?.textContent).toContain('Ready');
    const primaryAction = currentStep?.querySelector<HTMLButtonElement>('[data-region-page="field-guide"]');
    expect(primaryAction).toBeTruthy();

    expect(container.querySelector('.region-home-secondary-routes')).toBeFalsy();
    const loopButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.region-first-run-loop button'));
    expect(loopButtons).toHaveLength(4);
    expect(loopButtons.map((button) => button.textContent)).toEqual([
      expect.stringContaining('Field Guide'),
      expect.stringContaining('Skill Practice'),
      expect.stringContaining('Exam Training'),
      expect.stringContaining('Guardian'),
    ]);
    expect(container.querySelectorAll('.region-journey-bar .journey-step')).toHaveLength(4);
    expect(container.textContent).toContain('Field Guide');
    expect(container.querySelectorAll('.region-current-step-card')).toHaveLength(1);
    expect(container.querySelector('.region-current-step-card')?.textContent).not.toContain('Quick Checks');
    expect(container.textContent).toContain('Skill Practice');
    expect(container.textContent).toContain('Exam Training');
    expect(container.textContent).toContain('Guardian');
    expect(container.textContent).toContain('Locked');
    expect(container.textContent).not.toContain('Check readiness');

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

    const guardianCard = loopButtons.find((button) => button.textContent?.includes('Guardian'));
    expect(guardianCard?.disabled).toBe(true);
    act(() => {
      guardianCard?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onNavigatePage).not.toHaveBeenCalledWith('guardian');
  });

  it('wires available region hub art files with the established naming convention', () => {
    for (const [regionId, src] of Object.entries(regionHubAssets)) {
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

    const actionButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.region-first-run-loop button'));
    expect(actionButtons).toHaveLength(4);
    expect(container.querySelectorAll('.region-current-step-card')).toHaveLength(1);
    expect(container.querySelector('.region-home-secondary-routes')).toBeFalsy();
    expect(actionButtons.find((button) => button.textContent?.includes('Guardian'))?.disabled).toBe(false);

    for (const [label, page] of [
      ['Field Guide', 'field-guide'],
      ['Skill Practice', 'skill-practice'],
      ['Exam Training', 'exam-training'],
      ['Guardian', 'guardian'],
    ] as const) {
      const button = actionButtons.find((candidate) => candidate.textContent?.includes(label));
      expect(button).toBeTruthy();
      act(() => {
        button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    }

    expect(onNavigatePage.mock.calls.map(([page]) => page)).toEqual([
      'field-guide',
      'skill-practice',
      'exam-training',
      'guardian',
    ]);
  });

  it('aggregates internal Quick Check and Warm-Up recommendations into Skill Practice', () => {
    const learningRecord: RegionLearningRecord = {
      regionId: 'logarithm-grove',
      fieldGuideCompletedAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    };
    const quickCheckRecommended = renderRegionHubPage({
      fieldGuideCompleted: true,
      learningRecord,
    });
    const quickCheckCurrentStep = quickCheckRecommended.querySelector<HTMLElement>('.region-current-step-card');

    expect(quickCheckCurrentStep?.textContent).toContain('Skill Practice');
    expect(quickCheckCurrentStep?.querySelector<HTMLButtonElement>('[data-region-page="skill-practice"]')).toBeTruthy();
    expect(quickCheckCurrentStep?.textContent).not.toContain('Quick Checks');

    const warmUpRecommended = renderRegionHubPage({
      fieldGuideCompleted: true,
      learningRecord,
      learningActivityAttempts: [supportActivityAttempt('quick_check')],
    });
    const warmUpCurrentStep = warmUpRecommended.querySelector<HTMLElement>('.region-current-step-card');

    expect(warmUpCurrentStep?.textContent).toContain('Skill Practice');
    expect(warmUpCurrentStep?.querySelector<HTMLButtonElement>('[data-region-page="skill-practice"]')).toBeTruthy();
    expect(warmUpCurrentStep?.textContent).not.toContain('Warm-Up');
  });

  it('renders one active Skill Practice step body for normal and legacy routes', () => {
    const defaultPage = renderRegionHubPage({ activePage: 'skill-practice' });
    expect(defaultPage.querySelector('.quick-check-card .quick-check-reveal')).toBeTruthy();
    expect(defaultPage.querySelector('.warm-up-practice-card')).toBeFalsy();
    expect(defaultPage.querySelector('.skill-practice-exam-transition')).toBeFalsy();
    expect(defaultPage.querySelector('.skill-practice-steps button[aria-current="step"]')?.textContent).toContain('Quick Check');
    expect(defaultPage.textContent).not.toContain('Warm-Up Practice');

    const buildMethodPage = renderRegionHubPage({
      activePage: 'skill-practice',
      learningActivityAttempts: [supportActivityAttempt('quick_check')],
    });
    expect(buildMethodPage.querySelector('.quick-check-card .quick-check-reveal')).toBeFalsy();
    expect(buildMethodPage.querySelector('.warm-up-practice-card')).toBeTruthy();
    expect(buildMethodPage.querySelector('.skill-practice-exam-transition')).toBeFalsy();
    expect(buildMethodPage.querySelector('.skill-practice-steps button[aria-current="step"]')?.textContent).toContain('Guided Practice');

    const readyPage = renderRegionHubPage({
      activePage: 'skill-practice',
      learningActivityAttempts: [
        supportActivityAttempt('quick_check'),
        supportActivityAttempt('warm_up'),
      ],
    });
    expect(readyPage.querySelector('.quick-check-card .quick-check-reveal')).toBeFalsy();
    expect(readyPage.querySelector('.warm-up-practice-card')).toBeFalsy();
    expect(readyPage.querySelector('.skill-practice-exam-transition')).toBeTruthy();
    expect(readyPage.querySelector('.skill-practice-steps button[aria-current="step"]')?.textContent).toContain('Ready for exam practice');

    const legacyQuickCheckPage = renderRegionHubPage({
      activePage: 'quick-check',
      learningActivityAttempts: [
        supportActivityAttempt('quick_check'),
        supportActivityAttempt('warm_up'),
      ],
    });
    expect(legacyQuickCheckPage.querySelector('.quick-check-card .quick-check-reveal')).toBeTruthy();
    expect(legacyQuickCheckPage.querySelector('.warm-up-practice-card')).toBeFalsy();
    expect(legacyQuickCheckPage.querySelector('.skill-practice-steps button[aria-current="step"]')?.textContent).toContain('Quick Check');

    const legacyWarmUpPage = renderRegionHubPage({ activePage: 'warm-up' });
    expect(legacyWarmUpPage.querySelector('.quick-check-card .quick-check-reveal')).toBeFalsy();
    expect(legacyWarmUpPage.querySelector('.warm-up-practice-card')).toBeTruthy();
    expect(legacyWarmUpPage.querySelector('.skill-practice-steps button[aria-current="step"]')?.textContent).toContain('Guided Practice');
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
    expect(fieldGuidePage.querySelector('.region-learning-nav button.active')?.textContent).toContain('Field Guide');
    expect(fieldGuidePage.textContent).toContain('Back to Region Hub');
    expect(fieldGuidePage.querySelector('.field-guide-card')).toBeTruthy();
    expect(fieldGuidePage.querySelector('.quick-check-card')).toBeFalsy();

    const quickCheckPage = renderRegionHubPage({ activePage: 'quick-check' });
    expect(quickCheckPage.textContent).toContain('Skill Practice');
    expect(quickCheckPage.textContent).toContain('One small check');
    expect(quickCheckPage.textContent).toContain('Rewrite \\log base two of eight equals three.');
    expect(quickCheckPage.querySelector('.quick-check-card .quick-check-reveal')).toBeTruthy();
    expect(quickCheckPage.querySelector('.field-guide-card')).toBeFalsy();
    expect(quickCheckPage.querySelector('.warm-up-practice-card')).toBeFalsy();
    expect(quickCheckPage.querySelector('.skill-practice-exam-transition')).toBeFalsy();
    expect(quickCheckPage.querySelector<HTMLTextAreaElement>('.quick-check-card textarea')).toBeFalsy();
    expect(quickCheckPage.querySelector('.quick-check-choice-grid')).toBeTruthy();

    const warmUpPage = renderRegionHubPage({ activePage: 'warm-up' });
    expect(warmUpPage.textContent).toContain('Skill Practice');
    expect(warmUpPage.textContent).toContain('Guided Practice');
    expect(warmUpPage.textContent).toContain('Try a guided step, then compare with the worked route.');
    expect(warmUpPage.textContent).not.toContain('Warm-Up Practice');
    expect(warmUpPage.textContent).not.toContain('answer-first set with worked solutions');
    expect(warmUpPage.textContent).toContain('Solve ln(x) + ln(3) = ln(12).');
    expect(warmUpPage.querySelector('.warm-up-practice-card')).toBeTruthy();
    expect(warmUpPage.querySelector('.quick-check-card')).toBeFalsy();
    expect(warmUpPage.querySelector<HTMLTextAreaElement>('.warm-up-practice-card textarea')?.placeholder).toBe('Use exact form and any condition, e.g. ln(5x), x > 0');

    const examTrainingPage = renderRegionHubPage({ activePage: 'exam-training' });
    expect(examTrainingPage.textContent).toContain('Exam Training');
    expect(examTrainingPage.textContent).toContain('Recommended session');
    expect(examTrainingPage.querySelector('.training-card')).toBeTruthy();
    expect(examTrainingPage.querySelector('.region-hero')).toBeFalsy();
    expect(examTrainingPage.querySelector('.region-summary-band')).toBeFalsy();
    expect(examTrainingPage.querySelector('.region-arc-timeline')).toBeFalsy();

    const guardianPage = renderRegionHubPage({ activePage: 'guardian' });
    expect(guardianPage.textContent).toContain('Guardian Challenge');
    expect(guardianPage.textContent).toContain('Vault locked');
    expect(guardianPage.textContent).toContain('The Guardian is waiting.');
    expect(guardianPage.textContent).not.toContain(GUARDIAN_PLACEHOLDER_WARNING);
    expect(guardianPage.textContent).not.toContain('Lantern Growth Gate');
    expect(guardianPage.textContent).not.toContain('Solve \\log_2(x+3)');
    expect(guardianPage.querySelector<HTMLTextAreaElement>('.guardian-placeholder-card textarea')).toBeFalsy();
    expect(Array.from(guardianPage.querySelectorAll('button')).some((button) => button.textContent?.includes('Reveal placeholder guidance'))).toBe(false);
    expect(guardianPage.querySelector<HTMLImageElement>('.guardian-placeholder-figure img')?.getAttribute('alt')).toBe('Logarithm Observatory Guardian artwork');
    expect(guardianPage.textContent).toContain('The vault opens after enough saved region practice.');
    expect(guardianPage.querySelectorAll('.guardian-requirement-card').length).toBeGreaterThanOrEqual(5);
    expect(guardianPage.querySelector('.guardian-card')).toBeTruthy();
  });

  it('shows Guardian artwork but no challenge question or answer controls while locked', () => {
    const container = renderRegionHubPage({
      activePage: 'guardian',
      learningRecord: { regionId: 'logarithm-grove', fieldGuideCompletedAt: '2026-05-20T00:00:00.000Z', updatedAt: '2026-05-20T00:00:00.000Z' },
      regionAttempts: [],
    });

    expect(container.textContent).toContain('Vault locked');
    expect(container.textContent).toContain('The challenge opens after the guide and enough scored practice.');
    expect(container.querySelector<HTMLImageElement>('.guardian-placeholder-figure img')?.getAttribute('src')).toContain('/assets/guardian-art/optimized/logarithm-grove-guardian-960.png');
    expect(container.querySelector<HTMLImageElement>('.guardian-placeholder-figure img')?.getAttribute('alt')).toBe('Logarithm Observatory Guardian artwork');
    expect(container.textContent).not.toContain('Lantern Growth Gate');
    expect(container.textContent).not.toContain('Solve \\log_2(x+3)');
    expect(container.querySelector<HTMLTextAreaElement>('.guardian-placeholder-card textarea')).toBeFalsy();
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('Reveal placeholder guidance'))).toBe(false);
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('Enter the Guardian Challenge'))).toBe(false);
    expect(container.querySelectorAll('.guardian-requirement-card')).toHaveLength(5);
    expect(container.textContent).toContain('Saved practice attempts');
    expect(container.textContent).toContain('0 / 3');
  });

  it('chooses one locked Guardian next action from the first missing eligibility requirement', () => {
    const guideNavigate = vi.fn<(page: RegionLearningPageId) => void>();
    const guideMissing = renderRegionHubPage({
      activePage: 'guardian',
      onNavigatePage: guideNavigate,
    });
    const guideAction = guideMissing.querySelector<HTMLButtonElement>('[data-guardian-next-action="field-guide"]');
    expect(guideAction?.textContent).toContain('Start with the Field Guide');
    act(() => {
      guideAction?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(guideNavigate).toHaveBeenCalledWith('field-guide');

    const evidenceNavigate = vi.fn<(page: RegionLearningPageId) => void>();
    const evidenceMissing = renderRegionHubPage({
      activePage: 'guardian',
      learningRecord: { regionId: 'logarithm-grove', fieldGuideCompletedAt: '2026-05-20T00:00:00.000Z', updatedAt: '2026-05-20T00:00:00.000Z' },
      onNavigatePage: evidenceNavigate,
    });
    const evidenceAction = evidenceMissing.querySelector<HTMLButtonElement>('[data-guardian-next-action="exam-training"]');
    expect(evidenceAction?.textContent).toContain('Save one exam attempt');
    act(() => {
      evidenceAction?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(evidenceNavigate).toHaveBeenCalledWith('exam-training');

    const lowScoreAttempts = [1, 2, 3].map((index) => regionAttempt(index, {
      questionId: 'q1',
      topicDisplayName: 'Logarithms',
      subtopic: index === 2 ? 'exponential equations' : 'logarithmic equations',
      marksEarned: 4,
      marksAvailable: 10,
      scoreRatio: 0.4,
      validatedRegionId: 'logarithm-grove',
      displayRegionId: 'logarithm-grove',
      worldName: 'P3 Astral Academy',
      regionName: 'Logarithm Grove',
      masteryEligible: true,
    }));
    const recentMissing = renderRegionHubPage({
      activePage: 'guardian',
      learningRecord: { regionId: 'logarithm-grove', fieldGuideCompletedAt: '2026-05-20T00:00:00.000Z', updatedAt: '2026-05-20T00:00:00.000Z' },
      regionAttempts: lowScoreAttempts,
    });
    const recentAction = recentMissing.querySelector<HTMLButtonElement>('[data-guardian-next-action="exam-training"]');
    expect(recentAction?.textContent).toContain('Try another Exam Training question');
  });

  it('shows Guardian artwork and actual question action after unlock evidence is complete', () => {
    const onChallengeGuardian = vi.fn();
    const regionAttempts = [1, 2, 3].map((index) => regionAttempt(index, {
      questionId: 'q1',
      topicDisplayName: 'Logarithms',
      subtopic: 'logarithmic equations',
      marksEarned: index === 1 ? 4.5 : 5,
      marksAvailable: 6,
      scoreRatio: index === 1 ? 0.75 : 5 / 6,
      validatedRegionId: 'logarithm-grove',
      displayRegionId: 'logarithm-grove',
      worldName: 'P3 Astral Academy',
      regionName: 'Logarithm Grove',
      masteryEligible: true,
    }));
    const container = renderRegionHubPage({
      activePage: 'guardian',
      learningRecord: { regionId: 'logarithm-grove', fieldGuideCompletedAt: '2026-05-20T00:00:00.000Z', updatedAt: '2026-05-20T00:00:00.000Z' },
      progressOverrides: {
        attempts: 3,
        averageScoreRatio: 0.81,
        recentScoreRatio: 5 / 6,
        rank: 'Bronze',
        subtopicsTouched: 1,
      },
      regionAttempts,
      onChallengeGuardian,
    });

    expect(container.textContent).not.toContain('Vault locked');
    expect(container.textContent).not.toContain(GUARDIAN_PLACEHOLDER_WARNING);
    expect(container.textContent).not.toContain('Lantern Growth Gate');
    expect(container.textContent).not.toContain('Solve \\log_2(x+3)');
    expect(container.textContent).toContain('Guardian ready');
    expect(container.textContent).toContain('The vault opens now.');
    expect(container.querySelector<HTMLImageElement>('.guardian-placeholder-figure img')?.getAttribute('alt')).toBe('Logarithm Observatory Guardian artwork');
    expect(container.querySelector<HTMLTextAreaElement>('.guardian-placeholder-card textarea')).toBeFalsy();
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('Reveal placeholder guidance'))).toBe(false);

    const challengeButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Enter the Guardian Challenge'));
    expect(challengeButton).toBeTruthy();
    act(() => {
      challengeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onChallengeGuardian).toHaveBeenCalledWith(expect.objectContaining({ id: 'q1' }));
  });

  it('keeps unlocked Guardian page focused on the actual Guardian question action', () => {
    const onChallengeGuardian = vi.fn();
    const regionAttempts = [1, 2, 3].map((index) => regionAttempt(index, {
      questionId: 'q1',
      topicDisplayName: 'Logarithms',
      subtopic: 'logarithmic equations',
      scoreRatio: 0.8,
      validatedRegionId: 'logarithm-grove',
      displayRegionId: 'logarithm-grove',
      masteryEligible: true,
    }));
    const container = renderRegionHubPage({
      activePage: 'guardian',
      learningRecord: { regionId: 'logarithm-grove', fieldGuideCompletedAt: '2026-05-20T00:00:00.000Z', updatedAt: '2026-05-20T00:00:00.000Z' },
      progressOverrides: {
        attempts: 3,
        averageScoreRatio: 0.8,
        recentScoreRatio: 0.8,
        rank: 'Bronze',
      },
      regionAttempts,
      onChallengeGuardian,
    });

    expect(container.querySelector<HTMLTextAreaElement>('.guardian-placeholder-card textarea')).toBeFalsy();
    expect(container.textContent).toContain('The vault opens now.');
    expect(container.textContent).toContain('What opened the Guardian?');
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent?.includes('Reveal placeholder guidance'))).toBe(false);
    expect(onChallengeGuardian).not.toHaveBeenCalled();
    expect(container.textContent?.toLowerCase()).not.toContain('teacher dashboard');
    expect(container.textContent?.toLowerCase()).not.toContain('admin');
    expect(container.textContent?.toLowerCase()).not.toContain('export');
  });

  it('does not introduce fixed single-question Guardian structure copy', () => {
    const guardianSource = [
      readFileSync(`${process.cwd()}/src/components/world/regionHub/GuardianChallengePanel.tsx`, 'utf8'),
      readFileSync(`${process.cwd()}/src/components/world/regionHub/GuardianEligibilityPanel.tsx`, 'utf8'),
      readFileSync(`${process.cwd()}/src/components/world/RegionHub.tsx`, 'utf8'),
    ].join('\n');

    for (const forbidden of [
      'One high-level exam-style question',
      'one high-level exam-style question',
      'One high-level question',
      'one high-level question',
      'One final question',
      'one final question',
      'Single boss question',
      'single boss question',
    ]) {
      expect(guardianSource).not.toContain(forbidden);
    }
  });

  it('gracefully handles Guardian artwork content without artwork', () => {
    const challenge = {
      ...guardianChallenges[0],
      guardianAssetPath: undefined,
    };
    const container = render(<GuardianChallengePanel challenge={challenge} isUnlocked={false} regionName="Algebra Vault" />);

    expect(container.textContent).toContain('Guardian Challenge');
    expect(container.textContent).toContain('Guardian artwork is not available for this region yet.');
    expect(container.querySelector<HTMLImageElement>('.guardian-placeholder-figure img')).toBeFalsy();
  });

  it('has placeholder Guardian challenge content for every active P3 region without mastery credit', () => {
    const regionIds = P3_ASTRAL_ACADEMY.regions.map((region) => region.id).sort();
    expect(guardianChallenges.map((challenge) => challenge.regionId).sort()).toEqual(regionIds);
    for (const challenge of guardianChallenges) {
      expect(challenge.status).toBe('placeholder');
      expect(challenge.countsForMastery).toBe(false);
      expect(challenge.studentFacingWarning).toContain('does not count as official mastery evidence yet');
      expect(challenge.prompt.length).toBeGreaterThan(40);
      expect(challenge.guidance.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps Field Guide accessible while classroom access locks practice activities', () => {
    const fieldGuidePage = renderRegionHubPage({
      activePage: 'field-guide',
      studentRegionAccess: lockedStudentRegionAccess,
    });
    expect(fieldGuidePage.textContent).toContain('Field Guide');
    expect(fieldGuidePage.querySelector('.field-guide-card')).toBeTruthy();
    expect(fieldGuidePage.querySelector('.region-activity-locked-panel')).toBeFalsy();

    const lockedPages: Array<[RegionLearningPageId, string]> = [
      ['quick-check', 'Skill Practice is locked for this class'],
      ['warm-up', 'Skill Practice is locked for this class'],
      ['skill-practice', 'Skill Practice is locked for this class'],
      ['exam-training', 'Exam Training is locked for this class'],
      ['guardian', 'Guardian Challenge is locked for this class'],
    ];

    for (const [activePage, lockedText] of lockedPages) {
      const container = renderRegionHubPage({
        activePage,
        studentRegionAccess: lockedStudentRegionAccess,
      });
      expect(container.textContent).toContain(lockedText);
      expect(container.textContent).toContain('cannot save new attempts or clear the Guardian');
      expect(container.querySelector('.quick-check-card')).toBeFalsy();
      expect(container.querySelector('.warm-up-practice-card')).toBeFalsy();
      expect(container.querySelector('.training-card')).toBeFalsy();
      expect(container.querySelector('.guardian-card')).toBeFalsy();
    }
  });

  it('keeps existing locked-region progress visible without opening progress routes', () => {
    const onNavigatePage = vi.fn<(page: RegionLearningPageId) => void>();
    const container = renderRegionHubPage({
      fieldGuideCompleted: true,
      progressOverrides: {
        attempts: 5,
        totalMarksEarned: 22,
        totalMarksAvailable: 30,
        averageScoreRatio: 22 / 30,
        rank: 'Silver',
      },
      regionAttempts: [regionAttempt(1), regionAttempt(2), regionAttempt(3)],
      studentRegionAccess: lockedStudentRegionAccess,
      onNavigatePage,
    });

    expect(container.textContent).toContain('Field Guide only');
    expect(container.textContent).toContain('Existing progress stays visible');
    expect(container.querySelector('.region-home-stats')).toBeFalsy();

    const actionButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.region-first-run-loop button'));
    expect(actionButtons.find((button) => button.textContent?.includes('Field Guide'))?.disabled).toBe(false);
    for (const label of ['Skill Practice', 'Exam Training', 'Guardian']) {
      const button = actionButtons.find((candidate) => candidate.textContent?.includes(label));
      expect(button?.disabled).toBe(true);
      expect(button?.textContent).toContain('Locked');
    }
    expect(container.querySelector('.region-first-run-loop')?.textContent).toContain('Locked');

    act(() => {
      actionButtons.find((button) => button.textContent?.includes('Skill Practice'))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onNavigatePage).not.toHaveBeenCalledWith('skill-practice');
  });

  it('leaves unlocked classroom regions on the normal learning path', () => {
    const onStartTraining = vi.fn<(intent: TrainingSessionIntent) => void>();
    const container = renderRegionHubPage({
      activePage: 'exam-training',
      fieldGuideCompleted: true,
      studentRegionAccess: openStudentRegionAccess,
      onStartTraining,
    });

    expect(container.querySelector('.region-activity-locked-panel')).toBeFalsy();
    expect(container.querySelector('.training-card')).toBeTruthy();

    const startButton = container.querySelector<HTMLButtonElement>('.training-primary-start');
    expect(startButton?.disabled).toBe(false);
    act(() => {
      startButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onStartTraining).toHaveBeenCalled();
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

  it('renders Algebra Vault Field Guide as topic choice before topic-specific teaching', () => {
    const snippets = realSnippetsForRegion('algebra-forge');
    expect(snippets.length).toBeGreaterThan(1);

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
    expect(container.querySelector('.region-learning-nav button.active')?.textContent).toContain('Field Guide');
    expect(container.textContent).not.toContain('Choose one focused step');
    expect(container.textContent).not.toContain('Skill and subtopic overview');

    expect(container.textContent).toContain('Field Guide / Algebra Vault');
    expect(container.textContent).toContain('Choose a topic to learn.');
    expect(container.querySelector('.field-guide-snippet-card')).toBeFalsy();
    expect(container.querySelectorAll('.field-guide-topic-card')).toHaveLength(5);
    expect(container.textContent).toContain('Modulus Graphs and Equations');
    expect(container.textContent).toContain('Polynomial Division');
    expect(container.textContent).toContain('Remainder and Factor Theorem');
    expect(container.textContent).toContain('Partial Fractions');
    expect(container.textContent).toContain('Binomial Expansions');
    expect(container.textContent).toContain('Each topic uses one worked example, one pattern, and one guided try.');

    const backToHub = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Back to Region Hub'));
    expect(backToHub).toBeTruthy();
    act(() => {
      backToHub!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onNavigatePage).toHaveBeenCalledWith('hub');

    const polynomialTopic = container.querySelector<HTMLButtonElement>('[data-topic-id="algebra_polynomial_division"]');
    expect(polynomialTopic).toBeTruthy();

    act(() => {
      polynomialTopic!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Topic 2 of 5');
    expect(container.textContent).toContain('Current topic');
    expect(container.textContent).toContain('Polynomial Division');
    expect(container.textContent).toContain('Example 1');
    expect(container.textContent).toContain('No-remainder long division');
    expect(container.textContent).toContain('Method pattern');
    expect(container.textContent).toContain('Try one together');
    expect(container.textContent).toContain('Key takeaway');
    expect(container.textContent).toContain('Next Topic');
    expect(onCompleteFieldGuide).not.toHaveBeenCalled();

    const backToTopics = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Back to Topics'));
    expect(backToTopics).toBeTruthy();
    act(() => {
      backToTopics!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelectorAll('.field-guide-topic-card')).toHaveLength(5);
    expect(onCompleteFieldGuide).not.toHaveBeenCalled();

    const binomialTopic = container.querySelector<HTMLButtonElement>('[data-topic-id="algebra_binomial_expansion"]');
    expect(binomialTopic).toBeTruthy();
    act(() => {
      binomialTopic!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const continueButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Continue to Skill Practice'));
    expect(continueButton).toBeTruthy();
    act(() => {
      continueButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onCompleteFieldGuide).toHaveBeenCalledTimes(1);
    expect(onNavigatePage).toHaveBeenCalledWith('skill-practice');
  });

  it('renders a topic-choice Field Guide page for every registered P3 region', () => {
    for (const [regionId, topics] of Object.entries(FIELD_GUIDE_TOPICS_BY_REGION)) {
      const container = renderRegionHubPage({
        activePage: 'field-guide',
        regionId,
      });
      const region = P3_ASTRAL_ACADEMY.regions.find((candidate) => candidate.id === regionId);

      expect(region, regionId).toBeTruthy();
      expect(container.textContent, regionId).toContain(`Field Guide / ${region!.name}`);
      expect(container.textContent, regionId).toContain('Choose the Topic');
      expect(container.querySelectorAll('.field-guide-topic-card'), regionId).toHaveLength(topics.length);

      for (const topic of topics) {
        const topicCard = container.querySelector<HTMLButtonElement>(`[data-topic-id="${topic.id}"]`);
        expect(topicCard, `${regionId}/${topic.id}`).toBeTruthy();
        expect(topicCard?.textContent, `${regionId}/${topic.id}`).toContain(topic.title);
        expect(topicCard?.textContent, `${regionId}/${topic.id}`).toContain(topic.purpose);
        expect(topicCard?.dataset.skillIds, `${regionId}/${topic.id}`).toBe(topic.skillIds.join(' '));
      }
    }
  });

  it('renders Argand topic-card previews as math without raw delimiters', async () => {
    const container = renderRegionHubPage({
      activePage: 'field-guide',
      regionId: 'complex-harbor',
    });

    await waitForKatex(container, FIELD_GUIDE_TOPICS_BY_REGION['complex-harbor'].length);

    const topicCards = Array.from(container.querySelectorAll<HTMLElement>('.field-guide-topic-card'));
    expect(topicCards).toHaveLength(FIELD_GUIDE_TOPICS_BY_REGION['complex-harbor'].length);

    for (const topicCard of topicCards) {
      const example = topicCard.querySelector('.field-guide-topic-example');
      expect(example, topicCard.dataset.topicId).toBeTruthy();
      expect(example?.querySelector('.katex'), topicCard.dataset.topicId).toBeTruthy();
      expect(example?.textContent, topicCard.dataset.topicId).not.toContain('$');
      expect(example?.textContent, topicCard.dataset.topicId).not.toContain('I');
    }

    expect(container.textContent).not.toContain('$a+bi$');
  });

  it('keeps must-fix Field Guide topic patches P3-appropriate and support-labelled', () => {
    const algebraTopics = FIELD_GUIDE_TOPICS_BY_REGION['algebra-forge'];
    const logTopics = FIELD_GUIDE_TOPICS_BY_REGION['logarithm-grove'];
    const calculusTopics = FIELD_GUIDE_TOPICS_BY_REGION['calculus-cliffs'];
    const numericalTopics = FIELD_GUIDE_TOPICS_BY_REGION['numerical-mines'];
    const trigTopics = FIELD_GUIDE_TOPICS_BY_REGION['trig-observatory'];
    const complexTopics = FIELD_GUIDE_TOPICS_BY_REGION['complex-harbor'];

    expect(algebraTopics.map((topic) => topic.id)).toEqual([
      'algebra_modulus_graph_equations',
      'algebra_polynomial_division',
      'algebra_remainder_factor_theorem',
      'algebra_partial_fractions',
      'algebra_binomial_expansion',
    ]);
    expect(algebraTopics.find((topic) => topic.id === 'algebra_binomial_expansion')?.examples[0]?.tryPrompt)
      .toContain('\\sqrt{2-6x}');
    expect(logTopics.map((topic) => topic.id)).toEqual([...LOGARITHM_OBSERVATORY_TOPIC_ORDER]);
    expect(calculusTopics.map((topic) => topic.id)).toEqual([
      'derivatives_exponential_logarithmic',
      'derivatives_product_rule',
      'derivatives_quotient_rule',
      'derivatives_trig_functions',
      'derivatives_implicit',
      'derivatives_parametric',
    ]);
    expect(calculusTopics.find((topic) => topic.id === 'derivatives_exponential_logarithmic')?.examples[0]?.prompt)
      .toContain('4e^{3x-2}+\\ln(5x+1)');
    expect(logTopics.find((topic) => topic.id === 'log_equations_inequalities')?.examples[0]?.workedLines.join('\n'))
      .toContain('Reject $x=-3$');
    expect(numericalTopics.map((topic) => topic.id)).toEqual([...ITERATION_FORGE_TOPIC_ORDER]);
    expect(numericalTopics.find((topic) => topic.id === 'iteration_change_of_sign')?.description)
      .toContain('f(x)=0');
    expect(calculusTopics.find((topic) => topic.id === 'derivatives_product_rule')?.title).toBe('Product Rule');
    expect(calculusTopics.find((topic) => topic.id === 'derivatives_quotient_rule')?.title).toBe('Quotient Rule');
    expect(trigTopics.map((topic) => topic.id)).toEqual([...TRIGONOMETRY_SPIRE_TOPIC_ORDER]);
    expect(trigTopics.find((topic) => topic.id === 'trig_reciprocal_functions')?.supportNote)
      .toContain('Support skill');
    expect(complexTopics.find((topic) => topic.id === 'cartesian-conjugate')?.supportNote)
      .toContain('Support skill');
    expect(numericalTopics.find((topic) => topic.id === 'iteration_convergence')?.examples[0]?.takeaway.join('\n'))
      .toContain('Skill Practice compares rearrangements');
  });

  it('opens a representative topic lesson for every registered P3 region', () => {
    for (const [regionId, topics] of Object.entries(FIELD_GUIDE_TOPICS_BY_REGION)) {
      const topic = topics[0];
      expect(topic, regionId).toBeTruthy();
      const container = renderRegionHubPage({
        activePage: 'field-guide',
        regionId,
      });
      const topicCard = container.querySelector<HTMLButtonElement>(`[data-topic-id="${topic!.id}"]`);
      expect(topicCard, `${regionId}/${topic!.id}`).toBeTruthy();

      act(() => {
        topicCard!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });

      expect(container.textContent, `${regionId}/${topic!.id}`).toContain('Current topic');
      expect(container.textContent, `${regionId}/${topic!.id}`).toContain(topic!.title);
      expect(container.textContent, `${regionId}/${topic!.id}`).toContain(topic!.examples[0]!.title);
      expect(container.textContent, `${regionId}/${topic!.id}`).toContain('Method pattern');
      expect(container.textContent, `${regionId}/${topic!.id}`).toContain('Try one together');
      expect(container.textContent, `${regionId}/${topic!.id}`).toContain('Key takeaway');

      const backToTopics = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Back to Topics'));
      expect(backToTopics, `${regionId}/${topic!.id}`).toBeTruthy();
      act(() => {
        backToTopics!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      expect(container.textContent, regionId).toContain('Choose the Topic');
    }
  });

  it('does not reintroduce internal canonical wording into student route copy', () => {
    expect(Object.values(REGION_LEARNING_PAGE_DESCRIPTIONS).join(' ')).not.toMatch(/\bcanonical\b/i);

    for (const regionId of Object.keys(FIELD_GUIDE_TOPICS_BY_REGION)) {
      const container = renderRegionHubPage({
        activePage: 'field-guide',
        regionId,
      });
      expect(container.textContent, regionId).not.toMatch(/\bcanonical\b/i);
    }
  });

  it('shows a safe Field Guide empty state without creating reading progress', () => {
    const onCompleteFieldGuide = vi.fn();
    const onBackToRegionHub = vi.fn();
    const logRegion = P3_ASTRAL_ACADEMY.regions.find((region) => region.id === 'logarithm-grove')!;
    const container = render(
      <FieldGuidePanel
        fieldGuide={getRegionFieldGuide(logRegion)}
        fieldGuideCompleted={false}
        theme={getRegionTheme(logRegion)}
        teachingSnippets={[]}
        onBackToRegionHub={onBackToRegionHub}
        onCompleteFieldGuide={onCompleteFieldGuide}
      />,
    );

    expect(container.textContent).toContain('Field Guide content for this region is still being prepared.');
    expect(container.querySelector('.field-guide-snippet-card')).toBeFalsy();
    expect(container.textContent).not.toContain('Continue to Skill Practice');
    expect(onCompleteFieldGuide).not.toHaveBeenCalled();

    const back = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Back to Region Hub');
    expect(back).toBeTruthy();
    act(() => {
      back!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onBackToRegionHub).toHaveBeenCalledTimes(1);
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

    expect(container.textContent).toContain('Guided practice for this region is being prepared.');
    const back = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Region Hub'));
    expect(back).toBeTruthy();
    act(() => {
      back!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onNavigatePage).toHaveBeenCalledWith('hub');
  });

  it('keeps region navigation destinations unique and stage indicators non-interactive', () => {
    const container = renderRegionHubPage({ activePage: 'quick-check' });
    const navButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.region-learning-nav button'));
    const navLabels = navButtons.map((button) => button.querySelector('span')?.textContent);

    expect(navLabels).toEqual([
      REGION_LEARNING_PAGE_LABELS.hub,
      REGION_LEARNING_PAGE_LABELS['field-guide'],
      REGION_LEARNING_PAGE_LABELS['skill-practice'],
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
    expect(regionHashPath('logarithm-grove', 'skill-practice')).toBe('#/regions/logarithm-grove/skill-practice');
    expect(regionHashPath('logarithm-grove', 'exam-training')).toBe('#/regions/logarithm-grove/exam-training');
    expect(parseAsterionHashRoute('#/regions/logarithm-grove/skill-practice')).toMatchObject({
      kind: 'region',
      regionId: 'logarithm-grove',
      page: 'skill-practice',
      isKnownRegion: true,
    });
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
    expect(stylesCss).toMatch(/\.region-home-action-card\s*\{[\s\S]*?"icon copy chevron"[\s\S]*?"icon status chevron"[\s\S]*?grid-template-columns:\s*38px minmax\(0,\s*1fr\) 18px;/);
    expect(stylesCss).toMatch(/\.region-home-action-copy strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere;/);
    expect(stylesCss).toMatch(/\.region-home-action-chevron\s*\{[\s\S]*?justify-self:\s*end;/);
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

    expect(source).toContain('|u|<1');
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
