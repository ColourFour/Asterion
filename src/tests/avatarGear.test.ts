import { describe, expect, it } from 'vitest';
import type { RegionProgress, RegionRank } from '../types';
import { deriveAvatarGear } from '../lib/avatarGear';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

function progress(regionId: string, rank: RegionRank, totalMarksEarned = 0): RegionProgress {
  const region = P3_ASTRAL_ACADEMY.regions.find((item) => item.id === regionId)!;
  return {
    region,
    availableQuestions: 4,
    attempts: totalMarksEarned > 0 ? 3 : 0,
    totalMarksEarned,
    totalMarksAvailable: totalMarksEarned > 0 ? 10 : 0,
    subtopicsTouched: totalMarksEarned > 0 ? 1 : 0,
    rank,
    isActive: true,
  };
}

describe('deriveAvatarGear', () => {
  it('shows the first real-progress unlock goal for a new student', () => {
    const gear = deriveAvatarGear([
      progress('algebra-forge', 'Discovered'),
      progress('trig-observatory', 'Discovered'),
    ]);

    expect(gear.title).toBe('New Arrival');
    expect(gear.gear).toEqual([]);
    expect(gear.nextUnlock).toBe('Stargazer Sweep');
    expect(gear.nextUnlockRequirement).toBe('Reach Bronze in any region.');
  });

  it('uses stable region ids for subject gear and reports visible growth state', () => {
    const gear = deriveAvatarGear([
      progress('algebra-forge', 'Silver', 32),
      progress('trig-observatory', 'Silver', 30),
      progress('integration-gardens', 'Bronze', 18),
    ]);

    expect(gear.gear).toEqual(['Stargazer Sweep', 'Apprentice Cloak', 'Bronze Academy Frame', 'Algebra Pin']);
    expect(gear.title).toBe('Region Specialist');
    expect(gear.restoredRegions).toBe(3);
    expect(gear.strongestRegionName).toBe('Algebra Vault');
    expect(gear.strongestRegionRank).toBe('Silver');
    expect(gear.nextUnlock).toBe('Orbit Owl');
  });

  it('sets the next manifest reward from real gold-region count', () => {
    const gear = deriveAvatarGear([
      progress('algebra-forge', 'Gold', 80),
      progress('trig-observatory', 'Gold', 75),
      progress('complex-harbor', 'Silver', 50),
    ]);

    expect(gear.gear).toContain('Starfield Spark');
    expect(gear.gear).not.toContain('Orbit Owl');
    expect(gear.goldRegions).toBe(2);
    expect(gear.nextUnlock).toBe('Orbit Owl');
    expect(gear.nextUnlockRequirement).toBe('Reach Silver in Integral Terraces.');
  });

  it('derives the champion title from real gold-region count', () => {
    const gear = deriveAvatarGear([
      progress('algebra-forge', 'Gold', 80),
      progress('trig-observatory', 'Gold', 75),
      progress('complex-harbor', 'Gold', 72),
    ]);

    expect(gear.title).toBe('Academy Champion');
    expect(gear.goldRegions).toBe(3);
  });
});
