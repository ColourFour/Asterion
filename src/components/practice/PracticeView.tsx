import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { BookOpenCheck, CheckCircle2, FileSearch, Map, RotateCcw } from 'lucide-react';
import type { Attempt, AttemptMarkBreakdown, AvatarSettings, IssueType, MistakeType, NormalizedQuestion, RegionDefinition, RegionProgress, RegionRank, StoredProgress, TrainingSessionIntent } from '../../types';
import { astralAssetDimensions, astralAssets } from '../../lib/astralAssets';
import type { AvatarLocation } from '../../lib/avatarLocation';
import { createId } from '../../lib/progressStore';
import { TRAINING_SESSION_LABELS } from '../../lib/regionLearning';
import type { RegionLearningPageId } from '../../lib/regionRoutes';
import { getRegionTheme } from '../../lib/regionThemes';
import { trainingBlockersForQuestion } from '../../lib/questionTraining';
import { parseAttemptMarkBreakdown, parseAttemptPartScores, parseAttemptScore } from '../../lib/attemptScoring';
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

type PartMarkInputs = Record<string, Record<keyof AttemptMarkBreakdown, string>>;

function emptyPartMarkInputs(parts: NormalizedQuestion['parts']): PartMarkInputs {
  return Object.fromEntries((parts ?? []).map((part) => [part.label, { ...emptyMarkInputs }]));
}

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
  progressionBlockedReason?: string;
  onAttempt: (attempt: Attempt) => void;
  onIssue: (questionId: string, issueType: IssueType, note?: string) => void;
  onReturnToMap?: () => void;
  onReviewWeak?: () => void;
  onContinuePractice?: () => void;
  continuePracticeLabel?: string;
  onOpenRegionTool?: (page: RegionLearningPageId) => void;
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
  progressionBlockedReason,
  onAttempt,
  onIssue,
  onReturnToMap,
  onReviewWeak,
  onContinuePractice,
  continuePracticeLabel,
  onOpenRegionTool,
}: PracticeViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [totalMarkInput, setTotalMarkInput] = useState('');
  const [markInputs, setMarkInputs] = useState<Record<keyof AttemptMarkBreakdown, string>>(emptyMarkInputs);
  const [partMarkInputs, setPartMarkInputs] = useState<PartMarkInputs>({});
  const [selectedMistakeTypes, setSelectedMistakeTypes] = useState<MistakeType[]>([]);
  const [fullScoreConfirmed, setFullScoreConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [markSchemeAvailability, setMarkSchemeAvailability] = useState<ImageStackAvailability>('pending');

  useEffect(() => {
    setRevealed(false);
    setTotalMarkInput('');
    setMarkInputs(emptyMarkInputs);
    setPartMarkInputs(emptyPartMarkInputs(question?.parts));
    setSelectedMistakeTypes([]);
    setFullScoreConfirmed(false);
    setNote('');
    setAttemptSaved(false);
    setStartedAt(Date.now());
    setMarkSchemeAvailability(question?.markSchemeImageCandidates.length ? 'pending' : 'unavailable');
  }, [question?.id, question?.markSchemeImageCandidates.length, question?.parts]);

  const maxMarks = question?.marksAvailable;
  const questionParts = question?.parts?.length ? question.parts : undefined;
  const hasQuestionMarkCaps = Boolean(question?.markBreakdown);
  const hasPartMarkCaps = Boolean(questionParts?.length && questionParts.every((part) => part.markBreakdown));
  const usesPartMarking = Boolean(questionParts?.length && hasPartMarkCaps);
  const usesCategoryMarking = Boolean(!questionParts?.length && hasQuestionMarkCaps);
  const usesTotalMarkFallback = !usesPartMarking && !usesCategoryMarking;
  const scoreValidation = useMemo(() => (
    usesPartMarking && questionParts?.length
      ? parseAttemptPartScores(partMarkInputs, questionParts, maxMarks)
      : usesCategoryMarking
        ? parseAttemptMarkBreakdown(markInputs, maxMarks, question?.markBreakdown)
        : parseAttemptScore(totalMarkInput, maxMarks)
  ), [markInputs, maxMarks, partMarkInputs, question?.markBreakdown, questionParts, totalMarkInput, usesCategoryMarking, usesPartMarking]);
  const trainingBlockers = useMemo(() => (question ? trainingBlockersForQuestion(question) : []), [question]);
  const questionIsTrainable = trainingBlockers.length === 0;
  const markSchemeIsAvailable = markSchemeAvailability === 'available';
  const canSaveScoredAttempt = questionIsTrainable && markSchemeIsAvailable && !progressionBlockedReason;
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
  const markSchemeNoticeTitle = progressionBlockedReason
    ? 'Region activity locked'
    : questionIsTrainable && markSchemeAvailability === 'pending' ? 'Mark scheme loading' : 'Mark scheme unavailable';
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
  const postAttemptContinueLabel = continuePracticeLabel ?? (isFullScore
    ? 'Next question'
    : selectedRegion ? 'Continue in this region' : 'Continue practice');
  const practiceRegion = selectedRegion ?? avatarLocation.region;
  const practiceRegionTheme = practiceRegion ? getRegionTheme(practiceRegion) : undefined;
  const practiceThemeStyle = practiceRegionTheme ? {
    '--practice-region-accent': practiceRegionTheme.colors.accent,
    '--practice-region-accent-text': practiceRegionTheme.colors.accentText,
    '--practice-region-accent-soft': practiceRegionTheme.colors.accentSoft,
  } as CSSProperties : undefined;
  const maxMarkValue = typeof maxMarks === 'number' ? maxMarks : 10;
  const enteredMarkTotal = usesPartMarking ? Object.values(partMarkInputs).reduce((sum, partInput) => {
    return sum + markCategories.reduce((partSum, category) => {
      const value = Number(partInput[category.key]);
      return Number.isFinite(value) ? partSum + value : partSum;
    }, 0);
  }, 0) : usesCategoryMarking ? markCategories.reduce((sum, category) => {
    const value = Number(markInputs[category.key]);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0) : Number(totalMarkInput);

  useEffect(() => {
    if (!isFullScore) setFullScoreConfirmed(false);
  }, [isFullScore]);

  function updateMarkInput(key: keyof AttemptMarkBreakdown, value: string) {
    setMarkInputs((current) => ({ ...current, [key]: value }));
  }

  function updatePartMarkInput(label: string, key: keyof AttemptMarkBreakdown, value: string) {
    setPartMarkInputs((current) => ({
      ...current,
      [label]: {
        ...(current[label] ?? emptyMarkInputs),
        [key]: value,
      },
    }));
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
      const categoryCap = question?.markBreakdown?.[key] ?? maxMarkValue;
      const otherTotal = markCategories.reduce((sum, category) => {
        if (category.key === key) return sum;
        const value = Number.parseInt(current[category.key] || '0', 10);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0);
      const upperLimit = Math.min(categoryCap, typeof maxMarks === 'number' ? Math.max(0, maxMarkValue - otherTotal) : maxMarkValue);
      const next = Math.min(upperLimit, Math.max(0, (Number.isFinite(currentValue) ? currentValue : 0) + delta));
      return { ...current, [key]: String(next) };
    });
  }

  function nudgePartMarkInput(label: string, key: keyof AttemptMarkBreakdown, maxPartMarks: number, delta: number, categoryCap?: number) {
    setPartMarkInputs((current) => {
      const partInput = current[label] ?? emptyMarkInputs;
      const currentValue = Number.parseInt(partInput[key] || '0', 10);
      const otherTotal = markCategories.reduce((sum, category) => {
        if (category.key === key) return sum;
        const value = Number.parseInt(partInput[category.key] || '0', 10);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0);
      const upperLimit = Math.min(categoryCap ?? maxPartMarks, Math.max(0, maxPartMarks - otherTotal));
      const next = Math.min(upperLimit, Math.max(0, (Number.isFinite(currentValue) ? currentValue : 0) + delta));
      return {
        ...current,
        [label]: {
          ...partInput,
          [key]: String(next),
        },
      };
    });
  }

  function nudgeTotalMark(delta: number) {
    setTotalMarkInput((current) => {
      const currentValue = Number.parseInt(current || '0', 10);
      const next = Math.min(maxMarkValue, Math.max(0, (Number.isFinite(currentValue) ? currentValue : 0) + delta));
      return String(next);
    });
  }

  function partMarkTotal(label: string): number {
    const partInput = partMarkInputs[label] ?? emptyMarkInputs;
    return markCategories.reduce((sum, category) => {
      const value = Number(partInput[category.key]);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
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
    <section className="practice-card encounter-chamber" style={practiceThemeStyle}>
      <header className="question-header">
        <div>
          <span className="mode-pill">{selectedRegion ? `${worldName} · ${selectedRegion.name}` : question.paperFamily.toUpperCase()}</span>
          <h2>{selectedRegion?.name ?? question.displayTopic}</h2>
          <p>{question.displaySubtopic ?? 'Mixed practice'} · {typeof maxMarks === 'number' ? `${maxMarks} marks` : 'marks unavailable'} · {question.paper ?? 'paper pending'} {question.questionNumber ? `Q${question.questionNumber}` : ''}</p>
          {selectedRegionRank ? <span className="rank-chip">Region rank: {selectedRegionRank}</span> : null}
        </div>
        <div className="question-header-actions">
          <RegionAvatarCameo avatarName={avatarName} avatar={avatar} regionProgress={regionProgress} location={avatarLocation} />
        </div>
      </header>

      {selectedRegion && onOpenRegionTool ? (
        <nav className="practice-region-tools" aria-label="Region tools">
          <span>Region tools</span>
          <button type="button" onClick={() => onOpenRegionTool('field-guide')}>Field Guide</button>
          <button type="button" onClick={() => onOpenRegionTool('quick-check')}>Quick Check</button>
          <button type="button" onClick={() => onOpenRegionTool('warm-up')}>Warm-Up</button>
          <button type="button" onClick={() => onOpenRegionTool('exam-training')}>Exam Training</button>
        </nav>
      ) : null}

      <div className="encounter-panel">
        <div>
          <strong>Encounter sequence</strong>
          <span>Work from the question image first. The mark scheme is the official answer key for exact self-marking.</span>
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
            <span>{regionLearningPhase === 'guardian' ? 'Why this Guardian check is showing' : 'Why this practice is showing'}</span>
            <strong>{sessionLabel ?? 'Region practice'}</strong>
          </div>
          <p>{sessionReason ?? 'This question is selected from your current region practice path.'}</p>
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
              <button className="practice-save-placeholder" type="button" disabled title="Reveal the mark scheme, enter exact marks, and reflect before saving.">Save Attempt</button>
            </div>
          ) : null}
          <details className="practice-support-details">
            <summary>Question support</summary>
            <IssueReportButton onReport={(issueType, reportNote) => onIssue(question.id, issueType, reportNote)} />
          </details>
        </section>

        {revealed ? (
          <section className="practice-panel mark-scheme-panel">
            <div className="panel-title-bar">Mark Scheme</div>
            <div className="archive-heading">
              <span>Mark scheme image</span>
              <h3>Compare your working</h3>
              <p>Use this image to decide every M, B, and A mark. Asterion does not auto-mark.</p>
            </div>
            {questionParts?.length ? (
              <div className="mark-scheme-part-guide" aria-label="Mark scheme part guide">
                <strong>Part-by-part marks</strong>
                <p>{hasPartMarkCaps ? 'Use the official mark-scheme image, then enter each part score below.' : 'Use the part totals shown here, then enter a total mark below.'}</p>
                <div>
                  {questionParts.map((part) => (
                    <span key={part.label}>Part {part.label}: {part.marksAvailable} mark{part.marksAvailable === 1 ? '' : 's'}</span>
                  ))}
                </div>
              </div>
            ) : null}
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
                <p>{progressionBlockedReason ?? 'The official mark scheme is unavailable or this record is paused for scoring. Asterion will not save marks, XP, mastery, or avatar progress for this question.'}</p>
                {progressionBlockedReason ? <small>Asterion will not save marks, XP, mastery, guardian clears, or avatar progress for this locked region.</small> : null}
                {trainingBlockers.length ? <small>This question is paused: {trainingBlockers.join('; ')}</small> : null}
                {markSchemeAvailability === 'pending' && questionIsTrainable ? <small>Loading the mark scheme. Saving unlocks only after it loads.</small> : null}
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
              const score = usesPartMarking && questionParts?.length
                ? parseAttemptPartScores(partMarkInputs, questionParts, maxMarks)
                : usesCategoryMarking
                  ? parseAttemptMarkBreakdown(markInputs, maxMarks, question.markBreakdown)
                  : parseAttemptScore(totalMarkInput, maxMarks);
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
                marksEarned: score.earned,
                markBreakdown: score.markBreakdown,
                partScores: score.partScores,
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
            <div className="self-mark-task-flow" aria-label="Self-marking task flow">
              <span>Compare mark scheme</span>
              <span>Enter marks</span>
              <span>Reflect</span>
              <span>Save attempt</span>
            </div>
            <p className="self-mark-helper">
              Self-marking means you enter the exact marks you earned from the official mark scheme. Saved attempts become region and Guardian evidence.
            </p>
            {usesPartMarking && questionParts?.length ? (
              <fieldset className={`mark-breakdown-fieldset part-mark-fieldset${isFullScore ? ' full-score-marking' : ''}${fullScoreConfirmed ? ' is-confirmed' : ''}`}>
                <legend>Your Mark by Part</legend>
                <p className="marking-helper">Enter M, B, and A marks for each question part using the official mark scheme above. Each box is capped by the available mark category when shown.</p>
                <div className="part-mark-grid">
                  {questionParts.map((part, index) => (
                    <div key={part.label} className="part-mark-box">
                      <div className="mark-box-label part-mark-box-header">
                        <span className="mark-code">{part.label}</span>
                        <span className="mark-description">Part {part.label} · {part.marksAvailable} mark{part.marksAvailable === 1 ? '' : 's'}</span>
                      </div>
                      <div className="part-mark-type-grid">
                        {markCategories.map((category) => (
                          <div key={`${part.label}-${category.key}`} className="part-mark-type-box">
                            <label className="mark-box-label" htmlFor={`${question.id}-part-${index}-${category.key}-marks`}>
                              <span className="mark-code">{category.label}</span>
                              <span className="mark-description">{category.description}</span>
                            </label>
                            <div className="mark-box-stepper">
                              <button type="button" onClick={() => nudgePartMarkInput(part.label, category.key, part.marksAvailable, -1, part.markBreakdown?.[category.key])} aria-label={`Decrease part ${part.label} ${category.label} score`}>-</button>
                              <input
                                id={`${question.id}-part-${index}-${category.key}-marks`}
                                type="number"
                                min="0"
                                max={part.markBreakdown?.[category.key] ?? part.marksAvailable}
                                step="1"
                                value={partMarkInputs[part.label]?.[category.key] ?? ''}
                                placeholder="0"
                                onChange={(event) => updatePartMarkInput(part.label, category.key, event.target.value)}
                                aria-invalid={Boolean(scoreValidation.error)}
                                aria-label={`Part ${part.label} ${category.label} marks`}
                              />
                              <button type="button" onClick={() => nudgePartMarkInput(part.label, category.key, part.marksAvailable, 1, part.markBreakdown?.[category.key])} aria-label={`Increase part ${part.label} ${category.label} score`}>+</button>
                            </div>
                            {part.markBreakdown ? <small className="mark-cap-note">Max {part.markBreakdown[category.key]}</small> : null}
                          </div>
                        ))}
                      </div>
                      <div className="part-mark-subtotal">
                        <span>Part {part.label} subtotal</span>
                        <strong>{partMarkTotal(part.label)} / {part.marksAvailable}</strong>
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
            ) : usesCategoryMarking ? (
              <fieldset className={`mark-breakdown-fieldset${isFullScore ? ' full-score-marking' : ''}${fullScoreConfirmed ? ' is-confirmed' : ''}`}>
                <legend>Your Mark</legend>
                <p className="marking-helper">Enter your mark from the official mark scheme above. Each M, B, and A field is capped by the available mark category.</p>
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
                          max={question.markBreakdown?.[category.key] ?? maxMarks}
                          step="1"
                          value={markInputs[category.key]}
                          placeholder="0"
                          onChange={(event) => updateMarkInput(category.key, event.target.value)}
                          aria-invalid={Boolean(scoreValidation.error)}
                          aria-label={`${category.label} marks`}
                        />
                        <button type="button" onClick={() => nudgeMarkInput(category.key, 1)} aria-label={`Increase ${category.label} score`}>+</button>
                      </div>
                      {question.markBreakdown ? <small className="mark-cap-note">Max {question.markBreakdown[category.key]}</small> : null}
                    </div>
                  ))}
                </div>
                <div className="mark-total-row">
                  <span>Total</span>
                  <strong>{typeof scoreValidation.earned === 'number' ? scoreValidation.earned : enteredMarkTotal} / {typeof maxMarks === 'number' ? maxMarks : '?'}</strong>
                </div>
                {scoreValidation.error ? <span className="form-error">{scoreValidation.error}</span> : null}
              </fieldset>
            ) : (
              <fieldset className={`mark-breakdown-fieldset total-mark-fieldset${isFullScore ? ' full-score-marking' : ''}${fullScoreConfirmed ? ' is-confirmed' : ''}`}>
                <legend>Your Mark</legend>
                <p className="marking-helper">Enter the total mark from the official mark scheme.</p>
                <div className="mark-breakdown-grid mark-total-entry-grid">
                  <div className="mark-breakdown-box">
                    <label className="mark-box-label" htmlFor={`${question.id}-total-marks`}>
                      <span className="mark-code">Total</span>
                      <span className="mark-description">Score from mark scheme</span>
                    </label>
                    <div className="mark-box-stepper">
                      <button type="button" onClick={() => nudgeTotalMark(-1)} aria-label="Decrease total score">-</button>
                      <input
                        id={`${question.id}-total-marks`}
                        type="number"
                        min="0"
                        max={maxMarks}
                        step="1"
                        value={totalMarkInput}
                        placeholder="0"
                        onChange={(event) => setTotalMarkInput(event.target.value)}
                        aria-invalid={Boolean(scoreValidation.error)}
                        aria-label="Total marks"
                      />
                      <button type="button" onClick={() => nudgeTotalMark(1)} aria-label="Increase total score">+</button>
                    </div>
                  </div>
                </div>
                <div className="mark-total-row">
                  <span>Total</span>
                  <strong>{typeof scoreValidation.earned === 'number' ? scoreValidation.earned : Number.isFinite(enteredMarkTotal) ? enteredMarkTotal : 0} / {typeof maxMarks === 'number' ? maxMarks : '?'}</strong>
                </div>
                {scoreValidation.error ? <span className="form-error">{scoreValidation.error}</span> : null}
              </fieldset>
            )}

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
            {!attemptSaved && onContinuePractice ? (
              <p className="next-question-save-gate" role="status">Save this attempt before the next question unlocks.</p>
            ) : null}
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
              ? guardianPassed ? 'Your region reward is now unlocked.' : 'The Guardian is recorded, but the region is not cleared yet.'
              : 'Region progress increased only from saved evidence.'}
          </span>
          <details className="post-attempt-review-details">
            <summary>Review saved details</summary>
            <span>{typeof scoreValidation.earned === 'number' ? `${scoreValidation.earned}/${maxMarks ?? '?'} marks` : 'Saved attempt'} · {isFullScore ? 'Full-score evidence checked' : selectedMistakeTypes.length ? selectedMistakeTypes.map((type) => mistakeLabels[type as SelectableMistakeType] ?? type).join(', ') : 'No mistake tag'}</span>
          </details>
          <div className="practice-actions">
            {onContinuePractice ? <button className={isFullScore ? 'primary-button' : undefined} type="button" onClick={onContinuePractice}><RotateCcw size={16} /> {postAttemptContinueLabel}</button> : null}
            {onReturnToMap ? <button type="button" onClick={onReturnToMap}><Map size={16} /> Return to P3 Astral Academy</button> : null}
            {onReviewWeak ? <button type="button" onClick={onReviewWeak}><BookOpenCheck size={16} /> Review weak areas</button> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
