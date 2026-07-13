import { describe, expect, it } from 'vitest';
import { courseTopicPath } from '../src/lib/courseStudyRoutes';
import { studyTopicForSlug, topicPath } from '../src/lib/topicStudy';

describe('course-aware study routes', () => {
  it('keeps same-name P1 and P3 topics distinct', () => {
    const p1 = studyTopicForSlug('trigonometry', 'p1');
    const p3 = studyTopicForSlug('trigonometry', 'p3');

    expect(p1).toMatchObject({ courseId: 'p1', regionId: 'trigonometry' });
    expect(p3).toMatchObject({ courseId: 'p3', regionId: 'trigonometry' });
    expect(p1).not.toBe(p3);
  });

  it('requires the course key in generic topic route helpers', () => {
    const p1 = studyTopicForSlug('integration', 'p1');
    expect(p1).toBeDefined();
    expect(topicPath(p1!, 'p1', 'skill-check')).toBe('/p1/topics/integration/skill-check');
    expect(courseTopicPath('p3', 'integration', 'skill-check')).toBe('p3/topics/integration/skill-check/index.html');
  });
});
