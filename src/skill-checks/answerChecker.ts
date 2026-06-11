export const SUPPORTED_SKILL_CHECK_ANSWER_TYPES = [
  'exact-text',
  'numeric',
  'expression-text',
  'multi-value',
  'coordinate',
  'interval',
  'complex-number',
] as const;

export type SkillCheckAnswerType = typeof SUPPORTED_SKILL_CHECK_ANSWER_TYPES[number];

export interface SkillCheckAnswerSpec {
  answerType: SkillCheckAnswerType | string;
  acceptedAnswers: string[];
  tolerance?: number;
  orderMatters?: boolean;
}

export interface SkillCheckAnswerCheckInput {
  spec: SkillCheckAnswerSpec;
  submittedAnswer: string | string[];
}

export interface SkillCheckAnswerCheckResult {
  isCorrect: boolean;
  normalizedSubmittedAnswer: string;
  matchedAcceptedAnswer?: string;
  reason: string;
  answerType: string;
  unsupported: boolean;
}

interface IntervalValue {
  lower: number;
  upper: number;
  lowerInclusive: boolean;
  upperInclusive: boolean;
}

interface ComplexValue {
  real: number;
  imaginary: number;
}

const DEFAULT_TOLERANCE = 1e-10;

function toleranceFor(spec: SkillCheckAnswerSpec): number {
  return spec.tolerance ?? DEFAULT_TOLERANCE;
}

function result(
  spec: SkillCheckAnswerSpec,
  values: Omit<SkillCheckAnswerCheckResult, 'answerType'>,
): SkillCheckAnswerCheckResult {
  return {
    answerType: spec.answerType,
    ...values,
  };
}

function normalizeMathText(value: string): string {
  return value
    .trim()
    .replace(/^\$+|\$+$/g, '')
    .replace(/^\\\(|\\\)$/g, '')
    .replace(/\\left|\\right/g, '')
    .replace(/\\mathrm\s*\{\s*i\s*\}/g, 'i')
    .replace(/\\operatorname\s*\{\s*i\s*\}/g, 'i')
    .replace(/−/g, '-')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/\\leq?|\\le/g, '<=')
    .replace(/\\geq?|\\ge/g, '>=')
    .replace(/\\lt/g, '<')
    .replace(/\\gt/g, '>')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ');
}

function compactText(value: string): string {
  return normalizeMathText(value)
    .replace(/\s+/g, '')
    .toLowerCase();
}

function afterEquals(value: string): string {
  const index = value.lastIndexOf('=');
  return index >= 0 ? value.slice(index + 1) : value;
}

function submittedAsString(value: string | string[]): string {
  return Array.isArray(value) ? value.join(', ') : value;
}

function isSupportedAnswerType(answerType: string): answerType is SkillCheckAnswerType {
  return SUPPORTED_SKILL_CHECK_ANSWER_TYPES.includes(answerType as SkillCheckAnswerType);
}

function parseSimpleNumber(value: string): number | undefined {
  const compact = compactText(afterEquals(value)).replace(/^\+/, '');
  if (!compact) return undefined;
  if (/^[+-]?\d+(?:\.\d+)?$/.test(compact)) return Number(compact);

  const fraction = compact.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
  if (!fraction) return undefined;
  const numerator = Number(fraction[1]);
  const denominator = Number(fraction[2]);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return undefined;
  return numerator / denominator;
}

function numbersEqual(left: number, right: number, tolerance: number): boolean {
  return Math.abs(left - right) <= tolerance;
}

function numericLabel(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
}

function normalizeExactText(value: string): string {
  return normalizeMathText(value)
    .replace(/[.。]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeExpressionText(value: string): string {
  return compactText(value)
    .replace(/\*/g, '')
    .replace(/\^1(?!\d)/g, '');
}

function splitTopLevelValues(value: string): string[] {
  return normalizeMathText(value)
    .replace(/\bor\b/gi, ',')
    .replace(/[;]/g, ',')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeMultiValueParts(value: string | string[]): string[] {
  const parts = Array.isArray(value) ? value : splitTopLevelValues(value);
  return parts.map((part) => {
    const numeric = parseSimpleNumber(part);
    return numeric === undefined ? normalizeExpressionText(part) : `#${numericLabel(numeric)}`;
  });
}

function multiValuesEqual(
  submittedParts: string[],
  acceptedParts: string[],
  tolerance: number,
  orderMatters: boolean,
): boolean {
  if (submittedParts.length !== acceptedParts.length) return false;

  const entryMatches = (left: string, right: string): boolean => {
    if (left.startsWith('#') && right.startsWith('#')) {
      return numbersEqual(Number(left.slice(1)), Number(right.slice(1)), tolerance);
    }
    return left === right;
  };

  if (orderMatters) {
    return submittedParts.every((part, index) => entryMatches(part, acceptedParts[index]));
  }

  const unmatched = [...acceptedParts];
  for (const submitted of submittedParts) {
    const index = unmatched.findIndex((accepted) => entryMatches(submitted, accepted));
    if (index < 0) return false;
    unmatched.splice(index, 1);
  }
  return unmatched.length === 0;
}

function parseCoordinate(value: string): number[] | undefined {
  const normalized = normalizeMathText(value);
  const match = normalized.match(/^\(?\s*([^,()]+)\s*,\s*([^,()]+)(?:\s*,\s*([^,()]+))?\s*\)?$/);
  if (!match) return undefined;
  const parts = [match[1], match[2], match[3]].filter((part): part is string => Boolean(part));
  const parsed = parts.map(parseSimpleNumber);
  if (parsed.some((part) => part === undefined)) return undefined;
  return parsed as number[];
}

function coordinatesEqual(left: number[], right: number[], tolerance: number): boolean {
  return left.length === right.length && left.every((value, index) => numbersEqual(value, right[index], tolerance));
}

function normalizeCoordinate(value: number[]): string {
  return `(${value.map(numericLabel).join(', ')})`;
}

function parseInterval(value: string): IntervalValue | undefined {
  const normalized = normalizeMathText(value).trim();
  const compact = normalized.replace(/\s+/g, '');

  const notation = compact.match(/^([\[(])([^,]+),([^\])]+)([\]\)])$/);
  if (notation) {
    const lower = parseSimpleNumber(notation[2]);
    const upper = parseSimpleNumber(notation[3]);
    if (lower === undefined || upper === undefined || lower > upper) return undefined;
    return {
      lower,
      upper,
      lowerInclusive: notation[1] === '[',
      upperInclusive: notation[4] === ']',
    };
  }

  const chain = compact.match(/^(.+?)(<=|<)([a-z])(?:<=|<)(.+)$/i);
  if (chain) {
    const secondOperator = compact.slice(compact.indexOf(chain[3]) + chain[3].length).match(/^(<=|<)/)?.[1];
    const lower = parseSimpleNumber(chain[1]);
    const upper = parseSimpleNumber(chain[4]);
    if (!secondOperator || lower === undefined || upper === undefined || lower > upper) return undefined;
    return {
      lower,
      upper,
      lowerInclusive: chain[2] === '<=',
      upperInclusive: secondOperator === '<=',
    };
  }

  const conjunction = normalized
    .replace(/\s+/g, ' ')
    .match(/^([a-z])\s*(>=|>)\s*(.+?)\s*(?:and|,)\s*\1\s*(<=|<)\s*(.+)$/i);
  if (conjunction) {
    const lower = parseSimpleNumber(conjunction[3]);
    const upper = parseSimpleNumber(conjunction[5]);
    if (lower === undefined || upper === undefined || lower > upper) return undefined;
    return {
      lower,
      upper,
      lowerInclusive: conjunction[2] === '>=',
      upperInclusive: conjunction[4] === '<=',
    };
  }

  return undefined;
}

function intervalsEqual(left: IntervalValue, right: IntervalValue, tolerance: number): boolean {
  return numbersEqual(left.lower, right.lower, tolerance)
    && numbersEqual(left.upper, right.upper, tolerance)
    && left.lowerInclusive === right.lowerInclusive
    && left.upperInclusive === right.upperInclusive;
}

function normalizeInterval(value: IntervalValue): string {
  return `${value.lowerInclusive ? '[' : '('}${numericLabel(value.lower)}, ${numericLabel(value.upper)}${value.upperInclusive ? ']' : ')'}`;
}

function parseImaginaryCoefficient(value: string): number | undefined {
  if (value === '' || value === '+') return 1;
  if (value === '-') return -1;
  return parseSimpleNumber(value);
}

function parseComplex(value: string): ComplexValue | undefined {
  const compact = compactText(afterEquals(value))
    .replace(/\*/g, '')
    .replace(/j/gi, 'i');
  if (!compact) return undefined;

  if (!compact.includes('i')) {
    const real = parseSimpleNumber(compact);
    return real === undefined ? undefined : { real, imaginary: 0 };
  }

  const imaginaryFirst = compact.match(/^([+-]?\d*(?:\.\d+)?(?:\/[+-]?\d+(?:\.\d+)?)?)i([+-].+)$/);
  if (imaginaryFirst) {
    const imaginary = parseImaginaryCoefficient(imaginaryFirst[1]);
    const real = parseSimpleNumber(imaginaryFirst[2]);
    if (real === undefined || imaginary === undefined) return undefined;
    return { real, imaginary };
  }

  if (!compact.endsWith('i') || compact.indexOf('i') !== compact.length - 1) return undefined;

  const withoutI = compact.slice(0, -1);
  let splitIndex = -1;
  for (let index = 1; index < withoutI.length; index += 1) {
    const char = withoutI[index];
    if (char === '+' || char === '-') splitIndex = index;
  }

  if (splitIndex < 0) {
    const imaginary = parseImaginaryCoefficient(withoutI);
    return imaginary === undefined ? undefined : { real: 0, imaginary };
  }

  const real = parseSimpleNumber(withoutI.slice(0, splitIndex));
  const imaginary = parseImaginaryCoefficient(withoutI.slice(splitIndex));
  if (real === undefined || imaginary === undefined) return undefined;
  return { real, imaginary };
}

function complexEqual(left: ComplexValue, right: ComplexValue, tolerance: number): boolean {
  return numbersEqual(left.real, right.real, tolerance)
    && numbersEqual(left.imaginary, right.imaginary, tolerance);
}

function normalizeComplex(value: ComplexValue): string {
  const sign = value.imaginary < 0 ? '-' : '+';
  return `${numericLabel(value.real)} ${sign} ${numericLabel(Math.abs(value.imaginary))}i`;
}

export function checkSkillCheckAnswer(input: SkillCheckAnswerCheckInput): SkillCheckAnswerCheckResult {
  const { spec, submittedAnswer } = input;
  const submittedText = submittedAsString(submittedAnswer);
  const trimmedSubmitted = submittedText.trim();

  if (!isSupportedAnswerType(spec.answerType)) {
    return result(spec, {
      isCorrect: false,
      normalizedSubmittedAnswer: trimmedSubmitted,
      reason: `Unsupported answer type: ${spec.answerType}.`,
      unsupported: true,
    });
  }

  if (!trimmedSubmitted) {
    return result(spec, {
      isCorrect: false,
      normalizedSubmittedAnswer: '',
      reason: 'Submitted answer is empty.',
      unsupported: false,
    });
  }

  if (!spec.acceptedAnswers.length) {
    return result(spec, {
      isCorrect: false,
      normalizedSubmittedAnswer: trimmedSubmitted,
      reason: 'No accepted answers are configured.',
      unsupported: true,
    });
  }

  if (spec.answerType === 'exact-text') {
    const normalized = normalizeExactText(trimmedSubmitted);
    const match = spec.acceptedAnswers.find((accepted) => normalizeExactText(accepted) === normalized);
    return result(spec, {
      isCorrect: Boolean(match),
      normalizedSubmittedAnswer: normalized,
      matchedAcceptedAnswer: match,
      reason: match ? 'Matched normalized exact text.' : 'Submitted text did not match any accepted answer.',
      unsupported: false,
    });
  }

  if (spec.answerType === 'expression-text') {
    const normalized = normalizeExpressionText(trimmedSubmitted);
    const match = spec.acceptedAnswers.find((accepted) => normalizeExpressionText(accepted) === normalized);
    return result(spec, {
      isCorrect: Boolean(match),
      normalizedSubmittedAnswer: normalized,
      matchedAcceptedAnswer: match,
      reason: match
        ? 'Matched normalized expression text.'
        : 'Expression did not match an accepted normalized text form. Algebraic equivalence is not inferred.',
      unsupported: false,
    });
  }

  if (spec.answerType === 'numeric') {
    const submittedNumber = parseSimpleNumber(trimmedSubmitted);
    if (submittedNumber === undefined) {
      return result(spec, {
        isCorrect: false,
        normalizedSubmittedAnswer: compactText(trimmedSubmitted),
        reason: 'Submitted answer is not a supported integer, decimal, or simple fraction.',
        unsupported: false,
      });
    }
    const match = spec.acceptedAnswers.find((accepted) => {
      const acceptedNumber = parseSimpleNumber(accepted);
      return acceptedNumber !== undefined && numbersEqual(submittedNumber, acceptedNumber, toleranceFor(spec));
    });
    return result(spec, {
      isCorrect: Boolean(match),
      normalizedSubmittedAnswer: numericLabel(submittedNumber),
      matchedAcceptedAnswer: match,
      reason: match ? 'Matched numeric answer within tolerance.' : 'Numeric answer did not match any accepted value within tolerance.',
      unsupported: false,
    });
  }

  if (spec.answerType === 'multi-value') {
    const normalizedParts = normalizeMultiValueParts(submittedAnswer);
    if (!normalizedParts.length) {
      return result(spec, {
        isCorrect: false,
        normalizedSubmittedAnswer: '',
        reason: 'Submitted multi-value answer has no parseable values.',
        unsupported: false,
      });
    }
    const match = spec.acceptedAnswers.find((accepted) => (
      multiValuesEqual(
        normalizedParts,
        normalizeMultiValueParts(accepted),
        toleranceFor(spec),
        spec.orderMatters ?? false,
      )
    ));
    return result(spec, {
      isCorrect: Boolean(match),
      normalizedSubmittedAnswer: normalizedParts.join(', '),
      matchedAcceptedAnswer: match,
      reason: match ? 'Matched multi-value answer.' : 'Multi-value answer did not match any accepted value set.',
      unsupported: false,
    });
  }

  if (spec.answerType === 'coordinate') {
    const coordinate = parseCoordinate(trimmedSubmitted);
    if (!coordinate) {
      return result(spec, {
        isCorrect: false,
        normalizedSubmittedAnswer: compactText(trimmedSubmitted),
        reason: 'Submitted coordinate is not a supported numeric tuple.',
        unsupported: false,
      });
    }
    const match = spec.acceptedAnswers.find((accepted) => {
      const acceptedCoordinate = parseCoordinate(accepted);
      return acceptedCoordinate !== undefined && coordinatesEqual(coordinate, acceptedCoordinate, toleranceFor(spec));
    });
    return result(spec, {
      isCorrect: Boolean(match),
      normalizedSubmittedAnswer: normalizeCoordinate(coordinate),
      matchedAcceptedAnswer: match,
      reason: match ? 'Matched coordinate values within tolerance.' : 'Coordinate did not match any accepted tuple.',
      unsupported: false,
    });
  }

  if (spec.answerType === 'interval') {
    const interval = parseInterval(trimmedSubmitted);
    if (!interval) {
      return result(spec, {
        isCorrect: false,
        normalizedSubmittedAnswer: compactText(trimmedSubmitted),
        reason: 'Submitted interval is not a supported bounded interval form.',
        unsupported: false,
      });
    }
    const match = spec.acceptedAnswers.find((accepted) => {
      const acceptedInterval = parseInterval(accepted);
      return acceptedInterval !== undefined && intervalsEqual(interval, acceptedInterval, toleranceFor(spec));
    });
    return result(spec, {
      isCorrect: Boolean(match),
      normalizedSubmittedAnswer: normalizeInterval(interval),
      matchedAcceptedAnswer: match,
      reason: match ? 'Matched interval bounds and endpoint inclusivity.' : 'Interval did not match any accepted bounded interval.',
      unsupported: false,
    });
  }

  const complex = parseComplex(trimmedSubmitted);
  if (!complex) {
    return result(spec, {
      isCorrect: false,
      normalizedSubmittedAnswer: compactText(trimmedSubmitted),
      reason: 'Submitted complex number is not a supported a + bi form.',
      unsupported: false,
    });
  }
  const match = spec.acceptedAnswers.find((accepted) => {
    const acceptedComplex = parseComplex(accepted);
    return acceptedComplex !== undefined && complexEqual(complex, acceptedComplex, toleranceFor(spec));
  });
  return result(spec, {
    isCorrect: Boolean(match),
    normalizedSubmittedAnswer: normalizeComplex(complex),
    matchedAcceptedAnswer: match,
    reason: match ? 'Matched complex number components within tolerance.' : 'Complex number did not match any accepted value.',
    unsupported: false,
  });
}
