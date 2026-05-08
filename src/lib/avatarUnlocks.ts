import { AVATAR_CATALOG, type AvatarItem, type AvatarUnlockCondition } from '../data/avatarCatalog';
import type { RegionProgress, RegionRank } from '../types';

const rankValue: Record<RegionRank, number> = {
  Dormant: 0,
  Discovered: 1,
  Bronze: 2,
  Silver: 3,
  Gold: 4,
  Mastered: 5,
};

export interface AvatarUnlockProgress {
  unlocked: boolean;
  current: number;
  required: number;
  label: string;
}

export interface NextAvatarUnlock {
  item: AvatarItem;
  progress: AvatarUnlockProgress;
}

function atLeast(rank: RegionRank, target: RegionRank): boolean {
  return rankValue[rank] >= rankValue[target];
}

function regionProgressById(progress: RegionProgress[]): Map<string, RegionProgress> {
  return new Map(progress.map((item) => [item.region.id, item]));
}

function countRegionsAtRank(progress: RegionProgress[], rank: RegionRank): number {
  return progress.filter((item) => item.isActive && atLeast(item.rank, rank)).length;
}

function progressForCondition(condition: AvatarUnlockCondition, progress: RegionProgress[]): AvatarUnlockProgress {
  if (condition.type === 'starter') {
    return {
      unlocked: true,
      current: 1,
      required: 1,
      label: 'Starter item',
    };
  }

  if (condition.type === 'anyRegionRank') {
    const required = condition.count ?? 1;
    const current = countRegionsAtRank(progress, condition.rank);
    const regionLabel = required === 1 ? 'region' : 'regions';
    return {
      unlocked: current >= required,
      current,
      required,
      label: `${Math.min(current, required)}/${required} ${condition.rank} ${regionLabel}`,
    };
  }

  const byId = regionProgressById(progress);
  const region = byId.get(condition.regionId);
  const unlocked = Boolean(region && region.isActive && atLeast(region.rank, condition.rank));
  return {
    unlocked,
    current: unlocked ? 1 : 0,
    required: 1,
    label: `${region?.rank ?? 'Dormant'} / ${condition.rank} in ${condition.regionName}`,
  };
}

export function getAvatarUnlockProgress(item: AvatarItem, progress: RegionProgress[]): AvatarUnlockProgress {
  return progressForCondition(item.unlockCondition, progress);
}

export function isAvatarItemUnlocked(item: AvatarItem, progress: RegionProgress[]): boolean {
  return getAvatarUnlockProgress(item, progress).unlocked;
}

export function getUnlockedAvatarItems(progress: RegionProgress[], catalog: AvatarItem[] = AVATAR_CATALOG): AvatarItem[] {
  return catalog.filter((item) => isAvatarItemUnlocked(item, progress));
}

export function selectNextAvatarUnlock(progress: RegionProgress[], catalog: AvatarItem[] = AVATAR_CATALOG): NextAvatarUnlock | undefined {
  for (const item of catalog) {
    const unlockProgress = getAvatarUnlockProgress(item, progress);
    if (!unlockProgress.unlocked) return { item, progress: unlockProgress };
  }
  return undefined;
}
