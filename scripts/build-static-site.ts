import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { COURSES, P3_COURSE_ID, type CourseMetadata } from '../src/data/courses';
import {
  DRAFT_SEED_CONTENT_LABEL,
  getSeedTopicsForCourse,
  hasDraftSeedTopics,
  type CourseSeedTopic,
} from '../src/data/courseSeedContent';
import { getFieldGuideTopicsForRegion, type FieldGuideTopic, type FieldGuideTopicExample } from '../src/data/fieldGuideTopics';
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

function seedPracticePagePath(course: CourseMetadata, topic: CourseSeedTopic): string {
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
  return `${P3_COURSE_ID}/topics/${topic.slug}/practice/index.html`;
}

function legacyPracticePagePath(topic: StudyTopic): string {
  return `topics/${topic.slug}/practice/index.html`;
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
  const items = [
    { key: 'courses', label: 'Courses', path: 'index.html' },
    ...COURSES.map((course) => ({ key: course.id, label: course.shortName, path: coursePagePath(course) })),
    ...(active === 'p3' || active === 'p3-topics' || active === 'p3-exam-training'
      ? [
        { key: 'p3-topics', label: 'P3 Topics', path: p3TopicsIndexPagePath() },
        { key: 'p3-exam-training', label: 'Exam Training', path: `${P3_COURSE_ID}/exam-training/index.html` },
      ]
      : []),
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
  <body>
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
      <li><span data-progress-skill="${escapeAttr(regionId)}" data-label="Practice Questions">Practice Questions: 0 saved</span></li>
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
      <li><strong>1. Learn</strong><span>Read one Field Guide section.</span></li>
      <li><strong>2. Practise</strong><span>Try focused Practice Questions.</span></li>
      <li><strong>3. Revise</strong><span>Use Exam Training for mixed questions.</span></li>
    </ol>
  `;
}

function renderTopicCard(fromPagePath: string, context: TopicContext, examTrainingPath = topicExamTrainingPagePath(context.topic)): string {
  const { topic, region } = context;
  return `
    <article class="topic-card" data-region-card="${escapeAttr(region.id)}">
      <div class="topic-card-formula">${renderInlineFormula(topic.headerFormula)}</div>
      <h2>${escapeHtml(topic.name)}</h2>
      <p>${escapeHtml(topic.description)}</p>
      <div class="button-row">
        ${routeLink(fromPagePath, fieldGuidePagePath(topic), 'Start Field Guide', 'button secondary-button')}
        ${routeLink(fromPagePath, practicePagePath(topic), 'Practice now', 'button text-button')}
        ${routeLink(fromPagePath, examTrainingPath, 'Exam Training', 'button text-button')}
        ${routeLink(fromPagePath, topicPagePath(topic), 'Topic overview', 'button text-button')}
      </div>
    </article>
  `;
}

function renderDraftNotice(extra = ''): string {
  return `
    <aside class="draft-seed-notice" role="note">
      <strong>${escapeHtml(DRAFT_SEED_CONTENT_LABEL)}</strong>
      ${extra ? `<span>${escapeHtml(extra)}</span>` : ''}
    </aside>
  `;
}

function renderSeedTopicCard(fromPagePath: string, course: CourseMetadata, topic: CourseSeedTopic): string {
  return `
    <article class="topic-card draft-topic-card">
      <div class="topic-card-formula">${renderInlineFormula(topic.headerFormula)}</div>
      <p class="eyebrow">${escapeHtml(topic.syllabusRef)}</p>
      <h2>${escapeHtml(topic.title)}</h2>
      <p>${escapeHtml(topic.description)}</p>
      <p class="seed-topic-status">${escapeHtml(DRAFT_SEED_CONTENT_LABEL)}</p>${renderSeedReviewStatus(topic)}
      <div class="button-row">
        ${routeLink(fromPagePath, seedTopicPagePath(course, topic), 'Topic overview', 'button primary-button')}
        ${routeLink(fromPagePath, seedFieldGuidePagePath(course, topic), 'Field Guide', 'button secondary-button')}
        ${routeLink(fromPagePath, seedPracticePagePath(course, topic), 'Practice placeholder', 'button text-button')}
        ${routeLink(fromPagePath, seedTopicExamTrainingPagePath(course, topic), 'Exam Training', 'button text-button')}
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

function renderSeedReviewStatus(topic: CourseSeedTopic): string {
  return topic.reviewStatus
    ? `<p class="seed-topic-status">${escapeHtml(topic.reviewStatus)}</p>`
    : '';
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

function renderCourseCard(fromPagePath: string, course: CourseMetadata): string {
  return `
    <article class="course-card course-status-${escapeAttr(course.status)}">
      <div>
        <p class="eyebrow">${escapeHtml(course.examComponentLabel)}</p>
        <h2>${escapeHtml(`${course.shortName}: ${course.displayName}`)}</h2>
        <p>${escapeHtml(course.shortDescription)}</p>
      </div>
      <div class="course-card-footer">
        <span class="course-status-pill">${escapeHtml(course.statusLabel)}</span>
        ${routeLink(fromPagePath, coursePagePath(course), `Open ${course.shortName}`, 'button primary-button')}
      </div>
    </article>
  `;
}

function renderCourseSelectorPage(): string {
  const pagePath = 'index.html';
  const body = `
    ${renderHero(
      'Choose your CAIE 9709 course',
      'Start from the component you are studying. P3 has the developed image-first study pages; P1, M1, and S1 now have draft seed topic pages for audit.',
      '9709 \\quad P1 \\quad P3 \\quad M1 \\quad S1',
      '',
      'CAIE 9709 Study Hub',
    )}
    <section class="section-heading">
      <div>
        <h2>Course selection</h2>
        <p>Each course keeps its study path separate. Draft seed content is visibly labelled until it has completed syllabus-contract review.</p>
      </div>
    </section>
    <section class="course-grid" aria-label="CAIE 9709 course pages">
      ${COURSES.map((course) => renderCourseCard(pagePath, course)).join('')}
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
  const topicAction = isP3
    ? routeLink(pagePath, p3TopicsIndexPagePath(), 'Open P3 topics', 'button primary-button')
    : hasSeedContent
      ? routeLink(pagePath, seedCourseTopicsIndexPagePath(course), `Open ${course.shortName} topics`, 'button primary-button')
      : '<span class="button disabled-button" aria-disabled="true">Content coming soon</span>';
  const examAction = isP3
    ? routeLink(pagePath, `${P3_COURSE_ID}/exam-training/index.html`, 'Open Exam Training', 'button secondary-button')
    : hasSeedContent
      ? routeLink(pagePath, seedExamTrainingPagePath(course), 'Open Exam Training', 'button secondary-button')
      : '<span class="button disabled-button" aria-disabled="true">Exam practice coming soon</span>';
  const heroFormula = isP3
    ? '\\int f(x)\\,dx \\quad \\mathbf{a}\\cdot\\mathbf{b} \\quad z=x+iy'
    : seedTopics.slice(0, 3).map((topic) => topic.headerFormula).join('\\quad ');
  const body = `
    ${renderHero(
      `${course.shortName}: ${course.displayName}`,
      course.shortDescription,
      heroFormula || undefined,
      isP3 || hasSeedContent ? `${topicAction}${examAction}` : '',
      course.examComponentLabel,
    )}
    ${hasSeedContent ? renderDraftNotice('These pages are starter study notes only, not mastery evidence or final exam-bank mapping.') : ''}
    <section class="topic-overview-grid">
      <article class="summary-card">
        <h2>What this course covers</h2>
        <p>${escapeHtml(course.coverageSummary)}</p>
        ${hasSeedContent ? '<p>Official Cambridge 9709 syllabus headings were used as the first-pass structure; wording and coverage still need human audit.</p>' : ''}
      </article>
      <article class="summary-card">
        <h2>${hasSeedContent ? 'Draft topic list' : 'Topic list placeholder'}</h2>
        <ul class="plain-list">
          ${course.topics.map((topic) => `
            <li>
              ${hasSeedContent && topic.slug
                ? routeLink(pagePath, `${course.slug}/topics/${topic.slug}/index.html`, topic.title)
                : `<strong>${escapeHtml(topic.title)}</strong>`}
              <span>${escapeHtml(topic.note)}</span>
            </li>
          `).join('')}
        </ul>
      </article>
    </section>
    <section class="entry-grid course-entry-grid" aria-label="${escapeAttr(course.shortName)} study placeholders">
      <article class="entry-card">
        <p class="eyebrow">Study notes</p>
        <h2>Field Guide</h2>
        <p>${isP3 ? 'Use the current P3 Field Guide topic pages.' : hasSeedContent ? 'Use draft Field Guide pages as a starter checklist.' : 'Field Guide content coming soon.'}</p>
        ${topicAction}
      </article>
      <article class="entry-card">
        <p class="eyebrow">Focused work</p>
        <h2>Practice</h2>
        <p>${isP3 ? 'Use focused practice from the current P3 topic pages.' : hasSeedContent ? 'Practice pages are placeholders with self-check prompts only.' : 'Practice pages will be added after the topic map is reviewed.'}</p>
        ${topicAction}
      </article>
      <article class="entry-card">
        <p class="eyebrow">Exam preparation</p>
        <h2>Exam-style practice</h2>
        <p>${isP3 ? 'Use the existing mixed P3 image-first exam practice.' : hasSeedContent ? 'Use catalog-wired Exam Training pages. Image cards appear only when local question and mark-scheme crops exist.' : 'Exam-style practice is not populated yet.'}</p>
        ${examAction}
      </article>
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
      'Pure Mathematics 3 Topic Practice',
      'Start with one short Field Guide section, then practise the same topic before moving to mixed exam questions.',
      '\\int f(x)\\,dx \\quad \\mathbf{a}\\cdot\\mathbf{b} \\quad z=x+iy',
      `${routeLink(pagePath, fieldGuidePagePath(STUDY_TOPICS[0]), 'Start with Algebra Field Guide', 'button primary-button')}
      <a class="button secondary-button" href="#topic-list">Choose another topic</a>
      ${routeLink(pagePath, examTrainingPath, 'Go to Exam Training', 'button text-button')}`,
    )}
    ${renderStudyPath()}
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
        <p class="eyebrow">Final study area</p>
        <h2>Exam Training</h2>
        <p>Use this after topic practice or for revision with mixed Paper 3 questions.</p>
      </div>
      <div class="exam-stats">
        <span data-total-attempts>0 saved Paper 3 attempts</span>
        <span data-topic-tried-count>0 topic areas tried</span>
      </div>
      ${routeLink(pagePath, examTrainingPath, 'Open Exam Training', 'button primary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'Pure Mathematics 3 Topic Practice',
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
      `${course.shortName} Draft Topic Practice`,
      'Choose a topic to audit the starter notes, Field Guide outline, and practice placeholders.',
      firstTopic?.headerFormula,
      `${firstTopic ? routeLink(pagePath, seedTopicPagePath(course, firstTopic), `Start ${firstTopic.shortTitle}`, 'button primary-button') : ''}
      ${routeLink(pagePath, seedExamTrainingPagePath(course), 'Exam Training', 'button secondary-button')}`,
      course.examComponentLabel,
    )}
    ${renderDraftNotice('Official 9709 syllabus headings guided this seed pass. These pages are not final course contracts.')}
    ${renderStudyPath()}
    <section class="section-heading" id="topic-list">
      <div>
        <h2>Choose a draft topic</h2>
        <p>Each topic follows the P3 page pattern at a smaller draft depth: overview, key ideas, method route, mistakes, self-checks, and practice direction.</p>
      </div>
    </section>
    <section class="topic-grid" aria-label="${escapeAttr(course.shortName)} draft topic pages">
      ${topics.map((topic) => renderSeedTopicCard(pagePath, course, topic)).join('')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} Draft Topics`,
    description: `Draft static topic pages for ${course.displayName}.`,
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
      `${routeLink(pagePath, fieldGuidePath, 'Open Field Guide', 'button primary-button')}
      ${routeLink(pagePath, practicePath, 'Practice placeholder', 'button secondary-button')}
      ${routeLink(pagePath, examTrainingPath, 'Exam Training', 'button text-button')}`,
      `${course.shortName} ${topic.syllabusRef}`,
    )}
    ${renderDraftNotice('This page is starter content for navigation and audit. It does not create mastery status, completion status, or exam-bank evidence.')}
    <section class="topic-overview-grid">
      <article class="summary-card">
        <h2>Overview</h2>
        <p>${escapeHtml(topic.description)}</p>${renderSeedReviewStatus(topic)}
        <h3>Key formulae and methods</h3>
        ${renderSeedFormulaList(topic)}
      </article>
      <article class="summary-card">
        <h2>What you need to be able to do</h2>
        ${renderPlainList(topic.studentGoals)}
      </article>${topic.visualRequirements?.length ? `
        <article class="summary-card">
          <h2>Required visual elements</h2>
          ${renderPlainList(topic.visualRequirements)}
        </article>
      ` : ''}
    </section>
    <section class="lesson-stack compact-lesson-stack">
      <article class="lesson-card">
        <p class="eyebrow">Key ideas</p>
        <h2>Core understanding</h2>
        ${renderPlainList(topic.keyIdeas)}
      </article>
      <article class="lesson-card">
        <p class="eyebrow">Worked-method style route</p>
        <h2>Method pattern</h2>
        <ol class="worked-list">
          ${topic.workedMethod.map((line) => `<li>${renderMathText(line)}</li>`).join('')}
        </ol>
      </article>
      <article class="lesson-card">
        <p class="eyebrow">Common mistakes</p>
        <h2>Watch for these</h2>
        ${renderPlainList(topic.commonMistakes)}
      </article>
      <article class="lesson-card">
        <p class="eyebrow">Quick self-checks</p>
        <h2>Before practice</h2>
        ${renderPlainList(topic.selfChecks)}
      </article>
      <article class="lesson-card">
        <p class="eyebrow">Exam-style direction</p>
        <h2>What this looks like in papers</h2>
        ${renderPlainList(topic.examStyle)}
        <p>${escapeHtml(topic.examTrainingHook)}</p>
      </article>
    </section>
    <section class="next-step-card">
      <h2>Practice placeholder</h2>
      <p>${escapeHtml(topic.practiceHook)}</p>${renderOptionalList('Draft/generated practice prompts', topic.genericPracticePrompts)}
      ${routeLink(pagePath, practicePath, 'Open practice placeholder', 'button primary-button')}
      ${routeLink(pagePath, examTrainingPath, 'Open Exam Training', 'button secondary-button')}
      ${routeLink(pagePath, seedCourseTopicsIndexPagePath(course), `Back to ${course.shortName} topics`, 'button secondary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} ${topic.title}`,
    description: `${DRAFT_SEED_CONTENT_LABEL} ${topic.description}`,
    active: course.id,
    body,
  });
}

function renderSeedFieldGuidePage(course: CourseMetadata, topic: CourseSeedTopic): string {
  const pagePath = seedFieldGuidePagePath(course, topic);
  const practicePath = seedPracticePagePath(course, topic);
  const body = `
    ${renderHero(
      `${topic.title} Field Guide`,
      'Use these short sections as a first audit scaffold, then test the outline with practice prompts.',
      topic.headerFormula,
      `${routeLink(pagePath, seedTopicPagePath(course, topic), 'Topic overview', 'button secondary-button')}
      ${routeLink(pagePath, practicePath, 'Practice placeholder', 'button primary-button')}`,
      `${course.shortName} draft Field Guide`,
    )}
    ${renderDraftNotice('Field Guide sections are provisional and must be checked against the official syllabus contract.')}
    <details class="jump-details" open>
      <summary>Show section list</summary>
      <nav class="subnav" aria-label="${escapeAttr(topic.title)} draft Field Guide sections">
        ${topic.fieldGuideSections.map((section) => `<a href="#${escapeAttr(section.id)}">${escapeHtml(section.title)}</a>`).join('')}
      </nav>
    </details>
    <section class="lesson-stack">
      ${topic.fieldGuideSections.map((section, index) => `
        <article class="field-guide-topic" id="${escapeAttr(section.id)}">
          <header class="topic-section-header">
            <div>
              <p class="eyebrow">Draft section ${index + 1} of ${topic.fieldGuideSections.length}</p>
              <h2>${escapeHtml(section.title)}</h2>
              <p>${escapeHtml(section.purpose)}</p>
            </div>
          </header>
          <article class="lesson-card">
            <h3>Method notes</h3>
            ${renderPlainList(section.bullets)}${renderOptionalList('Required visual elements', section.visualRequirements)}${renderOptionalList('Draft/generated practice prompts', section.practicePrompts)}
          </article>
        </article>
      `).join('')}
    </section>
    <section class="next-step-card">
      <h2>Next step</h2>
      <p>${escapeHtml(topic.practiceHook)}</p>
      ${routeLink(pagePath, practicePath, 'Practice placeholder', 'button primary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} ${topic.title} Field Guide`,
    description: `Draft Field Guide for ${topic.title}.`,
    active: course.id,
    body,
  });
}

function renderSeedPracticePage(course: CourseMetadata, topic: CourseSeedTopic, data?: StaticSiteData): string {
  const pagePath = seedPracticePagePath(course, topic);
  const examTrainingPath = seedTopicExamTrainingPagePath(course, topic);
  const availableExamQuestions = data ? filterCourseTopicExamQuestions(data.catalogQuestions, course, topic).length : 0;
  const routedCatalogRecords = data ? filterCourseTopicExamQuestions(data.catalogRecords, course, topic).length : 0;
  const body = `
    ${renderHero(
      `${topic.title} Practice Placeholder`,
      'Use these prompts for self-checking only. Full reviewed practice and exam-image mapping are out of scope for this seed pass.',
      topic.headerFormula,
      `${routeLink(pagePath, seedTopicPagePath(course, topic), 'Topic overview', 'button secondary-button')}
      ${routeLink(pagePath, seedFieldGuidePagePath(course, topic), 'Review Field Guide', 'button secondary-button')}`,
      `${course.shortName} draft practice`,
    )}
    ${renderDraftNotice('No marks, mastery, adaptive selection, or exam evidence are created on this placeholder page.')}
    <section class="practice-stack">
      <article class="practice-topic">
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
              <p class="eyebrow">Draft/generated practice</p>
              <h2>Source-style prompt scaffolds</h2>
              <p>These are generic prompt directions for first-pass practice authoring. They are not reviewed exam questions or mark schemes.</p>
            </div>
          </header>
          <div class="practice-card-stack">
            ${topic.genericPracticePrompts.map((prompt, index) => `
              <article class="practice-card">
                <p class="eyebrow">Draft prompt ${index + 1}</p>
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
        ? `${availableExamQuestions} catalog question image pair${availableExamQuestions === 1 ? '' : 's'} are available for this rough topic route. They still need course-contract review.`
        : routedCatalogRecords > 0
          ? `${routedCatalogRecords} catalog record${routedCatalogRecords === 1 ? '' : 's'} match this rough topic route, but local question and mark-scheme image files are missing.`
          : `No catalog question image pairs are currently routed to this draft topic.`}</p>
      ${routeLink(pagePath, examTrainingPath, 'Open topic Exam Training', 'button primary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${course.shortName} ${topic.title} Practice Placeholder`,
    description: `Draft practice placeholder for ${topic.title}.`,
    active: course.id,
    body,
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
  return 'Catalog image pair; route is not yet a reviewed course contract or mastery signal.';
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
      'Catalog wiring is active for build-first practice. Question cards appear only when local question and mark-scheme image files exist.',
      topics[0]?.headerFormula,
      routeLink(pagePath, seedCourseTopicsIndexPagePath(course), `Back to ${course.shortName} topics`, 'button primary-button'),
      course.examComponentLabel,
    )}
    ${renderDraftNotice('Exam-bank metadata is wired from the catalog, but this course is not fully reviewed. Do not treat these routes as mastery evidence or official progress evidence yet.')}
    <section class="exam-callout compact-callout">
      <div>
        <p class="eyebrow">Catalog availability</p>
        <h2>${questions.length} image pair${questions.length === 1 ? '' : 's'} available</h2>
        <p>${catalogRecords.length > questions.length
          ? `${catalogRecords.length} catalog record${catalogRecords.length === 1 ? '' : 's'} exist, but only records with local question and mark-scheme image files can be shown.`
          : 'Question crops and mark-scheme crops are the source of truth. Extracted text and route labels are advisory.'}</p>
      </div>
      ${questions.length ? '<a class="button primary-button" href="#mixed-questions">Start with mixed questions</a>' : ''}
    </section>
    <section class="exam-question-section" id="mixed-questions">
      <div class="section-heading">
        <div>
          <h2>Mixed ${escapeHtml(course.shortName)} questions</h2>
          <p>Use these for paper practice only while course routing is awaiting review.</p>
        </div>
      </div>
      <div class="exam-question-grid">
        ${mixedQuestions.map((question) => renderExamQuestionCard(question, pagePath, {
          displayTopic: courseQuestionDisplayTopic(course, question),
          allowAttemptSave: false,
          reviewNote: courseQuestionReviewNote(course),
        })).join('')}
      </div>
      ${mixedQuestions.length === 0 ? `<p class="empty-state">${catalogRecords.length
        ? 'Catalog records exist for this course, but no referenced question and mark-scheme image files are present in this checkout.'
        : 'No usable question and mark-scheme image pairs are available for this course yet.'}</p>` : ''}
    </section>
    <section class="exam-topic-dashboard" aria-label="${escapeAttr(course.shortName)} draft exam directions">
      <div class="section-heading">
        <div>
          <h2>Topic routes</h2>
          <p>Use topic links when the routing sidecar has a matching course topic. Empty topics are shown honestly.</p>
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
                ? `${topicQuestions.length} catalog image pair${topicQuestions.length === 1 ? '' : 's'} matched by rough topic routing.`
                : topicRecords.length > 0
                  ? `${topicRecords.length} catalog record${topicRecords.length === 1 ? '' : 's'} matched, but local image files are missing.`
                  : 'No catalog image pairs are currently matched to this draft topic.'}</p>
            </div>
            ${routeLink(pagePath, seedTopicExamTrainingPagePath(course, topic), 'Open topic Exam Training', 'button secondary-button')}
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
      'Use available question and mark-scheme images for paper practice. This route is intentionally labelled review-needed.',
      topic.headerFormula,
      `${routeLink(pagePath, seedExamTrainingPagePath(course), `Back to ${course.shortName} Exam Training`, 'button secondary-button')}
      ${routeLink(pagePath, seedTopicPagePath(course, topic), 'Topic overview', 'button text-button')}`,
      `${course.shortName} ${topic.syllabusRef}`,
    )}
    ${renderDraftNotice('Topic routing for this course is rough. These image pairs are not mastery evidence, adaptive evidence, or final syllabus-contract coverage.')}
    <section class="exam-question-section" id="topic-exam-questions">
      <div class="section-heading">
        <div>
          <h2>Image-first exam questions</h2>
          <p>Question crops and mark-scheme crops are the source of truth. Route labels are advisory until review.</p>
        </div>
      </div>
      <div class="exam-question-grid">
        ${questions.map((question) => renderExamQuestionCard(question, pagePath, {
          displayTopic: topic.title,
          displaySubtopic: readableRoutingTopicLabel(question),
          allowAttemptSave: false,
          reviewNote: courseQuestionReviewNote(course),
        })).join('')}
      </div>
      ${questions.length === 0 ? `<p class="empty-state">${catalogRecords.length
        ? `${catalogRecords.length} catalog record${catalogRecords.length === 1 ? '' : 's'} are routed to ${escapeHtml(topic.title)}, but the referenced question and mark-scheme image files are not present locally.`
        : `No catalog question and mark-scheme image pairs are currently routed to ${escapeHtml(topic.title)}. This needs review rather than placeholder content.`}</p>` : ''}
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
      'P3 topic compatibility links',
      'Older region-style links now point to the static P3 topic pages, Field Guides, and Practice Questions.',
      'f(x), \\log_a x, \\sin x, \\mathbf{r}=\\mathbf{a}+\\lambda\\mathbf{b}',
    )}
    <section class="topic-grid" aria-label="Topic compatibility links">
      ${contexts.map((context) => renderTopicCard(pagePath, context)).join('')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'P3 Topic Links',
    description: 'Compatibility page linking to static Paper 3 topic pages.',
    active: 'p3-topics',
    body,
  });
}

function renderCompatibilityPage(pagePath: string, title: string, canonicalPagePath: string): string {
  const body = `
    ${renderHero(
      title,
      'This compatibility page points to the current static study page.',
      undefined,
      routeLink(pagePath, canonicalPagePath, 'Open current page', 'button primary-button'),
    )}
  `;
  return renderPage({
    pagePath,
    title,
    description: `${title} compatibility page.`,
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
      'Recommended path: learn the method first. If this topic is already secure, go straight to Practice Questions.',
      topic.headerFormula,
      `${routeLink(pagePath, fieldGuidePath, 'Start Field Guide', 'button primary-button')}
      ${routeLink(pagePath, practicePath, 'Practice now', 'button secondary-button')}
      ${routeLink(pagePath, examTrainingPath, 'Exam Training', 'button text-button')}`,
    )}
    ${renderStudyPath()}
    <section class="topic-overview-grid">
      <article class="summary-card">
        <h2>Your local progress</h2>
        ${progressList(region.id, Math.max(1, fieldGuideTopics.length))}
        <p data-progress-status="${escapeAttr(region.id)}">Progress is stored in this browser when JavaScript is available.</p>
      </article>
      <article class="summary-card">
        <h2>What is available</h2>
        <ul class="plain-list">
          <li>${fieldGuideTopics.length} Field Guide sections</li>
          <li>${totalPracticeItems} focused Practice Questions</li>
          <li>${questions.length} image-first exam questions on this page set</li>
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
        <h2>Practice Questions</h2>
        <p>Go straight to focused questions and image-first exam practice.</p>
        ${routeLink(pagePath, practicePath, 'Practice now', 'button secondary-button')}
      </article>
      <article class="entry-card">
        <p class="eyebrow">Exam images</p>
        <h2>Exam Training</h2>
        <p>Use reviewed question and mark-scheme image pairs for this topic.</p>
        ${routeLink(pagePath, examTrainingPath, 'Open Exam Training', 'button secondary-button')}
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
      <details class="lesson-support-details">
        <summary>Optional support: method table, guided try, and checks</summary>
        ${renderPatternTable(example)}
        <section class="try-block">
          <h4>Guided try</h4>
          <p>${renderMathText(example.tryPrompt)}</p>
          <ul>
            ${example.tryScaffold.map((line) => `<li>${renderMathText(line)}</li>`).join('')}
          </ul>
          ${example.tryWorkedLines?.length ? `
            <details>
              <summary>Show worked route</summary>
              <ol>
                ${example.tryWorkedLines.map((line) => `<li>${renderMathText(line)}</li>`).join('')}
              </ol>
              ${example.tryResult ? `<p><strong>Try result:</strong> ${renderMathText(example.tryResult)}</p>` : ''}
            </details>
          ` : ''}
        </section>
        <ul class="takeaway-list" aria-label="${escapeAttr(topic.title)} takeaways">
          ${example.takeaway.map((line) => `<li>${renderMathText(line)}</li>`).join('')}
        </ul>
      </details>
    </article>
  `;
}

function renderFieldGuideTopic(topic: FieldGuideTopic, region: RegionDefinition, index: number, topicCount: number, nextTopicId: string | undefined, practiceHref: string): string {
  return `
    <article class="field-guide-topic" id="${escapeAttr(topic.id)}" data-field-guide-topic="${escapeAttr(topic.id)}" data-region-id="${escapeAttr(region.id)}">
      <header class="topic-section-header">
        <div>
          <p class="eyebrow">Section ${index + 1} of ${topicCount}</p>
          <h2>${escapeHtml(topic.title)}</h2>
          <p>${escapeHtml(topic.purpose)}</p>
          ${(topic.description || topic.supportNote) ? `
            <details class="support-details">
              <summary>What to notice</summary>
              ${topic.description ? `<p>${escapeHtml(topic.description)}</p>` : ''}
              ${topic.supportNote ? `<p>${renderMathText(topic.supportNote)}</p>` : ''}
            </details>
          ` : ''}
        </div>
        <button class="button secondary-button" type="button" data-complete-field-guide-topic="${escapeAttr(topic.id)}" data-region-id="${escapeAttr(region.id)}" data-topic-title="${escapeAttr(topic.title)}">
          Mark this section complete
        </button>
      </header>
      ${topic.examples.map((example, exampleIndex) => renderFieldGuideExample(topic, example, exampleIndex)).join('')}
      <footer class="section-footer">
        ${nextTopicId ? `<a class="button secondary-button" href="#${escapeAttr(nextTopicId)}">Next section</a>` : `<a class="button primary-button" href="${practiceHref}">Go to Practice Questions</a>`}
      </footer>
    </article>
  `;
}

function renderFieldGuidePage(
  context: TopicContext,
  pagePath = fieldGuidePagePath(context.topic),
  practicePath = practicePagePath(context.topic),
): string {
  const { topic, region, fieldGuideTopics } = context;
  const firstTopicId = fieldGuideTopics[0]?.id ?? '';
  const body = `
    ${renderHero(
      `${topic.name} Field Guide`,
      'Read one section, try the guided example, then mark the section complete.',
      topic.headerFormula,
      `${firstTopicId ? `<a class="button primary-button" href="#${escapeAttr(firstTopicId)}">Start first section</a>` : ''}
      ${routeLink(pagePath, practicePath, 'Practice Questions', 'button secondary-button')}`,
    )}
    <details class="jump-details">
      <summary>Show section list and saved progress</summary>
      <nav class="subnav" aria-label="${escapeAttr(topic.name)} Field Guide sections">
        ${fieldGuideTopics.map((item) => `<a href="#${escapeAttr(item.id)}">${escapeHtml(item.title)}</a>`).join('')}
      </nav>
      <div class="progress-detail-row">
        ${progressList(region.id, Math.max(1, fieldGuideTopics.length))}
        <button class="button secondary-button" type="button" data-complete-field-guide="${escapeAttr(region.id)}">
          Mark all sections complete
        </button>
      </div>
    </details>
    <section class="lesson-stack">
      ${fieldGuideTopics.map((item, index) => renderFieldGuideTopic(
        item,
        region,
        index,
        fieldGuideTopics.length,
        fieldGuideTopics[index + 1]?.id,
        hrefToPage(pagePath, practicePath),
      )).join('')}
    </section>
    <section class="next-step-card">
      <h2>Next step</h2>
      <p>Move to Practice Questions when you can explain the method without rereading the worked example.</p>
      ${routeLink(pagePath, practicePath, 'Practice Questions', 'button primary-button')}
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

function renderAuthoredPractice(group: SkillChecklistTopicGroup, pagePath: string): string {
  if (!group.authoredItems.length) return '';
  return `
    <section class="practice-subsection">
      <h3>Focused checks</h3>
      <div class="practice-card-stack">
        ${group.authoredItems.map((item) => `
          <article class="practice-card">
            <p class="eyebrow">${escapeHtml(item.complexity)} check</p>
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
              Save practice completion
            </button>
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
        Save guided practice
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
  return `
    <article class="practice-topic" id="practice-${escapeAttr(group.topic.id)}">
      <header class="topic-section-header">
        <div>
          <p class="eyebrow">${totalSkillChecklistItems(group)} practice item${totalSkillChecklistItems(group) === 1 ? '' : 's'}</p>
          <h2>${escapeHtml(group.topic.title)}</h2>
          <p>${escapeHtml(group.topic.purpose)}</p>
          <p class="practice-instruction">Try one item first. Open the hint or worked route only when you need it.</p>
        </div>
      </header>
      ${renderAuthoredPractice(group, pagePath)}
      ${renderQuickChecks(group)}
      ${renderGeneratedPractice(group)}
      ${totalSkillChecklistItems(group) === 0 ? '<p class="empty-state">Focused practice for this section is still being prepared.</p>' : ''}
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
      <details class="mark-scheme-details">
        <summary>Show mark scheme image</summary>
        <figure class="question-figure">
          <img loading="lazy" src="${hrefToPublicAsset(pagePath, markSchemeImage)}" alt="${escapeAttr(`${questionTitle(question)} mark scheme image`)}" />
        </figure>
      </details>
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
      </form>` : '<p class="empty-state">Use this image pair for practice only. Saving marks as progress is held back until this course routing is reviewed.</p>'}
    </article>
  `;
}

function renderPracticePage(
  context: TopicContext,
  pagePath = practicePagePath(context.topic),
  fieldGuidePath = fieldGuidePagePath(context.topic),
): string {
  const { topic, region, groups, questions } = context;
  const firstPracticeId = groups[0]?.topic.id ? `practice-${groups[0].topic.id}` : 'exam-questions';
  const body = `
    ${renderHero(
      `${topic.name} Practice Questions`,
      'Start with one focused question. Then try an exam image and mark it from the official mark scheme.',
      topic.headerFormula,
      `<a class="button primary-button" href="#${escapeAttr(firstPracticeId)}">Start first question</a>
      <a class="button secondary-button" href="#exam-questions">Jump to exam questions</a>
      ${routeLink(pagePath, fieldGuidePath, 'Review Field Guide', 'button text-button')}`,
    )}
    <details class="jump-details">
      <summary>Show practice sections and saved progress</summary>
      <nav class="subnav" aria-label="${escapeAttr(topic.name)} practice sections">
        ${groups.map((group) => `<a href="#practice-${escapeAttr(group.topic.id)}">${escapeHtml(group.topic.title)}</a>`).join('')}
        <a href="#exam-questions">Exam questions</a>
      </nav>
      <div class="progress-detail-row">
        ${progressList(region.id, Math.max(1, context.fieldGuideTopics.length))}
        ${routeLink(pagePath, fieldGuidePath, 'Review Field Guide', 'button secondary-button')}
      </div>
    </details>
    <section class="practice-stack">
      ${groups.map((group) => renderSkillPracticeGroup(group, pagePath)).join('')}
    </section>
    <section class="exam-question-section" id="exam-questions">
      <div class="section-heading">
        <div>
          <h2>Image-first exam questions</h2>
          <p>Try the question image first. Reveal the mark scheme only when you are ready to mark your work.</p>
        </div>
      </div>
      <div class="exam-question-grid">
        ${questions.map((question) => renderExamQuestionCard(question, pagePath)).join('')}
      </div>
      ${questions.length === 0 ? '<p class="empty-state">No trainable image-first questions are currently mapped cleanly to this topic.</p>' : ''}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} Practice Questions`,
    description: `Static Practice Questions for ${topic.name}.`,
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
      'Use reviewed Paper 3 question and mark-scheme image pairs for this topic.',
      topic.headerFormula,
      `${questions.length ? '<a class="button primary-button" href="#topic-exam-questions">Start topic questions</a>' : ''}
      ${routeLink(pagePath, practicePath, 'Practice Questions', 'button secondary-button')}
      ${routeLink(pagePath, topicsIndexPath, 'Back to P3 topics', 'button text-button')}`,
    )}
    <section class="exam-question-section" id="topic-exam-questions">
      <div class="section-heading">
        <div>
          <h2>Image-first exam questions</h2>
          <p>Try the question image first. Reveal the mark scheme only when you are ready to mark your work.</p>
        </div>
      </div>
      <div class="exam-question-grid">
        ${questions.map((question) => renderExamQuestionCard(question, pagePath)).join('')}
      </div>
      ${questions.length === 0 ? '<p class="empty-state">No reviewed image-first questions are currently mapped cleanly to this P3 topic.</p>' : ''}
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
      'Use this after topic practice, or for revision when you want mixed Paper 3 questions.',
      '\\frac{dy}{dx}, \\quad \\int_a^b f(x)\\,dx, \\quad \\arg z',
      `<a class="button primary-button" href="#mixed-questions">Start mixed questions</a>
      ${routeLink(pagePath, topicsIndexPath, 'Back to topics', 'button secondary-button')}`,
    )}
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
    <section class="exam-question-section" id="mixed-questions">
      <div class="section-heading">
        <div>
          <h2>Mixed Paper 3 questions</h2>
          <p>Pick one question, work on paper, reveal the mark scheme, then save your marks.</p>
        </div>
      </div>
      <div class="exam-question-grid">
        ${mixedQuestions.map((question) => renderExamQuestionCard(question, pagePath)).join('')}
      </div>
    </section>
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
  return publicAssetExclusions.some((pattern) => pattern.test(toPosix(relativePath)));
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
        htmlByPath.set(seedPracticePagePath(course, topic), renderSeedPracticePage(course, topic, data));
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
    htmlByPath.set(topicExamTrainingPagePath(topic), renderTopicExamTrainingPage(context));
    htmlByPath.set(legacyTopicPagePath(topic), renderTopicHubPage(context, legacyTopicPagePath(topic), legacyFieldGuidePagePath(topic), legacyPracticePagePath(topic), legacyTopicExamTrainingPagePath(topic)));
    htmlByPath.set(legacyFieldGuidePagePath(topic), renderFieldGuidePage(context, legacyFieldGuidePagePath(topic), legacyPracticePagePath(topic)));
    htmlByPath.set(legacyPracticePagePath(topic), renderPracticePage(context, legacyPracticePagePath(topic), legacyFieldGuidePagePath(topic)));
    htmlByPath.set(legacyTopicExamTrainingPagePath(topic), renderTopicExamTrainingPage(context, legacyTopicExamTrainingPagePath(topic), p3TopicsIndexPagePath(), legacyPracticePagePath(topic)));
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
