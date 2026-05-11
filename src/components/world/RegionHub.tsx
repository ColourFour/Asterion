import type { LearningActivityAttempt, NormalizedQuestion, RegionProgress, TrainingSessionIntent } from '../../types';
import type { RegionFieldGuide } from '../../data/regionFieldGuides';
import type { GeneratedPracticeItem } from '../../lib/generatedPractice';
import { getRegionTheme } from '../../lib/regionThemes';
import type { RegionLearningSummary } from '../../lib/regionLearning';
import type { TeachingSnippet } from '../../lib/teachingSnippets';
import { FieldGuidePanel } from './regionHub/FieldGuidePanel';
import { GuardianEligibilityPanel } from './regionHub/GuardianEligibilityPanel';
import { QuickChecksPanel } from './regionHub/QuickChecksPanel';
import { RegionArcTimeline } from './regionHub/RegionArcTimeline';
import { RegionHero } from './regionHub/RegionHero';
import { RegionLearningLayout } from './regionHub/RegionLearningLayout';
import { RegionNextActionPanel } from './regionHub/RegionNextActionPanel';
import { RegionProgressStrip } from './regionHub/RegionProgressStrip';
import { RegionRewardPreview } from './regionHub/RegionRewardPreview';
import { TrainingGroundsPanel } from './regionHub/TrainingGroundsPanel';
import { WarmUpPracticePanel } from './regionHub/WarmUpPracticePanel';

interface RegionHubProps {
  regionProgress: RegionProgress;
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  teachingSnippets: TeachingSnippet[];
  generatedPractice: GeneratedPracticeItem[];
  learningActivityAttempts?: LearningActivityAttempt[];
  profileId?: string;
  summary: RegionLearningSummary;
  onCompleteFieldGuide: () => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
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
  learningActivityAttempts = [],
  profileId,
  summary,
  onCompleteFieldGuide,
  onLearningActivityAttempt,
  onStartTraining,
  onChallengeGuardian,
  onReturnToMap,
}: RegionHubProps) {
  const { region } = regionProgress;
  const theme = getRegionTheme(region);
  const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
  const guardianQuestion = summary.guardianEligibility.guardianQuestion;
  const guardianCleared = summary.state === 'guardian_cleared' || summary.state === 'mastered';

  return (
    <RegionLearningLayout theme={theme} summary={summary}>
      <RegionHero
        regionProgress={regionProgress}
        theme={theme}
        stateLabel={stateLabels[summary.state] ?? summary.state}
        onReturnToMap={onReturnToMap}
      />

      <div className="region-summary-band" aria-label="Region summary">
        <RegionNextActionPanel regionProgress={regionProgress} summary={summary} />
        <RegionProgressStrip regionProgress={regionProgress} summary={summary} />
      </div>

      <RegionArcTimeline fieldGuideCompleted={fieldGuideCompleted} summary={summary} />

      <div className="region-learning-content">
        <div className="region-learning-main">
          <FieldGuidePanel
            fieldGuide={fieldGuide}
            fieldGuideCompleted={fieldGuideCompleted}
            theme={theme}
            teachingSnippets={teachingSnippets}
            onCompleteFieldGuide={onCompleteFieldGuide}
          />
          <QuickChecksPanel
            teachingSnippets={teachingSnippets}
            region={region}
            profileId={profileId}
            activityAttempts={learningActivityAttempts}
            onLearningActivityAttempt={onLearningActivityAttempt}
          />
          <WarmUpPracticePanel
            practiceItems={generatedPractice}
            region={region}
            profileId={profileId}
            activityAttempts={learningActivityAttempts}
            onLearningActivityAttempt={onLearningActivityAttempt}
          />
          <TrainingGroundsPanel
            canTrain={canTrain}
            summary={summary}
            onStartTraining={onStartTraining}
          />
          <GuardianEligibilityPanel
            guardianCleared={guardianCleared}
            guardianQuestion={guardianQuestion}
            regionName={theme.title}
            summary={summary}
            onChallengeGuardian={onChallengeGuardian}
          />
        </div>
        <aside className="region-learning-support" aria-label="Region mastery and rewards progress">
          <RegionRewardPreview guardianCleared={guardianCleared} regionName={theme.title} />
        </aside>
      </div>
    </RegionLearningLayout>
  );
}
