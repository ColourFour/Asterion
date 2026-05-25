import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ListChecks } from 'lucide-react';
import type { FieldGuideTopic } from '../../../data/fieldGuideTopics';
import type { LearningActivityAttempt, RegionDefinition } from '../../../types';
import { orderGeneratedPracticeForFieldGuideTopic, type GeneratedPracticeItem } from '../../../lib/generatedPractice';
import type { TeachingSnippet } from '../../../lib/teachingSnippets';
import { QuickChecksPanel } from './QuickChecksPanel';
import { WarmUpPracticePanel } from './WarmUpPracticePanel';

export type SkillPracticeFocus = 'quick-check' | 'warm-up' | 'overview';

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
  const [activeFocus, setActiveFocus] = useState<SkillPracticeFocus>(focus);
  const quickCheckRef = useRef<HTMLElement>(null);
  const warmUpRef = useRef<HTMLElement>(null);
  const quickCheckCount = teachingSnippets.filter((snippet) => snippet.quickCheck).length;
  const topicMatchedPractice = orderGeneratedPracticeForFieldGuideTopic(practiceItems, currentFieldGuideTopic);

  useEffect(() => {
    setActiveFocus(focus);
  }, [focus]);

  useEffect(() => {
    const target = activeFocus === 'quick-check'
      ? quickCheckRef.current
      : activeFocus === 'warm-up'
        ? warmUpRef.current
        : undefined;
    target?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }, [activeFocus]);

  function focusWarmUp() {
    setActiveFocus('warm-up');
  }

  return (
    <section className="skill-practice-panel" aria-labelledby="skill-practice-title">
      <header className="skill-practice-header">
        <div>
          <span className="mode-pill">Skill Practice</span>
          <h3 id="skill-practice-title">Skill Practice</h3>
          <p>Start simple, then build the method before Exam Training.</p>
        </div>
        <div className="skill-practice-summary" aria-label="Skill practice summary">
          <span>{quickCheckCount} simple check{quickCheckCount === 1 ? '' : 's'}</span>
          <span>{topicMatchedPractice.items.length} guided practice item{topicMatchedPractice.items.length === 1 ? '' : 's'}</span>
        </div>
      </header>

      <div className="skill-practice-steps" aria-label="Skill Practice sections">
        <a href="#skill-practice-quick-checks" aria-current={activeFocus === 'quick-check' ? 'step' : undefined}>Start simple</a>
        <a href="#skill-practice-warm-up" aria-current={activeFocus === 'warm-up' ? 'step' : undefined}>Build the method</a>
        <a href="#skill-practice-ready">Ready for exam practice</a>
      </div>

      <section
        className={`skill-practice-section${activeFocus === 'quick-check' ? ' is-focused' : ''}`}
        id="skill-practice-quick-checks"
        ref={quickCheckRef}
        aria-labelledby="skill-practice-quick-title"
      >
        <div className="skill-practice-section-intro">
          <span>Step 1</span>
          <h4 id="skill-practice-quick-title">Start simple</h4>
          <p>Answer one small deterministic check and get immediate feedback.</p>
        </div>
        {canUseQuickCheck ? (
          <QuickChecksPanel
            teachingSnippets={teachingSnippets}
            region={region}
            profileId={profileId}
            activityAttempts={activityAttempts}
            maxInitialItems={Math.max(2, quickCheckCount)}
            onContinueToWarmUp={canUseWarmUp ? focusWarmUp : undefined}
            onContinueToExamPractice={canUseExamPractice ? onContinueToExamPractice : undefined}
            onLearningActivityAttempt={onLearningActivityAttempt}
          />
        ) : quickCheckLockedContent}
      </section>

      <section
        className={`skill-practice-section${activeFocus === 'warm-up' ? ' is-focused' : ''}`}
        id="skill-practice-warm-up"
        ref={warmUpRef}
        aria-labelledby="skill-practice-warm-title"
      >
        <div className="skill-practice-section-intro">
          <span>Step 2</span>
          <h4 id="skill-practice-warm-title">Build the method</h4>
          <p>Write first, compare with a worked solution, then record confidence and errors. These support records stay separate from Guardian evidence.</p>
        </div>
        {canUseWarmUp ? (
          <WarmUpPracticePanel
            practiceItems={topicMatchedPractice.items}
            region={region}
            profileId={profileId}
            activityAttempts={activityAttempts}
            maxInitialItems={3}
            fieldGuideTopicTitle={currentFieldGuideTopic?.title}
            topicMatchFallbackReason={topicMatchedPractice.fallbackReason}
            onContinueToFieldGuide={onContinueToFieldGuide}
            onContinueToExamPractice={canUseExamPractice ? onContinueToExamPractice : undefined}
            onLearningActivityAttempt={onLearningActivityAttempt}
          />
        ) : warmUpLockedContent}
      </section>

      <section className="skill-practice-exam-transition" id="skill-practice-ready" aria-labelledby="skill-practice-ready-title">
        <div>
          <span className="mode-pill">Step 3</span>
          <h4 id="skill-practice-ready-title">Ready for exam practice</h4>
          <p>Exam Training uses canonical question images and mark schemes. Saved attempts may help Guardian readiness when they meet the evidence rules.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          disabled={!canUseExamPractice}
          onClick={onContinueToExamPractice}
        >
          Exam Training
          <ArrowRight size={16} aria-hidden="true" />
        </button>
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
