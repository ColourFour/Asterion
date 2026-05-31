import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');

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

for (const page of requiredPages.filter((page) => /^(p1|m1|s1)\/topics\/[^/]+\/index\.html$/.test(page))) {
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  if (!html.includes('Draft seed content - needs syllabus-contract review.')) {
    console.error(`${page} is missing the visible draft seed warning.`);
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

console.log(`Static site check passed for ${requiredPages.length} HTML pages in docs/.`);
