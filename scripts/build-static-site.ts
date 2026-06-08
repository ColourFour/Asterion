import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { COURSES, P3_COURSE_ID, type CourseMetadata } from '../src/data/courses';
import {
  getSeedTopicsForCourse,
  hasDraftSeedTopics,
  type CourseSeedTopicSection,
  type CourseSeedTopic,
  type CourseSeedVisualTemplate,
} from '../src/data/courseSeedContent';
import { getFieldGuideTopicsForRegion, type FieldGuideTopic, type FieldGuideTopicExample } from '../src/data/fieldGuideTopics';
import {
  getP1SkillCheckGroup,
  getP1SkillCheckGroupsForTopic,
  getSkillCheckItemsForCourseTopic,
  skillCheckContractForItem,
  type P1SkillCheckGroup,
  type P1SkillCheckGroupItem,
  type SkillCheckItem,
} from '../src/data/skillCheckItems';
import { buildSkillChecklistTopicGroups, totalSkillChecklistItems, type SkillChecklistTopicGroup } from '../src/lib/skillChecklist';
import { getGeneratedPracticeForRegion, normalizeGeneratedPracticeData, reviewedGeneratedPractice, type GeneratedPracticeItem } from '../src/lib/generatedPractice';
import { normalizeQuestionBankWithDiagnostics } from '../src/lib/normalizeQuestionBank';
import { filterTrainableQuestionsForRegion, isQuestionTrainable, isTrainableP3Question } from '../src/lib/questionTraining';
import {
  filterCourseExamQuestions,
  filterCourseTopicExamQuestions,
  readableRoutingTopicLabel,
  seedTopicForCourseQuestion,
} from '../src/lib/courseExamTraining';
import { REQUIRED_STATIC_STUDY_PAGE_PATHS, STATIC_STUDY_PAGE_ROUTES } from '../src/lib/staticStudyRoutes';
import { STUDY_TOPICS, type StudyTopic } from '../src/lib/topicStudy';
import { getTeachingSnippetsForRegion, normalizeTeachingSnippetsData, reviewedTeachingSnippets, type TeachingSnippet } from '../src/lib/teachingSnippets';
import { P3_ASTRAL_ACADEMY } from '../src/lib/worldMap';
import type { NormalizedQuestion, RegionDefinition } from '../src/types';

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
}

interface TopicContext {
  topic: StudyTopic;
  region: RegionDefinition;
  fieldGuideTopics: FieldGuideTopic[];
  groups: SkillChecklistTopicGroup[];
  questions: NormalizedQuestion[];
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
  'teacher dashboard',
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
  [/\bAlgebra Vault\b/g, 'Algebra'],
  [/\bAlgebra Forge\b/g, 'Algebra'],
  [/\bLogarithm Observatory\b/g, 'Logarithms'],
  [/\bLogarithm Grove\b/g, 'Logarithms'],
  [/\bTrigonometry Spire\b/g, 'Trigonometry'],
  [/\bTrig Observatory\b/g, 'Trigonometry'],
  [/\bArgand Atrium\b/g, 'Complex Numbers / Argand Diagrams'],
  [/\bComplex Harbor\b/g, 'Complex Numbers / Argand Diagrams'],
  [/\bCalculus Cliffs\b/g, 'Calculus'],
  [/\bIntegral Terraces\b/g, 'Integration'],
  [/\bIntegration Gardens\b/g, 'Integration'],
  [/\bVectors Gate\b/g, 'Vectors'],
  [/\bVector Workshop\b/g, 'Vectors'],
  [/\bIteration Forge\b/g, 'Numerical Methods / Iteration'],
  [/\bNumerical Mines\b/g, 'Numerical Methods / Iteration'],
  [/\bDifferential Shrine\b/g, 'Differential Equations'],
];

const publicAssetExclusions = [
  /^404\.html$/,
  /^data(?:\/|$)/i,
  /^assets\/exam-bank-data\/[^/]+\.json$/i,
  /^assets\/avatar/i,
  /^assets\/guardian-art(?:\/|$)/i,
  /^assets\/region-art(?:\/|$)/i,
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

function seedCourseTopicsIndexPagePath(course: CourseMetadata): string {
  return `${course.slug}/topics/index.html`;
}

function seedTopicPagePath(course: CourseMetadata, topic: CourseSeedTopic): string {
  return `${course.slug}/topics/${topic.slug}/index.html`;
}

function seedFieldGuidePagePath(course: CourseMetadata, topic: CourseSeedTopic): string {
  return `${course.slug}/topics/${topic.slug}/field-guide/index.html`;
}

function seedFieldGuideSubtopicSlug(section: CourseSeedTopicSection): string {
  return section.title
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/\band\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function seedFieldGuideSubtopicPagePath(course: CourseMetadata, topic: CourseSeedTopic, section: CourseSeedTopicSection): string {
  return `${course.slug}/topics/${topic.slug}/field-guide/${seedFieldGuideSubtopicSlug(section)}/index.html`;
}

function seedFieldGuideSubtopicAliasPagePaths(course: CourseMetadata, topic: CourseSeedTopic, section: CourseSeedTopicSection): string[] {
  if (course.id === 'p1' && topic.id === 'p1-coordinate-geometry' && section.id === 'p1-coordinate-geometry-intersections') {
    return [`${course.slug}/topics/${topic.slug}/field-guide/intersections/index.html`];
  }
  return [];
}

function seedPracticePagePath(course: CourseMetadata, topic: CourseSeedTopic): string {
  return seedSkillCheckPagePath(course, topic);
}

function seedSkillCheckPagePath(course: CourseMetadata, topic: CourseSeedTopic): string {
  return `${course.slug}/topics/${topic.slug}/skill-check/index.html`;
}

function seedPracticeCompatibilityPagePath(course: CourseMetadata, topic: CourseSeedTopic): string {
  return `${course.slug}/topics/${topic.slug}/practice/index.html`;
}

function seedTopicExamTrainingPagePath(course: CourseMetadata, topic: CourseSeedTopic): string {
  return `${course.slug}/topics/${topic.slug}/exam-training/index.html`;
}

function seedExamTrainingPagePath(course: CourseMetadata): string {
  return `${course.slug}/exam-training/index.html`;
}

function p3TopicsIndexPagePath(): string {
  return `${P3_COURSE_ID}/topics/index.html`;
}

function topicPagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/index.html`;
}

function legacyTopicPagePath(topic: StudyTopic): string {
  return `topics/${topic.slug}/index.html`;
}

function fieldGuidePagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/field-guide/index.html`;
}

function legacyFieldGuidePagePath(topic: StudyTopic): string {
  return `topics/${topic.slug}/field-guide/index.html`;
}

function practicePagePath(topic: StudyTopic): string {
  return skillCheckPagePath(topic);
}

function skillCheckPagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/skill-check/index.html`;
}

function practiceCompatibilityPagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/practice/index.html`;
}

function legacyPracticePagePath(topic: StudyTopic): string {
  return `topics/${topic.slug}/practice/index.html`;
}

function legacySkillCheckPagePath(topic: StudyTopic): string {
  return `topics/${topic.slug}/skill-check/index.html`;
}

function topicExamTrainingPagePath(topic: StudyTopic): string {
  return `${P3_COURSE_ID}/topics/${topic.slug}/exam-training/index.html`;
}

function legacyTopicExamTrainingPagePath(topic: StudyTopic): string {
  return `topics/${topic.slug}/exam-training/index.html`;
}

function routeLink(fromPagePath: string, targetPagePath: string, label: string, className?: string): string {
  return `<a${className ? ` class="${className}"` : ''} href="${hrefToPage(fromPagePath, targetPagePath)}">${escapeHtml(label)}</a>`;
}

function regionForTopic(topic: StudyTopic): RegionDefinition {
  const region = P3_ASTRAL_ACADEMY.regions.find((candidate) => candidate.id === topic.regionId);
  if (!region) throw new Error(`Missing region for topic ${topic.slug}`);
  return region;
}

function topicContext(topic: StudyTopic, data: StaticSiteData): TopicContext {
  const region = regionForTopic(topic);
  const fieldGuideTopics = getFieldGuideTopicsForRegion(region.id);
  const teachingSnippets = getTeachingSnippetsForRegion(data.teachingSnippets, P3_ASTRAL_ACADEMY.paperFamily, region);
  const generatedPractice = getGeneratedPracticeForRegion(data.generatedPractice, region.id, P3_ASTRAL_ACADEMY.paperFamily);
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
  const activeCourseId = active === 'p3-topics' || active === 'p3-exam-training' ? P3_COURSE_ID : active;
  const currentCourse = COURSES.find((course) => course.id === activeCourseId);
  const items = active === 'courses'
    ? [{ key: 'courses', label: 'Courses', path: 'index.html' }]
    : [
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
        <span class="brand-mark" aria-hidden="true">A</span>
        <span>
          <strong>Asterion Study</strong>
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

function progressList(regionId: string, fieldGuideTotal: number): string {
  return `
    <ul class="progress-list" aria-label="Local progress">
      <li><span data-progress-field-guide="${escapeAttr(regionId)}" data-total="${fieldGuideTotal}" data-label="Field Guide">Field Guide: 0/${fieldGuideTotal}</span></li>
      <li><span data-progress-skill="${escapeAttr(regionId)}" data-label="Skill Check">Skill Check: 0 saved</span></li>
      <li><span data-progress-exam="${escapeAttr(regionId)}" data-label="Exam questions">Exam questions: 0 saved</span></li>
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

function renderDraftNotice(extra = ''): string {
  void extra;
  return '';
}

function renderSeedTopicCard(fromPagePath: string, course: CourseMetadata, topic: CourseSeedTopic): string {
  const isFirstTopic = getSeedTopicsForCourse(course.id)[0]?.id === topic.id;
  const fieldGuidePath = seedFieldGuidePagePath(course, topic);
  return `
    <article class="topic-card">
      <a class="topic-card-main-link" href="${hrefToPage(fromPagePath, fieldGuidePath)}" aria-label="Start ${escapeAttr(topic.title)} Field Guide">
        <div class="topic-card-formula">${renderInlineFormula(topic.headerFormula)}</div>
        <div class="topic-card-heading">
          <div>
            <p class="eyebrow">${escapeHtml(topic.syllabusRef)}</p>
            <h2>${escapeHtml(topic.title)}</h2>
          </div>
          ${isFirstTopic ? '<span class="topic-status-chip">Start here</span>' : ''}
        </div>
        <p>${escapeHtml(topic.description)}</p>
        ${renderSeedReviewStatus(topic)}
        <span class="topic-card-arrow" aria-hidden="true">&#8594;</span>
      </a>
      <div class="topic-card-shortcuts" aria-label="${escapeAttr(topic.title)} shortcuts">
        ${routeLink(fromPagePath, seedPracticePagePath(course, topic), 'Skill Check', 'text-link')}
        ${routeLink(fromPagePath, seedTopicExamTrainingPagePath(course, topic), 'Exam', 'text-link')}
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

function renderSeedFormulaList(topic: CourseSeedTopic): string {
  return `
    <ul class="formula-list">
      ${topic.formulas.map((formula) => `<li>${renderMathText(formula)}</li>`).join('')}
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

interface GuidedStudyPhase {
  id: string;
  label: string;
  title: string;
  eyebrow: string;
  body: string;
}

interface SeedSubtopicDetails {
  goal: string;
  method: string;
  example: string;
  mistake: string;
  takeaway: string;
  prompt: string;
  formulaCues: string[];
  workedExampleLines: string[];
  tryScaffold: string[];
  tryWorkedLines: string[];
  tryResult: string;
}

function stripSeedSupportPrefix(value: string | undefined): string {
  return cleanVisibleCopy(String(value ?? '')
    .replace(/^(?:Learning goal|Key method|Draft worked example|Worked example|Common mistake|Quick takeaway|Practice prompt|Draft\/generated practice|Skill Check):\s*/i, ''))
    .trim();
}

function labeledSeedBullet(section: CourseSeedTopicSection, labels: string[]): string {
  const match = section.bullets.find((bullet) => {
    const normalized = bullet.toLowerCase();
    return labels.some((label) => normalized.startsWith(`${label.toLowerCase()}:`));
  });
  return stripSeedSupportPrefix(match);
}

function seedSubtopicDetails(section: CourseSeedTopicSection, topic: CourseSeedTopic, index: number): SeedSubtopicDetails {
  const fallbackBullet = (offset: number) => stripSeedSupportPrefix(section.bullets[offset]);
  return {
    goal: labeledSeedBullet(section, ['Learning goal']) || cleanVisibleCopy(section.purpose),
    method: labeledSeedBullet(section, ['Key method']) || fallbackBullet(0) || topic.workedMethod[0] || '',
    example: labeledSeedBullet(section, ['Draft worked example', 'Worked example']) || fallbackBullet(1) || topic.selfChecks[index % Math.max(1, topic.selfChecks.length)] || '',
    mistake: labeledSeedBullet(section, ['Common mistake']) || topic.commonMistakes[index % Math.max(1, topic.commonMistakes.length)] || '',
    takeaway: labeledSeedBullet(section, ['Quick takeaway']) || section.purpose || '',
    prompt: section.tryPrompt || stripSeedSupportPrefix(section.practicePrompts?.[0]) || topic.selfChecks[index % Math.max(1, topic.selfChecks.length)] || topic.practiceHook,
    formulaCues: section.formulaCues ?? [],
    workedExampleLines: section.workedExampleLines ?? [],
    tryScaffold: section.tryScaffold ?? [],
    tryWorkedLines: section.tryWorkedLines ?? [],
    tryResult: section.tryResult ?? '',
  };
}

function seedSubtopicDisplayTitle(topic: CourseSeedTopic, section: CourseSeedTopicSection): string {
  if (topic.id === 'p1-series' && section.title === 'Arithmetic progressions') return 'AP terms and sums';
  if (topic.id === 'p1-series' && section.title === 'Geometric progressions') return 'GP terms and sums';
  return section.title;
}

function renderP1FieldGuideSubtopicNav(
  course: CourseMetadata,
  topic: CourseSeedTopic,
  fromPagePath: string,
  currentSectionId?: string,
): string {
  return `
    <nav class="field-guide-subtopic-nav" aria-label="${escapeAttr(topic.title)} subtopics">
      ${topic.fieldGuideSections.map((section) => {
        const isCurrent = section.id === currentSectionId;
        return `<a class="subtopic-nav-link${isCurrent ? ' is-current' : ''}" href="${hrefToPage(fromPagePath, seedFieldGuideSubtopicPagePath(course, topic, section))}"${isCurrent ? ' aria-current="page"' : ''}>${escapeHtml(seedSubtopicDisplayTitle(topic, section))}</a>`;
      }).join('')}
    </nav>
  `;
}

function renderMethodList(lines: string[]): string {
  return `
    <ol class="worked-list compact-worked-list">
      ${lines.filter(Boolean).map((line) => `<li>${renderMathText(line)}</li>`).join('')}
    </ol>
  `;
}

function renderFormulaCueBlock(cues: string[]): string {
  if (!cues.length) return '';
  return `
    <aside class="formula-cue-block" aria-label="Formula cue">
      <p class="eyebrow">Formula cue</p>
      <ul class="formula-chip-list single-formula-list">
        ${cues.map((cue) => `<li>${renderMathText(cue)}</li>`).join('')}
      </ul>
    </aside>
  `;
}

function renderSeedWorkedExamplesCard(topic: CourseSeedTopic): string {
  const examples = topic.fieldGuideSections.slice(0, 3).map((section, index) => ({
    section,
    details: seedSubtopicDetails(section, topic, index),
  }));
  return `
    <article class="summary-card worked-example-summary">
      <h2>Worked examples</h2>
      <div class="worked-example-summary-list">
        ${examples.map(({ section, details }, index) => `
          <section class="mini-worked-example">
            <p class="eyebrow">Example ${index + 1}</p>
            <h3>${escapeHtml(seedSubtopicDisplayTitle(topic, section))}</h3>
            <p class="prompt">${renderMathText(details.example)}</p>
            ${renderMethodList([details.method])}
            <p class="result"><strong>Answer/check:</strong> ${renderMathText(details.takeaway)}</p>
          </section>
        `).join('')}
      </div>
    </article>
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

function renderGuidedStudyPhaseList(items: string[], ordered = false): string {
  const tag = ordered ? 'ol' : 'ul';
  const className = ordered ? 'worked-list guided-study-list' : 'plain-list guided-study-list';
  return `
    <${tag} class="${className}">
      ${items.map((item) => `<li>${renderMathText(item)}</li>`).join('')}
    </${tag}>
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

function p1SkillCheckGroupIdForSection(course: CourseMetadata, section: CourseSeedTopicSection): string | undefined {
  if (course.id !== 'p1') return undefined;
  return getP1SkillCheckGroup(section.id) ? section.id : undefined;
}

function renderSeedSubtopicPanel(
  course: CourseMetadata,
  topic: CourseSeedTopic,
  section: CourseSeedTopicSection,
  index: number,
  practicePath: string,
  fromPagePath: string,
): string {
  const details = seedSubtopicDetails(section, topic, index);
  const nextSection = topic.fieldGuideSections[index + 1];
  const nextTitle = nextSection ? seedSubtopicDisplayTitle(topic, nextSection) : '';
  const nextHref = nextSection
    ? course.id === 'p1'
      ? hrefToPage(fromPagePath, seedFieldGuideSubtopicPagePath(course, topic, nextSection))
      : `#${escapeAttr(nextSection.id)}`
    : '';
  return `
    <div class="show-try-panel">
      <section class="worked-example-block">
        <p class="eyebrow">Worked example</p>
        <p class="prompt">${renderMathText(details.example)}</p>
        ${renderFormulaCueBlock(details.formulaCues)}
        ${renderMethodList(details.workedExampleLines.length ? details.workedExampleLines : [details.method])}
        <p class="result"><strong>Check:</strong> ${renderMathText(details.takeaway)}</p>
      </section>
      <section class="try-similar-block">
        <p class="eyebrow">Try a similar one</p>
        <h4>${renderMathText(details.prompt)}</h4>
        ${details.tryScaffold.length ? renderGuidedStudyPhaseList(details.tryScaffold) : ''}
        <details>
          <summary>${details.tryWorkedLines.length ? 'Reveal/check the worked route' : 'Reveal/check the method'}</summary>
          ${details.tryWorkedLines.length
            ? `<ol class="worked-list">${details.tryWorkedLines.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>`
            : `<p><strong>Use:</strong> ${renderMathText(details.method)}</p>`}
          ${details.tryResult ? `<p><strong>Final answer:</strong> ${renderMathText(details.tryResult)}</p>` : ''}
          <p><strong>Watch for:</strong> ${renderMathText(details.mistake)}</p>
        </details>
      </section>
      <section class="exam-tip-block">
        <p><strong>Exam tip:</strong> ${renderMathText(topic.examStyle[index % Math.max(1, topic.examStyle.length)] ?? details.goal)}</p>
      </section>
      <footer class="move-forward-block">
        ${nextSection ? `<a class="button secondary-button" href="${nextHref}">Next subtopic: ${escapeHtml(nextTitle)}</a>` : ''}
        ${renderSkillCheckTransition(fromPagePath, practicePath, p1SkillCheckGroupIdForSection(course, section))}
      </footer>
    </div>
  `;
}

function guidedStudyPhases(course: CourseMetadata, topic: CourseSeedTopic, practicePath: string, fromPagePath: string): GuidedStudyPhase[] {
  return topic.fieldGuideSections.map((section, index) => ({
    id: section.id,
    label: seedSubtopicDisplayTitle(topic, section),
    title: seedSubtopicDisplayTitle(topic, section),
    eyebrow: `Subtopic ${index + 1} of ${topic.fieldGuideSections.length}`,
    body: renderSeedSubtopicPanel(course, topic, section, index, practicePath, fromPagePath),
  }));
}

function renderGuidedStudy(
  course: CourseMetadata,
  topic: CourseSeedTopic,
  practicePath: string,
  examTrainingPath: string,
  fromPagePath = seedTopicPagePath(course, topic),
): string {
  void examTrainingPath;
  const phases = guidedStudyPhases(course, topic, practicePath, fromPagePath);
  return `
    <section class="guided-study-card" data-guided-study data-practice-href="${hrefToPage(fromPagePath, practicePath)}" aria-labelledby="guided-study-title">
      <div class="guided-study-header">
        <div>
          <p class="eyebrow">Field Guide</p>
          <h2 id="guided-study-title">Learn ${escapeHtml(topic.shortTitle)} by subtopic</h2>
          <p>See one worked example, try a similar one, then move to the next skill.</p>
        </div>
        <span class="guided-study-progress" data-guided-progress aria-live="polite">1 of ${phases.length}</span>
      </div>
      <details class="phase-jump-details">
        <summary>Choose another subtopic</summary>
        <div class="phase-tab-list" role="tablist" aria-label="${escapeAttr(topic.title)} study phases">
          ${phases.map((phase, index) => `
            <button
              class="phase-tab${index === 0 ? ' is-active' : ''}"
              type="button"
              id="phase-tab-${escapeAttr(topic.slug)}-${escapeAttr(phase.id)}"
              role="tab"
              aria-selected="${index === 0 ? 'true' : 'false'}"
              aria-controls="phase-panel-${escapeAttr(topic.slug)}-${escapeAttr(phase.id)}"
              data-phase-tab="${escapeAttr(phase.id)}"
              data-phase-index="${index}"
            >${escapeHtml(phase.label)}</button>
          `).join('')}
        </div>
      </details>
      <div class="phase-panel-stack">
        ${phases.map((phase, index) => `
          <article
            class="phase-panel${index === 0 ? ' is-active' : ''}"
            id="phase-panel-${escapeAttr(topic.slug)}-${escapeAttr(phase.id)}"
            role="tabpanel"
            aria-labelledby="phase-tab-${escapeAttr(topic.slug)}-${escapeAttr(phase.id)}"
            data-phase-panel="${escapeAttr(phase.id)}"
          >
            <p class="eyebrow">${escapeHtml(phase.eyebrow)}</p>
            <h3>${escapeHtml(phase.title)}</h3>
            ${phase.body}
          </article>
        `).join('')}
      </div>
      <div class="guided-study-footer">
        <button class="button secondary-button" type="button" data-guided-prev disabled>Back</button>
        <button class="button primary-button" type="button" data-guided-next>Next subtopic</button>
      </div>
    </section>
    <noscript>
      <p class="empty-state">JavaScript is off, so all Field Guide subtopics remain readable. Use the Skill Check button when you are ready.</p>
    </noscript>
  `;
}

function renderSeedReviewStatus(topic: CourseSeedTopic): string {
  void topic;
  return '';
}

function renderP1FieldGuideLandingPage(course: CourseMetadata, topic: CourseSeedTopic): string {
  const pagePath = seedFieldGuidePagePath(course, topic);
  const firstSection = topic.fieldGuideSections[0];
  const firstSubtopicPath = firstSection ? seedFieldGuideSubtopicPagePath(course, topic, firstSection) : seedPracticePagePath(course, topic);
  const body = `
    ${renderHero(
      `${topic.title} Field Guide`,
      'Use this overview to choose one small skill, then open the matching lesson.',
      undefined,
      `${routeLink(pagePath, seedCourseTopicsIndexPagePath(course), 'Back to topics', 'button secondary-button')}
      ${routeLink(pagePath, firstSubtopicPath, firstSection ? `Start: ${seedSubtopicDisplayTitle(topic, firstSection)}` : 'Try 3 quick questions', 'button primary-button')}`,
      `${course.shortName} Field Guide`,
    )}
    <section class="topic-overview-grid field-guide-overview-grid field-guide-overview-only">
      ${renderKnowledgeCard(topic.formulas, topic.keyIdeas, topic.headerFormula)}
      <article class="summary-card subtopic-nav-card">
        <h2>Choose a subtopic</h2>
        ${renderP1FieldGuideSubtopicNav(course, topic, pagePath)}
      </article>
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} ${topic.title} Field Guide`,
    description: `Field Guide overview for ${topic.title}.`,
    active: course.id,
    body,
  });
}

function renderP1FieldGuideSubtopicPage(
  course: CourseMetadata,
  topic: CourseSeedTopic,
  section: CourseSeedTopicSection,
  index: number,
): string {
  const pagePath = seedFieldGuideSubtopicPagePath(course, topic, section);
  const practicePath = seedPracticePagePath(course, topic);
  const title = seedSubtopicDisplayTitle(topic, section);
  const body = `
    ${renderHero(
      title,
      `${topic.title}: one worked example, one similar try, then a short Skill Check.`,
      undefined,
      routeLink(pagePath, seedFieldGuidePagePath(course, topic), 'Field Guide overview', 'button secondary-button'),
      `${course.shortName} subtopic`,
    )}
    <section class="subtopic-lesson-shell" aria-labelledby="subtopic-lesson-title">
      <div class="subtopic-lesson-header">
        <div>
          <p class="eyebrow">Subtopic ${index + 1} of ${topic.fieldGuideSections.length}</p>
          <h2 id="subtopic-lesson-title">${escapeHtml(title)}</h2>
        </div>
        ${renderP1FieldGuideSubtopicNav(course, topic, pagePath, section.id)}
      </div>
      ${renderSeedSubtopicPanel(course, topic, section, index, practicePath, pagePath)}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} ${topic.title}: ${title}`,
    description: `${title} Field Guide lesson.`,
    active: course.id,
    body,
  });
}

function renderOptionalList(title: string, items: string[] | undefined, className = 'plain-list'): string {
  if (!items?.length) return '';
  return `
    <div class="support-details">
      <h4>${escapeHtml(title)}</h4>
      ${renderPlainList(items, className)}
    </div>
  `;
}

function renderSeedVisualTemplates(templates: CourseSeedVisualTemplate[] | undefined): string {
  if (!templates?.length) return '';
  return `
    <div class="visual-template-grid" aria-label="Instructional visual templates">
      ${templates.map((template) => `
        <article class="visual-template-card" id="${escapeAttr(template.id)}">
          <div class="visual-template-copy">
            <p class="eyebrow">Diagram</p>
            <h4>${escapeHtml(template.title)}</h4>
            <p>${escapeHtml(template.explanation)}</p>
          </div>
          <div class="visual-template-figure">
            ${template.svg}
          </div>
          <p class="visual-template-notice"><strong>Notice:</strong> ${escapeHtml(template.notice)}</p>
          <div class="visual-template-supports">
            <h5>Supports</h5>
            <ul>
              ${template.supports.map((support) => `<li>${escapeHtml(support)}</li>`).join('')}
            </ul>
          </div>
        </article>
      `).join('')}
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

function renderSkillCheckHero(title: string, courseShortName: string): string {
  return `
    <section class="page-hero skill-check-hero">
      <div>
        <p class="eyebrow">${escapeHtml(courseShortName)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>Try 3 quick questions.</p>
      </div>
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
    label: 'Field Guide',
    text: 'Study the method and decision points before attempting exam-style work.',
  },
  {
    label: 'Skill Check',
    text: 'Check one skill at a time so support practice does not pretend to be exam mastery.',
  },
  {
    label: 'Exam Training',
    text: 'Move into source question images when the written route is ready.',
  },
  {
    label: 'Review',
    text: 'Use mark-scheme review and gap checks before another attempt.',
  },
] as const;

function homepagePrimaryCourse(): CourseMetadata {
  return COURSES.find((course) => course.id === P3_COURSE_ID) ?? COURSES[0];
}

function homepageCourseCta(course: CourseMetadata): string {
  if (course.id === P3_COURSE_ID) return 'Start with P3';
  return `View ${course.shortName} support`;
}

function homepageCourseMaturity(course: CourseMetadata): string {
  if (course.id === P3_COURSE_ID) return 'Most complete Asterion path';
  return 'Early support';
}

function homepageTopicPreviewText(course: CourseMetadata, count: number): string {
  return course.topics.slice(0, count).map((topic) => topic.title).join(', ');
}

function homepageCourseSummary(course: CourseMetadata, featured: boolean): string {
  if (featured) return 'Full method-first Field Guide, Skill Check, Exam Training, and review flow for the most developed Asterion course.';
  return 'Early topic notes and navigation support while this course is expanded and reviewed.';
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
        <span aria-hidden="true">Target</span>
        <strong>Recommended first click: ${escapeRawHtml(`${course.shortName} ${course.displayName}`)}</strong>
      </div>
    </div>
  `;
}

function renderHomepageCourseCard(fromPagePath: string, course: CourseMetadata, featured = false): string {
  const statusPillClass = featured ? 'course-status-pill course-status-pill-primary' : 'course-status-pill';
  const topicCount = featured ? 5 : 3;
  return `
    <a class="course-card${featured ? ' course-card-featured' : ''} course-status-${escapeRawAttr(course.status)}" href="${hrefToPage(fromPagePath, coursePagePath(course))}" aria-label="Open ${escapeRawAttr(course.displayName)}">
      ${featured ? '<span class="homepage-primary-label">Recommended starting path</span>' : ''}
      <div class="course-card-header-row">
        <span class="course-code-badge">${escapeRawHtml(course.shortName)}</span>
        <div>
          <span class="${statusPillClass}">${escapeRawHtml(homepageCourseMaturity(course))}</span>
          <h2>${escapeRawHtml(course.displayName)}</h2>
        </div>
      </div>
      <p class="course-card-lede">${escapeRawHtml(homepageCourseSummary(course, featured))}</p>
      ${featured ? `<p class="homepage-primary-reason">Start here if you want the complete Asterion loop. Includes ${escapeRawHtml(homepageTopicPreviewText(course, topicCount))}.</p>` : ''}
      ${featured ? '' : '<p class="course-card-status-copy">Support only: useful for orientation, not a fully reviewed course path yet.</p>'}
      <span class="course-launch-cta${featured ? ' course-launch-cta-primary' : ' course-launch-cta-secondary'}">${escapeRawHtml(homepageCourseCta(course))} <span aria-hidden="true">&#8594;</span></span>
    </a>
  `;
}

function renderCourseSelectorPage(): string {
  const pagePath = 'index.html';
  const p3Course = homepagePrimaryCourse();
  const supportCourses = COURSES.filter((course) => course.id !== p3Course.id);
  const body = `
    <section class="page-hero course-selector-hero">
      <div class="hero-copy">
        <p class="eyebrow">CAIE 9709 training system</p>
        <h1>CAIE 9709 practice that starts from the method, not the mark scheme.</h1>
        <p>Asterion sends you through Field Guide, Skill Check, and Exam Training so P3 practice starts with the route you would write, then checks it against real question images and review.</p>
        <a class="button primary-button homepage-recommended-action" href="${hrefToPage(pagePath, coursePagePath(p3Course))}">Start with P3 training <span aria-hidden="true">&#8594;</span></a>
      </div>
      ${renderHomepageLoopPanel(p3Course)}
    </section>
    <section class="homepage-course-layout" aria-label="Available CAIE 9709 courses">
      ${renderHomepageCourseCard(pagePath, p3Course, true)}
      <section class="homepage-support-section" aria-labelledby="homepage-support-title">
        <div class="homepage-support-heading">
          <h2 id="homepage-support-title">Early support courses</h2>
          <p>P1, M1, and S1 stay available for orientation and early support, but P3 is the recommended full-flow path.</p>
        </div>
        <div class="course-grid course-support-grid" aria-label="Early support CAIE 9709 courses">
          ${supportCourses.map((course) => renderHomepageCourseCard(pagePath, course)).join('')}
        </div>
      </section>
    </section>
    <section class="homepage-status-section" aria-labelledby="homepage-status-title">
      <p class="eyebrow">Status today</p>
      <h2 id="homepage-status-title">P3 is the most developed Asterion path today.</h2>
      <p>P1, M1, and S1 are available as early support while their coverage is expanded and reviewed.</p>
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'CAIE 9709 Study Hub',
    description: 'Static CAIE 9709 study hub course selector.',
    active: 'courses',
    body,
  });
}

function renderCourseDashboardPage(course: CourseMetadata): string {
  const pagePath = coursePagePath(course);
  const isP3 = course.id === P3_COURSE_ID;
  const seedTopics = getSeedTopicsForCourse(course.id);
  const hasSeedContent = hasDraftSeedTopics(course.id);
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
    : seedTopics.map((topic) => `
      <a class="course-topic-button" href="${hrefToPage(pagePath, seedFieldGuidePagePath(course, topic))}" aria-label="Start ${escapeAttr(topic.title)} Field Guide">
        <span class="topic-card-title">${escapeHtml(topic.title)}</span>
        <small>${escapeHtml(topic.syllabusRef)}</small>
        <span class="topic-card-formula">${renderMathText(`$${topic.headerFormula}$`)}</span>
        ${seedTopics[0]?.id === topic.id ? '<span class="topic-status-chip">Start here</span>' : ''}
        <span class="topic-card-arrow" aria-hidden="true">&#8594;</span>
      </a>
    `).join('');
  const body = `
    <section class="page-hero course-dashboard-hero">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(course.examComponentLabel)}</p>
        <h1>${escapeHtml(`${course.shortName}: ${course.displayName}`)}</h1>
        <p>${escapeHtml(course.shortDescription)}</p>
      </div>
      ${renderCourseMathVisual()}
    </section>
    <section class="summary-card course-topic-list" aria-labelledby="course-topic-list-title" id="course-topics">
      <div>
        <h2 id="course-topic-list-title">Choose a topic</h2>
        <p>${hasSeedContent && !isP3 ? 'Starter notes: check your class syllabus or teacher guidance for final coverage.' : 'Start with one topic. The Field Guide opens first.'}</p>
      </div>
      <div class="course-topic-button-grid">
        ${topicButtons || '<p class="empty-state">Topic pages are coming soon.</p>'}
      </div>
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName}: ${course.displayName}`,
    description: `${course.shortName} course dashboard for the static CAIE 9709 study hub.`,
    active: course.id,
    body,
  });
}

function renderP3TopicsIndexPage(
  data: StaticSiteData,
  pagePath = p3TopicsIndexPagePath(),
  examTrainingPath = `${P3_COURSE_ID}/exam-training/index.html`,
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
        <p class="eyebrow">Ready for exam questions?</p>
        <h2>Exam Training</h2>
        <p>Use this after a topic or when you want one mixed Paper 3 question.</p>
      </div>
      <div class="exam-stats">
        <span data-total-attempts>0 saved Paper 3 attempts</span>
        <span data-topic-tried-count>0 topic areas tried</span>
      </div>
      ${routeLink(pagePath, examTrainingPath, 'Open Exam Training', 'button secondary-button')}
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

function renderSeedTopicsIndexPage(course: CourseMetadata): string {
  const pagePath = seedCourseTopicsIndexPagePath(course);
  const topics = getSeedTopicsForCourse(course.id);
  const firstTopic = topics[0];
  const body = `
    ${renderHero(
      `${course.shortName} Topics`,
      'Choose one topic. Start with the Field Guide, then try a short Skill Check.',
      firstTopic?.headerFormula,
      `${firstTopic ? routeLink(pagePath, seedFieldGuidePagePath(course, firstTopic), `Start ${firstTopic.shortTitle}`, 'button primary-button') : ''}`,
      course.examComponentLabel,
    )}
    <p class="starter-note">Starter notes: check your class syllabus or teacher guidance for final coverage.</p>
    <section class="section-heading" id="topic-list">
      <div>
        <h2>Choose a topic</h2>
        <p>Start with the topic your class is covering now. The first topic is a sensible starting point if you are unsure.</p>
      </div>
    </section>
    <section class="topic-grid" aria-label="${escapeAttr(course.shortName)} topic pages">
      ${topics.map((topic) => renderSeedTopicCard(pagePath, course, topic)).join('')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} Topics`,
    description: `Topic pages for ${course.displayName}.`,
    active: course.id,
    body,
  });
}

function renderSeedTopicHubPage(course: CourseMetadata, topic: CourseSeedTopic): string {
  const pagePath = seedTopicPagePath(course, topic);
  const fieldGuidePath = seedFieldGuidePagePath(course, topic);
  const practicePath = seedPracticePagePath(course, topic);
  const examTrainingPath = seedTopicExamTrainingPagePath(course, topic);
  const body = `
    ${renderHero(
      `${topic.title} Study`,
      topic.description,
      topic.headerFormula,
      `${routeLink(pagePath, fieldGuidePath, 'Start Field Guide', 'button primary-button')}
      ${routeLink(pagePath, practicePath, 'Skill Check', 'button text-button')}
      ${routeLink(pagePath, examTrainingPath, 'Exam Training', 'button text-button')}`,
      `${course.shortName} ${topic.syllabusRef}`,
    )}
    <p class="micro-win">You’re in. We’ll take this one step at a time.</p>
    <section class="topic-overview-grid">
      ${renderKnowledgeCard(topic.formulas, topic.keyIdeas, topic.headerFormula)}
      ${renderSeedWorkedExamplesCard(topic)}
    </section>
    ${renderGuidedStudy(course, topic, practicePath, examTrainingPath, pagePath)}
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} ${topic.title}`,
    description: topic.description,
    active: course.id,
    body,
  });
}

function renderSeedFieldGuidePage(course: CourseMetadata, topic: CourseSeedTopic): string {
  if (course.id === 'p1') return renderP1FieldGuideLandingPage(course, topic);

  const pagePath = seedFieldGuidePagePath(course, topic);
  const practicePath = seedPracticePagePath(course, topic);
  const examTrainingPath = seedTopicExamTrainingPagePath(course, topic);
  const body = `
    ${renderHero(
      `${topic.title} Field Guide`,
      'Learn one idea at a time, then try a short Skill Check.',
      topic.headerFormula,
      `${routeLink(pagePath, seedCourseTopicsIndexPagePath(course), 'Back to topics', 'button secondary-button')}
      ${routeLink(pagePath, practicePath, 'Try 3 quick questions', 'button primary-button')}`,
      `${course.shortName} Field Guide`,
    )}
    <section class="topic-overview-grid field-guide-overview-grid">
      ${renderKnowledgeCard(topic.formulas, topic.keyIdeas, topic.headerFormula)}
      ${renderSeedWorkedExamplesCard(topic)}
    </section>
    ${renderGuidedStudy(course, topic, practicePath, examTrainingPath, pagePath)}
    <section class="next-step-card">
      <h2>Next step</h2>
      <p>Ready to leave the Field Guide and check the method?</p>
      ${renderSkillCheckTransition(pagePath, practicePath)}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} ${topic.title} Field Guide`,
    description: `Field Guide for ${topic.title}.`,
    active: course.id,
    body,
  });
}

function renderSeedPracticePage(
  course: CourseMetadata,
  topic: CourseSeedTopic,
  data?: StaticSiteData,
  pagePath = seedPracticePagePath(course, topic),
): string {
  const examTrainingPath = seedTopicExamTrainingPagePath(course, topic);
  const availableExamQuestions = data ? filterCourseTopicExamQuestions(data.catalogQuestions, course, topic).length : 0;
  const routedCatalogRecords = data ? filterCourseTopicExamQuestions(data.catalogRecords, course, topic).length : 0;
  const skillCheckItems = getSkillCheckItemsForCourseTopic(course.id, topic.id);
  const skillChecksMarkup = renderSeedDraftSkillChecks(course, topic);
  const isP1SkillCheckPage = course.id === 'p1' && skillCheckItems.length > 0;
  const firstSkillCheckTargetId = course.id === 'p1'
    ? getP1SkillCheckGroupsForTopic(topic.id)[0]?.groupId ?? 'skill-checks'
    : 'skill-checks';
  const heroActions = skillCheckItems.length
    ? `<a class="button primary-button" href="#${escapeAttr(firstSkillCheckTargetId)}">Start Skill Checks</a>
      ${routeLink(pagePath, seedTopicPagePath(course, topic), 'Topic overview', 'button secondary-button')}
      ${routeLink(pagePath, seedFieldGuidePagePath(course, topic), 'Review Field Guide', 'button secondary-button')}`
    : `${routeLink(pagePath, seedTopicPagePath(course, topic), 'Topic overview', 'button secondary-button')}
      ${routeLink(pagePath, seedFieldGuidePagePath(course, topic), 'Review Field Guide', 'button secondary-button')}`;
  const body = `
    ${isP1SkillCheckPage ? renderSkillCheckHero(topic.title, course.shortName) : renderHero(
      `${topic.title} ${skillCheckItems.length ? 'Skill Check' : 'Practice'}`,
      skillCheckItems.length
        ? 'Use these short checks to test the method before moving into exam-style questions.'
        : 'Use these prompts for quick self-checking before exam-style questions.',
      topic.headerFormula,
      heroActions,
      `${course.shortName} Skill Check`,
    )}
    <section class="practice-stack" data-one-card-flow data-topic-id="${escapeAttr(topic.id)}" data-flow-label="${isP1SkillCheckPage ? 'Question' : 'Skill Check'}" data-default-card-limit="3">
      ${skillChecksMarkup ? `${skillChecksMarkup}
      ` : ''}<article class="practice-topic">
        <header class="topic-section-header">
          <div>
            <p class="eyebrow">${escapeHtml(topic.syllabusRef)}</p>
            <h2>Starter self-check prompts</h2>
            <p>${escapeHtml(topic.practiceHook)}</p>
          </div>
        </header>
        <div class="practice-card-stack">
          ${topic.selfChecks.map((prompt, index) => `
            <article class="practice-card">
              <p class="eyebrow">Self-check ${index + 1}</p>
              <h3>${renderMathText(prompt)}</h3>
              <details>
                <summary>What to show in your working</summary>
                ${renderPlainList(topic.workedMethod.slice(0, 3))}
              </details>
            </article>
          `).join('')}
        </div>
      </article>${topic.genericPracticePrompts?.length ? `
        <article class="practice-topic">
          <header class="topic-section-header">
            <div>
              <p class="eyebrow">Extra practice</p>
              <h2>Prompt scaffolds</h2>
              <p>Use these directions to make your own quick questions before exam practice.</p>
            </div>
          </header>
          <div class="practice-card-stack">
            ${topic.genericPracticePrompts.map((prompt, index) => `
              <article class="practice-card">
                <p class="eyebrow">Prompt ${index + 1}</p>
                <h3>${renderMathText(prompt)}</h3>
                ${topic.visualRequirements?.length ? `
                  <details>
                    <summary>Visual setup to include</summary>
                    ${renderPlainList(topic.visualRequirements)}
                  </details>
                ` : ''}
              </article>
            `).join('')}
          </div>
        </article>
      ` : ''}
    </section>
    <section class="exam-question-section">
      <div class="section-heading">
        <div>
          <h2>Exam-style direction</h2>
          <p>${escapeHtml(topic.examTrainingHook)}</p>
        </div>
      </div>
      ${renderPlainList(topic.examStyle)}
      <p class="empty-state">${availableExamQuestions > 0
        ? `${availableExamQuestions} exam question${availableExamQuestions === 1 ? '' : 's'} available for this topic.`
        : routedCatalogRecords > 0
          ? 'No exam image is available for this topic yet.'
          : `No exam image is available for this topic yet.`}</p>
      ${routeLink(pagePath, examTrainingPath, 'One exam-style question', 'button primary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} ${topic.title} Skill Check`,
    description: `Skill Check for ${topic.title}.`,
    active: course.id,
    body,
    bodyClass: isP1SkillCheckPage ? 'skill-check-page' : undefined,
  });
}

function courseTrainingQuestions(data: StaticSiteData, course: CourseMetadata): NormalizedQuestion[] {
  const source = course.id === P3_COURSE_ID ? data.questions : data.catalogQuestions;
  return filterCourseExamQuestions(source, course);
}

function courseQuestionDisplayTopic(course: CourseMetadata, question: NormalizedQuestion): string {
  return seedTopicForCourseQuestion(course, question)?.title
    ?? readableRoutingTopicLabel(question)
    ?? cleanVisibleCopy(question.displayTopic)
    ?? course.displayName;
}

function courseQuestionReviewNote(course: CourseMetadata): string | undefined {
  if (course.id === P3_COURSE_ID) return undefined;
  return undefined;
}

function renderSeedExamTrainingPage(course: CourseMetadata, data: StaticSiteData): string {
  const pagePath = seedExamTrainingPagePath(course);
  const topics = getSeedTopicsForCourse(course.id);
  const questions = courseTrainingQuestions(data, course);
  const catalogRecords = filterCourseExamQuestions(data.catalogRecords, course);
  const mixedQuestions = questions.slice(0, 12);
  const body = `
    ${renderHero(
      `${course.shortName} Exam Training`,
      'Try one exam-style question at a time. Reveal the mark scheme only when you are ready.',
      topics[0]?.headerFormula,
      routeLink(pagePath, seedCourseTopicsIndexPagePath(course), `Back to ${course.shortName} topics`, 'button primary-button'),
      course.examComponentLabel,
    )}
    <section class="exam-question-section" id="mixed-questions">
      <div class="section-heading">
        <div>
          <h2>Mixed ${escapeHtml(course.shortName)} questions</h2>
          <p>Use these for focused paper practice.</p>
        </div>
      </div>
      <div class="exam-question-grid" data-exam-flow data-flow-label="${escapeAttr(course.shortName)} exam question">
        ${mixedQuestions.map((question) => renderExamQuestionCard(question, pagePath, {
          displayTopic: courseQuestionDisplayTopic(course, question),
          allowAttemptSave: false,
          reviewNote: courseQuestionReviewNote(course),
          reviewLinkPath: seedTopicForCourseQuestion(course, question)
            ? seedFieldGuidePagePath(course, seedTopicForCourseQuestion(course, question)!)
            : undefined,
        })).join('')}
      </div>
      ${mixedQuestions.length === 0 ? `<p class="empty-state">${catalogRecords.length
        ? 'No exam image is available for this course yet.'
        : 'No exam image is available for this course yet.'}</p>` : ''}
    </section>
    <section class="exam-callout compact-callout">
      <div>
        <p class="eyebrow">One question at a time</p>
        <h2>${questions.length} exam question${questions.length === 1 ? '' : 's'} available</h2>
        <p>Use the question image first, then reveal the mark scheme when you are ready to mark.</p>
      </div>
      ${questions.length ? '<a class="button primary-button" href="#mixed-questions">Start with mixed questions</a>' : ''}
    </section>
    <section class="exam-topic-dashboard" aria-label="${escapeAttr(course.shortName)} exam directions">
      <div class="section-heading">
        <div>
          <h2>Topic routes</h2>
          <p>Open a topic to focus your exam practice.</p>
        </div>
      </div>
      <div class="exam-topic-list">
        ${topics.map((topic) => {
          const topicQuestions = filterCourseTopicExamQuestions(data.catalogQuestions, course, topic);
          const topicRecords = filterCourseTopicExamQuestions(data.catalogRecords, course, topic);
          return `
          <article class="exam-topic-row">
            <div>
              <p class="eyebrow">${escapeHtml(topic.syllabusRef)}</p>
              <h3>${escapeHtml(topic.title)}</h3>
              <p>${topicQuestions.length > 0
                ? `${topicQuestions.length} exam question${topicQuestions.length === 1 ? '' : 's'} available.`
                : topicRecords.length > 0
                  ? 'No exam image is available for this topic yet.'
                  : 'No exam image is available for this topic yet.'}</p>
            </div>
            ${routeLink(pagePath, seedTopicExamTrainingPagePath(course, topic), 'Open topic questions', 'button secondary-button')}
          </article>
        `;
        }).join('')}
      </div>
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} Exam Training`,
    description: `Static Exam Training for ${course.displayName}.`,
    active: course.id,
    body,
  });
}

function renderSeedTopicExamTrainingPage(course: CourseMetadata, topic: CourseSeedTopic, data: StaticSiteData): string {
  const pagePath = seedTopicExamTrainingPagePath(course, topic);
  const questions = filterCourseTopicExamQuestions(data.catalogQuestions, course, topic).slice(0, 16);
  const catalogRecords = filterCourseTopicExamQuestions(data.catalogRecords, course, topic);
  const body = `
    ${renderHero(
      `${topic.title} Exam Training`,
      'Try one exam-style question at a time.',
      topic.headerFormula,
      `${routeLink(pagePath, seedExamTrainingPagePath(course), `Back to ${course.shortName} Exam Training`, 'button secondary-button')}
      ${routeLink(pagePath, seedTopicPagePath(course, topic), 'Topic overview', 'button text-button')}`,
      `${course.shortName} ${topic.syllabusRef}`,
    )}
    <section class="exam-question-section" id="topic-exam-questions">
      <div class="section-heading">
        <div>
          <h2>Exam questions</h2>
          <p>Work from the question image first, then reveal the mark scheme when you are ready.</p>
        </div>
      </div>
      <div class="exam-question-grid" data-exam-flow data-flow-label="${escapeAttr(topic.title)} exam question">
        ${questions.map((question) => renderExamQuestionCard(question, pagePath, {
          displayTopic: topic.title,
          displaySubtopic: readableRoutingTopicLabel(question),
          allowAttemptSave: false,
          reviewNote: courseQuestionReviewNote(course),
          reviewLinkPath: seedFieldGuidePagePath(course, topic),
        })).join('')}
      </div>
      ${questions.length === 0 ? `<p class="empty-state">${catalogRecords.length
        ? 'No exam image is available for this topic yet.'
        : `No exam image is available for this topic yet.`}</p>` : ''}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} ${topic.title} Exam Training`,
    description: `Static Exam Training images for ${topic.title}.`,
    active: course.id,
    body,
  });
}

function renderRegionsPage(data: StaticSiteData, pagePath = `${P3_COURSE_ID}/regions/index.html`): string {
  const contexts = STUDY_TOPICS.map((topic) => topicContext(topic, data));
  const body = `
    ${renderHero(
      'P3 topic links',
      'Choose a Paper 3 topic, then start with the Field Guide.',
      'f(x), \\log_a x, \\sin x, \\mathbf{r}=\\mathbf{a}+\\lambda\\mathbf{b}',
    )}
    <section class="topic-grid" aria-label="Paper 3 topic links">
      ${contexts.map((context) => renderTopicCard(pagePath, context)).join('')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'P3 Topic Links',
    description: 'Paper 3 topic links.',
    active: 'p3-topics',
    body,
  });
}

function renderCompatibilityPage(pagePath: string, title: string, canonicalPagePath: string): string {
  const body = `
    ${renderHero(
      title,
      'Use the current study page for this topic.',
      undefined,
      routeLink(pagePath, canonicalPagePath, 'Open study page', 'button primary-button'),
    )}
  `;
  return renderPage({
    pagePath,
    title,
    description: `${title} study page.`,
    active: title.includes('Exam Training') ? 'p3-exam-training' : 'p3-topics',
    body,
  });
}

function renderTopicHubPage(
  context: TopicContext,
  pagePath = topicPagePath(context.topic),
  fieldGuidePath = fieldGuidePagePath(context.topic),
  practicePath = practicePagePath(context.topic),
  examTrainingPath = topicExamTrainingPagePath(context.topic),
): string {
  const { topic, region, fieldGuideTopics, questions, groups } = context;
  const totalPracticeItems = groups.reduce((sum, group) => sum + totalSkillChecklistItems(group), 0);
  const body = `
    ${renderHero(
      `${topic.name} Study`,
      'Start with the Field Guide. If you already know the method, jump to the Skill Check or one exam question.',
      topic.headerFormula,
      `${routeLink(pagePath, fieldGuidePath, 'Start Field Guide', 'button primary-button')}
      ${routeLink(pagePath, practicePath, 'Skill Check', 'button secondary-button')}
      ${routeLink(pagePath, examTrainingPath, 'Exam Training', 'button text-button')}`,
    )}
    <p class="micro-win">Good choice. Start with one small idea.</p>
    ${renderStudyPath()}
    <section class="topic-overview-grid">
      <article class="summary-card">
        <h2>Your local progress</h2>
        ${progressList(region.id, Math.max(1, fieldGuideTopics.length))}
        <p data-progress-status="${escapeAttr(region.id)}">Progress is stored in this browser when JavaScript is available.</p>
      </article>
      <article class="summary-card">
        <h2>This topic includes</h2>
        <ul class="plain-list">
          <li>${fieldGuideTopics.length} Field Guide step${fieldGuideTopics.length === 1 ? '' : 's'}</li>
          <li>${totalPracticeItems} focused Skill Check item${totalPracticeItems === 1 ? '' : 's'}</li>
          <li>${questions.length} exam question${questions.length === 1 ? '' : 's'} ready to try</li>
        </ul>
      </article>
    </section>
    <section class="entry-grid" aria-label="${escapeAttr(topic.name)} study sections">
      <article class="entry-card">
        <p class="eyebrow">Recommended first</p>
        <h2>Field Guide</h2>
        <p>Use this when the method is new, rusty, or confusing.</p>
        ${routeLink(pagePath, fieldGuidePath, 'Start Field Guide', 'button primary-button')}
      </article>
      <article class="entry-card">
        <p class="eyebrow">Confident already?</p>
        <h2>Skill Check</h2>
        <p>Go straight to a short check on the same topic.</p>
        ${routeLink(pagePath, practicePath, 'Try 3 quick questions', 'button secondary-button')}
      </article>
      <article class="entry-card">
        <p class="eyebrow">Exam practice</p>
        <h2>Exam Training</h2>
        <p>Try one exam-style question and reveal the mark scheme when ready.</p>
        ${routeLink(pagePath, examTrainingPath, 'One exam question', 'button secondary-button')}
      </article>
    </section>
  `;
  return renderPage({
    pagePath,
    title: topic.name,
    description: topic.description,
    active: 'p3-topics',
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

function renderAuthoredPractice(group: SkillChecklistTopicGroup, pagePath: string): string {
  if (!group.authoredItems.length) return '';
  return `
    <section class="practice-subsection">
      <h3>Focused checks</h3>
      <div class="practice-card-stack">
        ${group.authoredItems.map((item) => `
          <article class="practice-card">
            <p class="eyebrow">Skill Check</p>
            <h4>${renderMathText(item.prompt)}</h4>
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
            <button class="button secondary-button" type="button" data-save-skill-check="quick_check" data-region-id="${escapeAttr(item.regionId)}" data-activity-id="${escapeAttr(item.itemId)}" data-topic="${escapeAttr(group.topic.title)}" data-prompt="${escapeAttr(item.prompt)}">
              I tried this
            </button>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function seedVisualTemplatesById(topic: CourseSeedTopic): Map<string, CourseSeedVisualTemplate> {
  return new Map(topic.fieldGuideSections
    .flatMap((section) => section.visualTemplates ?? [])
    .map((template) => [template.id, template]));
}

function renderDraftSkillCheckVisual(item: SkillCheckItem, templatesById: Map<string, CourseSeedVisualTemplate>): string {
  if (!item.visualTemplateId) return '';
  const template = templatesById.get(item.visualTemplateId);
  if (!template) return '<p class="seed-topic-status">A diagram is not available for this question yet.</p>';
  return renderSeedVisualTemplates([template]);
}

function renderSeedSkillCheckCard(
  item: SkillCheckItem,
  templatesById: Map<string, CourseSeedVisualTemplate>,
  topicTitle: string,
  label = 'Skill Check',
  focused = false,
  showFocusedLabel = false,
  preferFocusedFirstStep = false,
): string {
  if (!focused) {
    return `
    <article class="practice-card" data-skill-check-item-id="${escapeAttr(item.itemId)}">
      <p class="eyebrow">${escapeHtml(label)}</p>
      <h3>${renderMathText(item.prompt)}</h3>
      ${renderDraftSkillCheckVisual(item, templatesById)}
      ${renderSkillCheckAnswerInput(item)}
      <details>
        <summary>Show answer and worked route</summary>
        <div class="support-details"><strong>Expected answer:</strong> ${renderExpectedAnswerSummary(item)}</div>
        <p><strong>Hint:</strong> ${renderMathText(item.hints.nudge)}</p>
        ${item.hints.methodCue ? `<p><strong>Method cue:</strong> ${renderMathText(item.hints.methodCue)}</p>` : ''}
        ${item.hints.firstStep ? `<p><strong>First step:</strong> ${renderMathText(item.hints.firstStep)}</p>` : ''}
        ${item.commonMistake ? `<p><strong>Common mistake / feedback:</strong> ${renderMathText(item.commonMistake)}</p>` : ''}
        <ol class="worked-list">${item.workedRoute.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>
      </details>
      <button class="button secondary-button" type="button" data-save-skill-check="quick_check" data-region-id="${escapeAttr(item.regionId)}" data-activity-id="${escapeAttr(item.itemId)}" data-topic="${escapeAttr(topicTitle)}" data-prompt="${escapeAttr(item.prompt)}">
        I tried this
      </button>
    </article>
  `;
  }

  const firstStepLine = item.hints.firstStep ?? item.workedRoute[0] ?? item.hints.nudge;
  const methodLine = item.hints.methodCue ?? item.hints.nudge;
  const saveButton = `
        <button class="button secondary-button" type="button" data-save-skill-check="quick_check" data-region-id="${escapeAttr(item.regionId)}" data-activity-id="${escapeAttr(item.itemId)}" data-topic="${escapeAttr(topicTitle)}" data-prompt="${escapeAttr(item.prompt)}">
          I tried this
        </button>`;
  return `
    <article class="practice-card${focused ? ' skill-check-focus-card' : ''}" data-skill-check-item-id="${escapeAttr(item.itemId)}">
      <p class="eyebrow">${focused && !showFocusedLabel ? 'Try this' : escapeHtml(label)}</p>
      <h3>${renderMathText(item.prompt)}</h3>
      ${renderDraftSkillCheckVisual(item, templatesById)}
      ${renderSkillCheckAnswerInput(item)}
      ${focused && item.hints.nudge ? `
        <details class="skill-check-hint-details">
          <summary>Show hint</summary>
          <p>${renderMathText(item.hints.nudge)}</p>
        </details>
      ` : ''}
      <details class="skill-check-answer-details">
        <summary>${focused ? 'Check answer' : 'Show answer and worked route'}</summary>
        <div class="support-details"><strong>Answer:</strong> ${renderExpectedAnswerSummary(item)}</div>
        ${focused && preferFocusedFirstStep ? `
          <p class="skill-check-first-step"><strong>First step:</strong> ${renderMathText(firstStepLine)}</p>
          ${methodLine ? `<p class="skill-check-method-line"><strong>Method cue:</strong> ${renderMathText(methodLine)}</p>` : ''}
        ` : focused ? `
          <p class="skill-check-method-line"><strong>Method:</strong> ${renderMathText(methodLine)}</p>
        ` : `
          <p><strong>Hint:</strong> ${renderMathText(item.hints.nudge)}</p>
          ${item.hints.methodCue ? `<p><strong>Method cue:</strong> ${renderMathText(item.hints.methodCue)}</p>` : ''}
          ${item.hints.firstStep ? `<p><strong>First step:</strong> ${renderMathText(item.hints.firstStep)}</p>` : ''}
        `}
        ${item.commonMistake ? `<p class="skill-check-feedback"><strong>Watch for:</strong> ${renderMathText(item.commonMistake)}</p>` : ''}
        ${focused ? `
          <details class="skill-check-working-details">
            <summary>Show working</summary>
            <ol class="worked-list">${item.workedRoute.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>
          </details>
          <button class="button primary-button skill-check-inline-next" type="button" data-skill-check-inline-next>
            Next question
          </button>
        ` : `<ol class="worked-list">${item.workedRoute.map((line) => `<li>${renderMathText(line)}</li>`).join('')}</ol>`}
        ${focused ? saveButton : ''}
      </details>
      ${focused ? '' : saveButton}
    </article>
  `;
}

function p1GroupItems(group: P1SkillCheckGroup, itemById: Map<string, SkillCheckItem>): Array<{ item: SkillCheckItem; meta: P1SkillCheckGroupItem }> {
  return group.defaultItems
    .map((meta) => {
      const item = itemById.get(meta.itemId);
      return item ? { item, meta } : undefined;
    })
    .filter((entry): entry is { item: SkillCheckItem; meta: P1SkillCheckGroupItem } => Boolean(entry));
}

function renderP1SkillCheckGroup(
  group: P1SkillCheckGroup,
  itemById: Map<string, SkillCheckItem>,
  templatesById: Map<string, CourseSeedVisualTemplate>,
  topicTitle: string,
): string {
  const defaultItems = p1GroupItems(group, itemById);
  if (!defaultItems.length) return '';
  const isCoordinateGeometry = group.topicId === 'p1-coordinate-geometry';
  const optionalSets = (group.optionalSets ?? [])
    .map((set) => ({
      ...set,
      items: set.itemIds.map((itemId) => itemById.get(itemId)).filter((item): item is SkillCheckItem => Boolean(item)),
    }))
    .filter((set) => set.items.length);
  return `
    <article class="practice-topic" id="${escapeAttr(group.groupId)}" data-skill-check-group="${escapeAttr(group.groupId)}">
      <header class="topic-section-header skill-check-group-header">
        <div>
          <p class="eyebrow">Current skill</p>
          <h2>${escapeHtml(group.label)}</h2>
        </div>
      </header>
      <div class="practice-card-stack">
        ${defaultItems.map(({ item, meta }) => renderSeedSkillCheckCard(item, templatesById, topicTitle, meta.label, true, isCoordinateGeometry, isCoordinateGeometry)).join('')}
        ${optionalSets.flatMap((set) => (
          set.items.map((item) => renderSeedSkillCheckCard(item, templatesById, topicTitle, set.label, true, isCoordinateGeometry, isCoordinateGeometry))
        )).join('')}
      </div>
    </article>
  `;
}

function renderSeedDraftSkillChecks(course: CourseMetadata, topic: CourseSeedTopic): string {
  const items = getSkillCheckItemsForCourseTopic(course.id, topic.id);
  if (!items.length) return '';
  const templatesById = seedVisualTemplatesById(topic);
  const p1Groups = course.id === 'p1' ? getP1SkillCheckGroupsForTopic(topic.id) : [];
  if (p1Groups.length) {
    const itemById = new Map(items.map((item) => [item.itemId, item]));
    return p1Groups
      .map((group) => renderP1SkillCheckGroup(group, itemById, templatesById, topic.title))
      .join('');
  }
  const defaultItems = items.slice(0, 3);
  return `
    <article class="practice-topic" id="skill-checks">
      <header class="topic-section-header">
        <div>
          <p class="eyebrow">${defaultItems.length} quick check${defaultItems.length === 1 ? '' : 's'}</p>
          <h2>Skill Checks</h2>
          <p>Try these quick checks after the Field Guide and before exam-style questions.</p>
        </div>
      </header>
      <div class="practice-card-stack">
        ${defaultItems.map((item) => renderSeedSkillCheckCard(item, templatesById, topic.title)).join('')}
      </div>
    </article>
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
              <button class="button secondary-button" type="button" data-save-skill-check="quick_check" data-region-id="${escapeAttr(snippet.regionIds[0] ?? '')}" data-activity-id="${escapeAttr(check.id ?? snippet.snippetId)}" data-topic="${escapeAttr(group.topic.title)}" data-prompt="${escapeAttr(check.prompt)}">
                Save quick check
              </button>
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
      <button class="button secondary-button" type="button" data-save-skill-check="warm_up" data-region-id="${escapeAttr(item.regionIds[0] ?? '')}" data-activity-id="${escapeAttr(item.practiceId)}" data-topic="${escapeAttr(item.topic)}" data-prompt="${escapeAttr(item.prompt)}">
        I tried this
      </button>
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

function renderSkillPracticeGroup(group: SkillChecklistTopicGroup, pagePath: string): string {
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
      ${renderAuthoredPractice(group, pagePath)}
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
  const displayTopic = options.displayTopic ?? displayTopicForQuestion(question);
  const displaySubtopic = options.displaySubtopic ?? question.displaySubtopic;
  const allowAttemptSave = options.allowAttemptSave ?? true;
  return `
    <article class="exam-question-card" id="question-${escapeAttr(question.id)}">
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(questionTitle(question))}</p>
          <h3>${escapeHtml(displayTopic)}</h3>
          ${displaySubtopic ? `<p>${escapeHtml(displaySubtopic)}</p>` : ''}
          <p class="question-instruction">Work on paper first, then use the mark scheme to self-mark.</p>
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
      <details class="mark-scheme-details">
        <summary>Show mark scheme image</summary>
        <figure class="question-figure">
          <img loading="lazy" src="${hrefToPublicAsset(pagePath, markSchemeImage)}" alt="${escapeAttr(`${questionTitle(question)} mark scheme image`)}" />
        </figure>
      </details>
      ${options.reviewLinkPath ? `<p class="question-review-link">${routeLink(pagePath, options.reviewLinkPath, 'Review Field Guide', 'button secondary-button')}</p>` : ''}
      ${allowAttemptSave ? `<form class="attempt-form" data-save-exam-attempt data-question-id="${escapeAttr(question.id)}" data-paper-family="${escapeAttr(question.paperFamily)}" data-paper="${escapeAttr(question.paper)}" data-question-number="${escapeAttr(question.questionNumber)}" data-topic="${escapeAttr(displayTopic)}" data-subtopic="${escapeAttr(displaySubtopic)}" data-marks-available="${totalMarks}" data-validated-region-id="${escapeAttr(options.validatedRegionId ?? question.routeEvidence?.validatedRegionId)}" data-display-region-id="${escapeAttr(options.displayRegionId ?? question.routeEvidence?.displayRegionId)}">
        <label>
          Marks earned after marking
          <input name="marksEarned" type="number" min="0" max="${totalMarks}" step="1" required />
        </label>
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
        <button class="button primary-button" type="submit">Save attempt locally</button>
        <p class="form-status" role="status"></p>
      </form>` : '<p class="empty-state">Use this question for practice. Save marks only when your class or teacher wants you to track them.</p>'}
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
  const body = `
    ${renderHero(
      `${topic.name} Skill Check`,
      'Start with one focused question. Use a hint or review the Field Guide if you get stuck.',
      topic.headerFormula,
      `<a class="button primary-button" href="#${escapeAttr(firstPracticeId)}">Start first question</a>
      ${routeLink(pagePath, topicExamTrainingPagePath(topic), 'One exam question', 'button secondary-button')}
      ${routeLink(pagePath, fieldGuidePath, 'Review Field Guide', 'button text-button')}`,
    )}
    <details class="jump-details">
      <summary>Show Skill Check sections and saved progress</summary>
      <nav class="subnav" aria-label="${escapeAttr(topic.name)} Skill Check sections">
        ${groups.map((group) => `<a href="#practice-${escapeAttr(group.topic.id)}">${escapeHtml(group.topic.title)}</a>`).join('')}
      </nav>
      <div class="progress-detail-row">
        ${progressList(region.id, Math.max(1, context.fieldGuideTopics.length))}
        ${routeLink(pagePath, fieldGuidePath, 'Review Field Guide', 'button secondary-button')}
      </div>
    </details>
    <section class="practice-stack" data-one-card-flow data-flow-label="Skill Check" data-default-card-limit="3">
      ${groups.map((group) => renderSkillPracticeGroup(group, pagePath)).join('')}
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
      'Try one Paper 3 question at a time. Reveal the mark scheme only when you are ready.',
      topic.headerFormula,
      `${questions.length ? '<a class="button primary-button" href="#topic-exam-questions">Start topic questions</a>' : ''}
      ${routeLink(pagePath, practicePath, 'Skill Check', 'button secondary-button')}
      ${routeLink(pagePath, topicsIndexPath, 'Back to P3 topics', 'button text-button')}`,
    )}
    <section class="exam-question-section" id="topic-exam-questions">
      <div class="section-heading">
        <div>
          <h2>Exam questions</h2>
          <p>Try the question image first. Reveal the mark scheme only when you are ready to mark your work.</p>
        </div>
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
      'Use this after topic practice, or for revision when you want one mixed Paper 3 question.',
      '\\frac{dy}{dx}, \\quad \\int_a^b f(x)\\,dx, \\quad \\arg z',
      `<a class="button primary-button" href="#mixed-questions">Start mixed questions</a>
      ${routeLink(pagePath, topicsIndexPath, 'Back to topics', 'button secondary-button')}`,
    )}
    <section class="exam-question-section" id="mixed-questions">
      <div class="section-heading">
        <div>
          <h2>Mixed Paper 3 questions</h2>
          <p>Work on paper first, reveal the mark scheme, then save your marks if you want to track the attempt.</p>
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
        <p>Use the totals as a revision guide, not a grade.</p>
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
    <section class="exam-topic-dashboard" aria-label="Topic progress dashboard">
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
    description: 'Static Exam Training dashboard for Paper 3 practice.',
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
    const seedTopics = getSeedTopicsForCourse(course.id);
    if (seedTopics.length) {
      htmlByPath.set(seedCourseTopicsIndexPagePath(course), renderSeedTopicsIndexPage(course));
      htmlByPath.set(seedExamTrainingPagePath(course), renderSeedExamTrainingPage(course, data));
      for (const topic of seedTopics) {
        htmlByPath.set(seedTopicPagePath(course, topic), renderSeedTopicHubPage(course, topic));
        htmlByPath.set(seedFieldGuidePagePath(course, topic), renderSeedFieldGuidePage(course, topic));
        if (course.id === 'p1') {
          topic.fieldGuideSections.forEach((section, index) => {
            const subtopicHtml = renderP1FieldGuideSubtopicPage(course, topic, section, index);
            htmlByPath.set(seedFieldGuideSubtopicPagePath(course, topic, section), subtopicHtml);
            seedFieldGuideSubtopicAliasPagePaths(course, topic, section).forEach((aliasPath) => {
              htmlByPath.set(aliasPath, subtopicHtml);
            });
          });
        }
        htmlByPath.set(seedPracticePagePath(course, topic), renderSeedPracticePage(course, topic, data));
        htmlByPath.set(seedPracticeCompatibilityPagePath(course, topic), renderSeedPracticePage(course, topic, data, seedPracticeCompatibilityPagePath(course, topic)));
        htmlByPath.set(seedTopicExamTrainingPagePath(course, topic), renderSeedTopicExamTrainingPage(course, topic, data));
      }
    }
  }

  htmlByPath.set(p3TopicsIndexPagePath(), renderP3TopicsIndexPage(data));
  htmlByPath.set(`${P3_COURSE_ID}/regions/index.html`, renderRegionsPage(data));
  htmlByPath.set('regions/index.html', renderRegionsPage(data, 'regions/index.html'));

  for (const topic of STUDY_TOPICS) {
    const context = topicContext(topic, data);
    htmlByPath.set(topicPagePath(topic), renderTopicHubPage(context));
    htmlByPath.set(fieldGuidePagePath(topic), renderFieldGuidePage(context));
    htmlByPath.set(practicePagePath(topic), renderPracticePage(context));
    htmlByPath.set(practiceCompatibilityPagePath(topic), renderPracticePage(context, practiceCompatibilityPagePath(topic)));
    htmlByPath.set(topicExamTrainingPagePath(topic), renderTopicExamTrainingPage(context));
    htmlByPath.set(legacyTopicPagePath(topic), renderTopicHubPage(context, legacyTopicPagePath(topic), legacyFieldGuidePagePath(topic), legacySkillCheckPagePath(topic), legacyTopicExamTrainingPagePath(topic)));
    htmlByPath.set(legacyFieldGuidePagePath(topic), renderFieldGuidePage(context, legacyFieldGuidePagePath(topic), legacySkillCheckPagePath(topic)));
    htmlByPath.set(legacySkillCheckPagePath(topic), renderPracticePage(context, legacySkillCheckPagePath(topic), legacyFieldGuidePagePath(topic)));
    htmlByPath.set(legacyPracticePagePath(topic), renderPracticePage(context, legacyPracticePagePath(topic), legacyFieldGuidePagePath(topic)));
    htmlByPath.set(legacyTopicExamTrainingPagePath(topic), renderTopicExamTrainingPage(context, legacyTopicExamTrainingPagePath(topic), p3TopicsIndexPagePath(), legacySkillCheckPagePath(topic)));
  }

  htmlByPath.set(`${P3_COURSE_ID}/exam-training/index.html`, renderExamTrainingPage(data));
  htmlByPath.set('exam-training/index.html', renderExamTrainingPage(data, 'exam-training/index.html', 'index.html', legacyTopicExamTrainingPagePath));
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
