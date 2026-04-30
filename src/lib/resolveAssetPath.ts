import type { PaperFamily } from '../types';

const FAMILY_ALIASES: Record<string, string> = {
  pure1: 'p1',
  p1: 'p1',
  pure3: 'p3',
  p3: 'p3',
  mechanics: 'p4',
  m1: 'p4',
  p4: 'p4',
  statistics: 'p5',
  s1: 'p5',
  p5: 'p5',
};

export function canonicalPaperFamily(value?: string): PaperFamily {
  if (!value) return 'p3';
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return FAMILY_ALIASES[normalized] ?? normalized;
}

export function resolveQuestionAssetPath(rawPath: string | undefined, fallbackFamily: PaperFamily = 'p3'): string {
  if (!rawPath) return '';
  if (/^https?:\/\//i.test(rawPath) || rawPath.startsWith('/assets/')) return rawPath;

  const cleaned = rawPath.replace(/^public\//, '').replace(/^assets\/questions\//, '').replace(/^\/+/, '');
  const parts = cleaned.split('/').filter(Boolean);
  const first = parts[0]?.toLowerCase();
  const canonicalFirst = canonicalPaperFamily(first);
  const knownFamilies = new Set(['p1', 'p3', 'p4', 'p5']);
  const hasFamilyPrefix = Boolean(first && knownFamilies.has(canonicalFirst));
  const family = hasFamilyPrefix ? canonicalFirst : fallbackFamily;
  const rest = hasFamilyPrefix ? parts.slice(1) : parts;

  return `/assets/questions/${family}/${rest.join('/')}`;
}

export function resolveQuestionAssetPaths(paths: unknown, fallbackFamily: PaperFamily = 'p3'): string[] {
  if (Array.isArray(paths)) {
    return paths.map((path) => resolveQuestionAssetPath(String(path), fallbackFamily)).filter(Boolean);
  }
  if (typeof paths === 'string') {
    return [resolveQuestionAssetPath(paths, fallbackFamily)].filter(Boolean);
  }
  return [];
}
