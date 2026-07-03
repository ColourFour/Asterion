export interface AnswerFormatGuidanceInput {
  answerType?: string;
  inputType?: string;
  acceptedAnswers?: string[];
  expectedAnswer?: string | string[];
  prompt?: string;
  label?: string;
  answerFormatHint?: string;
  answerPlaceholder?: string;
}

export interface AnswerFormatGuidance {
  instruction: string;
  placeholder?: string;
}

function firstValue(value: string | string[] | undefined, fallback: string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? fallback?.[0] ?? '';
  return value ?? fallback?.[0] ?? '';
}

function cleanMathText(value: string): string {
  return value
    .trim()
    .replace(/^\$+|\$+$/g, '')
    .replace(/^\\\(|\\\)$/g, '')
    .replace(/\\left|\\right/g, '')
    .replace(/\\mathbf\s*\{([^{}]+)\}/g, '$1')
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, 'sqrt($1)')
    .replace(/\\pi/g, 'pi')
    .replace(/\\cdot/g, '*')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitCommaValues(value: string): string[] {
  return cleanMathText(value)
    .replace(/^\(|\)$/g, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function tupleComponentCount(value: string): number {
  const parts = splitCommaValues(value);
  return parts.length >= 2 ? parts.length : 0;
}

function tuplePlaceholder(count: number): string {
  if (count <= 2) return '(a,b)';
  if (count === 3) return '(a,b,c)';
  return `(${Array.from({ length: count }, (_, index) => String.fromCharCode(97 + index)).join(',')})`;
}

function listPlaceholder(count: number): string {
  const length = Math.max(2, Math.min(count || 2, 4));
  return Array.from({ length }, (_, index) => String.fromCharCode(97 + index)).join(', ');
}

function isTupleLike(value: string): boolean {
  return tupleComponentCount(value) > 0 && /^\(?\s*[^,]+(?:\s*,\s*[^,]+)+\s*\)?$/.test(cleanMathText(value));
}

function expressionPlaceholder(example: string): string {
  const cleaned = cleanMathText(example);
  if (/ln/i.test(cleaned)) return 'ln(5x)';
  if (/(sin|cos|tan|sec|cosec|cot)/i.test(cleaned)) return 'sin^2x';
  if (/e\^/i.test(cleaned)) return 'Ae^(kx)';
  if (/=/.test(cleaned)) return 'y=mx+c';
  if (/\^/.test(cleaned)) return 'x^2-x-6';
  return 'x^2-x-6';
}

function withPrefix(value: string): string {
  return /^answer format:/i.test(value) ? value : `Answer format: ${value}`;
}

export function answerFormatGuidance(input: AnswerFormatGuidanceInput): AnswerFormatGuidance {
  if (input.answerFormatHint) {
    return {
      instruction: withPrefix(input.answerFormatHint),
      ...(input.answerPlaceholder ? { placeholder: input.answerPlaceholder } : {}),
    };
  }

  const answerType = input.answerType ?? '';
  const sample = firstValue(input.expectedAnswer, input.acceptedAnswers);
  const cleanedSample = cleanMathText(sample);
  const prompt = `${input.prompt ?? ''} ${input.label ?? ''}`.toLowerCase();
  const componentCount = tupleComponentCount(cleanedSample);
  const tupleAnswer = answerType === 'coordinate' || isTupleLike(cleanedSample);

  if (answerType === 'coordinate') {
    const placeholder = input.answerPlaceholder ?? tuplePlaceholder(componentCount || 3);
    const instruction = /column[-\s]?vector|unit[-\s]?vector|vector/.test(prompt)
      ? `Answer format: column-vector components as ${placeholder}, with commas.`
      : `Answer format: use commas, e.g. ${placeholder}.`;
    return { instruction, placeholder };
  }

  if (answerType === 'multi-value') {
    const placeholder = input.answerPlaceholder ?? listPlaceholder(splitCommaValues(cleanedSample).length);
    return {
      instruction: `Answer format: separate values with commas, e.g. ${placeholder}.`,
      placeholder,
    };
  }

  if (tupleAnswer) {
    const placeholder = input.answerPlaceholder ?? tuplePlaceholder(componentCount || 3);
    const instruction = /column[-\s]?vector|unit[-\s]?vector|vector/.test(prompt)
      ? `Answer format: column-vector components as ${placeholder}, with commas.`
      : `Answer format: use commas, e.g. ${placeholder}.`;
    return { instruction, placeholder };
  }

  if (answerType === 'numeric') {
    return {
      instruction: 'Answer format: number, fraction, radical, or pi form.',
      placeholder: input.answerPlaceholder ?? '3/2',
    };
  }

  if (answerType === 'complex-number') {
    return {
      instruction: 'Answer format: complex number in a+bi form.',
      placeholder: input.answerPlaceholder ?? '3+2i',
    };
  }

  if (answerType === 'interval') {
    return {
      instruction: 'Answer format: interval or inequality.',
      placeholder: input.answerPlaceholder ?? '-1 < x < 4',
    };
  }

  if (answerType === 'expression-text') {
    return {
      instruction: 'Answer format: type a compact expression using ^ for powers.',
      placeholder: input.answerPlaceholder ?? expressionPlaceholder(cleanedSample),
    };
  }

  if (answerType === 'exact-text') {
    return {
      instruction: 'Answer format: short phrase.',
      ...(input.answerPlaceholder ? { placeholder: input.answerPlaceholder } : {}),
    };
  }

  return {
    instruction: 'Answer format: type your answer.',
    ...(input.answerPlaceholder ? { placeholder: input.answerPlaceholder } : {}),
  };
}
