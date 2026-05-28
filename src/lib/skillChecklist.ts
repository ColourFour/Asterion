import type { FieldGuideTopic } from '../data/fieldGuideTopics';
import { AUTHORED_SKILL_CHECK_ITEMS, type SkillCheckComplexity, type SkillCheckItem } from '../data/skillCheckItems';
import type { GeneratedPracticeItem } from './generatedPractice';
import { orderGeneratedPracticeForFieldGuideTopic } from './generatedPractice';
import type { TeachingSnippet } from './teachingSnippets';
import { normalizeLabel } from './worldMap';

export interface SkillCheckComplexityMeta {
  id: SkillCheckComplexity;
  label: string;
  description: string;
}

export const SKILL_CHECK_COMPLEXITIES: Record<SkillCheckComplexity, SkillCheckComplexityMeta> = {
  foundation: {
    id: 'foundation',
    label: 'Foundation',
    description: 'One main action or direct recall/application.',
  },
  core: {
    id: 'core',
    label: 'Core',
    description: 'Two to three linked solving steps.',
  },
  challenge: {
    id: 'challenge',
    label: 'Challenge',
    description: 'Multi-step, mixed-method, or decision-heavy.',
  },
};

export interface SkillChecklistTopicGroup {
  topic: FieldGuideTopic;
  authoredItems: SkillCheckItem[];
  quickCheckSnippets: TeachingSnippet[];
  guidedPracticeItems: GeneratedPracticeItem[];
  complexityCounts: Record<SkillCheckComplexity, number>;
  fallbackReason?: string;
}

function topicMatchKeys(topic: FieldGuideTopic): Set<string> {
  return new Set([
    topic.id,
    topic.title,
    ...topic.skillIds,
  ].map(normalizeLabel));
}

function snippetMatchKeys(snippet: TeachingSnippet): string[] {
  return [
    snippet.quickCheck?.skillTargetId,
    snippet.quickCheck?.topic,
    snippet.quickCheck?.id,
    ...snippet.topics,
    ...snippet.sourceSkillTargetIds,
    ...snippet.relatedSkillTargetIds,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeLabel);
}

export function teachingSnippetMatchesFieldGuideTopic(snippet: TeachingSnippet, topic: FieldGuideTopic): boolean {
  const accepted = topicMatchKeys(topic);
  return snippetMatchKeys(snippet).some((key) => accepted.has(key));
}

export function quickCheckComplexityForSnippet(snippet: TeachingSnippet): SkillCheckComplexity {
  if (snippet.quickCheck?.answerType === 'ordered_cards' || snippet.quickCheck?.answerType === 'two_value') {
    return 'core';
  }
  return 'foundation';
}

export function guidedPracticeComplexityForItem(item: GeneratedPracticeItem): SkillCheckComplexity {
  if (item.sequenceRole === 'guardian_prep') return 'challenge';
  if (item.sequenceRole === 'complete_step') return 'core';
  return 'foundation';
}

function emptyComplexityCounts(): Record<SkillCheckComplexity, number> {
  return {
    foundation: 0,
    core: 0,
    challenge: 0,
  };
}

export function buildSkillChecklistTopicGroups(input: {
  fieldGuideTopics: FieldGuideTopic[];
  teachingSnippets: TeachingSnippet[];
  practiceItems: GeneratedPracticeItem[];
  skillCheckItems?: SkillCheckItem[];
}): SkillChecklistTopicGroup[] {
  const skillCheckItems = input.skillCheckItems ?? AUTHORED_SKILL_CHECK_ITEMS;
  return input.fieldGuideTopics.map((topic) => {
    const authoredItems = skillCheckItems
      .filter((item) => item.fieldGuideTopicId === topic.id)
      .sort((a, b) => (
        Object.keys(SKILL_CHECK_COMPLEXITIES).indexOf(a.complexity) - Object.keys(SKILL_CHECK_COMPLEXITIES).indexOf(b.complexity)
        || a.itemId.localeCompare(b.itemId)
      ));
    const quickCheckSnippets = input.teachingSnippets.filter((snippet) => (
      Boolean(snippet.quickCheck) && teachingSnippetMatchesFieldGuideTopic(snippet, topic)
    ));
    const topicPractice = orderGeneratedPracticeForFieldGuideTopic(input.practiceItems, topic);
    const guidedPracticeItems = topicPractice.exactMatchCount > 0
      ? topicPractice.items.slice(0, topicPractice.exactMatchCount)
      : [];
    const complexityCounts = emptyComplexityCounts();

    for (const item of authoredItems) {
      complexityCounts[item.complexity] += 1;
    }
    for (const snippet of quickCheckSnippets) {
      complexityCounts[quickCheckComplexityForSnippet(snippet)] += 1;
    }
    for (const item of guidedPracticeItems) {
      complexityCounts[guidedPracticeComplexityForItem(item)] += 1;
    }

    return {
      topic,
      authoredItems,
      quickCheckSnippets,
      guidedPracticeItems,
      complexityCounts,
      fallbackReason: topicPractice.fallbackReason,
    };
  });
}

export function totalSkillChecklistItems(group: SkillChecklistTopicGroup): number {
  return group.authoredItems.length + group.quickCheckSnippets.length + group.guidedPracticeItems.length;
}
