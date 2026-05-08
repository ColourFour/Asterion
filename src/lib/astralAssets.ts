export const astralAssets = {
  starfieldMap: '/assets/ui/astral/starfield-map.png',
  academyHall: '/assets/ui/astral/academy-hall.png',
  progressGarden: '/assets/ui/astral/progress-garden.png',
  avatarStudentFront: '/assets/ui/astral/avatar-student-front.png',
  avatarStudentMap: '/assets/ui/astral/avatar-student-map.png',
  panelFrameWood: '/assets/ui/astral/panel-frame-wood.png',
  panelFrameParchment: '/assets/ui/astral/panel-frame-parchment.png',
  regions: {
    'algebra-forge': '/assets/ui/astral/regions/algebra-vault.png',
    'trig-observatory': '/assets/ui/astral/regions/trigonometry-spire.png',
    'logarithm-grove': '/assets/ui/astral/regions/logarithm-observatory.png',
    'complex-harbor': '/assets/ui/astral/regions/argand-atrium.png',
    'calculus-cliffs': '/assets/ui/astral/regions/calculus-cliffs.png',
    'integration-gardens': '/assets/ui/astral/regions/integral-terraces.png',
    'vector-workshop': '/assets/ui/astral/regions/vectors-gate.png',
    'numerical-mines': '/assets/ui/astral/regions/iteration-forge.png',
    'differential-shrine': '/assets/ui/astral/regions/differential-shrine.png',
  },
} as const;

export type AstralRegionAssetId = keyof typeof astralAssets.regions;

export function getAstralRegionAsset(regionId: string): string | undefined {
  return (astralAssets.regions as Partial<Record<string, string>>)[regionId];
}
