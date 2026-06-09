import { COURSES, type CourseMetadata } from '../data/courses';
import type { NormalizedQuestion, PaperFamily } from '../types';
import { canonicalPaperFamily } from './resolveAssetPath';

export function courseExamPaperFamilies(course: CourseMetadata): PaperFamily[] {
  return course.paperFamilies.map((family) => canonicalPaperFamily(String(family)));
}

export function isQuestionForCourse(question: NormalizedQuestion, course: CourseMetadata): boolean {
  const family = canonicalPaperFamily(String(question.paperFamily));
  return courseExamPaperFamilies(course).some((candidate) => canonicalPaperFamily(String(candidate)) === family);
}

export function filterCourseExamQuestions(
  questions: NormalizedQuestion[],
  course: CourseMetadata,
): NormalizedQuestion[] {
  return questions.filter((question) => isQuestionForCourse(question, course));
}

export function readableRoutingTopicLabel(question: NormalizedQuestion): string | undefined {
  const topicId = question.topicRouting?.primaryTopicId;
  if (!topicId) return undefined;
  const cleaned = topicId
    .replace(/^9709_[a-z0-9]+_topic_/i, '')
    .replace(/_/g, ' ')
    .trim();
  if (!cleaned) return undefined;
  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function courseByPaperFamily(paperFamily: PaperFamily): CourseMetadata | undefined {
  const family = canonicalPaperFamily(String(paperFamily));
  return COURSES.find((course) => (
    courseExamPaperFamilies(course).some((candidate) => canonicalPaperFamily(String(candidate)) === family)
  ));
}
