import { useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpenCheck, CircleHelp, Dumbbell, Lock, ShieldCheck, Swords } from 'lucide-react';
import type { LearningActivityAttempt, NormalizedQuestion, RegionProgress, TrainingSessionIntent } from '../../types';
import type { RegionFieldGuide } from '../../data/regionFieldGuides';
import type { GeneratedPracticeItem } from '../../lib/generatedPractice';
import {
  REGION_LEARNING_PAGE_LABELS,
  REGION_LEARNING_PAGE_ORDER,
  type RegionLearningPageId,
} from '../../lib/regionRoutes';
import { getRegionTheme, type RegionTheme } from '../../lib/regionThemes';
import type { RegionLearningSummary } from '../../lib/regionLearning';
import type { TeachingSnippet } from '../../lib/teachingSnippets';
import { MathText } from '../shared/MathText';
import { FieldGuidePanel } from './regionHub/FieldGuidePanel';
import { GuardianEligibilityPanel } from './regionHub/GuardianEligibilityPanel';
import { QuickChecksPanel } from './regionHub/QuickChecksPanel';
import { RegionArcTimeline } from './regionHub/RegionArcTimeline';
import { RegionHero } from './regionHub/RegionHero';
import { RegionLearningLayout } from './regionHub/RegionLearningLayout';
import { RegionNextActionPanel } from './regionHub/RegionNextActionPanel';
import { RegionProgressStrip } from './regionHub/RegionProgressStrip';
import { TrainingGroundsPanel } from './regionHub/TrainingGroundsPanel';
import { WarmUpPracticePanel } from './regionHub/WarmUpPracticePanel';
import { percent } from './regionHub/regionHubPanelUtils';

interface RegionHubProps {
  regionProgress: RegionProgress;
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  teachingSnippets: TeachingSnippet[];
  generatedPractice: GeneratedPracticeItem[];
  learningActivityAttempts?: LearningActivityAttempt[];
  profileId?: string;
  summary: RegionLearningSummary;
  onCompleteFieldGuide: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
  onStartTraining: (intent: TrainingSessionIntent) => void;
  onChallengeGuardian: (question: NormalizedQuestion) => void;
  activePage?: RegionLearningPageId;
  onNavigatePage?: (page: RegionLearningPageId) => void;
  onReturnToMap: () => void;
}

const stateLabels: Record<string, string> = {
  locked: 'Locked',
  available: 'Field Guide ready',
  field_guide_started: 'Field Guide started',
  field_guide_completed: 'Field Guide complete',
  training_in_progress: 'Training in progress',
  guardian_unlocked: 'Guardian unlocked',
  guardian_attempted: 'Guardian attempted',
  guardian_cleared: 'Guardian cleared',
  mastered: 'Mastered',
  needs_review: 'Needs review',
};

type HubActionPageId = Exclude<RegionLearningPageId, 'hub'>;

const hubActionPages: HubActionPageId[] = [
  'field-guide',
  'quick-check',
  'warm-up',
  'exam-training',
  'guardian',
];

const hubActionLabels: Record<HubActionPageId, string> = {
  'field-guide': 'Field Guide',
  'quick-check': 'Quick Checks',
  'warm-up': 'Warm-Up Practice',
  'exam-training': 'Exam Training',
  guardian: 'Guardian Challenge',
};

const hubActionDescriptions: Record<HubActionPageId, string> = {
  'field-guide': 'Learn the key ideas',
  'quick-check': 'Check one skill',
  'warm-up': 'Build fluency',
  'exam-training': 'Practice real questions',
  guardian: 'Prove mastery',
};

const hubActionPrimaryCopy: Record<HubActionPageId, string> = {
  'field-guide': 'Start with one guide step and worked example before practice.',
  'quick-check': 'Try one answer-first check before moving into longer practice.',
  'warm-up': 'Build fluency with one short support activity.',
  'exam-training': 'Use canonical question images and save evidence for the Guardian.',
  guardian: 'Challenge the gated check when the existing evidence unlocks it.',
};

const regionHubArtAssets: Partial<Record<string, string>> = {
  'algebra-forge': '/assets/region-art/algebra-region-hub.png',
  'calculus-cliffs': '/assets/region-art/calc-region-hub.png',
  'complex-harbor': '/assets/region-art/argand-region-hub.png',
  'differential-shrine': '/assets/region-art/differential-region-hub.png',
  'integration-gardens': '/assets/region-art/integral-region-hub.png',
  'numerical-mines': '/assets/region-art/iteration-region-hub.png',
  'logarithm-grove': '/assets/region-art/log-region-hub.png',
  'trig-observatory': '/assets/region-art/trig-region-hub.png',
  'vector-workshop': '/assets/region-art/vectors-region-hub.png',
};

export function RegionHub({
  regionProgress,
  fieldGuide,
  fieldGuideCompleted,
  teachingSnippets,
  generatedPractice,
  learningActivityAttempts = [],
  profileId,
  summary,
  onCompleteFieldGuide,
  onLearningActivityAttempt,
  onStartTraining,
  onChallengeGuardian,
  activePage = 'hub',
  onNavigatePage,
  onReturnToMap,
}: RegionHubProps) {
  const { region } = regionProgress;
  const theme = getRegionTheme(region);
  const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
  const guardianQuestion = summary.guardianEligibility.guardianQuestion;
  const guardianCleared = summary.state === 'guardian_cleared' || summary.state === 'mastered';
  const quickCheckCount = teachingSnippets.filter((snippet) => snippet.quickCheck).length;

  if (activePage === 'field-guide') {
    return (
      <RegionLearningLayout theme={theme} summary={summary}>
        <FieldGuidePageHeader
          fieldGuide={fieldGuide}
          fieldGuideCompleted={fieldGuideCompleted}
          guardianCleared={guardianCleared}
          regionProgress={regionProgress}
          summary={summary}
          theme={theme}
        />

        <RegionLearningNavigationBlock
          activePage={activePage}
          fieldGuideCompleted={fieldGuideCompleted}
          summary={summary}
          onNavigatePage={onNavigatePage}
        />

        <div className="region-page-shell region-page-field-guide">
          <FieldGuidePanel
            fieldGuide={fieldGuide}
            fieldGuideCompleted={fieldGuideCompleted}
            theme={theme}
            teachingSnippets={teachingSnippets}
            maxInitialSnippets={Math.max(2, teachingSnippets.length)}
            onCompleteFieldGuide={onCompleteFieldGuide}
            onBackToRegionHub={() => onNavigatePage?.('hub')}
            onContinueToQuickChecks={() => onNavigatePage?.('quick-check')}
          />
        </div>
      </RegionLearningLayout>
    );
  }

  return (
    <RegionLearningLayout theme={theme} summary={summary}>
      {activePage === 'hub' ? (
        <RegionHubHome
          canTrain={canTrain}
          fieldGuideCompleted={fieldGuideCompleted}
          generatedPracticeCount={generatedPractice.length}
          guardianCleared={guardianCleared}
          quickCheckCount={quickCheckCount}
          regionProgress={regionProgress}
          stateLabel={stateLabels[summary.state] ?? summary.state}
          summary={summary}
          theme={theme}
          onNavigatePage={onNavigatePage}
          onReturnToMap={onReturnToMap}
        />
      ) : (
        <>
          <RegionHero
            regionProgress={regionProgress}
            theme={theme}
            stateLabel={stateLabels[summary.state] ?? summary.state}
            onReturnToMap={onReturnToMap}
          />

          <div className="region-summary-band" aria-label="Region summary">
            <RegionNextActionPanel regionProgress={regionProgress} summary={summary} />
            <RegionProgressStrip regionProgress={regionProgress} summary={summary} />
          </div>

          <RegionLearningNavigationBlock
            activePage={activePage}
            fieldGuideCompleted={fieldGuideCompleted}
            summary={summary}
            onNavigatePage={onNavigatePage}
          />

          <div className={`region-page-shell region-page-${activePage}`}>
            <div className="region-page-toolbar">
              <div>
                <span className="mode-pill">Focused region page</span>
                <h2>{REGION_LEARNING_PAGE_LABELS[activePage]}</h2>
                <p className="region-page-kicker">{theme.title}</p>
              </div>
            </div>

            {activePage === 'quick-check' ? (
              <QuickChecksPanel
                teachingSnippets={teachingSnippets}
                region={region}
                profileId={profileId}
                activityAttempts={learningActivityAttempts}
                maxInitialItems={Math.max(2, quickCheckCount)}
                onContinueToWarmUp={() => onNavigatePage?.('warm-up')}
                onContinueToExamPractice={() => onNavigatePage?.('exam-training')}
                onLearningActivityAttempt={onLearningActivityAttempt}
              />
            ) : null}

            {activePage === 'warm-up' ? (
              <WarmUpPracticePanel
                practiceItems={generatedPractice}
                region={region}
                profileId={profileId}
                activityAttempts={learningActivityAttempts}
                maxInitialItems={3}
                onContinueToFieldGuide={() => onNavigatePage?.('field-guide')}
                onContinueToExamPractice={() => onNavigatePage?.('exam-training')}
                onLearningActivityAttempt={onLearningActivityAttempt}
              />
            ) : null}

            {activePage === 'exam-training' ? (
              <TrainingGroundsPanel
                canTrain={canTrain}
                summary={summary}
                onStartTraining={onStartTraining}
              />
            ) : null}

            {activePage === 'guardian' ? (
              <GuardianEligibilityPanel
                guardianCleared={guardianCleared}
                guardianQuestion={guardianQuestion}
                regionName={theme.title}
                summary={summary}
                onChallengeGuardian={onChallengeGuardian}
              />
            ) : null}
          </div>
        </>
      )}
    </RegionLearningLayout>
  );
}

interface FieldGuidePageHeaderProps {
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  guardianCleared: boolean;
  regionProgress: RegionProgress;
  summary: RegionLearningSummary;
  theme: RegionTheme;
}

function FieldGuidePageHeader({
  fieldGuide,
  fieldGuideCompleted,
  guardianCleared,
  regionProgress,
  summary,
  theme,
}: FieldGuidePageHeaderProps) {
  const stats = [
    { label: 'Region', value: theme.title },
    { label: 'Rank', value: regionProgress.rank },
    { label: 'Attempts', value: String(regionProgress.attempts) },
    { label: 'Average', value: percent(regionProgress.averageScoreRatio) },
    { label: 'Recommended', value: summary.nextAction.label },
    { label: 'Guide', value: fieldGuideCompleted ? 'Complete' : 'Ready' },
    { label: 'Guardian', value: guardianStatus(summary, guardianCleared) },
  ];

  return (
    <header className="field-guide-page-header">
      <div className="field-guide-page-title">
        <span className="mode-pill">Focused lesson</span>
        <h2 id="region-hub-title">Field Guide</h2>
        <p className="field-guide-page-region">{theme.title}</p>
        <p className="field-guide-page-purpose"><MathText text={fieldGuide.topic} /></p>
      </div>

      <dl className="field-guide-compact-stats" aria-label="Field Guide progress summary">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

interface RegionLearningNavProps {
  activePage: RegionLearningPageId;
  onNavigatePage?: (page: RegionLearningPageId) => void;
}

function RegionLearningNavigationBlock({
  activePage,
  fieldGuideCompleted,
  onNavigatePage,
  summary,
}: RegionLearningNavProps & {
  fieldGuideCompleted: boolean;
  summary: RegionLearningSummary;
}) {
  return (
    <div className="region-learning-navigation-block">
      <RegionArcTimeline fieldGuideCompleted={fieldGuideCompleted} summary={summary} />
      <RegionLearningNav activePage={activePage} onNavigatePage={onNavigatePage} />
    </div>
  );
}

function RegionLearningNav({ activePage, onNavigatePage }: RegionLearningNavProps) {
  return (
    <nav className="region-learning-nav" aria-label="Region learning pages">
      {REGION_LEARNING_PAGE_ORDER.map((page) => (
        <button
          type="button"
          key={page}
          className={activePage === page ? 'active' : ''}
          aria-current={activePage === page ? 'page' : undefined}
          onClick={() => onNavigatePage?.(page)}
        >
          {REGION_LEARNING_PAGE_LABELS[page]}
        </button>
      ))}
    </nav>
  );
}

interface RegionHubHomeProps {
  canTrain: boolean;
  fieldGuideCompleted: boolean;
  generatedPracticeCount: number;
  guardianCleared: boolean;
  quickCheckCount: number;
  regionProgress: RegionProgress;
  stateLabel: string;
  summary: RegionLearningSummary;
  theme: RegionTheme;
  onNavigatePage?: (page: RegionLearningPageId) => void;
  onReturnToMap: () => void;
}

function hubActionIcon(page: HubActionPageId): ReactNode {
  if (page === 'field-guide') return <BookOpenCheck size={22} />;
  if (page === 'quick-check') return <CircleHelp size={22} />;
  if (page === 'warm-up') return <Dumbbell size={22} />;
  if (page === 'exam-training') return <Swords size={22} />;
  return <ShieldCheck size={22} />;
}

function guardianStatus(summary: RegionLearningSummary, guardianCleared: boolean): string {
  if (guardianCleared) return 'Cleared';
  return summary.guardianEligibility.eligible ? 'Unlocked' : 'Locked';
}

function hubActionState(input: {
  canTrain: boolean;
  fieldGuideCompleted: boolean;
  generatedPracticeCount: number;
  guardianCleared: boolean;
  page: HubActionPageId;
  quickCheckCount: number;
  summary: RegionLearningSummary;
}): { disabled: boolean; status: string } {
  if (input.page === 'field-guide') return { disabled: false, status: input.fieldGuideCompleted ? 'Complete' : 'Ready' };
  if (input.page === 'quick-check') return { disabled: false, status: input.quickCheckCount ? `${input.quickCheckCount} available` : 'No checks yet' };
  if (input.page === 'warm-up') return { disabled: false, status: input.generatedPracticeCount ? `${input.generatedPracticeCount} available` : 'No warm-ups yet' };
  if (input.page === 'exam-training') return { disabled: false, status: input.canTrain ? 'Ready' : 'No trainable images' };
  const locked = !input.guardianCleared && !input.summary.guardianEligibility.eligible;
  return { disabled: locked, status: guardianStatus(input.summary, input.guardianCleared) };
}

function recommendedHubPage(input: {
  canTrain: boolean;
  fieldGuideCompleted: boolean;
  generatedPracticeCount: number;
  guardianCleared: boolean;
  quickCheckCount: number;
  summary: RegionLearningSummary;
}): HubActionPageId {
  const { summary } = input;

  if (summary.nextAction.kind === 'field_guide') return 'field-guide';
  if (summary.nextAction.kind === 'guardian') return 'guardian';

  if (summary.nextAction.kind === 'complete') {
    return input.guardianCleared ? 'exam-training' : 'guardian';
  }

  if (summary.nextAction.kind === 'review') return 'exam-training';

  if (summary.nextAction.kind === 'training') {
    if (input.fieldGuideCompleted && input.quickCheckCount > 0 && summary.learningActivityReadiness.quickCheckAttempts === 0) {
      return 'quick-check';
    }

    if (input.generatedPracticeCount > 0 && summary.learningActivityReadiness.warmUpAttempts === 0) {
      return 'warm-up';
    }

    if (summary.trainingSession.intent === 'warm_up' && input.generatedPracticeCount > 0) {
      return 'warm-up';
    }

    return 'exam-training';
  }

  if (input.fieldGuideCompleted && input.canTrain) return 'exam-training';
  return 'field-guide';
}

function RegionHubHome({
  canTrain,
  fieldGuideCompleted,
  generatedPracticeCount,
  guardianCleared,
  quickCheckCount,
  regionProgress,
  stateLabel,
  summary,
  theme,
  onNavigatePage,
  onReturnToMap,
}: RegionHubHomeProps) {
  const primaryPage = recommendedHubPage({
    canTrain,
    fieldGuideCompleted,
    generatedPracticeCount,
    guardianCleared,
    quickCheckCount,
    summary,
  });
  const primaryActionState = hubActionState({
    canTrain,
    fieldGuideCompleted,
    generatedPracticeCount,
    guardianCleared,
    page: primaryPage,
    quickCheckCount,
    summary,
  });
  const secondaryPages = hubActionPages.filter((page) => page !== primaryPage);
  const stats = [
    { label: 'Status', value: stateLabel },
    { label: 'Rank', value: regionProgress.rank },
    { label: 'Attempts', value: String(regionProgress.attempts) },
    { label: 'Average', value: percent(regionProgress.averageScoreRatio) },
    { label: 'Guardian', value: guardianStatus(summary, guardianCleared) },
  ];

  return (
    <div className="region-home">
      <header className="region-home-header">
        <div className="region-home-heading">
          <span className="mode-pill">P3 Region</span>
          <h2 id="region-hub-title">{theme.title}</h2>
          <p>{theme.subtitle}</p>
        </div>

        <dl className="region-home-stats" aria-label="Compact learning stats">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <button className="region-home-return" type="button" onClick={onReturnToMap}>
          <ArrowLeft size={18} />
          Return to map
        </button>
      </header>

      <RegionArtwork regionId={regionProgress.region.id} theme={theme} />

      <nav className="region-home-actions" aria-label="Region learning actions">
        <button
          type="button"
          className={`region-home-primary-action${primaryActionState.disabled ? ' is-locked' : ''}`}
          data-region-page={primaryPage}
          disabled={primaryActionState.disabled}
          onClick={() => onNavigatePage?.(primaryPage)}
        >
          <span className="region-home-action-icon" aria-hidden="true">{hubActionIcon(primaryPage)}</span>
          <span className="region-home-primary-copy">
            <small>Current step</small>
            <strong>{hubActionLabels[primaryPage]}</strong>
            <span>{summary.nextAction.label}</span>
            <p>{summary.nextAction.explanation}</p>
          </span>
          <span className="region-home-primary-detail">{hubActionPrimaryCopy[primaryPage]}</span>
          <span className="region-home-action-status">
            {primaryActionState.disabled ? <Lock size={14} aria-hidden="true" /> : null}
            {primaryActionState.status}
          </span>
        </button>

        <div className="region-home-secondary-steps" aria-label="Other region steps">
          {secondaryPages.map((page) => {
            const actionState = hubActionState({
              canTrain,
              fieldGuideCompleted,
              generatedPracticeCount,
              guardianCleared,
              page,
              quickCheckCount,
              summary,
            });
            return (
              <button
                type="button"
                className={`region-home-action-card region-home-secondary-step${actionState.disabled ? ' is-locked' : ''}`}
                data-region-page={page}
                disabled={actionState.disabled}
                key={page}
                onClick={() => onNavigatePage?.(page)}
              >
                <span className="region-home-action-icon" aria-hidden="true">{hubActionIcon(page)}</span>
                <span className="region-home-action-copy">
                  <strong>{hubActionLabels[page]}</strong>
                  <small>{hubActionDescriptions[page]}</small>
                </span>
                <span className="region-home-action-status">
                  {actionState.disabled ? <Lock size={14} aria-hidden="true" /> : null}
                  {actionState.status}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function RegionArtwork({ regionId, theme }: { regionId: string; theme: RegionTheme }) {
  const regionArt = regionHubArtAssets[regionId];
  const [imageFailed, setImageFailed] = useState(false);

  if (regionArt && !imageFailed) {
    return (
      <section className="region-home-artwork" aria-label={`${theme.title} region artwork`}>
        <img
          className="region-home-artwork-image"
          src={regionArt}
          alt=""
          aria-hidden="true"
          onError={() => setImageFailed(true)}
        />
      </section>
    );
  }

  return (
    <section className="region-home-artwork" aria-label={`${theme.title} region artwork`}>
      <div className="region-home-artwork-scene" aria-hidden="true">
        <svg className="region-home-artwork-svg" viewBox="0 0 640 300" focusable="false">
          <rect className="artwork-vault-shadow" x="118" y="218" width="404" height="34" rx="17" />
          <path className="artwork-vault-arch" d="M168 232V126c0-66 54-120 120-120h64c66 0 120 54 120 120v106H168Z" />
          <circle className="artwork-vault-door" cx="320" cy="150" r="82" />
          <circle className="artwork-vault-inner" cx="320" cy="150" r="50" />
          <path className="artwork-vault-spokes" d="M320 68v164M238 150h164M262 92l116 116M378 92 262 208" />
          <path className="artwork-gold-glow" d="M154 238c36-45 95-68 176-68 78 0 134 23 168 68H154Z" />
          <g className="artwork-gold-pile">
            <ellipse cx="236" cy="232" rx="50" ry="14" />
            <ellipse cx="304" cy="222" rx="64" ry="17" />
            <ellipse cx="384" cy="234" rx="58" ry="15" />
            <circle cx="266" cy="202" r="13" />
            <circle cx="350" cy="198" r="12" />
            <circle cx="418" cy="210" r="10" />
          </g>
          <path className="artwork-dragon-outline" d="M216 182c26-28 62-38 102-28 15 4 28 2 42-7 20-13 46-13 70 0-17 5-27 15-31 31 22 2 38 14 48 35-30-14-58-13-83 4-30 19-64 19-102-2-16-9-31-8-46 4 5-15 13-27 26-36-9-2-18-2-26-1Z" />
          <path className="artwork-dragon-wing" d="M326 147c-10-35 5-66 45-92 0 37-15 68-45 92Z" />
        </svg>
        <div className="region-home-artwork-glow" />
      </div>
    </section>
  );
}
