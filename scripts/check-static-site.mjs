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
  'p3/need-to-know/index.html',
  'p3/content-qa/index.html',
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

const p3ContractPages = [
  'p3/need-to-know/index.html',
  'p3/content-qa/index.html',
];

const forbiddenContractPageTerms = [
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
  'restoration ledger',
  'forge',
  'classroom',
];

const forbiddenCoverageClaims = [
  'complete coverage',
  'fully covered',
  'all skills are ready',
  'every skill is ready',
  'complete P3 course',
  'complete syllabus coverage',
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
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(?:x[0-9a-f]+|\d+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contractSkillIds() {
  const source = readFileSync(path.join(repoRoot, 'src/data/p3SkillContract.ts'), 'utf8');
  return new Set(Array.from(source.matchAll(/\bid:\s*'([^']+)'/g)).map((match) => match[1]));
}

function contractExamTriggersBySkillId() {
  const source = readFileSync(path.join(repoRoot, 'src/data/p3SkillContract.ts'), 'utf8');
  const entries = [...source.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?examTriggers:\s*\[([\s\S]*?)\],[\s\S]*?\n\s*\}/g)];
  return new Map(entries.map((match) => [
    match[1],
    [...match[2].matchAll(/'([^']+)'/g)].map((trigger) => trigger[1]),
  ]));
}

function mappedExamQuestionCountsBySkillId() {
  const report = readJson('tools/content_lab/outputs/p3_skill_coverage_report.json');
  return new Map(report.skills.map((skill) => [
    skill.skill_id,
    Array.isArray(skill.resolved_trainable_canonical_question_ids)
      ? skill.resolved_trainable_canonical_question_ids.length
      : skill.trainable_canonical_question_count,
  ]));
}

function dataAttributeValues(html, attribute) {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(html.matchAll(new RegExp(`\\b${escaped}="([^"]+)"`, 'g'))).map((match) => match[1]);
}

function hrefsWithCanonicalPaths(html) {
  return Array.from(html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*\bdata-canonical-path="([^"]+)"/gi))
    .map((match) => ({ href: match[1], canonicalPath: match[2] }));
}

function pageAnchors(html) {
  return Array.from(html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)).map((match) => match[1]);
}

function resolveHtmlHref(page, href) {
  const clean = decodeURI(href).replace(/[?#].*$/, '');
  if (/^https?:\/\//i.test(clean) || clean.startsWith('data:')) return undefined;
  const base = path.dirname(path.join(siteRoot, page));
  const resolved = clean.startsWith('/')
    ? path.join(siteRoot, clean.replace(/^\/+/, ''))
    : path.resolve(base, clean);
  const relative = path.relative(siteRoot, resolved).split(path.sep).join('/');
  if (/\.html$/i.test(relative)) return relative;
  return `${relative.replace(/\/$/, '')}/index.html`;
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

for (const page of requiredPages) {
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  const text = visibleBodyText(html);
  const claim = forbiddenCoverageClaims.find((phrase) => visibleTermPattern(phrase).test(text));
  if (claim) {
    console.error(`${page} includes an unsupported completeness claim: ${claim}`);
    process.exit(1);
  }
}

for (const page of requiredPages) {
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  for (const href of pageAnchors(html)) {
    if (
      href.startsWith('#')
      || /^https?:\/\//i.test(href)
      || /^mailto:/i.test(href)
      || /^tel:/i.test(href)
      || href.startsWith('data:')
    ) {
      continue;
    }
    const resolvedPath = resolveHtmlHref(page, href);
    if (!resolvedPath || !existsSync(path.join(siteRoot, resolvedPath))) {
      console.error(`${page} has a broken internal link: ${href} -> ${resolvedPath}`);
      process.exit(1);
    }
  }
}

const forbiddenVisibleHits = [];
for (const page of requiredPages) {
  if (p3ContractPages.includes(page)) continue;
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
  if (p3ContractPages.includes(page)) continue;
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  const matchedCopy = internalStudentCopy.find((phrase) => html.includes(phrase));
  if (matchedCopy) {
    console.error(`${page} includes internal student-facing copy: ${matchedCopy}`);
    process.exit(1);
  }
}

const contractIds = contractSkillIds();
const contractTriggers = contractExamTriggersBySkillId();
const mappedExamCounts = mappedExamQuestionCountsBySkillId();
for (const page of p3ContractPages) {
  const fullPath = path.join(siteRoot, page);
  if (!existsSync(fullPath)) {
    console.error(`P3 contract page was not generated: ${page}`);
    process.exit(1);
  }

  const html = readFileSync(fullPath, 'utf8');
  const text = visibleBodyText(html);
  const displayedIds = dataAttributeValues(html, 'data-skill-id');
  const uniqueDisplayedIds = new Set(displayedIds);
  const unknownIds = [...uniqueDisplayedIds].filter((id) => !contractIds.has(id));
  const missingIds = [...contractIds].filter((id) => !uniqueDisplayedIds.has(id));

  if (unknownIds.length || missingIds.length) {
    console.error([
      `${page} does not display exactly the P3 skill contract skills.`,
      unknownIds.length ? `Unknown displayed skill IDs: ${unknownIds.join(', ')}` : '',
      missingIds.length ? `Missing contract skill IDs: ${missingIds.join(', ')}` : '',
    ].filter(Boolean).join('\n'));
    process.exit(1);
  }

  for (const term of forbiddenContractPageTerms) {
    if (visibleTermPattern(term).test(text)) {
      console.error(`${page} contains forbidden game/lore visible text: ${term}`);
      process.exit(1);
    }
  }
}

const needToKnowHtml = readFileSync(path.join(siteRoot, 'p3/need-to-know/index.html'), 'utf8');
if (!needToKnowHtml.includes('contract-trigger-list')) {
  console.error('P3 Need to Know page does not render exam trigger UI.');
  process.exit(1);
}
for (const [skillId, triggers] of contractTriggers) {
  if (!triggers.length) {
    console.error(`P3 contract skill has no machine-readable exam triggers: ${skillId}`);
    process.exit(1);
  }
  const skillCardMatch = needToKnowHtml.match(new RegExp(`<article class="contract-skill-card" data-skill-id="${skillId}">([\\s\\S]*?)<\\/article>`));
  if (!skillCardMatch) {
    console.error(`P3 Need to Know page is missing trigger UI card for ${skillId}`);
    process.exit(1);
  }
  const skillCardText = visibleBodyText(skillCardMatch[1]);
  const missingTrigger = triggers.find((trigger) => !skillCardText.includes(trigger));
  if (missingTrigger) {
    console.error(`P3 Need to Know page is missing trigger "${missingTrigger}" for ${skillId}`);
    process.exit(1);
  }
}

const contractLinks = hrefsWithCanonicalPaths(needToKnowHtml);
if (!contractLinks.length) {
  console.error('P3 Need to Know page has no generated Field Guide, Skill Check, or Exam Training links.');
  process.exit(1);
}
for (const requiredLabel of ['Ready', 'Needs Field Guide', 'Needs Skill Check', 'Draft']) {
  if (!visibleBodyText(needToKnowHtml).includes(requiredLabel)) {
    console.error(`P3 Need to Know page does not keep the "${requiredLabel}" status visible.`);
    process.exit(1);
  }
}
if (!pageAnchors(needToKnowHtml).some((href) => resolveHtmlHref('p3/need-to-know/index.html', href) === 'p3/content-qa/index.html')) {
  console.error('P3 Need to Know page does not link to the canonical Content QA route.');
  process.exit(1);
}
for (const { href, canonicalPath } of contractLinks) {
  if (!/^p3\/topics\/[^/]+\/(?:field-guide|skill-check|exam-training)\/index\.html$/.test(canonicalPath)) {
    console.error(`P3 Need to Know link has a non-canonical target: ${canonicalPath}`);
    process.exit(1);
  }
  const resolvedPath = resolveHtmlHref('p3/need-to-know/index.html', href);
  if (resolvedPath !== canonicalPath) {
    console.error(`P3 Need to Know link href does not resolve to its canonical path: ${href} -> ${resolvedPath}, expected ${canonicalPath}`);
    process.exit(1);
  }
  if (!existsSync(path.join(siteRoot, canonicalPath))) {
    console.error(`P3 Need to Know link points to a missing generated page: ${canonicalPath}`);
    process.exit(1);
  }
}

const contentQaText = visibleBodyText(readFileSync(path.join(siteRoot, 'p3/content-qa/index.html'), 'utf8'));
if (/\b(?:P1|M1|S1)\b/.test(contentQaText) && !contentQaText.includes('P1, M1, and S1 are not part of this contract.')) {
  console.error('P3 Content QA must not promote P1, M1, or S1 as ready contract courses.');
  process.exit(1);
}
const contentQaHtml = readFileSync(path.join(siteRoot, 'p3/content-qa/index.html'), 'utf8');
if (!contentQaText.includes('Missing')) {
  console.error('P3 Content QA must keep missing coverage visible.');
  process.exit(1);
}
if (!pageAnchors(contentQaHtml).some((href) => resolveHtmlHref('p3/content-qa/index.html', href) === 'p3/need-to-know/index.html')) {
  console.error('P3 Content QA page does not link to the canonical Need to Know route.');
  process.exit(1);
}
for (const ladderLevel of ['easy', 'standard', 'hard', 'mixed']) {
  if (!contentQaHtml.includes(`data-ladder-level="${ladderLevel}"`)) {
    console.error(`P3 Content QA does not surface the ${ladderLevel} ladder bucket.`);
    process.exit(1);
  }
}
for (const skillId of contractIds) {
  const rowMatch = contentQaHtml.match(new RegExp(`<tr data-skill-id="${skillId}">([\\s\\S]*?)<\\/tr>`));
  if (!rowMatch) {
    console.error(`P3 Content QA is missing ladder row for ${skillId}`);
    process.exit(1);
  }
  const rowHtml = rowMatch[1];
  for (const ladderLevel of ['easy', 'standard', 'hard']) {
    if (!new RegExp(`data-ladder-level="${ladderLevel}"[\\s\\S]*?>Missing<`).test(rowHtml)) {
      console.error(`P3 Content QA must show missing ${ladderLevel} ladder coverage for ${skillId}.`);
      process.exit(1);
    }
  }
  const expectedMixedCount = mappedExamCounts.get(skillId);
  if (typeof expectedMixedCount === 'number') {
    const mixedPattern = expectedMixedCount > 0
      ? `data-ladder-level="mixed"[\\s\\S]*?>Mapped questions \\(${expectedMixedCount}\\)<`
      : 'data-ladder-level="mixed"[\\s\\S]*?>Missing<';
    if (!new RegExp(mixedPattern).test(rowHtml)) {
      console.error(`P3 Content QA mixed ladder count for ${skillId} does not match reviewed mapped exam data.`);
      process.exit(1);
    }
  }
}

const p3FieldGuidePages = requiredPages.filter((page) => /^p3\/topics\/[^/]+\/field-guide\/index\.html$/.test(page));
for (const page of p3FieldGuidePages) {
  const topicSlug = page.split('/')[2];
  const expectedSkillCheckPage = `p3/topics/${topicSlug}/skill-check/index.html`;
  const html = readFileSync(path.join(siteRoot, page), 'utf8');
  const skillCheckHrefs = Array.from(html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi))
    .filter((match) => visibleBodyText(match[2]).includes('Skill Check'))
    .map((match) => match[1]);

  if (!skillCheckHrefs.length) {
    console.error(`${page} has no Skill Check link.`);
    process.exit(1);
  }

  for (const href of skillCheckHrefs) {
    const resolvedPath = resolveHtmlHref(page, href);
    if (resolvedPath !== expectedSkillCheckPage) {
      console.error(`${page} has non-canonical Skill Check link: ${href} -> ${resolvedPath}, expected ${expectedSkillCheckPage}`);
      process.exit(1);
    }
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
