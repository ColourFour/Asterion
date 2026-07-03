import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');

const p3LearnVisualPages = [
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

const p3TopicSlugs = [
  'algebra',
  'logarithmic-and-exponential-functions',
  'trigonometry',
  'vectors',
  'differentiation',
  'integration',
  'differential-equations',
  'complex-numbers',
  'numerical-solution-of-equations',
];

const p3ExamTrainingPages = p3TopicSlugs.map((slug) => `p3/topics/${slug}/exam-training/index.html`);

const p3SkillSelectorPages = p3TopicSlugs.flatMap((slug) => [
  `p3/topics/${slug}/skill-check/index.html`,
  `p3/topics/${slug}/worksheet/index.html`,
]);

const requiredRenderedPages = Array.from(new Set([
  'index.html',
  'p1/index.html',
  'p3/index.html',
  'm1/index.html',
  's1/index.html',
  'p3/content-qa/index.html',
  ...p3LearnVisualPages,
  ...p3ExamTrainingPages,
  ...p3SkillSelectorPages,
  'p3/topics/algebra/field-guide/index.html',
  'p3/topics/algebra/skill-check/index.html',
  'p3/topics/algebra/exam-training/index.html',
  'p3/topics/complex-numbers/exam-training/index.html',
]));

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

async function assertLearnVisualBasics(browser) {
  const viewports = [
    { width: 1280, height: 720, firstActionRequired: true },
    { width: 768, height: 1024, firstActionRequired: false },
    { width: 390, height: 844, firstActionRequired: false },
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
      for (const pagePath of p3LearnVisualPages) {
        await waitForStaticEnhancement(visualPage, pagePath);
        const result = await visualPage.evaluate((firstActionRequired) => {
          const isVisible = (element) => {
            if (!element || element.hidden) return false;
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          };
          const inViewport = (element) => {
            if (!isVisible(element)) return false;
            const rect = element.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0;
          };
          const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
          const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
          const firstAnswerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
          const checkButton = primaryForm?.querySelector('button[type="submit"]');
          const typedHelp = primaryForm?.querySelector('.single-answer-field .answer-format-guidance');
          const optionLegend = primaryForm?.querySelector('.learn-option-bank legend');
          const visibleOptionLabels = Array.from(primaryForm?.querySelectorAll('.learn-option-bank label') ?? []).filter(isVisible);
          const visibleMathOverflow = Array.from(document.querySelectorAll('.learn-step-card .math-text, .learn-step-card .katex')).some((element) => {
            if (!isVisible(element)) return false;
            const rect = element.getBoundingClientRect();
            const parent = element.parentElement?.getBoundingClientRect();
            return Boolean(parent && (rect.left < parent.left - 2 || rect.right > parent.right + 2));
          });
          return {
            activeProblemVisible: inViewport(activeCard),
            answerControlVisible: inViewport(firstAnswerControl),
            checkButtonVisible: inViewport(checkButton),
            helperText: (typedHelp?.textContent || optionLegend?.textContent || '').trim(),
            optionCount: visibleOptionLabels.length,
            optionMinHeight: visibleOptionLabels.length
              ? Math.min(...visibleOptionLabels.map((label) => label.getBoundingClientRect().height))
              : undefined,
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            visibleMathOverflow,
            firstActionRequired,
          };
        }, viewport.firstActionRequired);

        if (consoleErrors.length) {
          fail(`${pagePath} has console errors at ${viewport.width}x${viewport.height}: ${consoleErrors.join(' | ')}`);
        }
        consoleErrors.length = 0;
        if (result.horizontalOverflow) {
          fail(`${pagePath} has horizontal overflow at ${viewport.width}x${viewport.height}.`);
        }
        if (result.visibleMathOverflow) {
          fail(`${pagePath} has visible Learn Mode math overflow at ${viewport.width}x${viewport.height}.`);
        }
        if (!result.helperText) {
          fail(`${pagePath} is missing nearby answer-format help at ${viewport.width}x${viewport.height}.`);
        }
        if (result.optionCount && result.optionMinHeight < 40) {
          fail(`${pagePath} has cramped option targets at ${viewport.width}x${viewport.height}.`);
        }
        if (result.firstActionRequired && (!result.activeProblemVisible || !result.answerControlVisible || !result.checkButtonVisible)) {
          fail(`${pagePath} must show the active problem, first answer control, and Check Answer at 1280x720.`);
        }
      }
    } finally {
      await visualPage.close();
    }
  }
}

async function assertExamTrainingMobileVisuals(browser) {
  const visualPage = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    for (const pagePath of p3ExamTrainingPages) {
      await waitForStaticEnhancement(visualPage, pagePath);
      const result = await visualPage.evaluate(() => {
        const isVisible = (element) => {
          if (!element || element.hidden) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const unreadablePattern = /[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}\uFFFD]/u;
        const supportTexts = Array.from(document.querySelectorAll('.mark-point-list label span, .self-marking-guidance, .self-marking-guidance-note'))
          .map((element) => (element.textContent || '').trim())
          .filter(Boolean);
        const overflowingControls = Array.from(document.querySelectorAll('fieldset, .exam-part-card, .mark-point-list, .exam-question-card header, .exam-evidence-banner'))
          .filter(isVisible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              selector: element.className || element.tagName.toLowerCase(),
              left: rect.left,
              right: rect.right,
            };
          })
          .filter((item) => item.left < -1 || item.right > window.innerWidth + 1);
        return {
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          unreadableSupportText: supportTexts.find((text) => unreadablePattern.test(text)),
          overflowingControls,
        };
      });

      if (result.horizontalOverflow) {
        fail(`${pagePath} has horizontal overflow at 390x844.`);
      }
      if (result.unreadableSupportText) {
        fail(`${pagePath} exposes unreadable mark-point/self-marking support text at 390x844.`);
      }
      if (result.overflowingControls.length) {
        fail(`${pagePath} has exam controls outside the mobile viewport at 390x844: ${JSON.stringify(result.overflowingControls.slice(0, 3))}`);
      }
    }
  } finally {
    await visualPage.close();
  }
}

async function assertMobileSkillSelectorLabels(browser) {
  const visualPage = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    for (const pagePath of p3SkillSelectorPages) {
      await waitForStaticEnhancement(visualPage, pagePath);
      const result = await visualPage.evaluate(() => {
        const isVisible = (element) => {
          if (!element || element.hidden) return false;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const clippedLabels = Array.from(document.querySelectorAll('.practice-current-skill'))
          .filter(isVisible)
          .map((element) => {
            const style = getComputedStyle(element);
            return {
              text: (element.textContent || '').replace(/\s+/g, ' ').trim(),
              whiteSpace: style.whiteSpace,
              overflow: style.overflow,
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
            };
          })
          .filter((item) => item.whiteSpace === 'nowrap' || (item.overflow !== 'visible' && item.scrollWidth > item.clientWidth + 2));
        return {
          labelCount: document.querySelectorAll('.practice-current-skill').length,
          clippedLabels,
        };
      });

      if (result.clippedLabels.length) {
        fail(`${pagePath} has clipped mobile current-skill labels at 390x844: ${JSON.stringify(result.clippedLabels.slice(0, 2))}`);
      }
    }
  } finally {
    await visualPage.close();
  }
}

async function assertContentQaMobileCards(browser) {
  const visualPage = await browser.newPage({ viewport: { width: 390, height: 844 } });

  try {
    await waitForStaticEnhancement(visualPage, 'p3/content-qa/index.html');
    const result = await visualPage.evaluate(() => {
      const isVisible = (element) => {
        if (!element || element.hidden) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      return {
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        cardListVisible: isVisible(document.querySelector('.contract-qa-card-list')),
        cardCount: Array.from(document.querySelectorAll('.contract-qa-mobile-card')).filter(isVisible).length,
        tableVisible: isVisible(document.querySelector('.contract-table-scroll')),
      };
    });

    if (result.horizontalOverflow) {
      fail('Internal Content QA has horizontal overflow at 390x844.');
    }
    if (!result.cardListVisible || result.cardCount === 0) {
      fail('Internal Content QA must render readable mobile QA cards at 390x844.');
    }
    if (result.tableVisible) {
      fail('Internal Content QA should hide the wide QA table on narrow mobile screens.');
    }
  } finally {
    await visualPage.close();
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
      hasP3Start: Array.from(document.querySelectorAll('a')).some((link) => /Start with Learn/.test(link.textContent || '')),
      hasDiagnostic: Array.from(document.querySelectorAll('a')).some((link) => /Diagnostic: Where to focus/.test(link.textContent || '')),
      hasPathGrid: Boolean(document.querySelector('.path-unit-grid')),
      hasOldHeroCopy: text.includes('CAIE 9709 practice that starts with the')
        || text.includes('Teacher ready')
        || text.includes('get reviewed')
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
  if (homepageResult.actionCards !== 3) {
    fail(`Root P3 landing page must show 3 action cards; saw ${homepageResult.actionCards}.`);
  }
  if (homepageResult.topicTiles !== 9) {
    fail(`Root P3 landing page must show 9 topic tiles; saw ${homepageResult.topicTiles}.`);
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

  for (const coursePage of ['p3/index.html']) {
    await waitForStaticEnhancement(page, coursePage);
    const courseResult = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        pathCards: document.querySelectorAll('.path-unit-card').length,
        hasDashboard: text.includes('Pure Mathematics 3') && text.includes('Unsure? Take diagnostic') && text.includes('All topic routes'),
        hasNextStepPanel: Boolean(document.querySelector('[data-p3-next-step-panel]')),
        hasProgressLabels: Boolean(document.querySelector('[data-progress-field-guide]'))
          && Boolean(document.querySelector('[data-progress-skill]'))
          && Boolean(document.querySelector('[data-progress-exam]')),
        hasCourseGrid: Boolean(document.querySelector('.course-topic-button-grid')),
      };
    });
    if (!courseResult.hasDashboard || !courseResult.hasNextStepPanel || !courseResult.hasProgressLabels || courseResult.pathCards < 9) {
      fail(`${coursePage} must render the P3 dashboard with unit evidence cards.`);
    }
    if (courseResult.hasCourseGrid) {
      fail(`${coursePage} must not render the old topic chooser grid.`);
    }
  }

  await waitForStaticEnhancement(page, 'p3/topics/index.html');
  const p3TopicsResult = await page.evaluate(() => {
    const text = document.body.textContent || '';
    return {
      hasPathHero: text.includes('CAIE 9709 Paper 3') && text.includes('P3 Topic Overview'),
      hasSequence: text.includes('Units') && text.includes('Unit 1') && text.includes('Unit 9'),
      hasFlow: ['Learn', 'Checked Practice', 'Exam Training', 'Review'].every((label) => text.includes(label)),
      pathCards: document.querySelectorAll('.path-unit-card').length,
    };
  });
  if (!p3TopicsResult.hasPathHero || !p3TopicsResult.hasSequence || !p3TopicsResult.hasFlow || p3TopicsResult.pathCards < 10) {
    fail('P3 topics page must remain the direct unit learning path.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/algebra/learn/index.html');
  const p3LearnResult = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    return {
      learnFlow: document.querySelectorAll('[data-learn-flow]').length,
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((item) => !item.hidden).length,
      checkForms: document.querySelectorAll('[data-check-learn-answer]').length,
      activeProblemInFirstViewport: Boolean(cardRect && cardRect.top < window.innerHeight * 0.72 && cardRect.bottom > 0),
      explanationHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    };
  });
  if (p3LearnResult.learnFlow !== 1) {
    fail('P3 Algebra Learn Mode must render one learn flow.');
  }
  if (p3LearnResult.learnSteps !== 17 || p3LearnResult.checkForms < 34) {
    fail('P3 Algebra Learn Mode must render the authored checked lesson sequence.');
  }
  if (p3LearnResult.visibleSteps !== 1 || !p3LearnResult.activeProblemInFirstViewport) {
    fail('P3 Algebra Learn Mode must show one active problem in the first viewport.');
  }
  if (!p3LearnResult.explanationHidden || !p3LearnResult.similarHidden || !p3LearnResult.transferHidden || !p3LearnResult.answerRevealHidden) {
    fail('P3 Algebra Learn Mode must hide explanation, similar question, exam transfer, and answer reveal before attempt.');
  }
  if (!p3LearnResult.nextOpen) {
    fail('P3 Algebra Learn Mode must keep next step available before completion.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/logarithmic-and-exponential-functions/learn/index.html');
  const logExpLearnResult = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const afterAttempt = document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]');
    return {
      learnFlow: document.querySelectorAll('[data-learn-flow]').length,
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((item) => !item.hidden).length,
      checkForms: document.querySelectorAll('[data-check-learn-answer]').length,
      activeProblemInFirstViewport: Boolean(cardRect && cardRect.top < window.innerHeight * 0.72 && cardRect.bottom > 0),
      explanationHidden: Boolean(afterAttempt?.hidden),
      principleHidden: Boolean(afterAttempt?.hidden),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    };
  });
  if (logExpLearnResult.learnFlow !== 1) {
    fail('P3 Log/Exp Learn Mode must render one learn flow.');
  }
  if (logExpLearnResult.learnSteps !== 17 || logExpLearnResult.checkForms < 34) {
    fail('P3 Log/Exp Learn Mode must render the authored checked lesson sequence.');
  }
  if (logExpLearnResult.visibleSteps !== 1 || !logExpLearnResult.activeProblemInFirstViewport) {
    fail('P3 Log/Exp Learn Mode must show one active problem in the first viewport.');
  }
  if (!logExpLearnResult.explanationHidden || !logExpLearnResult.principleHidden || !logExpLearnResult.similarHidden || !logExpLearnResult.transferHidden || !logExpLearnResult.answerRevealHidden) {
    fail('P3 Log/Exp Learn Mode must hide explanation, principle, similar question, exam transfer, and answer reveal before attempt.');
  }
  if (!logExpLearnResult.nextOpen) {
    fail('P3 Log/Exp Learn Mode must keep next step available before completion.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/trigonometry/learn/index.html');
  const trigLearnResult = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    return {
      learnFlow: document.querySelectorAll('[data-learn-flow]').length,
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((item) => !item.hidden).length,
      checkForms: document.querySelectorAll('[data-check-learn-answer]').length,
      activeProblemInFirstViewport: Boolean(cardRect && cardRect.top < window.innerHeight * 0.72 && cardRect.bottom > 0),
      explanationHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
    };
  });
  if (trigLearnResult.learnFlow !== 1 || trigLearnResult.learnSteps !== 14 || trigLearnResult.checkForms < 28) {
    fail('P3 Trigonometry Learn Mode must render the authored checked lesson sequence.');
  }
  if (trigLearnResult.visibleSteps !== 1 || !trigLearnResult.activeProblemInFirstViewport) {
    fail('P3 Trigonometry Learn Mode must show one active problem in the first viewport.');
  }
  if (!trigLearnResult.explanationHidden || !trigLearnResult.similarHidden || !trigLearnResult.transferHidden || !trigLearnResult.answerRevealHidden) {
    fail('P3 Trigonometry Learn Mode must hide explanation, similar question, exam transfer, and answer reveal before attempt.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/differentiation/learn/index.html');
  const diffLearnResult = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    return {
      learnFlow: document.querySelectorAll('[data-learn-flow]').length,
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((item) => !item.hidden).length,
      checkForms: document.querySelectorAll('[data-check-learn-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    };
  });
  if (diffLearnResult.learnFlow !== 1 || diffLearnResult.learnSteps !== 15 || diffLearnResult.checkForms < 30) {
    fail('P3 Differentiation Learn Mode must render the authored checked lesson sequence.');
  }
  if (diffLearnResult.visibleSteps !== 1 || !diffLearnResult.activeProblemInFirstViewport || !diffLearnResult.answerControlInFirstViewport || !diffLearnResult.checkButtonInFirstViewport) {
    fail('P3 Differentiation Learn Mode must show the active problem, first answer control, and Check Answer in the first viewport.');
  }
  if (diffLearnResult.radioInputs < 2) {
    fail('P3 Differentiation Learn Mode must render real radio controls for option prompts.');
  }
  if (!diffLearnResult.explanationHidden || !diffLearnResult.similarHidden || !diffLearnResult.transferHidden || !diffLearnResult.answerRevealHidden) {
    fail('P3 Differentiation Learn Mode must hide explanation, similar question, exam transfer, and answer reveal before attempt.');
  }
  if (!diffLearnResult.nextOpen) {
    fail('P3 Differentiation Learn Mode must keep next step available before completion.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/integration/learn/index.html');
  const integrationLearnResult = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    const afterAttempt = document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]');
    return {
      learnFlow: document.querySelectorAll('[data-learn-flow]').length,
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((item) => !item.hidden).length,
      checkForms: document.querySelectorAll('[data-check-learn-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(afterAttempt?.hidden),
      principleHidden: Boolean(afterAttempt?.hidden),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    };
  });
  if (integrationLearnResult.learnFlow !== 1 || integrationLearnResult.learnSteps !== 14 || integrationLearnResult.checkForms < 28) {
    fail('P3 Integration Learn Mode must render the authored checked lesson sequence.');
  }
  if (integrationLearnResult.visibleSteps !== 1 || !integrationLearnResult.activeProblemInFirstViewport || !integrationLearnResult.answerControlInFirstViewport || !integrationLearnResult.checkButtonInFirstViewport) {
    fail('P3 Integration Learn Mode must show the active problem, first answer control, and Check Answer in the first viewport.');
  }
  if (integrationLearnResult.radioInputs < 2) {
    fail('P3 Integration Learn Mode must render real radio controls for option prompts.');
  }
  if (!integrationLearnResult.explanationHidden || !integrationLearnResult.principleHidden || !integrationLearnResult.similarHidden || !integrationLearnResult.transferHidden || !integrationLearnResult.answerRevealHidden) {
    fail('P3 Integration Learn Mode must hide explanation, principle, similar question, exam transfer, and answer reveal before attempt.');
  }
  if (!integrationLearnResult.nextOpen) {
    fail('P3 Integration Learn Mode must keep next step available before completion.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/numerical-solution-of-equations/learn/index.html');
  const iterationLearnResult = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    const afterAttempt = document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]');
    return {
      learnFlow: document.querySelectorAll('[data-learn-flow]').length,
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((item) => !item.hidden).length,
      checkForms: document.querySelectorAll('[data-check-learn-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(afterAttempt?.hidden),
      principleHidden: Boolean(afterAttempt?.hidden),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    };
  });
  if (iterationLearnResult.learnFlow !== 1 || iterationLearnResult.learnSteps !== 12 || iterationLearnResult.checkForms < 24) {
    fail('P3 Numerical Solution of Equations Learn Mode must render the authored checked lesson sequence.');
  }
  if (iterationLearnResult.visibleSteps !== 1 || !iterationLearnResult.activeProblemInFirstViewport || !iterationLearnResult.answerControlInFirstViewport || !iterationLearnResult.checkButtonInFirstViewport) {
    fail('P3 Numerical Solution of Equations Learn Mode must show the active problem, first answer control, and Check Answer in the first viewport.');
  }
  if (iterationLearnResult.radioInputs < 2) {
    fail('P3 Numerical Solution of Equations Learn Mode must render real radio controls for option prompts.');
  }
  if (!iterationLearnResult.explanationHidden || !iterationLearnResult.principleHidden || !iterationLearnResult.similarHidden || !iterationLearnResult.transferHidden || !iterationLearnResult.answerRevealHidden) {
    fail('P3 Numerical Solution of Equations Learn Mode must hide explanation, principle, similar question, exam transfer, and answer reveal before attempt.');
  }
  if (!iterationLearnResult.nextOpen) {
    fail('P3 Numerical Solution of Equations Learn Mode must keep next step available before completion.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/differential-equations/learn/index.html');
  const deLearnResult = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    const afterAttempt = document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]');
    return {
      learnFlow: document.querySelectorAll('[data-learn-flow]').length,
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((item) => !item.hidden).length,
      checkForms: document.querySelectorAll('[data-check-learn-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(afterAttempt?.hidden),
      principleHidden: Boolean(afterAttempt?.hidden),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    };
  });
  if (deLearnResult.learnFlow !== 1 || deLearnResult.learnSteps !== 12 || deLearnResult.checkForms < 24) {
    fail('P3 Differential Equations Learn Mode must render the authored checked lesson sequence.');
  }
  if (deLearnResult.visibleSteps !== 1 || !deLearnResult.activeProblemInFirstViewport || !deLearnResult.answerControlInFirstViewport || !deLearnResult.checkButtonInFirstViewport) {
    fail('P3 Differential Equations Learn Mode must show the active problem, first answer control, and Check Answer in the first viewport.');
  }
  if (deLearnResult.radioInputs < 2) {
    fail('P3 Differential Equations Learn Mode must render real radio controls for option prompts.');
  }
  if (!deLearnResult.explanationHidden || !deLearnResult.principleHidden || !deLearnResult.similarHidden || !deLearnResult.transferHidden || !deLearnResult.answerRevealHidden) {
    fail('P3 Differential Equations Learn Mode must hide explanation, principle, similar question, exam transfer, and answer reveal before attempt.');
  }
  if (!deLearnResult.nextOpen) {
    fail('P3 Differential Equations Learn Mode must keep next step available before completion.');
  }

  await waitForStaticEnhancement(page, 'p3/topics/complex-numbers/learn/index.html');
  const complexLearnResult = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    const afterAttempt = document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]');
    return {
      learnFlow: document.querySelectorAll('[data-learn-flow]').length,
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((item) => !item.hidden).length,
      checkForms: document.querySelectorAll('[data-check-learn-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(afterAttempt?.hidden),
      principleHidden: Boolean(afterAttempt?.hidden),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    };
  });
  if (complexLearnResult.learnFlow !== 1 || complexLearnResult.learnSteps !== 17 || complexLearnResult.checkForms < 34) {
    fail('P3 Complex Numbers Learn Mode must render the authored checked lesson sequence.');
  }
  if (complexLearnResult.visibleSteps !== 1 || !complexLearnResult.activeProblemInFirstViewport || !complexLearnResult.answerControlInFirstViewport || !complexLearnResult.checkButtonInFirstViewport) {
    fail('P3 Complex Numbers Learn Mode must show the active problem, first answer control, and Check Answer in the first viewport.');
  }
  if (complexLearnResult.radioInputs < 2) {
    fail('P3 Complex Numbers Learn Mode must render real radio controls for option prompts.');
  }
  if (!complexLearnResult.explanationHidden || !complexLearnResult.principleHidden || !complexLearnResult.similarHidden || !complexLearnResult.transferHidden || !complexLearnResult.answerRevealHidden) {
    fail('P3 Complex Numbers Learn Mode must hide explanation, principle, similar question, exam transfer, and answer reveal before attempt.');
  }
  if (!complexLearnResult.nextOpen) {
    fail('P3 Complex Numbers Learn Mode must keep next step available before completion.');
  }

  await assertLearnVisualBasics(browser);
  await assertExamTrainingMobileVisuals(browser);
  await assertMobileSkillSelectorLabels(browser);
  await assertContentQaMobileCards(browser);

  for (const [oldAlgebraPath, bridgeTitle, buttonLabel] of [
    ['p3/topics/algebra/field-guide/index.html', 'Algebra — Learn', 'Learn'],
    ['p3/topics/logarithmic-and-exponential-functions/field-guide/index.html', 'Logarithmic and Exponential Functions — Learn', 'Learn'],
    ['p3/topics/differentiation/field-guide/index.html', 'Differentiation — Learn', 'Learn'],
    ['p3/topics/integration/field-guide/index.html', 'Integration — Learn', 'Learn'],
    ['p3/topics/numerical-solution-of-equations/field-guide/index.html', 'Numerical Solution of Equations — Learn', 'Learn'],
    ['p3/topics/differential-equations/field-guide/index.html', 'Differential Equations — Learn', 'Learn'],
    ['p3/topics/complex-numbers/field-guide/index.html', 'Complex Numbers — Learn', 'Learn'],
  ]) {
    await waitForStaticEnhancement(page, oldAlgebraPath);
    const oldAlgebraRouteResult = await page.evaluate(([title, expectedButtonLabel]) => {
    const text = document.body.innerText;
    return {
      bridgeTitle: text.includes(title),
      hasLearnLink: Array.from(document.querySelectorAll('a')).some((link) => (link.textContent || '').includes(expectedButtonLabel) && /\/learn\/(?:index\.html)?$/.test(link.href)),
      oldForms: document.querySelectorAll('[data-check-skill-answer]').length,
    };
    }, [bridgeTitle, buttonLabel]);
    if (!oldAlgebraRouteResult.bridgeTitle || !oldAlgebraRouteResult.hasLearnLink || oldAlgebraRouteResult.oldForms !== 0) {
      fail(`${oldAlgebraPath} must be a clean Learn bridge.`);
    }
  }

  for (const checkedPracticePath of [
    'p3/topics/algebra/skill-check/index.html',
    'p3/topics/logarithmic-and-exponential-functions/skill-check/index.html',
    'p3/topics/differentiation/skill-check/index.html',
    'p3/topics/integration/skill-check/index.html',
    'p3/topics/numerical-solution-of-equations/skill-check/index.html',
    'p3/topics/differential-equations/skill-check/index.html',
    'p3/topics/complex-numbers/skill-check/index.html',
  ]) {
    await waitForStaticEnhancement(page, checkedPracticePath);
    const checkedPracticeResult = await page.evaluate(() => ({
      title: document.body.innerText.includes('Checked Practice'),
      skillForms: document.querySelectorAll('[data-check-skill-answer]').length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
      firstFormVisible: Boolean(document.querySelector('[data-check-skill-answer]')?.closest('.practice-card:not([hidden])')),
    }));
    if (!checkedPracticeResult.title || checkedPracticeResult.skillForms === 0 || checkedPracticeResult.learnForms !== 0 || !checkedPracticeResult.firstFormVisible) {
      fail(`${checkedPracticePath} must render the separate Checked Practice flow.`);
    }
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
    fail('Review Mistakes must render mixed questions behind a local completion gate.');
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
