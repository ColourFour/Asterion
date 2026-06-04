import { ArrowRight } from 'lucide-react';
import { COURSES, type CourseMetadata } from '../../data/courses';

function ExamPanicVisual() {
  return (
    <div className="home-meme-visual" aria-hidden="true">
      <svg viewBox="0 0 420 300" focusable="false">
        <defs>
          <linearGradient id="panicPaper" x1="70" y1="22" x2="346" y2="254" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffdf8" />
            <stop offset="1" stopColor="#f9e6be" />
          </linearGradient>
          <linearGradient id="panicAccent" x1="32" y1="248" x2="382" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#78351f" />
            <stop offset="0.55" stopColor="#c47b1b" />
            <stop offset="1" stopColor="#3f7162" />
          </linearGradient>
        </defs>
        <rect x="20" y="20" width="380" height="260" rx="22" fill="#fff8ed" />
        <path d="M46 232c62-86 104-88 150-16s78 64 142-48" fill="none" stroke="url(#panicAccent)" strokeLinecap="round" strokeWidth="9" opacity="0.75" />
        <g transform="translate(188 34) rotate(5)">
          <rect width="160" height="188" rx="12" fill="url(#panicPaper)" stroke="#d9c9b7" strokeWidth="2" />
          <text x="18" y="34" fill="#34251f" fontSize="15" fontWeight="800">Question 1</text>
          <text x="18" y="58" fill="#78351f" fontSize="13">Hence prove...</text>
          <path d="M18 82h124M18 104h98M18 126h116" stroke="#8f735d" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
          <text x="18" y="164" fill="#3f7162" fontSize="14" fontWeight="800">Time left: 00:03</text>
        </g>
        <g transform="translate(72 96)">
          <circle cx="66" cy="70" r="46" fill="#f4ddbd" stroke="#78351f" strokeWidth="4" />
          <path d="M28 48c10-34 64-38 78-2" fill="none" stroke="#34251f" strokeWidth="8" strokeLinecap="round" />
          <circle cx="50" cy="70" r="5" fill="#34251f" />
          <circle cx="82" cy="70" r="5" fill="#34251f" />
          <path d="M54 94c10-10 22-10 32 0" fill="none" stroke="#34251f" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 126c34 20 64 20 98 0" fill="none" stroke="#3f7162" strokeWidth="10" strokeLinecap="round" />
          <text x="10" y="164" fill="#78351f" fontSize="15" fontWeight="900">Brain loading...</text>
        </g>
        <g fill="#34251f" fillOpacity="0.7" fontFamily="Georgia, Times New Roman, serif" fontSize="18" fontStyle="italic">
          <text x="42" y="70">dy/dx?</text>
          <text x="300" y="246">Σ panic</text>
        </g>
      </svg>
    </div>
  );
}

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
        <ExamPanicVisual />
      </header>

      <div className="course-card-grid" aria-label="Available CAIE 9709 courses">
        {COURSES.map((course) => (
          <button className={`course-card course-status-${course.status}`} key={course.id} type="button" onClick={() => onOpenCourse(course)} aria-label={`Open ${course.displayName}`}>
            <div className="course-launch-card-main">
              <span className="course-code-badge">{course.shortName}</span>
              <div>
                <h3>{course.displayName}</h3>
                <p>{course.launchDescription}</p>
              </div>
            </div>
            <span className="course-launch-cta">
              Start {course.shortName}
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
