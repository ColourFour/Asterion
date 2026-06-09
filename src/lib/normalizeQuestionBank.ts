import type { DeepSeekMetadata, NormalizedQuestion, PaperFamily, QuestionBankDiagnostics, QuestionContentSource, QuestionContentSourceKind, QuestionEligibility, QuestionPartMark, QuestionPartRouteMapping, QuestionRouteEvidence, QuestionTextQuality, QuestionTopicDistribution, QuestionTopicRouting } from '../types';
import { p3RegionIdForTopicId, p3RegionNameForTopicId } from './p3SkillContract';
import { normalizeQuestionRouteEvidenceStatus } from './questionRouteEvidence';
import { canonicalPaperFamily, resolveQuestionAssetPathCandidateGroups, resolveQuestionAssetPaths } from './resolveAssetPath';
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
    'reviewed_status',
    'reviewedStatus',
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

function truthyBoolean(record: LooseRecord | undefined, keys: string[]): boolean {
  return keys.some((key) => pickBoolean(record, [key]) === true);
}

function falseyBoolean(record: LooseRecord | undefined, keys: string[]): boolean {
  return keys.some((key) => pickBoolean(record, [key]) === false);
}

function normalizedToken(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function normalizedPartKey(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/^\((.*)\)$/, '$1').toLowerCase();
  return normalized || undefined;
}

function routeExplicitlyApproved(record: LooseRecord): boolean {
  return truthyBoolean(record, [
    'route_approved',
    'routeApproved',
    'review_approved',
    'reviewApproved',
    'validated_route_approved',
    'validatedRouteApproved',
    'approved_for_validated_evidence',
    'approvedForValidatedEvidence',
  ]) || [
    'approved',
    'route_approved',
    'validated_route_approved',
    'clean_approved',
    'resolved_approved',
  ].includes(normalizedToken(pickString(record, [
    'route_review_status',
    'routeReviewStatus',
    'route_resolution_status',
    'routeResolutionStatus',
    'approval_status',
    'approvalStatus',
  ])));
}

function reviewStatusApprovesMapping(status: string | undefined): boolean {
  return [
    'approved',
    'clean_approved',
    'mapping_reviewed',
    'published',
    'reviewed',
    'route_approved',
    'teacher_reviewed',
    'validated_route_approved',
  ].includes(normalizedToken(status));
}

function reviewBlockerReasonCodes(record: LooseRecord): string[] {
  if (routeExplicitlyApproved(record)) return [];

  const blockers: string[] = [];
  const reviewReasons = stringArray(record.review_reasons);
  const resolutionStatus = normalizedToken(pickString(record, ['resolution_status', 'resolutionStatus']));
  const routeDecision = normalizedToken(pickString(record, ['route_decision', 'routeDecision', 'decision']));
  const evidenceStatus = normalizedToken(pickString(record, ['evidence_status', 'evidenceStatus']));

  if (reviewReasons.length > 0) blockers.push('topic-routing-review-reasons-unresolved');
  if (truthyBoolean(record, ['review_required', 'reviewRequired'])) blockers.push('topic-routing-review-required');
  if (truthyBoolean(record, ['deferred', 'is_deferred', 'isDeferred', 'teacher_review_deferred', 'teacherReviewDeferred'])) {
    blockers.push('topic-routing-deferred-evidence');
  }
  if (resolutionStatus) {
    if (resolutionStatus.includes('deferred') || resolutionStatus.includes('review_required') || resolutionStatus.includes('unresolved')) {
      blockers.push('topic-routing-deferred-evidence');
    } else if (![
      'approved',
      'route_approved',
      'validated_route_approved',
      'clean_approved',
      'resolved_approved',
    ].includes(resolutionStatus)) {
      blockers.push('topic-routing-audit-not-approved');
    }
  }
  if (evidenceStatus.includes('ambiguous') || evidenceStatus.includes('deferred') || evidenceStatus.includes('blocked')) {
    blockers.push('topic-routing-evidence-blocker');
  }
  if (routeDecision && ![
    'approved',
    'route_approved',
    'validated_route_approved',
    'clean_approved',
  ].includes(routeDecision)) {
    blockers.push(routeDecision.includes('defer') ? 'topic-routing-deferred-evidence' : 'topic-routing-audit-not-approved');
  }
  return unique(blockers);
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
  const contentLabGenerationAllowed = pickBoolean(gate, ['content_lab_generation_allowed', 'contentLabGenerationAllowed']);
  const generationBlockerReasonCodes = reasonCodes.filter((code) => (
    code.includes('content_lab_blocked')
    || code.includes('question_crop_not_high_confidence')
    || code.includes('mark_scheme_crop_not_high_confidence')
    || code.includes('canonical_assets_missing')
    || code.includes('canonical_assets_not_ok')
    || code.includes('mapping_status_fail')
    || code.includes('marks_inconsistent')
    || code.includes('paper_total_inconsistent')
    || code.includes('text_only_blocked_status_fail')
    || code.includes('text_only_blocked_untrusted_math_text')
    || code.includes('validation_status_fail')
  ));
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
  const generationBlocked = contentLabGenerationAllowed === false || generationBlockerReasonCodes.length > 0;

  return {
    questionText,
    markSchemeText,
    questionTextTrust,
    questionTextRole,
    textOnlyDisplayAllowed: pickBoolean(questionTextRecord, ['text_only_display_allowed']) ?? pickBoolean(gate, ['text_only_display_allowed']),
    contentLabGenerationAllowed,
    visualRequired: pickBoolean(gate, ['visual_required']) ?? pickBoolean(record, ['visual_required']),
    hardFailed,
    reviewUsable: hasUsableText,
    routingUsable: hasUsableText,
    contentLabSupportUsable: hasUsableText && !generationBlocked,
    statusLabel: hardFailed ? 'hard_failed' : textOnlyStatus ?? (hasUsableText ? 'review_usable' : 'missing_text'),
    reasonCodes,
    generationBlockerReasonCodes: generationBlockerReasonCodes.length ? generationBlockerReasonCodes : undefined,
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

export interface NormalizeQuestionBankOptions {
  contentSourceKind?: QuestionContentSourceKind;
}

function normalizeContentSource(kind: QuestionContentSourceKind | undefined): QuestionContentSource {
  const sourceKind = kind ?? 'unknown';
  const unsafeRawBank = sourceKind === 'raw-bank-fallback' || sourceKind === 'raw-bank-debug';
  const reasonCodes = unsafeRawBank ? [`unsafe-${sourceKind}`] : [];

  return {
    kind: sourceKind,
    unsafeForGeneration: unsafeRawBank,
    reasonCodes,
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
  const contentSource = question.contentSource ?? normalizeContentSource(undefined);

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
  if (textQuality?.contentLabGenerationAllowed === false || textQuality?.generationBlockerReasonCodes?.length) {
    generationReasons.push('content-lab-generation-blocked-by-quality-gate');
    generationReasons.push(...(textQuality.generationBlockerReasonCodes ?? []).map((code) => `quality-${code}`));
  }
  if (textHardFailed) generationReasons.push('blocked-hard-failed-text');
  if (contentSource.unsafeForGeneration) generationReasons.push(...contentSource.reasonCodes);

  const imagePracticeEligible = hasImagePracticeAssets && trainingBlockers.length === 0;
  const generationEligible = routeIsClean && textQuality?.contentLabSupportUsable === true && !textHardFailed && !contentSource.unsafeForGeneration;
  const textOnlyEligible = routeIsClean && hasTextOnlySource && textOnlyAllowed && !textHardFailed;

  return {
    regionDisplayEligible: eligibility(regionDisplayEligible, regionDisplayReasons),
    practiceEligible: eligibility(imagePracticeEligible, practiceReasons),
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
    const partMappings = normalizePartRouteMappings(record.part_mappings, record.partMappings, record.subpart_mappings, record.subpartMappings, record.parts, record.subparts);
    index.set(id, {
      primaryTopicId,
      confidence: pickString(record, ['confidence']),
      reviewRequired: pickBoolean(record, ['review_required']),
      reviewReasons: stringArray(record.review_reasons),
      reviewBlockerReasonCodes: reviewBlockerReasonCodes(record),
      routeApproved: routeExplicitlyApproved(record),
      evidenceUsed: stringArray(record.evidence_used),
      routingSource: pickString(record, ['routing_source']),
      recordSource: 'topic-routing-sidecar',
      paperFamily: pickString(record, ['paper_family', 'paperFamily']),
      evidenceStatus: pickRouteEvidenceStatus(routeEvidenceRecord, record),
      mappedRegionId: p3RegionIdForTopicId(primaryTopicId),
      topicDistribution: topicDistribution.length ? topicDistribution : undefined,
      partMappings: partMappings.length ? partMappings : undefined,
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
      const mappedRegionId = p3RegionIdForTopicId(topicId);
      if (fitPercent !== undefined) topic.fitPercent = fitPercent;
      if (mappedRegionId) topic.mappedRegionId = mappedRegionId;
      return topic;
    })
    .filter((item): item is QuestionTopicDistribution => Boolean(item));
}

function partRouteMappingReviewed(record: LooseRecord, nestedRouting?: LooseRecord): boolean | undefined {
  const explicit = pickBoolean(record, [
    'mapping_reviewed',
    'mappingReviewed',
    'subpart_mapping_reviewed',
    'subpartMappingReviewed',
    'reviewed',
  ]) ?? pickBoolean(nestedRouting, [
    'mapping_reviewed',
    'mappingReviewed',
    'subpart_mapping_reviewed',
    'subpartMappingReviewed',
    'reviewed',
  ]);
  if (explicit !== undefined) return explicit;

  const reviewStatus = pickString(record, [
    'reviewed_status',
    'reviewedStatus',
    'mapping_review_status',
    'mappingReviewStatus',
    'route_review_status',
    'routeReviewStatus',
    'review_status',
    'reviewStatus',
  ]) ?? pickString(nestedRouting, [
    'reviewed_status',
    'reviewedStatus',
    'mapping_review_status',
    'mappingReviewStatus',
    'route_review_status',
    'routeReviewStatus',
    'review_status',
    'reviewStatus',
  ]);
  return reviewStatus ? reviewStatusApprovesMapping(reviewStatus) : undefined;
}

function normalizePartRouteMapping(value: unknown): QuestionPartRouteMapping | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const nestedRouting = nestedRecord(record, 'topic_routing') ?? nestedRecord(record, 'topicRouting');
  const routeEvidenceRecord = nestedRecord(record, 'route_evidence') ?? nestedRecord(record, 'routeEvidence');
  const primaryTopicId = pickString(record, ['primary_topic_id', 'primaryTopicId', 'topic_id', 'topicId', 'reviewed_topic_id'])
    ?? pickString(nestedRouting, ['primary_topic_id', 'primaryTopicId', 'topic_id', 'topicId', 'reviewed_topic_id']);
  const mappedRegionId = pickString(record, ['mapped_region_id', 'mappedRegionId', 'region_id', 'regionId', 'reviewed_region_id'])
    ?? pickString(nestedRouting, ['mapped_region_id', 'mappedRegionId', 'region_id', 'regionId', 'reviewed_region_id'])
    ?? p3RegionIdForTopicId(primaryTopicId);
  const reviewStatus = pickString(record, [
    'mapping_review_status',
    'mappingReviewStatus',
    'route_review_status',
    'routeReviewStatus',
    'review_status',
    'reviewStatus',
  ]) ?? pickString(nestedRouting, [
    'mapping_review_status',
    'mappingReviewStatus',
    'route_review_status',
    'routeReviewStatus',
    'review_status',
    'reviewStatus',
  ]);
  const mapping: QuestionPartRouteMapping = {
    partId: pickString(record, ['part_id', 'partId', 'id']),
    subpartId: pickString(record, ['subpart_id', 'subpartId']),
    label: pickString(record, ['label', 'subpart_label', 'subpartLabel', 'part_label', 'partLabel']),
    primaryTopicId,
    skillRef: pickString(record, ['skill_ref', 'skillRef', 'skill_id', 'skillId', 'reviewed_skill_ref', 'reviewedSkillRef', 'reviewed_p3_skill_id', 'reviewed_source_skill_id']),
    mappedRegionId,
    routeEvidenceStatus: pickRouteEvidenceStatus(routeEvidenceRecord, nestedRouting, record),
    mappingReviewed: partRouteMappingReviewed(record, nestedRouting),
    reviewStatus,
    evidenceUsed: stringArray(record.evidence_used).length
      ? stringArray(record.evidence_used)
      : stringArray(nestedRouting?.evidence_used),
    reasonCodes: unique([
      ...stringArray(record.reason_codes),
      ...stringArray(record.reasonCodes),
      ...stringArray(nestedRouting?.reason_codes),
      ...stringArray(nestedRouting?.reasonCodes),
    ]),
  };

  const hasMetadata = Boolean(
    mapping.partId
    || mapping.subpartId
    || mapping.primaryTopicId
    || mapping.skillRef
    || mapping.mappedRegionId
    || mapping.routeEvidenceStatus
    || mapping.mappingReviewed !== undefined
    || mapping.reviewStatus
    || mapping.evidenceUsed?.length
    || mapping.reasonCodes?.length
  );
  if (!hasMetadata) return undefined;

  return Object.fromEntries(
    Object.entries(mapping).filter(([_key, item]) => (
      Array.isArray(item) ? item.length > 0 : item !== undefined
    )),
  ) as QuestionPartRouteMapping;
}

function normalizePartRouteMappings(...values: unknown[]): QuestionPartRouteMapping[] {
  return values.flatMap((value) => {
    if (!Array.isArray(value)) return [];
    return value.map(normalizePartRouteMapping).filter((item): item is QuestionPartRouteMapping => Boolean(item));
  });
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

function partMappingKeys(mapping: QuestionPartRouteMapping): string[] {
  return unique([
    normalizedPartKey(mapping.label),
    normalizedPartKey(mapping.subpartId),
    normalizedPartKey(mapping.partId),
  ].filter((value): value is string => Boolean(value)));
}

function subpartRecordKeys(record: LooseRecord): string[] {
  return unique([
    normalizedPartKey(pickString(record, ['label', 'subpart_label', 'subpartLabel', 'part_label', 'partLabel'])),
    normalizedPartKey(pickString(record, ['subpart_id', 'subpartId'])),
    normalizedPartKey(pickString(record, ['part_id', 'partId', 'id'])),
  ].filter((value): value is string => Boolean(value)));
}

function findPartRouteMapping(label: string, mappings: QuestionPartRouteMapping[]): QuestionPartRouteMapping | undefined {
  const lookup = normalizedPartKey(label);
  if (!lookup) return undefined;
  return mappings.find((mapping) => partMappingKeys(mapping).includes(lookup));
}

function findSubpartRecord(label: string, records: LooseRecord[]): LooseRecord | undefined {
  const lookup = normalizedPartKey(label);
  if (!lookup) return undefined;
  return records.find((record) => subpartRecordKeys(record).includes(lookup));
}

function metadataForPart(label: string, sourceRecord: LooseRecord | undefined, routingMapping: QuestionPartRouteMapping | undefined): Partial<QuestionPartMark> {
  const sourceMapping = normalizePartRouteMapping(sourceRecord);
  const merged: QuestionPartRouteMapping = {
    ...sourceMapping,
    ...routingMapping,
  };
  const normalized: Partial<QuestionPartMark> = {
    partId: merged.partId,
    subpartId: merged.subpartId,
    primaryTopicId: merged.primaryTopicId,
    skillRef: merged.skillRef,
    mappedRegionId: merged.mappedRegionId,
    routeEvidenceStatus: merged.routeEvidenceStatus,
    mappingReviewed: merged.mappingReviewed,
    reviewStatus: merged.reviewStatus,
    evidenceUsed: merged.evidenceUsed,
    reasonCodes: merged.reasonCodes,
  };

  if (!normalized.partId && sourceRecord) normalized.partId = pickString(sourceRecord, ['part_id', 'partId', 'id']);
  if (!normalized.subpartId && sourceRecord) normalized.subpartId = pickString(sourceRecord, ['subpart_id', 'subpartId']);
  if (!normalized.subpartId && routingMapping?.subpartId) normalized.subpartId = routingMapping.subpartId;
  if (!normalized.partId && routingMapping?.partId) normalized.partId = routingMapping.partId;
  if (!normalized.partId && !normalized.subpartId && merged.label && normalizedPartKey(merged.label) !== normalizedPartKey(label)) {
    normalized.partId = merged.label;
  }

  return Object.fromEntries(
    Object.entries(normalized).filter(([_key, item]) => (
      Array.isArray(item) ? item.length > 0 : item !== undefined
    )),
  ) as Partial<QuestionPartMark>;
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

function questionPartMarks(record: LooseRecord, totalMarks?: number, routing?: QuestionTopicRouting): QuestionPartMark[] | undefined {
  const notes = nestedRecord(record, 'notes');
  const structureRecords = [
    ...nestedRecords(record, ['question_structure_detected', 'mark_scheme_structure_detected']),
    ...nestedRecords(notes, ['question_structure_detected', 'mark_scheme_structure_detected']),
  ];
  const sourceSubpartRecords = subpartRecords(record);
  const partMappings = routing?.partMappings ?? [];
  const labels = unique([
    ...subpartLabels(record),
    ...partMappings.map((mapping) => mapping.label ?? mapping.subpartId ?? mapping.partId).filter((label): label is string => Boolean(label)),
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
    ...metadataForPart(label, findSubpartRecord(label, sourceSubpartRecords), findPartRouteMapping(label, partMappings)),
    label: partLabel(label),
    marksAvailable: wholePositiveMarks[index],
  }));
}

export function normalizeQuestionBank(
  localBank: unknown,
  deepseekSidecar: unknown = {},
  topicRouting: unknown = {},
  options: NormalizeQuestionBankOptions = {},
): NormalizedQuestion[] {
  const sidecarIndex = buildSidecarIndex(deepseekSidecar);
  const routingIndex = buildTopicRoutingIndex(topicRouting);
  const contentSource = normalizeContentSource(options.contentSourceKind);

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
    const parts = questionPartMarks(record, marksAvailable, topicRouting);
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
      contentSource,
      displayTopic: topicRouting?.mappedRegionId
        ? p3RegionNameForTopicId(topicRouting.primaryTopicId) ?? localTopic ?? 'Reviewed P3 topic'
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

export function normalizeQuestionBankWithDiagnostics(
  localBank: unknown,
  deepseekSidecar: unknown = {},
  topicRouting: unknown = {},
  options: NormalizeQuestionBankOptions = {},
): {
  questions: NormalizedQuestion[];
  diagnostics: QuestionBankDiagnostics;
} {
  const questions = normalizeQuestionBank(localBank, deepseekSidecar, topicRouting, options);
  const sidecarEnrichmentCount = getSidecarEnrichmentCount(deepseekSidecar);
  const sidecarMergeCount = questions.filter((question) => Boolean(question.raw.deepseek)).length;
  const sidecarErrorCount = getSidecarErrorCount(deepseekSidecar);
  return {
    questions,
    diagnostics: {
      mainQuestionsLength: getQuestionRecordCount(localBank),
      mainContentSource: options.contentSourceKind ?? 'unknown',
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
