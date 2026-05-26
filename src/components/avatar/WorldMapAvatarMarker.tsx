import type { CSSProperties } from 'react';
import type { AvatarLocation } from '../../lib/avatarLocation';
import type { AvatarSettings, RegionProgress } from '../../types';
import { AvatarRenderer } from './AvatarRenderer';

interface AvatarMapSlot {
  x: number;
  y: number;
  priority: 'daily' | 'relevant' | 'neutral' | 'quiet';
  zIndex: number;
  avatarOffset?: {
    x: number;
    y: number;
  };
}

interface WorldMapAvatarMarkerProps {
  avatarName: string;
  avatar: AvatarSettings;
  regionProgress: RegionProgress[];
  location: AvatarLocation;
  slot?: AvatarMapSlot;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rankBadge(rank: string): string {
  return {
    Dormant: 'D',
    Discovered: 'N',
    Bronze: 'B',
    Silver: 'S',
    Gold: 'G',
    Mastered: 'M',
  }[rank] ?? 'P3';
}

function markerOffset(slot: AvatarMapSlot, source: AvatarLocation['source']) {
  if (slot.avatarOffset) return slot.avatarOffset;
  if (source === 'selected') return { x: -8, y: 16 };
  if (slot.priority === 'daily') return { x: -8, y: 17 };
  if (slot.priority === 'quiet') return { x: 10, y: -12 };
  return { x: 9, y: 14 };
}

export function WorldMapAvatarMarker({
  avatarName,
  avatar,
  regionProgress,
  location,
  slot,
}: WorldMapAvatarMarkerProps) {
  if (!location.region || !location.regionProgress || !slot) return null;

  const offset = markerOffset(slot, location.source);
  const x = clamp(slot.x + offset.x, 6, 94);
  const y = clamp(slot.y + offset.y, 8, 92);
  const rank = location.regionProgress.rank;
  const cardSideClass = x > 72 ? 'card-left' : 'card-right';
  const cardVerticalClass = y > 72 ? 'card-above' : 'card-middle';

  return (
    <aside
      className={`world-map-avatar-marker marker-${location.source} rank-${rank.toLowerCase()} ${cardSideClass} ${cardVerticalClass}`}
      style={{
        '--avatar-marker-x': `${x}%`,
        '--avatar-marker-y': `${y}%`,
        '--avatar-marker-z': slot.zIndex + 2,
      } as CSSProperties}
      aria-label={`${location.label}: ${location.region.name}`}
    >
      <div className="avatar-marker-visual" aria-hidden="true">
        <span className="avatar-marker-ring" aria-hidden="true" />
        <AvatarRenderer avatarName={avatarName} avatar={avatar} regionProgress={regionProgress} mode="map" />
        <span className="avatar-marker-badge" aria-hidden="true">{rankBadge(rank)}</span>
        <span className="avatar-marker-card">
          <small>{location.label}</small>
          <strong>Continue here</strong>
          <span>{location.region.name}</span>
        </span>
      </div>
    </aside>
  );
}
