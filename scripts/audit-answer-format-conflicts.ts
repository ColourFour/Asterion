import { P1_REPAIR_MODULES } from '../src/data/p1RepairLane';
import { P3_DIAGNOSTIC_QUESTIONS } from '../src/data/p3DiagnosticGate';
import { quickCheckContractSeeds } from '../src/data/quickCheckContracts';
import { AUTHORED_SKILL_CHECK_ITEMS, skillCheckAnswerSpecForItem } from '../src/data/skillCheckItems';
import { getLearnStepsForRegion } from '../src/data/learnModeLessons';
import { STUDY_TOPICS } from '../src/lib/topicStudy';
import { checkSkillCheckAnswer, type SkillCheckAnswerSpec } from '../src/skill-checks/answerChecker';

interface AuditEntry {
  surface: string;
  region: string;
  id: string;
  title: string;
  prompt: string;
  inputType: string;
  answerType: string;
  acceptedAnswers: string[];
  expectedAnswer?: unknown;
  orderMatters?: boolean;
}

interface AuditIssue {
  severity: 'critical' | 'high' | 'medium';
  kind: string;
  surface: string;
  region: string;
  id: string;
  title: string;
  prompt: string;
  answerType: string;
  accepted: string[];
  detail: string;
  examples: string[];
}

function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function passes(entry: AuditEntry, submittedAnswer: string): boolean {
  const spec: SkillCheckAnswerSpec = {
    answerType: entry.answerType,
    acceptedAnswers: entry.acceptedAnswers,
    orderMatters: entry.orderMatters,
  };
  return checkSkillCheckAnswer({ spec, submittedAnswer }).isCorrect;
}

function addIssue(
  issues: AuditIssue[],
  entry: AuditEntry,
  severity: AuditIssue['severity'],
  kind: string,
  detail: string,
  examples: string[],
): void {
  issues.push({
    severity,
    kind,
    surface: entry.surface,
    region: entry.region,
    id: entry.id,
    title: entry.title,
    prompt: normalizeText(entry.prompt),
    answerType: entry.answerType,
    accepted: entry.acceptedAnswers,
    detail,
    examples,
  });
}

function collectEntries(): AuditEntry[] {
  const entries: AuditEntry[] = [];

  for (const topic of STUDY_TOPICS) {
    for (const step of getLearnStepsForRegion(topic.regionId)) {
      const spec = step.primaryCheck ? skillCheckAnswerSpecForItem(step.primaryCheck) : undefined;
      if (!spec) continue;
      entries.push({
        surface: 'learn-primary',
        region: topic.regionId,
        id: step.id,
        title: step.title,
        prompt: `${step.stem} ${step.prompt}`,
        inputType: step.inputType,
        answerType: spec.answerType,
        acceptedAnswers: spec.acceptedAnswers,
        expectedAnswer: step.expectedAnswer,
        orderMatters: spec.orderMatters,
      });
    }
  }

  for (const item of AUTHORED_SKILL_CHECK_ITEMS) {
    const spec = skillCheckAnswerSpecForItem(item);
    if (!spec) continue;
    entries.push({
      surface: 'skill-check',
      region: String(item.regionId),
      id: item.itemId,
      title: item.skillId,
      prompt: item.prompt,
      inputType: item.inputType,
      answerType: spec.answerType,
      acceptedAnswers: spec.acceptedAnswers,
      expectedAnswer: item.expectedAnswer,
      orderMatters: spec.orderMatters,
    });
  }

  for (const question of P3_DIAGNOSTIC_QUESTIONS) {
    for (const markPoint of question.markPoints) {
      entries.push({
        surface: 'diagnostic',
        region: question.sectionId,
        id: `${question.id}:${markPoint.id}`,
        title: question.title,
        prompt: `${question.prompt} / ${markPoint.label}`,
        inputType: 'text',
        answerType: markPoint.answerType,
        acceptedAnswers: markPoint.acceptedAnswers,
        expectedAnswer: markPoint.acceptedAnswers[0],
        orderMatters: markPoint.orderMatters,
      });
    }
  }

  for (const module of P1_REPAIR_MODULES) {
    for (const question of [...module.fast_questions, module.mini_check]) {
      entries.push({
        surface: 'p1-repair',
        region: module.module_id,
        id: question.id,
        title: module.title,
        prompt: question.prompt,
        inputType: 'text',
        answerType: question.answerType,
        acceptedAnswers: question.acceptedAnswers,
        expectedAnswer: question.acceptedAnswers[0],
        orderMatters: question.orderMatters,
      });
    }
  }

  for (const [id, contract] of Object.entries(quickCheckContractSeeds)) {
    if (contract.answerType === 'single_value') {
      const acceptedAnswers = Array.isArray(contract.expectedAnswer)
        ? contract.expectedAnswer
        : contract.expectedAnswer ? [contract.expectedAnswer] : [];
      if (!acceptedAnswers.length) continue;
      entries.push({
        surface: 'quick-check-seed',
        region: 'seeded-quick-check',
        id,
        title: id,
        prompt: contract.prompt,
        inputType: 'text',
        answerType: acceptedAnswers.every((answer) => /^[$\\\s{}0-9./+-]+$/.test(answer)) ? 'numeric' : 'expression-text',
        acceptedAnswers,
        expectedAnswer: contract.expectedAnswer,
      });
    }

    if (contract.answerType === 'two_value') {
      for (const field of contract.fields ?? []) {
        const acceptedAnswers = Array.isArray(field.expectedAnswer)
          ? field.expectedAnswer
          : field.expectedAnswer ? [field.expectedAnswer] : [];
        if (!acceptedAnswers.length) continue;
        entries.push({
          surface: 'quick-check-seed',
          region: 'seeded-quick-check',
          id: `${id}:${field.id}`,
          title: id,
          prompt: `${contract.prompt} / ${field.label}`,
          inputType: 'text',
          answerType: acceptedAnswers.every((answer) => /^[$\\\s{}0-9./+-]+$/.test(answer)) ? 'numeric' : 'expression-text',
          acceptedAnswers,
          expectedAnswer: field.expectedAnswer,
        });
      }
    }
  }

  return entries;
}

function auditEntry(entry: AuditEntry, issues: AuditIssue[]): void {
  const first = entry.acceptedAnswers[0] ?? '';
  const prompt = `${entry.prompt} ${entry.title}`.toLowerCase();
  const tupleLikeAnswer = /^\(?\s*-?[\d/]+(?:\s*,\s*-?[\d/]+){1,}\s*\)?$/.test(first);

  if (
    (entry.answerType === 'coordinate' || (entry.answerType === 'expression-text' && tupleLikeAnswer))
    && (
      entry.inputType === 'vector'
      || /vector|column|coordinate|point/.test(prompt)
      || /^\(?-?[\d/]+\s*,/.test(first)
    )
  ) {
    const noComma = first.replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim();
    const angle = `<${first.replace(/[()]/g, '')}>`;
    const semicolon = `(${first.replace(/[()]/g, '').replace(/,/g, ';')})`;
    const unitVector = first
      .replace(/[()]/g, '')
      .split(',')
      .map((part, index) => `${part.trim()}${['i', 'j', 'k'][index] ?? ''}`)
      .join('+')
      .replace(/\+-/g, '-');
    const rejected = [noComma, angle, semicolon, unitVector].filter((value) => value && !passes(entry, value));
    if (rejected.length) {
      addIssue(
        issues,
        entry,
        'high',
        'Coordinate/vector format too narrow',
        'Likely correct student vector/point notation is rejected.',
        rejected.slice(0, 4),
      );
    }
  }

  if (entry.answerType === 'multi-value') {
    const withoutCommas = first.replace(/,/g, ' ');
    const setNotation = `{${first}}`;
    const withVariables = first.split(',').map((part) => `x=${part.trim()}`).join(', ');
    const newlineList = first.replace(/,/g, '\n');
    const rejected = [withoutCommas, setNotation, withVariables, newlineList].filter((value) => value && !passes(entry, value));
    if (rejected.length >= 2) {
      addIssue(
        issues,
        entry,
        'medium',
        'Multi-value answer format may be unclear',
        'Multiple natural list/set formats are rejected.',
        rejected.slice(0, 4),
      );
    }
  }

  if (entry.answerType === 'expression-text') {
    if (entry.acceptedAnswers.includes('correct')) {
      addIssue(
        issues,
        entry,
        'critical',
        'Over-permissive accepted answer',
        'The literal word "correct" is accepted for a typed maths response.',
        ['correct'],
      );
    }

    const hasEquation = first.includes('=');
    const rhsOnly = hasEquation ? first.split('=').at(-1) ?? '' : '';
    const withY = !hasEquation && /differentiate|derivative|gradient|dy\/?dx|find y|solve/.test(prompt) ? `y=${first}` : '';
    const withX = !hasEquation && /solve|root|find x|value of x/.test(prompt) ? `x=${first}` : '';
    const rejected = unique([withY, withX, rhsOnly]).filter((value) => value && !passes(entry, value));
    if (rejected.length) {
      addIssue(
        issues,
        entry,
        'medium',
        'Expression target may conflict with student notation',
        'Students may include or omit the variable/equation wrapper differently from the accepted form.',
        rejected.slice(0, 3),
      );
    }

    const unicode = first
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/sqrt\(([^)]+)\)/g, '√$1')
      .replace(/pi/g, 'π');
    if (unicode !== first && !passes(entry, unicode)) {
      addIssue(
        issues,
        entry,
        'medium',
        'Math keyboard/display notation rejected',
        'A visually natural Unicode or display notation form is rejected.',
        [unicode],
      );
    }
  }

  if (entry.answerType === 'exact-text') {
    if (entry.acceptedAnswers.includes('correct')) {
      addIssue(
        issues,
        entry,
        'critical',
        'Over-permissive accepted answer',
        'The literal word "correct" is accepted for a conceptual text response.',
        ['correct'],
      );
    }
    if (entry.acceptedAnswers.length <= 3) {
      addIssue(
        issues,
        entry,
        'medium',
        'Strict short-text response',
        'Free text answer likely needs clearer choices or more aliases.',
        entry.acceptedAnswers,
      );
    }
  }
}

const entries = collectEntries();
const issues: AuditIssue[] = [];
for (const entry of entries) auditEntry(entry, issues);

const summary = {
  entryCount: entries.length,
  bySurface: entries.reduce<Record<string, number>>((totals, entry) => {
    totals[entry.surface] = (totals[entry.surface] ?? 0) + 1;
    return totals;
  }, {}),
  issueCount: issues.length,
  bySeverity: issues.reduce<Record<string, number>>((totals, issue) => {
    totals[issue.severity] = (totals[issue.severity] ?? 0) + 1;
    return totals;
  }, {}),
};

console.log(JSON.stringify({ summary, issues }, null, 2));
