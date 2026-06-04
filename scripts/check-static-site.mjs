import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');
const examBankRoot = path.join(repoRoot, 'public/assets/exam-bank-data');

const courseExamFamilies = {
  P1: ['p1'],
  P3: ['p3'],
  M1: ['p4'],
  S1: ['p5'],
};

const fallbackRequiredPages = [
  'index.html',
  'p1/index.html',
  'p3/index.html',
  'm1/index.html',
  's1/index.html',
  'p3/topics/index.html',
  'p3/topics/algebra/index.html',
  'p3/topics/algebra/field-guide/index.html',
  'p3/topics/algebra/practice/index.html',
  'p3/topics/logarithms/index.html',
  'p3/topics/logarithms/field-guide/index.html',
  'p3/topics/logarithms/practice/index.html',
  'p3/topics/trigonometry/index.html',
  'p3/topics/trigonometry/field-guide/index.html',
  'p3/topics/trigonometry/practice/index.html',
  'p3/topics/argand/index.html',
  'p3/topics/argand/field-guide/index.html',
  'p3/topics/argand/practice/index.html',
  'p3/topics/calculus/index.html',
  'p3/topics/calculus/field-guide/index.html',
  'p3/topics/calculus/practice/index.html',
  'p3/topics/integration/index.html',
  'p3/topics/integration/field-guide/index.html',
  'p3/topics/integration/practice/index.html',
  'p3/topics/vectors/index.html',
  'p3/topics/vectors/field-guide/index.html',
  'p3/topics/vectors/practice/index.html',
  'p3/topics/iteration/index.html',
  'p3/topics/iteration/field-guide/index.html',
  'p3/topics/iteration/practice/index.html',
  'p3/topics/differential-equations/index.html',
  'p3/topics/differential-equations/field-guide/index.html',
  'p3/topics/differential-equations/practice/index.html',
  'p3/exam-training/index.html',
  'p3/regions/index.html',
  'regions/index.html',
  'topics/algebra/index.html',
  'topics/algebra/field-guide/index.html',
  'topics/algebra/practice/index.html',
  'topics/logarithms/index.html',
  'topics/logarithms/field-guide/index.html',
  'topics/logarithms/practice/index.html',
  'topics/trigonometry/index.html',
  'topics/trigonometry/field-guide/index.html',
  'topics/trigonometry/practice/index.html',
  'topics/argand/index.html',
  'topics/argand/field-guide/index.html',
  'topics/argand/practice/index.html',
  'topics/calculus/index.html',
  'topics/calculus/field-guide/index.html',
  'topics/calculus/practice/index.html',
  'topics/integration/index.html',
  'topics/integration/field-guide/index.html',
  'topics/integration/practice/index.html',
  'topics/vectors/index.html',
  'topics/vectors/field-guide/index.html',
  'topics/vectors/practice/index.html',
  'topics/iteration/index.html',
  'topics/iteration/field-guide/index.html',
  'topics/iteration/practice/index.html',
  'topics/differential-equations/index.html',
  'topics/differential-equations/field-guide/index.html',
  'topics/differential-equations/practice/index.html',
  'exam-training/index.html',
];

const manifestPath = path.join(siteRoot, 'static-pages.json');
const requiredPages = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8')).pages.map((page) => page.path)
  : fallbackRequiredPages;

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
  'support-only',
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
  if (!requiredPages.includes(page) || !existsSync(path.join(siteRoot, page))) {
    console.error(`${page} is missing from generated Exam Training pages.`);
    process.exit(1);
  }
}

const topicExamTrainingPages = requiredPages.filter((page) => (
  /^(p1|p3|m1|s1)\/topics\/[^/]+\/exam-training\/index\.html$/.test(page)
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

const p3ExamHtml = readFileSync(path.join(siteRoot, 'p3/exam-training/index.html'), 'utf8');
if (!p3ExamHtml.includes('exam-question-card') || !p3ExamHtml.includes('mark-scheme-details')) {
  console.error('p3/exam-training/index.html is missing real question or mark-scheme image cards.');
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
  const html = readFileSync(path.join(siteRoot, `${courseSlug}/exam-training/index.html`), 'utf8');
  const hasImageCards = html.includes('exam-question-card') && html.includes('mark-scheme-details');
  if (counts.localPairs > 0 && !hasImageCards) {
    console.error(`${courseSlug}/exam-training/index.html has ${counts.localPairs} local image pairs but no generated image cards.`);
    process.exit(1);
  }
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
