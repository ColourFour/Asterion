import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, ListChecks } from 'lucide-react';
import { getFieldGuideTopicsForRegion, type FieldGuideTopic } from '../../../data/fieldGuideTopics';
import type { LearningActivityAttempt, RegionDefinition } from '../../../types';
import type { GeneratedPracticeItem } from '../../../lib/generatedPractice';
import {
  SKILL_CHECK_COMPLEXITIES,
  buildSkillChecklistTopicGroups,
  totalSkillChecklistItems,
  type SkillChecklistTopicGroup,
} from '../../../lib/skillChecklist';
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

function hasCompletedActivity(activityAttempts: LearningActivityAttempt[], activityType: LearningActivityAttempt['activityType']): boolean {
  return activityAttempts.some((attempt) => attempt.activityType === activityType);
}

function groupCountLabel(group: SkillChecklistTopicGroup): string {
  const count = totalSkillChecklistItems(group);
  return `${count} item${count === 1 ? '' : 's'}`;
}

function preferredTopicId(input: {
  currentFieldGuideTopic?: FieldGuideTopic;
  focus: SkillPracticeFocus;
  groups: SkillChecklistTopicGroup[];
}): string | undefined {
  if (input.currentFieldGuideTopic) return input.currentFieldGuideTopic.id;
  const withContent = input.groups.filter((group) => totalSkillChecklistItems(group) > 0);
  if (input.focus === 'quick-check') return withContent.find((group) => group.quickCheckSnippets.length > 0)?.topic.id ?? withContent[0]?.topic.id;
  if (input.focus === 'warm-up') return withContent.find((group) => group.guidedPracticeItems.length > 0)?.topic.id ?? withContent[0]?.topic.id;
  return withContent[0]?.topic.id ?? input.groups[0]?.topic.id;
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
  const groups = useMemo(() => buildSkillChecklistTopicGroups({
    fieldGuideTopics: getFieldGuideTopicsForRegion(region?.id),
    teachingSnippets,
    practiceItems,
  }), [region?.id, teachingSnippets, practiceItems]);
  const [activeTopicId, setActiveTopicId] = useState<string | undefined>(() => preferredTopicId({
    currentFieldGuideTopic,
    focus,
    groups,
  }));
  const [localCompletedTypes, setLocalCompletedTypes] = useState<Set<LearningActivityAttempt['activityType']>>(() => new Set());
  const activeGroup = groups.find((group) => group.topic.id === activeTopicId) ?? groups[0];
  const quickCheckComplete = hasCompletedActivity(activityAttempts, 'quick_check') || localCompletedTypes.has('quick_check');
  const warmUpComplete = hasCompletedActivity(activityAttempts, 'warm_up') || localCompletedTypes.has('warm_up');
  const supportAttemptCount = activityAttempts.length + localCompletedTypes.size;

  useEffect(() => {
    setActiveTopicId(preferredTopicId({
      currentFieldGuideTopic,
      focus,
      groups,
    }));
  }, [currentFieldGuideTopic?.id, focus, groups, region?.id]);

  function recordLearningActivityAttempt(attempt: LearningActivityAttempt) {
    setLocalCompletedTypes((current) => new Set([...current, attempt.activityType]));
    onLearningActivityAttempt?.(attempt);
  }

  return (
    <section className="skill-practice-panel" aria-label="Skill Check">
      <p className="skill-practice-lede">Skill Check is grouped by Field Guide topic. Complexity describes solving steps, not grades, mastery, or legacy difficulty metadata.</p>

      {groups.length ? (
        <div className="skill-practice-topic-grid" aria-label="Field Guide Skill Check topics">
          {groups.map((group) => {
            const active = group.topic.id === activeGroup?.topic.id;
            return (
              <button
                type="button"
                key={group.topic.id}
                aria-current={active ? 'true' : undefined}
                className={active ? 'active' : ''}
                onClick={() => setActiveTopicId(group.topic.id)}
              >
                <span className="skill-practice-topic-title">{group.topic.title}</span>
                <small>{groupCountLabel(group)}</small>
                <span className="skill-practice-complexity-row" aria-label={`${group.topic.title} complexity mix`}>
                  {Object.values(SKILL_CHECK_COMPLEXITIES).map((complexity) => (
                    <span key={complexity.id}>{complexity.label}: {group.complexityCounts[complexity.id]}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <section
        className="skill-practice-section is-focused"
        id={activeGroup ? `skill-check-${activeGroup.topic.id}` : 'skill-check-empty'}
        aria-labelledby="skill-practice-active-step-title"
      >
        <div className="skill-practice-section-intro">
          <span>Skill Check</span>
          <h4 id="skill-practice-active-step-title">
            {activeGroup?.topic.title ?? 'Skill Check'}
          </h4>
          <p>{activeGroup?.topic.purpose ?? 'Field Guide topic mapping is being prepared for this region.'}</p>
          {activeGroup?.fallbackReason ? <p className="skill-practice-under-development-note">{activeGroup.fallbackReason}</p> : null}
          <div className="skill-practice-complexity-legend" aria-label="Solving complexity">
            {Object.values(SKILL_CHECK_COMPLEXITIES).map((complexity) => (
              <span key={complexity.id}>
                <strong>{complexity.label}</strong>
                {complexity.description}
              </span>
            ))}
          </div>
        </div>

        {activeGroup ? (
          <div className="skill-check-item-stack">
            {canUseQuickCheck ? (
              <QuickChecksPanel
                teachingSnippets={activeGroup.quickCheckSnippets}
                region={region}
                profileId={profileId}
                activityAttempts={activityAttempts}
                maxInitialItems={1}
                showNextCheck
                onContinueToExamPractice={canUseExamPractice ? onContinueToExamPractice : undefined}
                onLearningActivityAttempt={recordLearningActivityAttempt}
              />
            ) : quickCheckLockedContent}

            {canUseWarmUp ? (
              <WarmUpPracticePanel
                practiceItems={activeGroup.guidedPracticeItems}
                region={region}
                profileId={profileId}
                activityAttempts={activityAttempts}
                maxInitialItems={3}
                fieldGuideTopicTitle={activeGroup.topic.title}
                topicMatchFallbackReason={activeGroup.fallbackReason}
                onContinueToFieldGuide={onContinueToFieldGuide}
                onContinueToExamPractice={canUseExamPractice ? onContinueToExamPractice : undefined}
                onLearningActivityAttempt={recordLearningActivityAttempt}
              />
            ) : warmUpLockedContent}
          </div>
        ) : null}

        <div className="skill-practice-exam-transition">
          <p>Exam Training uses canonical question images and mark schemes. Skill Check records stay support-only.</p>
          <button
            type="button"
            className="primary-button next-step-glow"
            disabled={!canUseExamPractice}
            onClick={onContinueToExamPractice}
          >
            Go to Exam Training
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      {!canUseQuickCheck && !canUseWarmUp ? (
        <div className="skill-practice-locked-note" role="status">
          <ListChecks size={18} aria-hidden="true" />
          <span>Skill Check is locked while this class is Field Guide only.</span>
        </div>
      ) : supportAttemptCount ? (
        <div className="skill-practice-locked-note" role="status">
          <ListChecks size={18} aria-hidden="true" />
          <span>{quickCheckComplete || warmUpComplete ? 'Skill Check support progress is saved locally and does not change rank or Guardian access.' : 'Skill Check support progress is saved locally.'}</span>
        </div>
      ) : null}
    </section>
  );
}
