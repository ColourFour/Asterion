import type { DeepSeekMetadata, NormalizedQuestion, PaperFamily, QuestionBankDiagnostics, QuestionEligibility, QuestionPartMark, QuestionRouteEvidence, QuestionTextQuality, QuestionTopicDistribution, QuestionTopicRouting } from '../types';
import { normalizeQuestionRouteEvidenceStatus } from './questionRouteEvidence';
import { canonicalPaperFamily, resolveQuestionAssetPathCandidateGroups, resolveQuestionAssetPaths } from './resolveAssetPath';
import { P3_TOPIC_ID_TO_REGION_ID, P3_TOPIC_ID_TO_REGION_NAME } from './topicRouting';
import { inferQuestionRouteEvidence } from './worldMap';

type LooseRecord = Record<string, unknown>;

const ERROR_KEYS = ['error', 'parse_error', 'parseError', 'exception', 'error_message', 'errorMessage'];

function asRecord(value: unknown): LooseRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as LooseRecord) : undefined;
}

function pickString(record: LooseRecord | undefined, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function pickBoolean(record: LooseRecord | undefined, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string' && ['true', 'false'].includes(value.toLowerCase())) return value.toLowerCase() === 'true';
  }
  return undefined;
}

function pickNumber(record: LooseRecord | undefined, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

function nestedRecord(record: LooseRecord | undefined, key: string): LooseRecord | undefined {
  return asRecord(record?.[key]);
}

function nestedRecords(record: LooseRecord | undefined, keys: string[]): LooseRecord[] {
  return keys.map((key) => nestedRecord(record, key)).filter((value): value is LooseRecord => Boolean(value));
}

function pickImages(record: LooseRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || Array.isArray(value)) return value;
  }
  return undefined;
}

function artifactPaths(record: LooseRecord | undefined, key: 'question_images' | 'mark_scheme_images'): string[] {
  const integrity = asRecord(record?.artifact_integrity);
  const artifacts = Array.isArray(integrity?.[key]) ? integrity[key] : [];
  return artifacts
    .map((item) => pickString(asRecord(item), ['path', 'image_path']))
    .filter((value): value is string => Boolean(value));
}

function combineImages(...values: unknown[]): string[] {
  return values.flatMap((value) => {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return [];
  });
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return unique(value.map((item) => String(item).trim()).filter(Boolean));
}

function pickRouteEvidenceStatus(...records: Array<LooseRecord | undefined>) {
  const keys = [
    'route_evidence_status',
    'routeEvidenceStatus',
    'routing_evidence_status',
    'routingEvidenceStatus',
    'curriculum_route_status',
    'curriculumRouteStatus',
    'evidence_status',
    'evidenceStatus',
    'status',
  ];
  for (const record of records) {
    for (const key of keys) {
      const status = normalizeQuestionRouteEvidenceStatus(record?.[key]);
      if (status) return status;
    }
  }
  return undefined;
}

function numberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (
    typeof item === 'number' && Number.isFinite(item)
      ? item
      : typeof item === 'string' && item.trim() && Number.isFinite(Number(item))
        ? Number(item)
        : undefined
  )).filter((item): item is number => typeof item === 'number' && Number.isFinite(item));
}

function subpartRecords(record: LooseRecord): LooseRecord[] {
  return (Array.isArray(record.subparts) ? record.subparts : [])
    .map((item) => asRecord(item))
    .filter((item): item is LooseRecord => Boolean(item));
}

function subpartLabels(record: LooseRecord): string[] {
  const fromStrings = stringArray(record.subparts).filter((label) => label !== '[object Object]');
  const fromObjects = subpartRecords(record)
    .map((item) => pickString(item, ['label', 'subpart_label', 'subpart_id']))
    .filter((label): label is string => Boolean(label));
  return unique([...fromStrings, ...fromObjects]);
}

function hasError(record: LooseRecord | undefined): boolean {
  if (!record) return true;
  return ERROR_KEYS.some((key) => Boolean(record[key]));
}

function firstSubpartRecord(record: LooseRecord): LooseRecord | undefined {
  return subpartRecords(record)[0];
}

function textObject(record: LooseRecord | undefined, key: string): LooseRecord | undefined {
  const value = record?.[key];
  if (typeof value === 'string') return { text: value };
  return asRecord(value);
}

function normalizeTextQuality(record: LooseRecord): QuestionTextQuality {
  const gate = asRecord(record.quality_gate);
  const firstSubpart = firstSubpartRecord(record);
  const questionTextRecord = textObject(firstSubpart, 'question_text') ?? textObject(record, 'question_text');
  const markSchemeTextRecord = textObject(firstSubpart, 'mark_scheme_text') ?? textObject(record, 'mark_scheme_text');
  const reasonCodes = stringArray(gate?.reason_codes);
  const questionText = pickString(questionTextRecord, ['text']) ?? pickString(record, ['question_text', 'ocr_text']);
  const markSchemeText = pickString(markSchemeTextRecord, ['text']) ?? pickString(record, ['mark_scheme_text']);
  const questionTextTrust = pickString(questionTextRecord, ['trust_level', 'trust']) ?? pickString(record, ['question_text_trust', 'ocr_text_trust']);
  const questionTextRole = pickString(questionTextRecord, ['role']) ?? pickString(record, ['question_text_role']);
  const textOnlyStatus = pickString(record, ['text_only_status']) ?? (pickBoolean(gate, ['text_only_display_allowed']) ? 'ready' : undefined);
  const hardFailed = reasonCodes.some((code) => (
    code.includes('text_only_blocked_status_fail')
    || code.includes('validation_status_fail')
    || code.includes('ocr_hard_fail')
  ))
    || ['fail', 'failed', 'hard_fail', 'hard_failed'].includes((textOnlyStatus ?? '').toLowerCase())
    || questionTextRole === 'untrusted_math_text';
  const hasUsableText = Boolean(questionText || markSchemeText) && !hardFailed;

  return {
    questionText,
    markSchemeText,
    questionTextTrust,
    questionTextRole,
    textOnlyDisplayAllowed: pickBoolean(questionTextRecord, ['text_only_display_allowed']) ?? pickBoolean(gate, ['text_only_display_allowed']),
    visualRequired: pickBoolean(gate, ['visual_required']) ?? pickBoolean(record, ['visual_required']),
    hardFailed,
    reviewUsable: hasUsableText,
    routingUsable: hasUsableText,
    contentLabSupportUsable: hasUsableText,
    statusLabel: hardFailed ? 'hard_failed' : textOnlyStatus ?? (hasUsableText ? 'review_usable' : 'missing_text'),
    reasonCodes,
  };
}

function isBlockingTrainingStatus(status: string | undefined): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return [
    'blocked',
    'broken',
    'exclude',
    'missing',
    'quarantine',
    'unavailable',
    'untrainable',
  ].some((token) => normalized.includes(token));
}

function trainingBlockersForRecord(
  record: LooseRecord,
  trainingStatus: string | undefined,
  questionImageCandidateGroups: string[][],
  markSchemeImageCandidateGroups: string[][],
): string[] {
  const reason = pickString(record, ['training_status_reason', 'practice_status_reason', 'asset_status_reason']);
  const isExcluded = pickBoolean(record, ['exclude_from_training', 'excluded_from_training', 'practice_excluded']);
  const blockers: string[] = [];

  if (isExcluded || isBlockingTrainingStatus(trainingStatus)) {
    blockers.push(reason ?? trainingStatus ?? 'Question is blocked from practice.');
  }
  if (questionImageCandidateGroups.length === 0) {
    blockers.push('Missing question image metadata.');
  }
  if (markSchemeImageCandidateGroups.length === 0) {
    blockers.push('Missing mark-scheme image metadata.');
  }

  return unique(blockers);
}

function eligibility(
  eligible: boolean,
  reasonCodes: string[],
) {
  return {
    eligible,
    reasonCodes: unique(reasonCodes),
  };
}

function routeBlockReasonCodes(routeEvidence: QuestionRouteEvidence | undefined): string[] {
  switch (routeEvidence?.status) {
    case 'clean':
      return [];
    case 'missing-route':
      return ['blocked-missing-route'];
    case 'ambiguous-route':
      return ['blocked-ambiguous-route'];
    case 'review-only':
      return ['blocked-review-only'];
    case 'fallback-display-only':
      return ['blocked-fallback-display-only'];
    case 'prerequisite-only':
      return ['blocked-prerequisite-only'];
    case 'not-P3':
      return ['blocked-not-p3'];
    case 'hard-failure':
      return ['blocked-hard-failure'];
    default:
      return ['blocked-missing-route-evidence'];
  }
}

function deriveQuestionEligibility(question: NormalizedQuestion): QuestionEligibility {
  const hasQuestionImage = question.questionImageCandidates.length > 0;
  const hasMarkSchemeImage = question.markSchemeImageCandidates.length > 0;
  const hasImagePracticeAssets = hasQuestionImage && hasMarkSchemeImage;
  const routeEvidence = question.routeEvidence;
  const routeIsClean = routeEvidence?.status === 'clean';
  const routeBlocks = routeBlockReasonCodes(routeEvidence);
  const textQuality = question.textQuality;
  const hasTextOnlySource = Boolean(textQuality?.questionText && textQuality?.markSchemeText);
  const textOnlyAllowed = textQuality?.textOnlyDisplayAllowed === true;
  const textHardFailed = textQuality?.hardFailed === true;
  const trainingBlockers = question.trainingBlockers ?? [];

  const regionDisplayReasons: string[] = [];
  if (routeEvidence?.displayRegionId) regionDisplayReasons.push('has-display-region');
  else regionDisplayReasons.push(...routeBlocks);
  if (routeEvidence?.status === 'hard-failure') regionDisplayReasons.push('blocked-hard-failure');
  if (routeEvidence?.status === 'not-P3') regionDisplayReasons.push('blocked-not-p3');
  const regionDisplayEligible = Boolean(routeEvidence?.displayRegionId)
    && routeEvidence?.status !== 'hard-failure'
    && routeEvidence?.status !== 'not-P3';

  const practiceReasons: string[] = [];
  if (hasImagePracticeAssets && trainingBlockers.length === 0) practiceReasons.push('has-image-practice-assets');
  if (!hasQuestionImage) practiceReasons.push('missing-question-image');
  if (!hasMarkSchemeImage) practiceReasons.push('missing-mark-scheme-image');
  if (trainingBlockers.length) practiceReasons.push('blocked-training-status');

  const masteryReasons: string[] = [];
  if (routeIsClean) masteryReasons.push('validated-topic-routing');
  else masteryReasons.push(...routeBlocks);
  if (!hasImagePracticeAssets) masteryReasons.push('missing-image-practice-assets');
  if (trainingBlockers.length) masteryReasons.push('blocked-training-status');

  const textOnlyReasons: string[] = [];
  if (routeIsClean) textOnlyReasons.push('validated-topic-routing');
  else textOnlyReasons.push(...routeBlocks);
  if (!hasTextOnlySource) textOnlyReasons.push('missing-question-or-mark-scheme-text');
  if (!textOnlyAllowed) textOnlyReasons.push('text-only-display-not-allowed');
  if (textHardFailed) textOnlyReasons.push('blocked-hard-failed-text');

  const generationReasons: string[] = [];
  if (routeIsClean) generationReasons.push('validated-topic-routing');
  else generationReasons.push(...routeBlocks);
  if (!textQuality?.contentLabSupportUsable) generationReasons.push('missing-content-lab-usable-text');
  if (textHardFailed) generationReasons.push('blocked-hard-failed-text');

  const imagePracticeEligible = hasImagePracticeAssets && trainingBlockers.length === 0;
  const masteryEligible = routeIsClean && imagePracticeEligible;
  const generationEligible = routeIsClean && textQuality?.contentLabSupportUsable === true && !textHardFailed;
  const textOnlyEligible = routeIsClean && hasTextOnlySource && textOnlyAllowed && !textHardFailed;

  return {
    regionDisplayEligible: eligibility(regionDisplayEligible, regionDisplayReasons),
    practiceEligible: eligibility(imagePracticeEligible, practiceReasons),
    masteryEligible: eligibility(masteryEligible, masteryReasons),
    guardianEligible: eligibility(masteryEligible, masteryReasons),
    generationEligible: eligibility(generationEligible, generationReasons),
    textOnlyEligible: eligibility(textOnlyEligible, textOnlyReasons),
  };
}

function normalizeDeepSeek(value: unknown): DeepSeekMetadata {
  const record = asRecord(value);
  const errorMessage = ERROR_KEYS.map((key) => record?.[key]).find((item) => typeof item === 'string') as string | undefined;
  const reviewFlags = record?.review_flags ?? record?.reviewFlags ?? record?.final_review_reasons;
  const validation = asRecord(record?.validation) ?? asRecord(record?.validation_fields) ?? undefined;
  const confidenceNumber = pickNumber(record, ['confidence', 'deepseek_confidence']);
  const confidenceLabel = pickString(record, ['confidence', 'deepseek_confidence', 'deepseek_confidence_normalized']);

  return {
    topic: pickString(record, ['topic', 'deepseek_topic', 'predicted_topic']),
    normalizedTopic: pickString(record, ['deepseek_topic_normalized', 'topic_normalized', 'normalized_topic']),
    subtopic: pickString(record, ['subtopic', 'deepseek_subtopic', 'predicted_subtopic']),
    difficulty: pickString(record, ['difficulty', 'deepseek_difficulty', 'predicted_difficulty']),
    normalizedDifficulty: pickString(record, ['deepseek_difficulty_normalized', 'difficulty_normalized', 'normalized_difficulty']),
    confidence: confidenceNumber,
    confidenceLabel,
    reconciliationStatus: pickString(record, ['topic_reconciliation_status', 'reconciliation_status', 'reconciliationStatus', 'status']),
    finalReviewRequired: pickBoolean(record, ['final_review_required', 'deepseek_review_required', 'review_required']),
    reviewFlags: Array.isArray(reviewFlags) ? reviewFlags.map(String) : undefined,
    validation,
    hasError: hasError(record),
    errorMessage,
  };
}

function getQuestionArray(bank: unknown): LooseRecord[] {
  if (Array.isArray(bank)) return bank.filter(Boolean).map((item) => asRecord(item)).filter(Boolean) as LooseRecord[];
  const record = asRecord(bank);
  const candidate = record?.questions ?? record?.items ?? record?.records;
  if (Array.isArray(candidate)) return candidate.map((item) => asRecord(item)).filter(Boolean) as LooseRecord[];
  return [];
}

function buildSidecarIndex(sidecar: unknown): Map<string, unknown> {
  const index = new Map<string, unknown>();
  const records = getQuestionArray(sidecar);
  for (const item of records) {
    const id = pickString(item, ['id', 'question_id', 'questionId', 'key']);
    if (id) index.set(id, item);
  }
  const root = asRecord(sidecar);
  const enrichments = asRecord(root?.enrichments);
  if (enrichments) {
    for (const [key, value] of Object.entries(enrichments)) index.set(key, value);
  }
  if (root) {
    for (const [key, value] of Object.entries(root)) {
      if (!['schema_name', 'schema_version', 'record_count', 'questions', 'items', 'records', 'enrichments'].includes(key)) index.set(key, value);
    }
  }
  return index;
}

function buildTopicRoutingIndex(topicRouting: unknown): Map<string, QuestionTopicRouting> {
  const index = new Map<string, QuestionTopicRouting>();
  const root = asRecord(topicRouting);
  const records = asRecord(root?.records);
  if (!records) return index;

  for (const [id, value] of Object.entries(records)) {
    const record = asRecord(value);
    if (!record) continue;
    const primaryTopicId = pickString(record, ['primary_topic_id']);
    const topicDistribution = normalizeTopicDistribution(record.topic_distribution);
    const routeEvidenceRecord = nestedRecord(record, 'route_evidence') ?? nestedRecord(record, 'routeEvidence');
    index.set(id, {
      primaryTopicId,
      confidence: pickString(record, ['confidence']),
      reviewRequired: pickBoolean(record, ['review_required']),
      reviewReasons: stringArray(record.review_reasons),
      evidenceUsed: stringArray(record.evidence_used),
      routingSource: pickString(record, ['routing_source']),
      recordSource: 'topic-routing-sidecar',
      paperFamily: pickString(record, ['paper_family', 'paperFamily']),
      evidenceStatus: pickRouteEvidenceStatus(routeEvidenceRecord, record),
      mappedRegionId: primaryTopicId ? P3_TOPIC_ID_TO_REGION_ID[primaryTopicId] : undefined,
      topicDistribution: topicDistribution.length ? topicDistribution : undefined,
    });
  }

  return index;
}

function normalizeTopicDistribution(value: unknown): QuestionTopicDistribution[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return undefined;
      const topicId = pickString(record, ['topic_id', 'topicId', 'primary_topic_id']);
      if (!topicId) return undefined;
      const topic: QuestionTopicDistribution = { topicId };
      const fitPercent = pickNumber(record, ['fit_percent', 'fitPercent', 'percent', 'weight']);
      const mappedRegionId = P3_TOPIC_ID_TO_REGION_ID[topicId];
      if (fitPercent !== undefined) topic.fitPercent = fitPercent;
      if (mappedRegionId) topic.mappedRegionId = mappedRegionId;
      return topic;
    })
    .filter((item): item is QuestionTopicDistribution => Boolean(item));
}

export function getTopicRoutingRecordCount(topicRouting: unknown): number {
  const root = asRecord(topicRouting);
  const records = asRecord(root?.records);
  return records ? Object.keys(records).length : 0;
}

export function getTopicRoutingMappedCount(topicRouting: unknown): number {
  return Array.from(buildTopicRoutingIndex(topicRouting).values()).filter((routing) => Boolean(routing.mappedRegionId)).length;
}

export function getSidecarEnrichmentCount(sidecar: unknown): number {
  const root = asRecord(sidecar);
  const enrichments = asRecord(root?.enrichments);
  if (enrichments) return Object.keys(enrichments).length;
  const arrayCount = getQuestionArray(sidecar).length;
  if (arrayCount) return arrayCount;
  return buildSidecarIndex(sidecar).size;
}

export function getSidecarErrorCount(sidecar: unknown): number {
  return Array.from(buildSidecarIndex(sidecar).values()).filter((entry) => normalizeDeepSeek(entry).hasError).length;
}

export function getQuestionRecordCount(bank: unknown): number {
  return getQuestionArray(bank).length;
}

function validDeepSeekLabel(value: string | undefined, deepseek: DeepSeekMetadata): value is string {
  if (!value || deepseek.hasError) return false;
  const lower = value.toLowerCase();
  return !['unknown', 'error', 'parse_error', 'malformed', 'n/a'].includes(lower);
}

function partLabel(label: string): string {
  const trimmed = label.trim();
  return /^\(.+\)$/.test(trimmed) ? trimmed : `(${trimmed})`;
}

function marksBySubpart(record: LooseRecord, labels: string[]): number[] {
  const markMap = asRecord(record.subparts_solution_marks ?? record.subpart_solution_marks ?? record.part_marks);
  const fromMap = markMap
    ? labels.map((label) => pickNumber(markMap, [label, partLabel(label), label.toLowerCase(), label.toUpperCase()]))
    : [];
  if (fromMap.filter((value): value is number => typeof value === 'number' && Number.isFinite(value)).length === labels.length) {
    return fromMap.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  }

  const byLabel = new Map(subpartRecords(record).map((item) => [
    pickString(item, ['label', 'subpart_label', 'subpart_id']),
    pickNumber(item, ['marks', 'marks_available', 'total_marks']),
  ]));
  return labels.map((label) => byLabel.get(label) ?? byLabel.get(label.replace(/[()]/g, '')))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function questionPartMarks(record: LooseRecord, totalMarks?: number): QuestionPartMark[] | undefined {
  const notes = nestedRecord(record, 'notes');
  const structureRecords = [
    ...nestedRecords(record, ['question_structure_detected', 'mark_scheme_structure_detected']),
    ...nestedRecords(notes, ['question_structure_detected', 'mark_scheme_structure_detected']),
  ];
  const labels = unique([
    ...subpartLabels(record),
    ...structureRecords.flatMap((structure) => stringArray(structure.subparts)),
    ...structureRecords.flatMap((structure) => stringArray(structure.question_subparts)),
  ]);
  if (labels.length < 2) return undefined;

  const markValues = marksBySubpart(record, labels).length === labels.length
    ? marksBySubpart(record, labels)
    : structureRecords.flatMap((structure) => numberArray(structure.mark_values_detected)).slice(0, labels.length);
  const wholePositiveMarks = markValues.filter((value) => Number.isInteger(value) && value > 0);
  const totalFromParts = wholePositiveMarks.reduce((sum, value) => sum + value, 0);

  if (wholePositiveMarks.length !== labels.length) return undefined;
  if (typeof totalMarks === 'number' && totalMarks > 0 && totalFromParts !== totalMarks) return undefined;

  return labels.map((label, index) => ({
    label: partLabel(label),
    marksAvailable: wholePositiveMarks[index],
  }));
}

export function normalizeQuestionBank(localBank: unknown, deepseekSidecar: unknown = {}, topicRouting: unknown = {}): NormalizedQuestion[] {
  const sidecarIndex = buildSidecarIndex(deepseekSidecar);
  const routingIndex = buildTopicRoutingIndex(topicRouting);

  return getQuestionArray(localBank).map((record, index) => {
    const id = pickString(record, ['id', 'question_id', 'questionId']) ?? `question_${index + 1}`;
    const questionImageRaw = combineImages(
      pickImages(record, ['question_image_paths', 'question_images', 'questionImagePaths', 'question_image_path', 'question_image', 'image_path', 'image', 'canonical_question_artifact']),
      pickImages(nestedRecord(record, 'canonical_question_artifact') ?? {}, ['path', 'image_path', 'question_image_path']),
      artifactPaths(record, 'question_images'),
    );
    const markSchemeImageRaw = combineImages(
      pickImages(record, ['mark_scheme_image_paths', 'mark_scheme_images', 'markSchemeImagePaths', 'mark_scheme_image_path', 'mark_scheme_image', 'mark_scheme_path', 'ms_image', 'canonical_mark_scheme_artifact']),
      artifactPaths(record, 'mark_scheme_images'),
    );
    const paperFamily = inferPaperFamily(record, questionImageRaw);
    const deepseekRaw = sidecarIndex.get(id) ?? record.deepseek ?? record.enrichment;
    const deepseek = normalizeDeepSeek(deepseekRaw);
    const indexedTopicRouting = routingIndex.get(id);
    const routeEvidenceRecord = nestedRecord(record, 'route_evidence') ?? nestedRecord(record, 'routeEvidence');
    const preservedEvidenceStatus = pickRouteEvidenceStatus(routeEvidenceRecord, record);
    const sourceRecordEvidenceStatus = preservedEvidenceStatus && preservedEvidenceStatus !== 'clean'
      ? preservedEvidenceStatus
      : undefined;
    const topicRouting = indexedTopicRouting || sourceRecordEvidenceStatus
      ? indexedTopicRouting ?? { evidenceStatus: sourceRecordEvidenceStatus, recordSource: 'source-record' as const }
      : undefined;
    const textQuality = normalizeTextQuality(record);
    const localTopic = pickString(record, ['topic', 'local_topic', 'localTopic']);
    const notes = nestedRecord(record, 'notes');
    const localSubtopic = pickString(record, ['subtopic', 'local_subtopic', 'localSubtopic']) ?? pickString(notes, ['subtopic']);
    const localDifficulty = pickString(record, ['difficulty', 'local_difficulty', 'localDifficulty']);
    const questionImageCandidates = resolveQuestionAssetPathCandidateGroups(questionImageRaw, paperFamily);
    const markSchemeImageCandidates = resolveQuestionAssetPathCandidateGroups(markSchemeImageRaw, paperFamily);
    const questionImageUrls = resolveQuestionAssetPaths(questionImageRaw, paperFamily);
    const markSchemeImageUrls = resolveQuestionAssetPaths(markSchemeImageRaw, paperFamily);
    const marksAvailable = pickNumber(record, ['question_solution_marks', 'marks', 'marks_available', 'marksAvailable', 'total_marks']);
    const parts = questionPartMarks(record, marksAvailable);
    const trainingStatus = pickString(record, ['training_status', 'practice_status', 'asset_status']);
    const trainingBlockers = trainingBlockersForRecord(record, trainingStatus, questionImageCandidates, markSchemeImageCandidates);

    const normalizedQuestion: NormalizedQuestion = {
      id,
      paperFamily: paperFamily as PaperFamily,
      paper: pickString(record, ['paper', 'paper_code', 'session']),
      questionNumber: pickString(record, ['question_number', 'questionNumber', 'number', 'question_no']),
      localTopic,
      localSubtopic,
      localDifficulty,
      deepseek,
      topicRouting,
      textQuality,
      displayTopic: topicRouting?.mappedRegionId
        ? P3_TOPIC_ID_TO_REGION_NAME[topicRouting.primaryTopicId ?? ''] ?? localTopic ?? 'Reviewed P3 topic'
        : validDeepSeekLabel(deepseek.topic, deepseek) ? deepseek.topic : localTopic ?? 'Unclassified',
      displaySubtopic: validDeepSeekLabel(deepseek.subtopic, deepseek) ? deepseek.subtopic : localSubtopic,
      displayDifficulty: localDifficulty,
      marksAvailable,
      parts,
      questionImageRawPaths: questionImageRaw,
      markSchemeImageRawPaths: markSchemeImageRaw,
      questionImagePaths: questionImageRaw,
      markSchemeImagePaths: markSchemeImageRaw,
      questionImageUrls,
      markSchemeImageUrls,
      questionImageCandidates,
      markSchemeImageCandidates,
      trainingStatus,
      trainingBlockers,
      raw: { local: record, deepseek: deepseekRaw },
    };
    const routeEvidence = inferQuestionRouteEvidence(normalizedQuestion);
    const questionWithRouteEvidence = {
      ...normalizedQuestion,
      routeEvidence,
    };
    return {
      ...questionWithRouteEvidence,
      eligibility: deriveQuestionEligibility(questionWithRouteEvidence),
    };
  });
}

function inferPaperFamily(record: LooseRecord, imagePaths: string[]): PaperFamily {
  const explicit = pickString(record, ['paper_family', 'paperFamily', 'family']);
  if (explicit) return canonicalPaperFamily(explicit);
  const paper = pickString(record, ['paper', 'paper_code', 'session']);
  const hints = [paper, ...imagePaths].filter(Boolean).map((value) => String(value).toLowerCase());
  if (hints.some((hint) => /(^|[/_\-\s])p3([/_\-\s]|$)/.test(hint) || /paper\s*3/.test(hint))) return 'p3';
  if (hints.some((hint) => /(^|[/_\-\s])p1([/_\-\s]|$)/.test(hint) || /paper\s*1/.test(hint))) return 'p1';
  if (hints.some((hint) => /(^|[/_\-\s])p4([/_\-\s]|$)|mechanics|m1/.test(hint))) return 'p4';
  if (hints.some((hint) => /(^|[/_\-\s])p5([/_\-\s]|$)|statistics|s1/.test(hint))) return 'p5';
  return 'unknown';
}

export function normalizeQuestionBankWithDiagnostics(localBank: unknown, deepseekSidecar: unknown = {}, topicRouting: unknown = {}): {
  questions: NormalizedQuestion[];
  diagnostics: QuestionBankDiagnostics;
} {
  const questions = normalizeQuestionBank(localBank, deepseekSidecar, topicRouting);
  const sidecarEnrichmentCount = getSidecarEnrichmentCount(deepseekSidecar);
  const sidecarMergeCount = questions.filter((question) => Boolean(question.raw.deepseek)).length;
  const sidecarErrorCount = getSidecarErrorCount(deepseekSidecar);
  return {
    questions,
    diagnostics: {
      mainQuestionsLength: getQuestionRecordCount(localBank),
      mainAppearsPlaceholder: getQuestionRecordCount(localBank) === 0,
      sidecarAppearsPlaceholder: sidecarEnrichmentCount === 0,
      loadedQuestionCount: getQuestionRecordCount(localBank),
      normalizedQuestionCount: questions.length,
      sidecarEnrichmentCount,
      sidecarMergeCount,
      sidecarErrorCount,
      routingRecordCount: getTopicRoutingRecordCount(topicRouting),
      routingMappedCount: getTopicRoutingMappedCount(topicRouting),
      routingAppearsPlaceholder: getTopicRoutingRecordCount(topicRouting) === 0,
    },
  };
}
