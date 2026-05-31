import { ArrowRight, BookOpenCheck } from 'lucide-react';
import { COURSES, type CourseMetadata } from '../../data/courses';

interface CourseSelectorProps {
  onOpenCourse: (course: CourseMetadata) => void;
}

export function CourseSelector({ onOpenCourse }: CourseSelectorProps) {
  return (
    <section className="course-selector" aria-labelledby="course-selector-title">
      <header className="course-selector-hero">
        <div>
          <span className="mode-pill">CAIE 9709 Study Hub</span>
          <h2 id="course-selector-title">Choose your course</h2>
          <p>Select a 9709 component to open its study page. P3 has the developed image-first study content; P1, M1, and S1 have draft seed pages for syllabus-contract audit.</p>
        </div>
        <div className="study-hero-visual" aria-hidden="true">
          <BookOpenCheck size={44} />
          <span>9709</span>
        </div>
      </header>

      <div className="course-card-grid" aria-label="Available CAIE 9709 courses">
        {COURSES.map((course) => (
          <article className={`course-card course-status-${course.status}`} key={course.id}>
            <div>
              <span className="mode-pill">{course.examComponentLabel}</span>
              <h3>{course.shortName}: {course.displayName}</h3>
              <p>{course.shortDescription}</p>
            </div>
            <div className="course-card-footer">
              <span className="course-status-pill">{course.statusLabel}</span>
              <button className="primary-button" type="button" onClick={() => onOpenCourse(course)}>
                Open {course.shortName}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
