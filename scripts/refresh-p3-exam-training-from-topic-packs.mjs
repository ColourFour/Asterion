import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const reposRoot = path.resolve(repoRoot, '..');

const topicPackCandidates = [
  path.join(reposRoot, 'exam-bank-extraction', 'output', 'topic_packets'),
  path.join(reposRoot, 'exam-bank-pipeline', 'output', 'topic_packets'),
];

const topicPackDir = topicPackCandidates.find((candidate) => existsSync(candidate));

if (!topicPackDir) {
  throw new Error(`No topic packet directory found. Checked: ${topicPackCandidates.join(', ')}`);
}

const sourceRepoPath = path.resolve(topicPackDir, '..', '..');
const sourceRepoName = path.basename(sourceRepoPath);

const dataDir = path.join(repoRoot, 'public', 'assets', 'exam-bank-data');
const catalogPath = path.join(dataDir, 'asterion_exam_bank_catalog_v1.json');
const runtimePath = path.join(dataDir, 'asterion_question_bank_v1.json');
const routingPath = path.join(dataDir, 'question_bank.topic_routing.v1.json');
const overlayPath = path.join(repoRoot, 'src', 'data', 'p3_exam_training_topic_pack_refresh_2026_06_16.json');

const P3_TOPIC_IDS = {
  algebra: '9709_p3_topic_algebra',
  integration: '9709_p3_topic_integration',
  'numerical-solution-of-equations': '9709_p3_topic_numerical_solution_of_equations',
  vectors: '9709_p3_topic_vectors',
  trigonometry: '9709_p3_topic_trigonometry',
};

const PROMOTIONS = [
  {
    topicSlug: 'algebra',
    packetTopic: 'algebra',
    ids: ['32spring24_q01', '32spring23_q03', '32autumn23_q03', '31summer23_q03'],
  },
  {
    topicSlug: 'integration',
    packetTopic: 'integration',
    ids: ['32summer21_q04', '31autumn21_q04', '33summer23_q07'],
  },
  {
    topicSlug: 'numerical-solution-of-equations',
    packetTopic: 'numerical_solution_of_equations',
    ids: ['31summer23_q09', '32spring24_q07', '33summer23_q05'],
  },
  {
    topicSlug: 'vectors',
    packetTopic: 'vectors',
    ids: ['31summer24_q09', '32spring24_q09', '32summer23_q11'],
  },
  {
    topicSlug: 'trigonometry',
    packetTopic: 'trigonometry',
    ids: ['32spring24_q08', '32spring23_q06'],
  },
];

const PROMOTION_DATE = '2026-06-17';

function posixPath(value) {
  return value.split(path.sep).join('/');
}

function sourceRepoRelativePath(value) {
  return posixPath(path.relative(sourceRepoPath, value));
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function questionAssetExists(assetPath) {
  return existsSync(path.join(dataDir, assetPath));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sourceManifestPath(packetTopic) {
  return path.join(topicPackDir, 'p3', packetTopic, 'manifest.json');
}

function sourcePacketPath(packetTopic) {
  return path.join(topicPackDir, 'p3', packetTopic, 'topic_packet.pdf');
}

function topicIdForSlug(topicSlug) {
  const topicId = P3_TOPIC_IDS[topicSlug];
  if (!topicId) throw new Error(`Unsupported P3 topic slug: ${topicSlug}`);
  return topicId;
}

function routeTopicMatches(routingRecord, topicSlug) {
  return routingRecord?.primary_topic_id === topicIdForSlug(topicSlug);
}

function sanitizeSubparts(subparts) {
  if (!Array.isArray(subparts)) return subparts;
  return subparts.map((subpart) => {
    const next = deepClone(subpart);
    next.review_status = 'ready';
    if (next.question_text && typeof next.question_text === 'object') {
      next.question_text.text_only_display_allowed = false;
      next.question_text.role = next.question_text.role ?? 'metadata_search_hint';
    }
    // Imported records use the mark-scheme crop as source of truth. Avoid
    // auto-generating tick boxes from noisy OCR unless a later pass reviews it.
    delete next.mark_scheme_text;
    return next;
  });
}

function promotedRecord(sourceRecord, manifest, manifestRecord, promotion) {
  const record = deepClone(sourceRecord);
  const originalQualityGate = deepClone(record.quality_gate ?? {});
  const questionArtifact = record.canonical_question_artifact ?? record.question_image_path;
  const markSchemeArtifact = record.canonical_mark_scheme_artifact ?? record.mark_scheme_image_path;
  if (!questionArtifact || !markSchemeArtifact) {
    throw new Error(`${record.question_id} is missing canonical image artifact metadata.`);
  }
  if (!questionAssetExists(questionArtifact)) {
    throw new Error(`${record.question_id} question asset not found: ${questionArtifact}`);
  }
  if (!questionAssetExists(markSchemeArtifact)) {
    throw new Error(`${record.question_id} mark-scheme asset not found: ${markSchemeArtifact}`);
  }

  record.student_runtime_safe = true;
  record.review_status = 'reviewed';
  record.subparts = sanitizeSubparts(record.subparts);
  record.quality_gate = {
    ...originalQualityGate,
    canonical_assets_ok: true,
    question_crop_ok: true,
    mark_scheme_crop_ok: true,
    marks_consistent: true,
    paper_total_consistent: true,
    text_only_display_allowed: false,
    visual_required: true,
    content_lab_generation_allowed: false,
    reason_codes: [
      'text_only_blocked_visual_required',
      'content_lab_blocked_topic_pack_import',
    ],
  };
  record.usage_roles = {
    ...(record.usage_roles ?? {}),
    canonical_practice: 'allow',
    field_guide_source: 'block_until_reviewed',
    quick_check_source: 'block_until_reviewed',
    warmup_generator_source: 'block_until_reviewed',
    guardian_candidate: 'block_until_reviewed',
    p3_readiness_metric: 'include',
  };
  record.asterion_import = {
    source: 'exam-bank-topic-packs',
    imported_at: PROMOTION_DATE,
    source_repo_name: sourceRepoName,
    source_topic_packet_dir: sourceRepoRelativePath(path.join(topicPackDir, 'p3', promotion.packetTopic)),
    source_manifest_path: sourceRepoRelativePath(sourceManifestPath(promotion.packetTopic)),
    source_packet_pdf_path: sourceRepoRelativePath(sourcePacketPath(promotion.packetTopic)),
    source_schema_name: manifest.schema_name,
    source_schema_version: manifest.schema_version,
    source_generated_at: manifest.generated_at,
    source_topic_id: manifest.topic_id,
    source_topic_label: manifest.topic_label,
    source_question_id: manifestRecord.question_id,
    source_label: manifestRecord.source_label,
    source_paper_code: manifestRecord.source_paper_code,
    source_review_status_marker: manifestRecord.review_status_marker,
    source_review_decision_action: manifestRecord.review_decision_action,
    source_review_reasons: manifestRecord.review_reasons ?? [],
    source_warnings: manifestRecord.warnings ?? [],
    promoted_topic_slug: promotion.topicSlug,
    promoted_topic_id: topicIdForSlug(promotion.topicSlug),
    promotion_basis: 'topic-pack-routing-plus-human-visual-image-pair-review',
    self_marking_mode: 'coarse_image_mark_scheme',
    original_quality_gate: originalQualityGate,
  };
  return record;
}

function updateMetadata(runtimeBank) {
  runtimeBank.record_count = runtimeBank.questions.length;
  const p3SafeCount = runtimeBank.questions.filter((question) => (
    question.course_id === 'p3'
    && question.paper_family === 'p3'
    && question.student_runtime_safe === true
    && question.review_status === 'reviewed'
  )).length;

  for (const component of runtimeBank.components ?? []) {
    if (component.course_id === 'p3') component.student_runtime_safe_record_count = p3SafeCount;
  }
  for (const course of runtimeBank.courses ?? []) {
    if (course.course_id === 'p3') course.student_runtime_safe_record_count = p3SafeCount;
  }
}

function updateRoutingRecord(routing, id, promotion, manifestRecord, manifest) {
  const route = routing.records?.[id];
  if (!route) throw new Error(`${id} missing from topic routing sidecar.`);
  route.primary_topic_id = topicIdForSlug(promotion.topicSlug);
  route.topic_distribution = [{ topic_id: topicIdForSlug(promotion.topicSlug), fit_percent: 100 }];
  route.confidence = 'high';
  route.review_required = false;
  route.review_reasons = [];
  route.evidence_used = Array.from(new Set([
    ...(Array.isArray(route.evidence_used) ? route.evidence_used : []),
    'topic_packet_reviewed_topic',
    'human_visual_image_pair_review',
  ]));
  route.route_review_status = 'topic_pack_promoted';
  route.route_approved = true;
  route.asterion_import = {
    source: 'exam-bank-topic-packs',
    imported_at: PROMOTION_DATE,
    source_repo_name: sourceRepoName,
    source_topic_packet_dir: sourceRepoRelativePath(path.join(topicPackDir, 'p3', promotion.packetTopic)),
    source_manifest_path: sourceRepoRelativePath(sourceManifestPath(promotion.packetTopic)),
    source_schema_name: manifest.schema_name,
    source_schema_version: manifest.schema_version,
    source_question_id: manifestRecord.question_id,
    source_review_status_marker: manifestRecord.review_status_marker,
    source_review_decision_action: manifestRecord.review_decision_action,
    source_review_reasons: manifestRecord.review_reasons ?? [],
    source_warnings: manifestRecord.warnings ?? [],
    promoted_topic_slug: promotion.topicSlug,
    promoted_topic_id: topicIdForSlug(promotion.topicSlug),
  };
}

const catalog = await readJson(catalogPath);
const runtimeBank = await readJson(runtimePath);
const routing = await readJson(routingPath);
const catalogById = new Map(catalog.questions.map((record) => [record.question_id, record]));
const runtimeById = new Map(runtimeBank.questions.map((record) => [record.question_id, record]));
const overlayQuestions = [];
const overlayRoutingRecords = {};
const imported = [];
const updated = [];

for (const promotion of PROMOTIONS) {
  const manifest = await readJson(sourceManifestPath(promotion.packetTopic));
  const manifestById = new Map(manifest.included_records.map((record) => [record.question_id, record]));

  for (const id of promotion.ids) {
    const sourceRecord = catalogById.get(id);
    const manifestRecord = manifestById.get(id);
    if (!sourceRecord) throw new Error(`${id} missing from catalog.`);
    if (!manifestRecord) throw new Error(`${id} missing from topic packet ${promotion.packetTopic}.`);
    if (sourceRecord.paper_family !== 'p3' || sourceRecord.course_id !== 'p3') {
      throw new Error(`${id} is not a P3 record.`);
    }
    if (!routeTopicMatches(routing.records?.[id], promotion.topicSlug)) {
      throw new Error(`${id} routing does not match ${promotion.topicSlug}.`);
    }

    const promoted = promotedRecord(sourceRecord, manifest, manifestRecord, promotion);
    if (runtimeById.has(id)) {
      updated.push(id);
    } else {
      imported.push(id);
    }
    overlayQuestions.push(promoted);
    const overlayRouting = { records: { [id]: deepClone(routing.records[id]) } };
    updateRoutingRecord(overlayRouting, id, promotion, manifestRecord, manifest);
    overlayRoutingRecords[id] = overlayRouting.records[id];
  }
}

overlayQuestions.sort((left, right) => String(left.question_id).localeCompare(String(right.question_id)));

const overlay = {
  schema_name: 'asterion.p3_exam_training_topic_pack_refresh',
  schema_version: 1,
  generated_at: PROMOTION_DATE,
  source_repo_name: sourceRepoName,
  source_topic_packet_dir: sourceRepoRelativePath(topicPackDir),
  promotion_basis: 'topic-pack-routing-plus-human-visual-image-pair-review',
  self_marking_mode: 'coarse_image_mark_scheme',
  promoted_question_ids: overlayQuestions.map((record) => record.question_id),
  promotions: PROMOTIONS,
  questions: overlayQuestions,
  routing_records: overlayRoutingRecords,
};

await writeFile(overlayPath, `${JSON.stringify(overlay, null, 2)}\n`);

console.log(JSON.stringify({
  source_repo_name: sourceRepoName,
  topic_packet_dir: sourceRepoRelativePath(topicPackDir),
  overlay_path: overlayPath,
  imported,
  updated,
  promoted_record_count: overlayQuestions.length,
  promoted_source_manifests: PROMOTIONS.map((promotion) => sourceRepoRelativePath(sourceManifestPath(promotion.packetTopic))),
}, null, 2));
