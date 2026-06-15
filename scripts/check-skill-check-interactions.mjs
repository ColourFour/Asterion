import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');
const storageKey = 'asterion.progress.v1';
const learnPagePath = 'p3/topics/algebra/learn/index.html';
const oldSkillCheckPagePath = 'p3/topics/algebra/skill-check/index.html';

function pageUrl(pagePath) {
  return pathToFileURL(path.join(siteRoot, pagePath)).href;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForStaticEnhancement(page, pagePath) {
  await page.goto(pageUrl(pagePath), { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
}

if (!existsSync(path.join(siteRoot, learnPagePath))) {
  throw new Error(`Missing Learn Mode page: ${learnPagePath}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  await waitForStaticEnhancement(page, learnPagePath);
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });

  const initialShape = await page.evaluate(() => ({
    learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
    visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((step) => !step.hidden).length,
    learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
    oldSkillForms: document.querySelectorAll('[data-check-skill-answer]').length,
    nextLocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && button.disabled),
  }));
  assert(initialShape.learnSteps > 0, 'Learn Mode must render lesson steps.');
  assert(initialShape.visibleSteps === 1, `Learn Mode must show one step at a time; saw ${initialShape.visibleSteps}.`);
  assert(initialShape.learnForms > 0, 'Learn Mode must render checked answer forms.');
  assert(initialShape.oldSkillForms === 0, 'Learn Mode must not render legacy Skill Check forms.');
  assert(initialShape.nextLocked, 'Learn Mode next button must be locked before a correct answer.');

  const firstForm = page.locator('[data-check-learn-answer]').first();
  await firstForm.locator('input[name="submittedAnswer"]').fill('definitely wrong');
  await firstForm.locator('button[type="submit"]').click();
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return Array.isArray(progress.learningActivityAttempts) && progress.learningActivityAttempts.length === 1;
  });

  const wrongState = await page.evaluate((key) => {
    const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
    return {
      learningCount: progress.learningActivityAttempts?.length ?? 0,
      skillCount: progress.skillCheckAttempts?.length ?? 0,
      hintVisible: !document.querySelector('[data-check-learn-answer] [data-learn-hint]')?.hidden,
      afterAttemptVisible: !document.querySelector('[data-check-learn-answer] [data-learn-after-attempt]')?.hidden,
      nextStillLocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && button.disabled),
    };
  }, storageKey);
  assert(wrongState.learningCount === 1, 'Wrong Learn attempt must be saved as learning activity.');
  assert(wrongState.skillCount === 0, 'Wrong Learn attempt must not create Skill Check pass evidence.');
  assert(wrongState.hintVisible, 'Wrong Learn attempt must reveal the hint.');
  assert(wrongState.afterAttemptVisible, 'Wrong Learn attempt must reveal explanation/principle support.');
  assert(wrongState.nextStillLocked, 'Wrong Learn attempt must not complete the step.');

  await firstForm.locator('input[name="submittedAnswer"]').fill('u=x^2+2x');
  await firstForm.locator('button[type="submit"]').click();
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 2;
  });

  const hintedCorrectState = await page.evaluate((key) => {
    const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
    return {
      learningCount: progress.learningActivityAttempts?.length ?? 0,
      skillCount: progress.skillCheckAttempts?.length ?? 0,
      completedSteps: Object.keys(progress.regionLearning?.algebra?.fieldGuideTopicCompletions ?? {}).length,
      nextUnlocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    };
  }, storageKey);
  assert(hintedCorrectState.learningCount === 2, 'Correct Learn retry must be saved as learning activity.');
  assert(hintedCorrectState.skillCount === 0, 'Hinted Learn retry must not create strong Skill Check evidence.');
  assert(hintedCorrectState.completedSteps === 1, 'Correct Learn retry must complete the step.');
  assert(hintedCorrectState.nextUnlocked, 'Correct Learn retry must unlock the next step.');

  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
  const cleanForm = page.locator('[data-check-learn-answer]').first();
  await cleanForm.locator('input[name="submittedAnswer"]').fill('u=x^2+2x');
  await cleanForm.locator('button[type="submit"]').click();
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.skillCheckAttempts?.length ?? 0) === 1;
  });

  const cleanState = await page.evaluate((key) => {
    const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
    return {
      learningCount: progress.learningActivityAttempts?.length ?? 0,
      skillCount: progress.skillCheckAttempts?.length ?? 0,
      firstSkillClean: progress.skillCheckAttempts?.[0]?.isCorrect === true
        && progress.skillCheckAttempts?.[0]?.usedHint === false
        && progress.skillCheckAttempts?.[0]?.revealedAnswer === false,
    };
  }, storageKey);
  assert(cleanState.learningCount === 1, 'Clean Learn answer must still be recorded as learning activity.');
  assert(cleanState.skillCount === 1 && cleanState.firstSkillClean, 'Clean Learn answer must create existing Skill Check evidence.');

  await waitForStaticEnhancement(page, oldSkillCheckPagePath);
  const oldRouteShape = await page.evaluate(() => ({
    moved: document.body.innerText.includes('Skill Check has moved'),
    learnLinks: Array.from(document.querySelectorAll('a')).filter((link) => /Open Learn Mode/.test(link.textContent || '')).length,
    legacyForms: document.querySelectorAll('[data-check-skill-answer]').length,
  }));
  assert(oldRouteShape.moved, 'Old Skill Check route must show a Learn Mode merge notice.');
  assert(oldRouteShape.learnLinks > 0, 'Old Skill Check route must link to Learn Mode.');
  assert(oldRouteShape.legacyForms === 0, 'Old Skill Check route must not render the legacy checking flow.');

  console.log('P3 Learn Mode interaction browser check passed.');
} finally {
  await browser.close();
}
