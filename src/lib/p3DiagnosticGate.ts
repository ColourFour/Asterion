import {
  P3_DIAGNOSTIC_QUESTIONS,
  P3_DIAGNOSTIC_RISK_FLAGS,
  P3_DIAGNOSTIC_SECTIONS,
  type P3DiagnosticQuestion,
  type P3DiagnosticRecommendedPath,
  type P3DiagnosticReport,
  type P3DiagnosticRiskFlag,
  type P3DiagnosticSectionId,
  type P3DiagnosticUnlockPermissions,
} from '../data/p3DiagnosticGate';
import { P1_REPAIR_LOCK_MESSAGE, P1_REPAIR_MODULES, P1_REPAIR_SKILL_TAGS, type P1RepairSkillTag } from '../data/p1RepairLane';
import { checkSkillCheckAnswer } from '../skill-checks/answerChecker';

export type P3DiagnosticSubmission = Record<string, Record<string, string>>;

export interface P3DiagnosticMarkResult {
  questionId: string;
  markPointId: string;
  sectionId: P3DiagnosticSectionId;
  riskFlags: P3DiagnosticRiskFlag[];
  criticalFoundationSkill?: 'manipulation' | 'equation';
  awarded: 0 | 1;
}

export interface P3DiagnosticScoredSubmission {
  report: P3DiagnosticReport;
  markResults: P3DiagnosticMarkResult[];
  marksEarned: number;
  marksAvailable: number;
}

const REPAIR_MODULES: Record<P3DiagnosticRiskFlag, string> = {
  ALGEBRA_WEAK: 'P1 algebra fluency repair',
  TRIG_WEAK: 'P3 trigonometry transition repair',
  LOGS_WEAK: 'P3 logarithms and exponentials transition repair',
  DIFF_WEAK: 'P3 differentiation basics repair',
  INTEGRATION_WEAK: 'P3 integration recognition repair',
  VECTOR_WEAK: 'P3 vectors interpretation repair',
  COMPLEX_WEAK: 'P3 complex numbers interpretation repair',
};

const RISK_FLAG_REPAIR_TAGS: Record<P3DiagnosticRiskFlag, P1RepairSkillTag[]> = {
  ALGEBRA_WEAK: ['ALGEBRA_MANIPULATION', 'EQUATION_SOLVING'],
  TRIG_WEAK: ['TRIG_BASIC'],
  LOGS_WEAK: ['ALGEBRA_MANIPULATION', 'EQUATION_SOLVING'],
  DIFF_WEAK: ['DIFFERENTIATION_BASIC'],
  INTEGRATION_WEAK: ['INTEGRATION_BASIC'],
  VECTOR_WEAK: ['ALGEBRA_MANIPULATION'],
  COMPLEX_WEAK: ['ALGEBRA_MANIPULATION', 'TRIG_BASIC'],
};

function sectionTotals(questions: P3DiagnosticQuestion[]): Record<P3DiagnosticSectionId, number> {
  return P3_DIAGNOSTIC_SECTIONS.reduce((totals, section) => ({
    ...totals,
    [section.id]: questions
      .filter((question) => question.sectionId === section.id)
      .reduce((sum, question) => sum + question.markPoints.length, 0),
  }), {} as Record<P3DiagnosticSectionId, number>);
}

function percent(earned: number, available: number): number {
  if (available <= 0) return 0;
  return Math.round((earned / available) * 100);
}

function orderedUnique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function foundationRepairSkillTags(
  path: P3DiagnosticRecommendedPath,
  riskFlags: P3DiagnosticRiskFlag[],
): P1RepairSkillTag[] {
  if (path === 'P1_REPAIR_REQUIRED') return [...P1_REPAIR_SKILL_TAGS];
  return orderedUnique(riskFlags.flatMap((flag) => RISK_FLAG_REPAIR_TAGS[flag]));
}

function priorityRepairModules(path: P3DiagnosticRecommendedPath, riskFlags: P3DiagnosticRiskFlag[]): string[] {
  if (path === 'P1_REPAIR_REQUIRED') return P1_REPAIR_MODULES.map((module) => module.title);
  return riskFlags.map((flag) => REPAIR_MODULES[flag]);
}

function riskFlagScores(markResults: P3DiagnosticMarkResult[]): Map<P3DiagnosticRiskFlag, { earned: number; available: number }> {
  const scores = new Map<P3DiagnosticRiskFlag, { earned: number; available: number }>();
  for (const flag of P3_DIAGNOSTIC_RISK_FLAGS) {
    scores.set(flag, { earned: 0, available: 0 });
  }
  for (const result of markResults) {
    for (const flag of result.riskFlags) {
      const current = scores.get(flag) ?? { earned: 0, available: 0 };
      scores.set(flag, {
        earned: current.earned + result.awarded,
        available: current.available + 1,
      });
    }
  }
  return scores;
}

function riskFlagsFor(
  markResults: P3DiagnosticMarkResult[],
  sectionScores: Record<P3DiagnosticSectionId, number>,
): P3DiagnosticRiskFlag[] {
  const scores = riskFlagScores(markResults);
  const flagged = P3_DIAGNOSTIC_RISK_FLAGS.filter((flag) => {
    if (flag === 'ALGEBRA_WEAK' && sectionScores.algebra_foundation < 60) return true;
    const score = scores.get(flag);
    return Boolean(score && score.available > 0 && percent(score.earned, score.available) < 60);
  });
  return orderedUnique(flagged);
}

function failedCriticalFoundation(markResults: P3DiagnosticMarkResult[]): boolean {
  const critical = markResults.filter((result) => result.criticalFoundationSkill);
  return critical.some((result) => result.awarded === 0);
}

function unlockPermissions(path: P3DiagnosticRecommendedPath): P3DiagnosticUnlockPermissions {
  if (path === 'P1_REPAIR_REQUIRED') {
    return {
      field_guide: false,
      skill_checks: false,
      exam_training: false,
      topic_exam_strips: false,
      mocks: false,
    };
  }

  if (path === 'ACCELERATED_P3_PATH') {
    return {
      field_guide: true,
      skill_checks: true,
      exam_training: true,
      topic_exam_strips: true,
      mocks: false,
    };
  }

  return {
    field_guide: true,
    skill_checks: true,
    exam_training: true,
    topic_exam_strips: false,
    mocks: false,
  };
}

export function evaluateDiagnostic(
  submission: P3DiagnosticSubmission,
  questions = P3_DIAGNOSTIC_QUESTIONS,
): P3DiagnosticScoredSubmission {
  return scoreP3DiagnosticSubmission(submission, questions);
}

export function scoreP3DiagnosticSubmission(
  submission: P3DiagnosticSubmission,
  questions = P3_DIAGNOSTIC_QUESTIONS,
): P3DiagnosticScoredSubmission {
  const totals = sectionTotals(questions);
  const sectionEarned = P3_DIAGNOSTIC_SECTIONS.reduce((scores, section) => ({
    ...scores,
    [section.id]: 0,
  }), {} as Record<P3DiagnosticSectionId, number>);

  const markResults = questions.flatMap((question) => (
    question.markPoints.map((markPoint) => {
      const submittedAnswer = submission[question.id]?.[markPoint.id] ?? '';
      const checkResult = checkSkillCheckAnswer({
        spec: {
          answerType: markPoint.answerType,
          acceptedAnswers: markPoint.acceptedAnswers,
          tolerance: markPoint.tolerance,
          orderMatters: markPoint.orderMatters,
        },
        submittedAnswer,
      });
      const awarded = checkResult.isCorrect ? 1 : 0;
      sectionEarned[question.sectionId] += awarded;
      return {
        questionId: question.id,
        markPointId: markPoint.id,
        sectionId: question.sectionId,
        riskFlags: markPoint.riskFlags,
        criticalFoundationSkill: markPoint.criticalFoundationSkill,
        awarded,
      } satisfies P3DiagnosticMarkResult;
    })
  ));

  const section_scores = P3_DIAGNOSTIC_SECTIONS.reduce((scores, section) => ({
    ...scores,
    [section.id]: percent(sectionEarned[section.id], totals[section.id]),
  }), {} as Record<P3DiagnosticSectionId, number>);
  const marksEarned = Object.values(sectionEarned).reduce((sum, score) => sum + score, 0);
  const marksAvailable = Object.values(totals).reduce((sum, total) => sum + total, 0);
  const risk_flags = riskFlagsFor(markResults, section_scores);
  const foundationRisk = section_scores.algebra_foundation < 60 || failedCriticalFoundation(markResults);
  const highFluency = !foundationRisk
    && section_scores.algebra_foundation >= 75
    && section_scores.p3_transition >= 70
    && section_scores.problem_solving >= 60;
  const standardEntry = !foundationRisk
    && section_scores.algebra_foundation >= 60
    && section_scores.p3_transition >= 50;

  const readiness_level = highFluency
    ? 'HIGH_FLUENCY'
    : standardEntry ? 'STANDARD_ENTRY' : 'FOUNDATION_RISK';
  const recommended_path: P3DiagnosticRecommendedPath = readiness_level === 'HIGH_FLUENCY'
    ? 'ACCELERATED_P3_PATH'
    : readiness_level === 'STANDARD_ENTRY' ? 'FULL_P3_PATH' : 'P1_REPAIR_REQUIRED';
  const foundation_repair_skill_tags = foundationRepairSkillTags(recommended_path, risk_flags);

  return {
    report: {
      total_score: percent(marksEarned, marksAvailable),
      section_scores,
      risk_flags,
      readiness_level,
      recommended_path,
      unlock_permissions: unlockPermissions(recommended_path),
      priority_repair_modules: priorityRepairModules(recommended_path, risk_flags),
      foundation_repair_skill_tags,
      ...(recommended_path === 'P1_REPAIR_REQUIRED' ? { lock_message: P1_REPAIR_LOCK_MESSAGE } : {}),
    },
    markResults,
    marksEarned,
    marksAvailable,
  };
}

export function p3DiagnosticRecommendationSentence(report: P3DiagnosticReport): string {
  return `Student should proceed via: ${report.recommended_path}`;
}
