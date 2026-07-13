import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${label}.`);
  return value.trim();
}

function posixRelative(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function sha256File(filePath) {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function sha256FileSync(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256Value(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function exactValueMatch(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

async function sourceAssetFingerprints(sourceRepo, assetPaths, label) {
  const fingerprints = [];
  for (const assetPath of asArray(assetPaths)) {
    const normalizedPath = nonEmptyString(assetPath, `${label} asset path`).replace(/^\/+/, '');
    const absolutePath = path.join(sourceRepo, 'output', normalizedPath);
    if (!existsSync(absolutePath)) throw new Error(`Missing ${label} source asset: ${normalizedPath}.`);
    fingerprints.push({ path: normalizedPath, sha256: await sha256File(absolutePath) });
  }
  if (!fingerprints.length) throw new Error(`Missing ${label} source assets.`);
  return fingerprints;
}

function sourceRepoHead(sourceRepo) {
  return execFileSync('git', ['-C', sourceRepo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function normalizedIdentity(courseId, paperFamily, record) {
  return {
    course_id: courseId,
    paper_family: paperFamily,
    question_id: nonEmptyString(record.question_id, 'question_id'),
    paper: nonEmptyString(record.paper, `paper for ${record.question_id}`),
    question_number: String(record.question_number ?? '').trim(),
  };
}

function assertUniqueQuestionIds(records) {
  const seen = new Map();
  for (const record of records) {
    const id = nonEmptyString(record?.identity?.question_id, 'projection identity question_id');
    const previous = seen.get(id);
    if (previous) {
      throw new Error(`Question ID collision: ${id} appears in both ${previous} and ${record.source.topic_id}.`);
    }
    seen.set(id, record.source.topic_id);
  }
}

function countBy(records, predicate) {
  return records.reduce((count, record) => count + (predicate(record) ? 1 : 0), 0);
}

export async function buildCourseTopicPacketSnapshot({ courseId, paperFamily = courseId, sourceRepo }) {
  const normalizedCourseId = nonEmptyString(courseId, 'course id').toLowerCase();
  const normalizedPaperFamily = nonEmptyString(paperFamily, 'paper family').toLowerCase();
  const resolvedSourceRepo = path.resolve(sourceRepo);
  const packetRoot = path.join(resolvedSourceRepo, 'output', 'topic_packets', normalizedPaperFamily);
  const taxonomyPath = path.join(resolvedSourceRepo, 'exam_bank_taxonomy', 'caie_9709_syllabus_topics.v1.json');
  const sourceRepoCommit = sourceRepoHead(resolvedSourceRepo);
  const taxonomy = await readJson(taxonomyPath);
  const component = asArray(taxonomy.components).find((candidate) => candidate.paper_family === normalizedPaperFamily);
  if (!component) throw new Error(`No taxonomy component found for ${normalizedPaperFamily}.`);

  const topics = [];
  const records = [];
  for (const topic of asArray(component.topics)) {
    const topicId = nonEmptyString(topic.topic_id, 'taxonomy topic_id');
    const manifestPath = path.join(packetRoot, topicId, 'manifest.json');
    if (!existsSync(manifestPath)) throw new Error(`Missing topic-packet manifest: ${manifestPath}`);
    const manifest = await readJson(manifestPath);
    if (manifest.paper_family !== normalizedPaperFamily || manifest.topic_id !== topicId) {
      throw new Error(`Manifest identity mismatch for ${topicId}.`);
    }
    if (manifest.question_count !== asArray(manifest.included_records).length) {
      throw new Error(`Manifest count mismatch for ${topicId}.`);
    }
    const manifestSha256 = await sha256File(manifestPath);
    const sourceManifestPath = posixRelative(resolvedSourceRepo, manifestPath);
    topics.push({
      official_section_code: String(topic.official_section_code ?? ''),
      topic_id: topicId,
      topic_label: nonEmptyString(topic.topic_label, `topic label for ${topicId}`),
      canonical_topic_id: nonEmptyString(topic.canonical_topic_id, `canonical topic id for ${topicId}`),
      manifest: {
        path: sourceManifestPath,
        sha256: manifestSha256,
        schema_name: nonEmptyString(manifest.schema_name, `manifest schema for ${topicId}`),
        schema_version: manifest.schema_version,
        generated_at: nonEmptyString(manifest.generated_at, `manifest generated_at for ${topicId}`),
        projection_fingerprint: nonEmptyString(manifest.projection_fingerprint, `projection fingerprint for ${topicId}`),
      },
      counts: {
        total: manifest.question_count,
        source_packet_approved: manifest.approved_count,
        source_packet_review_required: manifest.review_required_count,
        missing_answer: manifest.missing_answer_count,
      },
    });

    for (const sourceRecord of manifest.included_records) {
      const identity = normalizedIdentity(normalizedCourseId, normalizedPaperFamily, sourceRecord);
      const questionAssets = await sourceAssetFingerprints(resolvedSourceRepo, sourceRecord.question_image_paths, `question image for ${identity.question_id}`);
      const markSchemeAssets = await sourceAssetFingerprints(resolvedSourceRepo, sourceRecord.mark_scheme_image_paths, `mark-scheme image for ${identity.question_id}`);
      records.push({
        identity,
        source: {
          source_repo_name: path.basename(resolvedSourceRepo),
          source_repo_head: sourceRepoCommit,
          manifest_path: sourceManifestPath,
          manifest_sha256: manifestSha256,
          manifest_projection_fingerprint: manifest.projection_fingerprint,
          topic_id: topicId,
          topic_label: manifest.topic_label,
          canonical_topic_id: topic.canonical_topic_id,
          packet_section: sourceRecord.section,
          source_label: sourceRecord.source_label,
          source_paper_code: sourceRecord.source_paper_code,
          source_review_status_marker: sourceRecord.review_status_marker || null,
          source_review_decision_action: sourceRecord.review_decision_action || null,
          source_review_reasons: asArray(sourceRecord.review_reasons),
          source_warnings: asArray(sourceRecord.warnings),
          question_image_paths: asArray(sourceRecord.question_image_paths),
          mark_scheme_image_paths: asArray(sourceRecord.mark_scheme_image_paths),
          question_assets: questionAssets,
          mark_scheme_assets: markSchemeAssets,
          answer_available: sourceRecord.answer_available === true,
          marks: typeof sourceRecord.marks === 'number' ? sourceRecord.marks : null,
        },
        review: {
          disposition: 'hold',
          review_status: 'pending',
          student_runtime_safe: false,
          reviewed_topic_id: null,
          reviewed_skill_ids: [],
          reviewer: null,
          reviewed_at: null,
          notes: null,
          visual_audit: null,
        },
      });
    }
  }

  assertUniqueQuestionIds(records);
  const totals = {
    records: records.length,
    source_packet_approved: countBy(records, (record) => record.source.packet_section === 'approved'),
    source_packet_review_required: countBy(records, (record) => record.source.packet_section === 'review_required'),
    asterion_reviewed: countBy(records, (record) => record.review.review_status === 'reviewed'),
    student_runtime_safe: countBy(records, (record) => record.review.student_runtime_safe === true),
    promotion_ready: countBy(records, isPromotionEligible),
  };
  return {
    schema_name: 'asterion.course_topic_packet_review_projection',
    schema_version: 1,
    projection_version: `${normalizedCourseId}-topic-packets-${topics.at(-1)?.manifest.generated_at.slice(0, 10) ?? 'unknown'}-v1`,
    course_id: normalizedCourseId,
    paper_family: normalizedPaperFamily,
    source: {
      repo_name: path.basename(resolvedSourceRepo),
      repo_head: sourceRepoCommit,
      topic_packet_root: posixRelative(resolvedSourceRepo, packetRoot),
      taxonomy_path: posixRelative(resolvedSourceRepo, taxonomyPath),
      read_only: true,
    },
    policy: {
      source_packet_approval_is_not_asterion_review: true,
      default_disposition: 'hold',
      promotion_requires: [
        'disposition=promote',
        'review_status=reviewed',
        'student_runtime_safe=true',
        'contract-backed topic and atomic skills',
        'fingerprint-matched visual audit',
      ],
      difficulty_metadata_drives_promotion: false,
    },
    totals,
    topics,
    records,
  };
}

export function isPromotionEligible(record) {
  return record?.review?.disposition === 'promote'
    && record?.review?.review_status === 'reviewed'
    && record?.review?.student_runtime_safe === true;
}

export async function verifyProjectionSources({ projection, sourceRepo }) {
  const resolvedSourceRepo = path.resolve(sourceRepo);
  const actualHead = sourceRepoHead(resolvedSourceRepo);
  if (projection.source?.repo_head !== actualHead) {
    throw new Error(`Source repo HEAD drift: expected ${projection.source?.repo_head}, found ${actualHead}.`);
  }
  const manifests = new Map();
  for (const topic of asArray(projection.topics)) {
    const manifestPath = path.join(resolvedSourceRepo, topic.manifest.path);
    const sha256 = await sha256File(manifestPath);
    const manifest = await readJson(manifestPath);
    if (sha256 !== topic.manifest.sha256) throw new Error(`Manifest SHA-256 drift for ${topic.topic_id}.`);
    if (manifest.projection_fingerprint !== topic.manifest.projection_fingerprint) {
      throw new Error(`Manifest fingerprint drift for ${topic.topic_id}.`);
    }
    manifests.set(topic.topic_id, manifest);
  }
  assertUniqueQuestionIds(asArray(projection.records));
  for (const record of asArray(projection.records)) {
    const manifest = manifests.get(record.source.topic_id);
    const sourceRecord = asArray(manifest?.included_records).find((candidate) => candidate.question_id === record.identity.question_id);
    if (!sourceRecord) throw new Error(`${record.identity.question_id} missing from pinned source manifest.`);
    if (record.source.manifest_sha256 !== projection.topics.find((topic) => topic.topic_id === record.source.topic_id)?.manifest.sha256) {
      throw new Error(`Record manifest provenance drift for ${record.identity.question_id}.`);
    }
    for (const [label, assets] of [
      ['question', record.source.question_assets],
      ['mark-scheme', record.source.mark_scheme_assets],
    ]) {
      if (!asArray(assets).length) throw new Error(`${record.identity.question_id} has no pinned ${label} asset fingerprints.`);
      for (const asset of assets) {
        const actualSha256 = await sha256File(path.join(resolvedSourceRepo, 'output', nonEmptyString(asset.path, `${label} asset path`)));
        if (actualSha256 !== asset.sha256) throw new Error(`${label} asset SHA-256 drift for ${record.identity.question_id}.`);
      }
    }
  }
  return true;
}

function canonicalAssetPath(record, key) {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value.replace(/^\/+/, '') : null;
}

function asterionAssetPaths(candidate) {
  const questionNumber = String(candidate.identity.question_number || '').padStart(2, '0');
  return {
    question: `${candidate.identity.paper_family}/${candidate.identity.paper}/questions/q${questionNumber}.png`,
    markScheme: `${candidate.identity.paper_family}/${candidate.identity.paper}/mark_scheme/q${questionNumber}.png`,
  };
}

function sourceBankRecordForCandidate(candidate, sourceBankById) {
  const source = sourceBankById.get(candidate.identity.question_id);
  if (!source) return null;
  const record = JSON.parse(JSON.stringify(source));
  const targets = asterionAssetPaths(candidate);
  record.course_id = candidate.identity.course_id;
  record.paper_family = candidate.identity.paper_family;
  record.paper = candidate.identity.paper;
  record.question_number = candidate.identity.question_number;
  record.canonical_question_artifact = targets.question;
  record.canonical_mark_scheme_artifact = targets.markScheme;
  record.question_image_path = targets.question;
  record.mark_scheme_image_path = targets.markScheme;
  record.question_image_paths = [targets.question];
  record.mark_scheme_image_paths = [targets.markScheme];
  record.asterion_source_assets = {
    question: candidate.source.question_image_paths[0] ?? null,
    mark_scheme: candidate.source.mark_scheme_image_paths[0] ?? null,
  };
  return record;
}

function courseContractBinding(courseContract) {
  if (courseContract?.schemaName !== 'asterion.course-study-contract' || courseContract?.schemaVersion !== 1) {
    throw new Error('Promotion requires a supported course study contract.');
  }
  const courseId = nonEmptyString(courseContract.courseId, 'course contract course ID');
  const topics = asArray(courseContract.topics).map((topic) => ({
    id: nonEmptyString(topic.id, 'course contract topic ID'),
    slug: nonEmptyString(topic.slug, `course contract slug for ${topic.id}`),
  }));
  const skills = asArray(courseContract.skills).map((skill) => ({
    id: nonEmptyString(skill.id, 'course contract skill ID'),
    topic_id: nonEmptyString(skill.topicId, `course contract topic for ${skill.id}`),
    readiness: skill.readiness,
    review_status: skill.reviewStatus,
  }));
  if (!topics.length || !skills.length) throw new Error('Promotion requires a non-empty course topic and skill contract.');
  const topicIds = new Set(topics.map((topic) => topic.id));
  if (topicIds.size !== topics.length) throw new Error('Course contract contains a topic ID collision.');
  const skillIds = new Set(skills.map((skill) => skill.id));
  if (skillIds.size !== skills.length) throw new Error('Course contract contains a skill ID collision.');
  for (const skill of skills) {
    if (!topicIds.has(skill.topic_id)) throw new Error(`${skill.id} has an unknown course-contract topic ${skill.topic_id}.`);
  }
  return {
    schema_name: courseContract.schemaName,
    schema_version: courseContract.schemaVersion,
    course_id: courseId,
    syllabus_version: nonEmptyString(courseContract.syllabus?.version, 'course contract syllabus version'),
    topic_skill_sha256: sha256Value({ topics, skills }),
  };
}

function reviewedContractPlacement(candidate, projection, courseContract) {
  const id = candidate.identity.question_id;
  const reviewedTopicId = nonEmptyString(candidate.review.reviewed_topic_id, `reviewed topic for ${id}`);
  const projectionTopic = asArray(projection.topics).find((topic) => topic.canonical_topic_id === reviewedTopicId);
  if (!projectionTopic) throw new Error(`${id} reviewed topic is not present in the pinned P1 topic projection: ${reviewedTopicId}.`);
  const normalizedPacketTopic = nonEmptyString(projectionTopic.topic_id, `packet topic for ${id}`).replaceAll('_', '-');
  const contractTopic = asArray(courseContract.topics).find((topic) => topic.slug === normalizedPacketTopic);
  if (!contractTopic) throw new Error(`${id} reviewed topic has no exact course-contract topic: ${reviewedTopicId}.`);

  const reviewedSkillIds = asArray(candidate.review.reviewed_skill_ids).map((skillId) => nonEmptyString(skillId, `reviewed skill for ${id}`));
  if (!reviewedSkillIds.length) throw new Error(`${id} has no reviewed skill IDs.`);
  if (new Set(reviewedSkillIds).size !== reviewedSkillIds.length) throw new Error(`${id} has duplicate reviewed skill IDs.`);
  const contractSkills = new Map(asArray(courseContract.skills).map((skill) => [skill.id, skill]));
  for (const skillId of reviewedSkillIds) {
    const skill = contractSkills.get(skillId);
    if (!skill) throw new Error(`${id} has unknown P1 course-contract skill ${skillId}.`);
    if (skill.topicId !== contractTopic.id) {
      throw new Error(`${id} reviewed skill ${skillId} belongs to ${skill.topicId}, not ${contractTopic.id}.`);
    }
    if (skill.readiness !== 'ready' || skill.reviewStatus !== 'reviewed') {
      throw new Error(`${id} reviewed skill ${skillId} is not ready and reviewed in the course contract.`);
    }
  }
  return { reviewedTopicId, reviewedRegionId: normalizedPacketTopic, contractTopic, reviewedSkillIds };
}

function verifiedVisualAudit(candidate, projection) {
  const id = candidate.identity.question_id;
  const audit = candidate.review.visual_audit;
  if (!audit || audit.status !== 'passed') throw new Error(`${id} is missing a passed visual audit.`);
  nonEmptyString(audit.auditor, `visual auditor for ${id}`);
  const auditedAt = nonEmptyString(audit.audited_at, `visual audit timestamp for ${id}`);
  if (!Number.isFinite(Date.parse(auditedAt))) throw new Error(`${id} has an invalid visual audit timestamp.`);
  if (audit.source_projection_version !== projection.projection_version) {
    throw new Error(`${id} visual audit is stale for source projection ${projection.projection_version}.`);
  }
  if (audit.source_manifest_sha256 !== candidate.source.manifest_sha256
      || audit.source_manifest_projection_fingerprint !== candidate.source.manifest_projection_fingerprint) {
    throw new Error(`${id} visual audit manifest fingerprint does not match its pinned source.`);
  }
  if (!exactValueMatch(audit.question_assets, candidate.source.question_assets)
      || !exactValueMatch(audit.mark_scheme_assets, candidate.source.mark_scheme_assets)) {
    throw new Error(`${id} visual audit asset fingerprints do not match its pinned source.`);
  }
  return audit;
}

function verifiedRuntimeAsset({ id, label, target, expectedAsset, assetRoot, sourceRepoPath }) {
  if (!expectedAsset?.path || !expectedAsset?.sha256) throw new Error(`${id} has no pinned ${label} asset fingerprint.`);
  const targetPath = path.join(assetRoot, target);
  if (existsSync(targetPath)) {
    const actualSha256 = sha256FileSync(targetPath);
    if (actualSha256 !== expectedAsset.sha256) {
      throw new Error(`${id} existing runtime ${label} asset SHA-256 does not match the reviewed source.`);
    }
    return;
  }
  const sourcePath = sourceRepoPath ? path.join(sourceRepoPath, 'output', expectedAsset.path) : null;
  if (!sourcePath || !existsSync(sourcePath)) throw new Error(`${id} missing runtime and source ${label} asset: ${target}.`);
  if (sha256FileSync(sourcePath) !== expectedAsset.sha256) {
    throw new Error(`${id} source ${label} asset SHA-256 does not match the reviewed source.`);
  }
}

function addOverlayIntegrity(overlay) {
  return { ...overlay, integrity_sha256: sha256Value(overlay) };
}

export function buildPromotionOverlay({ projection, catalog, assetRoot, sourceBank, courseContract }) {
  if (projection?.schema_name !== 'asterion.course_topic_packet_review_projection' || projection?.schema_version !== 1) {
    throw new Error('Promotion requires a supported source review projection.');
  }
  if (projection.course_id !== 'p1' || projection.paper_family !== 'p1') {
    throw new Error('Promotion source projection must be P1.');
  }
  const contractBinding = courseContractBinding(courseContract);
  if (contractBinding.course_id !== projection.course_id) throw new Error('Course contract and source projection identities do not match.');
  assertUniqueQuestionIds(asArray(projection.records));
  const eligible = asArray(projection.records).filter(isPromotionEligible);
  const catalogRecords = asArray(catalog?.questions);
  const catalogById = new Map();
  for (const record of catalogRecords) {
    const id = nonEmptyString(record.question_id, 'catalog question_id');
    if (catalogById.has(id)) throw new Error(`Catalog question ID collision: ${id}.`);
    catalogById.set(id, record);
  }
  const sourceBankById = new Map(asArray(sourceBank?.questions).map((record) => [record.question_id, record]));

  const questions = [];
  const routingRecords = {};
  const assetImports = [];
  for (const candidate of eligible) {
    const id = candidate.identity.question_id;
    const catalogRecord = catalogById.get(id) ?? sourceBankRecordForCandidate(candidate, sourceBankById);
    if (!catalogRecord) throw new Error(`${id} is not present in the Asterion catalog or pinned source bank.`);
    if (catalogRecord.course_id !== projection.course_id || catalogRecord.paper_family !== projection.paper_family) {
      throw new Error(`${id} catalog course identity does not match ${projection.course_id}.`);
    }
    const { reviewedTopicId, reviewedRegionId, reviewedSkillIds } = reviewedContractPlacement(candidate, projection, courseContract);
    const reviewer = nonEmptyString(candidate.review.reviewer, `reviewer for ${id}`);
    const reviewedAt = nonEmptyString(candidate.review.reviewed_at, `review timestamp for ${id}`);
    if (!Number.isFinite(Date.parse(reviewedAt))) throw new Error(`${id} has an invalid review timestamp.`);
    const visualAudit = verifiedVisualAudit(candidate, projection);
    if (Date.parse(reviewedAt) < Date.parse(visualAudit.audited_at)) {
      throw new Error(`${id} review decision predates its visual audit.`);
    }
    const expectedTargets = asterionAssetPaths(candidate);
    const questionTarget = canonicalAssetPath(catalogRecord, 'canonical_question_artifact');
    const markSchemeTarget = canonicalAssetPath(catalogRecord, 'canonical_mark_scheme_artifact');
    if (questionTarget !== expectedTargets.question || markSchemeTarget !== expectedTargets.markScheme) {
      throw new Error(`${id} canonical runtime asset paths do not match its normalized paper identity.`);
    }
    if (asArray(candidate.source.question_assets).length !== 1 || asArray(candidate.source.mark_scheme_assets).length !== 1) {
      throw new Error(`${id} promotion requires exactly one canonical question and mark-scheme crop.`);
    }
    verifiedRuntimeAsset({ id, label: 'question', target: questionTarget, expectedAsset: candidate.source.question_assets[0], assetRoot, sourceRepoPath: projection.source?.repo_path });
    verifiedRuntimeAsset({ id, label: 'mark-scheme', target: markSchemeTarget, expectedAsset: candidate.source.mark_scheme_assets[0], assetRoot, sourceRepoPath: projection.source?.repo_path });
    const promoted = JSON.parse(JSON.stringify(catalogRecord));
    promoted.review_status = 'reviewed';
    promoted.student_runtime_safe = true;
    promoted.topic_id = reviewedTopicId;
    promoted.asterion_import = {
      source: 'course-topic-packet-review',
      source_repo_name: candidate.source.source_repo_name,
      source_repo_head: candidate.source.source_repo_head,
      source_manifest_path: candidate.source.manifest_path,
      source_manifest_sha256: candidate.source.manifest_sha256,
      source_manifest_projection_fingerprint: candidate.source.manifest_projection_fingerprint,
      source_question_id: id,
      source_projection_version: projection.projection_version,
      source_packet_topic_id: candidate.source.topic_id,
      source_packet_section: candidate.source.packet_section,
      source_question_assets: candidate.source.question_assets,
      source_mark_scheme_assets: candidate.source.mark_scheme_assets,
      reviewed_topic_id: reviewedTopicId,
      reviewed_skill_ids: reviewedSkillIds,
      reviewer,
      reviewed_at: reviewedAt,
      visual_audit: visualAudit,
      course_contract: contractBinding,
      promotion_basis: 'explicit-asterion-human-review',
    };
    questions.push(promoted);
    const targets = asterionAssetPaths(candidate);
    if (!existsSync(path.join(assetRoot, targets.question)) || !existsSync(path.join(assetRoot, targets.markScheme))) {
      assetImports.push({
        question_id: id,
        question: { source: candidate.source.question_assets?.[0]?.path, target: targets.question, sha256: candidate.source.question_assets?.[0]?.sha256 },
        mark_scheme: { source: candidate.source.mark_scheme_assets?.[0]?.path, target: targets.markScheme, sha256: candidate.source.mark_scheme_assets?.[0]?.sha256 },
      });
    }
    routingRecords[id] = {
      primary_topic_id: reviewedTopicId,
      mapped_region_id: reviewedRegionId,
      topic_distribution: [{ topic_id: reviewedTopicId, fit_percent: 100, mapped_region_id: reviewedRegionId }],
      confidence: 'high',
      review_required: false,
      review_reasons: [],
      route_approved: true,
      route_review_status: 'course_topic_packet_promoted',
      evidence_used: ['pinned_topic_packet_source', 'explicit_asterion_human_review'],
      reviewed_skill_ids: reviewedSkillIds,
      asterion_import: promoted.asterion_import,
    };
  }
  questions.sort((left, right) => left.question_id.localeCompare(right.question_id));
  const runtimeAssets = questions.map((question) => {
    const record = eligible.find((candidate) => candidate.identity.question_id === question.question_id);
    return {
      question_id: question.question_id,
      question: { target: question.canonical_question_artifact, sha256: record.source.question_assets[0].sha256 },
      mark_scheme: { target: question.canonical_mark_scheme_artifact, sha256: record.source.mark_scheme_assets[0].sha256 },
    };
  });
  return addOverlayIntegrity({
    schema_name: 'asterion.course_topic_packet_promotion_overlay',
    schema_version: 1,
    course_id: projection.course_id,
    paper_family: projection.paper_family,
    source_projection_version: projection.projection_version,
    source_projection_schema_version: projection.schema_version,
    source_repo_head: projection.source.repo_head,
    course_contract: contractBinding,
    promoted_question_ids: questions.map((record) => record.question_id),
    questions,
    routing_records: routingRecords,
    asset_imports: assetImports,
    runtime_assets: runtimeAssets,
  });
}

async function copyOverlayAssets({ overlay, sourceRepo, assetRoot }) {
  for (const item of asArray(overlay.asset_imports)) {
    for (const key of ['question', 'mark_scheme']) {
      const entry = item[key];
      if (!entry?.source || !entry?.target) throw new Error(`${item.question_id} has an invalid ${key} asset import.`);
      const sourcePath = path.join(sourceRepo, 'output', entry.source);
      const targetPath = path.join(assetRoot, entry.target);
      if (!existsSync(sourcePath)) throw new Error(`${item.question_id} source ${key} asset is missing: ${sourcePath}`);
      const actualSha256 = await sha256File(sourcePath);
      if (!entry.sha256 || actualSha256 !== entry.sha256) throw new Error(`${item.question_id} source ${key} asset fingerprint drift.`);
      await mkdir(path.dirname(targetPath), { recursive: true });
      await copyFile(sourcePath, targetPath);
      if (sha256FileSync(targetPath) !== entry.sha256) {
        throw new Error(`${item.question_id} copied ${key} asset fingerprint drift.`);
      }
    }
  }
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const values = { command };
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index]?.replace(/^--/, '').replaceAll('-', '_');
    if (!key || !rest[index + 1]) throw new Error(`Invalid CLI arguments near ${rest[index] ?? 'end'}.`);
    values[key] = rest[index + 1];
  }
  return values;
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function loadP1CourseContract() {
  const moduleUrl = pathToFileURL(path.join(repoRoot, 'src/data/p1CourseContract.ts')).href;
  const loader = `import(${JSON.stringify(moduleUrl)}).then((module) => process.stdout.write(JSON.stringify(module.P1_COURSE_STUDY_CONTRACT)))`;
  const serialized = execFileSync(process.execPath, [
    '--no-warnings=ExperimentalWarning',
    '--experimental-strip-types',
    '--input-type=module',
    '--eval',
    loader,
  ], { encoding: 'utf8', cwd: repoRoot });
  return JSON.parse(serialized);
}

export async function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.command === 'snapshot') {
    const projection = await buildCourseTopicPacketSnapshot({
      courseId: args.course,
      paperFamily: args.paper_family ?? args.course,
      sourceRepo: args.source_repo,
    });
    await writeJson(path.resolve(args.output), projection);
    return projection.totals;
  }
  if (args.command === 'verify') {
    const projection = await readJson(path.resolve(args.projection));
    await verifyProjectionSources({ projection, sourceRepo: args.source_repo });
    return { verified: true, records: projection.records.length };
  }
  if (args.command === 'promote') {
    const projection = await readJson(path.resolve(args.projection));
    await verifyProjectionSources({ projection, sourceRepo: args.source_repo });
    projection.source.repo_path = path.resolve(args.source_repo);
    const catalog = await readJson(path.resolve(args.catalog));
    const sourceBank = args.source_bank ? await readJson(path.resolve(args.source_bank)) : undefined;
    const overlay = buildPromotionOverlay({
      projection,
      catalog,
      assetRoot: path.resolve(args.asset_root),
      sourceBank,
      courseContract: loadP1CourseContract(),
    });
    await copyOverlayAssets({ overlay, sourceRepo: path.resolve(args.source_repo), assetRoot: path.resolve(args.asset_root) });
    await writeJson(path.resolve(args.output), overlay);
    return { promoted: overlay.questions.length };
  }
  throw new Error('Usage: course-topic-packet-review.mjs <snapshot|verify|promote> [options]');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  runCli().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

export const DEFAULT_ASTERION_ROOT = repoRoot;
