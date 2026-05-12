import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface MathTextProps {
  text: string;
}

const mathDelimiterPattern = /(\$\$[\s\S]+?\$\$|\$(?!\$)[\s\S]+?\$)/g;
const mathFunctionPattern = /(^|[^A-Za-z\\])(sin|cos|tan|sec|cosec|cot|ln|log|arg)\b/g;
const greekTokenPattern = /(^|[^A-Za-z\\])(pi|theta|alpha|lambda|mu)\b/g;

const connectorTokens = new Set(['or']);
const mathOperatorTokens = new Set(['+', '-', '−', '±']);
const mathFunctionTokens = new Set(['sin', 'cos', 'tan', 'sec', 'cosec', 'cot', 'ln', 'log', 'arg', 'sqrt']);
const greekTokens = new Set(['pi', 'theta', 'alpha', 'lambda', 'mu']);
const variableTokens = new Set(['x', 'y', 'z', 't', 'u', 'v', 'n', 'a', 'b', 'c', 'r', 'R', 'A', 'B', 'C']);

type RenderedSegment =
  | { kind: 'text'; text: string }
  | { kind: 'math'; source: string; displayMode: boolean; html?: string };

let katexModulePromise: Promise<typeof import('katex')> | undefined;

function loadKatex() {
  katexModulePromise ??= import('katex');
  return katexModulePromise;
}

function trimToken(token: string): { leading: string; core: string; trailing: string } {
  const match = token.match(/^([([{]*)(.*?)([.,;:!?)]*)$/);
  return {
    leading: match?.[1] ?? '',
    core: match?.[2] ?? token,
    trailing: match?.[3] ?? '',
  };
}

function trimMathSource(source: string): { core: string; trailing: string } {
  const match = source.match(/^(.*?)([.,;:!?]*)$/);
  return {
    core: match?.[1] ?? source,
    trailing: match?.[2] ?? '',
  };
}

function cleanToken(token: string): string {
  return trimToken(token).core;
}

function isNumericToken(token: string): boolean {
  return /^-?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?$/.test(token);
}

function isOperatorToken(token: string): boolean {
  return mathOperatorTokens.has(token);
}

function isWeakMathToken(token: string): boolean {
  if (!token) return false;
  if (variableTokens.has(token) || greekTokens.has(token) || mathFunctionTokens.has(token)) return true;
  if (isNumericToken(token)) return true;
  return /^[([{]?-?\d+(?:\.\d+)?[A-Za-z]/.test(token)
    || /^[A-Za-z]\([^)]*\)$/.test(token)
    || /^[A-Za-z][A-Za-z]?\^\(?[-+A-Za-z0-9/]+\)?$/.test(token);
}

function isStrongMathToken(token: string): boolean {
  if (!token) return false;
  return /\\[A-Za-z]+/.test(token)
    || /(?:[=<>]|!=|<=|>=|\^|_|\*|\/|\|)/.test(token)
    || /\b(?:d[xyzt])\/(?:d[xyzt])\b/.test(token)
    || /\b[ijk]\b/.test(token)
    || /\d[A-Za-z]/.test(token)
    || /[([{][^)\]}]*[+\-*/=^][^)\]}]*[)\]}]/.test(token)
    || mathFunctionTokens.has(token)
    || greekTokens.has(token);
}

function significantTokenAt(tokens: string[], index: number): string | undefined {
  for (let nextIndex = index; nextIndex < tokens.length; nextIndex += 1) {
    if (!/^\s+$/.test(tokens[nextIndex])) return cleanToken(tokens[nextIndex]);
  }
  return undefined;
}

function shouldStartMath(tokens: string[], index: number): boolean {
  const token = cleanToken(tokens[index]);
  if (!isWeakMathToken(token) && !isStrongMathToken(token)) return false;
  if (isStrongMathToken(token) && !isNumericToken(token)) return true;

  const nextToken = significantTokenAt(tokens, index + 1);
  return Boolean(nextToken && (isStrongMathToken(nextToken) || isWeakMathToken(nextToken) || isOperatorToken(nextToken)));
}

function tokenContinuesMath(tokens: string[], index: number): boolean {
  const rawToken = tokens[index];
  if (/^\s+$/.test(rawToken)) {
    const nextToken = significantTokenAt(tokens, index + 1);
    return Boolean(nextToken && (isStrongMathToken(nextToken) || isWeakMathToken(nextToken) || isOperatorToken(nextToken) || connectorTokens.has(nextToken)));
  }

  const token = cleanToken(rawToken);
  if (connectorTokens.has(token)) {
    const nextToken = significantTokenAt(tokens, index + 1);
    return Boolean(nextToken && (isStrongMathToken(nextToken) || isWeakMathToken(nextToken)));
  }

  return isStrongMathToken(token) || isWeakMathToken(token) || isOperatorToken(token);
}

function toLatexMath(source: string): string {
  return source
    .trim()
    .replace(/\s+or\s+/g, ' \\text{ or } ')
    .replace(/!=/g, '\\ne ')
    .replace(/<=/g, '\\le ')
    .replace(/>=/g, '\\ge ')
    .replace(/\^\(([^)]+)\)/g, '^{$1}')
    .replace(/\^(-?\d+)/g, '^{$1}')
    .replace(/\b(d[xyzt])\s*\/\s*(d[xyzt])\b/g, '\\frac{$1}{$2}')
    .replace(/\bd\s*\/\s*d([xyzt])\b/g, '\\frac{d}{d$1}')
    .replace(/\b([A-Za-z0-9]+)\s*\/\s*([A-Za-z0-9]+)\b/g, '\\frac{$1}{$2}')
    .replace(/\((\d+)\s*\/\s*(\d+)\)/g, '\\frac{$1}{$2}')
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/sqrt(\d+)/g, '\\sqrt{$1}')
    .replace(/\*/g, '\\cdot ')
    .replace(mathFunctionPattern, (_match: string, prefix: string, fn: string) => (
      `${prefix}${fn === 'cosec' ? '\\operatorname{cosec}' : `\\${fn}`}`
    ))
    .replace(greekTokenPattern, '$1\\$2');
}

function parseAutoMathText(text: string): RenderedSegment[] {
  const tokens = text.match(/\s+|\S+/g) ?? [];
  const segments: RenderedSegment[] = [];
  let textBuffer = '';
  let mathBuffer = '';
  let inMath = false;

  function flushText() {
    if (!textBuffer) return;
    segments.push({ kind: 'text', text: textBuffer });
    textBuffer = '';
  }

  function flushMath() {
    if (!mathBuffer) return;
    const { core, trailing } = trimMathSource(mathBuffer.trim());
    if (core) segments.push({ kind: 'math', source: toLatexMath(core), displayMode: false });
    if (trailing) segments.push({ kind: 'text', text: trailing });
    mathBuffer = '';
  }

  tokens.forEach((token, index) => {
    if (inMath) {
      if (tokenContinuesMath(tokens, index)) {
        mathBuffer += token;
        return;
      }

      flushMath();
      inMath = false;
    }

    if (!/^\s+$/.test(token) && shouldStartMath(tokens, index)) {
      flushText();
      inMath = true;
      mathBuffer = token;
      return;
    }

    textBuffer += token;
  });

  if (inMath) flushMath();
  flushText();

  return segments;
}

function parseSegments(text: string): RenderedSegment[] {
  return text.split(mathDelimiterPattern).filter((part) => part.length > 0).flatMap((part) => {
    const displayMode = part.startsWith('$$') && part.endsWith('$$');
    const inlineMode = part.startsWith('$') && part.endsWith('$');
    if (!displayMode && !inlineMode) return parseAutoMathText(part);
    return [{
      kind: 'math',
      source: displayMode ? part.slice(2, -2) : part.slice(1, -1),
      displayMode,
    }];
  });
}

export function MathText({ text }: MathTextProps) {
  const [segments, setSegments] = useState<RenderedSegment[]>(() => parseSegments(text));

  useEffect(() => {
    let isMounted = true;
    const parsed = parseSegments(text);
    setSegments(parsed);

    if (!parsed.some((segment) => segment.kind === 'math')) return undefined;

    loadKatex().then((katex) => {
      if (!isMounted) return;
      setSegments(parsed.map((segment) => {
        if (segment.kind === 'text') return segment;
        return {
          ...segment,
          html: katex.default.renderToString(segment.source, {
            displayMode: segment.displayMode,
            strict: false,
            throwOnError: false,
            trust: false,
          }),
        };
      }));
    });

    return () => {
      isMounted = false;
    };
  }, [text]);

  return (
    <>
      {segments.map((segment, index): ReactNode => {
        if (segment.kind === 'text') return segment.text;
        if (!segment.html) return segment.source;
        return (
          <span
            className={segment.displayMode ? 'math-text math-display' : 'math-text'}
            dangerouslySetInnerHTML={{ __html: segment.html }}
            key={`${segment.source}-${index}`}
          />
        );
      })}
    </>
  );
}
