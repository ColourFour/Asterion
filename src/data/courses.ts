import type { PaperFamily } from '../types';

export type CourseId = 'p1' | 'p3' | 'm1' | 's1';

export type CourseStatus = 'ready' | 'support-only' | 'coming-soon';

export interface CourseTopicPlaceholder {
  id: string;
  slug?: string;
  syllabusRef?: string;
  formula?: string;
  title: string;
  note: string;
}

export interface CourseMetadata {
  id: CourseId;
  slug: CourseId;
  displayName: string;
  shortName: string;
  shortDescription: string;
  launchDescription: string;
  examComponentLabel: string;
  paperFamilies: PaperFamily[];
  status: CourseStatus;
  statusLabel: string;
  coverageSummary: string;
  topics: CourseTopicPlaceholder[];
}

export const P3_COURSE_ID: CourseId = 'p3';
export const P1_COURSE_ID: CourseId = 'p1';

export const COURSES: CourseMetadata[] = [
  {
    id: 'p1',
    slug: 'p1',
    displayName: 'Pure Mathematics 1',
    shortName: 'P1',
    shortDescription: 'Pure Mathematics 1 is being built against the reviewed 2026–2027 syllabus contract.',
    launchDescription: 'Eight-topic course review in progress.',
    examComponentLabel: 'Paper 1 / Pure Mathematics 1',
    paperFamilies: ['p1'],
    status: 'coming-soon',
    statusLabel: 'Review in progress',
    coverageSummary: 'P1 remains locked until all eight topic contracts, checked practice, and reviewed exam-image routes pass the launch gates.',
    topics: [
      { id: 'p1-quadratics', slug: 'quadratics', syllabusRef: '1.1', title: 'Quadratics', note: 'Internal course-contract review.' },
      { id: 'p1-functions', slug: 'functions', syllabusRef: '1.2', title: 'Functions', note: 'Internal course-contract review.' },
      { id: 'p1-coordinate-geometry', slug: 'coordinate-geometry', syllabusRef: '1.3', title: 'Coordinate geometry', note: 'Internal course-contract review.' },
      { id: 'p1-circular-measure', slug: 'circular-measure', syllabusRef: '1.4', title: 'Circular measure', note: 'Internal course-contract review.' },
      { id: 'p1-trigonometry', slug: 'trigonometry', syllabusRef: '1.5', title: 'Trigonometry', note: 'Internal course-contract review.' },
      { id: 'p1-series', slug: 'series', syllabusRef: '1.6', title: 'Series', note: 'Internal course-contract review.' },
      { id: 'p1-differentiation', slug: 'differentiation', syllabusRef: '1.7', title: 'Differentiation', note: 'Internal course-contract review.' },
      { id: 'p1-integration', slug: 'integration', syllabusRef: '1.8', title: 'Integration', note: 'Internal course-contract review.' },
    ],
  },
  {
    id: 'p3',
    slug: 'p3',
    displayName: 'Pure Mathematics 3',
    shortName: 'P3',
    shortDescription: 'Official Paper 3 topic path with integrated Learn Mode and Exam Training pages.',
    launchDescription: 'Paper 3 Learn Mode and Exam Training.',
    examComponentLabel: 'Paper 3 / Pure Mathematics 3',
    paperFamilies: ['p3'],
    status: 'ready',
    statusLabel: 'Content available',
    coverageSummary: 'P3 is the primary static product path. Topic pages use reviewed P3 routing and image-first exam practice.',
    topics: [
      { id: 'p3-algebra', title: 'Algebra', note: 'Learn Mode and Exam Training available.' },
      { id: 'p3-logarithmic-and-exponential-functions', title: 'Logarithmic and Exponential Functions', note: 'Learn Mode and Exam Training available.' },
      { id: 'p3-trigonometry', title: 'Trigonometry', note: 'Learn Mode and Exam Training available.' },
      { id: 'p3-differentiation', title: 'Differentiation', note: 'Learn Mode and Exam Training available.' },
      { id: 'p3-integration', title: 'Integration', note: 'Learn Mode and Exam Training available.' },
      { id: 'p3-numerical-solution-of-equations', title: 'Numerical Solution of Equations', note: 'Learn Mode and Exam Training available.' },
      { id: 'p3-vectors', title: 'Vectors', note: 'Learn Mode and Exam Training available.' },
      { id: 'p3-differential-equations', title: 'Differential Equations', note: 'Learn Mode and Exam Training available.' },
      { id: 'p3-complex-numbers', title: 'Complex Numbers', note: 'Learn Mode and Exam Training available.' },
    ],
  },
  {
    id: 'm1',
    slug: 'm1',
    displayName: 'Mechanics 1',
    shortName: 'M1',
    shortDescription: 'Locked for now. M1 will be available later after a syllabus check.',
    launchDescription: 'Available later.',
    examComponentLabel: 'Mechanics 1',
    paperFamilies: ['p4'],
    status: 'coming-soon',
    statusLabel: 'Available later',
    coverageSummary: 'M1 is locked on this branch until a separate syllabus check verifies coverage and exam alignment.',
    topics: [],
  },
  {
    id: 's1',
    slug: 's1',
    displayName: 'Probability & Statistics 1',
    shortName: 'S1',
    shortDescription: 'Locked for now. S1 will be available later after a syllabus check.',
    launchDescription: 'Available later.',
    examComponentLabel: 'Probability & Statistics 1',
    paperFamilies: ['p5'],
    status: 'coming-soon',
    statusLabel: 'Available later',
    coverageSummary: 'S1 is locked on this branch until a separate syllabus check verifies coverage and exam alignment.',
    topics: [],
  },
];

const coursesBySlug = new Map(COURSES.map((course) => [course.slug, course]));
const coursesById = new Map(COURSES.map((course) => [course.id, course]));

export function getCourseBySlug(slug: string | undefined): CourseMetadata | undefined {
  return slug ? coursesBySlug.get(slug as CourseId) : undefined;
}

export function getCourseById(id: string | undefined): CourseMetadata | undefined {
  return id ? coursesById.get(id as CourseId) : undefined;
}

export function coursePath(course: CourseMetadata): string {
  return `/${course.slug}`;
}

export function isCourseSlug(slug: string | undefined): slug is CourseId {
  return Boolean(slug && coursesBySlug.has(slug as CourseId));
}
