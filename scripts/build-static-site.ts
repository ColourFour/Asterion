import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { getFieldGuideTopicsForRegion, type FieldGuideTopic, type FieldGuideTopicExample } from '../src/data/fieldGuideTopics';
import { buildSkillChecklistTopicGroups, totalSkillChecklistItems, type SkillChecklistTopicGroup } from '../src/lib/skillChecklist';
import { getGeneratedPracticeForRegion, normalizeGeneratedPracticeData, reviewedGeneratedPractice, type GeneratedPracticeItem } from '../src/lib/generatedPractice';
import { normalizeQuestionBankWithDiagnostics } from '../src/lib/normalizeQuestionBank';
import { filterTrainableQuestionsForRegion, isTrainableP3Question } from '../src/lib/questionTraining';
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
  active: 'home' | 'regions' | 'exam-training' | 'topic';
  body: string;
}

const mathDelimiterPattern = /(\$\$[\s\S]+?\$\$|\$(?!\$)[\s\S]+?\$)/g;
const visibleGameTerms = [
  'Guardian Challenge',
  'XP',
  'gold',
  'avatar',
  'reward',
  'world map',
  'academy',
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

function topicPagePath(topic: StudyTopic): string {
  return `topics/${topic.slug}/index.html`;
}

function fieldGuidePagePath(topic: StudyTopic): string {
  return `topics/${topic.slug}/field-guide/index.html`;
}

function practicePagePath(topic: StudyTopic): string {
  return `topics/${topic.slug}/practice/index.html`;
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
    { key: 'home', label: 'Topics', path: 'index.html' },
    { key: 'regions', label: 'Regions', path: 'regions/index.html' },
    { key: 'exam-training', label: 'Exam Training', path: 'exam-training/index.html' },
  ] as const;

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
          <small>CAIE 9709 Paper 3</small>
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

function renderTopicCard(fromPagePath: string, context: TopicContext): string {
  const { topic, region, fieldGuideTopics } = context;
  return `
    <article class="topic-card" data-region-card="${escapeAttr(region.id)}">
      <div class="topic-card-formula">${renderInlineFormula(topic.headerFormula)}</div>
      <h2>${escapeHtml(topic.name)}</h2>
      <p>${escapeHtml(topic.description)}</p>
      ${compactProgress(region.id, Math.max(1, fieldGuideTopics.length))}
      <div class="button-row">
        ${routeLink(fromPagePath, fieldGuidePagePath(topic), 'Start Field Guide', 'button primary-button')}
        ${routeLink(fromPagePath, practicePagePath(topic), 'Practice now', 'button secondary-button')}
        ${routeLink(fromPagePath, topicPagePath(topic), 'Topic overview', 'button text-button')}
      </div>
    </article>
  `;
}

function renderHero(title: string, body: string, formula?: string, actions = ''): string {
  return `
    <section class="page-hero">
      <div>
        <p class="eyebrow">CAIE 9709 Paper 3</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(body)}</p>
        ${actions ? `<div class="hero-actions">${actions}</div>` : ''}
      </div>
      ${formula ? `<div class="formula-panel" aria-hidden="true">${renderInlineFormula(formula)}</div>` : ''}
    </section>
  `;
}

function renderHomePage(data: StaticSiteData): string {
  const pagePath = 'index.html';
  const contexts = STUDY_TOPICS.map((topic) => topicContext(topic, data));
  const body = `
    ${renderHero(
      'CAIE 9709 Paper 3 Study',
      'Start with one short Field Guide section, then practise the same topic before moving to mixed exam questions.',
      '\\int f(x)\\,dx \\quad \\mathbf{a}\\cdot\\mathbf{b} \\quad z=x+iy',
      `${routeLink(pagePath, fieldGuidePagePath(STUDY_TOPICS[0]), 'Start with Algebra Field Guide', 'button primary-button')}
      <a class="button secondary-button" href="#topic-list">Choose another topic</a>
      ${routeLink(pagePath, 'exam-training/index.html', 'Go to Exam Training', 'button text-button')}`,
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
      ${routeLink(pagePath, 'exam-training/index.html', 'Open Exam Training', 'button primary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'CAIE 9709 Paper 3 Study',
    description: 'Static CAIE 9709 Paper 3 study portal homepage.',
    active: 'home',
    body,
  });
}

function renderRegionsPage(data: StaticSiteData): string {
  const pagePath = 'regions/index.html';
  const contexts = STUDY_TOPICS.map((topic) => topicContext(topic, data));
  const body = `
    ${renderHero(
      'Regions',
      'Older region links now point to the static topic pages, Field Guides, and Practice Questions.',
      'f(x), \\log_a x, \\sin x, \\mathbf{r}=\\mathbf{a}+\\lambda\\mathbf{b}',
    )}
    <section class="topic-grid" aria-label="Topic compatibility links">
      ${contexts.map((context) => renderTopicCard(pagePath, context)).join('')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: 'Regions',
    description: 'Compatibility page linking to static Paper 3 topic pages.',
    active: 'regions',
    body,
  });
}

function renderTopicHubPage(context: TopicContext): string {
  const pagePath = topicPagePath(context.topic);
  const { topic, region, fieldGuideTopics, questions, groups } = context;
  const totalPracticeItems = groups.reduce((sum, group) => sum + totalSkillChecklistItems(group), 0);
  const body = `
    ${renderHero(
      `${topic.name} Study`,
      'Recommended path: learn the method first. If this topic is already secure, go straight to Practice Questions.',
      topic.headerFormula,
      `${routeLink(pagePath, fieldGuidePagePath(topic), 'Start Field Guide', 'button primary-button')}
      ${routeLink(pagePath, practicePagePath(topic), 'Practice now', 'button secondary-button')}`,
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
        ${routeLink(pagePath, fieldGuidePagePath(topic), 'Start Field Guide', 'button primary-button')}
      </article>
      <article class="entry-card">
        <p class="eyebrow">Confident already?</p>
        <h2>Practice Questions</h2>
        <p>Go straight to focused questions and image-first exam practice.</p>
        ${routeLink(pagePath, practicePagePath(topic), 'Practice now', 'button secondary-button')}
      </article>
    </section>
  `;
  return renderPage({
    pagePath,
    title: topic.name,
    description: topic.description,
    active: 'topic',
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

function renderFieldGuidePage(context: TopicContext): string {
  const pagePath = fieldGuidePagePath(context.topic);
  const { topic, region, fieldGuideTopics } = context;
  const firstTopicId = fieldGuideTopics[0]?.id ?? '';
  const body = `
    ${renderHero(
      `${topic.name} Field Guide`,
      'Read one section, try the guided example, then mark the section complete.',
      topic.headerFormula,
      `${firstTopicId ? `<a class="button primary-button" href="#${escapeAttr(firstTopicId)}">Start first section</a>` : ''}
      ${routeLink(pagePath, practicePagePath(topic), 'Practice Questions', 'button secondary-button')}`,
    )}
    <nav class="subnav" aria-label="${escapeAttr(topic.name)} Field Guide sections">
      ${fieldGuideTopics.map((item) => `<a href="#${escapeAttr(item.id)}">${escapeHtml(item.title)}</a>`).join('')}
    </nav>
    <section class="progress-banner">
      <div>
        <h2>Field Guide progress</h2>
        <p>Do one section at a time. Your local progress updates when JavaScript is available.</p>
        ${progressList(region.id, Math.max(1, fieldGuideTopics.length))}
      </div>
      <button class="button secondary-button" type="button" data-complete-field-guide="${escapeAttr(region.id)}">
        Mark all sections complete
      </button>
    </section>
    <section class="lesson-stack">
      ${fieldGuideTopics.map((item, index) => renderFieldGuideTopic(
        item,
        region,
        index,
        fieldGuideTopics.length,
        fieldGuideTopics[index + 1]?.id,
        hrefToPage(pagePath, practicePagePath(topic)),
      )).join('')}
    </section>
    <section class="next-step-card">
      <h2>Next step</h2>
      <p>Move to Practice Questions when you can explain the method without rereading the worked example.</p>
      ${routeLink(pagePath, practicePagePath(topic), 'Practice Questions', 'button primary-button')}
    </section>
  `;
  return renderPage({
    pagePath,
    title: `${topic.name} Field Guide`,
    description: `Static Field Guide lessons for ${topic.name}.`,
    active: 'topic',
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

function renderExamQuestionCard(question: NormalizedQuestion, pagePath: string): string {
  const questionImage = question.questionImageUrls[0];
  const markSchemeImage = question.markSchemeImageUrls[0];
  if (!questionImage || !markSchemeImage) return '';
  const totalMarks = marksAvailable(question);
  return `
    <article class="exam-question-card" id="question-${escapeAttr(question.id)}">
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(questionTitle(question))}</p>
          <h3>${escapeHtml(displayTopicForQuestion(question))}</h3>
          ${question.displaySubtopic ? `<p>${escapeHtml(question.displaySubtopic)}</p>` : ''}
          <p class="question-instruction">Work on paper first, then use the mark scheme to self-mark.</p>
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
      <form class="attempt-form" data-save-exam-attempt data-question-id="${escapeAttr(question.id)}" data-paper-family="${escapeAttr(question.paperFamily)}" data-paper="${escapeAttr(question.paper)}" data-question-number="${escapeAttr(question.questionNumber)}" data-topic="${escapeAttr(displayTopicForQuestion(question))}" data-subtopic="${escapeAttr(question.displaySubtopic)}" data-marks-available="${totalMarks}" data-validated-region-id="${escapeAttr(question.routeEvidence?.validatedRegionId)}" data-display-region-id="${escapeAttr(question.routeEvidence?.displayRegionId)}">
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
      </form>
    </article>
  `;
}

function renderPracticePage(context: TopicContext): string {
  const pagePath = practicePagePath(context.topic);
  const { topic, region, groups, questions } = context;
  const firstPracticeId = groups[0]?.topic.id ? `practice-${groups[0].topic.id}` : 'exam-questions';
  const body = `
    ${renderHero(
      `${topic.name} Practice Questions`,
      'Start with one focused question. Then try an exam image and mark it from the official mark scheme.',
      topic.headerFormula,
      `<a class="button primary-button" href="#${escapeAttr(firstPracticeId)}">Start first question</a>
      <a class="button secondary-button" href="#exam-questions">Jump to exam questions</a>
      ${routeLink(pagePath, fieldGuidePagePath(topic), 'Review Field Guide', 'button text-button')}`,
    )}
    <section class="progress-banner">
      <div>
        <h2>Saved progress</h2>
        <p>Completion saves stay on this browser. You can practise without saving anything.</p>
        ${progressList(region.id, Math.max(1, context.fieldGuideTopics.length))}
      </div>
      ${routeLink(pagePath, fieldGuidePagePath(topic), 'Review Field Guide', 'button secondary-button')}
    </section>
    <nav class="subnav" aria-label="${escapeAttr(topic.name)} practice sections">
      ${groups.map((group) => `<a href="#practice-${escapeAttr(group.topic.id)}">${escapeHtml(group.topic.title)}</a>`).join('')}
      <a href="#exam-questions">Exam questions</a>
    </nav>
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
    active: 'topic',
    body,
  });
}

function renderExamTrainingTopicCard(fromPagePath: string, context: TopicContext): string {
  const total = Math.max(1, context.fieldGuideTopics.length);
  return `
    <article class="exam-topic-row" data-region-card="${escapeAttr(context.region.id)}">
      <div>
        <h3>${escapeHtml(context.topic.name)}</h3>
        ${compactProgress(context.region.id, total)}
      </div>
      ${routeLink(fromPagePath, practicePagePath(context.topic), 'Practice this topic', 'button secondary-button')}
    </article>
  `;
}

function renderExamTrainingPage(data: StaticSiteData): string {
  const pagePath = 'exam-training/index.html';
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
      ${routeLink(pagePath, 'index.html', 'Back to topics', 'button secondary-button')}`,
    )}
    <section class="exam-callout">
      <div>
        <p class="eyebrow">Local dashboard</p>
        <h2>Saved progress in this browser</h2>
        <p>Use the totals as a revision guide, not a grade.</p>
      </div>
      <div class="exam-stats">
        <span data-total-attempts>0 saved Paper 3 attempts</span>
        <span data-topic-tried-count>0 topic areas tried</span>
      </div>
    </section>
    <section class="exam-mode-grid" aria-label="Exam Training modes">
      <article>
        <h2>Core Practice</h2>
        <p>Use mixed questions after you have practised at least one topic.</p>
      </article>
      <article>
        <h2>Weak Area Review</h2>
        <p>Return to topics with lower saved marks or repeated mistakes.</p>
      </article>
      <article>
        <h2>Stretch Practice</h2>
        <p>Choose longer questions when recent topic work feels secure.</p>
      </article>
    </section>
    <section class="exam-topic-dashboard" aria-label="Topic progress dashboard">
      <div class="section-heading">
        <div>
          <h2>Topic progress</h2>
          <p>Use this list to choose the next topic to practise.</p>
        </div>
      </div>
      <div class="exam-topic-list">
        ${contexts.map((context) => renderExamTrainingTopicCard(pagePath, context)).join('')}
      </div>
    </section>
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
  `;
  return renderPage({
    pagePath,
    title: 'Exam Training',
    description: 'Static Exam Training dashboard for Paper 3 practice.',
    active: 'exam-training',
    body,
  });
}

async function ensureParent(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function writeStaticPage(pagePath: string, html: string): Promise<void> {
  const destination = path.join(outputRoot, pagePath);
  await ensureParent(destination);
  await writeFile(destination, html, 'utf8');
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
  const topicRouting = await readJson('public/assets/exam-bank-data/question_bank.topic_routing.v1.json');
  const generatedPracticeJson = await readJson('public/data/generated_practice_bank.json');
  const teachingSnippetsJson = await readJson('public/data/teaching_snippets.json');
  const { questions } = normalizeQuestionBankWithDiagnostics(questionBank, {}, topicRouting, {
    contentSourceKind: 'projected-bank',
  });

  return {
    questions: questions.filter(isTrainableP3Question),
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

  htmlByPath.set('index.html', renderHomePage(data));
  htmlByPath.set('regions/index.html', renderRegionsPage(data));

  for (const topic of STUDY_TOPICS) {
    const context = topicContext(topic, data);
    htmlByPath.set(topicPagePath(topic), renderTopicHubPage(context));
    htmlByPath.set(fieldGuidePagePath(topic), renderFieldGuidePage(context));
    htmlByPath.set(practicePagePath(topic), renderPracticePage(context));
  }

  htmlByPath.set('exam-training/index.html', renderExamTrainingPage(data));
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
  }, null, 2)}\n`, 'utf8');

  console.log(`Generated ${htmlByPath.size} static HTML pages in ${toPosix(path.relative(repoRoot, outputRoot))}/`);
}

generate().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
