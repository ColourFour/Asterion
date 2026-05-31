import { ArrowLeft, ArrowRight, BookOpenCheck, FileText, ListChecks } from 'lucide-react';
import { P3_COURSE_ID, type CourseMetadata } from '../../data/courses';

interface CourseDashboardProps {
  course: CourseMetadata;
  onBackToCourses: () => void;
  onOpenP3Topics: () => void;
  onOpenP3ExamTraining: () => void;
}

export function CourseDashboard({
  course,
  onBackToCourses,
  onOpenP3Topics,
  onOpenP3ExamTraining,
}: CourseDashboardProps) {
  const isP3 = course.id === P3_COURSE_ID;
  const hasDraftSeed = course.status === 'draft-seed';

  return (
    <section className="course-dashboard" aria-labelledby="course-dashboard-title">
      <header className="topic-hub-header course-dashboard-header">
        <button className="secondary-button topic-back-button" type="button" onClick={onBackToCourses}>
          <ArrowLeft size={16} aria-hidden="true" />
          All courses
        </button>
        <div className="topic-hub-heading">
          <span className="mode-pill">{course.examComponentLabel}</span>
          <h2 id="course-dashboard-title">{course.shortName}: {course.displayName}</h2>
          <p>{course.shortDescription}</p>
        </div>
        <span className="course-status-pill">{course.statusLabel}</span>
      </header>

      <div className="course-dashboard-grid">
        <article className="summary-card course-overview-card">
          <h3>What this course covers</h3>
          <p>{course.coverageSummary}</p>
          {hasDraftSeed ? <p>Draft seed content is visible for audit; it is not final syllabus-contract content.</p> : null}
          {!isP3 && !hasDraftSeed ? <p>Content coming soon after the syllabus/topic map is reviewed.</p> : null}
        </article>

        <article className="summary-card">
          <h3>{hasDraftSeed ? 'Draft topic list' : 'Topic list placeholder'}</h3>
          <ul className="plain-list">
            {course.topics.map((topic) => (
              <li key={topic.id}>
                {hasDraftSeed && topic.slug ? <a href={`/${course.slug}/topics/${topic.slug}/`}>{topic.title}</a> : <strong>{topic.title}</strong>}
                <span>{topic.note}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="topic-hub-entry-grid course-section-grid">
        <article className="topic-entry-card is-primary">
          <div>
            <BookOpenCheck size={20} aria-hidden="true" />
            <h3>Field Guide</h3>
            <p>{isP3 ? 'Open the current P3 Field Guide topic pages.' : hasDraftSeed ? 'Open the draft topic pages and Field Guide outlines.' : 'Field Guide content coming soon.'}</p>
          </div>
          {isP3 ? (
            <button className="primary-button" type="button" onClick={onOpenP3Topics}>
              Open P3 topics
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : hasDraftSeed ? (
            <a className="primary-button" href={`/${course.slug}/topics/`}>
              Open {course.shortName} topics
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          ) : null}
        </article>

        <article className="topic-entry-card">
          <div>
            <ListChecks size={20} aria-hidden="true" />
            <h3>Practice</h3>
            <p>{isP3 ? 'Use focused practice from the current P3 topic pages.' : hasDraftSeed ? 'Use placeholder self-check prompts only.' : 'Practice pages will be added after source topic maps exist.'}</p>
          </div>
          {isP3 ? (
            <button className="secondary-button" type="button" onClick={onOpenP3Topics}>
              Choose a topic
            </button>
          ) : hasDraftSeed ? (
            <a className="secondary-button" href={`/${course.slug}/topics/`}>
              Choose a topic
            </a>
          ) : null}
        </article>

        <article className="topic-entry-card">
          <div>
            <FileText size={20} aria-hidden="true" />
            <h3>Exam-style practice</h3>
            <p>{isP3 ? 'Open the existing mixed P3 image-first exam practice.' : hasDraftSeed ? 'Open a draft exam-training direction page. No exam-bank mapping is wired yet.' : 'Exam-style practice is not populated yet.'}</p>
          </div>
          {isP3 ? (
            <button className="secondary-button" type="button" onClick={onOpenP3ExamTraining}>
              Open Exam Training
            </button>
          ) : hasDraftSeed ? (
            <a className="secondary-button" href={`/${course.slug}/exam-training/`}>
              Open exam-training placeholder
            </a>
          ) : null}
        </article>
      </div>
    </section>
  );
}
