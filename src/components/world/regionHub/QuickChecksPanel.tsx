import { useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, CircleAlert, CircleCheck, Target } from 'lucide-react';
import type { LearningActivityAttempt, QuickCheckCheckResult, QuickCheckContract, QuickCheckResponse, RegionDefinition } from '../../../types';
import { createId } from '../../../lib/progressStore';
import { checkQuickCheckAnswer, quickCheckContractFor, quickCheckResponseSummary } from '../../../lib/quickCheckAnswer';
import type { TeachingSnippet, TeachingSnippetQuickCheck } from '../../../lib/teachingSnippets';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';

interface QuickChecksPanelProps {
  teachingSnippets: TeachingSnippet[];
  region?: RegionDefinition;
  profileId?: string;
  activityAttempts?: LearningActivityAttempt[];
  maxInitialItems?: number;
  showNextCheck?: boolean;
  progressOffset?: number;
  progressTotal?: number;
  onSequenceComplete?: () => void;
  onContinueToWarmUp?: () => void;
  onContinueToExamPractice?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

export function initialResponseFor(contract: QuickCheckContract): QuickCheckResponse {
  if (contract.answerType === 'ordered_cards') {
    return { orderedIds: contract.orderedCards?.map((item) => item.id) ?? [] };
  }
  if (contract.answerType === 'multi_choice') return { selectedChoiceIds: [] };
  if (contract.answerType === 'two_value') return { values: {} };
  return {};
}

function swapOrderedIds(ids: string[], fromIndex: number, toIndex: number): string[] {
  if (toIndex < 0 || toIndex >= ids.length) return ids;
  const next = ids.slice();
  [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
  return next;
}

function toggleSelectedId(ids: string[] = [], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

function learningOutcomeLabel(outcome: LearningActivityAttempt['outcome']): string {
  if (outcome === 'got_it') return 'Got it';
  if (outcome === 'partial') return 'Partial';
  return 'Missed';
}

function QuickCheckHelp({
  check,
  contract,
  linkedExample,
}: {
  check: TeachingSnippetQuickCheck;
  contract: QuickCheckContract;
  linkedExample?: { example: { prompt: string } };
}) {
  return (
    <details className="quick-check-help">
      <summary>Need help?</summary>
      <div>
        {check.topic ? (
          <p><b>Field Guide topic:</b> <MathText text={check.topic.replace(/_/g, ' ')} /></p>
        ) : null}
        {linkedExample ? (
          <p><b>Show a similar example:</b> <MathText text={linkedExample.example.prompt} /></p>
        ) : null}
        {contract.hint ? <p><b>Hint:</b> <MathText text={contract.hint} /></p> : null}
        {contract.workedFirstStep ? <p><b>First step:</b> <MathText text={contract.workedFirstStep} /></p> : null}
      </div>
    </details>
  );
}

export function QuickCheckInput({
  contract,
  response,
  setResponse,
}: {
  contract: QuickCheckContract;
  response: QuickCheckResponse;
  setResponse: (response: QuickCheckResponse) => void;
}) {
  if (contract.answerType === 'single_value') {
    return (
      <label className="quick-check-single-value">
        <span><MathText text={contract.displayPrefix ?? 'answer ='} /></span>
        <input
          aria-label="Short check answer"
          inputMode="text"
          value={response.value ?? ''}
          onChange={(event) => setResponse({ value: event.target.value })}
        />
        {contract.displaySuffix ? <span><MathText text={contract.displaySuffix} /></span> : null}
      </label>
    );
  }

  if (contract.answerType === 'two_value') {
    return (
      <div className="quick-check-two-values" role="group" aria-label="Short check answer fields">
        {(contract.fields ?? []).map((field) => (
          <label className="quick-check-single-value" key={field.id}>
            <span><MathText text={field.displayPrefix ?? `${field.label} =`} /></span>
            <input
              aria-label={`${field.label} value`}
              inputMode="text"
              value={response.values?.[field.id] ?? ''}
              onChange={(event) => setResponse({
                values: {
                  ...(response.values ?? {}),
                  [field.id]: event.target.value,
                },
              })}
            />
            {field.displaySuffix ? <span><MathText text={field.displaySuffix} /></span> : null}
          </label>
        ))}
      </div>
    );
  }

  if (contract.answerType === 'ordered_cards') {
    const orderedIds = response.orderedIds ?? [];
    const cardsById = new Map((contract.orderedCards ?? []).map((card) => [card.id, card]));
    return (
      <ol className="quick-check-order-list" aria-label="Ordered answer cards">
        {orderedIds.map((id, index) => {
          const card = cardsById.get(id);
          if (!card) return null;
          return (
            <li key={id}>
              <span className="quick-check-order-index">{index + 1}</span>
              <span className="quick-check-order-label"><MathText text={card.label} /></span>
              <span className="quick-check-order-controls">
                <button
                  type="button"
                  aria-label={`Move ${card.label} up`}
                  disabled={index === 0}
                  onClick={() => setResponse({ orderedIds: swapOrderedIds(orderedIds, index, index - 1) })}
                >
                  <ArrowUp size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${card.label} down`}
                  disabled={index === orderedIds.length - 1}
                  onClick={() => setResponse({ orderedIds: swapOrderedIds(orderedIds, index, index + 1) })}
                >
                  <ArrowDown size={16} aria-hidden="true" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  if (contract.answerType === 'choice') {
    return (
      <div className="quick-check-choice-grid" role="group" aria-label="Choose one answer">
        {(contract.options ?? []).map((option) => (
          <button
            type="button"
            className={response.selectedChoiceId === option.id ? 'is-selected' : ''}
            aria-pressed={response.selectedChoiceId === option.id}
            key={option.id}
            onClick={() => setResponse({ selectedChoiceId: option.id })}
          >
            <MathText text={option.label} interactiveGlossary={false} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="quick-check-choice-grid" role="group" aria-label="Choose all correct answers">
      {(contract.options ?? []).map((option) => {
        const selectedIds = response.selectedChoiceIds ?? [];
        const selected = selectedIds.includes(option.id);
        return (
          <button
            type="button"
            className={selected ? 'is-selected' : ''}
            aria-pressed={selected}
            key={option.id}
            onClick={() => setResponse({ selectedChoiceIds: toggleSelectedId(selectedIds, option.id) })}
          >
            <span className="quick-check-checkbox" aria-hidden="true">
              {selected ? <CircleCheck size={14} /> : null}
            </span>
            <MathText text={option.label} interactiveGlossary={false} />
          </button>
        );
      })}
    </div>
  );
}

export function QuickCheckFeedback({ result }: { result: QuickCheckCheckResult }) {
  const isCorrect = result.status === 'correct';
  const isEmpty = result.status === 'empty';
  return (
    <div className={`quick-check-feedback is-${result.status}`} role="status" aria-live="polite">
      {isCorrect ? <CircleCheck size={18} aria-hidden="true" /> : <CircleAlert size={18} aria-hidden="true" />}
      <div>
        <strong>{isCorrect ? 'Correct' : isEmpty ? 'Add an answer first' : 'Not yet'}</strong>
        <p><MathText text={result.status === 'empty' ? result.message : result.message} /></p>
        {!isCorrect && result.hint ? <small><MathText text={result.hint} /></small> : null}
      </div>
    </div>
  );
}

interface QuickCheckCardProps {
  snippetId: string;
  title: string;
  check: TeachingSnippetQuickCheck;
  linkedExample?: { example: { prompt: string } };
  region?: RegionDefinition;
  profileId?: string;
  previousAttempt?: LearningActivityAttempt;
  checkPosition: number;
  checkCount: number;
  hasNextCheck: boolean;
  onNextCheck?: () => void;
  onSequenceComplete?: () => void;
  onContinueToWarmUp?: () => void;
  onContinueToExamPractice?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

function QuickCheckCard({
  snippetId,
  title,
  check,
  linkedExample,
  region,
  profileId,
  previousAttempt,
  checkPosition,
  checkCount,
  hasNextCheck,
  onNextCheck,
  onSequenceComplete,
  onContinueToWarmUp,
  onContinueToExamPractice,
  onLearningActivityAttempt,
}: QuickCheckCardProps) {
  const activityId = check.id ?? snippetId;
  const contract = quickCheckContractFor(check);
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
      activityId,
      sourceId: snippetId,
      topic: check.topic,
      skillTargetId: check.skillTargetId,
      prompt: contract.prompt,
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

  return (
    <article className="quick-check-reveal" data-activity-id={activityId}>
      <header className="quick-check-heading">
        <strong>Skill check: {title}</strong>
        <small>
          Question {checkPosition} of {checkCount}
          {previousAttempt ? ` · Last: ${learningOutcomeLabel(previousAttempt.outcome)}` : ''}
        </small>
      </header>
      <p><MathText text={check.prompt} /></p>
      <div className="quick-check-interaction" data-answer-type={contract.answerType}>
        <QuickCheckInput contract={contract} response={response} setResponse={(next) => {
          setResponse(next);
          setFeedback(undefined);
          setSaved(false);
        }} />
        <div className="activity-reveal-actions">
          <button className="activity-primary-action" type="button" onClick={checkAnswer}>Check answer</button>
          <QuickCheckHelp check={check} contract={contract} linkedExample={linkedExample} />
        </div>
      </div>
      {feedback ? <QuickCheckFeedback result={feedback} /> : null}
      {feedback?.status === 'correct' ? (
        <div className="quick-check-next-actions" aria-label="Skill Check next action">
          <strong>Next action</strong>
          {contract.explanation ? <p><MathText text={contract.explanation} /></p> : null}
          <div>
            {hasNextCheck ? (
              <button className="activity-primary-action next-step-glow" type="button" onClick={onNextCheck}>Next</button>
            ) : onSequenceComplete ? (
              <button className="activity-primary-action next-step-glow" type="button" onClick={onSequenceComplete}>Next</button>
            ) : onContinueToWarmUp ? (
              <button className="activity-primary-action next-step-glow" type="button" onClick={onContinueToWarmUp}>Next</button>
            ) : onContinueToExamPractice ? (
              <button className="activity-primary-action next-step-glow" type="button" onClick={onContinueToExamPractice}>Next</button>
            ) : null}
            <button className="activity-secondary-action" type="button" onClick={tryAgain}>Try Again</button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function QuickChecksPanel({
  teachingSnippets,
  region,
  profileId,
  activityAttempts = [],
  maxInitialItems = 1,
  showNextCheck = true,
  progressOffset = 0,
  progressTotal,
  onSequenceComplete,
  onContinueToWarmUp,
  onContinueToExamPractice,
  onLearningActivityAttempt,
}: QuickChecksPanelProps) {
  const examplesById = new Map(
    teachingSnippets.flatMap((snippet) => (
      snippet.workedExamples.flatMap((example) => (
        example.id
          ? [[example.id, { example }] as const]
          : []
      ))
    )),
  );
  const checks = teachingSnippets.flatMap((snippet) => (
    snippet.quickCheck
      ? [{
        snippetId: snippet.snippetId,
        title: snippet.title,
        check: snippet.quickCheck,
        linkedExample: snippet.quickCheck.exampleModelId ? examplesById.get(snippet.quickCheck.exampleModelId) : undefined,
      }]
      : []
  ));
  const [activeCheckIndex, setActiveCheckIndex] = useState(0);
  const activeCheckLimit = Math.max(1, Math.min(maxInitialItems, Math.max(checks.length, 1)));
  const activeCheckIndexWithinRange = Math.min(activeCheckIndex, Math.max(0, checks.length - 1));
  const activeCheck = checks[activeCheckIndexWithinRange];
  const queuedCheckCount = Math.max(0, checks.length - activeCheckIndexWithinRange - activeCheckLimit);
  const totalQuestions = progressTotal ?? checks.length;
  const questionPosition = progressOffset + activeCheckIndexWithinRange + 1;
  const previousAttempts = new Map(
    activityAttempts
      .filter((attempt) => attempt.activityType === 'quick_check')
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.id.localeCompare(b.id))
      .map((attempt) => [attempt.activityId, attempt]),
  );

  return (
    <RegionActionCard
      eyebrow="Skill Check"
      title="Skill Check item"
      description="Answer one focused prompt and get feedback when validation is safe."
      icon={<Target size={22} />}
      stateIcon={checks.length ? <CheckCircle2 size={22} aria-label={`${checks.length} Skill Check items available`} /> : undefined}
      className="quick-check-card"
    >
      {activeCheck ? (
        <>
          <div className="quick-check-list">
            <QuickCheckCard
              check={activeCheck.check}
              checkCount={totalQuestions}
              checkPosition={questionPosition}
              hasNextCheck={showNextCheck && activeCheckIndexWithinRange < checks.length - 1}
              key={activeCheck.check.id ?? activeCheck.snippetId}
              linkedExample={activeCheck.linkedExample}
              onContinueToExamPractice={onContinueToExamPractice}
              onContinueToWarmUp={onContinueToWarmUp}
              onLearningActivityAttempt={onLearningActivityAttempt}
              onNextCheck={() => setActiveCheckIndex((index) => Math.min(index + 1, checks.length - 1))}
              onSequenceComplete={onSequenceComplete}
              previousAttempt={previousAttempts.get(activeCheck.check.id ?? activeCheck.snippetId)}
              profileId={profileId}
              region={region}
              snippetId={activeCheck.snippetId}
              title={activeCheck.title}
            />
          </div>
          {queuedCheckCount ? <small className="region-card-note">{queuedCheckCount} more reviewed Skill Check item{queuedCheckCount === 1 ? '' : 's'} queued after this one.</small> : null}
        </>
      ) : (
        <p className="region-empty-state">No reviewed deterministic Skill Check items are published for this topic yet. Use a worked-route item or the Field Guide.</p>
      )}
    </RegionActionCard>
  );
}
