import { describe, expect, it } from 'vitest';
import { P3_DIAGNOSTIC_QUESTIONS } from '../src/data/p3DiagnosticGate';
import { P1_REPAIR_LOCK_MESSAGE, P1_REPAIR_SKILL_TAGS } from '../src/data/p1RepairLane';
import {
  p3DiagnosticRecommendationSentence,
  scoreP3DiagnosticSubmission,
  type P3DiagnosticSubmission,
} from '../src/lib/p3DiagnosticGate';

function fullCreditSubmission(): P3DiagnosticSubmission {
  return Object.fromEntries(P3_DIAGNOSTIC_QUESTIONS.map((question) => [
    question.id,
    Object.fromEntries(question.markPoints.map((markPoint) => [
      markPoint.id,
      markPoint.acceptedAnswers[0],
    ])),
  ]));
}

function blankSubmission(): P3DiagnosticSubmission {
  return Object.fromEntries(P3_DIAGNOSTIC_QUESTIONS.map((question) => [
    question.id,
    Object.fromEntries(question.markPoints.map((markPoint) => [markPoint.id, ''])),
  ]));
}

function naturalNotationFullCreditSubmission(): P3DiagnosticSubmission {
  return {
    'p3diag-a01': { 'a01-final': '4*x - 23' },
    'p3diag-a02': { 'a02-final': '( x - 3 )( x - 2 )' },
    'p3diag-a03': { 'a03-final': '(2x)/y' },
    'p3diag-a04': { 'a04-final': 'x = 9' },
    'p3diag-a05': { 'a05-final': 'x=3 and x=2' },
    'p3diag-a06': { 'a06-final': 'f(-2)=5' },
    'p3diag-a07': { 'a07-final': 'x = y/3 - 2/3' },
    'p3diag-a08': {
      'a08-factor': '( x + 3 )( x - 3 )',
      'a08-final': '(x+3)',
    },
    'p3diag-b01': {
      'b01-substitution': 'substitute 2',
      'b01-final': 'remainder = 1',
    },
    'p3diag-b02': {
      'b02-value': 'P(2)=0',
      'b02-conclusion': 'therefore x=2 is a root, so x-2 is a factor',
    },
    'p3diag-b03': { 'b03-final': 'log_a(8*2)' },
    'p3diag-b04': { 'b04-final': 'x = (1/2)ln(5)' },
    'p3diag-b05': { 'b05-final': '1 + sin(x)' },
    'p3diag-b06': { 'b06-final': 'x=5pi/6, x=pi/6' },
    'p3diag-b07': { 'b07-final': "y' = 12*x^3 - 2" },
    'p3diag-b08': { 'b08-final': 'dy/dx = 10(2x+1)^4' },
    'p3diag-c01': {
      'c01-factor': 'sin(x)(2sin(x)-1)',
      'c01-equations': 'sin(x)=1/2 and sin(x)=0',
      'c01-final': 'x=0, x=pi/6, x=5pi/6, x=pi',
    },
    'p3diag-c02': {
      'c02-derivative': "y'=3x^2-3",
      'c02-x-values': 'x=1 and x=-1',
      'c02-points': '(-1, 2) and (1, -2)',
    },
    'p3diag-c03': {
      'c03-inside': 'u = 3x^2 + 1',
      'c03-final': '((3x^2+1)^5)/5 + C',
    },
    'p3diag-c04': {
      'c04-vector': '<3, -2, 2>',
      'c04-magnitude': '4.123',
    },
  };
}

describe('P3 diagnostic gate classifier', () => {
  it('keeps the authored diagnostic within the required fixed-paper shape', () => {
    expect(P3_DIAGNOSTIC_QUESTIONS).toHaveLength(20);
    expect(P3_DIAGNOSTIC_QUESTIONS.map((question) => question.markPoints.length).every((count) => count >= 1 && count <= 3)).toBe(true);
    expect(P3_DIAGNOSTIC_QUESTIONS.filter((question) => question.sectionId === 'algebra_foundation')).toHaveLength(8);
    expect(P3_DIAGNOSTIC_QUESTIONS.filter((question) => question.sectionId === 'p3_transition')).toHaveLength(8);
    expect(P3_DIAGNOSTIC_QUESTIONS.filter((question) => question.sectionId === 'problem_solving')).toHaveLength(4);
    expect(P3_DIAGNOSTIC_QUESTIONS.some((question) => question.id === 'p3diag-c04' && question.title === 'Vector interpretation')).toBe(true);
    expect(P3_DIAGNOSTIC_QUESTIONS.some((question) => question.title.includes('Complex'))).toBe(false);
  });

  it('classifies a fully correct submission as high fluency with accelerated unlocks', () => {
    const scored = scoreP3DiagnosticSubmission(fullCreditSubmission());

    expect(scored.marksEarned).toBe(29);
    expect(scored.marksAvailable).toBe(29);
    expect(scored.report).toEqual({
      total_score: 100,
      section_scores: {
        algebra_foundation: 100,
        p3_transition: 100,
        problem_solving: 100,
      },
      risk_flags: [],
      readiness_level: 'HIGH_FLUENCY',
      recommended_path: 'ACCELERATED_P3_PATH',
      unlock_permissions: {
        field_guide: true,
        skill_checks: true,
        exam_training: true,
        topic_exam_strips: true,
        mocks: false,
      },
      priority_repair_modules: [],
      foundation_repair_skill_tags: [],
    });
    expect(p3DiagnosticRecommendationSentence(scored.report)).toBe('Student should proceed via: ACCELERATED_P3_PATH');
  });

  it('awards full credit for correct diagnostic answers written in common student notation', () => {
    const scored = scoreP3DiagnosticSubmission(naturalNotationFullCreditSubmission());

    expect(scored.markResults.filter((result) => result.awarded === 0)).toEqual([]);
    expect(scored.marksEarned).toBe(29);
    expect(scored.report.total_score).toBe(100);
    expect(scored.report.risk_flags).toEqual([]);
    expect(scored.report.recommended_path).toBe('ACCELERATED_P3_PATH');
  });

  it('classifies adequate algebra and transition performance as standard entry', () => {
    const submission = fullCreditSubmission();
    for (const question of P3_DIAGNOSTIC_QUESTIONS.filter((item) => item.sectionId === 'p3_transition').slice(5)) {
      for (const markPoint of question.markPoints) {
        submission[question.id][markPoint.id] = '';
      }
    }
    for (const question of P3_DIAGNOSTIC_QUESTIONS.filter((item) => item.sectionId === 'problem_solving')) {
      for (const markPoint of question.markPoints) {
        submission[question.id][markPoint.id] = '';
      }
    }

    const report = scoreP3DiagnosticSubmission(submission).report;

    expect(report.section_scores).toEqual({
      algebra_foundation: 100,
      p3_transition: 70,
      problem_solving: 0,
    });
    expect(report.readiness_level).toBe('STANDARD_ENTRY');
    expect(report.recommended_path).toBe('FULL_P3_PATH');
    expect(report.unlock_permissions).toEqual({
      field_guide: true,
      skill_checks: true,
      exam_training: true,
      topic_exam_strips: false,
      mocks: false,
    });
    expect(report.foundation_repair_skill_tags).toEqual([
      'TRIG_BASIC',
      'DIFFERENTIATION_BASIC',
      'INTEGRATION_BASIC',
      'ALGEBRA_MANIPULATION',
    ]);
  });

  it('blocks P3 entry when a critical P1 equation skill fails even if the algebra percentage is high', () => {
    const submission = fullCreditSubmission();
    submission['p3diag-a04']['a04-final'] = '';

    const report = scoreP3DiagnosticSubmission(submission).report;

    expect(report.section_scores.algebra_foundation).toBe(89);
    expect(report.readiness_level).toBe('FOUNDATION_RISK');
    expect(report.recommended_path).toBe('P1_REPAIR_REQUIRED');
    expect(report.unlock_permissions).toEqual({
      field_guide: false,
      skill_checks: false,
      exam_training: false,
      topic_exam_strips: false,
      mocks: false,
    });
    expect(report.lock_message).toBe(P1_REPAIR_LOCK_MESSAGE);
    expect(report.foundation_repair_skill_tags).toEqual([...P1_REPAIR_SKILL_TAGS]);
  });

  it('gives no guess credit for empty answers and produces the weak-skill repair map', () => {
    const scored = scoreP3DiagnosticSubmission(blankSubmission());

    expect(scored.marksEarned).toBe(0);
    expect(scored.report.total_score).toBe(0);
    expect(scored.report.risk_flags).toEqual([
      'ALGEBRA_WEAK',
      'TRIG_WEAK',
      'LOGS_WEAK',
      'DIFF_WEAK',
      'INTEGRATION_WEAK',
      'VECTOR_WEAK',
    ]);
    expect(scored.report.priority_repair_modules).toEqual([
      'Algebra Manipulation',
      'Equation Solving',
      'Trigonometry Basics',
      'Differentiation Basics',
      'Integration Basics',
    ]);
    expect(scored.report.foundation_repair_skill_tags).toEqual([...P1_REPAIR_SKILL_TAGS]);
    expect(scored.report.lock_message).toBe(P1_REPAIR_LOCK_MESSAGE);
  });

  it('does not let high transition or problem-solving performance compensate for weak algebra', () => {
    const submission = fullCreditSubmission();
    for (const question of P3_DIAGNOSTIC_QUESTIONS.filter((item) => item.sectionId === 'algebra_foundation').slice(0, 5)) {
      for (const markPoint of question.markPoints) {
        submission[question.id][markPoint.id] = '';
      }
    }

    const report = scoreP3DiagnosticSubmission(submission).report;

    expect(report.section_scores).toEqual({
      algebra_foundation: 44,
      p3_transition: 100,
      problem_solving: 100,
    });
    expect(report.readiness_level).toBe('FOUNDATION_RISK');
    expect(report.risk_flags).toContain('ALGEBRA_WEAK');
    expect(report.recommended_path).toBe('P1_REPAIR_REQUIRED');
  });
});
