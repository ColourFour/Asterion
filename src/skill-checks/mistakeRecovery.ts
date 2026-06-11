export const SKILL_CHECK_MISTAKE_TAGS = [
  'algebra slip',
  'wrong identity',
  'domain/range issue',
  'notation',
  'calculator',
  'method choice',
  'incomplete reasoning',
  'sign error',
  'coefficient error',
  'forgot constant',
] as const;

export type SkillCheckMistakeTag = typeof SKILL_CHECK_MISTAKE_TAGS[number];

const TARGETED_PROMPTS: Record<SkillCheckMistakeTag, string> = {
  'algebra slip': 'I made an algebra error when...',
  'wrong identity': 'I used the wrong identity because...',
  'domain/range issue': 'I forgot to check the domain when...',
  notation: 'My notation stopped the method from being clear when...',
  calculator: 'My calculator setup was wrong because...',
  'method choice': 'I lost the method mark because...',
  'incomplete reasoning': 'My reasoning was incomplete because...',
  'sign error': 'I made a sign error when...',
  'coefficient error': 'I made a coefficient error when...',
  'forgot constant': 'I forgot the constant when...',
};

export function isSkillCheckMistakeTag(value: string): value is SkillCheckMistakeTag {
  return SKILL_CHECK_MISTAKE_TAGS.includes(value as SkillCheckMistakeTag);
}

export function targetedPromptForMistakeTag(tag: SkillCheckMistakeTag): string {
  return TARGETED_PROMPTS[tag];
}

export function targetedPromptForMistakeTags(tags: string[]): string | undefined {
  const tag = tags.find(isSkillCheckMistakeTag);
  return tag ? targetedPromptForMistakeTag(tag) : undefined;
}
