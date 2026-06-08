import { ArrowRight, BookOpenCheck, CheckCircle2, ClipboardCheck, FileText, ShieldCheck, Target } from 'lucide-react';
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

const HOMEPAGE_CHECKLIST = [
  'Start with P3 unless your teacher has assigned another course.',
  'Use Field Guide -> Skill Check -> Exam Training as the study loop.',
  'Treat P1, M1, and S1 as draft support until their syllabus-contract audits are complete.',
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
  return 'Draft/support section';
}

function previewTopics(course: CourseMetadata, count: number): CourseMetadata['topics'] {
  return course.topics.slice(0, count);
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
            Start with a Field Guide, prove the method in a Skill Check, then use Exam Training with source question and mark-scheme images. P3 is the most complete path today; P1, M1, and S1 are draft support sections.
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
          <p className="course-card-lede">{p3Course.shortDescription}</p>
          <p className="homepage-primary-reason">
            Full Field Guide, Skill Check, and Exam Training flow. Recommended because P3 has the deepest reviewed Asterion study path today, while still marked as partial content ready.
          </p>
          <p className="course-card-status-copy">{p3Course.coverageSummary}</p>
          <div className="course-topic-preview" aria-label={`${p3Course.shortName} topic preview`}>
            <span>Current topic evidence</span>
            <ul>
              {previewTopics(p3Course, 5).map((topic) => (
                <li key={topic.id}>{topic.title}</li>
              ))}
            </ul>
          </div>
          <span className="course-launch-cta course-launch-cta-primary">
            {courseCtaLabel(p3Course)}
            <ArrowRight size={16} aria-hidden="true" />
          </span>
        </button>

        <section className="homepage-support-section" aria-labelledby="homepage-support-title">
          <div className="homepage-support-heading">
            <h3 id="homepage-support-title">Draft/support courses</h3>
            <p>P1, M1, and S1 stay available for navigation and early study support, but they are not presented as fully reviewed Asterion paths.</p>
          </div>
          <div className="course-card-grid course-support-grid" aria-label="Draft and support CAIE 9709 courses">
            {supportCourses.map((course) => (
              <button className={`course-card course-status-${course.status}`} key={course.id} type="button" onClick={() => onOpenCourse(course)} aria-label={`Open ${course.displayName}`}>
                <div className="course-card-header-row">
                  <span className="course-code-badge">{course.shortName}</span>
                  <div>
                    <span className="course-status-pill">{course.statusLabel}</span>
                    <span className="course-maturity-note">{courseMaturityLabel(course)}</span>
                    <h3>{course.displayName}</h3>
                  </div>
                </div>
                <p className="course-card-lede">{course.launchDescription}</p>
                <p className="course-card-status-copy">{course.coverageSummary}</p>
                <div className="course-topic-preview" aria-label={`${course.shortName} topic preview`}>
                  <span>Draft topic preview</span>
                  <ul>
                    {previewTopics(course, 3).map((topic) => (
                      <li key={topic.id}>{topic.syllabusRef ? `${topic.syllabusRef}: ` : ''}{topic.title}</li>
                    ))}
                  </ul>
                </div>
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
        <div>
          <span className="mode-pill">Trust and status</span>
          <h3 id="homepage-status-title">What is ready, and what is not overclaimed</h3>
        </div>
        <div className="homepage-status-grid">
          <article>
            <ShieldCheck size={20} aria-hidden="true" />
            <h4>Static study surface</h4>
            <p>No backend-only promise is needed for the course selector. The production study surface stays GitHub Pages compatible.</p>
          </article>
          <article>
            <FileText size={20} aria-hidden="true" />
            <h4>P3 image-first practice</h4>
            <p>P3 remains the developed path because its student-facing practice uses question images and mark-scheme images.</p>
          </article>
          <article>
            <CheckCircle2 size={20} aria-hidden="true" />
            <h4>Drafts are labelled</h4>
            <p>P1, M1, and S1 are useful for orientation, but they are still support drafts until reviewed against course contracts.</p>
          </article>
        </div>
      </section>

      <section className="homepage-checklist" aria-labelledby="homepage-checklist-title">
        <h3 id="homepage-checklist-title">Homepage acceptance checklist</h3>
        <ul>
          {HOMEPAGE_CHECKLIST.map((item) => (
            <li key={item}>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
