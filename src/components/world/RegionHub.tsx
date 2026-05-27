import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpenCheck, ChevronRight, ListChecks, Lock, ShieldCheck, Swords } from 'lucide-react';
import type { FieldGuideTopic } from '../../data/fieldGuideTopics';
import type { LearningActivityAttempt, NormalizedQuestion, RegionProgress, TrainingSessionIntent } from '../../types';
import type { RegionFieldGuide } from '../../data/regionFieldGuides';
import { getGuardianChallengeForRegion } from '../../data/guardianChallenges';
import type { GeneratedPracticeItem } from '../../lib/generatedPractice';
import {
  REGION_LEARNING_PAGE_LABELS,
  REGION_LEARNING_PAGE_ORDER,
  type RegionLearningPageId,
} from '../../lib/regionRoutes';
import { getRegionTheme, type RegionTheme } from '../../lib/regionThemes';
import type { RegionLearningSummary } from '../../lib/regionLearning';
import { getRegionHubAsset, getRegionHubAssetDimensions } from '../../lib/regionAssets';
import type { TeachingSnippet } from '../../lib/teachingSnippets';
import { canStudentUseRegionActivity, lockedRegionMessage, type StudentRegionAccess } from '../../lib/classRegionAccess';
import { MathText } from '../shared/MathText';
import { FieldGuidePanel } from './regionHub/FieldGuidePanel';
import { GuardianChallengePanel } from './regionHub/GuardianChallengePanel';
import { GuardianEligibilityPanel } from './regionHub/GuardianEligibilityPanel';
import { RegionLearningLayout } from './regionHub/RegionLearningLayout';
import { SkillPracticePanel, type SkillPracticeFocus } from './regionHub/SkillPracticePanel';
import { TrainingGroundsPanel } from './regionHub/TrainingGroundsPanel';

interface RegionHubProps {
  regionProgress: RegionProgress;
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  teachingSnippets: TeachingSnippet[];
  generatedPractice: GeneratedPracticeItem[];
  learningActivityAttempts?: LearningActivityAttempt[];
  profileId?: string;
  summary: RegionLearningSummary;
  studentRegionAccess?: StudentRegionAccess;
  onCompleteFieldGuide: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
  onStartTraining: (intent: TrainingSessionIntent) => void;
  onChallengeGuardian: (question: NormalizedQuestion) => void;
  activePage?: RegionLearningPageId;
  onNavigatePage?: (page: RegionLearningPageId) => void;
  onReturnToMap: () => void;
}

type HubActionPageId = Exclude<RegionLearningPageId, 'hub' | 'quick-check' | 'warm-up'>;
type StudentNavPageId = Exclude<RegionLearningPageId, 'quick-check' | 'warm-up'>;

const studentNavPages = REGION_LEARNING_PAGE_ORDER as StudentNavPageId[];

const hubActionPages: HubActionPageId[] = [
  'field-guide',
  'skill-practice',
  'exam-training',
  'guardian',
];

const studentLoopExplanations: Record<HubActionPageId, string> = {
  'field-guide': 'Read the guide',
  'skill-practice': 'Practice one step',
  'exam-training': 'Try real exam questions',
  guardian: 'Final challenge',
};

const hubActionPrimaryCopy: Record<HubActionPageId, string> = {
  'field-guide': 'Read the next guide step before practice.',
  'skill-practice': 'Do one low-stakes practice task.',
  'exam-training': 'Work from a real Paper 3 question image.',
  guardian: 'Take the final region challenge when it is ready.',
};

function guardianNextStep(summary: RegionLearningSummary): string | undefined {
  const firstMissing = summary.guardianEligibility.requirements.find((requirement) => !requirement.completed);
  if (!firstMissing) return undefined;
  if (firstMissing.id === 'field_guide') return 'Review the Field Guide first.';
  if (firstMissing.id === 'attempt_count') return firstMissing.nextAction;
  if (firstMissing.id === 'recent_high_score') return 'Save one stronger Exam Training attempt to open the Guardian.';
  if (firstMissing.id === 'subtopic_spread') return 'Try one Exam Training question from another part of this region.';
  return 'This Guardian question is still being prepared.';
}

function hubActionPrimaryStudentCopy(input: {
  fieldGuideCompleted: boolean;
  fieldGuideTopic: string;
  page: HubActionPageId;
  regionName: string;
  summary: RegionLearningSummary;
}): { eyebrow: string; title: string; description: string; button: string } {
  if (input.page === 'field-guide') {
    const guideTopic = input.fieldGuideTopic
      .replace(new RegExp(`^${input.regionName}\\s+covers\\s+`, 'i'), '')
      .replace(/\.$/, '');
    return {
      eyebrow: 'Current step · Do this next',
      title: input.fieldGuideCompleted ? 'Review the Field Guide, then try a short check.' : `Start here: Field Guide. Learn about ${guideTopic || input.regionName}.`,
      description: input.fieldGuideCompleted
        ? 'Use the guide as a quick reset before practice.'
        : 'Read the next guide step before practice.',
      button: input.fieldGuideCompleted ? 'Open Field Guide' : 'Start here',
    };
  }

  if (input.page === 'skill-practice') {
    const needsFirstCheck = input.summary.learningActivityReadiness.quickCheckAttempts === 0;
    return {
      eyebrow: 'Current step · Do this next',
      title: needsFirstCheck ? 'Skill Practice: try one short skill check.' : 'Skill Practice: build the method with one guided step.',
      description: needsFirstCheck
        ? 'It is short and low-stakes, so you get a first win before full exam pressure.'
        : 'Use one guided task to settle the method before the next exam question.',
      button: needsFirstCheck ? 'Start short check' : 'Start guided practice',
    };
  }

  if (input.page === 'guardian') {
    return {
      eyebrow: 'Current step · Do this next',
      title: 'Guardian ready: enter the final check.',
      description: `${input.regionName} is open. This is a scored challenge, not ordinary practice.`,
      button: 'Enter Guardian',
    };
  }

  return {
    eyebrow: 'Current step · Do this next',
    title: `Next: do one exam question for ${input.regionName}.`,
    description: input.summary.trainingSession.reason || hubActionPrimaryCopy[input.page],
    button: 'Start exam question',
  };
}

function hubActionLockReason(page: HubActionPageId, summary: RegionLearningSummary): string | undefined {
  if (page !== 'guardian') return undefined;
  if (summary.guardianEligibility.eligible) return undefined;
  return guardianNextStep(summary) ?? 'Complete one more region step before challenging the Guardian.';
}

function skillPracticeFocusForPage(page: RegionLearningPageId, summary: RegionLearningSummary): SkillPracticeFocus {
  if (page === 'quick-check') return 'quick-check';
  if (page === 'warm-up') return 'warm-up';
  if (summary.learningActivityReadiness.quickCheckAttempts === 0) return 'quick-check';
  if (summary.learningActivityReadiness.warmUpAttempts === 0) return 'warm-up';
  return 'overview';
}

function displayedRegionPage(page: RegionLearningPageId): RegionLearningPageId {
  return page === 'quick-check' || page === 'warm-up' ? 'skill-practice' : page;
}

export function RegionHub({
  regionProgress,
  fieldGuide,
  fieldGuideCompleted,
  teachingSnippets,
  generatedPractice,
  learningActivityAttempts = [],
  profileId,
  summary,
  studentRegionAccess,
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
  const canUseQuickCheck = canStudentUseRegionActivity(studentRegionAccess, 'quick_check');
  const canUseWarmUp = canStudentUseRegionActivity(studentRegionAccess, 'warm_up');
  const canUseExamPractice = canStudentUseRegionActivity(studentRegionAccess, 'exam_practice');
  const canUseGuardian = canStudentUseRegionActivity(studentRegionAccess, 'guardian');
  const canUseSkillPractice = canUseQuickCheck || canUseWarmUp;
  const accessLocked = !canUseExamPractice;
  const guardianQuestion = summary.guardianEligibility.guardianQuestion;
  const guardianCleared = summary.state === 'guardian_cleared' || summary.state === 'mastered';
  const quickCheckCount = teachingSnippets.filter((snippet) => snippet.quickCheck).length;
  const guardianChallenge = getGuardianChallengeForRegion(region.id);
  const activeDisplayPage = displayedRegionPage(activePage);
  const [currentFieldGuideTopic, setCurrentFieldGuideTopic] = useState<FieldGuideTopic | undefined>();

  useEffect(() => {
    setCurrentFieldGuideTopic(undefined);
  }, [region.id]);

  if (activePage === 'field-guide') {
    return (
      <RegionLearningLayout theme={theme} summary={summary}>
        <FocusedRegionPageHeader
          activePage={activePage}
          fieldGuide={fieldGuide}
          fieldGuideSnippetCount={teachingSnippets.length}
          summary={summary}
          theme={theme}
          onReturnToMap={onReturnToMap}
        />

        <RegionLearningNav
          activePage={activePage}
          onNavigatePage={onNavigatePage}
          studentRegionAccess={studentRegionAccess}
        />

        <div className="region-page-shell region-page-field-guide">
          <FieldGuidePanel
            fieldGuide={fieldGuide}
            fieldGuideCompleted={fieldGuideCompleted}
            region={region}
            theme={theme}
            teachingSnippets={teachingSnippets}
            maxInitialSnippets={Math.max(2, teachingSnippets.length)}
            onCompleteFieldGuide={onCompleteFieldGuide}
            onBackToRegionHub={() => onNavigatePage?.('hub')}
            onCurrentTopicChange={setCurrentFieldGuideTopic}
            onContinueToQuickChecks={canUseSkillPractice ? (topic) => {
              setCurrentFieldGuideTopic(topic);
              onNavigatePage?.('skill-practice');
            } : undefined}
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
          accessLocked={accessLocked}
          fieldGuide={fieldGuide}
          fieldGuideCompleted={fieldGuideCompleted}
          generatedPracticeCount={generatedPractice.length}
          guardianCleared={guardianCleared}
          quickCheckCount={quickCheckCount}
          regionProgress={regionProgress}
          summary={summary}
          studentRegionAccess={studentRegionAccess}
          theme={theme}
          onNavigatePage={onNavigatePage}
          onReturnToMap={onReturnToMap}
        />
      ) : (
        <>
          <FocusedRegionPageHeader
            activePage={activePage}
            theme={theme}
            summary={summary}
            onReturnToMap={onReturnToMap}
          />

          <RegionLearningNav
            activePage={activePage}
            onNavigatePage={onNavigatePage}
            studentRegionAccess={studentRegionAccess}
          />

          <div className={`region-page-shell region-page-${activeDisplayPage}`}>
            {activeDisplayPage === 'skill-practice' ? (
              canUseSkillPractice ? (
                <SkillPracticePanel
                  teachingSnippets={teachingSnippets}
                  practiceItems={generatedPractice}
                  region={region}
                  profileId={profileId}
                  activityAttempts={learningActivityAttempts}
                  focus={skillPracticeFocusForPage(activePage, summary)}
                  canUseQuickCheck={canUseQuickCheck}
                  canUseWarmUp={canUseWarmUp}
                  canUseExamPractice={canUseExamPractice}
                  currentFieldGuideTopic={currentFieldGuideTopic}
                  quickCheckLockedContent={<LockedRegionActivityPanel activityLabel="Short Checks" studentRegionAccess={studentRegionAccess} />}
                  warmUpLockedContent={<LockedRegionActivityPanel activityLabel="Guided Practice" studentRegionAccess={studentRegionAccess} />}
                  onContinueToFieldGuide={() => onNavigatePage?.('field-guide')}
                  onContinueToExamPractice={canUseExamPractice ? () => onNavigatePage?.('exam-training') : undefined}
                  onLearningActivityAttempt={onLearningActivityAttempt}
                />
              ) : <LockedRegionActivityPanel activityLabel="Skill Practice" studentRegionAccess={studentRegionAccess} />
            ) : null}

            {activeDisplayPage === 'exam-training' ? (
              canUseExamPractice ? (
                <TrainingGroundsPanel
                  canTrain={canTrain}
                  summary={summary}
                  onStartTraining={onStartTraining}
                />
              ) : <LockedRegionActivityPanel activityLabel="Exam Training" studentRegionAccess={studentRegionAccess} />
            ) : null}

            {activeDisplayPage === 'guardian' ? (
              canUseGuardian ? (
                <>
                  <GuardianChallengePanel
                    challenge={guardianChallenge}
                    guardianCleared={guardianCleared}
                    isUnlocked={summary.guardianEligibility.eligible}
                    regionName={theme.title}
                  />
                  <GuardianEligibilityPanel
                    guardianCleared={guardianCleared}
                    guardianQuestion={guardianQuestion}
                    regionName={theme.title}
                    summary={summary}
                    onChallengeGuardian={onChallengeGuardian}
                    onNavigatePage={onNavigatePage}
                  />
                </>
              ) : <LockedRegionActivityPanel activityLabel="Guardian Challenge" studentRegionAccess={studentRegionAccess} />
            ) : null}
          </div>
        </>
      )}
    </RegionLearningLayout>
  );
}

interface FocusedRegionPageHeaderProps {
  activePage: Exclude<RegionLearningPageId, 'hub'>;
  fieldGuide?: RegionFieldGuide;
  fieldGuideSnippetCount?: number;
  onReturnToMap: () => void;
  summary: RegionLearningSummary;
  theme: RegionTheme;
}

function FocusedRegionPageHeader({
  activePage,
  fieldGuide,
  fieldGuideSnippetCount,
  onReturnToMap,
  summary,
  theme,
}: FocusedRegionPageHeaderProps) {
  const isSkillPracticePage = displayedRegionPage(activePage) === 'skill-practice';
  return (
    <header className="focused-region-page-header">
      <div className="focused-region-page-title">
        <span className="mode-pill">Focused step</span>
        <h2 id="region-hub-title">{REGION_LEARNING_PAGE_LABELS[activePage]}</h2>
        <p className="field-guide-page-region">{theme.title}</p>
        {fieldGuide ? (
          <p className="field-guide-page-purpose"><MathText text={fieldGuide.topic} /></p>
        ) : isSkillPracticePage ? (
          <p className="field-guide-page-purpose">Practice one step at a time before Exam Training.</p>
        ) : (
          <p className="field-guide-page-purpose">{summary.nextAction.label}</p>
        )}
      </div>

      <div className="focused-region-header-actions">
        {fieldGuide ? (
          <span className="focused-region-progress-chip">
            {fieldGuideSnippetCount ? `Snippet 1 of ${fieldGuideSnippetCount}` : 'Field Guide'}
          </span>
        ) : null}
        {!isSkillPracticePage ? <span className="focused-region-next-step">{summary.nextAction.label}</span> : null}
        <button className="region-home-return" type="button" onClick={onReturnToMap}>
          <ArrowLeft size={18} />
          Return to map
        </button>
      </div>
    </header>
  );
}

interface RegionLearningNavProps {
  activePage: RegionLearningPageId;
  onNavigatePage?: (page: RegionLearningPageId) => void;
  studentRegionAccess?: StudentRegionAccess;
}

function isRegionLearningNavLocked(page: RegionLearningPageId, studentRegionAccess?: StudentRegionAccess): boolean {
  if (page === 'hub' || page === 'field-guide') return false;
  if (page === 'skill-practice') {
    return !canStudentUseRegionActivity(studentRegionAccess, 'quick_check')
      && !canStudentUseRegionActivity(studentRegionAccess, 'warm_up');
  }
  const activity = page === 'exam-training'
    ? 'exam_practice'
    : page === 'quick-check'
      ? 'quick_check'
      : page === 'warm-up'
        ? 'warm_up'
        : 'guardian';
  return !canStudentUseRegionActivity(studentRegionAccess, activity);
}

function RegionLearningNav({ activePage, onNavigatePage, studentRegionAccess }: RegionLearningNavProps) {
  const activeDisplayPage = displayedRegionPage(activePage);
  return (
    <nav className="region-learning-nav" aria-label="Region learning pages">
      {studentNavPages.map((page) => {
        const locked = isRegionLearningNavLocked(page, studentRegionAccess);
        const active = activeDisplayPage === page;
        return (
          <button
            type="button"
            key={page}
            className={active ? 'active' : ''}
            data-page-state={locked ? 'locked' : active ? 'active' : 'available'}
            aria-current={active ? 'page' : undefined}
            disabled={locked}
            onClick={() => onNavigatePage?.(page)}
          >
            <span>{REGION_LEARNING_PAGE_LABELS[page]}</span>
            {page !== 'hub' ? <small>{studentLoopExplanations[page]}</small> : <small>Return to region overview</small>}
          </button>
        );
      })}
    </nav>
  );
}

interface RegionHubHomeProps {
  canTrain: boolean;
  accessLocked: boolean;
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  generatedPracticeCount: number;
  guardianCleared: boolean;
  quickCheckCount: number;
  regionProgress: RegionProgress;
  summary: RegionLearningSummary;
  studentRegionAccess?: StudentRegionAccess;
  theme: RegionTheme;
  onNavigatePage?: (page: RegionLearningPageId) => void;
  onReturnToMap: () => void;
}

function hubActionIcon(page: HubActionPageId): ReactNode {
  if (page === 'field-guide') return <BookOpenCheck size={22} />;
  if (page === 'skill-practice') return <ListChecks size={22} />;
  if (page === 'exam-training') return <Swords size={22} />;
  return <ShieldCheck size={22} />;
}

function hubActionState(input: {
  canTrain: boolean;
  fieldGuideCompleted: boolean;
  generatedPracticeCount: number;
  guardianCleared: boolean;
  page: HubActionPageId;
  quickCheckCount: number;
  summary: RegionLearningSummary;
  studentRegionAccess?: StudentRegionAccess;
}): { disabled: boolean; status: 'Locked' | 'Ready' | 'In progress' | 'Complete'; helper?: string } {
  if (input.page === 'field-guide') return { disabled: false, status: input.fieldGuideCompleted ? 'Complete' : 'Ready' };
  const activity = input.page === 'exam-training'
    ? 'exam_practice'
    : input.page === 'guardian'
      ? 'guardian'
      : undefined;
  if (input.page === 'skill-practice') {
    const quickCheckOpen = canStudentUseRegionActivity(input.studentRegionAccess, 'quick_check');
    const warmUpOpen = canStudentUseRegionActivity(input.studentRegionAccess, 'warm_up');
    if (!quickCheckOpen && !warmUpOpen) return { disabled: true, status: 'Locked' };
    const attempts = input.summary.learningActivityReadiness.quickCheckAttempts + input.summary.learningActivityReadiness.warmUpAttempts;
    if (attempts > 0) return { disabled: false, status: 'In progress', helper: `${attempts} saved` };
    return { disabled: false, status: 'Ready' };
  }
  if (activity && !canStudentUseRegionActivity(input.studentRegionAccess, activity)) {
    return { disabled: true, status: 'Locked' };
  }
  if (input.page === 'exam-training') {
    if (!input.canTrain) return { disabled: true, status: 'Locked' };
    return { disabled: false, status: input.summary.state === 'training_in_progress' ? 'In progress' : 'Ready' };
  }
  return { disabled: !input.summary.guardianEligibility.eligible, status: input.guardianCleared ? 'Complete' : input.summary.guardianEligibility.eligible ? 'Ready' : 'Locked' };
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
      return 'skill-practice';
    }

    if (input.generatedPracticeCount > 0 && summary.learningActivityReadiness.warmUpAttempts === 0) {
      return 'skill-practice';
    }

    if (summary.trainingSession.intent === 'warm_up' && input.generatedPracticeCount > 0) {
      return 'skill-practice';
    }

    return 'exam-training';
  }

  if (input.fieldGuideCompleted && input.canTrain) return 'exam-training';
  return 'field-guide';
}

function RegionHubHome({
  canTrain,
  accessLocked,
  fieldGuide,
  fieldGuideCompleted,
  generatedPracticeCount,
  guardianCleared,
  quickCheckCount,
  regionProgress,
  summary,
  studentRegionAccess,
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
    studentRegionAccess,
  });
  const primaryCopy = hubActionPrimaryStudentCopy({
    fieldGuideCompleted,
    fieldGuideTopic: fieldGuide.topic,
    page: primaryPage,
    regionName: theme.title,
    summary,
  });
  const steps: Array<{ page: HubActionPageId; label: string; state: 'complete' | 'in-progress' | 'ready' | 'locked' }> = [
    {
      page: 'field-guide',
      label: 'Field Guide',
      state: fieldGuideCompleted ? 'complete' : primaryPage === 'field-guide' ? 'in-progress' : 'ready',
    },
    {
      page: 'skill-practice',
      label: 'Skill Practice',
      state: !canStudentUseRegionActivity(studentRegionAccess, 'quick_check') && !canStudentUseRegionActivity(studentRegionAccess, 'warm_up')
        ? 'locked'
        : primaryPage === 'skill-practice'
          ? 'in-progress'
          : summary.learningActivityReadiness.quickCheckAttempts + summary.learningActivityReadiness.warmUpAttempts > 0
            ? 'complete'
            : 'ready',
    },
    {
      page: 'exam-training',
      label: 'Exam Training',
      state: !canStudentUseRegionActivity(studentRegionAccess, 'exam_practice') ? 'locked' : primaryPage === 'exam-training' ? 'in-progress' : regionProgress.attempts > 0 ? 'complete' : 'ready',
    },
    {
      page: 'guardian',
      label: 'Guardian',
      state: !canStudentUseRegionActivity(studentRegionAccess, 'guardian') || !summary.guardianEligibility.eligible ? 'locked' : guardianCleared ? 'complete' : primaryPage === 'guardian' ? 'in-progress' : 'ready',
    },
  ];

  return (
    <div className="region-home">
      <header className="region-home-header">
        <div className="region-home-heading">
          <span className="mode-pill">P3 Region</span>
          <h2 id="region-hub-title">{theme.title}</h2>
          <p>{theme.subtitle}</p>
        </div>

        <button className="region-home-return" type="button" onClick={onReturnToMap}>
          <ArrowLeft size={18} />
          Return to map
        </button>
      </header>

      {accessLocked ? (
        <div className="region-access-notice" role="status">
          <Lock size={18} aria-hidden="true" />
          <div>
            <strong>Field Guide only</strong>
            <span>{lockedRegionMessage(studentRegionAccess)} Existing progress stays visible, but this region will not add new progress while locked.</span>
          </div>
        </div>
      ) : null}

      <div className="region-home-body">
        <section className="region-first-run-loop region-home-rail" aria-label="Region learning loop">
          <div className="region-rail-intro">
            <span className="mode-pill">Learning loop</span>
            <strong>Choose a step.</strong>
          </div>
          <ol>
            {steps.map((step) => (
              <li className={`is-${step.state}${step.page === primaryPage && step.state !== 'locked' ? ' is-recommended-step' : ''}`} key={step.page}>
                <button type="button" disabled={step.state === 'locked'} onClick={() => onNavigatePage?.(step.page)}>
                  <span className="region-home-action-icon" aria-hidden="true">{hubActionIcon(step.page)}</span>
                  <span className="region-home-action-copy">
                    <strong>{step.label}</strong>
                  </span>
                  <span className="region-home-action-status">
                    {step.state === 'locked' ? <Lock size={14} aria-hidden="true" /> : null}
                    {step.state === 'complete' ? 'Complete' : step.state === 'in-progress' ? 'In progress' : step.state === 'locked' ? 'Locked' : 'Ready'}
                  </span>
                  <ChevronRight className="region-home-action-chevron" size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div className="region-home-center">
          <RegionArtwork regionId={regionProgress.region.id} theme={theme} />
          <RegionJourneyBar steps={steps} onNavigatePage={onNavigatePage} />
        </div>

        <aside className="region-home-current-step region-home-rail" aria-label="Current step">
          <section className={`region-current-step-card${primaryActionState.disabled ? ' is-locked' : ' next-step-glow'}`} aria-label="Current region step">
            <span className="region-home-action-icon" aria-hidden="true">{hubActionIcon(primaryPage)}</span>
            <div className="region-home-primary-copy">
              <small>{primaryCopy.eyebrow}</small>
              <strong>{primaryCopy.title}</strong>
              <p>{primaryCopy.description}</p>
            </div>
            <span className="region-home-action-status">
              {primaryActionState.disabled ? <Lock size={14} aria-hidden="true" /> : null}
              {primaryActionState.status}
            </span>
            <button
              type="button"
              className="region-current-step-button next-step-glow"
              data-region-page={primaryPage}
              disabled={primaryActionState.disabled}
              onClick={() => onNavigatePage?.(primaryPage)}
            >
              {hubActionIcon(primaryPage)}
              {primaryCopy.button}
            </button>
            {hubActionLockReason(primaryPage, summary) ? (
              <p className="region-home-lock-reason">{hubActionLockReason(primaryPage, summary)}</p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

function RegionJourneyBar({
  steps,
  onNavigatePage,
}: {
  steps: Array<{ page: HubActionPageId; label: string; state: 'complete' | 'in-progress' | 'ready' | 'locked' }>;
  onNavigatePage?: (page: RegionLearningPageId) => void;
}) {
  const stateLabel = {
    complete: 'Complete',
    'in-progress': 'In progress',
    ready: 'Ready',
    locked: 'Locked',
  };

  return (
    <section className="region-journey-bar" aria-label="Learning journey">
      {steps.map((step, index) => (
        <button
          type="button"
          className={`journey-step is-${step.state}${step.state === 'in-progress' ? ' next-step-glow' : ''}`}
          disabled={step.state === 'locked'}
          key={step.page}
          onClick={() => onNavigatePage?.(step.page)}
        >
          <span className="journey-step-status">
            {stateLabel[step.state]}
          </span>
          <span className="journey-step-label">
            <strong>{step.label}</strong>
          </span>
          <span className="journey-step-index" aria-hidden="true">{index + 1}</span>
        </button>
      ))}
    </section>
  );
}

function LockedRegionActivityPanel({ activityLabel, studentRegionAccess }: { activityLabel: string; studentRegionAccess?: StudentRegionAccess }) {
  return (
    <section className="region-activity-locked-panel" aria-label={`${activityLabel} locked`}>
      <Lock size={24} aria-hidden="true" />
      <div>
        <span className="mode-pill">Field Guide only</span>
        <h3>{activityLabel} is locked for this class</h3>
        <p>{lockedRegionMessage(studentRegionAccess)}</p>
        <p>Existing progress remains visible, but locked-region activities cannot save new attempts or clear the Guardian.</p>
      </div>
    </section>
  );
}

function RegionArtwork({ regionId, theme }: { regionId: string; theme: RegionTheme }) {
  const regionArt = getRegionHubAsset(regionId);
  const regionArtDimensions = getRegionHubAssetDimensions(regionId);
  const [imageFailed, setImageFailed] = useState(false);

  if (regionArt && !imageFailed) {
    return (
      <section className="region-home-artwork" aria-label={`${theme.title} region artwork`}>
        <img
          className="region-home-artwork-image"
          src={regionArt}
          width={regionArtDimensions?.width}
          height={regionArtDimensions?.height}
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
