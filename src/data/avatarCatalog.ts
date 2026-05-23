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
    id: 'student-body-a',
    slot: 'base',
    category: 'Appearance',
    displayName: 'Student Body A',
    description: 'The default v0.2 Astral Academy student body layer.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/base/student-body-a.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'student-body-b',
    slot: 'base',
    category: 'Appearance',
    displayName: 'Student Body B',
    description: 'An alternate v0.2 student body layer for the academy avatar canvas.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/base/student-body-b.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'tousled-short',
    slot: 'hair',
    category: 'Appearance',
    displayName: 'Tousled Short',
    description: 'A study-ready short hairstyle for the v0.2 avatar set.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/hair/tousled-short.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'neat-side-part',
    slot: 'hair',
    category: 'Appearance',
    displayName: 'Neat Side Part',
    description: 'A tidy academy hairstyle for quiet practice sessions.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/hair/neat-side-part.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'short-crop',
    slot: 'hair',
    category: 'Appearance',
    displayName: 'Short Crop',
    description: 'A compact v0.2 hairstyle with a clear HUD silhouette.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/hair/short-crop.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'bob-with-bangs',
    slot: 'hair',
    category: 'Appearance',
    displayName: 'Bob with Bangs',
    description: 'A starter bob hairstyle aligned to the v0.2 avatar canvas.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/hair/bob-with-bangs.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'confident-smile',
    slot: 'face',
    category: 'Appearance',
    displayName: 'Confident Smile',
    description: 'A confident expression for the starter academy avatar.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/face/confident-smile.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'calm-neutral',
    slot: 'face',
    category: 'Appearance',
    displayName: 'Calm Neutral',
    description: 'A calm expression for steady Paper 3 practice.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/face/calm-neutral.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'school-spirit-tracksuit',
    slot: 'outfit',
    category: 'Outfit',
    displayName: 'School Spirit Tracksuit',
    description: 'The v0.2 academy outfit layer for practice and map cameos.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/outfit/school-spirit-tracksuit.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
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
    assetPath: '/assets/avatar-v0.2/empty/no-cloak.png',
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
    assetPath: '/assets/avatar-v0.2/empty/no-accessory.png',
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
    assetPath: '/assets/avatar-v0.2/empty/no-aura.png',
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
    assetPath: '/assets/avatar-v0.2/empty/no-companion.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
    isEmpty: true,
  },
  {
    id: 'no-frame',
    slot: 'frame',
    category: 'Frames',
    displayName: 'No Frame',
    description: 'Keep the v0.2 avatar portrait unframed.',
    rarity: 'starter',
    assetPath: '/assets/avatar-v0.2/empty/no-frame.png',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
    isEmpty: true,
  },
  {
    id: 'shoulder-length-straight',
    slot: 'hair',
    category: 'Appearance',
    displayName: 'Shoulder-Length Straight',
    description: 'A longer hairstyle earned after the first restored region.',
    rarity: 'bronze',
    assetPath: '/assets/avatar-v0.2/hair/shoulder-length-straight.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'anyRegionRank', rank: 'Bronze', count: 1 },
    unlockText: 'Reach Bronze in any region.',
    silhouette: 'Hair reward preview',
  },
  {
    id: 'determined',
    slot: 'face',
    category: 'Appearance',
    displayName: 'Determined',
    description: 'A focused expression earned by restoring a first region.',
    rarity: 'bronze',
    assetPath: '/assets/avatar-v0.2/face/determined.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'anyRegionRank', rank: 'Bronze', count: 1 },
    unlockText: 'Reach Bronze in any region.',
    silhouette: 'Face reward preview',
  },
  {
    id: 'low-ponytail',
    slot: 'hair',
    category: 'Appearance',
    displayName: 'Low Ponytail',
    description: 'A practical hairstyle unlocked through Algebra Vault progress.',
    rarity: 'silver',
    assetPath: '/assets/avatar-v0.2/hair/low-ponytail.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'regionRank', regionId: 'algebra-forge', regionName: 'Algebra Vault', rank: 'Silver' },
    unlockText: 'Reach Silver in Algebra Vault.',
    silhouette: 'Hair reward preview',
  },
  {
    id: 'focused-soft',
    slot: 'face',
    category: 'Appearance',
    displayName: 'Focused Soft',
    description: 'A composed expression unlocked through Integral Terraces progress.',
    rarity: 'silver',
    assetPath: '/assets/avatar-v0.2/face/focused-soft.png',
    previewPath: '/assets/avatar-v0.2/preview/default-school-spirit.png',
    unlockCondition: { type: 'regionRank', regionId: 'integration-gardens', regionName: 'Integral Terraces', rank: 'Silver' },
    unlockText: 'Reach Silver in Integral Terraces.',
    silhouette: 'Face reward preview',
  },
];

const LEGACY_AVATAR_ITEM_ALIASES: Record<string, string> = {
  'base-academy-student': 'student-body-a',
  'academy-student-base': 'student-body-a',
  'hair-practical-crop': 'short-crop',
  'practical-crop': 'short-crop',
  'face-focused': 'confident-smile',
  'focused-face': 'confident-smile',
  'outfit-academy-tunic': 'school-spirit-tracksuit',
  'academy-uniform': 'school-spirit-tracksuit',
  'cloak-none': 'no-cloak',
  'accessory-none': 'no-accessory',
  'aura-none': 'no-aura',
  'companion-none': 'no-companion',
  'frame-plain': 'no-frame',
  'plain-academy-frame': 'no-frame',
  'cloak-apprentice': 'no-cloak',
  'apprentice-cloak': 'no-cloak',
  'hair-stargazer': 'shoulder-length-straight',
  'stargazer-sweep': 'shoulder-length-straight',
  'frame-bronze-wing': 'no-frame',
  'bronze-academy-frame': 'no-frame',
  'accessory-archive-gauntlets': 'no-accessory',
  'algebra-pin': 'no-accessory',
  'companion-integral-sprite': 'no-companion',
  'orbit-owl': 'no-companion',
  'aura-astral-trim': 'no-aura',
  'starfield-spark': 'no-aura',
};

export function canonicalAvatarItemId(itemId: string): string {
  return LEGACY_AVATAR_ITEM_ALIASES[itemId] ?? itemId;
}

export function findAvatarItem(itemId: string): AvatarItem | undefined {
  const canonicalId = canonicalAvatarItemId(itemId);
  return AVATAR_CATALOG.find((item) => item.id === canonicalId);
}
