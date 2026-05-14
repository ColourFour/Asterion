import type { NormalizedQuestion, QuestionBankDiagnostics, RegionProgress } from '../types';
import { isQuestionTrainable, trainingBlockersForQuestion } from './questionTraining';
import { isP3Question, labelsForQuestion, matchRegionForQuestion } from './worldMap';

export interface DataHealthSummary {
  mainUrl?: string;
  mainSchemaName?: string;
  mainRecordCount?: number;
  mainQuestionsLength: number;
  mainAppearsPlaceholder: boolean;
  sidecarUrl?: string;
  sidecarSchemaName?: string;
  sidecarRecordCount?: number;
  sidecarAppearsPlaceholder: boolean;
  routingUrl?: string;
  routingSchemaName?: string;
  routingRecordCount?: number;
  routingMappedCount?: number;
  routingAppearsPlaceholder: boolean;
  totalQuestionsLoaded: number;
  totalP3Questions: number;
  trainableP3Questions: number;
  p3QuestionsBlockedFromPractice: number;
  p3QuestionsWithQuestionImageMetadata: number;
  p3QuestionsWithMarkSchemeImageMetadata: number;
  p3QuestionImageGroupsChecked?: number;
  p3QuestionImageGroupsAvailable?: number;
  p3MarkSchemeImageGroupsChecked?: number;
  p3MarkSchemeImageGroupsAvailable?: number;
  p3QuestionsByRegion: Record<string, number>;
  unmatchedP3Questions: number;
  unmatchedLabelExamples: string[];
  rawQuestionPathExamples: string[];
  rawMarkSchemePathExamples: string[];
  candidateQuestionUrlExamples: string[];
  candidateMarkSchemeUrlExamples: string[];
  resolvedImageExamples: Array<{ id: string; question?: string; markScheme?: string }>;
  missingImagePathExamples: Array<{ id: string; missing: 'question' | 'mark_scheme'; labels: string }>;
  missingAssetAvailabilityExamples: Array<{ id: string; paper?: string; questionNumber?: string; missing: 'question' | 'mark_scheme'; candidates: string[] }>;
  practiceBlockedExamples: Array<{ id: string; blockers: string[]; labels: string }>;
  imageRootMode: 'exam-bank-data layout' | 'public/assets root layout' | 'family-folder layout' | 'paper-only layout' | 'unknown';
  sidecarEnrichmentCount: number;
  sidecarMergeCount: number;
  sidecarErrorCount: number;
  hardFailedTextCount: number;
  reviewUsableTextCount: number;
}

export interface AssetAvailabilityAudit {
  checkedQuestions: number;
  questionImageGroups: number;
  markSchemeImageGroups: number;
  missingQuestionImageGroups: number;
  missingMarkSchemeImageGroups: number;
  missingExamples: Array<{
    id: string;
    paper?: string;
    questionNumber?: string;
    missing: 'question' | 'mark_scheme';
    candidates: string[];
  }>;
}

export type CandidateAvailabilityChecker = (candidateUrl: string) => boolean | Promise<boolean>;

function imageRootModeForUrl(url: string): DataHealthSummary['imageRootMode'] {
  if (/^\/assets\/exam-bank(?:%20|[ -])data\/p[1345]\//i.test(url)) return 'exam-bank-data layout';
  if (/^\/assets\/questions\/p[1345]\//i.test(url)) return 'family-folder layout';
  if (/^\/assets\/questions\//i.test(url)) return 'paper-only layout';
  if (/^\/assets\//i.test(url)) return 'public/assets root layout';
  return 'unknown';
}

function detectImageRootMode(questions: NormalizedQuestion[]): DataHealthSummary['imageRootMode'] {
  const firstCandidates = questions.flatMap((question) => [
    ...question.questionImageCandidates.map((group) => group[0]),
    ...question.markSchemeImageCandidates.map((group) => group[0]),
  ]).filter(Boolean);

  const counts = firstCandidates.reduce<Record<DataHealthSummary['imageRootMode'], number>>((acc, url) => {
    const mode = imageRootModeForUrl(url);
    acc[mode] += 1;
    return acc;
  }, {
    'exam-bank-data layout': 0,
    'public/assets root layout': 0,
    'family-folder layout': 0,
    'paper-only layout': 0,
    unknown: 0,
  });

  const [mode, count] = (Object.entries(counts) as Array<[DataHealthSummary['imageRootMode'], number]>)
    .sort((a, b) => b[1] - a[1])[0];
  return count > 0 ? mode : 'unknown';
}

function normalizedAssetUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `/${value.replace(/^\/+/, '')}`.replace(/\/+/g, '/');
}

function groupHasAvailableCandidate(candidates: string[], availableAssetUrls: ReadonlySet<string>): boolean {
  return candidates.some((candidate) => availableAssetUrls.has(normalizedAssetUrl(candidate)));
}

export function auditQuestionAssetAvailability(
  questions: NormalizedQuestion[],
  availableAssetUrls: ReadonlySet<string>,
): AssetAvailabilityAudit {
  return auditQuestionAssetAvailabilitySync(questions, (candidates) => groupHasAvailableCandidate(candidates, availableAssetUrls));
}

function candidateGroupsOrMissingGroup(candidateGroups: string[][]): string[][] {
  return candidateGroups.length ? candidateGroups : [[]];
}

function missingAssetExample(
  question: NormalizedQuestion,
  missing: 'question' | 'mark_scheme',
  candidates: string[],
): AssetAvailabilityAudit['missingExamples'][number] {
  return {
    id: question.id,
    ...(question.paper ? { paper: question.paper } : {}),
    ...(question.questionNumber ? { questionNumber: question.questionNumber } : {}),
    missing,
    candidates,
  };
}

function auditQuestionAssetAvailabilitySync(
  questions: NormalizedQuestion[],
  groupAvailable: (candidates: string[]) => boolean,
): AssetAvailabilityAudit {
  const missingExamples: AssetAvailabilityAudit['missingExamples'] = [];
  let questionImageGroups = 0;
  let markSchemeImageGroups = 0;
  let missingQuestionImageGroups = 0;
  let missingMarkSchemeImageGroups = 0;

  for (const question of questions) {
    for (const candidates of candidateGroupsOrMissingGroup(question.questionImageCandidates)) {
      questionImageGroups += 1;
      if (!groupAvailable(candidates)) {
        missingQuestionImageGroups += 1;
        if (missingExamples.length < 12) {
          missingExamples.push(missingAssetExample(question, 'question', candidates));
        }
      }
    }
    for (const candidates of candidateGroupsOrMissingGroup(question.markSchemeImageCandidates)) {
      markSchemeImageGroups += 1;
      if (!groupAvailable(candidates)) {
        missingMarkSchemeImageGroups += 1;
        if (missingExamples.length < 12) {
          missingExamples.push(missingAssetExample(question, 'mark_scheme', candidates));
        }
      }
    }
  }

  return {
    checkedQuestions: questions.length,
    questionImageGroups,
    markSchemeImageGroups,
    missingQuestionImageGroups,
    missingMarkSchemeImageGroups,
    missingExamples,
  };
}

export async function auditQuestionAssetAvailabilityWithChecker(
  questions: NormalizedQuestion[],
  candidateAvailable: CandidateAvailabilityChecker,
): Promise<AssetAvailabilityAudit> {
  const missingExamples: AssetAvailabilityAudit['missingExamples'] = [];
  let questionImageGroups = 0;
  let markSchemeImageGroups = 0;
  let missingQuestionImageGroups = 0;
  let missingMarkSchemeImageGroups = 0;

  async function groupAvailable(candidates: string[]): Promise<boolean> {
    for (const candidate of candidates) {
      if (await candidateAvailable(candidate)) return true;
    }
    return false;
  }

  for (const question of questions) {
    for (const candidates of candidateGroupsOrMissingGroup(question.questionImageCandidates)) {
      questionImageGroups += 1;
      if (!(await groupAvailable(candidates))) {
        missingQuestionImageGroups += 1;
        if (missingExamples.length < 12) {
          missingExamples.push(missingAssetExample(question, 'question', candidates));
        }
      }
    }
    for (const candidates of candidateGroupsOrMissingGroup(question.markSchemeImageCandidates)) {
      markSchemeImageGroups += 1;
      if (!(await groupAvailable(candidates))) {
        missingMarkSchemeImageGroups += 1;
        if (missingExamples.length < 12) {
          missingExamples.push(missingAssetExample(question, 'mark_scheme', candidates));
        }
      }
    }
  }

  return {
    checkedQuestions: questions.length,
    questionImageGroups,
    markSchemeImageGroups,
    missingQuestionImageGroups,
    missingMarkSchemeImageGroups,
    missingExamples,
  };
}

export function buildDataHealthSummary(
  questions: NormalizedQuestion[],
  regionProgress: RegionProgress[],
  diagnostics?: QuestionBankDiagnostics,
  assetAvailability?: AssetAvailabilityAudit,
): DataHealthSummary {
  const p3Questions = questions.filter(isP3Question);
  const trainableP3Questions = p3Questions.filter(isQuestionTrainable);
  const blockedP3Questions = p3Questions.filter((question) => !isQuestionTrainable(question));
  const unmatched = p3Questions.filter((question) => !matchRegionForQuestion(question));
  const p3QuestionsByRegion = Object.fromEntries(regionProgress.map((progress) => [progress.region.name, progress.availableQuestions]));
  const rawQuestionPathExamples = p3Questions.flatMap((question) => question.questionImageRawPaths).slice(0, 6);
  const rawMarkSchemePathExamples = p3Questions.flatMap((question) => question.markSchemeImageRawPaths).slice(0, 6);
  const candidateQuestionUrlExamples = p3Questions.flatMap((question) => question.questionImageCandidates.flat()).slice(0, 8);
  const candidateMarkSchemeUrlExamples = p3Questions.flatMap((question) => question.markSchemeImageCandidates.flat()).slice(0, 8);

  return {
    mainUrl: diagnostics?.mainUrl,
    mainSchemaName: diagnostics?.mainSchemaName,
    mainRecordCount: diagnostics?.mainRecordCount,
    mainQuestionsLength: diagnostics?.mainQuestionsLength ?? questions.length,
    mainAppearsPlaceholder: diagnostics?.mainAppearsPlaceholder ?? questions.length === 0,
    sidecarUrl: diagnostics?.sidecarUrl,
    sidecarSchemaName: diagnostics?.sidecarSchemaName,
    sidecarRecordCount: diagnostics?.sidecarRecordCount,
    sidecarAppearsPlaceholder: diagnostics?.sidecarAppearsPlaceholder ?? true,
    routingUrl: diagnostics?.routingUrl,
    routingSchemaName: diagnostics?.routingSchemaName,
    routingRecordCount: diagnostics?.routingRecordCount,
    routingMappedCount: diagnostics?.routingMappedCount,
    routingAppearsPlaceholder: diagnostics?.routingAppearsPlaceholder ?? true,
    totalQuestionsLoaded: diagnostics?.normalizedQuestionCount ?? questions.length,
    totalP3Questions: p3Questions.length,
    trainableP3Questions: trainableP3Questions.length,
    p3QuestionsBlockedFromPractice: blockedP3Questions.length,
    p3QuestionsWithQuestionImageMetadata: p3Questions.filter((question) => question.questionImageRawPaths.length > 0).length,
    p3QuestionsWithMarkSchemeImageMetadata: p3Questions.filter((question) => question.markSchemeImageRawPaths.length > 0).length,
    p3QuestionImageGroupsChecked: assetAvailability?.questionImageGroups,
    p3QuestionImageGroupsAvailable: assetAvailability ? assetAvailability.questionImageGroups - assetAvailability.missingQuestionImageGroups : undefined,
    p3MarkSchemeImageGroupsChecked: assetAvailability?.markSchemeImageGroups,
    p3MarkSchemeImageGroupsAvailable: assetAvailability ? assetAvailability.markSchemeImageGroups - assetAvailability.missingMarkSchemeImageGroups : undefined,
    p3QuestionsByRegion,
    unmatchedP3Questions: unmatched.length,
    unmatchedLabelExamples: unmatched.slice(0, 8).map((question) => `${question.id}: ${labelsForQuestion(question).join(' | ') || 'no labels'}`),
    rawQuestionPathExamples,
    rawMarkSchemePathExamples,
    candidateQuestionUrlExamples,
    candidateMarkSchemeUrlExamples,
    resolvedImageExamples: p3Questions
      .filter((question) => question.questionImageUrls.length || question.markSchemeImageUrls.length)
      .slice(0, 6)
      .map((question) => ({ id: question.id, question: question.questionImageUrls[0], markScheme: question.markSchemeImageUrls[0] })),
    missingImagePathExamples: p3Questions
      .flatMap((question) => {
        const labels = labelsForQuestion(question).join(' | ');
        return [
          question.questionImageRawPaths.length ? undefined : { id: question.id, missing: 'question' as const, labels },
          question.markSchemeImageRawPaths.length ? undefined : { id: question.id, missing: 'mark_scheme' as const, labels },
        ].filter((value): value is { id: string; missing: 'question' | 'mark_scheme'; labels: string } => Boolean(value));
      })
      .slice(0, 8),
    missingAssetAvailabilityExamples: assetAvailability?.missingExamples.slice(0, 8) ?? [],
    practiceBlockedExamples: blockedP3Questions
      .slice(0, 8)
      .map((question) => ({
        id: question.id,
        blockers: trainingBlockersForQuestion(question),
        labels: labelsForQuestion(question).join(' | '),
      })),
    imageRootMode: detectImageRootMode(p3Questions),
    sidecarEnrichmentCount: diagnostics?.sidecarEnrichmentCount ?? 0,
    sidecarMergeCount: diagnostics?.sidecarMergeCount ?? 0,
    sidecarErrorCount: diagnostics?.sidecarErrorCount ?? 0,
    hardFailedTextCount: questions.filter((question) => question.textQuality?.hardFailed).length,
    reviewUsableTextCount: questions.filter((question) => question.textQuality?.reviewUsable).length,
  };
}
