import { createId } from './progressStore';

export const TEACHER_QUESTION_QUEUE_STORAGE_KEY = 'asterion.teacherQuestions.v1';
export const TEACHER_QUESTION_QUEUE_UPDATED_EVENT = 'asterion:teacher-questions-updated';

export type TeacherQuestionStatus = 'open' | 'read' | 'resolved';

export interface SubmitTeacherQuestionInput {
  message: string;
  studentId?: string;
  studentDisplayName?: string;
  classId?: string;
  classCode?: string;
  questionId: string;
  questionLabel?: string;
  paperFamily?: string;
  paper?: string;
  questionNumber?: string;
  regionId?: string;
  regionName?: string;
  topic?: string;
  subtopic?: string;
  practiceMode?: string;
  sourceRoute?: string;
  questionImageRefs?: string[];
  markSchemeImageRefs?: string[];
  selfMarkResult?: string;
  solutionRevealed?: boolean;
  createdAt?: string;
  status?: TeacherQuestionStatus;
}

export interface TeacherQuestion extends Omit<SubmitTeacherQuestionInput, 'message' | 'createdAt' | 'status'> {
  id: string;
  message: string;
  createdAt: string;
  status: TeacherQuestionStatus;
}

function queueStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage;
}

function readTeacherQuestions(): TeacherQuestion[] {
  const storage = queueStorage();
  if (!storage) return [];
  const raw = storage.getItem(TEACHER_QUESTION_QUEUE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is TeacherQuestion => (
      item
      && typeof item.id === 'string'
      && typeof item.message === 'string'
      && typeof item.createdAt === 'string'
      && typeof item.questionId === 'string'
    ));
  } catch {
    return [];
  }
}

function writeTeacherQuestions(items: TeacherQuestion[]) {
  const storage = queueStorage();
  if (!storage) return;
  storage.setItem(TEACHER_QUESTION_QUEUE_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(TEACHER_QUESTION_QUEUE_UPDATED_EVENT));
}

export function submitTeacherQuestion(input: SubmitTeacherQuestionInput): TeacherQuestion {
  const message = input.message.trim();
  if (!message) {
    throw new Error('Teacher question message is required.');
  }

  const question: TeacherQuestion = {
    ...input,
    id: createId('teacher_question'),
    message,
    createdAt: input.createdAt ?? new Date().toISOString(),
    status: input.status ?? 'open',
  };

  writeTeacherQuestions([question, ...readTeacherQuestions()]);
  return question;
}

export function listTeacherQuestionsForClass(classId?: string): TeacherQuestion[] {
  const questions = readTeacherQuestions();
  return classId ? questions.filter((question) => question.classId === classId) : questions;
}

export function clearTeacherQuestionsForTests() {
  queueStorage()?.removeItem(TEACHER_QUESTION_QUEUE_STORAGE_KEY);
}
