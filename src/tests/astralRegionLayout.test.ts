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
  it('uses a broad fixed constellation instead of clustering regions near the hub', () => {
    const layout = buildAstralRegionMapLayout(progressForAllRegions());
    const positions = Object.values(layout);
    const xs = positions.map((position) => position.x);
    const ys = positions.map((position) => position.y);

    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(70);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(58);
    expect(layout['algebra-forge'].x).toBeGreaterThanOrEqual(42);
    expect(layout['algebra-forge'].x).toBeLessThanOrEqual(58);
    expect(layout['logarithm-grove'].x).toBeLessThan(30);
    expect(layout['trig-observatory'].x).toBeGreaterThan(70);
    expect(layout['calculus-cliffs'].y).toBeGreaterThan(70);
    expect(layout['numerical-mines'].y).toBeGreaterThan(60);
    expect(layout['differential-shrine'].y).toBeGreaterThan(60);
  });

  it('changes emphasis without moving the recommended region to the center', () => {
    const layout = buildAstralRegionMapLayout(progressForAllRegions(), 'trig-observatory');

    expect(layout['trig-observatory'].priority).toBe('daily');
    expect(layout['trig-observatory'].x).toBe(ASTRAL_REGION_LAYOUT['trig-observatory'].x);
    expect(layout['trig-observatory'].y).toBe(ASTRAL_REGION_LAYOUT['trig-observatory'].y);
    expect(layout['algebra-forge'].x).toBe(ASTRAL_REGION_LAYOUT['algebra-forge'].x);
    expect(layout['algebra-forge'].y).toBe(ASTRAL_REGION_LAYOUT['algebra-forge'].y);
  });
});
