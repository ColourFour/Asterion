import { COURSES, P3_COURSE_ID } from '../data/courses';
import { STUDY_TOPICS } from './topicStudy';

export interface StaticStudyPageRoute {
  path: string;
  label: string;
}

export const STATIC_STUDY_PAGE_ROUTES: StaticStudyPageRoute[] = [
  { path: 'index.html', label: 'P3 learning path' },
  { path: 'about/index.html', label: 'About Asterion' },
  ...COURSES.map((course) => ({
    path: `${course.slug}/index.html`,
    label: `${course.shortName} course page`,
  })),
  { path: `${P3_COURSE_ID}/topics/index.html`, label: 'P3 unit sequence' },
  { path: `${P3_COURSE_ID}/need-to-know/index.html`, label: 'P3 Need to Know checklist' },
  { path: `${P3_COURSE_ID}/review/index.html`, label: 'P3 final exam review' },
  { path: `${P3_COURSE_ID}/content-qa/index.html`, label: 'P3 Content QA table' },
  ...STUDY_TOPICS.flatMap((topic) => [
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/learn/index.html`, label: `P3 ${topic.name} Learn Mode` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/field-guide/index.html`, label: `P3 ${topic.name} Field Guide` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/skill-check/index.html`, label: `P3 ${topic.name} Skill Check` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/exam-training/index.html`, label: `P3 ${topic.name} Exam Training` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/worksheet/index.html`, label: `P3 ${topic.name} printable worksheet` },
  ]),
];

export const REQUIRED_STATIC_STUDY_PAGE_PATHS = STATIC_STUDY_PAGE_ROUTES.map((route) => route.path);
