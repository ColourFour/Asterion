import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { P3_DIAGNOSTIC_QUESTIONS } from '../src/data/p3DiagnosticGate';
import type { SkillCheckAnswerCheckResult, SkillCheckAnswerSpec } from '../src/skill-checks/answerChecker';

interface StaticDiagnosticEvaluation {
  report: {
    total_score: number;
    recommended_path: string;
  };
  marksEarned: number;
  marksAvailable: number;
  longestMissedQuestionStreak: number;
}

interface StaticSkillCheckTestHooks {
  checkSubmittedSkillAnswer: (
    spec: SkillCheckAnswerSpec,
    submittedAnswer: string,
  ) => SkillCheckAnswerCheckResult;
  buildP3DiagnosticReport: (form: HTMLFormElement) => StaticDiagnosticEvaluation['report'];
  collectP3DiagnosticEvaluation: (form: HTMLFormElement) => StaticDiagnosticEvaluation;
  renderP3DiagnosticFeedback: (panel: HTMLElement, evaluation: StaticDiagnosticEvaluation) => void;
  setupP3DiagnosticFlow: () => void;
}

function hooks(): StaticSkillCheckTestHooks {
  const exposed = (
    window as typeof window & {
      __ASTERION_SKILL_CHECK_TEST_HOOKS__?: StaticSkillCheckTestHooks;
    }
  ).__ASTERION_SKILL_CHECK_TEST_HOOKS__;
  if (!exposed) throw new Error('Static Skill Check test hooks were not exposed.');
  return exposed;
}

function diagnosticFormWithAnswers(answerFor: (questionId: string, markPointId: string) => string): HTMLFormElement {
  const form = document.createElement('form');
  form.setAttribute('data-p3-diagnostic-form', '');

  for (const question of P3_DIAGNOSTIC_QUESTIONS) {
    const card = document.createElement('article');
    card.setAttribute('data-diagnostic-question', question.id);
    card.innerHTML = `
      <p class="eyebrow">${question.sectionLabel}1 · ${question.answerFormat}</p>
      <h3>${question.title}</h3>
    `;
    for (const markPoint of question.markPoints) {
      const label = document.createElement('label');
      const span = document.createElement('span');
      span.textContent = markPoint.label;
      const input = document.createElement('input');
      input.setAttribute('data-diagnostic-mark-point', '');
      input.setAttribute('data-question-id', question.id);
      input.setAttribute('data-mark-point-id', markPoint.id);
      input.setAttribute('data-section-id', question.sectionId);
      input.setAttribute('data-risk-flags', JSON.stringify(markPoint.riskFlags));
      input.setAttribute('data-critical-foundation-skill', markPoint.criticalFoundationSkill ?? '');
      input.setAttribute('data-answer-type', markPoint.answerType);
      input.setAttribute('data-accepted-answers', JSON.stringify(markPoint.acceptedAnswers));
      input.setAttribute('data-tolerance', markPoint.tolerance === undefined ? '' : String(markPoint.tolerance));
      input.setAttribute('data-order-matters', markPoint.orderMatters === true ? 'true' : 'false');
      input.value = answerFor(question.id, markPoint.id);
      label.append(span, input);
      card.appendChild(label);
    }
    form.appendChild(card);
  }

  document.body.appendChild(form);
  return form;
}

function diagnosticPanel(): HTMLElement {
  const panel = document.createElement('section');
  panel.innerHTML = `
    <p data-diagnostic-recommendation></p>
    <div data-diagnostic-feedback-summary></div>
    <div data-diagnostic-section-feedback></div>
    <div data-diagnostic-priority-feedback></div>
    <div data-diagnostic-missed-feedback></div>
    <div data-diagnostic-confidence-panel hidden></div>
    <a class="button" href="../repair-lane/">Continue</a>
    <pre data-diagnostic-report-json>{}</pre>
  `;
  document.body.appendChild(panel);
  return panel;
}

function diagnosticFlowForm(): HTMLFormElement {
  const form = document.createElement('form');
  form.setAttribute('data-p3-diagnostic-form', '');
  form.innerHTML = `
    <section data-diagnostic-section="algebra_foundation"></section>
    <section data-diagnostic-section="p3_transition"></section>
    <section data-diagnostic-section="problem_solving"></section>
    <section data-diagnostic-submit-panel hidden>
      <button type="submit">Submit diagnostic</button>
    </section>
    <button type="button" data-diagnostic-previous>Previous</button>
    <button type="button" data-diagnostic-next>Next question</button>
    <p data-diagnostic-current-section></p>
    <h2 data-diagnostic-progress-title></h2>
    <p data-diagnostic-progress-message></p>
  `;

  for (const question of P3_DIAGNOSTIC_QUESTIONS) {
    const card = document.createElement('article');
    card.className = 'practice-card diagnostic-question-card';
    card.setAttribute('data-diagnostic-question', question.id);
    card.innerHTML = `
      <p class="eyebrow">${question.sectionLabel}1 · ${question.answerFormat}</p>
      <h3>${question.title}</h3>
    `;
    for (const markPoint of question.markPoints) {
      const input = document.createElement('input');
      input.setAttribute('data-diagnostic-mark-point', '');
      input.setAttribute('data-question-id', question.id);
      input.setAttribute('data-mark-point-id', markPoint.id);
      card.appendChild(input);
    }
    form.querySelector(`[data-diagnostic-section="${question.sectionId}"]`)?.appendChild(card);
  }

  document.body.appendChild(form);
  return form;
}

describe('P3 diagnostic student-facing feedback', () => {
  beforeAll(() => {
    const staticClientSource = readFileSync('src/static-study/static-study.js', 'utf8');
    window.eval(staticClientSource);
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('shows warm-up questions after three fully missed questions in a row without exposing the trigger', () => {
    const form = diagnosticFormWithAnswers(() => '');
    const evaluation = hooks().collectP3DiagnosticEvaluation(form);
    const panel = diagnosticPanel();

    hooks().renderP3DiagnosticFeedback(panel, evaluation);

    const confidence = panel.querySelector('[data-diagnostic-confidence-panel]');
    expect(evaluation.report.total_score).toBe(0);
    expect(evaluation.longestMissedQuestionStreak).toBeGreaterThanOrEqual(3);
    expect(confidence?.hasAttribute('hidden')).toBe(false);
    expect(confidence?.textContent).toContain('Warm-up before you continue');
    expect(confidence?.textContent).not.toContain('Confidence reset');
    expect(confidence?.textContent).not.toContain('three missed');
    expect(confidence?.textContent).not.toContain('run of three');
    expect(confidence?.textContent).toContain('Simplify 2x + 3x.');
    expect(confidence?.textContent).toContain('Answer: 5x');
    expect(panel.querySelector('[data-diagnostic-missed-feedback]')?.textContent).toContain('Expansion and simplification');
  });

  it('keeps confidence checks hidden when there is no three-question miss streak', () => {
    const form = diagnosticFormWithAnswers((questionId, markPointId) => {
      const question = P3_DIAGNOSTIC_QUESTIONS.find((item) => item.id === questionId);
      return question?.markPoints.find((item) => item.id === markPointId)?.acceptedAnswers[0] ?? '';
    });
    const evaluation = hooks().collectP3DiagnosticEvaluation(form);
    const panel = diagnosticPanel();

    hooks().renderP3DiagnosticFeedback(panel, evaluation);

    expect(evaluation.report.total_score).toBe(100);
    expect(evaluation.longestMissedQuestionStreak).toBe(0);
    expect(panel.querySelector('[data-diagnostic-confidence-panel]')?.hasAttribute('hidden')).toBe(true);
    expect(panel.querySelector('a.button')?.textContent).toBe('Continue');
  });

  it('shows only one diagnostic question and unlocks sections in authored order as answers are completed', () => {
    const form = diagnosticFlowForm();
    hooks().setupP3DiagnosticFlow();

    const visibleQuestionIds = () => Array.from(form.querySelectorAll<HTMLElement>('[data-diagnostic-question]'))
      .filter((card) => !card.hidden)
      .map((card) => card.getAttribute('data-diagnostic-question'));
    const visibleSections = () => Array.from(form.querySelectorAll<HTMLElement>('[data-diagnostic-section]'))
      .filter((section) => !section.hidden)
      .map((section) => section.getAttribute('data-diagnostic-section'));
    const next = form.querySelector<HTMLButtonElement>('[data-diagnostic-next]');

    expect(visibleQuestionIds()).toEqual(['p3diag-a01']);
    expect(visibleSections()).toEqual(['algebra_foundation']);
    expect(next?.disabled).toBe(true);

    form.querySelector<HTMLInputElement>('[data-question-id="p3diag-a01"]')!.value = 'attempt';
    form.querySelector<HTMLInputElement>('[data-question-id="p3diag-a01"]')!.dispatchEvent(new Event('input', { bubbles: true }));
    expect(next?.disabled).toBe(false);

    next?.click();
    expect(visibleQuestionIds()).toEqual(['p3diag-a02']);
    expect(visibleSections()).toEqual(['algebra_foundation']);

    for (const question of P3_DIAGNOSTIC_QUESTIONS.filter((item) => item.sectionId === 'algebra_foundation').slice(1)) {
      for (const input of Array.from(form.querySelectorAll<HTMLInputElement>(`[data-question-id="${question.id}"]`))) {
        input.value = 'attempt';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      next?.click();
    }

    expect(visibleQuestionIds()).toEqual(['p3diag-b01']);
    expect(visibleSections()).toEqual(['p3_transition']);
  });
});
