import type { AvatarSlot, RegionRank } from '../types';

export type AvatarItemCategory = 'Appearance' | 'Outfit' | 'Accessories' | 'Auras' | 'Companions' | 'Frames';

export type AvatarUnlockCondition =
  | { type: 'starter' }
  | { type: 'anyRegionRank'; rank: RegionRank; count?: number }
  | { type: 'regionRank'; regionId: string; regionName: string; rank: RegionRank };

export interface AvatarItem {
  id: string;
  slot: AvatarSlot;
  category: AvatarItemCategory;
  name: string;
  description: string;
  unlockCondition: AvatarUnlockCondition;
  unlockText: string;
  silhouette?: string;
}

export const AVATAR_CATEGORIES: AvatarItemCategory[] = [
  'Appearance',
  'Outfit',
  'Accessories',
  'Auras',
  'Companions',
  'Frames',
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
    id: 'base-academy-student',
    slot: 'base',
    category: 'Appearance',
    name: 'Academy Student',
    description: 'A clean starting character base for Paper 3 training.',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'hair-practical-crop',
    slot: 'hair',
    category: 'Appearance',
    name: 'Practical Crop',
    description: 'Simple study-ready hair.',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'face-focused',
    slot: 'face',
    category: 'Appearance',
    name: 'Focused Face',
    description: 'Calm expression for long algebra sessions.',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'outfit-academy-tunic',
    slot: 'outfit',
    category: 'Outfit',
    name: 'Academy Tunic',
    description: 'Standard academy practice wear.',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'cloak-none',
    slot: 'cloak',
    category: 'Outfit',
    name: 'No Cloak',
    description: 'Keep the outfit light.',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'accessory-none',
    slot: 'accessory',
    category: 'Accessories',
    name: 'No Accessory',
    description: 'Leave both hands free for working.',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'aura-none',
    slot: 'aura',
    category: 'Auras',
    name: 'No Aura',
    description: 'A quiet profile stage.',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'companion-none',
    slot: 'companion',
    category: 'Companions',
    name: 'No Companion',
    description: 'Travel solo around the academy.',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'frame-plain',
    slot: 'frame',
    category: 'Frames',
    name: 'Plain Frame',
    description: 'A simple character sheet border.',
    unlockCondition: { type: 'starter' },
    unlockText: 'Starter item.',
  },
  {
    id: 'cloak-apprentice',
    slot: 'cloak',
    category: 'Outfit',
    name: 'Apprentice Cloak',
    description: 'The first visible sign that a region has been restored.',
    unlockCondition: { type: 'anyRegionRank', rank: 'Bronze', count: 1 },
    unlockText: 'Reach Bronze in any region.',
    silhouette: 'Cloak preview',
  },
  {
    id: 'outfit-bronze-scholar',
    slot: 'outfit',
    category: 'Outfit',
    name: 'Bronze Scholar Robe',
    description: 'A warmer robe for students with proven first-region evidence.',
    unlockCondition: { type: 'anyRegionRank', rank: 'Bronze', count: 1 },
    unlockText: 'Reach Bronze in any region.',
    silhouette: 'Robe preview',
  },
  {
    id: 'hair-stargazer',
    slot: 'hair',
    category: 'Appearance',
    name: 'Stargazer Sweep',
    description: 'A brighter style earned after the first restored wing.',
    unlockCondition: { type: 'anyRegionRank', rank: 'Bronze', count: 1 },
    unlockText: 'Reach Bronze in any region.',
    silhouette: 'Hair preview',
  },
  {
    id: 'frame-bronze-wing',
    slot: 'frame',
    category: 'Frames',
    name: 'Bronze Wing Frame',
    description: 'A parchment frame stamped with the first restoration mark.',
    unlockCondition: { type: 'anyRegionRank', rank: 'Bronze', count: 1 },
    unlockText: 'Reach Bronze in any region.',
    silhouette: 'Frame preview',
  },
  {
    id: 'accessory-archive-gauntlets',
    slot: 'accessory',
    category: 'Accessories',
    name: 'Archive Gauntlets',
    description: 'Brass study gloves from the Algebra Vault.',
    unlockCondition: { type: 'regionRank', regionId: 'algebra-forge', regionName: 'Algebra Vault', rank: 'Silver' },
    unlockText: 'Reach Silver in Algebra Vault.',
    silhouette: 'Gauntlets preview',
  },
  {
    id: 'accessory-star-lens',
    slot: 'accessory',
    category: 'Accessories',
    name: 'Star Lens',
    description: 'A trigonometry lens for spotting hidden structure.',
    unlockCondition: { type: 'regionRank', regionId: 'trig-observatory', regionName: 'Trigonometry Spire', rank: 'Silver' },
    unlockText: 'Reach Silver in Trigonometry Spire.',
    silhouette: 'Lens preview',
  },
  {
    id: 'accessory-argand-compass',
    slot: 'accessory',
    category: 'Accessories',
    name: 'Argand Compass',
    description: 'A small compass tuned to complex-plane navigation.',
    unlockCondition: { type: 'regionRank', regionId: 'complex-harbor', regionName: 'Argand Atrium', rank: 'Silver' },
    unlockText: 'Reach Silver in Argand Atrium.',
    silhouette: 'Compass preview',
  },
  {
    id: 'companion-integral-sprite',
    slot: 'companion',
    category: 'Companions',
    name: 'Integral Sprite',
    description: 'A quiet study companion from the Integral Terraces.',
    unlockCondition: { type: 'regionRank', regionId: 'integration-gardens', regionName: 'Integral Terraces', rank: 'Silver' },
    unlockText: 'Reach Silver in Integral Terraces.',
    silhouette: 'Companion preview',
  },
  {
    id: 'aura-astral-trim',
    slot: 'aura',
    category: 'Auras',
    name: 'Astral Trim',
    description: 'A soft gold orbit for students who reach Gold in a region.',
    unlockCondition: { type: 'anyRegionRank', rank: 'Gold', count: 1 },
    unlockText: 'Reach Gold in any region.',
    silhouette: 'Aura preview',
  },
  {
    id: 'outfit-gold-regalia',
    slot: 'outfit',
    category: 'Outfit',
    name: 'Gold Regalia',
    description: 'Formal academy colors for deep regional mastery.',
    unlockCondition: { type: 'anyRegionRank', rank: 'Gold', count: 1 },
    unlockText: 'Reach Gold in any region.',
    silhouette: 'Regalia preview',
  },
  {
    id: 'cloak-astral-scholar',
    slot: 'cloak',
    category: 'Outfit',
    name: 'Astral Scholar Cloak',
    description: 'A brighter cloak for a student with Gold evidence.',
    unlockCondition: { type: 'anyRegionRank', rank: 'Gold', count: 1 },
    unlockText: 'Reach Gold in any region.',
    silhouette: 'Cloak preview',
  },
  {
    id: 'frame-champion-badge',
    slot: 'frame',
    category: 'Frames',
    name: 'Academy Champion Badge',
    description: 'A showpiece frame for broad Gold-level restoration.',
    unlockCondition: { type: 'anyRegionRank', rank: 'Gold', count: 3 },
    unlockText: 'Reach Gold in 3 regions.',
    silhouette: 'Champion frame preview',
  },
  {
    id: 'aura-mastery-orbit',
    slot: 'aura',
    category: 'Auras',
    name: 'Mastery Orbit',
    description: 'A steadier orbit reserved for three Gold regions.',
    unlockCondition: { type: 'anyRegionRank', rank: 'Gold', count: 3 },
    unlockText: 'Reach Gold in 3 regions.',
    silhouette: 'Orbit preview',
  },
];

export function findAvatarItem(itemId: string): AvatarItem | undefined {
  return AVATAR_CATALOG.find((item) => item.id === itemId);
}
