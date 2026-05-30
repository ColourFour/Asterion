import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ListChecks } from 'lucide-react';
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
import { MathText } from '../../shared/MathText';
import { QuickChecksPanel } from './QuickChecksPanel';
import { SkillCheckItemsPanel } from './SkillCheckItemsPanel';
import { WarmUpPracticePanel } from './WarmUpPracticePanel';

export type SkillPracticeFocus = 'quick-check' | 'warm-up' | 'overview';
type SkillPracticeFlowStageId = 'authored' | 'quick-check' | 'worked-route';

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

const WORKED_ROUTE_ITEM_LIMIT = 3;

function stageItemCount(stage: {
  id: SkillPracticeFlowStageId;
  count: number;
}): number {
  return stage.count;
}

export function SkillPracticePanel({
  teachingSnippets,
  practiceItems,
  region,
  profileId,
  activityAttempts = [],
  focus = 'overview',
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
  const [activeFlowStageIndex, setActiveFlowStageIndex] = useState(0);
  const activeGroup = groups.find((group) => group.topic.id === activeTopicId) ?? groups[0];
  const quickCheckComplete = hasCompletedActivity(activityAttempts, 'quick_check') || localCompletedTypes.has('quick_check');
  const warmUpComplete = hasCompletedActivity(activityAttempts, 'warm_up') || localCompletedTypes.has('warm_up');
  const supportAttemptCount = activityAttempts.length + localCompletedTypes.size;
  const activeWorkedRouteItems = activeGroup?.guidedPracticeItems.slice(0, WORKED_ROUTE_ITEM_LIMIT) ?? [];
  const flowStages = useMemo(() => {
    const available: Partial<Record<SkillPracticeFlowStageId, { id: SkillPracticeFlowStageId; count: number }>> = {};
    if (canUseQuickCheck && activeGroup?.authoredItems.length) {
      available.authored = { id: 'authored', count: activeGroup.authoredItems.length };
    }
    if (canUseQuickCheck && activeGroup?.quickCheckSnippets.length) {
      available['quick-check'] = { id: 'quick-check', count: activeGroup.quickCheckSnippets.length };
    }
    if (canUseWarmUp && activeWorkedRouteItems.length) {
      available['worked-route'] = { id: 'worked-route', count: activeWorkedRouteItems.length };
    }
    const order: SkillPracticeFlowStageId[] = focus === 'quick-check'
      ? ['quick-check', 'authored', 'worked-route']
      : focus === 'warm-up'
        ? ['worked-route', 'authored', 'quick-check']
        : ['authored', 'quick-check', 'worked-route'];
    return order.flatMap((id) => (available[id] ? [available[id]] : []));
  }, [
    activeGroup?.topic.id,
    activeGroup?.authoredItems.length,
    activeGroup?.quickCheckSnippets.length,
    activeWorkedRouteItems.length,
    canUseQuickCheck,
    canUseWarmUp,
    focus,
  ]);
  const safeActiveFlowStageIndex = Math.min(activeFlowStageIndex, Math.max(0, flowStages.length - 1));
  const activeFlowStage = flowStages[safeActiveFlowStageIndex];
  const progressTotal = flowStages.reduce((sum, stage) => sum + stageItemCount(stage), 0);
  const progressOffset = flowStages
    .slice(0, safeActiveFlowStageIndex)
    .reduce((sum, stage) => sum + stageItemCount(stage), 0);
  const hasNextFlowStage = safeActiveFlowStageIndex < flowStages.length - 1;

  useEffect(() => {
    setActiveTopicId(preferredTopicId({
      currentFieldGuideTopic,
      focus,
      groups,
    }));
  }, [currentFieldGuideTopic?.id, focus, groups, region?.id]);

  useEffect(() => {
    setActiveFlowStageIndex(0);
  }, [activeGroup?.topic.id, canUseQuickCheck, canUseWarmUp]);

  function recordLearningActivityAttempt(attempt: LearningActivityAttempt) {
    setLocalCompletedTypes((current) => new Set([...current, attempt.activityType]));
    onLearningActivityAttempt?.(attempt);
  }

  function continueFlow() {
    if (hasNextFlowStage) {
      setActiveFlowStageIndex(safeActiveFlowStageIndex + 1);
    }
  }

  return (
    <section className="skill-practice-panel" aria-label="Skill Practice">
      {groups.length ? (
        <div className="skill-practice-topic-grid" aria-label="Field Guide Skill Practice topics">
          {groups.map((group) => {
            const active = group.topic.id === activeGroup?.topic.id;
            return (
              <button
                type="button"
                key={group.topic.id}
                aria-current={active ? 'true' : undefined}
                className={active ? 'active' : ''}
                onClick={() => {
                  setActiveTopicId(group.topic.id);
                  setActiveFlowStageIndex(0);
                }}
              >
                <span className="skill-practice-topic-title"><MathText text={group.topic.title} interactiveGlossary={false} /></span>
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
          <span>Skill Practice</span>
          <h4 id="skill-practice-active-step-title">
            <MathText text={activeGroup?.topic.title ?? 'Skill Practice'} interactiveGlossary={false} />
          </h4>
          <p><MathText text={activeGroup?.topic.purpose ?? 'Field Guide topic mapping is being prepared for this topic.'} /></p>
          {activeGroup?.fallbackReason ? <p className="skill-practice-under-development-note">{activeGroup.fallbackReason}</p> : null}
        </div>

        {activeGroup && activeFlowStage ? (
          <div className="skill-check-item-stack">
            {activeFlowStage.id === 'authored' ? (
              <SkillCheckItemsPanel
                items={activeGroup.authoredItems}
                region={region}
                profileId={profileId}
                activityAttempts={activityAttempts}
                progressOffset={progressOffset}
                progressTotal={progressTotal}
                onSequenceComplete={hasNextFlowStage ? continueFlow : undefined}
                onLearningActivityAttempt={recordLearningActivityAttempt}
              />
            ) : null}

            {activeFlowStage.id === 'quick-check' ? (
              <QuickChecksPanel
                teachingSnippets={activeGroup.quickCheckSnippets}
                region={region}
                profileId={profileId}
                activityAttempts={activityAttempts}
                maxInitialItems={1}
                showNextCheck
                progressOffset={progressOffset}
                progressTotal={progressTotal}
                onSequenceComplete={hasNextFlowStage ? continueFlow : undefined}
                onLearningActivityAttempt={recordLearningActivityAttempt}
              />
            ) : null}

            {activeFlowStage.id === 'worked-route' ? (
              <WarmUpPracticePanel
                practiceItems={activeWorkedRouteItems}
                region={region}
                profileId={profileId}
                activityAttempts={activityAttempts}
                maxInitialItems={WORKED_ROUTE_ITEM_LIMIT}
                progressOffset={progressOffset}
                progressTotal={progressTotal}
                fieldGuideTopicTitle={activeGroup.topic.title}
                topicMatchFallbackReason={activeGroup.fallbackReason}
                onSequenceComplete={hasNextFlowStage ? continueFlow : undefined}
                onContinueToFieldGuide={onContinueToFieldGuide}
                onContinueToExamPractice={canUseExamPractice ? onContinueToExamPractice : undefined}
                onLearningActivityAttempt={recordLearningActivityAttempt}
              />
            ) : null}
          </div>
        ) : activeGroup ? (
          <p className="region-empty-state">Skill Practice items for this topic are being prepared. Start with the Field Guide if you need a method reset.</p>
        ) : null}
      </section>

      {!canUseQuickCheck && !canUseWarmUp ? (
        <div className="skill-practice-locked-note" role="status">
          <ListChecks size={18} aria-hidden="true" />
          <span>Skill Practice is unavailable while this class is Field Guide only.</span>
        </div>
      ) : supportAttemptCount ? (
        <div className="skill-practice-locked-note" role="status">
          <ListChecks size={18} aria-hidden="true" />
          <span>{quickCheckComplete || warmUpComplete ? 'Skill Practice progress saved locally.' : 'Skill Practice progress started.'}</span>
        </div>
      ) : null}
    </section>
  );
}
