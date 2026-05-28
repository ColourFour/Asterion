import { AlertTriangle, BarChart3, Dumbbell, Mountain, Target } from 'lucide-react';
import type { TrainingSessionIntent } from '../../../types';
import { TRAINING_SESSION_LABELS, type RegionLearningSummary } from '../../../lib/regionLearning';
import { RegionActionCard } from './RegionActionCard';
import { trainingIntents } from './regionHubPanelUtils';

interface TrainingGroundsPanelProps {
  canTrain: boolean;
  lockedReason?: string;
  summary: RegionLearningSummary;
  onStartTraining: (intent: TrainingSessionIntent) => void;
}

export function TrainingGroundsPanel({ canTrain, lockedReason, summary, onStartTraining }: TrainingGroundsPanelProps) {
  const canStart = canTrain && !lockedReason;
  return (
    <RegionActionCard
      eyebrow="Step 3"
      title="Exam Training"
      description="Use real question images and mark schemes to build exam confidence."
      icon={<Dumbbell size={22} />}
      className="training-card"
    >
      <div className="recommended-session">
        <Target size={18} />
        <div>
          <span>Recommended session</span>
          <strong>{summary.trainingSession.label}</strong>
        </div>
      </div>
      <details className="training-reason-detail">
        <summary>Why this session?</summary>
        <p>{summary.trainingSession.reason}</p>
        <p>Saved attempts still update mastery and future recommendations.</p>
        {summary.learningActivityReadiness.attempts > 0 ? (
          <small>
            Skill Check support: {summary.learningActivityReadiness.attempts} item{summary.learningActivityReadiness.attempts === 1 ? '' : 's'} recorded.
          </small>
        ) : null}
      </details>

      <div className="training-mode-preview-grid" aria-label="Exam Training modes">
        <article className={summary.trainingSession.intent === 'core_practice' ? 'is-recommended next-step-glow' : undefined}>
          <Target size={20} aria-hidden="true" />
          <div>
            <strong>Core Practice</strong>
            <span>Balanced exam practice. Good when you want the next ordinary region question.</span>
          </div>
        </article>
        <article className={summary.trainingSession.intent === 'weak_area_review' ? 'is-recommended next-step-glow' : undefined}>
          <BarChart3 size={20} aria-hidden="true" />
          <div>
            <strong>Weak Area Review</strong>
            <span>Uses saved scores and mistake tags when they are available.</span>
          </div>
        </article>
        <article className={summary.trainingSession.intent === 'challenge' ? 'is-recommended next-step-glow' : undefined}>
          <Mountain size={20} aria-hidden="true" />
          <div>
            <strong>Stretch Problems</strong>
            <span>Challenge-style practice. The current selection is still exam-style, not a precise difficulty engine.</span>
          </div>
        </article>
      </div>

      <button
        className="training-primary-start next-step-glow"
        type="button"
        disabled={!canStart}
        onClick={() => onStartTraining(summary.trainingSession.intent)}
      >
        Start recommended session: {summary.trainingSession.label}
      </button>

      <details className="training-alternatives-detail">
        <summary>Choose a different session</summary>
        <div className="training-intent-grid" aria-label="Alternate training session choices">
          {trainingIntents.filter((intent) => intent !== summary.trainingSession.intent).map((intent) => (
            <button
              key={intent}
              type="button"
              disabled={!canStart}
              onClick={() => onStartTraining(intent)}
            >
              {TRAINING_SESSION_LABELS[intent]}
            </button>
          ))}
        </div>
      </details>

      {lockedReason ? (
        <div className="guardian-missing-list" role="status">
          <AlertTriangle size={18} />
          <span>{lockedReason}</span>
        </div>
      ) : !canTrain ? (
        <div className="guardian-missing-list" role="status">
          <AlertTriangle size={18} />
          <span>No trainable question and mark-scheme image pairs are loaded for this region yet.</span>
        </div>
      ) : null}
    </RegionActionCard>
  );
}
