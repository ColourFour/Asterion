import { describe, expect, it } from 'vitest';
import { COURSES, coursePath, getCourseBySlug, P3_COURSE_ID } from '../data/courses';

describe('course metadata', () => {
  it('centralizes the initial CAIE 9709 course shells', () => {
    expect(COURSES.map((course) => course.id)).toEqual(['p1', 'p3', 'm1', 's1']);
    expect(COURSES.map((course) => course.slug)).toEqual(['p1', 'p3', 'm1', 's1']);
    expect(COURSES.every((course) => course.topics.length > 0)).toBe(true);
  });

  it('marks P3 as developed and other courses as draft seed content', () => {
    const p3 = getCourseBySlug(P3_COURSE_ID);
    expect(p3?.displayName).toBe('Pure Mathematics 3');
    expect(p3?.status).toBe('partial');
    expect(p3?.coverageSummary).toContain('existing static topic pages');

    for (const slug of ['p1', 'm1', 's1'] as const) {
      const course = getCourseBySlug(slug);
      expect(course?.status).toBe('draft-seed');
      expect(course?.statusLabel).toBe('Draft seed');
      expect(course?.coverageSummary).toContain('needs syllabus-contract review');
      expect(course?.topics.every((topic) => topic.slug && topic.syllabusRef?.startsWith('9709 ') && !topic.note.includes('Draft seed content'))).toBe(true);
    }
  });

  it('builds stable course paths from metadata', () => {
    expect(COURSES.map(coursePath)).toEqual(['/p1', '/p3', '/m1', '/s1']);
  });
});
