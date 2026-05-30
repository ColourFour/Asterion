import { useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, FileText, ListChecks } from 'lucide-react';
import type { FieldGuideTopic } from '../../data/fieldGuideTopics';
import type { RegionFieldGuide } from '../../data/regionFieldGuides';
import type { GeneratedPracticeItem } from '../../lib/generatedPractice';
import type { RegionLearningSummary } from '../../lib/regionLearning';
import { getRegionTheme } from '../../lib/regionThemes';
import type { TeachingSnippet } from '../../lib/teachingSnippets';
import { displayRegionForTopic, topicProgressSummary, type StudyTopic, type TopicStudyPage } from '../../lib/topicStudy';
import type { LearningActivityAttempt, RegionDefinition, RegionProgress, StoredProgress } from '../../types';
import { MathText } from '../shared/MathText';
import { FieldGuidePanel } from '../world/regionHub/FieldGuidePanel';
import { SkillPracticePanel } from '../world/regionHub/SkillPracticePanel';

interface TopicHubProps {
  topic: StudyTopic;
  region: RegionDefinition;
  regionProgress: RegionProgress;
  fieldGuide: RegionFieldGuide;
  fieldGuideCompleted: boolean;
  fieldGuideCompletedTopicIds?: string[];
  teachingSnippets: TeachingSnippet[];
  generatedPractice: GeneratedPracticeItem[];
  learningActivityAttempts?: LearningActivityAttempt[];
  progress: StoredProgress;
  profileId?: string;
  summary: RegionLearningSummary;
  activePage: TopicStudyPage;
  onBackToIndex: () => void;
  onNavigatePage: (page: TopicStudyPage) => void;
  onCompleteFieldGuide: () => void;
  onCompleteFieldGuideTopic?: (topicId: string) => void;
  onLearningActivityAttempt?: (attempt: LearningActivityAttempt) => void;
}

function TopicHubShell({
  topic,
  activePage,
  children,
  onBackToIndex,
  onNavigatePage,
}: {
  topic: StudyTopic;
  activePage: TopicStudyPage;
  children: ReactNode;
  onBackToIndex: () => void;
  onNavigatePage: (page: TopicStudyPage) => void;
}) {
  const headerFormula = `$${topic.headerFormula}$`;

  return (
    <section className="topic-hub-shell" aria-labelledby="topic-hub-title">
      <header className="topic-hub-header">
        <button className="secondary-button topic-back-button" type="button" onClick={onBackToIndex}>
          <ArrowLeft size={16} aria-hidden="true" />
          All Topics
        </button>
        <div className="topic-hub-heading">
          <span className="mode-pill">Topic hub</span>
          <h2 id="topic-hub-title">{topic.name}</h2>
          <p>{topic.description}</p>
        </div>
        <div className="topic-hub-formula" aria-hidden="true">
          <MathText text={headerFormula} interactiveGlossary={false} />
        </div>
      </header>

      <nav className="topic-hub-nav" aria-label={`${topic.name} study sections`}>
        {[
          { page: 'hub' as const, label: 'Overview' },
          { page: 'field-guide' as const, label: 'Field Guide' },
          { page: 'skill-practice' as const, label: 'Skill Practice' },
        ].map((item) => (
          <button
            className={activePage === item.page ? 'active' : ''}
            type="button"
            aria-current={activePage === item.page ? 'page' : undefined}
            key={item.page}
            onClick={() => onNavigatePage(item.page)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {children}
    </section>
  );
}

export function TopicHub({
  topic,
  region,
  regionProgress,
  fieldGuide,
  fieldGuideCompleted,
  fieldGuideCompletedTopicIds = [],
  teachingSnippets,
  generatedPractice,
  learningActivityAttempts = [],
  progress,
  profileId,
  summary,
  activePage,
  onBackToIndex,
  onNavigatePage,
  onCompleteFieldGuide,
  onCompleteFieldGuideTopic,
  onLearningActivityAttempt,
}: TopicHubProps) {
  const [currentFieldGuideTopic, setCurrentFieldGuideTopic] = useState<FieldGuideTopic | undefined>();
  const displayRegion = useMemo(() => displayRegionForTopic(topic, region), [region, topic]);
  const theme = useMemo(() => ({
    ...getRegionTheme(region),
    title: topic.name,
    subtitle: topic.description,
    guideMessage: 'Study the method, then move into focused practice.',
    atmosphere: 'Clean topic practice with worked examples and self-marked questions.',
    masteryQuote: 'Progress is saved from completed learning steps and marked attempts.',
  }), [region, topic]);
  const topicProgress = topicProgressSummary({
    progress,
    regionProgress,
    regionId: topic.regionId,
  });

  return (
    <TopicHubShell topic={topic} activePage={activePage} onBackToIndex={onBackToIndex} onNavigatePage={onNavigatePage}>
      {activePage === 'hub' ? (
        <div className="topic-hub-overview">
          <section className="topic-progress-summary" aria-label={`${topic.name} local progress`}>
            <article>
              <BookOpenCheck size={20} aria-hidden="true" />
              <span>Field Guide</span>
              <strong>{topicProgress.fieldGuideCompleted}/{topicProgress.fieldGuideTotal}</strong>
            </article>
            <article>
              <ListChecks size={20} aria-hidden="true" />
              <span>Skill Practice</span>
              <strong>{topicProgress.skillPracticeAttempts} saved</strong>
            </article>
            <article>
              <FileText size={20} aria-hidden="true" />
              <span>Exam Questions</span>
              <strong>{topicProgress.questionAttempts} saved</strong>
            </article>
          </section>

          <div className="topic-hub-entry-grid">
            <article className="topic-entry-card is-primary">
              <div>
                <span className="mode-pill">Recommended first</span>
                <h3>Field Guide</h3>
                <p>Review the topic method with worked examples before answering practice questions.</p>
              </div>
              <button className="primary-button" type="button" onClick={() => onNavigatePage('field-guide')}>
                {fieldGuideCompleted ? 'Review Field Guide' : 'Start Field Guide'}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </article>

            <article className="topic-entry-card">
              <div>
                <span className="mode-pill">Accessible anytime</span>
                <h3>Skill Practice</h3>
                <p>Answer short focused prompts for the topic. Completed items are saved locally.</p>
              </div>
              <button className="secondary-button" type="button" onClick={() => onNavigatePage('skill-practice')}>
                Practice Questions
              </button>
            </article>
          </div>

          <section className="topic-hub-status-note">
            <strong>Current recommendation</strong>
            <p>{fieldGuideCompleted ? summary.trainingSession.reason : 'Start with the Field Guide, then use Skill Practice to check the method.'}</p>
          </section>
        </div>
      ) : null}

      {activePage === 'field-guide' ? (
        <div className="topic-study-panel">
          <FieldGuidePanel
            fieldGuide={fieldGuide}
            fieldGuideCompleted={fieldGuideCompleted}
            fieldGuideCompletedTopicIds={fieldGuideCompletedTopicIds}
            region={displayRegion}
            theme={theme}
            teachingSnippets={teachingSnippets}
            maxInitialSnippets={Math.max(2, teachingSnippets.length)}
            onCompleteFieldGuide={onCompleteFieldGuide}
            onCompleteFieldGuideTopic={onCompleteFieldGuideTopic}
            onBackToRegionHub={() => onNavigatePage('hub')}
            onCurrentTopicChange={setCurrentFieldGuideTopic}
            onContinueToQuickChecks={(fieldGuideTopic) => {
              setCurrentFieldGuideTopic(fieldGuideTopic);
              onNavigatePage('skill-practice');
            }}
          />
        </div>
      ) : null}

      {activePage === 'skill-practice' ? (
        <div className="topic-study-panel">
          <SkillPracticePanel
            teachingSnippets={teachingSnippets}
            practiceItems={generatedPractice}
            region={displayRegion}
            profileId={profileId}
            activityAttempts={learningActivityAttempts}
            focus="overview"
            canUseQuickCheck
            canUseWarmUp
            canUseExamPractice
            currentFieldGuideTopic={currentFieldGuideTopic}
            onContinueToFieldGuide={() => onNavigatePage('field-guide')}
            onLearningActivityAttempt={onLearningActivityAttempt}
          />
        </div>
      ) : null}
    </TopicHubShell>
  );
}
