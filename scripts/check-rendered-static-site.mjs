import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');

const p3PracticePages = [
  'p3/topics/algebra/learn/index.html',
  'p3/topics/logarithmic-and-exponential-functions/learn/index.html',
  'p3/topics/trigonometry/learn/index.html',
  'p3/topics/vectors/learn/index.html',
  'p3/topics/differentiation/learn/index.html',
  'p3/topics/integration/learn/index.html',
  'p3/topics/differential-equations/learn/index.html',
  'p3/topics/complex-numbers/learn/index.html',
  'p3/topics/numerical-solution-of-equations/learn/index.html',
];

const requiredRenderedPages = [
  'index.html',
  'p1/index.html',
  'p3/index.html',
  'm1/index.html',
  's1/index.html',
  ...p3PracticePages,
  'p3/topics/algebra/field-guide/index.html',
  'p3/topics/algebra/skill-check/index.html',
  'p3/topics/algebra/exam-training/index.html',
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
      practiceCardsTotal: document.querySelectorAll('.practice-card').length,
      practiceCardsVisible: Array.from(document.querySelectorAll('.practice-card')).filter(visible).length,
      examCardsTotal: document.querySelectorAll('.exam-question-card').length,
      examCardsVisible: Array.from(document.querySelectorAll('.exam-question-card')).filter(visible).length,
      markSchemesOpen: Array.from(document.querySelectorAll('.mark-scheme-details')).filter((details) => details.open).length,
    };
  });
}

async function assertPracticePageBasics(browser) {
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ];

  for (const viewport of viewports) {
    const visualPage = await browser.newPage({ viewport });
    const consoleErrors = [];
    visualPage.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    visualPage.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    try {
      for (const pagePath of p3PracticePages) {
        await waitForStaticEnhancement(visualPage, pagePath);
        const result = await visualPage.evaluate(() => {
          const isVisible = (element) => {
            if (!element || element.hidden) return false;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          };
          const activeCard = document.querySelector('.practice-card:not([hidden])');
          const activeForm = activeCard?.querySelector('[data-check-learn-answer], [data-check-skill-answer]');
          const firstAnswerControl = activeForm?.querySelector('input[name="submittedAnswer"]');
          const checkButton = activeForm?.querySelector('button[type="submit"]');
          const typedHelp = activeForm?.querySelector('.single-answer-field > span');
          const optionLegend = activeForm?.querySelector('.learn-option-bank legend');
          const visibleOptionLabels = Array.from(activeForm?.querySelectorAll('.learn-option-bank label') ?? []).filter(isVisible);
          const visibleMathOverflow = Array.from(document.querySelectorAll('.practice-card .math-text, .practice-card .katex')).some((element) => {
            if (!isVisible(element)) return false;
            const rect = element.getBoundingClientRect();
            const parent = element.parentElement?.getBoundingClientRect();
            return Boolean(parent && (rect.left < parent.left - 2 || rect.right > parent.right + 2));
          });
          return {
            title: document.body.innerText.includes('Practice'),
            oneCardFlow: document.querySelectorAll('[data-one-card-flow]').length,
            learnFlow: document.querySelectorAll('[data-learn-flow]').length,
            supportCards: document.querySelectorAll('[data-learn-step-card]').length,
            supportForms: document.querySelectorAll('[data-check-learn-answer]').length,
            checkedForms: document.querySelectorAll('[data-check-skill-answer]').length,
            visibleCards: Array.from(document.querySelectorAll('.practice-card')).filter((card) => !card.hidden).length,
            answerControlVisible: isVisible(firstAnswerControl),
            checkButtonVisible: isVisible(checkButton),
            helperText: (typedHelp?.textContent || optionLegend?.textContent || '').trim(),
            optionCount: visibleOptionLabels.length,
            optionMinHeight: visibleOptionLabels.length
              ? Math.min(...visibleOptionLabels.map((label) => label.getBoundingClientRect().height))
              : undefined,
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            visibleMathOverflow,
          };
        });

        if (consoleErrors.length) {
          fail(`${pagePath} has console errors at ${viewport.width}x${viewport.height}: ${consoleErrors.join(' | ')}`);
        }
        consoleErrors.length = 0;
        if (!result.title || result.oneCardFlow !== 1 || result.learnFlow !== 0 || !result.supportCards || !result.supportForms || !result.checkedForms) {
          fail(`${pagePath} must render the unified Practice flow at ${viewport.width}x${viewport.height}.`);
        }
        if (result.visibleCards !== 1 || !result.answerControlVisible || !result.checkButtonVisible || !result.helperText) {
          fail(`${pagePath} must show one usable practice card with answer controls at ${viewport.width}x${viewport.height}.`);
        }
        if (result.horizontalOverflow) {
          fail(`${pagePath} has horizontal overflow at ${viewport.width}x${viewport.height}.`);
        }
        if (result.visibleMathOverflow) {
          fail(`${pagePath} has visible practice-card math overflow at ${viewport.width}x${viewport.height}.`);
        }
        if (result.optionCount && result.optionMinHeight < 40) {
          fail(`${pagePath} has cramped option targets at ${viewport.width}x${viewport.height}.`);
        }
      }
    } finally {
      await visualPage.close();
    }
  }
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
      hasHero: text.includes('Master CAIE 9709') && text.includes('Pure Mathematics 3'),
      hasStarfield: Boolean(document.querySelector('.home-starfield')),
      actionCards: document.querySelectorAll('.home-p3-action-card').length,
      topicTiles: document.querySelectorAll('.home-p3-topic-tile').length,
      hasP3Start: Array.from(document.querySelectorAll('a')).some((link) => /Start Practice/.test(link.textContent || '')),
      hasDiagnostic: Array.from(document.querySelectorAll('a')).some((link) => /Diagnostic: Where to focus/.test(link.textContent || '')),
      hasPathGrid: Boolean(document.querySelector('.path-unit-grid')),
      hasOldHeroCopy: text.includes('Teacher ready')
        || text.includes('Needs teacher check')
        || text.includes('Trust Signals')
        || text.includes('The Asterion Learning Loop')
        || text.includes('What should I do?')
        || text.includes('Choose a paper'),
    };
  });
  if (!homepageResult.hasHero || !homepageResult.hasStarfield || !homepageResult.hasP3Start || !homepageResult.hasDiagnostic) {
    fail('Root page must render the P3 starfield landing page.');
  }
  if (homepageResult.actionCards !== 3 || homepageResult.topicTiles !== 9) {
    fail('Root P3 landing page must show 3 action cards and 9 topic tiles.');
  }
  if (homepageResult.hasPathGrid || homepageResult.hasOldHeroCopy) {
    fail('Root page must not retain the old course-selector, direct-P3 path grid, or teacher-facing shell.');
  }

  for (const coursePage of ['p1/index.html', 'm1/index.html', 's1/index.html']) {
    await waitForStaticEnhancement(page, coursePage);
    const supportResult = await page.evaluate(() => ({
      hasSupportOnly: document.body.innerText.includes('Support only'),
      topicCards: document.querySelectorAll('.course-topic-button').length,
      hasP3Link: Array.from(document.querySelectorAll('a')).some((link) => /Back to P3/.test(link.textContent || '')),
    }));
    if (!supportResult.hasSupportOnly || supportResult.topicCards !== 0 || !supportResult.hasP3Link) {
      fail(`${coursePage} must be a demoted support-only page with no topic route cards.`);
    }
  }

  await waitForStaticEnhancement(page, 'p3/index.html');
  const courseResult = await page.evaluate(() => {
    const text = document.body.textContent || '';
    return {
      pathCards: document.querySelectorAll('.path-unit-card').length,
      hasDashboard: text.includes('Pure Mathematics 3') && text.includes('Unsure? Take diagnostic') && text.includes('All topic routes'),
      hasNextStepPanel: Boolean(document.querySelector('[data-p3-next-step-panel]')),
      hasCheckedProgress: Boolean(document.querySelector('[data-progress-skill]')) && Boolean(document.querySelector('[data-progress-exam]')),
      hasLearnProgress: Boolean(document.querySelector('[data-progress-field-guide]')),
      primaryActionsPractice: Array.from(document.querySelectorAll('[data-path-unit-primary-action]')).every((link) => /Practice/.test(link.textContent || '')),
      hasCourseGrid: Boolean(document.querySelector('.course-topic-button-grid')),
    };
  });
  if (!courseResult.hasDashboard || !courseResult.hasNextStepPanel || !courseResult.hasCheckedProgress || courseResult.hasLearnProgress || courseResult.pathCards < 9) {
    fail('P3 dashboard must render unit evidence cards without Learn progress counters.');
  }
  if (!courseResult.primaryActionsPractice || courseResult.hasCourseGrid) {
    fail('P3 dashboard must route primary actions to Practice and must not render the old topic chooser grid.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/index.html');
  const p3TopicsResult = await page.evaluate(() => {
    const text = document.body.textContent || '';
    return {
      hasPathHero: text.includes('CAIE 9709 Paper 3') && text.includes('P3 Topic Overview'),
      hasSequence: text.includes('Units') && text.includes('Unit 1') && text.includes('Unit 9'),
      hasFlow: ['Practice', 'Checked Evidence', 'Exam Training', 'Review'].every((label) => text.includes(label)),
      pathCards: document.querySelectorAll('.path-unit-card').length,
    };
  });
  if (!p3TopicsResult.hasPathHero || !p3TopicsResult.hasSequence || !p3TopicsResult.hasFlow || p3TopicsResult.pathCards < 10) {
    fail('P3 topics page must remain the direct unit learning path.');
  }

  await assertPracticePageBasics(browser);

  for (const [bridgePath, bridgeTitle] of [
    ['p3/topics/algebra/field-guide/index.html', 'Algebra — Practice'],
    ['p3/topics/logarithmic-and-exponential-functions/field-guide/index.html', 'Logarithmic and Exponential Functions — Practice'],
    ['p3/topics/differentiation/field-guide/index.html', 'Differentiation — Practice'],
    ['p3/topics/integration/field-guide/index.html', 'Integration — Practice'],
    ['p3/topics/numerical-solution-of-equations/field-guide/index.html', 'Numerical Solution of Equations — Practice'],
    ['p3/topics/differential-equations/field-guide/index.html', 'Differential Equations — Practice'],
    ['p3/topics/complex-numbers/field-guide/index.html', 'Complex Numbers — Practice'],
  ]) {
    await waitForStaticEnhancement(page, bridgePath);
    const bridgeResult = await page.evaluate((title) => {
      const text = document.body.innerText;
      return {
        bridgeTitle: text.includes(title),
        hasPracticeLink: Array.from(document.querySelectorAll('a')).some((link) => (link.textContent || '').includes('Practice') && /\/learn\/(?:index\.html)?$/.test(link.href)),
        oldForms: document.querySelectorAll('[data-check-skill-answer], [data-check-learn-answer]').length,
      };
    }, bridgeTitle);
    if (!bridgeResult.bridgeTitle || !bridgeResult.hasPracticeLink || bridgeResult.oldForms !== 0) {
      fail(`${bridgePath} must be a clean Practice bridge.`);
    }
  }

  for (const compatibilityPath of [
    'p3/topics/algebra/skill-check/index.html',
    'p3/topics/logarithmic-and-exponential-functions/skill-check/index.html',
    'p3/topics/differentiation/skill-check/index.html',
    'p3/topics/integration/skill-check/index.html',
    'p3/topics/numerical-solution-of-equations/skill-check/index.html',
    'p3/topics/differential-equations/skill-check/index.html',
    'p3/topics/complex-numbers/skill-check/index.html',
  ]) {
    await waitForStaticEnhancement(page, compatibilityPath);
    const compatibilityResult = await page.evaluate(() => ({
      title: document.body.innerText.includes('Practice'),
      supportForms: document.querySelectorAll('[data-check-learn-answer]').length,
      checkedForms: document.querySelectorAll('[data-check-skill-answer]').length,
      oneCardFlow: Boolean(document.querySelector('[data-one-card-flow]')),
      firstCardVisible: Boolean(document.querySelector('.practice-card:not([hidden])')),
    }));
    if (!compatibilityResult.title || !compatibilityResult.supportForms || !compatibilityResult.checkedForms || !compatibilityResult.oneCardFlow || !compatibilityResult.firstCardVisible) {
      fail(`${compatibilityPath} must render the unified Practice compatibility flow.`);
    }
  }

  await waitForStaticEnhancement(page, 'p3/review/index.html');
  const reviewGateResult = await page.evaluate(() => ({
    hasGate: Boolean(document.querySelector('[data-p3-exam-review-gate]')),
    lockedVisible: !document.querySelector('[data-exam-review-locked]')?.hidden,
    openHidden: Boolean(document.querySelector('[data-exam-review-open]')?.hidden),
    topicRows: document.querySelectorAll('[data-exam-review-topic-list] li').length,
    hasMixedQuestions: document.querySelectorAll('.exam-question-card').length > 0,
    mentionsLearn: document.body.innerText.includes('optional Learn'),
  }));
  if (!reviewGateResult.hasGate || !reviewGateResult.lockedVisible || !reviewGateResult.openHidden || reviewGateResult.topicRows < 9 || !reviewGateResult.hasMixedQuestions || reviewGateResult.mentionsLearn) {
    fail('Review Mistakes must render mixed questions behind checked evidence only.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/algebra/exam-training/index.html');
  const examResult = await page.evaluate(() => ({
    hasExamFlow: Boolean(document.querySelector('.exam-question-grid[data-exam-flow]')),
    countText: document.querySelector('.exam-controls .practice-count')?.textContent?.replace(/\s+/g, ' ').trim() || '',
  }));
  const examCounts = await visibleCounts(page);
  if (!examResult.hasExamFlow || examCounts.examCardsVisible !== 1 || examCounts.markSchemesOpen !== 0 || !/Question\s+1\s+of\s+\d+/i.test(examResult.countText)) {
    fail('P3 Exam Training must render a one-question flow with hidden mark schemes and a question count.');
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
}

if (process.exitCode) process.exit(process.exitCode);
