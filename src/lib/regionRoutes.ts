import type { RegionDefinition } from '../types';
import { P3_ASTRAL_ACADEMY } from './worldMap';

export type RegionLearningPageId =
  | 'hub'
  | 'field-guide'
  | 'skill-practice'
  | 'quick-check'
  | 'warm-up'
  | 'exam-training'
  | 'guardian';

export const REGION_LEARNING_PAGE_ORDER: RegionLearningPageId[] = [
  'hub',
  'field-guide',
  'skill-practice',
  'guardian',
];

// Compatibility hashes from the pre-merge student loop. Keep these route
// segments valid, but do not add them back to current visible navigation.
export const LEGACY_REGION_LEARNING_PAGE_SEGMENTS: RegionLearningPageId[] = [
  'quick-check',
  'warm-up',
  'exam-training',
];

export const REGION_LEARNING_PAGE_LABELS: Record<RegionLearningPageId, string> = {
  hub: 'Region Hub',
  'field-guide': 'Field Guide',
  'skill-practice': 'Skill Check',
  'quick-check': 'Skill Check',
  'warm-up': 'Skill Check',
  'exam-training': 'Exam Training',
  guardian: 'Guardian Challenge',
};

export const REGION_LEARNING_PAGE_DESCRIPTIONS: Record<RegionLearningPageId, string> = {
  hub: 'Orient yourself, review progress, and choose the next learning step.',
  'field-guide': 'Study the existing region explanation, snippets, notes, and worked examples.',
  'skill-practice': 'Practice by Field Guide topic and solving complexity.',
  'quick-check': 'Compatibility route for the unified Skill Check page.',
  'warm-up': 'Compatibility route for the unified Skill Check page.',
  'exam-training': 'Train on real question images and mark schemes for this region.',
  guardian: 'Attempt the gated checkpoint after local evidence unlocks it.',
};

export interface ParsedRegionRoute {
  kind: 'region';
  regionId: string;
  page: RegionLearningPageId;
  isKnownRegion: boolean;
}

export type ParsedAsterionRoute = ParsedRegionRoute | { kind: 'none' };

const pageSegments = new Set<RegionLearningPageId>([
  ...REGION_LEARNING_PAGE_ORDER,
  ...LEGACY_REGION_LEARNING_PAGE_SEGMENTS,
]);

export function isRegionLearningPageId(value: string): value is RegionLearningPageId {
  return pageSegments.has(value as RegionLearningPageId);
}

export function normalizeRegionLearningPageSegment(segment?: string): RegionLearningPageId {
  if (!segment) return 'hub';
  return isRegionLearningPageId(segment) ? segment : 'hub';
}

export function getP3RegionById(regionId: string): RegionDefinition | undefined {
  return P3_ASTRAL_ACADEMY.regions.find((region) => region.id === regionId);
}

export function parseAsterionHashRoute(hash: string): ParsedAsterionRoute {
  const trimmed = hash.replace(/^#\/?/, '');
  const [root, regionId, pageSegment] = trimmed.split('/').filter(Boolean);
  if (root !== 'regions' || !regionId) return { kind: 'none' };

  return {
    kind: 'region',
    regionId,
    page: normalizeRegionLearningPageSegment(pageSegment),
    isKnownRegion: Boolean(getP3RegionById(regionId)),
  };
}

export function regionHashPath(regionId: string, page: RegionLearningPageId = 'hub'): string {
  return page === 'hub'
    ? `#/regions/${regionId}`
    : `#/regions/${regionId}/${page}`;
}
