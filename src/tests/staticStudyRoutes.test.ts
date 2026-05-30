import { describe, expect, it } from 'vitest';
import { REQUIRED_STATIC_STUDY_PAGE_PATHS } from '../lib/staticStudyRoutes';
import { STUDY_TOPICS } from '../lib/topicStudy';

describe('static study routes', () => {
  it('declares the required real HTML pages', () => {
    expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toEqual(expect.arrayContaining([
      'index.html',
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
    ]));
  });

  it('declares hub, Field Guide, and Practice Questions pages for every topic', () => {
    for (const topic of STUDY_TOPICS) {
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/field-guide/index.html`);
      expect(REQUIRED_STATIC_STUDY_PAGE_PATHS).toContain(`topics/${topic.slug}/practice/index.html`);
    }
  });
});
