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
  if (!value) return 'unknown';
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return FAMILY_ALIASES[normalized] ?? normalized;
}

export function resolveQuestionAssetPath(rawPath: string | undefined, fallbackFamily: PaperFamily = 'p3'): string {
  return resolveQuestionAssetPathCandidates(rawPath, fallbackFamily)[0] ?? '';
}

function cleanAssetPath(rawPath: string): string {
  return rawPath
    .trim()
    .replace(/^\/+/, '')
    .replace(/^public\//, '')
    .replace(/^\/+/, '')
    .replace(/^assets\/questions\//, '')
    .replace(/^assets\//, '');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function resolveQuestionAssetPathCandidates(rawPath: string | undefined, fallbackFamily: PaperFamily = 'p3'): string[] {
  if (!rawPath) return [];
  if (/^https?:\/\//i.test(rawPath)) return [rawPath];

  const cleaned = cleanAssetPath(rawPath);
  const parts = cleaned.split('/').filter(Boolean);
  const first = parts[0]?.toLowerCase();
  const canonicalFirst = canonicalPaperFamily(first);
  const knownFamilies = new Set(['p1', 'p3', 'p4', 'p5']);
  const hasFamilyPrefix = Boolean(first && knownFamilies.has(canonicalFirst));
  const family = hasFamilyPrefix ? canonicalFirst : fallbackFamily;
  const rest = hasFamilyPrefix ? parts.slice(1) : parts;

  const currentLayoutCandidate = `/assets/${rest.join('/')}`.replace(/\/+/g, '/');
  const legacyFamilyCandidate = `/assets/questions/${family}/${rest.join('/')}`.replace(/\/+/g, '/');
  const legacyPaperOnlyCandidate = `/assets/questions/${rest.join('/')}`.replace(/\/+/g, '/');
  return unique([currentLayoutCandidate, legacyFamilyCandidate, legacyPaperOnlyCandidate]);
}

export function resolveQuestionAssetPaths(paths: unknown, fallbackFamily: PaperFamily = 'p3'): string[] {
  return resolveQuestionAssetPathCandidateGroups(paths, fallbackFamily).map((group) => group[0]).filter(Boolean);
}

export function resolveQuestionAssetPathCandidateGroups(paths: unknown, fallbackFamily: PaperFamily = 'p3'): string[][] {
  if (Array.isArray(paths)) {
    return paths.map((path) => resolveQuestionAssetPathCandidates(String(path), fallbackFamily)).filter((group) => group.length > 0);
  }
  if (typeof paths === 'string') {
    const group = resolveQuestionAssetPathCandidates(paths, fallbackFamily);
    return group.length ? [group] : [];
  }
  return [];
}
