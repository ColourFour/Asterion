import { describe, expect, it } from 'vitest';
import {
  AUTHORED_GUARDIAN_CHALLENGE_ITEMS,
  getGuardianChallengeItemsForRegion,
  guardianChallengeContractForItem,
  validateGuardianChallengeItemContract,
} from '../data/guardianChallengeItems';
import { getFieldGuideTopicsForRegion } from '../data/fieldGuideTopics';
import { checkGuardianChallengeAnswer } from '../lib/guardianChallengeValidation';
import type { GuardianChallengeItem } from '../data/guardianChallengeItems';
import type { QuickCheckResponse } from '../types';

const allowedInputTypes = new Set(['numeric', 'multiple_choice', 'checkbox', 'two_value']);

function correctResponse(item: GuardianChallengeItem): QuickCheckResponse {
  if (item.inputType === 'numeric') {
    const expected = Array.isArray(item.expectedAnswer) ? item.expectedAnswer[0] : item.expectedAnswer;
    return { value: expected };
  }
  if (item.inputType === 'two_value') {
    return {
      values: Object.fromEntries((item.fields ?? []).map((field) => [
        field.id,
        Array.isArray(field.expectedAnswer) ? field.expectedAnswer[0] : field.expectedAnswer,
      ])),
    };
  }
  if (item.inputType === 'checkbox') return { selectedChoiceIds: item.expectedOptionIds };
  return { selectedChoiceId: item.expectedOptionIds?.[0] };
}

describe('Guardian challenge item contracts', () => {
  it('keeps Algebra Vault Guardian items on the pre-existing challenge subtopics', () => {
    const challengeTopicIds = [
      'algebra_modulus_graph_equations',
      'algebra_polynomial_division',
      'algebra_remainder_factor_theorem',
      'algebra_partial_fractions',
      'algebra_binomial_expansion',
    ];
    const topics = getFieldGuideTopicsForRegion('algebra-forge')
      .filter((topic) => challengeTopicIds.includes(topic.id));
    const items = getGuardianChallengeItemsForRegion('algebra-forge');

    expect(items.map((item) => item.fieldGuideTopicId).sort()).toEqual(topics.map((topic) => topic.id).sort());
  });

  it('has one Logarithm Observatory Guardian item per Field Guide subtopic', () => {
    const topics = getFieldGuideTopicsForRegion('logarithm-grove');
    const items = getGuardianChallengeItemsForRegion('logarithm-grove');

    expect(items.map((item) => item.fieldGuideTopicId).sort()).toEqual(topics.map((topic) => topic.id).sort());
  });

  it('uses valid deterministic bounded contracts and stays support-only', () => {
    const ids = new Set<string>();

    for (const item of AUTHORED_GUARDIAN_CHALLENGE_ITEMS) {
      expect(ids.has(item.itemId)).toBe(false);
      ids.add(item.itemId);
      expect(validateGuardianChallengeItemContract(item)).toEqual([]);
      expect(allowedInputTypes.has(item.inputType)).toBe(true);
      expect(item.validationMode).toBe('deterministic');
      expect(item.review.affectsMastery).toBe(false);
      expect(item.sourceRefs.contentLabCandidateIds).toBeUndefined();
      expect(item.prompt.toLowerCase()).not.toContain('.png');
      expect(item.prompt.toLowerCase()).not.toContain('question image');
      expect(guardianChallengeContractForItem(item).prompt).toBe(item.prompt);
    }
  });

  it('deterministically validates every authored Guardian final answer', () => {
    for (const item of AUTHORED_GUARDIAN_CHALLENGE_ITEMS) {
      expect(checkGuardianChallengeAnswer(item, {})).toMatchObject({ status: 'empty' });
      expect(checkGuardianChallengeAnswer(item, correctResponse(item))).toMatchObject({ status: 'correct' });
    }
  });
});
