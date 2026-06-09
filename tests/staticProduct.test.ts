import { describe, expect, it } from 'vitest';
import { COURSES, P3_COURSE_ID, coursePath, getCourseBySlug } from '../src/data/courses';
import { P3_REGION_DEFINITIONS } from '../src/lib/p3SkillContract';
import { REQUIRED_STATIC_STUDY_PAGE_PATHS } from '../src/lib/staticStudyRoutes';
import { STUDY_TOPICS } from '../src/lib/topicStudy';

const officialP3Topics = [
  'Algebra',
  'Logarithmic and Exponential Functions',
  'Trigonometry',
  'Differentiation',
  'Integration',
  'Numerical Solution of Equations',
  'Vectors',
  'Differential Equations',
  'Complex Numbers',
];

describe('static P3 product contract', () => {
  it('makes P3 the only ready course path', () => {
    expect(COURSES.map((course) => course.id)).toEqual(['p1', 'p3', 'm1', 's1']);
    expect(COURSES.map(coursePath)).toEqual(['/p1', '/p3', '/m1', '/s1']);

    expect(getCourseBySlug(P3_COURSE_ID)?.status).toBe('ready');
    expect(getCourseBySlug(P3_COURSE_ID)?.statusLabel).toBe('Ready');

    for (const slug of ['p1', 'm1', 's1'] as const) {
      const course = getCourseBySlug(slug);
      expect(course?.status).toBe('support-only');
      expect(course?.statusLabel).toBe('Support only');
      expect(course?.topics).toEqual([]);
    }
  });

  it('uses official P3 topic wording throughout route metadata', () => {
    expect(STUDY_TOPICS.map((topic) => topic.name)).toEqual(officialP3Topics);
    expect(P3_REGION_DEFINITIONS.map((region) => region.name)).toEqual(officialP3Topics);
    expect(STUDY_TOPICS.map((topic) => topic.regionId)).toEqual([
      'algebra',
      'logarithmic-and-exponential-functions',
      'trigonometry',
      'differentiation',
      'integration',
      'numerical-solution-of-equations',
      'vectors',
      'differential-equations',
      'complex-numbers',
    ]);
  });

  it('declares only canonical P3 topic task routes', () => {
    for (const topic of STUDY_TOPICS) {
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`p3/topics/${topic.slug}/field-guide/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`p3/topics/${topic.slug}/skill-check/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`p3/topics/${topic.slug}/exam-training/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain(`p3/topics/${topic.slug}/practice/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain(`p3/topics/${topic.slug}/index.html`);
    }

    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('p3/topics/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('p3/exam-training/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('regions/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).not.toContain('topics/algebra/index.html');
  });
});
