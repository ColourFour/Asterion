import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, ListChecks } from 'lucide-react';
import type { FieldGuideTopic } from '../../../data/fieldGuideTopics';
import type { LearningActivityAttempt, RegionDefinition } from '../../../types';
import { orderGeneratedPracticeForFieldGuideTopic, type GeneratedPracticeItem } from '../../../lib/generatedPractice';
import type { TeachingSnippet } from '../../../lib/teachingSnippets';
import { QuickChecksPanel } from './QuickChecksPanel';
import { WarmUpPracticePanel } from './WarmUpPracticePanel';

export type SkillPracticeFocus = 'quick-check' | 'warm-up' | 'overview';
type SkillPracticeStepId = 'start-simple' | 'build-method' | 'ready-for-exam';

interface SkillPracticePanelProps {
  teachingSnippets: TeachingSnippet[];
  practiceItems: GeneratedPracticeItem[];
  region?: RegionDefinition;
  profileId?: string;
  activityAttempts?: LearningActivityAttempt[];
  focus?: SkillPracticeFocus;
  quickCheckLockedContent?: ReactNode;
  warmUpLockedContent?: ReactNode;
  canUseQuickCheck: boolean;
  canUseWarmUp: boolean;
  canUseExamPractice: boolean;
  currentFieldGuideTopic?: FieldGuideTopic;
  onContinueToFieldGuide?: () => void;
  onContinueToExamPractice?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

const skillPracticeSteps: Array<{
  id: SkillPracticeStepId;
  label: string;
  heading: string;
  description: string;
}> = [
  {
    id: 'start-simple',
    label: 'Start simple',
    heading: 'Start simple',
    description: 'Do one short check and get immediate feedback.',
  },
  {
    id: 'build-method',
    label: 'Build the method',
    heading: 'Build the method',
    description: 'Try a guided step, then compare with the worked route.',
  },
  {
    id: 'ready-for-exam',
    label: 'Ready for exam practice',
    heading: 'Ready for exam practice',
    description: 'Move to canonical exam questions and mark schemes when you are ready.',
  },
];

function stepForFocus(focus: SkillPracticeFocus): SkillPracticeStepId | undefined {
  if (focus === 'quick-check') return 'start-simple';
  if (focus === 'warm-up') return 'build-method';
  return undefined;
}

function hasCompletedActivity(activityAttempts: LearningActivityAttempt[], activityType: LearningActivityAttempt['activityType']): boolean {
  return activityAttempts.some((attempt) => attempt.activityType === activityType);
}

function defaultStepFor(input: {
  activityAttempts: LearningActivityAttempt[];
  canUseQuickCheck: boolean;
  canUseWarmUp: boolean;
  canUseExamPractice: boolean;
  focus: SkillPracticeFocus;
}): SkillPracticeStepId {
  const focusedStep = stepForFocus(input.focus);
  if (focusedStep) return focusedStep;

  const quickCheckComplete = hasCompletedActivity(input.activityAttempts, 'quick_check');
  const warmUpComplete = hasCompletedActivity(input.activityAttempts, 'warm_up');

  if (input.canUseQuickCheck && !quickCheckComplete) return 'start-simple';
  if (input.canUseWarmUp && !warmUpComplete) return 'build-method';
  if (input.canUseExamPractice) return 'ready-for-exam';
  if (input.canUseWarmUp) return 'build-method';
  return 'start-simple';
}

export function SkillPracticePanel({
  teachingSnippets,
  practiceItems,
  region,
  profileId,
  activityAttempts = [],
  focus = 'overview',
  quickCheckLockedContent,
  warmUpLockedContent,
  canUseQuickCheck,
  canUseWarmUp,
  canUseExamPractice,
  currentFieldGuideTopic,
  onContinueToFieldGuide,
  onContinueToExamPractice,
  onLearningActivityAttempt,
}: SkillPracticePanelProps) {
  const [activeStep, setActiveStep] = useState<SkillPracticeStepId>(() => defaultStepFor({
    activityAttempts,
    canUseExamPractice,
    canUseQuickCheck,
    canUseWarmUp,
    focus,
  }));
  const [localCompletedSteps, setLocalCompletedSteps] = useState<Set<SkillPracticeStepId>>(() => new Set());
  const topicMatchedPractice = orderGeneratedPracticeForFieldGuideTopic(practiceItems, currentFieldGuideTopic);
  const quickCheckComplete = hasCompletedActivity(activityAttempts, 'quick_check') || localCompletedSteps.has('start-simple');
  const warmUpComplete = hasCompletedActivity(activityAttempts, 'warm_up') || localCompletedSteps.has('build-method');

  useEffect(() => {
    setActiveStep(defaultStepFor({
      activityAttempts,
      canUseExamPractice,
      canUseQuickCheck,
      canUseWarmUp,
      focus,
    }));
  }, [canUseExamPractice, canUseQuickCheck, canUseWarmUp, focus, region?.id]);

  function recordLearningActivityAttempt(attempt: LearningActivityAttempt) {
    if (attempt.activityType === 'quick_check') {
      setLocalCompletedSteps((current) => new Set([...current, 'start-simple']));
    }
    if (attempt.activityType === 'warm_up') {
      setLocalCompletedSteps((current) => new Set([...current, 'build-method']));
    }
    onLearningActivityAttempt?.(attempt);
  }

  const stepStatus = (stepId: SkillPracticeStepId): 'Active' | 'Complete' | 'Locked' | 'Ready' => {
    if (stepId === activeStep) return 'Active';
    if (stepId === 'start-simple') return canUseQuickCheck ? quickCheckComplete ? 'Complete' : 'Ready' : 'Locked';
    if (stepId === 'build-method') return canUseWarmUp ? warmUpComplete ? 'Complete' : 'Ready' : 'Locked';
    return canUseExamPractice ? quickCheckComplete && warmUpComplete ? 'Complete' : 'Ready' : 'Locked';
  };

  const activeStepMeta = skillPracticeSteps.find((step) => step.id === activeStep) ?? skillPracticeSteps[0];

  return (
    <section className="skill-practice-panel" aria-label="Skill Practice">
      <p className="skill-practice-lede">Start simple, then build the method before Exam Training.</p>

      <div className="skill-practice-steps" aria-label="Skill Practice steps">
        {skillPracticeSteps.map((step) => {
          const status = stepStatus(step.id);
          return (
            <button
              type="button"
              key={step.id}
              aria-current={activeStep === step.id ? 'step' : undefined}
              disabled={status === 'Locked'}
              onClick={() => setActiveStep(step.id)}
            >
              <span>{step.label}</span>
              <small>{status}</small>
            </button>
          );
        })}
      </div>

      <section
        className="skill-practice-section is-focused"
        id={`skill-practice-${activeStep}`}
        aria-labelledby="skill-practice-active-step-title"
      >
        <div className="skill-practice-section-intro">
          <span>{activeStep === 'start-simple' ? 'Step 1' : activeStep === 'build-method' ? 'Step 2' : 'Step 3'}</span>
          <h4 id="skill-practice-active-step-title">{activeStepMeta.heading}</h4>
          <p>{activeStepMeta.description}</p>
        </div>

        {activeStep === 'start-simple' && (canUseQuickCheck ? (
          <QuickChecksPanel
            teachingSnippets={teachingSnippets}
            region={region}
            profileId={profileId}
            activityAttempts={activityAttempts}
            maxInitialItems={1}
            showNextCheck={false}
            onContinueToWarmUp={canUseWarmUp ? () => setActiveStep('build-method') : undefined}
            onContinueToExamPractice={canUseExamPractice ? () => setActiveStep('ready-for-exam') : undefined}
            onLearningActivityAttempt={recordLearningActivityAttempt}
          />
        ) : quickCheckLockedContent)}

        {activeStep === 'build-method' && (canUseWarmUp ? (
          <WarmUpPracticePanel
            practiceItems={topicMatchedPractice.items}
            region={region}
            profileId={profileId}
            activityAttempts={activityAttempts}
            maxInitialItems={3}
            fieldGuideTopicTitle={currentFieldGuideTopic?.title}
            topicMatchFallbackReason={topicMatchedPractice.fallbackReason}
            onContinueToFieldGuide={onContinueToFieldGuide}
            onContinueToExamPractice={canUseExamPractice ? () => setActiveStep('ready-for-exam') : undefined}
            onLearningActivityAttempt={recordLearningActivityAttempt}
          />
        ) : warmUpLockedContent)}

        {activeStep === 'ready-for-exam' ? (
          <div className="skill-practice-exam-transition">
            <p>Exam Training uses canonical question images and mark schemes.</p>
            <button
              type="button"
              className="primary-button"
              disabled={!canUseExamPractice}
              onClick={onContinueToExamPractice}
            >
              Exam Training
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </section>

      {!canUseQuickCheck && !canUseWarmUp ? (
        <div className="skill-practice-locked-note" role="status">
          <ListChecks size={18} aria-hidden="true" />
          <span>Skill Practice is locked while this class is Field Guide only.</span>
        </div>
      ) : null}
    </section>
  );
}
