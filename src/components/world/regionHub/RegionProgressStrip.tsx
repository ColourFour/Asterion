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

  const stats = [
    { label: 'Rank', value: regionProgress.rank },
    { label: 'Attempts', value: String(regionProgress.attempts) },
    { label: 'Average', value: percent(regionProgress.averageScoreRatio) },
    { label: 'Subtopics', value: `${regionProgress.subtopicsTouched}/${regionProgress.region.subtopics.length}` },
    { label: 'Guardian', value: guardianLabel },
  ];

  return (
    <section className="region-progress-strip" aria-label="Mastery progress summary">
      {stats.map((stat) => (
        <div key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      ))}
    </section>
  );
}
