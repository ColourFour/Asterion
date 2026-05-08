import type { AvatarLocation } from '../../lib/avatarLocation';
import type { AvatarSettings, RegionProgress } from '../../types';
import { AvatarRenderer } from './AvatarRenderer';

interface RegionAvatarCameoProps {
  avatarName: string;
  avatar: AvatarSettings;
  regionProgress: RegionProgress[];
  location: AvatarLocation;
}

function stationLabel(source: AvatarLocation['source']): string {
  if (source === 'selected') return 'Region focus';
  if (source === 'adaptive-question') return 'Question focus';
  if (source === 'recommended') return 'Recommended focus';
  return 'Open wing';
}

export function RegionAvatarCameo({ avatarName, avatar, regionProgress, location }: RegionAvatarCameoProps) {
  if (!location.region || !location.regionProgress) return null;

  const rank = location.regionProgress.rank;

  return (
    <aside
      className={`region-avatar-cameo region-${location.region.id} rank-${rank.toLowerCase()}`}
      aria-label={`${avatarName} in ${location.region.name}. ${rank} rank.`}
    >
      <div className="region-cameo-scene" aria-hidden="true">
        <span className="region-cameo-station" />
        <span className="region-cameo-crystal" />
        <AvatarRenderer avatarName={avatarName} avatar={avatar} regionProgress={regionProgress} mode="region" />
      </div>
      <div className="region-cameo-copy">
        <span>{stationLabel(location.source)}</span>
        <strong>{location.region.name}</strong>
      </div>
    </aside>
  );
}
