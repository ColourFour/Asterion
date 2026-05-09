import { AVATAR_LAYER_ORDER, type AvatarItem } from '../data/avatarCatalog';
import type { AvatarSettings, AvatarSlot, RegionProgress } from '../types';
import { getEquippedAvatarItem, normalizeAvatarSettings } from './avatarStore';

export interface AvatarLayer {
  slot: AvatarSlot;
  item: AvatarItem;
  order: number;
}

export function getAvatarLayers(avatar: AvatarSettings, progress?: RegionProgress[]): AvatarLayer[] {
  const normalized = normalizeAvatarSettings(avatar, progress);

  return AVATAR_LAYER_ORDER.map((slot, order) => ({
    slot,
    item: getEquippedAvatarItem(normalized, slot, progress),
    order,
  }));
}

export function getVisibleAvatarLayers(avatar: AvatarSettings, progress?: RegionProgress[]): AvatarLayer[] {
  return getAvatarLayers(avatar, progress).filter((layer) => !layer.item.isEmpty);
}
