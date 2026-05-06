import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, FileSearch, Map, RotateCcw } from 'lucide-react';
import type { Attempt, IssueType, MistakeType, NormalizedQuestion, RegionDefinition, RegionRank, StoredProgress } from '../../types';
import { createId } from '../../lib/progressStore';
import { parseAttemptScore } from '../../lib/attemptScoring';
import { ImageStack } from './ImageStack';
import { IssueReportButton } from './IssueReportButton';

const mistakeTypes: MistakeType[] = [
  'no_issue',
  'did_not_know_method',
  'algebra_error',
  'misread_question',
  'formula_issue',
  'diagram_or_modeling_issue',
  'ran_out_of_time',
  'rounding_accuracy',
  'could_not_start',
  'slow_method',
  'lucky_or_unsure',
  'other',
];

const mistakeLabels: Record<MistakeType, string> = {
  no_issue: 'No issue - I understood it',
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
  worldName?: string;
  selectedRegion?: RegionDefinition;
  selectedRegionRank?: RegionRank;
  onAttempt: (attempt: Attempt) => void;
  onIssue: (questionId: string, issueType: IssueType, note?: string) => void;
  onReturnToMap?: () => void;
  onReviewWeak?: () => void;
  onContinuePractice?: () => void;
}

export function PracticeView({ question, progress, worldName, selectedRegion, selectedRegionRank, onAttempt, onIssue, onReturnToMap, onReviewWeak, onContinuePractice }: PracticeViewProps) {
  const [revealed, setRevealed] = useState(false);
  const [marksEarned, setMarksEarned] = useState('');
  const [mistakeType, setMistakeType] = useState<MistakeType | ''>('');
  const [note, setNote] = useState('');
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    setRevealed(false);
    setMarksEarned('');
    setMistakeType('');
    setNote('');
    setAttemptSaved(false);
    setStartedAt(Date.now());
  }, [question?.id]);

  const maxMarks = question?.marksAvailable;
  const scoreValidation = useMemo(() => parseAttemptScore(marksEarned, maxMarks), [marksEarned, maxMarks]);
  const canSubmit = Boolean(question && revealed && scoreValidation.isValid && mistakeType);
  const scorePreview = useMemo(() => {
    if (typeof scoreValidation.scoreRatio !== 'number') return undefined;
    return Math.round(scoreValidation.scoreRatio * 100);
  }, [scoreValidation.scoreRatio]);

  if (!question) {
    return (
      <section className="practice-card empty-state">
        <p>No questions are available for this region yet.</p>
        {onReturnToMap ? <button className="primary-button" type="button" onClick={onReturnToMap}>Return to P3 Astral Academy</button> : null}
      </section>
    );
  }

  return (
    <section className="practice-card">
      <header className="question-header">
        <div>
          <span className="mode-pill">{selectedRegion ? `${worldName} · ${selectedRegion.name}` : question.paperFamily.toUpperCase()}</span>
          <h2>{selectedRegion?.name ?? question.displayTopic}</h2>
          <p>{question.displaySubtopic ?? 'Mixed practice'} · {question.displayDifficulty ?? 'difficulty pending'} · {typeof maxMarks === 'number' ? `${maxMarks} marks` : 'marks unavailable'} · {question.paper ?? 'paper pending'} {question.questionNumber ? `Q${question.questionNumber}` : ''}</p>
        </div>
        <IssueReportButton onReport={(issueType, reportNote) => onIssue(question.id, issueType, reportNote)} />
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

      <ImageStack candidateGroups={question.questionImageCandidates} label="Question" />

      {!revealed ? (
        <button className="primary-button reveal-button" type="button" onClick={() => setRevealed(true)}>
          Reveal mark scheme
        </button>
      ) : (
        <div className="mark-scheme-panel">
          <h3>Mark scheme</h3>
          <ImageStack candidateGroups={question.markSchemeImageCandidates} label="Mark scheme" />
          <form
            className="attempt-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!progress.profile || !mistakeType) return;
              const score = parseAttemptScore(marksEarned, maxMarks);
              if (!score.isValid || typeof score.earned !== 'number') return;
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
                marksAvailable: maxMarks,
                scoreRatio: score.scoreRatio,
                mistakeType,
                note,
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
            <label>
              Marks earned {typeof maxMarks === 'number' ? `out of ${maxMarks}` : ''}
              <input type="number" min="0" max={maxMarks} step="1" value={marksEarned} onChange={(event) => setMarksEarned(event.target.value)} aria-invalid={Boolean(scoreValidation.error)} required />
              {scoreValidation.error ? <span className="form-error">{scoreValidation.error}</span> : null}
            </label>
            <label>
              Mistake type
              <select value={mistakeType} onChange={(event) => setMistakeType(event.target.value as MistakeType)} required>
                <option value="">Choose one</option>
                {mistakeTypes.map((type) => <option key={type} value={type}>{mistakeLabels[type]}</option>)}
              </select>
            </label>
            <label>
              Optional note
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
            </label>
            <button className="primary-button" type="submit" disabled={!canSubmit || attemptSaved}>
              Save attempt {scorePreview != null ? `(${scorePreview}%)` : ''}
            </button>
            {attemptSaved ? (
              <div className="post-attempt-panel">
                <strong>Attempt saved as practice evidence.</strong>
                <span>{scorePreview != null ? `${scorePreview}% recorded` : 'Marks recorded'} for {selectedRegion?.name ?? question.displayTopic}. Region progress is an estimate, not a final mastery judgment.</span>
                <div className="practice-actions">
                  {onContinuePractice ? <button type="button" onClick={onContinuePractice}><RotateCcw size={16} /> {selectedRegion ? 'Continue in this region' : 'Continue practice'}</button> : null}
                  {onReturnToMap ? <button type="button" onClick={onReturnToMap}><Map size={16} /> Return to P3 Astral Academy</button> : null}
                  {onReviewWeak ? <button type="button" onClick={onReviewWeak}><BookOpenCheck size={16} /> Review weak areas</button> : null}
                </div>
              </div>
            ) : null}
          </form>
        </div>
      )}
    </section>
  );
}
