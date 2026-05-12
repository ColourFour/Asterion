import type { RegionProgress } from '../types';

export type AstralMapPriority = 'daily' | 'relevant' | 'neutral' | 'quiet';
export type AstralLabelPlacement = 'lower' | 'lower-left' | 'lower-right' | 'below';

export interface AstralMapSlot {
  x: number;
  y: number;
}

interface AstralRegionLabelSlot {
  placement: AstralLabelPlacement;
  xPct: number;
  bottomPx: number;
  maxWidthPx: number;
}

interface AstralAvatarOffset {
  x: number;
  y: number;
}

export interface AstralBaseRegionSlot {
  regionId: string;
  priorityOrder: number;
  xPct: number;
  yPct: number;
  scale: number;
  zIndex: number;
  label: AstralRegionLabelSlot;
  avatarOffset?: AstralAvatarOffset;
}

export interface AstralRegionMapLayout extends AstralMapSlot {
  xPct: number;
  yPct: number;
  priorityOrder: number;
  priority: AstralMapPriority;
  scale: number;
  zIndex: number;
  label: AstralRegionLabelSlot;
  avatarOffset?: AstralAvatarOffset;
}

function scaleForPriorityOrder(priorityOrder: number): number {
  if (priorityOrder === 1) return 1.52;
  if (priorityOrder <= 3) return 1.32;
  if (priorityOrder === 4) return 1.2;
  if (priorityOrder <= 7) return 1.14;
  if (priorityOrder === 8) return 1;
  return 1.08;
}

export const ASTRAL_REGION_LAYOUT: Record<string, AstralBaseRegionSlot> = {
  'algebra-forge': {
    regionId: 'algebra-forge',
    priorityOrder: 1,
    xPct: 52,
    yPct: 42,
    scale: scaleForPriorityOrder(1),
    zIndex: 8,
    label: { placement: 'lower-right', xPct: 57, bottomPx: 20, maxWidthPx: 170 },
    avatarOffset: { x: -12, y: 6 },
  },
  'logarithm-grove': {
    regionId: 'logarithm-grove',
    priorityOrder: 2,
    xPct: 13,
    yPct: 18,
    scale: scaleForPriorityOrder(2),
    zIndex: 5,
    label: { placement: 'lower-left', xPct: 43, bottomPx: 16, maxWidthPx: 180 },
  },
  'trig-observatory': {
    regionId: 'trig-observatory',
    priorityOrder: 3,
    xPct: 87,
    yPct: 22,
    scale: scaleForPriorityOrder(3),
    zIndex: 5,
    label: { placement: 'lower', xPct: 50, bottomPx: 12, maxWidthPx: 174 },
  },
  'numerical-mines': {
    regionId: 'numerical-mines',
    priorityOrder: 4,
    xPct: 83,
    yPct: 73,
    scale: scaleForPriorityOrder(4),
    zIndex: 5,
    label: { placement: 'lower', xPct: 48, bottomPx: 14, maxWidthPx: 150 },
  },
  'complex-harbor': {
    regionId: 'complex-harbor',
    priorityOrder: 5,
    xPct: 26,
    yPct: 43,
    scale: scaleForPriorityOrder(5),
    zIndex: 4,
    label: { placement: 'lower', xPct: 50, bottomPx: 10, maxWidthPx: 150 },
  },
  'integration-gardens': {
    regionId: 'integration-gardens',
    priorityOrder: 6,
    xPct: 69,
    yPct: 67,
    scale: scaleForPriorityOrder(6),
    zIndex: 4,
    label: { placement: 'lower-right', xPct: 55, bottomPx: 10, maxWidthPx: 160 },
  },
  'calculus-cliffs': {
    regionId: 'calculus-cliffs',
    priorityOrder: 7,
    xPct: 14,
    yPct: 73,
    scale: scaleForPriorityOrder(7),
    zIndex: 4,
    label: { placement: 'lower', xPct: 52, bottomPx: 12, maxWidthPx: 150 },
  },
  'vector-workshop': {
    regionId: 'vector-workshop',
    priorityOrder: 8,
    xPct: 67,
    yPct: 17,
    scale: scaleForPriorityOrder(8),
    zIndex: 3,
    label: { placement: 'below', xPct: 50, bottomPx: -2, maxWidthPx: 132 },
  },
  'differential-shrine': {
    regionId: 'differential-shrine',
    priorityOrder: 9,
    xPct: 43,
    yPct: 78,
    scale: scaleForPriorityOrder(9),
    zIndex: 4,
    label: { placement: 'lower', xPct: 50, bottomPx: 12, maxWidthPx: 168 },
  },
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

function fallbackSlot(index: number): AstralBaseRegionSlot {
  const priorityOrder = index + 1;
  return {
    regionId: `fallback-${index}`,
    priorityOrder,
    xPct: 18 + ((index * 19) % 66),
    yPct: 20 + ((index * 23) % 58),
    scale: scaleForPriorityOrder(priorityOrder),
    zIndex: 2,
    label: { placement: 'lower', xPct: 50, bottomPx: 8, maxWidthPx: 148 },
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
      x: baseSlot.xPct,
      y: baseSlot.yPct,
      xPct: baseSlot.xPct,
      yPct: baseSlot.yPct,
      priorityOrder: baseSlot.priorityOrder,
      priority,
      scale: baseSlot.scale,
      zIndex: baseSlot.zIndex + zIndexBoost,
      label: baseSlot.label,
      avatarOffset: baseSlot.avatarOffset,
    };

    return layout;
  }, {});
}
