import { COURSES, P3_COURSE_ID } from '../data/courses';
import { getSeedTopicsForCourse } from '../data/courseSeedContent';
import { STUDY_TOPICS } from './topicStudy';

export interface StaticStudyPageRoute {
  path: string;
  label: string;
}

export const STATIC_STUDY_PAGE_ROUTES: StaticStudyPageRoute[] = [
  { path: 'index.html', label: 'Courses' },
  ...COURSES.map((course) => ({
    path: `${course.slug}/index.html`,
    label: `${course.shortName} course dashboard`,
  })),
  ...COURSES.flatMap((course) => {
    const seedTopics = getSeedTopicsForCourse(course.id);
    if (!seedTopics.length) return [];
    return [
      { path: `${course.slug}/topics/index.html`, label: `${course.shortName} topic index` },
      ...seedTopics.flatMap((topic) => [
        { path: `${course.slug}/topics/${topic.slug}/index.html`, label: `${course.shortName} ${topic.title} topic` },
        { path: `${course.slug}/topics/${topic.slug}/field-guide/index.html`, label: `${course.shortName} ${topic.title} Field Guide` },
        { path: `${course.slug}/topics/${topic.slug}/practice/index.html`, label: `${course.shortName} ${topic.title} Practice` },
        { path: `${course.slug}/topics/${topic.slug}/exam-training/index.html`, label: `${course.shortName} ${topic.title} Exam Training` },
      ]),
      { path: `${course.slug}/exam-training/index.html`, label: `${course.shortName} Exam Training` },
    ];
  }),
  { path: `${P3_COURSE_ID}/topics/index.html`, label: 'P3 topic index' },
  ...STUDY_TOPICS.flatMap((topic) => [
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/index.html`, label: `P3 ${topic.name} hub` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/field-guide/index.html`, label: `P3 ${topic.name} Field Guide` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/practice/index.html`, label: `P3 ${topic.name} Practice Questions` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/exam-training/index.html`, label: `P3 ${topic.name} Exam Training` },
  ]),
  { path: `${P3_COURSE_ID}/exam-training/index.html`, label: 'P3 Exam Training' },
  { path: `${P3_COURSE_ID}/regions/index.html`, label: 'P3 Regions' },
  { path: 'regions/index.html', label: 'Regions' },
  ...STUDY_TOPICS.flatMap((topic) => [
    { path: `topics/${topic.slug}/index.html`, label: `${topic.name} hub` },
    { path: `topics/${topic.slug}/field-guide/index.html`, label: `${topic.name} Field Guide` },
    { path: `topics/${topic.slug}/practice/index.html`, label: `${topic.name} Practice Questions` },
    { path: `topics/${topic.slug}/exam-training/index.html`, label: `${topic.name} Exam Training` },
  ]),
  { path: 'exam-training/index.html', label: 'Exam Training' },
];

export const REQUIRED_STATIC_STUDY_PAGE_PATHS = STATIC_STUDY_PAGE_ROUTES.map((route) => route.path);
