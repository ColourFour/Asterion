import type { RegionProgress } from '../../../types';
import type { RegionLearningSummary } from '../../../lib/regionLearning';
import { percent } from './regionHubPanelUtils';

interface RegionNextActionPanelProps {
  regionProgress: RegionProgress;
  summary: RegionLearningSummary;
}

export function RegionNextActionPanel({ regionProgress, summary }: RegionNextActionPanelProps) {
  return (
    <section className={`region-next-action next-${summary.nextAction.kind}`} aria-label="Recommended next step">
      <div className="next-action-copy">
        <span>Recommended next step</span>
        <h3>{summary.nextAction.label}</h3>
        <p>{summary.nextAction.explanation}</p>
      </div>
      <div className="next-action-evidence">
        <span>Local evidence</span>
        <strong>{regionProgress.attempts} attempts · {percent(regionProgress.averageScoreRatio)} average</strong>
        <small>{regionProgress.subtopicsTouched}/{regionProgress.region.subtopics.length} listed subtopics touched</small>
      </div>
    </section>
  );
}
