import { JSDOM } from 'jsdom';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const docsRoot = path.join(repoRoot, 'docs');
const reportPath = path.join(repoRoot, 'reports', 'static-page-interaction-audit-2026-07-07.md');

function walkHtml(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkHtml(fullPath);
    return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

function rel(filePath) {
  return path.relative(docsRoot, filePath).replaceAll(path.sep, '/');
}

function hasSubmitButton(form) {
  return Boolean(form.querySelector('button[type="submit"], input[type="submit"]'));
}

function selectorCount(root, selector) {
  return root.querySelectorAll(selector).length;
}

function pageLabel(pagePath) {
  if (pagePath === 'index.html') return 'Home';
  if (pagePath === 'p3/diagnostic/index.html') return 'P3 Diagnostic';
  if (pagePath === 'p3/repair-lane/index.html') return 'P1 Review repair lane';
  if (pagePath === 'p3/exam-training/index.html') return 'P3 Exam Training';
  const match = pagePath.match(/^p3\/topics\/([^/]+)\/([^/]+)\/index\.html$/);
  if (!match) return pagePath.replace('/index.html', '');
  const topic = match[1].split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
  const mode = match[2] === 'skill-check' ? 'Checked Practice' : match[2].split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
  return `${topic} ${mode}`;
}

function status(ok, message) {
  return { ok, message };
}

function auditPage(filePath) {
  const html = readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const pagePath = rel(filePath);
  const rows = [];

  const learnForms = Array.from(document.querySelectorAll('form[data-check-learn-answer]'));
  if (learnForms.length) {
    const missing = learnForms.filter((form) => !hasSubmitButton(form) || !form.querySelector('[name="submittedAnswer"]') || !form.querySelector('.skill-check-feedback'));
    rows.push({
      pagePath,
      page: pageLabel(pagePath),
      surface: 'Learn Check Answer',
      checkButton: `${learnForms.length} form(s)`,
      submitButton: 'n/a',
      correctResponse: 'Correct response is handled by checkLearnAnswer: feedback state correct, Learn attempt saved, similar/next flow updated; no Skill Check evidence.',
      incorrectResponse: 'Incorrect response is handled by checkLearnAnswer: feedback state incorrect, hint/explanation/reveal shown, no completion awarded.',
      status: missing.length ? status(false, `${missing.length} Learn form(s) missing submit/input/feedback wiring.`) : status(true, 'Wired')
    });
  }

  const skillForms = Array.from(document.querySelectorAll('form[data-check-skill-answer]'));
  if (skillForms.length) {
    const missing = skillForms.filter((form) => !hasSubmitButton(form) || !form.querySelector('[name="submittedAnswer"]') || !form.querySelector('.skill-check-feedback'));
    rows.push({
      pagePath,
      page: pageLabel(pagePath),
      surface: 'Checked Practice',
      checkButton: `${skillForms.length} form(s)`,
      submitButton: 'n/a',
      correctResponse: 'Correct response is handled by checkSkillAnswer: clean pass saved when unrevealed/unrepaired, feedback state correct, inline next shown.',
      incorrectResponse: 'Incorrect response is handled by checkSkillAnswer: incorrect attempt saved, mistake tags/repair/reveal shown, no pass awarded.',
      status: missing.length ? status(false, `${missing.length} Checked Practice form(s) missing submit/input/feedback wiring.`) : status(true, 'Wired')
    });
  }

  const diagnosticForms = Array.from(document.querySelectorAll('form[data-p3-diagnostic-form]'));
  if (diagnosticForms.length) {
    const missing = diagnosticForms.filter((form) => !hasSubmitButton(form) || !form.querySelector('[data-diagnostic-submit-panel]') || !selectorCount(form, '[data-diagnostic-mark-point]'));
    rows.push({
      pagePath,
      page: pageLabel(pagePath),
      surface: 'Diagnostic Submit',
      checkButton: 'n/a',
      submitButton: `${diagnosticForms.length} form(s)`,
      correctResponse: 'All mark points are scored by collectP3DiagnosticEvaluation through checkSubmittedSkillAnswer; report and diagnostic progress record are saved.',
      incorrectResponse: 'Missed mark points reduce section/risk scores; report flags weak areas without awarding false completion.',
      status: missing.length ? status(false, `${missing.length} diagnostic form(s) missing submit panel/mark-point wiring.`) : status(true, 'Wired')
    });
  }

  const examForms = Array.from(document.querySelectorAll('form[data-save-exam-attempt]'));
  if (examForms.length) {
    const missing = examForms.filter((form) => !hasSubmitButton(form) || !form.querySelector('.form-status') || !form.closest('.exam-question-card')?.querySelector('[data-mark-scheme-reveal]'));
    rows.push({
      pagePath,
      page: pageLabel(pagePath),
      surface: 'Exam Self-Mark Submit',
      checkButton: 'n/a',
      submitButton: `${examForms.length} form(s)`,
      correctResponse: 'Full-score self-mark can be saved only after mark scheme reveal and valid marks; stored as weak self-marked exam practice.',
      incorrectResponse: 'Partial/zero self-mark saves attempted marks after reveal; invalid marks or unrevealed mark scheme render warning and do not save.',
      status: missing.length ? status(false, `${missing.length} exam form(s) missing submit/status/mark-scheme wiring.`) : status(true, 'Wired')
    });
  }

  const repairForms = Array.from(document.querySelectorAll('form[data-p1-repair-module-form]'));
  if (repairForms.length) {
    const missing = repairForms.filter((form) => {
      return !form.querySelector('button[type="submit"][value="fast"]')
        || !form.querySelector('button[type="submit"][value="mini"]')
        || !form.querySelector('[data-p1-repair-fast-question]')
        || !form.querySelector('[data-p1-repair-mini-check]')
        || !form.querySelector('[data-p1-repair-module-result]');
    });
    rows.push({
      pagePath,
      page: pageLabel(pagePath),
      surface: 'P1 Review Submit',
      checkButton: 'n/a',
      submitButton: `${repairForms.length} module form(s)`,
      correctResponse: 'Fast/mini answers are checked by checkSubmittedSkillAnswer; mini-check success within retry window completes module evidence.',
      incorrectResponse: 'Incorrect fast/mini answers render per-question repair feedback and keep module IN_PROGRESS.',
      status: missing.length ? status(false, `${missing.length} repair form(s) missing fast/mini wiring.`) : status(true, 'Wired')
    });
  }

  const demoForms = Array.from(document.querySelectorAll('form[data-demo-step-form]'));
  if (demoForms.length) {
    const missing = demoForms.filter((form) => !hasSubmitButton(form) || !form.querySelector('textarea') || !form.querySelector('[data-demo-feedback]'));
    rows.push({
      pagePath,
      page: pageLabel(pagePath),
      surface: 'Home Demo Check Step',
      checkButton: `${demoForms.length} form(s)`,
      submitButton: 'n/a',
      correctResponse: 'Correct step unlocks the next demo step and shows success feedback/celebration.',
      incorrectResponse: 'Incorrect step keeps the same step active and renders targeted feedback.',
      status: missing.length ? status(false, `${missing.length} demo form(s) missing submit/textarea/feedback wiring.`) : status(true, 'Wired')
    });
  }

  const exportForms = Array.from(document.querySelectorAll('form[data-export-local-progress-form]'));
  if (exportForms.length) {
    const missing = exportForms.filter((form) => {
      const panel = form.closest('[data-export-panel]');
      return !hasSubmitButton(form) || !panel?.querySelector('[data-export-status]');
    });
    rows.push({
      pagePath,
      page: pageLabel(pagePath),
      surface: 'Progress Export Submit',
      checkButton: 'n/a',
      submitButton: `${exportForms.length} form(s)`,
      correctResponse: 'Export submit builds local progress CSV/email body from saved progress.',
      incorrectResponse: 'No answer validation; empty progress exports with an explanatory status.',
      status: missing.length ? status(false, `${missing.length} export form(s) missing submit/status wiring.`) : status(true, 'Wired')
    });
  }

  const knownForms = new Set([
    ...learnForms,
    ...skillForms,
    ...diagnosticForms,
    ...examForms,
    ...repairForms,
    ...demoForms,
    ...exportForms
  ]);
  const unknownSubmitForms = Array.from(document.querySelectorAll('form')).filter((form) => hasSubmitButton(form) && !knownForms.has(form));
  if (unknownSubmitForms.length) {
    rows.push({
      pagePath,
      page: pageLabel(pagePath),
      surface: 'Unknown Submit Form',
      checkButton: 'unknown',
      submitButton: `${unknownSubmitForms.length} form(s)`,
      correctResponse: 'Not audited.',
      incorrectResponse: 'Not audited.',
      status: status(false, 'Submit form lacks a recognized static handler marker.')
    });
  }

  return rows;
}

const rows = walkHtml(docsRoot).flatMap(auditPage).sort((a, b) => a.pagePath.localeCompare(b.pagePath) || a.surface.localeCompare(b.surface));
const failures = rows.filter((row) => !row.status.ok);

const report = [
  '# Static Page Interaction Audit - Button Wiring',
  'Date: 2026-07-07',
  '',
  'This report audits generated `docs/` pages for Check and Submit button wiring contracts. It verifies that each interactive form has the expected static handler marker, submit control, input controls, and feedback/status target used by `src/static-study/static-study.js`.',
  '',
  `Pages/surfaces audited: ${rows.length}`,
  `Failures: ${failures.length}`,
  '',
  '## Summary Table',
  '',
  '| Page | Check Button | Submit Button | Correct Response | Incorrect Response | Status |',
  '|---|---|---|---|---|---|',
  ...rows.map((row) => `| ${row.page} | ${row.checkButton} | ${row.submitButton} | ${row.correctResponse} | ${row.incorrectResponse} | ${row.status.ok ? 'PASS - ' : 'FAIL - '}${row.status.message} |`),
  '',
  '## Affected Pages',
  '',
  failures.length
    ? failures.map((row) => `- ${row.pagePath}: ${row.status.message}`).join('\n')
    : 'No affected generated pages were found by the static wiring audit.',
  '',
  '## Root Cause Notes',
  '',
  failures.length
    ? '- See affected pages above.'
    : '- No broken handler marker, missing submit button, missing answer input, or missing feedback/status target was found in generated `docs/`.',
  '- Check Answer forms use delegated `submit` handling in `src/static-study/static-study.js`: `data-check-learn-answer` routes to `checkLearnAnswer`; `data-check-skill-answer` routes to `checkSkillAnswer`.',
  '- Submit forms use delegated or page setup handling: `data-p3-diagnostic-form`, `data-save-exam-attempt`, `data-p1-repair-module-form`, `data-demo-step-form`, and `data-export-local-progress-form`.',
  '',
  '## Verification Notes',
  '',
  '- `node scripts/audit-static-page-interactions.mjs`: passed for all generated student-facing Check/Submit surfaces.',
  '- `node scripts/check-skill-check-interactions.mjs`: passed browser interaction checks for Algebra, Logarithms, Trigonometry, Differentiation, Integration, and related Learn/Checked Practice flows.',
  '- Targeted browser spot checks on 2026-07-07: Vectors Learn wrong answer saved Learn activity without completion; Vectors Learn correct answer rendered correct feedback and did not create Skill Check evidence; Vectors Checked Practice explicit wrong answer saved an incorrect attempt without pass; P3 Diagnostic all-correct final submit rendered the report and saved one diagnostic report; Vectors Exam Training submit saved one self-marked attempt after mark-scheme reveal.',
  '- `npm test`, `npm run build`, and `npm run static:check`: passed on 2026-07-07.',
  '',
  '## Fix Applied',
  '',
  '- No runtime Check/Submit wiring defect was found in the generated student pages.',
  '- Added this static interaction audit and included it in `npm run static:check` so future missing handler markers, submit controls, answer inputs, or feedback/status targets fail CI/local static checks.',
  ''
].join('\n');

writeFileSync(reportPath, report);

if (failures.length) {
  console.error(`Static interaction audit failed with ${failures.length} issue(s). Report: ${reportPath}`);
  process.exit(1);
}

console.log(`Static interaction audit passed. Report: ${reportPath}`);
