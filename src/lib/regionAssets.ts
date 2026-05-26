export const regionHubAssets = {
  'calculus-cliffs': '/assets/region-art/optimized/calc-region-hub-960.png',
  'complex-harbor': '/assets/region-art/optimized/argand-region-hub-960.png',
  'differential-shrine': '/assets/region-art/optimized/differential-region-hub-960.png',
  'integration-gardens': '/assets/region-art/optimized/integral-region-hub-960.png',
  'logarithm-grove': '/assets/region-art/optimized/log-region-hub-960.png',
  'numerical-mines': '/assets/region-art/optimized/iteration-region-hub-960.png',
  'trig-observatory': '/assets/region-art/optimized/trig-region-hub-960.png',
  'vector-workshop': '/assets/region-art/optimized/vectors-region-hub-960.png',
} as const;

export type RegionHubAssetId = keyof typeof regionHubAssets;

export const regionHubAssetDimensions = {
  'calculus-cliffs': { width: 960, height: 960 },
  'complex-harbor': { width: 960, height: 960 },
  'differential-shrine': { width: 960, height: 960 },
  'integration-gardens': { width: 960, height: 960 },
  'logarithm-grove': { width: 960, height: 960 },
  'numerical-mines': { width: 960, height: 960 },
  'trig-observatory': { width: 960, height: 960 },
  'vector-workshop': { width: 960, height: 960 },
} as const;

export function getRegionHubAsset(regionId: string): string | undefined {
  return (regionHubAssets as Partial<Record<string, string>>)[regionId];
}

export function getRegionHubAssetDimensions(regionId: string): { width: number; height: number } | undefined {
  return (regionHubAssetDimensions as Partial<Record<string, { width: number; height: number }>>)[regionId];
}
