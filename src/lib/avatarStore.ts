import { AVATAR_CATALOG, findAvatarItem, type AvatarItem } from '../data/avatarCatalog';
import type { AvatarSettings, AvatarSlot, RegionProgress } from '../types';
import { isAvatarItemUnlocked } from './avatarUnlocks';

const palettes: AvatarSettings['palette'][] = ['ember', 'aqua', 'violet', 'leaf'];
const crests: AvatarSettings['crest'][] = ['star', 'bolt', 'compass', 'orb'];

export const DEFAULT_EQUIPPED_AVATAR_ITEMS: Record<AvatarSlot, string> = {
  base: 'student-body-a',
  hair: 'tousled-short',
  face: 'confident-smile',
  outfit: 'school-spirit-tracksuit',
  cloak: 'no-cloak',
  accessory: 'no-accessory',
  aura: 'no-aura',
  companion: 'no-companion',
  frame: 'no-frame',
};

export const DEFAULT_AVATAR_SETTINGS: AvatarSettings = {
  palette: 'ember',
  crest: 'star',
  equipped: DEFAULT_EQUIPPED_AVATAR_ITEMS,
};

function isAvatarSlot(value: string): value is AvatarSlot {
  return value in DEFAULT_EQUIPPED_AVATAR_ITEMS;
}

function itemIsValidForSlot(slot: AvatarSlot, itemId: string, progress?: RegionProgress[]): boolean {
  const item = findAvatarItem(itemId);
  if (!item || item.slot !== slot) return false;
  return progress ? isAvatarItemUnlocked(item, progress) : true;
}

function validPalette(value: unknown): AvatarSettings['palette'] {
  return palettes.includes(value as AvatarSettings['palette'])
    ? value as AvatarSettings['palette']
    : DEFAULT_AVATAR_SETTINGS.palette;
}

function validCrest(value: unknown): AvatarSettings['crest'] {
  return crests.includes(value as AvatarSettings['crest'])
    ? value as AvatarSettings['crest']
    : DEFAULT_AVATAR_SETTINGS.crest;
}

export function normalizeEquippedItems(
  equipped: AvatarSettings['equipped'] | undefined,
  progress?: RegionProgress[],
): Record<AvatarSlot, string> {
  const next = { ...DEFAULT_EQUIPPED_AVATAR_ITEMS };
  if (!equipped) return next;

  for (const [slot, itemId] of Object.entries(equipped)) {
    if (!isAvatarSlot(slot) || typeof itemId !== 'string') continue;
    const item = findAvatarItem(itemId);
    if (item && itemIsValidForSlot(slot, itemId, progress)) next[slot] = item.id;
  }

  return next;
}

export function normalizeAvatarSettings(avatar?: Partial<AvatarSettings>, progress?: RegionProgress[]): AvatarSettings {
  return {
    palette: validPalette(avatar?.palette),
    crest: validCrest(avatar?.crest),
    equipped: normalizeEquippedItems(avatar?.equipped, progress),
  };
}

export function getEquippedAvatarItem(avatar: AvatarSettings, slot: AvatarSlot, progress?: RegionProgress[]): AvatarItem {
  const itemId = normalizeEquippedItems(avatar.equipped, progress)[slot];
  return findAvatarItem(itemId) ?? AVATAR_CATALOG.find((item) => item.id === DEFAULT_EQUIPPED_AVATAR_ITEMS[slot])!;
}

export function equipAvatarItem(avatar: AvatarSettings, item: AvatarItem, progress: RegionProgress[]): AvatarSettings {
  if (!isAvatarItemUnlocked(item, progress)) return avatar;
  const equipped = normalizeEquippedItems(avatar.equipped, progress);
  return {
    ...normalizeAvatarSettings(avatar, progress),
    equipped: {
      ...equipped,
      [item.slot]: item.id,
    },
  };
}
