import { CheckCircle2, Lock } from 'lucide-react';
import type { RegionLearningSummary } from '../../../lib/regionLearning';
import { phaseStatus } from './regionHubPanelUtils';

interface RegionArcTimelineProps {
  fieldGuideCompleted: boolean;
  summary: RegionLearningSummary;
}

export function RegionArcTimeline({ fieldGuideCompleted, summary }: RegionArcTimelineProps) {
  const phases = [
    { id: 'guide' as const, label: 'Field Guide', detail: 'Know the moves' },
    { id: 'training' as const, label: 'Training Grounds', detail: 'Save evidence' },
    { id: 'guardian' as const, label: 'Region Guardian', detail: 'Clear the check' },
  ];

  return (
    <ol className="region-arc-timeline" aria-label="Region learning phases">
      {phases.map((phase, index) => {
        const status = phaseStatus(summary, fieldGuideCompleted, phase.id);
        return (
          <li className={`arc-phase arc-${status}`} key={phase.id}>
            <span className="arc-phase-index">{status === 'complete' ? <CheckCircle2 size={18} /> : status === 'locked' ? <Lock size={16} /> : index + 1}</span>
            <div>
              <strong>{phase.label}</strong>
              <span>{phase.detail}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
