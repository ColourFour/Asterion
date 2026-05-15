import type { RegionProgress } from '../../../types';
import type { RegionLearningSummary } from '../../../lib/regionLearning';
import { percent } from './regionHubPanelUtils';

interface RegionProgressStripProps {
  regionProgress: RegionProgress;
  summary: RegionLearningSummary;
}

export function RegionProgressStrip({ regionProgress, summary }: RegionProgressStripProps) {
  const guardianCleared = summary.state === 'guardian_cleared' || summary.state === 'mastered';
  const guardianLabel = guardianCleared
    ? 'Cleared'
    : summary.guardianEligibility.eligible ? 'Ready' : 'Locked';
  const currentStep = summary.nextAction.kind === 'complete' ? 'Region restored' : summary.nextAction.label;
  const evidenceLabel = regionProgress.attempts
    ? `${regionProgress.attempts} attempt${regionProgress.attempts === 1 ? '' : 's'} · ${percent(regionProgress.averageScoreRatio)} avg`
    : `${regionProgress.subtopicsTouched}/${regionProgress.region.subtopics.length} subtopics touched`;

  return (
    <section className="region-progress-strip" aria-label="Mastery progress summary">
      <div className="region-progress-step">
        <span>Current step</span>
        <strong>{currentStep}</strong>
      </div>
      <div className="region-progress-step">
        <span>Evidence now</span>
        <strong>{evidenceLabel}</strong>
      </div>
      <div className="region-progress-step">
        <span>Guardian</span>
        <strong>{guardianLabel}</strong>
      </div>
    </section>
  );
}
