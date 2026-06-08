import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');

const requiredRenderedPages = [
  'index.html',
  'p1/index.html',
  'p3/index.html',
  'm1/index.html',
  's1/index.html',
  'p1/topics/series/field-guide/index.html',
  'p1/topics/series/field-guide/arithmetic-progressions/index.html',
  'p1/topics/series/skill-check/index.html',
  'p3/topics/algebra/field-guide/index.html',
  'p3/topics/algebra/skill-check/index.html',
  'p3/exam-training/index.html',
];

function pageUrl(pagePath) {
  return pathToFileURL(path.join(siteRoot, pagePath)).href;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

async function waitForStaticEnhancement(page, pagePath) {
  await page.goto(pageUrl(pagePath), { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
}

async function visibleCounts(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      if (!element || element.hidden) return false;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };
    return {
      phasePanelsTotal: document.querySelectorAll('.phase-panel').length,
      phasePanelsVisible: Array.from(document.querySelectorAll('.phase-panel')).filter(visible).length,
      practiceCardsTotal: document.querySelectorAll('.practice-card').length,
      practiceCardsVisible: Array.from(document.querySelectorAll('.practice-card')).filter(visible).length,
      examCardsTotal: document.querySelectorAll('.exam-question-card').length,
      examCardsVisible: Array.from(document.querySelectorAll('.exam-question-card')).filter(visible).length,
      markSchemesOpen: Array.from(document.querySelectorAll('.mark-scheme-details')).filter((details) => details.open).length,
    };
  });
}

for (const pagePath of requiredRenderedPages) {
  if (!existsSync(path.join(siteRoot, pagePath))) {
    fail(`Rendered check page is missing: ${pagePath}`);
  }
}

if (process.exitCode) process.exit();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  await waitForStaticEnhancement(page, 'index.html');
  const homepageResult = await page.evaluate(() => {
    const text = document.body.textContent || '';
    const p3Card = document.querySelector('.course-card-featured');
    const supportCards = document.querySelectorAll('.course-support-grid .course-card');
    return {
      hasLoop: ['Field Guide', 'Skill Check', 'Exam Training', 'Review'].every((label) => text.includes(label)),
      hasP3Priority: text.includes('Most complete Asterion path') && text.includes('Recommended first click: P3 Pure Mathematics 3'),
      hasRecommendedStart: text.includes('Recommended start') && text.includes('Start with P3 Pure Mathematics 3') && text.includes('Use the full Field Guide -> Skill Check -> Exam Training flow.'),
      hasP3Reason: text.includes('Recommended starting path') && text.includes('Full method-first Field Guide, Skill Check, Exam Training, and review flow'),
      hasSupportStatus: text.includes('Support only') && text.includes('P1, M1, and S1 are available as support only paths while their coverage is expanded and reviewed.'),
      hasSupportSection: text.includes('Support only courses') && text.includes('They are not full-flow courses yet.') && text.includes('View P1 support'),
      hasSoftSupportLabel: text.includes('Early support'),
      hasChecklist: text.includes('Homepage acceptance checklist'),
      hasTopicEvidence: text.includes('Includes algebra, vectors, complex numbers, calculus, and differential equations.'),
      hasLongTopicEvidence: text.includes('Includes Algebra, Logarithms, Trigonometry'),
      hasOldHeroCopy: text.includes('Which paper are you studying today?') || text.includes('Brain loading'),
      p3CardText: p3Card?.textContent?.replace(/\s+/g, ' ').trim() || '',
      p3CardActionLabel: p3Card?.getAttribute('aria-label') || '',
      supportCardTexts: Array.from(supportCards).map((card) => card.textContent?.replace(/\s+/g, ' ').trim() || ''),
      supportCardActionLabels: Array.from(supportCards).map((card) => card.getAttribute('aria-label') || ''),
      hasGenericHomepageAction: Boolean(document.querySelector('a[aria-label^="Open "]')) || /\b(Open course|Learn more|Explore)\b/.test(text),
      hasSupportTopicPreview: Boolean(document.querySelector('.course-support-grid .course-topic-preview')),
      supportCardCount: supportCards.length,
      p3BeforeSupport: Boolean(p3Card && supportCards[0] && (p3Card.compareDocumentPosition(supportCards[0]) & Node.DOCUMENT_POSITION_FOLLOWING)),
    };
  });
  if (!homepageResult.hasLoop) {
    fail('Homepage must show the Field Guide -> Skill Check -> Exam Training -> Review learning loop.');
  }
  if (!homepageResult.hasP3Priority || !homepageResult.hasRecommendedStart || !homepageResult.hasP3Reason || !/Start P3\b/.test(homepageResult.p3CardText) || homepageResult.p3CardActionLabel !== 'Start P3: Pure Mathematics 3' || !homepageResult.p3BeforeSupport) {
    fail('Homepage must make P3 the obvious primary course path.');
  }
  if (!homepageResult.hasSupportStatus || !homepageResult.hasSupportSection || homepageResult.supportCardCount !== 3 || !homepageResult.supportCardActionLabels.includes('View P1 support: Pure Mathematics 1') || homepageResult.supportCardTexts.some((text) => text.includes('Full method-first Field Guide, Skill Check, Exam Training')) || homepageResult.hasSupportTopicPreview) {
    fail('Homepage must honestly label P1, M1, and S1 as support-only sections.');
  }
  if (homepageResult.hasGenericHomepageAction) {
    fail('Homepage must use direct action CTA language, not generic Open course/Learn more/Explore wording.');
  }
  if (homepageResult.hasSoftSupportLabel) {
    fail('Homepage must not soften P1, M1, or S1 maturity as Early support.');
  }
  if (homepageResult.hasChecklist) {
    fail('Homepage must not render an implementation acceptance checklist.');
  }
  if (!homepageResult.hasTopicEvidence || homepageResult.hasLongTopicEvidence) {
    fail('Homepage must show concise P3 topic evidence without a long topic-preview list.');
  }
  if (homepageResult.hasOldHeroCopy) {
    fail('Homepage must not retain the old generic course-selector hero copy or illustration text.');
  }

  for (const coursePage of ['p1/index.html', 'p3/index.html', 'm1/index.html', 's1/index.html']) {
    await waitForStaticEnhancement(page, coursePage);
    const courseResult = await page.evaluate(() => {
      const grid = document.querySelector('.course-topic-button-grid');
      const topicCards = document.querySelectorAll('.course-topic-button').length;
      const hasStartHere = /Start here|Recommended first/i.test(document.body.innerText);
      const beforeGrid = [];
      if (grid) {
        for (const element of document.querySelectorAll('a, button')) {
          if (grid.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING) {
            beforeGrid.push((element.textContent || '').replace(/\s+/g, ' ').trim());
          }
        }
      }
      const modeHeavyBeforeGrid = beforeGrid.filter((text) => /^(Field Guide|Practice|Practice Questions|Exam Training)$/i.test(text));
      return { topicCards, hasStartHere, hasGrid: Boolean(grid), modeHeavyBeforeGrid };
    });
    if (!courseResult.hasGrid || courseResult.topicCards < 1) {
      fail(`${coursePage} must render topic cards on the course landing page.`);
    }
    if (!courseResult.hasStartHere) {
      fail(`${coursePage} must include a Start here / Recommended first topic cue.`);
    }
    if (courseResult.modeHeavyBeforeGrid.length) {
      fail(`${coursePage} exposes mode-heavy navigation before topic selection: ${courseResult.modeHeavyBeforeGrid.join(', ')}`);
    }
  }

  await waitForStaticEnhancement(page, 'p1/topics/series/field-guide/index.html');
  const p1LandingResult = await page.evaluate(() => ({
    guidedStudyCards: document.querySelectorAll('[data-guided-study]').length,
    phaseButtons: document.querySelectorAll('[data-phase-tab]').length,
    overviewCards: document.querySelectorAll('.field-guide-overview-grid .summary-card').length,
    subtopicLinks: document.querySelectorAll('.field-guide-subtopic-nav a').length,
    hasWorkedExample: /Worked example|Try a similar one/i.test(document.body.innerText),
  }));
  if (p1LandingResult.guidedStudyCards !== 0 || p1LandingResult.phaseButtons !== 0) {
    fail('P1 Field Guide landing pages must not render the guided-study lesson container or phase buttons.');
  }
  if (p1LandingResult.overviewCards !== 2 || p1LandingResult.subtopicLinks < 1) {
    fail('P1 Field Guide landing pages must render only the overview card and compact subtopic navigation.');
  }
  if (p1LandingResult.hasWorkedExample) {
    fail('P1 Field Guide landing pages must not show worked examples or try-similar content.');
  }

  await waitForStaticEnhancement(page, 'p1/topics/series/field-guide/arithmetic-progressions/index.html');
  const p1SubtopicResult = await page.evaluate(() => ({
    lessonShells: document.querySelectorAll('.subtopic-lesson-shell').length,
    workedBlocks: document.querySelectorAll('.worked-example-block').length,
    trySimilarBlocks: document.querySelectorAll('.try-similar-block').length,
    currentLinks: document.querySelectorAll('.field-guide-subtopic-nav a[aria-current="page"]').length,
    skillHref: document.querySelector('.skill-check-transition a')?.getAttribute('href') || '',
  }));
  if (p1SubtopicResult.lessonShells !== 1 || p1SubtopicResult.workedBlocks !== 1 || p1SubtopicResult.trySimilarBlocks !== 1) {
    fail('P1 Field Guide subtopic pages must render one lesson with one worked example and one try-similar block.');
  }
  if (p1SubtopicResult.currentLinks !== 1) {
    fail('P1 Field Guide subtopic navigation must highlight exactly one current subtopic.');
  }
  if (!/skill-check\/#p1-series-arithmetic-progressions$/.test(p1SubtopicResult.skillHref)) {
    fail(`P1 Field Guide subtopic Skill Check link must target the matching group; saw "${p1SubtopicResult.skillHref}".`);
  }

  await waitForStaticEnhancement(page, 'p3/topics/algebra/field-guide/index.html');
  const p3FieldGuideResult = await page.evaluate(() => ({
    guidedStudyCards: document.querySelectorAll('[data-guided-study]').length,
    phaseButtons: document.querySelectorAll('[data-phase-tab]').length,
    overviewCards: document.querySelectorAll('.field-guide-overview-grid .summary-card').length,
  }));
  const p3FieldGuideCounts = await visibleCounts(page);
  if (p3FieldGuideResult.guidedStudyCards !== 1) {
    fail('P3 Algebra Field Guide must render one guided study container.');
  }
  if (p3FieldGuideResult.phaseButtons < 1) {
    fail('P3 Algebra Field Guide must render phase navigation buttons.');
  }
  if (p3FieldGuideResult.overviewCards < 2) {
    fail('P3 Algebra Field Guide must render Overview and skill-goals cards before the guided study panel.');
  }
  if (p3FieldGuideCounts.phasePanelsVisible !== 1) {
    fail(`P3 Algebra Field Guide must show exactly one Field Guide phase after JS initialization; saw ${p3FieldGuideCounts.phasePanelsVisible}.`);
  }

  await waitForStaticEnhancement(page, 'p1/topics/series/skill-check/index.html');
  const p1SkillCheckResult = await page.evaluate(() => {
    const details = document.querySelector('.skill-check-answer-details');
    if (details) details.open = true;
    const inlineNext = document.querySelector('[data-skill-check-inline-next]');
    const rect = inlineNext?.getBoundingClientRect();
    return {
      countText: document.querySelector('.practice-count')?.textContent?.replace(/\s+/g, ' ').trim() || '',
      inlineNextText: inlineNext?.textContent?.replace(/\s+/g, ' ').trim() || '',
      inlineNextVisible: Boolean(rect && rect.width > 0 && rect.height > 0),
    };
  });
  if (!/Question\s+1\s+of\s+3\b/i.test(p1SkillCheckResult.countText)) {
    fail(`P1 Series Skill Check must default to a 3-question group; saw "${p1SkillCheckResult.countText}".`);
  }
  if (!p1SkillCheckResult.inlineNextVisible || p1SkillCheckResult.inlineNextText !== 'Next question') {
    fail(`P1 Series Skill Check must show an inline Next question after answer reveal; saw "${p1SkillCheckResult.inlineNextText}".`);
  }

  await waitForStaticEnhancement(page, 'p3/topics/algebra/skill-check/index.html');
  const skillCheckResult = await page.evaluate(() => ({
    countText: document.querySelector('.practice-count')?.textContent?.replace(/\s+/g, ' ').trim() || '',
    hasSectionDisclosure: Boolean(document.querySelector('.jump-details')),
    hasMorePracticeControl: Array.from(document.querySelectorAll('button')).some((button) => /More practice/i.test(button.textContent || '') && !button.hidden),
    hasExamCards: document.querySelectorAll('.exam-question-card').length > 0,
  }));
  const skillCounts = await visibleCounts(page);
  if (/of\s+44\b/i.test(skillCheckResult.countText)) {
    fail('P3 Algebra Skill Check must not present "Skill Check 1 of 44" as the default experience.');
  }
  if (!/of\s+3\b/i.test(skillCheckResult.countText)) {
    fail(`P3 Algebra Skill Check must default to a small focused set; saw "${skillCheckResult.countText}".`);
  }
  if (skillCounts.practiceCardsVisible !== 1) {
    fail(`P3 Algebra Skill Check must show one card after JS initialization; saw ${skillCounts.practiceCardsVisible}.`);
  }
  if (skillCounts.practiceCardsTotal > 3 && !skillCheckResult.hasSectionDisclosure) {
    fail('P3 Algebra Skill Check has extra questions but no collapsed section/progress disclosure.');
  }
  if (skillCounts.practiceCardsTotal > 3 && !skillCheckResult.hasMorePracticeControl) {
    fail('P3 Algebra Skill Check has extra questions but no visible More practice set control.');
  }
  if (skillCheckResult.hasExamCards) {
    fail('P3 Algebra Skill Check must not render exam question cards by default.');
  }

  await waitForStaticEnhancement(page, 'p3/exam-training/index.html');
  const examResult = await page.evaluate(() => ({
    hasExamFlow: Boolean(document.querySelector('.exam-question-grid[data-exam-flow]')),
    countText: document.querySelector('.exam-controls .practice-count')?.textContent?.replace(/\s+/g, ' ').trim() || '',
  }));
  const examCounts = await visibleCounts(page);
  if (!examResult.hasExamFlow) {
    fail('P3 Exam Training must render a one-question flow container.');
  }
  if (examCounts.examCardsVisible !== 1) {
    fail(`P3 Exam Training must show one exam card after JS initialization; saw ${examCounts.examCardsVisible}.`);
  }
  if (examCounts.markSchemesOpen !== 0) {
    fail(`P3 Exam Training mark schemes must start hidden; saw ${examCounts.markSchemesOpen} open.`);
  }
  if (!/Question\s+1\s+of\s+\d+/i.test(examResult.countText)) {
    fail(`P3 Exam Training must show a question count; saw "${examResult.countText}".`);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
}

if (process.exitCode) process.exit();

console.log('Rendered static page check passed.');
