import type { PaperFamily, RegionDefinition } from '../types';
import type { FieldGuideTopic } from '../data/fieldGuideTopics';
import {
  CALCULUS_CLIFFS_QUARANTINED_RUNTIME_PRACTICE_IDS,
  DIFFERENTIATION_TOPIC_ORDER,
} from '../data/differentiationContent';
import {
  LOGARITHM_OBSERVATORY_QUARANTINED_GENERATOR_FAMILIES,
  LOG_E_QUARANTINED_RUNTIME_PRACTICE_IDS,
  LOGARITHM_OBSERVATORY_QUARANTINED_SKILL_TARGET_IDS,
} from '../data/logarithmicExponentialContent';
import {
  INTEGRAL_TERRACES_MOVED_TO_ALGEBRA_PRACTICE_IDS,
  INTEGRAL_TERRACES_QUARANTINED_RUNTIME_PRACTICE_IDS,
} from '../data/integrationContent';
import {
  NUMERICAL_SOLUTION_QUARANTINED_RUNTIME_PRACTICE_IDS,
  NUMERICAL_SOLUTION_TOPIC_ORDER,
} from '../data/numericalSolutionContent';
import { staticDataFetchCache } from './loadQuestionBank';
import { isValidP3RegionId, isValidP3SkillId } from './p3SkillContract';
import { findThemeForTopic, topicAliasesForRegion } from './regionThemes';
import { canonicalPaperFamily } from './resolveAssetPath';
import { matchRegionForLabels, normalizeLabel, P3_COURSE_MAP } from './worldMap';

export type GeneratedPracticeReviewStatus = 'candidate' | 'needs_review' | 'teacher_reviewed' | 'published' | 'blocked' | string;

export interface GeneratedPracticeVerification {
  status: 'pass' | 'fail' | string;
  method: 'deterministic' | string;
  verifier: string;
}

export interface GeneratedPracticeItem {
  practiceId: string;
  generatorFamily: string;
  paperFamily: PaperFamily;
  topic: string;
  skillTargetId?: string;
  sourceSnippetId?: string;
  exampleModelId?: string;
  questionType?: string;
  keyMethod?: string;
  examMove?: string;
  snippetIds: string[];
  regionIds: string[];
  prompt: string;
  answer: string;
  workedSolution: string[];
  parameters: Record<string, unknown>;
  sequenceRole?: string;
  verification: GeneratedPracticeVerification;
  // Deprecated legacy metadata. Runtime readiness is review + verification + sequence role.
  difficultyBand?: string;
  reviewStatus: GeneratedPracticeReviewStatus;
}

const GENERATED_PRACTICE_PATH = './data/generated_practice_bank.json';
const RUNTIME_REVIEW_STATUSES = new Set(['teacher_reviewed', 'published']);
const RUNTIME_SEQUENCE_ROLES = new Set(['first_step', 'complete_step', 'challenge_prep']);
const QUARANTINED_RUNTIME_PRACTICE_IDS = new Set<string>(LOG_E_QUARANTINED_RUNTIME_PRACTICE_IDS);
for (const practiceId of INTEGRAL_TERRACES_QUARANTINED_RUNTIME_PRACTICE_IDS) {
  QUARANTINED_RUNTIME_PRACTICE_IDS.add(practiceId);
}
for (const practiceId of NUMERICAL_SOLUTION_QUARANTINED_RUNTIME_PRACTICE_IDS) {
  QUARANTINED_RUNTIME_PRACTICE_IDS.add(practiceId);
}
const QUARANTINED_GENERATOR_FAMILIES = new Set<string>(LOGARITHM_OBSERVATORY_QUARANTINED_GENERATOR_FAMILIES);
const QUARANTINED_SKILL_TARGET_IDS = new Set<string>(LOGARITHM_OBSERVATORY_QUARANTINED_SKILL_TARGET_IDS);
const CALCULUS_FIELD_GUIDE_TOPIC_IDS = new Set<string>(DIFFERENTIATION_TOPIC_ORDER);
const ITERATION_FIELD_GUIDE_TOPIC_IDS = new Set<string>(NUMERICAL_SOLUTION_TOPIC_ORDER);
const CALCULUS_TOPIC_QUARANTINED_RUNTIME_PRACTICE_IDS = new Set<string>(CALCULUS_CLIFFS_QUARANTINED_RUNTIME_PRACTICE_IDS);
const INTEGRAL_PRACTICE_MOVED_TO_ALGEBRA_IDS = new Set<string>(INTEGRAL_TERRACES_MOVED_TO_ALGEBRA_PRACTICE_IDS);
const SEQUENCE_ROLE_ORDER: Record<string, number> = {
  first_step: 0,
  complete_step: 1,
  challenge_prep: 2,
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(stringValue).filter((item): item is string => Boolean(item))));
}

function p3RegionArray(value: unknown): string[] {
  return stringArray(value).filter(isValidP3RegionId);
}

function hasInvalidP3RegionId(value: unknown): boolean {
  return stringArray(value).some((regionId) => !isValidP3RegionId(regionId));
}

function parametersValue(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? {};
}

function verificationValue(value: unknown): GeneratedPracticeVerification | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const status = stringValue(record.status);
  const method = stringValue(record.method);
  const verifier = stringValue(record.verifier);
  return status && method && verifier ? { status, method, verifier } : undefined;
}

function isRuntimeEligible(item: GeneratedPracticeItem): boolean {
  return RUNTIME_REVIEW_STATUSES.has(item.reviewStatus)
    && item.verification.status === 'pass'
    && RUNTIME_SEQUENCE_ROLES.has(item.sequenceRole ?? '')
    && (
      canonicalPaperFamily(String(item.paperFamily)) !== 'p3'
      || isValidP3SkillId(item.skillTargetId)
    );
}

function isRuntimeQuarantined(item: GeneratedPracticeItem): boolean {
  return QUARANTINED_RUNTIME_PRACTICE_IDS.has(item.practiceId)
    || QUARANTINED_GENERATOR_FAMILIES.has(item.generatorFamily)
    || Boolean(item.skillTargetId && QUARANTINED_SKILL_TARGET_IDS.has(item.skillTargetId));
}

function matchesPaperFamily(item: GeneratedPracticeItem, paperFamily?: PaperFamily): boolean {
  return !paperFamily || canonicalPaperFamily(String(item.paperFamily)) === canonicalPaperFamily(String(paperFamily));
}

function matchesTopic(item: GeneratedPracticeItem, topic?: string): boolean {
  if (!topic) return true;
  const topicTheme = findThemeForTopic(topic);
  const acceptedTopics = topicTheme
    ? topicAliasesForRegion(topicTheme.regionId, 'practice').map(normalizeLabel)
    : [normalizeLabel(topic)];
  return acceptedTopics.includes(normalizeLabel(item.topic));
}

function regionById(regionId: string): RegionDefinition | undefined {
  return P3_COURSE_MAP.regions.find((region) => region.id === regionId);
}

function matchesRegion(item: GeneratedPracticeItem, regionId?: string): boolean {
  if (!regionId) return true;
  if (item.regionIds.includes(regionId)) return true;
  const acceptedTopics = topicAliasesForRegion(regionId, 'practice').map(normalizeLabel);
  if (acceptedTopics.includes(normalizeLabel(item.topic))) return true;

  const mappedRegion = matchRegionForLabels([item.topic], P3_COURSE_MAP);
  if (mappedRegion?.id === regionId) return true;

  const region = regionById(regionId);
  if (!region) return false;
  const normalizedTopic = normalizeLabel(item.topic);
  const regionTerms = [region.name, ...region.subtopics, ...region.matchTerms].map(normalizeLabel);
  return regionTerms.some((term) => term === normalizedTopic || term.includes(normalizedTopic) || normalizedTopic.includes(term));
}

function selectedPractice(
  items: GeneratedPracticeItem[],
  selection: { paperFamily?: PaperFamily; topic?: string; skillTargetId?: string; regionId?: string; limit?: number },
): GeneratedPracticeItem[] {
  const selected = reviewedGeneratedPractice(items)
    .filter((item) => matchesPaperFamily(item, selection.paperFamily))
    .filter((item) => matchesTopic(item, selection.topic))
    .filter((item) => !selection.skillTargetId || item.skillTargetId === selection.skillTargetId)
    .filter((item) => matchesRegion(item, selection.regionId))
    .filter((item) => selection.regionId !== 'integration' || !INTEGRAL_PRACTICE_MOVED_TO_ALGEBRA_IDS.has(item.practiceId))
    .sort((a, b) => a.practiceId.localeCompare(b.practiceId));
  return typeof selection.limit === 'number' ? selected.slice(0, selection.limit) : selected;
}

function sequenceOrder(item: GeneratedPracticeItem): number {
  return SEQUENCE_ROLE_ORDER[item.sequenceRole ?? ''] ?? 99;
}

function practiceTopicMatchKeys(item: GeneratedPracticeItem): string[] {
  const topicContractId = stringValue(item.parameters.topic_contract_id);
  return [
    item.generatorFamily,
    item.skillTargetId,
    item.sourceSnippetId,
    item.exampleModelId,
    topicContractId,
    item.topic,
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeLabel);
}

function fieldGuideTopicMatchesPractice(item: GeneratedPracticeItem, topic: FieldGuideTopic): boolean {
  const acceptedSkillIds = new Set(topic.skillIds.map(normalizeLabel));
  return practiceTopicMatchKeys(item).some((value) => acceptedSkillIds.has(value));
}

export interface TopicMatchedGeneratedPractice {
  items: GeneratedPracticeItem[];
  exactMatchCount: number;
  fallbackReason?: string;
}

export function orderGeneratedPracticeForFieldGuideTopic(
  items: GeneratedPracticeItem[],
  topic?: FieldGuideTopic,
): TopicMatchedGeneratedPractice {
  // Guided practice is support-only. Keep the runtime review gate here as a backstop
  // so topic ordering cannot accidentally surface unreviewed generated content.
  const ordered = reviewedGeneratedPractice(items)
    .filter((item) => !topic || !CALCULUS_FIELD_GUIDE_TOPIC_IDS.has(topic.id) || !CALCULUS_TOPIC_QUARANTINED_RUNTIME_PRACTICE_IDS.has(item.practiceId))
    .filter((item) => !topic || !ITERATION_FIELD_GUIDE_TOPIC_IDS.has(topic.id) || item.parameters.topic_contract_id === topic.id)
    .sort((a, b) => (
      sequenceOrder(a) - sequenceOrder(b)
      || a.practiceId.localeCompare(b.practiceId)
    ));
  if (!topic) return { items: ordered, exactMatchCount: 0 };

  const exact: GeneratedPracticeItem[] = [];
  const nearby: GeneratedPracticeItem[] = [];
  for (const item of ordered) {
    (fieldGuideTopicMatchesPractice(item, topic) ? exact : nearby).push(item);
  }
  if (exact.length > 0) return { items: [...exact, ...nearby], exactMatchCount: exact.length };

  return {
    items: ordered,
    exactMatchCount: 0,
    fallbackReason: `We do not have a reviewed guided item for ${topic.title} yet, so this starts with a nearby skill from this region.`,
  };
}

export function normalizeGeneratedPracticeData(data: unknown): GeneratedPracticeItem[] {
  const record = asRecord(data);
  const items = Array.isArray(record?.items) ? record.items : [];
  return items.flatMap((value) => {
    const item = asRecord(value);
    if (!item) return [];

    const practiceId = stringValue(item.practice_id);
    const generatorFamily = stringValue(item.generator_family);
    const paperFamily = stringValue(item.paper_family);
    const topic = stringValue(item.topic);
    const prompt = stringValue(item.prompt);
    const answer = stringValue(item.answer);
    const workedSolution = stringArray(item.worked_solution);
    const verification = verificationValue(item.verification);
    const difficultyBand = stringValue(item.difficulty_band);
    const reviewStatus = stringValue(item.review_status);

    if (!practiceId || !generatorFamily || !paperFamily || !topic || !prompt || !answer || workedSolution.length === 0 || !verification || !reviewStatus || hasInvalidP3RegionId(item.region_ids)) {
      return [];
    }

    return [{
      practiceId,
      generatorFamily,
      paperFamily,
      topic,
      skillTargetId: stringValue(item.skill_target_id),
      sourceSnippetId: stringValue(item.source_snippet_id),
      exampleModelId: stringValue(item.example_model_id),
      questionType: stringValue(item.question_type),
      keyMethod: stringValue(item.key_method),
      examMove: stringValue(item.exam_move),
      snippetIds: stringArray(item.snippet_ids),
      regionIds: p3RegionArray(item.region_ids),
      prompt,
      answer,
      workedSolution,
      parameters: parametersValue(item.parameters),
      sequenceRole: stringValue(item.sequence_role),
      verification,
      difficultyBand,
      reviewStatus,
    }];
  });
}

export function reviewedGeneratedPractice(items: GeneratedPracticeItem[]): GeneratedPracticeItem[] {
  return items.filter((item) => isRuntimeEligible(item) && !isRuntimeQuarantined(item));
}

export function getGeneratedPracticeByTopic(
  items: GeneratedPracticeItem[],
  topic: string,
  paperFamily?: PaperFamily,
  limit?: number,
): GeneratedPracticeItem[] {
  return selectedPractice(items, { topic, paperFamily, limit });
}

export function getGeneratedPracticeByPaperFamily(
  items: GeneratedPracticeItem[],
  paperFamily: PaperFamily,
  limit?: number,
): GeneratedPracticeItem[] {
  return selectedPractice(items, { paperFamily, limit });
}

export function getGeneratedPracticeBySkillTarget(
  items: GeneratedPracticeItem[],
  skillTargetId: string,
  limit?: number,
): GeneratedPracticeItem[] {
  return selectedPractice(items, { skillTargetId, limit });
}

export function getGeneratedPracticeForRegion(
  items: GeneratedPracticeItem[],
  regionId: string,
  paperFamily: PaperFamily = P3_COURSE_MAP.paperFamily,
  limit?: number,
): GeneratedPracticeItem[] {
  return selectedPractice(items, { paperFamily, regionId, limit });
}

export async function loadGeneratedPractice(fetcher: typeof fetch = fetch): Promise<GeneratedPracticeItem[]> {
  const response = await fetcher(GENERATED_PRACTICE_PATH, { cache: staticDataFetchCache() });
  if (!response.ok) throw new Error(`${GENERATED_PRACTICE_PATH} returned ${response.status}`);
  return reviewedGeneratedPractice(normalizeGeneratedPracticeData(await response.json()));
}
