import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { COURSES, P3_COURSE_ID, type CourseMetadata } from '../src/data/courses';
import { buildP3ExamLaddersFromMappedQuestions, P3_EXAM_LADDER_LEVELS, type P3ExamLadder, type P3MappedExamQuestionIdsBySkill } from '../src/data/p3ExamLadders';
import { getFieldGuideTopicsForRegion, type FieldGuideTopic, type FieldGuideTopicExample } from '../src/data/fieldGuideTopics';
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
import { REQUIRED_STATIC_STUDY_PAGE_PATHS, STATIC_STUDY_PAGE_ROUTES } from '../src/lib/staticStudyRoutes';
import { STUDY_TOPICS, type StudyTopic } from '../src/lib/topicStudy';
import { getTeachingSnippetsForRegion, normalizeTeachingSnippetsData, reviewedTeachingSnippets, type TeachingSnippet } from '../src/lib/teachingSnippets';
import { P3_COURSE_MAP } from '../src/lib/worldMap';
import type { NormalizedQuestion, QuestionMarkPoint, QuestionPartMark, RegionDefinition } from '../src/types';
import { SKILL_CHECK_MISTAKE_TAGS } from '../src/skill-checks/mistakeRecovery';

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
  statusLabel: 'Ready' | 'Needs Field Guide' | 'Needs Skill Check' | 'Needs Exam Mapping' | 'Draft';
}

interface P3SkillCheckabilitySummary {
  deterministic: number;
  notYetCheckable: number;
  unsupported: number;
  answerTypes: string[];
}

interface RenderPageOptions {
  pagePath: string;
  title: string;
  description: string;
  active: 'courses' | 'p1' | 'p3' | 'm1' | 's1' | 'p3-topics' | 'p3-exam-training';
  body: string;
  bodyClass?: string;
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
  [/Use the matching draft Field Guide method/gi, 'Use the matching Field Guide method'],
  [/Draft\/generated practice/gi, 'Skill Check'],
  [/practice\/generated practice/gi, 'Skill Check'],
  [/generated practice/gi, 'Skill Check'],
  [/Skill Practice/gi, 'Skill Check'],
  [/Draft Skill Checks/gi, 'Skill Checks'],
  [/Draft Skill Check/gi, 'Skill Check'],
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
  [/mastery or readiness evidence/gi, 'exam readiness'],
  [/mastery, readiness, marks, teacher evidence, final assessment evidence/gi, 'saved marks'],
  [/mastery evidence/gi, 'exam practice'],
  [/readiness evidence/gi, 'exam practice'],
  [/assessment evidence/gi, 'exam practice'],
  [/exam evidence/gi, 'exam practice'],
  [/teacher evidence/gi, 'teacher feedback'],
  [/final assessment/gi, 'exam'],
  [/does not count as mastery/gi, 'is for practice'],
  [/do not count as mastery/gi, 'are for practice'],
  [/not mastery/gi, 'practice'],
  [/mastery/gi, 'progress'],
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

function p3TopicsIndexPagePath(): string {
  return `${P3_COURSE_ID}/topics/index.html`;
}

function p3NeedToKnowPagePath(): string {
  return `${P3_COURSE_ID}/need-to-know/index.html`;
}

function p3ReviewPagePath(): string {
  return `${P3_COURSE_ID}/review/index.html`;
}

function p3ContentQaPagePath(): string {
  return `${P3_COURSE_ID}/content-qa/index.html`;
}

function fieldGuidePagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/field-guide/index.html`;
}

function practicePagePath(topic: StudyTopic): string {
  return skillCheckPagePath(topic);
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
  if (!availability.fieldGuide) return 'Needs Field Guide';
  if (!availability.skillCheck) return 'Needs Skill Check';
  if (!availability.examTraining) return 'Needs Exam Mapping';
  if (skill.readiness === 'ready') return 'Ready';
  return 'Draft';
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
  const teachingSnippets = getTeachingSnippetsForRegion(data.teachingSnippets, P3_COURSE_MAP.paperFamily, region);
  const generatedPractice = getGeneratedPracticeForRegion(data.generatedPractice, region.id, P3_COURSE_MAP.paperFamily);
  return {
    topic,
    region,
    fieldGuideTopics,
    groups: buildSkillChecklistTopicGroups({
      fieldGuideTopics,
      teachingSnippets,
      practiceItems: generatedPractice,
    }),
    questions: filterTrainableQuestionsForRegion(data.questions, region).slice(0, 8),
  };
}

function primaryNav(pagePath: string, active: RenderPageOptions['active']): string {
  if (active === 'courses') {
    return `
      <nav class="site-nav homepage-nav" aria-label="Primary">
        <a href="${hrefToPage(pagePath, coursePagePath(homepagePrimaryCourse()))}" aria-current="page">P3 (Live)</a>
        <span>P1 (Locked)</span>
        <span>M1 (Locked)</span>
        <span>S1 (Locked)</span>
        <a href="#learning-loop">About</a>
        <a href="#contact">Contact</a>
        <a class="nav-start-button" href="${hrefToPage(pagePath, coursePagePath(homepagePrimaryCourse()))}">Start P3</a>
      </nav>
    `;
  }

  const activeCourseId = active === 'p3-topics' || active === 'p3-exam-training' ? P3_COURSE_ID : active;
  const currentCourse = COURSES.find((course) => course.id === activeCourseId);
  const items = [
    { key: 'courses', label: 'Courses', path: 'index.html' },
    ...(currentCourse ? [{ key: currentCourse.id, label: currentCourse.shortName, path: coursePagePath(currentCourse) }] : []),
  ];

  return `
    <nav class="site-nav" aria-label="Primary">
      ${items.map((item) => `
        <a href="${hrefToPage(pagePath, item.path)}"${active === item.key ? ' aria-current="page"' : ''}>${item.label}</a>
      `).join('')}
    </nav>
  `;
}

function renderPage(options: RenderPageOptions): string {
  const cssHref = hrefToPublicAsset(options.pagePath, 'assets/static-study.css');
  const katexHref = hrefToPublicAsset(options.pagePath, 'assets/katex.min.css');
  const scriptHref = hrefToPublicAsset(options.pagePath, 'assets/static-study.js');
  const title = `${options.title} | Asterion Study`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeAttr(options.description)}" />
    <link rel="stylesheet" href="${katexHref}" />
    <link rel="stylesheet" href="${cssHref}" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body${options.bodyClass ? ` class="${escapeAttr(options.bodyClass)}"` : ''}>
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
    </header>
    <main>
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
      <li><span data-progress-field-guide="${escapeAttr(regionId)}" data-total="${fieldGuideTotal}" data-label="Field Guide">Field Guide: 0/${fieldGuideTotal}</span></li>
      <li><span data-progress-skill="${escapeAttr(regionId)}" data-required-checks="${escapeAttr(JSON.stringify(requiredSkillChecks))}" data-label="Skill Check">Skill Check: 0/${requiredSkillChecks.length} passed</span></li>
      <li><span data-progress-exam="${escapeAttr(regionId)}" data-label="Exam practice evidence">Exam practice evidence: 0 saved</span></li>
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

function renderStudyPath(): string {
  return `
    <ol class="study-path" aria-label="Recommended study path">
      <li><strong>1. Learn</strong><span>Read one short step.</span></li>
      <li><strong>2. Check</strong><span>Try a focused Skill Check.</span></li>
      <li><strong>3. Exam</strong><span>Try one exam-style question.</span></li>
    </ol>
  `;
}

function renderTopicCard(fromPagePath: string, context: TopicContext, examTrainingPath = topicExamTrainingPagePath(context.topic)): string {
  const { topic, region } = context;
  const fieldGuidePath = fieldGuidePagePath(topic);
  const status = topic.slug === STUDY_TOPICS[0]?.slug ? '<span class="topic-status-chip">Start here</span>' : '';
  return `
    <article class="topic-card" data-region-card="${escapeAttr(region.id)}">
      <a class="topic-card-main-link" href="${hrefToPage(fromPagePath, fieldGuidePath)}" aria-label="Start ${escapeAttr(topic.name)} Field Guide">
        <div class="topic-card-formula">${renderInlineFormula(topic.headerFormula)}</div>
        <div class="topic-card-heading">
          <h2>${escapeHtml(topic.name)}</h2>
          ${status}
        </div>
        <p>${escapeHtml(topic.description)}</p>
        <span class="topic-card-arrow" aria-hidden="true">&#8594;</span>
      </a>
      <div class="topic-card-shortcuts" aria-label="${escapeAttr(topic.name)} shortcuts">
        ${routeLink(fromPagePath, practicePagePath(topic), 'Skill Check', 'text-link')}
        ${routeLink(fromPagePath, examTrainingPath, 'Exam', 'text-link')}
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
          <text x="286" y="246">Skill Check</text>
        </g>
      </svg>
    </div>
  `;
}

const homepageLoopSteps = [
  {
    label: 'Learn the route',
    text: 'Field Guides show the exact decisions that turn a blank page into a written method.',
  },
  {
    label: 'Lock the skill',
    text: 'Skill Checks keep the target small until the move is automatic.',
  },
  {
    label: 'Train on real papers',
    text: 'Exam Training uses source question images and mark-scheme review.',
  },
  {
    label: 'Fix the gap',
    text: 'Review the miss, return to the method, and make the next attempt cleaner.',
  },
] as const;

const homepageP3TopicEvidence = 'Algebra, logs and exponentials, trig, differentiation, integration, numerical methods, vectors, differential equations, and complex numbers are already wired into the P3 path.';

function homepagePrimaryCourse(): CourseMetadata {
  return COURSES.find((course) => course.id === P3_COURSE_ID) ?? COURSES[0];
}

function homepageCourseCta(course: CourseMetadata): string {
  if (course.id === P3_COURSE_ID) return 'Start P3';
  return 'Locked';
}

function homepageCourseActionLabel(course: CourseMetadata): string {
  if (course.id !== P3_COURSE_ID) return `${course.shortName} locked: available later`;
  return `${homepageCourseCta(course)}: ${course.displayName}`;
}

function homepageCourseMaturity(course: CourseMetadata): string {
  if (course.id === P3_COURSE_ID) return 'Ready';
  return 'Available later';
}

function homepageCourseSummary(course: CourseMetadata, featured: boolean): string {
  if (featured) return 'The live route: learn the method, check the skill, then train on real Paper 3 question images.';
  return `${course.shortName} is locked while its syllabus contract and exam alignment are finished.`;
}

function renderHomepageLoopPanel(course: CourseMetadata): string {
  return `
    <div class="homepage-loop-panel" aria-label="Asterion learning loop">
      <div class="homepage-loop-header">
        <span class="homepage-loop-kicker">Training flow</span>
        <span class="homepage-loop-tag">Method to evidence</span>
      </div>
      <ol>
        ${homepageLoopSteps.map((step, index) => `
          <li>
            <span class="homepage-loop-number" aria-hidden="true">${index + 1}</span>
            <div>
              <strong>${escapeRawHtml(step.label)}</strong>
              <p>${escapeRawHtml(step.text)}</p>
            </div>
          </li>
        `).join('')}
      </ol>
      <div class="homepage-loop-next-step">
        <span aria-hidden="true">Today</span>
        <strong>${escapeRawHtml(`${course.shortName} is the live path. Start there and follow the sequence.`)}</strong>
      </div>
    </div>
  `;
}

const homepageLearningSteps = [
  ['Try the problem', 'You attempt first. Your attempt is the center.'],
  ['Compare your first move', 'Asterion compares your move, not just your final answer.'],
  ['Learn the method', 'Explanation appears only when you are ready for it.'],
  ['Pass a Skill Check', 'Deterministic checks prove the small skill before you proceed.'],
  ['Train on real exam questions', 'Work on real CAIE Paper 3 questions and get reviewed.'],
  ['Repair the gap', 'Mistakes are expected, repaired, and tracked.'],
] as const;

const homepageTrustCards = [
  ['We start with your attempt.', 'Problems come before instruction. Your attempt drives the lesson.'],
  ['Mistakes are expected.', 'They are not ignored. You repair them and move forward.'],
  ['We train mathematical behavior.', 'Starting, explaining, checking, repairing, and improving.'],
  ['Evidence over optimism.', 'Progress is based on attempts, checks, reviews, and practice.'],
  ['Assessment recognizes what matters.', 'Production, participation, improvement, and contribution.'],
  ['Teachers are coaches.', 'Students explain, defend, and teach their thinking.'],
] as const;

function renderHomepageAttemptCard(): string {
  return `
    <article class="homepage-attempt-card" aria-label="Problem first preview">
      <div class="attempt-card-heading">
        <h2>Try first. Then learn.</h2>
        <p>Before instruction, attempt one small problem.</p>
      </div>
      <div class="attempt-problem-row">
        <strong>Q.</strong>
        <span>Differentiate ${renderInlineFormula('y=x^2e^{3x}')} with respect to ${renderInlineFormula('x')}.</span>
      </div>
      <div class="attempt-step">
        <span class="attempt-step-number">1</span>
        <div>
          <strong>Your first attempt <small>(write here)</small></strong>
          <div class="student-work-line">${renderInlineFormula("y'=2xe^{3x}+x^2 3e^{3x}")}<span aria-hidden="true">edit</span></div>
        </div>
      </div>
      <div class="attempt-step">
        <span class="attempt-step-number">2</span>
        <div>
          <strong>Compare your first move</strong>
          <p>Your first move: You product-ruled the entire expression. <b>Not the most efficient start.</b></p>
        </div>
      </div>
      <div class="attempt-step">
        <span class="attempt-step-number">3</span>
        <div>
          <strong>See the move you missed</strong>
          <p><b>Better first move:</b> Let ${renderInlineFormula('u=x^2')}, ${renderInlineFormula('v=e^{3x}')}.</p>
        </div>
      </div>
      <div class="attempt-lock-row">
        <span aria-hidden="true">lock</span>
        <strong>Instruction appears after you compare.</strong>
        <small>Explanation is delayed until you are ready.</small>
      </div>
    </article>
  `;
}

function renderHomepageLearningLoop(): string {
  return `
    <section class="homepage-section homepage-learning-loop" id="learning-loop" aria-labelledby="learning-loop-title">
      <div class="homepage-section-heading">
        <h2 id="learning-loop-title">The Asterion Learning Loop</h2>
        <p>A repeatable system that builds exam-ready mathematical behavior.</p>
      </div>
      <ol class="learning-loop-list">
        ${homepageLearningSteps.map(([title, text], index) => `
          <li>
            <span class="loop-index">${index + 1}</span>
            <span class="loop-icon" aria-hidden="true">${['try', 'scan', 'book', 'pass', 'exam', 'fix'][index]}</span>
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
        <h2 id="trust-contract-title">The Asterion Trust Contract</h2>
        <p>We teach mathematical behavior, not just mathematical content.</p>
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
          <strong>Asterion does not treat self-marked exam practice as progress.</strong>
          <p>Self-marked questions are useful, but weaker evidence. We label it honestly.</p>
        </div>
        <ul aria-label="Progress evidence labels">
          <li>Attempted</li>
          <li>Self-Marked</li>
          <li>Skill-Checked</li>
          <li>Exam-Trained</li>
        </ul>
      </div>
    </section>
  `;
}

function renderHomepageCourseAvailability(fromPagePath: string, p3Course: CourseMetadata, supportCourses: CourseMetadata[]): string {
  return `
    <section class="homepage-section homepage-course-availability" aria-labelledby="course-availability-title">
      <div class="homepage-section-heading">
        <h2 id="course-availability-title">P3 is live. Everything else waits.</h2>
        <p>We prove the learning loop in P3 before expanding.</p>
      </div>
      <div class="home-course-row">
        ${renderHomepageCourseCard(fromPagePath, p3Course, true)}
        ${supportCourses.map((course) => renderHomepageCourseCard(fromPagePath, course)).join('')}
      </div>
      <div class="home-feature-strip">
        <span><strong>Static-first</strong>No backend dependency yet.</span>
        <span><strong>Teacher-ready</strong>Assign, print, export, audit.</span>
        <span><strong>Built for CAIE behavior</strong>Real exam questions, real methods.</span>
        <span><strong>Expansion path</strong>P3 -> P1/M1/S1 -> Teacher tools</span>
      </div>
    </section>
  `;
}

const homepageContactEmail = 'brooker@rdfzcygj.cn';

function renderHomepageContactBar(): string {
  return `
    <section class="homepage-contact-bar" id="contact" aria-label="Contact Asterion">
      <div>
        <h2>Contact me</h2>
        <p>Questions, feedback, course requests, or teacher use cases.</p>
      </div>
      <a href="mailto:${escapeAttr(homepageContactEmail)}">${escapeRawHtml(homepageContactEmail)}</a>
    </section>
  `;
}

function renderHomepageCourseCard(fromPagePath: string, course: CourseMetadata, featured = false): string {
  const statusPillClass = featured ? 'course-status-pill course-status-pill-primary' : 'course-status-pill';
  const tag = featured ? 'a' : 'article';
  const href = featured ? ` href="${hrefToPage(fromPagePath, coursePagePath(course))}"` : '';
  const ariaDisabled = featured ? '' : ' aria-disabled="true"';
  return `
    <${tag} class="course-card${featured ? ' course-card-featured' : ' course-card-locked'} course-status-${escapeRawAttr(course.status)}"${href}${ariaDisabled} aria-label="${escapeRawAttr(homepageCourseActionLabel(course))}">
      ${featured ? '<span class="homepage-primary-label">Recommended starting path</span>' : ''}
      <div class="course-card-header-row">
        <span class="course-code-badge">${escapeRawHtml(course.shortName)}</span>
        <div>
          <span class="${statusPillClass}">${escapeRawHtml(homepageCourseMaturity(course))}</span>
          <h2>${escapeRawHtml(course.displayName)}</h2>
        </div>
      </div>
      <p class="course-card-lede">${escapeRawHtml(homepageCourseSummary(course, featured))}</p>
      ${featured ? `<p class="homepage-primary-reason">${escapeRawHtml(homepageP3TopicEvidence)}</p>` : ''}
      ${featured ? '' : '<p class="course-card-status-copy">Available later. P3 is open now.</p>'}
      ${featured ? '<ul class="home-p3-checklist"><li>Field Guides</li><li>Skill Checks</li><li>CAIE Paper 3 Practice</li><li>Mark Scheme Review</li></ul>' : '<span class="locked-glyph" aria-hidden="true">lock</span>'}
      <span class="course-launch-cta${featured ? ' course-launch-cta-primary' : ' course-launch-cta-secondary'}">${escapeRawHtml(homepageCourseCta(course))}${featured ? ' <span aria-hidden="true">&#8594;</span>' : ''}</span>
    </${tag}>
  `;
}

function renderCourseSelectorPage(): string {
  const pagePath = 'index.html';
  const p3Course = homepagePrimaryCourse();
  const supportCourses = COURSES.filter((course) => course.id !== p3Course.id);
  const body = `
    <section class="homepage-hero">
      <div class="hero-copy">
        <h1>CAIE 9709 practice that starts with the <span>student&rsquo;s attempt.</span></h1>
        <p>Asterion trains students to try the problem first, compare their method, repair mistakes, prove small skills, and then apply them to real CAIE exam questions.</p>
        <div class="home-hero-actions">
          <a class="button primary-button" href="${hrefToPage(pagePath, coursePagePath(p3Course))}">Start P3</a>
          <a class="button secondary-button" href="#learning-loop">See how Asterion teaches <span aria-hidden="true">&#8594;</span></a>
        </div>
        <ul class="home-hero-proof">
          <li><strong>Built for</strong><span>CAIE 9709</span></li>
          <li><strong>Real CAIE</strong><span>exam questions</span></li>
          <li><strong>Honest</strong><span>progress labels</span></li>
          <li><strong>Teacher</strong><span>ready</span></li>
        </ul>
      </div>
      ${renderHomepageAttemptCard()}
    </section>
    ${renderHomepageLearningLoop()}
    ${renderHomepageTrustContract()}
    ${renderHomepageCourseAvailability(pagePath, p3Course, supportCourses)}
    ${renderHomepageContactBar()}
  `;
  return renderPage({
    pagePath,
    title: 'CAIE 9709 Study Hub',
    description: 'Static CAIE 9709 study hub course selector.',
    active: 'courses',
    body,
    bodyClass: 'home-page',
  });
}

function renderCourseDashboardPage(course: CourseMetadata): string {
  const pagePath = coursePagePath(course);
  const isP3 = course.id === P3_COURSE_ID;
  const topicButtons = isP3
    ? STUDY_TOPICS.map((topic) => `
      <a class="course-topic-button" href="${hrefToPage(pagePath, fieldGuidePagePath(topic))}" aria-label="Start ${escapeAttr(topic.name)} Field Guide">
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
          <p>Start with one topic. The Field Guide opens first.</p>
        </div>
        <div class="course-topic-button-grid">
          ${topicButtons}
        </div>
      </section>
      <section class="summary-card" aria-labelledby="p3-review-title">
        <p class="eyebrow">Review</p>
        <h2 id="p3-review-title">Review mistakes from this browser.</h2>
        <p>Asterion groups recent wrong, repaired, and revealed Skill Check attempts by mistake tag.</p>
        ${routeLink(pagePath, p3ReviewPagePath(), 'Open review', 'button secondary-button')}
      </section>
    `
    : `
      <section class="summary-card course-topic-list support-only-panel" aria-labelledby="course-topic-list-title" id="course-topics">
        <div>
          <h2 id="course-topic-list-title">Support only</h2>
          <p>${escapeHtml(course.coverageSummary)}</p>
        </div>
        <p class="empty-state">No ${escapeHtml(course.shortName)} topic route is published on this static P3 product branch.</p>
        ${routeLink(pagePath, coursePagePath(COURSES.find((item) => item.id === P3_COURSE_ID) ?? course), 'Go to P3', 'button primary-button')}
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
  const contexts = STUDY_TOPICS.map((topic) => topicContext(topic, data));
  const body = `
    ${renderHero(
      'Pure Mathematics 3 Topics',
      'Choose one topic. The Field Guide starts first, with Skill Check and Exam Training one step away.',
      '\\int f(x)\\,dx \\quad \\mathbf{a}\\cdot\\mathbf{b} \\quad z=x+iy',
      `${routeLink(pagePath, fieldGuidePagePath(STUDY_TOPICS[0]), 'Start Algebra', 'button primary-button')}`,
    )}
    <section class="section-heading" id="topic-list">
      <div>
        <h2>Choose a topic</h2>
      <p>Unsure where to begin? Start with Algebra, or choose the topic you are currently studying.</p>
      </div>
    </section>
    <section class="topic-grid" aria-label="Paper 3 topic pages">
      ${contexts.map((context) => renderTopicCard(pagePath, context)).join('')}
    </section>
    <section class="exam-callout">
      <div>
        <p class="eyebrow">Exam Training</p>
        <h2>Open Exam Training from a topic.</h2>
        <p>The canonical route is <strong>/p3/topics/&lt;topic&gt;/exam-training/</strong>.</p>
      </div>
      ${routeLink(pagePath, topicExamTrainingPagePath(STUDY_TOPICS[0]), 'Algebra Exam Training', 'button secondary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'Pure Mathematics 3 Topics',
    description: 'Static CAIE 9709 Paper 3 topic practice pages.',
    active: 'p3-topics',
    body,
  });
}

function statusClassName(label: P3SkillContractPageRow['statusLabel']): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function contractTopicAnchor(topic: P3OfficialTopic): string {
  return `need-to-know-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function renderContractAvailabilityLinks(pagePath: string, row: P3SkillContractPageRow): string {
  const { topic, availability } = row;
  const links = [
    availability.fieldGuide
      ? contractRouteLink(pagePath, fieldGuidePagePath(topic), 'Field Guide', 'field-guide')
      : '<span class="contract-resource-missing">Needs Field Guide</span>',
    availability.skillCheck
      ? contractRouteLink(pagePath, skillCheckPagePath(topic), 'Skill Check', 'skill-check')
      : '<span class="contract-resource-missing">Needs Skill Check</span>',
    availability.examTraining
      ? contractRouteLink(pagePath, topicExamTrainingPagePath(topic), 'Exam Training', 'exam-training')
      : '<span class="contract-resource-missing">Needs Exam Mapping</span>',
  ];

  return `<div class="contract-resource-list">${links.join('')}</div>`;
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
  const body = `
    ${renderHero(
      'P3 Need to Know',
      'A checklist for the official Paper 3 skills currently tracked by Asterion.',
      '\\frac{dy}{dx}, \\quad \\int f(x)\\,dx, \\quad z=x+iy',
      `${routeLink(pagePath, p3TopicsIndexPagePath(), 'Back to P3 topics', 'button secondary-button')}
      ${routeLink(pagePath, p3ContentQaPagePath(), 'Content QA', 'button text-button')}`,
    )}
    <section class="section-heading">
      <div>
        <h2>Skill checklist</h2>
        <p>${totalSkills} skills grouped by official P3 topic.</p>
      </div>
    </section>
    ${groups.map((group) => `
      <section class="contract-topic-section" aria-labelledby="${escapeRawAttr(contractTopicAnchor(group.topic))}">
        <div class="section-heading contract-topic-heading">
          <div>
            <h2 id="${escapeRawAttr(contractTopicAnchor(group.topic))}">${escapeRawHtml(group.topic)}</h2>
            <p>${group.rows.length} tracked skills</p>
          </div>
        </div>
        <div class="contract-skill-grid">
          ${group.rows.map((row) => `
            <article class="contract-skill-card" data-skill-id="${escapeRawAttr(row.skill.id)}">
              <header class="contract-skill-card-header">
                <div>
                  <p class="eyebrow">${escapeRawHtml(row.skill.officialTopic)}</p>
                  <h3>${escapeRawHtml(row.skill.title)}</h3>
                </div>
                <span class="contract-status contract-status-${escapeRawAttr(statusClassName(row.statusLabel))}">${escapeRawHtml(row.statusLabel)}</span>
              </header>
              <ul class="contract-checklist">
                ${row.skill.needToKnow.map((item) => `<li>${escapeRawHtml(item)}</li>`).join('')}
              </ul>
              ${renderExamTriggerList(row.skill)}
              ${renderContractAvailabilityLinks(pagePath, row)}
            </article>
          `).join('')}
        </div>
      </section>
    `).join('')}
  `;
  return renderPage({
    pagePath,
    title: 'P3 Need to Know',
    description: 'Student-facing Paper 3 skill checklist grouped by official topic.',
    active: 'p3',
    body,
  });
}

function renderP3ReviewPage(pagePath = p3ReviewPagePath()): string {
  const body = `
    ${renderHero(
      'P3 Mistake Review',
      'Review recent Skill Check mistakes saved in this browser, or export local progress for a teacher conversation.',
      '\\Delta, \\quad \\log_a x, \\quad z=x+iy',
      `${routeLink(pagePath, p3TopicsIndexPagePath(), 'Open Skill Checks', 'button primary-button')}`,
      'Local review',
    )}
    <section class="support-panel" data-export-panel>
      <div>
        <p class="eyebrow">Teacher support</p>
        <h2>Export local progress CSV</h2>
        <p>The CSV only includes attempts and progress stored in this browser. It does not sync accounts, classes, or cloud data.</p>
      </div>
      <button class="button secondary-button" type="button" data-export-local-progress>Export local progress CSV</button>
      <p class="save-status" data-export-status role="status"></p>
    </section>
    <section class="summary-card review-empty-state" data-review-empty>
      <h2>No tagged mistakes yet.</h2>
      <p>Review sessions will appear after you answer a machine-checkable P3 Skill Check incorrectly, reveal a repair step, or reveal an answer and choose a mistake tag.</p>
      ${routeLink(pagePath, p3TopicsIndexPagePath(), 'Go to P3 Skill Checks', 'button primary-button')}
    </section>
    <section class="review-session" data-review-session hidden>
      <div class="section-heading">
        <div>
          <p class="eyebrow">Local mistake history</p>
          <h2>Recommended review groups</h2>
          <p data-review-summary>Loading local review...</p>
        </div>
      </div>
      <div class="review-group-stack" data-review-groups></div>
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'P3 Mistake Review',
    description: 'Browser-local P3 review groups from Skill Check mistake tags.',
    active: 'p3',
    body,
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
      'P3 Content QA',
      'Maintainer table for checking the Paper 3 skill contract against available content surfaces.',
      '\\log_a x, \\quad \\mathbf{a}\\cdot\\mathbf{b}, \\quad \\arg z',
      `${routeLink(pagePath, p3NeedToKnowPagePath(), 'Need to Know', 'button secondary-button')}`,
      'Maintainer QA',
    )}
    <section class="summary-card contract-qa-summary">
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
      <div class="contract-table-scroll">
        <table class="contract-qa-table">
          <thead>
            <tr>
              <th>Skill ID</th>
              <th>Topic</th>
              <th>Skill title</th>
              <th>Field Guide</th>
              <th>Skill Check</th>
              <th>Skill Check grading</th>
              <th>Exam Training</th>
              <th>Mapped exam questions</th>
              <th>Easy ladder</th>
              <th>Standard ladder</th>
              <th>Hard ladder</th>
              <th>Mixed mapped questions</th>
              <th>Readiness</th>
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
    title: 'P3 Content QA',
    description: 'Maintainer-facing QA table for the Paper 3 skill contract.',
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

function renderFieldGuideExample(topic: FieldGuideTopic, example: FieldGuideTopicExample, index: number): string {
  return `
    <article class="lesson-card">
      <p class="eyebrow">Example ${index + 1}</p>
      <h3>${escapeHtml(example.title)}</h3>
      <p class="prompt">${renderMathText(example.prompt)}</p>
      <ol class="worked-list">
        ${example.workedLines.map((line) => `<li>${renderMathText(line)}</li>`).join('')}
      </ol>
      <p class="result"><strong>Result:</strong> ${renderMathText(example.result)}</p>
      <section class="try-block">
        <h4>Try a similar one</h4>
        <p>${renderMathText(example.tryPrompt)}</p>
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

function renderFieldGuideTopic(
  topic: FieldGuideTopic,
  region: RegionDefinition,
  index: number,
  topicCount: number,
  nextTopicId: string | undefined,
  practiceHref: string,
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
  const body = `
    ${renderHero(
      `${topic.name} Field Guide`,
      'Learn one idea, try the worked route, then decide whether to continue or check it.',
      topic.headerFormula,
      `${routeLink(pagePath, p3TopicsIndexPagePath(), 'Back to topics', 'button secondary-button')}
      ${routeLink(pagePath, practicePath, 'Try 3 quick questions', 'button primary-button')}`,
    )}
    <section class="topic-overview-grid field-guide-overview-grid">
      ${renderKnowledgeCard([`$${topic.headerFormula}$`], fieldGuideTopics.slice(0, 5).map((item) => cleanVisibleCopy(item.purpose)), topic.headerFormula)}
      ${renderP3WorkedExamplesCard(fieldGuideTopics)}
    </section>
    ${renderP3GuidedFieldGuide(context, pagePath, practicePath)}
    <section class="next-step-card">
      <h2>Next step</h2>
      <p>Ready to leave the Field Guide and check the method?</p>
      ${renderSkillCheckTransition(pagePath, practicePath)}
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

function renderSkillCheckAnswerInput(item: SkillCheckItem): string {
  if (item.inputType === 'numeric') {
    return `
      <label class="single-answer-field">
        Answer
        <input type="text" aria-label="${escapeAttr(`${item.itemId} answer`)}" />
      </label>
    `;
  }

  if (item.inputType === 'two_value' && item.fields?.length) {
    return `
      <div class="field-list">
        ${item.fields.map((field) => `
          <label>${escapeHtml(field.label)} <input type="text" aria-label="${escapeAttr(field.label)}" /></label>
        `).join('')}
      </div>
    `;
  }

  return renderOptions(item.options ?? item.cards, item.itemId, item.inputType === 'checkbox');
}

function answerValueLabel(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
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

function renderCheckableSkillCheckForm(
  item: SkillCheckItem,
  group: SkillChecklistTopicGroup,
  pagePath: string,
  fieldGuidePath: string,
): string {
  const spec = skillCheckAnswerSpecForItem(item);
  if (!spec) return '';
  const mistakeTags = Array.from(new Set([
    ...(item.mistakeTags ?? []),
    ...SKILL_CHECK_MISTAKE_TAGS,
  ]));
  return `
    <form class="skill-check-form" data-check-skill-answer data-course="p3" data-region-id="${escapeAttr(item.regionId)}" data-topic="${escapeAttr(group.topic.title)}" data-skill-id="${escapeAttr(item.skillId)}" data-check-id="${escapeAttr(item.itemId)}" data-answer-type="${escapeAttr(spec.answerType)}" data-accepted-answers="${escapeAttr(JSON.stringify(spec.acceptedAnswers))}" data-tolerance="${escapeAttr(spec.tolerance)}" data-order-matters="${spec.orderMatters === true ? 'true' : 'false'}" data-mistake-tags="${escapeAttr(JSON.stringify(item.mistakeTags ?? []))}">
      <label class="single-answer-field">
        Answer
        <input name="submittedAnswer" type="text" autocomplete="off" required />
      </label>
      <div class="skill-check-actions">
        <button class="button primary-button" type="submit">Check answer</button>
        <button class="button secondary-button" type="button" data-show-skill-hint>Show hint</button>
        <button class="button primary-button" type="button" data-skill-check-inline-next hidden>Next</button>
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
        <p class="question-instruction">Using this repair marks the attempt as repaired, not passed.</p>
      </details>
      <details class="skill-check-answer-details" data-skill-answer-reveal hidden>
        <summary>Show answer and worked route</summary>
        <div>${renderExpectedAnswerSummary(item)}</div>
        <ol>${item.workedRoute.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>
        <p class="question-instruction">Revealed answers are saved as repaired practice and do not count as passed.</p>
      </details>
      ${routeLink(pagePath, fieldGuidePath, 'Back to Field Guide', 'button secondary-button')}
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
                <summary>Show hint and worked route</summary>
                <p>${renderMathText(item.hints.nudge)}</p>
                ${item.hints.methodCue ? `<p>${renderMathText(item.hints.methodCue)}</p>` : ''}
                <ol>${item.workedRoute.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>
              </details>
              <p class="empty-state">This check is not machine-checkable yet. Use it for practice, not pass credit.</p>
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
                <summary>Show answer</summary>
                <p><strong>Answer:</strong> ${renderMathText(check.answer)}</p>
                <p>${renderMathText(check.explanation)}</p>
              </details>
              <p class="empty-state">Review only. This does not count toward deterministic Skill Check pass state.</p>
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
        <summary>Show answer and route</summary>
        <p><strong>Answer:</strong> ${renderMathText(item.answer)}</p>
        <ol>${item.workedSolution.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>
      </details>
      <p class="empty-state">Guided practice is review only. It does not create Skill Check pass credit.</p>
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
    <article class="practice-topic" id="practice-${escapeAttr(group.topic.id)}">
      <header class="topic-section-header">
        <div>
          <p class="eyebrow">${defaultItems || totalItems} quick check${(defaultItems || totalItems) === 1 ? '' : 's'}</p>
          <h2>${escapeHtml(group.topic.title)}</h2>
          <p>${escapeHtml(group.topic.purpose)}</p>
          <p class="practice-instruction">Try one item first. Use the hint if you need a repair step.</p>
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
  markSchemeText?: string;
  markPoints?: QuestionMarkPoint[];
}

function examSelfMarkParts(question: NormalizedQuestion, totalMarks = marksAvailable(question)): ExamSelfMarkPart[] {
  const cleanParts = (question.parts ?? [])
    .filter((part): part is QuestionPartMark => typeof part.marksAvailable === 'number' && part.marksAvailable > 0)
    .map((part) => ({
      partId: part.partId,
      subpartId: part.subpartId,
      label: part.label,
      marksAvailable: part.marksAvailable,
      markSchemeText: part.markSchemeText,
      markPoints: part.markPoints,
    }));
  if (cleanParts.length) return cleanParts;
  return [{
    label: 'Whole question',
    marksAvailable: totalMarks,
    markSchemeText: question.textQuality?.markSchemeText,
  }];
}

function renderMarkPointControls(part: ExamSelfMarkPart, partIndex: number): string {
  const markPoints = part.markPoints ?? [];
  if (!markPoints.length) {
    return part.markSchemeText
      ? `<details class="self-marking-guidance">
          <summary>Self-marking guidance</summary>
          <p>${escapeRawHtml(part.markSchemeText)}</p>
        </details>`
      : '<p class="self-marking-guidance-note">Self-marking guidance is the mark-scheme image for this part.</p>';
  }
  return `
    <fieldset class="mark-point-list">
      <legend>Tick mark points you can justify from the mark scheme image</legend>
      ${markPoints.map((point) => `
        <label>
          <input type="checkbox" data-mark-point data-part-index="${partIndex}" value="${escapeRawAttr(point.id)}" />
          <span>${point.markCode ? `<strong>${escapeRawHtml(point.markCode)}</strong> ` : ''}${escapeRawHtml(point.label)}</span>
        </label>
      `).join('')}
    </fieldset>
  `;
}

function renderExamPartControls(part: ExamSelfMarkPart, partIndex: number): string {
  const markPointCount = part.markPoints?.length ?? 0;
  return `
    <fieldset class="exam-part-card" data-exam-part data-part-index="${partIndex}" data-part-label="${escapeRawAttr(part.label)}" data-part-id="${escapeRawAttr(part.partId)}" data-subpart-id="${escapeRawAttr(part.subpartId)}" data-marks-available="${part.marksAvailable}" data-mark-points-available="${markPointCount}">
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
  const hasPartData = Boolean(question.parts?.length);
  const hasTickableMarkPoints = selfMarkParts.some((part) => (part.markPoints?.length ?? 0) > 0);
  const displayTopic = options.displayTopic ?? displayTopicForQuestion(question);
  const displaySubtopic = options.displaySubtopic ?? question.displaySubtopic;
  const allowAttemptSave = options.allowAttemptSave ?? true;
  return `
    <article class="exam-question-card" id="question-${escapeAttr(question.id)}" data-coarse-self-marking="${hasPartData ? 'false' : 'true'}">
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(questionTitle(question))}</p>
          <h3>${escapeHtml(displayTopic)}</h3>
          ${displaySubtopic ? `<p>${escapeHtml(displaySubtopic)}</p>` : ''}
          <p class="question-instruction">Self-marked exam work is useful practice evidence, but it is weaker than checked Skill Check evidence. It does not award mastery by itself.</p>
          ${options.reviewNote ? `<p class="question-instruction">${escapeHtml(options.reviewNote)}</p>` : ''}
        </div>
        <span class="marks-pill">${totalMarks} mark${totalMarks === 1 ? '' : 's'}</span>
      </header>
      <figure class="question-figure">
        <img loading="lazy" src="${hrefToPublicAsset(pagePath, questionImage)}" alt="${escapeAttr(`${questionTitle(question)} question image`)}" />
      </figure>
      <details class="exam-hint-details">
        <summary>Need a first step?</summary>
        <p>Underline what the question asks for, write the formula or method you recognise, then do one line of working before checking the mark scheme.</p>
      </details>
      <label class="exam-commit-checkbox">
        <input type="checkbox" data-worked-before-reveal />
        <span>I attempted this on paper before revealing the mark scheme.</span>
      </label>
      <details class="mark-scheme-details" data-mark-scheme-reveal>
        <summary>Show mark scheme image</summary>
        <figure class="question-figure">
          <img loading="lazy" src="${hrefToPublicAsset(pagePath, markSchemeImage)}" alt="${escapeAttr(`${questionTitle(question)} mark scheme image`)}" />
        </figure>
      </details>
      ${options.reviewLinkPath ? `<p class="question-review-link">${routeLink(pagePath, options.reviewLinkPath, 'Review Field Guide', 'button secondary-button')}</p>` : ''}
      ${allowAttemptSave ? `<form class="attempt-form exam-self-mark-form" data-save-exam-attempt data-question-id="${escapeAttr(question.id)}" data-paper-family="${escapeAttr(question.paperFamily)}" data-paper="${escapeAttr(question.paper)}" data-question-number="${escapeAttr(question.questionNumber)}" data-topic="${escapeAttr(displayTopic)}" data-subtopic="${escapeAttr(displaySubtopic)}" data-marks-available="${totalMarks}" data-parts="${escapeRawAttr(JSON.stringify(selfMarkParts))}" data-coarse-self-marking="${hasPartData ? 'false' : 'true'}" data-has-mark-points="${hasTickableMarkPoints ? 'true' : 'false'}" data-validated-region-id="${escapeAttr(options.validatedRegionId ?? question.routeEvidence?.validatedRegionId)}" data-display-region-id="${escapeAttr(options.displayRegionId ?? question.routeEvidence?.displayRegionId)}">
        <div class="exam-evidence-banner">
          <strong>Self-marked attempt</strong>
          <span>Exam practice evidence. Needs Skill Check pass before mastery can be shown.</span>
        </div>
        ${!hasPartData ? '<p class="coarse-marking-note">Coarse self-marking: this source record does not expose reliable separate parts, so save one whole-question score.</p>' : ''}
        <div class="exam-part-list">
          ${selfMarkParts.map(renderExamPartControls).join('')}
        </div>
        <label>
          Reflection
          <select name="mistakeType" required>
            <option value="">Choose one</option>
            <option value="no_issue">Full method was secure</option>
            <option value="did_not_know_method">I did not know the method</option>
            <option value="algebra_error">Algebra error</option>
            <option value="misread_question">Misread the question</option>
            <option value="formula_issue">Formula issue</option>
            <option value="diagram_or_modeling_issue">Diagram or modelling issue</option>
            <option value="ran_out_of_time">Ran out of time</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Confidence after marking
          <select name="confidenceRating" required>
            <option value="">Choose one</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <button class="button primary-button" type="submit">Save self-marked attempt</button>
        <p class="form-status" role="status"></p>
      </form>` : '<p class="empty-state">Use this question for practice. Save marks only if you want to track the attempt locally.</p>'}
    </article>
  `;
}

function p3FieldGuidePathForQuestion(question: NormalizedQuestion): string | undefined {
  const regionId = question.routeEvidence?.validatedRegionId ?? question.routeEvidence?.displayRegionId;
  const topic = STUDY_TOPICS.find((candidate) => candidate.regionId === regionId);
  return topic ? fieldGuidePagePath(topic) : undefined;
}

function renderPracticePage(
  context: TopicContext,
  pagePath = practicePagePath(context.topic),
  fieldGuidePath = fieldGuidePagePath(context.topic),
): string {
  const { topic, region, groups } = context;
  const firstPracticeId = groups[0]?.topic.id ? `practice-${groups[0].topic.id}` : 'exam-questions';
  const requiredSkillCheckIds = checkableSkillCheckIdsForRegion(region.id);
  const body = `
    ${renderHero(
      `${topic.name} Skill Check`,
      'Start with one focused question. Use a hint or review the Field Guide if you get stuck.',
      topic.headerFormula,
      `<a class="button primary-button" href="#${escapeAttr(firstPracticeId)}">Start first question</a>
      ${routeLink(pagePath, topicExamTrainingPagePath(topic), 'One exam question', 'button secondary-button')}
      ${routeLink(pagePath, worksheetPagePath(topic), 'Print worksheet', 'button secondary-button')}
      ${routeLink(pagePath, fieldGuidePath, 'Review Field Guide', 'button text-button')}`,
    )}
    <details class="jump-details">
      <summary>Show Skill Check sections and saved progress</summary>
      <nav class="subnav" aria-label="${escapeAttr(topic.name)} Skill Check sections">
        ${groups.map((group) => `<a href="#practice-${escapeAttr(group.topic.id)}">${escapeHtml(group.topic.title)}</a>`).join('')}
      </nav>
      <div class="progress-detail-row">
        ${progressList(region.id, Math.max(1, context.fieldGuideTopics.length), requiredSkillCheckIds)}
        ${routeLink(pagePath, fieldGuidePath, 'Review Field Guide', 'button secondary-button')}
      </div>
    </details>
    <section class="practice-stack" data-one-card-flow data-flow-label="Skill Check" data-default-card-limit="3">
      ${groups.map((group) => renderSkillPracticeGroup(group, pagePath, fieldGuidePath)).join('')}
    </section>
    <section class="next-step-card">
      <h2>Next step</h2>
      <p>Ready for the next step? Try one exam-style question.</p>
      ${routeLink(pagePath, topicExamTrainingPagePath(topic), 'One exam question', 'button primary-button')}
      ${routeLink(pagePath, fieldGuidePath, 'Review Field Guide', 'button secondary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} Skill Check`,
    description: `Static Skill Check for ${topic.name}.`,
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
  const body = `
    <section class="worksheet-hero">
      <p class="eyebrow">Printable worksheet</p>
      <h1>${escapeHtml(topic.name)} Skill Check Worksheet</h1>
      <div class="worksheet-meta">
        <p>Student name: <span></span></p>
        <p>Date: <span></span></p>
      </div>
      <div class="worksheet-actions">
        <button class="button primary-button" type="button" onclick="window.print()">Print / Save PDF</button>
        ${routeLink(pagePath, skillCheckPath, 'Back to Skill Check', 'button secondary-button')}
      </div>
    </section>
    <section class="worksheet-instructions">
      <h2>Questions</h2>
      <p>Show working clearly. Use the interactive Skill Check page for deterministic checking after this worksheet.</p>
    </section>
    <section class="worksheet-question-list">
      ${items.length ? items.map(renderWorksheetItem).join('') : '<p class="empty-state">No printable Skill Check items are available for this topic yet.</p>'}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} Worksheet`,
    description: `Printable P3 Skill Check worksheet for ${topic.name}.`,
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
      `${topic.name} Exam Training`,
      'Try one Paper 3 question at a time. Self-mark honestly and use Skill Check for mastery.',
      topic.headerFormula,
      `${questions.length ? '<a class="button primary-button" href="#topic-exam-questions">Start topic questions</a>' : ''}
      ${routeLink(pagePath, practicePath, 'Skill Check', 'button secondary-button')}
      ${routeLink(pagePath, topicsIndexPath, 'Back to P3 topics', 'button text-button')}`,
    )}
    <section class="exam-question-section" id="topic-exam-questions">
      <div class="section-heading">
        <div>
          <h2>Exam questions</h2>
          <p>Self-marked exam work is useful practice evidence, but it is weaker than checked Skill Check evidence. It does not award mastery by itself.</p>
        </div>
      </div>
      <div class="exam-mode-toolbar">
        <label class="exam-mode-toggle">
          <input type="checkbox" data-confident-student-mode />
          <span>Confident student mode</span>
        </label>
        <p>Fewer prompts and faster access to self-marking. Integrity labels and Skill Check gating stay on.</p>
      </div>
      <div class="exam-question-grid" data-exam-flow data-flow-label="${escapeAttr(topic.name)} exam question">
        ${questions.map((question) => renderExamQuestionCard(question, pagePath, {
          reviewLinkPath: fieldGuidePagePath(topic),
        })).join('')}
      </div>
      ${questions.length === 0 ? '<p class="empty-state">No exam image is available for this topic yet.</p>' : ''}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} Exam Training`,
    description: `Static Exam Training questions for ${topic.name}.`,
    active: 'p3-exam-training',
    body,
  });
}

function renderExamTrainingTopicCard(fromPagePath: string, context: TopicContext, examTrainingPath = topicExamTrainingPagePath(context.topic)): string {
  const total = Math.max(1, context.fieldGuideTopics.length);
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
  pagePath = `${P3_COURSE_ID}/exam-training/index.html`,
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
      'Use this after topic practice, or for revision when you want one mixed Paper 3 question. Exam attempts are self-marked evidence.',
      '\\frac{dy}{dx}, \\quad \\int_a^b f(x)\\,dx, \\quad \\arg z',
      `<a class="button primary-button" href="#mixed-questions">Start mixed questions</a>
      ${routeLink(pagePath, topicsIndexPath, 'Back to topics', 'button secondary-button')}`,
    )}
    <section class="exam-question-section" id="mixed-questions">
      <div class="section-heading">
        <div>
          <h2>Mixed Paper 3 questions</h2>
          <p>Self-marked exam work is useful practice evidence, but it is weaker than checked Skill Check evidence. It does not award mastery by itself.</p>
        </div>
      </div>
      <div class="exam-mode-toolbar">
        <label class="exam-mode-toggle">
          <input type="checkbox" data-confident-student-mode />
          <span>Confident student mode</span>
        </label>
        <p>Fewer prompts and faster access to self-marking. Integrity labels and Skill Check gating stay on.</p>
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
        <p>Use the totals as practice evidence, not a grade or mastery decision.</p>
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
  const questionBank = await readJson('public/assets/exam-bank-data/asterion_question_bank_v1.json');
  const catalogQuestionBank = await readJson('public/assets/exam-bank-data/asterion_exam_bank_catalog_v1.json');
  const topicRouting = await readJson('public/assets/exam-bank-data/question_bank.topic_routing.v1.json');
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
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await copyStaticAssets();

  const data = await loadStaticSiteData();
  const htmlByPath = new Map<string, string>();

  htmlByPath.set('index.html', renderCourseSelectorPage());

  for (const course of COURSES) {
    htmlByPath.set(coursePagePath(course), renderCourseDashboardPage(course));
  }

  htmlByPath.set(p3TopicsIndexPagePath(), renderP3TopicsIndexPage(data));
  htmlByPath.set(p3NeedToKnowPagePath(), renderP3NeedToKnowPage(data));
  htmlByPath.set(p3ReviewPagePath(), renderP3ReviewPage());
  htmlByPath.set(p3ContentQaPagePath(), renderP3ContentQaPage(data));

  for (const topic of STUDY_TOPICS) {
    const context = topicContext(topic, data);
    htmlByPath.set(fieldGuidePagePath(topic), renderFieldGuidePage(context));
    htmlByPath.set(practicePagePath(topic), renderPracticePage(context));
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
