import type { CourseId } from '../data/courses';

export type CourseTopicMode = 'learn' | 'field-guide' | 'skill-check' | 'exam-training' | 'worksheet';

export function courseDashboardPath(courseId: CourseId): string {
  return `${courseId}/index.html`;
}

export function courseTopicsIndexPath(courseId: CourseId): string {
  return `${courseId}/topics/index.html`;
}

export function courseStartingCheckPath(courseId: CourseId): string {
  return `${courseId}/diagnostic/index.html`;
}

export function courseExamTrainingPath(courseId: CourseId): string {
  return `${courseId}/exam-training/index.html`;
}

export function courseNeedToKnowPath(courseId: CourseId): string {
  return `${courseId}/need-to-know/index.html`;
}

export function courseReviewPath(courseId: CourseId): string {
  return `${courseId}/review/index.html`;
}

export function courseContentQaPath(courseId: CourseId): string {
  return `${courseId}/content-qa/index.html`;
}

export function courseTopicPath(courseId: CourseId, topicSlug: string, mode: CourseTopicMode): string {
  return `${courseId}/topics/${topicSlug}/${mode}/index.html`;
}
