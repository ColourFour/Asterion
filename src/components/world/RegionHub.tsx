import type { NormalizedQuestion, RegionProgress, TrainingSessionIntent } from '../../types';
import type { RegionFieldGuide } from '../../data/regionFieldGuides';
import type { GeneratedPracticeItem } from '../../lib/generatedPractice';
import type { RegionLearningSummary } from '../../lib/regionLearning';
import type { TeachingSnippet } from '../../lib/teachingSnippets';
import { FieldGuidePanel } from './regionHub/FieldGuidePanel';
import { GuardianEligibilityPanel } from './regionHub/GuardianEligibilityPanel';
import { RegionArcTimeline } from './regionHub/RegionArcTimeline';
import { RegionNextActionPanel } from './regionHub/RegionNextActionPanel';
import { RegionRewardPreview } from './regionHub/RegionRewardPreview';
import { TrainingGroundsPanel } from './regionHub/TrainingGroundsPanel';

interface RegionHubProps {
  regionProgress: RegionProgress;
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  teachingSnippets: TeachingSnippet[];
  generatedPractice: GeneratedPracticeItem[];
  summary: RegionLearningSummary;
  onCompleteFieldGuide: () => void;
  onStartTraining: (intent: TrainingSessionIntent) => void;
  onChallengeGuardian: (question: NormalizedQuestion) => void;
  onReturnToMap: () => void;
}

const stateLabels: Record<string, string> = {
  locked: 'Locked',
  available: 'Field Guide ready',
  field_guide_started: 'Field Guide started',
  field_guide_completed: 'Field Guide complete',
  training_in_progress: 'Training in progress',
  guardian_unlocked: 'Guardian unlocked',
  guardian_attempted: 'Guardian attempted',
  guardian_cleared: 'Guardian cleared',
  mastered: 'Mastered',
  needs_review: 'Needs review',
};

export function RegionHub({
  regionProgress,
  fieldGuide,
  fieldGuideCompleted,
  teachingSnippets,
  generatedPractice,
  summary,
  onCompleteFieldGuide,
  onStartTraining,
  onChallengeGuardian,
  onReturnToMap,
}: RegionHubProps) {
  const { region } = regionProgress;
  const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
  const guardianQuestion = summary.guardianEligibility.guardianQuestion;
  const guardianCleared = summary.state === 'guardian_cleared' || summary.state === 'mastered';

  return (
    <section className={`region-hub region-${region.id} learning-${summary.visualTreatment}`} aria-labelledby="region-hub-title">
      <header className="section-page-header region-hub-header">
        <div>
          <span className="mode-pill">{region.id === 'logarithm-grove' ? 'Pilot region arc' : 'Region Learning Loop'}</span>
          <h2 id="region-hub-title">{region.name}</h2>
          <p>{region.description}</p>
          <strong className="region-state-chip">{stateLabels[summary.state] ?? summary.state}</strong>
        </div>
        <button type="button" onClick={onReturnToMap}>Return to map</button>
      </header>

      <RegionArcTimeline fieldGuideCompleted={fieldGuideCompleted} summary={summary} />
      <RegionNextActionPanel regionProgress={regionProgress} summary={summary} />

      <div className="region-hub-grid">
        <FieldGuidePanel
          fieldGuide={fieldGuide}
          fieldGuideCompleted={fieldGuideCompleted}
          teachingSnippets={teachingSnippets}
          generatedPractice={generatedPractice}
          onCompleteFieldGuide={onCompleteFieldGuide}
        />
        <TrainingGroundsPanel
          canTrain={canTrain}
          summary={summary}
          onStartTraining={onStartTraining}
        />
        <GuardianEligibilityPanel
          guardianCleared={guardianCleared}
          guardianQuestion={guardianQuestion}
          regionName={region.name}
          summary={summary}
          onChallengeGuardian={onChallengeGuardian}
        />
        <RegionRewardPreview guardianCleared={guardianCleared} regionName={region.name} />
      </div>
    </section>
  );
}
