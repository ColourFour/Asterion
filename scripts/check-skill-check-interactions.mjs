import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const siteRoot = path.join(repoRoot, 'docs');
const storageKey = 'asterion.progress.v1';

const algebraLearnPagePath = 'p3/topics/algebra/learn/index.html';
const logExpLearnPagePath = 'p3/topics/logarithmic-and-exponential-functions/learn/index.html';
const trigLearnPagePath = 'p3/topics/trigonometry/learn/index.html';
const oldAlgebraFieldGuidePagePath = 'p3/topics/algebra/field-guide/index.html';
const oldAlgebraSkillCheckPagePath = 'p3/topics/algebra/skill-check/index.html';
const oldLogExpFieldGuidePagePath = 'p3/topics/logarithmic-and-exponential-functions/field-guide/index.html';
const oldLogExpSkillCheckPagePath = 'p3/topics/logarithmic-and-exponential-functions/skill-check/index.html';
const oldTrigFieldGuidePagePath = 'p3/topics/trigonometry/field-guide/index.html';
const oldTrigSkillCheckPagePath = 'p3/topics/trigonometry/skill-check/index.html';

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
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
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
    } else if (/wrong|not/i.test(answer)) {
      await form.locator('input[name="submittedAnswer"]:not([value="correct"])').first().check();
    } else {
      await form.locator('input[name="submittedAnswer"][value="correct"]').check();
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
      completedAlgebraSteps: Object.keys(progress.regionLearning?.algebra?.fieldGuideTopicCompletions ?? {}).length,
      completedLogExpSteps: Object.keys(progress.regionLearning?.['logarithmic-and-exponential-functions']?.fieldGuideTopicCompletions ?? {}).length,
      completedTrigSteps: Object.keys(progress.regionLearning?.trigonometry?.fieldGuideTopicCompletions ?? {}).length,
      learningAttempts: progress.learningActivityAttempts ?? [],
      skillAttempts: progress.skillCheckAttempts ?? [],
    };
  }, storageKey);
}

for (const requiredPath of [
  algebraLearnPagePath,
  logExpLearnPagePath,
  trigLearnPagePath,
  oldAlgebraFieldGuidePagePath,
  oldAlgebraSkillCheckPagePath,
  oldLogExpFieldGuidePagePath,
  oldLogExpSkillCheckPagePath,
  oldTrigFieldGuidePagePath,
  oldTrigSkillCheckPagePath,
]) {
  if (!existsSync(path.join(siteRoot, requiredPath))) {
    throw new Error(`Missing static page required by interaction check: ${requiredPath}`);
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  await waitForStaticEnhancement(page, algebraLearnPagePath);
  const checkerCoverage = await page.evaluate(() => {
    const hooks = window.__ASTERION_SKILL_CHECK_TEST_HOOKS__;
    if (!hooks) return { hasHooks: false };
    const check = (spec, submittedAnswer) => hooks.checkSubmittedSkillAnswer(spec, submittedAnswer).isCorrect;
    return {
      hasHooks: true,
      numeric: check({ answerType: 'numeric', acceptedAnswers: ['2.5'], tolerance: 0.01 }, '2.504'),
      exactText: check({ answerType: 'exact-text', acceptedAnswers: ['one repeated real root'] }, 'One repeated real root.'),
      expressionText: check({ answerType: 'expression-text', acceptedAnswers: ['sin^2x+cos^2x=1'] }, 'sin^2 x + cos^2 x = 1'),
      multiValue: check({ answerType: 'multi-value', acceptedAnswers: ['-1/2, 1'] }, '1, -0.5'),
      interval: check({ answerType: 'interval', acceptedAnswers: ['-1/3 < x < 1/3'] }, '(-1/3, 1/3)'),
      coordinateVectorLike: check({ answerType: 'coordinate', acceptedAnswers: ['(1, 2, 3)'] }, '(1,2,3)'),
      multipleChoiceLearnValue: check({ answerType: 'expression-text', acceptedAnswers: ['cos2x=1-2sin^2x'] }, 'cos 2x = 1 - 2 sin^2 x'),
    };
  });
  assert(checkerCoverage.hasHooks, 'Static answer checker hooks must be exposed.');
  for (const [name, passed] of Object.entries(checkerCoverage).filter(([name]) => name !== 'hasHooks')) {
    assert(passed, `Static answer checker coverage failed for ${name}.`);
  }

  await resetPageProgress(page);
  const algebraInitialShape = await page.evaluate(() => ({
    learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
    visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((step) => !step.hidden).length,
    learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
    oldSkillForms: document.querySelectorAll('[data-check-skill-answer]').length,
    activeProblemInFirstViewport: (() => {
      const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
      const rect = activeCard?.getBoundingClientRect();
      return Boolean(rect && rect.top < window.innerHeight * 0.72 && rect.bottom > 0);
    })(),
    answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer] [data-learn-answer-reveal]')?.hidden),
    nextLocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && button.disabled),
  }));
  assert(algebraInitialShape.learnSteps === 11, `Algebra Learn Mode must render 11 authored lesson steps; saw ${algebraInitialShape.learnSteps}.`);
  assert(algebraInitialShape.visibleSteps === 1, `Learn Mode must show one step at a time; saw ${algebraInitialShape.visibleSteps}.`);
  assert(algebraInitialShape.learnForms >= 22, 'Learn Mode must render primary and similar checked answer forms.');
  assert(algebraInitialShape.oldSkillForms === 0, 'Learn Mode must not render legacy Skill Check forms.');
  assert(algebraInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Algebra problem.');
  assert(algebraInitialShape.answerRevealHidden, 'Answer reveal must be unavailable before a submitted Learn attempt.');
  assert(algebraInitialShape.nextLocked, 'Learn Mode next button must be locked before the step is completed.');

  const algebraCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  const algebraPrimary = algebraCard.locator('[data-check-learn-answer][data-learn-variant="primary"]');
  const algebraSimilar = algebraCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(algebraPrimary, 'definitely wrong');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return Array.isArray(progress.learningActivityAttempts) && progress.learningActivityAttempts.length === 1;
  });

  const algebraWrongState = await page.evaluate(() => ({
    hintVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-hint]')?.hidden,
    afterAttemptVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden,
    answerRevealVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden,
    similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
    transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
    nextStillLocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && button.disabled),
  }));
  const algebraWrongProgress = await progressSnapshot(page);
  assert(algebraWrongProgress.learningCount === 1, 'Wrong Learn attempt must be saved as learning activity.');
  assert(algebraWrongProgress.skillCount === 0, 'Wrong Learn attempt must not create Skill Check pass evidence.');
  assert(algebraWrongState.hintVisible, 'Wrong Learn attempt must reveal the hint.');
  assert(algebraWrongState.afterAttemptVisible, 'Wrong Learn attempt must reveal explanation/principle support.');
  assert(algebraWrongState.answerRevealVisible, 'Answer reveal must become available after a submitted attempt.');
  assert(algebraWrongState.similarVisible, 'Similar checked question must appear after the primary action is checked.');
  assert(algebraWrongState.transferHidden, 'Exam transfer must stay hidden until the similar checked question is attempted.');
  assert(algebraWrongState.nextStillLocked, 'Wrong primary attempt must not complete the step.');

  await submitAnswer(algebraPrimary, '2');
  await submitAnswer(algebraSimilar, '-3');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 3
      && Object.keys(progress.regionLearning?.algebra?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const algebraHintedState = await progressSnapshot(page);
  assert(algebraHintedState.skillCount === 1, 'Clean similar answer should still create checked Skill Check evidence.');
  assert(algebraHintedState.completedAlgebraSteps === 1, 'Similar checked answer must complete the Learn step.');

  await resetPageProgress(page);
  const cleanAlgebraCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(cleanAlgebraCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), '2');
  await submitAnswer(cleanAlgebraCard.locator('[data-check-learn-answer][data-learn-variant="similar"]'), '-3');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.skillCheckAttempts?.length ?? 0) === 1
      && Object.keys(progress.regionLearning?.algebra?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanAlgebraState = await progressSnapshot(page);
  assert(cleanAlgebraState.learningCount === 2, 'Clean primary and similar answers must be recorded as Learn activity.');
  assert(cleanAlgebraState.skillCount === 1 && cleanAlgebraState.firstSkillClean, 'Clean Algebra similar answer must create clean checked evidence when configured.');

  await waitForStaticEnhancement(page, logExpLearnPagePath);
  await resetPageProgress(page);
  const logExpInitialShape = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const afterAttempt = document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]');
    const text = document.body.innerText;
    return {
      hasLogExpTitle: text.includes('Logarithmic and Exponential Functions'),
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((step) => !step.hidden).length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
      activeProblemInFirstViewport: Boolean(cardRect && cardRect.top < window.innerHeight * 0.72 && cardRect.bottom > 0),
      explanationHidden: Boolean(afterAttempt?.hidden),
      principleHidden: Boolean(afterAttempt?.hidden),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextLocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && button.disabled),
    };
  });
  assert(logExpInitialShape.hasLogExpTitle, 'Log/Exp Learn page must render.');
  assert(logExpInitialShape.learnSteps === 13, `Log/Exp Learn Mode must render 13 authored steps; saw ${logExpInitialShape.learnSteps}.`);
  assert(logExpInitialShape.visibleSteps === 1, 'Log/Exp Learn Mode must show one active step.');
  assert(logExpInitialShape.learnForms >= 26, 'Log/Exp Learn Mode must render primary and similar checked forms.');
  assert(logExpInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Log/Exp problem.');
  assert(logExpInitialShape.explanationHidden, 'Log/Exp explanation must be hidden before attempt.');
  assert(logExpInitialShape.principleHidden, 'Log/Exp principle must be hidden before attempt.');
  assert(logExpInitialShape.similarHidden, 'Log/Exp similar question must be hidden before primary attempt.');
  assert(logExpInitialShape.transferHidden, 'Log/Exp exam transfer must be hidden before primary attempt.');
  assert(logExpInitialShape.answerRevealHidden, 'Log/Exp answer reveal must be unavailable before first submitted attempt.');
  assert(logExpInitialShape.nextLocked, 'Log/Exp next button must be locked before the step is completed.');

  const logExpCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  const logExpPrimary = logExpCard.locator('[data-check-learn-answer][data-learn-variant="primary"]');
  const logExpSimilar = logExpCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(logExpPrimary, 'log_3(81)=4');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 1;
  });
  const logExpAfterPrimary = await page.evaluate(() => ({
    explanationVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden,
    principleVisible: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.textContent?.includes('Principle')),
    similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
    transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
    nextLocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && button.disabled),
  }));
  assert(logExpAfterPrimary.explanationVisible, 'Log/Exp explanation must reveal after primary attempt.');
  assert(logExpAfterPrimary.principleVisible, 'Log/Exp principle must reveal after primary attempt.');
  assert(logExpAfterPrimary.similarVisible, 'Log/Exp similar checked question must reveal after primary attempt.');
  assert(logExpAfterPrimary.transferHidden, 'Log/Exp exam transfer must stay hidden until similar attempt.');
  assert(logExpAfterPrimary.nextLocked, 'Primary-only Log/Exp answer must not complete a step with a similar check.');

  await submitAnswer(logExpSimilar, 'log_5(25)=2');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.skillCheckAttempts?.length ?? 0) === 1
      && Object.keys(progress.regionLearning?.['logarithmic-and-exponential-functions']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanLogExpState = await progressSnapshot(page);
  assert(cleanLogExpState.learningCount === 2, 'Clean Log/Exp primary and similar answers must save Learn activity.');
  assert(cleanLogExpState.skillCount === 1 && cleanLogExpState.firstSkillClean, 'Clean Log/Exp similar answer must create appropriate checked evidence.');

  await resetPageProgress(page);
  const hintedLogExpCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(hintedLogExpCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'log_3(81)=4');
  const hintedLogExpSimilar = hintedLogExpCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await hintedLogExpSimilar.locator('[data-show-learn-hint]').click();
  await submitAnswer(hintedLogExpSimilar, 'log_5(25)=2');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 2
      && Object.keys(progress.regionLearning?.['logarithmic-and-exponential-functions']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const hintedLogExpState = await progressSnapshot(page);
  assert(hintedLogExpState.skillCount === 0, 'Hinted Log/Exp similar answer must not mirror into strong Skill Check evidence.');
  assert(hintedLogExpState.learningAttempts.at(-1)?.strongEvidence === false, 'Hinted Log/Exp answer must remain weak Learn evidence.');

  await resetPageProgress(page);
  const revealedLogExpCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(revealedLogExpCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'log_3(81)=4');
  const revealedLogExpSimilar = revealedLogExpCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(revealedLogExpSimilar, 'not yet');
  await revealedLogExpSimilar.locator('[data-learn-answer-reveal] summary').click();
  await submitAnswer(revealedLogExpSimilar, 'log_5(25)=2');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 3
      && Object.keys(progress.regionLearning?.['logarithmic-and-exponential-functions']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const revealedLogExpState = await progressSnapshot(page);
  assert(revealedLogExpState.skillCount === 0, 'Revealed Log/Exp answer must not mirror into strong Skill Check evidence.');

  await waitForStaticEnhancement(page, trigLearnPagePath);
  await resetPageProgress(page);
  const trigInitialShape = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const text = document.body.innerText;
    return {
      hasTrigTitle: text.includes('Trigonometry'),
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((step) => !step.hidden).length,
      activeProblemInFirstViewport: Boolean(cardRect && cardRect.top < window.innerHeight * 0.72 && cardRect.bottom > 0),
      explanationHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden),
      principleHidden: !text.includes('Principle: choose the identity whose terms already match the expression.'),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
    };
  });
  assert(trigInitialShape.hasTrigTitle, 'Trigonometry Learn page must render.');
  assert(trigInitialShape.learnSteps === 11, `Trigonometry Learn Mode must render 11 authored steps; saw ${trigInitialShape.learnSteps}.`);
  assert(trigInitialShape.visibleSteps === 1, 'Trigonometry Learn Mode must show one active step.');
  assert(trigInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Trigonometry problem.');
  assert(trigInitialShape.explanationHidden, 'Explanation must be hidden before attempt.');
  assert(trigInitialShape.principleHidden, 'Principle must be hidden before attempt.');
  assert(trigInitialShape.similarHidden, 'Similar question must be hidden before primary attempt.');
  assert(trigInitialShape.transferHidden, 'Exam transfer must be hidden before primary attempt.');
  assert(trigInitialShape.answerRevealHidden, 'Answer reveal must be unavailable before first submitted attempt.');

  const trigCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  const trigPrimary = trigCard.locator('[data-check-learn-answer][data-learn-variant="primary"]');
  const trigSimilar = trigCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(trigPrimary, 'sin^2x+cos^2x=1');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 1;
  });
  const trigAfterPrimary = await page.evaluate(() => ({
    explanationVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden,
    principleVisible: document.body.innerText.includes('Principle: choose the identity whose terms already match the expression.'),
    similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
    transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
    nextLocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && button.disabled),
  }));
  assert(trigAfterPrimary.explanationVisible, 'Explanation must reveal after primary attempt.');
  assert(trigAfterPrimary.principleVisible, 'Principle must reveal after primary attempt.');
  assert(trigAfterPrimary.similarVisible, 'Similar checked question must reveal after primary attempt.');
  assert(trigAfterPrimary.transferHidden, 'Exam transfer must stay hidden until similar attempt.');
  assert(trigAfterPrimary.nextLocked, 'Primary-only Trig answer must not complete a step with a similar check.');

  await trigSimilar.locator('[data-show-learn-hint]').click();
  await submitAnswer(trigSimilar, '1+tan^2x=sec^2x');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 2;
  });
  const hintedTrigState = await progressSnapshot(page);
  const hintedTrigUi = await page.evaluate(() => ({
    transferVisible: !document.querySelector('[data-learn-exam-transfer]')?.hidden,
    nextUnlocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(hintedTrigState.skillCount === 0, 'Hinted Trigonometry similar answer must not mirror into strong Skill Check evidence.');
  assert(hintedTrigState.learningAttempts.at(-1)?.strongEvidence === false, 'Hinted Trigonometry answer must remain weak Learn evidence.');
  assert(hintedTrigState.completedTrigSteps === 1, 'Correct hinted similar work may complete the lesson step as weak Learn progress.');
  assert(hintedTrigUi.transferVisible, 'Exam transfer must appear after the similar question is attempted.');
  assert(hintedTrigUi.nextUnlocked, 'Correct similar question must unlock the next Learn step.');

  await resetPageProgress(page);
  const cleanTrigCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(cleanTrigCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'sin^2x+cos^2x=1');
  const cleanTrigSimilar = cleanTrigCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(cleanTrigSimilar, 'not yet');
  await cleanTrigSimilar.locator('[data-learn-answer-reveal] summary').click();
  await submitAnswer(cleanTrigSimilar, '1+tan^2x=sec^2x');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 3
      && Object.keys(progress.regionLearning?.trigonometry?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const revealedTrigState = await progressSnapshot(page);
  assert(revealedTrigState.skillCount === 0, 'Revealed Trigonometry answer must not mirror into strong Skill Check evidence.');

  await resetPageProgress(page);
  const finalTrigCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(finalTrigCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'sin^2x+cos^2x=1');
  await submitAnswer(finalTrigCard.locator('[data-check-learn-answer][data-learn-variant="similar"]'), '1+tan^2x=sec^2x');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.skillCheckAttempts?.length ?? 0) === 1
      && Object.keys(progress.regionLearning?.trigonometry?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanTrigState = await progressSnapshot(page);
  assert(cleanTrigState.learningCount === 2, 'Clean Trigonometry primary and similar answers must save Learn activity.');
  assert(cleanTrigState.skillCount === 1 && cleanTrigState.firstSkillClean, 'Clean Trigonometry similar answer must create appropriate checked evidence.');
  assert(cleanTrigState.learningAttempts[0]?.strongEvidence === true, 'Clean primary checked work remains strong Learn activity evidence.');

  for (const [oldPath, label] of [
    [oldAlgebraFieldGuidePagePath, 'Algebra Field Guide'],
    [oldAlgebraSkillCheckPagePath, 'Algebra Skill Check'],
    [oldLogExpFieldGuidePagePath, 'Log/Exp Field Guide'],
    [oldLogExpSkillCheckPagePath, 'Log/Exp Skill Check'],
    [oldTrigFieldGuidePagePath, 'Trigonometry Field Guide'],
    [oldTrigSkillCheckPagePath, 'Trigonometry Skill Check'],
  ]) {
    await waitForStaticEnhancement(page, oldPath);
    const oldRouteShape = await page.evaluate(() => ({
      moved: document.body.innerText.includes('has moved'),
      learnLinks: Array.from(document.querySelectorAll('a')).filter((link) => /Open Learn Mode/.test(link.textContent || '') && /\/learn\/(?:index\.html)?$/.test(link.href)).length,
      legacyForms: document.querySelectorAll('[data-check-skill-answer]').length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
    }));
    assert(oldRouteShape.moved, `${label} route must show a Learn Mode merge notice.`);
    assert(oldRouteShape.learnLinks > 0, `${label} route must link to Learn Mode.`);
    assert(oldRouteShape.legacyForms === 0 && oldRouteShape.learnForms === 0, `${label} route must not render an old checking flow.`);
  }

  console.log('P3 Learn Mode interaction browser check passed.');
} finally {
  await browser.close();
}
