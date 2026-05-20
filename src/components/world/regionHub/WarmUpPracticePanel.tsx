import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { findVisualSupportSource } from '../../../data/visualSupportSources';
import type { LearningActivityAttempt, LearningActivityOutcome, MistakeType, RegionDefinition } from '../../../types';
import { createId } from '../../../lib/progressStore';
import type { GeneratedPracticeItem } from '../../../lib/generatedPractice';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';
import { VisualSupportCard } from './VisualSupportCard';

const activityOutcomes: Array<{ value: LearningActivityOutcome; label: string }> = [
  { value: 'got_it', label: 'Got it' },
  { value: 'partial', label: 'Partial' },
  { value: 'missed', label: 'Missed' },
];

const errorTypes: Array<{ value: Exclude<MistakeType, 'no_issue'>; label: string }> = [
  { value: 'did_not_know_method', label: 'Did not know method' },
  { value: 'algebra_error', label: 'Algebra error' },
  { value: 'formula_issue', label: 'Formula or identity issue' },
  { value: 'slow_method', label: 'Slow method' },
  { value: 'lucky_or_unsure', label: 'Lucky or unsure' },
  { value: 'other', label: 'Other' },
];

function answerPlaceholderForItem(item: GeneratedPracticeItem): string {
  const text = [
    item.questionType,
    item.keyMethod,
    item.examMove,
    item.prompt,
    item.topic,
    item.generatorFamily,
  ].filter(Boolean).join(' ').toLowerCase();
  if (/\bintegration|integral|integrate|substitution|parts\b/.test(text)) return 'Show the setup and answer, e.g. u = x^2 + 1, du = 2x dx';
  if (/\bbinomial|validity|expansion\b/.test(text)) return 'Include requested terms and validity, e.g. 1 - x, |x| < 1';
  if (/\bcoordinate|point|intersection\b/.test(text)) return 'Give the result with notation, e.g. (2, -1), after checking all coordinates';
  if (/\bvector|column vector\b/.test(text)) return 'Use vector notation and name the point or direction used';
  if (/\binterval|inequal|range|domain\b/.test(text)) return 'State the condition clearly, e.g. -1 < x < 1';
  if (/\bexact|sqrt|surd|fraction|log|ln\b/.test(text)) return 'Use exact form and any condition, e.g. ln(5x), x > 0';
  if (/\bequation|line|tangent|normal|solve|root\b/.test(text)) return 'Include the variable and final form, e.g. x = 2 or y = 2x + 1';
  return 'Write the method line and final answer, e.g. dy/dx = 0, then x = 2';
}

interface WarmUpPracticePanelProps {
  practiceItems: GeneratedPracticeItem[];
  region?: RegionDefinition;
  profileId?: string;
  activityAttempts?: LearningActivityAttempt[];
  maxInitialItems?: number;
  onContinueToFieldGuide?: () => void;
  onContinueToExamPractice?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

interface WarmUpPracticeCardProps {
  item: GeneratedPracticeItem;
  position: number;
  total: number;
  isLastItem: boolean;
  region?: RegionDefinition;
  profileId?: string;
  previousAttempt?: LearningActivityAttempt;
  onComplete: (practiceId: string) => void;
  onNextItem: () => void;
  onContinueToExamPractice?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

function WarmUpPracticeCard({
  item,
  position,
  total,
  isLastItem,
  region,
  profileId,
  previousAttempt,
  onComplete,
  onNextItem,
  onContinueToExamPractice,
  onLearningActivityAttempt,
}: WarmUpPracticeCardProps) {
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [learnerResponse, setLearnerResponse] = useState('');
  const [answerChecked, setAnswerChecked] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState('');
  const [revealedEarly, setRevealedEarly] = useState(false);
  const [outcome, setOutcome] = useState<LearningActivityOutcome>();
  const [confidence, setConfidence] = useState(3);
  const [errorType, setErrorType] = useState('');
  const [completed, setCompleted] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());
  const solutionId = `warm-up-solution-${item.practiceId}`;
  const feedbackId = `warm-up-feedback-${item.practiceId}`;
  const familyParts = item.generatorFamily.split('.');
  const practiceLabel = humanReadableLabel(item.questionType ?? familyParts[familyParts.length - 1] ?? 'Warm-up');
  const responseReady = learnerResponse.trim().length > 0;
  const canComplete = Boolean(solutionVisible && outcome && !completed);
  const visualSupport = solutionVisible ? findVisualSupportSource({
    pageType: 'warm-up',
    regionId: region?.id ?? item.regionIds[0],
    topicIds: [item.topic, item.generatorFamily, ...(item.snippetIds ?? [])],
    skillIds: [item.skillTargetId],
  }) : undefined;

  function checkAnswer() {
    if (!responseReady) return;
    const likelyMatch = answerLooksClose(learnerResponse, item.answer);
    setAnswerChecked(true);
    setAnswerFeedback(
      likelyMatch
        ? 'Your answer looks close. Reveal the worked solution and check the route.'
        : 'Compare your answer with the expected result next. Reveal the solution to find the first gap.',
    );
  }

  function reveal(early: boolean) {
    setSolutionVisible(true);
    setRevealedEarly(early);
    setAnswerChecked(true);
    if (early) setAnswerFeedback('Solution revealed before an answer check. Use the worked route, then record what blocked you.');
    if (early) setOutcome('missed');
  }

  function completeAttempt() {
    if (!canComplete || !outcome) return;
    if (region && onLearningActivityAttempt) {
      onLearningActivityAttempt({
        id: createId('learning_activity'),
        profileId,
        regionId: region.id,
        regionName: region.name,
        activityType: 'warm_up',
        activityId: item.practiceId,
        sourceId: item.sourceSnippetId,
        topic: item.topic,
        skillTargetId: item.skillTargetId,
        prompt: item.prompt,
        learnerResponse: learnerResponse.trim(),
        revealedEarly,
        outcome,
        confidence,
        errorType: errorType ? errorType as MistakeType : undefined,
        createdAt: startedAt,
        completedAt: new Date().toISOString(),
      });
    }
    setCompleted(true);
    onComplete(item.practiceId);
  }

  return (
    <article className="warm-up-practice-card" data-activity-id={item.practiceId}>
      <div className="warm-up-practice-heading">
        <strong>{practiceLabel}</strong>
        <span>Item {position} of {total}</span>
        {item.sequenceRole ? <span>{item.sequenceRole.replace(/_/g, ' ')}</span> : null}
      </div>
      {previousAttempt ? <small className="region-card-note">Last: {activityOutcomes.find((entry) => entry.value === previousAttempt.outcome)?.label ?? previousAttempt.outcome}</small> : null}
      {(item.questionType || item.keyMethod) ? (
        <details className="activity-more-detail">
          <summary>More detail</summary>
          <dl className="warm-up-method-list">
            {item.questionType ? (
              <>
                <dt>Question type</dt>
                <dd><MathText text={item.questionType} /></dd>
              </>
            ) : null}
            {item.keyMethod ? (
              <>
                <dt>Key method</dt>
                <dd><MathText text={item.keyMethod} /></dd>
              </>
            ) : null}
          </dl>
        </details>
      ) : null}
      <p><MathText text={item.prompt} /></p>
      <label className="activity-response-field">
        Answer or method note
        <textarea
          value={learnerResponse}
          onChange={(event) => {
            setLearnerResponse(event.target.value);
            setAnswerChecked(false);
            setAnswerFeedback('');
          }}
          rows={3}
          disabled={solutionVisible}
          aria-describedby={answerFeedback ? feedbackId : undefined}
          placeholder={answerPlaceholderForItem(item)}
        />
      </label>
      {!solutionVisible ? (
        <div className="activity-reveal-actions warm-up-action-stack">
          <button
            className="activity-primary-action warm-up-reveal-button"
            type="button"
            disabled={!responseReady}
            onClick={checkAnswer}
          >
            Check answer
          </button>
          {answerChecked ? (
            <button
              className="activity-secondary-action"
              type="button"
              aria-expanded={solutionVisible}
              aria-controls={solutionId}
              onClick={() => reveal(false)}
            >
              Reveal solution
            </button>
          ) : null}
          <details className="activity-escape-detail warm-up-help-detail">
            <summary>Need help?</summary>
            <button className="activity-tertiary-action" type="button" onClick={() => reveal(true)}>Reveal anyway</button>
          </details>
        </div>
      ) : (
        <div className="warm-up-solution" id={solutionId}>
          <strong>Answer</strong>
          <p><MathText text={item.answer} /></p>
          <strong>Worked solution</strong>
          <ol>
            {item.workedSolution.map((step) => (
              <li key={step}><MathText text={step} /></li>
            ))}
          </ol>
          {visualSupport ? <VisualSupportCard source={visualSupport} /> : null}
          {revealedEarly ? <small className="region-card-note">Early reveal recorded when you save this warm-up.</small> : null}
        </div>
      )}
      {answerFeedback && !solutionVisible ? (
        <div className="warm-up-feedback" id={feedbackId} role="status">
          <strong>Feedback</strong>
          <p>{answerFeedback}</p>
        </div>
      ) : null}
      {solutionVisible ? (
        <div className="activity-reflection-panel">
          <fieldset>
            <legend>How did it go?</legend>
            <div className="activity-outcome-options">
              {activityOutcomes.map((entry) => (
                <label key={entry.value}>
                  <input
                    type="radio"
                    name={`${item.practiceId}-warm-up-outcome`}
                    value={entry.value}
                    checked={outcome === entry.value}
                    onChange={() => setOutcome(entry.value)}
                  />
                  <span>{entry.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Confidence
            <select value={confidence} onChange={(event) => setConfidence(Number(event.target.value))}>
              {[1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>{value}</option>)}
            </select>
          </label>
          <label>
            Error type
            <select value={errorType} onChange={(event) => setErrorType(event.target.value)}>
              <option value="">None selected</option>
              {errorTypes.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
            </select>
          </label>
          <button type="button" disabled={!canComplete} onClick={completeAttempt}>
            {completed ? 'Completed' : onLearningActivityAttempt && region ? 'Save warm-up' : 'Mark complete'}
          </button>
          {completed ? (
            <div className="warm-up-next-actions" aria-label="Warm-up next action">
              {!isLastItem ? (
                <button type="button" onClick={onNextItem}>Next warm-up</button>
              ) : onContinueToExamPractice ? (
                <button type="button" onClick={onContinueToExamPractice}>Continue to Exam Training</button>
              ) : (
                <p>Sequence complete. Move to exam practice, or review the Field Guide if any method still felt uncertain.</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function humanReadableLabel(value: string): string {
  const words = value.replace(/[_-]+/g, ' ').trim();
  if (!words) return 'Warm-up';
  return words.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[{}()[\],.;:]/g, '')
    .replace(/\\(?:left|right)/g, '')
    .replace(/×/g, '*');
}

function answerLooksClose(response: string, answer: string): boolean {
  const normalizedResponse = normalizeAnswer(response);
  const normalizedAnswer = normalizeAnswer(answer);
  if (!normalizedResponse || !normalizedAnswer) return false;
  return normalizedResponse === normalizedAnswer || normalizedResponse.includes(normalizedAnswer);
}

export function WarmUpPracticePanel({
  practiceItems,
  region,
  profileId,
  activityAttempts = [],
  maxInitialItems = 3,
  onContinueToFieldGuide,
  onContinueToExamPractice,
  onLearningActivityAttempt,
}: WarmUpPracticePanelProps) {
  const visiblePractice = practiceItems.slice(0, maxInitialItems);
  const hiddenPracticeCount = Math.max(0, practiceItems.length - visiblePractice.length);
  const previousWarmUpAttempts = activityAttempts.filter((attempt) => attempt.activityType === 'warm_up');
  const completedFromAttempts = new Set(previousWarmUpAttempts.map((attempt) => attempt.activityId));
  const firstIncompleteIndex = visiblePractice.findIndex((item) => !completedFromAttempts.has(item.practiceId));
  const [activeIndex, setActiveIndex] = useState(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
  const [completedPracticeIds, setCompletedPracticeIds] = useState<Set<string>>(() => new Set(
    previousWarmUpAttempts.map((attempt) => attempt.activityId),
  ));
  const activePractice = visiblePractice[Math.min(activeIndex, Math.max(0, visiblePractice.length - 1))];
  const visibleCompletedCount = visiblePractice.filter((item) => completedPracticeIds.has(item.practiceId)).length;
  const previousAttempts = new Map(
    previousWarmUpAttempts
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.id.localeCompare(b.id))
      .map((attempt) => [attempt.activityId, attempt]),
  );

  return (
    <RegionActionCard
      eyebrow="Step 3"
      title="Warm-up Practice"
      description="A small answer-first set with worked solutions."
      icon={<Sparkles size={22} />}
      className="warm-up-card"
    >
      {visiblePractice.length ? (
        <>
          <p className="section-helper warm-up-set-note">Work through one prompt at a time. Check your answer first, then reveal the worked route.</p>
          <ol className="warm-up-sequence-list" aria-label="Warm-up sequence">
            {visiblePractice.map((item, index) => (
              <li
                className={index === activeIndex ? 'is-active' : undefined}
                key={item.practiceId}
              >
                <span>{index + 1}</span>
                <small>{completedPracticeIds.has(item.practiceId) ? 'Complete' : index === activeIndex ? 'Active' : 'Queued'}</small>
              </li>
            ))}
          </ol>
          <div className="warm-up-practice-grid warm-up-practice-grid--single">
            {activePractice ? (
              <WarmUpPracticeCard
                item={activePractice}
                key={activePractice.practiceId}
                position={activeIndex + 1}
                total={visiblePractice.length}
                isLastItem={activeIndex >= visiblePractice.length - 1}
                onLearningActivityAttempt={onLearningActivityAttempt}
                onComplete={(practiceId) => {
                  setCompletedPracticeIds((current) => new Set([...current, practiceId]));
                }}
                onNextItem={() => setActiveIndex((current) => Math.min(current + 1, visiblePractice.length - 1))}
                onContinueToExamPractice={onContinueToExamPractice}
                previousAttempt={previousAttempts.get(activePractice.practiceId)}
                profileId={profileId}
                region={region}
              />
            ) : null}
          </div>
          {visibleCompletedCount >= visiblePractice.length ? (
            <div className="warm-up-complete-panel">
              <strong>Warm-up sequence complete</strong>
              <p>Use exam practice next, or return to the Field Guide for a quick method review.</p>
              <div className="warm-up-next-actions">
                {onContinueToExamPractice ? <button type="button" onClick={onContinueToExamPractice}>Continue to Exam Training</button> : null}
                {onContinueToFieldGuide ? <button type="button" onClick={onContinueToFieldGuide}>Review Field Guide</button> : null}
              </div>
            </div>
          ) : null}
          {hiddenPracticeCount ? <small className="region-card-note">{hiddenPracticeCount} more reviewed warm-up{hiddenPracticeCount === 1 ? '' : 's'} held back for later.</small> : null}
        </>
      ) : (
        <p className="region-empty-state">Warm-ups for this region are being prepared. Start with the Field Guide or jump into Exam Training.</p>
      )}
    </RegionActionCard>
  );
}
