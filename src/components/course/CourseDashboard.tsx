import { ArrowRight } from 'lucide-react';
import { P3_COURSE_ID, type CourseMetadata, type CourseTopicPlaceholder } from '../../data/courses';
import { MathText } from '../shared/MathText';
import { STUDY_TOPICS, p3TopicPath } from '../../lib/topicStudy';

interface CourseDashboardProps {
  course: CourseMetadata;
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

function courseTopics(course: CourseMetadata): Array<CourseTopicPlaceholder & { href: string }> {
  if (course.id === P3_COURSE_ID) {
    return STUDY_TOPICS.map((topic) => ({
      id: topic.slug,
      slug: topic.slug,
      title: topic.name,
      note: topic.description,
      formula: topic.headerFormula,
      href: p3TopicPath(topic, 'field-guide'),
    }));
  }

  return course.topics.map((topic) => ({
    ...topic,
    href: draftFieldGuideHref(course, topic) ?? `/${course.slug}/topics/`,
  }));
}

function courseSectionPath(course: CourseMetadata, section: 'field-guide' | 'practice' | 'exam-training'): string {
  if (section === 'exam-training') return `/${course.slug}/exam-training/`;
  return `/${course.slug}/topics/`;
}

export function CourseDashboard({
  course,
}: CourseDashboardProps) {
  const topics = courseTopics(course);

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
          <a className="primary-button" href="#course-topics" aria-current="page">Topics</a>
          <a className="secondary-button" href={courseSectionPath(course, 'field-guide')}>Field Guide</a>
          <a className="secondary-button" href={courseSectionPath(course, 'practice')}>Practice</a>
          <a className="secondary-button" href={courseSectionPath(course, 'exam-training')}>Exam Training</a>
        </nav>
      </header>

      <section className="summary-card course-topic-list" aria-labelledby="course-topic-list-title" id="course-topics">
        <div>
          <h3 id="course-topic-list-title">Topics</h3>
          <p>Choose a topic to start learning.</p>
        </div>
        <div className="course-topic-button-grid">
          {topics.map((topic) => (
            <a className="course-topic-button" href={topic.href} key={topic.id}>
              <span className="topic-card-visual" aria-hidden="true">
                <svg viewBox="0 0 92 54" focusable="false">
                  <path d="M8 42c16-34 30-34 44 0s22 16 32-20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
                  <path d="M9 43h74M18 47V8" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.38" strokeWidth="2" />
                </svg>
              </span>
              <span className="topic-card-title">{topic.title}</span>
              {topic.syllabusRef ? <small>{topic.syllabusRef}</small> : null}
              {topic.formula ? <span className="topic-card-formula"><MathText text={`$${topic.formula}$`} /></span> : null}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </section>
  );
}
