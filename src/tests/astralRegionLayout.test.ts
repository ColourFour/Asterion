import { describe, expect, it } from 'vitest';
import { ASTRAL_REGION_LAYOUT, buildAstralRegionMapLayout } from '../lib/astralRegionLayout';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import type { RegionProgress } from '../types';

function progressForAllRegions(overrides: Partial<RegionProgress> = {}): RegionProgress[] {
  return P3_ASTRAL_ACADEMY.regions.map((region) => ({
    region,
    availableQuestions: 8,
    attempts: 0,
    totalMarksEarned: 0,
    totalMarksAvailable: 0,
    averageScoreRatio: undefined,
    recentScoreRatio: undefined,
    subtopicsTouched: 0,
    rank: 'Discovered',
    isActive: true,
    ...overrides,
  }));
}

describe('Astral Academy region map layout', () => {
  it('defines one safe desktop slot for every P3 region', () => {
    const regionIds = P3_ASTRAL_ACADEMY.regions.map((region) => region.id).sort();
    const layoutIds = Object.keys(ASTRAL_REGION_LAYOUT).sort();

    expect(layoutIds).toEqual(regionIds);
    Object.entries(ASTRAL_REGION_LAYOUT).forEach(([regionId, slot]) => {
      expect(slot.regionId).toBe(regionId);
      expect(slot.xPct).toBeGreaterThanOrEqual(10);
      expect(slot.xPct).toBeLessThanOrEqual(90);
      expect(slot.yPct).toBeGreaterThanOrEqual(10);
      expect(slot.yPct).toBeLessThanOrEqual(80);
      expect(slot.label.maxWidthPx).toBeGreaterThanOrEqual(120);
    });
  });

  it('uses the sketch order and scale hierarchy without displaying it as map markers', () => {
    const layout = buildAstralRegionMapLayout(progressForAllRegions());

    expect(layout['algebra-forge'].priorityOrder).toBe(1);
    expect(layout['logarithm-grove'].priorityOrder).toBe(2);
    expect(layout['trig-observatory'].priorityOrder).toBe(3);
    expect(layout['numerical-mines'].priorityOrder).toBe(4);
    expect(layout['complex-harbor'].priorityOrder).toBe(5);
    expect(layout['integration-gardens'].priorityOrder).toBe(6);
    expect(layout['calculus-cliffs'].priorityOrder).toBe(7);
    expect(layout['vector-workshop'].priorityOrder).toBe(8);
    expect(layout['differential-shrine'].priorityOrder).toBe(9);
    expect(layout['algebra-forge'].scale).toBe(ASTRAL_REGION_LAYOUT['algebra-forge'].scale);
    expect(layout['logarithm-grove'].scale).toBe(ASTRAL_REGION_LAYOUT['logarithm-grove'].scale);
    expect(layout['algebra-forge'].scale).toBeGreaterThan(layout['logarithm-grove'].scale);
    expect(layout['logarithm-grove'].scale).toBeGreaterThan(layout['vector-workshop'].scale);
  });

  it('uses a dense fixed sketch constellation around the central Algebra Vault', () => {
    const layout = buildAstralRegionMapLayout(progressForAllRegions());
    const positions = Object.values(layout);
    const xs = positions.map((position) => position.xPct);
    const ys = positions.map((position) => position.yPct);

    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(70);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(58);
    expect(layout['algebra-forge'].xPct).toBeGreaterThanOrEqual(48);
    expect(layout['algebra-forge'].xPct).toBeLessThanOrEqual(56);
    expect(layout['algebra-forge'].yPct).toBeGreaterThanOrEqual(38);
    expect(layout['algebra-forge'].yPct).toBeLessThanOrEqual(46);
    expect(layout['logarithm-grove'].xPct).toBeLessThan(18);
    expect(layout['logarithm-grove'].yPct).toBeLessThan(24);
    expect(layout['trig-observatory'].xPct).toBeGreaterThan(82);
    expect(layout['trig-observatory'].yPct).toBeLessThan(28);
    expect(layout['calculus-cliffs'].xPct).toBeLessThan(18);
    expect(layout['calculus-cliffs'].yPct).toBeGreaterThan(68);
    expect(layout['numerical-mines'].yPct).toBeGreaterThan(60);
    expect(layout['integration-gardens'].xPct).toBeGreaterThan(64);
    expect(layout['differential-shrine'].yPct).toBeGreaterThan(60);
  });

  it('keeps representative desktop region centers separated', () => {
    const layout = buildAstralRegionMapLayout(progressForAllRegions());
    const positions = Object.values(layout);
    const stage = { width: 1600, height: 720 };
    const distances: number[] = [];

    positions.forEach((first, firstIndex) => {
      positions.slice(firstIndex + 1).forEach((second) => {
        distances.push(Math.hypot(
          ((first.xPct - second.xPct) / 100) * stage.width,
          ((first.yPct - second.yPct) / 100) * stage.height,
        ));
      });
    });

    expect(Math.min(...distances)).toBeGreaterThanOrEqual(150);
  });

  it('changes emphasis without moving the recommended region to the center', () => {
    const layout = buildAstralRegionMapLayout(progressForAllRegions(), 'trig-observatory');

    expect(layout['trig-observatory'].priority).toBe('daily');
    expect(layout['trig-observatory'].scale).toBe(ASTRAL_REGION_LAYOUT['trig-observatory'].scale);
    expect(layout['algebra-forge'].scale).toBe(ASTRAL_REGION_LAYOUT['algebra-forge'].scale);
    expect(layout['trig-observatory'].xPct).toBe(ASTRAL_REGION_LAYOUT['trig-observatory'].xPct);
    expect(layout['trig-observatory'].yPct).toBe(ASTRAL_REGION_LAYOUT['trig-observatory'].yPct);
    expect(layout['algebra-forge'].xPct).toBe(ASTRAL_REGION_LAYOUT['algebra-forge'].xPct);
    expect(layout['algebra-forge'].yPct).toBe(ASTRAL_REGION_LAYOUT['algebra-forge'].yPct);
  });
});
