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

export type AnswerFormatKind =
  | 'numeric'
  | 'expression'
  | 'multi-value'
  | 'coordinate-vector'
  | 'complex'
  | 'interval'
  | 'exact-text'
  | 'text';

export interface AnswerFormatGuidance {
  kind: AnswerFormatKind;
  instruction: string;
  placeholder?: string;
  examples: string[];
  symbols: string[];
  inputMode: string;
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

function angleTuplePlaceholder(placeholder: string): string {
  return `<${placeholder.replace(/[()]/g, '')}>`;
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

function isVectorPrompt(prompt: string): boolean {
  return /column[-\s]?vector|unit[-\s]?vector|vector/.test(prompt);
}

function expressionSymbols(sample: string, prompt: string): string[] {
  const source = `${sample} ${prompt}`.toLowerCase();
  if (/(?:\bln\b|\blog\b|exponential|e\^)/.test(source)) {
    return ['^', '/', 'ln()', 'log_a()', 'e^()'];
  }
  if (/(?:\bsin\b|\bcos\b|\btan\b|sec|cosec|cot|trig)/.test(source)) {
    return ['^', '/', 'sin', 'cos', 'tan', 'pi'];
  }
  if (/(?:differentiate|derivative|integrate|integration|dy\/dx)/.test(source)) {
    return ['^', '/', 'sqrt()', 'e^()', '+ C'];
  }
  return ['^', '/', 'sqrt()', 'pi'];
}

function expressionExamples(sample: string, prompt: string): string[] {
  const source = `${sample} ${prompt}`.toLowerCase();
  if (/(?:\bln\b|\blog\b|exponential|e\^)/.test(source)) {
    return ['ln(5x)', 'log_a(6)', 'e^(2x)'];
  }
  if (/(?:\bsin\b|\bcos\b|\btan\b|sec|cosec|cot|trig)/.test(source)) {
    return ['sin^2x', 'cos(2x)', 'pi/3'];
  }
  if (/(?:differentiate|derivative|integrate|integration|dy\/dx)/.test(source)) {
    return ['3x^2', 'e^(2x)', '(1/2)x^2+C'];
  }
  return ['x^2-x-6', '(x+1)/(x-2)', 'sqrt(3)/2'];
}

function guidance(
  kind: AnswerFormatKind,
  instruction: string,
  placeholder: string | undefined,
  examples: string[],
  symbols: string[],
): AnswerFormatGuidance {
  return {
    kind,
    instruction,
    ...(placeholder ? { placeholder } : {}),
    examples,
    symbols,
    inputMode: 'text',
  };
}

function kindForAnswerType(answerType: string, tupleAnswer: boolean): AnswerFormatKind {
  if (answerType === 'numeric') return 'numeric';
  if (answerType === 'multi-value') return 'multi-value';
  if (answerType === 'coordinate' || tupleAnswer) return 'coordinate-vector';
  if (answerType === 'complex-number') return 'complex';
  if (answerType === 'interval') return 'interval';
  if (answerType === 'expression-text') return 'expression';
  if (answerType === 'exact-text') return 'exact-text';
  return 'text';
}

export function answerFormatGuidance(input: AnswerFormatGuidanceInput): AnswerFormatGuidance {
  const answerType = input.answerType ?? '';
  const sample = firstValue(input.expectedAnswer, input.acceptedAnswers);
  const cleanedSample = cleanMathText(sample);
  const prompt = `${input.prompt ?? ''} ${input.label ?? ''}`.toLowerCase();
  const componentCount = tupleComponentCount(cleanedSample);
  const tupleAnswer = answerType === 'coordinate' || isTupleLike(cleanedSample);
  const kind = kindForAnswerType(answerType, tupleAnswer);

  if (input.answerFormatHint) {
    const base = answerFormatGuidance({ ...input, answerFormatHint: undefined });
    return {
      ...base,
      kind,
      instruction: withPrefix(input.answerFormatHint),
      ...(input.answerPlaceholder ? { placeholder: input.answerPlaceholder } : {}),
    };
  }

  if (answerType === 'coordinate') {
    const placeholder = input.answerPlaceholder ?? tuplePlaceholder(componentCount || 3);
    const instruction = isVectorPrompt(prompt)
      ? `Answer format: column-vector components as ${placeholder}, with commas.`
      : `Answer format: use commas, e.g. ${placeholder}.`;
    return guidance('coordinate-vector', instruction, placeholder, [placeholder, angleTuplePlaceholder(placeholder)], ['commas', '( )', '< >']);
  }

  if (answerType === 'multi-value') {
    const placeholder = input.answerPlaceholder ?? listPlaceholder(splitCommaValues(cleanedSample).length);
    return guidance(
      'multi-value',
      `Answer format: separate values with commas, e.g. ${placeholder}.`,
      placeholder,
      [placeholder, 'x=1, x=2'],
      ['commas', 'and'],
    );
  }

  if (tupleAnswer) {
    const placeholder = input.answerPlaceholder ?? tuplePlaceholder(componentCount || 3);
    const instruction = isVectorPrompt(prompt)
      ? `Answer format: column-vector components as ${placeholder}, with commas.`
      : `Answer format: use commas, e.g. ${placeholder}.`;
    return guidance('coordinate-vector', instruction, placeholder, [placeholder, angleTuplePlaceholder(placeholder)], ['commas', '( )', '< >']);
  }

  if (answerType === 'numeric') {
    return guidance(
      'numeric',
      'Answer format: number, fraction, radical, or pi form.',
      input.answerPlaceholder ?? '3/2',
      ['3/2', 'sqrt(3)/2', 'pi/3'],
      ['/', 'sqrt()', 'pi'],
    );
  }

  if (answerType === 'complex-number') {
    return guidance(
      'complex',
      'Answer format: complex number in a+bi form.',
      input.answerPlaceholder ?? '3+2i',
      ['3+2i', '-1-sqrt(7)i', '4i+3'],
      ['i', '+', '-'],
    );
  }

  if (answerType === 'interval') {
    return guidance(
      'interval',
      'Answer format: interval or inequality.',
      input.answerPlaceholder ?? '-1 < x < 4',
      ['-1 < x < 4', 'x >= 1 and x < 4', '(1, 4)'],
      ['<', '<=', '>=', '( )', '[ ]'],
    );
  }

  if (answerType === 'expression-text') {
    return guidance(
      'expression',
      'Answer format: type a compact expression using ^ for powers.',
      input.answerPlaceholder ?? expressionPlaceholder(cleanedSample),
      expressionExamples(cleanedSample, prompt),
      expressionSymbols(cleanedSample, prompt),
    );
  }

  if (answerType === 'exact-text') {
    return guidance(
      'exact-text',
      'Answer format: short phrase.',
      input.answerPlaceholder,
      ['short phrase'],
      ['words'],
    );
  }

  return guidance(
    'text',
    'Answer format: type your answer.',
    input.answerPlaceholder,
    ['answer text'],
    ['keyboard text'],
  );
}
