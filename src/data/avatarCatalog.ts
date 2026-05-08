import type { AvatarSlot, RegionRank } from '../types';

export type AvatarItemCategory = 'Appearance' | 'Outfit' | 'Accessories' | 'Auras' | 'Companions' | 'Frames';
export type AvatarItemRarity = 'starter' | 'bronze' | 'silver' | 'gold' | 'mastery';

export type AvatarUnlockCondition =
  | { type: 'starter' }
  | { type: 'anyRegionRank'; rank: RegionRank; count?: number }
  | { type: 'regionRank'; regionId: string; regionName: string; rank: RegionRank };

export interface AvatarItem {
  id: string;
  slot: AvatarSlot;
  category: AvatarItemCategory;
  displayName: string;
  description: string;
  rarity: AvatarItemRarity;
  assetPath: string;
  previewPath?: string;
  unlockCondition: AvatarUnlockCondition;
  unlockText: string;
  silhouette?: string;
  isEmpty?: boolean;
}

export const AVATAR_CATEGORIES: AvatarItemCategory[] = [
  'Appearance',
  'Outfit',
  'Accessories',
  'Auras',
  'Companions',
  'Frames',
];

export const AVATAR_SLOTS: AvatarSlot[] = [
  'base',
  'hair',
  'face',
  'outfit',
  'cloak',
  'accessory',
  'aura',
  'companion',
  'frame',
];

export const AVATAR_LAYER_ORDER: AvatarSlot[] = [
  'aura',
  'companion',
  'base',
  'cloak',
  'outfit',
  'face',
  'hair',
  'accessory',
  'frame',
];

export const AVATAR_SLOT_LABELS: Record<AvatarSlot, string> = {
  base: 'Base',
  hair: 'Hair',
  face: 'Face',
  outfit: 'Outfit',
  cloak: 'Cloak',
  accessory: 'Accessory',
  aura: 'Aura',
  companion: 'Companion',
  frame: 'Frame',
};

export const AVATAR_CATALOG: AvatarItem[] = [
  {
    id: 'academy-student-base',
    slot: 'base',
    category: 'Appearance',
    displayName: 'Academy Student Base',
    description: 'The aligned starter body layer for the Astral Academy avatar canvas.',
    rarity: 'starter',
    assetPath: '/assets/avatar/base/academy-student-base.png',
    previewPath: '/assets/avatar/preview/academy-student-base.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'practical-crop',
    slot: 'hair',
    category: 'Appearance',
    displayName: 'Practical Crop',
    description: 'Simple study-ready hair with a clean HUD silhouette.',
    rarity: 'starter',
    assetPath: '/assets/avatar/hair/practical-crop.png',
    previewPath: '/assets/avatar/preview/practical-crop.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'focused-face',
    slot: 'face',
    category: 'Appearance',
    displayName: 'Focused Face',
    description: 'A calm expression for long Paper 3 sessions.',
    rarity: 'starter',
    assetPath: '/assets/avatar/face/focused-face.png',
    previewPath: '/assets/avatar/preview/focused-face.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'academy-uniform',
    slot: 'outfit',
    category: 'Outfit',
    displayName: 'Academy Uniform',
    description: 'White academy practice wear with rust-red accents.',
    rarity: 'starter',
    assetPath: '/assets/avatar/outfit/academy-uniform.png',
    previewPath: '/assets/avatar/preview/academy-uniform.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'no-cloak',
    slot: 'cloak',
    category: 'Outfit',
    displayName: 'No Cloak',
    description: 'Keep the academy uniform light.',
    rarity: 'starter',
    assetPath: '/assets/avatar/cloak/no-cloak.png',
    previewPath: '/assets/avatar/preview/no-cloak.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
    isEmpty: true,
  },
  {
    id: 'no-accessory',
    slot: 'accessory',
    category: 'Accessories',
    displayName: 'No Accessory',
    description: 'Leave both hands free for working.',
    rarity: 'starter',
    assetPath: '/assets/avatar/accessory/no-accessory.png',
    previewPath: '/assets/avatar/preview/no-accessory.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
    isEmpty: true,
  },
  {
    id: 'no-aura',
    slot: 'aura',
    category: 'Auras',
    displayName: 'No Aura',
    description: 'A quiet profile stage.',
    rarity: 'starter',
    assetPath: '/assets/avatar/aura/no-aura.png',
    previewPath: '/assets/avatar/preview/no-aura.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
    isEmpty: true,
  },
  {
    id: 'no-companion',
    slot: 'companion',
    category: 'Companions',
    displayName: 'No Companion',
    description: 'Travel solo around the academy.',
    rarity: 'starter',
    assetPath: '/assets/avatar/companion/no-companion.png',
    previewPath: '/assets/avatar/preview/no-companion.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
    isEmpty: true,
  },
  {
    id: 'plain-academy-frame',
    slot: 'frame',
    category: 'Frames',
    displayName: 'Plain Academy Frame',
    description: 'A simple character-sheet border for the starter portrait.',
    rarity: 'starter',
    assetPath: '/assets/avatar/frame/plain-academy-frame.png',
    previewPath: '/assets/avatar/preview/plain-academy-frame.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'stargazer-sweep',
    slot: 'hair',
    category: 'Appearance',
    displayName: 'Stargazer Sweep',
    description: 'A brighter style earned after the first restored region.',
    rarity: 'bronze',
    assetPath: '/assets/avatar/hair/stargazer-sweep.png',
    previewPath: '/assets/avatar/preview/stargazer-sweep.png',
    unlockCondition: { type: 'anyRegionRank', rank: 'Bronze', count: 1 },
    unlockText: 'Reach Bronze in any region.',
    silhouette: 'Hair reward preview',
  },
  {
    id: 'apprentice-cloak',
    slot: 'cloak',
    category: 'Outfit',
    displayName: 'Apprentice Cloak',
    description: 'The first visible sign that a region has been restored.',
    rarity: 'bronze',
    assetPath: '/assets/avatar/cloak/apprentice-cloak.png',
    previewPath: '/assets/avatar/preview/apprentice-cloak.png',
    unlockCondition: { type: 'anyRegionRank', rank: 'Bronze', count: 1 },
    unlockText: 'Reach Bronze in any region.',
    silhouette: 'Cloak reward preview',
  },
  {
    id: 'bronze-academy-frame',
    slot: 'frame',
    category: 'Frames',
    displayName: 'Bronze Academy Frame',
    description: 'A parchment frame stamped with the first restoration mark.',
    rarity: 'bronze',
    assetPath: '/assets/avatar/frame/bronze-academy-frame.png',
    previewPath: '/assets/avatar/preview/bronze-academy-frame.png',
    unlockCondition: { type: 'anyRegionRank', rank: 'Bronze', count: 1 },
    unlockText: 'Reach Bronze in any region.',
    silhouette: 'Frame reward preview',
  },
  {
    id: 'algebra-pin',
    slot: 'accessory',
    category: 'Accessories',
    displayName: 'Algebra Pin',
    description: 'A brass study pin from the Algebra Vault.',
    rarity: 'silver',
    assetPath: '/assets/avatar/accessory/algebra-pin.png',
    previewPath: '/assets/avatar/preview/algebra-pin.png',
    unlockCondition: { type: 'regionRank', regionId: 'algebra-forge', regionName: 'Algebra Vault', rank: 'Silver' },
    unlockText: 'Reach Silver in Algebra Vault.',
    silhouette: 'Pin reward preview',
  },
  {
    id: 'orbit-owl',
    slot: 'companion',
    category: 'Companions',
    displayName: 'Orbit Owl',
    description: 'A quiet study companion from the Integral Terraces.',
    rarity: 'silver',
    assetPath: '/assets/avatar/companion/orbit-owl.png',
    previewPath: '/assets/avatar/preview/orbit-owl.png',
    unlockCondition: { type: 'regionRank', regionId: 'integration-gardens', regionName: 'Integral Terraces', rank: 'Silver' },
    unlockText: 'Reach Silver in Integral Terraces.',
    silhouette: 'Companion reward preview',
  },
  {
    id: 'starfield-spark',
    slot: 'aura',
    category: 'Auras',
    displayName: 'Starfield Spark',
    description: 'A soft gold orbit for students who reach Gold in a region.',
    rarity: 'gold',
    assetPath: '/assets/avatar/aura/starfield-spark.png',
    previewPath: '/assets/avatar/preview/starfield-spark.png',
    unlockCondition: { type: 'anyRegionRank', rank: 'Gold', count: 1 },
    unlockText: 'Reach Gold in any region.',
    silhouette: 'Aura reward preview',
  },
];

const LEGACY_AVATAR_ITEM_ALIASES: Record<string, string> = {
  'base-academy-student': 'academy-student-base',
  'hair-practical-crop': 'practical-crop',
  'face-focused': 'focused-face',
  'outfit-academy-tunic': 'academy-uniform',
  'cloak-none': 'no-cloak',
  'accessory-none': 'no-accessory',
  'aura-none': 'no-aura',
  'companion-none': 'no-companion',
  'frame-plain': 'plain-academy-frame',
  'cloak-apprentice': 'apprentice-cloak',
  'hair-stargazer': 'stargazer-sweep',
  'frame-bronze-wing': 'bronze-academy-frame',
  'accessory-archive-gauntlets': 'algebra-pin',
  'companion-integral-sprite': 'orbit-owl',
  'aura-astral-trim': 'starfield-spark',
};

export function canonicalAvatarItemId(itemId: string): string {
  return LEGACY_AVATAR_ITEM_ALIASES[itemId] ?? itemId;
}

export function findAvatarItem(itemId: string): AvatarItem | undefined {
  const canonicalId = canonicalAvatarItemId(itemId);
  return AVATAR_CATALOG.find((item) => item.id === canonicalId);
}
