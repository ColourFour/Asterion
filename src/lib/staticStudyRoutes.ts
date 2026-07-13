import { COURSES, P3_COURSE_ID } from '../data/courses';
import { P1_STUDY_TOPICS, STUDY_TOPICS } from './topicStudy';
import {
  courseContentQaPath,
  courseExamTrainingPath,
  courseNeedToKnowPath,
  courseReviewPath,
  courseStartingCheckPath,
  courseTopicPath,
  courseTopicsIndexPath,
} from './courseStudyRoutes';

export interface StaticStudyPageRoute {
  path: string;
  label: string;
}

export const STATIC_STUDY_PAGE_ROUTES: StaticStudyPageRoute[] = [
  { path: 'index.html', label: 'P3 landing / gated P1-P3 chooser' },
  { path: 'about/index.html', label: 'About Asterion' },
  ...COURSES.map((course) => ({
    path: `${course.slug}/index.html`,
    label: `${course.shortName} course page`,
  })),
  { path: `${P3_COURSE_ID}/diagnostic/index.html`, label: 'P3 diagnostic gate' },
  { path: `${P3_COURSE_ID}/repair-lane/index.html`, label: 'P3 Foundation Review prerequisite practice' },
  { path: `${P3_COURSE_ID}/topics/index.html`, label: 'P3 unit sequence' },
  { path: `${P3_COURSE_ID}/exam-training/index.html`, label: 'P3 Exam Training' },
  { path: `${P3_COURSE_ID}/need-to-know/index.html`, label: 'P3 Need to Know checklist' },
  { path: `${P3_COURSE_ID}/review/index.html`, label: 'P3 final exam review' },
  ...STUDY_TOPICS.flatMap((topic) => [
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/learn/index.html`, label: `P3 ${topic.name} Learn` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/field-guide/index.html`, label: `P3 ${topic.name} Learn bridge` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/skill-check/index.html`, label: `P3 ${topic.name} Checked Practice` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/exam-training/index.html`, label: `P3 ${topic.name} Exam Training` },
    { path: `${P3_COURSE_ID}/topics/${topic.slug}/worksheet/index.html`, label: `P3 ${topic.name} printable Checked Practice worksheet` },
  ]),
  { path: courseStartingCheckPath('p1'), label: 'P1 optional Starting Check' },
  { path: courseTopicsIndexPath('p1'), label: 'P1 unit sequence' },
  { path: courseExamTrainingPath('p1'), label: 'P1 Exam Training' },
  { path: courseNeedToKnowPath('p1'), label: 'P1 Need to Know checklist' },
  { path: courseReviewPath('p1'), label: 'P1 review and export' },
  { path: courseContentQaPath('p1'), label: 'P1 internal Content QA' },
  ...P1_STUDY_TOPICS.flatMap((topic) => [
    { path: courseTopicPath('p1', topic.slug, 'learn'), label: `P1 ${topic.name} Learn` },
    { path: courseTopicPath('p1', topic.slug, 'field-guide'), label: `P1 ${topic.name} Learn bridge` },
    { path: courseTopicPath('p1', topic.slug, 'skill-check'), label: `P1 ${topic.name} Checked Practice` },
    { path: courseTopicPath('p1', topic.slug, 'exam-training'), label: `P1 ${topic.name} Exam Training` },
    { path: courseTopicPath('p1', topic.slug, 'worksheet'), label: `P1 ${topic.name} printable Checked Practice worksheet` },
  ]),
];

export const REQUIRED_STATIC_STUDY_PAGE_PATHS = STATIC_STUDY_PAGE_ROUTES.map((route) => route.path);
