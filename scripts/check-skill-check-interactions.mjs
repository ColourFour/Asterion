import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');
const storageKey = 'asterion.progress.v1';

const skillPagePath = 'p3/topics/logarithmic-and-exponential-functions/skill-check/index.html';
const complexSkillPagePath = 'p3/topics/complex-numbers/skill-check/index.html';
const reviewPagePath = 'p3/review/index.html';
const checkId = 'sc-log-graph-foundation-001';
const regionId = 'logarithmic-and-exponential-functions';
const complexRegionId = 'complex-numbers';
const logRequiredCheckCount = 18;

const logChecks = [
  {
    checkId: 'sc-log-graph-foundation-001',
    answerType: 'expression-text',
    correctAnswer: '2^5=32',
  },
  {
    checkId: 'sc-log-graph-core-001',
    answerType: 'coordinate',
    correctAnswer: '(8,3)',
  },
  {
    checkId: 'sc-log-graph-challenge-001',
    answerType: 'multi-value',
    correctAnswer: 'domain x>0, range all real y',
  },
  {
    checkId: 'sc-log-laws-foundation-001',
    answerType: 'multi-value',
    correctAnswer: 'ln(5x), ln(x*5)',
  },
  {
    checkId: 'sc-log-laws-core-001',
    answerType: 'multi-value',
    correctAnswer: '2lnx=ln(x^2), ln(x^2)-ln(x+1)=ln(x^2/(x+1))',
  },
  {
    checkId: 'sc-log-laws-challenge-001',
    answerType: 'exact-text',
    correctAnswer: 'log laws split products not sums',
  },
  {
    checkId: 'sc-log-natural-foundation-001',
    answerType: 'expression-text',
    correctAnswer: '1/2ln7',
  },
  {
    checkId: 'sc-log-natural-core-001',
    answerType: 'expression-text',
    correctAnswer: '1/3ln4',
  },
  {
    checkId: 'sc-log-natural-challenge-001',
    answerType: 'multi-value',
    correctAnswer: 'divide by 2, take natural logs, subtract 1',
  },
  {
    checkId: 'sc-log-domain-foundation-001',
    answerType: 'expression-text',
    correctAnswer: 'x>2',
  },
  {
    checkId: 'sc-log-domain-core-001',
    answerType: 'numeric',
    correctAnswer: '6',
  },
  {
    checkId: 'sc-log-domain-challenge-001',
    answerType: 'multi-value',
    correctAnswer: 'domain, combine, solve, reject',
  },
  {
    checkId: 'sc-log-exponential-foundation-001',
    answerType: 'expression-text',
    correctAnswer: 'x>3',
  },
  {
    checkId: 'sc-log-exponential-core-001',
    answerType: 'expression-text',
    correctAnswer: 'x>=3',
  },
  {
    checkId: 'sc-log-exponential-challenge-001',
    answerType: 'expression-text',
    correctAnswer: 'x<ln4/2',
  },
  {
    checkId: 'sc-log-linearisation-foundation-001',
    answerType: 'multi-value',
    correctAnswer: 'take logs, split product, simplify exponential, read line',
  },
  {
    checkId: 'sc-log-linearisation-core-001',
    answerType: 'coordinate',
    correctAnswer: '(3,2)',
  },
  {
    checkId: 'sc-log-linearisation-challenge-001',
    answerType: 'multi-value',
    correctAnswer: 'take logs, split product, simplify exponential, read line',
  },
];

const complexChecks = [
  {
    checkId: 'sc-complex-cartesian-conjugate-foundation-001',
    answerType: 'complex-number',
    correctAnswer: '3+4i',
  },
  {
    checkId: 'sc-complex-cartesian-conjugate-core-001',
    answerType: 'numeric',
    correctAnswer: '5',
  },
  {
    checkId: 'sc-complex-cartesian-conjugate-challenge-001',
    answerType: 'numeric',
    correctAnswer: '3',
  },
  {
    checkId: 'sc-complex-modulus-argument-foundation-001',
    answerType: 'numeric',
    correctAnswer: '5',
  },
  {
    checkId: 'sc-complex-modulus-argument-core-001',
    answerType: 'expression-text',
    correctAnswer: '3pi/4',
  },
  {
    checkId: 'sc-complex-modulus-argument-challenge-001',
    answerType: 'expression-text',
    correctAnswer: 'sqrt3+i',
  },
  {
    checkId: 'sc-complex-locus-foundation-001',
    answerType: 'exact-text',
    correctAnswer: 'circle with centre 2+0i and radius 3',
  },
  {
    checkId: 'sc-complex-locus-core-001',
    answerType: 'exact-text',
    correctAnswer: 'x=-1',
  },
  {
    checkId: 'sc-complex-locus-challenge-001',
    answerType: 'exact-text',
    correctAnswer: 'half-line from 1+0i at angle pi/4 excluding 1+0i',
  },
  {
    checkId: 'sc-complex-roots-foundation-001',
    answerType: 'numeric',
    correctAnswer: '3',
  },
  {
    checkId: 'sc-complex-roots-core-001',
    answerType: 'expression-text',
    correctAnswer: '2pi/3',
  },
  {
    checkId: 'sc-complex-roots-challenge-001',
    answerType: 'multi-value',
    correctAnswer: '-2i, 2i',
  },
];

const representativeComplexChecks = [
  'sc-complex-cartesian-conjugate-foundation-001',
  'sc-complex-cartesian-conjugate-core-001',
  'sc-complex-modulus-argument-core-001',
  'sc-complex-locus-core-001',
  'sc-complex-roots-challenge-001',
];

const representativeLogChecks = [
  'sc-log-graph-foundation-001',
  'sc-log-graph-core-001',
  'sc-log-laws-foundation-001',
  'sc-log-laws-challenge-001',
  'sc-log-domain-core-001',
];

function pageUrl(pagePath) {
  return pathToFileURL(path.join(siteRoot, pagePath)).href;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function progressWithAttempts(skillCheckAttempts = []) {
  return {
    schemaVersion: 1,
    attempts: [],
    learningActivityAttempts: [],
    skillCheckAttempts,
    topicProfiles: {},
    issueReports: [],
    regionLearning: {},
    settings: { activePaperFamily: 'p3' },
  };
}

async function waitForStaticEnhancement(page, pagePath) {
  await page.goto(pageUrl(pagePath), { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
}

async function readProgress(page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, storageKey);
}

async function writeProgress(page, progress) {
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    { key: storageKey, value: progress },
  );
}

async function clearProgress(page) {
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
}

function skillAttempts(progress) {
  return Array.isArray(progress?.skillCheckAttempts) ? progress.skillCheckAttempts : [];
}

function latestAttempt(progress) {
  const attempts = skillAttempts(progress);
  return attempts[attempts.length - 1];
}

async function firstCheckForm(page) {
  const form = page.locator(`[data-check-id="${checkId}"]`);
  await form.waitFor({ state: 'visible' });
  return form;
}

async function progressText(page) {
  return page.locator(`[data-progress-skill="${regionId}"]`).textContent();
}

function logProgressLabel(passedCount) {
  return `Skill Check: ${passedCount}/${logRequiredCheckCount} passed`;
}

async function complexProgressText(page) {
  return page.locator(`[data-progress-skill="${complexRegionId}"]`).textContent();
}

async function submitAnswer(form, answer) {
  await form.locator('input[name="submittedAnswer"]').fill(answer);
  await form.locator('button[type="submit"]').click();
}

async function visibleText(locator) {
  return (await locator.textContent())?.replace(/\s+/g, ' ').trim() || '';
}

async function revealFormCard(page, targetCheckId) {
  await page.evaluate((id) => {
    const form = document.querySelector(`[data-check-id="${id}"]`);
    const targetCard = form?.closest?.('.practice-card');
    if (!(targetCard instanceof HTMLElement)) return;
    document.querySelectorAll('.practice-card').forEach((card) => {
      if (card instanceof HTMLElement) card.hidden = card !== targetCard;
    });
    document.querySelectorAll('.practice-topic, .practice-subsection, .practice-card-stack').forEach((container) => {
      if (container instanceof HTMLElement) container.hidden = !container.contains(targetCard);
    });
    targetCard.scrollIntoView({ block: 'center' });
  }, targetCheckId);
}

async function visibleFormForCheck(page, targetCheckId) {
  await revealFormCard(page, targetCheckId);
  const form = page.locator(`[data-check-id="${targetCheckId}"]`);
  await form.waitFor({ state: 'visible' });
  return form;
}

function attemptForCheck(progress, targetCheckId, attemptId) {
  const attempts = skillAttempts(progress).filter((attempt) => attempt.checkId === targetCheckId);
  return attemptId ? attempts.find((attempt) => attempt.attemptId === attemptId) : attempts[attempts.length - 1];
}

async function checkSkillPageFlow(page) {
  await waitForStaticEnhancement(page, skillPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  let form = await firstCheckForm(page);
  const inputCount = await form.locator('input[name="submittedAnswer"]').count();
  const initialSubmitText = await visibleText(form.locator('button[type="submit"]'));
  assert(inputCount === 1, 'Checkable P3 Skill Check page must render a submitted-answer input.');
  assert(initialSubmitText === 'Check answer', `Dominant action before submission must be "Check answer"; saw "${initialSubmitText}".`);

  await submitAnswer(form, '2^32=5');

  let progress = await readProgress(page);
  let attempt = latestAttempt(progress);
  assert(attempt?.checkId === checkId, 'Wrong answer must save a local attempt for the submitted check.');
  assert(attempt.submittedAnswer === '2^32=5', 'Wrong answer attempt must store the submitted answer.');
  assert(attempt.isCorrect === false, 'Wrong answer attempt must store isCorrect: false.');
  assert(attempt.revealedAnswer === false, 'Wrong answer attempt must start with revealedAnswer: false.');
  assert(attempt.revealedRepairStep === false, 'Wrong answer attempt must start with revealedRepairStep: false.');
  assert((await progressText(page))?.includes(logProgressLabel(0)), 'Wrong answer must not mark the Skill Check passed.');
  assert((await visibleText(form.locator('button[type="submit"]'))) === 'Try again', 'Wrong answer flow must show Try again as the dominant action.');
  assert(await form.locator('[data-mistake-tag-panel]').isVisible(), 'Wrong answer flow must expose mistake tag selection.');
  assert(await form.locator('[data-skill-repair]').isVisible(), 'Wrong answer flow must expose Show repair step.');

  await form.locator('input[name="mistakeTags"][value="notation"]').check();
  progress = await readProgress(page);
  attempt = latestAttempt(progress);
  assert(attempt.mistakeTags.includes('notation'), 'Selecting a mistake tag must patch the latest wrong attempt.');
  assert((await visibleText(form.locator('[data-targeted-prompt]'))).includes('My notation stopped'), 'Mistake tag selection must show the targeted prompt.');

  await form.locator('[data-skill-repair] summary').click();
  await page.waitForFunction(
    ({ key, id }) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      const attempts = Array.isArray(progress.skillCheckAttempts) ? progress.skillCheckAttempts : [];
      const latest = attempts[attempts.length - 1];
      return latest?.checkId === id && latest.revealedRepairStep === true;
    },
    { key: storageKey, id: checkId },
  );
  progress = await readProgress(page);
  attempt = latestAttempt(progress);
  assert(attempt.isCorrect === false, 'Repair reveal record must not be correct.');
  assert(attempt.revealedRepairStep === true, 'Show repair step must store revealedRepairStep: true.');
  assert(attempt.mistakeTags.includes('notation'), 'Repair reveal record must preserve selected mistake tags.');
  assert((await progressText(page))?.includes(logProgressLabel(0)), 'Repair reveal must not mark the check passed.');

  await form.locator('[data-skill-answer-reveal] summary').click();
  await page.waitForFunction(
    ({ key, id }) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      const attempts = Array.isArray(progress.skillCheckAttempts) ? progress.skillCheckAttempts : [];
      const latest = attempts[attempts.length - 1];
      return latest?.checkId === id && latest.revealedAnswer === true;
    },
    { key: storageKey, id: checkId },
  );
  progress = await readProgress(page);
  attempt = latestAttempt(progress);
  assert(attempt.isCorrect === false, 'Answer reveal record must not be correct.');
  assert(attempt.revealedAnswer === true, 'Show answer must store revealedAnswer: true.');
  assert((await progressText(page))?.includes(logProgressLabel(0)), 'Answer reveal must not mark the check passed.');

  await submitAnswer(form, '2^5=32');
  progress = await readProgress(page);
  attempt = latestAttempt(progress);
  assert(attempt.isCorrect === true, 'A correct answer after repair should still be evaluated as correct.');
  assert(attempt.revealedAnswer === true, 'A correct answer after reveal must keep revealedAnswer: true.');
  assert(attempt.revealedRepairStep === true, 'A correct answer after repair must keep revealedRepairStep: true.');
  assert((await progressText(page))?.includes(logProgressLabel(0)), 'A repaired or revealed correct answer must not count as passed.');

  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
  form = await firstCheckForm(page);
  assert((await progressText(page))?.includes(logProgressLabel(0)), 'Reload must preserve repaired attempts without converting them to pass.');

  await form.locator('[data-show-skill-hint]').click();
  await submitAnswer(form, '2^5=32');
  progress = await readProgress(page);
  attempt = latestAttempt(progress);
  assert(attempt.isCorrect === true, 'Clean correct answer must save isCorrect: true.');
  assert(attempt.revealedAnswer === false, 'Clean correct answer must save revealedAnswer: false.');
  assert(attempt.revealedRepairStep === false, 'Clean correct answer must save revealedRepairStep: false.');
  assert(attempt.usedHint === true, 'Hint use must be recorded as usedHint: true.');
  assert((await progressText(page))?.includes(logProgressLabel(1)), 'Clean correct answer must count as passed.');

  const savedAttemptCount = skillAttempts(progress).length;
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
  progress = await readProgress(page);
  assert(skillAttempts(progress).length === savedAttemptCount, 'Reloading must preserve saved Skill Check attempts in localStorage.');
  assert((await progressText(page))?.includes(logProgressLabel(1)), 'Reloading must preserve deterministic pass progress from localStorage.');
}

async function checkLegacyAndMalformedProgressFailClosed(page) {
  await waitForStaticEnhancement(page, skillPagePath);
  await writeProgress(page, {
    schemaVersion: 1,
    attempts: [],
    learningActivityAttempts: [
      {
        activityId: checkId,
        outcome: 'got_it',
        completedAt: '2026-06-11T00:00:00.000Z',
      },
    ],
    skillCheckAttempts: [
      {
        checkId,
        regionId,
        isCorrect: true,
        outcome: 'got_it',
      },
    ],
    topicProfiles: {},
    issueReports: [],
    regionLearning: {},
    settings: { activePaperFamily: 'p3' },
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  assert((await progressText(page))?.includes(logProgressLabel(0)), 'Legacy or malformed localStorage records must not mark Skill Checks passed.');
  assert(await firstCheckForm(page), 'Malformed localStorage records must not crash the generated Skill Check page.');

  await page.evaluate((key) => window.localStorage.setItem(key, '{not json'), storageKey);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
  assert((await progressText(page))?.includes(logProgressLabel(0)), 'Malformed JSON localStorage must fail closed to an empty Skill Check state.');
}

async function checkLogExpFullTopicPage(page) {
  await waitForStaticEnhancement(page, skillPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  const pageShape = await page.evaluate((expectedIds) => {
    const forms = Array.from(document.querySelectorAll('[data-check-skill-answer]'));
    return {
      formIds: forms.map((form) => form.getAttribute('data-check-id')),
      hasFakeSaveButton: Boolean(document.querySelector('[data-save-skill-check]')),
      hasTriedCopy: (document.body.textContent || '').includes('I tried this'),
      missingInputs: expectedIds.filter((id) => !document.querySelector(`[data-check-id="${id}"] input[name="submittedAnswer"]`)),
      missingSubmitButtons: expectedIds.filter((id) => {
        const button = document.querySelector(`[data-check-id="${id}"] button[type="submit"]`);
        return !button || button.textContent?.replace(/\s+/g, ' ').trim() !== 'Check answer';
      }),
      answerTypes: expectedIds.map((id) => document.querySelector(`[data-check-id="${id}"]`)?.getAttribute('data-answer-type')),
    };
  }, logChecks.map((item) => item.checkId));

  assert(pageShape.formIds.length === logChecks.length, `Log/Exp must render ${logChecks.length} checkable forms; saw ${pageShape.formIds.length}.`);
  assert(logChecks.every((item) => pageShape.formIds.includes(item.checkId)), 'Log/Exp page must render every migrated checkable form.');
  assert(!pageShape.hasFakeSaveButton, 'Log/Exp page must not render data-save-skill-check fake completion controls.');
  assert(!pageShape.hasTriedCopy, 'Log/Exp page must not render I tried this fake completion copy.');
  assert(pageShape.missingInputs.length === 0, `Log/Exp checks missing answer inputs: ${pageShape.missingInputs.join(', ')}`);
  assert(pageShape.missingSubmitButtons.length === 0, `Log/Exp checks missing Check answer buttons: ${pageShape.missingSubmitButtons.join(', ')}`);
  assert(new Set(pageShape.answerTypes).size >= 5, 'Log/Exp browser coverage must include all migrated answer type families.');

  for (const item of logChecks) {
    const form = await visibleFormForCheck(page, item.checkId);
    await submitAnswer(form, 'definitely wrong');
    const progress = await readProgress(page);
    const attempt = latestAttempt(progress);
    assert(attempt?.checkId === item.checkId, `Wrong answer must save a local attempt for ${item.checkId}.`);
    assert(attempt.isCorrect === false, `Wrong answer must not be correct for ${item.checkId}.`);
    assert(attempt.revealedAnswer === false, `Wrong answer must not set revealedAnswer for ${item.checkId}.`);
    assert(attempt.revealedRepairStep === false, `Wrong answer must not set revealedRepairStep for ${item.checkId}.`);
    assert((await progressText(page))?.includes(logProgressLabel(0)), `Wrong answer must not update Log/Exp pass progress for ${item.checkId}.`);
  }
}

async function checkLogExpRepresentativeAnswerTypes(page) {
  await waitForStaticEnhancement(page, skillPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  for (const item of logChecks.filter((entry) => representativeLogChecks.includes(entry.checkId))) {
    const form = await visibleFormForCheck(page, item.checkId);
    await submitAnswer(form, item.correctAnswer);
    const progress = await readProgress(page);
    const attempt = latestAttempt(progress);
    assert(attempt?.checkId === item.checkId, `Correct ${item.answerType} answer must save an attempt for ${item.checkId}.`);
    assert(attempt.isCorrect === true, `Correct ${item.answerType} answer must be correct for ${item.checkId}.`);
    assert(attempt.revealedAnswer === false, `Clean ${item.answerType} answer must not be revealed for ${item.checkId}.`);
    assert(attempt.revealedRepairStep === false, `Clean ${item.answerType} answer must not be repaired for ${item.checkId}.`);
  }

  const partialText = await progressText(page);
  assert(partialText?.includes(logProgressLabel(5)), `Partial representative correct answers must not complete Log/Exp; saw "${partialText}".`);
  const progressNodeClass = await page.locator(`[data-progress-skill="${regionId}"]`).getAttribute('class');
  assert(!String(progressNodeClass || '').includes('is-complete'), 'Log/Exp topic must not be marked complete after partial correct attempts.');
}

async function checkLogExpRevealRepairCannotPass(page) {
  await waitForStaticEnhancement(page, skillPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  const first = logChecks[0];
  const form = await visibleFormForCheck(page, first.checkId);
  await submitAnswer(form, '2^32=5');
  await form.locator('input[name="mistakeTags"][value="notation"]').check();
  await form.locator('[data-skill-repair] summary').click();
  await page.waitForFunction(
    ({ key, id }) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      const attempts = Array.isArray(progress.skillCheckAttempts) ? progress.skillCheckAttempts : [];
      const latest = attempts[attempts.length - 1];
      return latest?.checkId === id && latest.revealedRepairStep === true;
    },
    { key: storageKey, id: first.checkId },
  );
  await form.locator('[data-skill-answer-reveal] summary').click();
  await page.waitForFunction(
    ({ key, id }) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      const attempts = Array.isArray(progress.skillCheckAttempts) ? progress.skillCheckAttempts : [];
      const latest = attempts[attempts.length - 1];
      return latest?.checkId === id && latest.revealedAnswer === true;
    },
    { key: storageKey, id: first.checkId },
  );
  await submitAnswer(form, first.correctAnswer);
  const progress = await readProgress(page);
  const attempt = latestAttempt(progress);
  assert(attempt?.isCorrect === true, 'Log/Exp repaired/revealed correct retry must still be evaluated as correct.');
  assert(attempt.revealedAnswer === true, 'Log/Exp revealed correct retry must retain revealedAnswer: true.');
  assert(attempt.revealedRepairStep === true, 'Log/Exp repaired correct retry must retain revealedRepairStep: true.');
  assert((await progressText(page))?.includes(logProgressLabel(0)), 'Log/Exp repaired/revealed correct retry must not count as pass.');
}

async function checkLogExpFullTopicPassRule(page) {
  await waitForStaticEnhancement(page, skillPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  for (const item of logChecks) {
    const form = await visibleFormForCheck(page, item.checkId);
    await submitAnswer(form, item.correctAnswer);
    const progress = await readProgress(page);
    const attempt = attemptForCheck(progress, item.checkId);
    assert(attempt?.isCorrect === true, `Clean correct answer must pass individual Log/Exp check ${item.checkId}.`);
    assert(attempt.revealedAnswer === false && attempt.revealedRepairStep === false, `Clean correct attempt must remain unrevealed and unrepaired for ${item.checkId}.`);
  }

  const finalText = await progressText(page);
  assert(finalText?.includes(logProgressLabel(18)), `All 18 clean Log/Exp attempts must pass the topic; saw "${finalText}".`);
  const progressNodeClass = await page.locator(`[data-progress-skill="${regionId}"]`).getAttribute('class');
  assert(String(progressNodeClass || '').includes('is-complete'), 'Log/Exp topic must be marked complete only after all 18 clean correct attempts.');
}

async function checkLogExpReviewPageFlow(page) {
  await waitForStaticEnhancement(page, reviewPagePath);
  await writeProgress(page, progressWithAttempts([
    {
      attemptId: 'log_wrong_notation',
      course: 'p3',
      topic: 'Log Graphs and Inverses',
      skillId: 'p3_log_convert_forms',
      checkId: 'sc-log-graph-foundation-001',
      submittedAnswer: '2^32=5',
      isCorrect: false,
      usedHint: false,
      revealedAnswer: false,
      revealedRepairStep: false,
      mistakeTags: ['notation'],
      timestamp: '2026-06-11T00:06:00.000Z',
      regionId,
    },
    {
      attemptId: 'log_clean_correct',
      course: 'p3',
      topic: 'Clean Log Should Not Appear',
      skillId: 'p3_log_domain_validation',
      checkId: 'sc-log-domain-core-001',
      submittedAnswer: '6',
      isCorrect: true,
      usedHint: false,
      revealedAnswer: false,
      revealedRepairStep: false,
      mistakeTags: ['notation'],
      timestamp: '2026-06-11T00:07:00.000Z',
      regionId,
    },
  ]));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  assert(await page.locator('[data-review-session]').isVisible(), 'P3 review route must render seeded Log/Exp mistake history.');
  const reviewText = await visibleText(page.locator('[data-review-groups]'));
  assert(reviewText.includes('notation'), 'Log/Exp mistake history must group by mistake tag.');
  assert(reviewText.includes('Log Graphs and Inverses'), 'Log/Exp mistake history must list the Log/Exp candidate.');
  assert(!reviewText.includes('Clean Log Should Not Appear'), 'Clean correct Log/Exp attempts must not appear as mistake-review candidates.');
}

async function checkComplexNumbersFullTopicPage(page) {
  await waitForStaticEnhancement(page, complexSkillPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  const pageShape = await page.evaluate((expectedIds) => {
    const forms = Array.from(document.querySelectorAll('[data-check-skill-answer]'));
    return {
      formIds: forms.map((form) => form.getAttribute('data-check-id')),
      hasFakeSaveButton: Boolean(document.querySelector('[data-save-skill-check]')),
      hasTriedCopy: (document.body.textContent || '').includes('I tried this'),
      missingInputs: expectedIds.filter((id) => !document.querySelector(`[data-check-id="${id}"] input[name="submittedAnswer"]`)),
      missingSubmitButtons: expectedIds.filter((id) => {
        const button = document.querySelector(`[data-check-id="${id}"] button[type="submit"]`);
        return !button || button.textContent?.replace(/\s+/g, ' ').trim() !== 'Check answer';
      }),
      answerTypes: expectedIds.map((id) => document.querySelector(`[data-check-id="${id}"]`)?.getAttribute('data-answer-type')),
    };
  }, complexChecks.map((item) => item.checkId));

  assert(pageShape.formIds.length === complexChecks.length, `Complex Numbers must render ${complexChecks.length} checkable forms; saw ${pageShape.formIds.length}.`);
  assert(complexChecks.every((item) => pageShape.formIds.includes(item.checkId)), 'Complex Numbers page must render every migrated checkable form.');
  assert(!pageShape.hasFakeSaveButton, 'Complex Numbers page must not render data-save-skill-check fake completion controls.');
  assert(!pageShape.hasTriedCopy, 'Complex Numbers page must not render I tried this fake completion copy.');
  assert(pageShape.missingInputs.length === 0, `Complex checks missing answer inputs: ${pageShape.missingInputs.join(', ')}`);
  assert(pageShape.missingSubmitButtons.length === 0, `Complex checks missing Check answer buttons: ${pageShape.missingSubmitButtons.join(', ')}`);
  assert(new Set(pageShape.answerTypes).size >= 5, 'Complex Numbers browser coverage must include all migrated answer type families.');

  for (const item of complexChecks) {
    const form = await visibleFormForCheck(page, item.checkId);
    await submitAnswer(form, 'definitely wrong');
    const progress = await readProgress(page);
    const attempt = latestAttempt(progress);
    assert(attempt?.checkId === item.checkId, `Wrong answer must save a local attempt for ${item.checkId}.`);
    assert(attempt.isCorrect === false, `Wrong answer must not be correct for ${item.checkId}.`);
    assert(attempt.revealedAnswer === false, `Wrong answer must not set revealedAnswer for ${item.checkId}.`);
    assert(attempt.revealedRepairStep === false, `Wrong answer must not set revealedRepairStep for ${item.checkId}.`);
    assert((await complexProgressText(page))?.includes('Skill Check: 0/12 passed'), `Wrong answer must not update Complex pass progress for ${item.checkId}.`);
  }
}

async function checkComplexRepresentativeAnswerTypes(page) {
  await waitForStaticEnhancement(page, complexSkillPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  for (const item of complexChecks.filter((entry) => representativeComplexChecks.includes(entry.checkId))) {
    const form = await visibleFormForCheck(page, item.checkId);
    await submitAnswer(form, item.correctAnswer);
    const progress = await readProgress(page);
    const attempt = latestAttempt(progress);
    assert(attempt?.checkId === item.checkId, `Correct ${item.answerType} answer must save an attempt for ${item.checkId}.`);
    assert(attempt.isCorrect === true, `Correct ${item.answerType} answer must be correct for ${item.checkId}.`);
    assert(attempt.revealedAnswer === false, `Clean ${item.answerType} answer must not be revealed for ${item.checkId}.`);
    assert(attempt.revealedRepairStep === false, `Clean ${item.answerType} answer must not be repaired for ${item.checkId}.`);
  }

  const partialText = await complexProgressText(page);
  assert(partialText?.includes('Skill Check: 5/12 passed'), `Partial representative correct answers must not complete Complex Numbers; saw "${partialText}".`);
  const progressNodeClass = await page.locator(`[data-progress-skill="${complexRegionId}"]`).getAttribute('class');
  assert(!String(progressNodeClass || '').includes('is-complete'), 'Complex Numbers topic must not be marked complete after partial correct attempts.');
}

async function checkComplexRevealRepairCannotPass(page) {
  await waitForStaticEnhancement(page, complexSkillPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  const first = complexChecks[0];
  const form = await visibleFormForCheck(page, first.checkId);
  await submitAnswer(form, '3-4i');
  await form.locator('input[name="mistakeTags"][value="sign error"]').check();
  await form.locator('[data-skill-repair] summary').click();
  await page.waitForFunction(
    ({ key, id }) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      const attempts = Array.isArray(progress.skillCheckAttempts) ? progress.skillCheckAttempts : [];
      const latest = attempts[attempts.length - 1];
      return latest?.checkId === id && latest.revealedRepairStep === true;
    },
    { key: storageKey, id: first.checkId },
  );
  await form.locator('[data-skill-answer-reveal] summary').click();
  await page.waitForFunction(
    ({ key, id }) => {
      const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
      const attempts = Array.isArray(progress.skillCheckAttempts) ? progress.skillCheckAttempts : [];
      const latest = attempts[attempts.length - 1];
      return latest?.checkId === id && latest.revealedAnswer === true;
    },
    { key: storageKey, id: first.checkId },
  );
  await submitAnswer(form, first.correctAnswer);
  const progress = await readProgress(page);
  const attempt = latestAttempt(progress);
  assert(attempt?.isCorrect === true, 'Complex repaired/revealed correct retry must still be evaluated as correct.');
  assert(attempt.revealedAnswer === true, 'Complex revealed correct retry must retain revealedAnswer: true.');
  assert(attempt.revealedRepairStep === true, 'Complex repaired correct retry must retain revealedRepairStep: true.');
  assert((await complexProgressText(page))?.includes('Skill Check: 0/12 passed'), 'Complex repaired/revealed correct retry must not count as pass.');
}

async function checkComplexFullTopicPassRule(page) {
  await waitForStaticEnhancement(page, complexSkillPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  for (const item of complexChecks) {
    const form = await visibleFormForCheck(page, item.checkId);
    await submitAnswer(form, item.correctAnswer);
    const progress = await readProgress(page);
    const attempt = attemptForCheck(progress, item.checkId);
    assert(attempt?.isCorrect === true, `Clean correct answer must pass individual Complex check ${item.checkId}.`);
    assert(attempt.revealedAnswer === false && attempt.revealedRepairStep === false, `Clean correct attempt must remain unrevealed and unrepaired for ${item.checkId}.`);
  }

  const finalText = await complexProgressText(page);
  assert(finalText?.includes('Skill Check: 12/12 passed'), `All 12 clean Complex attempts must pass the topic; saw "${finalText}".`);
  const progressNodeClass = await page.locator(`[data-progress-skill="${complexRegionId}"]`).getAttribute('class');
  assert(String(progressNodeClass || '').includes('is-complete'), 'Complex Numbers topic must be marked complete only after all 12 clean correct attempts.');
}

async function checkComplexReviewPageFlow(page) {
  await waitForStaticEnhancement(page, reviewPagePath);
  await writeProgress(page, progressWithAttempts([
    {
      attemptId: 'complex_wrong_sign',
      course: 'p3',
      topic: 'Complex Numbers',
      skillId: 'p3_complex_cartesian_conjugate',
      checkId: 'sc-complex-cartesian-conjugate-foundation-001',
      submittedAnswer: '3-4i',
      isCorrect: false,
      usedHint: false,
      revealedAnswer: false,
      revealedRepairStep: false,
      mistakeTags: ['sign error'],
      timestamp: '2026-06-11T00:04:00.000Z',
      regionId: complexRegionId,
    },
    {
      attemptId: 'complex_clean_correct',
      course: 'p3',
      topic: 'Clean Complex Should Not Appear',
      skillId: 'p3_complex_cartesian_conjugate',
      checkId: 'sc-complex-cartesian-conjugate-core-001',
      submittedAnswer: '5',
      isCorrect: true,
      usedHint: false,
      revealedAnswer: false,
      revealedRepairStep: false,
      mistakeTags: ['sign error'],
      timestamp: '2026-06-11T00:05:00.000Z',
      regionId: complexRegionId,
    },
  ]));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  assert(await page.locator('[data-review-session]').isVisible(), 'P3 review route must render seeded Complex mistake history.');
  const reviewText = await visibleText(page.locator('[data-review-groups]'));
  assert(reviewText.includes('sign error'), 'Complex mistake history must group by mistake tag.');
  assert(reviewText.includes('Complex Numbers'), 'Complex mistake history must list the Complex Numbers candidate.');
  assert(!reviewText.includes('Clean Complex Should Not Appear'), 'Clean correct Complex attempts must not appear as mistake-review candidates.');
}

async function checkReviewPageFlow(page) {
  await waitForStaticEnhancement(page, reviewPagePath);
  await clearProgress(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  assert(await page.locator('[data-review-empty]').isVisible(), 'P3 review route must render a useful empty state with no local mistake history.');
  assert(!(await page.locator('[data-review-session]').isVisible()), 'P3 review session must stay hidden for empty local mistake history.');

  await writeProgress(page, progressWithAttempts([
    {
      attemptId: 'seed_wrong_notation',
      course: 'p3',
      topic: 'Log Graphs and Inverses',
      skillId: 'p3_log_convert_forms',
      checkId,
      submittedAnswer: '2^32=5',
      isCorrect: false,
      usedHint: false,
      revealedAnswer: false,
      revealedRepairStep: false,
      mistakeTags: ['notation'],
      timestamp: '2026-06-11T00:00:00.000Z',
      regionId,
    },
    {
      attemptId: 'seed_repaired_method',
      course: 'p3',
      topic: 'Binomial Expansions',
      skillId: 'p3_alg_binomial_terms_coefficients',
      checkId: 'sc-alg-binomial-foundation-001',
      submittedAnswer: '5',
      isCorrect: false,
      usedHint: false,
      revealedAnswer: false,
      revealedRepairStep: true,
      mistakeTags: ['method choice'],
      timestamp: '2026-06-11T00:01:00.000Z',
      regionId: 'algebra',
    },
    {
      attemptId: 'seed_revealed_domain',
      course: 'p3',
      topic: 'Log Graphs and Inverses',
      skillId: 'p3_log_convert_forms',
      checkId: 'sc-log-graph-core-001',
      submittedAnswer: '(3,8)',
      isCorrect: false,
      usedHint: false,
      revealedAnswer: true,
      revealedRepairStep: false,
      mistakeTags: ['domain/range issue'],
      timestamp: '2026-06-11T00:02:00.000Z',
      regionId,
    },
    {
      attemptId: 'seed_clean_correct',
      course: 'p3',
      topic: 'Should Not Appear',
      skillId: 'clean_correct_skill',
      checkId: 'clean-correct-check',
      submittedAnswer: '2^5=32',
      isCorrect: true,
      usedHint: false,
      revealedAnswer: false,
      revealedRepairStep: false,
      mistakeTags: ['notation'],
      timestamp: '2026-06-11T00:03:00.000Z',
      regionId,
    },
  ]));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  assert(await page.locator('[data-review-session]').isVisible(), 'P3 review route must render mistake-tag history from seeded localStorage.');
  const reviewText = await visibleText(page.locator('[data-review-groups]'));
  assert(reviewText.includes('notation'), 'Review groups must include wrong-answer mistake tags.');
  assert(reviewText.includes('method choice'), 'Review groups must include repaired attempts as review candidates.');
  assert(reviewText.includes('domain/range issue'), 'Review groups must include revealed attempts as review candidates.');
  assert(reviewText.includes('Log Graphs and Inverses'), 'Review groups must list related checks and skills.');
  assert(!reviewText.includes('Should Not Appear'), 'Clean correct attempts must not appear as mistake-review candidates.');
}

for (const pagePath of [skillPagePath, complexSkillPagePath, reviewPagePath]) {
  assert(existsSync(path.join(siteRoot, pagePath)), `Required generated page is missing: ${pagePath}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  await checkLegacyAndMalformedProgressFailClosed(page);
  await checkSkillPageFlow(page);
  await checkLogExpFullTopicPage(page);
  await checkLogExpRepresentativeAnswerTypes(page);
  await checkLogExpRevealRepairCannotPass(page);
  await checkLogExpFullTopicPassRule(page);
  await checkComplexNumbersFullTopicPage(page);
  await checkComplexRepresentativeAnswerTypes(page);
  await checkComplexRevealRepairCannotPass(page);
  await checkComplexFullTopicPassRule(page);
  await checkReviewPageFlow(page);
  await checkLogExpReviewPageFlow(page);
  await checkComplexReviewPageFlow(page);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await browser.close();
}

if (process.exitCode) process.exit();

console.log('P3 Skill Check interaction browser check passed.');
