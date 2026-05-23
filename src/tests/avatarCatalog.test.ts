import { describe, expect, it } from 'vitest';
import { AVATAR_CATALOG, AVATAR_SLOTS } from '../data/avatarCatalog';
import { isAvatarItemUnlocked } from '../lib/avatarUnlocks';

const requiredStarterIds = [
  'student-body-a',
  'tousled-short',
  'confident-smile',
  'school-spirit-tracksuit',
];

const requiredLockedIds = [
  'shoulder-length-straight',
  'determined',
  'low-ponytail',
  'focused-soft',
];

describe('avatar catalog manifest', () => {
  it('uses only valid avatar slot names', () => {
    const validSlots = new Set(AVATAR_SLOTS);

    for (const item of AVATAR_CATALOG) {
      expect(validSlots.has(item.slot), item.id).toBe(true);
      expect(item.assetPath, item.id).toMatch(/^\/assets\/avatar-v0\.2\/.+\.png$/);
      expect(item.displayName.trim(), item.id).not.toBe('');
      expect(item.description.trim(), item.id).not.toBe('');
      expect(item.rarity.trim(), item.id).not.toBe('');
    }
  });

  it('includes the required starter and locked example items', () => {
    const ids = new Set(AVATAR_CATALOG.map((item) => item.id));

    for (const itemId of [...requiredStarterIds, ...requiredLockedIds]) {
      expect(ids.has(itemId), itemId).toBe(true);
    }
  });

  it('keeps all starter items unlocked without progress', () => {
    const starterItems = AVATAR_CATALOG.filter((item) => item.unlockCondition.type === 'starter');

    for (const item of starterItems) {
      expect(isAvatarItemUnlocked(item, []), item.id).toBe(true);
    }
  });
});
