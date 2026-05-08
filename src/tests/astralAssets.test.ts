import { describe, expect, it } from 'vitest';
import { astralAssets, getAstralRegionAsset } from '../lib/astralAssets';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

describe('astralAssets', () => {
  it('exports the production starfield and P3 region island paths', () => {
    expect(astralAssets.starfieldMap).toBe('/assets/ui/astral/starfield-map.png');
    expect(astralAssets.regions['algebra-forge']).toBe('/assets/ui/astral/regions/algebra-vault.png');
    expect(astralAssets.regions['trig-observatory']).toBe('/assets/ui/astral/regions/trigonometry-spire.png');
    expect(astralAssets.regions['logarithm-grove']).toBe('/assets/ui/astral/regions/logarithm-observatory.png');
    expect(astralAssets.regions['complex-harbor']).toBe('/assets/ui/astral/regions/argand-atrium.png');
    expect(astralAssets.regions['calculus-cliffs']).toBe('/assets/ui/astral/regions/calculus-cliffs.png');
    expect(astralAssets.regions['integration-gardens']).toBe('/assets/ui/astral/regions/integral-terraces.png');
    expect(astralAssets.regions['vector-workshop']).toBe('/assets/ui/astral/regions/vectors-gate.png');
    expect(astralAssets.regions['numerical-mines']).toBe('/assets/ui/astral/regions/iteration-forge.png');
    expect(astralAssets.regions['differential-shrine']).toBe('/assets/ui/astral/regions/differential-shrine.png');
  });

  it('covers the stable P3 world region IDs', () => {
    const mappedRegionIds = Object.keys(astralAssets.regions);

    expect(mappedRegionIds.sort()).toEqual(P3_ASTRAL_ACADEMY.regions.map((region) => region.id).sort());
  });

  it('safely handles missing or unknown region IDs', () => {
    expect(getAstralRegionAsset('algebra-forge')).toBe('/assets/ui/astral/regions/algebra-vault.png');
    expect(getAstralRegionAsset('unknown-region')).toBeUndefined();
    expect(() => getAstralRegionAsset('unknown-region')).not.toThrow();
  });
});
