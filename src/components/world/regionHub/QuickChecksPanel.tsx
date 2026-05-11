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

interface QuickChecksPanelProps {
  teachingSnippets: TeachingSnippet[];
  region?: RegionDefinition;
  profileId?: string;
  activityAttempts?: LearningActivityAttempt[];
  maxInitialItems?: number;
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
  const [startedAt] = useState(() => new Date().toISOString());
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

  return (
    <article className="quick-check-reveal" data-activity-id={activityId}>
      <header className="quick-check-heading">
        <strong>Quick check: {title}</strong>
        {previousAttempt ? <small>Last: {activityOutcomes.find((item) => item.value === previousAttempt.outcome)?.label ?? previousAttempt.outcome}</small> : null}
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
        />
      </label>
      {!answerVisible ? (
        <div className="activity-reveal-actions">
          <button type="button" disabled={!responseReady} onClick={() => reveal(false)}>Reveal answer</button>
          <button type="button" onClick={() => reveal(true)}>Reveal anyway</button>
        </div>
      ) : (
        <div className="quick-check-answer">
          <strong>Answer</strong>
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
          <button type="button" disabled={!canSave} onClick={saveAttempt}>{saved ? 'Saved' : 'Save check'}</button>
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
  maxInitialItems = 2,
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
  const visibleChecks = checks.slice(0, maxInitialItems);
  const hiddenCheckCount = Math.max(0, checks.length - visibleChecks.length);
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
      description="Two short answer-first checks before you move into practice."
      icon={<Target size={22} />}
      stateIcon={checks.length ? <CheckCircle2 size={22} aria-label={`${checks.length} quick checks available`} /> : undefined}
      className="quick-check-card"
    >
      {visibleChecks.length ? (
        <>
          <div className="quick-check-list">
            {visibleChecks.map(({ snippetId, title, check, linkedExample }) => (
              <QuickCheckCard
                check={check}
                key={snippetId}
                linkedExample={linkedExample}
                onLearningActivityAttempt={onLearningActivityAttempt}
                previousAttempt={previousAttempts.get(check.id ?? snippetId)}
                profileId={profileId}
                region={region}
                snippetId={snippetId}
                title={title}
              />
            ))}
          </div>
          {hiddenCheckCount ? <small className="region-card-note">{hiddenCheckCount} more reviewed quick check{hiddenCheckCount === 1 ? '' : 's'} available.</small> : null}
        </>
      ) : (
        <p className="region-empty-state">No reviewed quick checks are published for this region yet. Use the Field Guide and exam practice route.</p>
      )}
    </RegionActionCard>
  );
}
