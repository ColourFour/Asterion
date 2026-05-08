import { astralAssets } from './astralAssets';
import type { AvatarRenderMode } from './avatarRenderMode';
import type { AvatarItem } from '../data/avatarCatalog';

type AvatarModeAssetOverrides = Partial<Record<AvatarRenderMode, Record<string, string>>>;

const AVATAR_MODE_ASSET_OVERRIDES: AvatarModeAssetOverrides = {
  map: {},
  region: {},
  portrait: {},
};

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function modeSpecificAssetPath(item: AvatarItem, mode: AvatarRenderMode): string | undefined {
  return AVATAR_MODE_ASSET_OVERRIDES[mode]?.[item.id];
}

function genericModeAssetPath(item: AvatarItem, mode: AvatarRenderMode): string | undefined {
  if (item.slot !== 'base') return undefined;
  if (mode === 'map') return astralAssets.avatarStudentMap;
  if (mode === 'region' || mode === 'portrait') return astralAssets.avatarStudentFront;
  return undefined;
}

export function avatarLayerAssetCandidates(item: AvatarItem, mode: AvatarRenderMode): string[] {
  if (mode === 'builder') return unique([item.assetPath]);
  return unique([modeSpecificAssetPath(item, mode), item.assetPath, genericModeAssetPath(item, mode)]);
}
