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

export const COURSES: CourseMetadata[] = [
  {
    id: 'p1',
    slug: 'p1',
    displayName: 'Pure Mathematics 1',
    shortName: 'P1',
    shortDescription: 'Support only. P1 content is not part of this static P3 product branch.',
    launchDescription: 'Support only.',
    examComponentLabel: 'Paper 1 / Pure Mathematics 1',
    paperFamilies: ['p1'],
    status: 'support-only',
    statusLabel: 'Support only',
    coverageSummary: 'P1 is demoted on this branch. Use it only for orientation until a separate syllabus audit verifies coverage and exam alignment.',
    topics: [],
  },
  {
    id: 'p3',
    slug: 'p3',
    displayName: 'Pure Mathematics 3',
    shortName: 'P3',
    shortDescription: 'Official Paper 3 topic path with Field Guide, Skill Check, and Exam Training pages.',
    launchDescription: 'Paper 3 Field Guide, Skill Check, and Exam Training.',
    examComponentLabel: 'Paper 3 / Pure Mathematics 3',
    paperFamilies: ['p3'],
    status: 'ready',
    statusLabel: 'Ready',
    coverageSummary: 'P3 is the primary static product path. Topic pages use reviewed P3 routing and image-first exam practice.',
    topics: [
      { id: 'p3-algebra', title: 'Algebra', note: 'Field Guide, Skill Check, and Exam Training available.' },
      { id: 'p3-logarithmic-and-exponential-functions', title: 'Logarithmic and Exponential Functions', note: 'Field Guide, Skill Check, and Exam Training available.' },
      { id: 'p3-trigonometry', title: 'Trigonometry', note: 'Field Guide, Skill Check, and Exam Training available.' },
      { id: 'p3-differentiation', title: 'Differentiation', note: 'Field Guide, Skill Check, and Exam Training available.' },
      { id: 'p3-integration', title: 'Integration', note: 'Field Guide, Skill Check, and Exam Training available.' },
      { id: 'p3-numerical-solution-of-equations', title: 'Numerical Solution of Equations', note: 'Field Guide, Skill Check, and Exam Training available.' },
      { id: 'p3-vectors', title: 'Vectors', note: 'Field Guide, Skill Check, and Exam Training available.' },
      { id: 'p3-differential-equations', title: 'Differential Equations', note: 'Field Guide, Skill Check, and Exam Training available.' },
      { id: 'p3-complex-numbers', title: 'Complex Numbers', note: 'Field Guide, Skill Check, and Exam Training available.' },
    ],
  },
  {
    id: 'm1',
    slug: 'm1',
    displayName: 'Mechanics 1',
    shortName: 'M1',
    shortDescription: 'Support only. M1 content is not part of this static P3 product branch.',
    launchDescription: 'Support only.',
    examComponentLabel: 'Mechanics 1',
    paperFamilies: ['p4'],
    status: 'support-only',
    statusLabel: 'Support only',
    coverageSummary: 'M1 is demoted on this branch. Use it only for orientation until a separate syllabus audit verifies coverage and exam alignment.',
    topics: [],
  },
  {
    id: 's1',
    slug: 's1',
    displayName: 'Probability & Statistics 1',
    shortName: 'S1',
    shortDescription: 'Support only. S1 content is not part of this static P3 product branch.',
    launchDescription: 'Support only.',
    examComponentLabel: 'Probability & Statistics 1',
    paperFamilies: ['p5'],
    status: 'support-only',
    statusLabel: 'Support only',
    coverageSummary: 'S1 is demoted on this branch. Use it only for orientation until a separate syllabus audit verifies coverage and exam alignment.',
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
