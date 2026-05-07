import type { AvatarGear, RegionProgress } from '../types';

const rankValue = {
  Dormant: 0,
  Discovered: 1,
  Bronze: 2,
  Silver: 3,
  Gold: 4,
  Mastered: 5,
};

function atLeast(progress: RegionProgress | undefined, rank: keyof typeof rankValue): boolean {
  return Boolean(progress && rankValue[progress.rank] >= rankValue[rank]);
}

function strongestRegion(regions: RegionProgress[]): RegionProgress | undefined {
  return [...regions]
    .filter((progress) => progress.isActive)
    .sort((a, b) => (
      rankValue[b.rank] - rankValue[a.rank]
      || b.totalMarksEarned - a.totalMarksEarned
      || a.region.name.localeCompare(b.region.name)
    ))[0];
}

export function deriveAvatarGear(regions: RegionProgress[]): AvatarGear {
  const byId = new Map(regions.map((progress) => [progress.region.id, progress]));
  const gear: string[] = [];
  const restoredRegions = regions.filter((progress) => atLeast(progress, 'Bronze')).length;
  const goldRegions = regions.filter((progress) => atLeast(progress, 'Gold')).length;
  const strongest = strongestRegion(regions);

  if (restoredRegions > 0) gear.push('Apprentice Cloak');
  if (atLeast(byId.get('algebra-forge'), 'Silver')) gear.push('Archive Gauntlets');
  if (atLeast(byId.get('trig-observatory'), 'Silver')) gear.push('Star Lens');
  if (atLeast(byId.get('complex-harbor'), 'Silver')) gear.push('Argand Compass');
  if (goldRegions > 0) gear.push('Astral Trim');
  if (goldRegions >= 3) gear.push('Academy Champion Badge');

  const title = gear.includes('Academy Champion Badge')
    ? 'Academy Champion'
    : gear.includes('Astral Trim')
      ? 'Astral Scholar'
      : gear.some((item) => item !== 'Apprentice Cloak')
        ? 'Region Specialist'
        : gear.includes('Apprentice Cloak')
          ? 'Apprentice Restorer'
          : 'New Arrival';

  const nextUnlock = !gear.includes('Apprentice Cloak')
    ? { nextUnlock: 'Apprentice Cloak', nextUnlockRequirement: 'Reach Bronze in any region.' }
    : !gear.includes('Archive Gauntlets')
      ? { nextUnlock: 'Archive Gauntlets', nextUnlockRequirement: 'Reach Silver in Algebra Vault.' }
      : !gear.includes('Star Lens')
        ? { nextUnlock: 'Star Lens', nextUnlockRequirement: 'Reach Silver in Trigonometry Spire.' }
        : !gear.includes('Argand Compass')
          ? { nextUnlock: 'Argand Compass', nextUnlockRequirement: 'Reach Silver in Argand Atrium.' }
          : !gear.includes('Astral Trim')
            ? { nextUnlock: 'Astral Trim', nextUnlockRequirement: 'Reach Gold in any region.' }
            : !gear.includes('Academy Champion Badge')
              ? { nextUnlock: 'Academy Champion Badge', nextUnlockRequirement: 'Reach Gold in 3 regions.' }
              : {};

  return {
    title,
    gear,
    restoredRegions,
    goldRegions,
    strongestRegionName: strongest?.region.name,
    strongestRegionRank: strongest?.rank,
    ...nextUnlock,
  };
}
