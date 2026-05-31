import { describe, expect, it } from 'vitest';
import { REQUIRED_STATIC_STUDY_PAGE_PATHS } from '../lib/staticStudyRoutes';
import { STUDY_TOPICS } from '../lib/topicStudy';
import { COURSES, P3_COURSE_ID } from '../data/courses';
import { getSeedTopicsForCourse } from '../data/courseSeedContent';

describe('static study routes', () => {
  it('declares the required real HTML pages', () => {
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toEqual(expect.arrayContaining([
      'index.html',
      'p1/index.html',
      'p3/index.html',
      'm1/index.html',
      's1/index.html',
      'p1/topics/index.html',
      'p1/topics/quadratics/index.html',
      'p1/topics/quadratics/field-guide/index.html',
      'p1/topics/quadratics/practice/index.html',
      'p1/exam-training/index.html',
      'm1/topics/index.html',
      'm1/topics/forces-equilibrium/index.html',
      'm1/topics/forces-equilibrium/field-guide/index.html',
      'm1/topics/forces-equilibrium/practice/index.html',
      'm1/exam-training/index.html',
      's1/topics/index.html',
      's1/topics/data-representation/index.html',
      's1/topics/data-representation/field-guide/index.html',
      's1/topics/data-representation/practice/index.html',
      's1/exam-training/index.html',
      'p3/topics/index.html',
      'p3/topics/algebra/index.html',
      'p3/topics/algebra/field-guide/index.html',
      'p3/topics/algebra/practice/index.html',
      'regions/index.html',
      'topics/algebra/index.html',
      'topics/algebra/field-guide/index.html',
      'topics/algebra/practice/index.html',
      'topics/logarithms/index.html',
      'topics/trigonometry/index.html',
      'topics/argand/index.html',
      'topics/calculus/index.html',
      'topics/integration/index.html',
      'topics/vectors/index.html',
      'topics/iteration/index.html',
      'topics/differential-equations/index.html',
      'exam-training/index.html',
      'p3/exam-training/index.html',
    ]));
  });

  it('declares a dashboard route for every course shell', () => {
    for (const course of COURSES) {
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/index.html`);
    }
  });

  it('declares draft topic, Field Guide, Practice, and exam-training routes for seeded courses', () => {
    for (const course of COURSES.filter((course) => course.id !== P3_COURSE_ID)) {
      const topics = getSeedTopicsForCourse(course.id);
      expect(topics.length).toBeGreaterThan(0);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/exam-training/index.html`);
      for (const topic of topics) {
        expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/${topic.slug}/index.html`);
        expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/${topic.slug}/field-guide/index.html`);
        expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${course.slug}/topics/${topic.slug}/practice/index.html`);
      }
    }
  });

  it('declares P3-prefixed hub, Field Guide, and Practice Questions pages for every topic', () => {
    for (const topic of STUDY_TOPICS) {
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${P3_COURSE_ID}/topics/${topic.slug}/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${P3_COURSE_ID}/topics/${topic.slug}/field-guide/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`${P3_COURSE_ID}/topics/${topic.slug}/practice/index.html`);
    }
  });

  it('keeps legacy unprefixed P3 paths as compatibility pages', () => {
    for (const topic of STUDY_TOPICS) {
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/field-guide/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/practice/index.html`);
    }
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('regions/index.html');
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain('exam-training/index.html');
  });
});
