import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');
const storageKey = 'asterion.progress.v1';

const algebraPracticePagePath = 'p3/topics/algebra/learn/index.html';
const algebraCompatibilityPagePath = 'p3/topics/algebra/skill-check/index.html';
const differentiationPracticePagePath = 'p3/topics/differentiation/learn/index.html';

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

async function resetPageProgress(page) {
  await page.evaluate((key) => {
    window.localStorage.removeItem(key);
    window.history.replaceState(null, '', window.location.href.replace(/#.*/, ''));
  }, storageKey);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('static-enhanced'), undefined, { timeout: 5000 });
}

async function submitAnswer(form, answer) {
  const textInput = form.locator('input[name="submittedAnswer"][type="text"]');
  if (await textInput.count()) {
    await textInput.fill(answer);
  } else {
    const requestedChoice = form.locator(`input[name="submittedAnswer"][value="${answer}"]`);
    if (await requestedChoice.count()) {
      await requestedChoice.check();
    } else {
      await form.locator('input[name="submittedAnswer"]').first().check();
    }
  }
  await form.locator('button[type="submit"]').click();
}

async function progressSnapshot(page) {
  return page.evaluate((key) => {
    const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
    return {
      learningCount: progress.learningActivityAttempts?.length ?? 0,
      skillCount: progress.skillCheckAttempts?.length ?? 0,
      firstSkillClean: progress.skillCheckAttempts?.[0]?.isCorrect === true
        && progress.skillCheckAttempts?.[0]?.usedHint === false
        && progress.skillCheckAttempts?.[0]?.revealedAnswer === false
        && progress.skillCheckAttempts?.[0]?.revealedRepairStep === false,
      lastSkill: progress.skillCheckAttempts?.at(-1),
      regionLearningKeys: Object.keys(progress.regionLearning ?? {}),
    };
  }, storageKey);
}

async function clickNext(page) {
  await page.locator('.practice-controls button').filter({ hasText: /Next|Finish practice|Skip/i }).last().click();
}

async function advanceToCheckedCard(page) {
  for (let index = 0; index < 80; index += 1) {
    const state = await page.evaluate(() => ({
      hasActiveChecked: Boolean(document.querySelector('.practice-card:not([hidden]) [data-check-skill-answer]')),
      nextDisabled: Boolean(Array.from(document.querySelectorAll('.practice-controls button')).find((button) => /Next|Finish practice|Pass to continue|Skip/i.test(button.textContent || ''))?.disabled),
      nextText: Array.from(document.querySelectorAll('.practice-controls button')).find((button) => /Next|Finish practice|Pass to continue|Skip/i.test(button.textContent || ''))?.textContent || '',
    }));
    if (state.hasActiveChecked) return state;
    assert(!state.nextDisabled, `Could not advance through support cards; next button was disabled as "${state.nextText}".`);
    await clickNext(page);
  }
  throw new Error('Could not reach a checked evidence card.');
}

for (const requiredPath of [
  algebraPracticePagePath,
  algebraCompatibilityPagePath,
  differentiationPracticePagePath,
]) {
  assert(existsSync(path.join(siteRoot, requiredPath)), `Missing rendered page: ${requiredPath}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  await waitForStaticEnhancement(page, algebraPracticePagePath);
  await resetPageProgress(page);

  const initialShape = await page.evaluate(() => ({
    title: document.body.innerText.includes('Algebra Practice'),
    oneCardFlow: document.querySelectorAll('[data-one-card-flow]').length,
    learnFlow: document.querySelectorAll('[data-learn-flow]').length,
    supportCards: document.querySelectorAll('[data-learn-step-card]').length,
    supportForms: document.querySelectorAll('[data-check-learn-answer]').length,
    checkedForms: document.querySelectorAll('[data-check-skill-answer]').length,
    visibleCards: Array.from(document.querySelectorAll('.practice-card')).filter((card) => !card.hidden).length,
    firstCardIsSupport: Boolean(document.querySelector('.practice-card:not([hidden]) [data-check-learn-answer]')),
    hasLearnProgressCounter: Boolean(document.querySelector('[data-progress-field-guide]')),
  }));
  assert(initialShape.title, 'Unified Algebra page must be titled as Practice.');
  assert(initialShape.oneCardFlow === 1 && initialShape.learnFlow === 0, 'Unified Practice must use one-card flow, not the old Learn flow.');
  assert(initialShape.supportCards === 17 && initialShape.supportForms >= 34 && initialShape.checkedForms >= 20, 'Unified Practice must include support and checked questions.');
  assert(initialShape.visibleCards === 1 && initialShape.firstCardIsSupport, 'A fresh student must see one support card first.');
  assert(!initialShape.hasLearnProgressCounter, 'Unified Practice must not render a Learn progress counter.');

  await clickNext(page);
  const afterFreeNext = await page.evaluate(() => ({
    visibleCards: Array.from(document.querySelectorAll('.practice-card')).filter((card) => !card.hidden).length,
    activeCardId: document.querySelector('.practice-card:not([hidden])')?.getAttribute('data-learn-step-id') || '',
  }));
  assert(afterFreeNext.visibleCards === 1, 'Practice navigation must still show one card.');
  assert(afterFreeNext.activeCardId !== 'learn-alg-remainder-factor-theorem', 'Support cards must be freely skippable without answering.');

  await resetPageProgress(page);
  const firstSupport = page.locator('.practice-card:not([hidden]) [data-check-learn-answer][data-learn-variant="primary"]').first();
  await submitAnswer(firstSupport, '2');
  await page.waitForTimeout(100);
  const supportProgress = await progressSnapshot(page);
  assert(supportProgress.learningCount === 0, 'Support answers must not create learningActivityAttempts.');
  assert(supportProgress.skillCount === 0, 'Support answers must not create checked evidence.');
  assert(supportProgress.regionLearningKeys.length === 0, 'Support answers must not create regionLearning progress.');

  await resetPageProgress(page);
  const firstCheckedState = await advanceToCheckedCard(page);
  assert(firstCheckedState.nextDisabled && /Pass to continue/.test(firstCheckedState.nextText), 'Multi-question checked groups must gate the next checked question.');
  await submitAnswer(page.locator('.practice-card:not([hidden]) [data-check-skill-answer]').first(), 'both-roots');
  await page.waitForFunction((key) => {
    const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
    return (progress.skillCheckAttempts?.length ?? 0) === 1;
  }, storageKey);
  const cleanCheckedProgress = await progressSnapshot(page);
  assert(cleanCheckedProgress.skillCount === 1 && cleanCheckedProgress.firstSkillClean, 'Correct unrevealed checked answer must create clean checked evidence.');
  const afterPassState = await page.evaluate(() => {
    const nextButton = Array.from(document.querySelectorAll('.practice-controls button')).find((button) => /Next|Finish practice|Pass to continue/i.test(button.textContent || ''));
    return {
      nextDisabled: Boolean(nextButton?.disabled),
      inlineNextVisible: Boolean(document.querySelector('.practice-card:not([hidden]) [data-skill-check-inline-next]:not([hidden])')),
    };
  });
  assert(!afterPassState.nextDisabled || afterPassState.inlineNextVisible, 'A passed checked question must allow continuing.');

  await waitForStaticEnhancement(page, differentiationPracticePagePath);
  await resetPageProgress(page);
  await page.evaluate(() => {
    const singleGroup = Array.from(document.querySelectorAll('[data-skill-check-group]')).find((group) => (
      group.querySelectorAll('[data-check-skill-answer]').length === 1
    ));
    if (singleGroup?.id) window.location.hash = singleGroup.id;
  });
  await page.waitForTimeout(100);
  const singleCheckedState = await advanceToCheckedCard(page);
  assert(!singleCheckedState.nextDisabled && !/Pass to continue/.test(singleCheckedState.nextText), 'A single checked question in a subtopic must be skippable.');

  await waitForStaticEnhancement(page, algebraPracticePagePath);
  await resetPageProgress(page);
  await advanceToCheckedCard(page);
  const checkedForm = page.locator('.practice-card:not([hidden]) [data-check-skill-answer]').first();
  await checkedForm.locator('[data-show-skill-hint]').click();
  await submitAnswer(checkedForm, 'both-roots');
  await page.waitForFunction((key) => {
    const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
    return (progress.skillCheckAttempts?.length ?? 0) === 1;
  }, storageKey);
  const hintedProgress = await progressSnapshot(page);
  assert(hintedProgress.skillCount === 1 && hintedProgress.lastSkill?.usedHint === true, 'Hinted checked attempt must be recorded as hinted.');
  const hintedPassState = await page.evaluate(() => Boolean(document.querySelector('.practice-card:not([hidden]) [data-check-skill-answer].is-passed')));
  assert(!hintedPassState, 'Hinted checked answer must not mark the form passed.');

  await waitForStaticEnhancement(page, algebraCompatibilityPagePath);
  const compatibilityShape = await page.evaluate(() => ({
    title: document.body.innerText.includes('Algebra Practice'),
    supportForms: document.querySelectorAll('[data-check-learn-answer]').length,
    checkedForms: document.querySelectorAll('[data-check-skill-answer]').length,
    visibleCard: Boolean(document.querySelector('.practice-card:not([hidden])')),
  }));
  assert(compatibilityShape.title && compatibilityShape.supportForms && compatibilityShape.checkedForms && compatibilityShape.visibleCard, 'Old skill-check URL must render the same unified Practice flow.');

  console.log('P3 unified Practice interaction browser check passed.');
} finally {
  await browser.close();
}
