import type { NormalizedQuestion, RegionDefinition } from '../types';
import { isPreciseSkillEvidenceReady } from './masteryEvidenceReadiness';
import { filterQuestionsForRegion } from './worldMap';

function validatedForRegion(question: NormalizedQuestion, region?: RegionDefinition): boolean {
  const validatedRegionId = question.routeEvidence?.validatedRegionId;
  if (!validatedRegionId) return false;
  return region ? validatedRegionId === region.id : true;
}

export function isMasteryEvidenceQuestion(question: NormalizedQuestion, region?: RegionDefinition): boolean {
  return question.eligibility?.masteryEligible.eligible === true && validatedForRegion(question, region) && isPreciseSkillEvidenceReady(question);
}

export function isGuardianCandidateQuestion(question: NormalizedQuestion, region?: RegionDefinition): boolean {
  return question.eligibility?.guardianEligible.eligible === true && validatedForRegion(question, region) && isPreciseSkillEvidenceReady(question);
}

export function filterMasteryEvidenceQuestionsForRegion(
  questions: NormalizedQuestion[],
  region: RegionDefinition,
): NormalizedQuestion[] {
  return questions.filter((question) => isMasteryEvidenceQuestion(question, region));
}

export function filterGuardianCandidateQuestionsForRegion(
  questions: NormalizedQuestion[],
  region: RegionDefinition,
): NormalizedQuestion[] {
  return questions.filter((question) => isGuardianCandidateQuestion(question, region));
}

export function filterPracticeDisplayQuestionsForRegion(
  questions: NormalizedQuestion[],
  region: RegionDefinition,
): NormalizedQuestion[] {
  return filterQuestionsForRegion(questions, region);
}
