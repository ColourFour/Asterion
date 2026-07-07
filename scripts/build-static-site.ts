import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { COURSES, P3_COURSE_ID, type CourseMetadata } from '../src/data/courses';
import { examQuestionSupportPrompt } from '../src/data/examQuestionSupport';
import {
  P1_REPAIR_MODULES,
  type P1RepairModuleDefinition,
  type P1RepairQuestion,
} from '../src/data/p1RepairLane';
import { buildP3ExamLaddersFromMappedQuestions, P3_EXAM_LADDER_LEVELS, type P3ExamLadder, type P3MappedExamQuestionIdsBySkill } from '../src/data/p3ExamLadders';
import { P3_DIAGNOSTIC_DURATION_TARGET_MINUTES, P3_DIAGNOSTIC_QUESTIONS, P3_DIAGNOSTIC_SECTIONS, type P3DiagnosticQuestion } from '../src/data/p3DiagnosticGate';
import { getFieldGuideTopicsForRegion, validateProblemFirstFieldGuideLessons, type FieldGuideTopic, type FieldGuideTopicExample, type ProblemFirstLesson } from '../src/data/fieldGuideTopics';
import { getLearnStepsForRegion, validateLearnSteps, type LearnStep } from '../src/data/learnModeLessons';
import { P3_OFFICIAL_TOPICS, P3_SKILL_CONTRACT, type P3OfficialTopic, type P3SkillContractEntry } from '../src/data/p3SkillContract';
import {
  skillCheckAnswerSpecForItem,
  skillCheckCheckabilityReport,
  skillCheckContractForItem,
  skillCheckTopicMigrationSummary,
  type SkillCheckItem,
} from '../src/data/skillCheckItems';
import { buildSkillChecklistTopicGroups, totalSkillChecklistItems, type SkillChecklistTopicGroup } from '../src/lib/skillChecklist';
import { getGeneratedPracticeForRegion, normalizeGeneratedPracticeData, reviewedGeneratedPractice, type GeneratedPracticeItem } from '../src/lib/generatedPractice';
import { normalizeQuestionBankWithDiagnostics } from '../src/lib/normalizeQuestionBank';
import { filterTrainableQuestionsForRegion, isQuestionTrainable, isTrainableP3Question } from '../src/lib/questionTraining';
import { filterCourseExamQuestions, readableRoutingTopicLabel } from '../src/lib/courseExamTraining';
import { applyP3TopicPackRefreshOverlay } from '../src/lib/p3TopicPackRefreshOverlay';
import { REQUIRED_STATIC_STUDY_PAGE_PATHS, STATIC_STUDY_PAGE_ROUTES } from '../src/lib/staticStudyRoutes';
import { STUDY_TOPICS, type StudyTopic } from '../src/lib/topicStudy';
import { getTeachingSnippetsForRegion, normalizeTeachingSnippetsData, reviewedTeachingSnippets, type TeachingSnippet } from '../src/lib/teachingSnippets';
import { P3_COURSE_MAP } from '../src/lib/worldMap';
import type { NormalizedQuestion, QuestionMarkPoint, QuestionPartMark, QuickCheckTwoValueField, RegionDefinition } from '../src/types';
import { SKILL_CHECK_MISTAKE_TAGS } from '../src/skill-checks/mistakeRecovery';
import { answerFormatGuidance, type AnswerFormatGuidance } from '../src/lib/answerFormatGuidance';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirName = process.env.STATIC_SITE_OUTPUT_DIR ?? 'docs';
const outputRoot = path.resolve(repoRoot, outputDirName);
const publicRoot = path.join(repoRoot, 'public');
const staticStudyRoot = path.join(repoRoot, 'src/static-study');

if (!['docs', 'dist'].includes(path.relative(repoRoot, outputRoot))) {
  throw new Error('STATIC_SITE_OUTPUT_DIR must be either docs or dist.');
}

interface StaticSiteData {
  questions: NormalizedQuestion[];
  catalogRecords: NormalizedQuestion[];
  catalogQuestions: NormalizedQuestion[];
  generatedPractice: GeneratedPracticeItem[];
  teachingSnippets: TeachingSnippet[];
  p3SkillCoverageReport: unknown;
}

interface TopicContext {
  topic: StudyTopic;
  region: RegionDefinition;
  fieldGuideTopics: FieldGuideTopic[];
  learnSteps: LearnStep[];
  groups: SkillChecklistTopicGroup[];
  questions: NormalizedQuestion[];
}

interface P3SkillCoverageSummary {
  mappedExamQuestionCount?: number;
  mappedExamQuestionIds: string[];
}

interface P3SkillContractAvailability {
  fieldGuide: boolean;
  skillCheck: boolean;
  examTraining: boolean;
}

interface P3SkillContractPageRow {
  skill: P3SkillContractEntry;
  topic: StudyTopic;
  availability: P3SkillContractAvailability;
  examLadder: P3ExamLadder;
  skillCheckCheckability: P3SkillCheckabilitySummary;
  mappedExamQuestionCount?: number;
  statusLabel: 'Content available' | 'Learn content planned' | 'Checked practice planned' | 'Exam training planned' | 'Draft content';
}

interface P3SkillCheckabilitySummary {
  deterministic: number;
  notYetCheckable: number;
  unsupported: number;
  answerTypes: string[];
}

interface P3ExamReviewRequirement {
  regionId: string;
  name: string;
  fieldGuideTotal: number;
  requiredCheckIds: string[];
  fieldGuideHref: string;
  skillCheckHref: string;
}

interface SkillRepairRoute {
  skillId: string;
  regionId: string;
  label: string;
  href: string;
}

interface RenderPageOptions {
  pagePath: string;
  title: string;
  description: string;
  active: 'courses' | 'p1' | 'p3' | 'm1' | 's1' | 'p3-diagnostic' | 'p1-repair' | 'p3-topics' | 'p3-exam-training';
  body: string;
  bodyClass?: string;
  hideThemeToggle?: boolean;
  forcedTheme?: 'dark' | 'light';
}

const mathDelimiterPattern = /(\$\$[\s\S]+?\$\$|\$(?!\$)[\s\S]+?\$)/g;
const visibleGameTerms = [
  'Guardian Challenge',
  'Guardian',
  'XP',
  'gold',
  'avatar',
  'rank',
  'ranks',
  'level',
  'levels',
  'reward',
  'rewards',
  'fantasy',
  'game',
  'world map',
  'academy',
  'teacher area',
  'classroom',
];

const visibleCopyReplacements: Array<[RegExp, string]> = [
  [/Reviewer note:\s*[^.]*\./gi, ''],
  [/Later review (?:must|should) [^.]*\./gi, 'Check your class syllabus if your teacher has set a specific scope.'],
  [/Later review [^.]*\./gi, 'Check your class syllabus if your teacher has set a specific scope.'],
  [/This is a teacher-guided draft support item\./gi, 'This is an extra guided practice item.'],
  [/Use the matching draft Field Guide method/gi, 'Use the matching Learn method'],
  [/Draft\/generated practice/gi, 'Checked Practice'],
  [/practice\/generated practice/gi, 'Checked Practice'],
  [/generated practice/gi, 'Checked Practice'],
  [/Skill Practice/gi, 'Checked Practice'],
  [/Draft Skill Checks/gi, 'Checked Practice'],
  [/Draft Skill Check/gi, 'Checked Practice'],
  [/draft placeholder/gi, 'practice'],
  [/practice placeholder/gi, 'practice'],
  [/placeholder/gi, 'practice'],
  [/Draft\/source-filled[^.]*\./gi, ''],
  [/teacher-guided draft/gi, 'guided'],
  [/draft support-only/gi, 'guided practice'],
  [/draft support/gi, 'guided practice'],
  [/support-only/gi, 'practice'],
  [/support only/gi, 'practice'],
  [/support item/gi, 'practice item'],
  [/review-needed/gi, 'practice'],
  [/not reviewed exam questions?/gi, 'practice questions'],
  [/reviewed exam evidence/gi, 'exam practice'],
  [/reviewed assessment evidence/gi, 'exam practice'],
  [/reviewed P1 assessment evidence/gi, 'exam practice'],
  [/reviewed by-parts content/gi, 'by-parts content'],
  [/reviewed Paper 3/gi, 'Paper 3'],
  [/reviewed image-first/gi, 'image-first'],
  [/reviewed question/gi, 'question'],
  [/reviewed route/gi, 'route'],
  [/source PDF gap is documented for teacher audit/gi, 'use the worked route as your guide'],
  [/syllabus-scope audit/gi, 'syllabus scope check'],
  [/until P1 syllabus scope is audited/gi, 'until your teacher confirms your syllabus scope'],
  [/until scope is reviewed/gi, 'when this appears in your class syllabus'],
  [/still needs course-contract review/gi, 'is best checked against your class syllabus'],
  [/course-contract review/gi, 'syllabus check'],
  [/course contract/gi, 'course plan'],
  [/contract/gi, 'plan'],
  [/mastery or readiness evidence/gi, 'checked evidence'],
  [/mastery, readiness, marks, teacher evidence, final assessment evidence/gi, 'saved marks'],
  [/mastery evidence/gi, 'checked evidence'],
  [/readiness evidence/gi, 'checked evidence'],
  [/assessment evidence/gi, 'exam practice'],
  [/exam evidence/gi, 'exam practice'],
  [/teacher evidence/gi, 'teacher feedback'],
  [/final assessment/gi, 'exam'],
  [/does not count as mastery/gi, 'is self-marked practice'],
  [/do not count as mastery/gi, 'are self-marked practice'],
  [/not mastery/gi, 'self-marked practice'],
  [/mastery/gi, 'checked evidence'],
  [/audit/gi, 'check'],
  [/\brecords movement\b/gi, 'describes movement'],
  [/\brecords\b/gi, 'items'],
  [/\bdraft\b/gi, 'practice'],
  [/\bAlgebra\b/g, 'Algebra'],
  [/\bAlgebra Forge\b/g, 'Algebra'],
  [/\bLogarithmic and Exponential Functions\b/g, 'Logarithmic and Exponential Functions'],
  [/\bLogarithm Grove\b/g, 'Logarithmic and Exponential Functions'],
  [/\bTrigonometry\b/g, 'Trigonometry'],
  [/\bTrig Observatory\b/g, 'Trigonometry'],
  [/\bComplex Numbers\b/g, 'Complex Numbers'],
  [/\bComplex Numbers\b/g, 'Complex Numbers'],
  [/\bDifferentiation\b/g, 'Differentiation'],
  [/\bIntegration\b/g, 'Integration'],
  [/\bIntegration Gardens\b/g, 'Integration'],
  [/\bVectors\b/g, 'Vectors'],
  [/\bVectors\b/g, 'Vectors'],
  [/\bNumerical Solution of Equations\b/g, 'Numerical Solution of Equations'],
  [/\bNumerical Solution of Equations\b/g, 'Numerical Solution of Equations'],
  [/\bDifferential Equations\b/g, 'Differential Equations'],
];

const publicAssetExclusions = [
  /^404\.html$/,
  /^data(?:\/|$)/i,
  /^assets\/exam-bank-data\/[^/]+\.json$/i,
  /^assets\/exam-bank-data\/(?:p1|p4|p5)(?:\/|$)/i,
  /^assets\/avatar/i,
  /^assets\/ui(?:\/|$)/i,
];

function cleanVisibleCopy(value: string | number | undefined): string {
  return visibleCopyReplacements.reduce((current, [pattern, replacement]) => (
    current.replace(pattern, replacement)
  ), String(value ?? ''));
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

function escapeHtml(value: string | number | undefined): string {
  return cleanVisibleCopy(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRawHtml(value: string | number | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRawAttr(value: string | number | boolean | undefined): string {
  return escapeRawHtml(String(value ?? ''));
}

function escapeAttr(value: string | number | boolean | undefined): string {
  return escapeHtml(String(value ?? ''));
}

function renderMath(source: string, displayMode = false): string {
  try {
    return katex.renderToString(source, {
      displayMode,
      strict: false,
      throwOnError: false,
      trust: false,
    });
  } catch {
    return escapeHtml(source);
  }
}

function renderMathText(text: string | undefined): string {
  if (!text) return '';
  return text.split(mathDelimiterPattern).filter(Boolean).map((part) => {
    const displayMode = part.startsWith('$$') && part.endsWith('$$');
    const inlineMode = part.startsWith('$') && part.endsWith('$');
    if (!displayMode && !inlineMode) return escapeHtml(part);
    const source = displayMode ? part.slice(2, -2) : part.slice(1, -1);
    return `<span class="${displayMode ? 'math-text math-display' : 'math-text'}">${renderMath(source, displayMode)}</span>`;
  }).join('');
}

function renderInlineFormula(source: string): string {
  return `<span class="math-text">${renderMath(source, false)}</span>`;
}

async function readJson(relativePath: string): Promise<unknown> {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), 'utf8'));
}

function pageDirectory(pagePath: string): string {
  return pagePath.replace(/\/?index\.html$/, '');
}

function hrefToPage(fromPagePath: string, targetPagePath: string): string {
  const fromDir = path.posix.dirname(fromPagePath);
  const targetDir = pageDirectory(targetPagePath);
  let relative = path.posix.relative(fromDir, targetDir || '.');
  if (!relative) relative = '.';
  return relative.endsWith('/') ? relative : `${relative}/`;
}

function hrefToPublicAsset(fromPagePath: string, publicPath: string): string {
  if (/^https?:\/\//i.test(publicPath)) return publicPath;
  const clean = publicPath.replace(/^\/+/, '');
  const fromDir = path.posix.dirname(fromPagePath);
  const relative = path.posix.relative(fromDir, clean);
  return relative || path.posix.basename(clean);
}

function publicAssetExists(publicPath: string): boolean {
  if (/^https?:\/\//i.test(publicPath)) return true;
  const clean = publicPath.replace(/^\/+/, '');
  return existsSync(path.join(publicRoot, clean));
}

function firstExistingAssetCandidate(candidateGroups: string[][], fallbackUrls: string[]): string | undefined {
  for (const group of candidateGroups) {
    const match = group.find(publicAssetExists);
    if (match) return match;
  }
  return fallbackUrls.find(publicAssetExists);
}

function hasExistingQuestionImagePair(question: NormalizedQuestion): boolean {
  return Boolean(
    firstExistingAssetCandidate(question.questionImageCandidates, question.questionImageUrls)
    && firstExistingAssetCandidate(question.markSchemeImageCandidates, question.markSchemeImageUrls),
  );
}

function coursePagePath(course: CourseMetadata): string {
  return `${course.slug}/index.html`;
}

function p3CoursePagePath(): string {
  const p3Course = COURSES.find((course) => course.id === P3_COURSE_ID) ?? COURSES[1];
  return coursePagePath(p3Course);
}

function p3TopicsIndexPagePath(): string {
  return `${P3_COURSE_ID}/topics/index.html`;
}

function p3DiagnosticPagePath(): string {
  return `${P3_COURSE_ID}/diagnostic/index.html`;
}

function p1RepairLanePagePath(): string {
  return `${P3_COURSE_ID}/repair-lane/index.html`;
}

function p3NeedToKnowPagePath(): string {
  return `${P3_COURSE_ID}/need-to-know/index.html`;
}

function p3ReviewPagePath(): string {
  return `${P3_COURSE_ID}/review/index.html`;
}

function p3ExamTrainingPagePath(): string {
  return `${P3_COURSE_ID}/exam-training/index.html`;
}

function p3ContentQaPagePath(): string {
  return `${P3_COURSE_ID}/content-qa/index.html`;
}

function aboutPagePath(): string {
  return 'about/index.html';
}

function fieldGuidePagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/field-guide/index.html`;
}

function practicePagePath(topic: StudyTopic): string {
  return skillCheckPagePath(topic);
}

function learnPagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/learn/index.html`;
}

function skillCheckPagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/skill-check/index.html`;
}

function topicExamTrainingPagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/exam-training/index.html`;
}

function worksheetPagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/worksheet/index.html`;
}

function routeLink(fromPagePath: string, targetPagePath: string, label: string, className?: string): string {
  return `<a${className ? ` class="${className}"` : ''} href="${hrefToPage(fromPagePath, targetPagePath)}">${escapeHtml(label)}</a>`;
}

function p3ReviewExportHref(fromPagePath: string): string {
  return `${hrefToPage(fromPagePath, p3ReviewPagePath())}#export-progress`;
}

function p3ReviewExportLink(fromPagePath: string, label = 'Export Progress', className?: string): string {
  return `<a${className ? ` class="${className}"` : ''} href="${p3ReviewExportHref(fromPagePath)}">${escapeHtml(label)}</a>`;
}

function topicForOfficialTopic(officialTopic: P3OfficialTopic): StudyTopic {
  const topic = STUDY_TOPICS.find((candidate) => candidate.name === officialTopic);
  if (!topic) throw new Error(`Missing P3 study topic for contract topic ${officialTopic}`);
  return topic;
}

function p3SkillCoverageById(report: unknown): Map<string, P3SkillCoverageSummary> {
  if (!report || typeof report !== 'object' || !Array.isArray((report as { skills?: unknown }).skills)) {
    return new Map();
  }
  return new Map((report as { skills: unknown[] }).skills.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as {
      skill_id?: unknown;
      trainable_canonical_question_count?: unknown;
      canonical_source_question_count?: unknown;
      resolved_trainable_canonical_question_ids?: unknown;
    };
    if (typeof record.skill_id !== 'string') return [];
    const mappedExamQuestionIds = Array.isArray(record.resolved_trainable_canonical_question_ids)
      ? record.resolved_trainable_canonical_question_ids.filter((id): id is string => typeof id === 'string')
      : [];
    const count = typeof record.trainable_canonical_question_count === 'number'
      ? record.trainable_canonical_question_count
      : record.canonical_source_question_count;
    return [[record.skill_id, {
      mappedExamQuestionCount: typeof count === 'number' ? count : mappedExamQuestionIds.length,
      mappedExamQuestionIds,
    }]];
  }));
}

function hasReviewFlag(skill: P3SkillContractEntry, flag: string): boolean {
  return Boolean(skill.reviewFlags?.includes(flag));
}

function p3SkillContractAvailability(
  skill: P3SkillContractEntry,
  coverage: P3SkillCoverageSummary | undefined,
): P3SkillContractAvailability {
  return {
    fieldGuide: !hasReviewFlag(skill, 'missing-reviewed-snippet'),
    skillCheck: !hasReviewFlag(skill, 'missing-reviewed-quick-check'),
    examTraining: typeof coverage?.mappedExamQuestionCount === 'number' && coverage.mappedExamQuestionCount > 0,
  };
}

function p3SkillContractStatusLabel(
  skill: P3SkillContractEntry,
  availability: P3SkillContractAvailability,
): P3SkillContractPageRow['statusLabel'] {
  if (!availability.fieldGuide) return 'Learn content planned';
  if (!availability.skillCheck) return 'Checked practice planned';
  if (!availability.examTraining) return 'Exam training planned';
  if (skill.readiness === 'ready') return 'Content available';
  return 'Draft content';
}

function emptySkillCheckabilitySummary(): P3SkillCheckabilitySummary {
  return {
    deterministic: 0,
    notYetCheckable: 0,
    unsupported: 0,
    answerTypes: [],
  };
}

function p3SkillCheckabilityBySkill(): Map<string, P3SkillCheckabilitySummary> {
  const bySkill = new Map<string, P3SkillCheckabilitySummary>();
  for (const item of skillCheckCheckabilityReport()) {
    const current = bySkill.get(item.skillId) ?? emptySkillCheckabilitySummary();
    if (item.status === 'deterministically-checkable') {
      current.deterministic += 1;
      if (item.answerType && !current.answerTypes.includes(item.answerType)) current.answerTypes.push(item.answerType);
    } else if (item.status === 'unsupported-answer-form') {
      current.unsupported += 1;
    } else {
      current.notYetCheckable += 1;
    }
    bySkill.set(item.skillId, current);
  }
  return bySkill;
}

function skillCheckabilityText(summary: P3SkillCheckabilitySummary): string {
  const parts = [
    `${summary.deterministic} deterministic`,
    `${summary.notYetCheckable} not yet`,
  ];
  if (summary.unsupported) parts.push(`${summary.unsupported} unsupported`);
  if (summary.answerTypes.length) parts.push(`types: ${summary.answerTypes.sort().join(', ')}`);
  return parts.join('; ');
}

function renderTopicSkillCheckMigrationSnapshot(): string {
  const rows = STUDY_TOPICS.map((topic) => ({
    topic,
    summary: skillCheckTopicMigrationSummary(topic.regionId),
  }));
  return `
    <section class="summary-card contract-qa-summary">
      <h2>Skill Check migration by topic</h2>
      <p>Counts show deterministic Phase 3 Skill Check answer-data migration only. They do not imply full P3 migration.</p>
      <ul class="plain-list">
        ${rows.map(({ topic, summary }) => `
          <li>
            <strong>${escapeHtml(topic.name)}:</strong>
            ${summary.checkableChecks}/${summary.totalChecks} checkable,
            ${summary.uncheckableChecks} uncheckable
            ${summary.answerTypes.length ? `; types: ${escapeHtml(summary.answerTypes.join(', '))}` : ''}
            ${summary.unsupportedAnswerReasons.length ? `; unsupported: ${escapeHtml(summary.unsupportedAnswerReasons.join('; '))}` : ''}
          </li>
        `).join('')}
      </ul>
    </section>
  `;
}

function p3SkillContractRows(data: StaticSiteData): P3SkillContractPageRow[] {
  const coverageById = p3SkillCoverageById(data.p3SkillCoverageReport);
  const checkabilityBySkill = p3SkillCheckabilityBySkill();
  const mappedQuestionIdsBySkill = Object.fromEntries(Array.from(coverageById, ([skillId, coverage]) => [
    skillId,
    coverage.mappedExamQuestionIds,
  ])) as P3MappedExamQuestionIdsBySkill;
  const laddersBySkill = new Map(buildP3ExamLaddersFromMappedQuestions(mappedQuestionIdsBySkill).map((ladder) => [
    ladder.skillId,
    ladder,
  ]));
  return P3_SKILL_CONTRACT.map((skill) => {
    const coverage = coverageById.get(skill.id);
    const availability = p3SkillContractAvailability(skill, coverage);
    const examLadder = laddersBySkill.get(skill.id);
    if (!examLadder) throw new Error(`Missing P3 exam ladder for ${skill.id}`);
    return {
      skill,
      topic: topicForOfficialTopic(skill.officialTopic),
      availability,
      examLadder,
      skillCheckCheckability: checkabilityBySkill.get(skill.id) ?? emptySkillCheckabilitySummary(),
      mappedExamQuestionCount: coverage?.mappedExamQuestionCount,
      statusLabel: p3SkillContractStatusLabel(skill, availability),
    };
  });
}

function p3SkillContractRowsByTopic(data: StaticSiteData): Array<{ topic: P3OfficialTopic; rows: P3SkillContractPageRow[] }> {
  const rows = p3SkillContractRows(data);
  return P3_OFFICIAL_TOPICS.map((topic) => ({
    topic,
    rows: rows.filter((row) => row.skill.officialTopic === topic),
  }));
}

function contractRouteLink(
  fromPagePath: string,
  targetPagePath: string,
  label: string,
  kind: 'field-guide' | 'skill-check' | 'exam-training',
): string {
  return `<a class="text-link contract-resource-link" href="${hrefToPage(fromPagePath, targetPagePath)}" data-contract-link="${kind}" data-canonical-path="${escapeRawAttr(targetPagePath)}">${escapeRawHtml(label)}</a>`;
}

function regionForTopic(topic: StudyTopic): RegionDefinition {
  const region = P3_COURSE_MAP.regions.find((candidate) => candidate.id === topic.regionId);
  if (!region) throw new Error(`Missing region for topic ${topic.slug}`);
  return region;
}

function topicContext(topic: StudyTopic, data: StaticSiteData): TopicContext {
  const region = regionForTopic(topic);
  const fieldGuideTopics = getFieldGuideTopicsForRegion(region.id);
  const learnSteps = getLearnStepsForRegion(region.id);
  const teachingSnippets = getTeachingSnippetsForRegion(data.teachingSnippets, P3_COURSE_MAP.paperFamily, region);
  const generatedPractice = getGeneratedPracticeForRegion(data.generatedPractice, region.id, P3_COURSE_MAP.paperFamily);
  return {
    topic,
    region,
    fieldGuideTopics,
    learnSteps,
    groups: buildSkillChecklistTopicGroups({
      fieldGuideTopics,
      teachingSnippets,
      practiceItems: generatedPractice,
    }),
    questions: filterTrainableQuestionsForRegion(data.questions, region).slice(0, 8),
  };
}

function primaryNav(pagePath: string, active: RenderPageOptions['active']): string {
  const items = [
    { key: 'courses', label: 'Home', path: 'index.html' },
    { key: 'p3-diagnostic', label: 'Diagnostic', path: p3DiagnosticPagePath() },
    { key: 'p3-topics', label: 'P3 Units', path: p3TopicsIndexPagePath() },
    { key: 'p3-exam-training', label: 'Exam Training', path: p3ExamTrainingPagePath() },
  ];
  const activeKey = ['p1', 'm1', 's1'].includes(active) ? 'courses' : active;

  return `
    <nav class="site-nav" aria-label="Primary">
      ${items.map((item) => `
        <a href="${hrefToPage(pagePath, item.path)}"${activeKey === item.key ? ' aria-current="page"' : ''}>${item.label}</a>
      `).join('')}
    </nav>
  `;
}

function progressTransferControls(): string {
  return `
    <div class="progress-transfer-controls" data-progress-transfer-controls aria-label="Progress transfer">
      <button class="progress-transfer-button" type="button" data-export-progress-json>Export</button>
      <button class="progress-transfer-button" type="button" data-import-progress-json>Import</button>
      <span class="progress-transfer-status" data-progress-transfer-status aria-live="polite"></span>
    </div>
  `;
}

function renderPage(options: RenderPageOptions): string {
  const cssHref = hrefToPublicAsset(options.pagePath, 'assets/static-study.css');
  const katexHref = hrefToPublicAsset(options.pagePath, 'assets/katex.min.css');
  const scriptHref = hrefToPublicAsset(options.pagePath, 'assets/static-study.js');
  const title = `${options.title} | Asterion Study`;
  const themeBootScript = options.forcedTheme
    ? `(function(){document.documentElement.dataset.theme='${options.forcedTheme}';})();`
    : `(function(){try{var theme=window.localStorage.getItem('asterion.theme.v1');if(theme==='dark'||theme==='light'){document.documentElement.dataset.theme=theme;}else if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark';}}catch(error){}})();`;
  const themeToggle = options.hideThemeToggle ? '' : `
      <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false">
        <span class="theme-toggle-icon" aria-hidden="true"></span>
        <span class="theme-toggle-text" data-theme-toggle-label>Dark</span>
      </button>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeAttr(options.description)}" />
    <script>${themeBootScript}</script>
    <link rel="stylesheet" href="${katexHref}" />
    <link rel="stylesheet" href="${cssHref}" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body${options.bodyClass ? ` class="${escapeAttr(options.bodyClass)}"` : ''}>
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="site-header">
      <a class="brand-link" href="${hrefToPage(options.pagePath, 'index.html')}" aria-label="Asterion Study home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" focusable="false">
            <path d="M16 2 19.8 12.2 30 8.8 21.8 16 30 23.2 19.8 19.8 16 30 12.2 19.8 2 23.2 10.2 16 2 8.8 12.2 12.2 16 2Z" />
          </svg>
        </span>
        <span>
          <strong>ASTERION</strong>
          <small>CAIE 9709 Study Hub</small>
        </span>
      </a>
      ${primaryNav(options.pagePath, options.active)}
      ${progressTransferControls()}
      ${themeToggle}
    </header>
    <main id="main-content" tabindex="-1">
      ${options.body}
    </main>
    <script src="${scriptHref}" defer></script>
  </body>
</html>
`;
}

function progressList(regionId: string, fieldGuideTotal: number, requiredSkillChecks: string[] = []): string {
  return `
    <ul class="progress-list" aria-label="Local progress">
      <li><span data-progress-field-guide="${escapeAttr(regionId)}" data-total="${fieldGuideTotal}" data-label="Learn">Learn: 0/${fieldGuideTotal}</span></li>
      <li><span data-progress-skill="${escapeAttr(regionId)}" data-required-checks="${escapeAttr(JSON.stringify(requiredSkillChecks))}" data-label="Checked questions">Checked questions: 0/${requiredSkillChecks.length} passed</span></li>
      <li><span data-progress-exam="${escapeAttr(regionId)}" data-label="Exam practice">Exam practice: 0 self-marked</span></li>
    </ul>
  `;
}

function compactProgress(regionId: string, fieldGuideTotal: number): string {
  return `
    <p class="compact-progress" data-progress-summary="${escapeAttr(regionId)}" data-field-total="${fieldGuideTotal}">
      Local progress saved in this browser.
    </p>
  `;
}

function checkableSkillCheckIdsForRegion(regionId: string): string[] {
  return skillCheckCheckabilityReport()
    .filter((item) => item.regionId === regionId && item.status === 'deterministically-checkable')
    .map((item) => item.itemId);
}

function topicIndex(topic: StudyTopic): number {
  return STUDY_TOPICS.findIndex((candidate) => candidate.slug === topic.slug);
}

function nextStudyTopic(topic: StudyTopic): StudyTopic | undefined {
  const index = topicIndex(topic);
  return index >= 0 ? STUDY_TOPICS[index + 1] : undefined;
}

function previousStudyTopic(topic: StudyTopic): StudyTopic | undefined {
  const index = topicIndex(topic);
  return index > 0 ? STUDY_TOPICS[index - 1] : undefined;
}

function p3ExamReviewRequirements(contexts: TopicContext[], pagePath: string): P3ExamReviewRequirement[] {
  return contexts.map((context) => ({
    regionId: context.region.id,
    name: context.topic.name,
    fieldGuideTotal: Math.max(1, context.learnSteps.length),
    requiredCheckIds: checkableSkillCheckIdsForRegion(context.region.id),
    fieldGuideHref: hrefToPage(pagePath, learnPagePath(context.topic)),
    skillCheckHref: hrefToPage(pagePath, skillCheckPagePath(context.topic)),
  }));
}

function p3SkillRepairRoutes(contexts: TopicContext[], pagePath: string): SkillRepairRoute[] {
  const routes = new Map<string, SkillRepairRoute>();

  for (const context of contexts) {
    for (const group of context.groups) {
      const skillIds = new Set(group.authoredItems.map((item) => item.skillId));
      for (const skillId of skillIds) {
        if (routes.has(skillId)) continue;
        routes.set(skillId, {
          skillId,
          regionId: context.region.id,
          label: group.topic.title,
          href: `${hrefToPage(pagePath, practicePagePath(context.topic))}#practice-${encodeURIComponent(group.topic.id)}`,
        });
      }
    }
  }

  return Array.from(routes.values());
}

function renderP3PathUnitCard(fromPagePath: string, context: TopicContext, index: number): string {
  const { topic, region, learnSteps } = context;
  const learnStepTotal = Math.max(1, learnSteps.length);
  const requiredSkillCheckIds = checkableSkillCheckIdsForRegion(region.id);
  return `
    <article class="path-unit-card path-unit-tile" data-path-unit="${escapeAttr(region.id)}" data-unit-name="${escapeAttr(topic.name)}" data-unit-label="Unit ${index + 1}" data-learn-href="${escapeAttr(hrefToPage(fromPagePath, learnPagePath(topic)))}" data-skill-href="${escapeAttr(hrefToPage(fromPagePath, skillCheckPagePath(topic)))}" data-exam-href="${escapeAttr(hrefToPage(fromPagePath, topicExamTrainingPagePath(topic)))}">
      <div class="path-unit-number">Unit ${index + 1}</div>
      <div class="path-unit-main">
        <header>
          <h2>${escapeHtml(topic.name)}</h2>
          <p>${escapeHtml(topic.shortName)}</p>
        </header>
        <div class="path-unit-representation" aria-label="${escapeAttr(topic.name)} example representation">
          ${renderMathText(`$${topic.headerFormula}$`)}
        </div>
      </div>
      <p class="compact-progress path-unit-compact-progress" data-progress-summary="${escapeAttr(region.id)}" data-field-total="${learnStepTotal}">
        No saved progress yet
      </p>
      <div class="path-unit-progress-metadata" aria-hidden="true">
        <span data-progress-field-guide="${escapeAttr(region.id)}" data-total="${learnStepTotal}" data-label="Learn">Learn: 0/${learnStepTotal}</span>
        <span data-progress-skill="${escapeAttr(region.id)}" data-required-checks="${escapeAttr(JSON.stringify(requiredSkillCheckIds))}" data-label="Checked">Checked: 0/${requiredSkillCheckIds.length} passed</span>
        <span data-progress-exam="${escapeAttr(region.id)}" data-label="Exam">Exam: 0 self-marked</span>
      </div>
      <a class="button primary-button path-unit-primary-action" href="${hrefToPage(fromPagePath, learnPagePath(topic))}" data-path-unit-primary-action>
        Start ${escapeHtml(topic.name)} Learn
      </a>
      <a class="path-unit-fast-lane-link text-link" href="${hrefToPage(fromPagePath, skillCheckPagePath(topic))}" data-path-unit-fast-lane-action>
        Already confident? Try Checked Practice
      </a>
      <details class="path-unit-direct-routes">
        <summary>Direct routes</summary>
        <nav aria-label="${escapeAttr(topic.name)} direct routes">
          ${routeLink(fromPagePath, learnPagePath(topic), 'Learn', 'text-link')}
          ${routeLink(fromPagePath, skillCheckPagePath(topic), 'Checked Practice', 'text-link')}
          ${routeLink(fromPagePath, topicExamTrainingPagePath(topic), 'Exam Training', 'text-link')}
          ${routeLink(fromPagePath, worksheetPagePath(topic), 'Worksheet', 'text-link')}
        </nav>
      </details>
    </article>
  `;
}

function renderP3NextStepPanel(pagePath: string): string {
  return `
    <section class="p3-next-step-panel" data-p3-next-step-panel data-review-href="${escapeAttr(p3ReviewExportHref(pagePath))}" data-diagnostic-href="${escapeAttr(hrefToPage(pagePath, p3DiagnosticPagePath()))}" aria-labelledby="p3-next-step-panel-title">
      <div>
        <p class="eyebrow">First action</p>
        <h2 id="p3-next-step-panel-title" data-p3-next-step-title>Start diagnostic</h2>
        <p data-p3-next-step-copy>The summer homework path starts with the diagnostic, then Learn → Checked Practice → Exam Training.</p>
      </div>
      <a class="button primary-button" href="${hrefToPage(pagePath, p3DiagnosticPagePath())}" data-p3-next-step-link>Start diagnostic</a>
      <a class="p3-fast-lane-link text-link" href="${hrefToPage(pagePath, learnPagePath(STUDY_TOPICS[0]))}" data-p3-fast-lane-link>Already completed it? Start Algebra Learn</a>
    </section>
  `;
}

function renderP3SummerHomeworkPanel(pagePath: string): string {
  return `
    <section class="p3-summer-homework-panel" aria-labelledby="p3-summer-homework-title">
      <div>
        <p class="eyebrow">Completion contract</p>
        <h2 id="p3-summer-homework-title">Summer homework minimum</h2>
      </div>
      <ul class="p3-summer-homework-checklist">
        <li>Complete the P3 Diagnostic first.</li>
        <li>Default path: Diagnostic → Learn → Checked Practice → Exam Training.</li>
        <li>Complete Checked Practice for each P3 unit.</li>
        <li>Use Learn pages when you need help before Checked Practice.</li>
        <li>Exam Training is extra self-marked practice unless your teacher assigns it.</li>
        <li>Export your local progress CSV after each session and send it to your teacher.</li>
      </ul>
      <p class="p3-summer-homework-note">Progress is saved only in this browser on this device. If you change devices or clear browser data, your local record may not appear.</p>
    </section>
  `;
}

function renderDiagnosticInput(question: P3DiagnosticQuestion): string {
  return `
    <div class="diagnostic-mark-grid">
      ${question.markPoints.map((markPoint) => {
        const guidance = answerFormatGuidance({
          answerType: markPoint.answerType,
          acceptedAnswers: markPoint.acceptedAnswers,
          expectedAnswer: markPoint.acceptedAnswers[0],
          prompt: question.prompt,
          label: markPoint.label,
          answerFormatHint: markPoint.answerFormatHint,
          answerPlaceholder: markPoint.answerPlaceholder,
        });
        return renderMathAnswerInput({
          id: `${question.id}-${markPoint.id}`,
          labelHtml: renderMathText(markPoint.label),
          guidance,
          name: `${question.id}::${markPoint.id}`,
          classes: ['diagnostic-answer-field'],
          attributes: [
            ['data-diagnostic-mark-point', true],
            ['data-question-id', question.id],
            ['data-mark-point-id', markPoint.id],
            ['data-section-id', question.sectionId],
            ['data-answer-format', guidance.instruction],
            ['data-risk-flags', JSON.stringify(markPoint.riskFlags)],
            ['data-critical-foundation-skill', markPoint.criticalFoundationSkill ?? ''],
            ['data-answer-type', markPoint.answerType],
            ['data-accepted-answers', JSON.stringify(markPoint.acceptedAnswers)],
            ['data-tolerance', markPoint.tolerance ?? ''],
            ['data-order-matters', markPoint.orderMatters === true ? 'true' : 'false'],
          ],
        });
      }).join('')}
    </div>
  `;
}

function renderDiagnosticQuestion(question: P3DiagnosticQuestion, index: number): string {
  return `
    <article class="practice-card diagnostic-question-card" data-diagnostic-question="${escapeAttr(question.id)}">
      <header>
        <p class="eyebrow">${escapeHtml(question.sectionLabel)}${index + 1} · ${escapeHtml(question.answerFormat)} · ${question.markPoints.length} mark${question.markPoints.length === 1 ? '' : 's'}</p>
        <h3>${escapeHtml(question.title)}</h3>
      </header>
      <p class="prompt">${renderMathText(question.prompt)}</p>
      ${renderDiagnosticInput(question)}
    </article>
  `;
}

function renderP3DiagnosticPage(pagePath = p3DiagnosticPagePath()): string {
  const questionCount = P3_DIAGNOSTIC_QUESTIONS.length;
  const markCount = P3_DIAGNOSTIC_QUESTIONS.reduce((sum, question) => sum + question.markPoints.length, 0);
  const firstSectionId = P3_DIAGNOSTIC_QUESTIONS[0]?.sectionId ?? '';
  const body = `
    ${renderHero(
      'P3 Diagnostic Gate',
      `A fixed ${P3_DIAGNOSTIC_DURATION_TARGET_MINUTES} minute starting-point check for P1 algebra fluency, early P3 transition skills, and light mixed problem solving.`,
      'P(x), \\quad \\log_a x, \\quad \\frac{dy}{dx}, \\quad \\int f(x)\\,dx',
      '<a class="button primary-button" href="#diagnostic-paper">Start diagnostic</a>',
      'CAIE 9709 Paper 3',
    )}
    <section class="diagnostic-rules summary-card" aria-labelledby="diagnostic-rules-title">
      <div>
        <p class="eyebrow">Classification paper</p>
        <h2 id="diagnostic-rules-title">${questionCount} questions · ${markCount} mark points</h2>
        <p>No hints, no teaching, no adaptive branching, and no mark-scheme explanations are shown during the paper.</p>
      </div>
    </section>
    <form class="diagnostic-paper" id="diagnostic-paper" data-p3-diagnostic-form data-total-marks="${markCount}" data-current-section="${escapeAttr(firstSectionId)}">
      <section class="diagnostic-progress-panel summary-card" aria-labelledby="diagnostic-progress-title">
        <div>
          <p class="eyebrow" data-diagnostic-current-section>Section A</p>
          <h2 id="diagnostic-progress-title" data-diagnostic-progress-title>Question 1 of ${questionCount}</h2>
          <p data-diagnostic-progress-message>Answer this question to unlock the next one.</p>
        </div>
        <div class="diagnostic-progress-controls" aria-label="Diagnostic question navigation">
          <button class="button secondary-button" type="button" data-diagnostic-previous>Previous</button>
          <button class="button primary-button" type="button" data-diagnostic-next>Next question</button>
        </div>
      </section>
      ${P3_DIAGNOSTIC_SECTIONS.map((section) => {
        const questions = P3_DIAGNOSTIC_QUESTIONS.filter((question) => question.sectionId === section.id);
        return `
          <section class="diagnostic-section" data-diagnostic-section="${escapeAttr(section.id)}">
            <div class="section-heading">
              <div>
                <p class="eyebrow">${escapeHtml(section.purpose)}</p>
                <h2>${escapeHtml(section.label)}</h2>
              </div>
            </div>
            <div class="practice-card-stack">
              ${questions.map((question, index) => renderDiagnosticQuestion(question, index)).join('')}
            </div>
          </section>
        `;
      }).join('')}
      <section class="next-step-card diagnostic-submit-panel" data-diagnostic-submit-panel hidden>
        <h2>Submit for classification</h2>
        <p>The report is generated from deterministic mark points only.</p>
        <button class="button primary-button" type="submit">Submit diagnostic</button>
      </section>
    </form>
    <section class="diagnostic-report-panel summary-card" data-p3-diagnostic-report hidden aria-labelledby="diagnostic-report-title">
      <div>
        <p class="eyebrow">Diagnostic feedback</p>
        <h2 id="diagnostic-report-title">Your P3 starting point</h2>
      </div>
      <p class="diagnostic-recommendation" data-diagnostic-recommendation>Student should proceed via: P1_REPAIR_REQUIRED</p>
      <div class="diagnostic-feedback-grid" data-diagnostic-feedback-summary></div>
      <div class="diagnostic-feedback-section" data-diagnostic-section-feedback></div>
      <div class="diagnostic-feedback-section" data-diagnostic-priority-feedback></div>
      <div class="diagnostic-feedback-section" data-diagnostic-missed-feedback></div>
      <div class="diagnostic-feedback-section diagnostic-confidence-panel" data-diagnostic-confidence-panel hidden></div>
      ${routeLink(pagePath, p1RepairLanePagePath(), 'Continue', 'button primary-button')}
      <details class="diagnostic-technical-details">
        <summary>Technical report</summary>
        <pre class="diagnostic-report-json" data-diagnostic-report-json>{}</pre>
      </details>
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'P3 Diagnostic Gate',
    description: 'Fixed Paper 3 diagnostic assessment and starting-point classifier for CAIE 9709 P3.',
    active: 'p3-diagnostic',
    body,
    bodyClass: 'diagnostic-page',
  });
}

function renderP1RepairQuestionInput(question: P1RepairQuestion, phase: 'fast' | 'mini'): string {
  const attrPrefix = phase === 'fast' ? 'data-p1-repair-fast-question' : 'data-p1-repair-mini-check';
  const guidance = answerFormatGuidance({
    answerType: question.answerType,
    acceptedAnswers: question.acceptedAnswers,
    expectedAnswer: question.acceptedAnswers[0],
    prompt: question.prompt,
    answerFormatHint: question.answerFormatHint,
    answerPlaceholder: question.answerPlaceholder,
  });
  return renderMathAnswerInput({
    id: `${question.id}-${phase}`,
    labelHtml: renderMathText(question.prompt),
    guidance,
    name: question.id,
    classes: ['repair-answer-field'],
    afterInputHtml: `<small class="repair-feedback" data-repair-feedback-for="${escapeAttr(question.id)}"></small>`,
    attributes: [
      [attrPrefix, true],
      ['data-question-id', question.id],
      ['data-answer-format', guidance.instruction],
      ['data-answer-type', question.answerType],
      ['data-accepted-answers', JSON.stringify(question.acceptedAnswers)],
      ['data-correction', question.correction],
      ['data-tolerance', question.tolerance ?? ''],
      ['data-order-matters', question.orderMatters === true ? 'true' : 'false'],
    ],
  });
}

function renderP1RepairModule(module: P1RepairModuleDefinition, index: number): string {
  return `
    <article class="repair-module-card" data-p1-repair-module="${escapeAttr(module.module_id)}" data-p1-repair-module-index="${index}"${index === 0 ? '' : ' hidden'}>
      <header>
        <p class="eyebrow">Module ${index + 1} · ${escapeHtml(module.skill_tag)}</p>
        <h2>${escapeHtml(module.title)}</h2>
        <p>Learn refresh: ${escapeHtml(module.learn_refresh_minutes)} min. Fast questions require at least 70%.</p>
      </header>
      <section class="repair-refresh" aria-label="${escapeAttr(module.title)} learn refresh">
        <h3>Learn Refresh</h3>
        <ol>
          ${module.learn_refresh.map((step) => `<li>${renderMathText(step)}</li>`).join('')}
        </ol>
      </section>
      <form class="repair-module-form" data-p1-repair-module-form data-module-id="${escapeAttr(module.module_id)}" data-weak-skill-tags="${escapeAttr(JSON.stringify(module.weak_skill_tags))}">
        <section class="repair-question-block">
          <h3>Fast Questions</h3>
          <div class="repair-question-grid">
            ${module.fast_questions.map((question) => renderP1RepairQuestionInput(question, 'fast')).join('')}
          </div>
          <div class="repair-module-actions">
            <button class="button primary-button" type="submit" name="repairPhase" value="fast">Submit Fast Check</button>
            <p class="repair-module-result" data-p1-repair-module-result>Fast check not submitted.</p>
          </div>
        </section>
        <section class="repair-question-block repair-mini-check" data-p1-repair-mini-check-panel hidden>
          <h3>Mini-Check</h3>
          <p>One exam-style check. One retry is allowed for module completion.</p>
          ${renderP1RepairQuestionInput(module.mini_check, 'mini')}
          <div class="repair-module-actions">
            <button class="button primary-button" type="submit" name="repairPhase" value="mini">Submit Mini-Check</button>
          </div>
        </section>
        <div class="repair-module-actions">
          <button class="button secondary-button" type="button" data-p1-repair-next>Next module</button>
        </div>
      </form>
    </article>
  `;
}

function renderP1RepairLanePage(pagePath = p1RepairLanePagePath()): string {
  const body = `
    ${renderHero(
      'P1 Review',
      'Short prerequisite review for core P1 algebra and calculus fluency before P3 Exam Training.',
      'x^2-9, \\quad \\sin^2 x+\\cos^2 x=1, \\quad \\frac{dy}{dx}',
      '<a class="button primary-button" href="#repair-modules">Start review</a>',
      'CAIE 9709 foundation review',
    )}
    <nav class="repair-module-nav" aria-label="P1 Review modules" data-p1-repair-module-nav>
      ${P1_REPAIR_MODULES.map((module, index) => `<button class="repair-module-tab" type="button" data-p1-repair-module-tab="${escapeAttr(module.module_id)}"${index === 0 ? ' aria-current="true"' : ''}>Module ${index + 1}</button>`).join('')}
    </nav>
    <section class="repair-module-list" id="repair-modules" aria-label="P1 Review modules">
      ${P1_REPAIR_MODULES.map((module, index) => renderP1RepairModule(module, index)).join('')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'P1 Review',
    description: 'Standalone P1 prerequisite review for CAIE 9709 students who need foundation practice before P3 Exam Training.',
    active: 'p1-repair',
    body,
    bodyClass: 'repair-lane-page',
  });
}

function renderP3LearningPathPage(
  data: StaticSiteData,
  pagePath = 'index.html',
): string {
  const contexts = STUDY_TOPICS.map((topic) => topicContext(topic, data));
  const body = `
    <section class="p3-path-hero">
      <div class="p3-problem-hero-copy">
        <p class="eyebrow">CAIE 9709 Paper 3</p>
        <h1>P3 Topic Overview</h1>
        <div class="p3-example-problem-bar" aria-label="Example Algebra problem">
          <span class="p3-example-problem-label">Unit 1 example</span>
          <strong>Integrate ${renderInlineFormula('\\frac{1}{x^2-1}')}.</strong>
          <span>Factor, split into partial fractions, then check each step in Learn.</span>
        </div>
        <div class="hero-actions p3-problem-actions">
          ${routeLink(pagePath, p3DiagnosticPagePath(), 'Take P3 diagnostic', 'button primary-button')}
        </div>
      </div>
    </section>
    <section class="path-principle-strip" aria-label="How the path works">
      <article>
        <strong>1. Learn</strong>
        <span>Try a small question before the explanation appears.</span>
      </article>
      <article>
        <strong>2. Checked Practice</strong>
        <span>Use the similar checked question for clean evidence.</span>
      </article>
      <article>
        <strong>3. Exam Training</strong>
        <span>Self-mark Paper 3 questions after learning the topic.</span>
      </article>
    </section>
    <section class="p3-unit-sequence" aria-labelledby="p3-unit-sequence-title">
      <div class="section-heading">
        <div>
          <h2 id="p3-unit-sequence-title">Units</h2>
          <p>Each unit shows one recommended action. Open direct routes only when you need a specific page.</p>
        </div>
      </div>
      <div class="path-unit-grid">
        ${contexts.map((context, index) => renderP3PathUnitCard(pagePath, context, index)).join('')}
      </div>
      <div class="path-unit-list path-review-list">
        <article class="path-unit-card path-exam-review-card">
          <div class="path-unit-number">Final</div>
          <div class="path-unit-main">
            <header>
              <h2>Review</h2>
              <p>Exam Review unlocks after you complete the unit path.</p>
            </header>
          </div>
          <div class="path-unit-progress">
            ${p3ReviewExportLink(pagePath, 'Export Progress', 'button secondary-button')}
          </div>
        </article>
      </div>
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'P3 Topic Overview',
    description: 'A lean sequential CAIE 9709 Pure Mathematics 3 learning path after P1.',
    active: 'p3-topics',
    body,
    bodyClass: 'p3-path-page',
  });
}

function renderP3DashboardPage(
  data: StaticSiteData,
  course: CourseMetadata,
  pagePath = coursePagePath(course),
): string {
  const contexts = STUDY_TOPICS.map((topic) => topicContext(topic, data));
  const body = `
    <section class="p3-dashboard-hero">
      <div class="p3-dashboard-copy">
        <p class="eyebrow">${escapeHtml(course.examComponentLabel)}</p>
        <h1>${escapeHtml(course.displayName)}</h1>
        <p>Start with the next useful study action. Asterion uses local browser progress to decide whether you should begin learning, continue your current unit, or review saved mistakes.</p>
      </div>
      ${renderP3SummerHomeworkPanel(pagePath)}
      <div class="p3-dashboard-action-panel">
        ${renderP3NextStepPanel(pagePath)}
        <nav class="p3-dashboard-secondary-links" aria-label="Other P3 routes">
          ${routeLink(pagePath, p3DiagnosticPagePath(), 'Diagnostic', 'text-link')}
          ${routeLink(pagePath, p3NeedToKnowPagePath(), 'Need to Know', 'text-link')}
          ${p3ReviewExportLink(pagePath, 'Export progress', 'text-link')}
          ${routeLink(pagePath, p3TopicsIndexPagePath(), 'All topic routes', 'text-link')}
        </nav>
      </div>
    </section>
    <section class="p3-unit-sequence" aria-labelledby="p3-dashboard-units-title">
      <div class="section-heading">
        <div>
          <h2 id="p3-dashboard-units-title">All units</h2>
          <p>Direct access stays here when you need a specific route. For a normal session, use the next action above.</p>
        </div>
      </div>
      <div class="path-unit-grid">
        ${contexts.map((context, index) => renderP3PathUnitCard(pagePath, context, index)).join('')}
      </div>
    </section>
  `;
  return renderPage({
    pagePath,
    title: course.displayName,
    description: `${course.shortName} course dashboard for the static CAIE 9709 study hub.`,
    active: course.id,
    body,
    bodyClass: 'p3-path-page p3-dashboard-page',
  });
}

function renderStudyPath(): string {
  return `
    <ol class="study-path" aria-label="Recommended study path">
      <li><strong>1. Learn</strong><span>Read one short step.</span></li>
      <li><strong>2. Checked Practice</strong><span>Try a focused checked question.</span></li>
      <li><strong>3. Exam Training</strong><span>Try one exam-style question.</span></li>
    </ol>
  `;
}

function renderTopicCard(fromPagePath: string, context: TopicContext, examTrainingPath = topicExamTrainingPagePath(context.topic)): string {
  const { topic, region } = context;
  const fieldGuidePath = learnPagePath(topic);
  const status = topic.slug === STUDY_TOPICS[0]?.slug ? '<span class="topic-status-chip">Start here</span>' : '';
  return `
    <article class="topic-card" data-region-card="${escapeAttr(region.id)}">
      <a class="topic-card-main-link" href="${hrefToPage(fromPagePath, fieldGuidePath)}" aria-label="Start ${escapeAttr(topic.name)} Learn">
        <div class="topic-card-formula">${renderInlineFormula(topic.headerFormula)}</div>
        <div class="topic-card-heading">
          <h2>${escapeHtml(topic.name)}</h2>
          ${status}
        </div>
        <p>${escapeHtml(topic.description)}</p>
        <span class="topic-card-arrow" aria-hidden="true">&#8594;</span>
      </a>
      <div class="topic-card-shortcuts" aria-label="${escapeAttr(topic.name)} shortcuts">
        ${routeLink(fromPagePath, learnPagePath(topic), 'Learn', 'text-link')}
        ${routeLink(fromPagePath, examTrainingPath, 'Exam Training', 'text-link')}
      </div>
    </article>
  `;
}

function renderPlainList(items: string[], className = 'plain-list'): string {
  return `
    <ul class="${escapeAttr(className)}">
      ${items.map((item) => `<li>${renderMathText(item)}</li>`).join('')}
    </ul>
  `;
}

function renderFormulaChips(formulas: string[], fallbackFormula?: string): string {
  const formulaItems = formulas.length ? formulas : (fallbackFormula ? [`$${fallbackFormula}$`] : []);
  if (!formulaItems.length) return '';
  return `
    <ul class="formula-chip-list" aria-label="Key formulae">
      ${formulaItems.map((formula) => `<li>${renderMathText(formula)}</li>`).join('')}
    </ul>
  `;
}

function keyIdeaLabel(idea: string): string {
  const plain = cleanVisibleCopy(idea)
    .replace(/\$[^$]+\$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= 34) return plain || 'Key idea';
  const words = plain.split(' ').slice(0, 4).join(' ');
  return words ? `${words}...` : 'Key idea';
}

function renderKeyIdeaDetails(ideas: string[]): string {
  if (!ideas.length) return '';
  return `
    <div class="key-idea-grid" aria-label="Key ideas">
      ${ideas.map((idea) => `
        <details class="key-idea-details">
          <summary>${renderMathText(keyIdeaLabel(idea))}</summary>
          <p>${renderMathText(idea)}</p>
        </details>
      `).join('')}
    </div>
  `;
}

function renderKnowledgeCard(formulas: string[], ideas: string[], fallbackFormula?: string): string {
  return `
    <article class="summary-card knowledge-card">
      <h2>What you need to know</h2>
      ${renderFormulaChips(formulas, fallbackFormula)}
      ${renderKeyIdeaDetails(ideas.slice(0, 5))}
    </article>
  `;
}

function renderMethodList(lines: string[]): string {
  return `
    <ol class="worked-list compact-worked-list">
      ${lines.filter(Boolean).map((line) => `<li>${renderMathText(line)}</li>`).join('')}
    </ol>
  `;
}

function renderP3WorkedExamplesCard(fieldGuideTopics: FieldGuideTopic[]): string {
  const examples = fieldGuideTopics
    .flatMap((topic) => topic.examples.map((example) => ({ topic, example })))
    .slice(0, 3);
  return `
    <article class="summary-card worked-example-summary">
      <h2>Worked examples</h2>
      <div class="worked-example-summary-list">
        ${examples.map(({ topic, example }, index) => `
          <section class="mini-worked-example">
            <p class="eyebrow">Example ${index + 1}</p>
            <h3>${escapeHtml(topic.title)}</h3>
            <p class="prompt">${renderMathText(example.prompt)}</p>
            ${renderMethodList(example.workedLines.slice(0, 3))}
            <p class="result"><strong>Answer:</strong> ${renderMathText(example.result)}</p>
          </section>
        `).join('')}
      </div>
    </article>
  `;
}

function renderSkillCheckTransition(fromPagePath: string, practicePath: string, groupId?: string, label = 'Try 3 quick questions'): string {
  const href = `${hrefToPage(fromPagePath, practicePath)}${groupId ? `#${escapeAttr(groupId)}` : ''}`;
  return `
    <div class="skill-check-transition">
      <a class="button primary-button" href="${href}">${escapeHtml(label)}</a>
      <p>Opens 3 quick questions on this skill.</p>
    </div>
  `;
}

function renderHero(title: string, body: string, formula?: string, actions = '', eyebrow = 'CAIE 9709 Paper 3'): string {
  return `
    <section class="page-hero">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(body)}</p>
        ${actions ? `<div class="hero-actions">${actions}</div>` : ''}
      </div>
      ${formula ? `<div class="formula-panel" aria-hidden="true">${renderInlineFormula(formula)}</div>` : ''}
    </section>
  `;
}

function renderCourseMathVisual(): string {
  return `
    <div class="course-math-visual" aria-hidden="true">
      <svg viewBox="0 0 360 250" focusable="false">
        <defs>
          <linearGradient id="courseVisualWarm" x1="34" y1="20" x2="322" y2="232" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fffaf0" />
            <stop offset="0.52" stop-color="#f4ddbd" />
            <stop offset="1" stop-color="#dce9df" />
          </linearGradient>
          <linearGradient id="courseVisualLine" x1="42" y1="196" x2="324" y2="64" gradientUnits="userSpaceOnUse">
            <stop stop-color="#78351f" />
            <stop offset="0.5" stop-color="#c47b1b" />
            <stop offset="1" stop-color="#3f7162" />
          </linearGradient>
        </defs>
        <rect x="14" y="16" width="332" height="218" rx="18" fill="url(#courseVisualWarm)" />
        <g stroke="#8f735d" stroke-opacity="0.24" stroke-width="1">
          ${Array.from({ length: 8 }, (_, index) => `<path d="M${54 + index * 36} 32v184" />`).join('')}
          ${Array.from({ length: 6 }, (_, index) => `<path d="M34 ${54 + index * 32}h292" />`).join('')}
        </g>
        <path d="M46 186c40-84 74-84 102 0s58 84 95 0 58-93 78-28" fill="none" stroke="url(#courseVisualLine)" stroke-linecap="round" stroke-width="7" />
        <path d="M64 184h238M82 202V48" stroke="#34251f" stroke-linecap="round" stroke-opacity="0.52" stroke-width="2" />
        <circle cx="122" cy="122" r="44" fill="none" stroke="#3f7162" stroke-opacity="0.72" stroke-width="3" />
        <path d="M230 74l38 66h-76z" fill="none" stroke="#78351f" stroke-opacity="0.72" stroke-width="3" />
        <g fill="#34251f" fill-opacity="0.72" font-family="Georgia, Times New Roman, serif" font-size="18" font-style="italic">
          <text x="112" y="70">f(x)</text>
          <text x="242" y="164">dx</text>
          <text x="92" y="212">x</text>
        </g>
      </svg>
    </div>
  `;
}

function renderExamPanicVisual(): string {
  return `
    <div class="home-meme-visual" aria-hidden="true">
      <svg viewBox="0 0 420 300" focusable="false">
        <defs>
          <linearGradient id="panicPaper" x1="70" y1="22" x2="346" y2="254" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fffdf8" />
            <stop offset="1" stop-color="#f9e6be" />
          </linearGradient>
          <linearGradient id="panicAccent" x1="32" y1="248" x2="382" y2="50" gradientUnits="userSpaceOnUse">
            <stop stop-color="#78351f" />
            <stop offset="0.55" stop-color="#c47b1b" />
            <stop offset="1" stop-color="#3f7162" />
          </linearGradient>
        </defs>
        <rect x="20" y="20" width="380" height="260" rx="22" fill="#fff8ed" />
        <path d="M46 232c62-86 104-88 150-16s78 64 142-48" fill="none" stroke="url(#panicAccent)" stroke-linecap="round" stroke-width="9" opacity="0.75" />
        <g transform="translate(188 34) rotate(5)">
          <rect width="160" height="188" rx="12" fill="url(#panicPaper)" stroke="#d9c9b7" stroke-width="2" />
          <text x="18" y="34" fill="#34251f" font-size="15" font-weight="800">Step 1</text>
          <text x="18" y="58" fill="#78351f" font-size="13">Pick a paper</text>
          <path d="M18 82h124M18 104h98M18 126h116" stroke="#8f735d" stroke-opacity="0.35" stroke-width="4" stroke-linecap="round" />
          <text x="18" y="164" fill="#3f7162" font-size="14" font-weight="800">Then one topic</text>
        </g>
        <g transform="translate(72 96)">
          <circle cx="66" cy="70" r="46" fill="#f4ddbd" stroke="#78351f" stroke-width="4" />
          <path d="M28 48c10-34 64-38 78-2" fill="none" stroke="#34251f" stroke-width="8" stroke-linecap="round" />
          <circle cx="50" cy="70" r="5" fill="#34251f" />
          <circle cx="82" cy="70" r="5" fill="#34251f" />
          <path d="M50 92c12 13 26 13 38 0" fill="none" stroke="#34251f" stroke-width="4" stroke-linecap="round" />
          <path d="M20 126c34 20 64 20 98 0" fill="none" stroke="#3f7162" stroke-width="10" stroke-linecap="round" />
          <text x="8" y="164" fill="#78351f" font-size="15" font-weight="900">One small step</text>
        </g>
        <g fill="#34251f" fill-opacity="0.7" font-family="Georgia, Times New Roman, serif" font-size="18" font-style="italic">
          <text x="42" y="70">dy/dx</text>
          <text x="286" y="246">Checked</text>
        </g>
      </svg>
    </div>
  `;
}

const homepageLearningSteps = [
  ['Try the problem', 'You attempt first. Your attempt is the center.'],
  ['Compare your first move', 'Asterion compares your move, not just your final answer.'],
  ['Learn the method', 'Explanation appears after your first attempt.'],
  ['Complete Checked Practice', 'A clean Checked Practice pass is the strongest local evidence.'],
  ['Train on real exam questions', 'Exam Training is self-marked practice. It helps you prepare, but it does not replace Checked Practice evidence unless your teacher says so.'],
  ['Review and repair', 'Mistakes are expected, repaired, and tracked.'],
] as const;

const homepageLearningIcons = [
  '<svg viewBox="0 0 32 32" focusable="false"><path d="M7 24l4 1 14-14-5-5L6 20l1 4Z"/><path d="M18 8l5 5"/><path d="M5 27h18"/></svg>',
  '<svg viewBox="0 0 32 32" focusable="false"><circle cx="14" cy="14" r="8"/><path d="M20 20l7 7"/><path d="M11 10c2-2 6-2 8 1"/></svg>',
  '<svg viewBox="0 0 32 32" focusable="false"><path d="M6 7c4 0 7 1 10 4v17c-3-3-6-4-10-4V7Z"/><path d="M26 7c-4 0-7 1-10 4v17c3-3 6-4 10-4V7Z"/></svg>',
  '<svg viewBox="0 0 32 32" focusable="false"><path d="M16 4l10 4v7c0 7-4 11-10 13C10 26 6 22 6 15V8l10-4Z"/><path d="M11 16l4 4 7-8"/></svg>',
  '<svg viewBox="0 0 32 32" focusable="false"><path d="M8 5h16v22H8z"/><path d="M12 10h8"/><path d="M12 15h8"/><path d="M12 20h5"/><path d="M20 23l3 3 5-6"/></svg>',
  '<svg viewBox="0 0 32 32" focusable="false"><path d="M5 25h22"/><path d="M8 22v-5"/><path d="M14 22v-9"/><path d="M20 22V9"/><path d="M7 13l6-5 6 3 6-7"/><path d="M23 4h4v4"/></svg>',
] as const;

const homepageTrustCards = [
  ['Try first, then learn.', 'The page asks for work before revealing the explanation.'],
  ['Mistakes are repaired.', 'Wrong attempts get targeted feedback and another try.'],
  ['Self-marking is labelled honestly.', 'Exam Training is self-marked practice. Checked Practice stays separate.'],
  ['P3 is the trusted path.', 'P1, M1, and S1 stay locked until their course content is checked.'],
] as const;

const homepageDemoSteps = [
  {
    title: 'Recognize the denominator',
    prompt: `${renderInlineFormula('x^2-1')} factors as...`,
    label: 'Step 1 answer',
    placeholder: '(x + 1)(x - 1)',
  },
  {
    title: 'Split into partial fractions',
    prompt: `Write the partial-fraction structure before solving for constants.`,
    label: 'Step 2 answer',
    placeholder: 'A/(x - 1) + B/(x + 1)',
  },
  {
    title: 'Find the constants',
    prompt: `Use ${renderInlineFormula('1=A(x+1)+B(x-1)')}.`,
    label: 'Step 3 answer',
    placeholder: 'A = 1/2, B = -1/2',
  },
  {
    title: 'Integrate the terms',
    prompt: `Apply ${renderInlineFormula('\\int \\frac{1}{x-a}\\,dx=\\ln|x-a|+C')} to each fraction.`,
    label: 'Step 4 answer',
    placeholder: '1/2 ln|x - 1| - 1/2 ln|x + 1|',
  },
  {
    title: 'Combine the final answer',
    prompt: `Write the result as a single log expression.`,
    label: 'Step 5 answer',
    placeholder: '1/2 ln|(x - 1)/(x + 1)| + C',
  },
] as const;

function renderHomepageAttemptCard(): string {
  return `
    <article class="homepage-attempt-card homepage-doing-card" aria-label="Learn by doing preview" data-homepage-demo>
      <div class="attempt-card-heading">
        <span class="attempt-card-kicker">Deterministic local demo</span>
        <h2>Attempt. Check. Repair.</h2>
        <p>One example of the learning loop, not a full autograder.</p>
      </div>
      <div class="attempt-problem-row">
        <span class="attempt-problem-badge">Q</span>
        <div>
          <strong>Integrate ${renderInlineFormula('\\frac{1}{x^2-1}')}.</strong>
          <small>Each step must be checked before the next one opens.</small>
        </div>
      </div>
      <div class="homepage-demo-progress" aria-label="Demo progress">
        ${homepageDemoSteps.map((_step, index) => `
          <span class="${index === 0 ? 'is-active' : 'is-locked'}" data-demo-progress="${index}">${index + 1}</span>
        `).join('')}
      </div>
      <ol class="doing-step-list">
        ${homepageDemoSteps.map((step, index) => `
          <li class="homepage-demo-step${index === 0 ? ' is-active' : ' is-locked'}" data-demo-step="${index}">
            <span class="attempt-step-number">${index + 1}</span>
            <form data-demo-step-form="${index}">
              <div class="homepage-demo-step-copy">
                <strong>${escapeRawHtml(step.title)}</strong>
                <span>${step.prompt}</span>
              </div>
              <label>
                <span class="visually-hidden">${escapeRawHtml(step.label)}</span>
                <textarea aria-label="${escapeAttr(step.label)}" placeholder="${escapeAttr(step.placeholder)}"${index === 0 ? '' : ' disabled'}></textarea>
              </label>
              <div class="homepage-demo-actions">
                <button class="button primary-button" type="submit"${index === 0 ? '' : ' disabled'}>Check step</button>
                <span class="homepage-demo-status is-waiting" data-demo-status>Locked</span>
              </div>
              <p class="homepage-demo-feedback" data-demo-feedback hidden></p>
            </form>
          </li>
        `).join('')}
      </ol>
      <div class="attempt-lock-row">
        <span aria-hidden="true">loop</span>
        <strong data-demo-complete>Work first. Instruction attaches to the work you produce.</strong>
        <small>Correct checks unlock the next step; wrong checks keep the current step active.</small>
      </div>
    </article>
  `;
}

function renderHomepageLearningLoop(): string {
  return `
    <section class="homepage-section homepage-learning-loop" id="learning-loop" aria-labelledby="learning-loop-title">
      <div class="homepage-section-heading">
        <h2 id="learning-loop-title">The Asterion Learning Loop</h2>
        <p>A repeatable system that builds exam-facing mathematical behavior.</p>
      </div>
      <ol class="learning-loop-list">
        ${homepageLearningSteps.map(([title, text], index) => `
          <li>
            <span class="loop-index">${index + 1}</span>
            <span class="loop-icon" aria-hidden="true">${homepageLearningIcons[index]}</span>
            <strong>${escapeRawHtml(title)}</strong>
            <p>${escapeRawHtml(text)}</p>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderHomepageTrustContract(): string {
  return `
    <section class="homepage-section homepage-trust-contract" aria-labelledby="trust-contract-title">
      <div class="homepage-section-heading">
        <h2 id="trust-contract-title">Trust Signals</h2>
        <p>Compact rules for a static CAIE 9709 learning system.</p>
      </div>
      <div class="trust-card-grid">
        ${homepageTrustCards.map(([title, text]) => `
          <article>
            <span class="trust-icon" aria-hidden="true">check</span>
            <h3>${escapeRawHtml(title)}</h3>
            <p>${escapeRawHtml(text)}</p>
          </article>
        `).join('')}
      </div>
      <div class="homepage-evidence-banner">
        <div>
          <strong>A clean Checked Practice pass is the strongest local evidence.</strong>
          <p>Hints, revealed answers, repair, and Exam Training help you learn, but they do not replace clean Checked Practice evidence.</p>
        </div>
        <ul aria-label="Progress evidence labels">
          <li>Clean pass</li>
          <li>Learning support</li>
          <li>Self-marked</li>
          <li>Exam Training</li>
        </ul>
      </div>
    </section>
  `;
}

function renderHomepageCoursePanel(pagePath: string): string {
  const courseCards = COURSES.map((course) => {
    const description = {
      p1: 'AS foundation, algebra, functions, calculus, trigonometry.',
      p3: 'A2 pure mathematics practice and exam preparation.',
      m1: 'Forces, motion, energy, momentum.',
      s1: 'Probability, distributions, and data.',
    }[course.id];
    const label = course.id === P3_COURSE_ID ? 'Ready' : 'In progress';
    const title = course.id === 's1' ? 'Statistics 1' : course.displayName;
    const modeLinks = course.id === P3_COURSE_ID
      ? [
        { label: 'Open P3', path: coursePagePath(course) },
        { label: 'Learn', path: learnPagePath(STUDY_TOPICS[0]) },
        { label: 'Checked Practice', path: skillCheckPagePath(STUDY_TOPICS[0]) },
        { label: 'Exam Questions', path: topicExamTrainingPagePath(STUDY_TOPICS[0]) },
      ]
      : [
        { label: `Open ${course.shortName}`, path: coursePagePath(course) },
      ];
    return `
      <article class="course-card homepage-entry-card course-status-${escapeAttr(course.status)}" aria-labelledby="home-course-${escapeAttr(course.id)}">
        <div class="course-card-header-row">
          <span class="course-code-badge" aria-hidden="true">${escapeHtml(course.shortName)}</span>
          <div>
            <h2 id="home-course-${escapeAttr(course.id)}">${escapeHtml(title)}</h2>
            <p class="course-card-lede">${escapeHtml(description)}</p>
          </div>
        </div>
        <span class="course-status-pill">${escapeHtml(label)}</span>
        <div class="homepage-card-links" aria-label="${escapeAttr(title)} work modes">
          ${modeLinks.map((link, index) => `
            <a class="${index === 0 ? 'button primary-button' : 'text-link'}" href="${hrefToPage(pagePath, link.path)}">${escapeHtml(link.label)}</a>
          `).join('')}
        </div>
      </article>
    `;
  }).join('');

  return `
    <section class="homepage-course-panel" aria-labelledby="course-panel-title">
      <div class="homepage-course-panel-heading">
        <h2 id="course-panel-title">Choose a paper</h2>
        <p>P3 is the main working course. The other papers are visible with conservative status until their course pages are expanded.</p>
      </div>
      <div class="home-course-row">${courseCards}</div>
    </section>
  `;
}

const homepageContactEmail = 'brooker@rdfzcygj.cn';

const homepageActionCards = [
  {
    title: 'Diagnostic',
    subtitle: 'Find your start',
    icon: '<svg viewBox="0 0 32 32" focusable="false" aria-hidden="true"><path d="M16 4v5"/><path d="M16 23v5"/><path d="M4 16h5"/><path d="M23 16h5"/><circle cx="16" cy="16" r="8"/><circle cx="16" cy="16" r="3"/></svg>',
    path: p3DiagnosticPagePath(),
  },
  {
    title: 'Learn',
    subtitle: 'Build understanding',
    icon: '<svg viewBox="0 0 32 32" focusable="false" aria-hidden="true"><path d="M5 8c4.5 0 7.5 1 11 4v15c-3.5-3-6.5-4-11-4V8Z"/><path d="M27 8c-4.5 0-7.5 1-11 4v15c3.5-3 6.5-4 11-4V8Z"/></svg>',
    path: learnPagePath(STUDY_TOPICS[0]),
  },
  {
    title: 'Practice',
    subtitle: 'Check your skills',
    icon: '<svg viewBox="0 0 32 32" focusable="false" aria-hidden="true"><path d="m7 25 3-1 15-15-2-2L8 22l-1 3Z"/><path d="m20 6 6 6"/><path d="M5 27h20"/></svg>',
    path: skillCheckPagePath(STUDY_TOPICS[0]),
  },
  {
    title: 'Apply',
    subtitle: 'Exam questions',
    icon: '<svg viewBox="0 0 32 32" focusable="false" aria-hidden="true"><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="7"/><circle cx="16" cy="16" r="3"/></svg>',
    path: topicExamTrainingPagePath(STUDY_TOPICS[0]),
  },
] as const;

const homepageTopicStrip = [
  { label: 'Algebra', slug: 'algebra', symbol: 'x' },
  { label: 'Log/Exp', slug: 'logarithmic-and-exponential-functions', symbol: 'ln' },
  { label: 'Complex', slug: 'complex-numbers', symbol: 'i' },
  { label: 'Trigonometry', slug: 'trigonometry', symbol: 'sin' },
  { label: 'Vectors', slug: 'vectors', symbol: 'v' },
  { label: 'Differentiation', slug: 'differentiation', symbol: 'dy' },
  { label: 'Integration', slug: 'integration', symbol: '∫' },
  { label: 'Diff Eq', slug: 'differential-equations', symbol: 'y′' },
  { label: 'Iteration', slug: 'numerical-solution-of-equations', symbol: '↻' },
] as const;

function renderHomepageActionCards(pagePath: string): string {
  return `
    <div class="home-p3-action-grid" aria-label="Main P3 actions">
      ${homepageActionCards.map((card) => `
        <a class="home-p3-action-card" href="${hrefToPage(pagePath, card.path)}">
          <span class="home-p3-action-icon">${card.icon}</span>
          <span>
            <strong>${escapeHtml(card.title)}</strong>
            <small>${escapeHtml(card.subtitle)}</small>
          </span>
        </a>
      `).join('')}
    </div>
  `;
}

function renderHomepageTopicStrip(pagePath: string): string {
  const topicsBySlug = new Map(STUDY_TOPICS.map((topic) => [topic.slug, topic]));
  return `
    <nav class="home-p3-topic-strip" aria-label="P3 topic links">
      ${homepageTopicStrip.map((item) => {
        const topic = topicsBySlug.get(item.slug);
        const targetPath = topic ? learnPagePath(topic) : p3TopicsIndexPagePath();
        return `
          <a class="home-p3-topic-tile" href="${hrefToPage(pagePath, targetPath)}">
            <span class="home-p3-topic-symbol" aria-hidden="true">${escapeHtml(item.symbol)}</span>
            <span>${escapeHtml(item.label)}</span>
          </a>
        `;
      }).join('')}
    </nav>
  `;
}

function renderHomepageContactBar(): string {
  return `
    <section class="homepage-contact-bar" id="contact" aria-label="Contact Asterion">
      <div>
        <h2>Contact me</h2>
        <p>Questions, feedback, or course requests.</p>
      </div>
      <a href="mailto:${escapeAttr(homepageContactEmail)}?subject=Asterion%20contact">Send an email</a>
    </section>
  `;
}

function renderAboutPage(): string {
  const pagePath = aboutPagePath();
  const body = `
    <section class="about-hero">
      <p class="eyebrow">About Asterion</p>
      <h1>Asterion teaches the behavior behind exam-facing mathematics.</h1>
      <p>Students attempt first, compare their route, repair the gap, and then train on real CAIE questions. The system is deliberately evidence-first.</p>
      <div class="hero-actions">
        <a class="button primary-button" href="${hrefToPage(pagePath, learnPagePath(STUDY_TOPICS[0]))}">Start P3</a>
        <a class="button secondary-button" href="${hrefToPage(pagePath, 'index.html')}#contact">Contact</a>
      </div>
    </section>
    ${renderHomepageLearningLoop()}
    ${renderHomepageTrustContract()}
  `;
  return renderPage({
    pagePath,
    title: 'About Asterion',
    description: 'Asterion learning loop and trust contract for CAIE 9709 study.',
    active: 'courses',
    body,
    bodyClass: 'home-page about-page',
  });
}

function renderCourseSelectorPage(): string {
  const pagePath = 'index.html';
  const body = `
    <section class="home-p3-landing" aria-labelledby="home-p3-title">
      <div class="home-starfield" aria-hidden="true">
        <span class="home-star-layer home-star-layer-one"></span>
        <span class="home-star-layer home-star-layer-two"></span>
        <svg class="home-constellation home-constellation-left" viewBox="0 0 260 260" focusable="false">
          <path d="M34 64 86 92 126 52 182 108 224 86" />
          <path d="M86 92 76 154 118 208 176 178" />
          <circle cx="34" cy="64" r="3" /><circle cx="86" cy="92" r="3" /><circle cx="126" cy="52" r="3" /><circle cx="182" cy="108" r="3" /><circle cx="224" cy="86" r="3" /><circle cx="76" cy="154" r="3" /><circle cx="118" cy="208" r="3" /><circle cx="176" cy="178" r="3" />
        </svg>
        <svg class="home-constellation home-constellation-right" viewBox="0 0 260 260" focusable="false">
          <path d="M44 74 94 46 150 92 208 84" />
          <path d="M150 92 138 154 190 210 226 166" />
          <circle cx="44" cy="74" r="3" /><circle cx="94" cy="46" r="3" /><circle cx="150" cy="92" r="3" /><circle cx="208" cy="84" r="3" /><circle cx="138" cy="154" r="3" /><circle cx="190" cy="210" r="3" /><circle cx="226" cy="166" r="3" />
        </svg>
      </div>
      <div class="home-p3-hero">
        <p class="home-p3-eyebrow">Master CAIE 9709</p>
        <h1 id="home-p3-title">Pure Mathematics 3</h1>
        <p class="home-p3-subtitle">Learn what matters. Practice with purpose.<br />Prepare for the exam with confidence.</p>
        <p class="home-p3-path-line">Default path: Diagnostic → Learn → Checked Practice → Exam Training.</p>
        ${renderHomepageActionCards(pagePath)}
        <div class="home-p3-cta-group">
          <a class="button primary-button home-p3-primary-cta" href="${hrefToPage(pagePath, p3DiagnosticPagePath())}">Start diagnostic</a>
          <a class="home-p3-diagnostic-link" href="${hrefToPage(pagePath, learnPagePath(STUDY_TOPICS[0]))}">Already completed it? Start Algebra Learn</a>
        </div>
      </div>
      ${renderHomepageTopicStrip(pagePath)}
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'Pure Mathematics 3',
    description: 'Asterion Pure Mathematics 3 practice landing page for CAIE 9709.',
    active: 'courses',
    body,
    bodyClass: 'home-page',
    hideThemeToggle: true,
    forcedTheme: 'dark',
  });
}

function renderCourseDashboardPage(course: CourseMetadata): string {
  const pagePath = coursePagePath(course);
  const isP3 = course.id === P3_COURSE_ID;
  const topicButtons = isP3
    ? STUDY_TOPICS.map((topic) => `
      <a class="course-topic-button" href="${hrefToPage(pagePath, learnPagePath(topic))}" aria-label="Start ${escapeAttr(topic.name)} Learn">
        <span class="topic-card-title">${escapeHtml(topic.name)}</span>
        <small>${escapeHtml(topic.description)}</small>
        <span class="topic-card-formula">${renderMathText(`$${topic.headerFormula}$`)}</span>
        ${topic.slug === STUDY_TOPICS[0]?.slug ? '<span class="topic-status-chip">Start here</span>' : ''}
        <span class="topic-card-arrow" aria-hidden="true">&#8594;</span>
      </a>
    `).join('')
    : '';
  const courseBody = isP3
    ? `
      <section class="summary-card course-topic-list" aria-labelledby="course-topic-list-title" id="course-topics">
        <div>
          <h2 id="course-topic-list-title">Choose a topic</h2>
          <p>Start with one topic. Learn opens first.</p>
        </div>
        <div class="course-topic-button-grid">
          ${topicButtons}
        </div>
      </section>
      <section class="summary-card" aria-labelledby="p3-review-title">
        <p class="eyebrow">Export</p>
        <h2 id="p3-review-title">Send progress from this browser.</h2>
        <p>Your teacher should treat clean Checked Practice passes as the strongest evidence. Self-marked exam attempts are practice records only.</p>
        ${p3ReviewExportLink(pagePath, 'Export Progress', 'button secondary-button')}
      </section>
    `
    : `
      <section class="summary-card course-topic-list support-only-panel" aria-labelledby="course-topic-list-title" id="course-topics">
        <div>
          <h2 id="course-topic-list-title">Support only</h2>
          <p>${escapeHtml(course.coverageSummary)}</p>
        </div>
        <p class="empty-state">No ${escapeHtml(course.shortName)} topic route is published on this static P3 product branch.</p>
        ${routeLink(pagePath, p3CoursePagePath(), 'Back to P3', 'button primary-button')}
      </section>
    `;
  const body = `
    <section class="page-hero course-page-hero">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(course.examComponentLabel)}</p>
        <h1>${escapeHtml(`${course.shortName}: ${course.displayName}`)}</h1>
        <p>${escapeHtml(course.shortDescription)}</p>
      </div>
      ${renderCourseMathVisual()}
    </section>
    ${courseBody}
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName}: ${course.displayName}`,
    description: `${course.shortName} course page for the static CAIE 9709 study hub.`,
    active: course.id,
    body,
  });
}

function renderP3TopicsIndexPage(
  data: StaticSiteData,
  pagePath = p3TopicsIndexPagePath(),
): string {
  return renderP3LearningPathPage(data, pagePath);
}

function statusClassName(label: P3SkillContractPageRow['statusLabel']): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function contractTopicAnchor(topic: P3OfficialTopic): string {
  return `need-to-know-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

interface P3NeedToKnowChecklistBand {
  id: string;
  title: string;
  topics: P3OfficialTopic[];
}

const P3_NEED_TO_KNOW_CHECKLIST_BANDS: P3NeedToKnowChecklistBand[] = [
  {
    id: 'algebra-functions',
    title: 'Algebra, functions, and trigonometry',
    topics: ['Algebra', 'Logarithmic and Exponential Functions', 'Trigonometry'],
  },
  {
    id: 'calculus',
    title: 'Differentiation and integration',
    topics: ['Differentiation', 'Integration'],
  },
  {
    id: 'numerical-methods',
    title: 'Numerical methods',
    topics: ['Numerical Solution of Equations'],
  },
  {
    id: 'vectors-complex',
    title: 'Vectors and complex numbers',
    topics: ['Vectors', 'Complex Numbers'],
  },
  {
    id: 'differential-equations',
    title: 'Differential equations',
    topics: ['Differential Equations'],
  },
];

function renderContractAvailabilityLinks(pagePath: string, row: P3SkillContractPageRow): string {
  const { topic, availability } = row;
  const links = [
    availability.fieldGuide
      ? contractRouteLink(pagePath, learnPagePath(topic), 'Learn', 'field-guide')
      : '<span class="contract-resource-missing">Learn content planned</span>',
    availability.skillCheck
      ? contractRouteLink(pagePath, learnPagePath(topic), 'Checked Practice', 'skill-check')
      : '<span class="contract-resource-missing">Checked practice planned</span>',
    availability.examTraining
      ? contractRouteLink(pagePath, topicExamTrainingPagePath(topic), 'Exam Training', 'exam-training')
      : '<span class="contract-resource-missing">Exam training planned</span>',
  ];

  return `<div class="contract-resource-list">${links.join('')}</div>`;
}

function availabilityCount(rows: P3SkillContractPageRow[], key: keyof P3SkillContractAvailability): number {
  return rows.filter((row) => row.availability[key]).length;
}

function renderAvailabilitySummary(rows: P3SkillContractPageRow[]): string {
  return `
    <dl class="contract-availability-summary" aria-label="Content availability">
      <div>
        <dt>Learn</dt>
        <dd>${availabilityCount(rows, 'fieldGuide')}/${rows.length}</dd>
      </div>
      <div>
        <dt>Checked Practice</dt>
        <dd>${availabilityCount(rows, 'skillCheck')}/${rows.length}</dd>
      </div>
      <div>
        <dt>Exam Training</dt>
        <dd>${availabilityCount(rows, 'examTraining')}/${rows.length}</dd>
      </div>
    </dl>
  `;
}

function renderExamTriggerList(skill: P3SkillContractEntry): string {
  return `
    <section class="contract-trigger-section" aria-label="Exam triggers for ${escapeRawAttr(skill.title)}">
      <h4>Exam triggers</h4>
      <ul class="contract-trigger-list">
        ${skill.examTriggers.map((trigger) => `<li>${escapeRawHtml(trigger)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function renderP3NeedToKnowPage(data: StaticSiteData, pagePath = p3NeedToKnowPagePath()): string {
  const groups = p3SkillContractRowsByTopic(data);
  const totalSkills = P3_SKILL_CONTRACT.length;
  const groupsByTopic = new Map(groups.map((group) => [group.topic, group]));
  const body = `
    ${renderHero(
      'P3 Need to Know',
      'A low-load checklist for the official Paper 3 skills currently tracked by Asterion.',
      '\\frac{dy}{dx}, \\quad \\int f(x)\\,dx, \\quad z=x+iy',
      `${routeLink(pagePath, p3TopicsIndexPagePath(), 'Back to P3', 'button secondary-button')}`,
    )}
    <section class="need-to-know-checklist" aria-labelledby="need-to-know-checklist-title">
      <div class="section-heading need-to-know-heading">
        <div>
          <h2 id="need-to-know-checklist-title">Checklist</h2>
          <p>${totalSkills} skills are grouped into ${P3_NEED_TO_KNOW_CHECKLIST_BANDS.length} topic bands. Use each open band as a revision checklist; teacher/details panels hold route and availability detail.</p>
        </div>
      </div>
      ${P3_NEED_TO_KNOW_CHECKLIST_BANDS.map((band) => {
        const bandGroups = band.topics
          .map((topic) => groupsByTopic.get(topic))
          .filter((group): group is { topic: P3OfficialTopic; rows: P3SkillContractPageRow[] } => Boolean(group));
        const bandRows = bandGroups.flatMap((group) => group.rows);
        return `
          <details class="contract-topic-band" id="need-to-know-band-${escapeRawAttr(band.id)}">
            <summary>
              <span>
                <strong>${escapeRawHtml(band.title)}</strong>
                <small>${bandRows.length} tracked skill${bandRows.length === 1 ? '' : 's'}</small>
              </span>
              ${renderAvailabilitySummary(bandRows)}
            </summary>
            <div class="contract-band-detail">
              <p class="question-instruction">Tick these skills off as you revise. Progress decisions stay inside Learn, Checked Practice, and Exam Training.</p>
              ${bandGroups.map((group) => `
                <section class="contract-topic-section" aria-labelledby="${escapeRawAttr(contractTopicAnchor(group.topic))}">
                  <details class="contract-official-topic-details">
                    <summary>
                      <span>${escapeRawHtml(group.topic)}</span>
                      <small>${group.rows.length} skill${group.rows.length === 1 ? '' : 's'}</small>
                    </summary>
                    <div class="contract-skill-grid">
                      ${group.rows.map((row) => `
                        <article class="contract-skill-card" data-skill-id="${escapeRawAttr(row.skill.id)}">
                          <header class="contract-skill-card-header">
                            <div>
                              <p class="eyebrow">${escapeRawHtml(row.skill.officialTopic)}</p>
                              <h3>${escapeRawHtml(row.skill.title)}</h3>
                            </div>
                          </header>
                          <ul class="contract-checklist">
                            ${row.skill.needToKnow.map((item) => `<li>${escapeRawHtml(item)}</li>`).join('')}
                          </ul>
                          <details class="contract-skill-detail">
                            <summary>Teacher/details</summary>
                            ${renderExamTriggerList(row.skill)}
                            <p class="contract-availability-label">Content availability</p>
                            ${renderContractAvailabilityLinks(pagePath, row)}
                          </details>
                        </article>
                      `).join('')}
                    </div>
                  </details>
                </section>
              `).join('')}
            </div>
          </details>
        `;
      }).join('')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'P3 Need to Know',
    description: 'Student-facing Paper 3 skill checklist grouped by official topic.',
    active: 'p3',
    body,
  });
}

function renderP3ReviewPage(data: StaticSiteData, pagePath = p3ReviewPagePath()): string {
  const contexts = STUDY_TOPICS.map((topic) => topicContext(topic, data));
  const mixedQuestions = data.questions
    .filter(isTrainableP3Question)
    .filter((question) => Boolean(question.routeEvidence?.displayRegionId))
    .slice(0, 12);
  const requirements = p3ExamReviewRequirements(contexts, pagePath);
  const repairRoutes = p3SkillRepairRoutes(contexts, pagePath);
  const body = `
    ${renderHero(
      'Export Progress',
      'Download or send your local Asterion progress CSV after each session, then use mixed Paper 3 questions and mistake repair for review.',
      '\\Delta, \\quad \\log_a x, \\quad z=x+iy',
      `${routeLink(pagePath, p3CoursePagePath(), 'Back to P3', 'button secondary-button')}
      ${routeLink(pagePath, p3NeedToKnowPagePath(), 'Need to Know', 'button secondary-button')}`,
      'Summer homework',
    )}
    <section class="support-panel" id="export-progress" data-export-panel aria-labelledby="export-progress-title">
      <div>
        <p class="eyebrow">Email export</p>
        <h2 id="export-progress-title">Send local progress CSV</h2>
        <p>The CSV only includes attempts and progress stored in this browser. Your teacher should treat clean Checked Practice passes as the strongest evidence. Self-marked exam attempts are practice records only.</p>
      </div>
      <section class="teacher-progress-summary" aria-labelledby="teacher-progress-summary-title">
        <div>
          <p class="eyebrow">Before you export</p>
          <h2 id="teacher-progress-summary-title">Progress summary for teacher</h2>
          <p class="teacher-progress-warning">This record is saved only in this browser on this device. It is local evidence, not a server-verified account record.</p>
        </div>
        <div data-export-teacher-summary>
          <dl class="teacher-progress-summary-list">
            <div><dt>P3 units with clean Checked Practice pass</dt><dd>Not recorded in this browser</dd></div>
            <div><dt>P3 units still incomplete</dt><dd>Not recorded in this browser</dd></div>
            <div><dt>Total clean Checked Practice passes</dt><dd>Not recorded in this browser</dd></div>
            <div><dt>Hint-used attempts</dt><dd>Not recorded in this browser</dd></div>
            <div><dt>Revealed-answer attempts</dt><dd>Not recorded in this browser</dd></div>
            <div><dt>Repair attempts</dt><dd>Not recorded in this browser</dd></div>
            <div><dt>Self-marked Exam Training attempts</dt><dd>Not recorded in this browser</dd></div>
            <div><dt>Browser/device warning</dt><dd>This record is saved only in this browser on this device. It is local evidence, not a server-verified account record.</dd></div>
          </dl>
        </div>
      </section>
      <form class="export-progress-form" data-export-local-progress-form>
        <label class="single-answer-field">
          <span>Student name</span>
          <input name="studentName" type="text" autocomplete="name" required />
        </label>
        <label class="single-answer-field">
          <span>Class/group</span>
          <input name="classGroup" type="text" autocomplete="organization" required />
        </label>
        <label class="single-answer-field">
          <span>Teacher email</span>
          <input name="teacherEmail" type="email" autocomplete="email" required />
        </label>
        <label class="single-answer-field">
          <span>Reporting period</span>
          <input name="reportingPeriod" type="text" />
        </label>
        <div class="export-progress-actions">
          <button class="button primary-button" type="button" data-download-export-csv>Download CSV</button>
          <button class="button secondary-button" type="submit">Open Email</button>
        </div>
      </form>
      <div class="export-csv-fallback" data-export-fallback hidden>
        <p class="save-status">If email does not open, download the CSV or copy it and attach/paste it in your own message.</p>
        <textarea class="export-csv-output" data-export-csv-output readonly rows="8" aria-label="Generated progress CSV"></textarea>
        <button class="button secondary-button" type="button" data-copy-export-csv>Copy CSV</button>
      </div>
      <p class="save-status" data-export-status role="status"></p>
    </section>
    <section class="exam-review-gate" data-p3-exam-review-gate data-required-topics="${escapeAttr(JSON.stringify(requirements))}">
      <div class="exam-review-locked" data-exam-review-locked>
        <div>
          <p class="eyebrow">Locked until the path is complete</p>
          <h2>Finish every P3 unit first.</h2>
          <p data-exam-review-status>Checking local progress...</p>
        </div>
        <ol class="exam-review-topic-list" data-exam-review-topic-list>
          ${requirements.map((requirement) => `
            <li>
              <strong>${escapeHtml(requirement.name)}</strong>
              <span>Checked questions 0/${requirement.requiredCheckIds.length}; optional Learn 0/${requirement.fieldGuideTotal}</span>
            </li>
          `).join('')}
        </ol>
        ${routeLink(pagePath, skillCheckPagePath(STUDY_TOPICS[0]), 'Start Unit 1', 'button primary-button')}
      </div>
      <div class="exam-review-open" data-exam-review-open hidden>
        <section class="exam-question-section" id="mixed-questions">
          <div class="section-heading">
            <div>
              <h2>Mixed Paper 3 questions</h2>
              <p>Attempt the question on paper, reveal the mark scheme, then self-mark honestly. Exam Training is self-marked practice. It helps you prepare, but it does not replace Checked Practice evidence unless your teacher says so.</p>
            </div>
          </div>
          <div class="exam-question-grid" data-exam-flow data-flow-label="Paper 3 exam review question">
            ${mixedQuestions.map((question) => renderExamQuestionCard(question, pagePath)).join('')}
          </div>
          ${mixedQuestions.length === 0 ? '<p class="empty-state">No mixed exam images are available yet.</p>' : ''}
        </section>
      </div>
    </section>
    <section class="exam-callout compact-callout">
      <div>
        <p class="eyebrow">Local exam evidence</p>
        <h2>Saved attempts</h2>
        <p>Use these totals to plan review, not as a grade. Self-marked exam attempts are practice records only.</p>
      </div>
      <div class="exam-stats">
        <span data-total-attempts data-paper-family="p3" data-paper-label="Paper 3">0 saved Paper 3 attempts</span>
        <span data-topic-tried-count data-paper-family="p3">0 topic areas tried</span>
      </div>
    </section>
    <section class="attempt-history-section" data-attempt-history-list data-attempt-history-limit="120" aria-labelledby="all-attempt-history-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Response history</p>
          <h2 id="all-attempt-history-title">Review submitted answers</h2>
          <p data-attempt-history-summary>No submitted responses saved in this browser yet.</p>
        </div>
      </div>
      <p class="empty-state" data-attempt-history-empty>Complete a Learn or Checked Practice question to see correct and incorrect submissions here.</p>
      <div class="attempt-history-list" data-attempt-history-items></div>
    </section>
    <details class="jump-details" data-mistake-review-details>
      <summary>Review mistakes from saved Checked Practice</summary>
      <section class="summary-card review-empty-state" data-review-empty>
        <h2>No due spaced repairs yet.</h2>
        <p>Repair groups appear when a tagged Checked Practice mistake reaches its delayed retrieval window. One immediate correction does not close the loop.</p>
      </section>
      <section class="review-session" data-review-session data-review-skill-routes="${escapeAttr(JSON.stringify(repairRoutes))}" hidden>
        <div class="section-heading">
          <div>
            <p class="eyebrow">Due delayed retrieval</p>
            <h2>Spaced repair groups</h2>
            <p data-review-summary>Loading local spaced repair...</p>
          </div>
        </div>
        <div class="review-group-stack" data-review-groups></div>
      </section>
    </details>
  `;
  return renderPage({
    pagePath,
    title: 'Export Progress',
    description: 'Email local P3 progress and review saved mistakes after the sequential P3 unit path.',
    active: 'p3',
    body,
    bodyClass: 'exam-training-page',
  });
}

function availabilityText(available: boolean): string {
  return available ? 'Available' : 'Missing';
}

function ladderAvailabilityText(row: P3SkillContractPageRow, ladderLevel: typeof P3_EXAM_LADDER_LEVELS[number]): string {
  const bucket = row.examLadder.levels[ladderLevel];
  if (bucket.status !== 'populated') return 'Missing';
  return ladderLevel === 'mixed'
    ? `Mapped questions (${bucket.questionIds.length})`
    : `Available (${bucket.questionIds.length})`;
}

function renderP3ContentQaMobileCards(rows: P3SkillContractPageRow[]): string {
  return `
    <div class="contract-qa-card-list" aria-label="Mobile skill QA summaries">
      ${rows.map((row) => {
        const mappedCount = typeof row.mappedExamQuestionCount === 'number' ? String(row.mappedExamQuestionCount) : 'Unknown';
        const notes = [...(row.skill.reviewFlags ?? []), row.skill.notes].filter(Boolean).join('; ') || 'None';
        return `
          <article class="contract-qa-mobile-card" data-skill-id="${escapeRawAttr(row.skill.id)}">
            <header>
              <code>${escapeRawHtml(row.skill.id)}</code>
              <span class="contract-status contract-status-${escapeRawAttr(statusClassName(row.statusLabel))}">${escapeRawHtml(row.statusLabel)}</span>
            </header>
            <h3>${escapeRawHtml(row.skill.title)}</h3>
            <dl>
              <div>
                <dt>Topic</dt>
                <dd>${escapeRawHtml(row.skill.officialTopic)}</dd>
              </div>
              <div>
                <dt>Learn</dt>
                <dd>${availabilityText(row.availability.fieldGuide)}</dd>
              </div>
              <div>
                <dt>Checked Practice</dt>
                <dd>${availabilityText(row.availability.skillCheck)}</dd>
              </div>
              <div>
                <dt>Exam Training</dt>
                <dd>${availabilityText(row.availability.examTraining)}</dd>
              </div>
              <div>
                <dt>Mapped count</dt>
                <dd>${escapeRawHtml(mappedCount)}</dd>
              </div>
              <div>
                <dt>Evidence status</dt>
                <dd>${escapeRawHtml(row.statusLabel)}</dd>
              </div>
              <div class="contract-qa-card-notes">
                <dt>Notes</dt>
                <dd>${escapeRawHtml(notes)}</dd>
              </div>
            </dl>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderP3ContentQaPage(data: StaticSiteData, pagePath = p3ContentQaPagePath()): string {
  const rows = p3SkillContractRows(data);
  const gradingSummary = rows.reduce((summary, row) => ({
    deterministic: summary.deterministic + row.skillCheckCheckability.deterministic,
    notYetCheckable: summary.notYetCheckable + row.skillCheckCheckability.notYetCheckable,
    unsupported: summary.unsupported + row.skillCheckCheckability.unsupported,
    answerTypes: Array.from(new Set([...summary.answerTypes, ...row.skillCheckCheckability.answerTypes])),
  }), emptySkillCheckabilitySummary());
  const body = `
    ${renderHero(
      'Internal Content QA',
      'This page is for maintaining the course, not for student study.',
      '\\log_a x, \\quad \\mathbf{a}\\cdot\\mathbf{b}, \\quad \\arg z',
      `${routeLink(pagePath, p3NeedToKnowPagePath(), 'Need to Know', 'button secondary-button')}`,
      'Internal',
    )}
    <section class="summary-card contract-qa-summary">
      <p class="eyebrow">Internal maintenance page</p>
      <p>This page is for maintaining the course, not for student study.</p>
      <h2>Contract coverage snapshot</h2>
      <p>Rows come from the structured P3 skill contract. Field Guide and Skill Check availability are proxy checks from review flags. Exam Training and mixed ladder counts come from reviewed mapped trainable exam questions. Mixed is not an easy, standard, or hard ladder.</p>
      <p>Skill Check grading migration: ${escapeRawHtml(skillCheckabilityText(gradingSummary))}. This is a partial Phase 3 migration and does not mark existing saves as passed.</p>
    </section>
    ${renderTopicSkillCheckMigrationSnapshot()}
    <section class="contract-table-shell" aria-labelledby="content-qa-table-title">
      <div class="section-heading">
        <div>
          <h2 id="content-qa-table-title">Skill QA table</h2>
          <p>${rows.length} P3 skills. P1, M1, and S1 are not part of this contract.</p>
        </div>
      </div>
      ${renderP3ContentQaMobileCards(rows)}
      <div class="contract-table-scroll">
        <table class="contract-qa-table">
          <thead>
            <tr>
              <th>Skill ID</th>
              <th>Topic</th>
              <th>Skill title</th>
              <th>Learn</th>
              <th>Checked Practice</th>
              <th>Checked Practice grading</th>
              <th>Exam Training</th>
              <th>Mapped exam questions</th>
              <th>Easy ladder</th>
              <th>Standard ladder</th>
              <th>Hard ladder</th>
              <th>Mixed mapped questions</th>
              <th>Evidence status</th>
              <th>Notes / review flags</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr data-skill-id="${escapeRawAttr(row.skill.id)}">
                <td><code>${escapeRawHtml(row.skill.id)}</code></td>
                <td>${escapeRawHtml(row.skill.officialTopic)}</td>
                <td>${escapeRawHtml(row.skill.title)}</td>
                <td>${availabilityText(row.availability.fieldGuide)}</td>
                <td>${availabilityText(row.availability.skillCheck)}</td>
                <td>${escapeRawHtml(skillCheckabilityText(row.skillCheckCheckability))}</td>
                <td>${availabilityText(row.availability.examTraining)}</td>
                <td>${typeof row.mappedExamQuestionCount === 'number' ? row.mappedExamQuestionCount : 'Unknown'}</td>
                ${P3_EXAM_LADDER_LEVELS.map((ladderLevel) => `
                  <td data-ladder-level="${escapeRawAttr(ladderLevel)}">${escapeRawHtml(ladderAvailabilityText(row, ladderLevel))}</td>
                `).join('')}
                <td><span class="contract-status contract-status-${escapeRawAttr(statusClassName(row.statusLabel))}">${escapeRawHtml(row.statusLabel)}</span></td>
                <td>${escapeRawHtml([...(row.skill.reviewFlags ?? []), row.skill.notes].filter(Boolean).join('; ') || 'None')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'Internal Content QA',
    description: 'Internal QA table for the Paper 3 skill contract.',
    active: 'p3',
    body,
  });
}

function renderPatternTable(example: FieldGuideTopicExample): string {
  if (!example.patternRows.length) return '';
  return `
    <table class="pattern-table">
      <caption>${escapeHtml(example.patternTitle)}</caption>
      <tbody>
        ${example.patternRows.map((row) => `
          <tr>
            <td>${renderMathText(row.from)}</td>
            <td>${escapeHtml(row.move)}</td>
            <td>${renderMathText(row.to)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderCommonMistake(example: FieldGuideTopicExample): string {
  const commonMistake = example.takeaway.find((line) => /^Common (?:mistake|trap):/i.test(cleanVisibleCopy(line)));
  if (!commonMistake) return '';
  return `
    <aside class="common-mistake-box">
      <strong>Common mistake</strong>
      <p>${renderMathText(cleanVisibleCopy(commonMistake).replace(/^Common (?:mistake|trap):\s*/i, ''))}</p>
    </aside>
  `;
}

function resolvedLesson(example: FieldGuideTopicExample): ProblemFirstLesson {
  return example.lesson ?? {
    needProblem: example.prompt,
    studentAction: example.tryScaffold[0] ?? 'Choose the first useful move before reading the worked route.',
    nextUsefulPiece: example.workedLines[0] ?? 'Look for the structure before doing the full calculation.',
    namedPrinciple: `Principle: ${example.patternTitle}.`,
    similarOne: example.tryPrompt,
    examTransfer: example.takeaway.at(-1) ?? 'Exam transfer: recognize the method before completing the routine calculation.',
  };
}

function renderWorkedRouteDetails(example: FieldGuideTopicExample): string {
  return `
    <details class="lesson-support-details worked-route-details">
      <summary>Show worked route</summary>
      <ol class="worked-list">
        ${example.workedLines.map((line) => `<li>${renderMathText(line)}</li>`).join('')}
      </ol>
      <p class="result"><strong>Result:</strong> ${renderMathText(example.result)}</p>
    </details>
  `;
}

function renderFieldGuideExample(topic: FieldGuideTopic, example: FieldGuideTopicExample, index: number): string {
  const lesson = resolvedLesson(example);
  return `
    <article class="lesson-card problem-first-lesson">
      <p class="eyebrow">Example ${index + 1}</p>
      <h3>${escapeHtml(example.title)}</h3>
      <section class="lesson-loop-section try-first-section" aria-labelledby="${escapeAttr(topic.id)}-${index}-try">
        <h4 id="${escapeAttr(topic.id)}-${index}-try">1. Try this first</h4>
        <p class="prompt">${renderMathText(lesson.needProblem)}</p>
      </section>
      <section class="lesson-loop-section first-move-section" aria-labelledby="${escapeAttr(topic.id)}-${index}-move">
        <h4 id="${escapeAttr(topic.id)}-${index}-move">2. First step</h4>
        <p>${renderMathText(lesson.studentAction)}</p>
      </section>
      <details class="lesson-loop-section reveal-section">
        <summary>3. Hint</summary>
        <p>${renderMathText(lesson.nextUsefulPiece)}</p>
      </details>
      <details class="lesson-loop-section reveal-section">
        <summary>4. Idea</summary>
        <p>${renderMathText(lesson.namedPrinciple)}</p>
        ${renderWorkedRouteDetails(example)}
      </details>
      <section class="lesson-loop-section try-block" aria-labelledby="${escapeAttr(topic.id)}-${index}-similar">
        <h4 id="${escapeAttr(topic.id)}-${index}-similar">5. Try similar</h4>
        <p>${renderMathText(lesson.similarOne)}</p>
        <ul>
          ${example.tryScaffold.map((line) => `<li>${renderMathText(line)}</li>`).join('')}
        </ul>
        ${example.tryWorkedLines?.length ? `
          <details>
            <summary>Reveal/check the worked route</summary>
            <ol>
              ${example.tryWorkedLines.map((line) => `<li>${renderMathText(line)}</li>`).join('')}
            </ol>
            ${example.tryResult ? `<p><strong>Try result:</strong> ${renderMathText(example.tryResult)}</p>` : ''}
          </details>
        ` : ''}
      </section>
      <section class="lesson-loop-section exam-transfer-section" aria-labelledby="${escapeAttr(topic.id)}-${index}-transfer">
        <h4 id="${escapeAttr(topic.id)}-${index}-transfer">6. Exam prep</h4>
        <p>${renderMathText(lesson.examTransfer)}</p>
      </section>
      ${renderCommonMistake(example)}
      <details class="lesson-support-details">
        <summary>Extra method table and checks</summary>
        ${renderPatternTable(example)}
        <ul class="takeaway-list" aria-label="${escapeAttr(topic.title)} takeaways">
          ${example.takeaway.map((line) => `<li>${renderMathText(line)}</li>`).join('')}
        </ul>
      </details>
    </article>
  `;
}

function renderFieldGuideVisuals(topic: FieldGuideTopic, pagePath: string): string {
  if (!topic.visuals?.length) return '';
  return `
    <div class="field-guide-visual-list" aria-label="${escapeAttr(topic.title)} visual support">
      ${topic.visuals.map((visual) => {
        if (!publicAssetExists(visual.assetPath)) {
          throw new Error(`Missing Field Guide visual asset for ${topic.id}: ${visual.assetPath}`);
        }
        const instructionalLabels = visual.instructionalLabels?.join(' | ') ?? '';
        return `
          <figure class="field-guide-visual" data-field-guide-visual="${escapeAttr(topic.id)}" data-visual-title="${escapeAttr(visual.title)}" data-instructional-labels="${escapeAttr(instructionalLabels)}">
            <img loading="lazy" src="${hrefToPublicAsset(pagePath, visual.assetPath)}" alt="${escapeAttr(visual.alt)}" />
            <figcaption>
              <strong>${renderMathText(visual.title)}</strong>
              <span>${renderMathText(visual.caption)}</span>
              <small>${renderMathText(visual.testedConcept)}</small>
            </figcaption>
          </figure>
        `;
      }).join('')}
    </div>
  `;
}

function renderFieldGuideTopic(
  topic: FieldGuideTopic,
  region: RegionDefinition,
  index: number,
  topicCount: number,
  nextTopicId: string | undefined,
  practiceHref: string,
  pagePath: string,
  skillCheckHref = practiceHref,
): string {
  return `
    <article class="field-guide-topic" id="${escapeAttr(topic.id)}" data-field-guide-topic="${escapeAttr(topic.id)}" data-region-id="${escapeAttr(region.id)}">
      <header class="topic-section-header">
        <div>
          <p class="eyebrow">Section ${index + 1} of ${topicCount}</p>
          <h2>${escapeHtml(topic.title)}</h2>
          <p>${escapeHtml(cleanVisibleCopy(topic.purpose))}</p>
          ${(topic.description || topic.supportNote) ? `
            <details class="support-details">
              <summary>What to notice</summary>
              ${topic.description ? `<p>${escapeHtml(cleanVisibleCopy(topic.description))}</p>` : ''}
              ${topic.supportNote ? `<p>${renderMathText(cleanVisibleCopy(topic.supportNote))}</p>` : ''}
            </details>
          ` : ''}
        </div>
        <button class="button secondary-button" type="button" data-complete-field-guide-topic="${escapeAttr(topic.id)}" data-region-id="${escapeAttr(region.id)}" data-topic-title="${escapeAttr(topic.title)}">
          I get this
        </button>
      </header>
      ${renderFieldGuideVisuals(topic, pagePath)}
      ${topic.examples.map((example, exampleIndex) => renderFieldGuideExample(topic, example, exampleIndex)).join('')}
      <footer class="section-footer">
        <div class="skill-check-transition">
          <a class="button primary-button" href="${skillCheckHref}">Next: Skill Check</a>
          <p>Opens 3 quick questions on this skill.</p>
        </div>
        ${nextTopicId ? `<a class="button secondary-button" href="#${escapeAttr(nextTopicId)}">Next idea</a>` : ''}
      </footer>
    </article>
  `;
}

function renderP3GuidedFieldGuide(context: TopicContext, pagePath: string, practicePath: string): string {
  const { topic, region, fieldGuideTopics } = context;
  if (!fieldGuideTopics.length) return '<p class="empty-state">No Field Guide steps are available for this topic yet.</p>';
  const practiceHref = hrefToPage(pagePath, practicePath);
  return `
    <section class="guided-study-card" data-guided-study data-practice-href="${practiceHref}" aria-labelledby="guided-study-title">
      <div class="guided-study-header">
        <div>
          <p class="eyebrow">Field Guide</p>
          <h2 id="guided-study-title">Learn ${escapeHtml(topic.name)} step by step</h2>
          <p>One idea is visible at a time. Open the step list only when you need to jump.</p>
        </div>
        <span class="guided-study-progress" data-guided-progress aria-live="polite">1 of ${fieldGuideTopics.length}</span>
      </div>
      <details class="phase-jump-details">
        <summary>Choose another idea</summary>
        <div class="phase-tab-list" role="tablist" aria-label="${escapeAttr(topic.name)} Field Guide steps">
          ${fieldGuideTopics.map((item, index) => `
            <button
              class="phase-tab${index === 0 ? ' is-active' : ''}"
              type="button"
              id="phase-tab-${escapeAttr(topic.slug)}-${escapeAttr(item.id)}"
              role="tab"
              aria-selected="${index === 0 ? 'true' : 'false'}"
              aria-controls="phase-panel-${escapeAttr(topic.slug)}-${escapeAttr(item.id)}"
              data-phase-tab="${escapeAttr(item.id)}"
              data-phase-index="${index}"
            >${escapeHtml(item.title)}</button>
          `).join('')}
        </div>
      </details>
      <div class="phase-panel-stack">
        ${fieldGuideTopics.map((item, index) => `
          <article
            class="phase-panel${index === 0 ? ' is-active' : ''}"
            id="phase-panel-${escapeAttr(topic.slug)}-${escapeAttr(item.id)}"
            role="tabpanel"
            aria-labelledby="phase-tab-${escapeAttr(topic.slug)}-${escapeAttr(item.id)}"
            data-phase-panel="${escapeAttr(item.id)}"
          >
            ${renderFieldGuideTopic(
              item,
              region,
              index,
              fieldGuideTopics.length,
              fieldGuideTopics[index + 1]?.id,
              practiceHref,
              pagePath,
              `${practiceHref}#practice-${escapeAttr(item.id)}`,
            )}
          </article>
        `).join('')}
      </div>
      <div class="guided-study-footer">
        <button class="button secondary-button" type="button" data-guided-prev disabled>Back</button>
        <button class="button primary-button" type="button" data-guided-next>Next idea</button>
      </div>
    </section>
  `;
}

function renderFieldGuidePage(
  context: TopicContext,
  pagePath = fieldGuidePagePath(context.topic),
  practicePath = practicePagePath(context.topic),
): string {
  const { topic, fieldGuideTopics } = context;
  const index = topicIndex(topic);
  const previousTopic = previousStudyTopic(topic);
  const body = `
    ${renderHero(
      `Unit ${index + 1}: ${topic.name}`,
      'Work through the Field Guide subtopics in order. Try the small problem first, then reveal only the next useful move.',
      topic.headerFormula,
      `${previousTopic ? routeLink(pagePath, skillCheckPagePath(previousTopic), `Back: Unit ${index}`, 'button secondary-button') : routeLink(pagePath, p3CoursePagePath(), 'Back to P3', 'button secondary-button')}
      ${routeLink(pagePath, practicePath, 'Checked Practice', 'button primary-button')}`,
    )}
    ${renderP3GuidedFieldGuide(context, pagePath, practicePath)}
    <section class="next-step-card">
      <h2>After the Field Guide</h2>
      <p>Use the Skill Check to prove these subtopics are usable without the worked route open.</p>
      ${renderSkillCheckTransition(pagePath, practicePath, undefined, 'Checked Practice')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} Field Guide`,
    description: `Static Field Guide lessons for ${topic.name}.`,
    active: 'p3-topics',
    body,
  });
}

function renderOptions(options: Array<{ id: string; label: string }> | undefined, name: string, multiple = false): string {
  if (!options?.length) return '';
  return `
    <fieldset class="option-list">
      <legend>Answer choices</legend>
      ${options.map((option) => `
        <label>
          <input type="${multiple ? 'checkbox' : 'radio'}" name="${escapeAttr(name)}" value="${escapeAttr(option.id)}" />
          <span>${renderMathText(option.label)}</span>
        </label>
      `).join('')}
    </fieldset>
  `;
}

function mathAnswerId(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return cleaned || 'math-answer';
}

function renderMathAnswerGuidance(guidance: AnswerFormatGuidance, id: string): string {
  return `
    <small class="answer-format-guidance math-answer-guidance visually-hidden" id="${escapeAttr(id)}">
      ${escapeHtml(guidance.instruction)}
    </small>
  `;
}

type MathAnswerInputAttribute = [string, string | number | boolean | undefined];

interface MathAnswerInputOptions {
  id: string;
  labelHtml: string;
  guidance: AnswerFormatGuidance;
  name?: string;
  classes?: string[];
  required?: boolean;
  ariaLabel?: string;
  afterInputHtml?: string;
  attributes?: MathAnswerInputAttribute[];
}

function renderInputAttributes(attributes: MathAnswerInputAttribute[]): string {
  return attributes
    .flatMap(([name, value]) => {
      if (value === undefined || value === false) return [];
      if (value === true) return [` ${name}`];
      return [` ${name}="${escapeAttr(value)}"`];
    })
    .join('');
}

function renderMathAnswerInput(options: MathAnswerInputOptions): string {
  const inputId = mathAnswerId(options.id);
  const guidanceId = `${inputId}-guidance`;
  const classes = ['single-answer-field', 'math-answer-input', ...(options.classes ?? [])].join(' ');
  const attributes: MathAnswerInputAttribute[] = [
    ['id', inputId],
    ['name', options.name],
    ['type', 'text'],
    ['autocomplete', 'off'],
    ['inputmode', options.guidance.inputMode],
    ['spellcheck', 'false'],
    ['autocapitalize', 'off'],
    ['autocorrect', 'off'],
    ['aria-describedby', guidanceId],
    ['aria-label', options.ariaLabel],
    ['placeholder', options.guidance.placeholder],
    ['required', options.required],
    ...(options.attributes ?? []),
  ];
  return `
    <label class="${escapeAttr(classes)}" data-answer-kind="${escapeAttr(options.guidance.kind)}" data-answer-symbols="${escapeAttr(options.guidance.symbols.join(','))}">
      <span class="math-answer-label">${options.labelHtml}</span>
      ${renderMathAnswerGuidance(options.guidance, guidanceId)}
      <input class="math-answer-raw" data-math-answer-raw${renderInputAttributes(attributes)} />
      <span class="math-editor-mount" data-math-editor-mount></span>
      ${options.afterInputHtml ?? ''}
    </label>
  `;
}

function itemAnswerFormatGuidance(item: SkillCheckItem, acceptedAnswers?: string[]): AnswerFormatGuidance {
  return answerFormatGuidance({
    answerType: item.answerType,
    inputType: item.inputType,
    acceptedAnswers: acceptedAnswers ?? item.acceptedAnswers,
    expectedAnswer: item.expectedAnswer,
    prompt: item.prompt,
    answerFormatHint: item.answerFormatHint,
    answerPlaceholder: item.answerPlaceholder,
  });
}

function fieldAnswerType(field: QuickCheckTwoValueField): string {
  const values = Array.isArray(field.expectedAnswer) ? field.expectedAnswer : [field.expectedAnswer];
  const sample = values[0] ?? '';
  return /^[$\\\s{}0-9./+−-]+$/.test(sample) ? 'numeric' : 'expression-text';
}

function fieldAnswerFormatGuidance(field: QuickCheckTwoValueField): AnswerFormatGuidance {
  return answerFormatGuidance({
    answerType: fieldAnswerType(field),
    acceptedAnswers: Array.isArray(field.expectedAnswer) ? field.expectedAnswer : [field.expectedAnswer],
    expectedAnswer: field.expectedAnswer,
    label: field.label,
    answerFormatHint: field.answerFormatHint,
    answerPlaceholder: field.answerPlaceholder,
  });
}

function renderSkillCheckAnswerInput(item: SkillCheckItem): string {
  if (item.inputType === 'numeric') {
    const guidance = itemAnswerFormatGuidance(item);
    return renderMathAnswerInput({
      id: `${item.itemId}-answer`,
      labelHtml: 'Answer',
      guidance,
      ariaLabel: `${item.itemId} answer`,
    });
  }

  if (item.inputType === 'two_value' && item.fields?.length) {
    return `
      <div class="field-list">
        ${item.fields.map((field) => {
          const guidance = fieldAnswerFormatGuidance(field);
          return renderMathAnswerInput({
            id: `${item.itemId}-${field.id}`,
            labelHtml: escapeHtml(field.label),
            guidance,
            ariaLabel: field.label,
          });
        }).join('')}
      </div>
    `;
  }

  return renderOptions(item.options ?? item.cards, item.itemId, item.inputType === 'checkbox');
}

function answerValueLabel(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function stripMathDelimiters(value: string): string {
  return value
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    .trim();
}

function expectedAnswerPlainText(item: SkillCheckItem): string {
  const contract = skillCheckContractForItem(item);
  if (contract.answerType === 'single_value') {
    return [
      item.displayPrefix,
      answerValueLabel(contract.expectedAnswer),
      item.displaySuffix,
    ].filter(Boolean).join(' ');
  }
  if (contract.answerType === 'two_value') {
    return (contract.fields ?? [])
      .map((field) => [
        `${field.label}:`,
        field.displayPrefix,
        answerValueLabel(field.expectedAnswer),
        field.displaySuffix,
      ].filter(Boolean).join(' '))
      .join('; ');
  }
  if (contract.answerType === 'ordered_cards') {
    const cardById = new Map((contract.orderedCards ?? []).map((card) => [card.id, stripMathDelimiters(card.label)]));
    return (contract.expectedOrder ?? []).map((id) => cardById.get(id) ?? id).join(' -> ');
  }
  const optionById = new Map((contract.options ?? []).map((option) => [option.id, stripMathDelimiters(option.label)]));
  return (contract.expectedChoices ?? []).map((id) => optionById.get(id) ?? id).join(', ');
}

function answerLabelMap(item: SkillCheckItem): Record<string, string> {
  const options = item.options ?? item.cards ?? [];
  return Object.fromEntries(options.map((option) => [option.id, stripMathDelimiters(option.label)]));
}

function renderExpectedAnswerSummary(item: SkillCheckItem): string {
  const contract = skillCheckContractForItem(item);
  if (contract.answerType === 'single_value') {
    return `${item.displayPrefix ? `${escapeHtml(item.displayPrefix)} ` : ''}${renderMathText(answerValueLabel(contract.expectedAnswer))}${item.displaySuffix ? ` ${escapeHtml(item.displaySuffix)}` : ''}`;
  }
  if (contract.answerType === 'two_value') {
    return `
      <ul class="plain-list">
        ${(contract.fields ?? []).map((field) => `
          <li>${escapeHtml(field.label)}: ${field.displayPrefix ? `${escapeHtml(field.displayPrefix)} ` : ''}${renderMathText(answerValueLabel(field.expectedAnswer))}${field.displaySuffix ? ` ${escapeHtml(field.displaySuffix)}` : ''}</li>
        `).join('')}
      </ul>
    `;
  }
  if (contract.answerType === 'ordered_cards') {
    const cardById = new Map((contract.orderedCards ?? []).map((card) => [card.id, card.label]));
    return `
      <ol class="worked-list">
        ${(contract.expectedOrder ?? []).map((id) => `<li>${renderMathText(cardById.get(id) ?? id)}</li>`).join('')}
      </ol>
    `;
  }
  const optionById = new Map((contract.options ?? []).map((option) => [option.id, option.label]));
  return `
    <ul class="plain-list">
      ${(contract.expectedChoices ?? []).map((id) => `<li>${renderMathText(optionById.get(id) ?? id)}</li>`).join('')}
    </ul>
  `;
}

function renderLearnAnswerInput(item: SkillCheckItem, acceptedAnswers?: string[]): string {
  const options = item.options ?? item.cards ?? [];
  if (options.length && (item.inputType === 'multiple_choice' || item.inputType === 'checkbox')) {
    const multiple = item.inputType === 'checkbox';
    return `
      <fieldset class="learn-option-bank">
        <legend>${escapeHtml(multiple ? 'Choose all matching answers.' : 'Choose one answer.')}</legend>
        ${options.map((option, index) => `
          <label>
            <input
              type="${multiple ? 'checkbox' : 'radio'}"
              name="submittedAnswer"
              value="${escapeAttr(option.id)}"
              ${!multiple && index === 0 ? 'required' : ''}
            />
            <span>${renderMathText(option.label)}</span>
          </label>
        `).join('')}
      </fieldset>
    `;
  }
  if (item.inputType === 'two_value' && item.fields?.length) {
    return `
      <div class="field-list">
        ${item.fields.map((field) => {
          const guidance = fieldAnswerFormatGuidance(field);
          return renderMathAnswerInput({
            id: `${item.itemId}-${field.id}`,
            labelHtml: escapeHtml(field.label),
            guidance,
            name: 'submittedAnswer',
            required: true,
            ariaLabel: field.label,
          });
        }).join('')}
      </div>
    `;
  }
  const guidance = itemAnswerFormatGuidance(item, acceptedAnswers);
  return renderMathAnswerInput({
    id: `${item.itemId}-answer`,
    labelHtml: escapeHtml(item.inputType === 'ordered_cards' ? 'Type the order or resulting expression.' : 'Answer'),
    guidance,
    name: 'submittedAnswer',
    required: true,
  });
}

function renderLearnCheckForm(
  item: SkillCheckItem | undefined,
  step: LearnStep,
  pagePath: string,
  variant: 'primary' | 'similar',
): string {
  if (!item) return '<p class="empty-state">This Learn step needs a deterministic check before it can be completed.</p>';
  const spec = skillCheckAnswerSpecForItem(item);
  if (!spec) return '<p class="empty-state">This Learn step is review only until a deterministic answer is authored.</p>';
  const acceptedAnswers = (item.options?.length && item.expectedOptionIds?.length)
    ? item.expectedOptionIds
    : spec.acceptedAnswers;
  const isPrimary = variant === 'primary';
  const explanationText = isPrimary ? step.explanation : item.workedRoute.join(' ');
  const similarTargetId = `${step.id}-similar`;
  return `
    <form
      class="skill-check-form learn-check-form"
      data-check-learn-answer
      data-course="p3"
      data-region-id="${escapeAttr(item.regionId)}"
      data-topic="${escapeAttr(step.title)}"
      data-step-id="${escapeAttr(step.id)}"
      data-step-title="${escapeAttr(step.title)}"
      data-field-guide-topic-id="${escapeAttr(step.fieldGuideTopic.id)}"
      data-skill-id="${escapeAttr(item.skillId)}"
      data-check-id="${escapeAttr(item.itemId)}"
      data-question-title="${escapeAttr(item.prompt)}"
      data-learn-variant="${escapeAttr(variant)}"
      data-learn-saves-skill-pass="false"
      data-answer-type="${escapeAttr(spec.answerType)}"
      data-accepted-answers="${escapeAttr(JSON.stringify(acceptedAnswers))}"
      data-answer-labels="${escapeAttr(JSON.stringify(answerLabelMap(item)))}"
      data-correct-answer-label="${escapeAttr(expectedAnswerPlainText(item))}"
      data-explanation="${escapeAttr(item.workedRoute.map(stripMathDelimiters).join(' '))}"
      data-tolerance="${escapeAttr(spec.tolerance)}"
      data-order-matters="${spec.orderMatters === true ? 'true' : 'false'}"
      data-mistake-tags="${escapeAttr(JSON.stringify(item.mistakeTags ?? []))}"
    >
      ${renderLearnAnswerInput(item, acceptedAnswers)}
      <div class="skill-check-actions learn-check-actions">
        <button class="button primary-button" type="submit">Check Answer</button>
        <button class="button secondary-button" type="button" data-show-learn-hint>Hint</button>
        ${isPrimary ? '<button class="button primary-button learn-retry-cta" type="button" data-retry-learn-primary hidden>Try this question again</button>' : ''}
        ${isPrimary && step.similarCheck ? `<button class="button primary-button learn-similar-cta" type="button" data-try-learn-similar="${escapeAttr(similarTargetId)}" hidden>Try a similar question</button>` : ''}
      </div>
      <div class="skill-check-feedback" role="status" aria-live="polite"></div>
      <div class="skill-check-hint-panel" data-learn-hint hidden>
        <p>${renderMathText(item.hints.nudge)}</p>
        ${item.hints.methodCue ? `<p>${renderMathText(item.hints.methodCue)}</p>` : ''}
      </div>
      <div class="learn-after-attempt" data-learn-after-attempt hidden>
        <p><strong>${isPrimary ? 'Explanation' : 'Similar route'}:</strong> ${renderMathText(explanationText)}</p>
        ${isPrimary && step.principle ? `<p><strong>${renderMathText(step.principle.replace(/^Principle:\s*/i, 'Principle: '))}</strong></p>` : ''}
        ${isPrimary && step.similarCheck ? '<p class="question-instruction">Now try the similar support question below. A clean Checked Practice pass is the strongest local evidence.</p>' : ''}
        ${!isPrimary ? '<p class="question-instruction">This is Learn support. It records lesson progress only; use Checked Practice for clean pass evidence.</p>' : ''}
      </div>
      <details class="skill-check-answer-details" data-learn-answer-reveal hidden>
        <summary>Reveal Answer</summary>
        <div>${renderExpectedAnswerSummary(item)}</div>
        <ol>${item.workedRoute.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>
        <p class="question-instruction">Hints and revealed answers help you learn, but they do not count as a clean pass.</p>
      </details>
    </form>
  `;
}

function renderContextualLearnVisuals(step: LearnStep, fieldGuideTopics: FieldGuideTopic[], pagePath: string): string {
  const visualTopicIds = step.visualTopicIds ?? [];
  if (!visualTopicIds.length) return '';
  const topicById = new Map(fieldGuideTopics.map((topic) => [topic.id, topic]));
  const visualTopics = visualTopicIds.map((topicId) => topicById.get(topicId)).filter((topic): topic is FieldGuideTopic => Boolean(topic));
  if (!visualTopics.length) return '';

  return `
    <section class="learn-step-visuals" aria-label="${escapeAttr(step.title)} diagram">
      <p class="eyebrow">Diagram</p>
      ${visualTopics.map((topic) => renderFieldGuideVisuals(topic, pagePath)).join('')}
    </section>
  `;
}

function renderLearnStepCard(step: LearnStep, index: number, total: number, pagePath: string, fieldGuideTopics: FieldGuideTopic[]): string {
  return `
    <article class="learn-step-card" data-learn-step-card data-learn-step-id="${escapeAttr(step.id)}" data-field-guide-topic="${escapeAttr(step.fieldGuideTopic.id)}" data-learn-requires-similar="${step.similarCheck ? 'true' : 'false'}" data-region-id="${escapeAttr(step.primaryCheck?.regionId ?? '')}">
      <header class="topic-section-header">
        <div>
          <p class="eyebrow">Step ${index + 1} of ${total}</p>
          <h2>${escapeHtml(step.title)}</h2>
          <p class="prompt">${renderMathText(step.stem)}</p>
          ${renderContextualLearnVisuals(step, fieldGuideTopics, pagePath)}
          <p class="question-instruction">${renderMathText(step.prompt)}</p>
        </div>
        <span class="learn-step-state" data-learn-step-state>Not completed</span>
      </header>
      ${renderLearnCheckForm(step.primaryCheck, step, pagePath, 'primary')}
      ${step.similarCheck ? `
        <section class="learn-similar-panel" id="${escapeAttr(`${step.id}-similar`)}" data-learn-similar-panel hidden>
          <p class="eyebrow">${escapeHtml(step.nextStepLabel ?? 'Similar checked question')}</p>
          <h3>${renderMathText(step.similarCheck.prompt)}</h3>
          ${renderLearnCheckForm(step.similarCheck, step, pagePath, 'similar')}
        </section>
      ` : ''}
      <section class="learn-exam-transfer" data-learn-exam-transfer hidden>
        <p class="eyebrow">Exam transfer</p>
        <p>${renderMathText(step.examTransfer)}</p>
      </section>
      <footer class="learn-step-footer" data-learn-step-footer hidden>
        <span>Step ${index + 1} of ${total} complete</span>
        <button class="button primary-button" type="button" data-learn-inline-next>
          ${index === total - 1 ? 'Continue' : 'Continue'}
        </button>
      </footer>
    </article>
  `;
}

function renderLearnPage(
  context: TopicContext,
  pagePath = learnPagePath(context.topic),
): string {
  const { topic, region, learnSteps } = context;
  const index = topicIndex(topic);
  const previousTopic = previousStudyTopic(topic);
  const finalPath = skillCheckPagePath(topic);
  const finalLabel = `${topic.name} Checked Practice`;
  const finalHref = hrefToPage(pagePath, finalPath);
  const requiredSkillCheckIds = checkableSkillCheckIdsForRegion(region.id);
  const body = `
    <section class="learn-mode-hero">
      <div>
        <p class="eyebrow">Unit ${index + 1} Learn</p>
        <h1>${escapeHtml(`${topic.name} — Learn`)}</h1>
        <p>Use Learn when you want support. Each step asks you to try first, then unlocks help, explanation, a similar question, and exam transfer.</p>
        <p>Hints and revealed answers help you learn, but they do not count as a clean pass. Go directly to Checked Practice when you want pass evidence.</p>
      </div>
      <div class="learn-mode-hero-actions">
        ${previousTopic ? routeLink(pagePath, learnPagePath(previousTopic), `Back: Unit ${index}`, 'button secondary-button') : routeLink(pagePath, p3CoursePagePath(), 'Back to P3', 'button secondary-button')}
        <a class="button primary-button" href="#learn-flow">Start</a>
      </div>
    </section>
    <details class="jump-details">
      <summary>Show steps and saved progress</summary>
      <nav class="subnav" aria-label="${escapeAttr(topic.name)} Learn steps">
        ${learnSteps.map((step) => `<a href="#${escapeAttr(step.id)}">${escapeHtml(step.title)}</a>`).join('')}
      </nav>
      <div class="progress-detail-row">
        ${progressList(region.id, Math.max(1, learnSteps.length), requiredSkillCheckIds)}
      </div>
    </details>
    <section class="learn-flow" id="learn-flow" data-learn-flow data-flow-final-href="${escapeAttr(finalHref)}" data-flow-final-label="${escapeAttr(finalLabel)}">
      ${learnSteps.length ? learnSteps.map((step, stepIndex) => renderLearnStepCard(step, stepIndex, learnSteps.length, pagePath, context.fieldGuideTopics)).join('') : '<p class="empty-state">No Learn steps are available for this topic yet.</p>'}
    </section>
    <section class="next-step-card">
      <h2>After this lesson</h2>
      <p>Learn is optional. When you are ready for checked evidence, move to the separate Checked Practice page.</p>
      <p>A clean Checked Practice pass is the strongest local evidence.</p>
      ${routeLink(pagePath, skillCheckPagePath(topic), 'Checked Practice', 'button primary-button')}
      ${routeLink(pagePath, topicExamTrainingPagePath(topic), 'Exam Training', 'button secondary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} — Learn`,
    description: `Integrated P3 Learn path for ${topic.name}.`,
    active: 'p3-topics',
    body,
    bodyClass: 'learn-mode-page',
  });
}

function renderMergedModeNoticePage(
  context: TopicContext,
  oldMode: 'Field Guide' | 'Skill Check',
  pagePath: string,
): string {
  const { topic } = context;
  const isFieldGuideRoute = oldMode === 'Field Guide';
  const title = isFieldGuideRoute
    ? `${topic.name} — Learn`
    : `${topic.name} — Checked Practice`;
  const bodyCopy = isFieldGuideRoute
    ? 'The old Field Guide has been replaced by a step-by-step Learn path. Start there, then complete Checked Practice and Exam Training.'
    : 'Checked Practice now has its own page. Use Learn only when you want optional support before attempting checked questions.';
  const primaryLabel = isFieldGuideRoute ? 'Learn' : 'Continue';
  const body = `
    ${renderHero(
      title,
      bodyCopy,
      topic.headerFormula,
      `${routeLink(pagePath, learnPagePath(topic), primaryLabel, 'button primary-button')}
      ${routeLink(pagePath, p3TopicsIndexPagePath(), 'Back to Topic', 'button secondary-button')}`,
    )}
    <section class="next-step-card">
      <h2>${escapeHtml(topic.name)} path</h2>
      <p>Learn is optional support. Checked Practice is separate and can be started directly.</p>
    </section>
  `;
  return renderPage({
    pagePath,
    title,
    description: `${isFieldGuideRoute ? 'Learn' : 'Checked Practice'} bridge for ${topic.name}.`,
    active: 'p3-topics',
    body,
  });
}

function renderWorksheetResponseArea(item: SkillCheckItem): string {
  if (item.inputType === 'multiple_choice' || item.inputType === 'checkbox' || item.inputType === 'ordered_cards') {
    const options = item.options ?? item.cards ?? [];
    if (options.length) {
      return `
        <ul class="worksheet-option-list">
          ${options.map((option) => `<li><span class="worksheet-checkbox"></span>${renderMathText(option.label)}</li>`).join('')}
        </ul>
      `;
    }
  }
  if (item.inputType === 'two_value' && item.fields?.length) {
    return `
      <div class="worksheet-field-list">
        ${item.fields.map((field) => `<p>${escapeHtml(field.label)}: <span class="worksheet-answer-line"></span></p>`).join('')}
      </div>
    `;
  }
  return '<p>Answer: <span class="worksheet-answer-line"></span></p>';
}

function renderWorksheetItem(item: SkillCheckItem, index: number): string {
  return `
    <article class="worksheet-question">
      <header>
        <p class="eyebrow">Question ${index + 1}</p>
        <h3>${renderMathText(item.prompt)}</h3>
      </header>
      ${renderWorksheetResponseArea(item)}
      <div class="worksheet-working-space" aria-label="Working space"></div>
    </article>
  `;
}

function renderWorksheetGroup(group: SkillChecklistTopicGroup, groupIndex: number, questionStartIndex: number): string {
  return `
    <section class="worksheet-question-group" id="worksheet-group-${escapeAttr(group.topic.id)}" data-worksheet-group>
      <header class="worksheet-group-header">
        <p class="eyebrow">Group ${groupIndex + 1}</p>
        <h2>${escapeHtml(group.topic.title)}</h2>
        <p>${escapeHtml(group.topic.purpose)}</p>
      </header>
      <div class="worksheet-question-list">
        ${group.authoredItems.length ? group.authoredItems.map((item, itemIndex) => renderWorksheetItem(item, questionStartIndex + itemIndex)).join('') : '<p class="empty-state">No printable Checked Practice items are available for this group yet.</p>'}
      </div>
    </section>
  `;
}

function renderCheckableSkillCheckForm(
  item: SkillCheckItem,
  group: SkillChecklistTopicGroup,
  pagePath: string,
  fieldGuidePath: string,
): string {
  const spec = skillCheckAnswerSpecForItem(item);
  if (!spec) return '';
  const acceptedAnswers = (item.options?.length && item.expectedOptionIds?.length)
    ? item.expectedOptionIds
    : spec.acceptedAnswers;
  const mistakeTags = Array.from(new Set([
    ...(item.mistakeTags ?? []),
    ...SKILL_CHECK_MISTAKE_TAGS,
  ]));
  return `
    <form class="skill-check-form" data-check-skill-answer data-course="p3" data-region-id="${escapeAttr(item.regionId)}" data-topic="${escapeAttr(group.topic.title)}" data-skill-id="${escapeAttr(item.skillId)}" data-check-id="${escapeAttr(item.itemId)}" data-question-title="${escapeAttr(item.prompt)}" data-answer-type="${escapeAttr(spec.answerType)}" data-accepted-answers="${escapeAttr(JSON.stringify(acceptedAnswers))}" data-answer-labels="${escapeAttr(JSON.stringify(answerLabelMap(item)))}" data-correct-answer-label="${escapeAttr(expectedAnswerPlainText(item))}" data-explanation="${escapeAttr(item.workedRoute.map(stripMathDelimiters).join(' '))}" data-tolerance="${escapeAttr(spec.tolerance)}" data-order-matters="${spec.orderMatters === true ? 'true' : 'false'}" data-mistake-tags="${escapeAttr(JSON.stringify(item.mistakeTags ?? []))}">
      ${renderLearnAnswerInput(item, acceptedAnswers)}
      <div class="skill-check-actions">
        <button class="button primary-button" type="submit">Check Answer</button>
        <button class="button secondary-button" type="button" data-show-skill-hint>Hint</button>
        <button class="button primary-button" type="button" data-skill-check-inline-next hidden>Next Question</button>
      </div>
      <div class="skill-check-feedback" role="status" aria-live="polite"></div>
      <fieldset class="mistake-tag-selector" data-mistake-tag-panel hidden>
        <legend>What went wrong?</legend>
        <div class="mistake-tag-options">
          ${mistakeTags.map((tag) => `
            <label>
              <input type="checkbox" name="mistakeTags" value="${escapeAttr(tag)}" />
              <span>${escapeHtml(tag)}</span>
            </label>
          `).join('')}
        </div>
        <p class="targeted-prompt" data-targeted-prompt></p>
      </fieldset>
      <div class="skill-check-hint-panel" data-skill-hint hidden>
        <p>${renderMathText(item.hints.nudge)}</p>
        ${item.hints.methodCue ? `<p>${renderMathText(item.hints.methodCue)}</p>` : ''}
      </div>
      <details class="skill-check-repair-details" data-skill-repair hidden>
        <summary>Show repair step</summary>
        <p>${renderMathText(item.repairStep ?? item.hints.firstStep ?? item.hints.nudge)}</p>
        <p class="question-instruction">Hints and repair help you learn, but they do not count as a clean pass.</p>
      </details>
      <details class="skill-check-answer-details" data-skill-answer-reveal hidden>
        <summary>Reveal Answer</summary>
        <div>${renderExpectedAnswerSummary(item)}</div>
        <ol>${item.workedRoute.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>
        <p class="question-instruction">Hints and revealed answers help you learn, but they do not count as a clean pass.</p>
      </details>
      ${routeLink(pagePath, fieldGuidePath, 'Learn support', 'button secondary-button')}
    </form>
  `;
}

function renderAuthoredPractice(group: SkillChecklistTopicGroup, pagePath: string, fieldGuidePath: string): string {
  if (!group.authoredItems.length) return '';
  return `
    <section class="practice-subsection">
      <h3>Focused checks</h3>
      <div class="practice-card-stack">
        ${group.authoredItems.map((item) => `
          <article class="practice-card">
            <p class="eyebrow">Skill Check</p>
            <h4>${renderMathText(item.prompt)}</h4>
            ${item.checkable === true ? renderCheckableSkillCheckForm(item, group, pagePath, fieldGuidePath) : `
              ${renderOptions(item.options ?? item.cards, item.itemId, item.inputType === 'checkbox')}
              ${item.fields?.length ? `
              <div class="field-list">
                ${item.fields.map((field) => `
                  <label>${escapeHtml(field.label)} <input type="text" aria-label="${escapeAttr(field.label)}" /></label>
                `).join('')}
              </div>
              ` : ''}
              <details>
                <summary>Hint</summary>
                <p>${renderMathText(item.hints.nudge)}</p>
                ${item.hints.methodCue ? `<p>${renderMathText(item.hints.methodCue)}</p>` : ''}
                <ol>${item.workedRoute.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>
              </details>
              <p class="empty-state">This check is not machine-checkable yet. Use it for practice, not clean pass credit.</p>
            `}
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderQuickChecks(group: SkillChecklistTopicGroup): string {
  if (!group.quickCheckSnippets.length) return '';
  return `
    <section class="practice-subsection">
      <h3>Quick checks</h3>
      <div class="practice-card-stack">
        ${group.quickCheckSnippets.map((snippet) => {
          const check = snippet.quickCheck;
          if (!check) return '';
          return `
            <article class="practice-card">
              <p class="eyebrow">Quick check</p>
              <h4>${renderMathText(check.title ?? snippet.title)}</h4>
              <p class="prompt">${renderMathText(check.prompt)}</p>
              <details>
                <summary>Reveal Answer</summary>
                <p><strong>Answer:</strong> ${renderMathText(check.answer)}</p>
                <p>${renderMathText(check.explanation)}</p>
              </details>
              <p class="empty-state">Review only. This does not count as a clean Checked Practice pass.</p>
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderGeneratedPracticeItem(item: GeneratedPracticeItem): string {
  return `
    <article class="practice-card">
      <p class="eyebrow">Guided practice</p>
      <h4>${renderMathText(item.prompt)}</h4>
      ${item.keyMethod ? `<p><strong>Key method:</strong> ${renderMathText(item.keyMethod)}</p>` : ''}
      <details>
        <summary>Reveal Answer</summary>
        <p><strong>Answer:</strong> ${renderMathText(item.answer)}</p>
        <ol>${item.workedSolution.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>
      </details>
      <p class="empty-state">Guided practice is review only. It does not create clean Checked Practice pass credit.</p>
    </article>
  `;
}

function renderGeneratedPractice(group: SkillChecklistTopicGroup): string {
  if (!group.guidedPracticeItems.length) return '';
  return `
    <section class="practice-subsection">
      <h3>Guided practice</h3>
      <div class="practice-card-stack">
        ${group.guidedPracticeItems.slice(0, 3).map(renderGeneratedPracticeItem).join('')}
      </div>
    </section>
  `;
}

function renderSkillPracticeGroup(group: SkillChecklistTopicGroup, pagePath: string, fieldGuidePath: string): string {
  const totalItems = totalSkillChecklistItems(group);
  const defaultItems = Math.min(3, totalItems);
  return `
    <article class="practice-topic" id="practice-${escapeAttr(group.topic.id)}" data-skill-check-group data-skill-check-group-id="${escapeAttr(group.topic.id)}">
      <header class="topic-section-header">
        <div>
          <p class="eyebrow">Subtopic check · ${defaultItems || totalItems} item${(defaultItems || totalItems) === 1 ? '' : 's'}</p>
          <h2>${escapeHtml(group.topic.title)}</h2>
          <p>${escapeHtml(group.topic.purpose)}</p>
          <p class="practice-instruction">Pass the visible machine-checkable item to continue. A clean Checked Practice pass is the strongest local evidence. Hints and revealed answers help you learn, but they do not count as a clean pass.</p>
        </div>
      </header>
      ${renderAuthoredPractice(group, pagePath, fieldGuidePath)}
      ${renderQuickChecks(group)}
      ${renderGeneratedPractice(group)}
      ${totalItems === 0 ? '<p class="empty-state">Focused practice for this section is still being prepared.</p>' : ''}
    </article>
  `;
}

function questionTitle(question: NormalizedQuestion): string {
  const paper = question.paper ? `Paper ${question.paper}` : 'Paper 3';
  const number = question.questionNumber ? `Q${question.questionNumber}` : question.id;
  return `${paper} ${number}`;
}

function marksAvailable(question: NormalizedQuestion): number {
  if (typeof question.marksAvailable === 'number' && question.marksAvailable > 0) return question.marksAvailable;
  const parts = question.parts?.reduce((sum, part) => sum + part.marksAvailable, 0) ?? 0;
  return parts > 0 ? parts : 10;
}

interface ExamSelfMarkPart {
  partId?: string;
  subpartId?: string;
  label: string;
  marksAvailable: number;
  markPoints?: QuestionMarkPoint[];
  primaryTopicId?: string;
  skillRef?: string;
  mappedRegionId?: string;
}

function examSelfMarkParts(question: NormalizedQuestion, totalMarks = marksAvailable(question)): ExamSelfMarkPart[] {
  const cleanParts = (question.parts ?? [])
    .filter((part): part is QuestionPartMark => typeof part.marksAvailable === 'number' && part.marksAvailable > 0)
    .map((part) => ({
      partId: part.partId,
      subpartId: part.subpartId,
      label: part.label,
      marksAvailable: part.marksAvailable,
      markPoints: part.markPoints,
      primaryTopicId: part.primaryTopicId,
      skillRef: part.skillRef,
      mappedRegionId: part.mappedRegionId,
    }));
  if (cleanParts.length) return cleanParts;
  return [{
    label: 'Whole question',
    marksAvailable: totalMarks,
  }];
}

function renderMarkPointControls(part: ExamSelfMarkPart, partIndex: number): string {
  const markPoints = part.markPoints ?? [];
  if (!markPoints.length) {
    return '<p class="self-marking-guidance-note">Self-marking guidance is the mark-scheme image for this part.</p>';
  }
  return `
    <fieldset class="mark-point-list">
      <legend>Tick mark points you can justify from the mark scheme image</legend>
      ${renderSelfGradeSuggestions(markPoints)}
      ${markPoints.map((point) => `
        <label>
          <input type="checkbox" data-mark-point data-part-index="${partIndex}" value="${escapeRawAttr(point.id)}" />
          <span>${point.markCode ? `<strong>${escapeRawHtml(point.markCode)}</strong> ` : ''}${escapeRawHtml(point.label)}</span>
        </label>
      `).join('')}
    </fieldset>
  `;
}

function normalizedMarkCode(point: QuestionMarkPoint): string {
  return (point.markCode ?? '').replace(/^\*/, '').trim().toUpperCase();
}

function selfGradeSuggestionItems(markPoints: QuestionMarkPoint[]): string[] {
  const codes = markPoints.map(normalizedMarkCode).filter(Boolean);
  const hasMethod = codes.some((code) => /^D?M\d/.test(code) || /^M\d/.test(code));
  const hasDependentMethod = codes.some((code) => /^DM\d/.test(code));
  const hasAccuracy = codes.some((code) => /^A\d/.test(code));
  const hasIndependent = codes.some((code) => /^B\d/.test(code) || /^SCB\d/.test(code));
  const hasFollowThrough = codes.some((code) => code.includes('FT'));
  const items = ['Only tick a mark point when your written work shows that exact evidence.'];

  if (hasIndependent) {
    items.push('B marks: tick for an independent result, statement, diagram feature, or observation that is actually present.');
  }
  if (hasMethod) {
    items.push('M marks: tick for a valid method step even if a later arithmetic or simplification error changes the final answer.');
  }
  if (hasDependentMethod) {
    items.push('DM marks: tick only when the earlier required method is also shown.');
  }
  if (hasAccuracy) {
    items.push('A marks: tick for an accurate result supported by the required working, not for an unsupported guess.');
  }
  if (hasFollowThrough) {
    items.push('FT marks: follow through from your earlier value where the scheme allows it, but still check the mark-scheme image.');
  }

  items.push('Your self-awarded marks should normally match the number of justified ticks; if unsure, be conservative.');
  return items;
}

function renderSelfGradeSuggestions(markPoints: QuestionMarkPoint[]): string {
  const items = selfGradeSuggestionItems(markPoints);
  return `
      <div class="self-grade-suggestions" data-self-grade-suggestions>
        <strong>Self-grade suggestions</strong>
        <ul>
          ${items.map((item) => `<li>${escapeRawHtml(item)}</li>`).join('')}
        </ul>
      </div>
  `;
}

function renderExamPartControls(part: ExamSelfMarkPart, partIndex: number): string {
  const markPointCount = part.markPoints?.length ?? 0;
  return `
    <fieldset class="exam-part-card" data-exam-part data-part-index="${partIndex}" data-part-label="${escapeRawAttr(part.label)}" data-part-id="${escapeRawAttr(part.partId)}" data-subpart-id="${escapeRawAttr(part.subpartId)}" data-primary-topic-id="${escapeRawAttr(part.primaryTopicId)}" data-skill-ref="${escapeRawAttr(part.skillRef)}" data-mapped-region-id="${escapeRawAttr(part.mappedRegionId)}" data-marks-available="${part.marksAvailable}" data-mark-points-available="${markPointCount}">
      <legend>${escapeRawHtml(part.label)} · ${part.marksAvailable} mark${part.marksAvailable === 1 ? '' : 's'}</legend>
      <label class="inline-check">
        <input type="checkbox" data-part-attempted />
        <span>Attempted this part</span>
      </label>
      <label>
        Self-awarded marks
        <input data-part-marks-earned type="number" min="0" max="${part.marksAvailable}" step="1" value="0" inputmode="numeric" />
      </label>
      ${markPointCount ? renderMarkPointControls(part, partIndex) : ''}
      ${!markPointCount ? renderMarkPointControls(part, partIndex) : '<p class="self-marking-guidance-note">These ticks are support only. The mark-scheme image is the source of truth.</p>'}
    </fieldset>
  `;
}

function displayTopicForQuestion(question: NormalizedQuestion): string {
  const regionId = question.routeEvidence?.validatedRegionId ?? question.routeEvidence?.displayRegionId;
  const topic = STUDY_TOPICS.find((candidate) => candidate.regionId === regionId);
  return topic?.name ?? cleanVisibleCopy(question.displayTopic);
}

interface ExamQuestionCardOptions {
  displayTopic?: string;
  displaySubtopic?: string;
  allowAttemptSave?: boolean;
  reviewNote?: string;
  reviewLinkPath?: string;
  validatedRegionId?: string;
  displayRegionId?: string;
}

function renderExamQuestionCard(question: NormalizedQuestion, pagePath: string, options: ExamQuestionCardOptions = {}): string {
  const questionImage = firstExistingAssetCandidate(question.questionImageCandidates, question.questionImageUrls);
  const markSchemeImage = firstExistingAssetCandidate(question.markSchemeImageCandidates, question.markSchemeImageUrls);
  if (!questionImage || !markSchemeImage) return '';
  const totalMarks = marksAvailable(question);
  const selfMarkParts = examSelfMarkParts(question, totalMarks);
  const hasTickableMarkPoints = selfMarkParts.some((part) => (part.markPoints?.length ?? 0) > 0);
  const usesCoarseSelfMarking = !hasTickableMarkPoints;
  const displayTopic = options.displayTopic ?? displayTopicForQuestion(question);
  const displaySubtopic = options.displaySubtopic ?? question.displaySubtopic;
  const allowAttemptSave = options.allowAttemptSave ?? true;
  const supportPrompt = examQuestionSupportPrompt(question.id);
  return `
    <article class="exam-question-card" id="question-${escapeAttr(question.id)}" data-coarse-self-marking="${usesCoarseSelfMarking ? 'true' : 'false'}">
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(questionTitle(question))}</p>
          <h3>${escapeHtml(displayTopic)}</h3>
          ${displaySubtopic ? `<p>${escapeHtml(displaySubtopic)}</p>` : ''}
          <p class="question-instruction">Exam Training is self-marked practice. It helps you prepare, but it does not replace Checked Practice evidence unless your teacher says so.</p>
          ${options.reviewNote ? `<p class="question-instruction">${escapeHtml(options.reviewNote)}</p>` : ''}
        </div>
        <span class="marks-pill">${totalMarks} mark${totalMarks === 1 ? '' : 's'}</span>
      </header>
      <figure class="question-figure">
        <img loading="lazy" src="${hrefToPublicAsset(pagePath, questionImage)}" alt="${escapeAttr(`${questionTitle(question)} question image`)}" />
      </figure>
      ${supportPrompt ? `<details class="exam-hint-details">
        <summary>Hint</summary>
        <p>${escapeHtml(supportPrompt.firstStep)}</p>
      </details>` : ''}
      <label class="exam-commit-checkbox">
        <input type="checkbox" data-worked-before-reveal />
        <span>I attempted this on paper before revealing the mark scheme.</span>
      </label>
      <details class="mark-scheme-details" data-mark-scheme-reveal>
        <summary>Reveal Answer</summary>
        <figure class="question-figure">
          <img loading="lazy" src="${hrefToPublicAsset(pagePath, markSchemeImage)}" alt="${escapeAttr(`${questionTitle(question)} mark scheme image`)}" />
        </figure>
      </details>
      ${options.reviewLinkPath ? `<p class="question-review-link">${routeLink(pagePath, options.reviewLinkPath, 'Learn', 'text-link')}</p>` : ''}
      ${allowAttemptSave ? `<form class="attempt-form exam-self-mark-form" data-save-exam-attempt data-question-id="${escapeAttr(question.id)}" data-paper-family="${escapeAttr(question.paperFamily)}" data-paper="${escapeAttr(question.paper)}" data-question-number="${escapeAttr(question.questionNumber)}" data-topic="${escapeAttr(displayTopic)}" data-subtopic="${escapeAttr(displaySubtopic)}" data-marks-available="${totalMarks}" data-parts="${escapeRawAttr(JSON.stringify(selfMarkParts))}" data-coarse-self-marking="${usesCoarseSelfMarking ? 'true' : 'false'}" data-has-mark-points="${hasTickableMarkPoints ? 'true' : 'false'}" data-validated-region-id="${escapeAttr(options.validatedRegionId ?? question.routeEvidence?.validatedRegionId)}" data-display-region-id="${escapeAttr(options.displayRegionId ?? question.routeEvidence?.displayRegionId)}">
        <div class="exam-evidence-banner">
          <strong>Self-marked attempt</strong>
          <span>Exam Training is self-marked practice. It does not replace Checked Practice evidence unless your teacher says so.</span>
        </div>
        ${usesCoarseSelfMarking ? '<p class="coarse-marking-note">Coarse self-marking: this source record does not expose reviewed tickable mark points, so save honest self-awarded marks using the mark-scheme image.</p>' : ''}
        <div class="exam-part-list">
          ${selfMarkParts.map(renderExamPartControls).join('')}
        </div>
        <button class="button primary-button" type="submit">Save self-marked attempt</button>
        <p class="form-status" role="status"></p>
      </form>` : '<p class="empty-state">Use this question for practice. Save marks only if you want to track the attempt locally.</p>'}
    </article>
  `;
}

function p3FieldGuidePathForQuestion(question: NormalizedQuestion): string | undefined {
  const regionId = question.routeEvidence?.validatedRegionId ?? question.routeEvidence?.displayRegionId;
  const topic = STUDY_TOPICS.find((candidate) => candidate.regionId === regionId);
  return topic ? learnPagePath(topic) : undefined;
}

function renderPracticePage(
  context: TopicContext,
  pagePath = practicePagePath(context.topic),
  fieldGuidePath = fieldGuidePagePath(context.topic),
): string {
  const { topic, region, groups } = context;
  const firstPracticeId = groups[0]?.topic.id ? `practice-${groups[0].topic.id}` : 'exam-questions';
  const requiredSkillCheckIds = checkableSkillCheckIdsForRegion(region.id);
  const index = topicIndex(topic);
  const nextTopic = nextStudyTopic(topic);
  const finalPath = nextTopic ? fieldGuidePagePath(nextTopic) : p3ReviewPagePath();
  const finalLabel = nextTopic ? `Next unit: ${nextTopic.name}` : 'Export Progress';
  const finalHref = nextTopic ? hrefToPage(pagePath, finalPath) : p3ReviewExportHref(pagePath);
  const body = `
    ${renderHero(
      `Unit ${index + 1}: ${topic.name} Checked Practice`,
      'Pass each visible check before moving on. A clean Checked Practice pass is the strongest local evidence.',
      topic.headerFormula,
      `<a class="button primary-button" href="#${escapeAttr(firstPracticeId)}">Start</a>
      ${routeLink(pagePath, fieldGuidePath, 'Learn', 'button secondary-button')}`,
    )}
    <details class="jump-details">
      <summary>Show subtopics and saved progress</summary>
      <nav class="subnav" aria-label="${escapeAttr(topic.name)} Checked Practice sections">
        ${groups.map((group) => `<a href="#practice-${escapeAttr(group.topic.id)}">${escapeHtml(group.topic.title)}</a>`).join('')}
      </nav>
      <div class="progress-detail-row">
        ${progressList(region.id, Math.max(1, context.learnSteps.length), requiredSkillCheckIds)}
        ${routeLink(pagePath, fieldGuidePath, 'Learn', 'button secondary-button')}
      </div>
    </details>
    <section class="practice-stack" data-one-card-flow data-flow-label="Checked Practice" data-default-card-limit="3" data-flow-final-href="${escapeAttr(finalHref)}" data-flow-final-label="${escapeAttr(finalLabel)}">
      ${groups.map((group) => renderSkillPracticeGroup(group, pagePath, fieldGuidePath)).join('')}
    </section>
    <section class="attempt-history-section" data-attempt-history-list data-attempt-history-source="checked_practice" data-attempt-history-region="${escapeAttr(region.id)}" data-attempt-history-limit="40" aria-labelledby="attempt-history-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Review</p>
          <h2 id="attempt-history-title">Submitted response review</h2>
          <p data-attempt-history-summary>No submitted responses saved in this browser yet.</p>
        </div>
      </div>
      <p class="empty-state" data-attempt-history-empty>Submit a checked answer to review what you wrote, the expected answer, and what to retry.</p>
      <div class="attempt-history-list" data-attempt-history-items></div>
    </section>
    <section class="next-step-card">
      <h2>Finish the checks first</h2>
      <p>The guided controls move to ${escapeHtml(finalLabel)} after the final subtopic check. Use the Learn link when a check exposes a gap; hints and repair help you learn but do not count as a clean pass.</p>
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} Checked Practice`,
    description: `Static Checked Practice for ${topic.name}.`,
    active: 'p3-topics',
    body,
  });
}

function renderWorksheetPage(
  context: TopicContext,
  pagePath = worksheetPagePath(context.topic),
  skillCheckPath = practicePagePath(context.topic),
): string {
  const { topic, groups } = context;
  const items = groups.flatMap((group) => group.authoredItems);
  const printableGroups = groups.filter((group) => group.authoredItems.length > 0);
  let questionStartIndex = 0;
  const worksheetGroups = printableGroups.map((group, groupIndex) => {
    const rendered = renderWorksheetGroup(group, groupIndex, questionStartIndex);
    questionStartIndex += group.authoredItems.length;
    return rendered;
  }).join('');
  const body = `
    <section class="worksheet-hero">
      <p class="eyebrow">Printable worksheet</p>
      <h1>${escapeHtml(topic.name)} Checked Practice Worksheet</h1>
      <div class="worksheet-meta">
        <p>Student name: <span></span></p>
        <p>Date: <span></span></p>
      </div>
      <div class="worksheet-actions">
        <button class="button primary-button" type="button" onclick="window.print()">Print / Save PDF</button>
        ${routeLink(pagePath, skillCheckPath, 'Interactive Checked Practice', 'button secondary-button')}
      </div>
    </section>
    <section class="worksheet-instructions">
      <h2>Questions</h2>
      <p>Show working clearly. Move through one group at a time, then use the interactive Checked Practice page for deterministic checking after this worksheet.</p>
    </section>
    <section class="worksheet-flow" data-worksheet-flow data-flow-label="${escapeAttr(`${topic.shortName} worksheet group`)}">
      ${items.length ? worksheetGroups : '<p class="empty-state">No printable Checked Practice items are available for this topic yet.</p>'}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} Worksheet`,
    description: `Printable P3 Checked Practice worksheet for ${topic.name}.`,
    active: 'p3-topics',
    body,
    bodyClass: 'worksheet-page',
  });
}

function renderTopicExamTrainingPage(
  context: TopicContext,
  pagePath = topicExamTrainingPagePath(context.topic),
  topicsIndexPath = p3TopicsIndexPagePath(),
  practicePath = practicePagePath(context.topic),
): string {
  const { topic, questions } = context;
  const body = `
    ${renderHero(
      `${topic.name} — Exam Training`,
      'Exam Training is self-marked practice. It helps you prepare, but it does not replace Checked Practice evidence unless your teacher says so.',
      topic.headerFormula,
      `${questions.length ? '<a class="button primary-button" href="#topic-exam-questions">Start</a>' : ''}
      ${routeLink(pagePath, learnPagePath(topic), 'Learn', 'button secondary-button')}
      ${routeLink(pagePath, topicsIndexPath, 'Back to P3', 'button text-button')}`,
      'Module 2 of 2: Exam Training',
    )}
    <section class="exam-question-section" id="topic-exam-questions">
      <div class="section-heading">
        <div>
          <h2>Exam questions</h2>
          <p>Exam Training is self-marked practice. It helps you prepare, but it does not replace Checked Practice evidence unless your teacher says so.</p>
        </div>
      </div>
      <div class="exam-question-grid" data-exam-flow data-flow-label="${escapeAttr(topic.name)} exam question">
        ${questions.map((question) => renderExamQuestionCard(question, pagePath)).join('')}
      </div>
      ${questions.length === 0 ? '<p class="empty-state">No exam image is available for this topic yet.</p>' : ''}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} — Exam Training`,
    description: `Static Exam Training questions for ${topic.name}.`,
    active: 'p3-exam-training',
    body,
    bodyClass: 'exam-training-page',
  });
}

function renderExamTrainingTopicCard(fromPagePath: string, context: TopicContext, examTrainingPath = topicExamTrainingPagePath(context.topic)): string {
  const total = Math.max(1, context.learnSteps.length);
  return `
    <article class="exam-topic-row" data-region-card="${escapeAttr(context.region.id)}">
      <div>
        <h3>${escapeHtml(context.topic.name)}</h3>
        ${compactProgress(context.region.id, total)}
      </div>
      ${routeLink(fromPagePath, examTrainingPath, 'Open topic Exam Training', 'button secondary-button')}
    </article>
  `;
}

function renderExamTrainingPage(
  data: StaticSiteData,
  pagePath = p3ExamTrainingPagePath(),
  topicsIndexPath = p3TopicsIndexPagePath(),
  examTrainingPathForTopic = topicExamTrainingPagePath,
): string {
  const contexts = STUDY_TOPICS.map((topic) => topicContext(topic, data));
  const mixedQuestions = data.questions
    .filter(isTrainableP3Question)
    .filter((question) => Boolean(question.routeEvidence?.displayRegionId))
    .slice(0, 12);
  const body = `
    ${renderHero(
      'Exam Training',
      'Exam Training is self-marked practice. It helps you prepare, but it does not replace Checked Practice evidence unless your teacher says so.',
      '\\frac{dy}{dx}, \\quad \\int_a^b f(x)\\,dx, \\quad \\arg z',
      `<a class="button primary-button" href="#mixed-questions">Start mixed questions</a>
      ${routeLink(pagePath, topicsIndexPath, 'Back to topics', 'button secondary-button')}`,
    )}
    <section class="exam-question-section" id="mixed-questions">
      <div class="section-heading">
        <div>
          <h2>Mixed Paper 3 questions</h2>
          <p>Exam Training is self-marked practice. It helps you prepare, but it does not replace Checked Practice evidence unless your teacher says so.</p>
        </div>
      </div>
      <div class="exam-question-grid" data-exam-flow data-flow-label="Paper 3 exam question">
        ${mixedQuestions.map((question) => renderExamQuestionCard(question, pagePath, {
          reviewLinkPath: p3FieldGuidePathForQuestion(question),
        })).join('')}
      </div>
    </section>
    <section class="exam-callout compact-callout">
      <div>
        <p class="eyebrow">Local progress</p>
        <h2>Saved attempts</h2>
        <p>Use the totals as practice records, not a grade or checked-evidence decision.</p>
      </div>
      <div class="exam-stats">
        <span data-total-attempts data-paper-family="p3" data-paper-label="Paper 3">0 saved Paper 3 attempts</span>
        <span data-topic-tried-count data-paper-family="p3">0 topic areas tried</span>
      </div>
    </section>
    <details class="jump-details">
      <summary>How to choose questions</summary>
      <ul class="plain-list">
        <li>Use mixed questions after you have practised at least one topic.</li>
        <li>Return to topics with lower saved marks or repeated mistakes.</li>
        <li>Choose longer questions when recent topic work feels secure.</li>
      </ul>
    </details>
    <section class="exam-topic-panel" aria-label="Topic progress panel">
      <div class="section-heading">
        <div>
          <h2>Topic progress</h2>
          <p>Use this list to choose the next topic to practise.</p>
        </div>
      </div>
      <div class="exam-topic-list">
        ${contexts.map((context) => renderExamTrainingTopicCard(pagePath, context, examTrainingPathForTopic(context.topic))).join('')}
      </div>
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'Exam Training',
    description: 'Static Exam Training panel for Paper 3 practice.',
    active: 'p3-exam-training',
    body,
    bodyClass: 'exam-training-page',
  });
}

async function ensureParent(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function writeStaticPage(pagePath: string, html: string): Promise<void> {
  const destination = path.join(outputRoot, pagePath);
  await ensureParent(destination);
  await writeFile(destination, html.replace(/[ \t]+$/gm, ''), 'utf8');
}

function shouldSkipPublicAsset(relativePath: string): boolean {
  const posixPath = toPosix(relativePath);
  return publicAssetExclusions.some((pattern) => pattern.test(posixPath));
}

async function copyPublicDirectory(source: string, destination: string, relativeRoot = ''): Promise<void> {
  if (!existsSync(source)) return;
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source);
  for (const entry of entries) {
    if (entry === '.DS_Store') continue;
    const relativePath = relativeRoot ? path.join(relativeRoot, entry) : entry;
    if (shouldSkipPublicAsset(relativePath)) continue;
    const sourcePath = path.join(source, entry);
    const destinationPath = path.join(destination, entry);
    const info = await stat(sourcePath);
    if (info.isDirectory()) {
      await copyPublicDirectory(sourcePath, destinationPath, relativePath);
    } else {
      await cp(sourcePath, destinationPath);
    }
  }
}

async function copyStaticAssets(): Promise<void> {
  await copyPublicDirectory(publicRoot, outputRoot);
  await mkdir(path.join(outputRoot, 'assets'), { recursive: true });
  await cp(path.join(staticStudyRoot, 'static-study.css'), path.join(outputRoot, 'assets/static-study.css'));
  await cp(path.join(staticStudyRoot, 'static-study.js'), path.join(outputRoot, 'assets/static-study.js'));
  await cp(path.join(repoRoot, 'node_modules/katex/dist/katex.min.css'), path.join(outputRoot, 'assets/katex.min.css'));
  await cp(path.join(repoRoot, 'node_modules/katex/dist/fonts'), path.join(outputRoot, 'assets/fonts'), { recursive: true });
}

async function loadStaticSiteData(): Promise<StaticSiteData> {
  const baseQuestionBank = await readJson('public/assets/exam-bank-data/asterion_question_bank_v1.json');
  const catalogQuestionBank = await readJson('public/assets/exam-bank-data/asterion_exam_bank_catalog_v1.json');
  const baseTopicRouting = await readJson('public/assets/exam-bank-data/question_bank.topic_routing.v1.json');
  const { questionBank, topicRouting } = applyP3TopicPackRefreshOverlay(baseQuestionBank, baseTopicRouting);
  const generatedPracticeJson = await readJson('public/data/generated_practice_bank.json');
  const teachingSnippetsJson = await readJson('public/data/teaching_snippets.json');
  const p3SkillCoverageReport = await readJson('tools/content_lab/outputs/p3_skill_coverage_report.json');
  const { questions } = normalizeQuestionBankWithDiagnostics(questionBank, {}, topicRouting, {
    contentSourceKind: 'projected-bank',
  });
  const { questions: normalizedCatalogQuestions } = normalizeQuestionBankWithDiagnostics(catalogQuestionBank, {}, topicRouting, {
    contentSourceKind: 'raw-bank-fallback',
  });
  const catalogRecords = normalizedCatalogQuestions.filter(isQuestionTrainable);

  return {
    questions: questions.filter(isTrainableP3Question),
    catalogRecords,
    catalogQuestions: catalogRecords.filter(hasExistingQuestionImagePair),
    generatedPractice: reviewedGeneratedPractice(normalizeGeneratedPracticeData(generatedPracticeJson)),
    teachingSnippets: reviewedTeachingSnippets(normalizeTeachingSnippetsData(teachingSnippetsJson)),
    p3SkillCoverageReport,
  };
}

function validateNoVisibleGameTerms(htmlByPath: Map<string, string>): void {
  const failures: string[] = [];
  for (const [pagePath, html] of htmlByPath) {
    const visibleText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
    for (const term of visibleGameTerms) {
      const matcher = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (matcher.test(visibleText)) failures.push(`${pagePath}: ${term}`);
    }
  }
  if (failures.length) {
    throw new Error(`Static pages contain retired visible game terms:\n${failures.join('\n')}`);
  }
}

async function generate(): Promise<void> {
  const lessonErrors = validateProblemFirstFieldGuideLessons();
  if (lessonErrors.length) {
    throw new Error(`P3 Field Guide problem-first lesson QA failed:\n${lessonErrors.join('\n')}`);
  }
  const learnErrors = validateLearnSteps(STUDY_TOPICS.map((topic) => topic.regionId));
  if (learnErrors.length) {
    throw new Error(`P3 Learn Mode lesson QA failed:\n${learnErrors.join('\n')}`);
  }

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await copyStaticAssets();

  const data = await loadStaticSiteData();
  const htmlByPath = new Map<string, string>();

  htmlByPath.set('index.html', renderCourseSelectorPage());
  htmlByPath.set(aboutPagePath(), renderAboutPage());

  for (const course of COURSES) {
    htmlByPath.set(
      coursePagePath(course),
      course.id === P3_COURSE_ID ? renderP3DashboardPage(data, course) : renderCourseDashboardPage(course),
    );
  }

  htmlByPath.set(p3TopicsIndexPagePath(), renderP3TopicsIndexPage(data));
  htmlByPath.set(p3DiagnosticPagePath(), renderP3DiagnosticPage());
  htmlByPath.set(p1RepairLanePagePath(), renderP1RepairLanePage());
  htmlByPath.set(p3ExamTrainingPagePath(), renderExamTrainingPage(data));
  htmlByPath.set(p3NeedToKnowPagePath(), renderP3NeedToKnowPage(data));
  htmlByPath.set(p3ReviewPagePath(), renderP3ReviewPage(data));

  for (const topic of STUDY_TOPICS) {
    const context = topicContext(topic, data);
    htmlByPath.set(learnPagePath(topic), renderLearnPage(context));
    htmlByPath.set(fieldGuidePagePath(topic), renderMergedModeNoticePage(context, 'Field Guide', fieldGuidePagePath(topic)));
    htmlByPath.set(skillCheckPagePath(topic), renderPracticePage(context, skillCheckPagePath(topic), learnPagePath(topic)));
    htmlByPath.set(topicExamTrainingPagePath(topic), renderTopicExamTrainingPage(context));
    htmlByPath.set(worksheetPagePath(topic), renderWorksheetPage(context));
  }
  validateNoVisibleGameTerms(htmlByPath);

  for (const [pagePath, html] of htmlByPath) {
    await writeStaticPage(pagePath, html);
  }

  const missing = REQUIRED_STATIC_STUDY_PAGE_PATHS.filter((pagePath) => !htmlByPath.has(pagePath));
  if (missing.length) throw new Error(`Missing generated static pages: ${missing.join(', ')}`);

  await writeFile(path.join(outputRoot, 'static-pages.json'), `${JSON.stringify({
    generatedBy: 'scripts/build-static-site.ts',
    pages: STATIC_STUDY_PAGE_ROUTES,
    questionCount: data.questions.length,
    catalogRecordCount: data.catalogRecords.length,
    catalogQuestionCount: data.catalogQuestions.length,
  }, null, 2)}\n`, 'utf8');

  console.log(`Generated ${htmlByPath.size} static HTML pages in ${toPosix(path.relative(repoRoot, outputRoot))}/`);
}

generate().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
