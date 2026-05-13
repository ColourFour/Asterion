import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { LearningActivityAttempt, LearningActivityOutcome, MistakeType, RegionDefinition } from '../../../types';
import { createId } from '../../../lib/progressStore';
import type { GeneratedPracticeItem } from '../../../lib/generatedPractice';
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
  { value: 'slow_method', label: 'Slow method' },
  { value: 'lucky_or_unsure', label: 'Lucky or unsure' },
  { value: 'other', label: 'Other' },
];

interface WarmUpPracticePanelProps {
  practiceItems: GeneratedPracticeItem[];
  region?: RegionDefinition;
  profileId?: string;
  activityAttempts?: LearningActivityAttempt[];
  maxInitialItems?: number;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

interface WarmUpPracticeCardProps {
  item: GeneratedPracticeItem;
  region?: RegionDefinition;
  profileId?: string;
  previousAttempt?: LearningActivityAttempt;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

function WarmUpPracticeCard({
  item,
  region,
  profileId,
  previousAttempt,
  onLearningActivityAttempt,
}: WarmUpPracticeCardProps) {
  const [solutionVisible, setSolutionVisible] = useState(false);
  const [learnerResponse, setLearnerResponse] = useState('');
  const [revealedEarly, setRevealedEarly] = useState(false);
  const [outcome, setOutcome] = useState<LearningActivityOutcome>();
  const [confidence, setConfidence] = useState(3);
  const [errorType, setErrorType] = useState('');
  const [saved, setSaved] = useState(false);
  const [startedAt] = useState(() => new Date().toISOString());
  const solutionId = `warm-up-solution-${item.practiceId}`;
  const familyParts = item.generatorFamily.split('.');
  const practiceLabel = humanReadableLabel(item.questionType ?? familyParts[familyParts.length - 1] ?? 'Warm-up');
  const responseReady = learnerResponse.trim().length > 0;
  const canSave = Boolean(solutionVisible && outcome && !saved && onLearningActivityAttempt && region);

  function reveal(early: boolean) {
    setSolutionVisible(true);
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
    setSaved(true);
  }

  return (
    <article className="warm-up-practice-card" data-activity-id={item.practiceId}>
      <div className="warm-up-practice-heading">
        <strong>{practiceLabel}</strong>
        <span>{item.difficultyBand}</span>
      </div>
      {previousAttempt ? <small className="region-card-note">Last: {activityOutcomes.find((entry) => entry.value === previousAttempt.outcome)?.label ?? previousAttempt.outcome}</small> : null}
      {(item.questionType || item.keyMethod) ? (
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
      ) : null}
      <p><MathText text={item.prompt} /></p>
      <label className="activity-response-field">
        Answer or method note
        <textarea
          value={learnerResponse}
          onChange={(event) => setLearnerResponse(event.target.value)}
          rows={3}
          disabled={solutionVisible}
        />
      </label>
      {!solutionVisible ? (
        <div className="activity-reveal-actions">
          <button
            className="warm-up-reveal-button"
            type="button"
            disabled={!responseReady}
            aria-expanded={solutionVisible}
            aria-controls={solutionId}
            onClick={() => reveal(false)}
          >
            Reveal solution
          </button>
          <button type="button" onClick={() => reveal(true)}>Reveal anyway</button>
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
          {revealedEarly ? <small className="region-card-note">Early reveal recorded when you save this warm-up.</small> : null}
        </div>
      )}
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
          <button type="button" disabled={!canSave} onClick={saveAttempt}>{saved ? 'Saved' : 'Save warm-up'}</button>
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

export function WarmUpPracticePanel({
  practiceItems,
  region,
  profileId,
  activityAttempts = [],
  maxInitialItems = 3,
  onLearningActivityAttempt,
}: WarmUpPracticePanelProps) {
  const visiblePractice = practiceItems.slice(0, maxInitialItems);
  const hiddenPracticeCount = Math.max(0, practiceItems.length - visiblePractice.length);
  const previousAttempts = new Map(
    activityAttempts
      .filter((attempt) => attempt.activityType === 'warm_up')
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
          <p className="section-helper warm-up-set-note">Try one prompt first. Reveal the solution only after you have a route.</p>
          <div className="warm-up-practice-grid">
            {visiblePractice.map((item) => (
              <WarmUpPracticeCard
                item={item}
                key={item.practiceId}
                onLearningActivityAttempt={onLearningActivityAttempt}
                previousAttempt={previousAttempts.get(item.practiceId)}
                profileId={profileId}
                region={region}
              />
            ))}
          </div>
          {hiddenPracticeCount ? <small className="region-card-note">Showing {visiblePractice.length} of {practiceItems.length} reviewed warm-ups.</small> : null}
        </>
      ) : (
        <p className="region-empty-state">Warm-ups for this region are being prepared. Start with the Field Guide or jump into Exam Training.</p>
      )}
    </RegionActionCard>
  );
}
