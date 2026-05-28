import { quickCheckContractSeeds } from '../data/quickCheckContracts';
import type { TeachingSnippetQuickCheck } from './teachingSnippets';
import type { QuickCheckCheckResult, QuickCheckContract, QuickCheckResponse } from '../types';

const CORRECT_MESSAGE = 'Correct. That matches this Skill Check.';
const INCORRECT_MESSAGE = 'Not yet. Try the hint and adjust your answer.';
const EMPTY_MESSAGE = 'Add an answer first.';

function nonEmpty(value: string | undefined): value is string {
  return Boolean(value?.trim());
}

function compactText(value: string): string {
  return value
    .trim()
    .replace(/^\$+|\$+$/g, '')
    .replace(/^\\\(|\\\)$/g, '')
    .replace(/\\left|\\right/g, '')
    .replace(/−/g, '-')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\cdot/g, '*')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function afterEquals(value: string): string {
  const index = value.lastIndexOf('=');
  return index >= 0 ? value.slice(index + 1) : value;
}

function parseSimpleNumber(value: string): number | undefined {
  const compact = compactText(afterEquals(value));
  if (/^[+-]?\d+(\.\d+)?$/.test(compact)) return Number(compact);
  const fraction = compact.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
  if (!fraction) return undefined;
  const numerator = Number(fraction[1]);
  const denominator = Number(fraction[2]);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined;
  return numerator / denominator;
}

function valueMatchesExpected(response: string, expected: string, tolerance?: number): boolean {
  const responseNumber = parseSimpleNumber(response);
  const expectedNumber = parseSimpleNumber(expected);
  if (responseNumber !== undefined && expectedNumber !== undefined) {
    return Math.abs(responseNumber - expectedNumber) <= (tolerance ?? 1e-10);
  }

  const normalizedResponse = compactText(response);
  const normalizedResponseAfterEquals = compactText(afterEquals(response));
  const normalizedExpected = compactText(expected);
  const normalizedExpectedAfterEquals = compactText(afterEquals(expected));
  return normalizedResponse === normalizedExpected
    || normalizedResponseAfterEquals === normalizedExpected
    || normalizedResponse === normalizedExpectedAfterEquals
    || normalizedResponseAfterEquals === normalizedExpectedAfterEquals;
}

function expectedValues(expected: string | string[] | undefined): string[] {
  if (Array.isArray(expected)) return expected.filter(nonEmpty);
  return nonEmpty(expected) ? [expected] : [];
}

function sameOrderedIds(actual: string[] | undefined, expected: string[] | undefined): boolean {
  if (!actual || !expected || actual.length !== expected.length) return false;
  return actual.every((id, index) => id === expected[index]);
}

function sameIdSet(actual: string[] | undefined, expected: string[] | undefined): boolean {
  if (!actual || !expected || actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  return expected.every((id) => actualSet.has(id));
}

function isCompleteContract(contract: QuickCheckContract): boolean {
  if (contract.answerType === 'single_value') return expectedValues(contract.expectedAnswer).length > 0;
  if (contract.answerType === 'ordered_cards') return Boolean(contract.orderedCards?.length && contract.expectedOrder?.length);
  if (contract.answerType === 'choice') return Boolean(contract.options?.length && contract.expectedChoices?.length === 1);
  if (contract.answerType === 'multi_choice') return Boolean(contract.options?.length && contract.expectedChoices?.length);
  if (contract.answerType === 'two_value') return Boolean(contract.fields?.length);
  return false;
}

function modelAnswerChoiceContract(check: TeachingSnippetQuickCheck): QuickCheckContract {
  const normalizedAnswer = compactText(check.answer.replace(/\.$/, ''));
  const yesNo = normalizedAnswer === 'yes' || normalizedAnswer === 'no';
  return {
    prompt: check.prompt,
    answerType: 'choice',
    options: yesNo
      ? [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ]
      : [
        { id: 'supported-move', label: check.microSkill ?? 'Use the linked Field Guide move' },
        { id: 'not-enough-information', label: 'Not enough information' },
        { id: 'different-move', label: 'Use a different move' },
      ],
    expectedChoices: [yesNo ? normalizedAnswer : 'supported-move'],
    hint: check.explanation,
    workedFirstStep: check.microSkill,
    explanation: check.explanation,
  };
}

export function quickCheckContractFor(check: TeachingSnippetQuickCheck): QuickCheckContract {
  const seeded = check.id ? quickCheckContractSeeds[check.id] : undefined;
  if (seeded) {
    return {
      ...seeded,
      prompt: seeded.prompt || check.prompt,
      hint: seeded.hint || check.explanation,
      explanation: seeded.explanation || check.explanation,
    };
  }

  if (check.answerType) {
    const explicit: QuickCheckContract = {
      prompt: check.prompt,
      answerType: check.answerType,
      expectedAnswer: check.expectedAnswer,
      expectedOrder: check.expectedOrder,
      expectedChoices: check.expectedChoices,
      options: check.options,
      orderedCards: check.orderedCards,
      fields: check.fields,
      displayPrefix: check.displayPrefix,
      displaySuffix: check.displaySuffix,
      tolerance: check.tolerance,
      hint: check.hint || check.explanation,
      workedFirstStep: check.workedFirstStep,
      explanation: check.explanation,
    };
    if (isCompleteContract(explicit)) return explicit;
  }

  return modelAnswerChoiceContract(check);
}

export function checkQuickCheckAnswer(
  contract: QuickCheckContract,
  response: QuickCheckResponse,
): QuickCheckCheckResult {
  if (contract.answerType === 'single_value') {
    const value = response.value?.trim() ?? '';
    if (!value) return { status: 'empty', message: EMPTY_MESSAGE, hint: contract.hint };
    const correct = expectedValues(contract.expectedAnswer).some((expected) => valueMatchesExpected(value, expected, contract.tolerance));
    return correct
      ? { status: 'correct', message: CORRECT_MESSAGE }
      : { status: 'incorrect', message: INCORRECT_MESSAGE, hint: contract.hint };
  }

  if (contract.answerType === 'two_value') {
    const fields = contract.fields ?? [];
    const values = response.values ?? {};
    if (!fields.length || fields.some((field) => !values[field.id]?.trim())) {
      return { status: 'empty', message: EMPTY_MESSAGE, hint: contract.hint };
    }
    const correct = fields.every((field) => (
      expectedValues(field.expectedAnswer).some((expected) => valueMatchesExpected(values[field.id] ?? '', expected, field.tolerance ?? contract.tolerance))
    ));
    return correct
      ? { status: 'correct', message: CORRECT_MESSAGE }
      : { status: 'incorrect', message: INCORRECT_MESSAGE, hint: contract.hint };
  }

  if (contract.answerType === 'ordered_cards') {
    if (!response.orderedIds?.length) return { status: 'empty', message: EMPTY_MESSAGE, hint: contract.hint };
    return sameOrderedIds(response.orderedIds, contract.expectedOrder)
      ? { status: 'correct', message: CORRECT_MESSAGE }
      : { status: 'incorrect', message: INCORRECT_MESSAGE, hint: contract.hint };
  }

  if (contract.answerType === 'choice') {
    if (!response.selectedChoiceId) return { status: 'empty', message: EMPTY_MESSAGE, hint: contract.hint };
    return response.selectedChoiceId === contract.expectedChoices?.[0]
      ? { status: 'correct', message: CORRECT_MESSAGE }
      : { status: 'incorrect', message: INCORRECT_MESSAGE, hint: contract.hint };
  }

  if (contract.answerType === 'multi_choice') {
    if (!response.selectedChoiceIds?.length) return { status: 'empty', message: EMPTY_MESSAGE, hint: contract.hint };
    return sameIdSet(response.selectedChoiceIds, contract.expectedChoices)
      ? { status: 'correct', message: CORRECT_MESSAGE }
      : { status: 'incorrect', message: INCORRECT_MESSAGE, hint: contract.hint };
  }

  return { status: 'incorrect', message: INCORRECT_MESSAGE, hint: contract.hint };
}

export function quickCheckResponseSummary(contract: QuickCheckContract, response: QuickCheckResponse): string {
  if (contract.answerType === 'single_value') return response.value?.trim() ?? '';
  if (contract.answerType === 'two_value') {
    return (contract.fields ?? [])
      .map((field) => `${field.label}: ${response.values?.[field.id]?.trim() ?? ''}`)
      .join('; ');
  }
  if (contract.answerType === 'ordered_cards') return response.orderedIds?.join(' > ') ?? '';
  if (contract.answerType === 'choice') return response.selectedChoiceId ?? '';
  if (contract.answerType === 'multi_choice') return response.selectedChoiceIds?.slice().sort().join(', ') ?? '';
  return '';
}
