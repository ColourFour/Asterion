import { STUDY_TOPICS } from './topicStudy';

export interface StaticStudyPageRoute {
  path: string;
  label: string;
}

export const STATIC_STUDY_PAGE_ROUTES: StaticStudyPageRoute[] = [
  { path: 'index.html', label: 'Home' },
  { path: 'regions/index.html', label: 'Regions' },
  ...STUDY_TOPICS.flatMap((topic) => [
    { path: `topics/${topic.slug}/index.html`, label: `${topic.name} hub` },
    { path: `topics/${topic.slug}/field-guide/index.html`, label: `${topic.name} Field Guide` },
    { path: `topics/${topic.slug}/practice/index.html`, label: `${topic.name} Practice Questions` },
  ]),
  { path: 'exam-training/index.html', label: 'Exam Training' },
];

export const REQUIRED_STATIC_STUDY_PAGE_PATHS = STATIC_STUDY_PAGE_ROUTES.map((route) => route.path);
