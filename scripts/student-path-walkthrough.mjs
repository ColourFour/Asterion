import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const docsRoot = path.join(repoRoot, 'docs');
const outputRoot = path.join(repoRoot, 'reports', 'student-path-walkthrough-2026-07-09');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const storageKey = 'asterion.progress.v1';

function pageUrl(pagePath) {
  return pathToFileURL(path.join(docsRoot, pagePath)).href;
}

function pageSlug(pagePath) {
  return pagePath.replace(/\/index\.html$/, '').replace(/\.html$/, '') || 'index';
}

function shotPath(pagePath, suffix) {
  return path.join(screenshotRoot, `${pageSlug(pagePath)}-${suffix}.png`);
}

function rel(filePath) {
  return path.relative(outputRoot, filePath).split(path.sep).join('/');
}

async function waitForStatic(page) {
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
}

async function prepPage(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => image.setAttribute('loading', 'eager'));
    const pause = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
    const step = Math.max(window.innerHeight - 120, 240);
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await pause(25);
    }
    window.scrollTo(0, 0);
    await pause(75);
  });
}

async function capture(page, pagePath, suffix) {
  const filePath = shotPath(pagePath, suffix);
  await mkdir(path.dirname(filePath), { recursive: true });
  await prepPage(page);
  await page.screenshot({ path: filePath, fullPage: true });
  return rel(filePath);
}

function renderReport(records, totals) {
  const lines = [
    '# Student Path Walkthrough Evidence',
    'Date: 2026-07-09',
    '',
    'This pass visits every generated static page in the student-facing route set, captures a page screenshot, validates every embedded deterministic answer spec with both a correct and a deliberately wrong answer, and exercises the visible student interaction surface where the page exposes one.',
    '',
    '## Totals',
    '',
    `- Pages visited: ${totals.pages}`,
    `- Embedded answer specs checked: ${totals.answerSpecs}`,
    `- Generated Learn/Checked Practice forms submitted: ${totals.generatedFormSubmissions}`,
    `- Answer spec failures: ${totals.answerFailures}`,
    `- Visible interactions attempted: ${totals.visibleInteractions}`,
    `- Visible interaction failures: ${totals.visibleInteractionFailures}`,
    `- Screenshots captured: ${totals.screenshots}`,
    '',
    '## Page-by-page path',
    '',
    '| # | Page | What I did | Answer specs | Form submits | Visible interaction | Screenshots | Notes |',
    '|---:|---|---|---:|---:|---|---|---|',
  ];

  for (const record of records) {
    const shots = [
      `[page](${record.screenshots.page})`,
      record.screenshots.after ? `[after](${record.screenshots.after})` : '',
    ].filter(Boolean).join(' ');
    lines.push(`| ${record.index} | ${record.label}<br>\`${record.path}\` | ${record.actionSummary} | ${record.answerSpecCount} | ${record.generatedFormSubmissions} | ${record.visibleInteraction?.ok ? 'PASS' : record.visibleInteraction ? 'FAIL' : 'n/a'}${record.visibleInteraction ? ` - ${record.visibleInteraction.message}` : ''} | ${shots} | ${record.notes.length ? record.notes.join('<br>') : 'No issues noted.'} |`);
  }

  return `${lines.join('\n')}\n`;
}

async function fillForm(page, selector, answerKind) {
  return page.evaluate(({ selector, answerKind }) => {
    const form = document.querySelector(selector);
    if (!(form instanceof HTMLFormElement)) return { ok: false, message: 'form not found' };
    const spec = {
      answerType: form.getAttribute('data-answer-type') || 'exact-text',
      acceptedAnswers: JSON.parse(form.getAttribute('data-accepted-answers') || '[]'),
      tolerance: Number(form.getAttribute('data-tolerance') || '') || undefined,
      orderMatters: form.getAttribute('data-order-matters') === 'true',
    };
    const accepted = String(spec.acceptedAnswers[0] || '');
    const acceptedValues = accepted.split(/\s*,\s*/).filter(Boolean);
    const wrong = spec.answerType === 'numeric' ? '987654321' : '__definitely_wrong__';
    const submitted = answerKind === 'wrong' ? wrong : accepted;
    const textInputs = Array.from(form.querySelectorAll('input[name="submittedAnswer"][type="text"]'));
    if (textInputs.length) {
      const cleanedSubmitted = submitted
        .replace(/^[([{<⟨]\s*/, '')
        .replace(/\s*[)\]}>⟩]$/, '');
      const parts = textInputs.length > 1 ? cleanedSubmitted.split(/\s*,\s*/) : [submitted];
      textInputs.forEach((input, index) => {
        input.value = parts[index] ?? submitted;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return { ok: true, submitted };
    }
    const selects = Array.from(form.querySelectorAll('select[name="submittedAnswer"]'));
    if (selects.length) {
      const values = answerKind === 'wrong' ? selects.map(() => selects[0]?.options[1]?.value || '') : acceptedValues;
      selects.forEach((select, index) => {
        select.value = values[index] || '';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return { ok: true, submitted: values.join(', ') };
    }
    const checkboxes = Array.from(form.querySelectorAll('input[name="submittedAnswer"][type="checkbox"]'));
    if (checkboxes.length) {
      const wrongBox = checkboxes.find((input) => !acceptedValues.includes(input.value)) || checkboxes[0];
      checkboxes.forEach((input) => {
        input.checked = answerKind === 'wrong' ? input === wrongBox : acceptedValues.includes(input.value);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return { ok: true, submitted: answerKind === 'wrong' ? wrongBox.value : accepted };
    }
    const radios = Array.from(form.querySelectorAll('input[name="submittedAnswer"][type="radio"]'));
    if (radios.length) {
      const target = answerKind === 'wrong'
        ? radios.find((input) => !acceptedValues.includes(input.value)) || radios[0]
        : radios.find((input) => acceptedValues.includes(input.value)) || radios[0];
      target.checked = true;
      target.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true, submitted: target.value };
    }
    return { ok: false, message: 'no supported answer control found' };
  }, { selector, answerKind });
}

async function submitVisibleForm(page, selector, description) {
  await page.evaluate(() => {
    const root = document.querySelector('[data-correct-celebration]');
    if (!(root instanceof HTMLElement) || root.hidden) return;
    const close = root.querySelector('[data-correct-celebration-close]');
    if (close instanceof HTMLElement) close.click();
  });
  const filled = await fillForm(page, selector, 'correct');
  if (!filled.ok) return { ok: false, message: `${description}: ${filled.message}` };
  await page.locator(selector).locator('button[type="submit"]').first().click();
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const root = document.querySelector('[data-correct-celebration]');
    if (!(root instanceof HTMLElement) || root.hidden) return;
    const close = root.querySelector('[data-correct-celebration-close]');
    if (close instanceof HTMLElement) close.click();
  });
  const feedback = await page.evaluate((selector) => {
    const form = document.querySelector(selector);
    return form?.querySelector('.skill-check-feedback')?.textContent?.replace(/\s+/g, ' ').trim() || '';
  }, selector);
  return {
    ok: /^Correct\b/i.test(feedback),
    message: `${description}: submitted ${filled.submitted}; ${feedback || 'no feedback rendered'}`,
  };
}

async function submitDiagnostic(page) {
  const result = await page.evaluate(() => {
    const form = document.querySelector('[data-p3-diagnostic-form]');
    if (!(form instanceof HTMLFormElement)) return { ok: false, message: 'diagnostic form not found' };
    const inputs = Array.from(form.querySelectorAll('[data-diagnostic-mark-point]'));
    for (const input of inputs) {
      const answers = JSON.parse(input.getAttribute('data-accepted-answers') || '[]');
      input.value = answers[0] || '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: form.querySelector('button[type="submit"]') }));
    return {
      ok: true,
      message: `submitted ${inputs.length} diagnostic mark points`,
      reportVisible: !document.querySelector('[data-p3-diagnostic-report]')?.hidden,
    };
  });
  await page.waitForTimeout(250);
  return { ok: result.ok && result.reportVisible, message: `${result.message}; report visible: ${result.reportVisible}` };
}

async function submitExport(page) {
  const result = await page.evaluate(() => {
    const form = document.querySelector('[data-export-local-progress-form]');
    if (!(form instanceof HTMLFormElement)) return { ok: false, message: 'export form not found' };
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: form.querySelector('button[type="submit"]') }));
    const status = form.closest('[data-export-panel]')?.querySelector('[data-export-status]')?.textContent?.replace(/\s+/g, ' ').trim() || '';
    return { ok: Boolean(status), message: status || 'no export status' };
  });
  await page.waitForTimeout(150);
  return result;
}

async function exerciseVisibleSurface(page, pagePath) {
  const counts = await page.evaluate(() => ({
    learn: document.querySelectorAll('[data-check-learn-answer]').length,
    skill: document.querySelectorAll('[data-check-skill-answer]').length,
    diagnostic: document.querySelectorAll('[data-p3-diagnostic-form]').length,
    exportForm: document.querySelectorAll('[data-export-local-progress-form]').length,
    exam: document.querySelectorAll('[data-save-exam-attempt]').length,
    repair: document.querySelectorAll('[data-p1-repair-module-form]').length,
  }));

  if (counts.diagnostic) return submitDiagnostic(page);
  if (counts.learn) return submitVisibleForm(page, '[data-learn-step-card]:not([hidden]) [data-check-learn-answer][data-learn-variant="primary"]', 'visible Learn check');
  if (counts.skill) return submitVisibleForm(page, '.practice-card:not([hidden]) [data-check-skill-answer]', 'visible Checked Practice check');
  if (counts.exportForm) return submitExport(page);
  if (counts.exam) {
    const opened = await page.evaluate(() => {
      const details = document.querySelector('[data-mark-scheme-reveal]');
      if (!(details instanceof HTMLDetailsElement)) return false;
      details.open = true;
      details.dispatchEvent(new Event('toggle', { bubbles: true }));
      return true;
    });
    await page.waitForTimeout(150);
    return { ok: opened, message: opened ? 'opened first mark-scheme reveal' : 'no mark-scheme reveal found' };
  }
  if (counts.repair) {
    const repairResult = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('[data-p1-repair-module-form]'));
      let submittedAnswers = 0;
      const failures = [];
      const fillInput = (input) => {
        const answers = JSON.parse(input.getAttribute('data-accepted-answers') || '[]');
        input.value = answers[0] || '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        submittedAnswers += 1;
      };
      for (const form of forms) {
        const fastInputs = Array.from(form.querySelectorAll('[data-p1-repair-fast-question]'));
        fastInputs.forEach(fillInput);
        form.dispatchEvent(new SubmitEvent('submit', {
          bubbles: true,
          cancelable: true,
          submitter: form.querySelector('button[type="submit"][value="fast"]'),
        }));
        const miniInput = form.querySelector('[data-p1-repair-mini-check]');
        if (miniInput instanceof HTMLInputElement) {
          fillInput(miniInput);
          form.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
            submitter: form.querySelector('button[type="submit"][value="mini"]'),
          }));
        }
        const feedbacks = Array.from(form.querySelectorAll('[data-repair-feedback-for]'));
        for (const feedback of feedbacks) {
          const text = feedback.textContent?.replace(/\s+/g, ' ').trim() || '';
          if (!/^Correct\./i.test(text)) {
            failures.push(`${feedback.getAttribute('data-repair-feedback-for') || 'repair input'}: ${text || 'no feedback'}`);
          }
        }
      }
      return { submittedAnswers, failures };
    });
    return {
      ok: repairResult.failures.length === 0,
      message: repairResult.failures.length
        ? `submitted ${repairResult.submittedAnswers} repair answers; failures: ${repairResult.failures.join('; ')}`
        : `submitted ${repairResult.submittedAnswers} repair answers across ${counts.repair} module form(s); all feedback correct`,
    };
  }
  return undefined;
}

async function answerSpecAudit(page) {
  return page.evaluate(() => {
    const hooks = window.__ASTERION_SKILL_CHECK_TEST_HOOKS__;
    const elements = Array.from(document.querySelectorAll('[data-answer-type][data-accepted-answers]'));
    const seen = new Set();
    const failures = [];
    let formSubmissions = 0;

    const fillGeneratedForm = (form, answer) => {
      const textInputs = Array.from(form.querySelectorAll('input[name="submittedAnswer"][type="text"]'));
      if (textInputs.length) {
        const cleaned = String(answer)
          .replace(/^[([{<⟨]\s*/, '')
          .replace(/\s*[)\]}>⟩]$/, '');
        const parts = textInputs.length > 1 ? cleaned.split(/\s*,\s*/) : [String(answer)];
        textInputs.forEach((input, index) => {
          input.value = parts[index] ?? String(answer);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        return true;
      }
      const acceptedValues = String(answer).split(/\s*,\s*/).filter(Boolean);
      const selects = Array.from(form.querySelectorAll('select[name="submittedAnswer"]'));
      if (selects.length) {
        selects.forEach((select, index) => {
          select.value = acceptedValues[index] || '';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });
        return true;
      }
      const checkboxes = Array.from(form.querySelectorAll('input[name="submittedAnswer"][type="checkbox"]'));
      if (checkboxes.length) {
        checkboxes.forEach((input) => {
          input.checked = acceptedValues.includes(input.value);
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        return true;
      }
      const radios = Array.from(form.querySelectorAll('input[name="submittedAnswer"][type="radio"]'));
      if (radios.length) {
        const target = radios.find((input) => acceptedValues.includes(input.value)) || radios[0];
        target.checked = true;
        target.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    };

    let count = 0;
    for (const element of elements) {
      const spec = {
        answerType: element.getAttribute('data-answer-type') || 'exact-text',
        acceptedAnswers: JSON.parse(element.getAttribute('data-accepted-answers') || '[]'),
        tolerance: Number(element.getAttribute('data-tolerance') || '') || undefined,
        orderMatters: element.getAttribute('data-order-matters') === 'true',
      };
      const id = [
        element.getAttribute('data-check-id'),
        element.getAttribute('data-question-title'),
        element.getAttribute('name'),
        spec.answerType,
        spec.acceptedAnswers.join('|'),
      ].filter(Boolean).join('::');
      if (seen.has(id)) continue;
      seen.add(id);
      count += 1;
      const accepted = spec.acceptedAnswers[0] || '';
      const wrong = spec.answerType === 'numeric' ? '987654321' : '__definitely_wrong__';
      const correctResult = hooks.checkSubmittedSkillAnswer(spec, accepted);
      const wrongResult = hooks.checkSubmittedSkillAnswer(spec, wrong);
      const label = element.getAttribute('data-question-title')
        || element.getAttribute('aria-label')
        || element.closest('article, section, form')?.querySelector('h2, h3, h4')?.textContent?.replace(/\s+/g, ' ').trim()
        || id;
      if (!correctResult.isCorrect || correctResult.unsupported) {
        failures.push(`${label}: correct answer rejected (${correctResult.reason})`);
      }
      if (wrongResult.isCorrect) {
        failures.push(`${label}: deliberately wrong answer accepted`);
      }
      if (element instanceof HTMLFormElement && element.matches('[data-check-learn-answer], [data-check-skill-answer]')) {
        const filled = fillGeneratedForm(element, accepted);
        if (!filled) {
          failures.push(`${label}: generated form could not be filled with accepted answer`);
        } else {
          element.dispatchEvent(new SubmitEvent('submit', {
            bubbles: true,
            cancelable: true,
            submitter: element.querySelector('button[type="submit"]'),
          }));
          formSubmissions += 1;
          const feedback = element.querySelector('.skill-check-feedback')?.textContent?.replace(/\s+/g, ' ').trim() || '';
          if (!/^Correct\b/i.test(feedback)) {
            failures.push(`${label}: generated form submit did not produce correct feedback (${feedback || 'no feedback'})`);
          }
        }
      }
    }
    return { count, failures, formSubmissions };
  });
}

async function main() {
  const manifest = JSON.parse(await readFile(path.join(docsRoot, 'static-pages.json'), 'utf8'));
  if (!existsSync(docsRoot)) throw new Error('docs/ does not exist. Run npm run build first.');
  await mkdir(screenshotRoot, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 }, deviceScaleFactor: 1 });
  const records = [];

  try {
    for (const [index, pageInfo] of manifest.pages.entries()) {
      await page.goto(pageUrl(pageInfo.path), { waitUntil: 'load' });
      await waitForStatic(page);
      await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
      const pageShot = await capture(page, pageInfo.path, 'page');
      const specAudit = await answerSpecAudit(page);
      const visibleInteraction = await exerciseVisibleSurface(page, pageInfo.path);
      const afterShot = visibleInteraction ? await capture(page, pageInfo.path, 'after-interaction') : undefined;
      const nextPage = manifest.pages[index + 1]?.path;
      records.push({
        index: index + 1,
        path: pageInfo.path,
        label: pageInfo.label,
        actionSummary: nextPage ? `Visited page, checked deterministic answers, then continued toward \`${nextPage}\`.` : 'Visited final page and checked deterministic answers.',
        answerSpecCount: specAudit.count,
        generatedFormSubmissions: specAudit.formSubmissions,
        answerSpecFailures: specAudit.failures,
        visibleInteraction,
        screenshots: { page: pageShot, after: afterShot },
        notes: specAudit.failures,
      });
    }
  } finally {
    await page.close();
    await browser.close();
  }

  const totals = {
    pages: records.length,
    answerSpecs: records.reduce((sum, record) => sum + record.answerSpecCount, 0),
    generatedFormSubmissions: records.reduce((sum, record) => sum + record.generatedFormSubmissions, 0),
    answerFailures: records.reduce((sum, record) => sum + record.answerSpecFailures.length, 0),
    visibleInteractions: records.filter((record) => record.visibleInteraction).length,
    visibleInteractionFailures: records.filter((record) => record.visibleInteraction && !record.visibleInteraction.ok).length,
    screenshots: records.reduce((sum, record) => sum + Object.values(record.screenshots).filter(Boolean).length, 0),
  };

  const manifestOut = { generatedAt: '2026-07-09', totals, records };
  await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifestOut, null, 2)}\n`);
  await writeFile(path.join(outputRoot, 'report.md'), renderReport(records, totals));

  if (totals.answerFailures || totals.visibleInteractionFailures) {
    console.error(`Student path walkthrough found failures. Report: ${path.join(outputRoot, 'report.md')}`);
    process.exit(1);
  }
  console.log(`Student path walkthrough passed. Report: ${path.join(outputRoot, 'report.md')}`);
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
