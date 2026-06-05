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

  for (const fieldGuidePage of ['p1/topics/series/field-guide/index.html', 'p3/topics/algebra/field-guide/index.html']) {
    await waitForStaticEnhancement(page, fieldGuidePage);
    const result = await page.evaluate(() => ({
      guidedStudyCards: document.querySelectorAll('[data-guided-study]').length,
      phaseButtons: document.querySelectorAll('[data-phase-tab]').length,
      overviewCards: document.querySelectorAll('.field-guide-overview-grid .summary-card').length,
    }));
    const counts = await visibleCounts(page);
    if (result.guidedStudyCards !== 1) {
      fail(`${fieldGuidePage} must render one guided study container.`);
    }
    if (result.phaseButtons < 1) {
      fail(`${fieldGuidePage} must render phase navigation buttons.`);
    }
    if (result.overviewCards < 2) {
      fail(`${fieldGuidePage} must render Overview and skill-goals cards before the guided study panel.`);
    }
    if (counts.phasePanelsVisible !== 1) {
      fail(`${fieldGuidePage} must show exactly one Field Guide phase after JS initialization; saw ${counts.phasePanelsVisible}.`);
    }
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
