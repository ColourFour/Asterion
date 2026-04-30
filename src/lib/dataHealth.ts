import type { NormalizedQuestion, QuestionBankDiagnostics, RegionProgress } from '../types';
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
  totalQuestionsLoaded: number;
  totalP3Questions: number;
  p3QuestionsWithQuestionImageMetadata: number;
  p3QuestionsWithMarkSchemeImageMetadata: number;
  p3QuestionsByRegion: Record<string, number>;
  unmatchedP3Questions: number;
  unmatchedLabelExamples: string[];
  rawQuestionPathExamples: string[];
  rawMarkSchemePathExamples: string[];
  candidateQuestionUrlExamples: string[];
  candidateMarkSchemeUrlExamples: string[];
  resolvedImageExamples: Array<{ id: string; question?: string; markScheme?: string }>;
  missingImagePathExamples: Array<{ id: string; missing: 'question' | 'mark_scheme'; labels: string }>;
  imageRootMode: 'family-folder layout' | 'paper-only layout' | 'unknown';
  sidecarEnrichmentCount: number;
  sidecarMergeCount: number;
  sidecarErrorCount: number;
}

export function buildDataHealthSummary(
  questions: NormalizedQuestion[],
  regionProgress: RegionProgress[],
  diagnostics?: QuestionBankDiagnostics,
): DataHealthSummary {
  const p3Questions = questions.filter(isP3Question);
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
    totalQuestionsLoaded: diagnostics?.normalizedQuestionCount ?? questions.length,
    totalP3Questions: p3Questions.length,
    p3QuestionsWithQuestionImageMetadata: p3Questions.filter((question) => question.questionImageRawPaths.length > 0).length,
    p3QuestionsWithMarkSchemeImageMetadata: p3Questions.filter((question) => question.markSchemeImageRawPaths.length > 0).length,
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
    imageRootMode: 'unknown',
    sidecarEnrichmentCount: diagnostics?.sidecarEnrichmentCount ?? 0,
    sidecarMergeCount: diagnostics?.sidecarMergeCount ?? 0,
    sidecarErrorCount: diagnostics?.sidecarErrorCount ?? 0,
  };
}
