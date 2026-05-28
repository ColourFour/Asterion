import { describe, expect, it } from 'vitest';
import type { FieldGuideTopic } from '../data/fieldGuideTopics';
import { getFieldGuideTopicsForRegion } from '../data/fieldGuideTopics';
import { AUTHORED_SKILL_CHECK_ITEMS, skillCheckContractForItem, validateSkillCheckItemContract } from '../data/skillCheckItems';
import type { GeneratedPracticeItem } from '../lib/generatedPractice';
import {
  buildSkillChecklistTopicGroups,
  totalSkillChecklistItems,
} from '../lib/skillChecklist';
import { isValidP3RegionId, isValidP3SkillId } from '../lib/p3SkillContract';
import { checkQuickCheckAnswer } from '../lib/quickCheckAnswer';
import type { QuickCheckResponse } from '../types';
import type { TeachingSnippet } from '../lib/teachingSnippets';

const logLawsTopic: FieldGuideTopic = {
  id: 'log_laws',
  marker: 'law',
  title: 'Laws of Logarithms',
  purpose: 'Use product, quotient, and power laws without inventing false laws.',
  skillIds: ['log_laws'],
  preview: '$$ \\log(ab)=\\log a+\\log b $$',
  description: 'Log laws work because logarithms record exponents.',
  examples: [],
};

const logEquationsTopic: FieldGuideTopic = {
  id: 'log_equations_inequalities',
  marker: 'log',
  title: 'Log Equations and Inequalities',
  purpose: 'Solve with log laws, then reject values outside the original domain.',
  skillIds: ['log_equations_inequalities'],
  preview: '$$ \\ln(x-2)+\\ln(x+1)=\\ln10 $$',
  description: 'Every logarithm input must be positive.',
  examples: [],
};

function snippet(overrides: Partial<TeachingSnippet> = {}): TeachingSnippet {
  return {
    snippetId: 'snippet-log-laws',
    paperFamily: 'p3',
    topics: ['log_laws'],
    regionIds: ['logarithm-grove'],
    title: 'Log laws',
    studentGoal: 'Combine logs safely.',
    body: 'Use only valid laws.',
    steps: [],
    examMove: 'Combine logs.',
    commonTrap: 'Splitting sums.',
    reviewStatus: 'teacher_reviewed',
    source: 'teacher_authored',
    prerequisites: [],
    microSteps: [],
    commonMistakes: [],
    workedExamples: [],
    quickCheck: {
      prompt: 'Choose the valid log law.',
      answer: 'product',
      explanation: 'Products become sums.',
      topic: 'log_laws',
      skillTargetId: 'log_laws',
      answerType: 'choice',
    },
    sourceQuestionIds: [],
    sourceSkillTargetIds: [],
    relatedSkillTargetIds: ['log_laws'],
    ...overrides,
  };
}

function practice(practiceId: string, sequenceRole: GeneratedPracticeItem['sequenceRole'], topicContractId: string): GeneratedPracticeItem {
  return {
    practiceId,
    generatorFamily: `logarithms_and_exponentials.${practiceId}`,
    paperFamily: 'p3',
    topic: 'logarithms_and_exponentials',
    skillTargetId: 'p3_log_laws_equations',
    sourceSnippetId: 'snippet-log-laws',
    exampleModelId: 'snippet-log-laws-example',
    questionType: 'Logarithm equation',
    keyMethod: 'Use a valid law first.',
    examMove: 'Combine before solving.',
    snippetIds: ['snippet-log-laws'],
    regionIds: ['logarithm-grove'],
    prompt: 'Combine the logarithms.',
    answer: 'x = 4',
    workedSolution: ['Use the product law.'],
    parameters: { topic_contract_id: topicContractId },
    sequenceRole,
    verification: { status: 'pass', method: 'deterministic', verifier: 'test' },
    reviewStatus: 'teacher_reviewed',
  };
}

describe('Skill Checklist grouping', () => {
  it('organizes support items by Field Guide topic before solving complexity', () => {
    const groups = buildSkillChecklistTopicGroups({
      fieldGuideTopics: [logLawsTopic, logEquationsTopic],
      teachingSnippets: [
        snippet(),
        snippet({
          snippetId: 'snippet-log-equations',
          topics: ['log_equations_inequalities'],
          quickCheck: {
            prompt: 'Order the solving moves.',
            answer: 'domain, combine, solve, reject',
            explanation: 'Domain comes first.',
            topic: 'log_equations_inequalities',
            skillTargetId: 'log_equations_inequalities',
            answerType: 'ordered_cards',
          },
          relatedSkillTargetIds: ['log_equations_inequalities'],
        }),
      ],
      practiceItems: [
        practice('foundation-item', 'first_step', 'log_laws'),
        practice('core-item', 'complete_step', 'log_laws'),
        practice('challenge-item', 'guardian_prep', 'log_equations_inequalities'),
      ],
      skillCheckItems: [],
    });

    const logLaws = groups.find((group) => group.topic.id === 'log_laws')!;
    const logEquations = groups.find((group) => group.topic.id === 'log_equations_inequalities')!;

    expect(logLaws.quickCheckSnippets.map((item) => item.snippetId)).toEqual(['snippet-log-laws']);
    expect(logLaws.guidedPracticeItems.map((item) => item.practiceId)).toEqual(['foundation-item', 'core-item']);
    expect(logLaws.complexityCounts).toEqual({ foundation: 2, core: 1, challenge: 0 });
    expect(totalSkillChecklistItems(logLaws)).toBe(3);

    expect(logEquations.quickCheckSnippets.map((item) => item.snippetId)).toEqual(['snippet-log-equations']);
    expect(logEquations.guidedPracticeItems.map((item) => item.practiceId)).toEqual(['challenge-item']);
    expect(logEquations.complexityCounts).toEqual({ foundation: 0, core: 1, challenge: 1 });
    expect(totalSkillChecklistItems(logEquations)).toBe(2);
  });

  it('documents weak mappings without duplicating fallback practice across Field Guide topics', () => {
    const groups = buildSkillChecklistTopicGroups({
      fieldGuideTopics: [logLawsTopic],
      teachingSnippets: [],
      practiceItems: [practice('unmapped-item', 'first_step', 'different_topic')],
      skillCheckItems: [],
    });

    expect(groups[0].guidedPracticeItems).toEqual([]);
    expect(groups[0].fallbackReason).toContain('We do not have a reviewed guided item for Laws of Logarithms yet');
    expect(groups[0].complexityCounts).toEqual({ foundation: 0, core: 0, challenge: 0 });
  });

  it('covers every Algebra Vault and Logarithm Observatory Field Guide subtopic with at least 3 authored items', () => {
    for (const regionId of ['algebra-forge', 'logarithm-grove']) {
      const groups = buildSkillChecklistTopicGroups({
        fieldGuideTopics: getFieldGuideTopicsForRegion(regionId),
        teachingSnippets: [],
        practiceItems: [],
      });

      expect(groups.length, regionId).toBeGreaterThan(0);
      for (const group of groups) {
        expect(group.authoredItems.length, `${regionId}:${group.topic.id}`).toBeGreaterThanOrEqual(3);
        expect(group.authoredItems.map((item) => item.complexity).sort()).toEqual(['challenge', 'core', 'foundation']);
      }
    }
  });

  it('keeps authored item mappings on the Field Guide topic taxonomy', () => {
    const allowedTopics = new Set([
      ...getFieldGuideTopicsForRegion('algebra-forge').map((topic) => topic.id),
      ...getFieldGuideTopicsForRegion('logarithm-grove').map((topic) => topic.id),
    ]);

    for (const item of AUTHORED_SKILL_CHECK_ITEMS) {
      expect(item.fieldGuideSubtopicId).toBe(item.fieldGuideTopicId);
      expect(allowedTopics.has(item.fieldGuideTopicId), item.itemId).toBe(true);
      expect(isValidP3RegionId(item.regionId), item.itemId).toBe(true);
      expect(isValidP3SkillId(item.skillId), item.itemId).toBe(true);
      expect(item.validationMode, item.itemId).toBe('deterministic');
      expect(item.review.affectsMastery, item.itemId).toBe(false);
    }
  });

  it('passes the authored Skill Check item contract validator with unique stable IDs', () => {
    const ids = new Set<string>();

    for (const item of AUTHORED_SKILL_CHECK_ITEMS) {
      expect(ids.has(item.itemId), item.itemId).toBe(false);
      ids.add(item.itemId);
      expect(validateSkillCheckItemContract(item), item.itemId).toEqual([]);
    }
  });

  it('validates deterministic authored input types with explicit answers', () => {
    const representativeResponses: Record<string, QuickCheckResponse> = {
      'sc-alg-modulus-foundation-001': { selectedChoiceId: 'both-roots' },
      'sc-alg-modulus-core-001': { selectedChoiceIds: ['one', 'minus-half'] },
      'sc-alg-polynomial-division-challenge-001': { values: { quotient: 'x^2-x+3', remainder: '4' } },
      'sc-log-natural-challenge-001': { orderedIds: ['divide-two', 'take-ln', 'subtract-one'] },
      'sc-log-linearisation-core-001': { values: { gradient: '3', intercept: '2' } },
    };

    for (const [itemId, response] of Object.entries(representativeResponses)) {
      const item = AUTHORED_SKILL_CHECK_ITEMS.find((candidate) => candidate.itemId === itemId);
      expect(item, itemId).toBeTruthy();
      const contract = skillCheckContractForItem(item!);
      expect(checkQuickCheckAnswer(contract, response).status, itemId).toBe('correct');
    }
  });

  it('does not leak raw Content Lab candidates into authored student-runtime Skill Check items', () => {
    for (const item of AUTHORED_SKILL_CHECK_ITEMS) {
      expect(item.sourceTypes, item.itemId).not.toContain('runtime-safe candidate');
      expect(item.sourceRefs.contentLabCandidateIds ?? [], item.itemId).toEqual([]);
    }
  });
});
