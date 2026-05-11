import type { AvatarGear, RegionProgress } from '../types';
import { getUnlockedAvatarItems, selectNextAvatarUnlock } from './avatarUnlocks';

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
  const restoredRegions = regions.filter((progress) => atLeast(progress, 'Bronze')).length;
  const goldRegions = regions.filter((progress) => atLeast(progress, 'Gold')).length;
  const strongest = strongestRegion(regions);
  const gear = getUnlockedAvatarItems(regions)
    .filter((item) => item.rarity !== 'starter')
    .map((item) => item.displayName);
  const nextAvatarUnlock = selectNextAvatarUnlock(regions);

  const title = goldRegions >= 3
    ? 'Academy Champion'
    : goldRegions > 0
      ? 'Astral Scholar'
      : atLeast(byId.get('algebra-forge'), 'Silver') || atLeast(byId.get('integration-gardens'), 'Silver')
        ? 'Region Specialist'
        : restoredRegions > 0
          ? 'Apprentice Restorer'
          : 'New Arrival';

  return {
    title,
    gear,
    restoredRegions,
    goldRegions,
    strongestRegionName: strongest?.region.name,
    strongestRegionRank: strongest?.rank,
    nextUnlock: nextAvatarUnlock?.item.displayName,
    nextUnlockRequirement: nextAvatarUnlock?.item.unlockText,
  };
}
