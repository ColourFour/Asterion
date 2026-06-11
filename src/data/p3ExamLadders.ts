import { P3_SKILL_CONTRACT, type P3SkillId } from './p3SkillContract';

export const P3_EXAM_LADDER_LEVELS = [
  'easy',
  'standard',
  'hard',
  'mixed',
] as const;

export type P3ExamLadderLevel = typeof P3_EXAM_LADDER_LEVELS[number];
export type P3ExamLadderStatus = 'populated' | 'missing';

export interface P3ExamLadderBucket {
  questionIds: string[];
  status: P3ExamLadderStatus;
  note?: string;
}

export interface P3ExamLadder {
  skillId: P3SkillId;
  course: 'p3';
  levels: Record<P3ExamLadderLevel, P3ExamLadderBucket>;
}

export type P3MappedExamQuestionIdsBySkill = Partial<Record<P3SkillId, string[]>>;

function missingBucket(note: string): P3ExamLadderBucket {
  return {
    questionIds: [],
    status: 'missing',
    note,
  };
}

function mixedBucket(questionIds: string[]): P3ExamLadderBucket {
  if (!questionIds.length) {
    return missingBucket('No reviewed trainable mapped exam questions are available for this skill yet.');
  }
  return {
    questionIds,
    status: 'populated',
    note: 'Reviewed trainable mapped exam questions. This bucket does not classify difficulty.',
  };
}

export function buildP3ExamLaddersFromMappedQuestions(
  mappedQuestionIdsBySkill: P3MappedExamQuestionIdsBySkill,
): P3ExamLadder[] {
  return P3_SKILL_CONTRACT.map((skill) => ({
    skillId: skill.id,
    course: 'p3',
    levels: {
      easy: missingBucket('No reviewed easy ladder assignment exists yet.'),
      standard: missingBucket('No reviewed standard ladder assignment exists yet.'),
      hard: missingBucket('No reviewed hard ladder assignment exists yet.'),
      mixed: mixedBucket(mappedQuestionIdsBySkill[skill.id] ?? []),
    },
  }));
}

export const P3_EXAM_LADDER_CONTRACT = buildP3ExamLaddersFromMappedQuestions({});
