import type { AvatarSettings, RegionProgress } from '../../types';
import { getEquippedAvatarItem, normalizeAvatarSettings } from '../../lib/avatarStore';

interface AvatarPreviewProps {
  avatarName: string;
  avatar: AvatarSettings;
  regionProgress: RegionProgress[];
}

export function AvatarPreview({ avatarName, avatar, regionProgress }: AvatarPreviewProps) {
  const normalized = normalizeAvatarSettings(avatar, regionProgress);
  const hair = getEquippedAvatarItem(normalized, 'hair', regionProgress);
  const outfit = getEquippedAvatarItem(normalized, 'outfit', regionProgress);
  const cloak = getEquippedAvatarItem(normalized, 'cloak', regionProgress);
  const accessory = getEquippedAvatarItem(normalized, 'accessory', regionProgress);
  const aura = getEquippedAvatarItem(normalized, 'aura', regionProgress);
  const companion = getEquippedAvatarItem(normalized, 'companion', regionProgress);
  const frame = getEquippedAvatarItem(normalized, 'frame', regionProgress);

  const hasCloak = cloak.id !== 'cloak-none';
  const hasAura = aura.id !== 'aura-none';
  const hasCompanion = companion.id !== 'companion-none';
  const hasChampionFrame = frame.id === 'frame-champion-badge';

  return (
    <div className={`builder-avatar-stage avatar-preview-${normalized.palette} frame-${frame.id}`} aria-label={`${avatarName} avatar preview`}>
      <div className="avatar-stage-glow" aria-hidden="true" />
      <svg className="builder-avatar-svg" viewBox="0 0 280 320" role="img" aria-labelledby="avatar-preview-title">
        <title id="avatar-preview-title">{avatarName} academy character</title>
        {hasAura ? (
          <g className={`preview-aura aura-${aura.id}`}>
            <ellipse cx="140" cy="178" rx="90" ry="118" />
            <ellipse cx="140" cy="178" rx="116" ry="56" />
          </g>
        ) : null}
        <g className={`preview-frame ${hasChampionFrame ? 'is-champion' : ''}`}>
          <path d="M42 42h196v236H42z" />
          <path d="M58 58h164v204H58z" />
        </g>
        <ellipse className="preview-shadow" cx="140" cy="278" rx="64" ry="12" />
        {hasCloak ? (
          <path className={`preview-cloak ${cloak.id}`} d="M77 264c7-82 27-124 63-124s56 42 63 124c-32 15-93 15-126 0Z" />
        ) : null}
        <path className={`preview-outfit ${outfit.id}`} d="M88 256c8-55 25-82 52-82s44 27 52 82c-29 13-75 13-104 0Z" />
        <path className="preview-neck" d="M122 148h36v36c-11 10-25 10-36 0Z" />
        <circle className="preview-face" cx="140" cy="119" r="43" />
        <path className={`preview-hair ${hair.id}`} d="M98 115c-2-39 22-63 51-60 24 2 41 18 43 46-16-19-48-25-94 14Z" />
        <path className="preview-eyes" d="M119 119h11m22 0h11" />
        <path className="preview-mouth" d="M128 142c8 7 18 7 26 0" />
        {accessory.id === 'accessory-archive-gauntlets' ? (
          <g className="preview-gauntlets">
            <path d="M78 232h28v36H78zM174 232h28v36h-28z" />
            <path d="M84 240h16M180 240h16" />
          </g>
        ) : null}
        {accessory.id === 'accessory-star-lens' ? (
          <g className="preview-lens">
            <circle cx="123" cy="120" r="14" />
            <path d="M137 120h12m-40 0H96" />
          </g>
        ) : null}
        {accessory.id === 'accessory-argand-compass' ? (
          <path className="preview-compass" d="M140 188l18 42-18-12-18 12Z" />
        ) : null}
        <path className={`preview-crest crest-${normalized.crest}`} d="M140 68l7 20h22l-18 13 7 21-18-13-18 13 7-21-18-13h22Z" />
        {hasCompanion ? (
          <g className="preview-companion">
            <circle cx="218" cy="238" r="18" />
            <path d="M209 237h18m-12-10 12 10-12 10" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
