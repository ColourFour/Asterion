import { ArrowRight } from 'lucide-react';
import { P3_COURSE_ID, type CourseMetadata, type CourseTopicPlaceholder } from '../../data/courses';

interface CourseDashboardProps {
  course: CourseMetadata;
  onOpenP3Topics: () => void;
  onOpenP3ExamTraining: () => void;
}

function CourseMathVisual() {
  return (
    <div className="course-math-visual" aria-hidden="true">
      <svg viewBox="0 0 360 250" role="img" focusable="false">
        <defs>
          <linearGradient id="courseVisualWarm" x1="34" y1="20" x2="322" y2="232" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffaf0" />
            <stop offset="0.52" stopColor="#f4ddbd" />
            <stop offset="1" stopColor="#dce9df" />
          </linearGradient>
          <linearGradient id="courseVisualLine" x1="42" y1="196" x2="324" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#78351f" />
            <stop offset="0.5" stopColor="#c47b1b" />
            <stop offset="1" stopColor="#3f7162" />
          </linearGradient>
        </defs>
        <rect x="14" y="16" width="332" height="218" rx="18" fill="url(#courseVisualWarm)" />
        <g stroke="#8f735d" strokeOpacity="0.24" strokeWidth="1">
          {Array.from({ length: 8 }, (_, index) => <path key={`v-${index}`} d={`M${54 + index * 36} 32v184`} />)}
          {Array.from({ length: 6 }, (_, index) => <path key={`h-${index}`} d={`M34 ${54 + index * 32}h292`} />)}
        </g>
        <path d="M46 186c40-84 74-84 102 0s58 84 95 0 58-93 78-28" fill="none" stroke="url(#courseVisualLine)" strokeLinecap="round" strokeWidth="7" />
        <path d="M64 184h238M82 202V48" stroke="#34251f" strokeLinecap="round" strokeOpacity="0.52" strokeWidth="2" />
        <circle cx="122" cy="122" r="44" fill="none" stroke="#3f7162" strokeOpacity="0.72" strokeWidth="3" />
        <path d="M230 74l38 66h-76z" fill="none" stroke="#78351f" strokeOpacity="0.72" strokeWidth="3" />
        <g fill="#34251f" fillOpacity="0.72" fontFamily="Georgia, Times New Roman, serif" fontSize="18" fontStyle="italic">
          <text x="112" y="70">f(x)</text>
          <text x="242" y="164">dx</text>
          <text x="92" y="212">x</text>
        </g>
      </svg>
    </div>
  );
}

function draftFieldGuideHref(course: CourseMetadata, topic: CourseTopicPlaceholder): string | undefined {
  return topic.slug ? `/${course.slug}/topics/${topic.slug}/field-guide/` : undefined;
}

export function CourseDashboard({
  course,
  onOpenP3Topics,
  onOpenP3ExamTraining,
}: CourseDashboardProps) {
  const isP3 = course.id === P3_COURSE_ID;
  const hasDraftSeed = course.status === 'draft-seed';
  const topicHeading = hasDraftSeed ? 'Field Guides' : 'Topics';

  return (
    <section className="course-dashboard" aria-labelledby="course-dashboard-title">
      <header className="topic-hub-header course-dashboard-header">
        <div className="topic-hub-heading">
          <span className="mode-pill">{course.examComponentLabel}</span>
          <h2 id="course-dashboard-title">{course.shortName}: {course.displayName}</h2>
          <p>{course.shortDescription}</p>
        </div>
        <CourseMathVisual />
        <nav className="course-action-nav" aria-label={`${course.shortName} study sections`}>
          {isP3 ? (
            <button className="primary-button" type="button" onClick={onOpenP3Topics}>Field Guide</button>
          ) : hasDraftSeed ? (
            <a className="primary-button" href={`/${course.slug}/topics/`}>Field Guide</a>
          ) : (
            <span className="secondary-button disabled-button" aria-disabled="true">Field Guide</span>
          )}
          {isP3 ? (
            <button className="secondary-button" type="button" onClick={onOpenP3Topics}>Practice</button>
          ) : hasDraftSeed ? (
            <a className="secondary-button" href={`/${course.slug}/topics/`}>Practice</a>
          ) : (
            <span className="secondary-button disabled-button" aria-disabled="true">Practice</span>
          )}
          {isP3 ? (
            <button className="secondary-button" type="button" onClick={onOpenP3ExamTraining}>Exam Training</button>
          ) : hasDraftSeed ? (
            <a className="secondary-button" href={`/${course.slug}/exam-training/`}>Exam Training</a>
          ) : (
            <span className="secondary-button disabled-button" aria-disabled="true">Exam Training</span>
          )}
        </nav>
      </header>

      {hasDraftSeed ? (
        <aside className="course-warning-banner" role="note">
          <strong>{course.statusLabel}</strong>
          <span>Starter study notes are visible for audit; they are not mastery evidence or final exam-bank mapping yet.</span>
        </aside>
      ) : null}

      <section className="summary-card course-topic-list" aria-labelledby="course-topic-list-title">
        <div>
          <h3 id="course-topic-list-title">{topicHeading}</h3>
          <p>{hasDraftSeed ? 'Choose a topic to open its Field Guide.' : 'Choose a topic area to continue studying.'}</p>
        </div>
        <div className="course-topic-button-grid">
          {course.topics.map((topic) => {
            const href = draftFieldGuideHref(course, topic);
            const content = (
              <>
                <span>{topic.title}</span>
                {topic.syllabusRef ? <small>{topic.syllabusRef}</small> : <small>{topic.note}</small>}
                <ArrowRight size={16} aria-hidden="true" />
              </>
            );
            if (href) {
              return <a className="course-topic-button" href={href} key={topic.id}>{content}</a>;
            }
            if (isP3) {
              return <button className="course-topic-button" type="button" onClick={onOpenP3Topics} key={topic.id}>{content}</button>;
            }
            return <span className="course-topic-button is-disabled" aria-disabled="true" key={topic.id}>{content}</span>;
          })}
        </div>
      </section>
    </section>
  );
}
