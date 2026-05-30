import { ArrowRight, BookOpenCheck, FileText, ListChecks } from 'lucide-react';
import type { RegionProgress, StoredProgress } from '../../types';
import { MathText } from '../shared/MathText';
import { STUDY_TOPICS, topicProgressSummary, type StudyTopic, type TopicStudyPage } from '../../lib/topicStudy';

interface TopicIndexProps {
  progress: StoredProgress;
  regionProgress: RegionProgress[];
  questionLoadingNotice?: string;
  onOpenExamTraining: () => void;
  onOpenTopic: (topic: StudyTopic, page?: TopicStudyPage) => void;
}

function progressLine(label: string, current: number, total: number): string {
  return `${label}: ${current}/${total}`;
}

function mathFormula(source: string): string {
  return `$${source}$`;
}

export function TopicIndex({
  progress,
  regionProgress,
  questionLoadingNotice,
  onOpenExamTraining,
  onOpenTopic,
}: TopicIndexProps) {
  const totalAttempts = progress.attempts.filter((attempt) => String(attempt.paperFamily).toLowerCase() === 'p3').length;
  const attemptedTopics = regionProgress.filter((item) => item.attempts > 0).length;

  return (
    <section className="study-index" aria-labelledby="study-index-title">
      <header className="study-index-hero">
        <div>
          <span className="mode-pill">CAIE 9709 · Paper 3</span>
          <h2 id="study-index-title">Topic Practice</h2>
          <p>Study the core Pure Mathematics 3 topics with short Field Guide lessons, focused skill practice, and image-first exam questions.</p>
        </div>
        <div className="study-hero-visual" aria-hidden="true">
          <MathText text={'$\\int f(x)\\,dx$ · $\\mathbf{a}\\cdot\\mathbf{b}$ · $z = r(\\cos\\theta+i\\sin\\theta)$'} interactiveGlossary={false} />
        </div>
      </header>

      {questionLoadingNotice ? <div className="notice">{questionLoadingNotice}</div> : null}

      <div className="study-topic-grid" aria-label="Paper 3 topic areas">
        {STUDY_TOPICS.map((topic) => {
          const topicRegionProgress = regionProgress.find((item) => item.region.id === topic.regionId);
          const topicProgress = topicProgressSummary({
            progress,
            regionProgress: topicRegionProgress,
            regionId: topic.regionId,
          });
          const fieldGuideStarted = topicProgress.fieldGuideCompleted > 0;
          return (
            <article className="study-topic-card" key={topic.regionId}>
              <div className="study-topic-card-main">
                <span className="study-topic-card-formula">
                  <MathText text={mathFormula(topic.headerFormula)} interactiveGlossary={false} />
                </span>
                <h3>{topic.name}</h3>
                <p>{topic.description}</p>
              </div>

              <div className="study-topic-progress" aria-label={`${topic.name} progress`}>
                <div>
                  <BookOpenCheck size={17} aria-hidden="true" />
                  <span>{progressLine('Field Guide', topicProgress.fieldGuideCompleted, topicProgress.fieldGuideTotal)}</span>
                </div>
                <div>
                  <ListChecks size={17} aria-hidden="true" />
                  <span>Skill Practice: {topicProgress.skillPracticeAttempts} saved</span>
                </div>
                <div>
                  <FileText size={17} aria-hidden="true" />
                  <span>Exam questions: {topicProgress.questionAttempts} saved</span>
                </div>
              </div>

              <div className="study-topic-actions">
                <button className="primary-button" type="button" onClick={() => onOpenTopic(topic, 'field-guide')}>
                  {fieldGuideStarted ? 'Continue Field Guide' : 'Start Field Guide'}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button className="secondary-button" type="button" onClick={() => onOpenTopic(topic, 'skill-practice')}>
                  Practice Questions
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="study-exam-training-card" aria-labelledby="study-exam-training-title">
        <div>
          <span className="mode-pill">Final study area</span>
          <h3 id="study-exam-training-title">Exam Training</h3>
          <p>Use this after topic work for Paper 3 exam-style question practice, self-marking, and topic progress review.</p>
        </div>
        <div className="study-exam-training-stats" aria-label="Exam Training progress">
          <span>{totalAttempts} saved Paper 3 attempt{totalAttempts === 1 ? '' : 's'}</span>
          <span>{attemptedTopics} topic area{attemptedTopics === 1 ? '' : 's'} tried</span>
        </div>
        <button className="primary-button" type="button" onClick={onOpenExamTraining}>
          Open Exam Training
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>
    </section>
  );
}
