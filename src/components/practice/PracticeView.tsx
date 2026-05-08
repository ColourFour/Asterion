import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, FileSearch, Map, RotateCcw } from 'lucide-react';
import type { Attempt, AttemptMarkBreakdown, AvatarSettings, IssueType, MistakeType, NormalizedQuestion, RegionDefinition, RegionProgress, RegionRank, StoredProgress, TrainingSessionIntent } from '../../types';
import { astralAssetDimensions, astralAssets } from '../../lib/astralAssets';
import type { AvatarLocation } from '../../lib/avatarLocation';
import { createId } from '../../lib/progressStore';
import { TRAINING_SESSION_LABELS } from '../../lib/regionLearning';
import { trainingBlockersForQuestion } from '../../lib/questionTraining';
import { parseAttemptMarkBreakdown } from '../../lib/attemptScoring';
import { RegionAvatarCameo } from '../avatar/RegionAvatarCameo';
import { ImageStack, type ImageStackAvailability } from './ImageStack';
import { IssueReportButton } from './IssueReportButton';

const markCategories: Array<{ key: keyof AttemptMarkBreakdown; label: string; description: string }> = [
  { key: 'm', label: 'M', description: 'Method' },
  { key: 'b', label: 'B', description: 'Independent' },
  { key: 'a', label: 'A', description: 'Accuracy' },
];

const emptyMarkInputs: Record<keyof AttemptMarkBreakdown, string> = {
  m: '',
  b: '',
  a: '',
};

const FULL_SCORE_EVIDENCE_NOTE_MIN_LENGTH = 8;
type SelectableMistakeType = Exclude<MistakeType, 'no_issue'>;

const selectableMistakeTypes: SelectableMistakeType[] = [
  'did_not_know_method',
  'could_not_start',
  'algebra_error',
  'formula_issue',
  'misread_question',
  'diagram_or_modeling_issue',
  'rounding_accuracy',
  'slow_method',
  'ran_out_of_time',
  'lucky_or_unsure',
  'other',
];

const mistakeLabels: Record<SelectableMistakeType, string> = {
  did_not_know_method: 'I did not know the method',
  algebra_error: 'Algebra error',
  misread_question: 'Misread the question',
  formula_issue: 'Formula or identity issue',
  diagram_or_modeling_issue: 'Diagram or modelling issue',
  ran_out_of_time: 'Ran out of time',
  rounding_accuracy: 'Rounding or accuracy issue',
  could_not_start: 'Could not start',
  slow_method: 'Method worked but was slow',
  lucky_or_unsure: 'Lucky or unsure',
  other: 'Other',
};

interface PracticeViewProps {
  question?: NormalizedQuestion;
  progress: StoredProgress;
  avatarName: string;
  avatar: AvatarSettings;
  regionProgress: RegionProgress[];
  avatarLocation: AvatarLocation;
  worldName?: string;
  selectedRegion?: RegionDefinition;
  selectedRegionRank?: RegionRank;
  regionLearningPhase?: 'training' | 'guardian';
  sessionIntent?: TrainingSessionIntent;
  sessionReason?: string;
  guardianPassThreshold?: number;
  onAttempt: (attempt: Attempt) => void;
  onIssue: (questionId: string, issueType: IssueType, note?: string) => void;
  onReturnToMap?: () => void;
  onReviewWeak?: () => void;
  onContinuePractice?: () => void;
  continuePracticeLabel?: string;
}

export function PracticeView({
  question,
  progress,
  avatarName,
  avatar,
  regionProgress,
  avatarLocation,
  worldName,
  selectedRegion,
  selectedRegionRank,
  regionLearningPhase,
  sessionIntent,
  sessionReason,
  guardianPassThreshold,
  onAttempt,
  onIssue,
  onReturnToMap,
  onReviewWeak,
  onContinuePractice,
  continuePracticeLabel,
}: PracticeViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [markInputs, setMarkInputs] = useState<Record<keyof AttemptMarkBreakdown, string>>(emptyMarkInputs);
  const [selectedMistakeTypes, setSelectedMistakeTypes] = useState<MistakeType[]>([]);
  const [fullScoreConfirmed, setFullScoreConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [markSchemeAvailability, setMarkSchemeAvailability] = useState<ImageStackAvailability>('pending');

  useEffect(() => {
    setRevealed(false);
    setMarkInputs(emptyMarkInputs);
    setSelectedMistakeTypes([]);
    setFullScoreConfirmed(false);
    setNote('');
    setAttemptSaved(false);
    setStartedAt(Date.now());
    setMarkSchemeAvailability(question?.markSchemeImageCandidates.length ? 'pending' : 'unavailable');
  }, [question?.id]);

  const maxMarks = question?.marksAvailable;
  const scoreValidation = useMemo(() => parseAttemptMarkBreakdown(markInputs, maxMarks), [markInputs, maxMarks]);
  const trainingBlockers = useMemo(() => (question ? trainingBlockersForQuestion(question) : []), [question]);
  const questionIsTrainable = trainingBlockers.length === 0;
  const markSchemeIsAvailable = markSchemeAvailability === 'available';
  const canSaveScoredAttempt = questionIsTrainable && markSchemeIsAvailable;
  const isFullScore = Boolean(
    scoreValidation.isValid
    && typeof scoreValidation.earned === 'number'
    && typeof maxMarks === 'number'
    && maxMarks > 0
    && scoreValidation.earned === maxMarks,
  );
  const fullScoreEvidenceNoteIsReady = note.trim().length >= FULL_SCORE_EVIDENCE_NOTE_MIN_LENGTH;
  const attemptReflectionIsReady = isFullScore
    ? fullScoreConfirmed && fullScoreEvidenceNoteIsReady
    : selectedMistakeTypes.length > 0;
  const canSubmit = Boolean(question && revealed && canSaveScoredAttempt && scoreValidation.isValid && attemptReflectionIsReady);
  const markSchemeNoticeTitle = questionIsTrainable && markSchemeAvailability === 'pending' ? 'Mark scheme loading' : 'Mark scheme unavailable';
  const scorePreview = useMemo(() => {
    if (typeof scoreValidation.scoreRatio !== 'number') return undefined;
    return Math.round(scoreValidation.scoreRatio * 100);
  }, [scoreValidation.scoreRatio]);
  const guardianPassed = regionLearningPhase === 'guardian'
    && typeof guardianPassThreshold === 'number'
    && typeof scoreValidation.scoreRatio === 'number'
    && scoreValidation.scoreRatio >= guardianPassThreshold;
  const sessionLabel = regionLearningPhase === 'guardian'
    ? 'Region Guardian'
    : sessionIntent
      ? TRAINING_SESSION_LABELS[sessionIntent]
      : undefined;
  const maxMarkValue = typeof maxMarks === 'number' ? maxMarks : 10;
  const enteredMarkTotal = markCategories.reduce((sum, category) => {
    const value = Number(markInputs[category.key]);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  useEffect(() => {
    if (!isFullScore) setFullScoreConfirmed(false);
  }, [isFullScore]);

  function updateMarkInput(key: keyof AttemptMarkBreakdown, value: string) {
    setMarkInputs((current) => ({ ...current, [key]: value }));
  }

  function toggleMistakeType(type: SelectableMistakeType) {
    setSelectedMistakeTypes((current) => (
      current.includes(type)
        ? current.filter((selected) => selected !== type)
        : [...current, type]
    ));
  }

  function nudgeMarkInput(key: keyof AttemptMarkBreakdown, delta: number) {
    setMarkInputs((current) => {
      const currentValue = Number.parseInt(current[key] || '0', 10);
      const otherTotal = markCategories.reduce((sum, category) => {
        if (category.key === key) return sum;
        const value = Number.parseInt(current[category.key] || '0', 10);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0);
      const upperLimit = typeof maxMarks === 'number' ? Math.max(0, maxMarkValue - otherTotal) : maxMarkValue;
      const next = Math.min(upperLimit, Math.max(0, (Number.isFinite(currentValue) ? currentValue : 0) + delta));
      return { ...current, [key]: String(next) };
    });
  }

  if (!question) {
    return (
      <section className="practice-card empty-state empty-wing">
        <strong>Closed academy wing</strong>
        <p>No questions are available for this region yet.</p>
        {onReturnToMap ? <button className="primary-button" type="button" onClick={onReturnToMap}>Return to P3 Astral Academy</button> : null}
      </section>
    );
  }

  return (
    <section className="practice-card encounter-chamber">
      <header className="question-header">
        <div>
          <span className="mode-pill">{selectedRegion ? `${worldName} · ${selectedRegion.name}` : question.paperFamily.toUpperCase()}</span>
          <h2>{selectedRegion?.name ?? question.displayTopic}</h2>
          <p>{question.displaySubtopic ?? 'Mixed practice'} · {question.displayDifficulty ?? 'difficulty pending'} · {typeof maxMarks === 'number' ? `${maxMarks} marks` : 'marks unavailable'} · {question.paper ?? 'paper pending'} {question.questionNumber ? `Q${question.questionNumber}` : ''}</p>
          {selectedRegionRank ? <span className="rank-chip">Region rank: {selectedRegionRank}</span> : null}
        </div>
        <div className="question-header-actions">
          <RegionAvatarCameo avatarName={avatarName} avatar={avatar} regionProgress={regionProgress} location={avatarLocation} />
          <IssueReportButton onReport={(issueType, reportNote) => onIssue(question.id, issueType, reportNote)} />
        </div>
      </header>

      <div className="encounter-panel">
        <div>
          <strong>Encounter sequence</strong>
          <span>Work from the question image first. Reveal the official mark scheme only when ready to self-mark.</span>
        </div>
        <ol className="encounter-steps">
          <li className="active"><FileSearch size={16} /> Solve</li>
          <li className={revealed ? 'active' : ''}><BookOpenCheck size={16} /> Reveal</li>
          <li className={attemptSaved ? 'active' : ''}><CheckCircle2 size={16} /> Record</li>
        </ol>
      </div>

      {sessionLabel || sessionReason ? (
        <div className={`session-rationale-panel${regionLearningPhase === 'guardian' ? ' guardian-session' : ''}`}>
          <div>
            <span>{regionLearningPhase === 'guardian' ? 'Why this mastery check is showing' : 'Why this practice is showing'}</span>
            <strong>{sessionLabel ?? 'Region practice'}</strong>
          </div>
          <p>{sessionReason ?? 'This question is selected from the current region using the local adaptive practice flow.'}</p>
          {regionLearningPhase === 'guardian' && typeof guardianPassThreshold === 'number' ? (
            <small>Clear threshold: {Math.round(guardianPassThreshold * 100)}% or higher on this saved attempt.</small>
          ) : null}
        </div>
      ) : null}

      <div className={`practice-workspace${revealed ? ' is-revealed' : ''}`}>
        <section className="practice-panel question-panel">
          <div className="panel-title-bar">Practice Session</div>
          <div className="paper-window">
            <span className="paper-caption">{selectedRegion?.name ?? question.displayTopic} - Question {question.questionNumber ?? ''}</span>
            <ImageStack candidateGroups={question.questionImageCandidates} label="Question" />
          </div>
          {!revealed ? (
            <div className="practice-footer-actions">
              <button className="primary-button reveal-button" type="button" onClick={() => setRevealed(true)}>
                Reveal Mark Scheme
              </button>
              <button type="button" disabled>Save Attempt</button>
            </div>
          ) : null}
        </section>

        {revealed ? (
          <section className="practice-panel mark-scheme-panel">
            <div className="panel-title-bar">Mark Scheme</div>
            <div className="archive-heading">
              <span>Official archive</span>
              <h3>Compare your working</h3>
            </div>
            <div className="paper-window mark-window">
              <ImageStack
                candidateGroups={question.markSchemeImageCandidates}
                label="Mark scheme"
                onAvailabilityChange={setMarkSchemeAvailability}
              />
            </div>
            {!canSaveScoredAttempt ? (
              <div className="mark-scheme-unavailable" role="status">
                <strong>{markSchemeNoticeTitle}</strong>
                <p>The official mark scheme is unavailable or this record is paused for scoring. Asterion will not save marks, XP, mastery, or avatar progress for this question.</p>
                {trainingBlockers.length ? <small>Teacher check: {trainingBlockers.join('; ')}</small> : null}
                {markSchemeAvailability === 'pending' && questionIsTrainable ? <small>Loading the canonical mark scheme. Saving unlocks only after it loads.</small> : null}
              </div>
            ) : null}
            <div className="practice-footer-actions">
              <button type="button" onClick={() => setRevealed(false)}>Back to Question</button>
            </div>
          </section>
        ) : null}

        {revealed ? (
          <form
            className="attempt-form self-mark-panel practice-panel"
            onSubmit={(event) => {
              event.preventDefault();
              if (!progress.profile) return;
              if (!canSaveScoredAttempt) return;
              const score = parseAttemptMarkBreakdown(markInputs, maxMarks);
              if (!score.isValid || typeof score.earned !== 'number') return;
              const savedAsFullScore = typeof maxMarks === 'number' && maxMarks > 0 && score.earned === maxMarks;
              const savedMistakeTypes = savedAsFullScore ? [] : selectedMistakeTypes;
              if (savedAsFullScore && (!fullScoreConfirmed || note.trim().length < FULL_SCORE_EVIDENCE_NOTE_MIN_LENGTH)) return;
              if (!savedAsFullScore && savedMistakeTypes.length === 0) return;
              onAttempt({
                id: createId('attempt'),
                profileId: progress.profile.id,
                questionId: question.id,
                paperFamily: question.paperFamily,
                paper: question.paper,
                questionNumber: question.questionNumber,
                topicDisplayName: question.displayTopic,
                localTopic: question.localTopic,
                deepseekTopic: question.deepseek.topic,
                subtopic: question.displaySubtopic,
                difficulty: question.displayDifficulty,
                marksEarned: score.earned,
                markBreakdown: score.markBreakdown,
                marksAvailable: maxMarks,
                scoreRatio: score.scoreRatio,
                mistakeType: savedMistakeTypes[0],
                mistakeTypes: savedMistakeTypes,
                fullScoreConfirmed: savedAsFullScore || undefined,
                note: note.trim(),
                timeSpentSeconds: Math.round((Date.now() - startedAt) / 1000),
                markSchemeRevealed: revealed,
                attemptedAt: new Date().toISOString(),
                worldName,
                regionName: selectedRegion?.name,
                regionRankAtAttempt: selectedRegionRank,
              });
              setAttemptSaved(true);
            }}
          >
            <div className="panel-title-bar">Self-Mark</div>
            <fieldset className={`mark-breakdown-fieldset${isFullScore ? ' full-score-marking' : ''}${fullScoreConfirmed ? ' is-confirmed' : ''}`}>
              <legend>Your Mark</legend>
              <div className="mark-breakdown-grid">
                {markCategories.map((category) => (
                  <div key={category.key} className="mark-breakdown-box">
                    <label className="mark-box-label" htmlFor={`${question.id}-${category.key}-marks`}>
                      <span className="mark-code">{category.label}</span>
                      <span className="mark-description">{category.description}</span>
                    </label>
                    <div className="mark-box-stepper">
                      <button type="button" onClick={() => nudgeMarkInput(category.key, -1)} aria-label={`Decrease ${category.label} score`}>-</button>
                      <input
                        id={`${question.id}-${category.key}-marks`}
                        type="number"
                        min="0"
                        max={maxMarks}
                        step="1"
                        value={markInputs[category.key]}
                        onChange={(event) => updateMarkInput(category.key, event.target.value)}
                        aria-invalid={Boolean(scoreValidation.error)}
                        aria-label={`${category.label} marks`}
                      />
                      <button type="button" onClick={() => nudgeMarkInput(category.key, 1)} aria-label={`Increase ${category.label} score`}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mark-total-row">
                <span>Total</span>
                <strong>{typeof scoreValidation.earned === 'number' ? scoreValidation.earned : enteredMarkTotal} / {typeof maxMarks === 'number' ? maxMarks : '?'}</strong>
              </div>
              {scoreValidation.error ? <span className="form-error">{scoreValidation.error}</span> : null}
            </fieldset>

            {isFullScore ? (
              <fieldset className={`full-score-check-panel${fullScoreConfirmed ? ' is-confirmed' : ''}`}>
                <legend>Full-score check</legend>
                <div className="full-score-check-copy">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Full score selected.</strong>
                    <p>Reflection tags are skipped for perfect scores. To make this count for progress, confirm it against the official mark scheme and leave a short evidence note.</p>
                  </div>
                </div>
                <label className="full-score-check-label">
                  <input
                    type="checkbox"
                    checked={fullScoreConfirmed}
                    onChange={(event) => setFullScoreConfirmed(event.target.checked)}
                    required
                  />
                  <span>I checked each mark-scheme line and can explain where every mark was earned.</span>
                </label>
                {!fullScoreEvidenceNoteIsReady ? (
                  <small className="form-hint">Add a short evidence note below before saving a full-score attempt.</small>
                ) : null}
              </fieldset>
            ) : (
              <fieldset className="mistake-fieldset">
                <legend>Mistake tags</legend>
                <p className="mistake-helper">Choose all that apply. These tags help future training focus on the right kind of error.</p>
                <div className="mistake-choice-grid">
                  {selectableMistakeTypes.map((type) => (
                    <label key={type} className="mistake-choice">
                      <input
                        type="checkbox"
                        name="mistakeTypes"
                        value={type}
                        checked={selectedMistakeTypes.includes(type)}
                        onChange={() => toggleMistakeType(type)}
                      />
                      <span>{mistakeLabels[type]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <label>
              {isFullScore ? 'Full-score evidence note' : 'Optional note'}
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                required={isFullScore}
                minLength={isFullScore ? FULL_SCORE_EVIDENCE_NOTE_MIN_LENGTH : undefined}
                placeholder={isFullScore ? 'Example: Matched M1 to log law, A1 to final value, and checked the domain.' : undefined}
              />
            </label>
            <button className="primary-button" type="submit" disabled={!canSubmit || attemptSaved}>
              Save Attempt {scorePreview != null ? `(${scorePreview}%)` : ''}
            </button>
          </form>
        ) : null}
      </div>

      {attemptSaved ? (
        <div className="post-attempt-panel progress-updated-panel">
          <div className="panel-title-bar">Progress Updated</div>
          <div className="progress-scene" aria-hidden="true">
            <img
              src={astralAssets.progressGarden}
              alt=""
              width={astralAssetDimensions.progressGarden.width}
              height={astralAssetDimensions.progressGarden.height}
              loading="lazy"
              decoding="async"
            />
          </div>
          <strong>{regionLearningPhase === 'guardian' ? (guardianPassed ? 'Guardian cleared' : 'Guardian attempt saved') : `+${typeof scoreValidation.earned === 'number' ? scoreValidation.earned : 0} XP`}</strong>
          <span>
            {scorePreview != null ? `${scorePreview}% recorded` : 'Marks recorded'} for {selectedRegion?.name ?? question.displayTopic}.
            {' '}
            {regionLearningPhase === 'guardian'
              ? guardianPassed ? 'The region reward placeholder is now unlocked locally.' : 'The guardian is recorded, but the region is not cleared yet.'
              : 'Region progress increased only from saved evidence.'}
          </span>
          <div className="practice-actions">
            {onContinuePractice ? <button type="button" onClick={onContinuePractice}><RotateCcw size={16} /> {continuePracticeLabel ?? (selectedRegion ? 'Continue in this region' : 'Continue practice')}</button> : null}
            {onReturnToMap ? <button type="button" onClick={onReturnToMap}><Map size={16} /> Return to P3 Astral Academy</button> : null}
            {onReviewWeak ? <button type="button" onClick={onReviewWeak}><BookOpenCheck size={16} /> Review weak areas</button> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
