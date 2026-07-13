import { describe, expect, it } from 'vitest';
import {
  courseRegionLearningKey,
  getCourseRegionLearning,
  progressRecordsForCourse,
  setCourseRegionLearning,
} from '../src/lib/courseProgress';

describe('course-scoped region learning', () => {
  it('uses course-qualified keys so shared topic names do not collide', () => {
    const p1 = setCourseRegionLearning(undefined, 'p1', {
      regionId: 'trigonometry',
      fieldGuideCompletedAt: '2026-07-13T01:00:00.000Z',
      updatedAt: '2026-07-13T01:00:00.000Z',
    });
    const both = setCourseRegionLearning(p1, 'p3', {
      regionId: 'trigonometry',
      updatedAt: '2026-07-13T02:00:00.000Z',
    });

    expect(courseRegionLearningKey('p1', 'trigonometry')).toBe('p1:trigonometry');
    expect(getCourseRegionLearning(both, 'p1', 'trigonometry')).toMatchObject({
      course: 'p1',
      fieldGuideCompletedAt: '2026-07-13T01:00:00.000Z',
    });
    const p3Record = getCourseRegionLearning(both, 'p3', 'trigonometry');
    expect(p3Record).toMatchObject({ course: 'p3' });
    expect(p3Record?.fieldGuideCompletedAt).toBeUndefined();
  });

  it('reads legacy bare region keys only as P3', () => {
    const legacy = {
      integration: {
        regionId: 'integration',
        fieldGuideCompletedAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
    };

    expect(getCourseRegionLearning(legacy, 'p3', 'integration')).toMatchObject({
      course: 'p3',
      fieldGuideCompletedAt: '2026-07-01T00:00:00.000Z',
    });
    expect(getCourseRegionLearning(legacy, 'p1', 'integration')).toBeUndefined();
  });

  it('filters academic records by course while treating missing legacy course as P3', () => {
    const records = [
      { id: 'legacy' },
      { id: 'p3', course: 'p3' as const },
      { id: 'p1', course: 'p1' as const },
    ];

    expect(progressRecordsForCourse(records, 'p3').map((record) => record.id)).toEqual(['legacy', 'p3']);
    expect(progressRecordsForCourse(records, 'p1').map((record) => record.id)).toEqual(['p1']);
  });
});
