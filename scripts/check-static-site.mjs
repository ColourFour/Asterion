import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');
const examBankRoot = path.join(repoRoot, 'public/assets/exam-bank-data');

const courseExamFamilies = {
  P3: ['p3'],
};

const fallbackRequiredPages = [
  'index.html',
  'p1/index.html',
  'p3/index.html',
  'm1/index.html',
  's1/index.html',
  'p3/topics/index.html',
  'p3/topics/algebra/field-guide/index.html',
  'p3/topics/algebra/skill-check/index.html',
  'p3/topics/algebra/exam-training/index.html',
  'p3/topics/logarithmic-and-exponential-functions/field-guide/index.html',
  'p3/topics/logarithmic-and-exponential-functions/skill-check/index.html',
  'p3/topics/logarithmic-and-exponential-functions/exam-training/index.html',
  'p3/topics/trigonometry/field-guide/index.html',
  'p3/topics/trigonometry/skill-check/index.html',
  'p3/topics/trigonometry/exam-training/index.html',
  'p3/topics/differentiation/field-guide/index.html',
  'p3/topics/differentiation/skill-check/index.html',
  'p3/topics/differentiation/exam-training/index.html',
  'p3/topics/integration/field-guide/index.html',
  'p3/topics/integration/skill-check/index.html',
  'p3/topics/integration/exam-training/index.html',
  'p3/topics/numerical-solution-of-equations/field-guide/index.html',
  'p3/topics/numerical-solution-of-equations/skill-check/index.html',
  'p3/topics/numerical-solution-of-equations/exam-training/index.html',
  'p3/topics/vectors/field-guide/index.html',
  'p3/topics/vectors/skill-check/index.html',
  'p3/topics/vectors/exam-training/index.html',
  'p3/topics/differential-equations/field-guide/index.html',
  'p3/topics/differential-equations/skill-check/index.html',
  'p3/topics/differential-equations/exam-training/index.html',
  'p3/topics/complex-numbers/field-guide/index.html',
  'p3/topics/complex-numbers/skill-check/index.html',
  'p3/topics/complex-numbers/exam-training/index.html',
];

const manifestPath = path.join(siteRoot, 'static-pages.json');
const requiredPages = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8')).pages.map((page) => page.path)
  : fallbackRequiredPages;

const forbiddenVisibleStudentTerms = [
  'draft',
  'syllabus-contract',
  'audit',
  'mastery evidence',
  'generated practice',
  'mapping',
  'Guardian',
  'XP',
  'world map',
  'restoration ledger',
  'forge',
  'admin',
  'compatibility route',
  'seed content',
  'needs review',
];

function visibleTermPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}($|[^A-Za-z0-9])`, 'i');
}

function collectFiles(directory, root = directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const info = statSync(fullPath);
    if (info.isDirectory()) return collectFiles(fullPath, root);
    return [path.relative(root, fullPath).split(path.sep).join('/')];
  });
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function visibleBodyText(html) {
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  return bodyHtml
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#(?:x[0-9a-f]+|\d+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function catalogImagePairCounts() {
  const catalog = readJson('public/assets/exam-bank-data/asterion_exam_bank_catalog_v1.json');
  const questions = Array.isArray(catalog.questions) ? catalog.questions : [];
  return Object.fromEntries(Object.entries(courseExamFamilies).map(([course, families]) => {
    const records = questions.filter((question) => families.includes(String(question.paper_family).toLowerCase()));
    const localPairs = records.filter((question) => (
      question.question_image_path
      && question.mark_scheme_image_path
      && existsSync(path.join(examBankRoot, question.question_image_path))
      && existsSync(path.join(examBankRoot, question.mark_scheme_image_path))
    )).length;
    return [course, { records: records.length, localPairs }];
  }));
}

const missing = requiredPages.filter((page) => !existsSync(path.join(siteRoot, page)));
if (missing.length) {
  console.error(`Missing static pages:\n${missing.join('\n')}`);
  process.exit(1);
}

if (existsSync(path.join(siteRoot, '404.html'))) {
  console.error('docs/404.html exists, but this branch must not ship an SPA fallback.');
  process.exit(1);
}

const indexHtml = readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
if (indexHtml.includes('id="root"') || indexHtml.includes('/src/main.tsx') || indexHtml.includes('asterion.spa.redirect')) {
  console.error('docs/index.html still looks like a React SPA entrypoint.');
  process.exit(1);
}

for (const page of requiredPages) {
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  if (!html.includes('<main>') || !html.includes('</main>')) {
    console.error(`${page} is missing meaningful document content.`);
    process.exit(1);
  }
}

const forbiddenVisibleHits = [];
for (const page of requiredPages) {
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  const text = visibleBodyText(html);
  for (const term of forbiddenVisibleStudentTerms) {
    if (visibleTermPattern(term).test(text)) {
      forbiddenVisibleHits.push(`${page}: ${term}`);
    }
  }
}
if (forbiddenVisibleHits.length) {
  console.error(`Static pages contain forbidden student-facing visible text:\n${forbiddenVisibleHits.join('\n')}`);
  process.exit(1);
}

const internalStudentCopy = [
  'Draft seed content',
  'needs syllabus-contract review',
  'starter study notes only',
  'not mastery evidence',
  'final exam-bank mapping',
  'not mastery or readiness evidence',
  'not reviewed exam questions',
  'not yet a reviewed course contract',
  'mastery signal',
  'review-needed',
  'official progress evidence',
];

for (const page of requiredPages) {
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  const matchedCopy = internalStudentCopy.find((phrase) => html.includes(phrase));
  if (matchedCopy) {
    console.error(`${page} includes internal student-facing copy: ${matchedCopy}`);
    process.exit(1);
  }
}

for (const course of ['p1', 'p3', 'm1', 's1']) {
  const page = `${course}/exam-training/index.html`;
  if (existsSync(path.join(siteRoot, page))) {
    console.error(`${page} should not exist on the static P3 product branch.`);
    process.exit(1);
  }
}

const topicExamTrainingPages = requiredPages.filter((page) => (
  /^p3\/topics\/[^/]+\/exam-training\/index\.html$/.test(page)
));
if (!topicExamTrainingPages.length) {
  console.error('No generated topic Exam Training pages were declared.');
  process.exit(1);
}

function resolvePageAsset(page, src) {
  const clean = decodeURI(src).replace(/[?#].*$/, '');
  if (/^https?:\/\//i.test(clean) || clean.startsWith('data:')) return undefined;
  if (clean.startsWith('/')) return path.join(siteRoot, clean.replace(/^\/+/, ''));
  return path.resolve(path.dirname(path.join(siteRoot, page)), clean);
}

const missingImageRefs = [];
const examBankImageRefs = [];
for (const page of requiredPages) {
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  for (const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) {
    const src = match[1];
    if (!src.includes('assets/exam-bank-data')) continue;
    const resolved = resolvePageAsset(page, src);
    if (!resolved) continue;
    examBankImageRefs.push({ page, src });
    if (!existsSync(resolved)) missingImageRefs.push(`${page}: ${src}`);
  }
}
if (missingImageRefs.length) {
  console.error(`Static pages reference missing exam-bank images:\n${missingImageRefs.join('\n')}`);
  process.exit(1);
}

const p3TopicExamPages = topicExamTrainingPages.filter((page) => page.startsWith('p3/'));
if (!p3TopicExamPages.some((page) => {
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  return html.includes('exam-question-card') && html.includes('mark-scheme-details');
})) {
  console.error('No P3 topic Exam Training page includes real question and mark-scheme image cards.');
  process.exit(1);
}

if (!examBankImageRefs.length) {
  console.error('No static page references exam-bank question or mark-scheme images.');
  process.exit(1);
}

const courseImageCounts = catalogImagePairCounts();
for (const [course, counts] of Object.entries(courseImageCounts)) {
  const courseSlug = course.toLowerCase();
  if (courseSlug !== 'p3') continue;
  const topicExamHtml = p3TopicExamPages.map((page) => readFileSync(path.join(siteRoot, page), 'utf8')).join('\n');
  const hasImageCards = topicExamHtml.includes('exam-question-card') && topicExamHtml.includes('mark-scheme-details');
  if (counts.localPairs > 0 && !hasImageCards) {
    console.error('P3 topic Exam Training pages have local image pairs but no generated image cards.');
    process.exit(1);
  }
}

const forbiddenRouteDirectories = [
  'topics',
  'regions',
  'exam-training',
  'p3/regions',
  'p3/exam-training',
  'p1/topics',
  'm1/topics',
  's1/topics',
];
for (const directory of forbiddenRouteDirectories) {
  if (existsSync(path.join(siteRoot, directory))) {
    console.error(`Forbidden legacy or demoted route directory exists in docs/: ${directory}`);
    process.exit(1);
  }
}

const forbiddenRouteFiles = collectFiles(path.join(siteRoot, 'p3/topics'))
  .filter((file) => (
    /\/practice\/index\.html$/.test(file)
    || /^[^/]+\/index\.html$/.test(file)
  ));
if (forbiddenRouteFiles.length) {
  console.error(`P3 topic routes must be only field-guide, skill-check, and exam-training:\n${forbiddenRouteFiles.join('\n')}`);
  process.exit(1);
}

const forbiddenSourceFiles = collectFiles(siteRoot).filter((file) => (
  /\.md$/i.test(file)
  || /\.tsx?$/i.test(file)
  || file === 'package.json'
  || file === 'package-lock.json'
  || /^scripts\//.test(file)
  || /^src\//.test(file)
  || /^\.github\//.test(file)
));

if (forbiddenSourceFiles.length) {
  console.error(`docs/ must contain only generated static site output. Remove source files:\n${forbiddenSourceFiles.join('\n')}`);
  process.exit(1);
}

for (const [course, counts] of Object.entries(courseImageCounts)) {
  console.log(`${course} catalog records: ${counts.records}`);
  console.log(`${course} local image pairs: ${counts.localPairs}`);
}
console.log(`Static site check passed for ${requiredPages.length} HTML pages in docs/.`);
