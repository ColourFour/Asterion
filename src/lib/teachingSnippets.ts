import type { PaperFamily, QuickCheckAnswerType, QuickCheckOption, QuickCheckTwoValueField, RegionDefinition } from '../types';
import {
  LOGARITHM_OBSERVATORY_QUARANTINED_RUNTIME_SNIPPET_IDS,
  LOGARITHM_OBSERVATORY_QUARANTINED_SKILL_TARGET_IDS,
} from '../data/logarithmicExponentialContent';
import { staticDataFetchCache } from './loadQuestionBank';
import { findThemeForTopic, topicAliasesForRegion } from './regionThemes';
import { canonicalPaperFamily } from './resolveAssetPath';
import { matchRegionForLabels, normalizeLabel } from './worldMap';

export type TeachingSnippetReviewStatus = 'needs_review' | 'teacher_reviewed' | 'published' | string;
export type TeachingSnippetSource = 'teacher_authored' | 'template_authored' | string;
export type TeachingSnippetType = 'concept' | 'method' | 'mistake_repair' | 'quick_check' | 'challenge_prep' | string;

export interface TeachingSnippetQuickCheck {
  id?: string;
  regionId?: string;
  topic?: string;
  skillTargetId?: string;
  exampleModelId?: string;
  title?: string;
  prompt: string;
  answer: string;
  explanation: string;
  microSkill?: string;
  difficultyBand?: string;
  estimatedTimeMinutes?: number;
  reviewStatus?: string;
  answerType?: QuickCheckAnswerType;
  expectedAnswer?: string | string[];
  expectedOrder?: string[];
  expectedChoices?: string[];
  options?: QuickCheckOption[];
  orderedCards?: QuickCheckOption[];
  fields?: QuickCheckTwoValueField[];
  displayPrefix?: string;
  displaySuffix?: string;
  tolerance?: number;
  hint?: string;
  workedFirstStep?: string;
}

export interface TeachingSnippetChallengeReadiness {
  supportsTopics: string[];
  recommendedBeforeQuestionIds: string[];
  readinessNote: string;
}

export interface TeachingSnippetWorkedExample {
  id?: string;
  prompt: string;
  steps: string[];
  answer: string;
  teachingNote?: string;
  questionType?: string;
  keyMethod?: string;
  examMove?: string;
  sourceQuestionIds: string[];
  sourceQuestionAssetIds: string[];
  sourceMarkSchemeAssetIds: string[];
}

export interface TeachingSnippet {
  snippetId: string;
  paperFamily: PaperFamily;
  topics: string[];
  regionIds: string[];
  title: string;
  studentGoal: string;
  body: string;
  explanation?: string;
  steps: string[];
  examMove: string;
  commonTrap: string;
  reviewStatus: TeachingSnippetReviewStatus;
  source: TeachingSnippetSource;
  prerequisites: string[];
  microSteps: string[];
  commonMistakes: string[];
  workedExamples: TeachingSnippetWorkedExample[];
  quickCheck?: TeachingSnippetQuickCheck;
  challengeReadiness?: TeachingSnippetChallengeReadiness;
  estimatedTimeMinutes?: number;
  snippetType?: TeachingSnippetType;
  sourceQuestionIds: string[];
  sourceSkillTargetIds: string[];
  relatedSkillTargetIds: string[];
}

interface TeachingSnippetSelection {
  paperFamily?: PaperFamily;
  topic?: string;
  region?: RegionDefinition;
  limit?: number;
}

const TEACHING_SNIPPETS_PATH = './data/teaching_snippets.json';
const RUNTIME_REVIEW_STATUSES = new Set(['teacher_reviewed', 'published']);
const QUARANTINED_RUNTIME_SNIPPET_IDS = new Set<string>(LOGARITHM_OBSERVATORY_QUARANTINED_RUNTIME_SNIPPET_IDS);
const QUARANTINED_SKILL_TARGET_IDS = new Set<string>(LOGARITHM_OBSERVATORY_QUARANTINED_SKILL_TARGET_IDS);

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

function optionArray(value: unknown): QuickCheckOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = asRecord(item);
    const id = stringValue(record?.id);
    const label = stringValue(record?.label);
    return id && label ? [{ id, label }] : [];
  });
}

function twoValueFieldArray(value: unknown): QuickCheckTwoValueField[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = asRecord(item);
    const id = stringValue(record?.id);
    const label = stringValue(record?.label);
    const expectedAnswer = stringValue(record?.expected_answer) ?? stringArray(record?.expected_answers);
    if (!id || !label || (Array.isArray(expectedAnswer) && expectedAnswer.length === 0)) return [];
    return [{
      id,
      label,
      expectedAnswer,
      displayPrefix: stringValue(record?.display_prefix),
      displaySuffix: stringValue(record?.display_suffix),
      tolerance: positiveNumber(record?.tolerance),
    }];
  });
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function answerTypeValue(value: unknown): QuickCheckAnswerType | undefined {
  if (
    value === 'single_value'
    || value === 'ordered_cards'
    || value === 'choice'
    || value === 'multi_choice'
    || value === 'two_value'
  ) {
    return value;
  }
  return undefined;
}

function expectedAnswerValue(record: Record<string, unknown>): string | string[] | undefined {
  return stringValue(record.expected_answer) ?? stringArray(record.expected_answers);
}

function quickCheckValue(value: unknown): TeachingSnippetQuickCheck | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const prompt = stringValue(record.prompt);
  const answer = stringValue(record.answer);
  const explanation = stringValue(record.explanation);
  if (!prompt || !answer || !explanation) return undefined;
  const quickCheck: TeachingSnippetQuickCheck = {
    prompt,
    answer,
    explanation,
  };
  const optionalValues: Array<[keyof TeachingSnippetQuickCheck, string | number | undefined]> = [
    ['id', stringValue(record.id)],
    ['regionId', stringValue(record.region_id)],
    ['topic', stringValue(record.topic)],
    ['skillTargetId', stringValue(record.skill_target_id)],
    ['exampleModelId', stringValue(record.example_model_id)],
    ['title', stringValue(record.title)],
    ['microSkill', stringValue(record.micro_skill)],
    ['difficultyBand', stringValue(record.difficulty_band)],
    ['estimatedTimeMinutes', positiveNumber(record.estimated_time_minutes)],
    ['reviewStatus', stringValue(record.review_status)],
    ['displayPrefix', stringValue(record.display_prefix)],
    ['displaySuffix', stringValue(record.display_suffix)],
    ['hint', stringValue(record.hint)],
    ['workedFirstStep', stringValue(record.worked_first_step)],
  ];
  for (const [key, value] of optionalValues) {
    if (value !== undefined) {
      (quickCheck as Partial<Record<keyof TeachingSnippetQuickCheck, string | number>>)[key] = value;
    }
  }
  const answerType = answerTypeValue(record.answer_type);
  const expectedAnswer = expectedAnswerValue(record);
  const expectedOrder = stringArray(record.expected_order);
  const expectedChoices = stringArray(record.expected_choices);
  const options = optionArray(record.options);
  const orderedCards = optionArray(record.ordered_cards);
  const fields = twoValueFieldArray(record.fields);
  const tolerance = positiveNumber(record.tolerance);
  if (answerType) quickCheck.answerType = answerType;
  if (typeof expectedAnswer === 'string' || (Array.isArray(expectedAnswer) && expectedAnswer.length > 0)) quickCheck.expectedAnswer = expectedAnswer;
  if (expectedOrder.length > 0) quickCheck.expectedOrder = expectedOrder;
  if (expectedChoices.length > 0) quickCheck.expectedChoices = expectedChoices;
  if (options.length > 0) quickCheck.options = options;
  if (orderedCards.length > 0) quickCheck.orderedCards = orderedCards;
  if (fields.length > 0) quickCheck.fields = fields;
  if (tolerance !== undefined) quickCheck.tolerance = tolerance;
  return quickCheck;
}

function challengeReadinessValue(value: unknown): TeachingSnippetChallengeReadiness | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const supportsTopics = stringArray(record.supports_topics);
  const recommendedBeforeQuestionIds = stringArray(record.recommended_before_question_ids);
  const readinessNote = stringValue(record.readiness_note);
  return readinessNote ? { supportsTopics, recommendedBeforeQuestionIds, readinessNote } : undefined;
}

function workedExampleValue(value: unknown): TeachingSnippetWorkedExample | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const prompt = stringValue(record.prompt);
  const steps = stringArray(record.steps);
  const answer = stringValue(record.answer);
  if (!prompt || steps.length === 0 || !answer) return undefined;
  const workedExample: TeachingSnippetWorkedExample = {
    prompt,
    steps,
    answer,
    sourceQuestionIds: stringArray(record.source_question_ids),
    sourceQuestionAssetIds: stringArray(record.source_question_asset_ids),
    sourceMarkSchemeAssetIds: stringArray(record.source_mark_scheme_asset_ids),
  };
  const id = stringValue(record.id);
  const teachingNote = stringValue(record.teaching_note);
  if (id) workedExample.id = id;
  if (teachingNote) workedExample.teachingNote = teachingNote;
  const questionType = stringValue(record.question_type);
  const keyMethod = stringValue(record.key_method);
  const examMove = stringValue(record.exam_move);
  if (questionType) workedExample.questionType = questionType;
  if (keyMethod) workedExample.keyMethod = keyMethod;
  if (examMove) workedExample.examMove = examMove;
  return workedExample;
}

function workedExamplesValue(snippet: Record<string, unknown>): TeachingSnippetWorkedExample[] {
  const examples: TeachingSnippetWorkedExample[] = [];
  const singleExample = workedExampleValue(snippet.worked_example);
  if (singleExample) examples.push(singleExample);
  if (Array.isArray(snippet.worked_examples)) {
    for (const value of snippet.worked_examples) {
      const example = workedExampleValue(value);
      if (example) examples.push(example);
    }
  }
  const seen = new Set<string>();
  return examples.filter((example) => {
    const key = example.id ?? `${example.prompt}\n${example.answer}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesPaperFamily(snippet: TeachingSnippet, paperFamily?: PaperFamily): boolean {
  return !paperFamily || canonicalPaperFamily(String(snippet.paperFamily)) === canonicalPaperFamily(String(paperFamily));
}

function matchesTopic(snippet: TeachingSnippet, topic?: string): boolean {
  if (!topic) return true;
  const normalizedTopic = normalizeLabel(topic);
  const topicTheme = findThemeForTopic(topic);
  const acceptedTopics = topicTheme
    ? topicAliasesForRegion(topicTheme.regionId, 'snippets').map(normalizeLabel)
    : [normalizedTopic];
  return snippet.topics.some((snippetTopic) => acceptedTopics.includes(normalizeLabel(snippetTopic)));
}

function matchesRegion(snippet: TeachingSnippet, region?: RegionDefinition): boolean {
  if (!region) return true;
  if (snippet.regionIds.includes(region.id)) return true;
  const acceptedTopics = topicAliasesForRegion(region, 'snippets').map(normalizeLabel);
  return snippet.topics.some((topic) => {
    if (acceptedTopics.includes(normalizeLabel(topic))) return true;
    const mappedRegion = matchRegionForLabels([topic]);
    if (mappedRegion?.id === region.id) return true;
    const normalizedTopic = normalizeLabel(topic);
    const regionTerms = [region.name, ...region.subtopics, ...region.matchTerms].map(normalizeLabel);
    return regionTerms.some((term) => term === normalizedTopic || term.includes(normalizedTopic) || normalizedTopic.includes(term));
  });
}

export function normalizeTeachingSnippetsData(data: unknown): TeachingSnippet[] {
  const record = asRecord(data);
  const snippets = Array.isArray(record?.snippets) ? record.snippets : [];
  return snippets.flatMap((value) => {
    const snippet = asRecord(value);
    if (!snippet) return [];

    const snippetId = stringValue(snippet.snippet_id);
    const paperFamily = stringValue(snippet.paper_family);
    const topics = stringArray(snippet.topics);
    const title = stringValue(snippet.title);
    const studentGoal = stringValue(snippet.student_goal);
    const body = stringValue(snippet.body);
    const explanation = stringValue(snippet.explanation);
    const steps = stringArray(snippet.steps);
    const examMove = stringValue(snippet.exam_move);
    const commonTrap = stringValue(snippet.common_trap);
    const reviewStatus = stringValue(snippet.review_status);
    const source = stringValue(snippet.source);

    if (!snippetId || !paperFamily || topics.length === 0 || !title || !studentGoal || !body || steps.length === 0 || !examMove || !commonTrap || !reviewStatus || !source) {
      return [];
    }

    return [{
      snippetId,
      paperFamily,
      topics,
      regionIds: stringArray(snippet.region_ids),
      title,
      studentGoal,
      body,
      explanation,
      steps,
      examMove,
      commonTrap,
      reviewStatus,
      source,
      prerequisites: stringArray(snippet.prerequisites),
      microSteps: stringArray(snippet.micro_steps),
      commonMistakes: stringArray(snippet.common_mistakes),
      workedExamples: workedExamplesValue(snippet),
      quickCheck: quickCheckValue(snippet.quick_check),
      challengeReadiness: challengeReadinessValue(snippet.challenge_readiness),
      estimatedTimeMinutes: positiveNumber(snippet.estimated_time_minutes),
      snippetType: stringValue(snippet.snippet_type),
      sourceQuestionIds: stringArray(snippet.source_question_ids),
      sourceSkillTargetIds: stringArray(snippet.source_skill_target_ids),
      relatedSkillTargetIds: stringArray(snippet.related_skill_targets),
    }];
  });
}

export function reviewedTeachingSnippets(snippets: TeachingSnippet[]): TeachingSnippet[] {
  return snippets.filter((snippet) => (
    RUNTIME_REVIEW_STATUSES.has(snippet.reviewStatus)
    && !QUARANTINED_RUNTIME_SNIPPET_IDS.has(snippet.snippetId)
    && !snippet.sourceSkillTargetIds.some((skillTargetId) => QUARANTINED_SKILL_TARGET_IDS.has(skillTargetId))
    && !snippet.relatedSkillTargetIds.some((skillTargetId) => QUARANTINED_SKILL_TARGET_IDS.has(skillTargetId))
    && !(
      snippet.quickCheck?.skillTargetId
      && QUARANTINED_SKILL_TARGET_IDS.has(snippet.quickCheck.skillTargetId)
    )
  ));
}

export function selectTeachingSnippets(snippets: TeachingSnippet[], selection: TeachingSnippetSelection = {}): TeachingSnippet[] {
  const selected = reviewedTeachingSnippets(snippets)
    .filter((snippet) => matchesPaperFamily(snippet, selection.paperFamily))
    .filter((snippet) => matchesTopic(snippet, selection.topic))
    .filter((snippet) => matchesRegion(snippet, selection.region))
    .sort((a, b) => a.snippetId.localeCompare(b.snippetId));
  return typeof selection.limit === 'number' ? selected.slice(0, selection.limit) : selected;
}

export function getTeachingSnippetsByTopic(snippets: TeachingSnippet[], paperFamily: PaperFamily, topic: string, limit?: number): TeachingSnippet[] {
  return selectTeachingSnippets(snippets, { paperFamily, topic, limit });
}

export function getTeachingSnippetsForRegion(snippets: TeachingSnippet[], paperFamily: PaperFamily, region: RegionDefinition, limit?: number): TeachingSnippet[] {
  return selectTeachingSnippets(snippets, { paperFamily, region, limit });
}

export function getSnippetsByTopic(snippets: TeachingSnippet[], paperFamily: PaperFamily, topic: string, limit?: number): TeachingSnippet[] {
  return getTeachingSnippetsByTopic(snippets, paperFamily, topic, limit);
}

export function getSnippetsByRegion(snippets: TeachingSnippet[], paperFamily: PaperFamily, region: RegionDefinition, limit?: number): TeachingSnippet[] {
  return getTeachingSnippetsForRegion(snippets, paperFamily, region, limit);
}

export function getPrerequisiteSnippets(snippets: TeachingSnippet[], selection: TeachingSnippetSelection = {}): TeachingSnippet[] {
  return selectTeachingSnippets(snippets, selection).filter((snippet) => snippet.prerequisites.length > 0);
}

export function getQuickCheckSnippets(snippets: TeachingSnippet[], selection: TeachingSnippetSelection = {}): TeachingSnippet[] {
  return selectTeachingSnippets(snippets, selection).filter((snippet) => Boolean(snippet.quickCheck));
}

export async function loadTeachingSnippets(fetcher: typeof fetch = fetch): Promise<TeachingSnippet[]> {
  const response = await fetcher(TEACHING_SNIPPETS_PATH, { cache: staticDataFetchCache() });
  if (!response.ok) throw new Error(`${TEACHING_SNIPPETS_PATH} returned ${response.status}`);
  return reviewedTeachingSnippets(normalizeTeachingSnippetsData(await response.json()));
}
