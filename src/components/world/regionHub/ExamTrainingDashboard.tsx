import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Dumbbell,
  Gem,
  GraduationCap,
  Info,
  Map,
  Medal,
  Mountain,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { AvatarGear, AvatarSettings, NormalizedQuestion, RegionDefinition, RegionProgress, StoredProgress } from '../../../types';
import type { RegionLearningPageId } from '../../../lib/regionRoutes';
import { REGION_LEARNING_PAGE_LABELS } from '../../../lib/regionRoutes';
import {
  buildExamTrainingRewardGoals,
  buildExamTrainingTopicMastery,
  EXAM_TRAINING_PRACTICE_LABELS,
  type ExamTrainingPracticeMode,
  type ExamTrainingRewardGoal,
  type ExamTrainingTopicMasteryItem,
} from '../../../lib/examTrainingDashboard';
import { AvatarRenderer } from '../../avatar/AvatarRenderer';

interface ExamTrainingDashboardProps {
  progress: StoredProgress;
  questions: NormalizedQuestion[];
  worldProgress: RegionProgress[];
  avatarName: string;
  avatar: AvatarSettings;
  avatarGear: AvatarGear;
  selectedRegion?: RegionDefinition;
  practiceDisabledReason?: string;
  isStaffPreview?: boolean;
  onOpenRegions: () => void;
  onReturnToMap: () => void;
  onNavigateRegionPage?: (page: RegionLearningPageId) => void;
  onStartPractice: (mode: ExamTrainingPracticeMode) => void;
}

const routeCards: Array<{
  page: RegionLearningPageId;
  description: string;
  icon: ReactNode;
}> = [
  { page: 'hub', description: 'Choose your region', icon: <Map size={22} /> },
  { page: 'field-guide', description: 'Learn the ideas', icon: <BookOpenCheck size={22} /> },
  { page: 'skill-practice', description: 'Small checks', icon: <Target size={22} /> },
  { page: 'exam-training', description: 'Exam-style practice', icon: <ShieldCheck size={22} /> },
  { page: 'guardian', description: 'Prove readiness', icon: <GraduationCap size={22} /> },
];

const practiceCards: Array<{
  mode: ExamTrainingPracticeMode;
  explanation: string;
  icon: ReactNode;
}> = [
  {
    mode: 'core',
    explanation: 'Balanced exam-style practice across your topics.',
    icon: <Target size={30} />,
  },
  {
    mode: 'weak',
    explanation: 'Extra practice where you need it most.',
    icon: <BarChart3 size={30} />,
  },
  {
    mode: 'stretch',
    explanation: 'Harder exam-style items to extend you.',
    icon: <Mountain size={30} />,
  },
];

const masteryLegend: Array<Pick<ExamTrainingTopicMasteryItem, 'status' | 'statusLabel'>> = [
  { status: 'strong', statusLabel: 'Strong' },
  { status: 'secure', statusLabel: 'Secure' },
  { status: 'developing', statusLabel: 'Developing' },
  { status: 'needs_work', statusLabel: 'Needs Work' },
  { status: 'not_tried', statusLabel: 'Not Tried' },
];

function percent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function scoreText(item: ExamTrainingTopicMasteryItem): string {
  return typeof item.scorePercent === 'number' ? `${item.scorePercent}%` : 'No signal';
}

function goalIcon(goal: ExamTrainingRewardGoal) {
  if (goal.id === 'smurf-hat') return <Sparkles size={22} />;
  if (goal.id === 'golden-notes') return <Medal size={22} />;
  return <Gem size={22} />;
}

function RouteStrip({
  selectedRegion,
  onOpenRegions,
  onNavigateRegionPage,
}: Pick<ExamTrainingDashboardProps, 'selectedRegion' | 'onOpenRegions' | 'onNavigateRegionPage'>) {
  return (
    <nav className="exam-training-route-strip" aria-label="Learning loop">
      {routeCards.map((route) => {
        const active = route.page === 'exam-training';
        const disabled = route.page !== 'exam-training' && route.page !== 'hub' && !selectedRegion;
        const label = route.page === 'hub' && !selectedRegion ? 'Region Hub' : REGION_LEARNING_PAGE_LABELS[route.page];
        const description = disabled ? 'Choose a region first' : route.description;
        return (
          <button
            type="button"
            key={route.page}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
            disabled={disabled}
            onClick={() => {
              if (route.page === 'hub' && !selectedRegion) {
                onOpenRegions();
                return;
              }
              onNavigateRegionPage?.(route.page);
            }}
          >
            <span className="exam-training-route-icon" aria-hidden="true">{route.icon}</span>
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function PracticeChoiceCards({
  disabledReason,
  onStartPractice,
}: {
  disabledReason?: string;
  onStartPractice: (mode: ExamTrainingPracticeMode) => void;
}) {
  return (
    <section className="exam-training-practice-panel" aria-labelledby="exam-training-practice-title">
      <div className="exam-training-section-heading">
        <span className="mode-pill">Start your practice</span>
        <div>
          <h3 id="exam-training-practice-title">Choose today&apos;s exam practice</h3>
          <p>Every attempt builds your readiness. Choose the kind of work that fits today.</p>
        </div>
      </div>
      <div className="exam-training-practice-cards">
        {practiceCards.map((card) => (
          <button
            type="button"
            className={`exam-training-practice-card practice-${card.mode}`}
            key={card.mode}
            disabled={Boolean(disabledReason)}
            onClick={() => onStartPractice(card.mode)}
          >
            <span className="exam-training-practice-icon" aria-hidden="true">{card.icon}</span>
            <span>
              <strong>{EXAM_TRAINING_PRACTICE_LABELS[card.mode]}</strong>
              <small>{card.explanation}</small>
            </span>
          </button>
        ))}
      </div>
      {disabledReason ? (
        <div className="exam-training-safe-note" role="status">
          <Info size={18} aria-hidden="true" />
          <span>{disabledReason}</span>
        </div>
      ) : (
        <div className="exam-training-safe-note">
          <Info size={18} aria-hidden="true" />
          <span>Pick the kind of practice you need today. Your saved marks help shape what comes next.</span>
        </div>
      )}
    </section>
  );
}

function TopicMasteryPanel({ topics }: { topics: ExamTrainingTopicMasteryItem[] }) {
  const attemptedCount = topics.filter((item) => item.attempts > 0).length;
  return (
    <section className="exam-training-mastery-panel" aria-labelledby="exam-training-mastery-title">
      <div className="exam-training-section-heading mastery-heading">
        <div>
          <h3 id="exam-training-mastery-title">Your Topic Mastery</h3>
          <p>Mastery reflects clean exam-practice evidence. Empty topics need more attempts first.</p>
        </div>
        <span className="exam-training-evidence-chip">{attemptedCount} topic signal{attemptedCount === 1 ? '' : 's'}</span>
      </div>
      <div className="exam-training-mastery-legend" aria-label="Mastery status legend">
        {masteryLegend.map((item) => (
          <span key={item.status} className={`mastery-legend-item mastery-${item.status}`}>
            <i aria-hidden="true" />
            {item.statusLabel}
          </span>
        ))}
      </div>
      <div className="exam-training-topic-list">
        {topics.map((topic) => (
          <article className={`exam-training-topic-row mastery-${topic.status}`} key={topic.skillId}>
            <span className="mastery-status-dot" aria-hidden="true" />
            <div className="exam-training-topic-copy">
              <strong>{topic.name}</strong>
              <small>{topic.evidenceLabel}</small>
            </div>
            <span className="mastery-status-pill">{topic.statusLabel}</span>
            <div className="mastery-bar" aria-hidden="true">
              <span style={{ width: `${topic.scorePercent ?? 0}%` }} />
            </div>
            <span className="mastery-score">{scoreText(topic)}</span>
          </article>
        ))}
      </div>
      <div className="exam-training-panel-footer">
        <Star size={18} aria-hidden="true" />
        <span>Keep going. Green topics are strong; orange and red topics are good targets for review.</span>
      </div>
    </section>
  );
}

function AvatarRewardsPanel({
  avatarName,
  avatar,
  avatarGear,
  goals,
  worldProgress,
}: {
  avatarName: string;
  avatar: AvatarSettings;
  avatarGear: AvatarGear;
  goals: ExamTrainingRewardGoal[];
  worldProgress: RegionProgress[];
}) {
  return (
    <>
      <section className="exam-training-side-card avatar-goal-card" aria-labelledby="exam-training-avatar-title">
        <div className="exam-training-section-heading compact">
          <div>
            <h3 id="exam-training-avatar-title">Your Avatar</h3>
            <p>Progress comes from saved academic work.</p>
          </div>
        </div>
        <div className="exam-training-avatar-row">
          <div className="exam-training-avatar-frame">
            <AvatarRenderer
              avatarName={avatarName}
              avatar={avatar}
              regionProgress={worldProgress}
              mode="portrait"
            />
          </div>
          <div className="exam-training-avatar-copy">
            <strong>{avatarName}</strong>
            <span>{avatarGear.title}</span>
            {avatarGear.nextUnlock ? <small>Next unlock: {avatarGear.nextUnlock}</small> : <small>Build evidence to unlock more gear.</small>}
          </div>
        </div>
      </section>
      <section className="exam-training-side-card reward-goals-card" aria-labelledby="exam-training-goals-title">
        <div className="exam-training-section-heading compact">
          <div>
            <h3 id="exam-training-goals-title">Goals & Rewards</h3>
            <p>Motivation goals only. These do not change your outfit yet.</p>
          </div>
        </div>
        <div className="exam-training-goal-list">
          {goals.map((goal) => (
            <article className="exam-training-goal" key={goal.id}>
              <span className="exam-training-goal-icon" aria-hidden="true">{goalIcon(goal)}</span>
              <div>
                <strong>{goal.title}</strong>
                <small>{goal.description}</small>
                <div className="reward-progress-line">
                  <span style={{ width: `${percent(goal.current, goal.target)}%` }} />
                </div>
              </div>
              <b>{Math.min(goal.current, goal.target)} / {goal.target}</b>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ClassCompetitionPanel({
  progress,
  isStaffPreview,
}: {
  progress: StoredProgress;
  isStaffPreview?: boolean;
}) {
  const p3Attempts = progress.attempts.filter((attempt) => String(attempt.paperFamily).toLowerCase() === 'p3').length;
  return (
    <section className="exam-training-side-card class-competition-card" aria-labelledby="exam-training-class-title">
      <div className="exam-training-section-heading compact">
        <div>
          <h3 id="exam-training-class-title">Class Competition</h3>
          <p>This week</p>
        </div>
        <Trophy size={22} aria-hidden="true" />
      </div>
      <div className="class-competition-empty">
        <UsersRound size={26} aria-hidden="true" />
        <strong>You&apos;re building consistency.</strong>
        <span>Class comparison will appear after more classmates complete Exam Training.</span>
        {p3Attempts > 0 ? <small>Your saved Exam Training items: {p3Attempts}</small> : <small>Save your first item to start your weekly signal.</small>}
        {isStaffPreview ? <em>Staff preview only: no sample classmates are shown as real students.</em> : null}
      </div>
    </section>
  );
}

export function ExamTrainingDashboard({
  progress,
  questions,
  worldProgress,
  avatarName,
  avatar,
  avatarGear,
  selectedRegion,
  practiceDisabledReason,
  isStaffPreview,
  onOpenRegions,
  onReturnToMap,
  onNavigateRegionPage,
  onStartPractice,
}: ExamTrainingDashboardProps) {
  const topicMastery = buildExamTrainingTopicMastery({ progress, questions });
  const goals = buildExamTrainingRewardGoals({ progress, topicMastery, worldProgress });
  return (
    <section className="exam-training-dashboard" aria-labelledby="exam-training-dashboard-title">
      <header className="exam-training-dashboard-header">
        <div className="exam-training-crest" aria-hidden="true">
          <ShieldCheck size={30} />
        </div>
        <div className="exam-training-title-copy">
          <span className="mode-pill">Paper 3 practice</span>
          <h2 id="exam-training-dashboard-title">Exam Training</h2>
          <p>Real exam practice. Real progress.</p>
          {selectedRegion ? <small>Focused on {selectedRegion.name}.</small> : <small>Choose a practice route, then self-mark from the official mark scheme.</small>}
        </div>
        <button className="exam-training-back-button" type="button" onClick={onReturnToMap}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to map
        </button>
      </header>

      <RouteStrip
        selectedRegion={selectedRegion}
        onOpenRegions={onOpenRegions}
        onNavigateRegionPage={onNavigateRegionPage}
      />

      <div className="exam-training-dashboard-grid">
        <PracticeChoiceCards disabledReason={practiceDisabledReason} onStartPractice={onStartPractice} />
        <TopicMasteryPanel topics={topicMastery} />
        <aside className="exam-training-side-rail" aria-label="Avatar goals and class motivation">
          <AvatarRewardsPanel
            avatarName={avatarName}
            avatar={avatar}
            avatarGear={avatarGear}
            goals={goals}
            worldProgress={worldProgress}
          />
          <ClassCompetitionPanel progress={progress} isStaffPreview={isStaffPreview} />
        </aside>
      </div>
    </section>
  );
}
