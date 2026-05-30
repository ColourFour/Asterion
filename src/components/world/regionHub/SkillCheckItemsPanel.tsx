import { useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, ListChecks, RotateCcw } from 'lucide-react';
import type { LearningActivityAttempt, QuickCheckCheckResult, QuickCheckResponse, RegionDefinition } from '../../../types';
import type { SkillCheckItem } from '../../../data/skillCheckItems';
import { skillCheckContractForItem } from '../../../data/skillCheckItems';
import { createId } from '../../../lib/progressStore';
import { checkQuickCheckAnswer, quickCheckResponseSummary } from '../../../lib/quickCheckAnswer';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';
import { initialResponseFor, QuickCheckFeedback, QuickCheckInput } from './QuickChecksPanel';

interface SkillCheckItemsPanelProps {
  items: SkillCheckItem[];
  region?: RegionDefinition;
  profileId?: string;
  activityAttempts?: LearningActivityAttempt[];
  progressOffset?: number;
  progressTotal?: number;
  onSequenceComplete?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

interface SkillCheckItemCardProps {
  item: SkillCheckItem;
  region?: RegionDefinition;
  profileId?: string;
  previousAttempt?: LearningActivityAttempt;
  questionPosition: number;
  questionCount: number;
  hasNextItem: boolean;
  onNextItem?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

const INPUT_TYPE_LABELS: Record<SkillCheckItem['inputType'], string> = {
  numeric: 'Numeric',
  multiple_choice: 'Multiple choice',
  checkbox: 'Checkbox',
  ordered_cards: 'Ordered cards',
  two_value: 'Two-value entry',
};

const COMPLEXITY_LABELS: Record<SkillCheckItem['complexity'], string> = {
  foundation: 'Foundation',
  core: 'Core',
  challenge: 'Challenge',
};

function outcomeLabel(outcome: LearningActivityAttempt['outcome']): string {
  if (outcome === 'got_it') return 'Got it';
  if (outcome === 'partial') return 'Partial';
  return 'Missed';
}

function SkillPracticeHintLadder({ item }: { item: SkillCheckItem }) {
  return (
    <details className="quick-check-help">
      <summary>Need help?</summary>
      <div>
        <p><b>Nudge:</b> <MathText text={item.hints.nudge} /></p>
        {item.hints.methodCue ? <p><b>Method cue:</b> <MathText text={item.hints.methodCue} /></p> : null}
        {item.hints.firstStep ? <p><b>First step:</b> <MathText text={item.hints.firstStep} /></p> : null}
      </div>
    </details>
  );
}

function SkillPracticeWorkedRoute({ item }: { item: SkillCheckItem }) {
  return (
    <details className="skill-check-worked-route">
      <summary>Worked route</summary>
      <ol>
        {item.workedRoute.map((line, index) => (
          <li key={`${item.itemId}-worked-${index}`}>
            <MathText text={line} />
          </li>
        ))}
      </ol>
    </details>
  );
}

function SkillCheckItemCard({
  item,
  region,
  profileId,
  previousAttempt,
  questionPosition,
  questionCount,
  hasNextItem,
  onNextItem,
  onLearningActivityAttempt,
}: SkillCheckItemCardProps) {
  const contract = useMemo(() => skillCheckContractForItem(item), [item]);
  const [response, setResponse] = useState<QuickCheckResponse>(() => initialResponseFor(contract));
  const [feedback, setFeedback] = useState<QuickCheckCheckResult>();
  const [saved, setSaved] = useState(false);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());

  function saveCorrectAttempt(result: QuickCheckCheckResult) {
    if (result.status !== 'correct' || saved || !region || !onLearningActivityAttempt) return;
    onLearningActivityAttempt({
      id: createId('learning_activity'),
      profileId,
      regionId: region.id,
      regionName: region.name,
      activityType: 'quick_check',
      activityId: item.itemId,
      sourceId: item.sourceRefs.generatedPracticeIds?.[0] ?? item.sourceRefs.quickCheckContractIds?.[0],
      topic: item.fieldGuideTopicId,
      skillTargetId: item.skillId,
      prompt: item.prompt,
      learnerResponse: quickCheckResponseSummary(contract, response),
      revealedEarly: false,
      outcome: 'got_it',
      confidence: 5,
      createdAt: startedAt,
      completedAt: new Date().toISOString(),
    });
    setSaved(true);
  }

  function checkAnswer() {
    const result = checkQuickCheckAnswer(contract, response);
    setFeedback(result);
    saveCorrectAttempt(result);
  }

  function tryAgain() {
    setResponse(initialResponseFor(contract));
    setFeedback(undefined);
    setSaved(false);
    setStartedAt(new Date().toISOString());
  }

  const answered = Boolean(feedback && feedback.status !== 'empty');

  return (
    <article className="quick-check-reveal authored-skill-check-item" data-skill-check-item-id={item.itemId}>
      <header className="quick-check-heading">
        <strong>
          <span className={`skill-check-complexity-badge is-${item.complexity}`}>
            {COMPLEXITY_LABELS[item.complexity]}
          </span>
          <MathText text={item.prompt} />
        </strong>
        <small>
          Question {questionPosition} of {questionCount} ·{' '}
          {INPUT_TYPE_LABELS[item.inputType]}
          {previousAttempt ? ` · Last: ${outcomeLabel(previousAttempt.outcome)}` : ''}
        </small>
      </header>

      <div className="quick-check-interaction" data-answer-type={contract.answerType}>
        <QuickCheckInput contract={contract} response={response} setResponse={(next) => {
          setResponse(next);
          setFeedback(undefined);
          setSaved(false);
        }} />
        <div className="activity-reveal-actions">
          <button className="activity-primary-action" type="button" onClick={checkAnswer}>Check answer</button>
          <SkillPracticeHintLadder item={item} />
          <button className="activity-secondary-action" type="button" onClick={tryAgain}>
            <RotateCcw size={15} aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      {feedback ? <QuickCheckFeedback result={feedback} /> : null}
      {feedback?.status === 'correct' ? (
        <div className="quick-check-next-actions" aria-label="Skill Practice explanation">
          <strong>Worked route</strong>
          <ol>
            {item.workedRoute.map((line, index) => (
              <li key={`${item.itemId}-correct-worked-${index}`}>
                <MathText text={line} />
              </li>
            ))}
          </ol>
          <div>
            {hasNextItem ? <button className="activity-primary-action next-step-glow" type="button" onClick={onNextItem}>Next</button> : null}
            <button className="activity-secondary-action" type="button" onClick={tryAgain}>Try Again</button>
          </div>
        </div>
      ) : (
        <SkillPracticeWorkedRoute item={item} />
      )}
      {answered && feedback?.status !== 'correct' ? (
        <div className="quick-check-next-actions" aria-label="Skill Practice next action">
          <strong>Next step</strong>
          <p>Review the hint or worked route, then move on when you are ready.</p>
          <div>
            {hasNextItem ? <button className="activity-primary-action next-step-glow" type="button" onClick={onNextItem}>Next</button> : null}
            <button className="activity-secondary-action" type="button" onClick={tryAgain}>Try Again</button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function SkillCheckItemsPanel({
  items,
  region,
  profileId,
  activityAttempts = [],
  progressOffset = 0,
  progressTotal,
  onSequenceComplete,
  onLearningActivityAttempt,
}: SkillCheckItemsPanelProps) {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const previousAttempts = new Map(
    activityAttempts
      .filter((attempt) => attempt.activityType === 'quick_check')
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.id.localeCompare(b.id))
      .map((attempt) => [attempt.activityId, attempt]),
  );
  const activeIndex = Math.min(activeItemIndex, Math.max(0, items.length - 1));
  const activeItem = items[activeIndex];
  const totalQuestions = progressTotal ?? items.length;
  const questionPosition = progressOffset + activeIndex + 1;

  function nextItem() {
    if (activeIndex < items.length - 1) {
      setActiveItemIndex(activeIndex + 1);
      return;
    }
    onSequenceComplete?.();
  }

  return (
    <RegionActionCard
      eyebrow="Skill Practice"
      title="Targeted items"
      description="Answer one focused question at a time."
      icon={<ListChecks size={22} />}
      stateIcon={items.length ? <CheckCircle2 size={22} aria-label={`${items.length} authored Skill Practice items available`} /> : <CircleAlert size={22} aria-label="No authored Skill Practice items available" />}
      className="skill-check-authored-card"
    >
      {activeItem ? (
        <div className="skill-check-authored-list">
          <SkillCheckItemCard
            key={activeItem.itemId}
            item={activeItem}
            region={region}
            profileId={profileId}
            previousAttempt={previousAttempts.get(activeItem.itemId)}
            questionPosition={questionPosition}
            questionCount={totalQuestions}
            hasNextItem={activeIndex < items.length - 1 || Boolean(onSequenceComplete)}
            onNextItem={nextItem}
            onLearningActivityAttempt={onLearningActivityAttempt}
          />
        </div>
      ) : (
        <p className="region-empty-state">No authored Skill Practice items are published for this Field Guide topic yet.</p>
      )}
    </RegionActionCard>
  );
}
