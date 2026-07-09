import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const docsRoot = path.join(repoRoot, 'docs');
const reportRoot = path.join(repoRoot, 'reports', 'static-full-review-2026-07-09');
const screenshotRoot = path.join(reportRoot, 'screenshots');
const manifestPath = path.join(docsRoot, 'static-pages.json');
const progressStorageKey = 'asterion.progress.v1';

const viewports = [
  { name: 'desktop', width: 1365, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

function pageUrl(pagePath) {
  return pathToFileURL(path.join(docsRoot, pagePath)).href;
}

function pageSlug(pagePath) {
  return pagePath.replace(/\/index\.html$/, '').replace(/\.html$/, '') || 'index';
}

function screenshotPath(viewportName, pagePath) {
  return path.join(screenshotRoot, viewportName, `${pageSlug(pagePath)}.png`);
}

function reportRelative(filePath) {
  return path.relative(reportRoot, filePath).split(path.sep).join('/');
}

function docsRelative(filePath) {
  return path.relative(docsRoot, filePath).split(path.sep).join('/');
}

function tryJson(value, fallback) {
  try {
    return JSON.parse(value ?? '');
  } catch {
    return fallback;
  }
}

function specFromElement(element) {
  const acceptedAnswers = tryJson(element.getAttribute('data-accepted-answers'), []);
  return {
    answerType: element.getAttribute('data-answer-type') || 'exact-text',
    acceptedAnswers: Array.isArray(acceptedAnswers) ? acceptedAnswers : [],
    tolerance: Number(element.getAttribute('data-tolerance') || '') || undefined,
    orderMatters: element.getAttribute('data-order-matters') === 'true',
  };
}

function pageFileExists(pagePath) {
  return existsSync(path.join(docsRoot, pagePath));
}

function resolveHtmlHref(fromPagePath, href) {
  const clean = decodeURI(href).replace(/[?#].*$/, '');
  if (!clean || clean.startsWith('#') || /^https?:\/\//i.test(clean) || /^mailto:/i.test(clean) || /^tel:/i.test(clean) || clean.startsWith('data:')) {
    return undefined;
  }
  const base = path.dirname(path.join(docsRoot, fromPagePath));
  const resolved = clean.startsWith('/')
    ? path.join(docsRoot, clean.replace(/^\/+/, ''))
    : path.resolve(base, clean);
  const relative = docsRelative(resolved);
  if (/\.html$/i.test(relative)) return relative;
  return `${relative.replace(/\/$/, '')}/index.html`;
}

function resolvePageAsset(fromPagePath, src) {
  const clean = decodeURI(src).replace(/[?#].*$/, '');
  if (!clean || /^https?:\/\//i.test(clean) || clean.startsWith('data:')) return undefined;
  const base = path.dirname(path.join(docsRoot, fromPagePath));
  return clean.startsWith('/')
    ? path.join(docsRoot, clean.replace(/^\/+/, ''))
    : path.resolve(base, clean);
}

async function collectBrokenLinks(pages) {
  const broken = [];
  for (const page of pages) {
    const html = await readFile(path.join(docsRoot, page.path), 'utf8');
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
      const resolved = resolveHtmlHref(page.path, match[1]);
      if (resolved && !pageFileExists(resolved)) {
        broken.push({ page: page.path, href: match[1], resolved });
      }
    }
  }
  return broken;
}

async function waitForStaticEnhancement(page) {
  try {
    await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function resetProgress(page) {
  await page.evaluate((key) => {
    window.localStorage.removeItem(key);
    window.history.replaceState(null, '', window.location.href.replace(/#.*/, ''));
  }, progressStorageKey);
}

async function closeCelebration(page) {
  await page.evaluate(() => {
    const root = document.querySelector('[data-correct-celebration]');
    if (!(root instanceof HTMLElement) || root.hidden) return;
    const close = root.querySelector('[data-correct-celebration-close]');
    if (close instanceof HTMLElement) close.click();
  });
}

async function auditVisualPage(page, pageInfo, viewport) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(pageUrl(pageInfo.path), { waitUntil: 'load' });
  const enhanced = await waitForStaticEnhancement(page);
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
      image.setAttribute('loading', 'eager');
    });
    const pause = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
    const step = Math.max(window.innerHeight - 120, 240);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await pause(40);
    }
    window.scrollTo(0, 0);
    await pause(80);
  });

  const shotPath = screenshotPath(viewport.name, pageInfo.path);
  await mkdir(path.dirname(shotPath), { recursive: true });
  await page.screenshot({ path: shotPath, fullPage: true });

  const dom = await page.evaluate(() => {
    const visible = (element) => {
      if (!(element instanceof HTMLElement) || element.hidden) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const main = document.querySelector('main');
    const mainActions = Array.from((main ?? document).querySelectorAll('a[href], button:not([disabled]), summary'))
      .filter((element) => visible(element))
      .map((element) => (element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const bodyWidth = Math.ceil(document.body.scrollWidth);
    const viewportWidth = window.innerWidth;
    return {
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || '',
      enhanced: document.documentElement.classList.contains('static-enhanced'),
      visibleImageFailures: Array.from(document.images)
        .filter((image) => {
          if (image.closest('details:not([open])')) return false;
          return !image.complete || image.naturalWidth === 0 || image.naturalHeight === 0;
        })
        .map((image) => image.getAttribute('src') || image.currentSrc || ''),
      imageSources: Array.from(document.images).map((image) => image.getAttribute('src') || image.currentSrc || '').filter(Boolean),
      horizontalOverflow: bodyWidth > viewportWidth + 2,
      bodyWidth,
      viewportWidth,
      visibleMainActionCount: mainActions.length,
      visibleMainActions: mainActions.slice(0, 12),
      openMarkSchemes: Array.from(document.querySelectorAll('[data-mark-scheme-reveal]')).filter((details) => details.open).length,
      examCards: document.querySelectorAll('.exam-question-card').length,
      examCardsMissingImages: Array.from(document.querySelectorAll('.exam-question-card')).filter((card) => (
        card.querySelectorAll('.question-figure img').length < 2
      )).length,
    };
  });
  const missingImageFiles = dom.imageSources.filter((src) => {
    const resolved = resolvePageAsset(pageInfo.path, src);
    return resolved !== undefined && !existsSync(resolved);
  });
  const imageFailures = Array.from(new Set([...dom.visibleImageFailures, ...missingImageFiles]));

  return {
    viewport: viewport.name,
    screenshot: reportRelative(shotPath),
    enhanced,
    consoleErrors,
    pageErrors,
    ...dom,
    imageFailures,
  };
}

function chooseWrongSubmission(element, spec) {
  const accepted = new Set(spec.acceptedAnswers.flatMap((answer) => String(answer).split(/\s*,\s*/).filter(Boolean)));
  const choices = Array.from(element.querySelectorAll('input[name="submittedAnswer"], input[data-diagnostic-mark-point], input[data-p1-repair-answer]'))
    .map((input) => input.value)
    .filter(Boolean);
  const nonAcceptedChoice = choices.find((choice) => !accepted.has(choice));
  if (nonAcceptedChoice) return nonAcceptedChoice;
  if (spec.answerType === 'numeric') return '987654321';
  if (spec.answerType === 'interval') return 'x < -987654321';
  if (spec.answerType === 'coordinate') return '(987654321, 987654321)';
  if (spec.answerType === 'complex-number') return '987654321+987654321i';
  return '__definitely_wrong__';
}

async function auditAnswerSpecs(page) {
  return page.evaluate(() => {
    const tryJsonInPage = (value, fallback) => {
      try {
        return JSON.parse(value || '');
      } catch {
        return fallback;
      }
    };
    const hooks = window.__ASTERION_SKILL_CHECK_TEST_HOOKS__;
    const elements = Array.from(document.querySelectorAll('[data-answer-type][data-accepted-answers]'));
    const seen = new Set();
    const checks = [];
    const failures = [];

    const chooseWrongInPage = (element, spec) => {
      const accepted = new Set(spec.acceptedAnswers.flatMap((answer) => String(answer).split(/\s*,\s*/).filter(Boolean)));
      const choices = Array.from(element.querySelectorAll('input[name="submittedAnswer"], input[data-diagnostic-mark-point], input[data-p1-repair-answer]'))
        .map((input) => input.value)
        .filter(Boolean);
      const nonAcceptedChoice = choices.find((choice) => !accepted.has(choice));
      if (nonAcceptedChoice) return nonAcceptedChoice;
      if (spec.answerType === 'numeric') return '987654321';
      if (spec.answerType === 'interval') return 'x < -987654321';
      if (spec.answerType === 'coordinate') return '(987654321, 987654321)';
      if (spec.answerType === 'complex-number') return '987654321+987654321i';
      return '__definitely_wrong__';
    };

    if (elements.length && !hooks?.checkSubmittedSkillAnswer) {
      return {
        count: elements.length,
        failures: [{ id: 'global', message: 'Static answer checker hooks are missing.' }],
      };
    }

    for (const element of elements) {
      const spec = {
        answerType: element.getAttribute('data-answer-type') || 'exact-text',
        acceptedAnswers: tryJsonInPage(element.getAttribute('data-accepted-answers'), []),
        tolerance: Number(element.getAttribute('data-tolerance') || '') || undefined,
        orderMatters: element.getAttribute('data-order-matters') === 'true',
      };
      const id = [
        element.getAttribute('data-check-id'),
        element.getAttribute('data-question-id'),
        element.getAttribute('data-mark-point-id'),
        element.getAttribute('data-module-id'),
        element.getAttribute('name'),
        element.getAttribute('data-question-title'),
        spec.answerType,
        spec.acceptedAnswers.join('|'),
      ].filter(Boolean).join('::');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const accepted = spec.acceptedAnswers[0] ?? '';
      const wrong = chooseWrongInPage(element, spec);
      const correctResult = hooks.checkSubmittedSkillAnswer(spec, accepted);
      const wrongResult = hooks.checkSubmittedSkillAnswer(spec, wrong);
      const label = element.getAttribute('data-question-title')
        || element.getAttribute('aria-label')
        || element.closest('article, section, form')?.querySelector('h2, h3, h4')?.textContent?.replace(/\s+/g, ' ').trim()
        || id;
      checks.push({
        id,
        label,
        answerType: spec.answerType,
        accepted,
        correctAccepted: correctResult.isCorrect === true && correctResult.unsupported !== true,
        wrongRejected: wrongResult.isCorrect !== true,
      });
      if (correctResult.isCorrect !== true || correctResult.unsupported === true) {
        failures.push({ id, label, message: `Correct answer was rejected: ${correctResult.reason || 'no reason supplied'}` });
      }
      if (wrongResult.isCorrect === true) {
        failures.push({ id, label, message: `Clearly wrong answer was accepted: ${wrong}` });
      }
    }
    return { count: checks.length, checks, failures };
  });
}

async function fillCheckForm(page, selector, answerKind = 'correct') {
  return page.evaluate(({ selector, answerKind: requestedKind }) => {
    const form = document.querySelector(selector);
    if (!(form instanceof HTMLFormElement)) return { ok: false, message: 'Form not found.' };
    const spec = {
      answerType: form.getAttribute('data-answer-type') || 'exact-text',
      acceptedAnswers: JSON.parse(form.getAttribute('data-accepted-answers') || '[]'),
      tolerance: Number(form.getAttribute('data-tolerance') || '') || undefined,
      orderMatters: form.getAttribute('data-order-matters') === 'true',
    };
    const accepted = String(spec.acceptedAnswers[0] || '');
    const wrong = spec.answerType === 'numeric' ? '987654321' : '__definitely_wrong__';
    const submitted = requestedKind === 'wrong' ? wrong : accepted;
    const actualAcceptedValues = accepted.split(/\s*,\s*/).filter(Boolean);
    const textInputs = Array.from(form.querySelectorAll('input[name="submittedAnswer"][type="text"]'));
    if (textInputs.length) {
      const parts = submitted.split(/\s*,\s*/);
      textInputs.forEach((input, index) => {
        input.value = parts[index] ?? submitted;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return { ok: true };
    }
    const acceptedValues = submitted.split(/\s*,\s*/).filter(Boolean);
    const checkboxes = Array.from(form.querySelectorAll('input[name="submittedAnswer"][type="checkbox"]'));
    if (checkboxes.length) {
      if (requestedKind === 'wrong') {
        const wrongBox = checkboxes.find((input) => !actualAcceptedValues.includes(input.value)) || checkboxes[0];
        checkboxes.forEach((input) => {
          input.checked = input === wrongBox;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      } else {
        checkboxes.forEach((input) => {
          input.checked = acceptedValues.includes(input.value);
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
      return { ok: true };
    }
    const radios = Array.from(form.querySelectorAll('input[name="submittedAnswer"][type="radio"]'));
    if (radios.length) {
      const target = requestedKind === 'wrong'
        ? radios.find((input) => !actualAcceptedValues.includes(input.value)) || radios[0]
        : radios.find((input) => acceptedValues.includes(input.value)) || radios[0];
      target.checked = true;
      target.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true };
    }
    return { ok: false, message: 'No supported input found.' };
  }, { selector, answerKind });
}

async function submitAndReadFeedback(page, selector, answerKind = 'correct') {
  const filled = await fillCheckForm(page, selector, answerKind);
  if (!filled.ok) return filled;
  await page.locator(selector).locator('button[type="submit"]').first().click();
  await page.waitForTimeout(150);
  await closeCelebration(page);
  return page.evaluate((formSelector) => {
    const form = document.querySelector(formSelector);
    const feedback = form?.querySelector('.skill-check-feedback')?.textContent?.replace(/\s+/g, ' ').trim() || '';
    return { ok: true, feedback };
  }, selector);
}

async function auditSurfaceInteractions(page, pagePath) {
  const interactions = [];
  const add = (surface, ok, message, details = {}) => interactions.push({ surface, ok, message, ...details });

  await resetProgress(page);

  const surfaceCounts = await page.evaluate(() => ({
    learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
    skillForms: document.querySelectorAll('[data-check-skill-answer]').length,
    diagnosticForms: document.querySelectorAll('[data-p3-diagnostic-form]').length,
    repairForms: document.querySelectorAll('[data-p1-repair-module-form]').length,
    examForms: document.querySelectorAll('[data-save-exam-attempt]').length,
    exportForms: document.querySelectorAll('[data-export-local-progress-form]').length,
  }));

  if (surfaceCounts.learnForms) {
    const wrong = await submitAndReadFeedback(page, '[data-learn-step-card]:not([hidden]) [data-check-learn-answer][data-learn-variant="primary"]', 'wrong');
    const wrongState = await page.evaluate((key) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      return {
        learningAttempts: progress.learningActivityAttempts?.length ?? 0,
        skillAttempts: progress.skillCheckAttempts?.length ?? 0,
        hintVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-hint]')?.hidden,
      };
    }, progressStorageKey);
    add('Learn wrong answer', Boolean(wrong.ok && wrong.feedback && wrongState.learningAttempts >= 1 && wrongState.skillAttempts === 0 && wrongState.hintVisible), wrong.feedback || wrong.message || 'No feedback after wrong Learn answer.', wrongState);

    await page.reload({ waitUntil: 'load' });
    await waitForStaticEnhancement(page);
    await resetProgress(page);
    const correct = await submitAndReadFeedback(page, '[data-learn-step-card]:not([hidden]) [data-check-learn-answer][data-learn-variant="primary"]', 'correct');
    const correctState = await page.evaluate((key) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      return {
        learningAttempts: progress.learningActivityAttempts?.length ?? 0,
        skillAttempts: progress.skillCheckAttempts?.length ?? 0,
        similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
        nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
      };
    }, progressStorageKey);
    add('Learn correct answer', Boolean(correct.ok && correct.feedback && correctState.learningAttempts >= 1 && correctState.skillAttempts === 0), correct.feedback || correct.message || 'No feedback after correct Learn answer.', correctState);
  }

  if (surfaceCounts.skillForms) {
    await page.reload({ waitUntil: 'load' });
    await waitForStaticEnhancement(page);
    await resetProgress(page);
    const wrong = await submitAndReadFeedback(page, '.practice-card:not([hidden]) [data-check-skill-answer]', 'wrong');
    const wrongState = await page.evaluate((key) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      return {
        skillAttempts: progress.skillCheckAttempts?.length ?? 0,
        firstCorrect: progress.skillCheckAttempts?.[0]?.isCorrect === true,
      };
    }, progressStorageKey);
    add('Checked Practice wrong answer', Boolean(wrong.ok && wrong.feedback && wrongState.skillAttempts >= 1 && !wrongState.firstCorrect), wrong.feedback || wrong.message || 'No feedback after wrong Checked Practice answer.', wrongState);

    await page.reload({ waitUntil: 'load' });
    await waitForStaticEnhancement(page);
    await resetProgress(page);
    const correct = await submitAndReadFeedback(page, '.practice-card:not([hidden]) [data-check-skill-answer]', 'correct');
    const correctState = await page.evaluate((key) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      return {
        skillAttempts: progress.skillCheckAttempts?.length ?? 0,
        firstCleanCorrect: progress.skillCheckAttempts?.[0]?.isCorrect === true
          && progress.skillCheckAttempts?.[0]?.usedHint === false
          && progress.skillCheckAttempts?.[0]?.revealedAnswer === false
          && progress.skillCheckAttempts?.[0]?.revealedRepairStep === false,
      };
    }, progressStorageKey);
    add('Checked Practice correct answer', Boolean(correct.ok && correct.feedback && correctState.firstCleanCorrect), correct.feedback || correct.message || 'No feedback after correct Checked Practice answer.', correctState);
  }

  if (surfaceCounts.examForms) {
    const examState = await page.evaluate(() => ({
      forms: document.querySelectorAll('[data-save-exam-attempt]').length,
      openMarkSchemes: Array.from(document.querySelectorAll('[data-mark-scheme-reveal]')).filter((details) => details.open).length,
      cardsMissingQuestionImage: Array.from(document.querySelectorAll('.exam-question-card')).filter((card) => !card.querySelector(':scope > .question-figure img')).length,
      cardsMissingMarkSchemeImage: Array.from(document.querySelectorAll('.exam-question-card')).filter((card) => !card.querySelector('[data-mark-scheme-reveal] img')).length,
    }));
    add('Exam Training image/self-mark contract', examState.forms > 0 && examState.openMarkSchemes === 0 && examState.cardsMissingQuestionImage === 0 && examState.cardsMissingMarkSchemeImage === 0, 'Exam cards have hidden mark schemes and image pairs.', examState);
  }

  if (surfaceCounts.diagnosticForms) {
    const diagnosticState = await page.evaluate(() => ({
      forms: document.querySelectorAll('[data-p3-diagnostic-form]').length,
      markPoints: document.querySelectorAll('[data-diagnostic-mark-point]').length,
      submitPanels: document.querySelectorAll('[data-diagnostic-submit-panel]').length,
    }));
    add('P3 Diagnostic mark-point contract', diagnosticState.forms === 1 && diagnosticState.markPoints > 0 && diagnosticState.submitPanels > 0, 'Diagnostic form exposes machine-checkable mark points.', diagnosticState);
  }

  if (surfaceCounts.repairForms) {
    const repairState = await page.evaluate(() => ({
      forms: document.querySelectorAll('[data-p1-repair-module-form]').length,
      fastQuestions: document.querySelectorAll('[data-p1-repair-fast-question]').length,
      miniChecks: document.querySelectorAll('[data-p1-repair-mini-check]').length,
      fastSubmitButtons: document.querySelectorAll('button[type="submit"][value="fast"]').length,
      miniSubmitButtons: document.querySelectorAll('button[type="submit"][value="mini"]').length,
    }));
    add('P1 Review repair contract', repairState.forms > 0 && repairState.fastQuestions >= repairState.forms && repairState.miniChecks >= repairState.forms && repairState.fastSubmitButtons >= repairState.forms && repairState.miniSubmitButtons >= repairState.forms, 'Repair lane exposes fast and mini-check controls for each module.', repairState);
  }

  if (surfaceCounts.exportForms) {
    await page.reload({ waitUntil: 'load' });
    await waitForStaticEnhancement(page);
    const exportResult = await page.evaluate(() => {
      const form = document.querySelector('[data-export-local-progress-form]');
      if (!(form instanceof HTMLFormElement)) return { ok: false, message: 'Export form not found.' };
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: form.querySelector('button[type="submit"]') }));
      const status = form.closest('[data-export-panel]')?.querySelector('[data-export-status]')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      return { ok: Boolean(status), status };
    });
    add('Progress export submit', exportResult.ok, exportResult.status || exportResult.message || 'No export status rendered.');
  }

  return interactions.map((interaction) => ({ page: pagePath, ...interaction }));
}

function criticalFindingsForPage(pageRecord) {
  const findings = [];
  for (const shot of pageRecord.screenshots) {
    for (const error of shot.consoleErrors) findings.push(`${shot.viewport}: console error: ${error}`);
    for (const error of shot.pageErrors) findings.push(`${shot.viewport}: page error: ${error}`);
    if (!shot.enhanced) findings.push(`${shot.viewport}: static enhancement did not complete`);
    for (const image of shot.imageFailures) findings.push(`${shot.viewport}: broken image: ${image}`);
    if (shot.horizontalOverflow) findings.push(`${shot.viewport}: horizontal overflow ${shot.bodyWidth}px > ${shot.viewportWidth}px`);
    if (shot.examCardsMissingImages) findings.push(`${shot.viewport}: ${shot.examCardsMissingImages} exam card(s) missing question/mark-scheme image pair`);
    if (shot.openMarkSchemes) findings.push(`${shot.viewport}: ${shot.openMarkSchemes} mark scheme(s) open by default`);
  }
  for (const failure of pageRecord.answerSpecAudit.failures) {
    findings.push(`answer spec: ${failure.label}: ${failure.message}`);
  }
  for (const interaction of pageRecord.interactions.filter((item) => !item.ok)) {
    findings.push(`${interaction.surface}: ${interaction.message}`);
  }
  return findings;
}

function warningFindingsForPage(pageRecord) {
  return pageRecord.screenshots.flatMap((shot) => {
    if (shot.visibleMainActionCount === 0) return [`${shot.viewport}: no visible main action found`];
    return [];
  });
}

function renderReport({ generatedAt, pages, brokenLinks, criticalFindings, warnings }) {
  const lines = [
    '# Full Static Summer Assignment Review',
    `Date: ${generatedAt}`,
    '',
    '## Summary',
    '',
    `- Generated pages reviewed: ${pages.length}`,
    `- Desktop screenshots: ${pages.length}`,
    `- Mobile screenshots: ${pages.length}`,
    `- Embedded answer specs checked: ${pages.reduce((sum, page) => sum + page.answerSpecAudit.count, 0)}`,
    `- Interaction checks run: ${pages.reduce((sum, page) => sum + page.interactions.length, 0)}`,
    `- Critical findings: ${criticalFindings.length}`,
    `- Warnings: ${warnings.length}`,
    '',
    '## Critical Findings',
    '',
    criticalFindings.length ? criticalFindings.map((finding) => `- ${finding}`).join('\n') : 'No critical findings remain in this audit run.',
    '',
    '## Broken Internal Links',
    '',
    brokenLinks.length ? brokenLinks.map((link) => `- ${link.page}: ${link.href} -> ${link.resolved}`).join('\n') : 'No broken internal links found.',
    '',
    '## Page Evidence',
    '',
    '| Page | Answer specs | Interactions | Desktop | Mobile | Notes |',
    '|---|---:|---:|---|---|---|',
  ];

  for (const page of pages) {
    const desktop = page.screenshots.find((shot) => shot.viewport === 'desktop');
    const mobile = page.screenshots.find((shot) => shot.viewport === 'mobile');
    const notes = [
      ...criticalFindingsForPage(page),
      ...warningFindingsForPage(page),
    ];
    lines.push(`| ${page.label} \`${page.path}\` | ${page.answerSpecAudit.count} | ${page.interactions.length} | [desktop](${desktop?.screenshot ?? ''}) | [mobile](${mobile?.screenshot ?? ''}) | ${notes.length ? notes.join('<br>') : 'PASS'} |`);
  }

  lines.push(
    '',
    '## Surface Coverage',
    '',
    '- Learn Mode primary/similar specs are checked from embedded answer data; visible Learn wrong/correct behavior is exercised per Learn route.',
    '- Checked Practice specs are checked from embedded answer data; visible wrong/correct behavior is exercised per Checked Practice route.',
    '- P3 diagnostic mark points, P1 repair questions, and export/Exam Training contracts are checked from their generated static controls.',
    '- Exam Training and Review pages are checked for hidden mark schemes and question/mark-scheme image pairs.',
    '',
    '## Residual Risk',
    '',
    '- Browser automation verifies deterministic answer specs and representative UI behavior. It does not replace a teacher reading every worked solution line for mathematical pedagogy.',
    '- Screenshots are full-page evidence for layout and assets; fine-grained visual judgment still benefits from human inspection of the linked images.',
    '',
  );

  return `${lines.join('\n')}\n`;
}

async function main() {
  const generatedAt = '2026-07-09';
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const pages = manifest.pages;
  await mkdir(reportRoot, { recursive: true });
  await mkdir(screenshotRoot, { recursive: true });

  const brokenLinks = await collectBrokenLinks(pages);
  const browser = await chromium.launch({ headless: true });
  const pageRecords = [];

  try {
    for (const pageInfo of pages) {
      const screenshots = [];
      for (const viewport of viewports) {
        const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
        try {
          screenshots.push(await auditVisualPage(page, pageInfo, viewport));
        } finally {
          await page.close();
        }
      }

      const auditPage = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
      let answerSpecAudit;
      let interactions;
      try {
        await auditPage.goto(pageUrl(pageInfo.path), { waitUntil: 'load' });
        await waitForStaticEnhancement(auditPage);
        answerSpecAudit = await auditAnswerSpecs(auditPage);
        interactions = await auditSurfaceInteractions(auditPage, pageInfo.path);
      } finally {
        await auditPage.close();
      }

      pageRecords.push({
        path: pageInfo.path,
        label: pageInfo.label,
        screenshots,
        answerSpecAudit,
        interactions,
      });
    }
  } finally {
    await browser.close();
  }

  const criticalFindings = [
    ...brokenLinks.map((link) => `${link.page}: broken link ${link.href} -> ${link.resolved}`),
    ...pageRecords.flatMap((page) => criticalFindingsForPage(page).map((finding) => `${page.path}: ${finding}`)),
  ];
  const warnings = pageRecords.flatMap((page) => warningFindingsForPage(page).map((warning) => `${page.path}: ${warning}`));

  const output = {
    generatedAt,
    docsManifest: docsRelative(manifestPath),
    pageCount: pageRecords.length,
    brokenLinks,
    criticalFindings,
    warnings,
    pages: pageRecords,
  };

  await writeFile(path.join(reportRoot, 'manifest.json'), `${JSON.stringify(output, null, 2)}\n`);
  await writeFile(path.join(reportRoot, 'report.md'), renderReport({
    generatedAt,
    pages: pageRecords,
    brokenLinks,
    criticalFindings,
    warnings,
  }));

  if (criticalFindings.length) {
    console.error(`Full static review found ${criticalFindings.length} critical finding(s). Report: ${path.join(reportRoot, 'report.md')}`);
    process.exit(1);
  }

  console.log(`Full static review passed for ${pageRecords.length} page(s). Report: ${path.join(reportRoot, 'report.md')}`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
