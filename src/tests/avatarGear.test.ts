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
    expect(gear.nextUnlock).toBe('Apprentice Cloak');
    expect(gear.nextUnlockRequirement).toBe('Reach Bronze in any region.');
  });

  it('uses stable region ids for subject gear and reports visible growth state', () => {
    const gear = deriveAvatarGear([
      progress('algebra-forge', 'Silver', 32),
      progress('trig-observatory', 'Silver', 30),
      progress('complex-harbor', 'Bronze', 18),
    ]);

    expect(gear.gear).toEqual(['Apprentice Cloak', 'Archive Gauntlets', 'Star Lens']);
    expect(gear.title).toBe('Region Specialist');
    expect(gear.restoredRegions).toBe(3);
    expect(gear.strongestRegionName).toBe('Algebra Vault');
    expect(gear.strongestRegionRank).toBe('Silver');
    expect(gear.nextUnlock).toBe('Argand Compass');
  });

  it('sets the champion badge goal from real gold-region count', () => {
    const gear = deriveAvatarGear([
      progress('algebra-forge', 'Gold', 80),
      progress('trig-observatory', 'Gold', 75),
      progress('complex-harbor', 'Silver', 50),
    ]);

    expect(gear.gear).toContain('Astral Trim');
    expect(gear.gear).not.toContain('Academy Champion Badge');
    expect(gear.goldRegions).toBe(2);
    expect(gear.nextUnlock).toBe('Academy Champion Badge');
    expect(gear.nextUnlockRequirement).toBe('Reach Gold in 3 regions.');
  });
});
