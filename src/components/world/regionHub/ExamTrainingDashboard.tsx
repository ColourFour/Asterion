import { ArrowLeft, BarChart3, ChevronDown, FileText, Info, Target } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { AvatarGear, AvatarSettings, NormalizedQuestion, RegionDefinition, RegionProgress, StoredProgress } from '../../../types';
import type { RegionLearningPageId } from '../../../lib/regionRoutes';
import {
  buildExamTrainingTopicMastery,
  EXAM_TRAINING_TOPIC_MASTERY_CONTRACTS,
  EXAM_TRAINING_PRACTICE_LABELS,
  type ExamTrainingPracticeMode,
  type ExamTrainingTopicMasteryItem,
} from '../../../lib/examTrainingDashboard';
import { MathText } from '../../shared/MathText';

interface ExamTrainingDashboardProps {
  progress: StoredProgress;
  questions: NormalizedQuestion[];
  worldProgress: RegionProgress[];
  avatarName?: string;
  avatar?: AvatarSettings;
  avatarGear?: AvatarGear;
  selectedRegion?: RegionDefinition;
  practiceDisabledReason?: string;
  isStaffPreview?: boolean;
  onOpenRegions?: () => void;
  onReturnToMap: () => void;
  onNavigateRegionPage?: (page: RegionLearningPageId) => void;
  onStartPractice: (mode: ExamTrainingPracticeMode) => void;
}

const practiceCards: Array<{
  mode: ExamTrainingPracticeMode;
  explanation: string;
  icon: ReactNode;
}> = [
  {
    mode: 'core',
    explanation: 'Balanced exam-style practice. Start here when you want a steady next question.',
    icon: <Target size={28} />,
  },
  {
    mode: 'weak',
    explanation: 'Review based on saved mistakes and lower scores. If you have no saved attempt yet, start with Core Practice.',
    icon: <BarChart3 size={28} />,
  },
  {
    mode: 'stretch',
    explanation: 'More demanding exam-style practice once recent saved scores are strong.',
    icon: <FileText size={28} />,
  },
];

interface PracticeEvidenceRecommendation {
  recommendedMode: ExamTrainingPracticeMode;
  weakHint?: string;
  stretchHint?: string;
}

const progressLegend: Array<Pick<ExamTrainingTopicMasteryItem, 'status' | 'statusLabel'>> = [
  { status: 'strong', statusLabel: 'Strong' },
  { status: 'secure', statusLabel: 'Secure' },
  { status: 'developing', statusLabel: 'Developing' },
  { status: 'needs_work', statusLabel: 'Needs Work' },
  { status: 'not_tried', statusLabel: 'Not Tried' },
];

function scoreText(item: ExamTrainingTopicMasteryItem): string {
  return typeof item.scorePercent === 'number' ? `${item.scorePercent}%` : 'No signal';
}

const broadTopicOrder = [
  'Algebra',
  'Logarithms and Exponentials',
  'Trigonometry',
  'Complex Numbers',
  'Differentiation',
  'Integration',
  'Vectors',
  'Numerical Methods',
  'Differential Equations',
];

function broadTopicForSkill(skillId: string): string {
  const contract = EXAM_TRAINING_TOPIC_MASTERY_CONTRACTS.find((topic) => topic.skillId === skillId);
  if (contract) return contract.broadTopic;
  if (skillId.startsWith('logarithms_and_exponentials.')) return 'Logarithms and Exponentials';
  if (skillId.startsWith('complex_numbers.')) return 'Complex Numbers';
  if (skillId.startsWith('numerical_methods.')) return 'Numerical Methods';
  if (skillId.startsWith('differential_equations.')) return 'Differential Equations';
  if (skillId.startsWith('binomial_expansion.') || skillId.startsWith('quadratics.') || skillId.startsWith('algebra.')) return 'Algebra';
  if (skillId.startsWith('trigonometry.')) return 'Trigonometry';
  if (skillId.startsWith('differentiation.') || skillId.startsWith('parametric_equations.')) return 'Differentiation';
  if (skillId.startsWith('integration.')) return 'Integration';
  if (skillId.startsWith('vectors.')) return 'Vectors';
  return 'Algebra';
}

function practiceEvidenceRecommendation(input: {
  progress: StoredProgress;
  selectedRegionProgress?: RegionProgress;
}): PracticeEvidenceRecommendation {
  const attempts = input.selectedRegionProgress
    ? input.progress.attempts.filter((attempt) => attempt.validatedRegionId === input.selectedRegionProgress?.region.id || attempt.displayRegionId === input.selectedRegionProgress?.region.id)
    : input.progress.attempts.filter((attempt) => String(attempt.paperFamily).toLowerCase() === 'p3');
  const scoredAttempts = attempts.filter((attempt) => typeof attempt.scoreRatio === 'number');
  const scopedAttemptCount = attempts.length || input.selectedRegionProgress?.attempts || 0;
  const aggregateScore = input.selectedRegionProgress?.recentScoreRatio ?? input.selectedRegionProgress?.averageScoreRatio;
  const weakEvidenceReady = attempts.some((attempt) => (
    (typeof attempt.scoreRatio === 'number' && attempt.scoreRatio < 0.7)
    || (attempt.mistakeTypes?.some((type) => type !== 'no_issue') ?? Boolean(attempt.mistakeType && attempt.mistakeType !== 'no_issue'))
  )) || (scopedAttemptCount > 0 && typeof aggregateScore === 'number' && aggregateScore < 0.7);
  const stretchEvidenceReady = (scoredAttempts.length >= 2
    && scoredAttempts.slice(-3).every((attempt) => typeof attempt.scoreRatio === 'number' && attempt.scoreRatio >= 0.8))
    || (scopedAttemptCount >= 2 && typeof aggregateScore === 'number' && aggregateScore >= 0.8);
  const recommendedMode: ExamTrainingPracticeMode = weakEvidenceReady
    ? 'weak'
    : stretchEvidenceReady
      ? 'stretch'
      : 'core';

  return {
    recommendedMode,
    weakHint: weakEvidenceReady ? undefined : 'Save a scored attempt with missed marks before Weak Area Review can target a real weak spot.',
    stretchHint: stretchEvidenceReady ? undefined : 'Stretch Practice is recommended after a short run of strong saved scores.',
  };
}

function broadStatusFor(scorePercent: number | undefined, attempts: number): Pick<ExamTrainingTopicMasteryItem, 'status' | 'statusLabel'> {
  if (!attempts || typeof scorePercent !== 'number') return { status: 'not_tried', statusLabel: 'Not Tried' };
  if (scorePercent >= 80) return { status: 'strong', statusLabel: 'Strong' };
  if (scorePercent >= 65) return { status: 'secure', statusLabel: 'Secure' };
  if (scorePercent >= 45) return { status: 'developing', statusLabel: 'Developing' };
  return { status: 'needs_work', statusLabel: 'Needs Work' };
}

function groupedTopicProgress(topics: ExamTrainingTopicMasteryItem[]) {
  const grouped = broadTopicOrder.map((name) => {
    const subtopics = topics.filter((topic) => broadTopicForSkill(topic.skillId) === name);
    const attempts = subtopics.reduce((sum, topic) => sum + topic.attempts, 0);
    const scored = subtopics.filter((topic) => typeof topic.scorePercent === 'number' && topic.attempts > 0);
    const weightedScore = scored.length
      ? Math.round(scored.reduce((sum, topic) => sum + (topic.scorePercent ?? 0) * Math.max(1, topic.attempts), 0)
        / scored.reduce((sum, topic) => sum + Math.max(1, topic.attempts), 0))
      : undefined;
    return {
      name,
      attempts,
      scorePercent: weightedScore,
      subtopics,
      ...broadStatusFor(weightedScore, attempts),
    };
  });
  const knownNames = new Set(broadTopicOrder);
  const extras = topics.filter((topic) => !knownNames.has(broadTopicForSkill(topic.skillId)));
  return extras.length ? [...grouped, {
    name: 'Other',
    attempts: extras.reduce((sum, topic) => sum + topic.attempts, 0),
    scorePercent: undefined,
    subtopics: extras,
    ...broadStatusFor(undefined, 0),
  }] : grouped;
}

function PracticeChoiceCards({
  disabledReason,
  recommendation,
  onStartPractice,
}: {
  disabledReason?: string;
  recommendation: PracticeEvidenceRecommendation;
  onStartPractice: (mode: ExamTrainingPracticeMode) => void;
}) {
  const [openInfoMode, setOpenInfoMode] = useState<ExamTrainingPracticeMode | undefined>();
  return (
    <section className="exam-training-practice-panel" aria-labelledby="exam-training-practice-title">
      <div className="exam-training-section-heading">
        <span className="mode-pill">Start practice</span>
        <div>
          <h3 id="exam-training-practice-title">Choose an exam practice mode</h3>
          <p>Every saved attempt updates your local topic progress.</p>
        </div>
      </div>
      <div className="exam-training-practice-cards">
        {practiceCards.map((card) => {
          const label = EXAM_TRAINING_PRACTICE_LABELS[card.mode];
          const isInfoOpen = openInfoMode === card.mode;
          const definitionId = `exam-training-practice-${card.mode}-definition`;
          const tooltipId = `exam-training-practice-${card.mode}-tooltip`;
          const readinessNote = card.mode === 'weak'
            ? recommendation.weakHint
            : card.mode === 'stretch'
              ? recommendation.stretchHint
              : undefined;
          return (
            <article
              className={`exam-training-practice-choice practice-${card.mode}${readinessNote ? ' needs-more-evidence' : ''}${card.mode === recommendation.recommendedMode && !disabledReason ? ' next-step-glow' : ''}${disabledReason ? ' is-disabled' : ''}`}
              data-info-open={isInfoOpen ? 'true' : undefined}
              key={card.mode}
            >
              <button
                type="button"
                className="exam-training-practice-card"
                aria-describedby={definitionId}
                disabled={Boolean(disabledReason)}
                onClick={() => onStartPractice(card.mode)}
              >
                <span className="exam-training-practice-icon" aria-hidden="true">{card.icon}</span>
                <span className="exam-training-practice-title">
                  <strong>{label}</strong>
                </span>
              </button>
              <button
                type="button"
                className="exam-training-practice-info-button"
                aria-label={`${isInfoOpen ? 'Hide' : 'Show'} ${label} definition`}
                aria-describedby={definitionId}
                aria-expanded={isInfoOpen}
                aria-controls={tooltipId}
                onClick={() => setOpenInfoMode((current) => (current === card.mode ? undefined : card.mode))}
              >
                <Info size={16} aria-hidden="true" />
              </button>
              <span id={definitionId} className="sr-only">
                {card.explanation}
                {readinessNote ? ` ${readinessNote}` : ''}
              </span>
              <div className="exam-training-practice-tooltip" id={tooltipId} role="tooltip">
                <span>{card.explanation}</span>
                {readinessNote ? <em>{readinessNote}</em> : null}
              </div>
            </article>
          );
        })}
      </div>
      {disabledReason ? (
        <div className="exam-training-safe-note" role="status">
          <Info size={18} aria-hidden="true" />
          <span>{disabledReason}</span>
        </div>
      ) : (
        <div className="exam-training-safe-note">
          <Info size={18} aria-hidden="true" />
          <span>Saved marks and mistake tags determine future review suggestions. The app does not auto-mark exam work.</span>
        </div>
      )}
    </section>
  );
}

function TopicProgressPanel({ topics }: { topics: ExamTrainingTopicMasteryItem[] }) {
  const attemptedCount = topics.filter((item) => item.attempts > 0).length;
  const broadTopics = groupedTopicProgress(topics);
  return (
    <section className="exam-training-mastery-panel" aria-labelledby="exam-training-mastery-title">
      <div className="exam-training-section-heading mastery-heading">
        <div>
          <h3 id="exam-training-mastery-title">Topic Progress</h3>
          <p>Progress reflects saved exam practice. Empty topics need a first attempt.</p>
        </div>
        <span className="exam-training-evidence-chip">{attemptedCount} topic{attemptedCount === 1 ? '' : 's'} tried</span>
      </div>
      <div className="exam-training-mastery-legend" aria-label="Topic progress status legend">
        {progressLegend.map((item) => (
          <span key={item.status} className={`mastery-legend-item mastery-${item.status}`}>
            <i aria-hidden="true" />
            {item.statusLabel}
          </span>
        ))}
      </div>
      <div className="exam-training-broad-topic-list">
        {broadTopics.map((topic) => (
          <details className={`exam-training-broad-topic mastery-${topic.status}`} key={topic.name}>
            <summary>
              <span className="mastery-status-dot" aria-hidden="true" />
              <span className="exam-training-topic-copy">
                <strong><MathText text={topic.name} /></strong>
                <small>{topic.attempts ? `${topic.attempts} saved attempt${topic.attempts === 1 ? '' : 's'}` : 'Not tried yet'}</small>
              </span>
              <span className="mastery-status-pill">{topic.statusLabel}</span>
              <span className="mastery-score">{typeof topic.scorePercent === 'number' ? `${topic.scorePercent}%` : 'No signal'}</span>
              <ChevronDown size={18} aria-hidden="true" />
              <span className="mastery-bar" aria-hidden="true">
                <span style={{ width: `${topic.scorePercent ?? 0}%` }} />
              </span>
            </summary>
            <div className="exam-training-topic-list">
              {topic.subtopics.map((subtopic) => (
                <article className={`exam-training-topic-row mastery-${subtopic.status}`} key={subtopic.skillId}>
                  <span className="mastery-status-dot" aria-hidden="true" />
                  <div className="exam-training-topic-copy">
                    <strong><MathText text={subtopic.name} /></strong>
                    <small>{subtopic.evidenceLabel}</small>
                  </div>
                  <span className="mastery-status-pill">{subtopic.statusLabel}</span>
                  <div className="mastery-bar" aria-hidden="true">
                    <span style={{ width: `${subtopic.scorePercent ?? 0}%` }} />
                  </div>
                  <span className="mastery-score">{scoreText(subtopic)}</span>
                </article>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ExamTrainingDashboard({
  progress,
  questions,
  worldProgress,
  selectedRegion,
  practiceDisabledReason,
  onReturnToMap,
  onStartPractice,
}: ExamTrainingDashboardProps) {
  const topicProgress = buildExamTrainingTopicMastery({ progress, questions });
  const selectedRegionProgress = selectedRegion
    ? worldProgress.find((item) => item.region.id === selectedRegion.id)
    : undefined;
  const recommendation = practiceEvidenceRecommendation({ progress, selectedRegionProgress });
  return (
    <section className="exam-training-dashboard" aria-labelledby="exam-training-dashboard-title">
      <header className="exam-training-dashboard-header study-exam-training-header">
        <div className="exam-training-crest" aria-hidden="true">
          <FileText size={30} />
        </div>
        <div className="exam-training-title-copy">
          <span className="mode-pill">CAIE 9709 · Paper 3</span>
          <h2 id="exam-training-dashboard-title">Exam Training</h2>
          <p>Exam-style question practice with local self-marked progress.</p>
          {selectedRegion ? <small>Focused on {selectedRegion.name}.</small> : <small>Choose a practice mode, then self-mark from the official mark scheme.</small>}
        </div>
        <button className="exam-training-back-button" type="button" onClick={onReturnToMap}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to topics
        </button>
      </header>

      <div className="exam-training-dashboard-grid study-exam-training-grid">
        <PracticeChoiceCards disabledReason={practiceDisabledReason} recommendation={recommendation} onStartPractice={onStartPractice} />
        <TopicProgressPanel topics={topicProgress} />
      </div>
    </section>
  );
}
