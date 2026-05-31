import { courseSeedTopicSummaries } from './courseSeedContent';

export type CourseId = 'p1' | 'p3' | 'm1' | 's1';

export type CourseStatus = 'ready' | 'partial' | 'draft-seed' | 'coming-soon';

export interface CourseTopicPlaceholder {
  id: string;
  slug?: string;
  title: string;
  note: string;
}

export interface CourseMetadata {
  id: CourseId;
  slug: CourseId;
  displayName: string;
  shortName: string;
  shortDescription: string;
  examComponentLabel: string;
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
    shortDescription: 'Core algebra, functions, coordinate geometry, sequences, binomial expansion, trigonometry, differentiation, and integration foundations.',
    examComponentLabel: 'Paper 1 / Pure Mathematics 1',
    status: 'draft-seed',
    statusLabel: 'Draft seed',
    coverageSummary: 'Rapid draft seed content is available for first audit. It follows the official 9709 P1 syllabus headings but still needs syllabus-contract review before it is treated as final.',
    topics: courseSeedTopicSummaries('p1'),
  },
  {
    id: 'p3',
    slug: 'p3',
    displayName: 'Pure Mathematics 3',
    shortName: 'P3',
    shortDescription: 'The most developed course shell, with current image-first topic pages, Field Guides, Practice Questions, and Exam Training.',
    examComponentLabel: 'Paper 3 / Pure Mathematics 3',
    status: 'partial',
    statusLabel: 'Partial content ready',
    coverageSummary: 'P3 has the existing static topic pages and exam-image practice. It remains reviewed against the current P3 skill map.',
    topics: [
      { id: 'p3-algebra', title: 'Algebra', note: 'Existing Field Guide and practice content available.' },
      { id: 'p3-logarithms', title: 'Logarithms', note: 'Existing Field Guide and practice content available.' },
      { id: 'p3-trigonometry', title: 'Trigonometry', note: 'Existing Field Guide and practice content available.' },
      { id: 'p3-complex-numbers', title: 'Complex numbers / Argand diagrams', note: 'Existing Field Guide and practice content available.' },
      { id: 'p3-calculus', title: 'Calculus, integration, vectors, iteration, and differential equations', note: 'Existing P3 pages remain available.' },
    ],
  },
  {
    id: 'm1',
    slug: 'm1',
    displayName: 'Mechanics 1',
    shortName: 'M1',
    shortDescription: 'Forces, motion, Newtonian modelling, momentum, constant and variable acceleration, and connected-particle mechanics.',
    examComponentLabel: 'Mechanics 1',
    status: 'draft-seed',
    statusLabel: 'Draft seed',
    coverageSummary: 'Rapid draft seed content is available for first audit. It follows the official 9709 Mechanics 1 syllabus headings but still needs syllabus-contract review before it is treated as final.',
    topics: courseSeedTopicSummaries('m1'),
  },
  {
    id: 's1',
    slug: 's1',
    displayName: 'Probability & Statistics 1',
    shortName: 'S1',
    shortDescription: 'Data representation, probability, discrete distributions, normal distribution, and statistical sampling.',
    examComponentLabel: 'Probability & Statistics 1',
    status: 'draft-seed',
    statusLabel: 'Draft seed',
    coverageSummary: 'Rapid draft seed content is available for first audit. It follows the official 9709 Probability & Statistics 1 syllabus headings but still needs syllabus-contract review before it is treated as final.',
    topics: courseSeedTopicSummaries('s1'),
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
