import { AlertTriangle, Dumbbell, Target } from 'lucide-react';
import type { TrainingSessionIntent } from '../../../types';
import { TRAINING_SESSION_LABELS, type RegionLearningSummary } from '../../../lib/regionLearning';
import { trainingIntents } from './regionHubPanelUtils';

interface TrainingGroundsPanelProps {
  canTrain: boolean;
  summary: RegionLearningSummary;
  onStartTraining: (intent: TrainingSessionIntent) => void;
}

export function TrainingGroundsPanel({ canTrain, summary, onStartTraining }: TrainingGroundsPanelProps) {
  return (
    <article className="region-loop-card training-card">
      <div className="region-loop-card-title">
        <Dumbbell size={22} />
        <div>
          <span>Phase 2</span>
          <h3>Training Grounds</h3>
        </div>
      </div>
      <p>{summary.trainingSession.reason}</p>
      <div className="recommended-session">
        <Target size={18} />
        <div>
          <span>Recommended session</span>
          <strong>{summary.trainingSession.label}</strong>
        </div>
      </div>
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
    </article>
  );
}
