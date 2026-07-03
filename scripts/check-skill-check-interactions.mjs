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
const diffLearnPagePath = 'p3/topics/differentiation/learn/index.html';
const integrationLearnPagePath = 'p3/topics/integration/learn/index.html';
const iterationLearnPagePath = 'p3/topics/numerical-solution-of-equations/learn/index.html';
const deLearnPagePath = 'p3/topics/differential-equations/learn/index.html';
const complexLearnPagePath = 'p3/topics/complex-numbers/learn/index.html';
const oldAlgebraFieldGuidePagePath = 'p3/topics/algebra/field-guide/index.html';
const oldAlgebraSkillCheckPagePath = 'p3/topics/algebra/skill-check/index.html';
const oldLogExpFieldGuidePagePath = 'p3/topics/logarithmic-and-exponential-functions/field-guide/index.html';
const oldLogExpSkillCheckPagePath = 'p3/topics/logarithmic-and-exponential-functions/skill-check/index.html';
const oldTrigFieldGuidePagePath = 'p3/topics/trigonometry/field-guide/index.html';
const oldTrigSkillCheckPagePath = 'p3/topics/trigonometry/skill-check/index.html';
const oldDiffFieldGuidePagePath = 'p3/topics/differentiation/field-guide/index.html';
const oldDiffSkillCheckPagePath = 'p3/topics/differentiation/skill-check/index.html';
const oldIntegrationFieldGuidePagePath = 'p3/topics/integration/field-guide/index.html';
const oldIntegrationSkillCheckPagePath = 'p3/topics/integration/skill-check/index.html';
const oldIterationFieldGuidePagePath = 'p3/topics/numerical-solution-of-equations/field-guide/index.html';
const oldIterationSkillCheckPagePath = 'p3/topics/numerical-solution-of-equations/skill-check/index.html';
const oldDeFieldGuidePagePath = 'p3/topics/differential-equations/field-guide/index.html';
const oldDeSkillCheckPagePath = 'p3/topics/differential-equations/skill-check/index.html';
const oldComplexFieldGuidePagePath = 'p3/topics/complex-numbers/field-guide/index.html';
const oldComplexSkillCheckPagePath = 'p3/topics/complex-numbers/skill-check/index.html';

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

async function closeCorrectCelebration(page) {
  await page.evaluate(() => {
    const root = document.querySelector('[data-correct-celebration]');
    if (!(root instanceof HTMLElement) || root.hidden) return;
    const close = root.querySelector('.correct-celebration-actions [data-correct-celebration-close]');
    if (close instanceof HTMLElement) close.click();
  });
}

async function correctCelebrationState(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-correct-celebration]');
    const open = root instanceof HTMLElement && !root.hidden;
    return {
      open,
      title: open ? document.getElementById('correct-celebration-title')?.textContent?.trim() ?? '' : '',
      message: open ? document.getElementById('correct-celebration-message')?.textContent?.trim() ?? '' : '',
      primaryLabel: open ? root.querySelector('[data-correct-celebration-primary]')?.textContent?.trim() ?? '' : '',
    };
  });
}

async function submitAnswer(form, answer, options = {}) {
  await form.evaluate(() => {
    const root = document.querySelector('[data-correct-celebration]');
    if (!(root instanceof HTMLElement) || root.hidden) return;
    const close = root.querySelector('.correct-celebration-actions [data-correct-celebration-close]');
    if (close instanceof HTMLElement) close.click();
  });
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
  if (options.closeCelebration !== false) {
    await form.evaluate(() => {
      const root = document.querySelector('[data-correct-celebration]');
      if (!(root instanceof HTMLElement) || root.hidden) return;
      const close = root.querySelector('.correct-celebration-actions [data-correct-celebration-close]');
      if (close instanceof HTMLElement) close.click();
    });
  }
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
      completedDiffSteps: Object.keys(progress.regionLearning?.differentiation?.fieldGuideTopicCompletions ?? {}).length,
      completedIntegrationSteps: Object.keys(progress.regionLearning?.integration?.fieldGuideTopicCompletions ?? {}).length,
      completedIterationSteps: Object.keys(progress.regionLearning?.['numerical-solution-of-equations']?.fieldGuideTopicCompletions ?? {}).length,
      completedDeSteps: Object.keys(progress.regionLearning?.['differential-equations']?.fieldGuideTopicCompletions ?? {}).length,
      completedComplexSteps: Object.keys(progress.regionLearning?.['complex-numbers']?.fieldGuideTopicCompletions ?? {}).length,
      learningAttempts: progress.learningActivityAttempts ?? [],
      skillAttempts: progress.skillCheckAttempts ?? [],
    };
  }, storageKey);
}

for (const requiredPath of [
  algebraLearnPagePath,
  logExpLearnPagePath,
  trigLearnPagePath,
  diffLearnPagePath,
  integrationLearnPagePath,
  iterationLearnPagePath,
  deLearnPagePath,
  complexLearnPagePath,
  oldAlgebraFieldGuidePagePath,
  oldAlgebraSkillCheckPagePath,
  oldLogExpFieldGuidePagePath,
  oldLogExpSkillCheckPagePath,
  oldTrigFieldGuidePagePath,
  oldTrigSkillCheckPagePath,
  oldDiffFieldGuidePagePath,
  oldDiffSkillCheckPagePath,
  oldIntegrationFieldGuidePagePath,
  oldIntegrationSkillCheckPagePath,
  oldIterationFieldGuidePagePath,
  oldIterationSkillCheckPagePath,
  oldDeFieldGuidePagePath,
  oldDeSkillCheckPagePath,
  oldComplexFieldGuidePagePath,
  oldComplexSkillCheckPagePath,
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
      complexNumber: check({ answerType: 'complex-number', acceptedAnswers: ['2+3i'] }, '2+3i'),
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
    nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(algebraInitialShape.learnSteps === 17, `Algebra Learn Mode must render 17 authored lesson steps; saw ${algebraInitialShape.learnSteps}.`);
  assert(algebraInitialShape.visibleSteps === 1, `Learn Mode must show one step at a time; saw ${algebraInitialShape.visibleSteps}.`);
  assert(algebraInitialShape.learnForms >= 34, 'Learn Mode must render primary and similar checked answer forms.');
  assert(algebraInitialShape.oldSkillForms === 0, 'Learn Mode must not render legacy Skill Check forms.');
  assert(algebraInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Algebra problem.');
  assert(algebraInitialShape.answerRevealHidden, 'Answer reveal must be unavailable before a submitted Learn attempt.');
  assert(!algebraInitialShape.nextOpen, 'Learn Mode next button must stay disabled before the step is completed.');

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
    answerRevealHighlighted: document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.classList.contains('is-highlighted') === true,
    similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
    retryCtaVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-retry-learn-primary]')?.hidden,
    similarCtaVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-try-learn-similar]')?.hidden,
    retryCtaFocused: document.activeElement === document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-retry-learn-primary]'),
    learnMistakePanelMissing: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-mistake-tag-panel]'),
    transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
    nextStillOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    celebrationOpen: Boolean(document.querySelector('[data-correct-celebration]:not([hidden])')),
  }));
  const algebraWrongProgress = await progressSnapshot(page);
  assert(algebraWrongProgress.learningCount === 1, 'Wrong Learn attempt must be saved as learning activity.');
  assert(algebraWrongProgress.skillCount === 0, 'Wrong Learn attempt must not create Skill Check pass evidence.');
  assert(algebraWrongState.hintVisible, 'Wrong Learn attempt must reveal the hint.');
  assert(algebraWrongState.afterAttemptVisible, 'Wrong Learn attempt must reveal explanation/principle support.');
  assert(algebraWrongState.answerRevealVisible, 'Answer reveal must become available after a submitted attempt.');
  assert(algebraWrongState.answerRevealHighlighted, 'Wrong Learn attempt must highlight the answer reveal control.');
  assert(algebraWrongState.similarVisible, 'Similar checked question must appear after the primary action is checked.');
  assert(algebraWrongState.retryCtaVisible, 'Wrong Learn attempt must show a retry button for the first checked setup.');
  assert(algebraWrongState.similarCtaVisible, 'Wrong Learn attempt must show a Try a similar question button.');
  assert(algebraWrongState.retryCtaFocused, 'Wrong Learn attempt must focus the retry-first action before the similar action.');
  assert(algebraWrongState.learnMistakePanelMissing, 'Learn Mode must not ask students to choose what went wrong after a miss.');
  assert(algebraWrongState.transferHidden, 'Exam transfer must stay hidden until the similar checked question is attempted.');
  assert(!algebraWrongState.nextStillOpen, 'Wrong primary attempt must keep navigation locked without completing the step.');
  assert(!algebraWrongState.celebrationOpen, 'Wrong Learn attempt must not open the correct-answer celebration modal.');

  await algebraPrimary.locator('[data-retry-learn-primary]').click();
  const algebraRetryState = await page.evaluate(() => {
    const input = document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [name="submittedAnswer"]');
    return {
      answerCleared: input instanceof HTMLInputElement && input.value === '',
      inputFocused: document.activeElement === input,
      explanationStillVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden,
    };
  });
  assert(algebraRetryState.answerCleared, 'Retrying the first Learn setup must clear the previous wrong answer.');
  assert(algebraRetryState.inputFocused, 'Retrying the first Learn setup must focus the original answer input.');
  assert(algebraRetryState.explanationStillVisible, 'Retrying the first Learn setup must keep the explanation available.');

  await submitAnswer(algebraPrimary, '2', { closeCelebration: false });
  const learnCelebration = await correctCelebrationState(page);
  assert(learnCelebration.open, 'Correct Learn answer must open the correct-answer celebration modal.');
  assert(learnCelebration.title === 'Correct', 'Correct Learn celebration must use a direct success title.');
  assert(learnCelebration.message.includes('similar question'), 'Primary Learn celebration must direct the student to the similar question when required.');
  assert(learnCelebration.primaryLabel === 'Try a similar question', 'Primary Learn celebration must expose the similar-question action.');
  await closeCorrectCelebration(page);
  await submitAnswer(algebraSimilar, '-3');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 3
      && Object.keys(progress.regionLearning?.algebra?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const algebraHintedState = await progressSnapshot(page);
  assert(algebraHintedState.skillCount === 0, 'Learn answers must not create checked Skill Check evidence.');
  assert(algebraHintedState.completedAlgebraSteps === 1, 'Similar checked answer must complete the Learn step.');

  await resetPageProgress(page);
  const cleanAlgebraCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(cleanAlgebraCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), '2');
  await submitAnswer(cleanAlgebraCard.locator('[data-check-learn-answer][data-learn-variant="similar"]'), '-3');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 2
      && Object.keys(progress.regionLearning?.algebra?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanAlgebraState = await progressSnapshot(page);
  assert(cleanAlgebraState.learningCount === 2, 'Clean primary and similar answers must be recorded as Learn activity.');
  assert(cleanAlgebraState.skillCount === 0, 'Clean Algebra Learn answers must not create checked evidence.');

  await waitForStaticEnhancement(page, oldAlgebraSkillCheckPagePath);
  await resetPageProgress(page);
  const checkedPracticeShape = await page.evaluate(() => ({
    hasTitle: document.body.innerText.includes('Algebra Checked Practice'),
    skillForms: document.querySelectorAll('[data-check-skill-answer]').length,
    learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
    visibleSkillForm: Boolean(document.querySelector('[data-check-skill-answer]')?.closest('.practice-card:not([hidden])')),
  }));
  assert(checkedPracticeShape.hasTitle, 'Algebra Checked Practice must render as its own page.');
  assert(checkedPracticeShape.skillForms > 0, 'Checked Practice must render deterministic Skill Check forms.');
  assert(checkedPracticeShape.learnForms === 0, 'Checked Practice must not render Learn forms.');
  assert(checkedPracticeShape.visibleSkillForm, 'A fresh student must see a Checked Practice question without Learn progress.');
  await submitAnswer(page.locator('.practice-card:not([hidden]) [data-check-skill-answer]').first(), 'both-roots', { closeCelebration: false });
  const checkedCelebration = await correctCelebrationState(page);
  assert(checkedCelebration.open, 'Correct Checked Practice answer must open the correct-answer celebration modal.');
  assert(checkedCelebration.message.includes('deterministic Checked Practice evidence'), 'Checked Practice celebration must preserve checked-evidence wording.');
  assert(checkedCelebration.primaryLabel.length > 0, 'Checked Practice celebration must expose a primary continuation action.');
  await closeCorrectCelebration(page);
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.skillCheckAttempts?.length ?? 0) === 1;
  });
  const directCheckedState = await progressSnapshot(page);
  assert(directCheckedState.learningCount === 0, 'Direct Checked Practice must not create Learn attempts.');
  assert(directCheckedState.skillCount === 1 && directCheckedState.firstSkillClean, 'Direct Checked Practice must create clean checked evidence.');

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
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
    };
  });
  assert(logExpInitialShape.hasLogExpTitle, 'Log/Exp Learn page must render.');
  assert(logExpInitialShape.learnSteps === 17, `Log/Exp Learn Mode must render 17 authored steps; saw ${logExpInitialShape.learnSteps}.`);
  assert(logExpInitialShape.visibleSteps === 1, 'Log/Exp Learn Mode must show one active step.');
  assert(logExpInitialShape.learnForms >= 34, 'Log/Exp Learn Mode must render primary and similar checked forms.');
  assert(logExpInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Log/Exp problem.');
  assert(logExpInitialShape.explanationHidden, 'Log/Exp explanation must be hidden before attempt.');
  assert(logExpInitialShape.principleHidden, 'Log/Exp principle must be hidden before attempt.');
  assert(logExpInitialShape.similarHidden, 'Log/Exp similar question must be hidden before primary attempt.');
  assert(logExpInitialShape.transferHidden, 'Log/Exp exam transfer must be hidden before primary attempt.');
  assert(logExpInitialShape.answerRevealHidden, 'Log/Exp answer reveal must be unavailable before first submitted attempt.');
  assert(!logExpInitialShape.nextOpen, 'Log/Exp next button must stay disabled before the step is completed.');

  const logExpOptionForm = page.locator('[data-learn-step-card]:not([hidden]) [data-check-learn-answer][data-learn-variant="primary"]').first();
  await logExpOptionForm.locator('.learn-option-bank label').first().click();
  const logExpOptionClickState = await page.evaluate((key) => {
    const progress = JSON.parse(window.localStorage.getItem(key) || '{}');
    const form = document.querySelector('[data-learn-step-card]:not([hidden]) [data-check-learn-answer][data-learn-variant="primary"]');
    return {
      selectedOptions: form?.querySelectorAll('input[name="submittedAnswer"]:checked').length ?? 0,
      feedbackText: form?.querySelector('.skill-check-feedback')?.textContent?.trim() ?? '',
      learningCount: progress.learningActivityAttempts?.length ?? 0,
      skillCount: progress.skillCheckAttempts?.length ?? 0,
    };
  }, storageKey);
  assert(logExpOptionClickState.selectedOptions === 1, 'Clicking a Learn Mode option label must select the radio input.');
  assert(logExpOptionClickState.feedbackText === '', 'Selecting a Learn Mode option must not submit automatically.');
  assert(logExpOptionClickState.learningCount === 0 && logExpOptionClickState.skillCount === 0, 'Selecting a Learn Mode option must not create saved evidence.');

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
    nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(logExpAfterPrimary.explanationVisible, 'Log/Exp explanation must reveal after primary attempt.');
  assert(logExpAfterPrimary.principleVisible, 'Log/Exp principle must reveal after primary attempt.');
  assert(logExpAfterPrimary.similarVisible, 'Log/Exp similar checked question must reveal after primary attempt.');
  assert(logExpAfterPrimary.transferHidden, 'Log/Exp exam transfer must stay hidden until similar attempt.');
  assert(!logExpAfterPrimary.nextOpen, 'Primary-only answer must keep navigation locked while the similar check remains required.');

  await submitAnswer(logExpSimilar, 'log_5(25)=2');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 2
      && Object.keys(progress.regionLearning?.['logarithmic-and-exponential-functions']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanLogExpState = await progressSnapshot(page);
  assert(cleanLogExpState.learningCount === 2, 'Clean Log/Exp primary and similar answers must save Learn activity.');
  assert(cleanLogExpState.skillCount === 0, 'Clean Log/Exp Learn answers must not create checked evidence.');

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
  assert(trigInitialShape.learnSteps === 14, `Trigonometry Learn Mode must render 14 authored steps; saw ${trigInitialShape.learnSteps}.`);
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
    nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(trigAfterPrimary.explanationVisible, 'Explanation must reveal after primary attempt.');
  assert(trigAfterPrimary.principleVisible, 'Principle must reveal after primary attempt.');
  assert(trigAfterPrimary.similarVisible, 'Similar checked question must reveal after primary attempt.');
  assert(trigAfterPrimary.transferHidden, 'Exam transfer must stay hidden until similar attempt.');
  assert(!trigAfterPrimary.nextOpen, 'Primary-only answer must keep navigation locked while the similar check remains required.');

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
    return (progress.learningActivityAttempts?.length ?? 0) >= 2
      && Object.keys(progress.regionLearning?.trigonometry?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanTrigState = await progressSnapshot(page);
  assert(cleanTrigState.learningCount === 2, 'Clean Trigonometry primary and similar answers must save Learn activity.');
  assert(cleanTrigState.skillCount === 0, 'Clean Trigonometry Learn answers must not create checked evidence.');
  assert(cleanTrigState.learningAttempts[0]?.strongEvidence === true, 'Clean primary checked work remains strong Learn activity evidence.');

  await waitForStaticEnhancement(page, diffLearnPagePath);
  await resetPageProgress(page);
  const diffInitialShape = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    const text = document.body.innerText;
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return {
      hasDiffTitle: text.includes('Differentiation'),
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((step) => !step.hidden).length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
      oldSkillForms: document.querySelectorAll('[data-check-skill-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden),
      principleHidden: !text.includes('Principle: choose the rule from the structure before calculating.'),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
      passiveLearningCount: progress.learningActivityAttempts?.length ?? 0,
      passiveSkillCount: progress.skillCheckAttempts?.length ?? 0,
    };
  });
  assert(diffInitialShape.hasDiffTitle, 'Differentiation Learn page must render.');
  assert(diffInitialShape.learnSteps === 15, `Differentiation Learn Mode must render 15 authored steps; saw ${diffInitialShape.learnSteps}.`);
  assert(diffInitialShape.visibleSteps === 1, 'Differentiation Learn Mode must show one active step.');
  assert(diffInitialShape.learnForms >= 30, 'Differentiation Learn Mode must render primary and similar checked forms.');
  assert(diffInitialShape.oldSkillForms === 0, 'Differentiation Learn Mode must not render legacy Skill Check forms.');
  assert(diffInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Differentiation problem.');
  assert(diffInitialShape.answerControlInFirstViewport, 'First viewport must show the first Differentiation answer control.');
  assert(diffInitialShape.checkButtonInFirstViewport, 'First viewport must show the Differentiation Check answer button.');
  assert(diffInitialShape.radioInputs >= 2, 'Differentiation option prompts must render real radio controls.');
  assert(diffInitialShape.explanationHidden, 'Differentiation explanation must be hidden before attempt.');
  assert(diffInitialShape.principleHidden, 'Differentiation principle must be hidden before attempt.');
  assert(diffInitialShape.similarHidden, 'Differentiation similar question must be hidden before primary attempt.');
  assert(diffInitialShape.transferHidden, 'Differentiation exam transfer must be hidden before primary/similar attempt.');
  assert(diffInitialShape.answerRevealHidden, 'Differentiation answer reveal must be unavailable before first submitted attempt.');
  assert(!diffInitialShape.nextOpen, 'Differentiation next button must stay disabled before the step is completed.');
  assert(diffInitialShape.passiveLearningCount === 0 && diffInitialShape.passiveSkillCount === 0, 'Passive Differentiation page view must not create evidence.');

  const diffCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  const diffPrimary = diffCard.locator('[data-check-learn-answer][data-learn-variant="primary"]');
  const diffSimilar = diffCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await diffPrimary.locator('input[name="submittedAnswer"][value="correct"]').check();
  assert(await diffPrimary.locator('input[name="submittedAnswer"][value="correct"]').isChecked(), 'Differentiation radio options must be clickable.');
  await submitAnswer(diffPrimary, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 1;
  });
  const diffAfterPrimary = await page.evaluate(() => ({
    explanationVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden,
    principleVisible: document.body.innerText.includes('Principle: choose the rule from the structure before calculating.'),
    similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
    transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
    answerRevealVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden,
    nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(diffAfterPrimary.explanationVisible, 'Differentiation explanation must reveal after primary attempt.');
  assert(diffAfterPrimary.principleVisible, 'Differentiation principle must reveal after primary attempt.');
  assert(diffAfterPrimary.similarVisible, 'Differentiation similar checked question must reveal after primary attempt.');
  assert(diffAfterPrimary.transferHidden, 'Differentiation exam transfer must stay hidden until similar attempt.');
  assert(diffAfterPrimary.answerRevealVisible, 'Differentiation answer reveal must become available after a submitted attempt.');
  assert(!diffAfterPrimary.nextOpen, 'Primary-only answer must keep navigation locked while the similar check remains required.');

  await submitAnswer(diffSimilar, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 2
      && Object.keys(progress.regionLearning?.differentiation?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanDiffState = await progressSnapshot(page);
  const cleanDiffUi = await page.evaluate(() => ({
    transferVisible: !document.querySelector('[data-learn-exam-transfer]')?.hidden,
    nextUnlocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(cleanDiffState.learningCount === 2, 'Clean Differentiation primary and similar answers must save Learn activity.');
  assert(cleanDiffState.skillCount === 0, 'Clean Differentiation Learn answers must not create checked evidence.');
  assert(cleanDiffState.completedDiffSteps === 1, 'Correct similar Differentiation answer must complete the lesson step.');
  assert(cleanDiffUi.transferVisible, 'Differentiation exam transfer must appear after the similar question is attempted.');
  assert(cleanDiffUi.nextUnlocked, 'Correct Differentiation similar question must unlock the next Learn step.');

  await page.locator('.learn-controls button', { hasText: 'Next step' }).click();
  const diffTypedHelp = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const label = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"] label.single-answer-field');
    const input = label?.querySelector('input[name="submittedAnswer"][type="text"]');
    const help = label?.querySelector('.answer-format-guidance')?.textContent || '';
    const inputRect = input?.getBoundingClientRect();
    const helpRect = label?.querySelector('.answer-format-guidance')?.getBoundingClientRect();
    return {
      stepId: activeCard?.getAttribute('data-learn-step-id'),
      hasTextInput: Boolean(input),
      helpText: help,
      helpNearInput: Boolean(inputRect && helpRect && Math.abs(helpRect.bottom - inputRect.top) < 36),
    };
  });
  assert(diffTypedHelp.stepId === 'learn-diff-power-negative-fractional', 'Differentiation second step should expose a typed input.');
  assert(diffTypedHelp.hasTextInput, 'Differentiation typed steps must render a text answer input.');
  assert(/Answer format: type a compact expression using \^ for powers\./i.test(diffTypedHelp.helpText), `Differentiation typed input must show answer-format help; saw "${diffTypedHelp.helpText}".`);
  assert(diffTypedHelp.helpNearInput, 'Differentiation answer-format help must be placed near the typed input.');

  await resetPageProgress(page);
  const hintedDiffCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(hintedDiffCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const hintedDiffSimilar = hintedDiffCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await hintedDiffSimilar.locator('[data-show-learn-hint]').click();
  await submitAnswer(hintedDiffSimilar, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 2
      && Object.keys(progress.regionLearning?.differentiation?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const hintedDiffState = await progressSnapshot(page);
  assert(hintedDiffState.skillCount === 0, 'Hinted Differentiation similar answer must not mirror into strong Skill Check evidence.');
  assert(hintedDiffState.learningAttempts.at(-1)?.strongEvidence === false, 'Hinted Differentiation answer must remain weak Learn evidence.');

  await resetPageProgress(page);
  const revealedDiffCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(revealedDiffCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const revealedDiffSimilar = revealedDiffCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(revealedDiffSimilar, 'definitely wrong');
  await revealedDiffSimilar.locator('[data-learn-answer-reveal] summary').click();
  await submitAnswer(revealedDiffSimilar, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 3
      && Object.keys(progress.regionLearning?.differentiation?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const revealedDiffState = await progressSnapshot(page);
  assert(revealedDiffState.skillCount === 0, 'Revealed Differentiation answer must not mirror into strong Skill Check evidence.');

  await waitForStaticEnhancement(page, integrationLearnPagePath);
  await resetPageProgress(page);
  const integrationInitialShape = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    const text = document.body.innerText;
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return {
      hasIntegrationTitle: text.includes('Integration'),
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((step) => !step.hidden).length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
      oldSkillForms: document.querySelectorAll('[data-check-skill-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden),
      principleHidden: !text.includes('Principle: choose the integration method from the structure before calculating.'),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
      passiveLearningCount: progress.learningActivityAttempts?.length ?? 0,
      passiveSkillCount: progress.skillCheckAttempts?.length ?? 0,
    };
  });
  assert(integrationInitialShape.hasIntegrationTitle, 'Integration Learn page must render.');
  assert(integrationInitialShape.learnSteps === 14, `Integration Learn Mode must render 14 authored steps; saw ${integrationInitialShape.learnSteps}.`);
  assert(integrationInitialShape.visibleSteps === 1, 'Integration Learn Mode must show one active step.');
  assert(integrationInitialShape.learnForms >= 28, 'Integration Learn Mode must render primary and similar checked forms.');
  assert(integrationInitialShape.oldSkillForms === 0, 'Integration Learn Mode must not render legacy Skill Check forms.');
  assert(integrationInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Integration problem.');
  assert(integrationInitialShape.answerControlInFirstViewport, 'First viewport must show the first Integration answer control.');
  assert(integrationInitialShape.checkButtonInFirstViewport, 'First viewport must show the Integration Check answer button.');
  assert(integrationInitialShape.radioInputs >= 2, 'Integration option prompts must render real radio controls.');
  assert(integrationInitialShape.explanationHidden, 'Integration explanation must be hidden before attempt.');
  assert(integrationInitialShape.principleHidden, 'Integration principle must be hidden before attempt.');
  assert(integrationInitialShape.similarHidden, 'Integration similar question must be hidden before primary attempt.');
  assert(integrationInitialShape.transferHidden, 'Integration exam transfer must be hidden before primary/similar attempt.');
  assert(integrationInitialShape.answerRevealHidden, 'Integration answer reveal must be unavailable before first submitted attempt.');
  assert(!integrationInitialShape.nextOpen, 'Integration next button must stay disabled before the step is completed.');
  assert(integrationInitialShape.passiveLearningCount === 0 && integrationInitialShape.passiveSkillCount === 0, 'Passive Integration page view must not create evidence.');

  const integrationCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  const integrationPrimary = integrationCard.locator('[data-check-learn-answer][data-learn-variant="primary"]');
  const integrationSimilar = integrationCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await integrationPrimary.locator('input[name="submittedAnswer"][value="correct"]').check();
  assert(await integrationPrimary.locator('input[name="submittedAnswer"][value="correct"]').isChecked(), 'Integration radio options must be clickable.');
  await submitAnswer(integrationPrimary, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 1;
  });
  const integrationAfterPrimary = await page.evaluate(() => ({
    explanationVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden,
    principleVisible: document.body.innerText.includes('Principle: choose the integration method from the structure before calculating.'),
    similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
    transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
    answerRevealVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden,
    nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(integrationAfterPrimary.explanationVisible, 'Integration explanation must reveal after primary attempt.');
  assert(integrationAfterPrimary.principleVisible, 'Integration principle must reveal after primary attempt.');
  assert(integrationAfterPrimary.similarVisible, 'Integration similar checked question must reveal after primary attempt.');
  assert(integrationAfterPrimary.transferHidden, 'Integration exam transfer must stay hidden until similar attempt.');
  assert(integrationAfterPrimary.answerRevealVisible, 'Integration answer reveal must become available after a submitted attempt.');
  assert(!integrationAfterPrimary.nextOpen, 'Primary-only answer must keep navigation locked while the similar check remains required.');

  await submitAnswer(integrationSimilar, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 2
      && Object.keys(progress.regionLearning?.integration?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanIntegrationState = await progressSnapshot(page);
  const cleanIntegrationUi = await page.evaluate(() => ({
    transferVisible: !document.querySelector('[data-learn-exam-transfer]')?.hidden,
    nextUnlocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(cleanIntegrationState.learningCount === 2, 'Clean Integration primary and similar answers must save Learn activity.');
  assert(cleanIntegrationState.skillCount === 0, 'Clean Integration Learn answers must not create checked evidence.');
  assert(cleanIntegrationState.completedIntegrationSteps === 1, 'Correct similar Integration answer must complete the lesson step.');
  assert(cleanIntegrationUi.transferVisible, 'Integration exam transfer must appear after the similar question is attempted.');
  assert(cleanIntegrationUi.nextUnlocked, 'Correct Integration similar question must unlock the next Learn step.');

  await page.locator('.learn-controls button', { hasText: 'Next step' }).click();
  const integrationTypedHelp = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const label = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"] label.single-answer-field');
    const input = label?.querySelector('input[name="submittedAnswer"][type="text"]');
    const help = label?.querySelector('.answer-format-guidance')?.textContent || '';
    const inputRect = input?.getBoundingClientRect();
    const helpRect = label?.querySelector('.answer-format-guidance')?.getBoundingClientRect();
    return {
      stepId: activeCard?.getAttribute('data-learn-step-id'),
      hasTextInput: Boolean(input),
      helpText: help,
      helpNearInput: Boolean(inputRect && helpRect && Math.abs(helpRect.bottom - inputRect.top) < 36),
    };
  });
  assert(integrationTypedHelp.stepId === 'learn-int-power-negative-fractional', 'Integration second step should expose a typed input.');
  assert(integrationTypedHelp.hasTextInput, 'Integration typed steps must render a text answer input.');
  assert(/Answer format: type a compact expression using \^ for powers\./i.test(integrationTypedHelp.helpText), `Integration typed input must show answer-format help; saw "${integrationTypedHelp.helpText}".`);
  assert(integrationTypedHelp.helpNearInput, 'Integration answer-format help must be placed near the typed input.');

  await resetPageProgress(page);
  const hintedIntegrationCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(hintedIntegrationCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const hintedIntegrationSimilar = hintedIntegrationCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await hintedIntegrationSimilar.locator('[data-show-learn-hint]').click();
  await submitAnswer(hintedIntegrationSimilar, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 2
      && Object.keys(progress.regionLearning?.integration?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const hintedIntegrationState = await progressSnapshot(page);
  assert(hintedIntegrationState.skillCount === 0, 'Hinted Integration similar answer must not mirror into strong Skill Check evidence.');
  assert(hintedIntegrationState.learningAttempts.at(-1)?.strongEvidence === false, 'Hinted Integration answer must remain weak Learn evidence.');

  await resetPageProgress(page);
  const revealedIntegrationCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(revealedIntegrationCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const revealedIntegrationSimilar = revealedIntegrationCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(revealedIntegrationSimilar, 'definitely wrong');
  await revealedIntegrationSimilar.locator('[data-learn-answer-reveal] summary').click();
  await submitAnswer(revealedIntegrationSimilar, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 3
      && Object.keys(progress.regionLearning?.integration?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const revealedIntegrationState = await progressSnapshot(page);
  assert(revealedIntegrationState.skillCount === 0, 'Revealed Integration answer must not mirror into strong Skill Check evidence.');

  await waitForStaticEnhancement(page, iterationLearnPagePath);
  await resetPageProgress(page);
  const iterationInitialShape = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    const text = document.body.innerText;
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return {
      hasIterationTitle: text.includes('Numerical Solution of Equations'),
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((step) => !step.hidden).length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
      oldSkillForms: document.querySelectorAll('[data-check-skill-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden),
      principleHidden: !text.includes('Principle: a numerical root is an x-value where the equation is satisfied, often seen as an axis crossing or graph intersection.'),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
      passiveLearningCount: progress.learningActivityAttempts?.length ?? 0,
      passiveSkillCount: progress.skillCheckAttempts?.length ?? 0,
    };
  });
  assert(iterationInitialShape.hasIterationTitle, 'Numerical Solution Learn page must render.');
  assert(iterationInitialShape.learnSteps === 12, `Iteration Learn Mode must render 12 authored steps; saw ${iterationInitialShape.learnSteps}.`);
  assert(iterationInitialShape.visibleSteps === 1, 'Iteration Learn Mode must show one active step.');
  assert(iterationInitialShape.learnForms >= 24, 'Iteration Learn Mode must render primary and similar checked forms.');
  assert(iterationInitialShape.oldSkillForms === 0, 'Iteration Learn Mode must not render legacy Skill Check forms.');
  assert(iterationInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Iteration problem.');
  assert(iterationInitialShape.answerControlInFirstViewport, 'First viewport must show the first Iteration answer control.');
  assert(iterationInitialShape.checkButtonInFirstViewport, 'First viewport must show the Iteration Check answer button.');
  assert(iterationInitialShape.radioInputs >= 2, 'Iteration option prompts must render real radio controls.');
  assert(iterationInitialShape.explanationHidden, 'Iteration explanation must be hidden before attempt.');
  assert(iterationInitialShape.principleHidden, 'Iteration principle must be hidden before attempt.');
  assert(iterationInitialShape.similarHidden, 'Iteration similar question must be hidden before primary attempt.');
  assert(iterationInitialShape.transferHidden, 'Iteration exam transfer must be hidden before primary/similar attempt.');
  assert(iterationInitialShape.answerRevealHidden, 'Iteration answer reveal must be unavailable before first submitted attempt.');
  assert(!iterationInitialShape.nextOpen, 'Iteration next button must stay disabled before the step is completed.');
  assert(iterationInitialShape.passiveLearningCount === 0 && iterationInitialShape.passiveSkillCount === 0, 'Passive Iteration page view must not create evidence.');

  const iterationCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  const iterationPrimary = iterationCard.locator('[data-check-learn-answer][data-learn-variant="primary"]');
  const iterationSimilar = iterationCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await iterationPrimary.locator('input[name="submittedAnswer"][value="correct"]').check();
  assert(await iterationPrimary.locator('input[name="submittedAnswer"][value="correct"]').isChecked(), 'Iteration radio options must be clickable.');
  await submitAnswer(iterationPrimary, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 1;
  });
  const iterationAfterPrimary = await page.evaluate(() => ({
    explanationVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden,
    principleVisible: document.body.innerText.includes('Principle: a numerical root is an x-value where the equation is satisfied, often seen as an axis crossing or graph intersection.'),
    similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
    transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
    answerRevealVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden,
    nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(iterationAfterPrimary.explanationVisible, 'Iteration explanation must reveal after primary attempt.');
  assert(iterationAfterPrimary.principleVisible, 'Iteration principle must reveal after primary attempt.');
  assert(iterationAfterPrimary.similarVisible, 'Iteration similar checked question must reveal after primary attempt.');
  assert(iterationAfterPrimary.transferHidden, 'Iteration exam transfer must stay hidden until similar attempt.');
  assert(iterationAfterPrimary.answerRevealVisible, 'Iteration answer reveal must become available after a submitted attempt.');
  assert(!iterationAfterPrimary.nextOpen, 'Primary-only answer must keep navigation locked while the similar check remains required.');

  await submitAnswer(iterationSimilar, 'intersection');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 2
      && Object.keys(progress.regionLearning?.['numerical-solution-of-equations']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanIterationState = await progressSnapshot(page);
  const cleanIterationUi = await page.evaluate(() => ({
    transferVisible: !document.querySelector('[data-learn-exam-transfer]')?.hidden,
    nextUnlocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(cleanIterationState.learningCount === 2, 'Clean Iteration primary and similar answers must save Learn activity.');
  assert(cleanIterationState.skillCount === 0, 'Clean Iteration Learn answers must not create checked evidence.');
  assert(cleanIterationState.completedIterationSteps === 1, 'Correct similar Iteration answer must complete the lesson step.');
  assert(cleanIterationUi.transferVisible, 'Iteration exam transfer must appear after the similar question is attempted.');
  assert(cleanIterationUi.nextUnlocked, 'Correct Iteration similar question must unlock the next Learn step.');

  await page.locator('.learn-controls button', { hasText: 'Next step' }).click();
  const iterationTypedHelp = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const label = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"] label.single-answer-field');
    const input = label?.querySelector('input[name="submittedAnswer"][type="text"]');
    const help = label?.querySelector('.answer-format-guidance')?.textContent || '';
    const inputRect = input?.getBoundingClientRect();
    const helpRect = label?.querySelector('.answer-format-guidance')?.getBoundingClientRect();
    return {
      stepId: activeCard?.getAttribute('data-learn-step-id'),
      hasTextInput: Boolean(input),
      helpText: help,
      helpNearInput: Boolean(inputRect && helpRect && Math.abs(helpRect.bottom - inputRect.top) < 36),
    };
  });
  assert(iterationTypedHelp.stepId === 'learn-iteration-rearrange-fixed-point', 'Iteration second step should expose a typed input.');
  assert(iterationTypedHelp.hasTextInput, 'Iteration typed steps must render a text answer input.');
  assert(/Answer format: type a compact expression using \^ for powers\./i.test(iterationTypedHelp.helpText), `Iteration typed input must show answer-format help; saw "${iterationTypedHelp.helpText}".`);
  assert(iterationTypedHelp.helpNearInput, 'Iteration answer-format help must be placed near the typed input.');

  await resetPageProgress(page);
  const hintedIterationCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(hintedIterationCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const hintedIterationSimilar = hintedIterationCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await hintedIterationSimilar.locator('[data-show-learn-hint]').click();
  await submitAnswer(hintedIterationSimilar, 'intersection');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 2
      && Object.keys(progress.regionLearning?.['numerical-solution-of-equations']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const hintedIterationState = await progressSnapshot(page);
  assert(hintedIterationState.skillCount === 0, 'Hinted Iteration similar answer must not mirror into strong Skill Check evidence.');
  assert(hintedIterationState.learningAttempts.at(-1)?.strongEvidence === false, 'Hinted Iteration answer must remain weak Learn evidence.');

  await resetPageProgress(page);
  const revealedIterationCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(revealedIterationCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const revealedIterationSimilar = revealedIterationCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(revealedIterationSimilar, 'definitely wrong');
  await revealedIterationSimilar.locator('[data-learn-answer-reveal] summary').click();
  await submitAnswer(revealedIterationSimilar, 'intersection');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 3
      && Object.keys(progress.regionLearning?.['numerical-solution-of-equations']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const revealedIterationState = await progressSnapshot(page);
  assert(revealedIterationState.skillCount === 0, 'Revealed Iteration answer must not mirror into strong Skill Check evidence.');

  await waitForStaticEnhancement(page, deLearnPagePath);
  await resetPageProgress(page);
  const deInitialShape = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    const text = document.body.innerText;
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return {
      hasDeTitle: text.includes('Differential Equations'),
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((step) => !step.hidden).length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
      oldSkillForms: document.querySelectorAll('[data-check-skill-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden),
      principleHidden: !text.includes('Principle: separable differential equations can be rearranged into a y-side and an x-side.'),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
      passiveLearningCount: progress.learningActivityAttempts?.length ?? 0,
      passiveSkillCount: progress.skillCheckAttempts?.length ?? 0,
    };
  });
  assert(deInitialShape.hasDeTitle, 'Differential Equations Learn page must render.');
  assert(deInitialShape.learnSteps === 12, `Differential Equations Learn Mode must render 12 authored steps; saw ${deInitialShape.learnSteps}.`);
  assert(deInitialShape.visibleSteps === 1, 'Differential Equations Learn Mode must show one active step.');
  assert(deInitialShape.learnForms >= 24, 'Differential Equations Learn Mode must render primary and similar checked forms.');
  assert(deInitialShape.oldSkillForms === 0, 'Differential Equations Learn Mode must not render legacy Skill Check forms.');
  assert(deInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Differential Equations problem.');
  assert(deInitialShape.answerControlInFirstViewport, 'First viewport must show the first Differential Equations answer control.');
  assert(deInitialShape.checkButtonInFirstViewport, 'First viewport must show the Differential Equations Check answer button.');
  assert(deInitialShape.radioInputs >= 2, 'Differential Equations option prompts must render real radio controls.');
  assert(deInitialShape.explanationHidden, 'Differential Equations explanation must be hidden before attempt.');
  assert(deInitialShape.principleHidden, 'Differential Equations principle must be hidden before attempt.');
  assert(deInitialShape.similarHidden, 'Differential Equations similar question must be hidden before primary attempt.');
  assert(deInitialShape.transferHidden, 'Differential Equations exam transfer must be hidden before primary/similar attempt.');
  assert(deInitialShape.answerRevealHidden, 'Differential Equations answer reveal must be unavailable before first submitted attempt.');
  assert(!deInitialShape.nextOpen, 'Differential Equations next button must stay disabled before the step is completed.');
  assert(deInitialShape.passiveLearningCount === 0 && deInitialShape.passiveSkillCount === 0, 'Passive Differential Equations page view must not create evidence.');

  const deCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  const dePrimary = deCard.locator('[data-check-learn-answer][data-learn-variant="primary"]');
  const deSimilar = deCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await dePrimary.locator('input[name="submittedAnswer"][value="correct"]').check();
  assert(await dePrimary.locator('input[name="submittedAnswer"][value="correct"]').isChecked(), 'Differential Equations radio options must be clickable.');
  await submitAnswer(dePrimary, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 1;
  });
  const deAfterPrimary = await page.evaluate(() => ({
    explanationVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden,
    principleVisible: document.body.innerText.includes('Principle: separable differential equations can be rearranged into a y-side and an x-side.'),
    similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
    transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
    answerRevealVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden,
    nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(deAfterPrimary.explanationVisible, 'Differential Equations explanation must reveal after primary attempt.');
  assert(deAfterPrimary.principleVisible, 'Differential Equations principle must reveal after primary attempt.');
  assert(deAfterPrimary.similarVisible, 'Differential Equations similar checked question must reveal after primary attempt.');
  assert(deAfterPrimary.transferHidden, 'Differential Equations exam transfer must stay hidden until similar attempt.');
  assert(deAfterPrimary.answerRevealVisible, 'Differential Equations answer reveal must become available after a submitted attempt.');
  assert(!deAfterPrimary.nextOpen, 'Primary-only answer must keep navigation locked while the similar check remains required.');

  await submitAnswer(deSimilar, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 2
      && Object.keys(progress.regionLearning?.['differential-equations']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanDeState = await progressSnapshot(page);
  const cleanDeUi = await page.evaluate(() => ({
    transferVisible: !document.querySelector('[data-learn-exam-transfer]')?.hidden,
    nextUnlocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(cleanDeState.learningCount === 2, 'Clean Differential Equations primary and similar answers must save Learn activity.');
  assert(cleanDeState.skillCount === 0, 'Clean Differential Equations Learn answers must not create checked evidence.');
  assert(cleanDeState.completedDeSteps === 1, 'Correct similar Differential Equations answer must complete the lesson step.');
  assert(cleanDeUi.transferVisible, 'Differential Equations exam transfer must appear after the similar question is attempted.');
  assert(cleanDeUi.nextUnlocked, 'Correct Differential Equations similar question must unlock the next Learn step.');

  await page.locator('.learn-controls button', { hasText: 'Next step' }).click();
  const deTypedHelp = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const label = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"] label.single-answer-field');
    const input = label?.querySelector('input[name="submittedAnswer"][type="text"]');
    const help = label?.querySelector('.answer-format-guidance')?.textContent || '';
    const inputRect = input?.getBoundingClientRect();
    const helpRect = label?.querySelector('.answer-format-guidance')?.getBoundingClientRect();
    return {
      stepId: activeCard?.getAttribute('data-learn-step-id'),
      hasTextInput: Boolean(input),
      helpText: help,
      helpNearInput: Boolean(inputRect && helpRect && Math.abs(helpRect.bottom - inputRect.top) < 36),
    };
  });
  assert(deTypedHelp.stepId === 'learn-de-separate-variables', 'Differential Equations second step should expose a typed input.');
  assert(deTypedHelp.hasTextInput, 'Differential Equations typed steps must render a text answer input.');
  assert(/Answer format: type a compact expression using \^ for powers\./i.test(deTypedHelp.helpText), `Differential Equations typed input must show answer-format help; saw "${deTypedHelp.helpText}".`);
  assert(deTypedHelp.helpNearInput, 'Differential Equations answer-format help must be placed near the typed input.');

  await resetPageProgress(page);
  const hintedDeCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(hintedDeCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const hintedDeSimilar = hintedDeCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await hintedDeSimilar.locator('[data-show-learn-hint]').click();
  await submitAnswer(hintedDeSimilar, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 2
      && Object.keys(progress.regionLearning?.['differential-equations']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const hintedDeState = await progressSnapshot(page);
  assert(hintedDeState.skillCount === 0, 'Hinted Differential Equations similar answer must not mirror into strong Skill Check evidence.');
  assert(hintedDeState.learningAttempts.at(-1)?.strongEvidence === false, 'Hinted Differential Equations answer must remain weak Learn evidence.');

  await resetPageProgress(page);
  const revealedDeCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(revealedDeCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const revealedDeSimilar = revealedDeCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(revealedDeSimilar, 'definitely wrong');
  await revealedDeSimilar.locator('[data-learn-answer-reveal] summary').click();
  await submitAnswer(revealedDeSimilar, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 3
      && Object.keys(progress.regionLearning?.['differential-equations']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const revealedDeState = await progressSnapshot(page);
  assert(revealedDeState.skillCount === 0, 'Revealed Differential Equations answer must not mirror into strong Skill Check evidence.');

  await waitForStaticEnhancement(page, complexLearnPagePath);
  await resetPageProgress(page);
  const complexInitialShape = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const cardRect = activeCard?.getBoundingClientRect();
    const primaryForm = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"]');
    const answerControl = primaryForm?.querySelector('input[name="submittedAnswer"]');
    const checkButton = primaryForm?.querySelector('button[type="submit"]');
    const controlRect = answerControl?.getBoundingClientRect();
    const buttonRect = checkButton?.getBoundingClientRect();
    const inViewport = (rect) => Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0);
    const text = document.body.innerText;
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return {
      hasComplexTitle: text.includes('Complex Numbers'),
      learnSteps: document.querySelectorAll('[data-learn-step-card]').length,
      visibleSteps: Array.from(document.querySelectorAll('[data-learn-step-card]')).filter((step) => !step.hidden).length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
      oldSkillForms: document.querySelectorAll('[data-check-skill-answer]').length,
      activeProblemInFirstViewport: inViewport(cardRect),
      answerControlInFirstViewport: inViewport(controlRect),
      checkButtonInFirstViewport: inViewport(buttonRect),
      radioInputs: activeCard?.querySelectorAll('input[type="radio"][name="submittedAnswer"]').length ?? 0,
      explanationHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden),
      principleHidden: !text.includes('Principle: add real parts with real parts, and imaginary parts with imaginary parts.'),
      similarHidden: Boolean(document.querySelector('[data-learn-similar-panel]')?.hidden),
      transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
      answerRevealHidden: Boolean(document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden),
      nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
      passiveLearningCount: progress.learningActivityAttempts?.length ?? 0,
      passiveSkillCount: progress.skillCheckAttempts?.length ?? 0,
    };
  });
  assert(complexInitialShape.hasComplexTitle, 'Complex Numbers Learn page must render.');
  assert(complexInitialShape.learnSteps === 17, `Complex Numbers Learn Mode must render 17 authored steps; saw ${complexInitialShape.learnSteps}.`);
  assert(complexInitialShape.visibleSteps === 1, 'Complex Numbers Learn Mode must show one active step.');
  assert(complexInitialShape.learnForms >= 34, 'Complex Numbers Learn Mode must render primary and similar checked forms.');
  assert(complexInitialShape.oldSkillForms === 0, 'Complex Numbers Learn Mode must not render legacy Skill Check forms.');
  assert(complexInitialShape.activeProblemInFirstViewport, 'First viewport must show the active Complex Numbers problem.');
  assert(complexInitialShape.answerControlInFirstViewport, 'First viewport must show the first Complex Numbers answer control.');
  assert(complexInitialShape.checkButtonInFirstViewport, 'First viewport must show the Complex Numbers Check answer button.');
  assert(complexInitialShape.radioInputs >= 2, 'Complex Numbers option prompts must render real radio controls.');
  assert(complexInitialShape.explanationHidden, 'Complex Numbers explanation must be hidden before attempt.');
  assert(complexInitialShape.principleHidden, 'Complex Numbers principle must be hidden before attempt.');
  assert(complexInitialShape.similarHidden, 'Complex Numbers similar question must be hidden before primary attempt.');
  assert(complexInitialShape.transferHidden, 'Complex Numbers exam transfer must be hidden before primary/similar attempt.');
  assert(complexInitialShape.answerRevealHidden, 'Complex Numbers answer reveal must be unavailable before first submitted attempt.');
  assert(!complexInitialShape.nextOpen, 'Complex Numbers next button must stay disabled before the step is completed.');
  assert(complexInitialShape.passiveLearningCount === 0 && complexInitialShape.passiveSkillCount === 0, 'Passive Complex Numbers page view must not create evidence.');

  const complexCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  const complexPrimary = complexCard.locator('[data-check-learn-answer][data-learn-variant="primary"]');
  const complexSimilar = complexCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await complexPrimary.locator('input[name="submittedAnswer"][value="correct"]').check();
  assert(await complexPrimary.locator('input[name="submittedAnswer"][value="correct"]').isChecked(), 'Complex Numbers radio options must be clickable.');
  await submitAnswer(complexPrimary, 'correct');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 1;
  });
  const complexAfterPrimary = await page.evaluate(() => ({
    explanationVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-after-attempt]')?.hidden,
    principleVisible: document.body.innerText.includes('Principle: add real parts with real parts, and imaginary parts with imaginary parts.'),
    similarVisible: !document.querySelector('[data-learn-similar-panel]')?.hidden,
    transferHidden: Boolean(document.querySelector('[data-learn-exam-transfer]')?.hidden),
    answerRevealVisible: !document.querySelector('[data-check-learn-answer][data-learn-variant="primary"] [data-learn-answer-reveal]')?.hidden,
    nextOpen: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(complexAfterPrimary.explanationVisible, 'Complex Numbers explanation must reveal after primary attempt.');
  assert(complexAfterPrimary.principleVisible, 'Complex Numbers principle must reveal after primary attempt.');
  assert(complexAfterPrimary.similarVisible, 'Complex Numbers similar checked question must reveal after primary attempt.');
  assert(complexAfterPrimary.transferHidden, 'Complex Numbers exam transfer must stay hidden until similar attempt.');
  assert(complexAfterPrimary.answerRevealVisible, 'Complex Numbers answer reveal must become available after a submitted attempt.');
  assert(!complexAfterPrimary.nextOpen, 'Primary-only answer must keep navigation locked while the similar check remains required.');

  await submitAnswer(complexSimilar, '-3-4i');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 2
      && Object.keys(progress.regionLearning?.['complex-numbers']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const cleanComplexState = await progressSnapshot(page);
  const cleanComplexUi = await page.evaluate(() => ({
    transferVisible: !document.querySelector('[data-learn-exam-transfer]')?.hidden,
    nextUnlocked: Array.from(document.querySelectorAll('.learn-controls button')).some((button) => /Next step/i.test(button.textContent || '') && !button.disabled),
  }));
  assert(cleanComplexState.learningCount === 2, 'Clean Complex Numbers primary and similar answers must save Learn activity.');
  assert(cleanComplexState.skillCount === 0, 'Clean Complex Numbers Learn answers must not create checked evidence.');
  assert(cleanComplexState.completedComplexSteps === 1, 'Correct similar Complex Numbers answer must complete the lesson step.');
  assert(cleanComplexUi.transferVisible, 'Complex Numbers exam transfer must appear after the similar question is attempted.');
  assert(cleanComplexUi.nextUnlocked, 'Correct Complex Numbers similar question must unlock the next Learn step.');

  await page.locator('.learn-controls button', { hasText: 'Next step' }).click();
  const complexTypedHelp = await page.evaluate(() => {
    const activeCard = document.querySelector('[data-learn-step-card]:not([hidden])');
    const label = activeCard?.querySelector('[data-check-learn-answer][data-learn-variant="primary"] label.single-answer-field');
    const input = label?.querySelector('input[name="submittedAnswer"][type="text"]');
    const help = label?.querySelector('.answer-format-guidance')?.textContent || '';
    const inputRect = input?.getBoundingClientRect();
    const helpRect = label?.querySelector('.answer-format-guidance')?.getBoundingClientRect();
    return {
      stepId: activeCard?.getAttribute('data-learn-step-id'),
      hasTextInput: Boolean(input),
      helpText: help,
      helpNearInput: Boolean(inputRect && helpRect && Math.abs(helpRect.bottom - inputRect.top) < 36),
    };
  });
  assert(complexTypedHelp.stepId === 'learn-complex-multiply-i-squared', 'Complex Numbers second step should expose a typed input.');
  assert(complexTypedHelp.hasTextInput, 'Complex Numbers typed steps must render a text answer input.');
  assert(/Answer format: complex number in a\+bi form\./i.test(complexTypedHelp.helpText), `Complex Numbers typed input must show complex-number format help; saw "${complexTypedHelp.helpText}".`);
  assert(complexTypedHelp.helpNearInput, 'Complex Numbers answer-format help must be placed near the typed input.');

  await resetPageProgress(page);
  const hintedComplexCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(hintedComplexCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const hintedComplexSimilar = hintedComplexCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await hintedComplexSimilar.locator('[data-show-learn-hint]').click();
  await submitAnswer(hintedComplexSimilar, '-3-4i');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) === 2
      && Object.keys(progress.regionLearning?.['complex-numbers']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const hintedComplexState = await progressSnapshot(page);
  assert(hintedComplexState.skillCount === 0, 'Hinted Complex Numbers similar answer must not mirror into strong Skill Check evidence.');
  assert(hintedComplexState.learningAttempts.at(-1)?.strongEvidence === false, 'Hinted Complex Numbers answer must remain weak Learn evidence.');

  await resetPageProgress(page);
  const revealedComplexCard = page.locator('[data-learn-step-card]:not([hidden])').first();
  await submitAnswer(revealedComplexCard.locator('[data-check-learn-answer][data-learn-variant="primary"]'), 'correct');
  const revealedComplexSimilar = revealedComplexCard.locator('[data-check-learn-answer][data-learn-variant="similar"]');
  await submitAnswer(revealedComplexSimilar, 'definitely wrong');
  await revealedComplexSimilar.locator('[data-learn-answer-reveal] summary').click();
  await submitAnswer(revealedComplexSimilar, '-3-4i');
  await page.waitForFunction(() => {
    const progress = JSON.parse(window.localStorage.getItem('asterion.progress.v1') || '{}');
    return (progress.learningActivityAttempts?.length ?? 0) >= 3
      && Object.keys(progress.regionLearning?.['complex-numbers']?.fieldGuideTopicCompletions ?? {}).length === 1;
  });
  const revealedComplexState = await progressSnapshot(page);
  assert(revealedComplexState.skillCount === 0, 'Revealed Complex Numbers answer must not mirror into strong Skill Check evidence.');

  for (const [oldPath, label, expectedTitle, expectedButton] of [
    [oldAlgebraFieldGuidePagePath, 'Algebra Learn bridge', 'Algebra — Learn', 'Learn'],
    [oldLogExpFieldGuidePagePath, 'Log/Exp Learn bridge', 'Logarithmic and Exponential Functions — Learn', 'Learn'],
    [oldTrigFieldGuidePagePath, 'Trigonometry Learn bridge', 'Trigonometry — Learn', 'Learn'],
    [oldDiffFieldGuidePagePath, 'Differentiation Learn bridge', 'Differentiation — Learn', 'Learn'],
    [oldIntegrationFieldGuidePagePath, 'Integration Learn bridge', 'Integration — Learn', 'Learn'],
    [oldIterationFieldGuidePagePath, 'Numerical Solution Learn bridge', 'Numerical Solution of Equations — Learn', 'Learn'],
    [oldDeFieldGuidePagePath, 'Differential Equations Learn bridge', 'Differential Equations — Learn', 'Learn'],
    [oldComplexFieldGuidePagePath, 'Complex Numbers Learn bridge', 'Complex Numbers — Learn', 'Learn'],
  ]) {
    await waitForStaticEnhancement(page, oldPath);
    const oldRouteShape = await page.evaluate(([title, buttonLabel]) => ({
      bridgeTitle: document.body.innerText.includes(title),
      learnLinks: Array.from(document.querySelectorAll('a')).filter((link) => (link.textContent || '').includes(buttonLabel) && /\/learn\/(?:index\.html)?$/.test(link.href)).length,
      legacyForms: document.querySelectorAll('[data-check-skill-answer]').length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
    }), [expectedTitle, expectedButton]);
    assert(oldRouteShape.bridgeTitle, `${label} route must show a clean bridge title.`);
    assert(oldRouteShape.learnLinks > 0, `${label} route must link to Learn.`);
    assert(oldRouteShape.legacyForms === 0 && oldRouteShape.learnForms === 0, `${label} route must not render an old checking flow.`);
  }

  for (const [checkedPath, label] of [
    [oldAlgebraSkillCheckPagePath, 'Algebra Checked Practice'],
    [oldLogExpSkillCheckPagePath, 'Log/Exp Checked Practice'],
    [oldTrigSkillCheckPagePath, 'Trigonometry Checked Practice'],
    [oldDiffSkillCheckPagePath, 'Differentiation Checked Practice'],
    [oldIntegrationSkillCheckPagePath, 'Integration Checked Practice'],
    [oldIterationSkillCheckPagePath, 'Numerical Solution Checked Practice'],
    [oldDeSkillCheckPagePath, 'Differential Equations Checked Practice'],
    [oldComplexSkillCheckPagePath, 'Complex Numbers Checked Practice'],
  ]) {
    await waitForStaticEnhancement(page, checkedPath);
    const checkedRouteShape = await page.evaluate(() => ({
      hasCheckedTitle: document.body.innerText.includes('Checked Practice'),
      skillForms: document.querySelectorAll('[data-check-skill-answer]').length,
      learnForms: document.querySelectorAll('[data-check-learn-answer]').length,
      visibleSkillForm: Boolean(document.querySelector('[data-check-skill-answer]')?.closest('.practice-card:not([hidden])')),
    }));
    assert(checkedRouteShape.hasCheckedTitle, `${label} route must show Checked Practice.`);
    assert(checkedRouteShape.skillForms > 0, `${label} route must render Skill Check forms.`);
    assert(checkedRouteShape.learnForms === 0, `${label} route must not render Learn forms.`);
    assert(checkedRouteShape.visibleSkillForm, `${label} route must show a visible checked question.`);
  }

  console.log('P3 Learn and Checked Practice interaction browser check passed.');
} finally {
  await browser.close();
}
