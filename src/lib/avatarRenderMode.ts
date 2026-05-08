import { AVATAR_LAYER_ORDER } from '../data/avatarCatalog';
import type { AvatarSlot } from '../types';

export type AvatarRenderMode = 'builder' | 'map' | 'region' | 'portrait';

const MODE_SLOT_ORDER: Record<AvatarRenderMode, AvatarSlot[]> = {
  builder: AVATAR_LAYER_ORDER,
  portrait: AVATAR_LAYER_ORDER,
  region: ['aura', 'companion', 'base', 'cloak', 'outfit', 'face', 'hair', 'accessory'],
  map: ['aura', 'base', 'cloak', 'outfit', 'hair', 'accessory'],
};

export function avatarSlotsForRenderMode(mode: AvatarRenderMode): AvatarSlot[] {
  return MODE_SLOT_ORDER[mode];
}

export function avatarModeUsesFullCustomization(mode: AvatarRenderMode): boolean {
  return mode === 'builder' || mode === 'portrait';
}
