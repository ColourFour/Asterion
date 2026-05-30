import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const distRoot = path.join(repoRoot, 'dist');

const requiredPages = [
  'index.html',
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

const missing = requiredPages.filter((page) => !existsSync(path.join(distRoot, page)));
if (missing.length) {
  console.error(`Missing static pages:\n${missing.join('\n')}`);
  process.exit(1);
}

if (existsSync(path.join(distRoot, '404.html'))) {
  console.error('dist/404.html exists, but this branch must not ship an SPA fallback.');
  process.exit(1);
}

const indexHtml = readFileSync(path.join(distRoot, 'index.html'), 'utf8');
if (indexHtml.includes('id="root"') || indexHtml.includes('/src/main.tsx') || indexHtml.includes('asterion.spa.redirect')) {
  console.error('dist/index.html still looks like a React SPA entrypoint.');
  process.exit(1);
}

for (const page of requiredPages) {
  const html = readFileSync(path.join(distRoot, page), 'utf8');
  if (!html.includes('<main>') || !html.includes('</main>')) {
    console.error(`${page} is missing meaningful document content.`);
    process.exit(1);
  }
}

console.log(`Static dist check passed for ${requiredPages.length} HTML pages.`);
