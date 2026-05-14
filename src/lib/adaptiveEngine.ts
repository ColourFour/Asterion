import type { Attempt, NormalizedQuestion, TopicProfile } from '../types';
import { filterTrainableQuestions } from './questionTraining';

export type PracticeMode = 'start' | 'target_topic' | 'weak_areas';

export interface SelectionContext {
  mode: PracticeMode;
  targetTopic?: string;
  attempts: Attempt[];
  topicProfiles: Record<string, TopicProfile>;
  currentQuestionId?: string;
}

function recentQuestionIds(attempts: Attempt[], limit = 6): Set<string> {
  return new Set(attempts.slice(-limit).map((attempt) => attempt.questionId));
}

function weakestTopic(topicProfiles: Record<string, TopicProfile>): string | undefined {
  return Object.values(topicProfiles)
    .filter((profile) => profile.attempts > 0)
    .sort((a, b) => a.masteryScore - b.masteryScore)[0]?.topic;
}

export function selectNextQuestion(questions: NormalizedQuestion[], context: SelectionContext): NormalizedQuestion | undefined {
  const trainableQuestions = filterTrainableQuestions(questions);
  if (trainableQuestions.length === 0) return undefined;
  const recentIds = recentQuestionIds(context.attempts);
  const lastAttempt = context.attempts[context.attempts.length - 1];
  const spiralTopic = context.attempts.length > 0 && context.attempts.length % 5 === 0 ? weakestTopic(context.topicProfiles) : undefined;

  const desiredTopic =
    context.mode === 'target_topic'
      ? context.targetTopic
      : context.mode === 'weak_areas'
        ? weakestTopic(context.topicProfiles) ?? context.targetTopic
        : spiralTopic ?? lastAttempt?.topicDisplayName;

  const scored = trainableQuestions.map((question) => {
    let score = 0;
    if (question.id === context.currentQuestionId) score -= 100;
    if (recentIds.has(question.id)) score -= 35;
    if (desiredTopic && question.displayTopic === desiredTopic) score += 45;
    if (!desiredTopic) score += 5;
    return { question, score };
  });

  return scored.sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id))[0]?.question;
}
