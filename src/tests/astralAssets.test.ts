import { describe, expect, it } from 'vitest';
import { astralAssetDimensions, astralAssets, getAstralRegionAsset, getAstralRegionAssetDimensions } from '../lib/astralAssets';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

describe('astralAssets', () => {
  it('exports the production starfield and P3 region island paths', () => {
    expect(astralAssets.starfieldMap).toBe('/assets/ui/astral/optimized/starfield-map-1280.png');
    expect(astralAssets.regions['algebra-forge']).toBe('/assets/ui/astral/optimized/regions/algebra-vault-512.png');
    expect(astralAssets.regions['trig-observatory']).toBe('/assets/ui/astral/optimized/regions/trigonometry-spire-512.png');
    expect(astralAssets.regions['logarithm-grove']).toBe('/assets/ui/astral/optimized/regions/logarithm-observatory-512.png');
    expect(astralAssets.regions['complex-harbor']).toBe('/assets/ui/astral/optimized/regions/argand-atrium-512.png');
    expect(astralAssets.regions['calculus-cliffs']).toBe('/assets/ui/astral/optimized/regions/calculus-cliffs-512.png');
    expect(astralAssets.regions['integration-gardens']).toBe('/assets/ui/astral/optimized/regions/integral-terraces-512.png');
    expect(astralAssets.regions['vector-workshop']).toBe('/assets/ui/astral/optimized/regions/vectors-gate-512.png');
    expect(astralAssets.regions['numerical-mines']).toBe('/assets/ui/astral/optimized/regions/iteration-forge-512.png');
    expect(astralAssets.regions['differential-shrine']).toBe('/assets/ui/astral/optimized/regions/differential-shrine-512.png');
  });

  it('covers the stable P3 world region IDs', () => {
    const mappedRegionIds = Object.keys(astralAssets.regions);

    expect(mappedRegionIds.sort()).toEqual(P3_ASTRAL_ACADEMY.regions.map((region) => region.id).sort());
  });

  it('safely handles missing or unknown region IDs', () => {
    expect(getAstralRegionAsset('algebra-forge')).toBe('/assets/ui/astral/optimized/regions/algebra-vault-512.png');
    expect(getAstralRegionAsset('unknown-region')).toBeUndefined();
    expect(() => getAstralRegionAsset('unknown-region')).not.toThrow();
  });

  it('exports dimensions for optimized UI images used with img elements', () => {
    expect(astralAssetDimensions.progressGarden).toEqual({ width: 960, height: 540 });
    expect(getAstralRegionAssetDimensions('algebra-forge')).toEqual({ width: 512, height: 341 });
    expect(getAstralRegionAssetDimensions('unknown-region')).toBeUndefined();
  });
});
