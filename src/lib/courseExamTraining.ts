import { COURSES, type CourseId, type CourseMetadata } from '../data/courses';
import { getSeedTopicsForCourse, type CourseSeedTopic } from '../data/courseSeedContent';
import type { NormalizedQuestion, PaperFamily } from '../types';
import { canonicalPaperFamily } from './resolveAssetPath';

const seedTopicRoutingAliases: Partial<Record<CourseId, Record<string, string[]>>> = {
  p1: {
    quadratics: ['9709_p1_topic_quadratics'],
    functions: ['9709_p1_topic_functions'],
    'coordinate-geometry': ['9709_p1_topic_coordinate_geometry'],
    'circular-measure': ['9709_p1_topic_circular_measure'],
    trigonometry: ['9709_p1_topic_trigonometry'],
    'binomial-expansion': ['9709_p1_topic_binomial_expansion'],
    series: ['9709_p1_topic_series'],
    differentiation: ['9709_p1_topic_differentiation'],
    integration: ['9709_p1_topic_integration'],
  },
  m1: {
    'velocity-and-constant-acceleration': ['9709_m1_topic_kinematics_of_motion_in_a_straight_line'],
    'force-and-motion': [
      '9709_m1_topic_forces_and_equilibrium',
      '9709_m1_topic_newtons_laws_of_motion',
    ],
    friction: [
      '9709_m1_topic_forces_and_equilibrium',
      '9709_m1_topic_newtons_laws_of_motion',
    ],
    'connected-particles': ['9709_m1_topic_newtons_laws_of_motion'],
    'general-motion-in-a-straight-line': ['9709_m1_topic_kinematics_of_motion_in_a_straight_line'],
    momentum: ['9709_m1_topic_momentum'],
    'work-and-energy': ['9709_m1_topic_energy_work_and_power'],
  },
  s1: {
    'data-representation': ['9709_s1_topic_representation_of_data'],
    'permutations-combinations': ['9709_s1_topic_permutations_and_combinations'],
    probability: ['9709_s1_topic_probability'],
    'discrete-random-variables': ['9709_s1_topic_discrete_random_variables'],
    'normal-distribution': ['9709_s1_topic_the_normal_distribution'],
  },
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeRoutingId(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function fallbackTopicRoutingId(topic: CourseSeedTopic): string {
  return `9709_${topic.courseId}_topic_${topic.slug.replace(/-/g, '_')}`;
}

function questionRoutingIds(question: NormalizedQuestion): string[] {
  return unique([
    question.topicRouting?.primaryTopicId,
    ...(question.topicRouting?.topicDistribution ?? []).map((item) => item.topicId),
  ].filter((value): value is string => Boolean(value)).map(normalizeRoutingId));
}

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

export function topicRoutingIdsForSeedTopic(topic: CourseSeedTopic): string[] {
  return unique([
    fallbackTopicRoutingId(topic),
    ...(seedTopicRoutingAliases[topic.courseId]?.[topic.slug] ?? []),
  ].map(normalizeRoutingId));
}

export function filterCourseTopicExamQuestions(
  questions: NormalizedQuestion[],
  course: CourseMetadata,
  topic: CourseSeedTopic,
): NormalizedQuestion[] {
  const topicIds = new Set(topicRoutingIdsForSeedTopic(topic));
  return filterCourseExamQuestions(questions, course).filter((question) => (
    questionRoutingIds(question).some((topicId) => topicIds.has(topicId))
  ));
}

export function seedTopicForCourseQuestion(
  course: CourseMetadata,
  question: NormalizedQuestion,
): CourseSeedTopic | undefined {
  if (!isQuestionForCourse(question, course)) return undefined;
  const questionTopicIds = questionRoutingIds(question);
  if (!questionTopicIds.length) return undefined;
  return getSeedTopicsForCourse(course.id).find((topic) => {
    const topicIds = new Set(topicRoutingIdsForSeedTopic(topic));
    return questionTopicIds.some((topicId) => topicIds.has(topicId));
  });
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
