import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface MathTextProps {
  text: string;
}

const mathDelimiterPattern = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;

type RenderedSegment =
  | { kind: 'text'; text: string }
  | { kind: 'math'; source: string; displayMode: boolean; html?: string };

let katexModulePromise: Promise<typeof import('katex')> | undefined;

function loadKatex() {
  katexModulePromise ??= import('katex');
  return katexModulePromise;
}

function parseSegments(text: string): RenderedSegment[] {
  return text.split(mathDelimiterPattern).filter((part) => part.length > 0).map((part) => {
    const displayMode = part.startsWith('$$') && part.endsWith('$$');
    const inlineMode = part.startsWith('$') && part.endsWith('$');
    if (!displayMode && !inlineMode) return { kind: 'text', text: part };
    return {
      kind: 'math',
      source: displayMode ? part.slice(2, -2) : part.slice(1, -1),
      displayMode,
    };
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
