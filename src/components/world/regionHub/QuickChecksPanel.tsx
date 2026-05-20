import { useState } from 'react';
import { CheckCircle2, Target } from 'lucide-react';
import type { LearningActivityAttempt, LearningActivityOutcome, MistakeType, RegionDefinition } from '../../../types';
import { createId } from '../../../lib/progressStore';
import type { TeachingSnippet, TeachingSnippetQuickCheck } from '../../../lib/teachingSnippets';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';

const activityOutcomes: Array<{ value: LearningActivityOutcome; label: string }> = [
  { value: 'got_it', label: 'Got it' },
  { value: 'partial', label: 'Partial' },
  { value: 'missed', label: 'Missed' },
];

const errorTypes: Array<{ value: Exclude<MistakeType, 'no_issue'>; label: string }> = [
  { value: 'did_not_know_method', label: 'Did not know method' },
  { value: 'algebra_error', label: 'Algebra error' },
  { value: 'formula_issue', label: 'Formula or identity issue' },
  { value: 'misread_question', label: 'Misread prompt' },
  { value: 'slow_method', label: 'Slow method' },
  { value: 'lucky_or_unsure', label: 'Lucky or unsure' },
  { value: 'other', label: 'Other' },
];

function answerPlaceholderForText(...parts: Array<string | undefined>): string {
  const text = parts.filter(Boolean).join(' ').toLowerCase();
  if (/\bintegration|integral|integrate|substitution|parts\b/.test(text)) return 'Show the method line, e.g. u = x^2 + 1, du = 2x dx';
  if (/\bcoordinate|point|intersection\b/.test(text)) return 'Give the result with notation, e.g. (2, -1), after checking all coordinates';
  if (/\bvector|column vector\b/.test(text)) return 'Use vector notation and name the point or direction used';
  if (/\binterval|inequal|range|domain\b/.test(text)) return 'State the condition clearly, e.g. -1 < x < 1';
  if (/\bequation|line|tangent|normal|solve|root\b/.test(text)) return 'Include the variable and final form, e.g. x = 2 or y = 2x + 1';
  if (/\bexact|sqrt|surd|fraction|log|ln\b/.test(text)) return 'Use exact form and any condition, e.g. ln(5x), x > 0';
  return 'Write the key method line and final answer, e.g. dy/dx = 0, then x = 2';
}

interface QuickChecksPanelProps {
  teachingSnippets: TeachingSnippet[];
  region?: RegionDefinition;
  profileId?: string;
  activityAttempts?: LearningActivityAttempt[];
  maxInitialItems?: number;
  onContinueToWarmUp?: () => void;
  onContinueToExamPractice?: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
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
  onContinueToWarmUp,
  onContinueToExamPractice,
  onLearningActivityAttempt,
}: QuickCheckCardProps) {
  const activityId = check.id ?? snippetId;
  const [learnerResponse, setLearnerResponse] = useState('');
  const [answerVisible, setAnswerVisible] = useState(false);
  const [revealedEarly, setRevealedEarly] = useState(false);
  const [outcome, setOutcome] = useState<LearningActivityOutcome>();
  const [confidence, setConfidence] = useState(3);
  const [errorType, setErrorType] = useState('');
  const [saved, setSaved] = useState(false);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const responseReady = learnerResponse.trim().length > 0;
  const canSave = Boolean(answerVisible && outcome && !saved && onLearningActivityAttempt && region);

  function reveal(early: boolean) {
    setAnswerVisible(true);
    setRevealedEarly(early);
    if (early) setOutcome('missed');
  }

  function saveAttempt() {
    if (!canSave || !outcome || !region || !onLearningActivityAttempt) return;
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
      prompt: check.prompt,
      learnerResponse: learnerResponse.trim(),
      revealedEarly,
      outcome,
      confidence,
      errorType: errorType ? errorType as MistakeType : undefined,
      createdAt: startedAt,
      completedAt: new Date().toISOString(),
    });
    setSaved(true);
  }

  function tryAgain() {
    setLearnerResponse('');
    setAnswerVisible(false);
    setRevealedEarly(false);
    setOutcome(undefined);
    setConfidence(3);
    setErrorType('');
    setSaved(false);
    setStartedAt(new Date().toISOString());
  }

  return (
    <article className="quick-check-reveal" data-activity-id={activityId}>
      <header className="quick-check-heading">
        <strong>Quick check: {title}</strong>
        <small>
          Check {checkPosition} of {checkCount}
          {previousAttempt ? ` · Last: ${activityOutcomes.find((item) => item.value === previousAttempt.outcome)?.label ?? previousAttempt.outcome}` : ''}
        </small>
      </header>
      <p><MathText text={check.prompt} /></p>
      {linkedExample ? (
        <small className="quick-check-example-link">
          Linked example: <MathText text={linkedExample.example.prompt} />
        </small>
      ) : null}
      <label className="activity-response-field">
        Answer or method note
        <textarea
          value={learnerResponse}
          onChange={(event) => setLearnerResponse(event.target.value)}
          rows={3}
          disabled={answerVisible}
          placeholder={answerPlaceholderForText(check.topic, check.prompt, linkedExample?.example.prompt)}
        />
      </label>
      {!answerVisible ? (
        <div className="activity-reveal-actions">
          <button className="activity-primary-action" type="button" disabled={!responseReady} onClick={() => reveal(false)}>Check answer</button>
          <details className="activity-escape-detail">
            <summary>Need help?</summary>
            <button className="activity-tertiary-action" type="button" onClick={() => reveal(true)}>Reveal anyway</button>
          </details>
        </div>
      ) : (
        <div className="quick-check-answer">
          <strong>{revealedEarly ? 'Model answer' : 'Feedback'}</strong>
          {!revealedEarly ? <small>Compare your response with the model answer before choosing an outcome.</small> : null}
          <p><MathText text={check.answer} /></p>
          <small><MathText text={check.explanation} /></small>
          {revealedEarly ? <small className="region-card-note">Early reveal recorded when you save this check.</small> : null}
        </div>
      )}
      {answerVisible ? (
        <div className="activity-reflection-panel">
          <fieldset>
            <legend>How did it go?</legend>
            <div className="activity-outcome-options">
              {activityOutcomes.map((item) => (
                <label key={item.value}>
                  <input
                    type="radio"
                    name={`${activityId}-quick-check-outcome`}
                    value={item.value}
                    checked={outcome === item.value}
                    onChange={() => setOutcome(item.value)}
                  />
                  <span>{item.label}</span>
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
          <button className="activity-primary-action" type="button" disabled={!canSave} onClick={saveAttempt}>{saved ? 'Saved' : 'Save check'}</button>
        </div>
      ) : null}
      {answerVisible && saved ? (
        <div className="quick-check-next-actions" aria-label="Quick check next action">
          <strong>Next action</strong>
          <div>
            <button type="button" onClick={tryAgain}>Try again</button>
            {hasNextCheck ? (
              <button type="button" onClick={onNextCheck}>Next check</button>
            ) : onContinueToWarmUp ? (
              <button type="button" onClick={onContinueToWarmUp}>Continue to Warm-up</button>
            ) : onContinueToExamPractice ? (
              <button type="button" onClick={onContinueToExamPractice}>Continue to Exam Practice</button>
            ) : null}
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
  const activeCheckLimit = Math.max(1, Math.min(maxInitialItems, 1));
  const activeCheckIndexWithinRange = Math.min(activeCheckIndex, Math.max(0, checks.length - 1));
  const activeCheck = checks[activeCheckIndexWithinRange];
  const queuedCheckCount = Math.max(0, checks.length - activeCheckIndexWithinRange - activeCheckLimit);
  const previousAttempts = new Map(
    activityAttempts
      .filter((attempt) => attempt.activityType === 'quick_check')
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.id.localeCompare(b.id))
      .map((attempt) => [attempt.activityId, attempt]),
  );

  return (
    <RegionActionCard
      eyebrow="Step 2"
      title="Quick Checks"
      description="One short answer-first check at a time before you move into practice."
      icon={<Target size={22} />}
      stateIcon={checks.length ? <CheckCircle2 size={22} aria-label={`${checks.length} quick checks available`} /> : undefined}
      className="quick-check-card"
    >
      {activeCheck ? (
        <>
          <div className="quick-check-list">
            <QuickCheckCard
              check={activeCheck.check}
              checkCount={checks.length}
              checkPosition={activeCheckIndexWithinRange + 1}
              hasNextCheck={activeCheckIndexWithinRange < checks.length - 1}
              key={activeCheck.check.id ?? activeCheck.snippetId}
              linkedExample={activeCheck.linkedExample}
              onContinueToExamPractice={onContinueToExamPractice}
              onContinueToWarmUp={onContinueToWarmUp}
              onLearningActivityAttempt={onLearningActivityAttempt}
              onNextCheck={() => setActiveCheckIndex((index) => Math.min(index + 1, checks.length - 1))}
              previousAttempt={previousAttempts.get(activeCheck.check.id ?? activeCheck.snippetId)}
              profileId={profileId}
              region={region}
              snippetId={activeCheck.snippetId}
              title={activeCheck.title}
            />
          </div>
          {queuedCheckCount ? <small className="region-card-note">{queuedCheckCount} more reviewed quick check{queuedCheckCount === 1 ? '' : 's'} queued after this one.</small> : null}
        </>
      ) : (
        <p className="region-empty-state">No reviewed quick checks are published for this region yet. Use the Field Guide and exam practice route.</p>
      )}
    </RegionActionCard>
  );
}
