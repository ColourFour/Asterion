import type { LearningActivityAttempt, NormalizedQuestion, RegionProgress, TrainingSessionIntent } from '../../types';
import type { RegionFieldGuide } from '../../data/regionFieldGuides';
import type { GeneratedPracticeItem } from '../../lib/generatedPractice';
import {
  REGION_LEARNING_PAGE_DESCRIPTIONS,
  REGION_LEARNING_PAGE_LABELS,
  REGION_LEARNING_PAGE_ORDER,
  type RegionLearningPageId,
} from '../../lib/regionRoutes';
import { getRegionTheme } from '../../lib/regionThemes';
import type { RegionLearningSummary } from '../../lib/regionLearning';
import type { TeachingSnippet } from '../../lib/teachingSnippets';
import { FieldGuidePanel } from './regionHub/FieldGuidePanel';
import { GuardianEligibilityPanel } from './regionHub/GuardianEligibilityPanel';
import { QuickChecksPanel } from './regionHub/QuickChecksPanel';
import { RegionArcTimeline } from './regionHub/RegionArcTimeline';
import { RegionHero } from './regionHub/RegionHero';
import { RegionLearningLayout } from './regionHub/RegionLearningLayout';
import { RegionNextActionPanel } from './regionHub/RegionNextActionPanel';
import { RegionProgressStrip } from './regionHub/RegionProgressStrip';
import { RegionRewardPreview } from './regionHub/RegionRewardPreview';
import { TrainingGroundsPanel } from './regionHub/TrainingGroundsPanel';
import { WarmUpPracticePanel } from './regionHub/WarmUpPracticePanel';

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

  return (
    <RegionLearningLayout theme={theme} summary={summary}>
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

      <RegionArcTimeline fieldGuideCompleted={fieldGuideCompleted} summary={summary} />

      {activePage !== 'hub' ? (
        <RegionLearningNav
          activePage={activePage}
          onNavigatePage={onNavigatePage}
        />
      ) : null}

      <div className={`region-page-shell region-page-${activePage}`}>
        {activePage !== 'hub' ? (
          <div className="region-page-toolbar">
            <div>
              <span className="mode-pill">Focused region page</span>
              <h2>{REGION_LEARNING_PAGE_LABELS[activePage]}</h2>
            </div>
          </div>
        ) : null}

        {activePage === 'hub' ? (
          <RegionHubPage
            canTrain={canTrain}
            fieldGuideCompleted={fieldGuideCompleted}
            generatedPracticeCount={generatedPractice.length}
            guardianCleared={guardianCleared}
            quickCheckCount={quickCheckCount}
            regionProgress={regionProgress}
            summary={summary}
            onNavigatePage={onNavigatePage}
          />
        ) : null}

        {activePage === 'field-guide' ? (
          <FieldGuidePanel
            fieldGuide={fieldGuide}
            fieldGuideCompleted={fieldGuideCompleted}
            theme={theme}
            teachingSnippets={teachingSnippets}
            maxInitialSnippets={Math.max(2, teachingSnippets.length)}
            onCompleteFieldGuide={onCompleteFieldGuide}
          />
        ) : null}

        {activePage === 'quick-check' ? (
          <QuickChecksPanel
            teachingSnippets={teachingSnippets}
            region={region}
            profileId={profileId}
            activityAttempts={learningActivityAttempts}
            maxInitialItems={Math.max(2, quickCheckCount)}
            onLearningActivityAttempt={onLearningActivityAttempt}
          />
        ) : null}

        {activePage === 'warm-up' ? (
          <WarmUpPracticePanel
            practiceItems={generatedPractice}
            region={region}
            profileId={profileId}
            activityAttempts={learningActivityAttempts}
            maxInitialItems={Math.max(3, generatedPractice.length)}
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
    </RegionLearningLayout>
  );
}

interface RegionLearningNavProps {
  activePage: RegionLearningPageId;
  onNavigatePage?: (page: RegionLearningPageId) => void;
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

interface RegionHubPageProps {
  canTrain: boolean;
  fieldGuideCompleted: boolean;
  generatedPracticeCount: number;
  guardianCleared: boolean;
  quickCheckCount: number;
  regionProgress: RegionProgress;
  summary: RegionLearningSummary;
  onNavigatePage?: (page: RegionLearningPageId) => void;
}

function pageStatus(input: {
  canTrain: boolean;
  fieldGuideCompleted: boolean;
  generatedPracticeCount: number;
  guardianCleared: boolean;
  page: RegionLearningPageId;
  quickCheckCount: number;
  summary: RegionLearningSummary;
}) {
  if (input.page === 'field-guide') return input.fieldGuideCompleted ? 'Complete' : 'Ready';
  if (input.page === 'quick-check') return input.quickCheckCount ? `${input.quickCheckCount} available` : 'Unavailable';
  if (input.page === 'warm-up') return input.generatedPracticeCount ? `${input.generatedPracticeCount} available` : 'Unavailable';
  if (input.page === 'exam-training') return input.canTrain ? 'Ready' : 'No trainable images';
  if (input.page === 'guardian') {
    if (input.guardianCleared) return 'Cleared';
    return input.summary.guardianEligibility.eligible ? 'Unlocked' : 'Locked';
  }
  return 'Overview';
}

function RegionHubPage({
  canTrain,
  fieldGuideCompleted,
  generatedPracticeCount,
  guardianCleared,
  quickCheckCount,
  regionProgress,
  summary,
  onNavigatePage,
}: RegionHubPageProps) {
  const actionPages = REGION_LEARNING_PAGE_ORDER.filter((page) => page !== 'hub');

  return (
    <div className="region-hub-orientation">
      <section className="region-action-card region-hub-overview-card">
        <div className="region-action-card-title">
          <div>
            <span>Region overview</span>
            <h3>{regionProgress.region.name}</h3>
            <p>{regionProgress.region.description}</p>
          </div>
        </div>
        <div className="region-action-card-body">
          <h4>Skill and subtopic overview</h4>
          <div className="subtopic-list region-hub-subtopics">
            {regionProgress.region.subtopics.map((subtopic) => <span key={subtopic}>{subtopic}</span>)}
          </div>
        </div>
      </section>

      <section className="region-action-card region-hub-options-card">
        <div className="region-action-card-title">
          <div>
            <span>Learning options</span>
            <h3>Choose one focused step</h3>
            <p>{summary.nextAction.explanation}</p>
          </div>
        </div>
        <div className="region-action-card-body">
          <div className="region-page-card-grid">
            {actionPages.map((page) => (
              <button
                type="button"
                className="region-page-card"
                key={page}
                onClick={() => onNavigatePage?.(page)}
              >
                <span>{pageStatus({
                  canTrain,
                  fieldGuideCompleted,
                  generatedPracticeCount,
                  guardianCleared,
                  page,
                  quickCheckCount,
                  summary,
                })}</span>
                <strong>{REGION_LEARNING_PAGE_LABELS[page]}</strong>
                <small>{REGION_LEARNING_PAGE_DESCRIPTIONS[page]}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="region-learning-support" aria-label="Region mastery and rewards progress">
        <RegionRewardPreview guardianCleared={guardianCleared} regionName={regionProgress.region.name} />
      </aside>
    </div>
  );
}
