import { describe, expect, it } from 'vitest';
import { COURSES, getCourseById } from '../data/courses';
import { getSeedTopicBySlug } from '../data/courseSeedContent';
import {
  courseExamPaperFamilies,
  filterCourseExamQuestions,
  filterCourseTopicExamQuestions,
  readableRoutingTopicLabel,
  seedTopicForCourseQuestion,
  topicRoutingIdsForSeedTopic,
} from '../lib/courseExamTraining';
import type { NormalizedQuestion, PaperFamily } from '../types';

function question(id: string, paperFamily: PaperFamily, primaryTopicId?: string): NormalizedQuestion {
  return {
    id,
    paperFamily,
    displayTopic: 'Unclassified',
    deepseek: { hasError: false },
    topicRouting: primaryTopicId ? {
      primaryTopicId,
      topicDistribution: [{ topicId: primaryTopicId, fitPercent: 100 }],
      recordSource: 'topic-routing-sidecar',
    } : undefined,
    questionImageCandidates: [['/assets/exam-bank-data/p1/demo/questions/q01.png']],
    markSchemeImageCandidates: [['/assets/exam-bank-data/p1/demo/mark_scheme/q01.png']],
    questionImageRawPaths: [],
    markSchemeImageRawPaths: [],
    questionImagePaths: [],
    markSchemeImagePaths: [],
    questionImageUrls: ['/assets/exam-bank-data/p1/demo/questions/q01.png'],
    markSchemeImageUrls: ['/assets/exam-bank-data/p1/demo/mark_scheme/q01.png'],
    raw: { local: {} },
  };
}

describe('course Exam Training routing helpers', () => {
  it('keeps course paper-family mapping centralized', () => {
    expect(Object.fromEntries(COURSES.map((course) => [course.id, courseExamPaperFamilies(course)]))).toEqual({
      p1: ['p1'],
      p3: ['p3'],
      m1: ['p4'],
      s1: ['p5'],
    });
  });

  it('filters catalog questions by course paper family', () => {
    const questions = [
      question('p1_q1', 'p1'),
      question('p3_q1', 'p3'),
      question('m1_q1', 'p4'),
      question('s1_q1', 'p5'),
    ];

    expect(filterCourseExamQuestions(questions, getCourseById('m1')!).map((item) => item.id)).toEqual(['m1_q1']);
    expect(filterCourseExamQuestions(questions, getCourseById('s1')!).map((item) => item.id)).toEqual(['s1_q1']);
  });

  it('maps rough non-P3 topic routing ids to seed topics without making them mastery evidence', () => {
    const p1 = getCourseById('p1')!;
    const quadratics = getSeedTopicBySlug('p1', 'quadratics')!;
    const m1 = getCourseById('m1')!;
    const newtonConstant = getSeedTopicBySlug('m1', 'newtons-laws-constant-acceleration')!;
    const newtonVariable = getSeedTopicBySlug('m1', 'newtons-laws-variable-acceleration')!;
    const p1Question = question('p1_quadratics', 'p1', '9709_p1_topic_quadratics');
    const m1Question = question('m1_newton', 'p4', '9709_m1_topic_newtons_laws_of_motion');

    expect(topicRoutingIdsForSeedTopic(quadratics)).toContain('9709_p1_topic_quadratics');
    expect(filterCourseTopicExamQuestions([p1Question, m1Question], p1, quadratics).map((item) => item.id)).toEqual(['p1_quadratics']);
    expect(filterCourseTopicExamQuestions([m1Question], m1, newtonConstant).map((item) => item.id)).toEqual(['m1_newton']);
    expect(filterCourseTopicExamQuestions([m1Question], m1, newtonVariable).map((item) => item.id)).toEqual(['m1_newton']);
    expect(seedTopicForCourseQuestion(p1, p1Question)?.slug).toBe('quadratics');
    expect(readableRoutingTopicLabel(m1Question)).toBe('Newtons Laws Of Motion');
  });
});
