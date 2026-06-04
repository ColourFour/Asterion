import { ArrowRight } from 'lucide-react';
import { COURSES, type CourseMetadata } from '../../data/courses';
import { resolvePublicAssetPath } from '../../lib/resolveAssetPath';

const courseSelectorHeroImage = resolvePublicAssetPath('/assets/ui/course-selector-study-hero.png');

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
          <p>Pick the maths paper you are studying today. Each course opens into a focused study page with topics, practice, and exam preparation where available.</p>
        </div>
        <figure className="study-hero-visual">
          <img src={courseSelectorHeroImage} alt="A calm study desk with a maths notebook, pencil, tea, and laptop." />
        </figure>
      </header>

      <div className="course-card-grid" aria-label="Available CAIE 9709 courses">
        {COURSES.map((course) => (
          <button className={`course-card course-status-${course.status}`} key={course.id} type="button" onClick={() => onOpenCourse(course)} aria-label={`Open ${course.displayName}`}>
            <div>
              <div className="course-card-kicker">
                <span className="mode-pill">{course.examComponentLabel}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </div>
              <h3>{course.shortName}: {course.displayName}</h3>
              <p>{course.shortDescription}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
