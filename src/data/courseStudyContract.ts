import type { CourseId } from './courses';

export const COURSE_SKILL_READINESS = ['ready', 'draft', 'review-only', 'missing'] as const;
export type CourseSkillReadiness = typeof COURSE_SKILL_READINESS[number];

export type CourseSkillEvidenceEligibility = 'strong-checked-practice' | 'manual-practice-only';

export interface CourseSyllabusAuthority {
  syllabusCode: '9709';
  examYears: string;
  version: string;
  title: string;
  url: string;
  updateUrl?: string;
  reviewedAt: string;
  futureCompatibilityNote?: string;
}

export interface CourseStudyRouteAvailability {
  learn: boolean;
  checkedPractice: boolean;
  examTraining: boolean;
  worksheet: boolean;
}

export interface CourseCurriculumConstraints {
  assessmentContext: {
    paperLabel: string;
    durationMinutes: number;
    marks: number;
    structuredQuestionRange: [number, number];
    allQuestionsCompulsory: boolean;
    scientificCalculatorExpected: boolean;
    formulaBooklet: string;
    workingRequirement: string;
  };
  notationRules: string[];
  formulaScope: string[];
  explicitExclusions: string[];
}

export interface CourseStudyTopicDefinition {
  id: string;
  courseId: CourseId;
  slug: string;
  syllabusRef: string;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  headerFormula: string;
  routeAvailability: CourseStudyRouteAvailability;
}

export interface CourseSkillContractEntry {
  id: string;
  courseId: CourseId;
  topicId: string;
  syllabusRef: string;
  title: string;
  syllabusOutcomes: string[];
  needToKnow: string[];
  examTriggers: string[];
  prerequisiteSkillIds: string[];
  readiness: CourseSkillReadiness;
  reviewStatus: 'reviewed' | 'needs-review';
  evidenceEligibility: CourseSkillEvidenceEligibility;
  routeAvailability: CourseStudyRouteAvailability;
}

export interface CourseStudyContract {
  schemaName: 'asterion.course-study-contract';
  schemaVersion: 1;
  courseId: CourseId;
  displayName: string;
  syllabus: CourseSyllabusAuthority;
  curriculumConstraints: CourseCurriculumConstraints;
  topics: CourseStudyTopicDefinition[];
  skills: CourseSkillContractEntry[];
}

export interface CourseStudyContractValidation {
  valid: boolean;
  errors: string[];
}

export function validateCourseStudyContract(contract: CourseStudyContract): CourseStudyContractValidation {
  const errors: string[] = [];
  const topicIds = new Set<string>();
  const topicSlugs = new Set<string>();
  const skillIds = new Set<string>();

  if (!contract.curriculumConstraints.notationRules.length) errors.push('missing course notation rules');
  if (!contract.curriculumConstraints.formulaScope.length) errors.push('missing course formula scope');
  if (!contract.curriculumConstraints.explicitExclusions.length) errors.push('missing course exclusions');
  if (contract.curriculumConstraints.assessmentContext.durationMinutes <= 0) errors.push('invalid assessment duration');
  if (contract.curriculumConstraints.assessmentContext.marks <= 0) errors.push('invalid assessment marks');

  contract.topics.forEach((topic, index) => {
    if (topic.courseId !== contract.courseId) errors.push(`${topic.id}: course mismatch`);
    if (topic.order !== index + 1) errors.push(`${topic.id}: expected order ${index + 1}`);
    if (topicIds.has(topic.id)) errors.push(`${topic.id}: duplicate topic id`);
    if (topicSlugs.has(topic.slug)) errors.push(`${topic.slug}: duplicate topic slug`);
    topicIds.add(topic.id);
    topicSlugs.add(topic.slug);
  });

  for (const skill of contract.skills) {
    if (skill.courseId !== contract.courseId) errors.push(`${skill.id}: course mismatch`);
    if (!topicIds.has(skill.topicId)) errors.push(`${skill.id}: unknown topic ${skill.topicId}`);
    if (skillIds.has(skill.id)) errors.push(`${skill.id}: duplicate skill id`);
    if (skill.readiness === 'ready' && skill.reviewStatus !== 'reviewed') {
      errors.push(`${skill.id}: ready skills must be reviewed`);
    }
    if (!skill.syllabusOutcomes.length) errors.push(`${skill.id}: missing syllabus outcomes`);
    skillIds.add(skill.id);
  }

  for (const skill of contract.skills) {
    for (const prerequisiteId of skill.prerequisiteSkillIds) {
      if (!skillIds.has(prerequisiteId)) errors.push(`${skill.id}: unknown prerequisite ${prerequisiteId}`);
      if (prerequisiteId === skill.id) errors.push(`${skill.id}: self prerequisite`);
    }
  }

  return { valid: errors.length === 0, errors };
}
