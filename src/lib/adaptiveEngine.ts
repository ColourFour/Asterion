import type { Attempt, NormalizedQuestion, TopicProfile } from '../types';

export type PracticeMode = 'start' | 'target_topic' | 'weak_areas';

export interface SelectionContext {
  mode: PracticeMode;
  targetTopic?: string;
  attempts: Attempt[];
  topicProfiles: Record<string, TopicProfile>;
  currentQuestionId?: string;
}

function difficultyWeight(difficulty?: string): number {
  const lower = difficulty?.toLowerCase() ?? '';
  if (lower.includes('challenge') || lower.includes('hard') || lower.includes('stretch')) return 3;
  if (lower.includes('easy') || lower.includes('foundation')) return 1;
  return 2;
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
  if (questions.length === 0) return undefined;
  const recentIds = recentQuestionIds(context.attempts);
  const lastAttempt = context.attempts[context.attempts.length - 1];
  const lastRatio = lastAttempt?.scoreRatio;
  const spiralTopic = context.attempts.length > 0 && context.attempts.length % 5 === 0 ? weakestTopic(context.topicProfiles) : undefined;

  const desiredTopic =
    context.mode === 'target_topic'
      ? context.targetTopic
      : context.mode === 'weak_areas'
        ? weakestTopic(context.topicProfiles) ?? context.targetTopic
        : spiralTopic ?? (typeof lastRatio === 'number' && lastRatio >= 0.35 && lastRatio < 0.85 ? lastAttempt?.topicDisplayName : undefined);

  const desiredDifficulty =
    typeof lastRatio !== 'number' ? 2 : lastRatio >= 0.85 ? 3 : lastRatio < 0.45 ? 1 : 2;

  const scored = questions.map((question) => {
    let score = 0;
    if (question.id === context.currentQuestionId) score -= 100;
    if (recentIds.has(question.id)) score -= 35;
    if (desiredTopic && question.displayTopic === desiredTopic) score += 45;
    if (!desiredTopic) score += 5;
    score -= Math.abs(difficultyWeight(question.displayDifficulty) - desiredDifficulty) * 8;
    if ((question.marksAvailable ?? 0) <= 5 && desiredDifficulty === 1) score += 8;
    if ((question.marksAvailable ?? 0) >= 8 && desiredDifficulty === 3) score += 8;
    return { question, score };
  });

  return scored.sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id))[0]?.question;
}
