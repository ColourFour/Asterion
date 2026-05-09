import { useState } from 'react';
import { AVATAR_SLOT_LABELS } from '../../data/avatarCatalog';
import { avatarLayerAssetCandidates } from '../../lib/avatarAssetMap';
import { getAvatarLayers, type AvatarLayer } from '../../lib/avatarLayers';
import { avatarSlotsForRenderMode, type AvatarRenderMode } from '../../lib/avatarRenderMode';
import { normalizeAvatarSettings } from '../../lib/avatarStore';
import { resolvePublicAssetPath } from '../../lib/resolveAssetPath';
import type { AvatarSettings, RegionProgress } from '../../types';

interface AvatarRendererProps {
  avatarName: string;
  avatar: AvatarSettings;
  regionProgress?: RegionProgress[];
  mode: AvatarRenderMode;
  className?: string;
  ariaLabel?: string;
}

type LayerState = 'loaded' | 'failed';

interface LayerLoadStateValue {
  candidateIndex: number;
  state?: LayerState;
}

type LayerLoadState = Record<string, LayerLoadStateValue>;

function layerKey(layer: AvatarLayer, mode: AvatarRenderMode): string {
  return `${mode}:${layer.slot}:${layer.item.id}`;
}

function crestPath(crest: AvatarSettings['crest']): string {
  if (crest === 'bolt') return 'M144 76 120 139h19l-9 49 32-67h-22Z';
  if (crest === 'compass') return 'M140 72 158 128l-18 56-18-56Z';
  if (crest === 'orb') return 'M140 94a18 18 0 1 1 0 36 18 18 0 0 1 0-36Z';
  return 'M140 68l7 20h22l-18 13 7 21-18-13-18 13 7-21-18-13h22Z';
}

function FallbackLayer({ layer, avatar, mode }: { layer: AvatarLayer; avatar: AvatarSettings; mode: AvatarRenderMode }) {
  const className = `avatar-fallback-layer fallback-${layer.slot} avatar-fallback-${mode} rarity-${layer.item.rarity} item-${layer.item.id}`;
  const slot = layer.slot;

  return (
    <svg
      className={className}
      data-avatar-fallback-slot={slot}
      data-avatar-fallback-mode={mode}
      viewBox="0 0 280 320"
      aria-hidden="true"
    >
      {slot === 'aura' ? (
        <g className="preview-aura">
          <ellipse cx="140" cy="178" rx="90" ry="118" />
          <ellipse cx="140" cy="178" rx="116" ry="56" />
        </g>
      ) : null}
      {slot === 'companion' ? (
        <g className="preview-companion">
          <circle cx="218" cy="238" r="18" />
          <path d="M209 237h18m-12-10 12 10-12 10" />
        </g>
      ) : null}
      {slot === 'base' ? (
        <g>
          <ellipse className="preview-shadow" cx="140" cy="278" rx="64" ry="12" />
          <path className="preview-neck" d="M122 148h36v36c-11 10-25 10-36 0Z" />
          <circle className="preview-face" cx="140" cy="119" r="43" />
        </g>
      ) : null}
      {slot === 'cloak' ? (
        <path className="preview-cloak" d="M77 264c7-82 27-124 63-124s56 42 63 124c-32 15-93 15-126 0Z" />
      ) : null}
      {slot === 'outfit' ? (
        <g>
          <path className="preview-outfit" d="M88 256c8-55 25-82 52-82s44 27 52 82c-29 13-75 13-104 0Z" />
          <path className={`preview-crest crest-${avatar.crest}`} d={crestPath(avatar.crest)} />
        </g>
      ) : null}
      {slot === 'face' ? (
        <g>
          <path className="preview-eyes" d="M119 119h11m22 0h11" />
          <path className="preview-mouth" d="M128 142c8 7 18 7 26 0" />
        </g>
      ) : null}
      {slot === 'hair' ? (
        <path className="preview-hair" d="M98 115c-2-39 22-63 51-60 24 2 41 18 43 46-16-19-48-25-94 14Z" />
      ) : null}
      {slot === 'accessory' ? (
        <g className="preview-accessory">
          <circle cx="167" cy="194" r="12" />
          <path d="M167 182v24m-12-12h24" />
        </g>
      ) : null}
      {slot === 'frame' ? (
        <g className="preview-frame">
          <path d="M42 42h196v236H42z" />
          <path d="M58 58h164v204H58z" />
        </g>
      ) : null}
    </svg>
  );
}

function labelForMode(avatarName: string, mode: AvatarRenderMode): string {
  if (mode === 'builder') return `${avatarName} academy character`;
  if (mode === 'map') return `${avatarName} map avatar`;
  if (mode === 'region') return `${avatarName} region cameo`;
  return `${avatarName} avatar portrait`;
}

function shouldShowFallback(layer: AvatarLayer, src: string, loadState: LayerLoadState, mode: AvatarRenderMode): boolean {
  return !src || loadState[layerKey(layer, mode)]?.state !== 'loaded';
}

export function AvatarRenderer({ avatarName, avatar, regionProgress, mode, className, ariaLabel }: AvatarRendererProps) {
  const normalized = normalizeAvatarSettings(avatar, regionProgress);
  const allowedSlots = new Set(avatarSlotsForRenderMode(mode));
  const layers = getAvatarLayers(normalized, regionProgress)
    .filter((layer) => allowedSlots.has(layer.slot) && !layer.item.isEmpty);
  const [loadState, setLoadState] = useState<LayerLoadState>({});
  const rootClassName = mode === 'builder'
    ? `builder-avatar-stage avatar-preview-${normalized.palette}${className ? ` ${className}` : ''}`
    : `avatar-renderer avatar-renderer-${mode} avatar-preview-${normalized.palette}${className ? ` ${className}` : ''}`;
  const stackClassName = mode === 'builder'
    ? 'builder-avatar-stack'
    : `avatar-renderer-stack avatar-renderer-stack-${mode}`;

  function markLayerLoaded(layer: AvatarLayer) {
    setLoadState((current) => ({
      ...current,
      [layerKey(layer, mode)]: {
        candidateIndex: current[layerKey(layer, mode)]?.candidateIndex ?? 0,
        state: 'loaded',
      },
    }));
  }

  function markLayerFailed(layer: AvatarLayer, candidateCount: number) {
    setLoadState((current) => {
      const key = layerKey(layer, mode);
      const currentIndex = current[key]?.candidateIndex ?? 0;
      if (currentIndex < candidateCount - 1) {
        return {
          ...current,
          [key]: {
            candidateIndex: currentIndex + 1,
          },
        };
      }
      return {
        ...current,
        [key]: {
          candidateIndex: currentIndex,
          state: 'failed',
        },
      };
    });
  }

  return (
    <div
      className={rootClassName}
      aria-label={mode === 'builder' ? `${avatarName} avatar preview` : undefined}
      data-avatar-render-mode={mode}
    >
      {mode === 'builder' ? <div className="avatar-stage-glow" aria-hidden="true" /> : null}
      <div className={stackClassName} role="img" aria-label={ariaLabel ?? labelForMode(avatarName, mode)}>
        {layers.map((layer) => {
          const key = layerKey(layer, mode);
          const candidates = avatarLayerAssetCandidates(layer.item, mode);
          const candidateIndex = loadState[key]?.candidateIndex ?? 0;
          const src = resolvePublicAssetPath(candidates[candidateIndex]);
          const isLoaded = loadState[key]?.state === 'loaded';
          const needsFallback = shouldShowFallback(layer, src, loadState, mode);

          return (
            <div
              key={key}
              className={`avatar-layer avatar-layer-${layer.slot} ${needsFallback ? 'uses-fallback' : 'uses-asset'}`}
              data-avatar-slot={layer.slot}
              data-avatar-item={layer.item.id}
              data-avatar-layer-order={layer.order}
            >
              {needsFallback ? <FallbackLayer layer={layer} avatar={normalized} mode={mode} /> : null}
              {src ? (
                <img
                  key={`${key}:${candidateIndex}`}
                  src={src}
                  alt=""
                  aria-hidden="true"
                  data-avatar-asset-slot={layer.slot}
                  data-avatar-asset-mode={mode}
                  data-avatar-asset-candidate={candidateIndex}
                  className={isLoaded ? 'is-loaded' : 'is-pending'}
                  onLoad={() => markLayerLoaded(layer)}
                  onError={() => markLayerFailed(layer, candidates.length)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {mode === 'builder' ? (
        <span className="avatar-layer-contract-note" aria-hidden="true">
          {layers.map((layer) => `${AVATAR_SLOT_LABELS[layer.slot]}: ${layer.item.displayName}`).join(' / ')}
        </span>
      ) : null}
    </div>
  );
}
