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
  'p3/topics/algebra/field-guide/index.html',
  'p3/topics/algebra/skill-check/index.html',
  'p3/topics/algebra/exam-training/index.html',
  'p3/topics/logarithmic-and-exponential-functions/field-guide/index.html',
  'p3/topics/complex-numbers/exam-training/index.html',
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
    return {
      hasPathHero: text.includes('After P1') && text.includes('Learn P3 in order.'),
      hasSequence: text.includes('P3 unit sequence') && text.includes('Unit 1') && text.includes('Unit 9'),
      hasFlow: ['Field Guide', 'Skill Check', 'Mixed Exam Review'].every((label) => text.includes(label)),
      hasStartAction: Array.from(document.querySelectorAll('a')).some((link) => /Start Unit 1: Algebra/.test(link.textContent || '')),
      unitCards: document.querySelectorAll('.path-unit-card').length,
      hasHomepageShell: Boolean(document.querySelector('.homepage-hero, .course-card-featured, .course-support-grid')),
      hasOldHeroCopy: text.includes('CAIE 9709 practice that starts with the') || text.includes('Choose the trusted path') || text.includes('Support only courses'),
    };
  });
  if (!homepageResult.hasPathHero || !homepageResult.hasSequence || !homepageResult.hasFlow || !homepageResult.hasStartAction) {
    fail('Root page must be the direct After P1 -> P3 learning path.');
  }
  if (homepageResult.unitCards < 10) {
    fail(`Root P3 path must show 9 units plus final review; saw ${homepageResult.unitCards} cards.`);
  }
  if (homepageResult.hasHomepageShell || homepageResult.hasOldHeroCopy) {
    fail('Root page must not retain the old homepage/course-selector shell.');
  }

  for (const coursePage of ['p1/index.html', 'm1/index.html', 's1/index.html']) {
    await waitForStaticEnhancement(page, coursePage);
    const supportResult = await page.evaluate(() => ({
      hasSupportOnly: document.body.innerText.includes('Support only'),
      topicCards: document.querySelectorAll('.course-topic-button').length,
      hasP3Link: Array.from(document.querySelectorAll('a')).some((link) => /Go to P3/.test(link.textContent || '')),
    }));
    if (!supportResult.hasSupportOnly || supportResult.topicCards !== 0 || !supportResult.hasP3Link) {
      fail(`${coursePage} must be a demoted support-only page with no topic route cards.`);
    }
  }

  for (const coursePage of ['p3/index.html']) {
    await waitForStaticEnhancement(page, coursePage);
    const courseResult = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        pathCards: document.querySelectorAll('.path-unit-card').length,
        hasPathHero: text.includes('Learn P3 in order.'),
        hasCourseGrid: Boolean(document.querySelector('.course-topic-button-grid')),
      };
    });
    if (!courseResult.hasPathHero || courseResult.pathCards < 10) {
      fail(`${coursePage} must render the direct P3 learning path.`);
    }
    if (courseResult.hasCourseGrid) {
      fail(`${coursePage} must not render the old topic chooser grid.`);
    }
  }

  await waitForStaticEnhancement(page, 'p3/topics/algebra/field-guide/index.html');
  const p3FieldGuideResult = await page.evaluate(() => ({
    guidedStudyCards: document.querySelectorAll('[data-guided-study]').length,
    phaseButtons: document.querySelectorAll('[data-phase-tab]').length,
    hasNextSkillCheck: Array.from(document.querySelectorAll('a, button')).some((item) => /Go to Skill Check|Next: Skill Check/.test(item.textContent || '')),
  }));
  const p3FieldGuideCounts = await visibleCounts(page);
  if (p3FieldGuideResult.guidedStudyCards !== 1) {
    fail('P3 Algebra Field Guide must render one guided study container.');
  }
  if (p3FieldGuideResult.phaseButtons < 1) {
    fail('P3 Algebra Field Guide must render phase navigation buttons.');
  }
  if (!p3FieldGuideResult.hasNextSkillCheck) {
    fail('P3 Algebra Field Guide must point directly to the Skill Check.');
  }
  if (p3FieldGuideCounts.phasePanelsVisible !== 1) {
    fail(`P3 Algebra Field Guide must show exactly one Field Guide phase after JS initialization; saw ${p3FieldGuideCounts.phasePanelsVisible}.`);
  }

  await waitForStaticEnhancement(page, 'p3/topics/algebra/skill-check/index.html');
  const skillCheckResult = await page.evaluate(() => ({
    countText: document.querySelector('.practice-count')?.textContent?.replace(/\s+/g, ' ').trim() || '',
    hasSectionDisclosure: Boolean(document.querySelector('.jump-details')),
    hasMorePracticeControl: Array.from(document.querySelectorAll('button')).some((button) => /More practice/i.test(button.textContent || '') && !button.hidden),
    hasExamCards: document.querySelectorAll('.exam-question-card').length > 0,
    hasSkillGroups: document.querySelectorAll('[data-skill-check-group]').length > 0,
    nextDisabledUntilPass: Array.from(document.querySelectorAll('.practice-controls button')).some((button) => /Pass to continue/i.test(button.textContent || '') && button.disabled),
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
  if (!skillCheckResult.hasSkillGroups || !skillCheckResult.nextDisabledUntilPass) {
    fail('P3 Algebra Skill Check must be grouped by subtopic and require a pass before continuing.');
  }

  await waitForStaticEnhancement(page, 'p3/review/index.html');
  const reviewGateResult = await page.evaluate(() => ({
    hasGate: Boolean(document.querySelector('[data-p3-exam-review-gate]')),
    lockedVisible: !document.querySelector('[data-exam-review-locked]')?.hidden,
    openHidden: Boolean(document.querySelector('[data-exam-review-open]')?.hidden),
    topicRows: document.querySelectorAll('[data-exam-review-topic-list] li').length,
    hasMixedQuestions: document.querySelectorAll('.exam-question-card').length > 0,
  }));
  if (!reviewGateResult.hasGate || !reviewGateResult.lockedVisible || !reviewGateResult.openHidden || reviewGateResult.topicRows < 9 || !reviewGateResult.hasMixedQuestions) {
    fail('P3 Exam Review must render mixed questions behind a local completion gate.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/algebra/exam-training/index.html');
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
