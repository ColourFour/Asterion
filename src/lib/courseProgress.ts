import type { RegionLearningRecord, StoredProgress, StudyCourseId } from '../types';

export const LEGACY_PROGRESS_COURSE: StudyCourseId = 'p3';

export function isStudyCourseId(value: unknown): value is StudyCourseId {
  return value === 'p1' || value === 'p3';
}

export function normalizeStudyCourseId(value: unknown): StudyCourseId {
  return value === 'p1' ? 'p1' : LEGACY_PROGRESS_COURSE;
}

export function progressRecordsForCourse<T extends { course?: StudyCourseId }>(
  records: T[] | undefined,
  course: StudyCourseId,
): T[] {
  return (records ?? []).filter((record) => normalizeStudyCourseId(record.course) === course);
}

export function courseRegionLearningKey(course: StudyCourseId, regionId: string): string {
  return `${course}:${regionId}`;
}

export function getCourseRegionLearning(
  regionLearning: StoredProgress['regionLearning'] | undefined,
  course: StudyCourseId,
  regionId: string,
): RegionLearningRecord | undefined {
  if (!regionLearning) return undefined;
  const scoped = regionLearning[courseRegionLearningKey(course, regionId)];
  if (scoped) {
    return {
      ...scoped,
      course,
      regionId,
    };
  }

  if (course !== LEGACY_PROGRESS_COURSE) return undefined;
  const legacy = regionLearning[regionId];
  if (!legacy || normalizeStudyCourseId(legacy.course) !== LEGACY_PROGRESS_COURSE) return undefined;
  return {
    ...legacy,
    course: LEGACY_PROGRESS_COURSE,
    regionId,
  };
}

export function setCourseRegionLearning(
  regionLearning: StoredProgress['regionLearning'] | undefined,
  course: StudyCourseId,
  record: RegionLearningRecord,
): NonNullable<StoredProgress['regionLearning']> {
  const next = { ...(regionLearning ?? {}) };
  next[courseRegionLearningKey(course, record.regionId)] = {
    ...record,
    course,
  };
  return next;
}
