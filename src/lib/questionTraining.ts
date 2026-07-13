import type { NormalizedQuestion, RegionDefinition, WorldDefinition } from '../types';
import { filterQuestionsForRegion, isP3Question } from './worldMap';

export function trainingBlockersForQuestion(question: NormalizedQuestion): string[] {
  const blockers = [...(question.trainingBlockers ?? [])];
  if (question.questionImageCandidates.length === 0) blockers.push('Missing question image metadata.');
  if (question.markSchemeImageCandidates.length === 0) blockers.push('Missing mark-scheme image metadata.');
  return Array.from(new Set(blockers.filter(Boolean)));
}

export function isQuestionTrainable(question: NormalizedQuestion): boolean {
  return trainingBlockersForQuestion(question).length === 0;
}

export function filterTrainableQuestions(questions: NormalizedQuestion[]): NormalizedQuestion[] {
  return questions.filter(isQuestionTrainable);
}

export function isTrainableP3Question(question: NormalizedQuestion): boolean {
  return isP3Question(question) && isQuestionTrainable(question);
}

export function filterTrainableQuestionsForRegion(
  questions: NormalizedQuestion[],
  region: RegionDefinition,
  world: WorldDefinition,
): NormalizedQuestion[] {
  return filterQuestionsForRegion(filterTrainableQuestions(questions), region, world);
}
