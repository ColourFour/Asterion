export const astralAssets = {
  starfieldMap: '/assets/ui/astral/optimized/starfield-map-1280.png',
  academyHall: '/assets/ui/astral/optimized/academy-hall-960.png',
  progressGarden: '/assets/ui/astral/optimized/progress-garden-960.png',
  avatarStudentFront: '/assets/ui/astral/optimized/avatar-student-front-512.png',
  avatarStudentMap: '/assets/ui/astral/optimized/avatar-student-map-512.png',
  panelFrameWood: '/assets/ui/astral/optimized/panel-frame-wood-768.png',
  panelFrameParchment: '/assets/ui/astral/optimized/panel-frame-parchment-768.png',
  regions: {
    'algebra-forge': '/assets/ui/astral/optimized/regions/algebra-vault-512.png',
    'trig-observatory': '/assets/ui/astral/optimized/regions/trigonometry-spire-512.png',
    'logarithm-grove': '/assets/ui/astral/optimized/regions/logarithm-observatory-512.png',
    'complex-harbor': '/assets/ui/astral/optimized/regions/argand-atrium-512.png',
    'calculus-cliffs': '/assets/ui/astral/optimized/regions/calculus-cliffs-512.png',
    'integration-gardens': '/assets/ui/astral/optimized/regions/integral-terraces-512.png',
    'vector-workshop': '/assets/ui/astral/optimized/regions/vectors-gate-512.png',
    'numerical-mines': '/assets/ui/astral/optimized/regions/iteration-forge-512.png',
    'differential-shrine': '/assets/ui/astral/optimized/regions/differential-shrine-512.png',
  },
} as const;

export type AstralRegionAssetId = keyof typeof astralAssets.regions;

export const astralAssetDimensions = {
  starfieldMap: { width: 1280, height: 720 },
  academyHall: { width: 960, height: 540 },
  progressGarden: { width: 960, height: 540 },
  avatarStudentFront: { width: 512, height: 512 },
  avatarStudentMap: { width: 341, height: 512 },
  panelFrameWood: { width: 768, height: 512 },
  panelFrameParchment: { width: 768, height: 512 },
  regions: {
    'algebra-forge': { width: 512, height: 341 },
    'trig-observatory': { width: 512, height: 341 },
    'logarithm-grove': { width: 512, height: 341 },
    'complex-harbor': { width: 512, height: 341 },
    'calculus-cliffs': { width: 512, height: 341 },
    'integration-gardens': { width: 512, height: 341 },
    'vector-workshop': { width: 512, height: 341 },
    'numerical-mines': { width: 512, height: 341 },
    'differential-shrine': { width: 512, height: 341 },
  },
} as const;

export function getAstralRegionAsset(regionId: string): string | undefined {
  return (astralAssets.regions as Partial<Record<string, string>>)[regionId];
}

export function getAstralRegionAssetDimensions(regionId: string): { width: number; height: number } | undefined {
  return (astralAssetDimensions.regions as Partial<Record<string, { width: number; height: number }>>)[regionId];
}
