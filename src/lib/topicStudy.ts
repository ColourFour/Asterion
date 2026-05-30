import { getFieldGuideTopicsForRegion } from '../data/fieldGuideTopics';
import type { LearningActivityAttempt, RegionDefinition, RegionLearningRecord, RegionProgress, StoredProgress } from '../types';
import { P3_ASTRAL_ACADEMY } from './worldMap';

export type TopicStudyPage = 'hub' | 'field-guide' | 'skill-practice';

export interface StudyTopic {
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
    regionId: 'algebra-forge',
    slug: 'algebra',
    name: 'Algebra',
    shortName: 'Algebra',
    description: 'Manipulate expressions, polynomials, partial fractions, modulus equations, and binomial expansions.',
    headerFormula: 'f(x), \\; P(x), \\; |x|, \\; (1+x)^n',
  },
  {
    regionId: 'logarithm-grove',
    slug: 'logarithms',
    name: 'Logarithms',
    shortName: 'Logs',
    description: 'Work with logarithmic and exponential equations, domain checks, and linearisation.',
    headerFormula: '\\log_a x, \\; e^x, \\; y = ab^x',
  },
  {
    regionId: 'trig-observatory',
    slug: 'trigonometry',
    name: 'Trigonometry',
    shortName: 'Trig',
    description: 'Practise identities, equations on intervals, reciprocal functions, and compound-angle formulae.',
    headerFormula: '\\sin x, \\; \\cos x, \\; \\tan x',
  },
  {
    regionId: 'complex-harbor',
    slug: 'argand',
    name: 'Complex Numbers / Argand Diagrams',
    shortName: 'Argand',
    description: 'Use Cartesian, modulus-argument, locus, polar, and root forms of complex numbers.',
    headerFormula: 'z = x+iy, \\; |z|, \\; \\arg z',
  },
  {
    regionId: 'calculus-cliffs',
    slug: 'calculus',
    name: 'Calculus',
    shortName: 'Calculus',
    description: 'Study differentiation techniques, tangents, normals, stationary points, implicit and parametric forms.',
    headerFormula: '\\frac{dy}{dx}, \\; f^{\\prime}(x), \\; \\frac{dy/dt}{dx/dt}',
  },
  {
    regionId: 'integration-gardens',
    slug: 'integration',
    name: 'Integration',
    shortName: 'Integration',
    description: 'Build fluency with method choice, substitution, parts, partial fractions, areas, and definite integrals.',
    headerFormula: '\\int f(x)\\,dx, \\; \\int_a^b f(x)\\,dx',
  },
  {
    regionId: 'vector-workshop',
    slug: 'vectors',
    name: 'Vectors',
    shortName: 'Vectors',
    description: 'Practise vector notation, 3D lines, intersections, scalar products, angles, and geometry modelling.',
    headerFormula: '\\mathbf{r}=\\mathbf{a}+\\lambda\\mathbf{b}, \\; \\mathbf{a}\\cdot\\mathbf{b}',
  },
  {
    regionId: 'numerical-mines',
    slug: 'iteration',
    name: 'Numerical Methods / Iteration',
    shortName: 'Iteration',
    description: 'Use sign-change arguments, fixed-point iteration, convergence checks, and numerical accuracy.',
    headerFormula: 'x_{n+1}=g(x_n), \\; f(a)f(b)<0',
  },
  {
    regionId: 'differential-shrine',
    slug: 'differential-equations',
    name: 'Differential Equations',
    shortName: 'DEs',
    description: 'Form and solve first-order differential equations, including separation and initial conditions.',
    headerFormula: '\\frac{dy}{dx}=f(x,y), \\; y(x_0)=y_0',
  },
];

const topicsByRegionId = new Map(STUDY_TOPICS.map((topic) => [topic.regionId, topic]));
const topicsBySlug = new Map(STUDY_TOPICS.map((topic) => [topic.slug, topic]));

export const STUDY_ROUTE_ROOTS = new Set([
  'topics',
  'regions',
  'exam-training',
  'student',
  'teacher',
  'admin',
  'dashboard',
  'ui-review',
  'class-hall',
  'classHall',
]);

export function studyTopicForRegionId(regionId: string | undefined): StudyTopic | undefined {
  return regionId ? topicsByRegionId.get(regionId) : undefined;
}

export function studyTopicForSlug(slug: string | undefined): StudyTopic | undefined {
  return slug ? topicsBySlug.get(slug) : undefined;
}

export function regionForStudyTopic(topic: StudyTopic): RegionDefinition | undefined {
  return P3_ASTRAL_ACADEMY.regions.find((region) => region.id === topic.regionId);
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

export function topicPath(topic: StudyTopic, page: TopicStudyPage = 'hub'): string {
  return page === 'hub'
    ? `/topics/${topic.slug}`
    : `/topics/${topic.slug}/${page}`;
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
}): TopicProgressSummary {
  const fieldGuideTopics = getFieldGuideTopicsForRegion(input.regionId);
  const learningRecord: RegionLearningRecord | undefined = input.progress.regionLearning?.[input.regionId];
  const completedTopicCount = fieldGuideTopics.length
    ? Math.min(fieldGuideTopics.length, Object.keys(learningRecord?.fieldGuideTopicCompletions ?? {}).length)
    : learningRecord?.fieldGuideCompletedAt ? 1 : 0;
  const fieldGuideTotal = Math.max(1, fieldGuideTopics.length || 1);
  const skillPracticeAttempts = input.progress.learningActivityAttempts.filter((attempt: LearningActivityAttempt) => (
    attempt.regionId === input.regionId
  )).length;
  const questionAttempts = input.regionProgress?.attempts ?? input.progress.attempts.filter((attempt) => (
    attempt.validatedRegionId === input.regionId || attempt.displayRegionId === input.regionId
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
