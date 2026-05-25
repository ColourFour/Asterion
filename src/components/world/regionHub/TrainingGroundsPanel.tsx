import { AlertTriangle, Dumbbell, Target } from 'lucide-react';
import type { TrainingSessionIntent } from '../../../types';
import { TRAINING_SESSION_LABELS, type RegionLearningSummary } from '../../../lib/regionLearning';
import { RegionActionCard } from './RegionActionCard';
import { trainingIntents } from './regionHubPanelUtils';

interface TrainingGroundsPanelProps {
  canTrain: boolean;
  summary: RegionLearningSummary;
  onStartTraining: (intent: TrainingSessionIntent) => void;
}

export function TrainingGroundsPanel({ canTrain, summary, onStartTraining }: TrainingGroundsPanelProps) {
  return (
    <RegionActionCard
      eyebrow="Step 3"
      title="Exam Training"
      description="Use real question images and mark schemes to build Guardian evidence."
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
        <p>This practice supports the current region when clean route evidence links the question to it. A saved attempt may help Guardian readiness when it meets the evidence rules.</p>
        {summary.learningActivityReadiness.attempts > 0 ? (
          <small>
            Support practice: {summary.learningActivityReadiness.quickCheckAttempts} short check{summary.learningActivityReadiness.quickCheckAttempts === 1 ? '' : 's'}
            {' '}and {summary.learningActivityReadiness.warmUpAttempts} guided step{summary.learningActivityReadiness.warmUpAttempts === 1 ? '' : 's'} recorded.
          </small>
        ) : null}
      </details>

      <button
        className="training-primary-start"
        type="button"
        disabled={!canTrain}
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
              disabled={!canTrain}
              onClick={() => onStartTraining(intent)}
            >
              {TRAINING_SESSION_LABELS[intent]}
            </button>
          ))}
        </div>
      </details>

      {!canTrain ? (
        <div className="guardian-missing-list" role="status">
          <AlertTriangle size={18} />
          <span>No trainable question and mark-scheme image pairs are loaded for this region yet.</span>
        </div>
      ) : null}
    </RegionActionCard>
  );
}
