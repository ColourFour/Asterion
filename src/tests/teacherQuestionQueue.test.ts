import { afterEach, describe, expect, it } from 'vitest';
import {
  clearTeacherQuestionsForTests,
  listTeacherQuestionsForClass,
  submitTeacherQuestion,
} from '../lib/teacherQuestionQueue';

afterEach(() => {
  clearTeacherQuestionsForTests();
});

describe('teacherQuestionQueue', () => {
  it('creates a teacher question payload with required Exam Training context', () => {
    const question = submitTeacherQuestion({
      message: ' I do not know why this earns M1. ',
      studentId: 'profile-1',
      studentDisplayName: 'Pilot Student',
      classId: 'class-p3-alpha',
      classCode: 'AST-P3A',
      questionId: 'p3_q1',
      questionLabel: 'Question 1',
      paperFamily: 'p3',
      paper: '31autumn21',
      questionNumber: '1',
      regionId: 'algebra-forge',
      regionName: 'Algebra Vault',
      topic: 'Algebra',
      subtopic: 'polynomials',
      practiceMode: 'Core Practice',
      sourceRoute: '/#/regions/algebra-forge/exam-training',
      markSchemeImageRefs: ['p3/31autumn21/mark_scheme/q01.png'],
      solutionRevealed: true,
      createdAt: '2026-05-27T08:00:00.000Z',
    });

    expect(question.message).toBe('I do not know why this earns M1.');
    expect(question.status).toBe('open');
    expect(question.classId).toBe('class-p3-alpha');
    expect(question.questionId).toBe('p3_q1');
    expect(question.practiceMode).toBe('Core Practice');
    expect(question.solutionRevealed).toBe(true);
    expect(listTeacherQuestionsForClass('class-p3-alpha')).toHaveLength(1);
    expect(listTeacherQuestionsForClass('class-p3-beta')).toHaveLength(0);
  });

  it('rejects empty teacher questions', () => {
    expect(() => submitTeacherQuestion({
      message: '   ',
      questionId: 'p3_q1',
    })).toThrow('Teacher question message is required.');
    expect(listTeacherQuestionsForClass()).toHaveLength(0);
  });
});
