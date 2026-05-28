import { guardianChallengeContractForItem, type GuardianChallengeItem } from '../data/guardianChallengeItems';
import type { QuickCheckCheckResult, QuickCheckResponse } from '../types';
import { checkQuickCheckAnswer } from './quickCheckAnswer';

export function checkGuardianChallengeAnswer(
  item: GuardianChallengeItem,
  response: QuickCheckResponse,
): QuickCheckCheckResult {
  return checkQuickCheckAnswer(guardianChallengeContractForItem(item), response);
}
