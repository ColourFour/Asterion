import { AVATAR_SLOT_LABELS } from '../data/avatarCatalog';
import type { AvatarGear, AvatarSettings, AvatarSlot, StudentProfile } from '../types';
import { getVisibleAvatarLayers } from './avatarLayers';
import { normalizeAvatarSettings } from './avatarStore';

export interface ClassHallHouseSnapshot {
  name?: unknown;
  crest?: unknown;
}

export interface ClassHallAvatarSnapshot {
  id?: unknown;
  nickname?: unknown;
  displayName?: unknown;
  avatar?: Partial<AvatarSettings>;
  house?: ClassHallHouseSnapshot;
  achievements?: unknown;
  badges?: unknown;
  titles?: unknown;
  motto?: unknown;
  favoriteRegion?: unknown;
}

export interface ClassHallHouse {
  name: string;
  crest?: AvatarSettings['crest'];
}

export interface ClassHallAvatar {
  id: string;
  nickname: string;
  avatar: AvatarSettings;
  house?: ClassHallHouse;
  equippedCosmetics: string[];
  achievements: string[];
  motto?: string;
  favoriteRegion?: string;
}

const cosmeticSlots = new Set<AvatarSlot>(['hair', 'outfit', 'cloak', 'accessory', 'aura', 'companion', 'frame']);
const crests: AvatarSettings['crest'][] = ['star', 'bolt', 'compass', 'orb'];

function safeText(value: unknown, maxLength = 64): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function safeTextList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeText(item, 48))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
}

function safeCrest(value: unknown): AvatarSettings['crest'] | undefined {
  return crests.includes(value as AvatarSettings['crest'])
    ? value as AvatarSettings['crest']
    : undefined;
}

function avatarId(snapshot: ClassHallAvatarSnapshot, index: number): string {
  return safeText(snapshot.id, 48) ?? `class-hall-avatar-${index + 1}`;
}

function avatarNickname(snapshot: ClassHallAvatarSnapshot, index: number): string {
  return safeText(snapshot.nickname, 36) ?? safeText(snapshot.displayName, 36) ?? `Academy Student ${index + 1}`;
}

function normalizeHouse(value: ClassHallHouseSnapshot | undefined): ClassHallHouse | undefined {
  const name = safeText(value?.name, 40);
  if (!name) return undefined;
  return {
    name,
    crest: safeCrest(value?.crest),
  };
}

export function getClassHallEquippedCosmetics(avatar: AvatarSettings): string[] {
  return getVisibleAvatarLayers(avatar)
    .filter((layer) => cosmeticSlots.has(layer.slot))
    .map((layer) => `${AVATAR_SLOT_LABELS[layer.slot]}: ${layer.item.displayName}`);
}

export function normalizeClassHallAvatar(snapshot: ClassHallAvatarSnapshot, index = 0): ClassHallAvatar {
  const avatar = normalizeAvatarSettings(snapshot.avatar);
  const achievements = [
    ...safeTextList(snapshot.titles, 2),
    ...safeTextList(snapshot.badges, 2),
    ...safeTextList(snapshot.achievements, 2),
  ].slice(0, 2);

  return {
    id: avatarId(snapshot, index),
    nickname: avatarNickname(snapshot, index),
    avatar,
    house: normalizeHouse(snapshot.house),
    equippedCosmetics: getClassHallEquippedCosmetics(avatar),
    achievements,
    motto: safeText(snapshot.motto, 84),
    favoriteRegion: safeText(snapshot.favoriteRegion, 48),
  };
}

export function normalizeClassHallAvatars(snapshots: ClassHallAvatarSnapshot[]): ClassHallAvatar[] {
  return snapshots.map((snapshot, index) => normalizeClassHallAvatar(snapshot, index));
}

export function buildLocalClassHallSnapshot(input: {
  profile: StudentProfile;
  avatar: AvatarSettings;
  avatarGear: AvatarGear;
}): ClassHallAvatarSnapshot {
  const rewards = input.avatarGear.gear.slice(-2).reverse();
  const badges = rewards.length ? rewards : ['Local avatar'];
  return {
    id: `local-${input.profile.id}`,
    nickname: input.profile.avatarName,
    avatar: input.avatar,
    house: {
      name: 'This browser',
      crest: input.avatar.crest,
    },
    titles: [input.avatarGear.title],
    badges,
    motto: 'Saved locally on this device.',
    favoriteRegion: input.avatarGear.strongestRegionName,
  };
}
