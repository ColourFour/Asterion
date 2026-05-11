import type { RegionProgress } from '../types';

export type AstralMapPriority = 'daily' | 'relevant' | 'neutral' | 'quiet';

export interface AstralMapSlot {
  x: number;
  y: number;
}

interface AstralBaseRegionSlot extends AstralMapSlot {
  baseScale: number;
  zIndex: number;
}

export interface AstralRegionMapLayout extends AstralMapSlot {
  priority: AstralMapPriority;
  scale: number;
  zIndex: number;
}

export const ASTRAL_REGION_LAYOUT: Record<string, AstralBaseRegionSlot> = {
  'algebra-forge': { x: 50, y: 43, baseScale: 1.04, zIndex: 6 },
  'logarithm-grove': { x: 20, y: 22, baseScale: 0.95, zIndex: 3 },
  'trig-observatory': { x: 82, y: 22, baseScale: 0.99, zIndex: 4 },
  'complex-harbor': { x: 15, y: 48, baseScale: 0.92, zIndex: 3 },
  'calculus-cliffs': { x: 25, y: 77, baseScale: 0.96, zIndex: 3 },
  'integration-gardens': { x: 86, y: 50, baseScale: 0.96, zIndex: 3 },
  'vector-workshop': { x: 62, y: 17, baseScale: 0.9, zIndex: 2 },
  'numerical-mines': { x: 73, y: 63, baseScale: 0.95, zIndex: 3 },
  'differential-shrine': { x: 37, y: 66, baseScale: 0.94, zIndex: 3 },
};

const relatedRegionIds: Record<string, string[]> = {
  'algebra-forge': ['logarithm-grove', 'trig-observatory', 'numerical-mines'],
  'logarithm-grove': ['algebra-forge', 'trig-observatory', 'numerical-mines'],
  'trig-observatory': ['logarithm-grove', 'complex-harbor', 'vector-workshop'],
  'complex-harbor': ['trig-observatory', 'vector-workshop', 'calculus-cliffs'],
  'calculus-cliffs': ['integration-gardens', 'differential-shrine', 'numerical-mines'],
  'integration-gardens': ['calculus-cliffs', 'differential-shrine', 'algebra-forge'],
  'vector-workshop': ['complex-harbor', 'trig-observatory', 'calculus-cliffs'],
  'numerical-mines': ['calculus-cliffs', 'algebra-forge', 'differential-shrine'],
  'differential-shrine': ['integration-gardens', 'calculus-cliffs', 'numerical-mines'],
};

function isQuietRegion(regionProgress: RegionProgress): boolean {
  return (
    !regionProgress.isActive
    || regionProgress.availableQuestions === 0
    || regionProgress.rank === 'Gold'
    || regionProgress.rank === 'Mastered'
  );
}

function scaleForPriority(priority: AstralMapPriority): number {
  return {
    daily: 1.1,
    relevant: 1.02,
    neutral: 0.96,
    quiet: 0.9,
  }[priority];
}

function fallbackSlot(index: number): AstralBaseRegionSlot {
  return {
    x: 18 + ((index * 19) % 66),
    y: 20 + ((index * 23) % 58),
    baseScale: 0.92,
    zIndex: 2,
  };
}

function priorityForRegion(regionProgress: RegionProgress, recommendedRegionId: string | undefined, relatedIds: Set<string>): AstralMapPriority {
  if (regionProgress.region.id === recommendedRegionId) return 'daily';
  if (isQuietRegion(regionProgress)) return 'quiet';
  if (relatedIds.has(regionProgress.region.id)) return 'relevant';
  return 'neutral';
}

export function buildAstralRegionMapLayout(progress: RegionProgress[], recommendedRegionId?: string): Record<string, AstralRegionMapLayout> {
  const relatedIds = new Set(recommendedRegionId ? relatedRegionIds[recommendedRegionId] ?? [] : []);

  return progress.reduce<Record<string, AstralRegionMapLayout>>((layout, regionProgress, index) => {
    const baseSlot = ASTRAL_REGION_LAYOUT[regionProgress.region.id] ?? fallbackSlot(index);
    const priority = priorityForRegion(regionProgress, recommendedRegionId, relatedIds);
    const zIndexBoost = priority === 'daily' ? 4 : priority === 'relevant' ? 1 : 0;

    layout[regionProgress.region.id] = {
      x: baseSlot.x,
      y: baseSlot.y,
      priority,
      scale: Number((baseSlot.baseScale * scaleForPriority(priority)).toFixed(3)),
      zIndex: baseSlot.zIndex + zIndexBoost,
    };

    return layout;
  }, {});
}
