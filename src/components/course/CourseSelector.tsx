import { ArrowRight, BookOpenCheck, ClipboardCheck, FileText, Target } from 'lucide-react';
import { COURSES, P3_COURSE_ID, type CourseMetadata } from '../../data/courses';

const LOOP_STEPS = [
  {
    label: 'Field Guide',
    text: 'Learn the method before opening exam-image practice.',
    Icon: BookOpenCheck,
  },
  {
    label: 'Skill Check',
    text: 'Check one skill at a time so guessing does not look like readiness.',
    Icon: ClipboardCheck,
  },
  {
    label: 'Exam Training',
    text: 'Move into source question images and mark-scheme review when the route is clear.',
    Icon: FileText,
  },
] as const;

interface CourseSelectorProps {
  onOpenCourse: (course: CourseMetadata) => void;
}

function courseCtaLabel(course: CourseMetadata): string {
  if (course.id === P3_COURSE_ID) return 'Start with P3';
  return `View ${course.shortName} draft support`;
}

function courseMaturityLabel(course: CourseMetadata): string {
  if (course.id === P3_COURSE_ID) return 'Most complete Asterion path';
  return 'Draft support';
}

function previewTopics(course: CourseMetadata, count: number): CourseMetadata['topics'] {
  return course.topics.slice(0, count);
}

function topicPreviewText(course: CourseMetadata, count: number): string {
  return previewTopics(course, count).map((topic) => topic.title).join(', ');
}

function courseSummary(course: CourseMetadata, featured: boolean): string {
  if (featured) return 'Full Field Guide, Skill Check, and Exam Training flow for the most developed Asterion course.';
  return 'Early topic notes and navigation support while this course is expanded and reviewed.';
}

export function CourseSelector({ onOpenCourse }: CourseSelectorProps) {
  const p3Course = COURSES.find((course) => course.id === P3_COURSE_ID) ?? COURSES[0];
  const supportCourses = COURSES.filter((course) => course.id !== p3Course.id);

  return (
    <section className="course-selector" aria-labelledby="course-selector-title">
      <header className="course-selector-hero">
        <div>
          <span className="mode-pill">CAIE 9709 training system</span>
          <h2 id="course-selector-title">Asterion trains exam readiness through a visible learning loop.</h2>
          <p>
            Read the method, check the skill, then train with exam-style work and mark-scheme review. Start with P3; it has the strongest Asterion path today.
          </p>
          <button type="button" className="primary-button homepage-recommended-action" onClick={() => onOpenCourse(p3Course)}>
            Start with P3 training
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="homepage-loop-panel" aria-label="Asterion learning loop">
          <span className="homepage-loop-kicker">Asterion loop</span>
          <ol>
            {LOOP_STEPS.map(({ label, text, Icon }) => (
              <li key={label}>
                <span className="homepage-loop-icon" aria-hidden="true"><Icon size={18} /></span>
                <div>
                  <strong>{label}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="homepage-loop-next-step">
            <Target size={18} aria-hidden="true" />
            <span>Recommended first click: {p3Course.shortName} {p3Course.displayName}</span>
          </div>
        </div>
      </header>

      <div className="homepage-course-layout" aria-label="Available CAIE 9709 courses">
        <button
          className={`course-card course-card-featured course-status-${p3Course.status}`}
          type="button"
          onClick={() => onOpenCourse(p3Course)}
          aria-label={`Open ${p3Course.displayName}`}
        >
          <span className="homepage-primary-label">Recommended starting path</span>
          <div className="course-card-header-row">
            <span className="course-code-badge">{p3Course.shortName}</span>
            <div>
              <span className="course-status-pill course-status-pill-primary">{courseMaturityLabel(p3Course)}</span>
              <h3>{p3Course.displayName}</h3>
            </div>
          </div>
          <p className="course-card-lede">{courseSummary(p3Course, true)}</p>
          <p className="homepage-primary-reason">
            Start here if you want the complete Asterion loop. Includes {topicPreviewText(p3Course, 5)}.
          </p>
          <span className="course-launch-cta course-launch-cta-primary">
            {courseCtaLabel(p3Course)}
            <ArrowRight size={16} aria-hidden="true" />
          </span>
        </button>

        <section className="homepage-support-section" aria-labelledby="homepage-support-title">
          <div className="homepage-support-heading">
            <h3 id="homepage-support-title">Draft/support courses</h3>
            <p>P1, M1, and S1 stay available for early support, but P3 is the recommended full-flow path.</p>
          </div>
          <div className="course-card-grid course-support-grid" aria-label="Draft and support CAIE 9709 courses">
            {supportCourses.map((course) => (
              <button className={`course-card course-status-${course.status}`} key={course.id} type="button" onClick={() => onOpenCourse(course)} aria-label={`Open ${course.displayName}`}>
                <div className="course-card-header-row">
                  <span className="course-code-badge">{course.shortName}</span>
                  <div>
                    <span className="course-status-pill">{courseMaturityLabel(course)}</span>
                    <h3>{course.displayName}</h3>
                  </div>
                </div>
                <p className="course-card-lede">{courseSummary(course, false)}</p>
                <p className="course-card-status-copy">Draft support only: useful for orientation, not a fully reviewed course path yet.</p>
                <span className="course-launch-cta course-launch-cta-secondary">
                  {courseCtaLabel(course)}
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="homepage-status-section" aria-labelledby="homepage-status-title">
        <span className="mode-pill">Status today</span>
        <h3 id="homepage-status-title">P3 is the most developed Asterion path today.</h3>
        <p>P1, M1, and S1 are available as draft support while their coverage is expanded and reviewed.</p>
      </section>
    </section>
  );
}
