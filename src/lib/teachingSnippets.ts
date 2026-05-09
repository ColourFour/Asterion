import type { PaperFamily, RegionDefinition } from '../types';
import { staticDataFetchCache } from './loadQuestionBank';
import { findThemeForTopic, topicAliasesForRegion } from './regionThemes';
import { canonicalPaperFamily } from './resolveAssetPath';
import { matchRegionForLabels, normalizeLabel } from './worldMap';

export type TeachingSnippetReviewStatus = 'needs_review' | 'teacher_reviewed' | 'published' | string;
export type TeachingSnippetSource = 'teacher_authored' | 'template_authored' | string;
export type TeachingSnippetType = 'concept' | 'method' | 'mistake_repair' | 'quick_check' | string;

export interface TeachingSnippetQuickCheck {
  prompt: string;
  answer: string;
  explanation: string;
}

export interface TeachingSnippetGuardianReadiness {
  supportsTopics: string[];
  recommendedBeforeQuestionIds: string[];
  readinessNote: string;
}

export interface TeachingSnippet {
  snippetId: string;
  paperFamily: PaperFamily;
  topics: string[];
  regionIds: string[];
  title: string;
  studentGoal: string;
  body: string;
  steps: string[];
  examMove: string;
  commonTrap: string;
  reviewStatus: TeachingSnippetReviewStatus;
  source: TeachingSnippetSource;
  prerequisites: string[];
  microSteps: string[];
  commonMistakes: string[];
  quickCheck?: TeachingSnippetQuickCheck;
  guardianReadiness?: TeachingSnippetGuardianReadiness;
  estimatedTimeMinutes?: number;
  snippetType?: TeachingSnippetType;
  sourceQuestionIds: string[];
  sourceSkillTargetIds: string[];
}

interface TeachingSnippetSelection {
  paperFamily?: PaperFamily;
  topic?: string;
  region?: RegionDefinition;
  limit?: number;
}

const TEACHING_SNIPPETS_PATH = './data/teaching_snippets.json';
const RUNTIME_REVIEW_STATUSES = new Set(['teacher_reviewed', 'published']);

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

function positiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function quickCheckValue(value: unknown): TeachingSnippetQuickCheck | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const prompt = stringValue(record.prompt);
  const answer = stringValue(record.answer);
  const explanation = stringValue(record.explanation);
  return prompt && answer && explanation ? { prompt, answer, explanation } : undefined;
}

function guardianReadinessValue(value: unknown): TeachingSnippetGuardianReadiness | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const supportsTopics = stringArray(record.supports_topics);
  const recommendedBeforeQuestionIds = stringArray(record.recommended_before_question_ids);
  const readinessNote = stringValue(record.readiness_note);
  return readinessNote ? { supportsTopics, recommendedBeforeQuestionIds, readinessNote } : undefined;
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
      steps,
      examMove,
      commonTrap,
      reviewStatus,
      source,
      prerequisites: stringArray(snippet.prerequisites),
      microSteps: stringArray(snippet.micro_steps),
      commonMistakes: stringArray(snippet.common_mistakes),
      quickCheck: quickCheckValue(snippet.quick_check),
      guardianReadiness: guardianReadinessValue(snippet.guardian_readiness),
      estimatedTimeMinutes: positiveNumber(snippet.estimated_time_minutes),
      snippetType: stringValue(snippet.snippet_type),
      sourceQuestionIds: stringArray(snippet.source_question_ids),
      sourceSkillTargetIds: stringArray(snippet.source_skill_target_ids),
    }];
  });
}

export function reviewedTeachingSnippets(snippets: TeachingSnippet[]): TeachingSnippet[] {
  return snippets.filter((snippet) => RUNTIME_REVIEW_STATUSES.has(snippet.reviewStatus));
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
