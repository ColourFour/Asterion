import { beforeEach, describe, expect, it } from 'vitest';
import { AVATAR_CATALOG } from '../data/avatarCatalog';
import { equipAvatarItem, normalizeEquippedItems } from '../lib/avatarStore';
import { isAvatarItemUnlocked, selectNextAvatarUnlock } from '../lib/avatarUnlocks';
import { emptyProgress, loadProgress, saveAvatar } from '../lib/progressStore';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';
import type { RegionProgress, RegionRank } from '../types';

function item(itemId: string) {
  const found = AVATAR_CATALOG.find((catalogItem) => catalogItem.id === itemId);
  if (!found) throw new Error(`Missing avatar item ${itemId}`);
  return found;
}

function progress(regionId: string, rank: RegionRank, totalMarksEarned = 0): RegionProgress {
  const region = P3_ASTRAL_ACADEMY.regions.find((candidate) => candidate.id === regionId)!;
  return {
    region,
    availableQuestions: 4,
    attempts: totalMarksEarned > 0 ? 7 : 0,
    totalMarksEarned,
    totalMarksAvailable: totalMarksEarned > 0 ? 10 : 0,
    subtopicsTouched: totalMarksEarned > 0 ? 1 : 0,
    rank,
    isActive: true,
  };
}

describe('avatar customization state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('makes starter items available without region progress', () => {
    expect(isAvatarItemUnlocked(item('base-academy-student'), [])).toBe(true);
    expect(isAvatarItemUnlocked(item('outfit-academy-tunic'), [])).toBe(true);
    expect(isAvatarItemUnlocked(item('cloak-none'), [])).toBe(true);
  });

  it('does not equip locked items', () => {
    const avatar = emptyProgress().avatar;
    const next = equipAvatarItem(avatar, item('cloak-apprentice'), []);

    expect(normalizeEquippedItems(next.equipped).cloak).toBe('cloak-none');
  });

  it('equips unlocked items', () => {
    const avatar = emptyProgress().avatar;
    const next = equipAvatarItem(avatar, item('cloak-apprentice'), [
      progress('algebra-forge', 'Bronze', 16),
    ]);

    expect(normalizeEquippedItems(next.equipped).cloak).toBe('cloak-apprentice');
  });

  it('persists equipped avatar choices in the existing progress store', () => {
    const next = equipAvatarItem(emptyProgress().avatar, item('cloak-apprentice'), [
      progress('algebra-forge', 'Bronze', 16),
    ]);

    saveAvatar(next);

    expect(loadProgress().avatar.equipped?.cloak).toBe('cloak-apprentice');
  });

  it('selects the next locked reward deterministically from catalog order', () => {
    const next = selectNextAvatarUnlock([
      progress('algebra-forge', 'Silver', 32),
      progress('trig-observatory', 'Discovered'),
      progress('complex-harbor', 'Discovered'),
      progress('integration-gardens', 'Discovered'),
    ]);

    expect(next?.item.id).toBe('accessory-star-lens');
    expect(next?.progress.label).toBe('Discovered / Silver in Trigonometry Spire');
  });
});
