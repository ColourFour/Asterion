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
      eyebrow="Step 4"
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
      </details>
      <div className="training-intent-grid" aria-label="Training session choices">
        {trainingIntents.map((intent) => (
          <button
            key={intent}
            className={intent === summary.trainingSession.intent ? 'recommended-intent' : ''}
            type="button"
            disabled={!canTrain}
            onClick={() => onStartTraining(intent)}
          >
            {TRAINING_SESSION_LABELS[intent]}
          </button>
        ))}
      </div>
      {!canTrain ? (
        <div className="guardian-missing-list" role="status">
          <AlertTriangle size={18} />
          <span>No trainable question and mark-scheme image pairs are loaded for this region yet.</span>
        </div>
      ) : null}
    </RegionActionCard>
  );
}
