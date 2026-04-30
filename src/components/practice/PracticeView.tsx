import { useEffect, useMemo, useState } from 'react';
import type { Attempt, IssueType, MistakeType, NormalizedQuestion, RegionDefinition, RegionRank, StoredProgress } from '../../types';
import { createId } from '../../lib/progressStore';
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
  const canSubmit = question && revealed && marksEarned !== '' && mistakeType;
  const scorePreview = useMemo(() => {
    const earned = Number(marksEarned);
    if (!Number.isFinite(earned) || !maxMarks) return undefined;
    return Math.round((earned / maxMarks) * 100);
  }, [marksEarned, maxMarks]);

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
          <p>{question.displaySubtopic ?? 'Mixed practice'} · {question.displayDifficulty ?? 'difficulty pending'} · {maxMarks ? `${maxMarks} marks` : 'marks unavailable'}</p>
        </div>
        <IssueReportButton onReport={(issueType, reportNote) => onIssue(question.id, issueType, reportNote)} />
      </header>

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
              const earned = Number(marksEarned);
              const ratio = maxMarks && maxMarks > 0 ? Math.max(0, Math.min(1, earned / maxMarks)) : undefined;
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
                marksEarned: earned,
                marksAvailable: maxMarks,
                scoreRatio: ratio,
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
              Marks earned {maxMarks ? `out of ${maxMarks}` : ''}
              <input type="number" min="0" max={maxMarks} step="1" value={marksEarned} onChange={(event) => setMarksEarned(event.target.value)} required />
            </label>
            <label>
              Mistake type
              <select value={mistakeType} onChange={(event) => setMistakeType(event.target.value as MistakeType)} required>
                <option value="">Choose one</option>
                {mistakeTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label>
              Optional note
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
            </label>
            <button className="primary-button" type="submit" disabled={!canSubmit || attemptSaved}>
              Save attempt and continue {scorePreview != null ? `(${scorePreview}%)` : ''}
            </button>
            {attemptSaved ? (
              <div className="post-attempt-panel">
                <strong>Attempt saved.</strong>
                <div className="practice-actions">
                  {onContinuePractice ? <button type="button" onClick={onContinuePractice}>{selectedRegion ? 'Continue in this region' : 'Continue practice'}</button> : null}
                  {onReturnToMap ? <button type="button" onClick={onReturnToMap}>Return to P3 Astral Academy</button> : null}
                  {onReviewWeak ? <button type="button" onClick={onReviewWeak}>Review weak areas</button> : null}
                </div>
              </div>
            ) : null}
          </form>
        </div>
      )}
    </section>
  );
}
