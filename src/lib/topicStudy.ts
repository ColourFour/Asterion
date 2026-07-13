import { getFieldGuideTopicsForRegion } from '../data/fieldGuideTopics';
import { getLearnStepsForRegion } from '../data/learnModeLessons';
import { COURSES, P3_COURSE_ID, type CourseId } from '../data/courses';
import { P1_STUDY_TOPICS as P1_CONTRACT_TOPICS } from '../data/p1CourseContract';
import { isStrongSkillCheckEvidenceAttempt, normalizeSkillCheckLocalAttempts } from '../skill-checks/localAttempts';
import type { RegionDefinition, RegionLearningRecord, RegionProgress, SkillCheckAttemptRecord, StoredProgress } from '../types';
import { getCourseRegionLearning } from './courseProgress';
import { P3_COURSE_MAP } from './worldMap';
import { P1_COURSE_MAP } from './p1CourseMap';

export type TopicStudyPage = 'field-guide' | 'skill-check' | 'exam-training';

export interface StudyTopic {
  courseId: CourseId;
  regionId: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  headerFormula: string;
}

export interface TopicProgressSummary {
  fieldGuideCompleted: number;
  fieldGuideTotal: number;
  fieldGuidePercent: number;
  skillPracticeAttempts: number;
  questionAttempts: number;
  availableQuestions: number;
  averageScorePercent?: number;
}

export const STUDY_TOPICS: StudyTopic[] = [
  {
    courseId: 'p3',
    regionId: 'algebra',
    slug: 'algebra',
    name: 'Algebra',
    shortName: 'Algebra',
    description: 'Start here because polynomial structure, partial fractions, and binomial expansion feed later calculus and differential-equation questions.',
    headerFormula: 'f(x), \\; P(x), \\; |x|, \\; (1+x)^n',
  },
  {
    courseId: 'p3',
    regionId: 'logarithmic-and-exponential-functions',
    slug: 'logarithmic-and-exponential-functions',
    name: 'Logarithmic and Exponential Functions',
    shortName: 'Logs and Exponentials',
    description: 'Build log laws first, then use them to solve equations, check domains, and read exponential models in later calculus contexts.',
    headerFormula: '\\log_a x, \\; e^x, \\; y = ab^x',
  },
  {
    courseId: 'p3',
    regionId: 'trigonometry',
    slug: 'trigonometry',
    name: 'Trigonometry',
    shortName: 'Trig',
    description: 'Learn identities as tools for solving equations and rewriting calculus expressions, then practise interval discipline.',
    headerFormula: '\\sin x, \\; \\cos x, \\; \\tan x',
  },
  {
    courseId: 'p3',
    regionId: 'differentiation',
    slug: 'differentiation',
    name: 'Differentiation',
    shortName: 'Differentiation',
    description: 'Choose the derivative rule first, then turn gradients into tangents, normals, stationary points, and implicit or parametric results.',
    headerFormula: '\\frac{dy}{dx}, \\; f^{\\prime}(x), \\; \\frac{dy/dt}{dx/dt}',
  },
  {
    courseId: 'p3',
    regionId: 'integration',
    slug: 'integration',
    name: 'Integration',
    shortName: 'Integration',
    description: 'Start with method choice because substitution, parts, partial fractions, and area questions all depend on choosing the first rewrite.',
    headerFormula: '\\int f(x)\\,dx, \\; \\int_a^b f(x)\\,dx',
  },
  {
    courseId: 'p3',
    regionId: 'numerical-solution-of-equations',
    slug: 'numerical-solution-of-equations',
    name: 'Numerical Solution of Equations',
    shortName: 'Numerical Solution',
    description: 'Move from proving where a root lies to iterating accurately; exam marks reward the bracket, the formula, and the rounded conclusion.',
    headerFormula: 'x_{n+1}=g(x_n), \\; f(a)f(b)<0',
  },
  {
    courseId: 'p3',
    regionId: 'vectors',
    slug: 'vectors',
    name: 'Vectors',
    shortName: 'Vectors',
    description: 'The goal is to turn vector notation into geometry: lines, intersections, angles, distances, and projections.',
    headerFormula: '\\mathbf{r}=\\mathbf{a}+\\lambda\\mathbf{b}, \\; \\mathbf{a}\\cdot\\mathbf{b}',
  },
  {
    courseId: 'p3',
    regionId: 'differential-equations',
    slug: 'differential-equations',
    name: 'Differential Equations',
    shortName: 'DEs',
    description: 'Form or separate the equation first, integrate cleanly, then use conditions and context to finish the model.',
    headerFormula: '\\frac{dy}{dx}=f(x,y), \\; y(x_0)=y_0',
  },
  {
    courseId: 'p3',
    regionId: 'complex-numbers',
    slug: 'complex-numbers',
    name: 'Complex Numbers',
    shortName: 'Complex Numbers',
    description: 'Move from arithmetic to geometry: Cartesian form, modulus-argument form, loci, powers, and roots all reuse the same representation choices.',
    headerFormula: 'z = x+iy, \\; |z|, \\; \\arg z',
  },
];

export const P1_STUDY_TOPICS: StudyTopic[] = P1_CONTRACT_TOPICS.map((topic) => ({
  courseId: 'p1',
  regionId: topic.slug,
  slug: topic.slug,
  name: topic.title,
  shortName: topic.shortTitle,
  description: topic.description,
  headerFormula: topic.headerFormula,
}));

export const COURSE_STUDY_TOPICS: StudyTopic[] = [...P1_STUDY_TOPICS, ...STUDY_TOPICS];

const topicsByRegionId = new Map(COURSE_STUDY_TOPICS.map((topic) => [`${topic.courseId}:${topic.regionId}`, topic]));
const topicsBySlug = new Map(COURSE_STUDY_TOPICS.map((topic) => [`${topic.courseId}:${topic.slug}`, topic]));

export const P3_STUDY_TOPICS = STUDY_TOPICS;

export const STUDY_ROUTE_ROOTS = new Set<string>([
  ...COURSES.map((course) => course.slug),
]);

export function studyTopicForRegionId(regionId: string | undefined, courseId: CourseId): StudyTopic | undefined {
  return regionId ? topicsByRegionId.get(`${courseId}:${regionId}`) : undefined;
}

export function studyTopicForSlug(slug: string | undefined, courseId: CourseId): StudyTopic | undefined {
  return slug ? topicsBySlug.get(`${courseId}:${slug}`) : undefined;
}

export function regionForStudyTopic(topic: StudyTopic): RegionDefinition | undefined {
  const world = topic.courseId === 'p1' ? P1_COURSE_MAP : P3_COURSE_MAP;
  return world.regions.find((region) => region.id === topic.regionId);
}

export function displayRegionForTopic(topic: StudyTopic, region?: RegionDefinition): RegionDefinition {
  return {
    ...(region ?? {
      id: topic.regionId,
      activeByDefault: true,
      matchTerms: [],
      subtopics: [],
    }),
    name: topic.name,
    description: topic.description,
  };
}

export function topicPath(topic: StudyTopic, courseSlug: CourseId, page: TopicStudyPage = 'field-guide'): string {
  const root = `/${courseSlug}/topics`;
  return `${root}/${topic.slug}/${page}`;
}

export function p3TopicPath(topic: StudyTopic, page: TopicStudyPage = 'field-guide'): string {
  return topicPath(topic, P3_COURSE_ID, page);
}

export function stripStaticBasePath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return '/';
  if (STUDY_ROUTE_ROOTS.has(segments[0])) return `/${segments.join('/')}`;
  if (segments[1] && STUDY_ROUTE_ROOTS.has(segments[1])) return `/${segments.slice(1).join('/')}`;
  return '/';
}

export function currentStaticBasePath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return '';
  if (STUDY_ROUTE_ROOTS.has(segments[0])) return '';
  return `/${segments[0]}`;
}

export function topicProgressSummary(input: {
  progress: StoredProgress;
  regionProgress?: RegionProgress;
  regionId: string;
  courseId: 'p1' | 'p3';
}): TopicProgressSummary {
  const courseId = input.courseId;
  const fieldGuideTopics = getFieldGuideTopicsForRegion(input.regionId);
  const learnSteps = getLearnStepsForRegion(input.regionId);
  const fieldGuideTotal = Math.max(1, learnSteps.length || fieldGuideTopics.length || 1);
  const learningRecord: RegionLearningRecord | undefined = getCourseRegionLearning(
    input.progress.regionLearning,
    courseId,
    input.regionId,
  );
  const completedTopicCount = fieldGuideTotal
    ? Math.min(fieldGuideTotal, Object.keys(learningRecord?.fieldGuideTopicCompletions ?? {}).length)
    : learningRecord?.fieldGuideCompletedAt ? 1 : 0;
  const normalizedSkillAttempts = normalizeSkillCheckLocalAttempts(input.progress.skillCheckAttempts ?? []);
  const skillPracticeAttempts = normalizedSkillAttempts.filter((attempt: SkillCheckAttemptRecord) => (
    attempt.course === courseId
    && (attempt.regionId === input.regionId || attempt.topic === input.regionId)
    && isStrongSkillCheckEvidenceAttempt(attempt, normalizedSkillAttempts)
  )).length;
  const questionAttempts = input.regionProgress?.attempts ?? input.progress.attempts.filter((attempt) => (
    (attempt.course ?? P3_COURSE_ID) === courseId
    && (attempt.validatedRegionId === input.regionId || attempt.displayRegionId === input.regionId)
  )).length;

  return {
    fieldGuideCompleted: learningRecord?.fieldGuideCompletedAt ? fieldGuideTotal : completedTopicCount,
    fieldGuideTotal,
    fieldGuidePercent: Math.round(((learningRecord?.fieldGuideCompletedAt ? fieldGuideTotal : completedTopicCount) / fieldGuideTotal) * 100),
    skillPracticeAttempts,
    questionAttempts,
    availableQuestions: input.regionProgress?.availableQuestions ?? 0,
    averageScorePercent: typeof input.regionProgress?.averageScoreRatio === 'number'
      ? Math.round(input.regionProgress.averageScoreRatio * 100)
      : undefined,
  };
}
